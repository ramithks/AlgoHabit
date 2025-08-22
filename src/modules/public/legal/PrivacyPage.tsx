import React from "react";
import { Link } from "react-router-dom";

export const PrivacyPage: React.FC = () => {
  const SUPPORT_EMAIL = "ramithgowdakundoor123@gmail.com";
  const ADDRESS =
    "Bettagere Village, Tekkur Post, Sringeri, Chikkamagaluru - 577139";
  const LAST_UPDATED = "23 Aug 2025";

  return (
    <PageShell title="Privacy Policy">
      {/* Back to Home */}
      <div className="mb-3">
        <Link to="/" className="text-xs text-accent hover:underline">
          ← Home
        </Link>
      </div>
      {/* Hero / Title */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      {/* Layout: Sidebar TOC + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mobile TOC */}
        <nav className="lg:hidden -mx-1 mb-1 flex gap-2 overflow-x-auto no-scrollbar px-1">
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#scope">
            Overview
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#collect">
            Data we collect
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#use">
            How we use
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#sharing">
            Sharing
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#security">
            Security
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#retention">
            Retention
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#rights">
            Your rights
          </a>
          <a className="btn btn-ghost !px-3 !py-1.5 text-xs" href="#children">
            Children
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
                href="#scope"
              >
                Overview
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#collect"
              >
                Data we collect
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#use"
              >
                How we use
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#legal"
              >
                Legal bases
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#sharing"
              >
                Sharing
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#retention"
              >
                Retention
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#security"
              >
                Security
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#rights"
              >
                Your rights
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#intl"
              >
                International transfers
              </a>
              <a
                className="block px-2 py-1.5 rounded hover:bg-gray-800/40"
                href="#children"
              >
                Children
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
            <section id="scope" className="pt-1 pb-6 sm:pb-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Overview
              </h2>
              <p className="text-sm text-gray-300">
                This Privacy Policy explains what data AlgoHabit collects, how
                it is used and shared, and your choices. It applies to our
                website and app (the “Service”).
              </p>
            </section>

            <section id="collect" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3">
                Data we collect
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                <li>
                  <span className="font-medium text-gray-200">
                    Account data:
                  </span>{" "}
                  email and profile details (e.g., username) to authenticate
                  you.
                </li>
                <li>
                  <span className="font-medium text-gray-200">
                    App activity:
                  </span>{" "}
                  topics, progress, notes, streaks, timestamps, and related
                  metadata.
                </li>
                <li>
                  <span className="font-medium text-gray-200">
                    Device/technical data:
                  </span>{" "}
                  approximate location (from IP), device and browser
                  information, diagnostics.
                </li>
                <li>
                  <span className="font-medium text-gray-200">
                    Cookies/local storage:
                  </span>{" "}
                  used for login sessions, preferences, and app functionality.
                </li>
                <li>
                  <span className="font-medium text-gray-200">Payments:</span>{" "}
                  for paid features, billing is handled by our payment provider;
                  we store minimal references (e.g., customer/subscription IDs).
                </li>
              </ul>
            </section>

            <section id="use" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3">
                How we use information
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                <li>
                  Provide and operate the Service, including syncing your
                  progress and calculating XP.
                </li>
                <li>
                  Personalize your experience and surface relevant roadmap
                  content.
                </li>
                <li>
                  Maintain security, prevent abuse, and improve
                  reliability/performance.
                </li>
                <li>
                  Send transactional communications and respond to support
                  requests.
                </li>
                <li>
                  Comply with legal obligations and enforce our Terms and
                  Conditions.
                </li>
              </ul>
            </section>

            <section id="legal" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Legal bases (EEA/UK)
              </h2>
              <p className="text-sm text-gray-300">
                Where applicable, we process your information under these legal
                bases: (i) performance of a contract (to provide the Service);
                (ii) legitimate interests (to secure and improve the Service);
                (iii) consent (where required, such as certain analytics); (iv)
                compliance with legal obligations.
              </p>
            </section>

            <section id="sharing" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Sharing and processors
              </h2>
              <p className="text-sm text-gray-300">
                We do not sell your personal data. We share data only with
                trusted service providers who process it on our behalf (e.g.,
                hosting, authentication, analytics, payments) under appropriate
                agreements, or when required by law.
              </p>
            </section>

            <section id="retention" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Data retention
              </h2>
              <p className="text-sm text-gray-300">
                We retain information as long as needed to provide the Service
                and for legitimate business or legal purposes. You may request
                deletion of certain data, subject to applicable laws and our
                record-keeping obligations.
              </p>
            </section>

            <section id="security" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Security
              </h2>
              <p className="text-sm text-gray-300">
                We implement industry-standard safeguards to protect your data.
                However, no method of transmission or storage is completely
                secure. You are responsible for keeping your account credentials
                confidential.
              </p>
            </section>

            <section id="rights" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Your rights and choices
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                <li>
                  Access or update your profile and preferences from within the
                  app.
                </li>
                <li>
                  Request a copy or deletion of your data by contacting us.
                </li>
                <li>Control cookies via your browser settings.</li>
                <li>
                  Disable public sharing of your profile at any time in
                  settings.
                </li>
              </ul>
            </section>

            <section id="intl" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                International transfers
              </h2>
              <p className="text-sm text-gray-300">
                Your information may be stored and processed in countries other
                than your own. Where required, we use appropriate safeguards
                such as standard contractual clauses or rely on adequacy
                decisions to protect your data.
              </p>
            </section>

            <section id="children" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Children’s privacy
              </h2>
              <p className="text-sm text-gray-300">
                The Service is not directed to children under 13. If you believe
                a child has provided personal data, please contact us so we can
                take appropriate action.
              </p>
            </section>

            <section id="changes" className="py-6 sm:py-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Changes to this policy
              </h2>
              <p className="text-sm text-gray-300">
                We may update this Privacy Policy to reflect changes to our
                practices or for legal and regulatory reasons. We will post the
                updated date above; significant changes may be communicated via
                the app or email.
              </p>
            </section>

            <section id="contact" className="pt-6 sm:pt-7">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">
                Contact us
              </h2>
              <p className="text-sm text-gray-300">
                Email support at{" "}
                <a
                  className="text-accent hover:underline"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                or use the{" "}
                <Link className="text-accent hover:underline" to="/contact">
                  Contact page
                </Link>
                .
              </p>
              <div className="text-[12px] text-gray-400">
                Postal address: {ADDRESS}
              </div>
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
      {/* Minimal header bar to keep visual consistency; main title is rendered inside content */}
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
