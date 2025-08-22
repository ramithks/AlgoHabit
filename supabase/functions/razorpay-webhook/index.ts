// @ts-nocheck
// Supabase Edge Function: razorpay-webhook
// Verifies X-Razorpay-Signature using RAZORPAY_WEBHOOK_SECRET and writes to DB.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import * as crypto from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifySignature(
  secret: string,
  payload: string,
  provided: string
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === provided;
}

serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return new Response("Missing webhook secret", { status: 500 });
  const payload = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  const ok = await verifySignature(secret, payload, sig);
  if (!ok) return new Response("Invalid signature", { status: 400 });

  const ev = JSON.parse(payload);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  try {
    switch (ev.event) {
      case "payment.captured": {
        const p = ev.payload.payment.entity;
        const user_id = p.notes?.user_id || null;
        const plan_key = p.notes?.plan_key || null;
        if (user_id) {
          await supabase.from("subscription_payments").insert({
            user_id,
            amount_paise: p.amount,
            currency: p.currency,
            status: "success",
            razorpay_order_id: p.order_id,
            razorpay_payment_id: p.id,
          });
          if (plan_key) {
            // Minimal upsert similar to verify-payment
            const start = new Date();
            let end: Date | null = null;
            const map: Record<string, number> = {
              pro_monthly: 1,
              pro_quarterly: 3,
              pro_semiannual: 6,
              pro_yearly: 12,
              pro_biennial: 24,
            };
            if (plan_key === "pro_lifetime") end = null;
            else if (plan_key === "pro_weekly") {
              end = new Date(start);
              end.setDate(end.getDate() + 7);
            } else {
              const months = map[plan_key] || 1;
              end = new Date(start);
              end.setMonth(end.getMonth() + months);
            }
            await supabase.from("subscriptions").insert({
              user_id,
              plan: plan_key.replace("pro_", "") as any,
              plan_label: plan_key,
              start_date: start.toISOString(),
              end_date: end ? end.toISOString() : null,
              status: "active",
              razorpay_order_id: p.order_id,
              razorpay_payment_id: p.id,
              payment_state: "success",
              amount_paise: p.amount,
              currency: p.currency,
            });
          }
        }
        break;
      }
      case "payment.failed": {
        const p = ev.payload.payment.entity;
        const user_id = p.notes?.user_id || null;
        if (user_id) {
          await supabase.from("subscription_payments").insert({
            user_id,
            amount_paise: p.amount,
            currency: p.currency,
            status: "failed",
            razorpay_order_id: p.order_id,
            razorpay_payment_id: p.id,
          });
        }
        break;
      }
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
  return new Response("ok");
});
