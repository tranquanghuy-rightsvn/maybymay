/* Cart page: product list on the left, order summary on the right. */
(function () {
  "use strict";
  var M = window.Mauve;
  var R = M.routes;
  var root = document.getElementById("cart-page");

  function render() {
    var c = M.cart.get();
    if (!c.items.length) {
      root.innerHTML = '<h1 class="cart-page__title">Giỏ hàng</h1>' + M.emptyCart();
      return;
    }
    var total = M.money(M.cart.total());
    root.innerHTML =
      '<h1 class="cart-page__title">Giỏ hàng <span>(' + M.cart.count() + ")</span></h1>" +
      '<div class="cart-layout">' +
        '<div class="cart-list">' + c.items.map(function (i) {
          var url = R.product(i.handle);
          return '<div class="cart-line">' +
            '<a class="cart-line__img" href="' + url + '"><img src="' + i.image + '" alt="' + M.esc(i.title) + '"></a>' +
            '<div class="cart-line__info">' +
              '<a class="cart-line__title" href="' + url + '">' + M.esc(i.title) + "</a>" +
              '<p class="cart-line__variant">' + M.esc(M.variantText(i)) + "</p>" +
              '<p class="cart-line__unit">' + M.money(i.price) + "</p>" +
            "</div>" +
            '<div class="cart-line__qty">' + M.qtyControl(i) + "</div>" +
            '<b class="cart-line__total">' + M.money(i.price * i.qty) + "</b>" +
            '<button type="button" class="cart-line__remove" data-cart-remove="' + i.id + '" aria-label="Xoá ' + M.esc(i.title) + '"><svg><use href="#i-x"/></svg></button>' +
          "</div>";
        }).join("") +
          '<a class="cart-continue" href="' + R.collection("san-pham-moi") + '">‹ Tiếp tục mua sắm</a>' +
        "</div>" +
        '<aside class="cart-summary">' +
          '<h2 class="checkout__h2">Tóm tắt đơn hàng</h2>' +
          '<div class="checkout__row"><span>Tạm tính</span><span>' + total + "</span></div>" +
          '<div class="checkout__row"><span>Phí giao hàng</span><span>Báo khi xác nhận đơn</span></div>' +
          '<div class="checkout__row checkout__row--total"><span>Tổng cộng</span><b>' + total + "</b></div>" +
          '<a class="btn-checkout" href="' + R.checkout() + '">Thanh toán</a>' +
          '<ul class="cart-summary__notes">' +
            "<li>Được kiểm tra hàng trước khi thanh toán</li>" +
            '<li>Đổi size trong 7 ngày — <a href="' + R.page("chinh-sach-doi-hang") + '">xem chính sách</a></li>' +
            '<li>Thanh toán COD hoặc chuyển khoản — <a href="' + R.page("phuong-thuc-thanh-toan") + '">chi tiết</a></li>' +
          "</ul>" +
        "</aside>" +
      "</div>";
  }

  // quantities are committed on "change" (blur / Enter), so re-rendering never interrupts typing
  document.addEventListener("cart:change", render);
  render();
})();
