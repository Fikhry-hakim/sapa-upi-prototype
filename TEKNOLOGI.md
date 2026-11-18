# SAPA UPI — Teknologi & Source Code

Konteks teknis **SAPA UPI**, asisten informasi akademik untuk Program Studi Bisnis Digital, Universitas Pendidikan Indonesia (UPI Kampus Tasikmalaya).

Dokumen ini memisahkan dengan tegas **apa yang sudah jalan dan bisa diverifikasi** dari **apa yang belum ditentukan**, supaya tidak ada yang dianggap selesai padahal belum.

Per 18 November 2026.

---

## 1. Ringkasan

Pengguna masuk dengan akun Google UPI, lalu bertanya dengan bahasa sehari-hari. Sistem mencari rujukan yang relevan dari knowledge base, dan model bahasa menyusun jawaban **yang dibatasi hanya pada rujukan itu** dan menyebut sumbernya. Kalau tidak ada rujukan yang cocok, sistem mengakui belum menemukan informasinya dan menampilkan kontak umum prodi, bukan menebak.

Beberapa jenis pertanyaan tidak melewati model sama sekali:

- **Permintaan berkas** ("ada file kalender akademik ga") dan **pertanyaan daftar dokumen** ("dokumen apa saja yang ada") dijawab dari katalog dokumen dengan kartu berkas.
- **Jawaban kurasi cadangan**: kalau Gemini gagal atau lambat, Worker membalas 502 dan browser menampilkan jawaban dari knowledge base, ditandai "Jawaban cadangan • AI sedang tidak tersedia".

Selain chat, ada **halaman pengelola** (Dashboard, Metrics, Knowledge Base, Upload) untuk TPTA dan TU: mengunggah dengan isian otomatis dan pratinjau, memvalidasi dokumen, memantau analitik, dan mengekspor laporan. Akses diperiksa oleh Worker pada setiap permintaan, bukan oleh browser.

| | Alamat |
|---|---|
| **Aplikasi (frontend)** | https://fikhry-hakim.github.io/sapa-upi-prototype/ |
| **API (backend)** | https://sapa-upi-api.sapa-upi.workers.dev |
| **Repositori** | https://github.com/Fikhry-hakim/sapa-upi-prototype (publik) |

---

## 2. Arsitektur

```text
 Browser (pengguna @upi.edu, atau admin TPTA/TU)
   │  JavaScript ES modules, tanpa build — GitHub Pages
   │
   │  HTTPS + JSON (token sesi di header Authorization)
   ▼
 Cloudflare Worker "sapa-upi-api"
   ├─ Katalog dokumen — permintaan berkas dan daftar dokumen, tanpa model (lib/doc-request.js)
   ├─ Retrieval       — IDF + stemming + glosarium (lib/search.js)
   ├─ Gemini API      — model utama, dibatasi konteks hasil retrieval, panggilan kedua bila lambat
   ├─ Cache jawaban   — D1, 12 jam, untuk pertanyaan mandiri yang sama
   ├─ Google OIDC     — login dengan akun @upi.edu (PKCE)
   ├─ Cloudflare D1   — akun, sesi, riwayat, dokumen, analitik, audit, tautan bagikan, cache
   ├─ Cloudflare KV   — berkas PDF yang diunggah admin (maks. 24 MB)
   └─ Workers AI      — Whisper untuk dikte suara; model cadangan jawaban tersedia tetapi mati
   ▼
 { answer, entry, citations (utama + terkait), followUps }
   → browser membuka PDF atau DOCX di halaman rujukan dan menyorot kalimatnya
```

Kalau Worker tidak terjangkau, browser menjawab dari pencocokan kata kunci lokal pada salinan knowledge base yang ikut dimuat.

---

## 3. Bahasa pemrograman & framework

| Komponen | Teknologi | Versi |
|---|---|---|
| Frontend | **JavaScript (ES Modules)**, HTML, CSS | — |
| Backend | **JavaScript** di Cloudflare Workers runtime | — |
| Runtime pengembangan | **Node.js** (CI memakai 22) | — |
| Tooling deploy | **Wrangler** (CLI Cloudflare) | 4.x |
| Pembaca PDF | **PDF.js** dari cdnjs, dimuat hanya saat dibutuhkan, dengan Subresource Integrity | 3.11.174 |
| Pembaca DOCX | Pembaca zip dan XML buatan sendiri (`lib/docx-preview.js`, `DecompressionStream`) | — |
| Font | **Plus Jakarta Sans** (file lokal di `assets/fonts`) | — |

**Tidak memakai framework** — tanpa React, Vue, atau sejenisnya. Tanpa bundler, tanpa langkah build, tanpa transpiler.

**Dependensi runtime: nol.** `package.json` tidak punya `dependencies` maupun `devDependencies`; pengujian memakai `node:test` bawaan Node. Pembuat berkas `.xlsx` dan pembaca DOCX ditulis sendiri tanpa pustaka.

Pilihan ini disengaja, tetapi ukurannya sudah di batas atas untuk "tanpa framework": `app.js` sekitar 2.900 baris, `owner.js` 1.900, `settings.js` 850, `viewer.js` 640, murni JavaScript tanpa tipe (lihat bagian 11).

**Content-Security-Policy** di `index.html` membatasi skrip ke situs sendiri dan cdnjs, gambar ke situs sendiri, `data:` dan `blob:`. Teks dari dokumen dan model selalu dirender sebagai teks (`textContent`), tidak sebagai HTML.

---

## 4. Database

**Cloudflare D1** (SQLite terkelola), nama database `sapa-upi-kb`. **18 tabel**, ditambah satu tabel virtual FTS5 (`passages`).

| Kelompok | Tabel | Isi |
|---|---|---|
| Pengetahuan kurasi | `entries`, `entry_lists` | Topik, jawaban, metadata sumber, kontak, pertanyaan contoh, kata kunci |
| Akun | `users`, `sessions`, `auth_states`, `credentials`, `login_failures` | Akun Google, hash token sesi, state OAuth sekali pakai, hash kata sandi (PBKDF2), percobaan gagal |
| Peran | `staff_roles` | Satu-satunya sumber hak akses admin (email → peran) |
| Riwayat | `conversations`, `messages` | Riwayat chat, termasuk waktu arsip; hanya terbaca pemiliknya |
| Berbagi | `shares` | Potret chat yang dibagikan, di bawah token acak 128 bit yang bisa dicabut |
| Berkas dicari | `seen_documents` | Id dokumen yang pernah dicari tiap akun (tanpa isi pertanyaan) |
| Dokumen unggahan | `documents`, `passages` (FTS5) | Metadata dan status validasi, teks per halaman |
| Analitik | `events`, `feedback`, `audit_log` | Hasil jawaban (dengan teks pertanyaan bila Improve aktif, tanpa identitas), penilaian singkat, log setiap perubahan admin |
| Performa dan pengaman | `answer_cache`, `rate_limits` | Cache jawaban 12 jam, penghitung pembatasan laju |

Skema dasar: [`worker/schema.sql`](worker/schema.sql), [`schema-auth.sql`](worker/schema-auth.sql), [`schema-owner.sql`](worker/schema-owner.sql). Migrasi untuk basis data yang sudah ada: `schema-password`, `-upload-fields`, `-hardening`, `-feedback`, `-idle-session`, `-category-merge`, `-archive`, `-share`, `-cache`, `-seen`, `-question` — dijalankan manual dengan `wrangler d1 execute ... --file`, selalu **sebelum** deploy Worker yang memakainya.

Keputusan desain yang masih berlaku:

- **Metadata sumber disimpan sebagai kolom, bukan prosa.** Sitasi dirender dari data, jadi tidak bisa dikarang model.
- **Analitik tanpa identitas.** `events` tidak menyimpan siapa yang bertanya. Teks pertanyaan dicatat **hanya bila pengguna mengaktifkan "Improve SAPA UPI"** (aktif secara baku): dirapikan, dipotong 200 karakter, email dan angka panjang (NIM, telepon) disamarkan, dan klik-angka tidak dicatat. Kalau pengguna mematikannya, interaksinya tidak dicatat sama sekali. Riwayat chat terpisah dan tidak ada jalur bagi admin untuk membacanya.
- **Tautan bagikan menyimpan potret**, bukan rujukan ke chat hidup: pesan yang ditambahkan sesudahnya, nama, dan email pemilik tidak ikut.

Menambah topik kurasi tidak perlu deploy: cukup `INSERT`. `data/knowledge-base.js` adalah benih sekaligus cadangan offline; `worker/seed.mjs` mengubahnya menjadi SQL (menimpa entri dengan id yang sama).

---

## 5. Model AI / API

| | |
|---|---|
| Penyedia utama | **Google Gemini** (Gemini Developer API, Interactions API) |
| Model | `gemini-3.5-flash-lite`, `thinking_level: "low"`, `seed` tetap |
| Model Gemini kedua (opsional) | `GEMINI_FALLBACK_MODEL`, kosong secara baku |
| Dikte suara | Cloudflare Workers AI, `@cf/openai/whisper-large-v3-turbo` |
| Isian otomatis unggah dokumen | Gemini yang sama, satu panggilan per berkas, hanya teks 3 halaman awal |
| Cadangan jawaban | Workers AI `@cf/meta/llama-3.1-8b-instruct-fp8`, **mati** (`AI_FALLBACK_ENABLED = "false"`) |
| Autentikasi Gemini | Header `x-goog-api-key`, **secret** di Worker |

API key tidak pernah dikirim ke browser dan tidak pernah masuk ke repositori.

### Anggaran waktu per pertanyaan

Satu permintaan `/ask` punya batas total **20 detik**; browser menunggu 24 detik:

1. Gemini diberi sampai **16 detik** (percobaan tunggal paling lama 18 detik). Timeout, galat 5xx, atau "location is not supported" dicoba ulang dalam anggarannya.
2. **Hedging**: kalau belum menjawab dalam **6 detik**, Worker mengirim permintaan kedua bersamanya dan memakai yang selesai lebih dulu. Kuota tambahan hanya terpakai pada kasus lambat.
3. Pertanyaan mandiri yang sama dengan kutipan yang sama disajikan dari **cache D1** selama 12 jam (balasan cepat, tanpa memanggil model).
4. Kalau semuanya gagal, Worker membalas 502 dan browser menampilkan jawaban kurasi dari knowledge base.

Prompt hanya memuat bagian glosarium yang disebut pertanyaan dan kutipan, bukan seluruh glosarium. Pada uji langsung 12 pertanyaan berhasil seluruhnya dengan waktu 4–8 detik.

### Cara jawaban dijaga supaya tidak mengarang

1. **Retrieval dulu, baru generate.** Maksimal 3 topik paling relevan dikirim sebagai konteks.
2. **Instruksi sistem ketat** ([`worker/src/gemini.js`](worker/src/gemini.js)): dilarang menjawab di luar konteks, dilarang mengarang angka, tanggal, atau nomor SK, dilarang menebak kepanjangan singkatan, dan wajib mengakui informasi yang tidak ada. Kerangka jawaban dibakukan: kalimat langsung, rincian, penutup opsional.
3. **Sumber dan kontak dari data.** Kartu sumber, tabel, dan kontak dirender dari knowledge base. Jawaban "belum menemukan" tidak menampilkan kartu sumber topik yang tadi salah cocok.
4. **Kontak saat tidak bisa menjawab** hanya Tenaga Administrasi Program Studi atau sumber resmi UPI, dan kontak topik diarahkan ke staf prodi atau TPTA, tidak ke dosen tertentu (dijaga satu tes).

### Batas yang nyata

- **Gemini kadang lambat atau menolak dari sisi Google**, bukan dari kode kita. Dikurangi hedging, anggaran waktu, dan cache; tidak dihilangkan.
- **Pembatasan laju**: `/ask` 20 permintaan per menit per klien (hash IP), `/conversations/record` 30 per menit per akun, saran isian unggah 12 per menit per akun, dikte 10 per menit, ditambah gerbang banjir `FLOOD_GATE` 600 per menit per klien sebelum menyentuh D1.
- **Billing Gemini (Tier 1) belum diaktifkan.** Keputusan ini belum diambil.

---

## 6. Retrieval dan sumber

Belum memakai *embedding* atau vector database. Yang dipakai adalah skoring kata kunci buatan sendiri di [`lib/search.js`](lib/search.js):

- **IDF** — kata yang ada di banyak topik berbobot kecil.
- **Satu hitungan per field**, **istilah majemuk** ("tugas akhir" satu konsep), dan **stemming** imbuhan Indonesia.
- **Glosarium** ([`lib/glossary.js`](lib/glossary.js)) — menambahkan singkatan atau kepanjangannya ke pencarian (TPTA, SKPI, SIMKATMAWA, SSO, CPL, ...), dan dikirim ke Gemini sebagai referensi istilah, hanya bagian yang relevan.
- **Cakupan pertanyaan** — topik yang menjawab seluruh pertanyaan menang atas yang hanya cocok di satu kata; kalau beberapa topik sama kuat (rasio 0,8), pembaca diminta memilih. **Keterbatasan yang diketahui:** rumus ini menghukum pertanyaan berisi banyak kata yang tidak dikenali korpus; ada tes yang mengunci perilaku itu.
- **Percakapan nyambung** ([`lib/followup.js`](lib/followup.js)) — pertanyaan lanjutan ("kalau telat gimana?") dicari bersama giliran sebelumnya; pertanyaan yang jelas topiknya dicari sendiri.
- **Klik angka** — penjelasan satu kalimat dicari lewat isi kalimat itu, dengan topik jawaban yang sedang dibaca didahulukan.
- **Dokumen terkait** ([`lib/source-set.js`](lib/source-set.js)) — di samping sumber utama, hingga 2 dokumen lain yang skornya dekat atau sepokok ditampilkan sebagai "Dokumen terkait"; kata umum (kriteria, syarat, penilaian) tidak cukup untuk dianggap sepokok.
- **Dokumen unggahan** — kalau topik kurasi tidak ketemu, Worker mencari halaman dokumen yang sudah divalidasi lewat FTS5.

Isi knowledge base: **87 topik kurasi**, **33 dokumen** (18 resmi berformat PDF, 15 template formulir: 14 DOCX dan 1 PDF), 67 istilah glosarium. Katalog dan halaman kutipan: `data/sources.js`.

Ini cukup untuk knowledge base kecil yang kata kuncinya dikurasi manual. **Tidak akan cukup untuk ratusan halaman PDF** — lihat bagian 11.

---

## 7. Autentikasi, peran & privasi

- **Gerbang masuk**: tanpa akun, aplikasi hanya menampilkan layar masuk Google (`LOGIN_REQUIRED` di `app.js`). Pengecualian: tautan bagikan hanya-baca (`#share=...`), dan kalau server tidak terjangkau gerbangnya tidak dipasang supaya tidak ada yang terkunci. **Gerbang ini hanya di sisi browser**; endpoint tanya di Worker masih bisa dipanggil langsung tanpa token.
- **Login Google @upi.edu** (PKCE; subdomain ikut diizinkan). Akun di luar domain ditolak dengan pesan khusus.
- **Email + kata sandi**: rute di Worker dan pengaturan kata sandi di Settings masih ada, tetapi formulirnya **disembunyikan** dari layar masuk untuk sementara. Kata sandi hanya bisa dipasang oleh akun yang pernah masuk dengan Google, supaya tidak ada yang mendaftar atas nama email `@upi.edu` orang lain. Disimpan sebagai PBKDF2 dengan garam acak.
- **Sesi**: bisa dilihat dan dicabut per perangkat di Settings; sesi pengelola berakhir otomatis bila tidak aktif; mengganti kata sandi mencabut sesi lain.
- **Peran admin** (`upload`, `review`, `admin`) dibaca dari `staff_roles` pada setiap permintaan, tidak pernah dari browser. Diberikan manual lewat `wrangler d1 execute`. Hanya `upload` dan `admin` yang boleh mengunggah.
- **Siapa melihat apa**: pengelola melihat semua berkas dan punya tombol **+** untuk membatasi pertanyaan pada satu dokumen; pengguna biasa hanya melihat berkas yang pernah mereka cari (disimpan per akun di `seen_documents`; daftar lokal dihapus saat keluar supaya komputer bersama tidak bocor).
- **Pengaman lain**: `redirect_to` login dibatasi ke situs sendiri, penguncian login dihitung per pasangan email+klien, dan token bagikan diberi batas laju.

---

## 8. Fitur antarmuka

**Chat dan sumber**
- Jawaban dengan kartu sumber yang membuka PDF di halaman kutipan dengan kalimat disorot, dan "Dokumen terkait".
- Nomor penjelasan per kalimat hanya untuk jawaban panjang (≥ 5 kalimat yang layak dijelaskan; kalimat yang hanya berisi tautan tidak diberi nomor).
- Tombol salin di setiap jawaban; salin dan ubah di setiap pertanyaan sendiri.
- Tautan di jawaban (termasuk `bit.ly`) bisa langsung diklik.
- Penampil dokumen: PDF (PDF.js) dan DOCX (pembaca buatan sendiri, lengkap dengan kop dan logo), mode gulir dan halaman, zoom, unduh.

**Berkas dan template**
- Meminta berkas lewat chat membuka dokumen dari halaman 1 tanpa sorotan, dengan tombol unduh. 15 template formulir (SEM-1 sampai SEM-10 dan lainnya) punya entri kurasi sendiri.
- Halaman **Berkas** menampilkan yang sudah dicari saja (pengelola: semua); label DOCX berwarna biru, PDF merah.

**Riwayat, berbagi, Settings**
- Riwayat percakapan: cari (tidak termasuk yang diarsipkan), arsip per chat atau semua, hapus, ekspor.
- **Bagikan chat**: dialog dengan akses dan tautan hanya-baca, halaman baca yang terbuka tanpa login, daftar tautan dan pencabutan di Settings.
- **Settings** (8 tab, sebagian disembunyikan): Umum (bahasa), Profil, Keamanan dan login (sesi aktif), Chat diarsipkan, Suara (dikte), Keyboard (pintasan yang bisa diubah dan dicocokkan, lengkap pencegahan bentrok), Kontrol data. Teks Settings mengikuti bahasa pilihan.
- Bahasa: **Indonesia bawaan**, English tersedia; terjemahan lewat kamus per halaman (`lib/i18n.js`, `lib/settings-id.js`).
- Responsif dari ponsel sampai layar lebar, mode terang dan gelap, sidebar yang bisa dilipat.

**Dikte suara**: dikte bawaan browser bila ada; kalau tidak, audio WAV dikirim ke Worker, diterjemahkan Whisper, dan langsung dibuang (tidak disimpan atau dicatat).

---

## 9. Halaman pengelola

Satu modul [`owner.js`](owner.js); akses diatur lewat peran di `staff_roles`.

- **Dashboard**: kartu KPI, grafik analitik (tren, distribusi hasil, status dokumen, topik, gangguan teknis, kepuasan), log interaksi dengan filter jenis respons dan kategori (filter dan halaman tidak melempar layar ke atas), ekspor **Excel** (`.xlsx` dengan grafik asli; kolom Waktu berisi **timestamp** Excel jam WIB dengan format `yyyy-mm-dd hh:mm:ss` dan lembar Aktivitas punya tombol filter; dibangun tanpa pustaka di [`lib/xlsx.js`](lib/xlsx.js) dan [`lib/report.js`](lib/report.js)), **CSV** rekap agregat, dan **PDF** lewat dialog cetak.
- **Metrics**: tabel 10 KPI sesuai Lampiran A (Tabel A.6). KPI yang butuh penilaian manusia tampil "belum dievaluasi", bukan angka rekaan.
- **Knowledge Base**: daftar dokumen, filter, sakelar RAG, validasi, proses ulang, tandai tidak berlaku, hapus, log audit.
- **Upload dokumen** — alurnya:
  1. Pilih PDF. Teks dibaca di browser (PDF.js).
  2. Worker (`POST /admin/documents/suggest`) meminta Gemini mengisi nama, kategori, penerbit, nomor surat, tanggal berlaku, periode, dan deskripsi dari teks 3 halaman awal. Yang tidak ada di dokumen dibiarkan kosong; kategori di luar daftar atau tanggal tak sah dikosongkan; isian yang sudah diubah pengelola tidak ditimpa. Isian AI ditandai.
  3. **Pratinjau wajib**: halaman 1 sebagai gambar, semua isian, cuplikan isi, dan metode penyimpanan.
  4. "Upload & kirim ke validasi" mengirim ke `POST /admin/documents`, lalu berkas ke `PUT /admin/documents/:id/file` (Cloudflare KV). Dokumen berstatus *Menunggu Validasi* dan tidak dipakai menjawab sampai divalidasi.
  Tiga metode: **Dokumen Baru**, **Gabungkan Terkait**, **Perbarui Versi** (versi lama otomatis Tidak Berlaku saat versi baru divalidasi).
- **Penilaian jawaban**: tombol Kurang/Cukup/Baik di bawah jawaban, anonim, masuk kartu Kepuasan Pengguna.

---

## 10. Hosting, deployment, CI & pengujian

| Bagian | Platform | Cara deploy |
|---|---|---|
| Frontend | **GitHub Pages** | Otomatis saat push ke `main` |
| Backend | **Cloudflare Workers** | `npx wrangler deploy`, atau otomatis lewat CI |
| Database | **Cloudflare D1** | `npx wrangler d1 execute ... --file` (manual, tanpa sistem migrasi berurutan) |
| Berkas unggahan | **Cloudflare KV** | R2 masih kandidat, belum diaktifkan |

Keduanya pada tier gratis.

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): setiap push dan pull request menjalankan seluruh tes. Push ke `main` yang lulus men-deploy Worker otomatis, **kecuali** mengubah `worker/schema*.sql` (deploy dilewati dengan peringatan; migrasi dijalankan manual lebih dulu) atau secret Cloudflare belum dipasang.

**Pengujian**: **328 pengujian**, seluruhnya lulus (`npm test`, `node --test`, tanpa framework pihak ketiga). Mencakup skoring retrieval dan glosarium, penyusunan prompt dan parsing respons Gemini beserta hedging dan anggaran waktu, cache jawaban, pembuat `.xlsx` (termasuk timestamp dan filter), pembaca DOCX, permintaan berkas dan katalog, sumber terkait, isian otomatis unggah, tautan bagikan, berkas yang sudah dicari, pembatasan laju dan penguncian login, hash kata sandi, dan struktur halaman. Beberapa tes mengunci keputusan produk: gagal bila ada tombol tanpa perilaku, bila identitas mahasiswa palsu muncul, bila KPI yang butuh evaluasi manusia menampilkan angka, bila kontak saat tidak bisa menjawab menunjuk ke dosen, atau bila fungsi global tertimpa variabel lokal.

---

## 11. Yang BELUM ditentukan atau belum ada

Bagian ini sama pentingnya dengan yang di atas. Jangan dianggap sudah selesai:

| Hal | Status |
|---|---|
| **Pencarian semantik (embedding)** | Belum ada. Diperlukan begitu dokumen bertambah banyak. Kandidat: Cloudflare Vectorize. |
| **Penguncian di sisi Worker** | Gerbang login hanya di browser; `/ask` masih bisa dipanggil langsung tanpa token. Perlu pemeriksaan token di Worker kalau ingin benar-benar tertutup. |
| **Notifikasi email** | Belum ada penyedia email; tab Notifications di Settings disembunyikan. |
| **Formulir login manual** | Disembunyikan sementara; hanya Google yang tersedia di layar masuk. |
| **Penyimpanan berkas (R2)** | Belum diaktifkan (perlu kartu pembayaran untuk mulai). Sekarang memakai KV, cukup untuk berkas ≤24 MB. |
| **Daftar putih akun resmi** | Siapa pun dengan email `@upi.edu` (atau subdomainnya) bisa masuk. Daftar NIM/dosen terdaftar belum ada. |
| **Antarmuka pemberian peran admin** | Peran diberikan lewat `wrangler d1 execute` manual. |
| **OCR dan pembaca PPTX** | Hanya PDF yang bisa diunggah; berkas pindai tanpa teks harus diisi manual. DOCX hanya untuk template bawaan. |
| **Integrasi SIAKAD** | Tidak ada, dan tidak disimulasikan — keputusan sengaja. |
| **Kumpulan soal uji (golden set)** | Belum ada; diperlukan untuk mengisi KPI kesesuaian jawaban dan ketepatan referensi. |
| **Lingkungan staging** | Belum ada. Satu Worker dan satu database, langsung produksi. |
| **Migrasi database berurutan** | Belum ada; urutan skema dijaga manual lewat daftar di README. |
| **Framework frontend** | Sengaja tidak dipakai; `app.js` dan `owner.js` mulai besar tanpa tipe. |
| **Billing Gemini (Tier 1)** | Belum diaktifkan. |
| **Domain sendiri di bawah upi.edu** | Belum ada (butuh izin TI kampus). Dengan domain yang sama untuk frontend dan API, sesi bisa memakai cookie HttpOnly, bukan token di `localStorage`. |

---

## 12. Batasan yang harus disebutkan

- Knowledge base kurasi memuat kutipan dari dokumen resmi yang tercantum di `data/sources.js`. Topik di luar dokumen itu dijawab "belum menemukan", bukan ditebak.
- Jawaban **belum melalui peninjauan tenaga akademik** dan tidak bisa dijadikan dasar keputusan resmi. Keputusan resmi tetap pada program studi.
- Kalau dua dokumen menyebut ketentuan berbeda (misalnya batas uji similaritas), asisten menyampaikan keduanya beserta dokumen asal dan tanggalnya, dan menandai yang terbaru sebagai yang berlaku.
- Dokumen yang diunggah admin **belum melalui peninjauan tenaga akademik**: validasi admin memastikan teksnya terbaca dan dokumennya sah, bukan memeriksa kebenaran isinya. Isian otomatis AI hanya usulan untuk formulir dan wajib diperiksa di pratinjau.
- Topik kurasi dan kontaknya ada di dua tempat (`data/knowledge-base.js` dan D1). Mengubah salah satunya tidak mengubah yang lain sampai seed dijalankan.

---

## 13. Struktur repositori

```text
.
├── index.html, style.css      # kerangka dan gaya
├── app.js                     # antarmuka pengguna (~2.900 baris)
├── owner.js                   # halaman pengelola (~1.900 baris)
├── settings.js                # halaman Settings (~850 baris)
├── viewer.js                  # pembaca PDF dan DOCX di panel samping
├── config.js, theme-init.js   # alamat Worker, tema awal tanpa kilas
├── data/
│   ├── knowledge-base.js      # 87 topik kurasi + cadangan offline browser
│   └── sources.js             # katalog 33 dokumen + halaman rujukan tiap topik
├── dokumen/                   # 18 PDF resmi; dokumen/template/ berisi 15 template formulir
├── assets/                    # maskot, ikon, font, sampul dokumen
├── lib/                       # kode murni dipakai browser dan Worker
│   ├── search.js, glossary.js, followup.js, en-terms.js   # retrieval dan istilah
│   ├── source-set.js, doc-request.js, clarify.js          # sumber, berkas, nomor penjelasan
│   ├── chat-engine.js, suggest.js                         # jawaban cadangan dan saran
│   ├── docx-preview.js                                    # pembaca DOCX
│   ├── i18n.js, i18n-owner.js, settings-id.js, settings-prefs.js
│   └── charts.js, report.js, xlsx.js, versions.js, recorder.js
├── worker/
│   ├── wrangler.toml          # konfigurasi dan binding (D1, KV, Workers AI, rate limit)
│   ├── schema*.sql            # skema dasar dan migrasi
│   ├── seed*.mjs              # knowledge-base.js / sources.js -> SQL
│   ├── check-gemini.mjs       # diagnostik koneksi Gemini (manual)
│   └── src/
│       ├── index.js                # HTTP, CORS, rute, alur tanya jawab
│       ├── gemini.js, answer-cache.js, document-suggest.js, transcribe.js
│       ├── auth.js, google-oidc.js, password.js, rate-limit.js
│       ├── admin.js, documents.js, events.js, feedback.js
│       └── history.js, shares.js, seen-documents.js, knowledge-store.js
├── .github/workflows/ci.yml   # tes di setiap push, deploy Worker otomatis
└── tests/                     # 328 pengujian
```

Sekitar 17.500 baris kode JavaScript, 117 commit. Cara menjalankan dan mengoperasikan proyek ada di [`README.md`](README.md).
