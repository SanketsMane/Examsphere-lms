"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API?: any;
  }
}

export function DashboardWidgetControl() {
  useEffect(() => {
    // Function to hide the widget
    const hideWidget = () => {
        if (window.Tawk_API && typeof window.Tawk_API.hide === 'function') {
            window.Tawk_API.hide();
        }
    };

    // Attempt to hide immediately
    hideWidget();

    // Also set up an interval to ensure it stays hidden if it loads late
    const interval = setInterval(hideWidget, 1000);

    // Cleanup: Show widget when leaving dashboard (optional, but good practice if single page app)
    return () => {
      clearInterval(interval);
      if (window.Tawk_API && typeof window.Tawk_API.show === 'function') {
        window.Tawk_API.show();
      }
    };
  }, []);

  return null;
}
