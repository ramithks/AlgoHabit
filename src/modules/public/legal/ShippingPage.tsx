import React from "react";
import { Link } from "react-router-dom";

export const ShippingPage: React.FC = () => {
  const LAST_UPDATED = "23 Aug 2025";

  return (
    <PageShell title="Shipping Policy">
      {/* Back to Home */}
      <div className="mb-3">
        <Link to="/" className="text-xs text-accent hover:underline">
          ← Home
        </Link>
      </div>
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100">
          Shipping Policy
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Last updated: {LAST_UPDATED}
        </p>
      </div>
      <article className="panel p-6 sm:p-7 space-y-4">
        <p className="text-sm text-gray-300">
          AlgoHabit is a digital software service. No physical goods are
          shipped. Upon successful purchase, access to paid features is
          provisioned to your account.
        </p>
        <p className="text-sm text-gray-300">
          If you do not see access within a few minutes, please contact support
          with your payment reference via the{" "}
          <Link className="text-accent hover:underline" to="/contact">
            Contact page
          </Link>
          .
        </p>
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
