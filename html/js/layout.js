/* Shared chrome: icon sprite, header, mobile menu, footer, cart sidebar, overlay. */
(function () {
  "use strict";
  var M = window.Mauve;
  var R = M.routes;

  var MENU = [
    { title: "TRANG CHỦ", url: R.home() },
    { title: "SẢN PHẨM MỚI", url: R.collection("san-pham-moi") },
    { title: "SẢN PHẨM MÙA HÈ", url: R.collection("mua-he") },
    { title: "SẢN PHẨM ĐỒNG BỘ", url: R.collection("dong-bo") },
    { title: "LIÊN HỆ", url: R.contact() }
  ];

  function isActive(url) {
    var path = location.pathname.replace(/\/$/, "") || "/";
    var here = (path === "/" ? "/" : path + "/") + location.search;
    // normalize comparison: strip trailing slash from the path part of url
    var parts = url.split("?");
    var urlPath = parts[0].replace(/\/$/, "") || "/";
    var urlNorm = (urlPath === "/" ? "/" : urlPath + "/") + (parts[1] ? "?" + parts[1] : "");
    return decodeURIComponent(here) === decodeURIComponent(urlNorm);
  }

  var sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
    '<symbol id="i-search" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="45.5" cy="45.5" r="25.2"/><path d="M63.7 64 79 79.3"/></symbol>' +
    '<symbol id="i-hanger" viewBox="0 0 128 128" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M56 45.6c0-5.5 4.5-10 10-10s10 4.6 9.6 10.4c-.2 3-1.6 5.1-3.6 8.2L66.5 66"/><path d="M66.5 66 102.6 76.6c3.7 1.1 6.4 4.5 6.4 8.3 0 4.7-3.9 8.6-8.6 8.6H27.6c-4.7 0-8.6-3.9-8.6-8.6 0-3.8 2.5-7.2 6.2-8.3L62 66"/></symbol>' +
    '<symbol id="i-close" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M25.2 25.2 74.5 74.5M74.5 25.2 25.2 74.5"/></symbol>' +
    '<symbol id="i-x" viewBox="24 24 52 52" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M25.2 25.2 74.5 74.5M74.5 25.2 25.2 74.5"/></symbol>' +
    '<symbol id="i-bars" viewBox="0 0 36 9" fill="none" stroke="currentColor" stroke-width="0.8"><path d="M0 .5h36M0 4.5h36M0 8.5h36"/></symbol>' +
    '<symbol id="i-chevron" viewBox="0 0 100 100" fill="currentColor"><path d="m67.4 45.4-2.8-2.8L50 57.2 35.4 42.6l-2.8 2.8L50 62.8z"/></symbol>' +
    '<symbol id="i-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 7 12l8 8"/></symbol>' +
    '<symbol id="i-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 4 8 8-8 8"/></symbol>' +
    '<symbol id="i-long-arrow" viewBox="0 0 28 8" fill="none" stroke="currentColor" stroke-width="1"><path d="M0 4h27M23.5.5 27 4l-3.5 3.5"/></symbol>' +
    '<symbol id="i-long-arrow-left" viewBox="0 0 30 11" fill="none" stroke="currentColor" stroke-width="1"><path d="M30 5.5H1M4.8 1.5 1 5.5l3.8 4"/></symbol>' +
    '<symbol id="i-heart" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M12 20.3S3.5 15.1 3.5 9.1A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.5c0 6-8.5 11.2-8.5 11.2Z"/></symbol>' +
    "</svg>";

  function navItem(item) {
    var sub = item.children
      ? '<div class="megamenu"><ul class="megamenu__panel">' + item.children.map(function (c) {
          return '<li' + (isActive(c[1]) ? ' class="is-active"' : "") + '><a href="' + c[1] + '">' + M.esc(c[0]) + "</a></li>";
        }).join("") + "</ul></div>"
      : "";
    return '<li class="nav__item' + (isActive(item.url) ? " is-active" : "") + '"><a href="' + item.url + '">' +
      (item.hot ? '<span class="nav__hot">' + item.hot + "</span>" : "") + M.esc(item.title) + "</a>" + sub + "</li>";
  }

  function mobileItem(item) {
    var head = '<div class="menu-mobile__head"><a href="' + item.url + '">' + M.esc(item.title) + "</a>" +
      (item.children ? '<button type="button" aria-label="Mở"><svg><use href="#i-chevron"/></svg></button>' : "") + "</div>";
    var sub = item.children
      ? '<ul class="menu-mobile__sub">' + item.children.map(function (c) { return '<li><a href="' + c[1] + '">' + M.esc(c[0]) + "</a></li>"; }).join("") + "</ul>"
      : "";
    return "<li>" + head + sub + "</li>";
  }

  var header =
    '<header class="header" id="header">' +
      '<div class="header-top"><p>Hotline / Zalo: <a href="tel:0327666248">0327 666 248</a></p></div>' +
      '<div class="header-bottom"><div class="header-bottom__inner">' +
        '<div class="header-logo"><a class="logo" href="' + R.home() + '" aria-label="May By Mây"><img src="/images/logo.jpeg" alt="May By Mây - clothing &amp; accessories" width="72" height="72"></a></div>' +
        '<button class="burger" type="button" aria-label="Menu" aria-expanded="false" data-toggle="menu"><svg class="icon-bars"><use href="#i-bars"/></svg><svg class="icon-close" viewBox="0 0 100 100"><use href="#i-close"/></svg></button>' +
        '<nav class="nav" aria-label="Main"><ul class="nav__list">' + MENU.map(navItem).join("") + "</ul></nav>" +
        '<div class="header-icons">' +
          '<div class="search-wrap">' +
            '<a href="#" class="header-icon" data-toggle="search" aria-label="Tìm kiếm"><svg><use href="#i-search"/></svg></a>' +
            '<form class="search-box" action="/search/" role="search"><input type="text" name="q" placeholder="Tìm kiếm sản phẩm..." autocomplete="off" required><button type="submit" aria-label="Tìm"><svg><use href="#i-search"/></svg></button></form>' +
          "</div>" +
          '<div class="fav-wrap"><a href="' + R.wishlist() + '" class="header-icon header-icon--fav" aria-label="Yêu thích"><span class="fav-count">0</span><svg viewBox="0 0 24 24"><use href="#i-heart"/></svg></a></div>' +
          '<div class="cart-wrap"><a href="' + R.cart() + '" class="header-icon header-icon--cart" data-toggle="cart" aria-label="Giỏ hàng"><span class="cart-count">0</span><svg viewBox="0 0 128 128"><use href="#i-hanger"/></svg></a></div>' +
        "</div>" +
      "</div></div>" +
    "</header>" +
    '<div class="menu-mobile" aria-hidden="true">' +
      '<div class="menu-mobile__list"><ul>' + MENU.map(mobileItem).join("") + "</ul></div>" +
    "</div>";

  function footerCol(title, body) {
    return '<div class="footer__col footer__col--toggle"><div class="footer__title"><h2>' + title + '</h2><svg class="icon"><use href="#i-chevron"/></svg></div><div class="footer__body">' + body + "</div></div>";
  }
  function links(list) {
    return '<div class="footer__menu">' + list.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + "</a>"; }).join("") + "</div>";
  }

  var footer =
    '<footer class="footer"><div class="footer__main"><div class="footer__content"><div class="footer__cols">' +
      footerCol("GIỚI THIỆU", links([["Giới thiệu", R.page("thuong-hieu")], ["Liên hệ", R.contact()]])) +
      footerCol("SẢN PHẨM", links([
        ["Sản phẩm mới", R.collection("san-pham-moi")],
        ["Sản phẩm mùa hè", R.collection("mua-he")],
        ["Sản phẩm đồng bộ", R.collection("dong-bo")]
      ])) +
      footerCol("HỖ TRỢ", links([
        ["Bảng kích cỡ", R.page("bang-kich-co")],
        ["Chính sách giao hàng", R.page("chinh-sach-giao-hang")],
        ["Phương thức thanh toán", R.page("phuong-thuc-thanh-toan")],
        ["Chính sách đổi hàng", R.page("chinh-sach-doi-hang")],
        ["Chính sách bảo mật", R.page("chinh-sach-bao-mat")]
      ])) +
      footerCol("KẾT NỐI", links([["Hotline: 0327 666 248", "tel:0327666248"], ["Zalo: 0327 666 248", "https://zalo.me/0327666248"]])) +
      '<div class="footer__col footer__col--info"><div class="footer__info">' +
        "<p>Hộ Kinh Doanh Thời Trang May By Mây</p><p>GPKD do Phòng kinh tế, hạ tầng và đô thị thuộc UBND Phường Hoàng Liệt cấp ngày 05/02/2026</p><p>MST: 038098030181</p><p>Hotline: 0327666248</p>" +
      "</div></div>" +
    '</div></div></div><div class="footer__bottom"><p>Copyright © 2026 May By Mây</p></div></footer>';

  var cartSidebar =
    '<aside class="cart-sidebar" aria-hidden="true">' +
      '<div class="cart-sidebar__top"><h2>Giỏ hàng <span class="js-cart-count-label">(0)</span></h2><button type="button" class="cart-sidebar__close" data-close="cart" aria-label="Đóng"><svg viewBox="24 24 52 52"><use href="#i-x"/></svg></button></div>' +
      '<div class="cart-sidebar__mid"></div>' +
      '<div class="cart-sidebar__bot">' +
        '<div class="cart-sidebar__total"><span>Tạm tính</span><span class="js-cart-total">0đ</span></div>' +
        '<a href="' + R.cart() + '" class="cart-sidebar__checkout"><b>MUA HÀNG</b></a>' +
        '<div class="cart-sidebar__links"><button type="button" data-note="open">Ghi chú</button><a href="' + R.cart() + '"><svg><use href="#i-long-arrow"/></svg>Xem chi tiết giỏ hàng</a></div>' +
      "</div>" +
      '<div class="cart-note"><div class="cart-note__head"><span>Ghi chú</span><button type="button" data-note="close" aria-label="Đóng"><svg viewBox="24 24 52 52"><use href="#i-x"/></svg></button></div>' +
        '<textarea placeholder="Add a note to your order"></textarea><a href="#" class="cart-note__save" data-note="save">Lưu</a></div>' +
    "</aside>" +
    '<div class="overlay" data-close="all"></div>';

  document.body.insertAdjacentHTML("afterbegin", sprite + header);
  document.body.insertAdjacentHTML("beforeend", footer + cartSidebar);

  // footer must sit after <main>, before cart sidebar
  var main = document.querySelector("main");
  var foot = document.querySelector(".footer");
  if (main && foot) main.after(foot);

  /* ---------------- cart rendering ---------------- */
  function variantLine(item) {
    var parts = [];
    if (item.color) {
      parts.push('<dd class="variant-value">' + (item.chip ? '<span class="variant-chip" style="background-image:url(' + M.chipUrl(item.chip) + ')"></span>' : "") + M.esc(item.color) + "</dd>");
    }
    if (item.size) parts.push('<dd class="variant-value">size ' + M.esc(item.size) + "</dd>");
    return '<dl class="cart-variant">' + parts.join("") + "</dl>";
  }

  function renderCartSidebar() {
    var c = M.cart.get();
    var mid = document.querySelector(".cart-sidebar__mid");
    if (!mid) return;
    if (!c.items.length) {
      mid.innerHTML = '<div class="cart-sidebar__empty">Giỏ hàng của bạn còn trống</div>';
    } else {
      mid.innerHTML = '<div class="cart-sidebar__items">' + c.items.map(function (i) {
        return '<div class="cart-item" data-id="' + i.id + '">' +
          '<div class="cart-item__left"><a href="' + R.product(i.handle) + '"><img src="' + i.image + '" alt="' + M.esc(i.title) + '"></a></div>' +
          '<div class="cart-item__right"><h4>' + M.esc(i.title) + "</h4>" + variantLine(i) +
            '<div class="cart-item__qty"><svg viewBox="24 24 52 52"><use href="#i-x"/></svg><input type="number" min="1" value="' + i.qty + '" data-cart-qty="' + i.id + '"></div>' +
            '<p class="cart-item__price">' + M.money(i.price * i.qty) + "</p>" +
          "</div>" +
          '<button type="button" class="cart-item__remove" data-cart-remove="' + i.id + '" aria-label="Xoá"><svg viewBox="24 24 52 52"><use href="#i-x"/></svg></button>' +
        "</div>";
      }).join("") + "</div>";
    }
    var count = M.cart.count();
    document.querySelectorAll(".cart-count").forEach(function (el) { el.textContent = count; });
    document.querySelectorAll(".js-cart-count-label").forEach(function (el) { el.textContent = "(" + count + ")"; });
    document.querySelectorAll(".js-cart-total").forEach(function (el) { el.textContent = M.money(M.cart.total()); });
    var note = document.querySelector(".cart-note textarea");
    if (note && document.activeElement !== note) note.value = c.note || "";
  }

  document.addEventListener("cart:change", renderCartSidebar);
  window.addEventListener("storage", renderCartSidebar);

  document.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-cart-remove]");
    if (rm) { e.preventDefault(); M.cart.remove(Number(rm.getAttribute("data-cart-remove"))); return; }
    var save = e.target.closest('[data-note="save"]');
    if (save) {
      M.cart.setNote(document.querySelector(".cart-note textarea").value);
    }
  });
  document.addEventListener("change", function (e) {
    var q = e.target.closest("[data-cart-qty]");
    if (q) M.cart.setQty(Number(q.getAttribute("data-cart-qty")), Math.max(0, parseInt(q.value, 10) || 0));
  });
  // demo forms never submit anywhere
  document.addEventListener("submit", function (e) {
    if (e.target.matches("[data-demo-form]")) e.preventDefault();
  });

  renderCartSidebar();
  M.openCart = function () {
    document.body.classList.remove("search-open", "menu-open");
    document.body.classList.add("cart-open", "no-scroll");
  };

  /* ---------------- wishlist + quick add on product cards ---------------- */
  // every card (and the product page's favourite button) carries its data in data-card
  function cardData(el) {
    var host = el.closest("[data-card]");
    if (!host) return null;
    try { return JSON.parse(host.getAttribute("data-card")); } catch (err) { return null; }
  }

  function syncFavs() {
    document.querySelectorAll("[data-fav]").forEach(function (btn) {
      var d = cardData(btn);
      var on = !!d && M.wishlist.has(d.h);
      btn.classList.toggle("is-fav", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    var n = M.wishlist.count();
    document.querySelectorAll(".fav-count").forEach(function (el) { el.textContent = n; });
  }
  M.syncFavs = syncFavs;

  function closePickers(except) {
    document.querySelectorAll(".pro-loop.is-picking").forEach(function (c) { if (c !== except) c.classList.remove("is-picking"); });
  }

  document.addEventListener("click", function (e) {
    var fav = e.target.closest("[data-fav]");
    if (fav) {
      e.preventDefault();
      var d = cardData(fav);
      if (d) M.wishlist.toggle(d);
      return;
    }
    var open = e.target.closest("[data-quick-open]");
    if (open) {
      e.preventDefault();
      var c = open.closest(".pro-loop");
      closePickers(c);
      c.classList.add("is-picking");
      return;
    }
    var size = e.target.closest("[data-quick-size]");
    if (size) {
      e.preventDefault();
      var item = cardData(size);
      var s = size.getAttribute("data-quick-size");
      var v = item && item.v.filter(function (x) { return x[0] === s; })[0];
      if (!v) return;
      M.cart.add({ id: v[1], handle: item.h, title: item.t, image: item.i1, price: item.p, color: item.c, chip: null, size: s }, 1);
      size.closest(".pro-loop").classList.remove("is-picking");
      M.openCart();
      return;
    }
    if (!e.target.closest(".pro-loop__quick")) closePickers(null);
  });
  document.addEventListener("mouseleave", function (e) {
    if (e.target.classList && e.target.classList.contains("pro-loop")) e.target.classList.remove("is-picking");
  }, true);

  document.addEventListener("wishlist:change", syncFavs);
  window.addEventListener("storage", syncFavs);
  syncFavs();
})();
