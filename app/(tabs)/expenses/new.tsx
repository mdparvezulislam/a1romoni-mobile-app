// app/expenses/new.tsx
import { useAuthStore } from "@/store/authStore"; // 👈 সঠিক পাথ দিন
import { useRouter } from "expo-router";
import {
  AlignLeft,
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  Layers,
  Receipt,
  Save,
  User,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EXPENSE_CATEGORIES = [
  "নাস্তা বিল",
  "যাতায়াত ও পরিবহন",
  "স্টাফ বেতন",
  "দোকান ভাড়া",
  "বিদ্যুৎ ও ইন্টারনেট বিল",
  "মার্কেটিং ও বিজ্ঞাপন",
  "প্যাকেজিং খরচ",
  "অফিস সাপ্লাইজ",
  "অন্যান্য",
];

// আজকের তারিখ (YYYY-MM-DD)
const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function NewExpenseScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  // References & States
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputPositions, setInputPositions] = useState<{
    [key: string]: number;
  }>({});
  const [keyboardPadding, setKeyboardPadding] = useState(130);

  // Form States
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayDate());
  const [expenseByText, setExpenseByText] = useState(""); // ঐচ্ছিক (কার জন্য)
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Keyboard Event Listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardPadding(e.endCoordinates.height + 150),
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

  // ✅ ডেটা সেভ করার ফাংশন (API এর সাথে সিঙ্ক করা)
  const handleSaveExpense = async () => {
    // 1. Validation
    if (!category.trim())
      return Alert.alert("ভুল", "খরচের খাত নির্বাচন করা আবশ্যক!");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return Alert.alert("ভুল", "সঠিক টাকার পরিমাণ দিন!");
    if (!description.trim())
      return Alert.alert("ভুল", "খরচের বিবরণ বা কারণ দেওয়া আবশ্যক!");

    setLoading(true);

    try {
      // 2. Prepare Payload
      // 'কার জন্য খরচ' যদি লেখা থাকে, তাহলে সেটি বিবরণের সাথেই জুড়ে দেওয়া হচ্ছে
      // (কারণ আপনার মডেলে expenseBy একটি ObjectId, String নয়। তাই String টেক্সটটি বিবরণে রাখা নিরাপদ)
      const finalDescription = expenseByText.trim()
        ? `[কার জন্য: ${expenseByText}] ${description}`
        : description;

      const formattedDate = new Date(expenseDate).toISOString();

      const payload = {
        category: category,
        amount: Number(amount),
        expenseDate: formattedDate,
        description: finalDescription,
      };

      // 3. API Call
      const response = await fetch(
        "https://stock-a1romoni.vercel.app/api/expenses",
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

      // 4. Handle Response
      if (response.ok && data.success) {
        Alert.alert("সাকসেস!", "নতুন খরচ সফলভাবে এন্ট্রি করা হয়েছে।", [
          { text: "ওকে", onPress: () => router.replace("/expenses") },
        ]);
      } else {
        Alert.alert("সমস্যা", data.error || "খরচ সেভ করতে সমস্যা হয়েছে!");
      }
    } catch (error: any) {
      console.error("Save Expense Error:", error);
      Alert.alert(
        "সার্ভার এরর",
        "নেটওয়ার্ক বা সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ অটো স্ক্রল (কীবোর্ডের জন্য)
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
    }, 250);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0284c7]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0369a1" />

      {/* Header Area */}
      <View className="bg-[#0284c7] px-5 pt-5 pb-20 z-10 border-b-[5px] border-orange-500 shadow-xl relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-sky-400 rounded-full opacity-20" />
        <View className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-400 rounded-full opacity-20" />
        <View className="flex-row items-center mb-2 z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            className="bg-white/10 p-2.5 rounded-full mr-4 border border-white/20 active:bg-white/20"
          >
            <ArrowLeft color="#fff" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="bg-amber-300/20 p-2 rounded-xl mr-2.5 border border-amber-300/30">
              <Receipt color="#fde047" size={24} strokeWidth={2.5} />
            </View>
            <Text className="text-2xl font-black text-white tracking-wide">
              নতুন খরচ এন্ট্রি
            </Text>
          </View>
        </View>
        <Text className="text-sky-100 font-bold mt-1 text-sm ml-[62px] z-10">
          দোকান বা ব্যবসায়ের দৈনন্দিন খরচের হিসাব রাখুন
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-slate-50 rounded-t-3xl -mt-10 overflow-hidden shadow-2xl"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-5 pt-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: keyboardPadding }}
        >
          <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
            {/* Category */}
            <View className="mb-5">
              <Text className="text-sm font-extrabold text-slate-700 mb-2 flex-row items-center tracking-wide">
                <Layers color="#0ea5e9" size={16} /> খরচের খাত (Category)
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(true)}
                className="bg-sky-50/50 border border-sky-100 rounded-2xl h-14 px-4 flex-row items-center justify-between active:bg-sky-100 transition-all"
              >
                <Text className="text-slate-800 font-bold text-sm">
                  {category}
                </Text>
                <View className="bg-white p-1 rounded-full shadow-sm">
                  <ChevronDown color="#94a3b8" size={18} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View className="mb-5" onLayout={(e) => handleLayout("amount", e)}>
              <Text className="text-sm font-extrabold text-slate-700 mb-2 flex-row items-center tracking-wide">
                <Banknote color="#f97316" size={16} /> টাকার পরিমাণ (৳)
              </Text>
              <View className="relative justify-center">
                <Text className="absolute left-5 font-black text-slate-400 text-lg z-10">
                  ৳
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  onFocus={() => handleFocus("amount")}
                  className="bg-sky-50/50 border border-sky-100 rounded-2xl h-14 pl-11 pr-4 text-slate-800 font-black text-lg focus:border-orange-400 focus:bg-white transition-all"
                />
              </View>
            </View>

            {/* Date */}
            <View className="mb-5" onLayout={(e) => handleLayout("date", e)}>
              <Text className="text-sm font-extrabold text-slate-700 mb-2 flex-row items-center tracking-wide">
                <CalendarDays color="#0ea5e9" size={16} /> খরচের তারিখ
              </Text>
              <View className="relative justify-center">
                <TextInput
                  value={expenseDate}
                  onChangeText={setExpenseDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  onFocus={() => handleFocus("date")}
                  className="bg-sky-50/50 border border-sky-100 rounded-2xl h-14 px-4 text-slate-800 font-bold text-sm focus:border-sky-400 focus:bg-white transition-all"
                />
                <View className="absolute right-4 bg-white p-1.5 rounded-lg shadow-sm z-10">
                  <CalendarDays color="#0ea5e9" size={16} />
                </View>
              </View>
            </View>

            {/* For Whom */}
            <View className="mb-5" onLayout={(e) => handleLayout("forWhom", e)}>
              <Text className="text-sm font-extrabold text-slate-700 mb-2 flex-row items-center tracking-wide">
                <User color="#0ea5e9" size={16} /> কার জন্য খরচ (ঐচ্ছিক)
              </Text>
              <TextInput
                value={expenseByText}
                onChangeText={setExpenseByText}
                placeholder="-- নাম লিখুন --"
                placeholderTextColor="#94a3b8"
                onFocus={() => handleFocus("forWhom")}
                className="bg-sky-50/50 border border-sky-100 rounded-2xl h-14 px-4 text-slate-800 font-bold text-sm focus:border-sky-400 focus:bg-white transition-all"
              />
            </View>

            {/* Description */}
            <View className="mb-2" onLayout={(e) => handleLayout("desc", e)}>
              <Text className="text-sm font-extrabold text-slate-700 mb-2 flex-row items-center tracking-wide">
                <AlignLeft color="#0ea5e9" size={16} /> বিস্তারিত বিবরণ বা কারণ
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="যেমন: আজকের সকালের নাস্তা বিল..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => handleFocus("desc")}
                className="bg-sky-50/50 border border-sky-100 rounded-2xl min-h-[120px] p-5 text-slate-800 font-medium text-sm focus:border-sky-400 focus:bg-white transition-all"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-white/95 border-t border-slate-100 shadow-[0_-20px_25px_-5px_rgba(0,0,0,0.05)] z-20">
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            className="flex-[0.8] items-center justify-center bg-slate-50 border border-slate-200 py-4 rounded-xl shadow-sm active:bg-slate-100"
          >
            <Text className="text-slate-600 font-extrabold text-sm">
              বাতিল করুন
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveExpense}
            disabled={loading}
            className={`flex-[1.2] flex-row items-center justify-center gap-2 rounded-xl shadow-lg ${loading ? "bg-slate-400" : "bg-gradient-to-r from-orange-500 to-orange-600 bg-orange-500 shadow-orange-500/40 active:bg-orange-600"}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Save color="#ffffff" size={18} strokeWidth={2.5} />
                <Text className="text-white font-extrabold text-sm tracking-wide">
                  হিসাব সেভ করুন
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Selection Modal */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View className="flex-1 justify-end bg-slate-900/40">
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowCategoryModal(false)}
          />
          <View className="bg-white rounded-t-3xl p-6 pb-12 shadow-2xl max-h-[75%]">
            <View className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
            <Text className="text-center font-black text-slate-800 text-xl mb-6">
              খরচের খাত নির্বাচন করুন
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {EXPENSE_CATEGORIES.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                  className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${category === cat ? "bg-sky-50 border-sky-400" : "bg-slate-50 border-slate-100"}`}
                >
                  <Text
                    className={`font-bold text-base ${category === cat ? "text-sky-700" : "text-slate-600"}`}
                  >
                    {cat}
                  </Text>
                  {category === cat && (
                    <View className="bg-sky-100 p-1 rounded-full">
                      <Check color="#0284c7" size={18} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
