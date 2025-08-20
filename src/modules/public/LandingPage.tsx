import React from "react";
import { useNavigate } from "react-router-dom";
import { getActiveUser } from "../localAuth";
import { StreakHeatmap } from "../components/StreakHeatmap";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getActiveUser();

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
              <StreakHeatmap days={daysSample} />
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

        {/* FAQ */}
        <section id="faq" className="px-6 pb-16 max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">FAQ</h2>
          <div className="space-y-2">
            <FAQItem
              q="Is AlgoHabit free?"
              a="Yes, you can use AlgoHabit free. Some future features may be optional upgrades."
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
        © {new Date().getFullYear()} AlgoHabit. Practice anywhere; build
        momentum every day.
      </footer>
    </div>
  );
};

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
