'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  formatCurrency,
  formatCurrencyShort,
  calcExcess,
  calcPrivateReserveTarget,
  calcRetirementTotal,
  calcNonRetirementTotal,
  calcGrandTotalNetWorth,
  calcTotalLiabilities,
} from '@/lib/calculations'

type AccountData = {
  id: string
  owner: string
  category: string
  accountType: string
  institutionName: string | null
  accountNumberLast4: string | null
}

type LiabilityData = {
  id: string
  liabilityType: string
  interestRate: number
  balance: number
}

export type ReportFormProps = {
  clientId: string
  displayName: string
  quarterLabel: string
  today: string
  inflowMonthly: number
  outflowMonthly: number
  insuranceDeductibles: number
  isMarried: boolean
  c1FirstName: string
  c2FirstName: string | null
  trustEnabled: boolean
  trustPropertyAddress: string | null
  accounts: AccountData[]
  liabilities: LiabilityData[]
  prefill: {
    privateReserveBalance: number | null
    investmentAccountBalance: number | null
    trustValue: number | null
    accountBalances: Record<string, { balance: number; cashBalance: number | null }>
    liabilityBalances: Record<string, number>
  }
}

const INPUT_STYLE = { border: '1px solid #E8E3D8', color: '#1A1A1A', backgroundColor: 'white' }
const inputClass = 'w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition'
const errorInputStyle = { border: '1px solid #F87171', color: '#1A1A1A', backgroundColor: 'white' }

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold mb-1" style={{ color: '#1A1A1A' }}>{children}</h2>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#6B6560' }}>
      {children}{required && ' *'}
    </label>
  )
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F5F0E8' }}>
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B6560' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{value}</span>
    </div>
  )
}

function GroupDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-5">
      <span className="text-xs font-medium uppercase tracking-wide flex-shrink-0" style={{ color: '#6B6560' }}>{title}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: '#E8E3D8' }} />
    </div>
  )
}

function RunningTotal({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between mt-2 py-2 px-3 rounded-lg" style={{ backgroundColor: '#F5F0E8' }}>
      <span className="text-xs font-medium" style={{ color: '#6B6560' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{formatCurrencyShort(amount)}</span>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  bold,
  muted,
  indent,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
  indent?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? 'pl-3' : ''}`}>
      <span
        className={`text-sm ${bold ? 'font-semibold' : ''}`}
        style={{ color: muted ? '#6B6560' : '#1A1A1A' }}
      >
        {label}
      </span>
      <span
        className={`text-sm ${bold ? 'font-bold' : ''}`}
        style={{ color: muted ? '#6B6560' : bold ? '#C4622D' : '#1A1A1A' }}
      >
        {value}
      </span>
    </div>
  )
}

function AccountRow({
  acc,
  balance,
  cashBalance,
  hasError,
  prefillBalance,
  today,
  onBalanceChange,
  onCashBalanceChange,
}: {
  acc: AccountData
  balance: string
  cashBalance: string
  hasError: boolean
  prefillBalance: number | null
  today: string
  onBalanceChange: (val: string) => void
  onCashBalanceChange: (val: string) => void
}) {
  const label = [
    acc.accountType,
    acc.institutionName,
    acc.accountNumberLast4 ? `#${acc.accountNumberLast4}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FAFAF8', border: '1px solid #F0EBE1' }}>
      <p className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Balance</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={balance}
              onChange={e => onBalanceChange(e.target.value)}
              placeholder={prefillBalance != null ? String(prefillBalance) : '0'}
              className={`${inputClass} pl-7`}
              style={hasError ? errorInputStyle : INPUT_STYLE}
            />
          </div>
          {prefillBalance != null && (
            <p className="text-xs mt-1" style={{ color: '#6B6560' }}>
              Last quarter: {formatCurrencyShort(prefillBalance)}
            </p>
          )}
        </div>
        <div>
          <FieldLabel>Cash Balance</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cashBalance}
              onChange={e => onCashBalanceChange(e.target.value)}
              placeholder="Optional"
              className={`${inputClass} pl-7`}
              style={INPUT_STYLE}
            />
          </div>
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color: '#6B6560' }}>As-of date: {today}</p>
    </div>
  )
}

export default function ReportForm({
  clientId,
  displayName,
  quarterLabel,
  today,
  inflowMonthly,
  outflowMonthly,
  insuranceDeductibles,
  isMarried,
  c1FirstName,
  c2FirstName,
  trustEnabled,
  trustPropertyAddress,
  accounts,
  liabilities,
  prefill,
}: ReportFormProps) {
  const router = useRouter()

  const privateReserveTarget = calcPrivateReserveTarget(outflowMonthly, insuranceDeductibles)
  const excessMonthly = calcExcess(inflowMonthly, outflowMonthly)

  // ─── Form state ──────────────────────────────────────
  const [privateReserveBalance, setPrivateReserveBalance] = useState(
    prefill.privateReserveBalance != null ? String(prefill.privateReserveBalance) : ''
  )
  const [investmentAccountBalance, setInvestmentAccountBalance] = useState(
    prefill.investmentAccountBalance != null ? String(prefill.investmentAccountBalance) : ''
  )
  const [trustValue, setTrustValue] = useState(
    prefill.trustValue != null ? String(prefill.trustValue) : ''
  )
  const [accountBalances, setAccountBalances] = useState<
    Record<string, { balance: string; cashBalance: string }>
  >(() => {
    const result: Record<string, { balance: string; cashBalance: string }> = {}
    for (const acc of accounts) {
      const pre = prefill.accountBalances[acc.id]
      result[acc.id] = {
        balance: pre?.balance != null ? String(pre.balance) : '',
        cashBalance: pre?.cashBalance != null ? String(pre.cashBalance) : '',
      }
    }
    return result
  })
  const [liabilityBalances, setLiabilityBalances] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {}
    for (const l of liabilities) {
      const pre = prefill.liabilityBalances[l.id]
      result[l.id] = pre != null ? String(pre) : ''
    }
    return result
  })

  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  // ─── Account groups ───────────────────────────────────
  const retC1 = accounts.filter(a => a.owner === 'client1' && a.category === 'retirement')
  const retC2 = accounts.filter(a => a.owner === 'client2' && a.category === 'retirement')
  const nonRet = accounts.filter(a => a.category === 'non-retirement')

  // ─── Live calculations ────────────────────────────────
  const prBalance = parseFloat(privateReserveBalance) || 0
  const liveRetC1 = calcRetirementTotal(retC1.map(a => parseFloat(accountBalances[a.id]?.balance) || 0))
  const liveRetC2 = calcRetirementTotal(retC2.map(a => parseFloat(accountBalances[a.id]?.balance) || 0))
  const liveNonRet = calcNonRetirementTotal(nonRet.map(a => parseFloat(accountBalances[a.id]?.balance) || 0))
  const liveTrustVal = parseFloat(trustValue) || 0
  const liveGrandTotal = calcGrandTotalNetWorth(liveRetC1, liveRetC2, liveNonRet, liveTrustVal)
  const liveTotalLiabilities = calcTotalLiabilities(
    liabilities.map(l => parseFloat(liabilityBalances[l.id]) || 0)
  )

  const prFunded = prBalance >= privateReserveTarget
  const prDiff = Math.abs(prBalance - privateReserveTarget)
  const prEntered = privateReserveBalance.trim() !== ''

  // ─── Account balance updaters ─────────────────────────
  function updateAccBalance(id: string, field: 'balance' | 'cashBalance', value: string) {
    setAccountBalances(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  // ─── Submit ───────────────────────────────────────────
  async function handleSubmit() {
    const errs: string[] = []
    if (!privateReserveBalance.trim()) errs.push('Private Reserve Balance is required')
    if (!investmentAccountBalance.trim()) errs.push('Investment Account Balance is required')
    for (const acc of accounts) {
      if (!accountBalances[acc.id]?.balance.trim()) {
        const label = [acc.accountType, acc.institutionName, acc.accountNumberLast4 ? `#${acc.accountNumberLast4}` : '']
          .filter(Boolean).join(' · ')
        errs.push(`Balance required: ${label}`)
      }
    }
    if (trustEnabled && !trustValue.trim()) errs.push('Trust / Property Value is required')
    setErrors(errs)
    if (errs.length > 0) return

    setSaving(true)
    setServerError('')

    const payload = {
      clientId,
      reportDate: today,
      quarterLabel,
      inflowMonthly,
      outflowMonthly,
      excessMonthly,
      privateReserveBalance: parseFloat(privateReserveBalance),
      privateReserveTarget,
      investmentAccountBalance: parseFloat(investmentAccountBalance) || 0,
      trustValueThisQuarter: liveTrustVal,
      retirementTotalC1: liveRetC1,
      retirementTotalC2: liveRetC2,
      nonRetirementTotal: liveNonRet,
      grandTotalNetWorth: liveGrandTotal,
      totalLiabilities: liveTotalLiabilities,
      accountBalances: accounts.map(a => ({
        accountId: a.id,
        balance: parseFloat(accountBalances[a.id]?.balance) || 0,
        cashBalance: accountBalances[a.id]?.cashBalance.trim()
          ? parseFloat(accountBalances[a.id].cashBalance)
          : null,
        asOfDate: today,
      })),
      liabilityBalances: liabilities.map(l => ({
        liabilityId: l.id,
        balance: parseFloat(liabilityBalances[l.id]) || 0,
      })),
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const { reportId } = await res.json()
        router.push(`/clients/${clientId}/report/${reportId}`)
      } else {
        const body = await res.json().catch(() => ({}))
        setServerError(body.error || 'Failed to save report. Please try again.')
        setSaving(false)
      }
    } catch {
      setServerError('Network error. Please try again.')
      setSaving(false)
    }
  }

  const hasFieldError = (accountId: string) =>
    errors.some(e => e.includes(accountId)) ||
    (errors.some(e => e.startsWith('Balance required')) &&
      !accountBalances[accountId]?.balance.trim())

  return (
    <div className="pb-24">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/clients/${clientId}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-colors"
          style={{ borderColor: '#E8E3D8', color: '#6B6560', backgroundColor: 'white' }}
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>
            Generate {quarterLabel} Report — {displayName}
          </h1>
          <p className="text-sm" style={{ color: '#6B6560' }}>
            Enter current balances as of today. All math is calculated automatically.
          </p>
        </div>
      </div>

      {/* Error list */}
      {errors.length > 0 && (
        <div className="mb-6 rounded-lg px-4 py-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-sm font-medium mb-1" style={{ color: '#991B1B' }}>Please fix the following:</p>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: '#B91C1C' }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {serverError && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
          {serverError}
        </div>
      )}

      {/* ── Two-column layout: SACS | TCC ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">

        {/* ── LEFT: SACS ── */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E3D8' }}>
          <CardTitle>Monthly Cashflow (SACS)</CardTitle>
          <p className="text-xs mb-4" style={{ color: '#6B6560' }}>Profile values — edit in client profile to change</p>

          <ReadOnlyRow label="Total Monthly Inflow" value={`${formatCurrencyShort(inflowMonthly)}/mo`} />
          <ReadOnlyRow label="Monthly Expense Budget" value={`${formatCurrencyShort(outflowMonthly)}/mo`} />

          <div className="flex items-center justify-between py-2 mb-1" style={{ borderBottom: '1px solid #F5F0E8' }}>
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B6560' }}>Monthly Excess</span>
            <span className="text-sm font-semibold px-2 py-0.5 rounded" style={{ color: '#166534', backgroundColor: '#DCFCE7' }}>
              {formatCurrencyShort(excessMonthly)}/mo
            </span>
          </div>
          <div className="flex items-center justify-between py-2 mb-4" style={{ borderBottom: '1px solid #F5F0E8' }}>
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B6560' }}>Private Reserve Target</span>
            <span className="text-sm font-semibold px-2 py-0.5 rounded" style={{ color: '#166534', backgroundColor: '#DCFCE7' }}>
              {formatCurrencyShort(privateReserveTarget)}
            </span>
          </div>

          {/* Entry fields */}
          <div className="mb-4">
            <FieldLabel required>Current Pinnacle Private Reserve Balance</FieldLabel>
            <p className="text-xs mb-1.5" style={{ color: '#6B6560' }}>From Pinnacle Bank secure email</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={privateReserveBalance}
                onChange={e => setPrivateReserveBalance(e.target.value)}
                placeholder="Enter current balance"
                className={`${inputClass} pl-7`}
                style={errors.some(e => e.includes('Private Reserve Balance')) ? errorInputStyle : INPUT_STYLE}
              />
            </div>
            {prefill.privateReserveBalance != null && (
              <p className="text-xs mt-1" style={{ color: '#6B6560' }}>
                Last quarter: {formatCurrencyShort(prefill.privateReserveBalance)}
              </p>
            )}
          </div>

          <div className="mb-5">
            <FieldLabel required>Schwab Investment Account Balance</FieldLabel>
            <p className="text-xs mb-1.5" style={{ color: '#6B6560' }}>From Charles Schwab — Rebecca logs in manually</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={investmentAccountBalance}
                onChange={e => setInvestmentAccountBalance(e.target.value)}
                placeholder="Enter current balance"
                className={`${inputClass} pl-7`}
                style={errors.some(e => e.includes('Investment Account Balance')) ? errorInputStyle : INPUT_STYLE}
              />
            </div>
            {prefill.investmentAccountBalance != null && (
              <p className="text-xs mt-1" style={{ color: '#6B6560' }}>
                Last quarter: {formatCurrencyShort(prefill.investmentAccountBalance)}
              </p>
            )}
          </div>

          {/* SACS Preview */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E3D8' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B6560' }}>SACS Preview</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6B6560' }}>Inflow</span>
                <span style={{ color: '#1A1A1A' }}>{formatCurrencyShort(inflowMonthly)}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6B6560' }}>→ Outflow</span>
                <span style={{ color: '#1A1A1A' }}>{formatCurrencyShort(outflowMonthly)}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6B6560' }}>→ Excess to PR</span>
                <span style={{ color: '#1A1A1A' }}>{formatCurrencyShort(excessMonthly)}/mo</span>
              </div>
              <div className="h-px my-1" style={{ backgroundColor: '#E8E3D8' }} />
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6B6560' }}>Private Reserve</span>
                <span style={{ color: '#1A1A1A' }}>
                  {prEntered ? formatCurrencyShort(prBalance) : '—'} (current)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6B6560' }}>PR Target</span>
                <span style={{ color: '#1A1A1A' }}>{formatCurrencyShort(privateReserveTarget)}</span>
              </div>
              {prEntered && (
                <div
                  className="flex justify-between text-sm font-medium mt-2 px-2 py-1.5 rounded"
                  style={{
                    backgroundColor: prFunded ? '#DCFCE7' : '#FEF3C7',
                    color: prFunded ? '#166534' : '#92400E',
                  }}
                >
                  <span>Status</span>
                  <span>
                    {prFunded ? '✅' : '⚠️'} {prFunded ? 'Funded' : 'Short'} ({formatCurrencyShort(prDiff)} {prFunded ? 'above' : 'below'} target)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: TCC Account Balances ── */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E8E3D8' }}>
          <CardTitle>Account Balances (TCC)</CardTitle>
          <p className="text-xs mb-4" style={{ color: '#6B6560' }}>
            Enter the current balance for each account. Last quarter values shown as hints.
          </p>

          {/* C1 Retirement */}
          {retC1.length > 0 && (
            <>
              <GroupDivider title={`Client 1 Retirement — ${c1FirstName}`} />
              {retC1.map(acc => (
                <AccountRow
                  key={acc.id}
                  acc={acc}
                  balance={accountBalances[acc.id]?.balance ?? ''}
                  cashBalance={accountBalances[acc.id]?.cashBalance ?? ''}
                  hasError={hasFieldError(acc.id)}
                  prefillBalance={prefill.accountBalances[acc.id]?.balance ?? null}
                  today={today}
                  onBalanceChange={val => updateAccBalance(acc.id, 'balance', val)}
                  onCashBalanceChange={val => updateAccBalance(acc.id, 'cashBalance', val)}
                />
              ))}
              <RunningTotal label={`${c1FirstName} Retirement Total`} amount={liveRetC1} />
            </>
          )}

          {/* C2 Retirement */}
          {isMarried && retC2.length > 0 && (
            <>
              <GroupDivider title={`Client 2 Retirement — ${c2FirstName ?? 'Spouse'}`} />
              {retC2.map(acc => (
                <AccountRow
                  key={acc.id}
                  acc={acc}
                  balance={accountBalances[acc.id]?.balance ?? ''}
                  cashBalance={accountBalances[acc.id]?.cashBalance ?? ''}
                  hasError={hasFieldError(acc.id)}
                  prefillBalance={prefill.accountBalances[acc.id]?.balance ?? null}
                  today={today}
                  onBalanceChange={val => updateAccBalance(acc.id, 'balance', val)}
                  onCashBalanceChange={val => updateAccBalance(acc.id, 'cashBalance', val)}
                />
              ))}
              <RunningTotal label={`${c2FirstName ?? 'Spouse'} Retirement Total`} amount={liveRetC2} />
            </>
          )}

          {/* Non-Retirement */}
          {nonRet.length > 0 && (
            <>
              <GroupDivider title="Non-Retirement Accounts" />
              {nonRet.map(acc => (
                <AccountRow
                  key={acc.id}
                  acc={acc}
                  balance={accountBalances[acc.id]?.balance ?? ''}
                  cashBalance={accountBalances[acc.id]?.cashBalance ?? ''}
                  hasError={hasFieldError(acc.id)}
                  prefillBalance={prefill.accountBalances[acc.id]?.balance ?? null}
                  today={today}
                  onBalanceChange={val => updateAccBalance(acc.id, 'balance', val)}
                  onCashBalanceChange={val => updateAccBalance(acc.id, 'cashBalance', val)}
                />
              ))}
              <RunningTotal label="Non-Retirement Total" amount={liveNonRet} />
              <p className="text-xs mt-1.5" style={{ color: '#6B6560' }}>Trust value is tracked separately below</p>
            </>
          )}
        </div>
      </div>

      {/* ── Trust ── */}
      {trustEnabled && (
        <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '1px solid #E8E3D8' }}>
          <CardTitle>Trust / Property Value</CardTitle>
          {trustPropertyAddress && (
            <p className="text-sm mb-4" style={{ color: '#6B6560' }}>Property: {trustPropertyAddress}</p>
          )}
          <div>
            <FieldLabel required>Current Zillow Value (Zestimate)</FieldLabel>
            <p className="text-xs mb-1.5" style={{ color: '#6B6560' }}>Go to Zillow, search the address, enter the Zestimate</p>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={trustValue}
                onChange={e => setTrustValue(e.target.value)}
                placeholder="Enter Zestimate"
                className={`${inputClass} pl-7`}
                style={errors.some(e => e.includes('Trust')) ? errorInputStyle : INPUT_STYLE}
              />
            </div>
            {prefill.trustValue != null && (
              <p className="text-xs mt-1" style={{ color: '#6B6560' }}>
                Last quarter: {formatCurrencyShort(prefill.trustValue)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Liabilities ── */}
      {liabilities.length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '1px solid #E8E3D8' }}>
          <CardTitle>Liabilities (Update Balances)</CardTitle>
          <p className="text-xs mb-4" style={{ color: '#6B6560' }}>
            Liabilities are shown for reference only — not subtracted from net worth
          </p>
          <div className="space-y-4">
            {liabilities.map(l => {
              const pre = prefill.liabilityBalances[l.id]
              return (
                <div key={l.id} className="p-3 rounded-lg" style={{ backgroundColor: '#FAFAF8', border: '1px solid #F0EBE1' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>
                    {l.liabilityType} · {l.interestRate}%
                  </p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={liabilityBalances[l.id] ?? ''}
                      onChange={e =>
                        setLiabilityBalances(prev => ({ ...prev, [l.id]: e.target.value }))
                      }
                      placeholder="Current balance"
                      className={`${inputClass} pl-7`}
                      style={INPUT_STYLE}
                    />
                  </div>
                  {pre != null && (
                    <p className="text-xs mt-1" style={{ color: '#6B6560' }}>
                      Last quarter: {formatCurrencyShort(pre)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #E8E3D8' }}>
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B6560' }}>Total Liabilities</span>
            <span className="text-sm font-semibold" style={{ color: '#6B6560' }}>{formatCurrencyShort(liveTotalLiabilities)}</span>
          </div>
        </div>
      )}

      {/* ── TCC Summary Preview ── */}
      <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '1px solid #E8E3D8' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#6B6560' }}>
          TCC Calculations Preview
        </h2>
        <div className="space-y-0.5">
          {retC1.length > 0 && (
            <SummaryRow label={`${c1FirstName} Retirement Total`} value={formatCurrencyShort(liveRetC1)} />
          )}
          {isMarried && retC2.length > 0 && (
            <SummaryRow label={`${c2FirstName ?? 'Spouse'} Retirement Total`} value={formatCurrencyShort(liveRetC2)} />
          )}
          {nonRet.length > 0 && (
            <SummaryRow label="Non-Retirement Total" value={formatCurrencyShort(liveNonRet)} />
          )}
          {trustEnabled && (
            <SummaryRow label="Trust Value" value={liveTrustVal > 0 ? formatCurrencyShort(liveTrustVal) : '—'} />
          )}
          <div className="h-px my-2" style={{ backgroundColor: '#E8E3D8' }} />
          <SummaryRow label="GRAND TOTAL NET WORTH" value={formatCurrencyShort(liveGrandTotal)} bold />
          {liabilities.length > 0 && (
            <>
              <div className="h-px my-2" style={{ backgroundColor: '#F5F0E8' }} />
              <SummaryRow
                label="Liabilities (display only)"
                value={formatCurrencyShort(liveTotalLiabilities)}
                muted
              />
            </>
          )}
        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'white', borderTop: '1px solid #E8E3D8', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}
      >
        <p className="text-xs" style={{ color: '#6B6560' }}>
          All required fields must be filled before generating report
        </p>
        <div className="flex gap-3">
          <Link
            href={`/clients/${clientId}`}
            className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Generate Report & Preview →'}
          </button>
        </div>
      </div>
    </div>
  )
}
