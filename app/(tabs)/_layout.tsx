// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import {
  BarChart3,
  Box,
  LayoutDashboard,
  ShoppingCart,
} from "lucide-react-native";
import { Platform, Text, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // ডিফল্ট লেবেল হাইড
        tabBarActiveTintColor: "#3b82f6", // Blue-500
        tabBarInactiveTintColor: "#94a3b8", // Slate-400
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 5 : 5, // 👈 নিচ থেকে মার্জিন কমানো হয়েছে (আগে 30/20 ছিল)
          left: 20,
          right: 20,
          backgroundColor: "#ffffff",
          borderRadius: 30, // 👈 স্লিম হাইটের সাথে মানানসই রাউন্ড শেপ
          height: 40, // 👈 হাইট একদম পারফেক্ট স্লিম করা হয়েছে (আগে 65 ছিল)
          borderTopWidth: 0,
          elevation: 15,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 15,
        },
      }}
    >
      {/* 1. Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "ড্যাশবোর্ড",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center pt-1">
              <View
                className={`${focused ? "bg-blue-50" : ""} p-1.5 rounded-xl transition-all`}
              >
                <LayoutDashboard
                  color={color}
                  size={20}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
              {focused && (
                <Text className="text-[9px] font-black text-blue-600 mt-0.5">
                  ড্যাশবোর্ড
                </Text>
              )}
            </View>
          ),
        }}
      />

      {/* 2. Products Tab */}
      <Tabs.Screen
        name="products"
        options={{
          title: "প্রোডাক্ট",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center pt-1">
              <View
                className={`${focused ? "bg-blue-50" : ""} p-1.5 rounded-xl transition-all`}
              >
                <Box color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
              </View>
              {focused && (
                <Text className="text-[9px] font-black text-blue-600 mt-0.5">
                  প্রোডাক্ট
                </Text>
              )}
            </View>
          ),
        }}
      />

      {/* 3. POS Sale Tab (Highlight Color) */}
      <Tabs.Screen
        name="sells"
        options={{
          title: "পস সেল",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center pt-1">
              <View
                className={`${focused ? "bg-orange-50" : ""} p-1.5 rounded-xl transition-all`}
              >
                <ShoppingCart
                  color={focused ? "#f97316" : color}
                  size={20}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
              {focused && (
                <Text className="text-[9px] font-black text-orange-500 mt-0.5">
                  পস সেল
                </Text>
              )}
            </View>
          ),
        }}
      />

      {/* 4. Reports Tab */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "রিপোর্ট",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center pt-1">
              <View
                className={`${focused ? "bg-blue-50" : ""} p-1.5 rounded-xl transition-all`}
              >
                <BarChart3
                  color={color}
                  size={20}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
              {focused && (
                <Text className="text-[9px] font-black text-blue-600 mt-0.5">
                  রিপোর্ট
                </Text>
              )}
            </View>
          ),
        }}
      />

      {/* =========================================================
          Hidden Tabs (এগুলো বটম বারে দেখাবে না, কিন্তু লিংকে কাজ করবে)
          ========================================================= */}
      <Tabs.Screen name="expenses" options={{ href: null }} />
      <Tabs.Screen name="sales" options={{ href: null }} />
    </Tabs>
  );
}
