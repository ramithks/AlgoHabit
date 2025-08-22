// Minimal Razorpay Checkout launcher. For production, create orders server-side
// and verify signatures on backend. This is a client-only demo to unblock flow.

import { supabase } from "../../lib/supabaseClient";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export type CheckoutOptions = {
  amountPaise: number; // in paise
  name?: string;
  description?: string;
  email?: string | null;
  contact?: string | null;
  notes?: Record<string, string>;
};

export function getRazorpayKey() {
  // In Vite, env for client must be prefixed with VITE_
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
  if (!key) {
    // eslint-disable-next-line no-console
    console.warn("Missing VITE_RAZORPAY_KEY_ID in environment");
  }
  return key || "";
}

async function createOrder(plan_key: string, user_id: string) {
  const { data, error } = await (supabase as any).functions.invoke(
    "create-order",
    {
      body: { plan_key, user_id },
    }
  );
  if (error) throw new Error(error.message || "order_failed");
  return data as { order_id: string; amount: number; currency: string };
}

async function verifyPayment(payload: {
  order_id: string;
  payment_id: string;
  signature: string;
  plan_key: string;
  user_id: string;
  amount_paise: number;
}) {
  const { error } = await (supabase as any).functions.invoke("verify-payment", {
    body: payload,
  });
  if (error) throw new Error(error.message || "verify_failed");
}

export async function openCheckout(
  opts: CheckoutOptions & { plan_key: string; user_id: string }
): Promise<void> {
  const key_id = getRazorpayKey();
  if (!key_id) throw new Error("Razorpay key missing");
  // Ensure script is available
  await ensureRazorpayScript();

  // Create order server-side
  const order = await createOrder(opts.plan_key, opts.user_id);

  return new Promise((resolve, reject) => {
    try {
      const rzp = new window.Razorpay({
        key: key_id,
        amount: order.amount,
        currency: "INR",
        name: opts.name || "AlgoHabit Pro",
        description: opts.description || "Subscription",
        notes: opts.notes || {},
        order_id: order.order_id,
        prefill: {
          email: opts.email || undefined,
          contact: opts.contact || undefined,
        },
        handler: async function (response: any) {
          try {
            await verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan_key: opts.plan_key,
              user_id: opts.user_id,
              amount_paise: order.amount,
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        modal: {
          ondismiss: function () {
            reject(new Error("Payment cancelled"));
          },
        },
        theme: { color: "#8b5cf6" },
      });
      rzp.open();
    } catch (e) {
      reject(e);
    }
  });
}

function ensureRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  // If the script tag is present but async, wait a bit
  return new Promise((resolve) => setTimeout(resolve, 300));
}
