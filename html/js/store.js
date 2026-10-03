/* Shared store helpers: routes, money, product card, cart and wishlist (localStorage). */
(function () {
  "use strict";

  var CART_KEY = "maybymay_cart";
  var FAV_KEY = "maybymay_wishlist";

  var routes = {
    home: function () { return "/"; },
    collection: function (h) { return "/collection/" + h + "/"; },
    product: function (h) { return "/product/" + h + "/"; },
    page: function (h) { return "/page/" + h + "/"; },
    search: function (q) { return "/search/?q=" + encodeURIComponent(q || ""); },
    contact: function () { return "/contact/"; },
    cart: function () { return "/cart/"; },
    wishlist: function () { return "/yeu-thich/"; }
  };

  function money(n) {
    return Math.round(n).toLocaleString("en-US") + "đ";
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function chipUrl(file) {
    return file || "";
  }

  /* ---------------- product card (search results, wishlist) ---------------- */
  // item = card data { h, t, u, i1, i2, p, c, v: [[size, variantId], ...] }; same markup as scripts/build.py
  function card(item) {
    var t = esc(item.t);
    var sizes = (item.v || []).map(function (v) {
      return '<button type="button" data-quick-size="' + esc(v[0]) + '">' + esc(v[0]) + "</button>";
    }).join("");
    return '<div class="pro-loop" data-card="' + esc(JSON.stringify(item)) + '"><div class="pro-loop__wrap">' +
      '<div class="pro-loop__image"><a href="' + item.u + '">' +
        '<img class="img-1" src="' + item.i1 + '" alt="' + t + '" loading="lazy">' +
        '<img class="img-2" src="' + item.i2 + '" alt="" loading="lazy">' +
      "</a>" +
      '<button type="button" class="pro-loop__fav" data-fav aria-label="Yêu thích" aria-pressed="false"><svg><use href="#i-heart"/></svg></button>' +
      '<div class="pro-loop__quick">' +
        '<button type="button" class="pro-loop__add" data-quick-open>+ Thêm vào giỏ</button>' +
        '<div class="pro-loop__sizes"><span>Chọn size</span>' + sizes + "</div>" +
      "</div></div>" +
      '<h3 class="pro-loop__name"><a href="' + item.u + '" title="' + t + '">' + t + "</a></h3>" +
      '<div class="pro-loop__price"><strong>' + money(item.p) + "</strong></div>" +
    "</div></div>";
  }

  /* ---------------- cart ---------------- */
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [], note: "" }; }
    catch (e) { return { items: [], note: "" }; }
  }
  function writeCart(c) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("cart:change", { detail: c }));
  }
  var cart = {
    get: readCart,
    count: function () { return readCart().items.reduce(function (n, i) { return n + i.qty; }, 0); },
    total: function () { return readCart().items.reduce(function (n, i) { return n + i.qty * i.price; }, 0); },
    add: function (item, qty) {
      var c = readCart();
      var found = c.items.filter(function (i) { return i.id === item.id; })[0];
      if (found) found.qty += qty;
      else c.items.push(Object.assign({}, item, { qty: qty }));
      writeCart(c);
    },
    setQty: function (id, qty) {
      var c = readCart();
      c.items = c.items.map(function (i) { if (i.id === id) i.qty = qty; return i; }).filter(function (i) { return i.qty > 0; });
      writeCart(c);
    },
    remove: function (id) {
      var c = readCart();
      c.items = c.items.filter(function (i) { return i.id !== id; });
      writeCart(c);
    },
    setNote: function (note) { var c = readCart(); c.note = note; writeCart(c); }
  };

  /* ---------------- wishlist (localStorage) ---------------- */
  function readFav() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch (e) { return []; }
  }
  function writeFav(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("wishlist:change", { detail: list }));
  }
  var wishlist = {
    get: readFav,
    count: function () { return readFav().length; },
    has: function (h) { return readFav().some(function (i) { return i.h === h; }); },
    // add or remove; returns true when the item is now in the wishlist
    toggle: function (item) {
      var list = readFav();
      var on = !list.some(function (i) { return i.h === item.h; });
      list = on ? [item].concat(list) : list.filter(function (i) { return i.h !== item.h; });
      writeFav(list);
      return on;
    }
  };

  window.Mauve = {
    routes: routes,
    money: money,
    param: param,
    esc: esc,
    chipUrl: chipUrl,
    card: card,
    cart: cart,
    wishlist: wishlist
  };
})();
