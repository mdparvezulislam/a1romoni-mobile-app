// app/invoice/[id].tsx
import { useAuthStore } from "@/store/authStore";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Download, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

// Types
interface ISaleItem {
  name: string;
  customName?: string | null;
  price: number;
  qty: number;
  total: number;
}

interface ISale {
  _id: string;
  invoiceNo: string;
  createdAt: string | Date;
  finalAmount: number;
  subtotal: number;
  discount: number;
  paidAmount?: number;
  dueAmount?: number;
  customer?: {
    name?: string;
    phone?: string;
  };
  items: ISaleItem[];
}

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

// তারিখ ফরম্যাট হেল্পার
const formatBanglaDate = (dateString: string | Date | undefined) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function InvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.token);

  const [sale, setSale] = useState<ISale | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  // Request permissions for media library
  const [status, requestPermission] = MediaLibrary.usePermissions();

  const invoiceRef = useRef<ViewShot>(null);

  const invoiceOnlineUrl = `https://stock-a1romoni.vercel.app/invoice/${id}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoiceOnlineUrl)}`;

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const res = await fetch(
          `https://stock-a1romoni.vercel.app/api/sales/${id}`, // 👈 Updated to Local IP for API
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();

        if (data.success) {
          setSale(data.data);
        } else {
          Alert.alert("দুঃখিত", "ইনভয়েস খুঁজে পাওয়া যায়নি!");
          router.replace("/sells");
        }
      } catch (error) {
        Alert.alert("নেটওয়ার্ক এরর", "ডেটা লোড করতে সমস্যা হচ্ছে।");
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id, token]);

  // ✅ MAGIC FIX: Perfectly Capture Screenshot and Auto Download to Gallery
  const handleSaveImageToGallery = async () => {
    if (!invoiceRef.current) return;

    // Check and request gallery permissions
    if (status === null) {
      await requestPermission();
    }
    if (status?.status !== "granted") {
      Alert.alert(
        "পারমিশন প্রয়োজন",
        "ছবি সেভ করার জন্য গ্যালারি অ্যাক্সেস প্রয়োজন।",
      );
      const newStatus = await requestPermission();
      if (newStatus.status !== "granted") return;
    }

    setIsCapturing(true);

    try {
      // Small delay ensures rendering is completely finished before taking the shot
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capture the exact ViewShot area as a temporary URI
      const uri = await invoiceRef.current.capture?.();

      if (uri) {
        // Save the temporary URI directly to the device's media library (Gallery)
        await MediaLibrary.saveToLibraryAsync(uri);

        Alert.alert(
          "সফল!",
          "মেমোর ছবিটি আপনার ফোনের গ্যালারিতে সেভ করা হয়েছে। এখন Fun Print অ্যাপ থেকে ছবিটি প্রিন্ট করুন।",
          [{ text: "ওকে" }],
        );
      }
    } catch (error) {
      console.error("Screenshot Save Error:", error);
      Alert.alert("Error", "ছবি গ্যালারিতে সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsCapturing(false);
    }
  };

  if (loading || !sale) {
    return (
      <SafeAreaView className="flex-1 bg-[#f3f4f6] justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="font-bold text-blue-900 mt-4">
          রিসিপ্ট লোড হচ্ছে...
        </Text>
      </SafeAreaView>
    );
  }

  const paid =
    sale.paidAmount !== undefined ? sale.paidAmount : sale.finalAmount;
  const due = sale.dueAmount !== undefined ? sale.dueAmount : 0;
  const returnAmount = paid > sale.finalAmount ? paid - sale.finalAmount : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#f3f4f6]" edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#e0f2fe" />

      {/* Header Area */}
      <View className="bg-sky-50 flex-row items-center justify-between px-5 py-4 border-b border-sky-100 shadow-sm">
        <View>
          <Text className="text-emerald-600 font-extrabold text-[11px] uppercase tracking-wider mb-1">
            পেমেন্ট সফল
          </Text>
          <Text className="text-sky-950 font-black text-2xl">
            {toBanglaNumber(sale.finalAmount)} ৳
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.replace("/sells")}
          className="bg-white p-2.5 rounded-full shadow-sm border border-gray-200 active:bg-gray-100"
        >
          <X color="#94a3b8" size={20} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* ========================================================= */}
        {/* 📸 ViewShot Area Fix */}
        {/* ========================================================= */}
        <ViewShot
          ref={invoiceRef}
          options={{ format: "jpg", quality: 1.0 }}
          style={{ width: "100%", maxWidth: 380, alignSelf: "center" }}
        >
          {/* ✅ MAGIC FIX: Wrapped everything inside a single View with collapsable={false} and Solid White Background */}
          <View
            collapsable={false}
            style={{ backgroundColor: "#ffffff", padding: 12, width: "100%" }}
          >
            {/* Header with QR side-by-side */}
            <View className="flex-row justify-between items-start border-b-[3px] border-black pb-2 mb-2">
              <View className="flex-1 pr-2">
                <Text
                  className="text-[28px] font-black text-black mb-1 leading-tight tracking-tighter"
                  style={{ letterSpacing: -0.5 }}
                >
                  A.1 Ladies Collection
                </Text>
                <Text className="text-[20px] font-black text-black mb-1">
                  Romoni
                </Text>
                <Text className="text-[14px] font-black text-black leading-tight">
                  ঠিকানা: পুরাতন ব্রিজঘাট, মাসুম সেন্টার, New Market, কর্ণফুলী
                </Text>
                <Text className="text-[14px] font-black text-black mt-1">
                  মোবাইল: 01331304384
                </Text>
              </View>
              <View className="w-[85px] h-[85px]">
                <Image
                  source={{ uri: qrCodeImageUrl }}
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
            </View>

            {/* Invoice Meta */}
            <View className="mb-2 space-y-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-[16px] font-black text-black">
                  রিসিপ্ট: #{sale.invoiceNo}
                </Text>
                <Text className="text-[15px] font-black text-black">
                  {formatBanglaDate(sale.createdAt)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-[16px] font-black text-black truncate flex-1 pr-2">
                  নাম: {sale.customer?.name || "গেস্ট"}
                </Text>
                <Text className="text-[15px] font-black text-black">
                  {sale.customer?.phone || ""}
                </Text>
              </View>
            </View>

            {/* Items Table Header */}
            <View className="flex-row border-y-[3px] border-black py-2 mb-1.5 mt-2">
              <Text className="flex-[2] text-[16px] font-black text-black">
                বিবরণ
              </Text>
              <Text className="flex-1 text-[16px] font-black text-black text-center">
                দর
              </Text>
              <Text className="flex-1 text-[16px] font-black text-black text-center">
                পরি
              </Text>
              <Text className="flex-1 text-[16px] font-black text-black text-right">
                মোট
              </Text>
            </View>

            {/* Items List */}
            {sale.items.map((item, index) => (
              <View
                key={index}
                className="flex-row mb-1 border-b-[1.5px] border-dashed border-black pb-2 pt-1"
              >
                <Text className="flex-[2] text-[16px] font-black text-black pr-1 leading-tight">
                  {index + 1}. {item.customName || item.name}
                </Text>
                <Text className="flex-1 text-[16px] font-black text-black text-center">
                  {toBanglaNumber(item.price)}
                </Text>
                <Text className="flex-1 text-[16px] font-black text-black text-center">
                  {toBanglaNumber(item.qty)}
                </Text>
                <Text className="flex-1 text-[16px] font-black text-black text-right">
                  {toBanglaNumber(item.total)}
                </Text>
              </View>
            ))}

            {/* Totals Calculation */}
            <View className="mt-3 space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-[16px] font-black text-black">
                  সাবটোটাল:
                </Text>
                <Text className="text-[16px] font-black text-black">
                  {toBanglaNumber(sale.subtotal)} ৳
                </Text>
              </View>
              {sale.discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-[16px] font-black text-black">
                    ডিসকাউন্ট:
                  </Text>
                  <Text className="text-[16px] font-black text-black">
                    - {toBanglaNumber(sale.discount)} ৳
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between border-t-[3px] border-black pt-2 mt-2">
                <Text className="text-[20px] font-black text-black">
                  সর্বমোট বিল:
                </Text>
                <Text className="text-[20px] font-black text-black">
                  {toBanglaNumber(sale.finalAmount)} ৳
                </Text>
              </View>
              <View className="flex-row justify-between pt-1">
                <Text className="text-[16px] font-black text-black">
                  নগদ গ্রহণ:
                </Text>
                <Text className="text-[16px] font-black text-black">
                  {toBanglaNumber(paid)} ৳
                </Text>
              </View>
              {due > 0 && (
                <View className="flex-row justify-between border-t-[1.5px] border-dashed border-black pt-1.5 mt-1">
                  <Text className="text-[16px] font-black text-black">
                    বাকি (Due):
                  </Text>
                  <Text className="text-[16px] font-black text-black">
                    {toBanglaNumber(due)} ৳
                  </Text>
                </View>
              )}
              {returnAmount > 0 && (
                <View className="flex-row justify-between border-t-[1.5px] border-dashed border-black pt-1.5 mt-1">
                  <Text className="text-[16px] font-black text-black">
                    চেঞ্জ (ফেরত):
                  </Text>
                  <Text className="text-[16px] font-black text-black">
                    {toBanglaNumber(returnAmount)} ৳
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-center font-black text-[15px] text-black mt-8 mb-2">
              ধন্যবাদ! আবার আসবেন।
            </Text>
          </View>
        </ViewShot>
        {/* ========================================================= */}
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <TouchableOpacity
          onPress={handleSaveImageToGallery}
          disabled={isCapturing}
          className={`w-full flex-row items-center justify-center gap-2 py-4 rounded-xl shadow-lg mb-3 ${
            isCapturing
              ? "bg-blue-300"
              : "bg-[#2563eb] shadow-blue-500/40 active:bg-blue-600"
          }`}
        >
          {isCapturing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Download color="#ffffff" size={22} strokeWidth={2.5} />
              <Text className="text-white font-black text-lg tracking-wide">
                ছবি ডাউনলোড করুন
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/sells")}
          className="w-full bg-slate-100 border border-slate-200 py-3.5 rounded-xl items-center active:bg-slate-200"
        >
          <Text className="text-slate-700 font-bold text-base">
            নতুন বিক্রয় শুরু করুন
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
