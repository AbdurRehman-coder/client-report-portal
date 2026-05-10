// ─── SACS Calculations ───────────────────────────────
export function calcExcess(inflowMonthly: number, outflowMonthly: number): number {
  return inflowMonthly - outflowMonthly
}

export function calcPrivateReserveTarget(
  monthlyExpenses: number,
  insuranceDeductibles: number
): number {
  return 6 * monthlyExpenses + insuranceDeductibles
}

export function calcTotalInflow(salaryCl: number, salaryCl2: number): number {
  return salaryCl + salaryCl2
}

// ─── TCC Calculations ────────────────────────────────
// CRITICAL RULES:
// 1. Retirement total per spouse = sum of THEIR retirement accounts only
// 2. Non-retirement total = brokerage + joint accounts ONLY (NOT trust)
// 3. Grand total = C1ret + C2ret + nonRet + trust value
// 4. Liabilities are displayed separately, NEVER subtracted from net worth

export function calcRetirementTotal(balances: number[]): number {
  return balances.reduce((sum, b) => sum + b, 0)
}

export function calcNonRetirementTotal(balances: number[]): number {
  return balances.reduce((sum, b) => sum + b, 0)
}

export function calcGrandTotalNetWorth(
  retC1: number,
  retC2: number,
  nonRet: number,
  trustValue: number
): number {
  return retC1 + retC2 + nonRet + trustValue
}

export function calcTotalLiabilities(balances: number[]): number {
  return balances.reduce((sum, b) => sum + b, 0)
}

// ─── Formatting Utilities ────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calcAge(dobString: string): number {
  const dob = new Date(dobString)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export function getQuarterLabel(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3)
  return `Q${q} ${date.getFullYear()}`
}

export function getCurrentQuarter(): string {
  return getQuarterLabel(new Date())
}
