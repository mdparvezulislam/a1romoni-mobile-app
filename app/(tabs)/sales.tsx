// app/(tabs)/sales.tsx
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  ReceiptText,
  Search,
  Trash2,
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

// Date Formatter
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
  const [summary, setSummary] = useState({ totalSales: 0, totalAmount: 0 });

  // Modal State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

  // ✅ API থেকে সেলস ডেটা আনা
  const fetchSales = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

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

          // টোটাল হিসাব করা
          const totalAmt = dataArray.reduce(
            (sum: number, item: any) => sum + (item.finalAmount || 0),
            0,
          );
          setSummary({ totalSales: dataArray.length, totalAmount: totalAmt });
        } else {
          setSales(json.sales || []);
        }
      } catch (err: any) {
        console.error("❌ Fetch Sales Error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) fetchSales();
  }, [fetchSales, token]);

  // সার্চ ফিল্টার
  const filteredSales = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return sales.filter(
      (s) =>
        s.invoiceNo?.toLowerCase().includes(query) ||
        s.customer?.name?.toLowerCase().includes(query) ||
        s.customer?.phone?.includes(query),
    );
  }, [searchTerm, sales]);

  // Modal Open/Close
  const openDetails = (sale: any) => {
    setSelectedSale(sale);
    setIsDetailsModalVisible(true);
  };
  const closeDetails = () => {
    setIsDetailsModalVisible(false);
    setSelectedSale(null);
  };

  // ডিলিট অ্যাকশন (Placeholder)
  const handleDelete = () => {
    Alert.alert("সতর্কতা", "আপনি কি নিশ্চিত যে এই লেনদেনটি মুছতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: () => {
          Alert.alert("সফল", "লেনদেনটি মুছে ফেলা হয়েছে!");
          closeDetails();
          // API Call here to delete...
        },
      },
    ]);
  };

  // ✅ লিস্টের প্রতিটি কার্ড (Row)
  const renderSaleItem = useCallback(({ item }: { item: any }) => {
    const isPaid = !item.dueAmount || item.dueAmount <= 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openDetails(item)}
        className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm"
      >
        {/* Top Row: Invoice & Status */}
        <View className="flex-row justify-between items-center mb-3 border-b border-slate-50 pb-2">
          <View className="flex-row items-center">
            <ReceiptText color="#3b82f6" size={16} />
            <Text className="text-blue-600 font-extrabold text-sm ml-2">
              #{item.invoiceNo || "INV-UNKNOWN"}
            </Text>
          </View>
          <View
            className={`px-2.5 py-1 rounded-md border ${isPaid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}
          >
            <Text
              className={`text-[10px] font-extrabold ${isPaid ? "text-emerald-600" : "text-rose-600"}`}
            >
              {isPaid
                ? "পরিশোধিত"
                : `বাকি: ৳ ${toBanglaNumber(item.dueAmount)}`}
            </Text>
          </View>
        </View>

        {/* Middle Row: Customer & Date */}
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-slate-800 font-bold text-sm">
              {item.customer?.name || "গেস্ট কাস্টমার"}
            </Text>
            <Text className="text-slate-400 font-bold text-[11px] mt-0.5">
              {item.customer?.phone || "মোবাইল দেওয়া হয়নি"}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-slate-500 font-medium text-xs flex-row items-center">
              {formatBanglaDate(item.createdAt)}
            </Text>
            <Text className="text-slate-400 font-bold text-[11px] mt-0.5">
              আইটেম: {toBanglaNumber(item.items?.length || 0)} টি
            </Text>
          </View>
        </View>

        {/* Bottom Row: Amount */}
        <View className="bg-slate-50 p-3 rounded-xl flex-row justify-between items-center border border-slate-100">
          <Text className="text-slate-500 font-extrabold text-xs uppercase tracking-widest">
            মোট বিল
          </Text>
          <Text className="text-slate-900 font-black text-lg">
            ৳ {toBanglaNumber(item.finalAmount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* 1. Header (Dark Blue) */}
      <View className="bg-slate-900 px-5 pt-4 pb-20 z-10 border-b-4 border-[#f59e0b] shadow-xl">
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-1"
            >
              <ArrowLeft color="#fff" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-white">
                লেনদেনের ইতিহাস
              </Text>
              <Text className="text-slate-400 font-bold text-xs mt-0.5 tracking-wide">
                সর্বমোট {toBanglaNumber(summary.totalSales)} টি লেনদেন
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Search & Summary */}
      <View className="px-5 -mt-10 z-20">
        <View className="bg-white p-2 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex-row items-center mb-4">
          <View className="bg-slate-50 p-2.5 rounded-xl mr-2">
            <Search color="#94a3b8" size={20} />
          </View>
          <TextInput
            className="flex-1 h-12 text-slate-800 font-bold text-sm"
            placeholder="নাম, মোবাইল বা ইনভয়েস নং..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Total Page Sales Badge */}
        <View className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex-row justify-between items-center mb-4 shadow-sm">
          <Text className="text-blue-800 font-bold text-sm flex-row items-center">
            <FileText size={16} color="#1e40af" /> এই পেজের মোট বিক্রি:
          </Text>
          <Text className="text-blue-700 font-black text-lg">
            ৳ {toBanglaNumber(summary.totalAmount)}
          </Text>
        </View>
      </View>

      {/* 3. Sales List */}
      <View className="flex-1 px-5">
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-400 font-bold mt-3">
              ডেটা লোড হচ্ছে...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSales}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderSaleItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchSales(true)}
                colors={["#3b82f6"]}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pt-20">
                <Text className="text-5xl mb-3">📭</Text>
                <Text className="text-slate-400 font-bold text-base">
                  কোনো লেনদেন পাওয়া যায়নি!
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ========================================== */}
      {/* 4. TRANSACTION DETAILS MODAL (BOTTOM SHEET) */}
      {/* ========================================== */}
      <Modal visible={isDetailsModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-end bg-slate-900/60">
          <TouchableOpacity className="flex-1" onPress={closeDetails} />

          <View className="bg-slate-50 rounded-t-3xl shadow-2xl max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-slate-200 bg-white rounded-t-3xl">
              <View className="flex-row items-center">
                <View className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <ReceiptText color="#4f46e5" size={20} />
                </View>
                <Text className="font-black text-lg text-slate-800">
                  লেনদেনের বিস্তারিত
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeDetails}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="p-5"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Print Button */}
              <TouchableOpacity
                onPress={() => {
                  closeDetails();
                  router.push(`/invoice/${selectedSale?._id}`); // ✅ সরাসরি প্রিন্ট পেজে নিয়ে যাবে
                }}
                className="bg-indigo-50 border border-indigo-200 py-3.5 rounded-xl flex-row justify-center items-center mb-5 active:bg-indigo-100"
              >
                <Printer color="#4f46e5" size={18} strokeWidth={2.5} />
                <Text className="text-indigo-700 font-black text-sm ml-2">
                  কাস্টমার ইনভয়েস প্রিন্ট করুন
                </Text>
              </TouchableOpacity>

              {/* Customer Info Card */}
              <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
                <View className="flex-row justify-between mb-3 border-b border-slate-100 pb-3">
                  <Text className="font-extrabold text-slate-800 text-base">
                    ইনভয়েস:{" "}
                    <Text className="text-blue-600">
                      #{selectedSale?.invoiceNo}
                    </Text>
                  </Text>
                  <View className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    <Text className="text-blue-600 font-bold text-[10px]">
                      আইটেম: {toBanglaNumber(selectedSale?.items?.length)}
                    </Text>
                  </View>
                </View>

                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 font-bold text-sm">
                      কাস্টমার নাম
                    </Text>
                    <Text className="text-slate-900 font-black text-sm">
                      {selectedSale?.customer?.name || "গেস্ট কাস্টমার"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 font-bold text-sm">
                      মোবাইল নম্বর
                    </Text>
                    <Text className="text-slate-900 font-black text-sm">
                      {selectedSale?.customer?.phone || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 font-bold text-sm">
                      তারিখ ও সময়
                    </Text>
                    <Text className="text-slate-900 font-black text-sm">
                      {formatBanglaDate(selectedSale?.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Summary Card (Dark Theme like Web) */}
              <View className="bg-slate-900 rounded-2xl p-5 mb-5 shadow-lg">
                <View className="flex-row justify-between items-center mb-4 border-b border-slate-700 pb-4">
                  <Text className="text-white font-black text-lg">
                    মোট বিল : ৳ {toBanglaNumber(selectedSale?.finalAmount)}
                  </Text>
                  {!selectedSale?.dueAmount || selectedSale?.dueAmount <= 0 ? (
                    <View className="bg-emerald-500/20 px-3 py-1 rounded border border-emerald-500/30 flex-row items-center">
                      <CheckCircle2
                        color="#34d399"
                        size={12}
                        className="mr-1"
                      />
                      <Text className="text-emerald-400 font-bold text-xs">
                        পরিশোধিত
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-rose-500/20 px-3 py-1 rounded border border-rose-500/30 flex-row items-center">
                      <Clock color="#fb7185" size={12} className="mr-1" />
                      <Text className="text-rose-400 font-bold text-xs">
                        বাকি আছে
                      </Text>
                    </View>
                  )}
                </View>

                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400 font-bold text-sm">
                      সাবটোটাল
                    </Text>
                    <Text className="text-white font-bold text-sm">
                      ৳ {toBanglaNumber(selectedSale?.subtotal)}
                    </Text>
                  </View>
                  {selectedSale?.discount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-slate-400 font-bold text-sm">
                        ডিসকাউন্ট
                      </Text>
                      <Text className="text-rose-400 font-bold text-sm">
                        - ৳ {toBanglaNumber(selectedSale?.discount)}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row justify-between pt-2 border-t border-slate-700/50">
                    <Text className="text-slate-300 font-extrabold text-sm">
                      সর্বমোট প্রদেয়
                    </Text>
                    <Text className="text-white font-extrabold text-sm">
                      ৳ {toBanglaNumber(selectedSale?.finalAmount)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between pt-1">
                    <Text className="text-emerald-400 font-extrabold text-sm">
                      কাস্টমার দিয়েছে
                    </Text>
                    <Text className="text-emerald-400 font-extrabold text-sm">
                      ৳{" "}
                      {toBanglaNumber(
                        selectedSale?.paidAmount || selectedSale?.finalAmount,
                      )}
                    </Text>
                  </View>
                  {selectedSale?.dueAmount > 0 && (
                    <View className="flex-row justify-between pt-1">
                      <Text className="text-rose-400 font-extrabold text-sm">
                        বাকি (Due)
                      </Text>
                      <Text className="text-rose-400 font-extrabold text-sm">
                        ৳ {toBanglaNumber(selectedSale?.dueAmount)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Delete Transaction Button */}
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-rose-50 border border-rose-200 py-4 rounded-xl flex-row justify-center items-center active:bg-rose-100"
              >
                <Trash2 color="#e11d48" size={18} />
                <Text className="text-rose-600 font-black text-sm ml-2">
                  লেনদেন মুছুন
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
