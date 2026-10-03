/* Shared store helpers: routes, money, product card, cart and wishlist (localStorage). */
(function () {
  "use strict";

  var CART_KEY = "maybymay_cart";
  var FAV_KEY = "maybymay_wishlist";
  // Order + contact forms are sent to the CMS (Google Apps Script web app ".../exec" URL, see gas/README.md).
  // Empty = forms work but nothing is sent (the payload is logged to the console).
  var API_URL = "https://script.google.com/macros/s/AKfycbwINJt4qzRwTwPcq42kGyyhx9OogtQNnu8KluJeTIRh0I1svdVRUTGpPF3vqB3ZbZkGGQ/exec";

  var routes = {
    home: function () { return "/"; },
    collection: function (h) { return "/collection/" + h + "/"; },
    product: function (h) { return "/product/" + h + "/"; },
    page: function (h) { return "/page/" + h + "/"; },
    search: function (q) { return "/search/?q=" + encodeURIComponent(q || ""); },
    contact: function () { return "/contact/"; },
    blog: function () { return "/blog/"; },
    cart: function () { return "/cart/"; },
    checkout: function () { return "/thanh-toan/"; },
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

  /* ---------------- forms -> CMS ---------------- */
  // text/plain avoids a CORS preflight (Google Apps Script cannot answer OPTIONS)
  function post(data) {
    if (!API_URL) {
      if (window.console) console.info("API_URL chưa cấu hình — dữ liệu chưa được gửi đi:", data);
      return Promise.resolve({ ok: true, notSent: true });
    }
    return fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: "Không kết nối được máy chủ. Vui lòng thử lại hoặc gọi hotline 0327 666 248." }; });
  }

  /* ---------------- product card (search results, wishlist) ---------------- */
  // item = card data { h, t, u, i1, p, c, v: [[size, variantId], ...] }; same markup as scripts/build.py
  function card(item) {
    var t = esc(item.t);
    var sizes = (item.v || []).map(function (v) {
      return '<button type="button" data-quick-size="' + esc(v[0]) + '">' + esc(v[0]) + "</button>";
    }).join("");
    return '<div class="pro-loop" data-card="' + esc(JSON.stringify(item)) + '"><div class="pro-loop__wrap">' +
      '<div class="pro-loop__image"><a href="' + item.u + '">' +
        '<img class="img-1" src="' + item.i1 + '" alt="' + t + '" loading="lazy">' +
      "</a>" +
      '<button type="button" class="pro-loop__fav" data-fav aria-label="Yêu thích" aria-pressed="false"><svg><use href="#i-heart"/></svg></button>' +
      '<div class="pro-loop__overlay">' +
        '<div class="pro-loop__actions">' +
          '<button type="button" class="pro-loop__btn" data-quick-open><svg><use href="#i-bag"/></svg><span>Thêm vào giỏ</span></button>' +
          '<a class="pro-loop__btn" href="' + item.u + '"><svg><use href="#i-eye"/></svg><span>Xem chi tiết</span></a>' +
        "</div>" +
        '<div class="pro-loop__sizes"><span>Chọn size</span><div>' + sizes + "</div></div>" +
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
    setNote: function (note) { var c = readCart(); c.note = note; writeCart(c); },
    clear: function () { writeCart({ items: [], note: "" }); }
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
    post: post,
    card: card,
    cart: cart,
    wishlist: wishlist
  };
})();
