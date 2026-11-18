# SAPA UPI — AI Academic Hub

Asisten informasi akademik untuk Program Studi Bisnis Digital, UPI Kampus Tasikmalaya. Pengguna masuk dengan akun UPI, bertanya dengan bahasa sehari-hari, lalu sistem mengambil rujukan dari *knowledge base* dan Gemini menyusun jawabannya dengan tetap menyebut dokumen sumbernya.

**Demo:** https://fikhry-hakim.github.io/sapa-upi-prototype/ (perlu akun Google `@upi.edu`)

Dokumen teknis lengkap, termasuk apa yang belum ada, ada di [`TEKNOLOGI.md`](TEKNOLOGI.md).

## Arsitektur

```text
Browser (GitHub Pages, JavaScript ES modules tanpa build)
   │  POST { question, history, lang }
   ▼
Cloudflare Worker "sapa-upi-api"
   ├─ permintaan berkas / daftar dokumen → dijawab dari katalog, tanpa model
   ├─ retrieval: IDF + stemming + glosarium → knowledge base di D1 (sapa-upi-kb)
   ├─ Gemini menyusun jawaban, dibatasi konteks hasil retrieval
   └─ cache jawaban 12 jam di D1
   ▼
{ answer, entry, citations (utama + terkait), followUps }
```

API key Gemini hanya ada di Worker sebagai *secret*. Key tidak pernah dikirim ke browser.

Kalau Gemini gagal atau lambat, Worker membalas 502 dan browser menampilkan **jawaban cadangan dari knowledge base** (ditandai "Jawaban cadangan • AI sedang tidak tersedia"). Kalau Worker tidak terjangkau sama sekali, aplikasi memakai pencocokan lokal yang sama.

## Fitur utama

**Untuk mahasiswa dan dosen**
- **Tanya jawab** dengan sumber: kartu "Sumber dokumen resmi" bisa dibuka di halaman yang dikutip dengan kalimat rujukan disorot, plus "Dokumen terkait" untuk dokumen serupa. Jawaban panjang memberi nomor yang bisa diklik untuk meminta penjelasan satu poin.
- **Minta berkas** ("ada file kalender akademik ga", "dokumen apa saja yang ada") dijawab dengan kartu berkas yang dibuka dari halaman 1 atau diunduh langsung. Template formulir (DOCX) bisa dipratinjau dengan kop dan logonya, dan diunduh.
- **Berkas**: hanya dokumen yang pernah dicari pengguna (disimpan per akun di server). Favorit dengan bintang.
- **Salin dan ubah**: tombol salin di setiap jawaban, salin dan ubah di setiap pertanyaan sendiri.
- **Riwayat** percakapan, cari, arsipkan, hapus, dan **bagikan** satu chat lewat tautan hanya-baca yang bisa dicabut.
- **Settings**: bahasa (Indonesia bawaan, English), dikte suara, pintasan keyboard yang bisa diubah, sesi aktif, chat diarsipkan, ekspor dan hapus data, preferensi cookie dan privasi.
- Mode terang dan gelap, tampilan responsif dari ponsel sampai layar lebar.

**Untuk pengelola** (akun yang punya baris di `staff_roles`)
- **Dashboard**: kartu KPI, grafik analitik, **Pertanyaan Teratas** (pertanyaan yang paling sering diajukan, dengan dugaan sisi masalahnya: pengguna atau AI dan data), log interaksi dengan filter, ekspor Excel (timestamp asli, filter di lembar Aktivitas, grafik), CSV rekap, dan PDF.
- **Metrics**: 10 KPI sesuai Lampiran A.
- **Knowledge Base**: daftar dokumen, validasi, sakelar RAG, proses ulang teks, tandai tidak berlaku, hapus, log audit.
- **Upload dokumen**: pilih PDF, **AI mengisi** nama, kategori, penerbit, nomor surat, tanggal, periode, dan deskripsi dari isi berkas; wajib melalui **pratinjau** (halaman 1, isian, cuplikan isi) sebelum dikirim. Dokumen baru berstatus *Menunggu Validasi* dan belum dipakai menjawab.
- Pengelola melihat semua berkas dan bisa membatasi pertanyaan pada satu dokumen (tombol **+**).

## Menjalankan secara lokal

```bash
python3 -m http.server 4173
```

Buka `http://localhost:4173`. Jangan buka `index.html` langsung; modul JavaScript butuh server HTTP.

Halaman punya Content-Security-Policy lewat `<meta>` di `index.html`. Kalau menambah sumber eksternal baru (skrip, font, domain API), tambahkan juga di sana.

Dari `localhost` aplikasi tidak bisa memanggil API produksi (CORS hanya mengizinkan origin GitHub Pages), jadi di sana gerbang login tidak dipasang dan jawaban datang dari pencocokan lokal. Untuk menguji terhadap API, tambahkan `http://localhost:4173` sementara ke `ALLOWED_ORIGINS`, deploy, dan buang lagi sesudahnya.

Menjalankan pengujian (328 tes, tanpa dependensi):

```bash
npm test
```

## Menyambungkan ke Gemini dan Google

1. Ambil API key di https://aistudio.google.com/apikey.
2. Deploy Worker:

   ```bash
   cd worker
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler deploy
   ```

3. Isi URL Worker ke `config.js`:

   ```js
   export const API_URL = "https://sapa-upi-api.<akun>.workers.dev";
   ```

   lalu commit dan push; GitHub Pages membangun ulang otomatis.

### Konfigurasi Worker (`worker/wrangler.toml`)

| Variabel | Fungsi |
| --- | --- |
| `GEMINI_MODEL` | Model utama. Baku `gemini-3.5-flash-lite`. `gemini-3.8-flash` pernah ditolak karena kuota akun gratis; jangan diganti tanpa menaikkan tier. |
| `GEMINI_FALLBACK_MODEL` | Model Gemini kedua, opsional (kosong = tidak dipakai). |
| `AI_FALLBACK_ENABLED` | Cadangan Cloudflare Workers AI. **Mati** secara baku: model 8B-nya kadang menjawab "tidak ada informasi" padahal ada di kutipan. |
| `ALLOWED_ORIGINS` | Origin yang boleh memanggil API, dipisah koma. Wajib berisi origin GitHub Pages. |
| `GOOGLE_CLIENT_ID`, `OAUTH_REDIRECT_URI`, `APP_URL` | Konfigurasi masuk dengan Google. |
| `ALLOWED_EMAIL_DOMAINS` | Domain email yang boleh masuk (baku `upi.edu`, subdomain ikut). |
| `FLOOD_GATE` | Binding *rate limiting* awal (600 permintaan per menit per klien) sebelum menyentuh D1. |
| `GEMINI_API_KEY`, `GOOGLE_CLIENT_SECRET` | **Secret**, bukan var. Diisi lewat `wrangler secret put`. |

Daftar model terbaru: https://ai.google.dev/gemini-api/docs/models. Kalau Worker tiba-tiba membalas galat, cek apakah modelnya masih tersedia.

### Anggaran waktu jawaban

Satu pertanyaan punya batas total **20 detik** di Worker (browser menunggu 24 detik). Kalau Gemini belum menjawab dalam **6 detik**, Worker mengirim permintaan kedua bersamanya dan memakai yang selesai lebih dulu. Hanya konteks yang relevan dari glosarium yang dikirim, dan jawaban untuk pertanyaan yang sama disimpan 12 jam di tabel `answer_cache`. Diagnostik koneksi: `GEMINI_API_KEY=xxxx node worker/check-gemini.mjs`.

## Sumber jawaban

Knowledge base berisi **87 topik kurasi** dari **18 dokumen resmi** (PDF di `dokumen/`) dan **15 template formulir** (`dokumen/template/`, 14 DOCX dan 1 PDF). Katalog dokumen, halaman kutipan tiap topik, dan metadata ada di `data/sources.js`.

| Kelompok | Contoh |
| --- | --- |
| Peraturan | Peraturan Rektor 38/2026 (penyelenggaraan pendidikan), 70/2026 (tugas akhir, sidang, kelulusan) |
| Pedoman dan buku | Buku Panduan Tugas Akhir, Pedoman Penulisan Karya Ilmiah 2024, Pedoman Tugas Akhir 2024, Buku Magang |
| Surat edaran dan pengumuman | SE 48/2026 (UKT, IRS), SE 68/2026 (cuti), SE 092/2025 (MSIB), T-45, T-150, T-207 |
| Panduan sistem | SIMKATMAWA 2026, Unggah Mandiri dan Bebas Pustaka (SIAS), MANDALA |
| Lainnya | Kalender Akademik 2026/2027, PPT syarat kelulusan |

Angka, tanggal, dan nomor dokumen disalin dari sumbernya. Kalau sebuah ketentuan tidak ada di dokumen, ia tidak ada di knowledge base, dan asisten menjawab "belum menemukan" dengan kontak umum prodi, bukan menebak. Saat tidak bisa menjawab, pembaca diarahkan ke **Tenaga Administrasi Program Studi** atau sumber resmi UPI, tidak ke dosen tertentu.

Kalau dua dokumen menyebut hal yang sama dengan isi berbeda (misalnya batas uji similaritas), asisten menyebut keduanya beserta dokumen asal dan tanggalnya; yang terbaru ditandai berlaku.

## Cara menjaga jawaban tetap berdasar

1. **Retrieval dulu, baru generate.** Worker memilih maksimal 3 topik paling relevan dan hanya itu yang dikirim sebagai konteks.
2. **Instruksi sistem ketat** (`worker/src/gemini.js`): dilarang menjawab di luar konteks, dilarang mengarang angka, tanggal, atau nomor SK, dilarang menebak kepanjangan singkatan di luar glosarium, dan wajib mengakui kalau informasinya tidak ada.
3. **Sumber dan angka dari data.** Kartu sumber, tabel, dan kontak dirender dari knowledge base, tidak ikut digenerate. Jawaban "belum menemukan" tidak menampilkan kartu sumber topik yang salah cocok.

## Menambah dan mengubah topik

Knowledge base dibaca Worker dari **D1**, jadi `INSERT` langsung tidak perlu deploy (terbaca dalam paling lama satu menit):

```bash
cd worker
npx wrangler d1 execute sapa-upi-kb --remote --command "
  INSERT INTO entries (id, category, title, answer, lead, closing,
    source_title, source_owner, valid_period, updated_at, source_url, escalation)
  VALUES ('id-topik', 'Kategori', 'Judul', 'Jawaban ringkas.', 'Pembuka:', 'Penutup.',
    'Nama Dokumen', 'Pemilik Dokumen', 'Semester Ganjil 2026/2027', '13 Oktober 2026',
    'https://...', 'Hubungi staf Program Studi Bisnis Digital ...');
"
```

Lalu isi `questions`, `keywords`, `points`, dan `follow_up` di tabel `entry_lists`. Topik lama tidak perlu dihapus: set `active = 0` supaya berhenti dipakai tetapi riwayatnya tetap ada.

`data/knowledge-base.js` adalah **benih** D1 sekaligus **cadangan offline** browser. Mengubahnya tidak otomatis mengubah D1; jalankan seed:

```bash
cd worker
node seed.mjs > seed.sql
npx wrangler d1 execute sapa-upi-kb --remote --file=seed.sql
```

Seed **menimpa** setiap entri yang id-nya sama, jadi jangan dijalankan kalau ada topik hasil ketikan manual di D1 yang ingin dipertahankan. `seed.sql` dihasilkan, tidak di-commit.

### Skema dan migrasi

Instalasi baru: `schema.sql`, `schema-auth.sql`, `schema-owner.sql`. Basis data yang sudah ada dimigrasi manual dengan `wrangler d1 execute sapa-upi-kb --remote --file=<berkas>`, selalu **sebelum** deploy Worker yang memakainya: `schema-password.sql`, `schema-upload-fields.sql`, `schema-hardening.sql`, `schema-feedback.sql`, `schema-idle-session.sql`, `schema-category-merge.sql`, `schema-archive.sql`, `schema-share.sql`, `schema-cache.sql`, `schema-seen.sql`, `schema-question.sql`.

Memberi peran pengelola:

```bash
cd worker && npx wrangler d1 execute sapa-upi-kb --remote --command "INSERT INTO staff_roles (email, role, unit, assigned_by) VALUES ('<email>', 'admin', 'TPTA', '<pemberi>')"
```

Peran: `upload`, `review`, `admin`. Hanya `upload` dan `admin` yang boleh mengunggah dokumen.

## Cara retrieval memilih topik

Pencocokan kata kunci biasa gampang salah pilih, jadi `lib/search.js` memakai:

- **IDF**: kata yang ada di banyak topik (`tugas`, `akhir`) berbobot kecil.
- **Satu hitungan per field** dan **istilah majemuk** ("tugas akhir" satu konsep).
- **Stemming imbuhan** Indonesia, dan **glosarium** (`lib/glossary.js`) yang menambahkan singkatan atau kepanjangannya (TPTA, SKPI, SIMKATMAWA, dospem...).
- **Cakupan pertanyaan**: topik yang menjawab seluruh pertanyaan menang atas yang hanya cocok di satu kata. Kalau beberapa topik sama kuat, pembaca diminta memilih.
- **Dokumen terkait** (`lib/source-set.js`): dokumen lain dengan topik berperingkat dekat atau pokok sama (bukan sekadar kata umum seperti "kriteria") ditampilkan terpisah dari sumber utama.
- **Dokumen unggahan**: kalau topik kurasi tidak ketemu, Worker mencari di halaman dokumen unggahan yang sudah divalidasi lewat FTS5.

## Batasan

- Pencarian memakai kata kunci, belum semantik (*embedding*). Cukup untuk 87 topik; tidak untuk ratusan halaman PDF.
- Jawaban belum dievaluasi tenaga akademik dan bukan keputusan resmi. Keputusan resmi tetap pada program studi.
- Belum ada integrasi SIAKAD, dan itu disengaja.
- Gerbang login hanya di sisi browser; endpoint tanya di Worker masih bisa dipanggil langsung tanpa token.
- Kuota Gemini akun gratis terbatas, dan sesekali lambat di sisi Google. Hedging, anggaran 20 detik, dan cache mengurangi gejalanya; kalau tetap gagal, jawaban cadangan dari knowledge base tampil.
- Notifikasi email belum ada (tab Notifications di Settings disembunyikan).
- Daftar "berkas yang sudah dicari" untuk pengunjung yang belum login tersimpan di browser; untuk akun yang login tersimpan di server.
- Teks pertanyaan dicatat di analitik **hanya bila pengguna mengaktifkan "Improve SAPA UPI"** (aktif secara baku): dipotong 200 karakter, tanpa identitas, email dan angka panjang (NIM, telepon) disamarkan. Kalau dimatikan, interaksinya tidak dicatat sama sekali. Riwayat chat pribadi terpisah dan hanya terbaca pemiliknya.

## CI dan deploy

`.github/workflows/ci.yml`: tes (`npm test`) di setiap push dan pull request; push ke `main` yang lulus tes men-deploy Worker otomatis bila secret `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` terpasang, **kecuali** push itu mengubah `worker/schema*.sql` (deploy dilewati dengan peringatan; jalankan migrasinya dulu, lalu `cd worker && npx wrangler deploy`). Frontend dibangun ulang GitHub Pages setiap push ke `main`.

## Struktur proyek

```text
.
├── index.html, style.css, config.js, theme-init.js
├── app.js          # antarmuka: chat, berkas, riwayat, bagikan, login
├── owner.js        # pengelola: Dashboard, Metrics, Knowledge Base, Upload
├── settings.js     # halaman Settings
├── viewer.js       # pembaca PDF dan DOCX di panel samping
├── data/           # knowledge-base.js (benih + cadangan offline), sources.js (katalog dokumen)
├── dokumen/        # 18 PDF resmi, dokumen/template/ (15 template formulir)
├── assets/         # maskot, ikon, font, sampul dokumen
├── lib/            # kode murni dipakai browser dan Worker: search, glossary, source-set,
│                   # doc-request, clarify, chat-engine, docx-preview, i18n, settings-*,
│                   # charts, report, xlsx, followup, suggest, ...
├── worker/
│   ├── wrangler.toml, schema*.sql, seed*.mjs, check-gemini.mjs
│   └── src/        # index (rute), gemini, auth, google-oidc, admin, documents,
│                   # document-suggest, events, history, shares, seen-documents,
│                   # answer-cache, feedback, transcribe, rate-limit, knowledge-store
├── tests/          # 328 pengujian (node:test)
└── .github/workflows/ci.yml
```
