import React from "react";
import { Link } from "react-router-dom";

export const ContactPage: React.FC = () => {
  const SUPPORT_EMAIL = "ramithgowdakundoor123@gmail.com";
  const ADDRESS =
    "Bettagere Village, Tekkur Post, Sringeri, Chikkamagaluru - 577139";
  const LAST_UPDATED = "23 Aug 2025";

  return (
    <PageShell title="Contact Us">
      {/* Back to Home */}
      <div className="mb-3">
        <Link to="/" className="text-xs text-accent hover:underline">
          ← Home
        </Link>
      </div>
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100">
          Contact Us
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Updated: {LAST_UPDATED}
        </p>
      </div>
      <p className="mb-4 text-sm text-gray-300 text-center">
        We’re here to help. Reach out and we’ll get back within 2–3 business
        days.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <form
          className="panel p-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const name =
              (form.querySelector('input[name="name"]') as HTMLInputElement)
                ?.value || "";
            const email =
              (form.querySelector('input[name="email"]') as HTMLInputElement)
                ?.value || "";
            const message =
              (
                form.querySelector(
                  'textarea[name="message"]'
                ) as HTMLTextAreaElement
              )?.value || "";
            const subject = encodeURIComponent(
              `Support: ${name || "New message"}`
            );
            const body = encodeURIComponent(
              `From: ${name}\nEmail: ${email}\n\n${message}`
            );
            window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
          }}
        >
          <div>
            <label className="text-[12px] text-gray-300">Name</label>
            <input
              name="name"
              className="w-full mt-1 bg-gray-900 border border-gray-800 rounded px-2 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              className="w-full mt-1 bg-gray-900 border border-gray-800 rounded px-2 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-300">Message</label>
            <textarea
              name="message"
              className="w-full mt-1 bg-gray-900 border border-gray-800 rounded px-2 py-2 text-sm"
              rows={5}
              required
            />
          </div>
          <button className="btn btn-primary text-[12px]" type="submit">
            Send
          </button>
          <div className="text-[11px] text-gray-500">
            Submitting opens your mail client with the details.
          </div>
        </form>
        <div className="panel p-4 text-[12px] text-gray-300 space-y-2">
          <div>
            <div className="text-gray-400">Email</div>
            <a
              className="text-accent hover:underline"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <div className="text-gray-400">Address</div>
            <div>{ADDRESS}</div>
          </div>
          <div className="text-gray-500 text-xs">
            For billing queries, include your registered email and payment
            reference.
          </div>
        </div>
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
