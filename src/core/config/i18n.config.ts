import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Translation resources
import enTranslation from '@/assets/locales/en/translation.json'
import esTranslation from '@/assets/locales/es/translation.json'

const resources = {
  en: {
    translation: enTranslation,
  },
  es: {
    translation: esTranslation,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: navigator.language.split('-')[0] || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
