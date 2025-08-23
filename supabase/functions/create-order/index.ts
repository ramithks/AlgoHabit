// @ts-nocheck
// Supabase Edge Function: create-order
// POST { plan_key: string } -> { order_id, amount, currency }
// Requires env: RAZORPAY_KEY_ID, RAZORPAY_SECRET
// Attaches notes: user_id, plan_key

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Max-Age": "86400",
};

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }
  if (req.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders },
    });
  try {
    const { plan_key, user_id } = await req.json();
    console.log("create-order: incoming", {
      plan_key,
      has_user_id: Boolean(user_id),
    });
    if (!plan_key || !(plan_key in PLAN_PRICES)) {
      console.warn("create-order: invalid plan", { plan_key });
      return new Response(JSON.stringify({ error: "invalid_plan", plan_key }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const secret = Deno.env.get("RAZORPAY_SECRET");
    if (!keyId || !secret) {
      console.error("create-order: missing env", {
        has_key_id: Boolean(keyId),
        has_secret: Boolean(secret),
      });
      return new Response(
        JSON.stringify({
          error: "missing_env",
          missing: {
            RAZORPAY_KEY_ID: !keyId,
            RAZORPAY_SECRET: !secret,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    const amount = PLAN_PRICES[plan_key];
    const body = {
      amount,
      currency: "INR",
      receipt: `algo_${plan_key}_${Date.now()}`,
      notes: { plan_key, user_id: user_id || "" },
    };
    const auth = btoa(`${keyId}:${secret}`);
    let res: Response | null = null;
    try {
      res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (netErr) {
      console.error("create-order: network/fetch error", String(netErr));
      return new Response(
        JSON.stringify({ error: "network_error", detail: String(netErr) }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let data: any = null;
    try {
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch (je) {
        data = { raw: text };
      }
    } catch (readErr) {
      console.error("create-order: read body error", String(readErr));
    }

    if (!res.ok) {
      console.error("create-order: non-200 from Razorpay", {
        status: res.status,
        statusText: res.statusText,
        data,
      });
      return new Response(
        JSON.stringify({
          error: "order_failed",
          status: res.status,
          statusText: res.statusText,
          detail: data,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    console.log("create-order: success", {
      order_id: data?.id,
      amount: data?.amount,
      currency: data?.currency,
    });
    return new Response(
      JSON.stringify({
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error("create-order: unhandled error", String(e));
    return new Response(
      JSON.stringify({ error: "unhandled", detail: String(e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
