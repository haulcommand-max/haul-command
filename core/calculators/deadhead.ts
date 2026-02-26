
/**
 * Deadhead Profit Calculator
 * 
 * Purpose: Show operators their TRUE profit after accounting for the return trip (deadhead).
 */

interface DeadheadInput {
    paidRate: number; // $/mile
    paidMiles: number;
    deadheadMiles: number;
    mpg: number;
    fuelCost: number; // $/gal
    dailyOpCost: number; // Insurance, salary, truck note (daily avg)
}

export function calculateDeadheadProfit(input: DeadheadInput) {
    const totalMiles = input.paidMiles + input.deadheadMiles;
    const grossRevenue = input.paidMiles * input.paidRate;

    const gallonsUsed = totalMiles / input.mpg;
    const totalFuelCost = gallonsUsed * input.fuelCost;

    // Estimate Days (500 miles / day)
    const days = Math.ceil(totalMiles / 500) || 1;
    const totalOpCost = days * input.dailyOpCost;

    const totalExpense = totalFuelCost + totalOpCost;
    const netProfit = grossRevenue - totalExpense;

    const realRatePerMile = netProfit / totalMiles;

    return {
        grossRevenue,
        totalExpense: Math.round(totalExpense),
        netProfit: Math.round(netProfit),
        realRatePerMile: parseFloat(realRatePerMile.toFixed(2)),
        isProfitable: netProfit > 0
    };
}
