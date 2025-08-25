import React from "react";
import { useNavigate } from "react-router-dom";
import { useProStatus } from "../hooks/useProStatus";
import { markOnboardingComplete } from "../localAuth";

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isPro, loading } = useProStatus();

  // If user is already Pro, redirect to app
  React.useEffect(() => {
    if (!loading && isPro) {
      navigate("/dashboard", { replace: true });
    }
  }, [isPro, loading, navigate]);

  // Mark onboarding as seen when component mounts
  React.useEffect(() => {
    markOnboardingComplete();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800/60">
        <div className="px-4 sm:px-5 py-3 flex items-center">
          <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent font-semibold text-lg">
            AlgoHabit
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-6 mb-12">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-200">
            Welcome to AlgoHabit!
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Your email has been confirmed. To start your DSA learning journey
            with personalized study plans, progress tracking, and expert
            guidance, you'll need to upgrade to Pro.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-900/70 p-6 rounded-xl ring-1 ring-gray-800">
            <div className="text-2xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              8-Week DSA Roadmap
            </h3>
            <p className="text-gray-400 text-sm">
              Structured learning path covering fundamental to advanced data
              structures and algorithms
            </p>
          </div>

          <div className="bg-gray-900/70 p-6 rounded-xl ring-1 ring-gray-800">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Progress Tracking
            </h3>
            <p className="text-gray-400 text-sm">
              Monitor your daily progress, streaks, and topic completion with
              detailed analytics
            </p>
          </div>

          <div className="bg-gray-900/70 p-6 rounded-xl ring-1 ring-gray-800">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Focus Mode
            </h3>
            <p className="text-gray-400 text-sm">
              Distraction-free study sessions with built-in timers and progress
              tracking
            </p>
          </div>

          <div className="bg-gray-900/70 p-6 rounded-xl ring-1 ring-gray-800">
            <div className="text-2xl mb-3">☁️</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Cloud Sync
            </h3>
            <p className="text-gray-400 text-sm">
              Access your progress from anywhere with secure cloud
              synchronization
            </p>
          </div>
        </div>

        {/* Pro Upgrade Section */}
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⭐</span>
          </div>
          <h2 className="text-2xl font-bold text-amber-200 mb-3">
            Unlock Full Access
          </h2>
          <p className="text-amber-100/80 mb-6 max-w-2xl mx-auto">
            Get unlimited access to all features, advanced analytics, priority
            support, and exclusive content to accelerate your DSA mastery.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => {
                navigate("/home");
                // Wait for navigation then scroll to pricing
                setTimeout(() => {
                  const pricingElement = document.getElementById("pricing");
                  if (pricingElement) {
                    pricingElement.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
              }}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              View Plans & Pricing
            </button>
          </div>

          <p className="text-amber-200/60 text-sm mt-4">
            Upgrade to Pro to unlock all features and start your DSA journey
          </p>
        </div>

        {/* Pro Required Notice */}
        <div className="text-center mt-8">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-300 text-sm">
              <strong>Pro subscription required</strong> to access any features.
              No free tier available.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
