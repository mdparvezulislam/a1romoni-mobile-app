// app/(tabs)/index.tsx
import { useAuthStore } from "@/store/authStore"; // পাথ ঠিক রাখবেন
import { router } from "expo-router";
import {
  BarChart2,
  ClipboardList,
  Clock,
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
  const [activeTab, setActiveTab] = useState("আজকের");

  const tabs = ["আজকের", "মাসের", "বছরের", "সর্বমোট"];
  const token = useAuthStore.getState().token;

  // ✅ ড্যাশবোর্ডের ডেটা Fetch করা
  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const response = await fetch(
          "https://stock-a1romoni.vercel.app/api/dashboard",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const json = await response.json();

        if (json.success || json.data) {
          setData(json.data);
        } else {
          setData(json);
        }
      } catch (error) {
        console.error("❌ Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ✅ API এর Key গুলোর সাথে অ্যাপের ভেরিয়েবল ম্যাপ করা
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
    <SafeAreaView className="flex-1 bg-[#f4f6f8]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* 1. Header Area */}
      <View className="bg-[#1e3a8a] px-5 pt-3 pb-20 z-10">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="bg-white/10 p-2.5 rounded-xl border border-white/20 mr-3">
              <LayoutDashboard color="#fbbf24" size={24} />
            </View>
            <View>
              <Text className="text-white text-xl font-black">ড্যাশবোর্ড</Text>
              <Text className="text-sky-200 text-xs font-bold">A1 Romoni</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push("/login")}
              className="flex-row items-center bg-white/10 px-3 py-2 rounded-full border border-white/20"
            >
              <Users color="#fff" size={14} />
              <Text className="text-white text-xs font-bold ml-1.5">লগইন</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => fetchDashboardData(true)}
              className="flex-row items-center bg-white/10 px-3 py-2 rounded-full border border-white/20"
            >
              <RefreshCcw
                color="#fff"
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              <Text className="text-white text-xs font-bold ml-1.5">
                রিফ্রেশ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 -mt-14 px-4 z-20"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboardData(true)}
            colors={["#f59e0b"]}
          />
        }
      >
        {/* 2. Cash In Hand Banner */}
        <View className="bg-gradient-to-r from-[#f59e0b] to-[#ea580c] bg-orange-500 rounded-2xl p-5 shadow-lg shadow-orange-500/30 mb-5">
          <Text className="text-orange-50 font-bold text-xs flex-row items-center mb-1">
            ক্যাশ ইন হ্যান্ড (নিট ব্যালেন্স)
          </Text>
          <Text className="text-white text-4xl font-black tracking-tight">
            ৳ {toBanglaNumber(stats.cashInHand)}
          </Text>
        </View>

        {/* 3. Filter Tabs */}
        <View className="flex-row bg-white rounded-xl p-1 mb-5 shadow-sm border border-slate-100">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab ? "bg-[#3b82f6]" : "bg-transparent"}`}
            >
              <Text
                className={`font-bold text-xs ${activeTab === tab ? "text-white" : "text-slate-500"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && !refreshing ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <>
            {/* 4. Stats Grid */}
            <View className="flex-row flex-wrap justify-between">
              {/* Today's Sale */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-emerald-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <TrendingUp color="#10b981" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  আজকের বিক্রি
                </Text>
                <Text className="text-[#10b981] font-black text-lg">
                  ৳ {toBanglaNumber(stats.todaySale)}
                </Text>
              </View>

              {/* Yesterday's Sale */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-teal-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <Clock color="#0d9488" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  গতকালের বিক্রি
                </Text>
                <Text className="text-[#0d9488] font-black text-lg">
                  ৳ {toBanglaNumber(stats.yesterdaySale)}
                </Text>
              </View>

              {/* Today's Purchase */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-indigo-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <ShoppingCart color="#6366f1" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  আজকের ক্রয়
                </Text>
                <Text className="text-[#6366f1] font-black text-lg">
                  ৳ {toBanglaNumber(stats.todayPurchase)}
                </Text>
              </View>

              {/* Current Stock */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-blue-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <Package color="#3b82f6" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  বর্তমান স্টক
                </Text>
                <Text className="text-[#3b82f6] font-black text-lg">
                  {toBanglaNumber(stats.currentStock)}{" "}
                  <Text className="text-xs">পিস</Text>
                </Text>
              </View>

              {/* Today's Expense */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-orange-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <Receipt color="#f97316" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  আজকের খরচ
                </Text>
                <Text className="text-[#f97316] font-black text-lg">
                  ৳ {toBanglaNumber(stats.todayExpense)}
                </Text>
              </View>

              {/* Yesterday's Expense */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-amber-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <Clock color="#d97706" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  গতকালের খরচ
                </Text>
                <Text className="text-[#d97706] font-black text-lg">
                  ৳ {toBanglaNumber(stats.yesterdayExpense)}
                </Text>
              </View>

              {/* Total Receivable */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-rose-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <Wallet color="#e11d48" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  মোট পাবো (বাকি)
                </Text>
                <Text className="text-[#e11d48] font-black text-lg">
                  ৳ {toBanglaNumber(stats.totalReceivable)}
                </Text>
              </View>

              {/* Total Payable */}
              <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                <View className="bg-fuchsia-50 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <CreditCard color="#d946ef" size={16} />
                </View>
                <Text className="text-slate-500 text-[11px] font-bold mb-1">
                  মোট দিবো (পাওনা)
                </Text>
                <Text className="text-[#d946ef] font-black text-lg">
                  ৳ {toBanglaNumber(stats.totalPayable)}
                </Text>
              </View>
            </View>

            {/* 5. Quick Links Section */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-10">
              <View className="flex-row items-center mb-4">
                <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                <Text className="font-extrabold text-slate-800 text-sm">
                  দ্রুত অ্যাকশন (Quick Links)
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {/* New Sell */}
                <TouchableOpacity
                  onPress={() => router.push("/sells")}
                  className="items-center mr-5"
                >
                  <View className="w-14 h-14 bg-emerald-50 rounded-2xl items-center justify-center border border-emerald-100 mb-2">
                    <PlusCircle color="#10b981" size={24} />
                  </View>
                  <Text className="text-[10px] font-bold text-slate-600">
                    নতুন বিক্রি
                  </Text>
                </TouchableOpacity>

                {/* Sales History */}
                <TouchableOpacity
                  onPress={() => router.push("/sales")}
                  className="items-center mr-5"
                >
                  <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center border border-blue-100 mb-2">
                    <History color="#3b82f6" size={24} />
                  </View>
                  <Text className="text-[10px] font-bold text-slate-600">
                    বিক্রির ইতিহাস
                  </Text>
                </TouchableOpacity>

                {/* Expense Entry */}
                <TouchableOpacity
                  onPress={() => router.push("/expenses/new")}
                  className="items-center mr-5"
                >
                  <View className="w-14 h-14 bg-orange-50 rounded-2xl items-center justify-center border border-orange-100 mb-2">
                    <Receipt color="#f97316" size={24} />
                  </View>
                  <Text className="text-[10px] font-bold text-slate-600">
                    খরচ এন্ট্রি
                  </Text>
                </TouchableOpacity>

                {/* Expenses List */}
                <TouchableOpacity
                  onPress={() => router.push("/expenses")}
                  className="items-center mr-5"
                >
                  <View className="w-14 h-14 bg-rose-50 rounded-2xl items-center justify-center border border-rose-100 mb-2">
                    <ClipboardList color="#e11d48" size={24} />
                  </View>
                  <Text className="text-[10px] font-bold text-slate-600">
                    খরচের খাতা
                  </Text>
                </TouchableOpacity>

                {/* Stock Check */}
                <TouchableOpacity
                  onPress={() => router.push("/products")}
                  className="items-center mr-5"
                >
                  <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100 mb-2">
                    <Package color="#6366f1" size={24} />
                  </View>
                  <Text className="text-[10px] font-bold text-slate-600">
                    স্টক দেখুন
                  </Text>
                </TouchableOpacity>

                {/* Reports */}
                <TouchableOpacity
                  onPress={() => router.push("/reports")}
                  className="items-center mr-5"
                >
                  <View className="w-14 h-14 bg-teal-50 rounded-2xl items-center justify-center border border-teal-100 mb-2">
                    <BarChart2 color="#0d9488" size={24} />
                  </View>
                  <Text className="text-[10px] font-bold text-slate-600">
                    রিপোর্টস
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
