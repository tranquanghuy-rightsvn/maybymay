/* Contact form: validates, then sends { form: "contact", ... } to the CMS (API_URL in js/store.js). */
(function () {
  "use strict";
  var M = window.Mauve;
  var form = document.getElementById("contact-form");
  if (!form) return;
  var msg = document.querySelector(".contact__msg");
  var btn = document.getElementById("contact-submit");

  function say(text, isError) {
    msg.textContent = text;
    msg.classList.toggle("is-error", !!isError);
    msg.hidden = false;
  }

  function invalid(field, text) {
    field.classList.add("is-invalid");
    field.focus();
    say(text, true);
    return false;
  }

  function validate() {
    form.querySelectorAll(".is-invalid").forEach(function (f) { f.classList.remove("is-invalid"); });
    if (!form.name.value.trim()) return invalid(form.name, "Vui lòng nhập tên.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) return invalid(form.email, "Email chưa đúng định dạng.");
    var phone = form.phone.value.replace(/[\s.\-]/g, "");
    if (phone && !/^(\+84|84|0)\d{9,10}$/.test(phone)) return invalid(form.phone, "Số điện thoại chưa đúng (ví dụ 0912 345 678).");
    if (!form.message.value.trim()) return invalid(form.message, "Vui lòng nhập lời nhắn.");
    return true;
  }
  form.addEventListener("input", function (e) { e.target.classList && e.target.classList.remove("is-invalid"); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;
    var data = {
      form: "contact",
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      order_code: form.order_code.value.trim(),
      topic: form.topic.value,
      message: form.message.value.trim(),
      hp: form.hp.value // honeypot: must stay empty
    };
    btn.disabled = true;
    btn.textContent = "Đang gửi…";
    msg.hidden = true;
    M.post(data).then(function (res) {
      if (!res || !res.ok) {
        say((res && res.error) || "Gửi chưa thành công, vui lòng thử lại.", true);
        return;
      }
      form.reset();
      say("Cảm ơn bạn! May By Mây đã nhận được lời nhắn và sẽ liên hệ lại sớm.");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Gửi liên hệ";
    });
  });
})();
