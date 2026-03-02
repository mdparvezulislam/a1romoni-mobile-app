// app/(tabs)/sells.tsx
import { useCartStore } from "@/store/cartStore"; // 👈 আপনার স্টোরের পাথ ঠিক রাখবেন
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  Barcode,
  ChevronDown,
  Hexagon,
  RefreshCcw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
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

export default function SellsScreen() {
  const router = useRouter();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  const { cart, totalItems, subtotal, addToCart } = useCartStore();

  // ✅ API Fetch Function (Pagination & Search Support)
  const fetchProducts = useCallback(
    async (currentPage = 1, searchQuery = "", isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else if (currentPage === 1) setLoading(true);
        else setLoadingMore(true);

        setError(null);

        // URL Parameter Setup
        const limit = 20; // প্রতি পেজে ২০টি করে প্রোডাক্ট আনবো
        const url = `https://stock-a1romoni.vercel.app/api/products?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          const newProducts = data.data || [];

          // যদি ফার্স্ট পেজ হয় তবে ডেটা রিপ্লেস করবে, না হলে আগের ডেটার সাথে যুক্ত করবে
          setProducts((prev) =>
            currentPage === 1 ? newProducts : [...prev, ...newProducts],
          );

          // যদি ডাটা limit এর চেয়ে কম আসে তার মানে আর ডেটা নেই
          setHasMoreData(newProducts.length === limit);
          setPage(currentPage);
        } else {
          setError(data.error || "ডেটা ফেচ করতে সমস্যা হয়েছে।");
        }
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        setError(
          "প্রোডাক্ট লোড করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Initial Load
  useEffect(() => {
    fetchProducts(1, "");
  }, [fetchProducts]);

  // ✅ স্মার্ট সার্চ লজিক (Debounce Effect)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // যখন ইউজার টাইপ করা থামাবে (৫০০ms পর) তখন সার্চ কল হবে
      fetchProducts(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchProducts]);

  // Pull to Refresh
  const handleRefresh = () => {
    setSearchTerm("");
    fetchProducts(1, "", true);
  };

  // Load More Data (Pagination)
  const handleLoadMore = () => {
    if (!loadingMore && hasMoreData) {
      fetchProducts(page + 1, searchTerm);
    }
  };

  // প্রোডাক্ট কার্ড রেন্ডার
  const renderProduct = useCallback(
    ({ item }: { item: any }) => {
      const isOutOfStock = item.stockQty <= 0;
      const qtyInCart = cart.find((c) => c.product._id === item._id)?.qty || 0;

      return (
        <TouchableOpacity
          activeOpacity={isOutOfStock ? 1 : 0.7}
          onPress={() =>
            !isOutOfStock ? addToCart(item) : alert("এই প্রোডাক্টটি স্টকে নেই!")
          }
          className={`bg-white rounded-2xl p-3 mb-3 border ${
            isOutOfStock
              ? "border-gray-100 opacity-60 bg-gray-50"
              : qtyInCart > 0
                ? "border-amber-400 bg-amber-50/20"
                : "border-sky-100"
          } shadow-sm flex-row items-center justify-between`}
        >
          <View className="flex-row items-center flex-1">
            <View
              className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isOutOfStock ? "bg-gray-200" : "bg-sky-50"}`}
            >
              <Hexagon color={isOutOfStock ? "#9ca3af" : "#0ea5e9"} size={24} />
            </View>
            <View className="flex-1 pr-2">
              <Text
                className="text-sm font-extrabold text-sky-950 mb-1 leading-tight"
                numberOfLines={2}
              >
                {item.name || "Unknown Product"}
              </Text>
              <View className="flex-row items-center">
                <View
                  className={`px-2 py-0.5 rounded-md ${isOutOfStock ? "bg-red-50" : "bg-emerald-50"}`}
                >
                  <Text
                    className={`text-[10px] font-bold ${isOutOfStock ? "text-red-600" : "text-emerald-700"}`}
                  >
                    {isOutOfStock
                      ? "স্টক আউট"
                      : `স্টক: ${toBanglaNumber(item.stockQty)}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="items-end shrink-0 pl-2 border-l border-sky-50">
            <Text className="text-xs text-gray-400 font-bold mb-0.5">
              দর (৳)
            </Text>
            <Text className="text-lg font-black text-sky-700">
              {toBanglaNumber(item.salePrice)}
            </Text>
            {qtyInCart > 0 && (
              <View className="absolute -top-2 -right-2 bg-amber-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm">
                <Text className="text-white text-[10px] font-black">
                  {toBanglaNumber(qtyInCart)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [cart, addToCart],
  );

  return (
    <SafeAreaView className="flex-1 bg-sky-50/40" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#082f49" />

      {/* Header & Search */}
      <View className="bg-sky-950 px-5 pt-2 pb-6 rounded-b-[24px] border-b-4 border-amber-500 z-10 shadow-sm">
        <Text className="text-xl font-black text-white mb-4">
          নতুন সেল (POS)
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 h-12 border border-sky-800">
            <Search color="#0ea5e9" size={20} />
            <TextInput
              className="flex-1 ml-2.5 text-sky-900 font-bold text-sm h-full"
              placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
              placeholderTextColor="#9ca3af"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <X color="#9ca3af" size={18} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center border border-white/20">
            <Barcode color="#fbbf24" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-sky-900 font-bold mt-3">
            প্রোডাক্ট লোড হচ্ছে...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
            <AlertCircle color="#ef4444" size={32} />
          </View>
          <Text className="text-sky-900 font-extrabold text-lg mb-2">
            দুঃখিত!
          </Text>
          <Text className="text-gray-500 text-center mb-6">{error}</Text>
          <TouchableOpacity
            onPress={() => fetchProducts(1, searchTerm)}
            className="bg-amber-500 px-6 py-3 rounded-xl flex-row items-center shadow-lg shadow-amber-500/30"
          >
            <RefreshCcw color="#082f49" size={18} />
            <Text className="text-sky-950 font-black ml-2">
              আবার চেষ্টা করুন
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) =>
            item._id ? item._id.toString() : index.toString()
          }
          renderItem={renderProduct}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#f59e0b"]}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: totalItems > 0 ? 120 : 100, // Cart Button & Bottom Bar Space
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
              <Text className="text-4xl mb-3">📦</Text>
              <Text className="text-gray-400 font-bold text-base">
                কোনো প্রোডাক্ট পাওয়া যায়নি!
              </Text>
            </View>
          }
          // ✅ Infinite Scroll / Load More Footer
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // স্ক্রিনের অর্ধেক বাকি থাকতেই পরের ডেটা লোড করবে
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#0ea5e9" />
              </View>
            ) : hasMoreData && products.length > 0 ? (
              <TouchableOpacity
                onPress={handleLoadMore}
                className="bg-blue-100 py-3 rounded-xl flex-row items-center justify-center border border-blue-200 mt-2 mb-6"
              >
                <Text className="text-blue-700 font-bold text-sm mr-2">
                  আরো দেখুন
                </Text>
                <ChevronDown color="#1d4ed8" size={18} />
              </TouchableOpacity>
            ) : !hasMoreData && products.length > 10 ? (
              <Text className="text-center text-gray-400 text-xs my-4 pb-6">
                সব প্রোডাক্ট দেখানো হয়েছে
              </Text>
            ) : null
          }
        />
      )}

      {/* Floating Smart Cart */}
      {totalItems > 0 && !loading && !error && (
        <View className="absolute bottom-[85px] left-4 right-4 bg-sky-950 rounded-2xl p-3 shadow-2xl flex-row items-center justify-between border-t-2 border-amber-500 z-30">
          <View className="flex-row items-center pl-2">
            <View className="relative bg-amber-500/20 p-2.5 rounded-xl mr-3 border border-amber-500/30">
              <ShoppingCart color="#fbbf24" size={24} />
              <View className="absolute -top-2 -right-2 bg-rose-500 w-5 h-5 rounded-full items-center justify-center border border-white">
                <Text className="text-white text-[10px] font-black">
                  {toBanglaNumber(totalItems)}
                </Text>
              </View>
            </View>
            <View>
              <Text className="text-[10px] text-sky-300 font-bold uppercase tracking-widest mb-0.5">
                মোট বিল
              </Text>
              <Text className="text-xl font-black text-white leading-none">
                <Text className="text-sm">৳ </Text>
                {toBanglaNumber(subtotal)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/cart")}
            className="bg-amber-500 h-12 px-5 sm:px-6 rounded-xl flex-row items-center justify-center shadow-lg shadow-amber-500/40"
          >
            <Text className="text-sky-950 font-black text-sm mr-1.5">
              কার্ট দেখুন
            </Text>
            <ArrowRight color="#082f49" size={18} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
