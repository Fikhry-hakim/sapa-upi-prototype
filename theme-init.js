/*
 * Pasang tema sebelum halaman digambar, supaya pengunjung mode gelap tidak
 * melihat kilat putih. Pilihan yang disimpan menang atas pengaturan sistem.
 * Ditulis sebagai berkas terpisah karena CSP situs ini tidak mengizinkan skrip inline.
 */
(() => {
  let theme = null;
  try {
    theme = localStorage.getItem("sapa-theme");
  } catch {
    /* penyimpanan diblokir: ikuti sistem */
  }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();
