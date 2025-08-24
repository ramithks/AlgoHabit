export type Plan = {
  key: string; // e.g., pro_weekly
  title: string; // label
  pricePaise: number; // paise
  sub: string; // cadence label
  best?: boolean;
  discountPercent?: number; // discount vs monthly plan
  fomoOffer?: string; // FOMO message
  originalPricePaise?: number; // original price for strikethrough
};

export const plans: Plan[] = [
  {
    key: "pro_weekly",
    title: "Pro Weekly",
    pricePaise: 2900,
    sub: "billed weekly",
    fomoOffer: "Perfect for trying out Pro features",
  },
  {
    key: "pro_monthly",
    title: "Pro Monthly",
    pricePaise: 9900,
    sub: "billed monthly",
    // Base plan - no discount
  },
  {
    key: "pro_quarterly",
    title: "Pro Quarterly",
    pricePaise: 24900,
    sub: "billed quarterly",
    discountPercent: 16, // (9900 * 3 - 24900) / (9900 * 3) * 100
    fomoOffer: "Most popular choice for students",
  },
  {
    key: "pro_semiannual",
    title: "Pro Semi-Annual",
    pricePaise: 44900,
    sub: "billed every 6 months",
    discountPercent: 24, // (9900 * 6 - 44900) / (9900 * 6) * 100
    fomoOffer: "Great value for serious learners",
  },
  {
    key: "pro_yearly",
    title: "Pro Yearly",
    pricePaise: 69900,
    sub: "billed yearly",
    best: true,
    discountPercent: 29, // (9900 * 12 - 69900) / (9900 * 12) * 100
    fomoOffer: "Best value - save ₹49,800 annually!",
  },
  {
    key: "pro_biennial",
    title: "Pro 2-Year",
    pricePaise: 119900,
    sub: "billed every 2 years",
    discountPercent: 39, // (9900 * 24 - 119900) / (9900 * 24) * 100
    fomoOffer: "Ultimate savings for long-term commitment",
  },
  {
    key: "pro_lifetime",
    title: "Lifetime",
    pricePaise: 199900,
    sub: "one-time",
    discountPercent: 83, // Assuming 2 years of monthly = 237,600, then (237600 - 199900) / 237600 * 100
    fomoOffer: "Never pay again - limited availability",
  },
];
