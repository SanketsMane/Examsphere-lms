import { ApiResponse } from "../types";
import api from "./api";
import { logger } from "../utils/logger";

/**
 * Centralized Base Service Layer
 * Sanket
 */
export class BaseService {
  /**
   * Universal Wrapper for API calls
   */
  protected static async request<T>(
    method: "get" | "post" | "put" | "delete" | "patch",
    url: string,
    data?: any,
    config?: any
  ): Promise<ApiResponse<T>> {
    try {
      logger.debug(`[${method.toUpperCase()}] Request: ${url}`, data);
      
      const response = await api({
        method,
        url,
        data,
        ...config,
      });

      // API Interceptor already returns response.data
      return {
        status: "success",
        data: response as unknown as T,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "An unexpected error occurred";
      const status = error.response?.status;

      logger.error(`[${method.toUpperCase()}] Failed: ${url}`, {
        status,
        message,
        error: error.response?.data
      });

      return {
        status: "error",
        message,
      };
    }
  }

  protected static get<T>(url: string, config?: any) {
    return this.request<T>("get", url, undefined, config);
  }

  protected static post<T>(url: string, data?: any, config?: any) {
    return this.request<T>("post", url, data, config);
  }

  protected static put<T>(url: string, data?: any, config?: any) {
    return this.request<T>("put", url, data, config);
  }

  protected static patch<T>(url: string, data?: any, config?: any) {
    return this.request<T>("patch", url, data, config);
  }

  protected static delete<T>(url: string, config?: any) {
    return this.request<T>("delete", url, undefined, config);
  }
}
