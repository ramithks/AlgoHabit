// @ts-nocheck
// Supabase Edge Function: razorpay-webhook
// Verifies X-Razorpay-Signature using RAZORPAY_WEBHOOK_SECRET and writes to DB.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version, x-razorpay-signature, x-debug",
  "Access-Control-Max-Age": "86400",
} as const;

async function hmacBytes(secret: string, payload: string): Promise<Uint8Array> {
  const subtle = (globalThis as any).crypto?.subtle;
  if (!subtle) throw new Error("webcrypto_unavailable");
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function planEndDate(plan_key: string): Date | null {
  const start = new Date();
  switch (plan_key) {
    case "pro_weekly": {
      const d = new Date(start);
      d.setDate(d.getDate() + 7);
      return d;
    }
    case "pro_monthly":
    case "pro_quarterly":
    case "pro_semiannual":
    case "pro_yearly":
    case "pro_biennial": {
      const monthsMap: Record<string, number> = {
        pro_monthly: 1,
        pro_quarterly: 3,
        pro_semiannual: 6,
        pro_yearly: 12,
        pro_biennial: 24,
      };
      const d = new Date(start);
      d.setMonth(d.getMonth() + (monthsMap[plan_key] || 1));
      return d;
    }
    case "pro_lifetime":
      return null;
    default: {
      const d = new Date(start);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
  }
}

serve(async (req) => {
  // Debug mode toggle: enable response echo of headers/signatures/body for troubleshooting
  const url = new URL(req.url);
  const debug =
    url.searchParams.get("debug") === "1" ||
    req.headers.get("x-debug") === "1" ||
    Deno.env.get("DEBUG_WEBHOOK") === "1";

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...CORS_HEADERS } });
  }
  if (req.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...CORS_HEADERS },
    });

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret)
    return new Response(JSON.stringify({ error: "missing_webhook_secret" }), {
      status: 500,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    });

  // Read raw body exactly as sent for signature verification
  const rawBody = await req.text();

  const headersDump: Record<string, string> = {};
  req.headers.forEach((v, k) => (headersDump[k] = v));
  console.log("webhook: incoming headers", headersDump);

  const providedSig =
    req.headers.get("x-razorpay-signature") ||
    req.headers.get("X-Razorpay-Signature") ||
    "";
  if (!providedSig) {
    let debugBlock: any = undefined;
    if (debug) {
      try {
        const dbgBytes = await hmacBytes(secret, rawBody);
        const dbgHex = Array.from(dbgBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        const dbgB64 = btoa(String.fromCharCode(...dbgBytes));
        debugBlock = {
          hint: "Send header 'X-Razorpay-Signature' with the webhook payload exactly as received from Razorpay",
          headers: headersDump,
          expectedHex: dbgHex,
          expectedB64: dbgB64,
          body_sample: rawBody.slice(0, 10000),
        };
      } catch (_) {
        debugBlock = {
          hint: "Send header 'X-Razorpay-Signature' with the webhook payload exactly as received from Razorpay",
          headers: headersDump,
          body_sample: rawBody.slice(0, 10000),
        };
      }
    }
    return new Response(
      JSON.stringify({
        error: "missing_signature",
        ...(debug && debugBlock ? { debug: debugBlock } : {}),
      }),
      {
        status: 401,
        headers: { ...JSON_HEADERS, ...CORS_HEADERS },
      }
    );
  }

  let expectedHex = "";
  let expectedB64 = "";
  try {
    const bytes = await hmacBytes(secret, rawBody);
    expectedHex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    // Standard base64 (no padding stripping)
    expectedB64 = btoa(String.fromCharCode(...bytes));
  } catch (e) {
    console.error("webhook: hmac error", String(e));
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    });
  }

  const provided = providedSig.trim();
  const providedLower = provided.toLowerCase();
  const hexOk = timingSafeEqual(expectedHex, providedLower);
  const b64Ok = timingSafeEqual(expectedB64, provided);
  if (!hexOk && !b64Ok) {
    console.error("webhook: invalid signature", {
      provided_len: provided.length,
      expect_hex_len: expectedHex.length,
      expect_b64_len: expectedB64.length,
    });
    return new Response(
      JSON.stringify({
        error: "invalid_signature",
        ...(debug
          ? {
              debug: {
                provided,
                expectedHex,
                expectedB64,
                compare: {
                  hexOk,
                  b64Ok,
                },
                headers: headersDump,
                body_sample: rawBody.slice(0, 10000),
              },
            }
          : {}),
      }),
      {
        status: 401,
        headers: { ...JSON_HEADERS, ...CORS_HEADERS },
      }
    );
  }

  let ev: any;
  try {
    ev = JSON.parse(rawBody);
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "invalid_json",
        ...(debug ? { debug: { body_sample: rawBody.slice(0, 10000) } } : {}),
      }),
      {
        status: 400,
        headers: { ...JSON_HEADERS, ...CORS_HEADERS },
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "missing_db_env" }), {
      status: 500,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    switch (ev.event) {
      case "payment.captured": {
        const p = ev?.payload?.payment?.entity;
        if (!p) break;
        const user_id = p.notes?.user_id || null;
        const plan_key = p.notes?.plan_key || null;
        console.log("webhook: payment.captured", {
          order_id: p.order_id,
          id: p.id,
          user_id,
          plan_key,
        });
        if (user_id) {
          const { error: payErr } = await supabase
            .from("subscription_payments")
            .insert({
              user_id,
              amount_paise: p.amount,
              currency: p.currency,
              status: "success",
              razorpay_order_id: p.order_id,
              razorpay_payment_id: p.id,
            });
          if (payErr) console.error("webhook: pay insert error", payErr);

          if (plan_key) {
            const end = planEndDate(plan_key);
            const start = new Date();
            const { error: subErr } = await supabase
              .from("subscriptions")
              .insert({
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
            if (subErr) console.error("webhook: sub insert error", subErr);
          }
        }
        break;
      }
      case "payment.failed": {
        const p = ev?.payload?.payment?.entity;
        if (!p) break;
        const user_id = p.notes?.user_id || null;
        console.log("webhook: payment.failed", {
          order_id: p.order_id,
          id: p.id,
          user_id,
        });
        if (user_id) {
          const { error: payErr } = await supabase
            .from("subscription_payments")
            .insert({
              user_id,
              amount_paise: p.amount,
              currency: p.currency,
              status: "failed",
              razorpay_order_id: p.order_id,
              razorpay_payment_id: p.id,
            });
          if (payErr) console.error("webhook: pay insert error", payErr);
        }
        break;
      }
      default:
        console.log("webhook: ignored event", ev?.event);
        break;
    }
  } catch (e) {
    console.error("webhook: handler error", String(e));
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      ...(debug ? { debug: { event: ev?.event } } : {}),
    }),
    {
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    }
  );
});
