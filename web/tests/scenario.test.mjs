import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  DEFAULT_SCENARIO,
  sensitivity,
  combinedDownside,
} from "../lib/scenario.ts";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test("reference case reconciles costs, orders, contribution, and reversal", () => {
  const r = evaluate(DEFAULT_SCENARIO);
  near(r.attributedOrders, 187.5);
  near(r.netContribution, 1500);
  near(r.breakEvenShare, 0.525);
  near(
    evaluate({ ...DEFAULT_SCENARIO, incrementality: 0.4 }).netContribution,
    -1500,
  );
  near(
    evaluate({ ...DEFAULT_SCENARIO, costPerOrder: r.maxCostPerOrder })
      .netContribution,
    0,
  );
  near(
    evaluate({
      ...DEFAULT_SCENARIO,
      contributionPerTicket: r.minContributionPerTicket,
    }).netContribution,
    0,
  );
});

test("calculated reversal is neutral, with opposite decisions on each side", () => {
  for (const budget of [500, 6000, 18000]) {
    const s = { ...DEFAULT_SCENARIO, budget };
    const threshold = evaluate(s).breakEvenShare;
    if (threshold <= 1) {
      assert.equal(
        evaluate({ ...s, incrementality: threshold }).status,
        "break-even",
      );
      assert.equal(
        evaluate({ ...s, incrementality: threshold - 0.001 }).status,
        "negative",
      );
      assert.equal(
        evaluate({ ...s, incrementality: threshold + 0.001 }).status,
        "positive",
      );
    }
  }
});

test("an infeasible threshold is retained above 100 percent", () => {
  const r = evaluate({ ...DEFAULT_SCENARIO, costPerOrder: 100 });
  assert.ok(r.breakEvenShare > 1);
  assert.equal(r.feasible, false);
});

test("zero spend and zero margin have explicit results without division errors", () => {
  const inactive = evaluate({ ...DEFAULT_SCENARIO, budget: 0 });
  assert.equal(inactive.status, "inactive");
  assert.equal(inactive.breakEvenShare, null);
  assert.equal(inactive.netContribution, -300);
  const noMargin = evaluate({ ...DEFAULT_SCENARIO, contributionPerTicket: 0 });
  assert.equal(noMargin.breakEvenShare, null);
  assert.equal(noMargin.breakEvenOrders, null);
  assert.equal(noMargin.feasible, false);
  const noIncrement = evaluate({ ...DEFAULT_SCENARIO, incrementality: 0 });
  assert.equal(noIncrement.minContributionPerTicket, null);
});

test("invalid and non-finite inputs cannot produce a recommendation", () => {
  for (const patch of [
    { costPerOrder: 0 },
    { ticketsPerOrder: -1 },
    { incrementality: 1.01 },
    { incrementality: -0.1 },
    { budget: -1 },
    { contributionPerTicket: -1 },
    { fixedCosts: NaN },
    { budget: Infinity },
  ]) {
    assert.throws(
      () => evaluate({ ...DEFAULT_SCENARIO, ...patch }),
      RangeError,
    );
  }
});

test("sensitivity ranks documented ranges by downside and joint stress includes all adverse inputs", () => {
  const ranked = sensitivity(DEFAULT_SCENARIO);
  assert.equal(ranked.length, 4);
  assert.equal(ranked[0].key, "incrementality");
  assert.ok(ranked[0].crossesZero);
  for (const r of ranked)
    assert.ok(combinedDownside(DEFAULT_SCENARIO).netContribution <= r.worst);
});
