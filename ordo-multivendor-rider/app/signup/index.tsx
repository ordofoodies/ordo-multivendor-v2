import SignUpScreen from "@/lib/ui/screens/signup";
import { useLocalSearchParams } from "expo-router";

export default function SignUpPage() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  return <SignUpScreen referralCode={ref} />;
}
