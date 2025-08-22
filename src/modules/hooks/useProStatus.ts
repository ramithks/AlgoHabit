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

  React.useEffect(() => {
    let cancelled = false;
    const uid = getActiveUser()?.id;
    if (!uid) {
      setIsPro(false);
      setSubInfo(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const [pro, sub] = await Promise.all([
        fetchProStatus(uid),
        fetchActiveSubscription(uid),
      ]);
      if (!cancelled) {
        setIsPro(pro);
        setSubInfo(sub);
        setLoading(false);
      }
    })();
    const t = setInterval(async () => {
      if (cancelled) return;
      const uid2 = getActiveUser()?.id;
      if (!uid2) return;
      const pro = await fetchProStatus(uid2);
      if (!cancelled) setIsPro(pro);
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return { isPro, loading, subInfo } as const;
}
