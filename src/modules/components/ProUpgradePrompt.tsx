import React from "react";
import { useNavigate } from "react-router-dom";

interface ProUpgradePromptProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const ProUpgradePrompt: React.FC<ProUpgradePromptProps> = ({
  onClose,
  showCloseButton = true,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/");
    // Wait for navigation then scroll to pricing
    setTimeout(() => {
      const pricingElement = document.getElementById("pricing");
      if (pricingElement) {
        pricingElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    onClose?.();
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">⭐</span>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-amber-200">
              Unlock Full Access
            </h3>
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="text-amber-300/60 hover:text-amber-300 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <p className="text-amber-100/80 text-sm leading-relaxed">
            Pro subscription required to access any features. Get unlimited
            access to all features, advanced analytics, priority support, and
            exclusive content to accelerate your DSA mastery.
          </p>

          <div className="flex justify-center">
            <button
              onClick={handleUpgrade}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold rounded-lg transition-colors text-sm"
            >
              View Plans & Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
