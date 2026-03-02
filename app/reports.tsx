// app/(tabs)/reports.tsx
import {
    BarChart3,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Clock,
    Download,
    Package,
    Receipt,
    ShoppingCart,
    TrendingUp,
    Wallet,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";

// Helper: বাংলা সংখ্যা রূপান্তর
const toBanglaNumber = (num: number | string | undefined | null) => {
  if (num == null || isNaN(Number(num))) return "০";
  const formattedNum = Number(num).toLocaleString("en-IN");
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
  return formattedNum.replace(/[0-9]/g, (char) => engToBng[char] || char);
};

export default function ReportsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [filter, setFilter] = useState("month");
  const [filterLabel, setFilterLabel] = useState("চলতি মাসের");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const token = useAuthStore.getState().token;

  // ✅ ডেটা Fetch করা (ফিল্টার সহ)
  const fetchReportData = useCallback(
    async (currentFilter: string, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const response = await fetch(
          `https://stock-a1romoni.vercel.app/api/dashboard?filter=${currentFilter}`, // 👈 প্রোডাকশনে লাইভ URL দিবেন
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
        console.error("Report Fetch Error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchReportData(filter);
  }, [fetchReportData, filter]);

  const handleFilterSelect = (val: string, label: string) => {
    setFilter(val);
    setFilterLabel(label);
    setShowFilterModal(false);
  };

  const handlePrintPDF = () => {
    Alert.alert("প্রিন্ট", "PDF জেনারেট করে প্রিন্ট করার ফিচারটি শীঘ্রই আসছে!");
  };

  // ডেটা ম্যাপিং
  const stats = {
    balance: data?.balance || 0,
    sales: data?.sales || 0,
    purchases: data?.purchases || 0,
    expenses: data?.expenses || 0,
    totalStock: data?.totalStock || 0,
    yesterdaySales: data?.yesterdaySales || 0,
    yesterdayExpenses: data?.yesterdayExpenses || 0,
    last7DaysSales: data?.last7DaysSales || 0,
    last7DaysExpenses: data?.last7DaysExpenses || 0,
  };

  // রেশিও (Ratio) ক্যালকুলেশন
  const totalIncome = stats.sales > 0 ? stats.sales : 1; // 0 দিয়ে ভাগ এড়াতে
  const purchaseRatio = Math.min(100, (stats.purchases / totalIncome) * 100);
  const expenseRatio = Math.min(100, (stats.expenses / totalIncome) * 100);
  const profitRatio = Math.max(
    0,
    Math.min(100, (stats.balance / totalIncome) * 100),
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* 1. Header Area (Dark Blue) */}
      <View className="bg-[#1e3a8a] px-5 pt-4 pb-24 z-10">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center flex-1">
            <View className="bg-white/10 p-2.5 rounded-xl border border-white/20 mr-3">
              <BarChart3 color="#fbbf24" size={24} />
            </View>
            <View>
              <Text className="text-white text-xl font-black">
                ব্যবসায়িক রিপোর্ট
              </Text>
              <Text className="text-sky-200 text-xs font-bold mt-0.5">
                আয়-ব্যয় এবং লাভের পরিসংখ্যান
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons (Filter & Print) */}
        <View className="flex-row justify-between items-center mt-5">
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            className="flex-row items-center bg-white/10 px-3 py-2 rounded-lg border border-white/20"
          >
            <Text className="text-white text-xs font-bold mr-1.5">
              {filterLabel}
            </Text>
            <ChevronDown color="#fff" size={14} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePrintPDF}
            className="flex-row items-center bg-[#f59e0b] px-3 py-2 rounded-lg shadow-sm"
          >
            <Download color="#fff" size={14} />
            <Text className="text-white text-xs font-black ml-1.5">
              PDF / প্রিন্ট
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 -mt-16 z-20"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReportData(filter, true)}
            colors={["#f59e0b"]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#f59e0b" />
          </View>
        ) : (
          <>
            {/* 2. Hero Card (Net Balance) */}
            <View className="bg-gradient-to-r from-[#ea580c] to-[#f59e0b] rounded-2xl p-5 mx-4 shadow-lg shadow-orange-500/30 mb-5 relative overflow-hidden">
              {/* Background Glow */}
              <View className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View className="bg-white/20 p-3 rounded-xl border border-white/30 mr-3">
                    <Wallet color="#fff" size={24} />
                  </View>
                  <View>
                    <Text className="text-orange-50 font-bold text-xs mb-0.5">
                      নিট ব্যালেন্স / লাভ
                    </Text>
                    <Text className="text-white text-3xl font-black tracking-tight">
                      <Text className="text-xl">৳ </Text>
                      {toBanglaNumber(stats.balance)}
                    </Text>
                  </View>
                </View>

                {/* Stock Badge */}
                <View className="bg-white/20 px-3 py-2 rounded-xl border border-white/30 items-center ml-2">
                  <Text className="text-orange-50 text-[10px] font-bold">
                    মোট বর্তমান স্টক
                  </Text>
                  <Text className="text-white font-black text-sm">
                    {toBanglaNumber(stats.totalStock)} পিস
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Primary Stats Row */}
            <View className="px-4 mb-4 space-y-3">
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-row justify-between items-center">
                <View>
                  <Text className="text-slate-500 font-bold text-xs mb-1">
                    মোট বিক্রি (আয়)
                  </Text>
                  <Text className="text-[#3b82f6] font-black text-2xl">
                    ৳ {toBanglaNumber(stats.sales)}
                  </Text>
                </View>
                <View className="bg-blue-50 p-2.5 rounded-xl">
                  <TrendingUp color="#3b82f6" size={20} />
                </View>
              </View>

              <View className="flex-row justify-between">
                <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-slate-500 font-bold text-xs">
                      মোট ক্রয় (ব্যয়)
                    </Text>
                    <View className="bg-indigo-50 p-1.5 rounded-lg">
                      <ShoppingCart color="#6366f1" size={14} />
                    </View>
                  </View>
                  <Text className="text-[#6366f1] font-black text-lg">
                    ৳ {toBanglaNumber(stats.purchases)}
                  </Text>
                </View>

                <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-slate-500 font-bold text-xs">
                      অন্যান্য খরচ
                    </Text>
                    <View className="bg-rose-50 p-1.5 rounded-lg">
                      <Receipt color="#e11d48" size={14} />
                    </View>
                  </View>
                  <Text className="text-[#e11d48] font-black text-lg">
                    ৳ {toBanglaNumber(stats.expenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. Secondary Stats Grid (Yesterday & 7 Days) */}
            <View className="px-4 flex-row flex-wrap justify-between mb-5">
              <View className="w-[48%] bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-3 flex-row items-center">
                <Clock color="#94a3b8" size={14} className="mr-2" />
                <View>
                  <Text className="text-slate-400 font-bold text-[10px]">
                    গতকালের বিক্রি
                  </Text>
                  <Text className="text-slate-800 font-black text-sm">
                    ৳ {toBanglaNumber(stats.yesterdaySales)}
                  </Text>
                </View>
              </View>
              <View className="w-[48%] bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-3 flex-row items-center">
                <Receipt color="#94a3b8" size={14} className="mr-2" />
                <View>
                  <Text className="text-slate-400 font-bold text-[10px]">
                    গতকালের খরচ
                  </Text>
                  <Text className="text-slate-800 font-black text-sm">
                    ৳ {toBanglaNumber(stats.yesterdayExpenses)}
                  </Text>
                </View>
              </View>
              <View className="w-[48%] bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex-row items-center">
                <CalendarDays color="#94a3b8" size={14} className="mr-2" />
                <View>
                  <Text className="text-slate-400 font-bold text-[10px]">
                    গত ৭ দিনের বিক্রি
                  </Text>
                  <Text className="text-slate-800 font-black text-sm">
                    ৳ {toBanglaNumber(stats.last7DaysSales)}
                  </Text>
                </View>
              </View>
              <View className="w-[48%] bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex-row items-center">
                <CalendarDays color="#94a3b8" size={14} className="mr-2" />
                <View>
                  <Text className="text-slate-400 font-bold text-[10px]">
                    গত ৭ দিনের খরচ
                  </Text>
                  <Text className="text-slate-800 font-black text-sm">
                    ৳ {toBanglaNumber(stats.last7DaysExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 5. Ratio Progress Bars */}
            <View className="mx-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5">
              <Text className="text-[#1e3a8a] font-extrabold text-sm mb-4 flex-row items-center">
                <BarChart3 size={16} color="#3b82f6" /> আয়-ব্যয়ের রেশিও
                (Ratio)
              </Text>

              {/* Sales Ratio */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-slate-600 font-bold text-xs">
                    মোট বিক্রি (১০০%)
                  </Text>
                  <Text className="text-[#3b82f6] font-black text-xs">
                    ৳ {toBanglaNumber(stats.sales)}
                  </Text>
                </View>
                <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#3b82f6] rounded-full"
                    style={{ width: "100%" }}
                  />
                </View>
              </View>

              {/* Purchase Ratio */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-slate-600 font-bold text-xs">
                    পণ্য ক্রয় ব্যয়
                  </Text>
                  <Text className="text-[#6366f1] font-black text-xs">
                    ৳ {toBanglaNumber(stats.purchases)}
                  </Text>
                </View>
                <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#e2e8f0] rounded-full"
                    style={{ width: `${purchaseRatio}%` }}
                  />
                </View>
              </View>

              {/* Expense Ratio */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-slate-600 font-bold text-xs">
                    দৈনন্দিন খরচ
                  </Text>
                  <Text className="text-[#e11d48] font-black text-xs">
                    ৳ {toBanglaNumber(stats.expenses)}
                  </Text>
                </View>
                <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#fb7185] rounded-full"
                    style={{ width: `${expenseRatio}%` }}
                  />
                </View>
              </View>

              {/* Profit Ratio */}
              <View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-slate-800 font-extrabold text-xs">
                    নিট লাভ / ব্যালেন্স
                  </Text>
                  <Text className="text-[#f59e0b] font-black text-xs">
                    ৳ {toBanglaNumber(stats.balance)}
                  </Text>
                </View>
                <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#f59e0b] rounded-full"
                    style={{ width: `${profitRatio}%` }}
                  />
                </View>
              </View>
            </View>

            {/* 6. Detailed Ledger Links */}
            <View className="mx-4 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 mb-10">
              <Text className="text-[#1e3a8a] font-extrabold text-sm p-3 border-b border-slate-50 mb-1 flex-row items-center">
                <Receipt size={16} color="#3b82f6" /> বিস্তারিত খাতা ও লেজার
              </Text>

              <TouchableOpacity className="flex-row items-center justify-between p-3 bg-white border border-slate-100 rounded-xl mb-2 hover:bg-slate-50">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
                    <TrendingUp color="#3b82f6" size={14} />
                  </View>
                  <Text className="text-slate-700 font-bold text-sm">
                    বিক্রয়ের বিস্তারিত রিপোর্ট
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between p-3 bg-white border border-slate-100 rounded-xl mb-2 hover:bg-slate-50">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-indigo-50 rounded-lg items-center justify-center mr-3">
                    <ShoppingCart color="#6366f1" size={14} />
                  </View>
                  <Text className="text-slate-700 font-bold text-sm">
                    পণ্য ক্রয়ের খাতা
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between p-3 bg-white border border-slate-100 rounded-xl mb-2 hover:bg-slate-50">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
                    <Receipt color="#3b82f6" size={14} />
                  </View>
                  <Text className="text-slate-700 font-bold text-sm">
                    দৈনন্দিন খরচের খাতা
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
                    <Package color="#3b82f6" size={14} />
                  </View>
                  <Text className="text-slate-700 font-bold text-sm">
                    বর্তমান স্টক ও ইনভেন্টরি
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Filter Selection Modal (Bottom Sheet Style) */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowFilterModal(false)}
          />
          <View className="bg-white rounded-t-3xl p-5 pb-10">
            <Text className="text-center font-black text-slate-800 text-lg mb-4">
              রিপোর্টের সময়কাল নির্বাচন করুন
            </Text>

            <TouchableOpacity
              onPress={() => handleFilterSelect("today", "আজকের")}
              className={`p-4 rounded-xl mb-2 ${filter === "today" ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}
            >
              <Text
                className={`text-center font-bold ${filter === "today" ? "text-blue-600" : "text-slate-600"}`}
              >
                আজকের
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFilterSelect("month", "চলতি মাসের")}
              className={`p-4 rounded-xl mb-2 ${filter === "month" ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}
            >
              <Text
                className={`text-center font-bold ${filter === "month" ? "text-blue-600" : "text-slate-600"}`}
              >
                চলতি মাসের
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFilterSelect("year", "চলতি বছরের")}
              className={`p-4 rounded-xl mb-2 ${filter === "year" ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}
            >
              <Text
                className={`text-center font-bold ${filter === "year" ? "text-blue-600" : "text-slate-600"}`}
              >
                চলতি বছরের
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFilterSelect("all", "সর্বমোট (All Time)")}
              className={`p-4 rounded-xl ${filter === "all" ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}
            >
              <Text
                className={`text-center font-bold ${filter === "all" ? "text-blue-600" : "text-slate-600"}`}
              >
                সর্বমোট (All Time)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
