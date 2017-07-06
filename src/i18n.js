import i18n from "i18next";
import LngDetector from "i18next-browser-languagedetector";

i18n.use(LngDetector).init({
  detection: {
    order: ["navigator"]
  },

  fallbackLng: "en",
  resources: {
    en: {
      translation: require("../locales/en/translation.json")
    },
    nl: {
      translation: require("../locales/nl/translation.json")
    }
  },
  debug: true,
  interpolation: {
    escapeValue: false, // not needed for react!!
    formatSeparator: ",",
    format: function(value, format, lng) {
      if (format === "uppercase") return value.toUpperCase();
      return value;
    }
  }
});

export default i18n;
