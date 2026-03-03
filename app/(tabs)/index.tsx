// app/(tabs)/index.tsx
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import {
  BarChart2,
  CreditCard,
  History,
  LayoutDashboard,
  Package,
  PlusCircle,
  Receipt,
  RefreshCcw,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper: বাংলা সংখ্যা রূপান্তর
const toBanglaNumber = (num: number | string | undefined | null) => {
  if (num == null) return "০";
  const engToBng: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
  };
  return Number(num)
    .toLocaleString("en-IN")
    .replace(/[0-9]/g, (c) => engToBng[c] || c);
};

export default function HomeScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [activeTab, setActiveTab] = useState("আজকের");

  const tabs = ["আজকের", "মাসের", "বছরের", "সর্বমোট"];
  const token = useAuthStore((state) => state.token);

  const filterMap: Record<string, string> = {
    আজকের: "today",
    মাসের: "month",
    বছরের: "year",
    সর্বমোট: "all",
  };

  const fetchDashboardData = useCallback(
    async (tabToFetch: string, isRefresh = false) => {
      try {
        const queryFilter = filterMap[tabToFetch];
        const cacheKey = `@dashboard_data_${queryFilter}`;

        if (!isRefresh) {
          const cachedData = await AsyncStorage.getItem(cacheKey);
          if (cachedData) {
            setData(JSON.parse(cachedData));
            setLoading(false);
            setBackgroundSync(true);
          } else {
            setLoading(true);
          }
        } else {
          setRefreshing(true);
        }

        const response = await fetch(
          `https://stock-a1romoni.vercel.app/api/dashboard?filter=${queryFilter}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const json = await response.json();

        if (json.success && json.data) {
          setData(json.data);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(json.data));
        }
      } catch (error) {
        console.error("❌ Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setBackgroundSync(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchDashboardData(activeTab);
  }, [activeTab, fetchDashboardData]);

  const handleTabChange = (tab: string) => {
    if (activeTab !== tab) {
      Vibration.vibrate(30);
      setActiveTab(tab);
    }
  };

  const stats = {
    cashInHand: data?.balance || 0,
    todaySale: data?.sales || 0,
    yesterdaySale: data?.yesterdaySales || 0,
    todayPurchase: data?.purchases || 0,
    currentStock: data?.totalStock || 0,
    todayExpense: data?.expenses || 0,
    yesterdayExpense: data?.yesterdayExpenses || 0,
    totalReceivable: data?.receivables || 0,
    totalPayable: 0,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header Area */}
      <View className="bg-[#0f172a] px-5 pt-4 pb-20 z-10 border-b-[5px] border-amber-500 relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-10" />
        <View className="absolute -bottom-5 -left-5 w-20 h-20 bg-amber-400 rounded-full opacity-10" />

        <View className="flex-row justify-between items-center z-10">
          <View className="flex-row items-center">
            <View className="bg-white/10 p-2.5 rounded-xl border border-white/20 mr-3">
              <LayoutDashboard color="#fbbf24" size={24} />
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-[22px] font-black tracking-wide">
                  ড্যাশবোর্ড
                </Text>
                {backgroundSync && (
                  <ActivityIndicator size="small" color="#fbbf24" />
                )}
              </View>
              <Text className="text-sky-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                A.1 Romoni
              </Text>
            </View>
          </View>

          {/* লগইন এবং রিফ্রেশ বাটন */}
          <View className="flex-row gap-2">
            <Link href="/login" asChild>
              <TouchableOpacity className="w-10 h-10 items-center justify-center bg-white/10 rounded-full border border-white/20 active:bg-white/20">
                <Users color="#fff" size={16} />
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              onPress={() => fetchDashboardData(activeTab, true)}
              disabled={refreshing}
              className="w-10 h-10 items-center justify-center bg-white/10 rounded-full border border-white/20 active:bg-white/20"
            >
              <RefreshCcw
                color="#fff"
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 -mt-12 px-4 z-20"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboardData(activeTab, true)}
            colors={["#f59e0b"]}
          />
        }
      >
        {/* Cash In Hand Banner */}
        <View className="bg-gradient-to-r from-amber-500 to-orange-500 bg-amber-500 rounded-[24px] p-6 shadow-lg shadow-amber-500/30 mb-5 relative overflow-hidden">
          <View className="absolute -right-5 -top-10 w-32 h-32 bg-white/20 rounded-full blur-xl" />
          <Text className="text-amber-50 font-bold text-[11px] flex-row items-center uppercase tracking-widest mb-1.5">
            ক্যাশ ইন হ্যান্ড (নিট ব্যালেন্স)
          </Text>
          <Text className="text-white text-[40px] font-black tracking-tighter drop-shadow-md">
            {toBanglaNumber(stats.cashInHand)}{" "}
            <Text className="text-xl">৳</Text>
          </Text>
        </View>

        {/* Smart Filter Tabs */}
        <View className="flex-row bg-white rounded-xl p-1 mb-5 shadow-sm border border-slate-200">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabChange(tab)}
              className={`flex-1 py-2.5 rounded-lg items-center transition-all ${
                activeTab === tab ? "bg-[#0ea5e9] shadow-sm" : "bg-transparent"
              }`}
            >
              <Text
                className={`font-black text-[12px] ${activeTab === tab ? "text-white" : "text-slate-500"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && !refreshing && !data ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-slate-400 font-bold mt-4">
              হিসাব লোড হচ্ছে...
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-emerald-50 w-9 h-9 rounded-full items-center justify-center mb-2.5">
                  <TrendingUp color="#10b981" size={18} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  মোট বিক্রি
                </Text>
                <Text className="text-[#10b981] font-black text-xl">
                  ৳ {toBanglaNumber(stats.todaySale)}
                </Text>
              </View>

              <View className="w-[48%] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-indigo-50 w-9 h-9 rounded-full items-center justify-center mb-2.5">
                  <ShoppingCart color="#6366f1" size={18} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  মোট ক্রয়
                </Text>
                <Text className="text-[#6366f1] font-black text-xl">
                  ৳ {toBanglaNumber(stats.todayPurchase)}
                </Text>
              </View>

              <View className="w-[48%] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-orange-50 w-9 h-9 rounded-full items-center justify-center mb-2.5">
                  <Receipt color="#f97316" size={18} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  মোট খরচ
                </Text>
                <Text className="text-[#f97316] font-black text-xl">
                  ৳ {toBanglaNumber(stats.todayExpense)}
                </Text>
              </View>

              <View className="w-[48%] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-rose-50 w-9 h-9 rounded-full items-center justify-center mb-2.5">
                  <Wallet color="#e11d48" size={18} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  মোট পাবো (বাকি)
                </Text>
                <Text className="text-[#e11d48] font-black text-xl">
                  ৳ {toBanglaNumber(stats.totalReceivable)}
                </Text>
              </View>

              <View className="w-[48%] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-blue-50 w-9 h-9 rounded-full items-center justify-center mb-2.5">
                  <Package color="#3b82f6" size={18} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  বর্তমান স্টক
                </Text>
                <Text className="text-[#3b82f6] font-black text-xl">
                  {toBanglaNumber(stats.currentStock)}{" "}
                  <Text className="text-xs">পিস</Text>
                </Text>
              </View>

              <View className="w-[48%] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 mb-4 opacity-70">
                <View className="bg-slate-100 w-9 h-9 rounded-full items-center justify-center mb-2.5">
                  <CreditCard color="#64748b" size={18} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  মোট দিবো (পাওনা)
                </Text>
                <Text className="text-slate-700 font-black text-xl">
                  ৳ {toBanglaNumber(stats.totalPayable)}
                </Text>
              </View>
            </View>

            {/* Quick Links Section */}
            <View className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-20 mt-2">
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-[#0ea5e9] mr-2" />
                  <Text className="font-extrabold text-slate-800 text-[15px]">
                    দ্রুত অ্যাকশন (Quick Links)
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                <Link href="/sells" asChild>
                  <TouchableOpacity className="items-center mr-6 active:opacity-70">
                    <View className="w-[60px] h-[60px] bg-emerald-50 rounded-[18px] items-center justify-center border border-emerald-100 mb-2 shadow-sm">
                      <PlusCircle color="#10b981" size={26} />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">
                      নতুন বিক্রি
                    </Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/sales" asChild>
                  <TouchableOpacity className="items-center mr-6 active:opacity-70">
                    <View className="w-[60px] h-[60px] bg-blue-50 rounded-[18px] items-center justify-center border border-blue-100 mb-2 shadow-sm">
                      <History color="#3b82f6" size={26} />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">
                      হিস্ট্রি
                    </Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/expenses/new" asChild>
                  <TouchableOpacity className="items-center mr-6 active:opacity-70">
                    <View className="w-[60px] h-[60px] bg-orange-50 rounded-[18px] items-center justify-center border border-orange-100 mb-2 shadow-sm">
                      <Receipt color="#f97316" size={26} />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">
                      খরচ এন্ট্রি
                    </Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/expenses" asChild>
                  <TouchableOpacity className="items-center mr-6 active:opacity-70">
                    <View className="w-[60px] h-[60px] bg-indigo-50 rounded-[18px] items-center justify-center border border-indigo-100 mb-2 shadow-sm">
                      <Package color="#6366f1" size={26} />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">
                      খরচ হিস্ট্রি
                    </Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/reports" asChild>
                  <TouchableOpacity className="items-center mr-6 active:opacity-70">
                    <View className="w-[60px] h-[60px] bg-teal-50 rounded-[18px] items-center justify-center border border-teal-100 mb-2 shadow-sm">
                      <BarChart2 color="#0d9488" size={26} />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">
                      রিপোর্টস
                    </Text>
                  </TouchableOpacity>
                </Link>
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
