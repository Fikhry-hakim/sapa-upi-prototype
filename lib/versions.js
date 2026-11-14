/**
 * Rantai versi dokumen untuk tabel Knowledge Base.
 *
 * Basis data hanya menyimpan satu arah: dokumen baru menunjuk ke yang digantikannya
 * (`supersedes`) atau ke yang dihubungkan (`relatedTo`). Di sini arah sebaliknya
 * dihitung dari daftar dokumen, supaya pengelola bisa melihat "versi ke berapa dari
 * berapa" dan "digantikan oleh apa" tanpa membuka dokumennya satu per satu.
 * Rujukan ke dokumen yang sudah dihapus dan rantai yang berputar tidak boleh merusak tabel.
 */

/** Dokumen yang dituju sebuah id, atau penanda "sudah dihapus" supaya tetap bisa ditampilkan. */
function resolve(id, byId) {
  return byId.get(id) ?? { id, title: id, missing: true };
}

/**
 * @returns {{ inChain: boolean, number: number, total: number,
 *             replaces: object|null, replacedBy: object[], related: object[] }}
 */
export function versionInfo(doc, docs) {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const successors = (id) => docs.filter((d) => d.supersedes === id);

  // Ke belakang: berapa dokumen yang digantikan berantai sampai sini.
  let number = 1;
  const seenBack = new Set([doc.id]);
  for (let cursor = doc; cursor.supersedes && byId.has(cursor.supersedes) && !seenBack.has(cursor.supersedes); ) {
    cursor = byId.get(cursor.supersedes);
    seenBack.add(cursor.id);
    number += 1;
  }

  // Ke depan: berapa versi lagi sesudah dokumen ini (mengikuti yang pertama bila bercabang).
  let total = number;
  // Dimulai dari leluhur yang sudah terhitung, supaya rantai yang berputar tidak menghitung dokumen dua kali.
  const seenForward = new Set(seenBack);
  for (let next = successors(doc.id)[0]; next && !seenForward.has(next.id); next = successors(next.id)[0]) {
    seenForward.add(next.id);
    total += 1;
  }

  const replacedBy = successors(doc.id);
  const related = [
    ...(doc.relatedTo ? [resolve(doc.relatedTo, byId)] : []),
    ...docs.filter((d) => d.relatedTo === doc.id),
  ];

  return {
    inChain: Boolean(doc.supersedes) || replacedBy.length > 0,
    number,
    total,
    replaces: doc.supersedes ? resolve(doc.supersedes, byId) : null,
    replacedBy,
    related,
  };
}

/** Nama dokumen untuk ditampilkan; dokumen yang sudah dihapus diberi keterangan. */
export function versionLabel(doc) {
  return doc.missing ? `${doc.title} (sudah dihapus)` : doc.title;
}
