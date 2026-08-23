import { describe, it, expect } from 'vitest';

describe('Monetization Engine & Commission Math', () => {
  const COMMISSION_RATE = 0.08; // 8%
  const PLATFORM_FEE_INR = 10; // ₹10 convenience fee

  interface JobFinancials {
    hourlyRate: number;
    hours: number;
    platformFee: number;
    grossEarnings: number;
    partnerCommission: number;
    workerNetPayout: number;
    customerTotal: number;
  }

  function calculateJobFinancials(hourlyRate: number, hours = 1): JobFinancials {
    const grossEarnings = hourlyRate * hours;
    const partnerCommission = Math.round(grossEarnings * COMMISSION_RATE);
    const workerNetPayout = grossEarnings - partnerCommission;
    const customerTotal = grossEarnings + PLATFORM_FEE_INR;

    return {
      hourlyRate,
      hours,
      platformFee: PLATFORM_FEE_INR,
      grossEarnings,
      partnerCommission,
      workerNetPayout,
      customerTotal,
    };
  }

  it('calculates accurate net payouts and platform margins for standard ₹350 service', () => {
    const fin = calculateJobFinancials(350, 1);
    expect(fin.grossEarnings).toBe(350);
    expect(fin.partnerCommission).toBe(28); // 8% of 350
    expect(fin.workerNetPayout).toBe(322); // 350 - 28
    expect(fin.customerTotal).toBe(360); // 350 + 10
  });

  it('calculates accurate net payouts for multi-hour ₹500 carpentry job', () => {
    const fin = calculateJobFinancials(500, 3);
    expect(fin.grossEarnings).toBe(1500);
    expect(fin.partnerCommission).toBe(120); // 8% of 1500
    expect(fin.workerNetPayout).toBe(1380); // 1500 - 120
    expect(fin.customerTotal).toBe(1510); // 1500 + 10
  });

  it('handles Lead Credits balance deduction and recharge packages', () => {
    let leadBalance = 5; // Free starting leads
    const LEAD_PACK_PRICE = 49;
    const LEAD_PACK_COUNT = 5;

    // Worker accepts 3 jobs
    leadBalance -= 3;
    expect(leadBalance).toBe(2);

    // Worker recharges 1 pack via UPI (₹49)
    leadBalance += LEAD_PACK_COUNT;
    expect(leadBalance).toBe(7);

    // Cost per lead is less than ₹10
    const costPerLead = LEAD_PACK_PRICE / LEAD_PACK_COUNT;
    expect(costPerLead).toBeCloseTo(9.8, 1);
  });
});
