/*
 * Pasang tema sebelum halaman digambar, supaya pilihan gelap yang tersimpan
 * tidak diawali kilat putih. Tanpa pilihan tersimpan, tampilan selalu terang.
 * Ditulis sebagai berkas terpisah karena CSP situs ini tidak mengizinkan skrip inline.
 */
(() => {
  let theme = null;
  try {
    theme = localStorage.getItem("sapa-theme");
  } catch {
    /* penyimpanan diblokir: tampil terang */
  }
  if (theme !== "light" && theme !== "dark") theme = "light";
  document.documentElement.dataset.theme = theme;
})();
