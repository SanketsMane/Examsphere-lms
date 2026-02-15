import api from "./api";
import { ApiResponse, User } from "../types";

/**
 * User & Profile Service
 * Sanket
 */
export const userService = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const data: any = await api.get("/api/profile");
      return { status: "success", data };
    } catch (error: any) {
      return { 
        status: "error", 
        message: error.response?.data?.message || "Failed to fetch profile" 
      };
    }
  },

  updateProfile: async (profileData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const data: any = await api.patch("/api/profile", profileData);
      return { status: "success", data };
    } catch (error: any) {
      return { 
        status: "error", 
        message: error.response?.data?.message || "Failed to update profile" 
      };
    }
  }
};
