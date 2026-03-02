// app/checkout.tsx
import { useAuthStore } from "@/store/authStore"; // 👈 অথ স্টোর (API কলের জন্য টোকেন লাগবে)
import { useCartStore } from "@/store/cartStore"; // 👈 আপনার সঠিক স্টোর পাথ
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
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

  const { cart, finalAmount, subtotal, discount, clearCart } = useCartStore();
  const grandTotal = finalAmount > 0 ? finalAmount : subtotal;

  // ✅ ScrollView এবং Keyboard এর জন্য References ও States
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputPositions, setInputPositions] = useState<{
    [key: string]: number;
  }>({});
  const [keyboardPadding, setKeyboardPadding] = useState(130);

  // States
  const [paidAmount, setPaidAmount] = useState(grandTotal.toString()); // অটোমেটিক ফুল পেমেন্ট বসে যাবে
  const [customDate, setCustomDate] = useState(getTodayDate());
  const [note, setNote] = useState("");
  const [isCustomerSale, setIsCustomerSale] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false); // API লোডিং স্টেট

  // Calculations
  const receivedAmount = Number(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - receivedAmount);
  const returnAmount =
    receivedAmount > grandTotal ? receivedAmount - grandTotal : 0;

  // ✅ কীবোর্ড ওপেন/ক্লোজ হওয়ার লাইভ ইভেন্ট লিসেনার
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

  // ✅ ডেটাবেসে সেল সেভ করা এবং ইনভয়েস পেজে রিডাইরেক্ট করা
  const handleConfirmAndPrint = async () => {
    if (cart.length === 0) {
      Alert.alert("ভুল", "আপনার কার্ট খালি!");
      return;
    }

    setIsSubmitting(true);

    try {
      // API তে পাঠানোর জন্য ডেটা প্রস্তুত করা (আপনার Next.js মডেল অনুযায়ী)
      const payload = {
        items: cart.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          customName: item.customName || null,
          price: item.customPrice ?? item.product.salePrice,
          qty: item.qty,
          total: (item.customPrice ?? item.product.salePrice) * item.qty,
        })),
        subtotal: subtotal,
        discount: discount,
        finalAmount: grandTotal,
        paidAmount: receivedAmount > grandTotal ? grandTotal : receivedAmount, // অতিরিক্ত টাকা (চেঞ্জ) বাদ দিয়ে আসল জমা সেভ হবে
        dueAmount: dueAmount,
        note: note,
        customer: isCustomerSale
          ? { name: customerName, phone: customerPhone }
          : null,
        // যদি কাস্টম ডেট থাকে, তবে সেটি কনভার্ট করে পাঠাতে পারেন
      };

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
        Alert.alert(
          "সফল!",
          "বিক্রি সম্পন্ন হয়েছে। মেমো প্রিন্ট করা হচ্ছে...",
          [
            {
              text: "ওকে",
              onPress: () => {
                clearCart(); // কার্ট খালি করে দেওয়া
                // ✅ ডেটাবেস থেকে পাওয়া নতুন ইনভয়েস ID দিয়ে প্রিন্ট পেজে যাওয়া
                router.replace(`/invoice/${data.data._id}`);
              },
            },
          ],
        );
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

  // ✅ প্রতিটি ফিল্ডের Y পজিশন সংরক্ষণ করা
  const handleLayout = (fieldId: string, event: any) => {
    const layout = event.nativeEvent.layout;
    setInputPositions((prev) => ({ ...prev, [fieldId]: layout.y }));
  };

  // ✅ ইনপুটে টাচ করলেই পারফেক্টভাবে কীবোর্ডের উপরে নিয়ে আসবে
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
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* 1. Header Area */}
      <View className="bg-[#1e3a8a] px-5 pt-4 pb-20 z-10 border-b-[5px] border-[#f59e0b] shadow-xl relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-20" />
        <View className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-400 rounded-full opacity-20" />

        <View className="flex-row items-center mb-2 z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isSubmitting}
            className="bg-white/10 p-2.5 rounded-full mr-4 border border-white/20 active:bg-white/20"
          >
            <ArrowLeft color="#fff" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="bg-amber-300/20 p-2 rounded-xl mr-2.5 border border-amber-300/30">
              <Wallet color="#facc15" size={24} strokeWidth={2.5} />
            </View>
            <Text className="text-2xl font-black text-white tracking-wide">
              পেমেন্ট ও চেকআউট
            </Text>
          </View>
        </View>
        <Text className="text-blue-200 font-bold mt-1 text-sm ml-[62px] z-10">
          কাস্টমারের বিল সংগ্রহ করুন
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-slate-50 rounded-t-3xl -mt-10 overflow-hidden shadow-2xl"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: keyboardPadding }}
        >
          {/* 2. Grand Total Card */}
          <View className="bg-[#f59e0b] rounded-2xl p-6 mb-5 shadow-md flex-row justify-between items-center overflow-hidden relative">
            <View className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <View className="z-10">
              <Text className="text-amber-50 font-bold text-xs uppercase tracking-wider mb-1">
                সর্বমোট বিল
              </Text>
              <Text className="text-4xl font-black text-white tracking-tight drop-shadow-sm">
                {toBanglaNumber(grandTotal)} <Text className="text-xl">৳</Text>
              </Text>
            </View>
            <View className="bg-white/20 p-3 rounded-xl border border-white/30 z-10">
              <Wallet color="#ffffff" size={28} strokeWidth={2} />
            </View>
          </View>

          {/* 3. Payment Form */}
          <View className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5 mb-5">
            {/* Cash Received */}
            <View onLayout={(e) => handleLayout("payment", e)}>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-extrabold text-[#1e3a8a] flex-row items-center">
                  <Banknote color="#3b82f6" size={16} /> কাস্টমার কত টাকা
                  দিয়েছে?
                </Text>
                {/* Full Payment Shortcut */}
                <TouchableOpacity
                  onPress={() => setPaidAmount(grandTotal.toString())}
                  className="bg-blue-50 border border-blue-200 px-2 py-1 rounded-md active:bg-blue-100"
                >
                  <Text className="text-blue-600 font-bold text-[10px] uppercase">
                    Full Pay
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="relative justify-center mb-3">
                <Text className="absolute left-4 font-bold text-slate-400 text-lg z-10">
                  ৳
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl w-full h-14 pl-10 pr-4 text-xl font-black text-slate-800 focus:border-[#3b82f6] focus:bg-white transition-colors"
                  placeholder="0"
                  keyboardType="numeric"
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  onFocus={() => handleFocus("payment")}
                  selectTextOnFocus
                />
              </View>

              {/* Dynamic Due / Change Box */}
              <View className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex-row justify-between items-center">
                {dueAmount > 0 ? (
                  <>
                    <Text className="text-xs font-bold text-rose-600 flex-row items-center">
                      <Clock size={14} color="#e11d48" /> বাকি (Due):
                    </Text>
                    <Text className="text-lg font-black text-rose-600">
                      ৳ {toBanglaNumber(dueAmount)}
                    </Text>
                  </>
                ) : returnAmount > 0 ? (
                  <>
                    <Text className="text-xs font-bold text-emerald-600 flex-row items-center">
                      <CheckCircle2 size={14} color="#059669" /> চেঞ্জ (ফেরত):
                    </Text>
                    <Text className="text-lg font-black text-emerald-600">
                      ৳ {toBanglaNumber(returnAmount)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-xs font-bold text-[#3b82f6] text-center w-full">
                    হিসাব বরাবর!
                  </Text>
                )}
              </View>
            </View>

            {/* Date & Note */}
            <View className="flex-row gap-3 pt-2 border-t border-slate-100">
              <View
                className="flex-[0.8]"
                onLayout={(e) => handleLayout("date", e)}
              >
                <Text className="text-xs font-bold text-[#1e3a8a] mb-1.5 flex-row items-center">
                  <Calendar color="#3b82f6" size={14} /> তারিখ
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl h-12 px-3 text-sm font-bold text-slate-800 focus:border-[#3b82f6] focus:bg-white"
                  placeholder="dd/mm/yyyy"
                  value={customDate}
                  onChangeText={setCustomDate}
                  onFocus={() => handleFocus("date")}
                />
              </View>
              <View
                className="flex-[1.2]"
                onLayout={(e) => handleLayout("note", e)}
              >
                <Text className="text-xs font-bold text-[#1e3a8a] mb-1.5 flex-row items-center">
                  <FileText color="#3b82f6" size={14} /> মন্তব্য (ঐচ্ছিক)
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl h-12 px-3 text-sm font-medium text-slate-800 focus:border-[#3b82f6] focus:bg-white"
                  placeholder="যেকোনো নোট..."
                  value={note}
                  onChangeText={setNote}
                  onFocus={() => handleFocus("note")}
                />
              </View>
            </View>
          </View>

          {/* 4. Customer Info Toggle Card */}
          <View className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCustomerSale(!isCustomerSale)}
              className="flex-row justify-between items-center p-4 bg-slate-50/50"
            >
              <Text className="text-sm font-extrabold text-[#1e3a8a] flex-row items-center">
                <User color="#3b82f6" size={16} /> কাস্টমার তথ্য
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
                className="p-4 border-t border-slate-100 space-y-4 bg-white"
                onLayout={(e) => handleLayout("customer", e)}
              >
                <View>
                  <Text className="text-xs font-bold text-slate-500 mb-1.5">
                    নাম
                  </Text>
                  <TextInput
                    placeholder="কাস্টমারের নাম লিখুন"
                    value={customerName}
                    onChangeText={setCustomerName}
                    onFocus={() => handleFocus("customer")}
                    className="bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-sm focus:border-[#3b82f6] focus:bg-white text-slate-800 font-bold"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-500 mb-1.5">
                    মোবাইল নম্বর
                  </Text>
                  <TextInput
                    placeholder="01XXXXXXXXX"
                    keyboardType="phone-pad"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    onFocus={() => handleFocus("customer")}
                    className="bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-sm focus:border-[#3b82f6] focus:bg-white text-slate-800 font-bold tracking-widest"
                  />
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
          className={`h-14 rounded-xl flex-row items-center justify-center shadow-lg ${isSubmitting ? "bg-slate-400 shadow-none" : "bg-gradient-to-r from-blue-600 to-blue-700 bg-[#2563eb] shadow-blue-500/40 active:bg-blue-800"}`}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white font-black text-lg tracking-wide">
              কনফার্ম ও প্রিন্ট মেমো
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
