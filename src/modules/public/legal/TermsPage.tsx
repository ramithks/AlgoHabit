import React from "react";
import { Link } from "react-router-dom";

export const TermsPage: React.FC = () => {
  const LAST_UPDATED = "23 Aug 2025";

  return (
    <PageShell title="Terms and Conditions">
      {/* Back to Home */}
      <div className="mb-3">
        <Link to="/" className="text-xs text-accent hover:underline">
          ← Home
        </Link>
      </div>
      {/* Hero / Title */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100">
          Terms and Conditions
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mobile TOC */}
        <nav className="lg:hidden -mx-1 mb-1 flex gap-2 overflow-x-auto no-scrollbar px-1">
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#intro">
            Intro
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#service">
            Service
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#accounts">
            Accounts
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#payments">
            Payments
          </a>
          <a
            className="btn btn-ghost !px-3 !py-1.5 text-xs"
            href="#cancellations"
          >
            Cancellations
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#acceptable">
            Acceptable Use
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#ip">
            IP
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#warranty">
            Warranty
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#liability">
            Liability
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#changes">
            Changes
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#contact">
            Contact
          </a>
        </nav>
        {/* Sidebar TOC */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="panel p-4 sticky top-4 space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">
              On this page
            </div>
            <div className="grid gap-1 text-[13px]">
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#intro"
              >
                Introduction
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#service"
              >
                Service
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#accounts"
              >
                Accounts
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#payments"
              >
                Payments
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#cancellations"
              >
                Cancellations
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#acceptable"
              >
                Acceptable Use
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#ip"
              >
                Intellectual Property
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#warranty"
              >
                Warranty Disclaimer
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#liability"
              >
                Limitation of Liability
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#changes"
              >
                Changes
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#contact"
              >
                Contact
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <article className="lg:col-span-9">
          <div className="panel p-6 sm:p-7 divide-y divide-gray-800/60">
            <section id="intro" className="pt-1 pb-6 sm:pb-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Introduction
              </h2>
              <p className="text-sm text-gray-300">
                Welcome to AlgoHabit. By accessing or using our website and
                application, you agree to these Terms and Conditions. If you do
                not agree, please do not use the Service.
              </p>
            </section>

            <section id="service" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Service
              </h2>
              <p className="text-sm text-gray-300">
                AlgoHabit provides a learning companion for data structures and
                algorithms. We may update features, content, and pricing at any
                time.
              </p>
            </section>

            <section id="accounts" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Accounts
              </h2>
              <p className="text-sm text-gray-300">
                You are responsible for maintaining the confidentiality of your
                account and for all activities under it. You must provide
                accurate information and promptly update it.
              </p>
            </section>

            <section id="payments" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Payments
              </h2>
              <p className="text-sm text-gray-300">
                Subscriptions are billed in advance on a recurring basis
                according to the plan you select. Taxes may apply. By
                subscribing you authorize us and our payment processor to charge
                your payment method.
              </p>
            </section>

            <section id="cancellations" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Cancellations
              </h2>
              <p className="text-sm text-gray-300">
                You can cancel at any time; access remains available until the
                end of the current billing period. For refunds, see our{" "}
                <Link className="text-accent hover:underline" to="/refunds">
                  Cancellation & Refunds Policy
                </Link>
                .
              </p>
            </section>

            <section id="acceptable" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Acceptable Use
              </h2>
              <p className="text-sm text-gray-300">
                Do not misuse the Service, attempt to disrupt it, or infringe on
                the rights of others. We may suspend or terminate accounts that
                violate these terms.
              </p>
            </section>

            <section id="ip" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Intellectual Property
              </h2>
              <p className="text-sm text-gray-300">
                All content, trademarks, and logos are the property of their
                respective owners. You receive a limited, non-transferable
                license to use the Service for personal, non-commercial
                purposes.
              </p>
            </section>

            <section id="warranty" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Warranty Disclaimer
              </h2>
              <p className="text-sm text-gray-300">
                The Service is provided “as is” without warranties of any kind.
                We do not guarantee specific outcomes or uninterrupted
                availability.
              </p>
            </section>

            <section id="liability" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Limitation of Liability
              </h2>
              <p className="text-sm text-gray-300">
                To the maximum extent permitted by law, AlgoHabit will not be
                liable for any indirect, incidental, or consequential damages
                arising from your use of the Service.
              </p>
            </section>

            <section id="changes" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Changes
              </h2>
              <p className="text-sm text-gray-300">
                We may modify these terms at any time. Continued use of the
                Service after changes constitutes acceptance of the updated
                terms.
              </p>
            </section>

            <section id="contact" className="pt-6 sm:pt-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Contact
              </h2>
              <p className="text-sm text-gray-300">
                Questions about these terms? Visit the{" "}
                <Link className="text-accent hover:underline" to="/contact">
                  Contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </div>
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
