import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../utils/constants";
import { logger } from "../utils/logger";

/**
 * Mobile API Service - Production Grade
 * Features: Interceptors, Timeouts, Retry Logic, Robust Origin Handling
 * Author: Sanket
 */

const TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Request Interceptor: Auth & Headers
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync("auth_token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Standardize Mobile Identification
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    logger.debug(`[API ${config.method?.toUpperCase()}] Requesting: ${config.url}`);
    
    return config;
  },
  (error) => {
    logger.error(`[API Request Error] ${error.message}`);
    return Promise.reject(error);
  }
);

// Response Interceptor: Error Handling & Retry Logic
api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: number };

    // Retry Logic for Network Errors / Timeouts
    if (!error.response && (!config._retry || config._retry < MAX_RETRIES)) {
      config._retry = (config._retry || 0) + 1;
      logger.warn(`[API Network Error] Retrying ${config.url} (${config._retry}/${MAX_RETRIES})...`);
      return api(config);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      const message = data?.message || error.message || "An unexpected error occurred";

      logger.error(`[API Error ${status}] ${config.url}: ${message}`);

      // Handle common status codes
      if (status === 401) {
        // Potential Session Expiry logic here
        await SecureStore.deleteItemAsync("auth_token");
      }
      
      return Promise.reject({
        status,
        message,
        data,
      });
    }

    logger.error(`[API Connection Error] ${error.message}`);
    return Promise.reject({
      status: 0,
      message: "Network Error: Please check your internet connection",
    });
  }
);

export default api;
