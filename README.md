# SAPA UPI — AI Academic Hub

Prototipe asisten informasi akademik untuk Program Studi Bisnis Digital. Mahasiswa bertanya dengan bahasa sehari-hari, sistem mengambil rujukan dari *knowledge base*, lalu Gemini menyusun jawabannya dengan tetap menyebut sumber.

**Demo:** https://fikhry-hakim.github.io/sapa-upi-prototype/

## Arsitektur

```text
Browser (GitHub Pages)
   │  POST { question }
   ▼
Cloudflare Worker  ──► retrieval dari knowledge-base.js (pencocokan kata kunci)
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
| `GEMINI_MODEL` | Model yang dipakai. Default `gemini-3.5-flash-lite` (hemat kuota). Ganti ke `gemini-3.8-flash` kalau mau jawaban lebih bagus. |
| `ALLOWED_ORIGINS` | Daftar origin yang boleh memanggil API, dipisah koma. Wajib diisi origin GitHub Pages kamu. |
| `GEMINI_API_KEY` | **Secret**, bukan var. Diisi lewat `wrangler secret put`. |

Daftar model terbaru: https://ai.google.dev/gemini-api/docs/models — model lama seperti `gemini-2.0-flash` sudah dimatikan, jadi cek berkala kalau Worker tiba-tiba balas error.

## Cara menjaga jawaban tetap berdasar

Tiga lapis pengaman supaya model tidak mengarang:

1. **Retrieval dulu, baru generate.** Worker memilih maksimal 3 entri paling relevan dari `data/knowledge-base.js`, dan hanya itu yang dikirim sebagai konteks.
2. **System instruction ketat** (`worker/src/gemini.js`): dilarang menjawab di luar konteks, dilarang mengarang angka/tanggal/nomor SK, dan wajib mengarahkan ke tenaga administrasi kalau rujukannya tidak ada.
3. **Angka tetap dari data, bukan dari model.** Tabel syarat sidang dan metadata sumber dirender dari knowledge base, tidak ikut digenerate.

## Menambah topik

Tambahkan entri baru di `data/knowledge-base.js`. Setiap entri butuh `questions`, `keywords`, `answer`, metadata sumber, dan `followUps`. Retrieval dan LLM langsung memakainya tanpa perubahan kode lain.

## Batasan prototipe

- Seluruh isi, tautan, dan metadata merupakan **data demonstrasi**, bukan dokumen resmi UPI.
- Data mahasiswa (nama, NIM, IPK, SKS) adalah contoh yang di-hardcode.
- Belum ada autentikasi, penyimpanan riwayat, maupun integrasi SIAKAD.
- Retrieval memakai pencocokan kata kunci, belum pencarian semantik (*embedding*).
- Jawaban belum melalui evaluasi tenaga akademik dan tidak dapat dijadikan keputusan resmi.
- Endpoint Worker belum dibatasi rate limit. Untuk demo publik yang ramai, aktifkan *Rate limiting rules* di dashboard Cloudflare.

## Struktur proyek

```text
.
├── index.html
├── style.css
├── app.js
├── config.js              # alamat Worker
├── data/
│   ├── knowledge-base.js  # sumber jawaban
│   └── student-data.js    # profil mahasiswa (contoh)
├── lib/
│   ├── chat-engine.js     # fallback offline
│   └── search.js          # skoring retrieval
├── worker/
│   ├── wrangler.toml
│   └── src/
│       ├── index.js       # HTTP, CORS, validasi
│       └── gemini.js      # prompt & parsing respons
└── tests/
```
