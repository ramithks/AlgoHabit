import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./modules/App";
import {
  LoginScreen,
  SignupScreen,
  OnboardingScreen,
} from "./modules/components";
import {
  PublicProfilePage,
  LandingPage,
  TermsPage,
  PrivacyPage,
  RefundsPage,
  ShippingPage,
  ContactPage,
} from "./modules/public";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { getActiveUser, shouldShowOnboarding } from "./modules/localAuth";
import { useProStatus } from "./modules/hooks/useProStatus";

// Protected wrapper for Pro users only
const ProtectedPro: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isPro, loading, error } = useProStatus();
  const user = getActiveUser();

  if (!user) return <Navigate to="/login" replace />;
  if (loading) {
    // Show loading state while checking Pro status
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400">
            Checking subscription status...
          </p>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log("ProtectedPro check:", { user: user?.id, isPro, loading, error });

  // Show error if Pro status check failed
  if (error) {
    console.error("Pro status check error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-red-200">
            Subscription Check Failed
          </h2>
          <p className="text-gray-400 text-sm max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // All users must be Pro to access the app
  if (!isPro) {
    console.log("User not Pro, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }

  console.log("User is Pro, allowing access to app");
  return <>{children}</>;
};

// Protected wrapper for authenticated users (Pro or not)
const ProtectedAuth: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = getActiveUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Redirect from old auth route to login
const AuthRedirect: React.FC = () => {
  return <Navigate to="/login" replace />;
};

const RootApp: React.FC = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Authentication Routes */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/auth" element={<AuthRedirect />} />

      {/* Onboarding for new users */}
      <Route
        path="/onboarding"
        element={
          <ProtectedAuth>
            <OnboardingScreen />
          </ProtectedAuth>
        }
      />

      {/* Main App - Pro users only */}
      <Route
        path="/app"
        element={
          <ProtectedPro>
            <App />
          </ProtectedPro>
        }
      />

      {/* Settings - Pro users only */}
      <Route
        path="/settings"
        element={
          <ProtectedPro>
            <App />
          </ProtectedPro>
        }
      />

      {/* Public Routes */}
      <Route path="/u/:username" element={<PublicProfilePage />} />
      <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/refunds" element={<RefundsPage />} />
      <Route path="/shipping" element={<ShippingPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(<RootApp />);
