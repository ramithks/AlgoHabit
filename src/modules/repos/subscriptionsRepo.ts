import { supabase, getSupabase } from "../../lib/supabaseClient";
import { openCheckout } from "../payments/razorpay";
import { plans } from "../payments/plans";

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
    console.log("fetchProStatus: Using cached value", proCache.value);
    return proCache.value;
  }
  
  try {
    console.log("fetchProStatus: Calling is_pro RPC for user", userId);
    
    // Try the RPC function first
    const { data, error } = await (supabase as any).rpc("is_pro", {
      uid: userId,
    });
    
    if (error) {
      console.warn("fetchProStatus: is_pro rpc error", error);
      
      // Fallback: check active subscriptions directly
      console.log("fetchProStatus: Trying fallback method");
      const subscription = await fetchActiveSubscription(userId);
      const isPro = subscription !== null && subscription.status === "active";
      
      console.log("fetchProStatus: Fallback result", { 
        subscription, 
        isPro,
        plan: subscription?.plan,
        plan_label: subscription?.plan_label,
        end_date: subscription?.end_date,
        is_lifetime: subscription?.plan === 'lifetime'
      });
      
      proCache = { uid: userId, value: isPro, ts: Date.now() };
      return isPro;
    }
    
    const val = Boolean(data);
    console.log("fetchProStatus: RPC result", { data, val });
    
    proCache = { uid: userId, value: val, ts: Date.now() };
    return val;
  } catch (e) {
    console.error("fetchProStatus: Exception", e);
    
    // Fallback: check active subscriptions directly
    try {
      console.log("fetchProStatus: Trying fallback method after exception");
      const subscription = await fetchActiveSubscription(userId);
      const isPro = subscription !== null && subscription.status === "active";
      
      console.log("fetchProStatus: Fallback result after exception", { 
        subscription, 
        isPro,
        plan: subscription?.plan,
        plan_label: subscription?.plan_label,
        end_date: subscription?.end_date,
        is_lifetime: subscription?.plan === 'lifetime'
      });
      
      proCache = { uid: userId, value: isPro, ts: Date.now() };
      return isPro;
    } catch (fallbackError) {
      console.error("fetchProStatus: Fallback also failed", fallbackError);
      return false;
    }
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
    
    console.log("fetchActiveSubscription: result", { 
      userId, 
      data, 
      error,
      plan: data?.plan,
      plan_label: data?.plan_label,
      end_date: data?.end_date,
      status: data?.status,
      is_active: data?.is_active
    });
    
    return (data as ActiveSubscription) || null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("v_active_subscriptions exception", e);
    return null;
  }
}

export async function changePlan(
  userId: string,
  newPlan: string
): Promise<boolean> {
  const map: Record<string, string> = {
    weekly: "pro_weekly",
    monthly: "pro_monthly",
    quarterly: "pro_quarterly",
    semiannual: "pro_semiannual",
    yearly: "pro_yearly",
    biennial: "pro_biennial",
    lifetime: "pro_lifetime",
  };
  const plan_key = map[newPlan] || "pro_monthly";
  const plan = plans.find((p) => p.key === plan_key);
  const amountPaise = plan?.pricePaise || 9900;
  await openCheckout({
    amountPaise,
    plan_key,
    user_id: userId,
    name: "AlgoHabit Pro",
    description: `Upgrade: ${plan?.title || "Pro"}`,
    notes: { action: "change_plan" },
  });
  return true;
}

// Check if user needs to complete email confirmation
export async function checkEmailConfirmation(email: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email === email) {
      return user.email_confirmed_at !== null;
    }
    return false;
  } catch {
    return false;
  }
}

// Check if user should see onboarding
export function shouldShowOnboarding(): boolean {
  const hasSeenOnboarding = localStorage.getItem("dsa-onboarding-seen");
  return !hasSeenOnboarding;
}

// Mark onboarding as completed
export function markOnboardingComplete(): void {
  localStorage.setItem("dsa-onboarding-seen", "true");
}


