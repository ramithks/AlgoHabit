import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getActiveUser } from "../localAuth";
import { openCheckout } from "../payments/razorpay";
import { plans as allPlans } from "../payments/plans";

const formatINR = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN")}`;

export const PricingPage: React.FC = () => {
  const nav = useNavigate();
  const user = getActiveUser();

  const startCheckout = async (plan: (typeof allPlans)[number]) => {
    if (!user) {
      nav("/auth");
      return;
    }
    const amount = plan.pricePaise;
    try {
      await openCheckout({
        amountPaise: amount,
        name: plan.title,
        description: "AlgoHabit Pro",
        plan_key: plan.key,
        user_id: user.id,
      });
      nav("/app");
    } catch (e) {
      // no-op on cancel
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-gray-800/60">
        <div className="px-6 py-4 max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold text-gray-100">
            Upgrade to Pro
          </h1>
          <div className="ml-auto text-[11px] text-gray-400">
            No ads • Full roadmap • Priority updates
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <div className="panel-alt">
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              Keep your streak alive
            </h2>
            <p className="text-sm text-gray-300">
              Go Pro to unlock the full 8-week roadmap, advanced stats, and
              motivating reminders. Support ongoing improvements and get the
              best learning flow.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-5">
          {allPlans.map((p) => (
            <div
              key={p.key}
              className={`panel p-0 ${p.best ? "ring-2 ring-accent" : ""}`}
            >
              <div className="px-4 py-3 flex items-baseline justify-between">
                <h3 className="text-gray-100 font-semibold">{p.title}</h3>
                {p.best && (
                  <span className="badge badge-accent">Best Value</span>
                )}
              </div>
              <div className="px-4">
                <div className="text-2xl font-bold text-gray-100">
                  {formatINR(p.pricePaise)}
                </div>
                <div className="text-[11px] text-gray-400 mb-4">{p.sub}</div>
              </div>
              <div className="px-4 pb-4">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => startCheckout(p)}
                >
                  {user ? "Continue" : "Login to continue"}
                </button>
              </div>
            </div>
          ))}
        </section>

        <p className="text-[11px] text-gray-500 mt-6">
          Prices include taxes where applicable. Managed by Razorpay. You can
          cancel anytime.
        </p>
      </main>
    </div>
  );
};

export default PricingPage;
