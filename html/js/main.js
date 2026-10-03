(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------ */
  /* Sticky header: fixed after 400px                                    */
  /* ------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = $("#header");
    function measure() {
      root.style.setProperty("--header-h", header.getBoundingClientRect().bottom + "px");
    }
    function onScroll() {
      var scrolled = window.pageYOffset > 400;
      body.classList.toggle("is-scrolled", scrolled);
      if (scrolled) {
        $(".search-box") && body.classList.remove("search-open");
      }
      if (!body.classList.contains("menu-open")) measure();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    onScroll();
  }

  /* ------------------------------------------------------------------ */
  /* Header toggles: search / cart / mobile menu                         */
  /* ------------------------------------------------------------------ */
  function closeAll() {
    body.classList.remove("cart-open", "menu-open", "no-scroll");
    $(".burger").setAttribute("aria-expanded", "false");
    $(".cart-note").classList.remove("is-active");
  }

  function initToggles() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-toggle]");
      if (t) {
        e.preventDefault();
        var what = t.getAttribute("data-toggle");
        if (what === "search") {
          body.classList.toggle("search-open");
          if (body.classList.contains("search-open")) $(".search-box input").focus();
        } else if (what === "cart") {
          body.classList.remove("search-open", "menu-open");
          body.classList.add("cart-open", "no-scroll");
        } else if (what === "menu") {
          var open = !body.classList.contains("menu-open");
          if (open) {
            var header = $("#header");
            var bottom = body.classList.contains("is-scrolled")
              ? $(".header-bottom").getBoundingClientRect().bottom
              : header.getBoundingClientRect().bottom;
            root.style.setProperty("--header-h", Math.max(bottom, 0) + "px");
          }
          body.classList.toggle("menu-open", open);
          body.classList.toggle("no-scroll", open);
          t.setAttribute("aria-expanded", String(open));
        }
        return;
      }

      var c = e.target.closest("[data-close]");
      if (c) {
        e.preventDefault();
        closeAll();
        return;
      }

      var note = e.target.closest("[data-note]");
      if (note) {
        e.preventDefault();
        $(".cart-note").classList.toggle("is-active", note.getAttribute("data-note") === "open");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        body.classList.remove("search-open");
        closeAll();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 992 && body.classList.contains("menu-open")) closeAll();
    });
  }

  /* ------------------------------------------------------------------ */
  /* slideToggle helper                                                  */
  /* ------------------------------------------------------------------ */
  function slideToggle(el, duration) {
    duration = duration || 400;
    var isHidden = getComputedStyle(el).display === "none";
    el.style.overflow = "hidden";
    if (isHidden) {
      el.style.display = "block";
      var h = el.scrollHeight;
      el.style.height = "0px";
      el.offsetHeight; // reflow
      el.style.transition = "height " + duration + "ms ease";
      el.style.height = h + "px";
    } else {
      el.style.height = el.scrollHeight + "px";
      el.offsetHeight;
      el.style.transition = "height " + duration + "ms ease";
      el.style.height = "0px";
    }
    clearTimeout(el._slideT);
    el._slideT = setTimeout(function () {
      el.style.transition = "";
      el.style.height = "";
      el.style.overflow = "";
      el.style.display = isHidden ? "block" : "none";
    }, duration);
  }

  /* megamenu: links start under their own parent item (padding-left = item x) */
  function initMegamenu() {
    $$(".nav__item").forEach(function (item) {
      var panel = $(".megamenu__panel", item);
      if (!panel) return;
      item.addEventListener("mouseenter", function () {
        var link = item.querySelector(":scope > a");
        var base = $(".header-bottom").getBoundingClientRect().left;
        panel.style.paddingLeft = (link.getBoundingClientRect().left - base) + "px";
      });
    });
  }

  function initMobileMenu() {
    $$(".menu-mobile__head button").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var sub = btn.closest("li").querySelector(".menu-mobile__sub");
        if (!sub) return;
        slideToggle(sub, 400);
        btn.classList.toggle("is-active");
      });
    });
  }

  function initFooterAccordion() {
    $$(".footer__col--toggle .footer__title").forEach(function (title) {
      title.addEventListener("click", function () {
        if (window.innerWidth > 991) return;
        title.classList.toggle("is-open");
        slideToggle(title.nextElementSibling, 400);
      });
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 991) {
        $$(".footer__col--toggle .footer__body").forEach(function (b) { b.style.display = ""; });
        $$(".footer__title.is-open").forEach(function (t) { t.classList.remove("is-open"); });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero: fade slider, autoplay 4s, 1s fade, infinite, dots            */
  /* ------------------------------------------------------------------ */
  function initHero() {
    var hero = $("#hero");
    if (!hero) return;
    var track = $(".hero__track", hero);
    var slides = $$(".hero__slide", hero);
    var dotsWrap = $(".hero__dots", hero);
    var index = 0;
    var timer;

    dotsWrap.innerHTML = slides.map(function (_, i) {
      return '<li><button type="button" class="' + (i === 0 ? "is-active" : "") + '" aria-label="Slide ' + (i + 1) + '">' + (i + 1) + "</button></li>";
    }).join("");
    var dots = $$("button", dotsWrap);

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-100 * index) + "%)";
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === index); });
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === index); });
    }
    function play() { clearInterval(timer); timer = setInterval(function () { go(index + 1); }, 5000); }

    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); play(); }); });
    $$("[data-hero-step]", hero).forEach(function (b) {
      b.addEventListener("click", function () { go(index + Number(b.getAttribute("data-hero-step"))); play(); });
    });
    hero.addEventListener("mouseenter", function () { clearInterval(timer); });
    hero.addEventListener("mouseleave", play);
    addSwipe(hero, function (dir) { go(index + dir); play(); });
    play();
  }


  /* ------------------------------------------------------------------ */
  /* Banners: <992 becomes an autoplay slide carousel with dots          */
  /* ------------------------------------------------------------------ */
  function initBanners() {
    var wrap = $("#banners");
    if (!wrap) return;
    var track = $(".banners__track", wrap);
    var items = $$(".banners__item", wrap);
    var dotsWrap = $(".banners__dots", wrap);
    var index = 0;
    var timer;

    dotsWrap.innerHTML = items.map(function (_, i) {
      return '<li><button type="button" class="dot' + (i === 0 ? " is-active" : "") + '" aria-label="' + (i + 1) + '">' + (i + 1) + "</button></li>";
    }).join("");
    var dots = $$(".dot", dotsWrap);

    function active() { return window.innerWidth < 992; }
    function go(i) {
      index = (i + items.length) % items.length;
      track.style.transform = active() ? "translateX(" + (-100 * index) + "%)" : "";
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === index); });
    }
    function play() {
      clearInterval(timer);
      if (active()) timer = setInterval(function () { go(index + 1); }, 4000);
    }

    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); play(); }); });
    addSwipe(wrap, function (dir) { if (active()) { go(index + dir); play(); } });
    window.addEventListener("resize", function () { go(active() ? index : 0); play(); });
    play();
  }

  /* simple horizontal swipe detection */
  function addSwipe(el, cb) {
    var x0 = null, y0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) cb(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Carousel: fractional slidesToShow, non-infinite, drag + arrows      */
  /* breakpoints: >1024 / ≤1024 / <991 ; ≤767 → native scroll (CSS)      */
  /* ------------------------------------------------------------------ */
  function initCarousel(el) {
    var viewport = $(".carousel__viewport", el);
    var track = $(".carousel__track", el);
    var prev = $(".carousel__arrow--prev", el);
    var next = $(".carousel__arrow--next", el);
    var show = el.getAttribute("data-show").split(",").map(Number);
    var index = 0;

    function perView() {
      var w = window.innerWidth;
      if (w < 991) return show[2];
      if (w <= 1024) return show[1];
      return show[0];
    }
    function slideW() { return Math.ceil(viewport.clientWidth / perView()); }
    function isNative() { return window.innerWidth <= 767; }
    function items() { return Array.prototype.slice.call(track.children); }
    function maxIndex() { return Math.max(0, Math.ceil(items().length - perView())); }

    function layout() {
      if (isNative()) {
        items().forEach(function (it) { it.style.width = ""; });
        track.style.transform = "";
        return;
      }
      var w = slideW();
      items().forEach(function (it) { it.style.width = w + "px"; });
      update();
    }
    function offsetFor(i) {
      var w = slideW();
      var maxOffset = Math.max(0, items().length * w - viewport.clientWidth);
      return Math.min(i * w, maxOffset);
    }
    function update() {
      if (isNative()) return;
      index = Math.max(0, Math.min(index, maxIndex()));
      track.style.transform = "translate3d(" + (-offsetFor(index)) + "px,0,0)";
      prev.classList.toggle("is-disabled", index === 0);
      next.classList.toggle("is-disabled", index >= maxIndex());
    }

    prev.addEventListener("click", function () { index--; update(); });
    next.addEventListener("click", function () { index++; update(); });

    // mouse / touch drag
    var startX = null, startOffset = 0, moved = false;
    function down(x) {
      if (isNative()) return;
      startX = x; startOffset = offsetFor(index); moved = false;
      track.classList.add("is-dragging");
    }
    function move(x) {
      if (startX === null) return;
      var dx = x - startX;
      if (Math.abs(dx) > 5) moved = true;
      track.style.transform = "translate3d(" + (-(startOffset - dx)) + "px,0,0)";
    }
    function up(x) {
      if (startX === null) return;
      track.classList.remove("is-dragging");
      var dx = x - startX;
      var w = slideW();
      if (Math.abs(dx) > w / 5) index += dx < 0 ? Math.max(1, Math.round(-dx / w)) : -Math.max(1, Math.round(dx / w));
      startX = null;
      update();
    }
    viewport.addEventListener("mousedown", function (e) { e.preventDefault(); down(e.clientX); });
    window.addEventListener("mousemove", function (e) { move(e.clientX); });
    window.addEventListener("mouseup", function (e) { up(e.clientX); });
    viewport.addEventListener("touchstart", function (e) { down(e.touches[0].clientX); }, { passive: true });
    viewport.addEventListener("touchmove", function (e) { move(e.touches[0].clientX); }, { passive: true });
    viewport.addEventListener("touchend", function (e) { up(e.changedTouches[0].clientX); });
    viewport.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    viewport.addEventListener("dragstart", function (e) { e.preventDefault(); });

    window.addEventListener("resize", layout);
    layout();
  }

  /* ------------------------------------------------------------------ */
  initHeaderScroll();
  initToggles();
  initMegamenu();
  initMobileMenu();
  initFooterAccordion();
  initHero();
  initBanners();
  $$("[data-carousel]").forEach(initCarousel);

  if (window.Mauve) {
    window.Mauve.initCarousel = initCarousel;
    window.Mauve.slideToggle = slideToggle;
  }
})();
