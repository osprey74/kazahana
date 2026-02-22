// kazahana - language detection & redirect
(function () {
  var langMap = {
    ja: "ja",
    en: "en",
    pt: "pt-BR",
    "pt-BR": "pt-BR",
    de: "de",
    "zh-TW": "zh-TW",
    "zh-HK": "zh-TW",
    zh: "zh-CN",
    "zh-CN": "zh-CN",
    fr: "fr",
    ko: "ko",
    es: "es",
    ru: "ru",
    id: "id",
  };

  var lang = navigator.language || navigator.userLanguage || "en";

  // Try exact match first (e.g. "pt-BR"), then base language (e.g. "pt")
  var target = langMap[lang] || langMap[lang.split("-")[0]] || "en";

  var base = document.querySelector('meta[name="base-path"]');
  var basePath = base ? base.content : "/kazahana/";

  window.location.replace(basePath + target + "/");
})();
