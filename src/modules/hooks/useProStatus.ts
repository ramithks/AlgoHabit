import React from "react";
import { getActiveUser } from "../localAuth";
import {
  fetchProStatus,
  fetchActiveSubscription,
} from "../repos/subscriptionsRepo";

export function useProStatus() {
  const [isPro, setIsPro] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState(true);
  const [subInfo, setSubInfo] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const uid = getActiveUser()?.id;
    
    console.log("useProStatus: Checking for user", uid);
    
    if (!uid) {
      console.log("useProStatus: No user found");
      setIsPro(false);
      setSubInfo(null);
      setLoading(false);
      return;
    }
    
    (async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("useProStatus: Fetching Pro status for user", uid);
        
        const [pro, sub] = await Promise.all([
          fetchProStatus(uid),
          fetchActiveSubscription(uid),
        ]);
        
        console.log("useProStatus: Results", { pro, sub });
        
        if (!cancelled) {
          setIsPro(pro);
          setSubInfo(sub);
          setLoading(false);
        }
      } catch (err) {
        console.error("useProStatus: Error fetching Pro status", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to check Pro status");
          setLoading(false);
        }
      }
    })();
    
    const t = setInterval(async () => {
      if (cancelled) return;
      const uid2 = getActiveUser()?.id;
      if (!uid2) return;
      try {
        const pro = await fetchProStatus(uid2);
        if (!cancelled) setIsPro(pro);
      } catch (err) {
        console.error("useProStatus: Error in interval check", err);
      }
    }, 60_000);
    
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return { isPro, loading, subInfo, error } as const;
}
