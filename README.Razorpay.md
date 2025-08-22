Razorpay quick start (client-only demo)

Important: Never expose Razorpay secret keys to the client. For the client, only the publishable Key ID is needed, and it must be prefixed with VITE\_ for Vite builds.

1. Set environment variables in .env (client):

   VITE_RAZORPAY_KEY_ID=rzp_test_xxx

   Do NOT include RAZORPAY_SECRET in the client .env. Move it to your server-side environment (Netlify/Vercel function, Cloudflare Worker, etc.).

2. Current flow uses a client-only checkout without server orders. Replace with server-created orders and signature verification for production.

3. Where to plug server:

   - Create order endpoint: returns { order_id, amount, currency }.
   - Verify signature endpoint: receives razorpay_order_id, razorpay_payment_id, razorpay_signature; validates with secret; updates Supabase tables.

4. DB mapping:
   - Write to public.subscription_payments and public.subscriptions as per supabase/schema.sql helpers and policies.
