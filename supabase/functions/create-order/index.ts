// @ts-nocheck
// Supabase Edge Function: create-order
// POST { plan_key: string } -> { order_id, amount, currency }
// Requires env: RAZORPAY_KEY_ID, RAZORPAY_SECRET
// Attaches notes: user_id, plan_key

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Plan = {
  key: string;
  pricePaise: number;
};

const PLAN_PRICES: Record<string, number> = {
  pro_weekly: 2900,
  pro_monthly: 9900,
  pro_quarterly: 24900,
  pro_semiannual: 44900,
  pro_yearly: 69900,
  pro_biennial: 119900,
  pro_lifetime: 199900,
};

serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  try {
    const { plan_key, user_id } = await req.json();
    if (!plan_key || !(plan_key in PLAN_PRICES)) {
      return new Response(JSON.stringify({ error: "invalid_plan" }), {
        status: 400,
      });
    }
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const secret = Deno.env.get("RAZORPAY_SECRET");
    if (!keyId || !secret)
      return new Response("Missing Razorpay env", { status: 500 });
    const amount = PLAN_PRICES[plan_key];
    const body = {
      amount,
      currency: "INR",
      receipt: `algo_${plan_key}_${Date.now()}`,
      notes: { plan_key, user_id: user_id || "" },
    };
    const auth = btoa(`${keyId}:${secret}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok)
      return new Response(
        JSON.stringify({ error: data?.error || "order_failed" }),
        { status: 500 }
      );
    return new Response(
      JSON.stringify({
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
