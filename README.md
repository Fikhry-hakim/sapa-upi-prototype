# SAPA UPI Prototype

SAPA UPI adalah prototipe asisten informasi akademik untuk Program Studi Bisnis Digital. Prototipe ini menunjukkan alur ketika mahasiswa menyampaikan pertanyaan dengan bahasa sehari-hari, sistem mencocokkannya dengan *knowledge base* contoh, lalu menampilkan jawaban beserta sumber informasi pendukung.

## Menjalankan prototipe

Kebutuhan:

- Python 3 untuk menjalankan server lokal
- Browser modern
- Node.js untuk menjalankan pengujian otomatis

Dari direktori proyek, jalankan:

```bash
python3 -m http.server 4173
```

Kemudian buka `http://localhost:4173` pada browser. Jangan membuka `index.html` secara langsung karena modul JavaScript memerlukan server HTTP.

Untuk menjalankan seluruh pengujian:

```bash
npm run verify
```

## Cara kerja prototipe

Alur demonstrasi terdiri atas tiga komponen:

1. **Knowledge Base** menyimpan pertanyaan, jawaban, kategori, pemilik informasi, periode berlaku, tanggal pembaruan, dan arahan klarifikasi.
2. **Smart Search** menormalisasi kalimat, mengenali beberapa variasi istilah, dan memberi skor kecocokan untuk memilih jawaban atau menawarkan klarifikasi.
3. **AI Assistant** menyediakan antarmuka percakapan, menampilkan hasil pencarian, sumber informasi contoh, dan arahan ketika jawaban belum ditemukan.

Pencarian pada versi ini masih berupa simulasi deterministik yang berjalan sepenuhnya di browser. Sistem belum memakai model bahasa atau RAG yang sebenarnya. Pada pengembangan lanjutan, RAG dapat mengambil potongan dokumen resmi yang relevan dan model bahasa dapat menyusun jawaban natural dengan tetap menyertakan sumber. Integrasi tersebut baru layak dilakukan setelah sumber data, hak akses, pembaruan dokumen, evaluasi jawaban, dan biaya operasional disepakati.

## Skenario demonstrasi

| Skenario | Pertanyaan | Hasil yang diharapkan |
| --- | --- | --- |
| Jawaban ditemukan | `Di mana saya dapat melihat jadwal kuliah?` | Sistem menampilkan jawaban, tingkat kecocokan, metadata sumber informasi, dan arahan klarifikasi. |
| Variasi bahasa | `Gimana mulai TA?` | Sistem mengenali bentuk informal dan menampilkan topik Tugas Akhir. |
| Pertanyaan ambigu | `informasi berkas sidang` | Sistem menawarkan dua topik yang berdekatan agar pengguna memilih maksud yang tepat. |
| Di luar cakupan | `Di mana beli tiket konser?` | Sistem tidak mengarang jawaban dan mengarahkan pengguna ke sumber atau pihak yang berwenang. |

Kategori di sisi kiri juga dapat dipilih untuk menampilkan pertanyaan contoh berdasarkan topik. Tombol **Mulai ulang** membersihkan percakapan dan mengembalikan pesan pembuka.

## Batasan prototipe

- Seluruh isi, tautan, dan metadata merupakan data demonstrasi.
- Prototipe belum terhubung ke sistem atau dokumen resmi UPI.
- Tidak ada autentikasi, penyimpanan riwayat, transaksi akademik, atau pengelolaan hak akses.
- Pemeringkatan dilakukan dengan aturan lokal, bukan pencarian semantik berbasis model.
- Jawaban belum melalui evaluasi tenaga akademik dan tidak dapat dijadikan keputusan resmi.
- Pembaruan informasi dilakukan dengan mengubah data contoh pada `data/knowledge-base.js`.

## Naskah presentasi singkat untuk dosen

> Permasalahan yang kami angkat bukan hanya informasi yang sulit dicari. Mahasiswa juga melakukan konfirmasi berulang karena belum yakin apakah jawaban yang diterima sesuai dengan sumber informasi dan periode yang berlaku. Hal ini menambah beban komunikasi dosen serta tenaga administrasi.
>
> Solusi awalnya adalah membentuk *knowledge base* terstruktur seperti FAQ, tetapi jawabannya dilengkapi pemilik informasi, periode berlaku, tanggal pembaruan, dan arahan klarifikasi. Di atas data tersebut, *smart search* membantu mencocokkan bahasa pertanyaan mahasiswa dengan topik yang tersedia. Antarmuka percakapan membuat akses lebih mudah tanpa menghilangkan rujukan sumber.
>
> Prototipe yang kami demonstrasikan saat ini mensimulasikan alur itu secara lokal. Kami sengaja belum mengklaim integrasi dengan sistem resmi, RAG, atau model bahasa. Tahap berikutnya adalah memvalidasi kebutuhan pengguna dan kualitas sumber. Jika hasilnya layak, RAG dapat dipakai untuk mengambil bagian dokumen yang relevan, sedangkan model bahasa membantu memahami pertanyaan variatif dan menyusun jawaban yang tetap berlandaskan sumber.

## Struktur proyek

```text
.
├── index.html
├── style.css
├── app.js
├── data/
│   └── knowledge-base.js
├── lib/
│   ├── chat-engine.js
│   └── search.js
└── tests/
```

Prototipe tidak memerlukan dependensi eksternal dan dapat berjalan tanpa koneksi internet setelah server lokal aktif.
