/* Wishlist page: products the visitor hearted (stored in localStorage). */
(function () {
  "use strict";
  var M = window.Mauve;
  var grid = document.querySelector(".js-wishlist-grid");
  var countEl = document.querySelector(".js-wishlist-count");

  function render() {
    var list = M.wishlist.get();
    if (!list.length) {
      countEl.textContent = "";
      grid.innerHTML = '<p class="collection__empty">Chưa có sản phẩm yêu thích. Bấm ♡ trên sản phẩm để lưu lại.<br><a class="link-underline" href="' + M.routes.collection("san-pham-moi") + '">Xem sản phẩm mới</a></p>';
      return;
    }
    countEl.textContent = list.length + " sản phẩm";
    grid.innerHTML = list.map(M.card).join("");
    M.syncFavs();
  }

  document.addEventListener("wishlist:change", render);
  window.addEventListener("storage", render);
  render();
})();
