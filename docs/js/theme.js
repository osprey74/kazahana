// kazahana - theme toggle (light/dark/auto)
(function () {
  var root = document.documentElement;
  var stored = localStorage.getItem("kazahana-theme");

  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  }

  function getEffectiveTheme() {
    var theme = root.getAttribute("data-theme");
    if (theme) return theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function updateIcon() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var icon = btn.querySelector(".material-symbols-rounded");
    if (!icon) return;
    icon.textContent = getEffectiveTheme() === "dark" ? "light_mode" : "dark_mode";
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateIcon();

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = getEffectiveTheme();
        var next = current === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        localStorage.setItem("kazahana-theme", next);
        updateIcon();
      });
    }
  });

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function () {
      if (!localStorage.getItem("kazahana-theme")) {
        updateIcon();
      }
    });
})();
