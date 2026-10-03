(function () {
  "use strict";
  var M = window.Mauve;
  var PER_PAGE = 12;
  var q = M.param("q").trim();
  var page = Math.max(1, parseInt(M.param("page"), 10) || 1);

  // accent-insensitive match, like the store search ("dam" finds "Đầm")
  function fold(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  }

  document.querySelector(".js-search-input").value = q;
  document.querySelector(".js-search-for").textContent = 'Kết quả tìm kiếm cho "' + q + '".';
  if (q) document.title = 'Kết quả tìm kiếm "' + q + '" - May By Mây';

  (function (list) {
    var terms = fold(q).split(/\s+/).filter(Boolean);
    var hits = q ? list.filter(function (p) {
      var t = fold(p.t);
      return terms.every(function (w) { return t.indexOf(w) !== -1; });
    }) : [];
    document.querySelector(".js-search-count").textContent = "Có " + hits.length + " sản phẩm cho tìm kiếm";

    var pages = Math.ceil(hits.length / PER_PAGE);
    var slice = hits.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    var grid = document.querySelector(".js-search-grid");
    grid.innerHTML = slice.map(function (p) { return M.card(p); }).join("");
    M.syncFavs();

    if (pages > 1) {
      var link = function (n) { return "/search/?q=" + encodeURIComponent(q) + "&page=" + n; };
      var html = "";
      if (page > 1) html += '<a href="' + link(page - 1) + '" aria-label="Trang trước"><svg><use href="#i-left"/></svg></a>';
      for (var i = 1; i <= pages; i++) {
        html += i === page ? '<span class="is-current">' + i + "</span>" : '<a href="' + link(i) + '">' + i + "</a>";
      }
      if (page < pages) html += '<a href="' + link(page + 1) + '" aria-label="Trang sau"><svg><use href="#i-right"/></svg></a>';
      document.querySelector(".js-search-pages").innerHTML = html;
    }
  })(window.SEARCH_INDEX || []);
})();
