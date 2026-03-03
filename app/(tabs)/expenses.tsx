// app/expenses/index.tsx (বা আপনার খরচের মেইন লিস্ট ফাইল)
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Edit2,
  History,
  Plus,
  RefreshCcw,
  Trash2,
  TrendingDown,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const toBanglaNumber = (num: any) => {
  if (!num) return "০";
  const engToBng: any = {
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
  return String(num).replace(/[0-9]/g, (s) => engToBng[s] || s);
};

const formatBanglaDate = (dateString: any) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function ExpensesListScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Fetch Expenses
  const fetchExpenses = useCallback(
    async (currentPage = 1, isRefresh = false) => {
      try {
        const cacheKey = "@cached_all_expenses";
        if (isRefresh) setRefreshing(true);
        else if (currentPage === 1 && expenses.length === 0) setLoading(true);
        else if (currentPage > 1) setLoadingMore(true);

        const response = await fetch(
          `https://stock-a1romoni.vercel.app/api/expenses?page=${currentPage}&limit=15`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await response.json();

        if (data.success) {
          const newItems = data.data || [];
          if (currentPage === 1) {
            setExpenses(newItems);
            AsyncStorage.setItem(cacheKey, JSON.stringify(newItems));
          } else {
            setExpenses((prev) => [...prev, ...newItems]);
          }
          setHasMore(newItems.length === 15);
          setPage(currentPage);
        }
      } catch (err) {
        console.log("Fetch Error", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setBackgroundSync(false);
        setRefreshing(false);
      }
    },
    [token, expenses.length],
  );

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ✅ Delete Expense Action
  const handleDelete = (id: string) => {
    Vibration.vibrate(100);
    Alert.alert("সতর্কতা", "আপনি কি এই খরচের হিসাবটি মুছে ফেলতে চান?", [
      { text: "না", style: "cancel" },
      {
        text: "হ্যাঁ, মুছুন",
        style: "destructive",
        onPress: async () => {
          // এখানে আপনার API কল হবে ডিলিট করার জন্য
          setExpenses((prev) => prev.filter((item) => item._id !== id));
          alert("খরচ মুছে ফেলা হয়েছে");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0284c7]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0369a1" />

      {/* Header */}
      <View className="bg-[#0284c7] px-5 pt-4 pb-16 z-10 border-b-[5px] border-orange-500 shadow-xl relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-sky-400 rounded-full opacity-20" />
        <View className="flex-row justify-between items-center z-10">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/10 p-2 rounded-full mr-3 border border-white/20"
            >
              <ArrowLeft color="#fff" size={22} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-white tracking-tight">
                খরচের খাতা
              </Text>
              <Text className="text-sky-100 font-bold text-xs uppercase tracking-widest">
                ব্যবসায়ের সকল খরচের তালিকা
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => fetchExpenses(1, true)}
            className="bg-white/10 p-2.5 rounded-xl border border-white/20"
          >
            <RefreshCcw
              color="#fff"
              size={20}
              className={refreshing ? "animate-spin" : ""}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 bg-slate-100 rounded-t-[35px] -mt-10 overflow-hidden">
        {/* ✅ New Expense Button */}
        <View className="px-5 pt-6 pb-2">
          <TouchableOpacity
            onPress={() => router.push("/expenses/new")}
            className="bg-orange-500 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-orange-500/30 active:bg-orange-600"
          >
            <Plus color="#fff" size={24} strokeWidth={3} className="mr-2" />
            <Text className="text-white font-black text-lg uppercase tracking-widest">
              নতুন খরচ যোগ করুন
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchExpenses(1, true)}
              colors={["#f59e0b"]}
            />
          }
        >
          <View className="flex-row items-center mb-4 ml-1">
            <History color="#64748b" size={18} className="mr-2" />
            <Text className="text-slate-500 font-black uppercase text-xs tracking-widest">
              খরচসমূহের বিস্তারিত
            </Text>
          </View>

          {loading ? (
            <View className="mt-20">
              <ActivityIndicator size="large" color="#0284c7" />
            </View>
          ) : (
            expenses.map((item, index) => (
              <View
                key={index}
                className="bg-white p-4 rounded-3xl mb-3 border border-slate-50 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <View className="bg-rose-50 p-3 rounded-2xl mr-3 border border-rose-100">
                    <TrendingDown color="#e11d48" size={22} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-slate-800 font-black text-sm"
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                    <Text className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-tighter">
                      {item.category} • {formatBanglaDate(item.expenseDate)}
                    </Text>
                    <Text className="text-rose-600 font-black text-base mt-0.5">
                      ৳{toBanglaNumber(item.amount)}
                    </Text>
                  </View>
                </View>

                {/* ✅ Edit & Delete Buttons */}
                <View className="flex-row gap-2 pl-2">
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/expenses/edit/[id]",
                        params: { id: item._id },
                      })
                    }
                    className="bg-sky-50 p-2.5 rounded-xl border border-sky-100 active:bg-sky-100"
                  >
                    <Edit2 color="#0284c7" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 active:bg-rose-100"
                  >
                    <Trash2 color="#e11d48" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {hasMore && !loading && (
            <TouchableOpacity
              onPress={() => fetchExpenses(page + 1)}
              disabled={loadingMore}
              className="bg-white py-4 rounded-2xl border border-slate-200 flex-row items-center justify-center mt-2 mb-20 shadow-sm active:bg-slate-50"
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <Text className="text-slate-500 font-black text-xs uppercase">
                  আরো দেখুন (Load More)
                </Text>
              )}
            </TouchableOpacity>
          )}

          {!hasMore && expenses.length > 0 && (
            <Text className="text-center text-slate-400 font-bold text-[10px] mb-20 uppercase tracking-widest">
              সব খরচ দেখানো হয়েছে ✅
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
