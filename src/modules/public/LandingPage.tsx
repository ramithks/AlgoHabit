import React, { Suspense, lazy, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getActiveUser } from "../localAuth";
import { plans as _plans } from "../payments/plans";
import { openCheckout } from "../payments/razorpay";
import { useState } from "react";
import { fetchProStatus } from "../repos/subscriptionsRepo";
const StreakHeatmapLazy = lazy(() =>
  import("../components/StreakHeatmap").then((m) => ({
    default: m.StreakHeatmap,
  }))
);

// Loading Skeleton Component
const LoadingSkeleton: React.FC<{ type: "card" | "text" | "button" }> = ({
  type,
}) => {
  if (type === "card") {
    return (
      <div className="panel p-4 animate-pulse">
        <div className="w-8 h-8 bg-gray-700 rounded mb-3"></div>
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
      </div>
    );
  }

  if (type === "button") {
    return <div className="h-10 bg-gray-700 rounded animate-pulse"></div>;
  }

  return null;
};

// Small presentational components used by LandingPage
const FeatureCard: React.FC<{
  title: string;
  desc: string;
  icon: string;
  details?: string[];
}> = ({ title, desc, icon, details = [] }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className="panel-interactive panel p-4 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-lg"
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div
        className="text-2xl mb-2 transition-all duration-300 transform-gpu"
        style={{ transformOrigin: "center" }}
      >
        <span className="group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-all duration-300">
          {icon}
        </span>
      </div>
      <div className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
        {title}
      </div>
      <div className="text-[12px] text-gray-400 mt-1 leading-relaxed group-hover:text-gray-300 transition-colors">
        {desc}
      </div>

      {/* Expandable Details */}
      {details.length > 0 && (
        <div
          className={`mt-3 overflow-hidden transition-all duration-300 ${
            isExpanded ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1">
            {details.map((detail, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-[11px] text-accent/80"
              >
                <span className="w-1 h-1 bg-accent rounded-full"></span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hover Indicator */}
      <div
        className={`mt-2 h-0.5 bg-gradient-to-r from-accent to-purple-500 transition-all duration-300 ${
          isExpanded ? "w-full" : "w-0 group-hover:w-1/2"
        }`}
      ></div>
    </div>
  );
};

const Step: React.FC<{
  n: number;
  title: string;
  desc: string;
  icon?: string;
}> = ({ n, title, desc, icon }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <li
      className="panel p-4 relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Step Number */}
      <div className="text-[11px] text-accent/80 font-semibold mb-1 flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full bg-gradient-to-r from-accent to-purple-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${
            isHovered ? "scale-110 shadow-lg" : "scale-100"
          }`}
        >
          {n}
        </div>
        <span className="transition-all duration-300">Step {n}</span>
      </div>

      {/* Icon (if provided) */}
      {icon && (
        <div
          className="text-2xl mb-2 transition-all duration-300 transform-gpu"
          style={{ transformOrigin: "center" }}
        >
          <span className="group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-all duration-300">
            {icon}
          </span>
        </div>
      )}

      <div className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
        {title}
      </div>
      <div className="text-[12px] text-gray-400 mt-1 leading-relaxed group-hover:text-gray-300 transition-colors">
        {desc}
      </div>

      {/* Interactive Timeline Line */}
      <div className="absolute top-1/2 -right-2.5 w-5 h-0.5 bg-gradient-to-r from-accent/50 to-transparent transition-all duration-300 group-hover:w-8 group-hover:from-accent to-purple-500"></div>

      {/* Hover Effect */}
      <div
        className={`absolute inset-0 rounded-lg transition-all duration-300 ${
          isHovered
            ? "ring-2 ring-accent/30 bg-accent/5"
            : "ring-0 bg-transparent"
        }`}
      ></div>
    </li>
  );
};

const TestimonialCard: React.FC<{
  quote: string;
  name: string;
  handle: string;
}> = ({ quote, name, handle }) => (
  <blockquote className="panel p-4">
    <p className="text-[13px] text-gray-200 leading-relaxed">“{quote}”</p>
    <footer className="mt-2 text-[11px] text-gray-400">
      — {name} <span className="text-gray-500">{handle}</span>
    </footer>
  </blockquote>
);

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="panel p-3">
      <button
        className="w-full text-left flex items-center justify-between gap-3"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-200">{q}</span>
        <span className="text-gray-400 text-xs">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-2 text-[12px] text-gray-400 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
};

// default features used when plans don't include a feature list
const DEFAULT_PLAN_FEATURES = [
  "Full 8-week curated roadmap",
  "Advanced progress stats & streaks",
  "Focus mode, reminders & offline practice",
  "Priority updates & no ads",
];

// --- Pricing helpers & interactive components (module scope) ---
const formatINR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN")}`;

const PlanArea: React.FC<{
  selectedKey?: string;
  onBuy?: (k: string) => void;
}> = ({ selectedKey }) => {
  const all = _plans;
  const p = all.find((x) => x.key === selectedKey) || all[0];
  const user = getActiveUser();

  const start = async () => {
    if (!user) return window.location.assign("/auth");
    try {
      // Show loading state
      const button = document.querySelector(
        `[data-plan="${p.key}"] button`
      ) as HTMLButtonElement;
      if (button) {
        button.textContent = "Processing...";
        button.disabled = true;
      }

      await openCheckout({
        amountPaise: p.pricePaise,
        name: p.title,
        description: "AlgoHabit Pro",
        plan_key: p.key,
        user_id: user.id,
      });

      // Show success message
      const el = document.createElement("div");
      el.className =
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium shadow-lg";
      el.textContent =
        "Payment opened! Complete payment to activate your Pro plan.";
      document.body.appendChild(el);
      setTimeout(() => {
        try {
          el.remove();
        } catch {}
      }, 5000);

      // Don't redirect immediately - let the webhook handle the subscription update
      // The user will be redirected after successful payment via the webhook
    } catch (error) {
      console.error("Checkout error:", error);

      // Show error message
      const el = document.createElement("div");
      el.className =
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-3 rounded-lg bg-red-600 text-white font-medium shadow-lg";
      el.textContent = `Payment failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      document.body.appendChild(el);
      setTimeout(() => {
        try {
          el.remove();
        } catch {}
      }, 5000);

      // Reset button
      const button = document.querySelector(
        `[data-plan="${p.key}"] button`
      ) as HTMLButtonElement;
      if (button) {
        button.textContent = "🚀 Upgrade to Pro";
        button.disabled = false;
      }
    }
  };

  return (
    <div
      key={p.key} // Force re-render for animation
      data-plan={p.key}
      className="panel-interactive relative p-4 sm:p-6 shadow-2xl rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/90 ring-1 ring-gray-800 transform transition-all duration-500 ml-0 sm:ml-4 flex flex-col animate-in slide-in-from-left-2 fade-in-0"
      style={{ height: "calc(3 * 160px + 1 * 32px + 40px)" }} // Height: 3 small cards (160px each) + 2 gaps (32px each for gap-8) + reduced extra space for features
    >
      {/* top-right badge if offer/best */}
      {p.best && (
        // badge sits slightly outside the card corner so it doesn't block content
        <div className="absolute right-3 sm:right-4 -top-3 z-10 animate-in zoom-in-0 duration-300">
          <div className="badge badge-accent text-xs">Best value</div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-white animate-in slide-in-from-bottom-2 duration-300">
              {p.title}
            </h3>
          </div>
          <div className="text-sm text-gray-300 mt-1 animate-in slide-in-from-bottom-2 duration-300 delay-100">
            {p.sub}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white animate-in slide-in-from-bottom-2 duration-300 delay-200">
            {formatINR(p.pricePaise)}
          </div>
          {p.discountPercent && (
            <div className="text-sm text-white font-semibold mt-1 animate-in slide-in-from-bottom-2 duration-300 delay-300">
              Save {p.discountPercent}% vs Monthly
            </div>
          )}
        </div>
      </div>

      {/* FOMO offer display - always present but conditional content */}
      <div className="mb-6 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg relative overflow-hidden animate-in slide-in-from-bottom-2 duration-300 delay-400 min-h-[60px] flex items-center">
        {p.fomoOffer ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 animate-pulse"></div>
            <div className="relative text-sm text-amber-200 font-medium flex items-center gap-2">
              <span className="text-amber-400">✨</span>
              <span>{p.fomoOffer}</span>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-400 font-medium flex items-center gap-2">
            <span className="text-gray-500">💡</span>
            <span>Unlock your full potential with Pro features</span>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="mb-6">
        <div className="text-sm text-gray-300 mb-4">
          Limited-time offer: upgrade now and save.
        </div>
        <button
          className="group relative w-full h-14 bg-gradient-to-r from-accent via-accentMuted to-purple-500 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          onClick={start}
          aria-label={`Subscribe to ${p.title}`}
          data-plan={p.key}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/80 via-accentMuted/80 to-purple-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center gap-2">
            <span>🚀</span>
            <span>Upgrade to Pro</span>
            <span>→</span>
          </div>
        </button>
      </div>

      {/* Features Section */}
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-white mb-4">What you get</h4>
        <ul className="space-y-3 text-[14px] text-gray-200">
          {(((p as any).features ?? DEFAULT_PLAN_FEATURES) as string[])
            .slice(0, 8)
            .map((f: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${700 + i * 50}ms` }}
              >
                <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-accent to-purple-500 rounded-full mt-2"></div>
                <div className="text-gray-300 leading-relaxed">{f}</div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

const SmallPlansGridWrapper: React.FC<{
  selectedKey?: string;
  onSelect?: (k: string) => void;
  navigate: (path: string, options?: any) => void;
}> = ({ selectedKey, onSelect, navigate }) => {
  const user = getActiveUser();

  const handleBuy = async (p: (typeof _plans)[number]) => {
    if (!user) return window.location.assign("/auth");

    // Check if user is already Pro
    try {
      const proStatus = await fetchProStatus(user.id);
      if (proStatus) {
        console.log("User is already Pro, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }
    } catch (error) {
      console.error("Error checking Pro status:", error);
    }

    try {
      await openCheckout({
        amountPaise: p.pricePaise,
        name: p.title,
        description: "AlgoHabit Pro",
        plan_key: p.key,
        user_id: user.id,
      });
      window.location.assign("/dashboard");
    } catch {}
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
      {_plans.map((p) => {
        const active = selectedKey === p.key;
        return (
          <div
            key={p.key}
            onClick={() => onSelect?.(p.key)}
            className={`panel p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer relative ${
              active
                ? "border-2 border-accent bg-gray-700 shadow-lg scale-102 sm:scale-105"
                : "border border-transparent bg-gray-900/40 hover:border-accent/40 hover:shadow-lg hover:scale-102"
            }`}
            style={{ height: "160px" }} // Increased height for better content fit
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect?.(p.key);
            }}
            aria-pressed={active}
          >
            {/* always-visible overlay stroke for the active card */}
            {active && (
              <span
                className="pointer-events-none absolute -inset-px rounded-xl border-2 border-accent/60 z-20"
                aria-hidden
              />
            )}

            {/* Badge positioned to not hide content */}
            {p.best && (
              <div className="absolute -right-1 -top-1 z-30">
                <div className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg border border-amber-400/30">
                  BEST
                </div>
              </div>
            )}
            {p.discountPercent && !p.best && (
              <div className="absolute -right-1 -top-1 z-30">
                <div className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg border border-green-400/30">
                  {p.discountPercent}% OFF
                </div>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`text-sm font-semibold pr-8 ${
                    active ? "text-white" : "text-gray-100"
                  }`}
                >
                  {p.title}
                </div>
              </div>
              <div className="mb-3">
                <div
                  className={`text-lg font-bold ${
                    active ? "text-white" : "text-gray-100"
                  }`}
                >
                  {formatINR(p.pricePaise)}
                </div>
                <div
                  className={`text-[12px] ${
                    active ? "text-white" : "text-gray-400"
                  }`}
                >
                  {p.sub}
                </div>
              </div>
            </div>

            {/* always-visible overlay stroke for the active card */}
            {active && (
              <span
                className="pointer-events-none absolute -inset-px rounded-xl border-2 border-accent/60 z-20"
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getActiveUser();
  const [selectedKey, setSelectedKey] = React.useState<string>(() => {
    // prefer a plan marked as best, fallback to yearly or first
    return (
      _plans.find((p) => p.best)?.key ||
      _plans.find((p) => p.key === "pro_yearly")?.key ||
      _plans[0]?.key ||
      ""
    );
  });

  // Handle post-email-confirmation redirects
  React.useEffect(() => {
    // Check if user is coming back after email confirmation
    if (user && location.search.includes("confirmed=true")) {
      // Clear the query parameter and redirect to onboarding for new users
      navigate("/onboarding", { replace: true });
    }
  }, [user, location.search, navigate]);

  // Check Pro status and redirect if user becomes Pro
  const [isPro, setIsPro] = React.useState<boolean>(false);
  const [proCheckLoading, setProCheckLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const checkProStatus = async () => {
      try {
        if (user) {
          setProCheckLoading(true);
          const proStatus = await fetchProStatus(user.id);
          setIsPro(proStatus);
          if (proStatus) {
            console.log("User is Pro, redirecting to dashboard");
            navigate("/dashboard", { replace: true });
          }
        } else {
          setIsPro(false);
          setProCheckLoading(false);
        }
      } catch (error) {
        console.error("Error checking Pro status:", error);
        setIsPro(false);
        setProCheckLoading(false);
      } finally {
        if (user) {
          setProCheckLoading(false);
        }
      }
    };

    // Check immediately and then every 5 seconds
    checkProStatus();
    const interval = setInterval(checkProStatus, 5000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // PWA Installation Prompt
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    // PWA Installation Logic
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    // Performance Monitoring
    if ("performance" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log(
              "Page Load Time:",
              navEntry.loadEventEnd - navEntry.loadEventStart
            );
          }
        }
      });
      observer.observe({ entryTypes: ["navigation"] });
    }

    // Intersection Observer for Lazy Loading
    const observerOptions = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    // Observe all sections for lazy animation
    document.querySelectorAll("section").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  const daysSample = React.useMemo(() => {
    // Generate a soft demo pattern for the heatmap
    const today = new Date();
    const days: string[] = [];
    for (let i = 0; i < 56; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // 60% sparse activity, denser toward recent days
      const bias = Math.max(0.2, 1 - i / 70);
      if (Math.random() < 0.28 + 0.35 * bias) {
        days.push(d.toISOString().slice(0, 10));
      }
    }
    return days;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-md transition-all duration-300">
        <div className="h-0.5 w-full gradient-bar opacity-60" />
        <div className="relative bg-gray-950/70 backdrop-blur px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 font-semibold tracking-tight text-lg">
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
              AlgoHabit
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-normal">
              beta
            </span>
          </div>
          <nav className="ml-auto hidden md:flex items-center gap-1 text-[11px] text-gray-300">
            <button
              className="btn btn-ghost !px-2 !py-1.5 hover:text-accent transition-colors"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Features
            </button>
            <button
              className="btn btn-ghost !px-2 !py-1.5 hover:text-accent transition-colors"
              onClick={() =>
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How it works
            </button>
            <button
              className="btn btn-ghost !px-2 !py-1.5 hover:text-accent transition-colors"
              onClick={() =>
                document
                  .getElementById("testimonials")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Testimonials
            </button>
            <button
              className="btn btn-ghost !px-2 !py-1.5 hover:text-accent transition-colors"
              onClick={() =>
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              FAQ
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-auto p-2 text-gray-300 hover:text-accent transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center items-center">
              <span
                className={`w-5 h-0.5 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-1" : ""
                }`}
              ></span>
              <span
                className={`w-5 h-0.5 bg-current mt-1 transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`w-5 h-0.5 bg-current mt-1 transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-1" : ""
                }`}
              ></span>
            </div>
          </button>
          <div className="ml-2 flex items-center gap-2">
            <button
              className="btn btn-ghost text-[11px] hidden sm:inline-flex hover:text-accent transition-colors"
              onClick={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Pricing
            </button>
            {showInstallPrompt && (
              <button
                className="btn btn-outline text-[11px] border-accent/30 text-accent hover:bg-accent/10"
                onClick={handleInstallPWA}
              >
                📱 Install App
              </button>
            )}
            <button
              className="btn btn-primary text-[11px] hover:scale-105 transition-transform"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Continue" : "Get Started"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="absolute top-0 right-0 w-64 h-full bg-gray-900/95 backdrop-blur-md border-l border-gray-800 p-6 animate-in slide-in-from-right duration-300">
            <div className="flex flex-col space-y-4">
              <div className="text-lg font-semibold text-white mb-4">Menu</div>
              <button
                className="text-left text-gray-300 hover:text-accent transition-colors py-2"
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
              >
                Features
              </button>
              <button
                className="text-left text-gray-300 hover:text-accent transition-colors py-2"
                onClick={() => {
                  document
                    .getElementById("how")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
              >
                How it works
              </button>
              <button
                className="text-left text-gray-300 hover:text-accent transition-colors py-2"
                onClick={() => {
                  document
                    .getElementById("testimonials")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
              >
                Testimonials
              </button>
              <button
                className="text-left text-gray-300 hover:text-accent transition-colors py-2"
                onClick={() => {
                  document
                    .getElementById("pricing")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
              >
                Pricing
              </button>
              <button
                className="text-left text-gray-300 hover:text-accent transition-colors py-2"
                onClick={() => {
                  document
                    .getElementById("faq")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
              >
                FAQ
              </button>
              <hr className="border-gray-700 my-4" />
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  navigate(user ? "/dashboard" : "/auth");
                  setIsMobileMenuOpen(false);
                }}
              >
                {user ? "Continue" : "Get Started"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 pt-12 pb-10 sm:pt-16 sm:pb-12 max-w-6xl mx-auto relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-4">
              {/* Problem Statement */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-in slide-in-from-top-2 duration-500">
                <span className="text-red-400 text-xs">🔥</span>
                <span className="text-red-300 text-xs font-medium">
                  Struggling with DSA consistency?
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100 animate-in slide-in-from-bottom-2 duration-500 delay-200">
                Build a consistent DSA routine in 8 focused weeks
              </h1>
              <p className="text-gray-400 text-sm sm:text-[15px] leading-relaxed animate-in slide-in-from-bottom-2 duration-500 delay-400">
                AlgoHabit turns practice into a habit. Follow a clear 8-week
                roadmap, track Weekly Topics, keep a streak, and level up with
                measurable XP. Designed for focus, motivation, and momentum.
              </p>

              {/* CTA Variety */}
              <div className="flex flex-wrap gap-3 pt-2 animate-in slide-in-from-bottom-2 duration-500 delay-600">
                <button
                  className="btn btn-primary group relative overflow-hidden"
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/80 to-purple-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center gap-2">
                    <span>🚀</span>
                    {user ? "Open Dashboard" : "Start Now"}
                  </span>
                </button>
                <button
                  className="btn btn-ghost border border-gray-600 hover:border-accent/50 transition-colors"
                  onClick={() => {
                    const el = document.getElementById("features");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span>✨</span>
                    See how it works
                  </span>
                </button>
                <button
                  className="btn btn-outline border border-accent/30 text-accent hover:bg-accent/10 transition-all"
                  onClick={() => {
                    const el = document.getElementById("pricing");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span>💎</span>
                    View Pricing
                  </span>
                </button>
              </div>

              <ul className="text-[12px] text-gray-400 grid grid-cols-2 gap-2 pt-3 animate-in slide-in-from-bottom-2 duration-500 delay-800">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                  8-Week Roadmap
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                  Weekly Topics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                  Streak heatmap
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                  XP levels
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                  Focus mode
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                  Reminders
                </li>
              </ul>
            </div>
            <div className="panel p-4 animate-in slide-in-from-right-2 duration-500 delay-300">
              <Suspense
                fallback={
                  <div className="w-full h-64 flex items-center justify-center">
                    <LoadingSkeleton type="card" />
                  </div>
                }
              >
                <StreakHeatmapLazy days={daysSample} />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 pb-14 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard
              title="8-Week Roadmap"
              desc="A structured path with weekly milestones so you always know what to tackle next."
              icon="📅"
              details={[
                "Week 1-2: Basic Data Structures",
                "Week 3-4: Algorithms & Patterns",
                "Week 5-6: Advanced Concepts",
                "Week 7-8: Practice & Review",
              ]}
            />
            <FeatureCard
              title="Weekly Topics"
              desc="Curated topics per week, track completion and add notes to retain concepts."
              icon="✅"
              details={[
                "Topic-based learning",
                "Progress tracking",
                "Note-taking system",
                "Concept retention",
              ]}
            />
            <FeatureCard
              title="Streak & XP"
              desc="Build momentum with daily streaks and level up through consistent practice."
              icon="🔥"
              details={[
                "Daily streak counter",
                "XP points system",
                "Level progression",
                "Achievement badges",
              ]}
            />
            <FeatureCard
              title="Focus Mode"
              desc="Eliminate distractions with timed focus sessions and offline practice."
              icon="🎯"
              details={[
                "Pomodoro timer",
                "Offline access",
                "Distraction blocking",
                "Deep work sessions",
              ]}
            />
            <FeatureCard
              title="Smart Reminders"
              desc="Never miss a practice session with intelligent notification system."
              icon="⏰"
              details={[
                "Customizable timing",
                "Smart scheduling",
                "Gentle nudges",
                "Progress reminders",
              ]}
            />
            <FeatureCard
              title="Progress Analytics"
              desc="Visual insights into your learning journey and performance metrics."
              icon="📊"
              details={[
                "Heatmap visualization",
                "Performance trends",
                "Weakness analysis",
                "Goal tracking",
              ]}
            />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="px-6 pb-14 max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            How it works
          </h2>
          <div className="relative">
            {/* Timeline Background */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/20 via-accent/40 to-purple-500/20 hidden md:block"></div>

            <ol className="grid md:grid-cols-3 gap-5 counter-reset relative z-10">
              <Step
                n={1}
                title="Pick your week"
                desc="Follow the roadmap and choose the current week to focus your learning."
                icon="📅"
              />
              <Step
                n={2}
                title="Practice topics"
                desc="Work through curated topics. Mark progress, add quick notes, and earn XP."
                icon="🎯"
              />
              <Step
                n={3}
                title="Review & reflect"
                desc="Use Weekly Review and reminders to reinforce learning and plan next steps."
                icon="📊"
              />
            </ol>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="px-6 pb-14 max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            What learners say
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            <TestimonialCard
              quote="I finally stuck to a plan. The weekly structure and streak made it effortless."
              name="Devika"
              handle="@dev.codes"
            />
            <TestimonialCard
              quote="XP and milestones kept me motivated. I can see my momentum now."
              name="Arun"
              handle="@arun_ds"
            />
            <TestimonialCard
              quote="Focus mode + reminders = fewer excuses. I ship daily practice."
              name="Maya"
              handle="@mayalearns"
            />
          </div>
        </section>

        {/* Pricing (revamped) - modern, minimal, responsive */}
        <section id="pricing" className="px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
          {proCheckLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-400">
                Checking subscription status...
              </p>
            </div>
          ) : isPro ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h2 className="text-xl font-semibold text-green-200 mb-2">
                You're Already Pro!
              </h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                You have an active Pro subscription. Enjoy all the features!
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 bg-accent hover:bg-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                Go to Dashboard →
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-100 mb-2 text-left">
                Pricing
              </h2>
              <div className="text-sm text-gray-400 mb-6 max-w-3xl text-left">
                Build a consistent habit — pick a plan that fits your schedule.
                Upgrade now and save with limited-time offers.
              </div>

              {/* Mobile-first pricing layout */}
              <div className="block xl:hidden mb-8">
                {/* Mobile: Plan selector first */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Choose your plan:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {_plans.map((p) => {
                      const active = selectedKey === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => setSelectedKey(p.key)}
                          className={`p-3 rounded-lg text-center transition-all duration-200 relative ${
                            active
                              ? "bg-gradient-to-r from-accent to-purple-500 text-white shadow-lg scale-105"
                              : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/60"
                          }`}
                        >
                          {active && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                          )}
                          <div className="text-xs font-semibold mb-1">
                            {p.title}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {p.sub}
                          </div>
                          {p.discountPercent && (
                            <div className="text-[10px] text-accent/80 font-medium mt-1">
                              {p.discountPercent}% off
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile: Selected plan details */}
                <PlanArea selectedKey={selectedKey} />
              </div>

              {/* Desktop pricing layout */}
              <div className="hidden xl:flex flex-row items-start justify-center gap-8">
                {/* Left: Highlighted main plan (dynamic) */}
                <div className="w-full max-w-md">
                  <PlanArea selectedKey={selectedKey} />
                </div>

                {/* Right: Other plans grid */}
                <div className="w-full max-w-2xl">
                  <SmallPlansGridWrapper
                    selectedKey={selectedKey}
                    onSelect={(k) => setSelectedKey(k)}
                    navigate={navigate}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-[12px] text-gray-500 mt-8 text-center">
            Prices shown in INR.{" "}
            <span className="text-gray-400">
              Secure checkout via Razorpay • Cancel anytime
            </span>
          </div>

          {/* Trust & Payment Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment Methods */}
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                Secure Payment Methods
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  R
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  U
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  C
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  N
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Razorpay • UPI • Cards • Net Banking
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                Trust & Security
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-xs text-gray-400">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-xs text-gray-400">PCI DSS</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                30-day money-back guarantee
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                Early Access
              </div>
              <div className="text-2xl font-bold text-accent mb-1">Beta</div>
              <div className="text-xs text-gray-400">
                Be among the first to experience AlgoHabit Pro
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-xs text-gray-400">Launching Soon</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 pb-16 max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            <FAQItem
              q="Is AlgoHabit free?"
              a="AlgoHabit requires a Pro subscription. You can browse the landing pages, but the app is Pro-only. We believe in providing premium value for serious learners."
            />
            <FAQItem
              q="How is this different from other DSA platforms?"
              a="AlgoHabit focuses on building consistent habits through structured learning, streak tracking, and focus tools. It's not just about solving problems, but about making practice a daily habit."
            />
            <FAQItem
              q="What's included in the 8-week roadmap?"
              a="The roadmap covers fundamental data structures, algorithms, problem-solving patterns, and advanced concepts. Each week has curated topics with practice problems and review sessions."
            />
            <FAQItem
              q="Can I use this for interview preparation?"
              a="Absolutely! The structured approach and consistent practice make it perfect for technical interviews. Many users report improved problem-solving skills and confidence."
            />
            <FAQItem
              q="What if I'm not satisfied?"
              a="We offer a 30-day money-back guarantee. If you're not completely satisfied with your experience, we'll refund your subscription, no questions asked."
            />
            <FAQItem
              q="Can I cancel anytime?"
              a="Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, and you can reactivate anytime."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-16">
          <div className="panel max-w-5xl mx-auto p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-100">
                Ready to build your DSA habit?
              </div>
              <div className="text-[12px] text-gray-400">
                It takes just a minute to get started.
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Continue" : "Get Started"}
            </button>
          </div>
        </section>
      </main>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-12 h-12 bg-accent hover:bg-accent/80 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-40 group"
        aria-label="Back to top"
      >
        <div className="flex items-center justify-center">
          <span className="text-lg group-hover:-translate-y-0.5 transition-transform duration-300">
            ↑
          </span>
        </div>
      </button>

      <footer className="relative border-t border-gray-800/60 bg-gray-950/80 backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-purple-500/5 to-accent/5"></div>
        <div className="relative px-6 py-8 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo and Tagline */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent text-xl font-bold">
                  AlgoHabit
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-normal">
                  beta
                </span>
              </div>
              <p className="text-sm text-gray-400 max-w-md">
                Build a consistent DSA routine in 8 focused weeks. Turn practice
                into a habit.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {/* Social links removed - not needed */}
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                className="text-gray-400 hover:text-accent transition-colors"
                to="/privacy"
              >
                Privacy
              </Link>
              <Link
                className="text-gray-400 hover:text-accent transition-colors"
                to="/terms"
              >
                Terms
              </Link>
              <Link
                className="text-gray-400 hover:text-accent transition-colors"
                to="/refunds"
              >
                Refunds
              </Link>
              <Link
                className="text-gray-400 hover:text-accent transition-colors"
                to="/shipping"
              >
                Shipping
              </Link>
              <Link
                className="text-gray-400 hover:text-accent transition-colors"
                to="/contact"
              >
                Contact
              </Link>
            </div>

            {/* Copyright */}
            <div className="pt-4 border-t border-gray-800/40 w-full text-center">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} AlgoHabit. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Old SmallPlansGrid removed; replaced by SmallPlansGridWrapper above.
