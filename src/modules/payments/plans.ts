export type Plan = {
  key: string; // e.g., pro_weekly
  title: string; // label
  pricePaise: number; // paise
  sub: string; // cadence label
  best?: boolean;
};

export const plans: Plan[] = [
  {
    key: "pro_weekly",
    title: "Pro Weekly",
    pricePaise: 2900,
    sub: "billed weekly",
  },
  {
    key: "pro_monthly",
    title: "Pro Monthly",
    pricePaise: 9900,
    sub: "billed monthly",
  },
  {
    key: "pro_quarterly",
    title: "Pro Quarterly",
    pricePaise: 24900,
    sub: "billed quarterly",
  },
  {
    key: "pro_semiannual",
    title: "Pro Semi-Annual",
    pricePaise: 44900,
    sub: "billed every 6 months",
  },
  {
    key: "pro_yearly",
    title: "Pro Yearly",
    pricePaise: 69900,
    sub: "billed yearly",
    best: true,
  },
  {
    key: "pro_biennial",
    title: "Pro 2-Year",
    pricePaise: 119900,
    sub: "billed every 2 years",
  },
  {
    key: "pro_lifetime",
    title: "Lifetime",
    pricePaise: 199900,
    sub: "one-time",
  },
];
