import api from "./api";
import { ApiResponse } from "../types";

/**
 * Course Engagement Service (Reviews & Wishlist)
 * Sanket
 */
export const engagementService = {
  // Reviews
  getCourseReviews: async (courseId: string): Promise<ApiResponse<any[]>> => {
    try {
      const data: any = await api.get(`/api/reviews/${courseId}`);
      return { status: "success", data };
    } catch (error: any) {
      return { 
        status: "error", 
        message: error.response?.data?.message || "Failed to fetch reviews" 
      };
    }
  },

  submitReview: async (courseId: string, rating: number, comment: string): Promise<ApiResponse<any>> => {
    try {
      const data: any = await api.post(`/api/reviews/${courseId}`, { rating, comment });
      return { status: "success", data };
    } catch (error: any) {
      return { 
        status: "error", 
        message: error.response?.data?.message || "Failed to submit review" 
      };
    }
  },

  // Wishlist
  toggleWishlist: async (courseId: string): Promise<ApiResponse<{ status: string; message: string }>> => {
    try {
      const data: any = await api.post(`/api/wishlist/${courseId}`);
      return { status: "success", data };
    } catch (error: any) {
      return { 
        status: "error", 
        message: error.response?.data?.message || "Failed to update wishlist" 
      };
    }
  },

  checkWishlist: async (courseId: string): Promise<ApiResponse<{ isInWishlist: boolean }>> => {
    try {
      const data: any = await api.get(`/api/wishlist/${courseId}`);
      return { status: "success", data };
    } catch (error: any) {
      return { 
        status: "error", 
        message: error.response?.data?.message || "Failed to check wishlist" 
      };
    }
  },

  getWishlist: async (): Promise<ApiResponse<any[]>> => {
    try {
      const data: any = await api.get("/api/wishlist");
      return { status: "success", data };
    } catch (error: any) {
      return { 
        status: "error", 
        message: error.response?.data?.message || "Failed to fetch wishlist" 
      };
    }
  }
};
