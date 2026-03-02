// app/_layout.tsx
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import "../global.css";

export const unstable_settings = {
  initialRouteName: "(tabs)", // অ্যাপ শুরু হলে সরাসরি tabs এ যাবে
};

// Reanimated-এর strict warning বন্ধ করার জন্য
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* screenOptions={{ headerShown: false }} দেওয়ায় এক্সপোর ডিফল্ট হেডার রিমুভ হয়ে যাবে।
        যেহেতু এটি <Stack>, তাই এই পেজগুলোতে (login, checkout, invoice) কোনো Bottom Tab Bar দেখাবে না। 
      */}
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {/* Main Tabs (এর ভেতরেই শুধু বটম বার থাকবে) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Modal Example */}
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: true, title: "Modal" }}
        />
      </Stack>

      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
