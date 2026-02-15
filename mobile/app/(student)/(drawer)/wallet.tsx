import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { 
  Menu, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  History,
  Scan,
  Send,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react-native";
import { useRouter, useNavigation } from "expo-router";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useColorScheme } from "nativewind";
import { walletService } from "../../../services/walletService";
import { Typography, GlassCard, Modal, Button } from "../../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "../../../utils/cn";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { toast } from "sonner-native";

/**
 * Premium Wallet Screen - Real Data Only
 * Sanket
 */
export default function WalletScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [topUpVisible, setTopUpVisible] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: () => walletService.getBalance(),
  });

  const { data: transactionsData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["walletTransactions"],
    queryFn: () => walletService.getTransactions(),
  });

  const transactions = transactionsData?.data || [];
  const balance = balanceData?.data?.balance || 0;
  const isLoading = balanceLoading || historyLoading;

  const onRefresh = () => {
    refetchBalance();
    refetchHistory();
  };

  const handleTopUp = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoadingAction(true);
    try {
      // In a real app, we would select a card first. 
      // For now, we simulate a recharge with a default payment ID.
      await walletService.recharge(Number(amount), "default_payment_id");
      toast.success("Wallet recharged successfully!");
      setTopUpVisible(false);
      setAmount("");
      onRefresh();
    } catch (error) {
      toast.error("Failed to recharge wallet");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (Number(amount) > balance) {
        toast.error("Insufficient balance");
        return;
    }

    setLoadingAction(true);
    try {
      await walletService.withdraw(Number(amount));
      toast.success("Withdrawal request submitted!");
      setWithdrawVisible(false);
      setAmount("");
      onRefresh();
    } catch (error) {
      toast.error("Failed to withdraw funds");
    } finally {
      setLoadingAction(false);
    }
  };


  // Calculate Real Analytics from Transactions
  const analytics = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach((tx: any) => {
      const amount = Math.abs(tx.amount || 0);
      if (tx.amount > 0 || tx.type === 'credit' || tx.type === 'REFUND' || tx.type === 'ADMIN_CREDIT') {
        income += amount;
      } else {
        expense += amount;
      }
    });

    return { income, expense };
  }, [transactions]);

  // Group Transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    transactions.forEach((tx: any) => {
      const date = tx.createdAt ? parseISO(tx.createdAt) : new Date();
      let header = format(date, "MMMM d, yyyy");
      
      if (isToday(date)) header = "Today";
      else if (isYesterday(date)) header = "Yesterday";

      if (!groups[header]) groups[header] = [];
      groups[header].push(tx);
    });

    return groups;
  }, [transactions]);

  const QuickAction = ({ icon: Icon, label, color, onPress }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      className="items-center justify-center space-y-2"
    >
      <View className={cn("w-14 h-14 rounded-full items-center justify-center shadow-sm", isDark ? "bg-slate-800" : "bg-white")}>
        <Icon size={24} color={color} />
      </View>
      <Typography variant="small" weight="bold" className="text-slate-600 dark:text-slate-400">{label}</Typography>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#020817]">
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={{ paddingTop: insets.top }} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between z-10">
           <TouchableOpacity 
             onPress={() => navigation.openDrawer()}
             className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
           >
             <Menu size={20} color={isDark ? "#e2e8f0" : "#334155"} />
           </TouchableOpacity>
           <Typography variant="h3" weight="black" className="text-slate-900 dark:text-white">Wallet</Typography>
           <TouchableOpacity className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
              <Scan size={20} color={isDark ? "#94a3b8" : "#64748b"} />
           </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={isDark ? "#3b82f6" : "#2563EB"} />
          }
        >
          {/* Balance Card */}
          <View className="mt-6 px-6 relative">
             <LinearGradient
                colors={isDark ? ['#4f46e5', '#ec4899'] : ['#2563EB', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-56 rounded-[32px] p-6 justify-between overflow-hidden shadow-2xl shadow-indigo-500/40"
             >
                <View className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-24 blur-3xl opacity-50" />
                <View className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full -ml-16 -mb-16 blur-2xl" />

                <View className="flex-row justify-between items-center">
                   <View className="flex-row items-center bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                      <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                      <Typography className="text-white text-xs font-bold uppercase tracking-wider">Active</Typography>
                   </View>
                   <CreditCard size={20} color="white" className="opacity-80" />
                </View>

                <View>
                   <Typography className="text-white/70 font-medium mb-1">Total Balance</Typography>
                   <View className="flex-row items-baseline">
                      <Typography weight="bold" className="text-white text-3xl mr-1">$</Typography>
                      <Typography weight="black" className="text-white text-5xl tracking-tighter shadow-sm">
                         {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                   </View>
                </View>

                <View className="flex-row justify-between items-end">
                   <View>
                      <Typography className="text-white/60 text-[10px] uppercase font-bold mb-1">Account Holder</Typography>
                      <Typography weight="bold" className="text-white text-lg">Student</Typography>
                   </View>
                </View>
             </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-between px-8 mt-8 mb-8">
             <QuickAction icon={Plus} label="Top Up" color="#3b82f6" onPress={() => setTopUpVisible(true)} />
             <QuickAction icon={ArrowUpRight} label="Withdraw" color="#8b5cf6" onPress={() => setWithdrawVisible(true)} />
             <QuickAction icon={Send} label="Transfer" color="#10b981" onPress={() => toast.info("Coming soon")} />
             <QuickAction icon={MoreHorizontal} label="More" color="#94a3b8" onPress={() => {}} />
          </View>

          {/* Real Analytics (No Fake Charts) */}
          <View className="px-6 mb-8 flex-row gap-4">
             <GlassCard className="flex-1 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                   <Typography className="text-slate-500 text-xs text-center">Total Income</Typography>
                   <TrendingUp size={16} color="#10b981" />
                </View>
                <Typography weight="bold" className="text-slate-900 dark:text-white text-lg">
                  ${analytics.income.toFixed(2)}
                </Typography>
             </GlassCard>
             <GlassCard className="flex-1 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                   <Typography className="text-slate-500 text-xs text-center">Total Spent</Typography>
                   <TrendingDown size={16} color="#ef4444" />
                </View>
                <Typography weight="bold" className="text-slate-900 dark:text-white text-lg">
                  ${analytics.expense.toFixed(2)}
                </Typography>
             </GlassCard>
          </View>

          {/* Real Transactions List */}
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] pt-8 px-6 pb-20 border-t border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
             <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white mb-6">Transactions</Typography>

             {isLoading && <ActivityIndicator color="#3b82f6" />}

             {!isLoading && transactions.length === 0 && (
                <View className="items-center py-20">
                   <History size={48} color={isDark ? "#475569" : "#cbd5e1"} />
                   <Typography className="text-slate-400 mt-4 text-center">No transactions yet</Typography>
                </View>
             )}

             {Object.entries(groupedTransactions).map(([date, txs]) => (
                <View key={date} className="mb-6">
                   <Typography weight="bold" className="text-slate-400 text-xs uppercase tracking-widest mb-4">{date}</Typography>
                   {txs.map((tx: any) => {
                     const isCredit = tx.amount > 0 || tx.type === 'credit' || tx.type === 'REFUND';
                     return (
                       <View key={tx.id} className="mb-6 flex-row justify-between items-center">
                          <View className="flex-row items-center flex-1">
                             <View className={cn(
                                "w-12 h-12 rounded-2xl items-center justify-center mr-4",
                                isCredit ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
                             )}>
                                {isCredit ? (
                                   <ArrowDownLeft size={20} color={isDark ? "#34d399" : "#059669"} />
                                ) : (
                                   <ArrowUpRight size={20} color={isDark ? "#ef4444" : "#dc2626"} />
                                )}
                             </View>
                             <View className="flex-1 mr-2">
                                <Typography weight="bold" className="text-slate-900 dark:text-white text-base" numberOfLines={1}>
                                  {tx.description || "Transaction"}
                                </Typography>
                                <Typography className="text-slate-500 text-xs">
                                  {format(parseISO(tx.createdAt), "h:mm a")} • {tx.type?.replace('_', ' ')}
                                </Typography>
                             </View>
                          </View>
                          <Typography 
                            weight="black" 
                            className={cn(
                              "text-base", 
                              isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                            )}
                          >
                            {isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                          </Typography>
                       </View>
                     );
                   })}
                </View>
             ))}
          </View>
        </ScrollView>

        {/* Top Up Modal */}
        <Modal 
          visible={topUpVisible} 
          onClose={() => setTopUpVisible(false)}
          title="Top Up Wallet"
        >
          <View>
            <Typography className="text-slate-500 mb-4">Enter amount to add to your wallet</Typography>
            <View className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex-row items-center mb-6">
               <DollarSign size={20} color={isDark ? "#94a3b8" : "#64748b"} />
               <TextInput 
                  className="flex-1 ml-3 text-xl font-bold text-slate-900 dark:text-white"
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
               />
            </View>
            <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                onPress={handleTopUp}
                loading={loadingAction}
            >
                Confirm Top Up
            </Button>
          </View>
        </Modal>

        {/* Withdraw Modal */}
        <Modal 
          visible={withdrawVisible} 
          onClose={() => setWithdrawVisible(false)}
          title="Withdraw Funds"
        >
          <View>
            <Typography className="text-slate-500 mb-4">Enter amount to withdraw</Typography>
            <View className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex-row items-center mb-6">
               <DollarSign size={20} color={isDark ? "#94a3b8" : "#64748b"} />
               <TextInput 
                  className="flex-1 ml-3 text-xl font-bold text-slate-900 dark:text-white"
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
               />
            </View>
            <Typography variant="small" className="text-slate-400 mb-6 text-center">
                Available Balance: ${balance.toFixed(2)}
            </Typography>
            <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                onPress={handleWithdraw}
                loading={loadingAction}
            >
                Confirm Withdrawal
            </Button>
          </View>
        </Modal>

      </View>
    </View>
  );
}
