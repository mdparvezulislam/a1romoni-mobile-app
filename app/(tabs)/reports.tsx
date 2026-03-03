// app/(tabs)/reports.tsx
import { useAuthStore } from "@/store/authStore"; // পাথ চেক করুন
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Download,
  Package,
  Receipt,
  RefreshCcw,
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
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [backgroundSync, setBackgroundSync] = useState(false);

  // Filter States
  const [filter, setFilter] = useState("month");
  const [filterLabel, setFilterLabel] = useState("চলতি মাসের");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const token = useAuthStore((state) => state.token);

  const fetchReportData = useCallback(
    async (currentFilter: string, isRefresh = false) => {
      try {
        const cacheKey = `@report_cache_${currentFilter}`;

        if (isRefresh) setRefreshing(true);
        else if (!data) setLoading(true);
        else setBackgroundSync(true);

        // Load Cache
        if (!isRefresh && !data) {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            setData(JSON.parse(cached));
            setLoading(false);
          }
        }

        const response = await fetch(
          `https://stock-a1romoni.vercel.app/api/dashboard?filter=${currentFilter}`,
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
        console.error("Report Fetch Error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setBackgroundSync(false);
      }
    },
    [token, data],
  );

  useEffect(() => {
    fetchReportData(filter);
  }, [filter]);

  const handleFilterSelect = (val: string, label: string) => {
    Vibration.vibrate(30);
    setFilter(val);
    setFilterLabel(label);
    setShowFilterModal(false);
  };

  const handlePrintPDF = () => {
    Alert.alert("প্রিন্ট", "PDF রিপোর্ট তৈরির ফিচারটি ডেভেলপমেন্টে আছে।");
  };

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

  // Ratio Calculations
  const totalOutflow = stats.purchases + stats.expenses;
  const totalInflow = stats.sales > 0 ? stats.sales : 1;
  const purchaseRatio = Math.min(100, (stats.purchases / totalInflow) * 100);
  const expenseRatio = Math.min(100, (stats.expenses / totalInflow) * 100);
  const profitRatio = Math.max(
    0,
    Math.min(100, (stats.balance / totalInflow) * 100),
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header Area */}
      <View className="bg-[#0f172a] px-5 pt-4 pb-24 z-10 border-b-[5px] border-amber-500 relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-10" />

        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center">
            <View className="bg-white/10 p-2.5 rounded-xl border border-white/20 mr-3">
              <BarChart3 color="#fbbf24" size={24} />
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-xl font-black">
                  ব্যবসায়িক রিপোর্ট
                </Text>
                {backgroundSync && (
                  <ActivityIndicator size="small" color="#fbbf24" />
                )}
              </View>
              <Text className="text-sky-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                বিশদ পরিসংখ্যান
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => fetchReportData(filter, true)}
            className="bg-white/10 p-2 rounded-full border border-white/20"
          >
            <RefreshCcw
              color="#fff"
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between items-center mt-6">
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            className="flex-row items-center bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 active:bg-white/20"
          >
            <Text className="text-white text-xs font-black mr-2 uppercase tracking-tighter">
              {filterLabel}
            </Text>
            <ChevronDown color="#fff" size={14} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePrintPDF}
            className="flex-row items-center bg-amber-500 px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/30 active:bg-amber-600"
          >
            <Download color="#0f172a" size={14} strokeWidth={3} />
            <Text className="text-[#0f172a] text-xs font-black ml-2 uppercase">
              PDF প্রিন্ট
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
        {loading && !refreshing && !data ? (
          <View className="py-20 items-center justify-center bg-white mx-4 rounded-3xl shadow-sm border border-slate-100">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-slate-400 font-bold mt-4 tracking-widest uppercase text-xs">
              রিপোর্ট তৈরি হচ্ছে...
            </Text>
          </View>
        ) : (
          <>
            {/* Hero Card: Net Balance */}
            <View className="bg-gradient-to-br from-amber-500 to-orange-600 bg-amber-500 rounded-[28px] p-6 mx-4 shadow-xl shadow-amber-500/40 mb-6 relative overflow-hidden">
              <View className="absolute -right-5 -top-10 w-32 h-32 bg-white/20 rounded-full blur-xl" />
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-amber-50 font-bold text-[11px] uppercase tracking-widest mb-1.5 opacity-80">
                    নিট ব্যালেন্স / লাভ
                  </Text>
                  <Text className="text-white text-4xl font-black tracking-tighter drop-shadow-md">
                    {toBanglaNumber(stats.balance)}{" "}
                    <Text className="text-xl font-bold">৳</Text>
                  </Text>
                </View>
                <View className="bg-white/20 p-4 rounded-2xl border border-white/30">
                  <Wallet color="#fff" size={28} />
                </View>
              </View>
            </View>

            {/* Primary Stats Grid */}
            <View className="px-4 mb-6">
              <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <View className="bg-emerald-50 p-3 rounded-2xl mr-4 border border-emerald-100">
                    <TrendingUp color="#10b981" size={24} />
                  </View>
                  <View>
                    <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      মোট বিক্রি (Revenue)
                    </Text>
                    <Text className="text-slate-900 font-black text-2xl tracking-tighter">
                      ৳ {toBanglaNumber(stats.sales)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <View className="bg-indigo-50 w-10 h-10 rounded-xl items-center justify-center mb-3 border border-indigo-100">
                    <ShoppingCart color="#6366f1" size={20} />
                  </View>
                  <Text className="text-slate-400 font-bold text-[10px] uppercase mb-1">
                    পণ্য ক্রয়
                  </Text>
                  <Text className="text-indigo-700 font-black text-lg">
                    ৳{toBanglaNumber(stats.purchases)}
                  </Text>
                </View>
                <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <View className="bg-rose-50 w-10 h-10 rounded-xl items-center justify-center mb-3 border border-rose-100">
                    <Receipt color="#e11d48" size={20} />
                  </View>
                  <Text className="text-slate-400 font-bold text-[10px] uppercase mb-1">
                    অন্যান্য খরচ
                  </Text>
                  <Text className="text-rose-700 font-black text-lg">
                    ৳{toBanglaNumber(stats.expenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Yesterday & 7 Days Comparison */}
            <View className="px-4 mb-6">
              <Text className="text-slate-500 font-black text-[11px] uppercase tracking-widest mb-3 ml-1">
                তুলনামূলক পরিসংখ্যান
              </Text>
              <View className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm flex-row flex-wrap">
                <View className="w-1/2 p-3 border-r border-b border-slate-50">
                  <Text className="text-slate-400 font-bold text-[9px] uppercase mb-1">
                    গতকালের বিক্রি
                  </Text>
                  <Text className="text-slate-800 font-black text-sm">
                    ৳{toBanglaNumber(stats.yesterdaySales)}
                  </Text>
                </View>
                <View className="w-1/2 p-3 border-b border-slate-50">
                  <Text className="text-slate-400 font-bold text-[9px] uppercase mb-1">
                    গতকালের খরচ
                  </Text>
                  <Text className="text-slate-800 font-black text-sm text-rose-600">
                    ৳{toBanglaNumber(stats.yesterdayExpenses)}
                  </Text>
                </View>
                <View className="w-1/2 p-3 border-r border-slate-50">
                  <Text className="text-slate-400 font-bold text-[9px] uppercase mb-1">
                    গত ৭ দিনের বিক্রি
                  </Text>
                  <Text className="text-slate-800 font-black text-sm">
                    ৳{toBanglaNumber(stats.last7DaysSales)}
                  </Text>
                </View>
                <View className="w-1/2 p-3">
                  <Text className="text-slate-400 font-bold text-[9px] uppercase mb-1">
                    গত ৭ দিনের খরচ
                  </Text>
                  <Text className="text-slate-800 font-black text-sm text-rose-600">
                    ৳{toBanglaNumber(stats.last7DaysExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ratio Progress Visuals */}
            <View className="mx-4 bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6">
              <View className="flex-row items-center mb-6">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                <Text className="text-slate-800 font-black text-sm uppercase tracking-widest">
                  আয়-ব্যয়ের রেশিও
                </Text>
              </View>

              <View className="space-y-5">
                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500 font-bold text-xs">
                      পণ্য ক্রয় ব্যয়
                    </Text>
                    <Text className="text-slate-900 font-black text-xs">
                      {toBanglaNumber(purchaseRatio.toFixed(1))}%
                    </Text>
                  </View>
                  <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${purchaseRatio}%` }}
                    />
                  </View>
                </View>
                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500 font-bold text-xs">
                      দৈনন্দিন খরচ
                    </Text>
                    <Text className="text-slate-900 font-black text-xs">
                      {toBanglaNumber(expenseRatio.toFixed(1))}%
                    </Text>
                  </View>
                  <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${expenseRatio}%` }}
                    />
                  </View>
                </View>
                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-800 font-black text-xs uppercase">
                      নিট লাভ মার্জিন
                    </Text>
                    <Text className="text-amber-600 font-black text-xs">
                      {toBanglaNumber(profitRatio.toFixed(1))}%
                    </Text>
                  </View>
                  <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${profitRatio}%` }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Links / Ledger */}
            <View className="mx-4 bg-white rounded-3xl p-2 border border-slate-100 mb-12">
              <TouchableOpacity className="flex-row items-center justify-between p-4 bg-slate-50/50 rounded-2xl mb-2 active:bg-slate-100 transition-all">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 p-2 rounded-xl mr-3">
                    <TrendingUp color="#3b82f6" size={16} />
                  </View>
                  <Text className="text-slate-700 font-black text-sm">
                    বিক্রয়ের বিস্তারিত রিপোর্ট
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between p-4 bg-slate-50/50 rounded-2xl mb-2 active:bg-slate-100 transition-all">
                <View className="flex-row items-center">
                  <View className="bg-indigo-100 p-2 rounded-xl mr-3">
                    <Package color="#6366f1" size={16} />
                  </View>
                  <Text className="text-slate-700 font-black text-sm">
                    ইনভেন্টরি ও স্টক রিপোর্ট
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between p-4 bg-slate-50/50 rounded-2xl active:bg-slate-100 transition-all">
                <View className="flex-row items-center">
                  <View className="bg-rose-100 p-2 rounded-xl mr-3">
                    <Receipt color="#e11d48" size={16} />
                  </View>
                  <Text className="text-slate-700 font-black text-sm">
                    খরচের পূর্ণাঙ্গ খাতা
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Filter Selection Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <View className="flex-1 justify-end bg-slate-900/60">
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowFilterModal(false)}
          />
          <View className="bg-white rounded-t-[40px] p-6 pb-12 shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
            <Text className="text-center font-black text-slate-800 text-xl mb-6 uppercase tracking-widest">
              রিপোর্ট সময়কাল
            </Text>

            {[
              { id: "today", label: "আজকের রিপোর্ট" },
              { id: "month", label: "চলতি মাসের রিপোর্ট" },
              { id: "year", label: "চলতি বছরের রিপোর্ট" },
              { id: "all", label: "সর্বমোট (All Time)" },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleFilterSelect(item.id, item.label)}
                className={`p-5 rounded-2xl mb-3 flex-row items-center justify-between border ${filter === item.id ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"}`}
              >
                <Text
                  className={`font-black text-[15px] ${filter === item.id ? "text-blue-600" : "text-slate-600"}`}
                >
                  {item.label}
                </Text>
                {filter === item.id && (
                  <View className="bg-blue-500 rounded-full p-1">
                    <ChevronRight color="#fff" size={14} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
