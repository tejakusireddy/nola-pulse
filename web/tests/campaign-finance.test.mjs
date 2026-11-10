import test from "node:test";
import assert from "node:assert/strict";
import {
  campaignFinance,
  initialCampaign,
  campaignPlans,
} from "../lib/campaign-finance.ts";

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

test("franchise planning cases reconcile revenue, variable costs, campaign spend and net contribution", () => {
  for (const [team, revenue, variable, net] of [
    ["Pelicans", 41250, 7500, 7550],
    ["Saints", 50000, 10000, 12500],
  ]) {
    const scenario = initialCampaign(team);
    const result = campaignFinance(scenario);
    near(result.incrementalTicketRevenue, revenue);
    near(result.variableCosts, variable);
    near(result.netContribution, net);
    near(result.incrementalTicketRevenue - result.totalCashCosts, net);
    assert.equal(result.provenance.kind, "Assumed");
    assert.match(
      result.provenance.input_origin,
      /not measured or estimated franchise financial results/,
    );
  }
  assert.equal(campaignPlans.kind, "Assumed");
});

test("each calculated decision reversal breaks even and changes sign on either side", () => {
  for (const team of ["Pelicans", "Saints"]) {
    const scenario = initialCampaign(team);
    const threshold = campaignFinance(scenario).breakEvenShare;
    near(
      campaignFinance({ ...scenario, incrementality: threshold })
        .netContribution,
      0,
    );
    assert.ok(
      campaignFinance({ ...scenario, incrementality: threshold - 0.01 })
        .netContribution < 0,
    );
    assert.ok(
      campaignFinance({ ...scenario, incrementality: threshold + 0.01 })
        .netContribution > 0,
    );
  }
});

test("pricing cannot silently create negative variable costs and zero activity has no financial return", () => {
  const plan = initialCampaign("Pelicans");
  assert.throws(() => campaignFinance({ ...plan, ticketPrice: 1 }));
  assert.throws(() => campaignFinance({ ...plan, ticketPrice: NaN }));
  const inactive = campaignFinance({ ...plan, budget: 0, fixedCosts: 0 });
  near(inactive.incrementalTicketRevenue, 0);
  near(inactive.variableCosts, 0);
  near(inactive.netContribution, 0);
  assert.equal(inactive.contributionROI, null);
  const other = initialCampaign("Pelicans");
  plan.budget = 0;
  assert.equal(other.budget, 25000);
});
