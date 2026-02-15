import { BaseService } from "./BaseService";

/**
 * Subscription API Service
 * Sanket
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  isDefault: boolean;
}

export class SubscriptionService extends BaseService {
  static getPlans() {
    return this.get<SubscriptionPlan[]>("/api/public/plans");
  }

  static getCurrentSubscription() {
    return this.get<any>("/api/student/subscription");
  }
}

export const subscriptionService = SubscriptionService;
