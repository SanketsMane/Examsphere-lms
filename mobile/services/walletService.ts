import { BaseService } from "./BaseService";

/**
 * Wallet API Service
 * Sanket
 */

export interface WalletBalance {
  balance: number;
}

export class WalletService extends BaseService {
  static getBalance() {
    return this.get<WalletBalance>("/api/wallet/balance");
  }

  static recharge(amount: number, paymentId: string) {
    return this.post<any>("/api/wallet/recharge", { amount, paymentId });
  }

  static async getTransactions() {
    const response = await this.get<any>("/api/wallet/transactions");
    if (response.status === "success" && response.data?.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  }
  static async withdraw(amount: number) {
    return this.post<any>("/api/wallet/withdraw", { amount });
  }
}

export const walletService = WalletService;
