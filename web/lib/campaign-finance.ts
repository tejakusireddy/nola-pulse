import plans from "../data/campaign-plans.json" with { type: "json" };
import { evaluate } from "./scenario.ts";
import type { Scenario } from "./scenario.ts";

export type CampaignScenario = Scenario & { ticketPrice: number };
export type CampaignFranchise = keyof typeof plans.plans;

export function initialCampaign(
  franchise: CampaignFranchise,
): CampaignScenario {
  const plan = plans.plans[franchise];
  return {
    budget: plan.budget,
    costPerOrder: plan.costPerOrder,
    incrementality: plan.incrementality,
    ticketsPerOrder: plan.ticketsPerOrder,
    contributionPerTicket: plan.ticketPrice - plan.variableCostPerTicket,
    fixedCosts: plan.fixedCosts,
    ticketPrice: plan.ticketPrice,
  };
}

export function campaignFinance(scenario: CampaignScenario) {
  if (
    !Number.isFinite(scenario.ticketPrice) ||
    scenario.ticketPrice < scenario.contributionPerTicket
  ) {
    throw new RangeError("Ticket yield must cover contribution per ticket.");
  }
  const result = evaluate(scenario);
  const incrementalTicketRevenue =
    result.incrementalTickets * scenario.ticketPrice;
  const variableCostPerTicket =
    scenario.ticketPrice - scenario.contributionPerTicket;
  const variableCosts = result.incrementalTickets * variableCostPerTicket;
  const totalCashCosts = result.totalCosts + variableCosts;
  return {
    ...result,
    ticketPrice: scenario.ticketPrice,
    variableCostPerTicket,
    incrementalTicketRevenue,
    variableCosts,
    totalCashCosts,
    contributionROI:
      result.totalCosts > 0 ? result.netContribution / result.totalCosts : null,
    provenance: {
      kind: "Assumed",
      source_id: "scenario",
      input_origin: plans.origin,
      revenue_formula:
        "Incremental orders × tickets per order × modeled ticket yield",
      variable_cost_formula:
        "Incremental tickets × (ticket yield − contribution per ticket)",
      net_formula:
        "Incremental ticket revenue − variable costs − media budget − additional campaign costs",
      roi_formula:
        "Net incremental contribution ÷ (media budget + additional campaign costs)",
    },
  };
}

export { plans as campaignPlans };
