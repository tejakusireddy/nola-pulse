export type Scenario = {
  budget: number;
  costPerOrder: number;
  ticketsPerOrder: number;
  contributionPerTicket: number;
  incrementality: number;
  fixedCosts: number;
};

export type ScenarioKey = keyof Scenario;
export type Assumption = {
  key: ScenarioKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  rationale: string;
};

export const MODEL_VERSION = "1.0.0";

export const DEFAULT_SCENARIO: Scenario = {
  budget: 6000,
  costPerOrder: 32,
  ticketsPerOrder: 2,
  contributionPerTicket: 32,
  incrementality: 0.65,
  fixedCosts: 300,
};

export const ASSUMPTIONS: Assumption[] = [
  {
    key: "budget",
    label: "Campaign spend",
    unit: "USD",
    min: 0,
    max: 100000,
    step: 500,
    rationale: "A bounded test budget; not a recommended allocation.",
  },
  {
    key: "costPerOrder",
    label: "Cost per attributed order",
    unit: "USD / order",
    min: 15,
    max: 80,
    step: 1,
    rationale:
      "An illustrative acquisition cost. Replace with campaign evidence; no response curve is estimated.",
  },
  {
    key: "incrementality",
    label: "Incremental share of orders",
    unit: "share",
    min: 0,
    max: 1,
    step: 0.01,
    rationale:
      "Share of attributed orders that would not have occurred without the campaign. Requires a holdout to estimate.",
  },
  {
    key: "ticketsPerOrder",
    label: "Tickets per incremental order",
    unit: "tickets / order",
    min: 1,
    max: 4,
    step: 0.1,
    rationale:
      "Mean tickets per incremental order, not a count of people reached.",
  },
  {
    key: "contributionPerTicket",
    label: "Net contribution per ticket",
    unit: "USD / ticket",
    min: 0,
    max: 100,
    step: 1,
    rationale:
      "Contribution after discount and variable fulfillment costs. This is not the resale listing price.",
  },
  {
    key: "fixedCosts",
    label: "Additional campaign costs",
    unit: "USD",
    min: 0,
    max: 3000,
    step: 50,
    rationale:
      "Creative and other incremental fixed costs outside the media budget.",
  },
];

export function validateScenario(s: Scenario): void {
  for (const key of Object.keys(DEFAULT_SCENARIO) as ScenarioKey[]) {
    const value = s[key];
    if (!Number.isFinite(value)) throw new RangeError(`${key} must be finite`);
  }
  if (s.budget < 0 || s.fixedCosts < 0 || s.contributionPerTicket < 0) {
    throw new RangeError("Spend and contribution must be nonnegative");
  }
  if (s.costPerOrder <= 0 || s.ticketsPerOrder <= 0) {
    throw new RangeError(
      "Cost per order and tickets per order must be positive",
    );
  }
  if (s.incrementality < 0 || s.incrementality > 1) {
    throw new RangeError("Incremental share must be between zero and one");
  }
}

export function evaluate(s: Scenario) {
  validateScenario(s);
  const attributedOrders = s.budget / s.costPerOrder;
  const incrementalOrders = attributedOrders * s.incrementality;
  const incrementalTickets = incrementalOrders * s.ticketsPerOrder;
  const grossContribution = incrementalTickets * s.contributionPerTicket;
  const totalCosts = s.budget + s.fixedCosts;
  const netContribution = grossContribution - totalCosts;
  const fullIncrementalContribution =
    attributedOrders * s.ticketsPerOrder * s.contributionPerTicket;
  const breakEvenShare =
    fullIncrementalContribution > 0
      ? totalCosts / fullIncrementalContribution
      : null;
  const breakEvenOrders =
    s.ticketsPerOrder * s.contributionPerTicket > 0
      ? totalCosts / (s.ticketsPerOrder * s.contributionPerTicket)
      : null;
  const maxCostPerOrder =
    s.budget > 0 && totalCosts > 0
      ? (s.incrementality *
          s.budget *
          s.ticketsPerOrder *
          s.contributionPerTicket) /
        totalCosts
      : null;
  const minContributionPerTicket =
    incrementalTickets > 0 ? totalCosts / incrementalTickets : null;
  const tolerance = Math.max(1, grossContribution, totalCosts) * 1e-10;
  const status =
    s.budget === 0
      ? "inactive"
      : Math.abs(netContribution) <= tolerance
        ? "break-even"
        : netContribution > 0
          ? "positive"
          : "negative";
  return {
    attributedOrders,
    incrementalOrders,
    incrementalTickets,
    grossContribution,
    totalCosts,
    netContribution,
    breakEvenShare,
    breakEvenOrders,
    maxCostPerOrder,
    minContributionPerTicket,
    marginOfSafety:
      breakEvenShare === null ? null : s.incrementality - breakEvenShare,
    feasible: breakEvenShare !== null && breakEvenShare <= 1,
    status,
  };
}

export const SENSITIVITY_RANGES: Partial<
  Record<ScenarioKey, [number, number]>
> = {
  incrementality: [0.3, 0.85],
  costPerOrder: [24, 50],
  contributionPerTicket: [24, 45],
  ticketsPerOrder: [1.5, 3],
};

export function sensitivity(s: Scenario) {
  const base = evaluate(s).netContribution;
  return Object.entries(SENSITIVITY_RANGES)
    .map(([key, endpoints]) => {
      const field = key as ScenarioKey;
      const range = endpoints as [number, number];
      const atLow = evaluate({ ...s, [field]: range[0] }).netContribution;
      const atHigh = evaluate({ ...s, [field]: range[1] }).netContribution;
      const worst = Math.min(atLow, atHigh);
      const best = Math.max(atLow, atHigh);
      return {
        key: field,
        label: ASSUMPTIONS.find((a) => a.key === field)!.label,
        range,
        worst,
        best,
        downside: Math.max(0, base - worst),
        crossesZero: worst < 0 && best > 0,
      };
    })
    .sort((a, b) => b.downside - a.downside);
}

export function combinedDownside(s: Scenario) {
  return evaluate({
    ...s,
    incrementality: Math.min(s.incrementality, 0.3),
    costPerOrder: Math.max(s.costPerOrder, 50),
    contributionPerTicket: Math.min(s.contributionPerTicket, 24),
    ticketsPerOrder: Math.min(s.ticketsPerOrder, 1.5),
  });
}

export function contributionCurve(s: Scenario) {
  return Array.from({ length: 101 }, (_, index) => ({
    share: index / 100,
    net: evaluate({ ...s, incrementality: index / 100 }).netContribution,
  }));
}
