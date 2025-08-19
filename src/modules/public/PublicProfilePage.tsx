import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { useParams, Link } from "react-router-dom";
import { getProfileByUsername } from "../repos/profilesRepo";
import { supabase } from "../../lib/supabaseClient";

const StreakHeatmap = lazy(() =>
  import("../components/StreakHeatmap").then((m) => ({
    default: m.StreakHeatmap,
  }))
);

export const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<{
    xp: number;
    streak: number;
    last_active?: string | null;
  } | null>(null);
  const [activity, setActivity] = useState<string[]>([]);
  const [copiedHeader, setCopiedHeader] = useState(false);

  const displayName = useMemo(
    () => profile?.full_name || `@${username}`,
    [profile, username]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!username) return;
      setLoading(true);
      setError(null);
      try {
        // eslint-disable-next-line no-console
        console.debug("PublicProfilePage load start", { username });
        let p = await getProfileByUsername(username);
        // eslint-disable-next-line no-console
        console.debug("PublicProfilePage profile lookup", p);
        if (!p) {
          // Try alias lookup and redirect
          const { data: alias } = await (supabase as any)
            .from("username_aliases")
            .select("user_id")
            .ilike("username", username)
            .maybeSingle();
          // eslint-disable-next-line no-console
          console.debug("PublicProfilePage alias lookup", alias);
          if (alias?.user_id) {
            const { data: prof } = await (supabase as any)
              .from("profiles")
              .select("id,username,is_public,full_name,updated_at")
              .eq("id", alias.user_id)
              .maybeSingle();
            // eslint-disable-next-line no-console
            console.debug("PublicProfilePage alias profile", prof);
            if (prof?.username) {
              // Navigate to canonical path
              // eslint-disable-next-line no-console
              console.debug(
                "PublicProfilePage redirect to canonical",
                prof.username
              );
              window.location.replace(
                `${location.origin}${import.meta.env.BASE_URL || "/"}u/${
                  prof.username
                }`
              );
              return;
            }
          }
        }
        if (!p || !p.is_public) throw new Error("Profile not found");
        if (!mounted) return;
        setProfile(p);
        // Fetch metrics
        const { data: m } = await supabase
          .from("user_metrics")
          .select("xp,streak,last_active")
          .eq("user_id", p.id)
          .maybeSingle();
        if (m)
          setMetrics({
            xp: m.xp ?? 0,
            streak: m.streak ?? 0,
            last_active: m.last_active ?? null,
          });
        // Fetch activity map
        const { data: a } = await supabase
          .from("activity_log")
          .select("day")
          .eq("user_id", p.id)
          .order("day", { ascending: true });
        setActivity((a ?? []).map((r: any) => r.day));
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error("PublicProfilePage load error", e);
        if (!mounted) return;
        setError(e?.message || "Error loading profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [username]);

  // Update basic meta tags for share previews (must be before any returns)
  useEffect(() => {
    const title = `${displayName} • AlgoHabit`;
    const desc = `View ${displayName}'s DSA streak and XP on AlgoHabit.`;
    document.title = title;
    const ensure = (
      selector: string,
      attr: "name" | "property",
      key: string,
      content: string
    ) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const ensureLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };
    ensure('meta[name="description"]', "name", "description", desc);
    ensure('meta[property="og:title"]', "property", "og:title", title);
    ensure(
      'meta[property="og:description"]',
      "property",
      "og:description",
      `Check out ${displayName}'s public progress`
    );
    ensure('meta[property="og:type"]', "property", "og:type", "profile");
    ensure(
      'meta[property="twitter:card"]',
      "property",
      "twitter:card",
      "summary"
    );
    const canonical = `${location.origin}${
      import.meta.env.BASE_URL || "/"
    }u/${username}`;
    ensureLink("canonical", canonical);
    ensure(
      'meta[property="og:image"]',
      "property",
      "og:image",
      `${location.origin}${import.meta.env.BASE_URL || "/"}og.png`
    );
  }, [displayName, username]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="text-center space-y-2">
          <div className="text-rose-300">{error}</div>
          <Link to="/" className="text-accent">
            Go home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen p-5 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-gray-200">{displayName}</h1>
          {profile?.username && (
            <span className="text-[12px] text-gray-500">
              @{profile.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profile?.username && (
            <button
              className="text-[11px] px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-800 border border-gray-700 text-gray-300"
              onClick={async () => {
                try {
                  const url = `${location.origin}${
                    import.meta.env.BASE_URL || "/"
                  }u/${profile.username}`;
                  await navigator.clipboard.writeText(url);
                  setCopiedHeader(true);
                  setTimeout(() => setCopiedHeader(false), 1000);
                } catch {}
              }}
              aria-label={copiedHeader ? "Link copied" : "Copy profile link"}
              aria-live="polite"
            >
              {copiedHeader ? "Copied" : "Copy link"}
            </button>
          )}
          <Link to="/" className="btn btn-ghost">
            AlgoHabit
          </Link>
        </div>
      </header>

      <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-2">
        <h2 className="text-sm font-semibold text-gray-300">Profile</h2>
        <div className="text-[12px] text-gray-300 flex flex-wrap gap-4">
          <span>
            Streak: <span className="text-accent">{metrics?.streak ?? 0}d</span>
          </span>
          <span>
            XP: <span className="text-accent">{metrics?.xp ?? 0}</span>
          </span>
          {profile?.created_at && (
            <span>
              Member since: {new Date(profile.created_at).toLocaleDateString()}
            </span>
          )}
          {metrics?.last_active && (
            <span>
              Last active: {new Date(metrics.last_active).toLocaleDateString()}
            </span>
          )}
        </div>
        {profile?.updated_at && (
          <div className="text-[11px] text-gray-500">
            Updated: {new Date(profile.updated_at).toLocaleString()}
          </div>
        )}
      </section>

      <Suspense fallback={null}>
        <StreakHeatmap days={activity ?? []} />
      </Suspense>
    </div>
  );
};
