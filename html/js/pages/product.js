/* Product page behaviour. The markup is static (scripts/build.py); variant data sits in #product-data. */
(function () {
  "use strict";
  var M = window.Mauve;
  var root = document.getElementById("product");
  var dataEl = document.getElementById("product-data");
  if (!root || !dataEl) return;
  var p = JSON.parse(dataEl.textContent);
  var colorIdx = p.colorIndex;
  var sizeIdx = p.sizeIndex;
  var first = p.variants.filter(function (v) { return v.available; })[0] || p.variants[0];
  var state = {
    color: colorIdx >= 0 ? first.options[colorIdx] : null,
    size: sizeIdx >= 0 ? first.options[sizeIdx] : null
  };
  var mainImg = root.querySelector(".js-main-img");
  var countEl = root.querySelector(".js-count");
  var thumbs = Array.prototype.slice.call(root.querySelectorAll("[data-thumb]"));
  var current = 0;

  function currentVariant() {
    return p.variants.filter(function (v) {
      return (colorIdx < 0 || v.options[colorIdx] === state.color) && (sizeIdx < 0 || v.options[sizeIdx] === state.size);
    })[0];
  }

  /* ---------------- gallery: one main image, thumbnails switch it ---------------- */
  function showImage(i) {
    var n = p.images.length;
    current = (i + n) % n;
    mainImg.src = p.images[current];
    if (countEl) countEl.textContent = current + 1;
    thumbs.forEach(function (t, k) { t.classList.toggle("is-active", k === current); });
    var active = thumbs[current];
    if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  // choosing a colour shows that colour's image
  function showColorImage() {
    var v = p.variants.filter(function (x) { return x.options[colorIdx] === state.color && x.image; })[0];
    var i = v ? p.images.indexOf(v.image) : -1;
    if (i >= 0) showImage(i);
  }

  // swipe left / right on the main image (phones)
  var touchX = null;
  mainImg.parentNode.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  mainImg.parentNode.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) showImage(current + (dx < 0 ? 1 : -1));
  });

  document.addEventListener("keydown", function (e) {
    if (document.body.classList.contains("popup-open") || document.body.classList.contains("cart-open")) return;
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft") showImage(current - 1);
    if (e.key === "ArrowRight") showImage(current + 1);
  });

  function update() {
    var v = currentVariant();
    root.querySelectorAll("[data-color]").forEach(function (el) { el.classList.toggle("is-active", el.getAttribute("data-color") === state.color); });
    var colorName = root.querySelector(".js-color-name");
    if (colorName) colorName.textContent = state.color || "";
    root.querySelectorAll("[data-size]").forEach(function (el) {
      var s = el.getAttribute("data-size");
      el.classList.toggle("is-active", s === state.size);
      var any = p.variants.some(function (x) { return x.options[sizeIdx] === s && (colorIdx < 0 || x.options[colorIdx] === state.color) && x.available; });
      el.classList.toggle("is-soldout", !any);
    });
    root.querySelector(".js-sku").textContent = v ? v.sku : "";
    var price = v ? v.price : first.price;
    var compare = v && v.compare > v.price ? v.compare : 0;
    var priceEl = root.querySelector(".js-price");
    priceEl.textContent = M.money(price);
    priceEl.classList.toggle("is-sale", !!compare);
    root.querySelector(".js-compare").textContent = compare ? M.money(compare) : "";
    var btn = root.querySelector(".js-add");
    var ok = v && v.available;
    btn.disabled = !ok;
    btn.textContent = ok ? "THÊM VÀO GIỎ HÀNG" : "HẾT HÀNG";
  }

  function addToCart() {
    var v = currentVariant();
    if (!v || !v.available) return;
    var qty = Math.max(1, parseInt(root.querySelector(".js-qty").value, 10) || 1);
    var sw = p.swatches.filter(function (s) { return s.name === state.color; })[0];
    M.cart.add({
      id: v.id,
      handle: p.handle,
      title: p.title,
      image: v.image || p.images[0],
      price: v.price,
      color: state.color,
      chip: sw ? sw.chip : null,
      size: state.size
    }, qty);
    M.openCart();
  }

  root.addEventListener("click", function (e) {
    var c = e.target.closest("[data-color]");
    if (c) { state.color = c.getAttribute("data-color"); update(); showColorImage(); return; }
    var s = e.target.closest("[data-size]");
    if (s) { state.size = s.getAttribute("data-size"); update(); return; }
    var q = e.target.closest("[data-qty]");
    if (q) {
      var input = root.querySelector(".js-qty");
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) + Number(q.getAttribute("data-qty")));
      return;
    }
    var thumb = e.target.closest("[data-thumb]");
    if (thumb) { showImage(Number(thumb.getAttribute("data-thumb"))); return; }
    var step = e.target.closest("[data-step]");
    if (step) { showImage(current + Number(step.getAttribute("data-step"))); return; }
    if (e.target.closest(".js-add")) { addToCart(); return; }
    if (e.target.closest(".js-open-size")) { openPopup("size"); return; }
    if (e.target.closest(".js-open-info")) { openPopup("info"); return; }
    if (e.target.closest(".js-open-ship")) { openPopup("ship"); return; }
  });

  function openPopup(name) {
    closePopups();
    var el = document.querySelector('[data-popup="' + name + '"]');
    if (!el) return;
    el.scrollTop = 0;
    el.classList.add("is-open");
    document.body.classList.add("popup-open", "no-scroll");
  }
  function closePopups() {
    document.querySelectorAll(".side-popup.is-open").forEach(function (el) { el.classList.remove("is-open"); });
    document.body.classList.remove("popup-open");
    if (!document.body.classList.contains("cart-open")) document.body.classList.remove("no-scroll");
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-popup-close]") || (e.target.closest(".overlay") && document.body.classList.contains("popup-open"))) closePopups();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePopups(); });

  update();
})();
