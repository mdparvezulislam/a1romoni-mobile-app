// app/login.tsx
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Phone,
  ShieldCheck,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();

  // ✅ MAGIC FIX: Zustand Store থেকে সরাসরি 'login' ফাংশনটি নেওয়া হলো
  const login = useAuthStore((state) => state.login);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Validation
    if (!phone.trim()) {
      Alert.alert("ভুল", "দয়া করে আপনার ফোন নম্বর দিন।");
      return;
    }
    if (!password.trim()) {
      Alert.alert("ভুল", "দয়া করে পাসওয়ার্ড দিন।");
      return;
    }

    setLoading(true);

    try {
      // 2. Fetch API Call
      const response = await fetch(
        "https://stock-a1romoni.vercel.app/api/mobile/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone,
            password: password,
          }),
        },
      );

      const data = await response.json();

      // 3. Handle Response
      if (response.ok && data.success && data.token) {
        // ✅ স্টোরে ইউজার এবং টোকেন একসাথে সেভ করা
        login(data.user, data.token);

        // সফল হলে সরাসরি ড্যাশবোর্ডে (Tabs) নিয়ে যাবে
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "লগইন ব্যর্থ",
          data.message || data.error || "ফোন নম্বর বা পাসওয়ার্ড ভুল হয়েছে!",
        );
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert(
        "নেটওয়ার্ক এরর",
        "সার্ভারের সাথে কানেক্ট করা যাচ্ছে না। আপনার ইন্টারনেট চেক করুন।",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 w-full max-w-[400px] mx-auto">
            {/* 1. Logo & Header Area */}
            <View className="items-center mb-10">
              <View className="w-20 h-20 bg-sky-50 rounded-full items-center justify-center mb-4 border border-sky-100 shadow-sm">
                <ShieldCheck color="#0ea5e9" size={40} strokeWidth={2} />
              </View>
              <Text className="text-3xl font-black text-sky-950 mb-1 tracking-tight">
                A.1 Romoni
              </Text>
              <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                POS & Inventory System
              </Text>
            </View>

            {/* 2. Login Form */}
            <View className="space-y-5">
              {/* Phone Input */}
              <View>
                <Text className="text-sm font-extrabold text-slate-700 mb-2 ml-1">
                  ফোন নম্বর
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 focus:border-sky-500 focus:bg-white transition-all">
                  <Phone color="#94a3b8" size={20} />
                  <TextInput
                    className="flex-1 h-full ml-3 text-slate-800 font-bold text-base"
                    placeholder="01XXXXXXXXX"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-extrabold text-slate-700 mb-2 ml-1">
                  পাসওয়ার্ড
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 focus:border-sky-500 focus:bg-white transition-all">
                  <Lock color="#94a3b8" size={20} />
                  <TextInput
                    className="flex-1 h-full ml-3 text-slate-800 font-bold text-base"
                    placeholder="পাসওয়ার্ড লিখুন"
                    placeholderTextColor="#cbd5e1"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    {showPassword ? (
                      <EyeOff color="#94a3b8" size={20} />
                    ) : (
                      <Eye color="#94a3b8" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity className="self-end mt-2">
                <Text className="text-sky-600 font-bold text-sm">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Login Button */}
            <View className="mt-8">
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className={`h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${
                  loading
                    ? "bg-sky-400 shadow-none"
                    : "bg-sky-600 shadow-sky-500/40 active:bg-sky-700"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <LogIn color="#ffffff" size={20} strokeWidth={2.5} />
                    <Text className="text-white font-black text-lg tracking-wide ml-2">
                      লগইন করুন
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Support Text */}
            <View className="mt-10 items-center">
              <Text className="text-slate-400 font-medium text-xs">
                কোনো সমস্যা হলে অ্যাডমিনের সাথে যোগাযোগ করুন।
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
