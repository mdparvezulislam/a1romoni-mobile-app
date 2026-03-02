// app/checkout.tsx
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  User,
  Wallet,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Switch,
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

// আজকের তারিখ (DD/MM/YYYY)
const getTodayDate = () => {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const cart = useCartStore((state) => state.cart);
  const finalAmount = useCartStore((state) => state.finalAmount);
  const subtotal = useCartStore((state) => state.subtotal);
  const discount = useCartStore((state) => state.discount);
  const clearCart = useCartStore((state) => state.clearCart);

  const grandTotal = finalAmount > 0 ? finalAmount : subtotal;

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputPositions, setInputPositions] = useState<{
    [key: string]: number;
  }>({});
  const [keyboardPadding, setKeyboardPadding] = useState(130);

  // States
  const [paidAmount, setPaidAmount] = useState(grandTotal.toString());
  const [customDate, setCustomDate] = useState(getTodayDate());
  const [note, setNote] = useState("");
  const [isCustomerSale, setIsCustomerSale] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const receivedAmount = Number(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - receivedAmount);
  const returnAmount =
    receivedAmount > grandTotal ? receivedAmount - grandTotal : 0;

  // কীবোর্ড হ্যান্ডলিং
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

  // ডেটাবেসে সেল সেভ করা
  const handleConfirmAndPrint = async () => {
    if (cart.length === 0) return Alert.alert("ভুল", "আপনার কার্ট খালি!");

    setIsSubmitting(true);

    try {
      // ✅ MAGIC FIX: Duplicate Item ID Filtering (.split('_')[0])
      const payloadItems = cart.map((item) => {
        const realProductId = item.product._id.split("_")[0]; // Mongoose error preventer

        return {
          productId: realProductId,
          name: item.product.name,
          customName: item.customName || null,
          price: item.customPrice ?? item.product.salePrice,
          qty: item.qty,
          total: (item.customPrice ?? item.product.salePrice) * item.qty,
        };
      });

      const payload = {
        items: payloadItems,
        subtotal: subtotal,
        discount: discount,
        finalAmount: grandTotal,
        paidAmount: receivedAmount > grandTotal ? grandTotal : receivedAmount, // চেঞ্জ ফেরত দিলে শুধু আসল বিলটাই সেভ হবে
        dueAmount: dueAmount,
        note: note, // ✅ নতুন Note Field অ্যাড করা হয়েছে
        customer: isCustomerSale
          ? { name: customerName, phone: customerPhone }
          : null,
      };

      // 🌐 Live Backend URL
      const response = await fetch(
        "https://stock-a1romoni.vercel.app/api/sales",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        clearCart();
        router.replace(`/invoice/${data.data._id}`); // সফল হলে ইনভয়েস পেজে নিয়ে যাবে
      } else {
        Alert.alert(
          "সমস্যা",
          data.error || "বিক্রি সম্পন্ন করতে সমস্যা হয়েছে!",
        );
      }
    } catch (error) {
      console.error("Sale Submit Error:", error);
      Alert.alert("নেটওয়ার্ক এরর", "সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // অটো স্ক্রল লজিক
  const handleLayout = (fieldId: string, event: any) => {
    const layout = event.nativeEvent.layout;
    setInputPositions((prev) => ({ ...prev, [fieldId]: layout.y }));
  };

  const handleFocus = (fieldId: string) => {
    setTimeout(() => {
      if (inputPositions[fieldId] !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: inputPositions[fieldId] - 20,
          animated: true,
        });
      }
    }, 200);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f6f8]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* 1. Modern Header Area */}
      <View className="bg-[#1e3a8a] px-5 pt-4 pb-20 z-10 border-b-[6px] border-[#f59e0b] shadow-xl relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-20" />
        <View className="absolute -bottom-10 -left-10 w-28 h-28 bg-orange-400 rounded-full opacity-20" />

        <View className="flex-row items-center mb-1 z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isSubmitting}
            className="bg-white/15 p-2.5 rounded-full mr-4 border border-white/20 active:bg-white/25"
          >
            <ArrowLeft color="#fff" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text className="text-[22px] font-black text-white tracking-wide">
              পেমেন্ট ও চেকআউট
            </Text>
            <Text className="text-blue-200 font-bold mt-0.5 text-[11px] tracking-widest uppercase">
              ফাইনাল বিল সংগ্রহ করুন
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-transparent -mt-14 z-20"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: keyboardPadding }}
        >
          {/* 2. Quick Grand Total Card */}
          <View className="bg-gradient-to-r from-[#f59e0b] to-amber-500 bg-[#f59e0b] rounded-3xl p-6 mb-5 shadow-lg shadow-amber-500/40 flex-row justify-between items-center overflow-hidden relative">
            <View className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <View className="z-10">
              <Text className="text-amber-50 font-bold text-xs uppercase tracking-widest mb-1.5">
                সর্বমোট বিল
              </Text>
              <Text className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                {toBanglaNumber(grandTotal)} <Text className="text-xl">৳</Text>
              </Text>
            </View>
            <View className="bg-white/20 p-4 rounded-2xl border border-white/30 z-10 shadow-sm">
              <Wallet color="#ffffff" size={32} strokeWidth={2} />
            </View>
          </View>

          {/* 3. Automation Payment Form */}
          <View className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 space-y-5 mb-5">
            {/* Cash Received */}
            <View onLayout={(e) => handleLayout("payment", e)}>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-extrabold text-[#1e3a8a] flex-row items-center">
                  <Banknote color="#3b82f6" size={16} /> কাস্টমার কত টাকা
                  দিয়েছে?
                </Text>
                {/* ⚡ Quick Pay Button */}
                <TouchableOpacity
                  onPress={() => setPaidAmount(grandTotal.toString())}
                  className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm active:bg-blue-100"
                >
                  <Text className="text-blue-700 font-extrabold text-[11px] uppercase tracking-wider">
                    Full Pay
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="relative justify-center mb-4">
                <Text className="absolute left-5 font-black text-slate-400 text-xl z-10">
                  ৳
                </Text>
                <TextInput
                  className="bg-slate-50 border-2 border-slate-100 rounded-2xl w-full h-16 pl-12 pr-4 text-[22px] font-black text-slate-800 focus:border-[#3b82f6] focus:bg-white transition-all shadow-inner"
                  placeholder="0"
                  keyboardType="numeric"
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  onFocus={() => handleFocus("payment")}
                  selectTextOnFocus // ট্যাপ করলেই আগের এমাউন্ট সিলেক্ট হয়ে যাবে, নতুন কিছু লিখলে সেটা বসবে
                />
              </View>

              {/* Dynamic Due / Change Box */}
              <View
                className={`p-4 rounded-2xl border ${dueAmount > 0 ? "bg-rose-50 border-rose-100" : returnAmount > 0 ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"} flex-row justify-between items-center shadow-sm`}
              >
                {dueAmount > 0 ? (
                  <>
                    <Text className="text-sm font-extrabold text-rose-600 flex-row items-center tracking-wide">
                      <Clock size={16} color="#e11d48" /> বাকি (Due)
                    </Text>
                    <Text className="text-xl font-black text-rose-700">
                      ৳ {toBanglaNumber(dueAmount)}
                    </Text>
                  </>
                ) : returnAmount > 0 ? (
                  <>
                    <Text className="text-sm font-extrabold text-emerald-600 flex-row items-center tracking-wide">
                      <CheckCircle2 size={16} color="#059669" /> চেঞ্জ (ফেরত)
                    </Text>
                    <Text className="text-xl font-black text-emerald-700">
                      ৳ {toBanglaNumber(returnAmount)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm font-extrabold text-blue-600 text-center w-full tracking-widest">
                    হিসাব সম্পূর্ণ বরাবর!
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* 4. Extra Info (Date & Customer) */}
          <View className="bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCustomerSale(!isCustomerSale)}
              className="flex-row justify-between items-center p-5 bg-slate-50/80 border-b border-slate-100"
            >
              <Text className="text-sm font-extrabold text-[#1e3a8a] flex-row items-center">
                <User color="#3b82f6" size={18} /> কাস্টমার ও অতিরিক্ত তথ্য
              </Text>
              <Switch
                value={isCustomerSale}
                onValueChange={setIsCustomerSale}
                trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                thumbColor={isCustomerSale ? "#3b82f6" : "#f8fafc"}
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
              />
            </TouchableOpacity>

            {isCustomerSale && (
              <View
                className="p-5 space-y-4 bg-white"
                onLayout={(e) => handleLayout("customer", e)}
              >
                <View>
                  <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    কাস্টমারের নাম
                  </Text>
                  <TextInput
                    placeholder="নাম লিখুন..."
                    value={customerName}
                    onChangeText={setCustomerName}
                    onFocus={() => handleFocus("customer")}
                    className="bg-slate-50 border border-slate-200 rounded-xl h-14 px-4 text-sm focus:border-[#3b82f6] focus:bg-white text-slate-800 font-bold"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    মোবাইল নম্বর
                  </Text>
                  <TextInput
                    placeholder="01XXXXXXXXX"
                    keyboardType="phone-pad"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    onFocus={() => handleFocus("customer")}
                    className="bg-slate-50 border border-slate-200 rounded-xl h-14 px-4 text-sm focus:border-[#3b82f6] focus:bg-white text-slate-800 font-bold tracking-widest"
                  />
                </View>

                {/* Date & Note Section */}
                <View className="flex-row gap-3 pt-2">
                  <View className="flex-[0.8]">
                    <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      তারিখ
                    </Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-xl h-12 px-3 text-sm font-bold text-slate-800 focus:border-[#3b82f6]"
                      value={customDate}
                      onChangeText={setCustomDate}
                    />
                  </View>
                  <View className="flex-[1.2]">
                    <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      নোট (ঐচ্ছিক)
                    </Text>
                    <TextInput
                      className="bg-slate-50 border border-slate-200 rounded-xl h-12 px-3 text-sm font-medium text-slate-800 focus:border-[#3b82f6]"
                      placeholder="যেকোনো নোট..."
                      value={note}
                      onChangeText={setNote}
                      onFocus={() => handleFocus("customer")}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 5. Fixed Confirm Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-white/95 border-t border-slate-100 shadow-[0_-20px_25px_-5px_rgba(0,0,0,0.05)] z-20">
        <TouchableOpacity
          onPress={handleConfirmAndPrint}
          disabled={isSubmitting}
          className={`h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${isSubmitting ? "bg-slate-400 shadow-none" : "bg-[#2563eb] shadow-blue-500/40 active:bg-blue-800"}`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <CheckCircle2 color="#ffffff" size={20} strokeWidth={2.5} />
              <Text className="text-white font-black text-lg tracking-wide ml-2">
                কনফার্ম ও প্রিন্ট মেমো
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
