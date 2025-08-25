// @ts-nocheck
// Supabase Edge Function: verify-payment
// POST { order_id, payment_id, signature, plan_key, user_id }
// Verifies HMAC and writes to Supabase subscriptions & payments.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// Use the global WebCrypto API available in the Edge runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function planToDuration(plan_key: string): {
  months?: number;
  days?: number;
  lifetime?: boolean;
} {
  switch (plan_key) {
    case "pro_weekly":
      return { days: 7 };
    case "pro_monthly":
      return { months: 1 };
    case "pro_quarterly":
      return { months: 3 };
    case "pro_semiannual":
      return { months: 6 };
    case "pro_yearly":
      return { months: 12 };
    case "pro_biennial":
      return { months: 24 };
    case "pro_lifetime":
      return { lifetime: true };
    default:
      return { months: 1 };
  }
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
    "Access-Control-Max-Age": "86400",
  } as const;
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }
  if (req.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders },
    });
  try {
    const { order_id, payment_id, signature, plan_key, user_id, amount_paise } =
      await req.json();
    if (!order_id || !payment_id || !signature || !plan_key || !user_id) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const secret = Deno.env.get("RAZORPAY_SECRET");
    if (!secret)
      return new Response("Missing secret", {
        status: 500,
        headers: { ...corsHeaders },
      });
    const body = `${order_id}|${payment_id}`;
    const subtle = (globalThis as any).crypto?.subtle;
    if (!subtle) {
      return new Response(JSON.stringify({ error: "webcrypto_unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const key = await subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    const expected = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (expected !== signature) {
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!; // auto-injected by Supabase
    const supabaseKey = Deno.env.get("SERVICE_ROLE_KEY")!; // set this secret in Supabase (custom name)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert payment record
    await supabase.from("subscription_payments").insert({
      user_id,
      amount_paise: amount_paise || null,
      currency: "INR",
      status: "success",
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id,
    });

    // Upsert subscription
    const dur = planToDuration(plan_key);
    const start = new Date();
    let end: Date | null = null;
    if (dur.lifetime) {
      end = null;
    } else if (dur.months) {
      end = new Date(start);
      end.setMonth(end.getMonth() + dur.months);
    } else if (dur.days) {
      end = new Date(start);
      end.setDate(end.getDate() + dur.days);
    }

    // Use upsert to prevent duplicate subscriptions
    await supabase.from("subscriptions").upsert(
      {
        user_id,
        plan: plan_key.replace("pro_", "") as any,
        plan_label: plan_key,
        start_date: start.toISOString(),
        end_date: end ? end.toISOString() : null,
        status: "active",
        razorpay_order_id: order_id,
        razorpay_payment_id: payment_id,
        payment_state: "success",
        amount_paise: amount_paise || null,
        currency: "INR",
      },
      {
        onConflict: "user_id,status",
        ignoreDuplicates: false,
      }
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
