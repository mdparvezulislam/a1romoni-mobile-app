// app/cart.tsx
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Barcode,
  Check,
  Edit,
  Minus,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper: বাংলা সংখ্যা রূপান্তর
const toBanglaNumber = (num: number | string | undefined | null) => {
  if (num == null || isNaN(Number(num))) return "০";
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

const getCurrentDate = () => {
  const date = new Date();
  const day = toBanglaNumber(date.getDate());
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${day} ${month}`;
};

export default function CartOverviewScreen() {
  const router = useRouter();
  const {
    cart,
    subtotal,
    discount,
    finalAmount,
    updateQty,
    updateItemDetails,
    removeFromCart,
    setDiscount,
  } = useCartStore();

  const scrollViewRef = useRef<ScrollView>(null);
  const priceInputRef = useRef<TextInput>(null); // ✅ প্রাইস ফিল্ডে অটো ফোকাসের জন্য

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [showDiscount, setShowDiscount] = useState(discount > 0);
  const [keyboardPadding, setKeyboardPadding] = useState(130);

  // ✅ লাইভ কীবোর্ড ট্র্যাকিং (প্যাডিংয়ের জন্য)
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardPadding(e.endCoordinates.height + 100),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardPadding(130),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ✅ এডিট মুড চালু করা এবং অটোমেটিক ফোকাস করা
  const startEditing = (item: any) => {
    setEditingId(item.product._id);
    setEditName(item.customName || item.product.name);
    setEditPrice((item.customPrice ?? item.product.salePrice).toString());

    // সামান্য সময় দিয়ে প্রাইস ফিল্ডে ফোকাস করানো হচ্ছে
    setTimeout(() => {
      priceInputRef.current?.focus();
    }, 100);
  };

  // ✅ এডিট সেভ করা (অটো-সেভ)
  const saveEditing = (productId: string) => {
    if (editingId !== productId) return; // যদি এডিটিং মোডে না থাকে তবে সেভ করবে না

    const price = Number(editPrice);
    if (isNaN(price) || price < 0) {
      updateItemDetails(productId, editName, 0); // নেগেটিভ প্রাইস হলে 0 বসিয়ে দেবে
    } else {
      updateItemDetails(productId, editName, price);
    }
    setEditingId(null);
  };

  // ✅ ইনপুটে ফোকাস করলে অটো-স্ক্রল
  const handleFocusScroll = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 150);
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8fafc] items-center justify-center">
        <Text className="text-4xl mb-4">🛒</Text>
        <Text className="text-slate-400 font-bold text-lg mb-6">
          আপনার কার্ট একদম ফাঁকা!
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#4f46e5] px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/30"
        >
          <Text className="text-white font-bold">দোকানে ফিরে যান</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      {/* Header */}
      <View className="bg-[#fbbf24] px-5 py-4 flex-row items-center justify-between shadow-sm z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#1e293b" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-xl font-black text-slate-900">
            কার্ট ওভারভিউ
          </Text>
        </View>
        <View className="bg-amber-300/50 px-3 py-1.5 rounded-md border border-amber-400">
          <Text className="text-slate-900 font-bold text-xs">
            {getCurrentDate()}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: keyboardPadding }}
        >
          {/* Main Cart Table */}
          <View className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-5 overflow-hidden">
            <View className="bg-[#4f46e5] flex-row items-center px-4 py-3">
              <Text className="flex-[2] font-bold text-white text-sm">
                পণ্যের নাম
              </Text>
              <Text className="flex-1 font-bold text-white text-sm text-center">
                পরিমাণ
              </Text>
              <Text className="flex-1 font-bold text-white text-sm text-center">
                দর
              </Text>
              <Text className="flex-1 font-bold text-white text-sm text-right">
                মোট টাকা
              </Text>
            </View>

            <View className="p-3">
              {cart.map((item, index) => {
                const isEditing = editingId === item.product._id;
                const currentPrice = item.customPrice ?? item.product.salePrice;
                const displayName = item.customName || item.product.name;

                if (isEditing) {
                  // ================= EDIT MODE UI =================
                  return (
                    <View
                      key={item.product._id}
                      className="border-2 border-amber-400 rounded-xl p-3 mb-3 bg-amber-50/30 relative"
                      onLayout={(e) =>
                        handleFocusScroll(e.nativeEvent.layout.y)
                      }
                    >
                      <TouchableOpacity
                        onPress={() => removeFromCart(item.product._id)}
                        className="absolute -top-3 -right-2 bg-white border border-rose-200 rounded-full p-2 shadow-sm z-10"
                      >
                        <Trash2 color="#ef4444" size={14} />
                      </TouchableOpacity>

                      <View className="flex-col gap-3">
                        <View className="flex-row gap-2">
                          <View className="flex-[2]">
                            <Text className="text-[10px] font-extrabold text-amber-600 mb-1">
                              মেমোর নাম
                            </Text>
                            <TextInput
                              value={editName}
                              onChangeText={setEditName}
                              onBlur={() => saveEditing(item.product._id)} // ✅ কীবোর্ড নামলে অটো সেভ
                              onSubmitEditing={() =>
                                saveEditing(item.product._id)
                              } // ✅ এন্টার চাপলে অটো সেভ
                              className="bg-white border border-amber-200 rounded-xl px-3 h-11 text-sm font-bold text-slate-800 focus:border-amber-400"
                            />
                          </View>

                          <View className="flex-[1.5]">
                            <Text className="text-[10px] font-extrabold text-amber-600 mb-1 text-center">
                              পরিমাণ
                            </Text>
                            <View className="flex-row items-center justify-between bg-white border border-amber-200 rounded-xl h-11 overflow-hidden">
                              <TouchableOpacity
                                onPress={() =>
                                  updateQty(item.product._id, item.qty - 1)
                                }
                                className="px-3 h-full justify-center bg-slate-50 border-r border-amber-100"
                              >
                                <Minus size={14} color="#64748b" />
                              </TouchableOpacity>
                              <Text className="font-bold text-slate-800 text-sm">
                                {toBanglaNumber(item.qty)}
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  updateQty(item.product._id, item.qty + 1)
                                }
                                className="px-3 h-full justify-center bg-slate-50 border-l border-amber-100"
                              >
                                <Plus size={14} color="#64748b" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View className="flex-[1.5]">
                            <Text className="text-[10px] font-extrabold text-amber-600 mb-1 text-right">
                              নতুন দর (৳)
                            </Text>
                            <View className="flex-row items-center bg-white border border-amber-200 rounded-xl h-11 px-2 focus:border-amber-400">
                              <Text className="text-gray-400 font-bold mr-1">
                                ৳
                              </Text>
                              <TextInput
                                ref={priceInputRef} // ✅ অটো ফোকাস রেফারেন্স
                                value={editPrice}
                                onChangeText={setEditPrice}
                                keyboardType="numeric"
                                onBlur={() => saveEditing(item.product._id)} // ✅ কীবোর্ড নামলে অটো সেভ
                                onSubmitEditing={() =>
                                  saveEditing(item.product._id)
                                } // ✅ এন্টার চাপলে অটো সেভ
                                className="flex-1 text-right font-black text-slate-800 text-sm"
                              />
                            </View>
                          </View>
                        </View>

                        <View className="flex-row justify-between items-center pt-2">
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              onPress={() =>
                                updateQty(item.product._id, item.qty + 5)
                              }
                              className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg active:bg-blue-100"
                            >
                              <Text className="text-blue-600 font-bold text-xs">
                                +৫
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                updateQty(item.product._id, item.qty + 10)
                              }
                              className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg active:bg-blue-100"
                            >
                              <Text className="text-blue-600 font-bold text-xs">
                                +১০
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            onPress={() => saveEditing(item.product._id)}
                            className="flex-row items-center bg-[#f59e0b] px-5 py-2 rounded-lg shadow-sm active:bg-amber-600"
                          >
                            <Check size={14} color="white" />
                            <Text className="text-white font-extrabold text-xs ml-1.5">
                              সম্পন্ন করুন
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                }

                // ================= NORMAL MODE UI =================
                return (
                  <View
                    key={item.product._id}
                    className={`py-3.5 ${index !== cart.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-[2] flex-row items-center pr-2">
                        <View className="w-6 h-6 rounded bg-indigo-100 items-center justify-center mr-2 border border-indigo-200">
                          <View className="w-2.5 h-2.5 bg-indigo-500 rounded-sm transform rotate-45" />
                        </View>
                        <Text className="font-extrabold text-slate-800 text-sm flex-1">
                          {displayName}
                        </Text>
                      </View>

                      <View className="flex-1 items-center bg-slate-50 py-1 rounded-md border border-slate-100">
                        <Text className="font-extrabold text-slate-700">
                          {toBanglaNumber(item.qty)}
                        </Text>
                      </View>

                      <View className="flex-1 items-center">
                        <Text className="font-extrabold text-slate-600">
                          {toBanglaNumber(currentPrice)}
                        </Text>
                      </View>

                      <View className="flex-1 items-end">
                        <Text className="font-black text-slate-900 text-base">
                          {toBanglaNumber(currentPrice * item.qty)}{" "}
                          <Text className="text-xs text-slate-500">৳</Text>
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-end gap-2">
                      <TouchableOpacity className="flex-row items-center bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm active:bg-slate-50">
                        <Barcode size={12} color="#64748b" />
                        <Text className="text-slate-600 font-bold text-[11px] ml-1.5">
                          বারকোড
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => startEditing(item)}
                        className="flex-row items-center bg-sky-50 border border-sky-200 px-4 py-1.5 rounded-lg shadow-sm active:bg-sky-100"
                      >
                        <Edit size={12} color="#0284c7" />
                        <Text className="text-sky-700 font-extrabold text-[11px] ml-1.5">
                          এডিট করুন
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Order Summary */}
          <View className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="font-extrabold text-slate-600 text-base">
                মোট মূল্য (Subtotal)
              </Text>
              <Text className="font-black text-slate-900 text-xl">
                {toBanglaNumber(subtotal)} ৳
              </Text>
            </View>

            <View className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5">
              <View className="flex-row justify-between items-center">
                <Text className="font-extrabold text-blue-600 flex-row items-center tracking-wide">
                  <Text className="text-xl mr-1">%</Text> স্পেশাল ডিসকাউন্ট
                </Text>
                <Switch
                  value={showDiscount}
                  onValueChange={(val) => {
                    setShowDiscount(val);
                    if (!val) setDiscount(0);
                  }}
                  trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                  thumbColor={showDiscount ? "#3b82f6" : "#f8fafc"}
                />
              </View>

              {showDiscount && (
                <View
                  className="mt-4 flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14 shadow-sm"
                  onLayout={(e) =>
                    handleFocusScroll(e.nativeEvent.layout.y + 200)
                  }
                >
                  <Text className="text-slate-400 font-black text-lg mr-3">
                    ৳
                  </Text>
                  <TextInput
                    value={discount ? discount.toString() : ""}
                    onChangeText={(text) => setDiscount(Number(text))}
                    keyboardType="numeric"
                    placeholder="ছাড়ের পরিমাণ লিখুন..."
                    className="flex-1 font-black text-slate-800 text-base"
                  />
                </View>
              )}
            </View>

            <View className="border-t border-dashed border-slate-200 pt-5 flex-row justify-between items-end">
              <View>
                <Text className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">
                  সর্বশেষ বিল
                </Text>
                <Text className="font-black text-slate-900 text-xl">
                  সর্বমোট প্রদেয়
                </Text>
              </View>
              <Text className="font-black text-[#4f46e5] text-4xl tracking-tighter">
                {toBanglaNumber(finalAmount)} <Text className="text-xl">৳</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Checkout Button */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-white/95 border-t border-slate-100 z-20">
        <TouchableOpacity
          onPress={() => router.push("/checkout")}
          className="w-full bg-gradient-to-r bg-[#4f46e5] h-14 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/40 active:bg-indigo-700"
        >
          <Text className="text-white font-black text-lg tracking-wide">
            চেকআউটে এগিয়ে যান ➔
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
