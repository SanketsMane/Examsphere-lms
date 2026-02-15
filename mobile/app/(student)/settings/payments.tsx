import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Plus, CreditCard, Trash2, ShieldCheck, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Typography, GlassCard, Button, Modal, Input } from "../../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "../../../utils/cn";
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "../../../services/paymentService";
import { toast } from "sonner-native";

export default function PaymentsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [addCardVisible, setAddCardVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Form State
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  const { data: paymentMethodsData, isLoading, refetch } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => paymentService.getPaymentMethods(),
  });

  const paymentMethods = paymentMethodsData?.data || [];

  const handleAddCard = async () => {
    if (!cardNumber || !expiry || !cvc || !cardHolder) {
        toast.error("Please fill all fields");
        return;
    }

    setLoadingAction(true);
    try {
        // In a real app, this would tokenize via Stripe/Razorpay
        // We simulate sending tokenized data
        await paymentService.addPaymentMethod({
            type: "Visa",
            last4: cardNumber.slice(-4),
            expiryMonth: parseInt(expiry.split('/')[0]),
            expiryYear: parseInt(expiry.split('/')[1]),
            holder: cardHolder,
            isDefault: paymentMethods.length === 0
        });

        toast.success("Card added successfully");
        setAddCardVisible(false);
        // Reset form
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setCardHolder("");
        refetch();
    } catch (error) {
        toast.error("Failed to add card");
    } finally {
        setLoadingAction(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    Alert.alert(
        "Delete Card",
        "Are you sure you want to remove this payment method?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await paymentService.deletePaymentMethod(id);
                        toast.success("Card removed");
                        refetch();
                    } catch (error) {
                        toast.error("Failed to remove card");
                    }
                } 
            }
        ]
    );
  };

  const handleSetDefault = async (id: string) => {
      try {
          await paymentService.setDefaultPaymentMethod(id);
          toast.success("Default payment method updated");
          refetch();
      } catch (error) {
          toast.error("Failed to update default method");
      }
  };

  const PaymentCard = ({ method }: { method: any }) => {
    const isDefault = method.isDefault;
    
    // Random gradient for visual variety based on brand or id
    const gradients = [
        ['#4f46e5', '#ec4899'],
        ['#2563EB', '#7c3aed'],
        ['#059669', '#10b981'],
        ['#0f172a', '#334155']
    ];
    const gradient = gradients[method.last4 % gradients.length] || gradients[0];

    return (
      <View className="mb-4 relative">
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-48 rounded-3xl p-6 justify-between overflow-hidden shadow-lg"
        >
          <View className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          
          <View className="flex-row justify-between items-start">
            <CreditCard color="white" size={24} />
            {isDefault && (
                <View className="bg-white/20 px-2 py-1 rounded-full flex-row items-center">
                    <Check size={12} color="white" className="mr-1" />
                    <Typography className="text-white text-[10px] font-bold">DEFAULT</Typography>
                </View>
            )}
          </View>

          <View>
            <Typography weight="black" className="text-white text-xl tracking-[4px] opacity-90 shadow-sm">
              •••• •••• •••• {method.last4}
            </Typography>
          </View>

          <View className="flex-row justify-between items-end">
            <View>
              <Typography className="text-white/60 text-[10px] uppercase font-bold mb-1">Card Holder</Typography>
              <Typography weight="bold" className="text-white text-sm">Student Name</Typography>
            </View>
            <View>
              <Typography className="text-white/60 text-[10px] uppercase font-bold mb-1">Expires</Typography>
              <Typography weight="bold" className="text-white text-sm">
                  {method.expMonth}/{method.expYear}
              </Typography>
            </View>
          </View>
        </LinearGradient>

        <View className="flex-row justify-end mt-2 space-x-2 px-2">
            {!isDefault && (
                <TouchableOpacity 
                    onPress={() => handleSetDefault(method.id)}
                    className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"
                >
                    <Typography variant="small" className="text-slate-600 dark:text-slate-300">Set Default</Typography>
                </TouchableOpacity>
            )}
            <TouchableOpacity 
                onPress={() => handleDeleteCard(method.id)}
                className="bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full flex-row items-center"
            >
                <Trash2 size={12} color="#ef4444" className="mr-1" />
                <Typography variant="small" className="text-red-500">Remove</Typography>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#020817]">
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={{ paddingTop: insets.top }} className="flex-1">
        <View className="px-6 pt-2 pb-4 flex-row items-center justify-between z-10">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <ArrowLeft size={20} color={isDark ? "#e2e8f0" : "#334155"} />
          </TouchableOpacity>
          <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white">Payment Methods</Typography>
          <View className="w-10" />
        </View>

        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={isDark ? "#3b82f6" : "#2563EB"} />
          }
        >
          <View className="mb-6 flex-row items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
             <ShieldCheck size={24} color="#3b82f6" className="mr-3" />
             <View className="flex-1">
                <Typography weight="bold" className="text-slate-900 dark:text-white">Secure Payments</Typography>
                <Typography className="text-slate-500 text-xs mt-1">
                    Your payment information is encrypted and securely stored. We do not store your full card details.
                </Typography>
             </View>
          </View>

          {isLoading && <ActivityIndicator color="#3b82f6" className="mt-8" />}

          {!isLoading && paymentMethods.length === 0 && (
              <View className="items-center py-10 opacity-50">
                  <CreditCard size={48} color={isDark ? "#475569" : "#cbd5e1"} />
                  <Typography className="text-slate-400 mt-4">No cards added</Typography>
              </View>
          )}

          {paymentMethods.map((method: any) => (
            <PaymentCard key={method.id} method={method} />
          ))}

          <TouchableOpacity 
            onPress={() => setAddCardVisible(true)}
            className="mt-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl h-16 items-center justify-center flex-row mb-8"
          >
            <Plus size={20} color={isDark ? "#94a3b8" : "#64748b"} className="mr-2" />
            <Typography weight="bold" className="text-slate-500 dark:text-slate-400">Add New Card</Typography>
          </TouchableOpacity>

        </ScrollView>

        {/* Add Card Modal */}
        <Modal
            visible={addCardVisible}
            onClose={() => setAddCardVisible(false)}
            title="Add New Card"
        >
            <View className="space-y-4">
                <View>
                    <Typography variant="small" weight="bold" className="mb-2 text-slate-700 dark:text-slate-300">Card Number</Typography>
                    <Input 
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        keyboardType="numeric"
                        maxLength={19}
                    />
                </View>
                
                <View className="flex-row space-x-4">
                    <View className="flex-1">
                        <Typography variant="small" weight="bold" className="mb-2 text-slate-700 dark:text-slate-300">Expiry</Typography>
                        <Input 
                            placeholder="MM/YY"
                            value={expiry}
                            onChangeText={setExpiry}
                            maxLength={5}
                        />
                    </View>
                    <View className="flex-1">
                        <Typography variant="small" weight="bold" className="mb-2 text-slate-700 dark:text-slate-300">CVC</Typography>
                        <Input 
                            placeholder="123"
                            value={cvc}
                            onChangeText={setCvc}
                            keyboardType="numeric"
                            maxLength={3}
                            secureTextEntry
                        />
                    </View>
                </View>

                <View>
                    <Typography variant="small" weight="bold" className="mb-2 text-slate-700 dark:text-slate-300">Card Holder Name</Typography>
                    <Input 
                        placeholder="John Doe"
                        value={cardHolder}
                        onChangeText={setCardHolder}
                        autoCapitalize="words"
                    />
                </View>

                <Button 
                    variant="primary" 
                    size="lg" 
                    className="mt-4 w-full"
                    onPress={handleAddCard}
                    loading={loadingAction}
                >
                    Save Card
                </Button>
            </View>
        </Modal>

      </View>
    </View>
  );
}
