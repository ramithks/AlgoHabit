import React, { Suspense, lazy } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getActiveUser } from "../localAuth";
import { plans as _plans } from "../payments/plans";
import { openCheckout } from "../payments/razorpay";
const StreakHeatmapLazy = lazy(() =>
  import("../components/StreakHeatmap").then((m) => ({
    default: m.StreakHeatmap,
  }))
);

// Small presentational components used by LandingPage
const FeatureCard: React.FC<{ title: string; desc: string; icon: string }> = ({
  title,
  desc,
  icon,
}) => (
  <div className="panel-interactive panel p-4">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-sm font-semibold text-gray-200">{title}</div>
    <div className="text-[12px] text-gray-400 mt-1 leading-relaxed">{desc}</div>
  </div>
);

const Step: React.FC<{ n: number; title: string; desc: string }> = ({
  n,
  title,
  desc,
}) => (
  <li className="panel p-4">
    <div className="text-[11px] text-accent/80 font-semibold mb-1">
      Step {n}
    </div>
    <div className="text-sm font-semibold text-gray-200">{title}</div>
    <div className="text-[12px] text-gray-400 mt-1 leading-relaxed">{desc}</div>
  </li>
);

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
      await openCheckout({
        amountPaise: p.pricePaise,
        name: p.title,
        description: "AlgoHabit Pro",
        plan_key: p.key,
        user_id: user.id,
      });
      window.location.assign("/app");
    } catch {}
  };

  return (
    <div className="panel-interactive relative p-6 shadow-2xl rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/90 ring-1 ring-gray-800 transform transition-all duration-300">
      {/* top-right badge if offer/best */}
      {p.best && (
        // badge sits slightly outside the card corner so it doesn't block content
        <div className="absolute right-4 -top-3 z-10">
          <div className="badge badge-accent">Best value</div>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-extrabold text-white">{p.title}</h3>
            {/* subtle subtitle */}
          </div>
          <div className="text-sm text-gray-300 mt-1">{p.sub}</div>
        </div>
        <div className="text-3xl sm:text-4xl font-extrabold text-white">
          {formatINR(p.pricePaise)}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-gray-300 mb-4">
          Limited-time offer: upgrade now and save.
        </div>
        <button
          className="btn btn-primary w-full text-sm shadow-md transition-transform duration-200 hover:scale-[1.02]"
          onClick={start}
          aria-label={`Subscribe to ${p.title}`}
        >
          Upgrade to Pro
        </button>
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-white">What you get</h4>
        <ul className="mt-3 space-y-2 text-[14px] text-gray-200">
          {(((p as any).features ?? DEFAULT_PLAN_FEATURES) as string[])
            .slice(0, 8)
            .map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-accent mt-0.5 flex-shrink-0">●</span>
                <div className="text-gray-300 leading-tight">{f}</div>
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
}> = ({ selectedKey, onSelect }) => {
  const user = getActiveUser();

  const handleBuy = async (p: (typeof _plans)[number]) => {
    if (!user) return window.location.assign("/auth");
    try {
      await openCheckout({
        amountPaise: p.pricePaise,
        name: p.title,
        description: "AlgoHabit Pro",
        plan_key: p.key,
        user_id: user.id,
      });
      window.location.assign("/app");
    } catch {}
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {_plans.map((p) => {
        const active = selectedKey === p.key;
        return (
          <div
            key={p.key}
            onClick={() => onSelect?.(p.key)}
            className={`panel p-4 rounded-xl transition-shadow duration-200 cursor-pointer relative ${
              active
                ? "border border-accent/60 bg-gray-900/80 shadow-sm"
                : "border border-transparent bg-gray-900/40 hover:border-accent/40 hover:shadow-lg"
            }`}
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
                className="pointer-events-none absolute -inset-px rounded-xl border border-accent/60 z-20"
                aria-hidden
              />
            )}
            <div className="relative">
              {p.best && (
                // badge placed slightly outside the corner so it sits on the card edge
                <div className="absolute -right-3 -top-3 z-10">
                  <div className="text-xs px-2 py-1 rounded bg-amber-600 text-amber-50 font-semibold shadow-sm">
                    Best 10% off
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-100">
                  {p.title}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-gray-100">
                  {formatINR(p.pricePaise)}
                </div>
                <div className="text-[12px] text-gray-400">{p.sub}</div>
              </div>
              {/* small cards intentionally have no CTA button — selection happens by clicking the card; purchase from main card */}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
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
      <header className="relative border-b border-gray-800/60">
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
              className="btn btn-ghost !px-2 !py-1.5"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Features
            </button>
            <button
              className="btn btn-ghost !px-2 !py-1.5"
              onClick={() =>
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How it works
            </button>
            <button
              className="btn btn-ghost !px-2 !py-1.5"
              onClick={() =>
                document
                  .getElementById("testimonials")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Testimonials
            </button>
            <button
              className="btn btn-ghost !px-2 !py-1.5"
              onClick={() =>
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              FAQ
            </button>
          </nav>
          <div className="ml-2 flex items-center gap-2">
            <button
              className="btn btn-ghost text-[11px] hidden sm:inline-flex"
              onClick={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Pricing
            </button>
            <button
              className="btn btn-primary text-[11px]"
              onClick={() => navigate(user ? "/app" : "/auth")}
            >
              {user ? "Continue" : "Get Started"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 pt-12 pb-10 sm:pt-16 sm:pb-12 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100">
                Build a consistent DSA routine in 8 focused weeks
              </h1>
              <p className="text-gray-400 text-sm sm:text-[15px] leading-relaxed">
                AlgoHabit turns practice into a habit. Follow a clear 8-week
                roadmap, track Weekly Topics, keep a streak, and level up with
                measurable XP. Designed for focus, motivation, and momentum.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(user ? "/app" : "/auth")}
                >
                  {user ? "Open App" : "Start Now"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    const el = document.getElementById("features");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  See how it works
                </button>
              </div>
              <ul className="text-[12px] text-gray-400 grid grid-cols-2 gap-2 pt-3">
                <li>• 8-Week Roadmap</li>
                <li>• Weekly Topics</li>
                <li>• Streak heatmap</li>
                <li>• XP levels</li>
                <li>• Focus mode</li>
                <li>• Reminders</li>
              </ul>
            </div>
            <div className="panel p-4">
              <Suspense fallback={null}>
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
            />
            <FeatureCard
              title="Weekly Topics"
              desc="Curated topics per week, track completion and add notes to retain concepts."
              icon="✅"
            />
            <FeatureCard
              title="Habit Streak"
              desc="See your momentum build with a GitHub-like heatmap of your daily activity."
              icon="🔥"
            />
            <FeatureCard
              title="Levels & XP"
              desc="Earn XP for progress and hit new levels to stay motivated."
              icon="🏆"
            />
            <FeatureCard
              title="Focus & Reminders"
              desc="A distraction-light focus mode and gentle reminders keep you on track."
              icon="🎯"
            />
            <FeatureCard
              title="Share Progress"
              desc="Make your profile public (optional) and share your journey with friends."
              icon="🌐"
            />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="px-6 pb-14 max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            How it works
          </h2>
          <ol className="grid md:grid-cols-3 gap-5 counter-reset">
            <Step
              n={1}
              title="Pick your week"
              desc="Follow the roadmap and choose the current week to focus your learning."
            />
            <Step
              n={2}
              title="Practice topics"
              desc="Work through curated topics. Mark progress, add quick notes, and earn XP."
            />
            <Step
              n={3}
              title="Review & reflect"
              desc="Use Weekly Review and reminders to reinforce learning and plan next steps."
            />
          </ol>
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
        <section id="pricing" className="px-6 pb-16 max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-100 mb-2 text-left">
            Pricing
          </h2>
          <div className="text-sm text-gray-400 mb-6 max-w-3xl text-left">
            Build a consistent habit — pick a plan that fits your schedule.
            Upgrade now and save with limited-time offers.
          </div>

          {/* Pricing cards layout */}
          <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
            {/* Left: Highlighted main plan (dynamic) */}
            <div className="w-full max-w-md mb-6 lg:mb-0">
              <PlanArea selectedKey={selectedKey} />
            </div>

            {/* Right: Other plans grid */}
            <div className="w-full max-w-2xl">
              <SmallPlansGridWrapper
                selectedKey={selectedKey}
                onSelect={(k) => setSelectedKey(k)}
              />
            </div>
          </div>

          <div className="text-[12px] text-gray-500 mt-8 text-center">
            Prices shown in INR.{" "}
            <span className="text-gray-400">
              Secure checkout via Razorpay • Cancel anytime
            </span>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 pb-16 max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">FAQ</h2>
          <div className="space-y-2">
            <FAQItem
              q="Is AlgoHabit free?"
              a="AlgoHabit requires a Pro subscription. You can browse the landing pages, but the app is Pro-only."
            />
            <FAQItem
              q="Do I need an account?"
              a="You can explore locally, but creating an account lets you sync and share your profile."
            />
            <FAQItem
              q="What if I miss days?"
              a="No problem. The roadmap is flexible. Just pick up where you left off and keep the momentum going."
            />
            <FAQItem
              q="Can I share my progress?"
              a="Yes. You can enable a public profile with your username and share your streak and activity."
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
              onClick={() => navigate(user ? "/app" : "/auth")}
            >
              {user ? "Continue" : "Get Started"}
            </button>
          </div>
        </section>
      </main>

      <footer className="text-xs text-gray-500 px-6 py-4 border-t border-gray-800/60 bg-gray-950/60 backdrop-blur">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <span>© {new Date().getFullYear()} AlgoHabit.</span>
          <span className="sm:ml-auto flex flex-wrap gap-x-4 gap-y-2">
            <Link className="hover:text-gray-300" to="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-gray-300" to="/terms">
              Terms
            </Link>
            <Link className="hover:text-gray-300" to="/refunds">
              Cancellation & Refunds
            </Link>
            <Link className="hover:text-gray-300" to="/shipping">
              Shipping
            </Link>
            <Link className="hover:text-gray-300" to="/contact">
              Contact
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
};

// Old SmallPlansGrid removed; replaced by SmallPlansGridWrapper above.
