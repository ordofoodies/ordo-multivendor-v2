import { useLocalSearchParams, router } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RIDER_TOKEN } from "@/lib/utils/constants";

export default function InviteScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>();

  useEffect(() => {
    async function handle() {
      const token = await AsyncStorage.getItem(RIDER_TOKEN);
      if (token) {
        // Logged in — go home, _layout modal will show
        router.replace("/(tabs)/home" as any);
      } else {
        router.replace(ref ? `/signup?ref=${ref}` as any : "/login");
      }
    }
    handle();
  }, [ref]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
