import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fr from './fr.json';
import rw from './rw.json';

const savedLang = localStorage.getItem('appLang') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr },
            rw: { translation: rw },
        },
        lng: savedLang,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

i18n.on('languageChanged', (lng) => {
    localStorage.setItem('appLang', lng);
});

export default i18n;
