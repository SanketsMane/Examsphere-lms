"use client";

import Script from 'next/script';
import { useCallback, useRef } from 'react';

interface RazorpayCheckoutProps {
    orderId: string;
    keyId: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    user: {
        name: string;
        email: string;
        contact?: string;
    };
    onSuccess: (paymentId: string) => void;
    onError?: (error: any) => void;
}

export function useRazorpay() {
    const isLoaded = useRef(false);

    const loadScript = useCallback(() => {
        if (isLoaded.current) return Promise.resolve(true);
        
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => {
                isLoaded.current = true;
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    }, []);

    const openCheckout = useCallback(async (options: RazorpayCheckoutProps) => {
        const loaded = await loadScript();
        
        if (!loaded) {
            options.onError?.(new Error("Razorpay SDK failed to load"));
            return;
        }

        const rzpOptions = {
            key: options.keyId,
            amount: options.amount,
            currency: options.currency,
            name: options.name,
            description: options.description,
            image: options.image,
            order_id: options.orderId,
            handler: function (response: any) {
                options.onSuccess(response.razorpay_payment_id);
            },
            prefill: {
                name: options.user.name,
                email: options.user.email,
                contact: options.user.contact,
            },
            theme: {
                color: "#2563eb", // Blue-600 to match theme
            },
            modal: {
                ondismiss: function() {
                   // Handle dismissal if needed
                }
            }
        };

        const paymentObject = new (window as any).Razorpay(rzpOptions);
        paymentObject.open();
    }, [loadScript]);

    return { openCheckout };
}
