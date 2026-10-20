# SAPA UPI — AI Academic Hub

Prototipe asisten informasi akademik untuk Program Studi Bisnis Digital. Mahasiswa bertanya dengan bahasa sehari-hari, sistem mengambil rujukan dari *knowledge base*, lalu Gemini menyusun jawabannya dengan tetap menyebut sumber.

**Demo:** https://fikhry-hakim.github.io/sapa-upi-prototype/

## Arsitektur

```text
Browser (GitHub Pages)
   │  POST { question }
   ▼
Cloudflare Worker  ──► knowledge base dari D1 (sapa-upi-kb)
   │                └─► retrieval: IDF + stemming + cakupan pertanyaan
   │                └─► Gemini menyusun jawaban, dibatasi konteks hasil retrieval
   ▼
{ answer, entry, followUps }
```

API key Gemini hanya ada di Worker sebagai *secret*. Key tidak pernah dikirim ke browser.

Kalau Worker mati, kuota habis, atau `API_URL` kosong, aplikasi otomatis jatuh ke pencocokan kata kunci lokal dan menandai jawabannya **"Mode offline"**. Demo tidak akan blank.

## Menjalankan secara lokal

```bash
python3 -m http.server 4173
```

Buka `http://localhost:4173`. Jangan buka `index.html` langsung — modul JavaScript butuh server HTTP.

Menjalankan pengujian:

```bash
npm test
```

Tanpa konfigurasi tambahan, aplikasi berjalan dalam mode offline (tanpa LLM).

## Menyambungkan ke Gemini

### 1. Ambil API key

Buka https://aistudio.google.com/apikey → **Create API key**. Simpan baik-baik, jangan di-commit ke Git.

### 2. Deploy Worker

```bash
cd worker
npx wrangler login          # buka browser, login Cloudflare
npx wrangler secret put GEMINI_API_KEY   # paste API key saat diminta
npx wrangler deploy
```

Perintah terakhir mencetak URL Worker, misalnya `https://sapa-upi-api.<akun>.workers.dev`.

### 3. Sambungkan frontend

Isi URL tadi ke `config.js`:

```js
export const API_URL = "https://sapa-upi-api.<akun>.workers.dev";
```

Lalu commit dan push. GitHub Pages akan rebuild otomatis.

### Konfigurasi Worker

Diatur di `worker/wrangler.toml`:

| Variabel | Fungsi |
| --- | --- |
| `GEMINI_MODEL` | Model yang dipakai. Default `gemini-3.5-flash-lite`. `gemini-3.8-flash` sempat dicoba dan ditolak dengan *"project has exceeded a quota"* pada akun free tier ini, jadi jangan diganti tanpa menaikkan tier dulu. |
| `ALLOWED_ORIGINS` | Daftar origin yang boleh memanggil API, dipisah koma. Wajib diisi origin GitHub Pages kamu. |
| `GEMINI_API_KEY` | **Secret**, bukan var. Diisi lewat `wrangler secret put`. |

Daftar model terbaru: https://ai.google.dev/gemini-api/docs/models — model lama seperti `gemini-2.0-flash` sudah dimatikan, jadi cek berkala kalau Worker tiba-tiba balas error.

## Sumber jawaban

Isi knowledge base diambil dari empat dokumen resmi:

| Dokumen | Pemilik | Tanggal |
| --- | --- | --- |
| Buku Panduan Penyelesaian Tugas Akhir Mahasiswa | Tim Prodi Bisnis Digital, UPI Kampus Daerah Tasikmalaya | April 2023 |
| Pedoman Penulisan Karya Ilmiah UPI Menuju WCU | Universitas Pendidikan Indonesia | Edisi 2024 |
| Pengumuman Nomor T-207/UN40.C3.4.4/PK.03.03/2026 tentang Semhas Jalur Artikel | Ketua Prodi Bisnis Digital | 5 Oktober 2026 |
| Surat Nomor B-5577/UN40.C3.1/TA.07.02/2025 tentang Imbauan Pelatihan Kewirausahaan | Wakil Direktur Bidang Pendidikan, Kampus UPI Tasikmalaya | 10 September 2025 |

Angka, tanggal, dan nomor dokumen disalin dari sumbernya. Kalau sebuah ketentuan tidak tertulis di keempat dokumen itu, ia tidak ada di knowledge base — dan asisten akan menolak menjawabnya, bukan menebak.

Dua dokumen di atas menyebut batas uji similaritas yang berbeda: Pedoman UPI 2024 menetapkan di bawah 25%, sementara Buku Panduan Prodi menyebut maksimal 35%. Asisten menyampaikan keduanya beserta dokumen asalnya, bukan memilih salah satu.

## Cara menjaga jawaban tetap berdasar

Tiga lapis pengaman supaya model tidak mengarang:

1. **Retrieval dulu, baru generate.** Worker memilih maksimal 3 entri paling relevan dari `data/knowledge-base.js`, dan hanya itu yang dikirim sebagai konteks.
2. **System instruction ketat** (`worker/src/gemini.js`): dilarang menjawab di luar konteks, dilarang mengarang angka/tanggal/nomor SK, dan wajib mengarahkan ke tenaga administrasi kalau rujukannya tidak ada.
3. **Angka tetap dari data, bukan dari model.** Tabel syarat sidang dan metadata sumber dirender dari knowledge base, tidak ikut digenerate.

## Menambah topik

Knowledge base tinggal di **D1** (`sapa-upi-kb`), bukan di dalam kode, jadi menambah topik **tidak perlu deploy**:

```bash
cd worker
npx wrangler d1 execute sapa-upi-kb --remote --command "
  INSERT INTO entries (id, category, title, answer, lead, closing,
    source_title, source_owner, valid_period, updated_at, source_url, escalation)
  VALUES ('id-topik', 'Kategori', 'Judul', 'Jawaban ringkas.', 'Pembuka:', 'Penutup.',
    'Nama Dokumen', 'Pemilik Dokumen', 'Semester Ganjil 2026/2027', '13 Oktober 2026',
    'https://...', 'Hubungi ... jika ...');
"
```

Lalu isi daftar `questions`, `keywords`, `points`, dan `follow_up` di tabel `entry_lists`. Perubahan terbaca dalam waktu paling lama satu menit (lihat `CACHE_TTL_MS`).

Topik lama tidak perlu dihapus saat pedoman berganti — set `active = 0` supaya berhenti dipakai menjawab tetapi riwayatnya tetap ada.

`data/knowledge-base.js` tetap ada sebagai dua hal: **benih** awal isi D1, dan **cadangan offline** yang dipakai browser kalau Worker tidak terjangkau. Isinya tidak ikut berubah saat kamu menambah topik di D1, jadi jawaban mode offline bisa tertinggal dari yang terbaru.

### Menyiapkan ulang basis data

```bash
cd worker
npx wrangler d1 execute sapa-upi-kb --remote --file=schema.sql
node seed.mjs > seed.sql
npx wrangler d1 execute sapa-upi-kb --remote --file=seed.sql
```

`seed.sql` dihasilkan dari `data/knowledge-base.js`, jadi jangan dijalankan kalau di D1 sudah ada topik yang ditambahkan manual — perintah itu menimpa setiap entri yang namanya sama.

## Cara retrieval memilih entri

Pencocokan kata kunci biasa gampang salah pilih. Beberapa hal yang dipakai `lib/search.js` untuk menghindarinya:

- **IDF** — kata yang muncul di banyak entri (`tugas`, `akhir`) berbobot lebih kecil daripada kata yang membedakan (`sidang`, `yudisium`).
- **Satu hitungan per field** — entri tidak bisa naik peringkat hanya karena mengulang satu kata di beberapa contoh pertanyaan.
- **Istilah majemuk** — "tugas akhir" dihitung satu konsep, bukan dua kata, supaya tidak mengalahkan kata lain hanya karena lebih panjang.
- **Stemming imbuhan** — "persyaratan pendaftaran" di dokumen bertemu "syarat daftar" yang diketik mahasiswa.
- **Cakupan pertanyaan** — entri yang menjawab seluruh pertanyaan menang atas entri yang hanya cocok di satu kata.

## Batasan prototipe

- Knowledge base memuat **kutipan dari empat dokumen resmi**, tetapi belum mencakup seluruh isi dokumen tersebut. Topik yang tidak ada di dalamnya akan ditolak, bukan dijawab.
- Belum ada autentikasi, penyimpanan riwayat, maupun integrasi SIAKAD.
- Retrieval memakai pencocokan kata kunci, belum pencarian semantik (*embedding*).
- Jawaban belum melalui evaluasi tenaga akademik dan tidak dapat dijadikan keputusan resmi. Keputusan resmi tetap pada program studi.
- Endpoint Worker belum dibatasi rate limit. Untuk demo publik yang ramai, aktifkan *Rate limiting rules* di dashboard Cloudflare.
- **Kuota Gemini free tier: 15 permintaan per menit.** Lewat dari itu, Worker membalas 502 dan aplikasi jatuh ke mode offline. Untuk demo di kelas berisi puluhan mahasiswa yang bertanya bersamaan, ini batas yang akan kena duluan — bukan biaya, bukan kecepatan.
- Worker tidak punya lokasi keluar yang tetap, sehingga sebagian permintaan ditolak Gemini dengan *"User location is not supported"*. Permintaan seperti itu dicoba ulang otomatis; yang tetap gagal jatuh ke mode offline.
- Model gratis kadang membalas *"currently experiencing high load"* atau menggantung sampai lebih dari satu menit. Batas waktu menahan ini di 24 detik pada Worker dan 15 detik pada browser, lalu jawaban diambil dari pencocokan lokal. Artinya saat Google sedang padat, demo tetap menjawab tetapi dalam mode offline.

## Tampilan

Antarmuka mengikuti section **MVP** pada desain Figma (frame New Chat, Answering Question, Source, Student' Files, Profile, Settings):

- **New Chat** — sapaan dengan nama akun, satu kotak tanya, tanpa kartu pintasan.
- **Jawaban** — kartu dengan status asal jawaban, tabel bernomor, dan kotak *Rujukan Dokumen Resmi*.
- **Panel dokumen** — klik rujukan untuk membuka PDF aslinya di halaman yang dikutip, dengan kalimat rujukan disorot (PDF.js, dimuat hanya saat dibutuhkan). Terbuka untuk siapa pun, tanpa login.
- **Files** — daftar dokumen yang disajikan, dengan sampul halaman pertama dan penanda favorit.
- **Tanya dokumen** — tombol **+** membatasi pertanyaan pada satu dokumen; di Worker, pembatasan hanya mempersempit rujukan, tidak pernah menambah.
- **Search Chats** — mencari judul dan isi riwayat milik sendiri (perlu masuk).
- **Profile / Settings / Help** — profil dari akun Google, keluar dari semua perangkat, unduh dan hapus riwayat, serta kontak program studi.

### Halaman pengelola

Dashboard, Metrics, Knowledge Base, dan Upload hanya muncul untuk akun yang punya baris di tabel `staff_roles` (peran `upload`, `review`, atau `admin`). Peran dibaca Worker dari D1 pada setiap permintaan, tidak pernah dari browser.

- **Dashboard** — dihitung dari tabel `events`, yang hanya menyimpan hasil jawaban (tanpa teks pertanyaan dan tanpa identitas pengguna). Memuat enam kartu, enam grafik analitik (Lampiran A, Tabel A.7), filter jenis respons dan kategori, dan ekspor Excel (`.xlsx` dengan grafik), CSV rekapitulasi, serta PDF (lewat dialog cetak).
- **Metrics** — tabel 10 KPI sesuai Lampiran A, Tabel A.6. KPI kualitas (kesesuaian jawaban, ketepatan referensi) dan waktu respons pertama tampil "belum dievaluasi/diukur", bukan angka rekaan.
- **Knowledge Base** — daftar dokumen, filter status dan kategori, sakelar RAG, validasi, proses ulang teks, tandai tidak berlaku, hapus, dan log audit.
- **Upload** — hanya TPTA dan TU. PDF dibaca di browser (PDF.js), teks dikirim ke `POST /admin/documents`, berkas ke `PUT /admin/documents/:id/file` (disimpan di KV). Dokumen baru berstatus *Menunggu Validasi* dan belum dipakai menjawab. Metode penyimpanan: *Dokumen Baru*, *Gabungkan Terkait*, dan *Perbarui Versi* (versi lama otomatis Tidak Berlaku saat versi baru divalidasi).
- Skema: `worker/schema-owner.sql`, `schema-auth.sql`, dan migrasi `schema-password.sql`, `schema-upload-fields.sql`, `schema-hardening.sql` untuk basis data yang sudah ada. Memberi peran:

```bash
cd worker && npx wrangler d1 execute sapa-upi-kb --remote --command "INSERT INTO staff_roles (email, role, unit, assigned_by) VALUES ('<email>', 'admin', 'TPTA', '<pemberi>')"
```

## Struktur proyek

```text
.
├── index.html
├── style.css
├── app.js                 # logika antarmuka
├── viewer.js              # pembaca dokumen (PDF.js)
├── config.js              # alamat Worker
├── dokumen/               # PDF sumber yang disajikan bersama situs
├── assets/                # maskot dan sampul dokumen
├── data/
│   ├── knowledge-base.js  # benih D1 + cadangan offline
│   └── sources.js         # katalog dokumen + halaman kutipan tiap topik
├── lib/
│   ├── chat-engine.js     # fallback offline
│   └── search.js          # skoring retrieval
├── worker/
│   ├── wrangler.toml
│   ├── schema.sql         # skema knowledge base
│   ├── schema-auth.sql    # akun, sesi, peran, riwayat
│   ├── seed.mjs
│   └── src/
│       ├── index.js            # HTTP, CORS, rute
│       ├── auth.js             # sesi dan peran
│       ├── google-oidc.js      # masuk dengan Google
│       ├── history.js          # riwayat percakapan
│       ├── knowledge-store.js  # baca knowledge base dari D1
│       └── gemini.js           # prompt & parsing respons
└── tests/
```
