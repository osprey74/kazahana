import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ja from "./locales/ja.json";
import en from "./locales/en.json";
import pt from "./locales/pt.json";
import de from "./locales/de.json";
import zhTW from "./locales/zh-TW.json";
import zhCN from "./locales/zh-CN.json";
import fr from "./locales/fr.json";
import ko from "./locales/ko.json";
import es from "./locales/es.json";
import ru from "./locales/ru.json";
import id from "./locales/id.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      pt: { translation: pt },
      de: { translation: de },
      "zh-TW": { translation: zhTW },
      "zh-CN": { translation: zhCN },
      fr: { translation: fr },
      ko: { translation: ko },
      es: { translation: es },
      ru: { translation: ru },
      id: { translation: id },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
