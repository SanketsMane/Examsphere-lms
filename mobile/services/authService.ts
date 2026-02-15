import api from "./api";
import { ApiResponse, AuthSession, User } from "../types";

/**
 * Auth Service
 * Sanket
 */

export const authService = {
  /**
   * Login with Email and Password
   */
  login: async (email: string, password: string): Promise<ApiResponse<AuthSession>> => {
    // ... existing login code ...
        try {
       const response = await api.post("/api/auth/sign-in/email", {
         email,
         password,
       }) as any;
       const { user, session, token } = response;
       
       // Better Auth might return just { user, token } or { user, session }
       const authToken = token || session?.token || session?.id;

       if (!user || !authToken) {
          console.error("Login Response Missing Fields:", JSON.stringify(response));
          return { status: "error", message: "Invalid response from server" };
       }
       return {
         status: "success",
         data: {
           user: user,
           token: authToken,
           expiresAt: session?.expiresAt ? new Date(session.expiresAt).getTime() : Date.now() + 86400000 * 7, // Default 7 days if no session
         },
       };
 
     } catch (error: any) {
       console.error("Login Error Full:", error);
       const errorData = error.response?.data;
       const msg = errorData?.message || errorData?.error?.message || errorData?.status || error.message || "Login failed";
       return {
         status: "error",
         message: typeof msg === 'object' ? JSON.stringify(msg) : msg,
       };
     }
   },
 
   /**
    * Register with Name, Email, Password
    */
   register: async (name: string, email: string, password: string): Promise<ApiResponse<AuthSession>> => {
     try {
       const response = await api.post("/api/auth/sign-up/email", {
         name,
         email,
         password,
       }) as any;
 
       const { user, session, token } = response;
 
       const authToken = token || session?.token || session?.id;

        if (!user || !authToken) {
          return { status: "error", message: "Invalid response from server" };
       }
 
       return {
         status: "success",
         data: {
           user: user,
           token: authToken,
           expiresAt: session?.expiresAt ? new Date(session.expiresAt).getTime() : Date.now() + 86400000 * 7,
         },
       };
     } catch (error: any) {
       console.error("Register Error:", error.response?.data || error.message);
       return {
         status: "error",
         message: error.response?.data?.message || "Registration failed",
       };
     }
   },
 
   /**
    * Logout
    */
   logout: async (): Promise<ApiResponse<void>> => {
     try {
       await api.post("/api/auth/sign-out", {});
       return { status: "success", data: undefined };
     } catch (error: any) {
       return {
         status: "error",
         message: error.message || "Logout failed",
       };
     }
   },
   
   /**
    * Get Current Session (if token is valid)
    */
    getSession: async (): Promise<ApiResponse<AuthSession>> => {
       try {
         const response = await api.get("/api/auth/session") as any;
         const { session, user } = response;
         
         if (!session) {
             return { status: "error", message: "No session found" };
         }
         
         return {
             status: "success",
             data: {
                 user,
                 token: session.token || session.id,
                  expiresAt: new Date(session.expiresAt).getTime(),
             }
         }
       } catch (error: any) {
           return { status: "error", message: "Failed to fetch session" };
       }
    },
 
    /**
     * Send OTP for Phone Login
     */
    sendPhoneLoginOTP: async (phoneNumber: string): Promise<ApiResponse<void>> => {
      try {
        await api.post("/api/auth/phone-number/send-otp", {
          phoneNumber,
        });
        return { status: "success", data: undefined };
      } catch (error: any) {
        return {
          status: "error",
          message: error.response?.data?.message || "Failed to send OTP",
        };
      }
    },
 
    /**
     * Verify OTP for Phone Login
     */
    verifyPhoneLogin: async (phoneNumber: string, code: string): Promise<ApiResponse<AuthSession>> => {
       try {
         const response = await api.post("/api/auth/phone-number/verify", {
           phoneNumber,
           code,
         }) as any;
 
         const { user, session } = response;
       
         if (!user || !session) {
            return { status: "error", message: "Invalid response from server" };
         }
   
         return {
           status: "success",
           data: {
             user: user,
             token: session.token || session.id,
             expiresAt: new Date(session.expiresAt).getTime(),
           },
         };
       } catch (error: any) {
         return {
           status: "error",
           message: error.response?.data?.message || "Verification failed",
         };
       }
    },
 
    /**
     * Register with Phone (Sends OTP)
     */
    registerPhone: async (name: string, email: string, phoneNumber: string): Promise<ApiResponse<void>> => {
      try {
        // Ideally check if phone number already exists here, but send-otp will handle it nicely usually
        await api.post("/api/auth/phone-number/send-otp", {
          phoneNumber,
        });
        return { status: "success", data: undefined };
      } catch (error: any) {
         return {
           status: "error",
           message: error.response?.data?.message || "Registration failed",
         };
      }
    },
 
    /**
     * Verify Phone Registration & Update Profile
     */
    verifyPhoneRegister: async (name: string, email: string, phoneNumber: string, code: string): Promise<ApiResponse<AuthSession>> => {
       try {
         // 1. Verify Phone (Creates User with temp email)
         const verifyResponse = await api.post("/api/auth/phone-number/verify", {
           phoneNumber,
           code,
         }) as any;
         
         const { user: verifiedUser, session: verifiedSession } = verifyResponse;
 
         if (!verifiedUser || !verifiedSession) {
              return { status: "error", message: "Verification failed - No session created" };
         }
 
         const token = verifiedSession.token || verifiedSession.id;
 
         // 2. Update Name
         // We need to ensure the token is attached. interceptor handles it if it's in store, but it's not yet.
         // We have to manually pass headers or relies on cookie?
         // But headers.Cookie might work if api client respects it? 
         // Logic: SecureStore isn't updated yet. 
         // We can pass header manually for these subsequent calls.
         const authHeader = { Authorization: `Bearer ${token}` };
 
         try {
             await api.post("/api/auth/update-user", {
                 name: name,
             }, { headers: authHeader });
         } catch (updateError) {
             console.error("Failed to update name during registration", updateError);
             // Continue... it's not fatal, user can update later
         }
 
         // 3. Update Email (Triggers Verification)
         try {
              await api.post("/api/auth/change-email", {
                 newEmail: email,
             }, { headers: authHeader });
         } catch (emailError: any) {
              console.error("Failed to update email during registration", emailError);
              // If email exists, it might fail. We should probably warn user or return specific status?
              // specific 'email-exists' error
         }
 
         return {
           status: "success",
           data: {
             user: verifiedUser, // Note: This might still have temp email + name
             token: token,
             expiresAt: new Date(verifiedSession.expiresAt).getTime(),
           },
         };
        } catch (error: any) {
           return {
            status: "error",
            message: error.response?.data?.message || "Verification failed",
          };
        }
     },

     /**
      * Forget Password - Send Reset Email
      */
     forgetPassword: async (email: string): Promise<ApiResponse<void>> => {
       try {
         await api.post("/api/auth/forget-password", {
           email,
           redirectTo: "kidokool-lms://reset-password", // Deep link for mobile
         });
         return { status: "success", data: undefined };
       } catch (error: any) {
         return {
           status: "error",
           message: error.response?.data?.message || "Failed to send reset email",
         };
       }
     }
};
