import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./modules/App";
import { AuthScreen } from "./modules/components";
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
import { getActiveUser } from "./modules/localAuth";

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getActiveUser();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthPage: React.FC = () => {
  const nav = useNavigate();
  return <AuthScreen onAuthed={() => nav("/app", { replace: true })} />;
};

const RootApp: React.FC = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <App />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <App />
          </Protected>
        }
      />
      <Route path="/u/:username" element={<PublicProfilePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/refunds" element={<RefundsPage />} />
      <Route path="/shipping" element={<ShippingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(<RootApp />);
