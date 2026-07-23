import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// Import language files
import { en } from "./languages/en";
import { de } from "./languages/de";
import { fr } from "./languages/fr";
import { km } from "./languages/km";
import { zh } from "./languages/zh";
import { ar } from "./languages/ar";
import { he } from "./languages/he";
import { hi } from "./languages/hi";
import { es } from "./languages/es";
import { bn } from "./languages/bn";
import { pt } from "./languages/pt";
import { ru } from "./languages/ru";
import { ur } from "./languages/ur";
import { id } from "./languages/id";
import { jp } from "./languages/jp";
import { tr } from "./languages/tr";
import { mr } from "./languages/mr";
import { te } from "./languages/te";
import { vi } from "./languages/vi";
import { ko } from "./languages/ko";
import { it } from "./languages/it";
import { th } from "./languages/th";
import { gu } from "./languages/gu";
import { fa } from "./languages/fa";
import { pl } from "./languages/pl";
import { ps } from "./languages/ps";
import { ro } from "./languages/ro";
import { ku } from "./languages/ku";
import { uz } from "./languages/uz";
import { az } from "./languages/az";
import { nl } from "./languages/nl";

// Define language resources
export const languageResources: { [key: string]: { translation: object } } = {
  en: { translation: en },
  zh: { translation: zh },
  de: { translation: de },
  fr: { translation: fr },
  km: { translation: km },
  ar: { translation: ar },
  he: { translation: he },
  hi: { translation: hi },
  es: { translation: es },
  bn: { translation: bn },
  pt: { translation: pt },
  ru: { translation: ru },
  ur: { translation: ur },
  id: { translation: id },
  jp: { translation: jp },
  tr: { translation: tr },
  mr: { translation: mr },
  te: { translation: te },
  vi: { translation: vi },
  ko: { translation: ko },
  it: { translation: it },
  th: { translation: th },
  gu: { translation: gu },
  fa: { translation: fa },
  pl: { translation: pl },
  ps: { translation: ps },
  ro: { translation: ro },
  ku: { translation: ku },
  uz: { translation: uz },
  az: { translation: az },
  nl: { translation: nl },
};

const LANGUAGE_STORAGE_KEY = "enatega-language";
const DEFAULT_LANGUAGE = "en";

const normalizeLanguageCode = (languageCode?: string | null): string => {
  if (!languageCode) return DEFAULT_LANGUAGE;

  const normalizedCode = languageCode.toLowerCase().split("-")[0];
  const appLanguageCode = normalizedCode === "ja" ? "jp" : normalizedCode;

  return languageResources[appLanguageCode] ? appLanguageCode : DEFAULT_LANGUAGE;
};

const getDeviceLanguage = (): string => {
  const deviceLocale = Localization.getLocales()[0];

  return normalizeLanguageCode(deviceLocale?.languageTag ?? deviceLocale?.languageCode);
};

// Use the saved language if the user selected one, otherwise follow the device language.
const getInitialLanguage = async (): Promise<string> => {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  return storedLang ? normalizeLanguageCode(storedLang) : getDeviceLanguage();
};

const initializeLanguage = async (): Promise<void> => {
  try {
    const initialLang = await getInitialLanguage();

    await i18next.use(initReactI18next).init({
      lng: initialLang,
      fallbackLng: DEFAULT_LANGUAGE,
      resources: languageResources,
    });
  } catch (error) {
    console.log("Error initializing language:", error);
  }
};

// Initialize language
initializeLanguage();

export default i18next;
