/**
 * Pembuat berkas .xlsx tanpa pustaka luar.
 *
 * .xlsx adalah arsip ZIP berisi beberapa XML. Arsip dibuat tanpa kompresi
 * ("stored"), yang sah menurut spesifikasi ZIP dan dibuka Excel, LibreOffice,
 * dan Google Sheets. Teks ditulis sebagai inline string, jadi tidak perlu
 * tabel string bersama.
 */

const encoder = new TextEncoder();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Arsip ZIP tanpa kompresi dari daftar { name, data: Uint8Array }. */
export function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;

  const u16 = (value) => Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
  const u32 = (value) => Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
  const push = (...parts) => {
    for (const part of parts) {
      chunks.push(part);
      offset += part.length;
    }
  };

  for (const { name, data } of files) {
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    const headerOffset = offset;
    // Bit 11 (0x0800): nama berkas berupa UTF-8.
    push(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data);
    central.push({ nameBytes, crc, size: data.length, headerOffset });
  }

  const centralStart = offset;
  for (const entry of central) {
    push(
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
      u32(entry.crc), u32(entry.size), u32(entry.size),
      u16(entry.nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(entry.headerOffset), entry.nameBytes,
    );
  }
  const centralSize = offset - centralStart;
  push(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(centralSize), u32(centralStart), u16(0));

  const out = new Uint8Array(offset);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

const escapeXml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Karakter kontrol XML 1.0 yang dilarang membuat Excel menolak berkas.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

/** "A", "B", ... "Z", "AA" untuk indeks kolom berbasis 0. */
export function columnName(index) {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

/** Nama lembar: maksimal 31 karakter, tanpa : \ / ? * [ ]. */
export function sheetName(name, index) {
  const clean = String(name).replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31);
  return clean || `Lembar ${index + 1}`;
}

/* ------------------------------------------------------------ gaya sel */

const hex = (color) => String(color ?? "000000").replace("#", "").toUpperCase();

/**
 * Daftar gaya yang dipakai satu buku. Setiap kombinasi unik (huruf, isian,
 * garis tepi, perataan) mendapat satu nomor xf; gaya yang sama dipakai ulang.
 * spec: { bold, size, color, fill, border, align, valign, wrap, italic }
 */
class StyleBook {
  constructor() {
    this.fonts = ['<font><sz val="11"/><name val="Calibri"/></font>'];
    this.fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
    this.borders = ["<border><left/><right/><top/><bottom/><diagonal/></border>"];
    this.xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
    this.seen = new Map();
  }

  index(list, xml) {
    const at = list.indexOf(xml);
    if (at >= 0) return at;
    list.push(xml);
    return list.length - 1;
  }

  id(spec = {}) {
    const key = JSON.stringify(spec);
    if (this.seen.has(key)) return this.seen.get(key);

    const font = this.index(
      this.fonts,
      `<font>${spec.bold ? "<b/>" : ""}${spec.italic ? "<i/>" : ""}<sz val="${spec.size ?? 11}"/><color rgb="FF${hex(spec.color ?? "111827")}"/><name val="Calibri"/></font>`,
    );
    const fill = spec.fill
      ? this.index(this.fills, `<fill><patternFill patternType="solid"><fgColor rgb="FF${hex(spec.fill)}"/><bgColor indexed="64"/></patternFill></fill>`)
      : 0;
    const side = (name) => `<${name} style="thin"><color rgb="FF${hex(spec.border)}"/></${name}>`;
    const border = spec.border
      ? this.index(this.borders, `<border>${side("left")}${side("right")}${side("top")}${side("bottom")}<diagonal/></border>`)
      : 0;
    const align = `<alignment horizontal="${spec.align ?? "general"}" vertical="${spec.valign ?? "center"}"${spec.wrap ? ' wrapText="1"' : ""}/>`;
    const xf = `<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${align}</xf>`;
    const id = this.index(this.xfs, xf);
    this.seen.set(key, id);
    return id;
  }

  xml() {
    const block = (tag, items) => `<${tag} count="${items.length}">${items.join("")}</${tag}>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${block("fonts", this.fonts)}${block("fills", this.fills)}${block("borders", this.borders)}<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>${block("cellXfs", this.xfs)}<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }
}

/** Tandai sebuah baris agar tercetak tebal. */
export function bold(row) {
  return row.map((cell) => (cell !== null && typeof cell === "object" ? cell : { v: cell, s: { bold: true } }));
}

/** "B4:E6" -> { c1, r1, c2, r2 } berbasis 0. */
function parseRange(range) {
  const cell = (ref) => {
    const [, letters, digits] = /^([A-Z]+)(\d+)$/.exec(ref);
    let col = 0;
    for (const ch of letters) col = col * 26 + (ch.charCodeAt(0) - 64);
    return { c: col - 1, r: Number(digits) - 1 };
  };
  const [from, to = range.split(":")[0]] = range.split(":");
  const a = cell(from);
  const b = cell(to);
  return { c1: a.c, r1: a.r, c2: b.c, r2: b.r };
}

/* ------------------------------------------------------------ lembar */

/**
 * Isi sel boleh berupa nilai biasa atau { v, s: spec }. Sel yang tercakup
 * penggabungan diisi gaya yang sama supaya garis tepi dan latarnya utuh.
 */
function sheetXml(sheet, styles) {
  const grid = new Map(); // "r,c" -> { v, s }
  const put = (r, c, cell) => grid.set(`${r},${c}`, cell);

  sheet.rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === "" || cell === null || cell === undefined) return;
      put(r, c, cell !== null && typeof cell === "object" ? cell : { v: cell, s: {} });
    }),
  );
  for (const range of sheet.merges ?? []) {
    const { c1, r1, c2, r2 } = parseRange(range);
    const first = grid.get(`${r1},${c1}`) ?? { v: "", s: {} };
    for (let r = r1; r <= r2; r += 1) {
      for (let c = c1; c <= c2; c += 1) {
        if (r === r1 && c === c1) continue;
        if (!grid.has(`${r},${c}`)) put(r, c, { v: "", s: first.s });
      }
    }
  }

  const rowsUsed = Math.max(sheet.rows.length, ...[...grid.keys()].map((k) => Number(k.split(",")[0]) + 1), 0);
  const body = [];
  for (let r = 0; r < rowsUsed; r += 1) {
    const cells = [];
    const colsInRow = [...grid.keys()].filter((k) => Number(k.split(",")[0]) === r).map((k) => Number(k.split(",")[1])).sort((a, b) => a - b);
    for (const c of colsInRow) {
      const { v, s } = grid.get(`${r},${c}`);
      const ref = `${columnName(c)}${r + 1}`;
      const style = styles.id(s ?? {});
      const attr = style ? ` s="${style}"` : "";
      if (v === "" || v === null || v === undefined) cells.push(`<c r="${ref}"${attr}/>`);
      else if (typeof v === "number" && Number.isFinite(v)) cells.push(`<c r="${ref}"${attr}><v>${v}</v></c>`);
      else cells.push(`<c r="${ref}"${attr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(v)}</t></is></c>`);
    }
    const height = sheet.rowHeights?.[r + 1];
    body.push(`<row r="${r + 1}"${height ? ` ht="${height}" customHeight="1"` : ""}>${cells.join("")}</row>`);
  }

  const bg = sheet.background ? styles.id({ fill: sheet.background }) : 0;
  const widths = sheet.widths ?? [];
  const colXml = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"${bg ? ` style="${bg}"` : ""}/>`);
  if (bg) colXml.push(`<col min="${widths.length + 1}" max="60" width="9" style="${bg}"/>`);
  const cols = colXml.length ? `<cols>${colXml.join("")}</cols>` : "";

  const merges = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>`
    : "";
  const drawing = sheet.charts?.length ? '<drawing r:id="rId1"/>' : "";
  const pr = sheet.tabColor ? `<sheetPr><tabColor rgb="FF${hex(sheet.tabColor)}"/></sheetPr>` : "";
  const view = `<sheetViews><sheetView workbookViewId="0"${sheet.gridlines === false ? ' showGridLines="0"' : ""}${sheet.first ? ' tabSelected="1"' : ""}${sheet.freeze ? `><pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/></sheetView>` : "/>"}</sheetViews>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${pr}${view}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${body.join("")}</sheetData>${merges}${drawing}</worksheet>`;
}

/* ------------------------------------------------------------ grafik */

const NS_C = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const textProps = (size, color, boldText = false) =>
  `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${size}" b="${boldText ? 1 : 0}"><a:solidFill><a:srgbClr val="${hex(color)}"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="id-ID"/></a:p></c:txPr>`;

const chartTitle = (title) =>
  `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr><a:r><a:rPr lang="id-ID" sz="1200" b="1"><a:solidFill><a:srgbClr val="111827"/></a:solidFill></a:rPr><a:t>${escapeXml(title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>`;

const strCache = (values) =>
  `<c:strCache><c:ptCount val="${values.length}"/>${values.map((v, i) => `<c:pt idx="${i}"><c:v>${escapeXml(v)}</c:v></c:pt>`).join("")}</c:strCache>`;
const numCache = (values) =>
  `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${values.length}"/>${values.map((v, i) => `<c:pt idx="${i}"><c:v>${Number(v)}</c:v></c:pt>`).join("")}</c:numCache>`;

function lineChartXml(chart) {
  const color = hex(chart.color ?? "b91c2c");
  const ser = `<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${escapeXml(chart.seriesName ?? "Nilai")}</c:v></c:tx><c:spPr><a:ln w="28575" cap="rnd"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:round/></a:ln></c:spPr><c:marker><c:symbol val="circle"/><c:size val="7"/><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="22225"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></c:spPr></c:marker><c:dLbls><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${textProps(900, "374151", true)}<c:dLblPos val="t"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls><c:cat><c:strRef><c:f>${escapeXml(chart.categories)}</c:f>${strCache(chart.categoryValues)}</c:strRef></c:cat><c:val><c:numRef><c:f>${escapeXml(chart.values)}</c:f>${numCache(chart.valueNumbers)}</c:numRef></c:val><c:smooth val="0"/></c:ser>`;
  const axisLine = '<c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><c:roundedCorners val="0"/><c:chart>${chartTitle(chart.title)}<c:plotArea><c:layout/><c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${ser}<c:marker val="1"/><c:axId val="50010"/><c:axId val="50020"/></c:lineChart><c:catAx><c:axId val="50010"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${axisLine}${textProps(900, "6B7280")}<c:crossAx val="50020"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="50020"/><c:scaling><c:orientation val="minMax"/><c:min val="0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="F1F2F4"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${textProps(900, "6B7280")}<c:crossAx val="50010"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:chartSpace>`;
}

function doughnutChartXml(chart) {
  const points = chart.colors
    .map((color, i) => `<c:dPt><c:idx val="${i}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${hex(color)}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`)
    .join("");
  const ser = `<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${escapeXml(chart.seriesName ?? "Jumlah")}</c:v></c:tx>${points}<c:cat><c:strRef><c:f>${escapeXml(chart.categories)}</c:f>${strCache(chart.categoryValues)}</c:strRef></c:cat><c:val><c:numRef><c:f>${escapeXml(chart.values)}</c:f>${numCache(chart.valueNumbers)}</c:numRef></c:val></c:ser>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><c:roundedCorners val="0"/><c:chart>${chartTitle(chart.title)}<c:plotArea><c:layout/><c:doughnutChart><c:varyColors val="1"/>${ser}<c:firstSliceAng val="0"/><c:holeSize val="62"/></c:doughnutChart></c:plotArea><c:legend><c:legendPos val="r"/><c:overlay val="0"/>${textProps(900, "374151")}</c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:chartSpace>`;
}

/** Jangkar grafik pada lembar: from/to berbasis 0 { col, row }. */
function drawingXml(charts) {
  const anchors = charts
    .map(
      (chart, i) =>
        `<xdr:twoCellAnchor><xdr:from><xdr:col>${chart.from.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.from.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${chart.to.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.to.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Grafik ${i + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${NS_C}"><c:chart xmlns:c="${NS_C}" r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="${NS_A}" xmlns:r="${NS_R}">${anchors}</xdr:wsDr>`;
}

const REL = (id, type, target) =>
  `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
const RELS = (items) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.join("")}</Relationships>`;

/**
 * sheets: [{ name, rows, widths?, merges?, rowHeights?, gridlines?, background?,
 *            tabColor?, freeze?, charts?: [{ type: "line"|"doughnut", from, to, ... }] }]
 * Mengembalikan Uint8Array berisi berkas .xlsx.
 */
export function buildXlsx(sheets) {
  const names = sheets.map((sheet, i) => sheetName(sheet.name, i));
  const styles = new StyleBook();
  const files = [];
  const overrides = [];
  let chartNumber = 0;
  let drawingNumber = 0;

  sheets.forEach((sheet, i) => {
    const n = i + 1;
    files.push({ name: `xl/worksheets/sheet${n}.xml`, text: sheetXml({ ...sheet, first: i === 0 }, styles) });
    overrides.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);

    if (sheet.charts?.length) {
      drawingNumber += 1;
      const rels = [];
      sheet.charts.forEach((chart, k) => {
        chartNumber += 1;
        files.push({ name: `xl/charts/chart${chartNumber}.xml`, text: chart.type === "doughnut" ? doughnutChartXml(chart) : lineChartXml(chart) });
        overrides.push(`<Override PartName="/xl/charts/chart${chartNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`);
        rels.push(REL(`rId${k + 1}`, "chart", `../charts/chart${chartNumber}.xml`));
      });
      files.push({ name: `xl/drawings/drawing${drawingNumber}.xml`, text: drawingXml(sheet.charts) });
      files.push({ name: `xl/drawings/_rels/drawing${drawingNumber}.xml.rels`, text: RELS(rels) });
      files.push({ name: `xl/worksheets/_rels/sheet${n}.xml.rels`, text: RELS([REL("rId1", "drawing", `../drawings/drawing${drawingNumber}.xml`)]) });
      overrides.push(`<Override PartName="/xl/drawings/drawing${drawingNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
    }
  });

  files.unshift(
    {
      name: "[Content_Types].xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides.join("")}</Types>`,
    },
    { name: "_rels/.rels", text: RELS([REL("rId1", "officeDocument", "xl/workbook.xml")]) },
    {
      name: "xl/workbook.xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${NS_R}"><sheets>${names.map((name, i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      text: RELS([...sheets.map((_, i) => REL(`rId${i + 1}`, "worksheet", `worksheets/sheet${i + 1}.xml`)), REL(`rId${sheets.length + 1}`, "styles", "styles.xml")]),
    },
  );
  // styles.xml baru bisa ditulis setelah semua lembar membuat gayanya.
  files.push({ name: "xl/styles.xml", text: styles.xml() });

  return zip(files.map(({ name, text }) => ({ name, data: encoder.encode(text) })));
}
