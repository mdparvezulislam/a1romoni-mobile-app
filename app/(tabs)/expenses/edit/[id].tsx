// app/expenses/edit/[id].tsx
import { useAuthStore } from "@/store/authStore"; // 👈 আপনার নির্দেশিত সঠিক পাথ
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlignLeft,
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  Edit3,
  Layers,
  Save,
  User,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView, // 👈 কীবোর্ড ইভেন্টের জন্য
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

export default function EditExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.token);

  // ✅ ScrollView এবং Keyboard এর জন্য References ও States
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputPositions, setInputPositions] = useState<{
    [key: string]: number;
  }>({});
  const [keyboardPadding, setKeyboardPadding] = useState(130); // ডিফল্ট বটম প্যাডিং

  // Form States
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseByText, setExpenseByText] = useState("");
  const [description, setDescription] = useState("");

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ কীবোর্ড ওপেন/ক্লোজ হওয়ার লাইভ ইভেন্ট লিসেনার
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        // কীবোর্ডের উচ্চতার সাথে অতিরিক্ত ১০০ পিক্সেল যোগ করে প্যাডিং বাড়ানো
        setKeyboardPadding(e.endCoordinates.height + 150);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        // কীবোর্ড নেমে গেলে আবার আগের অবস্থায় ফিরে আসবে
        setKeyboardPadding(130);
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ✅ পেজ লোড হলে নির্দিষ্ট খরচের ডেটা নিয়ে আসা
  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (!id) return;
      try {
        const response = await fetch(
          `https://stock-a1romoni.vercel.app/api/expenses/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        if (response.ok && data.success) {
          const expense = data.data;
          setCategory(
            expense.category ||
              expense.categoryName ||
              expense.category?.name ||
              EXPENSE_CATEGORIES[0],
          );
          setAmount(expense.amount ? expense.amount.toString() : "");

          if (expense.expenseDate || expense.date) {
            const rawDate = new Date(expense.expenseDate || expense.date);
            setExpenseDate(
              `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, "0")}-${String(rawDate.getDate()).padStart(2, "0")}`,
            );
          }

          let desc = expense.description || "";
          const match = desc.match(/\[কার জন্য:\s*(.*?)\]/);
          if (match && match[1]) {
            setExpenseByText(match[1]);
            desc = desc.replace(/\[কার জন্য:\s*.*?\]\s*/, "");
          }
          setDescription(desc);
        } else {
          Alert.alert("সমস্যা", "খরচের তথ্য খুঁজে পাওয়া যায়নি!");
          router.back();
        }
      } catch (error) {
        Alert.alert("নেটওয়ার্ক এরর", "ডেটা লোড করতে সমস্যা হচ্ছে।");
      } finally {
        setFetching(false);
      }
    };
    fetchExpenseDetails();
  }, [id, token]);

  // ✅ আপডেট করা ডেটা সার্ভারে সেভ করা
  const handleUpdateExpense = async () => {
    if (!category.trim())
      return Alert.alert("ভুল", "খরচের খাত নির্বাচন করা আবশ্যক!");
    if (!description.trim())
      return Alert.alert("ভুল", "খরচের বিবরণ দেওয়া আবশ্যক!");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return Alert.alert("ভুল", "সঠিক টাকার পরিমাণ দিন!");

    setSaving(true);
    try {
      const finalDescription = expenseByText.trim()
        ? `[কার জন্য: ${expenseByText}] ${description}`
        : description;
      const formattedDate = new Date(expenseDate).toISOString();
      const payload = {
        category,
        amount: Number(amount),
        expenseDate: formattedDate,
        description: finalDescription,
      };

      const response = await fetch(
        `https://stock-a1romoni.vercel.app/api/expenses/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Server Crash!");
      }

      if (response.ok && data.success) {
        Alert.alert("সাকসেস!", "খরচের তথ্য সফলভাবে আপডেট করা হয়েছে।", [
          { text: "ওকে", onPress: () => router.replace("/expenses") },
        ]);
      } else {
        Alert.alert("সমস্যা", data.error || "আপডেট করতে সমস্যা হয়েছে!");
      }
    } catch (error: any) {
      Alert.alert("নেটওয়ার্ক বা সার্ভার এরর", error.message);
    } finally {
      setSaving(false);
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
          y: inputPositions[fieldId] - 20, // ফিল্ডটিকে স্ক্রিনের একদম উপরে নিয়ে আসবে
          animated: true,
        });
      }
    }, 250); // কীবোর্ড ওপেন হওয়ার জন্য হালকা Delay
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
            className="bg-white/10 p-2.5 rounded-full mr-4 border border-white/20 active:bg-white/20"
          >
            <ArrowLeft color="#fff" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="bg-amber-300/20 p-2 rounded-xl mr-2.5 border border-amber-300/30">
              <Edit3 color="#fde047" size={24} strokeWidth={2.5} />
            </View>
            <Text className="text-2xl font-black text-white tracking-wide">
              খরচ এডিট করুন
            </Text>
          </View>
        </View>
        <Text className="text-sky-100 font-bold mt-1 text-sm ml-[62px] z-10">
          পূর্বের খরচের হিসাবে পরিবর্তন আনুন
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-slate-50 rounded-t-3xl -mt-10 overflow-hidden shadow-2xl"
      >
        {fetching ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-slate-500 font-bold mt-4 tracking-wider">
              তথ্য লোড হচ্ছে...
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5 pt-8"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: keyboardPadding }} // ✅ ডাইনামিক প্যাডিং (ম্যাজিক ট্রিক)
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
              <View
                className="mb-5"
                onLayout={(e) => handleLayout("amount", e)}
              >
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
                    onFocus={() => handleFocus("amount")} // ✅ Focus Event
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
                    onFocus={() => handleFocus("date")} // ✅ Focus Event
                    className="bg-sky-50/50 border border-sky-100 rounded-2xl h-14 px-4 text-slate-800 font-bold text-sm focus:border-sky-400 focus:bg-white transition-all"
                  />
                  <View className="absolute right-4 bg-white p-1.5 rounded-lg shadow-sm z-10">
                    <CalendarDays color="#0ea5e9" size={16} />
                  </View>
                </View>
              </View>

              {/* For Whom */}
              <View
                className="mb-5"
                onLayout={(e) => handleLayout("forWhom", e)}
              >
                <Text className="text-sm font-extrabold text-slate-700 mb-2 flex-row items-center tracking-wide">
                  <User color="#0ea5e9" size={16} /> কার জন্য খরচ (ঐচ্ছিক)
                </Text>
                <TextInput
                  value={expenseByText}
                  onChangeText={setExpenseByText}
                  placeholder="-- নাম লিখুন --"
                  placeholderTextColor="#94a3b8"
                  onFocus={() => handleFocus("forWhom")} // ✅ Focus Event
                  className="bg-sky-50/50 border border-sky-100 rounded-2xl h-14 px-4 text-slate-800 font-bold text-sm focus:border-sky-400 focus:bg-white transition-all"
                />
              </View>

              {/* Description */}
              <View
                className="mb-2"
                onLayout={(e) => handleLayout("description", e)}
              >
                <Text className="text-sm font-extrabold text-slate-700 mb-2 flex-row items-center tracking-wide">
                  <AlignLeft color="#0ea5e9" size={16} /> বিস্তারিত বিবরণ বা
                  কারণ
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="যেমন: আজকের সকালের নাস্তা বিল..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => handleFocus("description")} // ✅ Focus Event
                  className="bg-sky-50/50 border border-sky-100 rounded-2xl min-h-[120px] p-5 text-slate-800 font-medium text-sm focus:border-sky-400 focus:bg-white transition-all"
                />
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-white/95 border-t border-slate-100 shadow-[0_-20px_25px_-5px_rgba(0,0,0,0.05)]">
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={fetching || saving}
            className="flex-[0.8] items-center justify-center bg-slate-50 border border-slate-200 py-4 rounded-xl shadow-sm active:bg-slate-100"
          >
            <Text className="text-slate-600 font-extrabold text-sm">
              বাতিল করুন
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleUpdateExpense}
            disabled={fetching || saving}
            className="flex-[1.2] flex-row items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-orange-500 py-4 rounded-xl shadow-lg shadow-orange-500/40 active:bg-orange-600"
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Save color="#ffffff" size={18} strokeWidth={2.5} />
                <Text className="text-white font-extrabold text-sm tracking-wide">
                  আপডেট করুন
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Selection Bottom Sheet Modal */}
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
