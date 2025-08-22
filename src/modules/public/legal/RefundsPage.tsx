import React from "react";
import { Link } from "react-router-dom";

export const RefundsPage: React.FC = () => {
  const LAST_UPDATED = "23 Aug 2025";

  return (
    <PageShell title="Cancellation & Refunds Policy">
      {/* Back to Home */}
      <div className="mb-3">
        <Link to="/" className="text-xs text-accent hover:underline">
          ← Home
        </Link>
      </div>
      {/* Hero / Title */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100">
          Cancellation & Refunds Policy
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <article className="panel p-6 sm:p-7 space-y-6">
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
            Subscriptions
          </h2>
          <p className="text-sm text-gray-300">
            You can cancel your subscription any time from account settings or
            by contacting us. After cancellation, access remains available until
            the end of the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
            Refunds
          </h2>
          <p className="text-sm text-gray-300">
            If you believe you were charged in error or are unsatisfied with the
            Service, contact us within 14 days of purchase. Refund eligibility
            is determined case-by-case and may be prorated when appropriate. We
            aim to respond within 3–5 business days.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
            How to request
          </h2>
          <p className="text-sm text-gray-300">
            Include your registered email, payment reference, and reason. You
            can reach us via the{" "}
            <Link className="text-accent hover:underline" to="/contact">
              Contact page
            </Link>
            .
          </p>
        </section>
      </article>
    </PageShell>
  );
};

const PageShell: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="min-h-screen flex flex-col">
    <header className="border-b border-gray-800/60">
      <div className="h-0.5 w-full gradient-bar opacity-60" />
      <div className="bg-gray-950/60 backdrop-blur px-4 sm:px-6 py-2 text-[0px]">
        <span className="sr-only">{title}</span>
      </div>
    </header>
    <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto">
      {children}
    </main>
    <footer className="text-xs text-gray-500 px-4 sm:px-6 py-4 border-t border-gray-800/60 bg-gray-950/60 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <span>© {new Date().getFullYear()} AlgoHabit</span>
        <span className="flex gap-4">
          <Link className="hover:text-gray-300" to="/">
            Home
          </Link>
          <Link className="hover:text-gray-300" to="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-gray-300" to="/terms">
            Terms
          </Link>
          <Link className="hover:text-gray-300" to="/refunds">
            Refunds
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
