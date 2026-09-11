import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";

const savedLanguage = localStorage.getItem("civicdesk_language") || "AM";

const resources = {
  en: { translation: en },
  am: { translation: am },
};

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage.toLowerCase() === "en" ? "en" : "am",
  fallbackLng: "am",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
