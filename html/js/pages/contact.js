(function () {
  "use strict";
  var form = document.getElementById("contact-form");
  var msg = document.querySelector(".contact__msg");
  form.addEventListener("submit", function () { msg.hidden = false; });
})();
