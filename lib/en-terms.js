/**
 * Pertanyaan berbahasa Inggris -> kata kunci Indonesia untuk pencarian.
 *
 * Basis pengetahuan ini berbahasa Indonesia, jadi "When is the deadline for
 * academic leave?" tidak punya satu kata pun yang sama dengan topiknya. Fungsi
 * ini hanya dipakai untuk MENCARI; pertanyaan asli tetap dikirim ke model apa
 * adanya, dan jawabannya ditulis dalam bahasa pilihan pembaca.
 *
 * Istilah yang tidak dikenal dibiarkan. Singkatan huruf kapital dan tahun
 * (UTS, IRS, MSIB, 2023) dibawa apa adanya karena sama di kedua bahasa.
 */

const TERMS = [
  [/\bacademic leave|leave of absence|take a leave|\bleave\b/i, "cuti akademik"],
  [/\bdeadline|due date|last day|cut-?off/i, "batas akhir"],
  [/\bwhen\b/i, "kapan"],
  [/\bhow (do|can|to)\b|\bhow\b/i, "bagaimana"],
  [/\brequirements?|conditions|prerequisites?|eligib/i, "syarat persyaratan"],
  [/\bschedule|timetable|dates?\b|timeline/i, "jadwal"],
  [/\btuition|\bfees?\b|school fees|\bukt\b/i, "UKT biaya"],
  [/\bpay(ment|ing)?\b/i, "pembayaran"],
  [/\bregist(er|ration)|enrol/i, "registrasi"],
  [/\bstudy plan|course (registration|enrol|selection)|choose courses|\birs\b/i, "IRS isian rencana studi"],
  [/\bacademic (advis|guardian)|guardian lecturer|\bpa lecturer/i, "dosen pembimbing akademik perwalian"],
  [/\bmid-?term|mid-?semester/i, "UTS ujian tengah semester"],
  [/\bfinal exam|\bfinals\b|end-?of-?semester exam/i, "UAS ujian akhir semester"],
  [/\bexams?\b|\btests?\b/i, "ujian"],
  [/\bre-?take|\bresit|make-?up exam|remedial/i, "ujian ulang remedial"],
  [/\bgrades?\b|\bscores?\b/i, "nilai"],
  [/\bgraduat(ion|e)|commencement|convocation/i, "wisuda kelulusan"],
  [/\bthesis|undergraduate research|skripsi/i, "skripsi"],
  [/\bfinal (project|assignment)|capstone/i, "tugas akhir"],
  [/\barticle (track|route|path)|journal article|publication/i, "jalur artikel artikel ilmiah"],
  [/\bappropriate technology|\bttg\b/i, "teknologi tepat guna TTG"],
  [/\bsupervisors?|advisors?|mentors?\b/i, "pembimbing dosen pembimbing"],
  [/\bproposal/i, "seminar proposal"],
  [/\bresults? seminar|seminar of results/i, "seminar hasil"],
  [/\bdefen[sc]e|thesis exam|final session/i, "ujian sidang"],
  [/\bdress ?code|attire|clothes|what to wear/i, "ketentuan berpakaian pakaian"],
  [/\bsimilarity|plagiari|turnitin/i, "uji similaritas plagiat turnitin"],
  [/\breferences?|bibliograph/i, "referensi"],
  [/\bformat|\bfont\b|margin|spacing|layout/i, "format penulisan"],
  [/\bcitations?|citing/i, "sitasi"],
  [/\bscholarships?/i, "beasiswa"],
  [/\binternship|apprentice|work placement/i, "magang MSIB"],
  [/\bindependent stud/i, "studi independen"],
  [/\bshort semester|intermediate semester|summer (term|semester)|semester break/i, "semester antara semester padat"],
  [/\bcalendar/i, "kalender akademik"],
  [/\badmission|new students?|enrol+ing|apply to (upi|the university)/i, "penerimaan mahasiswa baru"],
  [/\blectures?\b|\bclasses\b|start of (the )?semester|first day of/i, "awal perkuliahan"],
  [/\bend of (the )?(semester|classes|lectures)/i, "akhir perkuliahan"],
  [/\b(semester|classes|lectures?|term) (start|begin)|\bbegin(s|ning)? of (the )?(semester|term)/i, "awal perkuliahan"],
  [/\bcourses?\b|\bsubjects?\b|\bcurriculum/i, "mata kuliah"],
  [/\bclass of\b|\bbatch\b|\bcohort/i, "angkatan"],
  [/\bscopus/i, "scopus akses"],
  [/\bannouncement/i, "pengumuman"],
  [/\bcircular/i, "surat edaran"],
  [/\bonline\b/i, "daring"],
  [/\bcontact|who (should|do) i (ask|call|contact)/i, "hubungi"],
  [/\bcertificate|competency/i, "sertifikasi kompetensi"],
  [/\bpenalt|sanction/i, "sanksi"],
  [/\bartificial intelligence|\bai\b|chatgpt/i, "penggunaan AI"],
];

/** Kata kunci Indonesia untuk pertanyaan berbahasa Inggris; pertanyaan asli kalau tak ada padanan. */
export function toIndonesianQuery(question) {
  const text = String(question ?? "");
  const found = [];
  for (const [pattern, indonesian] of TERMS) if (pattern.test(text)) found.push(indonesian);
  if (!found.length) return text;
  const kept = text.match(/\b[A-Z]{2,}[A-Za-z]*\b|\b\d{4}(\/\d{4})?\b/g) ?? [];
  return [...new Set([...found, ...kept])].join(" ");
}
