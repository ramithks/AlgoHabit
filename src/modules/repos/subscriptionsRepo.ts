import { supabase } from "../../lib/supabaseClient";

export type ActiveSubscription = {
  id: string;
  user_id: string;
  plan: string;
  plan_label: string | null;
  start_date: string;
  end_date: string | null;
  grace_days: number;
  status: string;
  razorpay_subscription_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_state: string;
  currency: string | null;
  amount_paise: number | null;
  created_at: string;
  updated_at: string;
  // View extras
  is_active?: boolean;
  grace_until?: string | null;
};

let proCache: { uid: string; value: boolean; ts: number } | null = null;

export async function fetchProStatus(userId: string): Promise<boolean> {
  if (
    proCache &&
    proCache.uid === userId &&
    Date.now() - proCache.ts < 60_000
  ) {
    return proCache.value;
  }
  try {
    const { data, error } = await (supabase as any).rpc("is_pro", {
      uid: userId,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("is_pro rpc error", error);
      return false;
    }
    const val = Boolean(data);
    proCache = { uid: userId, value: val, ts: Date.now() };
    return val;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("is_pro rpc exception", e);
    return false;
  }
}

export async function fetchActiveSubscription(
  userId: string
): Promise<ActiveSubscription | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("v_active_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("v_active_subscriptions error", error);
      return null;
    }
    return (data as ActiveSubscription) || null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("v_active_subscriptions exception", e);
    return null;
  }
}
