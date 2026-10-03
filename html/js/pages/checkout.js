/* Checkout page: buyer details, province / ward pickers (window.VN_AREA from js/vn-area.js),
   payment method (COD or bank transfer with QR), order summary from the cart (localStorage). */
(function () {
  "use strict";
  var M = window.Mauve;

  /* ---------------- settings: fill these in when they are ready ---------------- */
  // Orders are sent to API_URL in js/store.js (the CMS). The server re-checks prices and stock.
  // Bank account for transfers. With bankId (VietQR bank code, e.g. "VCB", "MB", "TCB") and account
  // filled in, the demo QR is replaced by a real VietQR code that already contains amount + content.
  var BANK = { bankId: "", bankName: "", account: "", holder: "HO KINH DOANH THOI TRANG MAY BY MAY" };

  var form = document.getElementById("checkout-form");
  if (!form) return;
  var layout = document.getElementById("checkout-layout");
  var emptyBox = document.getElementById("checkout-empty");
  var successBox = document.getElementById("checkout-success");
  var errorEl = document.getElementById("checkout-error");
  var submitBtn = document.getElementById("checkout-submit");
  var provinceSel = document.getElementById("province-select");
  var wardSel = document.getElementById("ward-select");
  var bankBox = document.getElementById("pay-bank");
  var confirmBox = document.getElementById("pay-confirm");
  var area = window.VN_AREA || [];

  // order code shown to the buyer and used as the transfer content: MBM + yymmdd + 4 digits
  var orderCode = (function () {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return "MBM" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + Math.floor(1000 + Math.random() * 9000);
  })();

  /* ---------------- address pickers ---------------- */
  provinceSel.innerHTML = '<option value="">Chọn Tỉnh / Thành phố</option>' +
    area.map(function (p, i) { return '<option value="' + i + '">' + M.esc(p.n) + "</option>"; }).join("");

  function fillWards() {
    var p = area[provinceSel.value];
    if (!p) {
      wardSel.innerHTML = '<option value="">Chọn Tỉnh / Thành trước</option>';
      wardSel.disabled = true;
      return;
    }
    wardSel.innerHTML = '<option value="">Chọn Phường / Xã</option>' +
      p.w.map(function (w) { return '<option>' + M.esc(w) + "</option>"; }).join("");
    wardSel.disabled = false;
  }
  provinceSel.addEventListener("change", fillWards);

  /* ---------------- order summary ---------------- */
  function variantText(i) {
    return [i.color, i.size ? "size " + i.size : ""].filter(Boolean).join(" / ");
  }

  function render() {
    var c = M.cart.get();
    var empty = !c.items.length;
    emptyBox.hidden = !empty || !successBox.hidden;
    layout.hidden = empty;
    if (empty) return;
    document.getElementById("checkout-items").innerHTML = c.items.map(function (i) {
      return '<div class="checkout__item">' +
        '<div class="checkout__thumb"><img src="' + i.image + '" alt="' + M.esc(i.title) + '"><span>' + i.qty + "</span></div>" +
        '<div class="checkout__item-info"><p>' + M.esc(i.title) + "</p><small>" + M.esc(variantText(i)) + "</small></div>" +
        "<b>" + M.money(i.price * i.qty) + "</b>" +
      "</div>";
    }).join("");
    var total = M.cart.total();
    document.querySelector(".js-subtotal").textContent = M.money(total);
    document.querySelector(".js-total").textContent = M.money(total);
    updateBank();
  }

  /* ---------------- payment method ---------------- */
  function method() {
    var r = form.querySelector('input[name="payment"]:checked');
    return r ? r.value : "cod";
  }

  function transferContent() {
    var phone = (form.phone.value || "").replace(/\D/g, "");
    return orderCode + (phone ? " " + phone : "");
  }

  function updateBank() {
    var amount = M.cart.total();
    document.querySelector(".js-bank-amount").textContent = M.money(amount);
    document.querySelector(".js-bank-content").textContent = transferContent();
    if (BANK.bankName) document.querySelector(".js-bank-name").textContent = BANK.bankName;
    if (BANK.account) document.querySelector(".js-bank-account").textContent = BANK.account;
    if (BANK.bankId && BANK.account) {
      var img = bankBox.querySelector("img");
      img.src = "https://img.vietqr.io/image/" + encodeURIComponent(BANK.bankId) + "-" + encodeURIComponent(BANK.account) +
        "-compact2.png?amount=" + amount + "&addInfo=" + encodeURIComponent(transferContent()) +
        "&accountName=" + encodeURIComponent(BANK.holder);
      img.alt = "Mã QR chuyển khoản";
      var badge = bankBox.querySelector(".pay-bank__badge");
      if (badge) badge.hidden = true;
    }
  }

  function syncPayment() {
    var bank = method() === "bank";
    bankBox.hidden = !bank;
    confirmBox.hidden = !bank;
    form.querySelectorAll(".pay-option").forEach(function (o) {
      o.classList.toggle("is-active", o.querySelector("input").checked);
    });
  }
  form.addEventListener("change", function (e) {
    if (e.target.name === "payment") syncPayment();
  });
  form.phone.addEventListener("input", updateBank);

  /* ---------------- validation + submit ---------------- */
  function showError(msg, field) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    if (field) {
      field.classList.add("is-invalid");
      field.focus();
    }
  }
  form.addEventListener("input", function (e) { e.target.classList && e.target.classList.remove("is-invalid"); });
  form.addEventListener("change", function (e) { e.target.classList && e.target.classList.remove("is-invalid"); });

  function validate() {
    form.querySelectorAll(".is-invalid").forEach(function (f) { f.classList.remove("is-invalid"); });
    if (!form.name.value.trim()) return showError("Vui lòng nhập họ và tên.", form.name), false;
    var phone = form.phone.value.replace(/[\s.\-]/g, "");
    if (!/^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(phone)) return showError("Số điện thoại chưa đúng (ví dụ 0912 345 678).", form.phone), false;
    if (form.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value)) return showError("Email chưa đúng định dạng.", form.email), false;
    if (!provinceSel.value) return showError("Vui lòng chọn Tỉnh / Thành phố.", provinceSel), false;
    if (!wardSel.value) return showError("Vui lòng chọn Phường / Xã.", wardSel), false;
    if (!form.address.value.trim()) return showError("Vui lòng nhập địa chỉ cụ thể.", form.address), false;
    if (method() === "bank" && !form.paid.checked) return showError("Vui lòng xác nhận bạn đã chuyển khoản.", form.paid), false;
    errorEl.hidden = true;
    return true;
  }

  function payload() {
    var c = M.cart.get();
    return {
      form: "order",
      code: orderCode,
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      province: area[provinceSel.value] ? area[provinceSel.value].n : "",
      ward: wardSel.value,
      address: form.address.value.trim(),
      note: [form.note.value.trim(), c.note].filter(Boolean).join(" | "),
      paymentMethod: method(),
      items: c.items.map(function (i) {
        return { handle: i.handle, title: i.title, color: i.color, size: i.size, qty: i.qty, price: i.price };
      }),
      total: M.cart.total(),
      hp: form.hp.value // honeypot: must stay empty
    };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!M.cart.get().items.length || !validate()) return;
    var data = payload();
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi đơn…";
    M.post(data).then(function (res) {
      if (!res || !res.ok) {
        showError((res && res.error) || "Đặt hàng chưa thành công, vui lòng thử lại.");
        return;
      }
      document.querySelector(".js-order-code").textContent = res.code || orderCode;
      successBox.hidden = false;
      layout.hidden = true;
      M.cart.clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Đặt hàng";
    });
  });

  document.addEventListener("cart:change", render);
  syncPayment();
  render();
})();
