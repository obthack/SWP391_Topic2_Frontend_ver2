import React, { useState, useEffect } from "react";
import { Presentation, Shield, AlertTriangle } from "lucide-react";

export const DemoModeToggle = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check if demo mode is enabled
    const demoMode = localStorage.getItem("evtb_demo_mode") === "true";
    setIsDemoMode(demoMode);
  }, []);

  const toggleDemoMode = () => {
    const newDemoMode = !isDemoMode;
    setIsDemoMode(newDemoMode);
    localStorage.setItem("evtb_demo_mode", newDemoMode.toString());

    if (newDemoMode) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    }

    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        <div className="flex items-center mb-3">
          {isDemoMode ? (
            <Presentation className="h-5 w-5 text-blue-500 mr-2" />
          ) : (
            <Shield className="h-5 w-5 text-green-500 mr-2" />
          )}
          <h3 className="font-semibold text-gray-900">
            {isDemoMode ? "Demo Mode" : "Production Mode"}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          {isDemoMode
            ? "Token expiration checks are disabled for presentation"
            : "Token expiration checks are enabled for security"}
        </p>

        <button
          onClick={toggleDemoMode}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            isDemoMode
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isDemoMode ? "Switch to Production" : "Switch to Demo Mode"}
        </button>

        {showWarning && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Demo mode enabled! Token expiration checks are disabled.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
