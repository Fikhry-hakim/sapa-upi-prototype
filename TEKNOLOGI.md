# SAPA UPI — Teknologi & Source Code

Konteks teknis prototipe **SAPA UPI**, asisten informasi akademik untuk Program Studi Bisnis Digital, Universitas Pendidikan Indonesia.

Dokumen ini memisahkan dengan tegas **apa yang sudah jalan dan bisa diverifikasi** dari **apa yang belum ditentukan**, supaya tidak ada yang dianggap selesai padahal belum.

Per 13 Oktober 2026.

---

## 1. Ringkasan

Mahasiswa bertanya dengan bahasa sehari-hari. Sistem mencari rujukan yang relevan dari knowledge base, lalu model bahasa menyusun jawaban **yang dibatasi hanya pada rujukan itu** dan menyebut sumbernya. Kalau tidak ada rujukan yang cocok, sistem menolak menjawab dan mengarahkan ke tenaga administrasi.

Dua hal yang sudah berjalan di internet, bukan di laptop:

| | Alamat |
|---|---|
| **Aplikasi (frontend)** | https://fikhry-hakim.github.io/sapa-upi-prototype/ |
| **API (backend)** | https://sapa-upi-api.sapa-upi.workers.dev |
| **Repositori** | https://github.com/Fikhry-hakim/sapa-upi-prototype (publik) |

---

## 2. Arsitektur

```text
Browser (GitHub Pages)
   │  POST { question }
   ▼
Cloudflare Worker
   ├─► Cloudflare D1  — knowledge base (sumber jawaban)
   ├─► Retrieval      — skoring IDF + stemming bahasa Indonesia
   └─► Gemini API     — menyusun jawaban, dibatasi konteks hasil retrieval
   ▼
{ answer, entry, followUps }
```

Kalau Worker atau model tidak terjangkau, browser otomatis menjawab dari pencocokan kata kunci lokal dan **menandai jawabannya "Mode offline"**. Demo tidak pernah blank.

---

## 3. Bahasa pemrograman & framework

| Komponen | Teknologi | Versi |
|---|---|---|
| Frontend | **JavaScript (ES Modules)**, HTML, CSS | — |
| Backend | **JavaScript** di Cloudflare Workers runtime | — |
| Runtime pengembangan | **Node.js** | v25.9.0 |
| Tooling deploy | **Wrangler** (CLI Cloudflare) | 4.150.0 |

**Tidak memakai framework** — tanpa React, Vue, Next.js, atau sejenisnya. Tanpa bundler, tanpa langkah build, tanpa transpiler.

**Dependensi runtime: nol.** `package.json` tidak punya satu pun `dependencies` maupun `devDependencies`; pengujian memakai modul `node:test` bawaan Node. Prototipe ini bisa dijalankan dengan satu perintah static server.

Pilihan ini disengaja untuk tahap prototipe: tidak ada rantai dependensi yang perlu dirawat, tidak ada yang usang dalam enam bulan, dan siapa pun bisa membaca seluruh kodenya tanpa memahami build system. **Kalau proyek ini dilanjutkan menjadi produk**, framework (misalnya React atau Svelte) wajar dipertimbangkan ulang — keputusan itu belum diambil.

---

## 4. Database

**Cloudflare D1** (SQLite terkelola, region APAC), nama database `sapa-upi-kb`.

Dua tabel:

Sumber isinya empat dokumen resmi: Buku Panduan Penyelesaian Tugas Akhir Prodi Bisnis Digital (April 2023), Pedoman Penulisan Karya Ilmiah UPI Edisi 2024, Pengumuman Nomor T-207/UN40.C3.4.4/PK.03.03/2026 tentang Semhas Jalur Artikel, dan Surat Nomor B-5577/UN40.C3.1/TA.07.02/2025 tentang Imbauan Pelatihan Kewirausahaan.

| Tabel | Isi |
|---|---|
| `entries` | Satu baris per topik: judul, kategori, jawaban, metadata sumber (nama dokumen, pemilik, masa berlaku, tanggal pembaruan, URL), kalimat eskalasi, tabel opsional (JSON), dan kolom `active` |
| `entry_lists` | Daftar berurut milik tiap topik: contoh pertanyaan, kata kunci, poin jawaban, pertanyaan lanjutan |

Skema lengkap: [`worker/schema.sql`](worker/schema.sql)

Dua keputusan desain yang relevan untuk tahap berikutnya:

- **Metadata sumber disimpan sebagai kolom, bukan prosa.** Sitasi dirender dari data, jadi tidak bisa dikarang model.
- **Kolom `active`.** Pedoman yang sudah diganti cukup di-nonaktifkan, tidak dihapus — berhenti dipakai menjawab tetapi riwayatnya tetap ada untuk audit.

Konsekuensinya: **menambah topik tidak perlu deploy ulang.** Cukup `INSERT`, terbaca paling lama satu menit kemudian.

---

## 5. Model AI / API

| | |
|---|---|
| Penyedia | **Google Gemini** (Gemini Developer API) |
| Model | `gemini-3.5-flash-lite` |
| Endpoint | `POST https://generativelanguage.googleapis.com/v1beta/interactions` |
| Autentikasi | Header `x-goog-api-key`, disimpan sebagai **secret di Cloudflare Worker** |
| Tier | **Free tier** |

API key tidak pernah dikirim ke browser dan tidak pernah masuk ke repositori.

### Cara jawaban dijaga supaya tidak mengarang

Tiga lapis, karena satu lapis saja tidak cukup:

1. **Retrieval dulu, baru generate.** Worker memilih maksimal 3 entri paling relevan; hanya itu yang dikirim sebagai konteks.
2. **System instruction ketat** ([`worker/src/gemini.js`](worker/src/gemini.js)): dilarang menjawab di luar konteks, dilarang mengarang angka/tanggal/nomor SK, wajib mengarahkan ke tenaga administrasi bila rujukan tidak ada.
3. **Angka tetap dari data.** Tabel syarat sidang dan metadata sumber dirender dari database, tidak ikut digenerate.

Sudah diuji: pertanyaan *"Siapa rektor UPI dan berapa nomor teleponnya?"* dan *"Berapa nomor rekening pembayaran UKT?"* dijawab dengan penolakan, bukan karangan.

### Batas yang nyata pada free tier

Ini bukan catatan kaki — ini yang akan kena duluan saat demo:

- **15 permintaan per menit.** Lewat dari itu, jawaban jatuh ke mode offline. Satu kelas berisi puluhan mahasiswa yang bertanya bersamaan akan menembusnya.
- **Kapasitas model gratis diantre saat Google padat**, dengan balasan *"currently experiencing high load"*. Pada 13 Oktober 2026 kondisi ini berlangsung berjam-jam dan membuat jalur LLM tidak terpakai.
- **Cloudflare Worker tidak punya lokasi keluar tetap**, sehingga sebagian permintaan ditolak Google dengan *"User location is not supported"*. Sudah ditangani dengan percobaan ulang otomatis.

Mengaktifkan billing (Tier 1) menghapus batas 15/menit dan memberi prioritas kapasitas. Perkiraan biaya untuk beban ini sekitar **Rp 11 per pertanyaan**. Keputusan ini **belum diambil**.

---

## 6. Retrieval

Belum memakai *embedding* atau vector database. Yang dipakai sekarang adalah skoring kata kunci buatan sendiri di [`lib/search.js`](lib/search.js), dengan beberapa hal yang membuatnya tidak asal cocok:

- **IDF** — kata yang muncul di banyak entri (`tugas`, `akhir`) berbobot lebih kecil daripada kata yang membedakan (`sidang`, `yudisium`).
- **Satu hitungan per field** — entri tidak bisa menang hanya karena mengulang satu kata.
- **Istilah majemuk** — "tugas akhir" dihitung satu konsep, bukan dua kata.
- **Stemming imbuhan Indonesia** — "persyaratan pendaftaran" di dokumen bertemu "syarat daftar" yang diketik mahasiswa.
- **Cakupan pertanyaan** — entri yang menjawab seluruh pertanyaan menang atas yang hanya cocok di satu kata.

Ini cukup untuk knowledge base kecil yang kata kuncinya dikurasi manual. **Tidak akan cukup untuk ratusan halaman PDF** — lihat bagian 9.

---

## 7. Hosting & deployment

| Bagian | Platform | Cara deploy |
|---|---|---|
| Frontend | **GitHub Pages** | Otomatis saat push ke `main` |
| Backend | **Cloudflare Workers** | `npx wrangler deploy` |
| Database | **Cloudflare D1** | `npx wrangler d1 execute` |

Keduanya pada tier gratis.

---

## 8. Pengujian

**64 pengujian**, seluruhnya lulus. Dijalankan dengan `npm test` (memakai `node --test`, tanpa framework pengujian pihak ketiga).

Cakupannya mencakup skoring retrieval, penyusunan prompt dan parsing respons Gemini, perilaku cadangan saat database gagal, serta beberapa pengujian yang mengunci keputusan kejujuran produk — misalnya satu pengujian gagal bila ada tombol tanpa perilaku, dan satu lagi gagal bila identitas mahasiswa palsu muncul kembali di halaman.

---

## 9. Yang BELUM ditentukan atau belum ada

Bagian ini sama pentingnya dengan yang di atas. Jangan dianggap sudah selesai:

| Hal | Status |
|---|---|
| **Autentikasi** | Belum ada. Mahasiswa memakai sistem secara anonim, tanpa login — ini disengaja. Login baru diperlukan untuk pengelola dokumen. |
| **Hak akses pengelola** | Sudah diputuskan **siapa**-nya: hanya **dosen TPTA dan staf TU**, bukan semua dosen. Implementasinya belum ada. Rencana: tabel penugasan (email → peran), diverifikasi di sisi server, tidak pernah dari browser. |
| **Unggah dokumen** | Belum ada. Pedoman masih diketik manual ke knowledge base. |
| **Pencarian semantik (embedding)** | Belum ada. Diperlukan begitu dokumen asli diunggah. Kandidat: Cloudflare Vectorize. |
| **Penyimpanan berkas** | Belum ada. Kandidat: Cloudflare R2. |
| **Versi & masa berlaku dokumen** | Kolom `active` sudah ada, alur peninjauan dan penggantian versi belum. |
| **Integrasi SIAKAD** | Tidak ada, dan tidak disimulasikan. Tombol unggah transkrip/KRS secara eksplisit menyatakan dirinya belum tersedia. |
| **Rate limiting endpoint publik** | Belum dipasang. Endpoint API bisa dipanggil siapa saja. |
| **Framework frontend** | Sengaja tidak dipakai di tahap prototipe; belum diputuskan untuk tahap produk. |
| **Billing Gemini (Tier 1)** | Belum diaktifkan. |
| **Versi mobile (frame MOBILE di Figma)** | Belum dikerjakan. Tampilan saat ini responsif, tetapi bukan hasil implementasi desain mobile. |

---

## 10. Batasan yang harus disebutkan

- Knowledge base memuat kutipan dari **empat dokumen resmi** (lihat bagian 4), tetapi **belum mencakup seluruh isi** dokumen tersebut. Topik di luar itu ditolak, bukan dijawab.
- Jawaban **belum melalui peninjauan tenaga akademik** dan tidak bisa dijadikan dasar keputusan resmi. Keputusan resmi tetap pada program studi.
- Dua dokumen sumber menyebut batas uji similaritas yang berbeda (di bawah 25% versus maksimal 35%). Asisten menyampaikan keduanya beserta dokumen asalnya, bukan memilih salah satu.

---

## 11. Struktur repositori

```text
.
├── index.html             # satu halaman, seluruh antarmuka
├── app.js                 # logika antarmuka
├── style.css
├── config.js              # alamat Worker
├── data/
│   └── knowledge-base.js  # benih D1 + cadangan offline browser
├── lib/
│   ├── search.js          # skoring retrieval
│   └── chat-engine.js     # mesin jawaban mode offline
├── worker/
│   ├── wrangler.toml      # konfigurasi & binding
│   ├── schema.sql         # skema D1
│   ├── seed.mjs           # knowledge-base.js -> SQL
│   └── src/
│       ├── index.js            # HTTP, CORS, validasi
│       ├── knowledge-store.js  # baca knowledge base dari D1
│       └── gemini.js           # prompt & parsing respons
└── tests/                 # 64 pengujian
```

Sekitar 3.600 baris kode, 24 commit. Dokumentasi teknis lengkap ada di [`README.md`](README.md).
