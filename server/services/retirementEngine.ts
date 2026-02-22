import type { RetirementCalculatorInput } from "@shared/schema";

export interface YearProjection {
  age: number;
  year: number;
  corpus: number;
  annualContribution: number;
  annualReturn: number;
}

export interface RetirementResult {
  requiredCorpus: number;
  projectedCorpus: number;
  shortfall: number;
  monthlyExpensesAtRetirement: number;
  additionalMonthlySIPNeeded: number;
  savingsRate: number;
  yearsToRetirement: number;
  retirementDurationYears: number;
  yearByYearProjection: YearProjection[];
}

function futureValueOfSIP(
  monthlySIP: number,
  annualRate: number,
  years: number
): number {
  if (annualRate === 0) return monthlySIP * 12 * years;
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  return monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
}

function futureValueLumpSum(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (annualRate === 0) return principal;
  return principal * Math.pow(1 + annualRate / 100, years);
}

function inflationAdjustedExpense(
  monthlyExpense: number,
  inflationRate: number,
  years: number
): number {
  return monthlyExpense * Math.pow(1 + inflationRate / 100, years);
}

function requiredCorpusAnnuity(
  annualExpense: number,
  realReturnRate: number,
  retirementYears: number
): number {
  if (realReturnRate === 0) return annualExpense * retirementYears;
  const r = realReturnRate / 100;
  return annualExpense * (1 - Math.pow(1 + r, -retirementYears)) / r;
}

function solveAdditionalMonthlySIP(
  gap: number,
  annualRate: number,
  years: number
): number {
  if (gap <= 0) return 0;
  if (annualRate === 0) return gap / (12 * years);
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  const factor = ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  return gap / factor;
}

export function calculateRetirement(input: RetirementCalculatorInput): RetirementResult {
  const yearsToRetirement = input.retirementAge - input.currentAge;
  const retirementDurationYears = input.lifeExpectancy - input.retirementAge;

  if (yearsToRetirement <= 0 || retirementDurationYears <= 0) {
    throw new Error("Invalid age parameters: retirement age must be between current age and life expectancy");
  }

  const monthlyExpensesAtRetirement = inflationAdjustedExpense(
    input.monthlyExpenses,
    input.inflationRate,
    yearsToRetirement
  );

  const annualExpenseAtRetirement = monthlyExpensesAtRetirement * 12;

  const realReturnRate = ((1 + input.postRetirementReturn / 100) / (1 + input.inflationRate / 100) - 1) * 100;

  const requiredCorpus = requiredCorpusAnnuity(
    annualExpenseAtRetirement,
    Math.max(realReturnRate, 0),
    retirementDurationYears
  );

  const fvCurrentSavings = futureValueLumpSum(
    input.currentSavings,
    input.expectedReturn,
    yearsToRetirement
  );

  const fvSIP = futureValueOfSIP(
    input.monthlySIP,
    input.expectedReturn,
    yearsToRetirement
  );

  const projectedCorpus = fvCurrentSavings + fvSIP;
  const shortfall = Math.max(requiredCorpus - projectedCorpus, 0);

  const additionalMonthlySIPNeeded = solveAdditionalMonthlySIP(
    shortfall,
    input.expectedReturn,
    yearsToRetirement
  );

  const annualIncome = input.monthlyExpenses * 12 * 1.5;
  const annualSavings = input.monthlySIP * 12;
  const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;

  const yearByYearProjection: YearProjection[] = [];
  let runningCorpus = input.currentSavings;
  const currentYear = new Date().getFullYear();

  for (let i = 0; i <= yearsToRetirement; i++) {
    const age = input.currentAge + i;
    const annualContribution = i === 0 ? 0 : input.monthlySIP * 12;
    const annualReturn = i === 0 ? 0 : runningCorpus * (input.expectedReturn / 100);

    if (i > 0) {
      runningCorpus = runningCorpus * (1 + input.expectedReturn / 100) + annualContribution;
    }

    yearByYearProjection.push({
      age,
      year: currentYear + i,
      corpus: Math.round(runningCorpus),
      annualContribution: Math.round(annualContribution),
      annualReturn: Math.round(annualReturn),
    });
  }

  return {
    requiredCorpus: Math.round(requiredCorpus),
    projectedCorpus: Math.round(projectedCorpus),
    shortfall: Math.round(shortfall),
    monthlyExpensesAtRetirement: Math.round(monthlyExpensesAtRetirement),
    additionalMonthlySIPNeeded: Math.round(additionalMonthlySIPNeeded),
    savingsRate: Math.round(savingsRate * 10) / 10,
    yearsToRetirement,
    retirementDurationYears,
    yearByYearProjection,
  };
}
