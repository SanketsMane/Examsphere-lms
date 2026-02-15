import { BaseService } from "./BaseService";
import { ApiResponse } from "../types";

/**
 * Payment API Service
 * Sanket
 */

export interface PaymentMethod {
  id: string;
  type: "Visa" | "Mastercard" | "Amex" | "Paypal";
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  holder: string;
}

export class PaymentService extends BaseService {
  static getPaymentMethods() {
    return this.get<PaymentMethod[]>("/api/payment/methods");
  }

  static addPaymentMethod(data: Omit<PaymentMethod, "id">) {
    return this.post<PaymentMethod>("/api/payment/methods", data);
  }

  static deletePaymentMethod(id: string) {
    return this.delete(`/api/payment/methods/${id}`);
  }

  static setDefaultPaymentMethod(id: string) {
    return this.put(`/api/payment/methods/${id}/default`, {});
  }
}

export const paymentService = PaymentService;
