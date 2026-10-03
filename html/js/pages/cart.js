(function () {
  "use strict";
  var M = window.Mauve;
  var R = M.routes;
  var root = document.getElementById("cart-page");

  function variant(i) {
    var html = '<dl class="cart-variant">';
    if (i.color) html += '<dd class="variant-value">' + (i.chip ? '<span class="variant-chip" style="background-image:url(' + M.chipUrl(i.chip) + ')"></span>' : "") + M.esc(i.color) + "</dd>";
    if (i.size) html += '<dd class="variant-value">size ' + M.esc(i.size) + "</dd>";
    return html + "</dl>";
  }

  function qty(i) {
    return '<div class="qty-ctrl"><button type="button" data-step="-1" data-id="' + i.id + '">-</button>' +
      '<input type="number" min="1" value="' + i.qty + '" data-cart-qty="' + i.id + '">' +
      '<button type="button" data-step="1" data-id="' + i.id + '">+</button></div>';
  }

  function render() {
    var c = M.cart.get();
    if (!c.items.length) {
      root.innerHTML = '<div class="cart-page__empty"><h3>GIỎ HÀNG</h3><p>Giỏ hàng của bạn trống</p><p><a href="' + R.collection("all") + '">Tiếp tục mua sắm</a></p></div>';
      return;
    }
    root.innerHTML =
      '<h3 class="cart-page__title">Giỏ hàng</h3>' +
      '<div class="cart-head"><div>Sản phẩm</div><div></div><div>Giá</div><div>Số lượng</div><div>Tổng giá trị</div></div>' +
      '<div class="cart-rows">' + c.items.map(function (i) {
        var url = R.product(i.handle);
        return '<div class="cart-row">' +
          '<div class="cart-row__img"><a class="cart-row__remove" href="#" data-cart-remove="' + i.id + '" aria-label="Xoá"><svg viewBox="24 24 52 52"><use href="#i-x"/></svg></a>' +
            '<a href="' + url + '"><img src="' + i.image + '" alt="' + M.esc(i.title) + '"></a></div>' +
          '<div class="cart-row__info"><a href="' + url + '">' + M.esc(i.title) + "</a>" + variant(i) +
            '<div class="cart-row__mobile"><div class="price">' + M.money(i.price) + '</div><div class="line">' + qty(i) +
            '<button type="button" data-cart-remove="' + i.id + '" aria-label="Xoá"><svg viewBox="24 24 52 52"><use href="#i-x"/></svg></button></div></div>' +
          "</div>" +
          '<div class="cart-row__price">' + M.money(i.price) + "</div>" +
          '<div class="cart-row__qty">' + qty(i) + "</div>" +
          '<div class="cart-row__total">' + M.money(i.price * i.qty) + "</div>" +
        "</div>";
      }).join("") + "</div>" +
      '<div class="cart-foot">' +
        '<div class="cart-note-box"><h4>Ghi chú</h4><textarea class="js-page-note" placeholder="Thêm ghi chú đặc biệt cho đơn hàng">' + M.esc(c.note || "") + "</textarea>" +
          '<a class="cart-continue" href="' + R.collection("all") + '"><svg><use href="#i-long-arrow"/></svg>Chọn thêm Sản phẩm</a></div>' +
        '<div class="cart-order">' +
          '<div class="cart-order__total"><div>Tạm tính</div><div>' + M.money(M.cart.total()) + "</div></div>" +
          '<div class="cart-order__line"><div><b>Giao hàng</b></div><div>sẽ tính ở trang thanh toán</div></div>' +
          '<div class="cart-order__line"><div><b>Mã giảm giá</b></div><div>sử dụng tại trang thanh toán (nếu có)</div></div>' +
          // demo clone: there is no checkout behind this button
          '<a class="btn-checkout" href="#" data-checkout>THANH TOÁN</a>' +
          '<div class="cart-order__links"><a href="' + R.page("chinh-sach-giao-hang") + '">Chính sách giao hàng</a><a href="' + R.page("phuong-thuc-thanh-toan") + '">Phương thức thanh toán</a></div>' +
        "</div>" +
      "</div>";
  }

  root.addEventListener("click", function (e) {
    var step = e.target.closest("[data-step]");
    if (step) {
      var id = Number(step.getAttribute("data-id"));
      var item = M.cart.get().items.filter(function (i) { return i.id === id; })[0];
      if (item) M.cart.setQty(id, Math.max(1, item.qty + Number(step.getAttribute("data-step"))));
      return;
    }
    if (e.target.closest("[data-checkout]")) e.preventDefault();
  });
  root.addEventListener("change", function (e) {
    if (e.target.matches(".js-page-note")) M.cart.setNote(e.target.value);
  });

  document.addEventListener("cart:change", function () {
    if (!root.contains(document.activeElement) || !document.activeElement.matches(".js-page-note")) render();
  });
  render();
})();
