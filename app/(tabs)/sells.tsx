// app/(tabs)/sells.tsx
import { useCartStore } from "@/store/cartStore"; // 👈 আপনার স্টোরের সঠিক পাথ দিন
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  Barcode,
  Hexagon,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
  const [loading, setLoading] = useState(true); // Initial hard load
  const [refreshing, setRefreshing] = useState(false); // Pull to refresh
  const [loadingMore, setLoadingMore] = useState(false); // Pagination load
  const [backgroundSync, setBackgroundSync] = useState(false); // Silent background update
  const [error, setError] = useState<string | null>(null);

  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  const { cart, totalItems, subtotal, addToCart } = useCartStore();
  const searchInputRef = useRef<TextInput>(null);

  // ✅ MAGIC FIX: Background Caching & Fetching
  const fetchProducts = useCallback(
    async (currentPage = 1, searchQuery = "", isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else if (currentPage === 1 && products.length === 0) setLoading(true);
        else if (currentPage === 1 && products.length > 0)
          setBackgroundSync(true); // Silent sync
        else setLoadingMore(true);

        setError(null);

        const limit = 20;
        const url = `https://stock-a1romoni.vercel.app/api/products?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          const newProducts = data.data || [];

          if (currentPage === 1) {
            setProducts(newProducts);
            // Cache the first page for instant load next time
            if (searchQuery === "") {
              AsyncStorage.setItem(
                "@cached_products",
                JSON.stringify(newProducts),
              );
            }
          } else {
            setProducts((prev) => [...prev, ...newProducts]);
          }

          setHasMoreData(newProducts.length === limit);
          setPage(currentPage);
        } else {
          if (products.length === 0)
            setError(data.error || "ডেটা ফেচ করতে সমস্যা হয়েছে।");
        }
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        if (products.length === 0) setError("ইন্টারনেট কানেকশন চেক করুন।");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setBackgroundSync(false);
      }
    },
    [products.length],
  );

  // Initial Load with Cache implementation
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const cached = await AsyncStorage.getItem("@cached_products");
        if (cached) {
          setProducts(JSON.parse(cached));
          setLoading(false); // Don't show hard loader if cache exists
        }
      } catch (e) {
        console.log("Cache read error", e);
      }
      // Always fetch fresh data silently in background
      fetchProducts(1, "");
    };
    loadInitialData();
  }, []);

  // Smart Search (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(1, searchTerm);
    }, 400); // slightly faster search reaction

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleRefresh = () => {
    setSearchTerm("");
    fetchProducts(1, "", true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !backgroundSync && hasMoreData) {
      fetchProducts(page + 1, searchTerm);
    }
  };

  // ✅ MAGIC FIX: Touch Optimized Product Card
  const renderProduct = useCallback(
    ({ item }: { item: any }) => {
      const isOutOfStock = item.stockQty <= 0;
      const cartItem = cart.find((c) => c.product._id === item._id);
      const qtyInCart = cartItem?.qty || 0;

      const handlePress = () => {
        if (isOutOfStock) {
          Vibration.vibrate(50); // Small haptic feedback
          return;
        }
        addToCart(item);
      };

      return (
        <TouchableOpacity
          activeOpacity={isOutOfStock ? 1 : 0.6}
          onPress={handlePress}
          className={`bg-white rounded-2xl p-4 mb-3 border-2 ${
            isOutOfStock
              ? "border-gray-100 bg-gray-50 opacity-70"
              : qtyInCart > 0
                ? "border-amber-400 bg-amber-50/40 shadow-sm"
                : "border-transparent shadow-sm"
          } flex-row items-center justify-between`}
          style={
            !isOutOfStock && qtyInCart === 0
              ? { shadowColor: "#cbd5e1", elevation: 2 }
              : {}
          }
        >
          <View className="flex-row items-center flex-1">
            {/* Dynamic Icon Indicator */}
            <View
              className={`w-12 h-12 rounded-xl items-center justify-center mr-3 border ${
                isOutOfStock
                  ? "bg-gray-200 border-gray-300"
                  : qtyInCart > 0
                    ? "bg-amber-100 border-amber-300"
                    : "bg-sky-50 border-sky-100"
              }`}
            >
              {qtyInCart > 0 ? (
                <Text className="text-amber-700 font-black text-xl">
                  {toBanglaNumber(qtyInCart)}
                </Text>
              ) : (
                <Hexagon
                  color={isOutOfStock ? "#9ca3af" : "#0ea5e9"}
                  size={22}
                />
              )}
            </View>

            <View className="flex-1 pr-2">
              <Text
                className={`text-sm font-black mb-1 leading-tight ${isOutOfStock ? "text-gray-500" : "text-sky-950"}`}
                numberOfLines={2}
              >
                {item.name || "Unknown Product"}
              </Text>
              <View className="flex-row items-center">
                <View
                  className={`px-2 py-0.5 rounded border ${
                    isOutOfStock
                      ? "bg-red-50 border-red-100"
                      : "bg-emerald-50 border-emerald-100"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-extrabold ${isOutOfStock ? "text-red-600" : "text-emerald-700"}`}
                  >
                    {isOutOfStock
                      ? "স্টক আউট"
                      : `স্টক: ${toBanglaNumber(item.stockQty)}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="items-end shrink-0 pl-3">
            <Text className="text-[11px] text-gray-400 font-black mb-0.5">
              দর
            </Text>
            <Text
              className={`text-xl font-black tracking-tight ${isOutOfStock ? "text-gray-400" : "text-sky-700"}`}
            >
              {toBanglaNumber(item.salePrice)}{" "}
              <Text className="text-xs text-sky-500">৳</Text>
            </Text>

            {/* Quick Add icon for empty items */}
            {!isOutOfStock && qtyInCart === 0 && (
              <View className="absolute -bottom-1 -right-1 bg-sky-100 rounded-full p-1 opacity-50">
                <Plus size={14} color="#0ea5e9" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [cart, addToCart],
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#082f49" />

      {/* Header & Search */}
      <View className="bg-[#082f49] px-5 pt-3 pb-6 rounded-b-[28px] border-b-[5px] border-amber-500 z-10 shadow-lg relative overflow-hidden">
        {/* Background Decorations */}
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500 rounded-full opacity-10" />
        <View className="absolute -bottom-5 -left-5 w-20 h-20 bg-amber-400 rounded-full opacity-10" />

        <View className="flex-row justify-between items-center mb-5 z-10">
          <Text className="text-[22px] font-black text-white tracking-wide">
            নতুন সেল (POS)
          </Text>
          {backgroundSync && <ActivityIndicator size="small" color="#fbbf24" />}
        </View>

        <View className="flex-row items-center gap-3 z-10">
          <View className="flex-1 flex-row items-center bg-white/10 rounded-2xl px-4 h-14 border border-white/20 focus:bg-white focus:border-sky-400 transition-all">
            <Search
              color={searchTerm.length > 0 ? "#0ea5e9" : "#9ca3af"}
              size={20}
            />
            <TextInput
              ref={searchInputRef}
              className="flex-1 ml-3 text-white font-bold text-[15px] h-full"
              placeholder="পণ্যের নাম খুঁজুন..."
              placeholderTextColor="#9ca3af"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm("")}
                className="bg-sky-900/50 p-1.5 rounded-full"
              >
                <X color="#9ca3af" size={16} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity className="w-14 h-14 bg-amber-500 rounded-2xl items-center justify-center shadow-sm active:bg-amber-600">
            <Barcode color="#082f49" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
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
            className="bg-sky-900 px-6 py-3 rounded-xl flex-row items-center shadow-lg shadow-sky-900/30"
          >
            <RefreshCcw color="#fff" size={18} />
            <Text className="text-white font-black ml-2">আবার চেষ্টা করুন</Text>
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
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: totalItems > 0 ? 120 : 100,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
              <Text className="text-5xl mb-4 opacity-50">📦</Text>
              <Text className="text-slate-400 font-extrabold text-base">
                কোনো প্রোডাক্ট পাওয়া যায়নি!
              </Text>
            </View>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#0ea5e9" />
              </View>
            ) : hasMoreData && products.length > 0 ? (
              <View className="items-center py-4">
                <Text className="text-xs font-bold text-slate-400">
                  স্ক্রল করুন...
                </Text>
              </View>
            ) : !hasMoreData && products.length > 10 ? (
              <Text className="text-center text-slate-400 font-bold text-xs my-4 pb-6">
                সব প্রোডাক্ট লোড হয়েছে ✅
              </Text>
            ) : null
          }
        />
      )}

      {/* Floating Smart Cart */}
      {totalItems > 0 && !loading && !error && (
        <View className="absolute bottom-[85px] left-4 right-4 bg-[#082f49] rounded-2xl p-3 shadow-2xl flex-row items-center justify-between border-t-[3px] border-amber-500 z-30">
          <View className="flex-row items-center pl-2">
            <View className="relative bg-amber-500/20 p-2.5 rounded-xl mr-3">
              <ShoppingCart color="#fbbf24" size={24} />
              <View className="absolute -top-2 -right-2 bg-rose-500 w-5 h-5 rounded-full items-center justify-center border border-[#082f49]">
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
                {toBanglaNumber(subtotal)} <Text className="text-sm">৳</Text>
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/cart")}
            className="bg-amber-500 h-12 px-6 rounded-xl flex-row items-center justify-center shadow-sm active:bg-amber-600"
          >
            <Text className="text-sky-950 font-black text-[15px] mr-1.5">
              চেকআউট
            </Text>
            <ArrowRight color="#082f49" size={18} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
