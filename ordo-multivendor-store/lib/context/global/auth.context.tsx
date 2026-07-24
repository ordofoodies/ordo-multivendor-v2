// Apollo
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";

// Core
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";

// Constants
import { LANGUAGES, STORE_TOKEN } from "@/lib/utils/constants";

// Interfaces
import { IAuthContext, IAuthProviderProps } from "@/lib/utils/interfaces";

// Expo
import * as Localization from "expo-localization";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

// I18n
import { changeLanguage } from "i18next";

export const AuthContext = React.createContext<IAuthContext>(
  {} as IAuthContext,
);

const DEFAULT_LANGUAGE = "en";
const supportedLanguageCodes = LANGUAGES.map((language) => language.code);

const normalizeLanguageCode = (languageCode?: string | null): string => {
  if (!languageCode) return DEFAULT_LANGUAGE;

  const normalizedCode = languageCode.toLowerCase().split("-")[0];
  const appLanguageCode = normalizedCode === "ja" ? "jp" : normalizedCode;

  return supportedLanguageCodes.includes(appLanguageCode)
    ? appLanguageCode
    : DEFAULT_LANGUAGE;
};

const getDeviceLanguage = (): string => {
  const deviceLocale = Localization.getLocales()[0];

  return normalizeLanguageCode(deviceLocale?.languageTag ?? deviceLocale?.languageCode);
};

export const AuthProvider: React.FC<IAuthProviderProps> = ({
  client,
  children,
}) => {
  // States
  const [isSelected, setIsSelected] = useState("");
  const [token, setToken] = useState<string>("");
  
  const setTokenAsync = async (token: string) => {
    await SecureStore.setItemAsync(STORE_TOKEN, token);
    client.clearStore();
    setToken(token);
  };

  // Handlers
  const handleSetCurrentLanguage = async () => {
    try {
      const lng = await AsyncStorage.getItem("lang");

      const selectedLanguage = lng
        ? normalizeLanguageCode(lng)
        : getDeviceLanguage();
      
      await changeLanguage(selectedLanguage);
      setIsSelected(selectedLanguage);
      
    } catch (error) {
      console.error("Language setting error:", error);
      // Ultimate fallback
      try {
        await changeLanguage(DEFAULT_LANGUAGE);
        setIsSelected(DEFAULT_LANGUAGE);
      } catch (fallbackError) {
        console.error("Fallback language setting failed:", fallbackError);
      }
    }
  };

  const logout = async () => {
    try {
      client.stop();
      await Promise.all([
        client.clearStore(),
        SecureStore.deleteItemAsync(STORE_TOKEN),
        AsyncStorage.removeItem("store-id"),
      ]);

      setToken("");
      router.replace("/(un-protected)/login");
    } catch (e) {
      console.error("Logout Error: ", { e });
    }
  };

  async function checkAuth() {
    try {
      const token = await SecureStore.getItemAsync(STORE_TOKEN);
      const storeId = await AsyncStorage.getItem("store-id");

      if (!storeId || !token) {
        return await logout();
      }
      setToken(token);
    } catch (error) {
      console.error("error getting store id & token", error);
      await logout();
    }
  }

  // UseEffects
  useEffect(() => {
    handleSetCurrentLanguage();
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (__DEV__) {
      loadDevMessages();
      loadErrorMessages();
    }
  }, []);

  const values: IAuthContext = {
    token: token ?? "",
    logout,
    setTokenAsync,
    isSelected,
    setIsSelected,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};
