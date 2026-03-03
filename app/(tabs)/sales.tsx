// app/(tabs)/sales.tsx
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Phone,
  Printer,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper: বাংলা সংখ্যা রূপান্তর
const toBanglaNumber = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || isNaN(Number(num))) return "০";
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

const formatBanglaDate = (dateString: string | Date) => {
  if (!dateString) return "তারিখ নেই";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "ভুল তারিখ";
  }
};

export default function SalesHistoryScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [sales, setSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [summary, setSummary] = useState({ totalSales: 0, totalAmount: 0 });

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

  // ✅ Fetch Sales with Caching
  const fetchSales = useCallback(
    async (isRefresh = false) => {
      try {
        const cacheKey = "@cached_sales_history";
        if (isRefresh) setRefreshing(true);
        else if (sales.length === 0) setLoading(true);
        else setBackgroundSync(true);

        // Load Cache
        if (!isRefresh && sales.length === 0) {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setSales(parsed);
            setLoading(false);
          }
        }

        const response = await fetch(
          `https://stock-a1romoni.vercel.app/api/sales`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const json = await response.json();

        if (json.success || json.data) {
          const dataArray = json.data?.sales || json.data || [];
          setSales(dataArray);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(dataArray));

          const totalAmt = dataArray.reduce(
            (sum: number, item: any) => sum + (item.finalAmount || 0),
            0,
          );
          setSummary({ totalSales: dataArray.length, totalAmount: totalAmt });
        }
      } catch (err) {
        console.error("❌ Fetch Sales Error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setBackgroundSync(false);
      }
    },
    [token, sales.length],
  );

  useEffect(() => {
    if (token) fetchSales();
  }, []);

  const filteredSales = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return sales.filter(
      (s) =>
        s.invoiceNo?.toLowerCase().includes(query) ||
        s.customer?.name?.toLowerCase().includes(query) ||
        s.customer?.phone?.includes(query),
    );
  }, [searchTerm, sales]);

  const openDetails = (sale: any) => {
    Vibration.vibrate(20);
    setSelectedSale(sale);
    setIsDetailsModalVisible(true);
  };

  const closeDetails = () => setIsDetailsModalVisible(false);

  const handleDelete = () => {
    Alert.alert("সতর্কতা", "আপনি কি নিশ্চিত যে এই লেনদেনটি মুছতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: () => Alert.alert("সফল", "মুছে ফেলা হয়েছে!"),
      },
    ]);
  };

  const renderSaleItem = ({ item }: { item: any }) => {
    const isPaid = !item.dueAmount || item.dueAmount <= 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openDetails(item)}
        className="bg-white rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm overflow-hidden relative"
      >
        {/* Status Indicator Bar */}
        <View
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPaid ? "bg-emerald-500" : "bg-rose-500"}`}
        />

        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <ReceiptText color="#64748b" size={14} />
            <Text className="text-slate-600 font-black text-[12px] ml-1.5 uppercase tracking-tighter">
              #{item.invoiceNo}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${isPaid ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"}`}
          >
            <Text
              className={`text-[10px] font-black uppercase ${isPaid ? "text-emerald-600" : "text-rose-600"}`}
            >
              {isPaid ? "Paid" : `Due: ৳${toBanglaNumber(item.dueAmount)}`}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-end">
          <View className="flex-1">
            <Text
              className="text-slate-800 font-black text-lg leading-tight"
              numberOfLines={1}
            >
              {item.customer?.name || "গেস্ট কাস্টমার"}
            </Text>
            <View className="flex-row items-center mt-1">
              <Calendar color="#94a3b8" size={12} />
              <Text className="text-slate-400 font-bold text-xs ml-1">
                {formatBanglaDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-0.5">
              মোট বিল
            </Text>
            <Text className="text-sky-900 font-black text-2xl tracking-tighter">
              {toBanglaNumber(item.finalAmount)}
              <Text className="text-sm font-bold">৳</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View className="bg-[#0f172a] px-5 pt-4 pb-20 border-b-[5px] border-amber-500 shadow-xl">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-white/10 p-2 rounded-full border border-white/10"
            >
              <ArrowLeft color="#fff" size={22} strokeWidth={2.5} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-white tracking-tight">
                লেনদেন ইতিহাস
              </Text>
              <View className="flex-row items-center mt-0.5">
                {backgroundSync && (
                  <ActivityIndicator
                    size="small"
                    color="#fbbf24"
                    className="mr-2"
                  />
                )}
                <Text className="text-sky-300 font-bold text-xs uppercase tracking-widest">
                  সর্বমোট {toBanglaNumber(summary.totalSales)} টি মেমো
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Search & Summary */}
      <View className="px-5 -mt-10 z-20">
        <View className="bg-white p-2.5 rounded-3xl shadow-xl shadow-slate-200/60 border border-white flex-row items-center mb-4">
          <Search color="#94a3b8" size={20} className="ml-2" />
          <TextInput
            className="flex-1 h-12 text-slate-800 font-black text-base px-3"
            placeholder="নাম বা ইনভয়েস নং..."
            placeholderTextColor="#cbd5e1"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchTerm("")}
              className="bg-slate-100 p-1.5 rounded-full mr-1"
            >
              <X color="#64748b" size={16} />
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-sky-600 rounded-[20px] p-4 flex-row justify-between items-center shadow-lg shadow-sky-600/30 mb-5">
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2 rounded-xl mr-3">
              <FileText size={18} color="#fff" />
            </View>
            <Text className="text-white font-bold text-sm tracking-wide">
              মোট বিক্রির পরিমাণ
            </Text>
          </View>
          <Text className="text-white font-black text-2xl tracking-tighter">
            ৳ {toBanglaNumber(summary.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Sales List */}
      <View className="flex-1 px-5">
        {loading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : (
          <FlatList
            data={filteredSales}
            keyExtractor={(item) => item._id}
            renderItem={renderSaleItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchSales(true)}
                colors={["#f59e0b"]}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pt-20">
                <Text className="text-5xl mb-4 grayscale opacity-50">📋</Text>
                <Text className="text-slate-400 font-black text-lg">
                  কোনো লেনদেন পাওয়া যায়নি!
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* TRANSACTION DETAILS MODAL */}
      <Modal visible={isDetailsModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-slate-900/70">
          <TouchableOpacity className="flex-1" onPress={closeDetails} />
          <View className="bg-white rounded-t-[40px] max-h-[85%] pb-8">
            {/* Header */}
            <View className="items-center py-2">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-50">
              <Text className="font-black text-xl text-slate-800">
                লেনদেনের বিস্তারিত
              </Text>
              <TouchableOpacity
                onPress={closeDetails}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-6 pt-5"
              showsVerticalScrollIndicator={false}
            >
              {/* Note Section (New Field) */}
              {selectedSale?.note ? (
                <View className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex-row items-start">
                  <FileText color="#d97706" size={18} className="mt-0.5" />
                  <View className="ml-3 flex-1">
                    <Text className="text-amber-800 font-black text-xs uppercase tracking-widest mb-1">
                      অ্যাডমিন নোট
                    </Text>
                    <Text className="text-amber-900 font-bold text-sm leading-relaxed">
                      {selectedSale.note}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Customer & Info Card */}
              <View className="bg-slate-50 rounded-3xl p-5 mb-6 border border-slate-100">
                <View className="flex-row items-center mb-5">
                  <View className="bg-sky-100 p-3 rounded-2xl mr-4">
                    <User color="#0369a1" size={24} />
                  </View>
                  <View>
                    <Text className="text-slate-950 font-black text-lg leading-none mb-1">
                      {selectedSale?.customer?.name || "গেস্ট কাস্টমার"}
                    </Text>
                    <Text className="text-slate-500 font-bold text-sm flex-row items-center">
                      <Phone size={12} />{" "}
                      {selectedSale?.customer?.phone || "ফোন নম্বর নেই"}
                    </Text>
                  </View>
                </View>
                <View className="h-px bg-slate-200 mb-4" />
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Calendar color="#64748b" size={14} />
                    <Text className="text-slate-600 font-bold text-xs ml-1.5">
                      {formatBanglaDate(selectedSale?.createdAt)}
                    </Text>
                  </View>
                  <View className="bg-white px-3 py-1 rounded-full border border-slate-200">
                    <Text className="text-slate-800 font-black text-[10px]">
                      INVOICE: {selectedSale?.invoiceNo}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Product List Section (New Layout) */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3 ml-1">
                  <ShoppingBag color="#64748b" size={16} />
                  <Text className="text-slate-500 font-black text-xs uppercase tracking-widest ml-2">
                    পণ্য তালিকা
                  </Text>
                </View>
                {selectedSale?.items?.map((p: any, idx: number) => (
                  <View
                    key={idx}
                    className="bg-white border border-slate-100 p-4 rounded-2xl mb-2 flex-row justify-between items-center shadow-sm"
                  >
                    <View className="flex-1">
                      <Text className="text-slate-800 font-black text-sm">
                        {idx + 1}. {p.customName || p.name}
                      </Text>
                      <Text className="text-slate-400 font-bold text-[11px] mt-1">
                        {toBanglaNumber(p.price)} ৳ × {toBanglaNumber(p.qty)}{" "}
                        পিস
                      </Text>
                    </View>
                    <Text className="text-sky-700 font-black text-base">
                      ৳ {toBanglaNumber(p.total)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Dark Payment Card */}
              <View className="bg-[#0f172a] rounded-[32px] p-6 mb-6 shadow-2xl">
                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400 font-bold">সাবটোটাল</Text>
                    <Text className="text-white font-bold">
                      ৳ {toBanglaNumber(selectedSale?.subtotal)}
                    </Text>
                  </View>
                  {selectedSale?.discount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-slate-400 font-bold">
                        ডিসকাউন্ট
                      </Text>
                      <Text className="text-rose-400 font-bold">
                        - ৳ {toBanglaNumber(selectedSale?.discount)}
                      </Text>
                    </View>
                  )}
                  <View className="h-px bg-slate-800 my-2" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white font-black text-lg">
                      সর্বমোট বিল
                    </Text>
                    <Text className="text-amber-400 font-black text-2xl">
                      ৳ {toBanglaNumber(selectedSale?.finalAmount)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between pt-2">
                    <Text className="text-emerald-400 font-black">
                      জমা (Paid)
                    </Text>
                    <Text className="text-emerald-400 font-black">
                      ৳ {toBanglaNumber(selectedSale?.paidAmount)}
                    </Text>
                  </View>
                  {selectedSale?.dueAmount > 0 && (
                    <View className="flex-row justify-between pt-1">
                      <Text className="text-rose-400 font-black">
                        বাকি (Due)
                      </Text>
                      <Text className="text-rose-400 font-black">
                        ৳ {toBanglaNumber(selectedSale?.dueAmount)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mb-10">
                <TouchableOpacity
                  onPress={() => {
                    closeDetails();
                    router.push(`/invoice/${selectedSale?._id}`);
                  }}
                  className="flex-[1.5] bg-sky-600 h-14 rounded-2xl flex-row justify-center items-center shadow-lg shadow-sky-600/30"
                >
                  <Printer color="#fff" size={20} />
                  <Text className="text-white font-black text-base ml-2">
                    প্রিন্ট মেমো
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  className="flex-1 bg-rose-50 border border-rose-200 h-14 rounded-2xl flex-row justify-center items-center"
                >
                  <Trash2 color="#e11d48" size={20} />
                  <Text className="text-rose-600 font-black text-sm ml-2">
                    মুছুন
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
