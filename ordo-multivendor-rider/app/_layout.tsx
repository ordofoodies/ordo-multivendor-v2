/* eslint-disable @typescript-eslint/no-require-imports */
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
// import * as Sentry from "sentry-expo";
import * as Sentry from "@sentry/react-native";

import FlashMessage from "react-native-flash-message";

// Service
import setupApollo from "@/lib/apollo";
import { initSentry } from "@/lib/utils/service";

// Providers
import { AuthProvider } from "@/lib/context/global/auth.context";
import { ConfigurationProvider } from "@/lib/context/global/configuration.context";
import { LocationProvider } from "@/lib/context/global/location.context";
import { SoundProvider } from "@/lib/context/global/sound.context";
import { UserProvider } from "@/lib/context/global/user.context";
import { ApolloProvider } from "@apollo/client";

// Locale
import "@/i18next";

// Style
import InternetProvider from "@/lib/context/global/internet-provider";
import AppThemeProvidor from "@/lib/context/global/theme.context";
import RootStackLayout from "@/lib/ui/layouts/root-layout";
import { LocationPermissionComp } from "@/lib/ui/useable-components";
import AnimatedSplashScreen from "@/lib/ui/useable-components/splash/AnimatedSplashScreen";
import UnavailableStatus from "@/lib/ui/useable-components/unavailable-status";
import { requestMediaLibraryPermissionsAsync } from "expo-image-picker";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RIDER_TOKEN } from "@/lib/utils/constants";
import { router } from "expo-router";

import "../global.css";

initSentry();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen?.preventAutoHideAsync();


function RootLayout() {
  const [alreadyUserModal, setAlreadyUserModal] = useState(false);

  // Hooks
  const [loaded] = useFonts({
    SpaceMono: require("../lib/assets/fonts/SpaceMono-Regular.ttf"),
    Inter: require("../lib/assets/fonts/Inter.ttf"),
  });
  const client = setupApollo();

  // Permissions
  async function grantCameraAndGalleryPermissions() {
    await requestMediaLibraryPermissionsAsync();
  }

  // Use Effect
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log("Global Error Caught:", { error, isFatal });
  });
  useEffect(() => {
    grantCameraAndGalleryPermissions();
  }, []);
  // Deep link handling — only handles already-open app case
  // (cold start is handled by app/invite.tsx via expo-router)
  useEffect(() => {
    async function handleDeepLink(url: string) {
      const parsed = Linking.parse(url);
      const ref = parsed.queryParams?.ref as string | undefined;
      if (!ref) return;

      const token = await AsyncStorage.getItem(RIDER_TOKEN);
      if (token) {
        setAlreadyUserModal(true);
      }
      // no-token case: expo-router routes to /invite which redirects to /signup?ref=
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AnimatedSplashScreen>
      <Modal transparent animationType="fade" visible={alreadyUserModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Already a Rider</Text>
            <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 }}>You already have an account. Log in to continue.</Text>
            <TouchableOpacity
              onPress={() => setAlreadyUserModal(false)}
              style={{ backgroundColor: "#000", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <AppThemeProvidor>
        <ApolloProvider client={client}>
          <AuthProvider client={client}>
            <UserProvider>
              <InternetProvider>
                <ConfigurationProvider>
                  <LocationProvider>
                    <SoundProvider>
                      <LocationPermissionComp>
                        <RootStackLayout />
                        <UnavailableStatus />
                      </LocationPermissionComp>
                      <StatusBar style="inverted" />
                      <FlashMessage position="bottom" />
                    </SoundProvider>
                  </LocationProvider>
                </ConfigurationProvider>
              </InternetProvider>
            </UserProvider>
          </AuthProvider>
        </ApolloProvider>
      </AppThemeProvidor>
    </AnimatedSplashScreen>
  );
}

export default Sentry.wrap(RootLayout);
