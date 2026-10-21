# SAPA UPI — Teknologi & Source Code

Konteks teknis **SAPA UPI**, asisten informasi akademik untuk Program Studi Bisnis Digital, Universitas Pendidikan Indonesia.

Dokumen ini memisahkan dengan tegas **apa yang sudah jalan dan bisa diverifikasi** dari **apa yang belum ditentukan**, supaya tidak ada yang dianggap selesai padahal belum.

Per 21 Oktober 2026.

---

## 1. Ringkasan

Mahasiswa bertanya dengan bahasa sehari-hari, tanpa perlu login. Sistem mencari rujukan yang relevan dari knowledge base, lalu model bahasa menyusun jawaban **yang dibatasi hanya pada rujukan itu** dan menyebut sumbernya. Kalau tidak ada rujukan yang cocok, sistem menolak menjawab dan mengarahkan ke tenaga administrasi.

Generasi jawaban punya tiga lapis cadangan, bukan satu:

1. **Gemini** (model utama) menyusun jawaban dari kutipan pedoman.
2. Kalau Gemini timeout, kena kuota, atau diblokir per wilayah, **Cloudflare Workers AI** mengambil alih dengan aturan dan konteks yang sama.
3. Kalau keduanya gagal, browser jatuh ke **pencocokan kata kunci lokal** (tanpa LLM) dan menandai jawabannya **"Mode offline"**. Demo tidak pernah blank.

Selain chat mahasiswa, ada **halaman pengelola** (Dashboard, Metrics, Knowledge Base, Upload) untuk TPTA dan TU: mengunggah dan memvalidasi dokumen, memantau analitik, dan mengekspor laporan. Akses diperiksa oleh Worker pada setiap permintaan, bukan oleh browser.

Yang sudah berjalan di internet, bukan di laptop:

| | Alamat |
|---|---|
| **Aplikasi (frontend)** | https://fikhry-hakim.github.io/sapa-upi-prototype/ |
| **API (backend)** | https://sapa-upi-api.sapa-upi.workers.dev |
| **Repositori** | https://github.com/Fikhry-hakim/sapa-upi-prototype (publik) |

---

## 2. Arsitektur

```text
 Browser (mahasiswa/dosen, tanpa login, atau admin TPTA/TU setelah login)
   │  JavaScript ES modules, tanpa build — GitHub Pages
   │
   │  HTTPS + JSON (token sesi di header Authorization, kalau login)
   ▼
 Cloudflare Worker "sapa-upi-api"
   ├─ Retrieval      — skoring IDF + stemming + glosarium (lib/search.js)
   ├─ Gemini API     — model utama, dibatasi konteks hasil retrieval
   ├─ Workers AI     — cadangan kalau Gemini gagal, aturan & konteks sama
   ├─ Google OIDC    — login dengan akun @upi.edu (PKCE)
   ├─ Cloudflare D1  — akun, sesi, riwayat chat, dokumen, analitik, audit log
   └─ Cloudflare KV  — berkas PDF yang diunggah admin (maks. 24 MB)
   ▼
 { answer, entry, citation, followUps }  →  browser menyorot kalimat rujukan di PDF
```

Kalau Worker, Gemini, dan Workers AI semuanya tidak terjangkau, browser otomatis menjawab dari pencocokan kata kunci lokal dan menandai jawabannya **"Mode offline"**.

---

## 3. Bahasa pemrograman & framework

| Komponen | Teknologi | Versi |
|---|---|---|
| Frontend | **JavaScript (ES Modules)**, HTML, CSS | — |
| Backend | **JavaScript** di Cloudflare Workers runtime | — |
| Runtime pengembangan | **Node.js** | v25.9.0 |
| Tooling deploy | **Wrangler** (CLI Cloudflare) | 4.151.3 |
| Pembaca PDF | **PDF.js** dari cdnjs, dimuat hanya saat panel dokumen dibuka, dengan Subresource Integrity | 3.11.174 |
| Font | **Plus Jakarta Sans** (Google Fonts) | — |

**Tidak memakai framework** — tanpa React, Vue, Next.js, atau sejenisnya. Tanpa bundler, tanpa langkah build, tanpa transpiler.

**Dependensi runtime: nol.** `package.json` tidak punya satu pun `dependencies` maupun `devDependencies`; pengujian memakai modul `node:test` bawaan Node. Prototipe ini bisa dijalankan dengan satu perintah static server.

Pilihan ini tetap disengaja meski cakupan sudah bertambah jauh dari saat ditulis pertama kali: `app.js` sekarang sekitar 2.000 baris dan `owner.js` sekitar 1.500 baris, murni JavaScript tanpa tipe. Ini mulai terasa di batas atas untuk ukuran "tanpa framework" — lihat bagian 9.

---

## 4. Database

**Cloudflare D1** (SQLite terkelola), nama database `sapa-upi-kb`. **16 tabel**, ditambah satu tabel virtual FTS5.

| Kelompok | Tabel | Isi |
|---|---|---|
| Pengetahuan kurasi | `entries`, `entry_lists` | Topik, jawaban, metadata sumber, pertanyaan contoh, kata kunci |
| Akun | `users`, `sessions`, `auth_states`, `credentials`, `login_failures` | Akun Google, hash token sesi, state OAuth sekali pakai, hash kata sandi (PBKDF2), percobaan login gagal |
| Peran | `staff_roles` | Satu-satunya sumber hak akses admin (email → peran) |
| Riwayat | `conversations`, `messages` | Riwayat chat, hanya terbaca pemiliknya |
| Dokumen unggahan | `documents`, `passages` (FTS5) | Metadata dan status validasi dokumen, teks per halaman untuk pencarian |
| Analitik | `events`, `feedback`, `audit_log` | Hasil jawaban dan penilaian singkat (tanpa teks pertanyaan, tanpa identitas), log setiap perubahan admin |
| Pengaman | `rate_limits` | Penghitung pembatasan laju per klien |

Skema dasar: [`worker/schema.sql`](worker/schema.sql), [`worker/schema-auth.sql`](worker/schema-auth.sql), [`worker/schema-owner.sql`](worker/schema-owner.sql). Migrasi untuk basis data yang sudah ada: `schema-password.sql`, `schema-upload-fields.sql`, `schema-hardening.sql`, `schema-feedback.sql` — dijalankan manual dengan `wrangler d1 execute ... --file`, selalu **sebelum** deploy Worker yang memakainya.

Dua keputusan desain yang masih berlaku:

- **Metadata sumber disimpan sebagai kolom, bukan prosa.** Sitasi dirender dari data, jadi tidak bisa dikarang model.
- **Analitik tanpa identitas.** `events` dan `feedback` tidak menyimpan teks pertanyaan maupun identitas pengguna — hanya hasil dan penilaiannya. Riwayat chat (`conversations`/`messages`) terpisah dan hanya terbaca pemiliknya sendiri; tidak ada jalur bagi admin untuk membacanya.

Konsekuensinya: **menambah topik kurasi tidak perlu deploy ulang.** Cukup `INSERT`. Dokumen unggahan admin juga begitu, tetapi berstatus "Menunggu Validasi" dan tidak dipakai menjawab sampai divalidasi.

---

## 5. Model AI / API

| | |
|---|---|
| Penyedia utama | **Google Gemini** (Gemini Developer API, Interactions API) |
| Model utama | `gemini-3.5-flash-lite`, `generation_config.thinking_level: "low"` |
| Model Gemini kedua (opsional) | `GEMINI_FALLBACK_MODEL`, kosong secara baku |
| Cadangan tidak bergantung Google | **Cloudflare Workers AI**, `@cf/meta/llama-3.1-8b-instruct-fp8` |
| Autentikasi Gemini | Header `x-goog-api-key`, disimpan sebagai **secret di Cloudflare Worker** |

API key tidak pernah dikirim ke browser dan tidak pernah masuk ke repositori.

### Anggaran waktu per pertanyaan

Satu permintaan `/ask` punya batas total **15 detik**, dibagi dua:

1. Gemini diberi **9 detik**. Timeout, galat 5xx, atau galat 400 "location is not supported" dianggap layak dicoba ulang (sampai 3 kali dalam anggarannya sendiri).
2. Sisa waktu untuk **Workers AI**, dengan instruksi sistem dan konteks kutipan yang sama persis, jadi aturan "hanya dari rujukan" tetap berlaku.
3. Kalau keduanya habis waktu, browser jatuh ke Mode offline.

### Cara jawaban dijaga supaya tidak mengarang

1. **Retrieval dulu, baru generate.** Worker memilih entri paling relevan; hanya itu yang dikirim sebagai konteks — ke Gemini maupun Workers AI.
2. **System instruction ketat** ([`worker/src/gemini.js`](worker/src/gemini.js)): dilarang menjawab di luar konteks, dilarang mengarang angka/tanggal/nomor SK, wajib mengarahkan ke tenaga administrasi bila rujukan tidak ada, dan **dilarang menebak kepanjangan singkatan** di luar glosarium (bagian 6).
3. **Angka tetap dari data.** Tabel syarat sidang dan metadata sumber dirender dari database, tidak ikut digenerate.

### Batas yang nyata

- **Gemini sering timeout dari sisi Google**, bukan dari kode kita — ditangkap lewat `worker/check-gemini.mjs`, skrip diagnostik yang dijalankan manual dengan kunci sendiri (lihat README). Cadangan Workers AI menutupi gejalanya; penyebabnya (kuota/penagihan kunci) belum tentu hilang.
- **Pembatasan laju milik sendiri**: `/ask` dibatasi 20 permintaan per menit per klien (hash IP, bukan IP-nya), supaya satu klien tidak menghabiskan kuota Gemini sendirian.
- **Billing Gemini (Tier 1) belum diaktifkan.** Keputusan ini belum diambil.

---

## 6. Retrieval

Belum memakai *embedding* atau vector database. Yang dipakai sekarang adalah skoring kata kunci buatan sendiri di [`lib/search.js`](lib/search.js), dengan beberapa hal yang membuatnya tidak asal cocok:

- **IDF** — kata yang muncul di banyak entri (`tugas`, `akhir`) berbobot lebih kecil daripada kata yang membedakan (`sidang`, `yudisium`).
- **Satu hitungan per field** — entri tidak bisa menang hanya karena mengulang satu kata.
- **Istilah majemuk** — "tugas akhir" dihitung satu konsep, bukan dua kata.
- **Stemming imbuhan Indonesia** — "persyaratan pendaftaran" di dokumen bertemu "syarat daftar" yang diketik mahasiswa.
- **Glosarium** ([`lib/glossary.js`](lib/glossary.js)) — menambahkan bentuk yang hilang dari sebuah pertanyaan (singkatan atau kepanjangannya), supaya "dospem", "letter of acceptance", atau "satuan kredit semester" menemukan entri yang sama dengan bentuk singkatnya. Daftar yang sama dikirim ke Gemini sebagai referensi istilah, supaya jawaban tidak menebak kepanjangan yang tidak dikonfirmasi dokumen.
- **Cakupan pertanyaan** — entri yang menjawab seluruh pertanyaan menang atas yang hanya cocok di satu kata. **Keterbatasan yang diketahui:** rumus ini menghukum pertanyaan berisi banyak kata asing yang tidak dikenali korpus (mis. pertanyaan berbahasa Inggris penuh), bukan hanya masalah istilah — ada tes yang sengaja mengunci perilaku ini supaya perbaikannya kelak punya tes yang berubah hijau, bukan diam-diam dianggap beres.
- **Dokumen unggahan**: kalau topik kurasi tidak ketemu, Worker juga mencari di halaman dokumen yang diunggah admin dan sudah divalidasi, lewat FTS5 (`passages`).

Ini cukup untuk knowledge base kecil yang kata kuncinya dikurasi manual. **Tidak akan cukup untuk ratusan halaman PDF** — lihat bagian 9.

---

## 7. Autentikasi & peran

- **Mahasiswa/dosen**: anonim secara baku, bisa bertanya dan membuka dokumen tanpa login. Login dengan akun **Google @upi.edu** (PKCE) diperlukan hanya untuk menyimpan riwayat chat.
- **Login email + kata sandi**: tersedia sebagai jalan kedua, tetapi **hanya untuk akun yang sudah pernah login Google sekali** — kata sandi dipasang dari Settings, bukan dari pendaftaran, supaya tidak ada yang bisa mendaftar atas nama email `@upi.edu` orang lain. Disimpan sebagai PBKDF2 dengan garam acak.
- **Peran admin** (`upload`, `review`, `admin`) dibaca dari tabel `staff_roles` pada setiap permintaan, tidak pernah dari browser. Diberikan manual lewat `wrangler d1 execute` (lihat README) — belum ada antarmuka untuk mengelolanya.
- **Pengaman**: `redirect_to` pada login dibatasi ke situs sendiri, penguncian login dihitung per pasangan email+klien (plus batas total agar tidak bisa dibanjiri dari banyak alamat), dan mengganti kata sandi mencabut sesi di perangkat lain.

---

## 8. Halaman pengelola

Dashboard, Metrics, Knowledge Base, dan Upload — satu modul [`owner.js`](owner.js), tidak terbagi akun berbeda seperti disebut di rancangan awal (Lampiran A); akses diatur lewat peran di `staff_roles`.

- **Dashboard**: enam kartu KPI, enam grafik analitik (tren, distribusi hasil, status dokumen, topik pertanyaan, gangguan teknis, kepuasan pengguna), filter periode/jenis respons/kategori, ekspor **Excel** (`.xlsx` dengan grafik asli, dibangun tanpa pustaka di [`lib/xlsx.js`](lib/xlsx.js) dan [`lib/report.js`](lib/report.js)), **CSV** rekap agregat, dan **PDF** lewat dialog cetak browser.
- **Metrics**: tabel 10 KPI sesuai Lampiran A (Tabel A.6). KPI yang butuh penilaian manusia (kesesuaian jawaban, ketepatan referensi) tampil "belum dievaluasi", bukan angka rekaan.
- **Knowledge Base**: daftar dokumen, filter status/kategori, sakelar RAG, validasi, **proses ulang** teks yang gagal dibaca, tandai tidak berlaku, hapus, dan log audit.
- **Upload**: PDF dibaca di browser (PDF.js), teksnya dikirim ke `POST /admin/documents`, berkasnya ke `PUT /admin/documents/:id/file` (disimpan di **Cloudflare KV**, bukan R2 — lihat bagian 9). Tiga metode: **Dokumen Baru**, **Gabungkan Terkait**, **Perbarui Versi** (versi lama otomatis Tidak Berlaku saat versi baru divalidasi, jadi jawaban tidak pernah memakai dua versi sekaligus).
- **Penilaian jawaban**: di bawah tiap jawaban baru ada tombol Kurang/Cukup/Baik, anonim, tanpa teks pertanyaan — hasilnya masuk kartu Kepuasan Pengguna di Dashboard.
- **Nomor penjelasan**: setiap kalimat jawaban AI diberi nomor yang bisa diklik untuk menanyakan penjelasan lebih detail poin itu ([`lib/clarify.js`](lib/clarify.js)).

---

## 9. Hosting, deployment & CI

| Bagian | Platform | Cara deploy |
|---|---|---|
| Frontend | **GitHub Pages** | Otomatis saat push ke `main` |
| Backend | **Cloudflare Workers** | `npx wrangler deploy`, atau otomatis lewat CI (lihat di bawah) |
| Database | **Cloudflare D1** | `npx wrangler d1 execute ... --file` (manual, tidak ada sistem migrasi berurutan) |
| Berkas unggahan | **Cloudflare KV** | Lihat bagian 8 — R2 masih kandidat, belum diaktifkan |

Keduanya pada tier gratis.

**CI** ([`​.github/workflows/ci.yml`](.github/workflows/ci.yml)): setiap push dan pull request menjalankan seluruh tes. Push ke `main` yang lulus tes men-deploy Worker otomatis, **kecuali** push itu mengubah berkas `worker/schema*.sql` — dalam hal itu deploy dilewati dengan peringatan, supaya Worker baru tidak pernah berjalan di atas tabel yang belum ada; migrasinya harus dijalankan manual lebih dulu. Deploy otomatis juga dilewati kalau secret `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` belum dipasang di repositori.

---

## 10. Pengujian

**175 pengujian**, seluruhnya lulus. Dijalankan dengan `npm test` (memakai `node --test`, tanpa framework pengujian pihak ketiga).

Cakupannya mencakup skoring retrieval dan glosarium, penyusunan prompt dan parsing respons Gemini beserta perilaku gagal-ke-cadangan (Workers AI), pembuatan berkas `.xlsx` dan validitas strukturnya, pembatasan laju dan penguncian login, hash kata sandi, dan beberapa pengujian yang mengunci keputusan kejujuran produk — misalnya satu pengujian gagal bila ada tombol tanpa perilaku, satu gagal bila identitas mahasiswa palsu muncul kembali di halaman, dan satu gagal bila KPI yang butuh evaluasi manusia menampilkan angka alih-alih "belum dievaluasi".

---

## 11. Yang BELUM ditentukan atau belum ada

Bagian ini sama pentingnya dengan yang di atas. Jangan dianggap sudah selesai:

| Hal | Status |
|---|---|
| **Pencarian semantik (embedding)** | Belum ada. Diperlukan begitu dokumen bertambah banyak. Kandidat: Cloudflare Vectorize. |
| **Penyimpanan berkas (R2)** | Belum diaktifkan di akun (perlu kartu pembayaran untuk mulai, walau jatah gratisnya besar). Sekarang memakai Cloudflare KV, cukup untuk berkas ≤24 MB. |
| **Daftar putih akun resmi** | Siapa pun dengan email `@upi.edu` bisa masuk. Daftar NIM/dosen terdaftar belum ada — butuh data resmi dari prodi. |
| **Antarmuka pemberian peran admin** | Peran diberikan lewat `wrangler d1 execute` manual, bukan dari halaman owner. |
| **Pembaca DOCX/PPTX dan OCR** | Hanya PDF yang bisa diunggah dan dibaca sistem. |
| **Integrasi SIAKAD** | Tidak ada, dan tidak disimulasikan — keputusan sengaja, bukan keterbatasan yang belum sempat dikerjakan. |
| **Kumpulan soal uji (golden set)** | Belum ada. Diperlukan untuk mengisi KPI kesesuaian jawaban dan ketepatan referensi di Metrics, yang sekarang tampil "belum dievaluasi". |
| **Lingkungan staging** | Belum ada. Satu Worker dan satu database, langsung produksi. |
| **Migrasi database berurutan** | Belum ada sistem migrasi otomatis; urutan skema dijaga manual dan oleh catatan di README/commit. |
| **Framework frontend** | Sengaja tidak dipakai; `app.js`/`owner.js` mulai besar tanpa tipe — lihat bagian 3. |
| **Billing Gemini (Tier 1)** | Belum diaktifkan. |
| **Domain sendiri di bawah upi.edu** | Belum ada (butuh izin TI kampus). Dengan domain sama untuk frontend dan API, sesi bisa memakai cookie HttpOnly, bukan token di `localStorage`. |

---

## 12. Batasan yang harus disebutkan

- Knowledge base kurasi memuat kutipan dari **empat dokumen resmi**, tetapi hanya **tiga yang dipublikasikan** sebagai PDF yang bisa dibuka siapa pun (lihat `data/sources.js`); satu dokumen sumber (S4, Surat Imbauan Pelatihan Kewirausahaan) tidak dipublikasikan karena berkas aslinya satu bundel dengan dokumen bertanda tangan dan NIP pejabat. Topik di luar keempat dokumen itu ditolak, bukan dijawab.
- Jawaban **belum melalui peninjauan tenaga akademik** dan tidak bisa dijadikan dasar keputusan resmi. Keputusan resmi tetap pada program studi.
- Dua dokumen sumber menyebut batas uji similaritas yang berbeda (di bawah 25% versus maksimal 35%). Asisten menyampaikan keduanya beserta dokumen asalnya, bukan memilih salah satu.
- Dokumen yang diunggah admin lewat Knowledge Base **belum melalui peninjauan tenaga akademik** sama sekali — validasi admin hanya memastikan teksnya terbaca dan dokumennya sah, bukan memeriksa kebenaran isinya.

---

## 13. Struktur repositori

```text
.
├── index.html, style.css      # kerangka dan gaya
├── app.js                     # logika antarmuka mahasiswa (~2.000 baris)
├── owner.js                   # halaman pengelola: Dashboard, Metrics, KB, Upload (~1.500 baris)
├── viewer.js                  # pembaca PDF di panel samping, sorot kalimat rujukan
├── config.js                  # alamat Worker
├── favicon.ico, assets/       # ikon dan sampul dokumen
├── data/
│   ├── knowledge-base.js      # 26 topik kurasi + cadangan offline browser
│   └── sources.js             # metadata 3 dokumen yang dipublikasikan + halaman rujukan
├── dokumen/                   # 3 PDF sumber yang disajikan bersama situs
├── lib/                       # kode murni dipakai frontend & backend
│   ├── search.js              # skoring retrieval
│   ├── glossary.js            # glosarium singkatan (pencarian + prompt Gemini)
│   ├── clarify.js             # nomor penjelasan di jawaban AI
│   ├── chat-engine.js         # mesin jawaban mode offline
│   ├── charts.js, report.js   # grafik analitik dan susunan laporan
│   └── xlsx.js                # pembuat berkas .xlsx tanpa pustaka
├── worker/
│   ├── wrangler.toml          # konfigurasi & binding (D1, KV, Workers AI)
│   ├── schema*.sql            # skema dasar + migrasi
│   ├── seed*.mjs               # knowledge-base.js / sources.js -> SQL
│   ├── check-gemini.mjs       # diagnostik koneksi Gemini (dijalankan manual)
│   └── src/
│       ├── index.js                # HTTP, CORS, pembatasan laju, routing
│       ├── gemini.js, google-oidc.js, auth.js, password.js
│       ├── admin.js, documents.js, events.js, feedback.js, history.js
│       └── knowledge-store.js, rate-limit.js
├── .github/workflows/ci.yml   # tes di setiap push, deploy Worker otomatis
└── tests/                     # 175 pengujian
```

Sekitar 9.000 baris kode (tanpa `index.html`/`style.css`), 54 commit. Dokumentasi untuk menjalankan dan mengoperasikan proyek ada di [`README.md`](README.md).
