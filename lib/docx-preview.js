/**
 * Pratinjau berkas Word (.docx) langsung di browser, tanpa pustaka luar.
 *
 * .docx adalah arsip zip berisi XML. Modul ini membaca arsipnya (DecompressionStream
 * bawaan browser), lalu mengubah word/document.xml menjadi elemen HTML: paragraf,
 * cetak tebal/miring/garis bawah, ukuran dan warna huruf, perataan, daftar, dan tabel
 * (termasuk sel gabungan). Yang tidak didukung (gambar, kotak teks, bidang) dilewati.
 *
 * Semua teks dipasang lewat textContent, tidak pernah innerHTML, jadi isi berkas
 * tidak bisa menyisipkan skrip ke halaman.
 */

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/* ------------------------------------------------------------------ zip */

const u16 = (view, at) => view.getUint16(at, true);
const u32 = (view, at) => view.getUint32(at, true);

/** Daftar isi arsip: nama -> { method, size, offset }. */
export function readZipDirectory(buffer) {
  const view = new DataView(buffer);
  // End Of Central Directory: dicari dari belakang (komentar zip bisa mendorongnya).
  let eocd = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i -= 1) {
    if (u32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Bukan berkas zip");

  const count = u16(view, eocd + 10);
  let at = u32(view, eocd + 16);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const entries = new Map();

  for (let n = 0; n < count; n += 1) {
    if (u32(view, at) !== 0x02014b50) throw new Error("Daftar isi zip rusak");
    const method = u16(view, at + 10);
    const size = u32(view, at + 20);
    const nameLength = u16(view, at + 28);
    const extraLength = u16(view, at + 30);
    const commentLength = u16(view, at + 32);
    const offset = u32(view, at + 42);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    entries.set(name, { method, size, offset });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** Isi satu berkas di dalam arsip sebagai teks. */
export async function readZipText(buffer, entries, name) {
  const entry = entries.get(name);
  if (!entry) return null;

  const view = new DataView(buffer);
  if (u32(view, entry.offset) !== 0x04034b50) throw new Error("Header berkas zip rusak");
  const start = entry.offset + 30 + u16(view, entry.offset + 26) + u16(view, entry.offset + 28);
  const packed = new Uint8Array(buffer, start, entry.size);

  if (entry.method === 0) return new TextDecoder().decode(packed);
  if (entry.method !== 8) throw new Error(`Kompresi zip ${entry.method} tidak didukung`);

  const stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

/* ------------------------------------------------------------------ xml */

const children = (node, name) => [...node.childNodes].filter((child) => child.localName === name && child.namespaceURI === W);
const child = (node, name) => children(node, name)[0] ?? null;
const attr = (node, name) => node?.getAttributeNS(W, name) ?? node?.getAttribute(`w:${name}`) ?? null;

/** Nilai sakelar Word: <w:b/> berarti nyala, <w:b w:val="0"/> berarti mati. */
function flag(props, name) {
  const node = props ? child(props, name) : null;
  if (!node) return false;
  const value = attr(node, "val");
  return !(value === "0" || value === "false" || value === "none");
}

function applyRunStyle(el, props) {
  if (!props) return;
  if (flag(props, "b")) el.style.fontWeight = "700";
  if (flag(props, "i")) el.style.fontStyle = "italic";
  if (flag(props, "u")) el.style.textDecoration = "underline";
  if (flag(props, "strike")) el.style.textDecoration = `${el.style.textDecoration} line-through`.trim();
  if (flag(props, "caps")) el.style.textTransform = "uppercase";

  const size = attr(child(props, "sz"), "val");
  if (size && /^\d+$/.test(size)) el.style.fontSize = `${Number(size) / 2}pt`;

  const color = attr(child(props, "color"), "val");
  if (color && /^[0-9a-f]{6}$/i.test(color)) el.style.color = `#${color}`;

  const vertical = attr(child(props, "vertAlign"), "val");
  if (vertical === "superscript") el.style.verticalAlign = "super";
  if (vertical === "subscript") el.style.verticalAlign = "sub";
}

function renderRun(run) {
  const span = document.createElement("span");
  applyRunStyle(span, child(run, "rPr"));
  let any = false;

  for (const part of run.childNodes) {
    if (part.namespaceURI !== W) continue;
    if (part.localName === "t" || part.localName === "delText") {
      span.append(part.textContent);
      any = true;
    } else if (part.localName === "tab") {
      span.append(" ");
      any = true;
    } else if (part.localName === "br" || part.localName === "cr") {
      span.append(document.createElement("br"));
      any = true;
    } else if (part.localName === "noBreakHyphen") {
      span.append("‑");
      any = true;
    }
  }
  return any ? span : null;
}

function appendInline(target, node) {
  for (const item of node.childNodes) {
    if (item.namespaceURI !== W) continue;
    if (item.localName === "r") {
      const run = renderRun(item);
      if (run) target.append(run);
    } else if (["hyperlink", "ins", "smartTag", "sdt", "sdtContent", "fldSimple"].includes(item.localName)) {
      appendInline(target, item);
    }
  }
}

const ALIGN = { left: "left", start: "left", right: "right", end: "right", center: "center", both: "justify", distribute: "justify" };

function renderParagraph(paragraph, counters) {
  const el = document.createElement("p");
  el.className = "docx-p";
  const props = child(paragraph, "pPr");

  const align = ALIGN[attr(props ? child(props, "jc") : null, "val")];
  if (align) el.style.textAlign = align;

  const indent = props ? child(props, "ind") : null;
  const left = Number(attr(indent, "left") ?? attr(indent, "start") ?? 0);
  if (left > 0) el.style.marginLeft = `${(left / 20).toFixed(1)}pt`;
  const hanging = Number(attr(indent, "hanging") ?? 0);
  if (hanging > 0) el.style.textIndent = `-${(hanging / 20).toFixed(1)}pt`;

  const spacing = props ? child(props, "spacing") : null;
  const after = attr(spacing, "after");
  if (after && /^\d+$/.test(after)) el.style.marginBottom = `${Math.min(Number(after) / 20, 24)}pt`;
  const before = attr(spacing, "before");
  if (before && /^\d+$/.test(before)) el.style.marginTop = `${Math.min(Number(before) / 20, 24)}pt`;

  // Daftar: Word menyimpan nomornya di numbering.xml; di sini cukup penanda sederhana.
  const numbering = props ? child(props, "numPr") : null;
  if (numbering) {
    const id = attr(child(numbering, "numId"), "val");
    const level = Number(attr(child(numbering, "ilvl"), "val") ?? 0);
    const mark = document.createElement("span");
    mark.className = "docx-mark";
    if (id && id !== "0") {
      const key = `${id}:${level}`;
      counters.set(key, (counters.get(key) ?? 0) + 1);
      mark.textContent = level === 0 ? `${counters.get(key)}.` : "•";
    } else {
      mark.textContent = "•";
    }
    el.append(mark, " ");
    el.style.paddingLeft = `${level * 18}pt`;
  }

  appendInline(el, paragraph);
  if (!el.textContent.trim() && !el.querySelector("br")) el.classList.add("docx-empty");
  return el;
}

function renderTable(table, counters) {
  const el = document.createElement("table");
  el.className = "docx-table";
  const body = document.createElement("tbody");
  const rows = children(table, "tr");

  // vMerge: sel "restart" membentang ke bawah sepanjang sel "continue" di kolom yang sama.
  const span = new Map();
  rows.forEach((row, rowIndex) => {
    let column = 0;
    for (const cell of children(row, "tc")) {
      const props = child(cell, "tcPr");
      const merge = props ? child(props, "vMerge") : null;
      const mergeKind = merge ? attr(merge, "val") ?? "continue" : null;
      const columns = Number(attr(props ? child(props, "gridSpan") : null, "val") ?? 1);
      const key = column;
      if (mergeKind === "restart") span.set(key, { rowIndex, count: 1 });
      else if (mergeKind === "continue" && span.has(key)) span.get(key).count += 1;
      column += columns;
    }
  });

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    let column = 0;
    for (const cell of children(row, "tc")) {
      const props = child(cell, "tcPr");
      const merge = props ? child(props, "vMerge") : null;
      const mergeKind = merge ? attr(merge, "val") ?? "continue" : null;
      const columns = Number(attr(props ? child(props, "gridSpan") : null, "val") ?? 1);
      const key = column;
      column += columns;
      if (mergeKind === "continue") continue;

      const td = document.createElement("td");
      if (columns > 1) td.colSpan = columns;
      if (mergeKind === "restart" && span.get(key)?.rowIndex === rowIndex) td.rowSpan = span.get(key).count;

      const width = Number(attr(props ? child(props, "tcW") : null, "w") ?? 0);
      if (width > 0 && attr(child(props, "tcW"), "type") === "dxa") td.style.width = `${(width / 20).toFixed(0)}pt`;

      const shade = attr(props ? child(props, "shd") : null, "fill");
      if (shade && /^[0-9a-f]{6}$/i.test(shade)) td.style.background = `#${shade}`;

      renderBlocks(cell, td, counters);
      if (!td.childNodes.length) td.append(document.createElement("br"));
      tr.append(td);
    }
    body.append(tr);
  });

  el.append(body);
  return el;
}

function renderBlocks(container, target, counters) {
  for (const block of container.childNodes) {
    if (block.namespaceURI !== W) continue;
    if (block.localName === "p") target.append(renderParagraph(block, counters));
    else if (block.localName === "tbl") target.append(renderTable(block, counters));
    else if (block.localName === "sdt") {
      const content = child(block, "sdtContent");
      if (content) renderBlocks(content, target, counters);
    }
  }
}

/** Ubah isi document.xml menjadi elemen HTML. */
export function renderDocumentXml(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("document.xml tidak terbaca");

  const body = doc.getElementsByTagNameNS(W, "body")[0];
  if (!body) throw new Error("Isi dokumen tidak ditemukan");

  const page = document.createElement("article");
  page.className = "docx-page";
  renderBlocks(body, page, new Map());
  return page;
}

/** Berkas .docx (ArrayBuffer) -> elemen HTML siap ditampilkan. */
export async function renderDocx(buffer) {
  const entries = readZipDirectory(buffer);
  const xml = await readZipText(buffer, entries, "word/document.xml");
  if (!xml) throw new Error("Bukan berkas Word (.docx)");
  return renderDocumentXml(xml);
}
