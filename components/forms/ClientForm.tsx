'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { calcAge, formatCurrencyShort } from '@/lib/calculations'

// ─── Types ───────────────────────────────────────────────────────────────────

type AccountRow = {
  localId: string
  id?: string
  owner: string
  category: string
  accountType: string
  institutionName: string
  accountNumberLast4: string
}

type LiabilityRow = {
  localId: string
  id?: string
  liabilityType: string
  interestRate: string
  balance: string
}

export type ClientInitialData = {
  id: string
  isMarried: boolean
  c1FirstName: string; c1LastName: string; c1Dob: string; c1SsnLast4: string
  c2FirstName?: string | null; c2LastName?: string | null; c2Dob?: string | null; c2SsnLast4?: string | null
  monthlySalaryC1: number; monthlySalaryC2: number; monthlyExpenseBudget: number; insuranceDeductibles: number
  trustEnabled: boolean; trustPropertyAddress?: string | null; trustPropertyValue?: number | null
  accounts: Array<{ id: string; owner: string; category: string; accountType: string; institutionName?: string | null; accountNumberLast4?: string | null }>
  liabilities: Array<{ id: string; liabilityType: string; interestRate: number; balance: number }>
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#C4622D]/20 focus:border-[#C4622D] transition-colors'
const INPUT_STYLE = { borderColor: '#E8E3D8', backgroundColor: 'white', color: '#1A1A1A' }
const LABEL = 'block text-xs font-medium uppercase tracking-wide mb-1.5'
const LABEL_STYLE = { color: '#6B6560' }
const CARD = 'bg-white rounded-xl border p-6 space-y-5'
const CARD_STYLE = { borderColor: '#E8E3D8' }
const SECTION_TITLE = 'text-base font-semibold mb-5'
const SECTION_TITLE_STYLE = { color: '#1A1A1A' }

function uid() { return Math.random().toString(36).slice(2) }

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL} style={LABEL_STYLE}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1 text-red-600">{error}</p>}
    </div>
  )
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6560' }}>{title}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: '#E8E3D8' }} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientForm({ initialData }: { initialData?: ClientInitialData }) {
  const router = useRouter()
  const isEdit = !!initialData

  // ── Client fields ──
  const [isMarried, setIsMarried] = useState(initialData?.isMarried ?? false)
  const [c1, setC1] = useState({
    firstName: initialData?.c1FirstName ?? '',
    lastName: initialData?.c1LastName ?? '',
    dob: initialData?.c1Dob ?? '',
    ssnLast4: initialData?.c1SsnLast4 ?? '',
  })
  const [c2, setC2] = useState({
    firstName: initialData?.c2FirstName ?? '',
    lastName: initialData?.c2LastName ?? '',
    dob: initialData?.c2Dob ?? '',
    ssnLast4: initialData?.c2SsnLast4 ?? '',
  })

  // ── Financials ──
  const [financials, setFinancials] = useState({
    salaryC1: String(initialData?.monthlySalaryC1 ?? ''),
    salaryC2: String(initialData?.monthlySalaryC2 ?? ''),
    expenseBudget: String(initialData?.monthlyExpenseBudget ?? ''),
    insuranceDeductibles: String(initialData?.insuranceDeductibles ?? ''),
  })

  // ── Trust ──
  const [trustEnabled, setTrustEnabled] = useState(initialData?.trustEnabled ?? false)
  const [trustAddress, setTrustAddress] = useState(initialData?.trustPropertyAddress ?? '')
  const [trustValue, setTrustValue] = useState(String(initialData?.trustPropertyValue ?? ''))

  // ── Accounts ──
  const initAccounts = (cat: string) =>
    (initialData?.accounts ?? [])
      .filter(a => a.category === cat)
      .map(a => ({
        localId: uid(),
        id: a.id,
        owner: a.owner,
        category: cat,
        accountType: a.accountType,
        institutionName: a.institutionName ?? '',
        accountNumberLast4: a.accountNumberLast4 ?? '',
      }))

  const [retAccounts, setRetAccounts] = useState<AccountRow[]>(initAccounts('retirement'))
  const [nrAccounts, setNrAccounts] = useState<AccountRow[]>(initAccounts('non-retirement'))

  // ── Liabilities ──
  const [liabilities, setLiabilities] = useState<LiabilityRow[]>(
    (initialData?.liabilities ?? []).map(l => ({
      localId: uid(),
      id: l.id,
      liabilityType: l.liabilityType,
      interestRate: String(l.interestRate),
      balance: String(l.balance),
    }))
  )

  // ── Form state ──
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  // ── Live calculations ──
  const totalInflow = (parseFloat(financials.salaryC1) || 0) + (isMarried ? (parseFloat(financials.salaryC2) || 0) : 0)
  const reserveTarget = 6 * (parseFloat(financials.expenseBudget) || 0) + (parseFloat(financials.insuranceDeductibles) || 0)

  // ── Account helpers ──
  const updateRetAccount = useCallback((localId: string, field: keyof AccountRow, val: string) => {
    setRetAccounts(prev => prev.map(a => a.localId === localId ? { ...a, [field]: val } : a))
  }, [])
  const updateNrAccount = useCallback((localId: string, field: keyof AccountRow, val: string) => {
    setNrAccounts(prev => prev.map(a => a.localId === localId ? { ...a, [field]: val } : a))
  }, [])
  const updateLiability = useCallback((localId: string, field: keyof LiabilityRow, val: string) => {
    setLiabilities(prev => prev.map(l => l.localId === localId ? { ...l, [field]: val } : l))
  }, [])

  // ── Validation ──
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!c1.firstName.trim()) e['c1.firstName'] = 'Required'
    if (!c1.lastName.trim()) e['c1.lastName'] = 'Required'
    if (!c1.dob) {
      e['c1.dob'] = 'Required'
    } else if (calcAge(c1.dob) < 18) {
      e['c1.dob'] = 'Client must be at least 18 years old'
    }
    if (!c1.ssnLast4.trim() || !/^\d{4}$/.test(c1.ssnLast4)) e['c1.ssnLast4'] = 'Must be 4 digits'
    if (isMarried) {
      if (!c2.firstName.trim()) e['c2.firstName'] = 'Required'
      if (!c2.lastName.trim()) e['c2.lastName'] = 'Required'
      if (!c2.dob) {
        e['c2.dob'] = 'Required'
      } else if (calcAge(c2.dob) < 18) {
        e['c2.dob'] = 'Client must be at least 18 years old'
      }
      if (!c2.ssnLast4.trim() || !/^\d{4}$/.test(c2.ssnLast4)) e['c2.ssnLast4'] = 'Must be 4 digits'
    }
    const salaryC1Val = parseFloat(financials.salaryC1)
    if (!financials.salaryC1 || salaryC1Val <= 0) e['salaryC1'] = 'Must be greater than $0'
    const salaryC2Val = isMarried ? (parseFloat(financials.salaryC2) || 0) : 0
    const expenseVal = parseFloat(financials.expenseBudget)
    if (!financials.expenseBudget || expenseVal <= 0) {
      e['expenseBudget'] = 'Must be greater than $0'
    } else if (expenseVal >= salaryC1Val + salaryC2Val) {
      e['expenseBudget'] = 'Expenses must be less than total salary'
    }
    if (retAccounts.length + nrAccounts.length === 0) {
      e['accounts'] = 'At least one account is required'
    }
    if (trustEnabled && !trustAddress.trim()) e['trustAddress'] = 'Required when trust is enabled'
    liabilities.forEach((l, i) => {
      if (!l.liabilityType.trim()) e[`liab.${i}.type`] = 'Required'
      if (!l.interestRate || parseFloat(l.interestRate) < 0) e[`liab.${i}.rate`] = 'Required'
      if (!l.balance || parseFloat(l.balance) < 0) e[`liab.${i}.balance`] = 'Required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Save ──
  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    setServerError('')

    const allAccounts = [
      ...retAccounts.map(a => ({ ...a, category: 'retirement' })),
      ...nrAccounts.map(a => ({ ...a, category: 'non-retirement' })),
    ]

    const payload = {
      isMarried,
      c1FirstName: c1.firstName.trim(),
      c1LastName: c1.lastName.trim(),
      c1Dob: c1.dob,
      c1SsnLast4: c1.ssnLast4,
      ...(isMarried ? {
        c2FirstName: c2.firstName.trim(),
        c2LastName: c2.lastName.trim(),
        c2Dob: c2.dob,
        c2SsnLast4: c2.ssnLast4,
      } : {
        c2FirstName: null, c2LastName: null, c2Dob: null, c2SsnLast4: null,
      }),
      monthlySalaryC1: parseFloat(financials.salaryC1) || 0,
      monthlySalaryC2: isMarried ? (parseFloat(financials.salaryC2) || 0) : 0,
      monthlyExpenseBudget: parseFloat(financials.expenseBudget) || 0,
      insuranceDeductibles: parseFloat(financials.insuranceDeductibles) || 0,
      trustEnabled,
      trustPropertyAddress: trustEnabled ? trustAddress.trim() : null,
      trustPropertyValue: trustEnabled && trustValue ? parseFloat(trustValue) : null,
      accounts: allAccounts.map(a => ({
        ...(a.id ? { id: a.id } : {}),
        owner: a.owner,
        category: a.category,
        accountType: a.accountType,
        institutionName: a.institutionName.trim() || null,
        accountNumberLast4: a.accountNumberLast4.trim() || null,
      })),
      liabilities: liabilities.map(l => ({
        ...(l.id ? { id: l.id } : {}),
        liabilityType: l.liabilityType.trim(),
        interestRate: parseFloat(l.interestRate),
        balance: parseFloat(l.balance),
      })),
    }

    try {
      const url = isEdit ? `/api/clients/${initialData.id}` : '/api/clients'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Save failed')
      }
      const data = await res.json()
      router.push(`/clients/${data.id ?? initialData?.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const inputClass = `${INPUT} bg-white`

  return (
    <div className="pb-28">
      <div className="space-y-6">

        {/* ── SECTION A: Household ── */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>A. Household</h2>

          {/* Married toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsMarried(v => !v)}
              className="relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0"
              style={{ backgroundColor: isMarried ? '#C4622D' : '#E8E3D8' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: isMarried ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </div>
            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Married household</span>
          </label>

          <SectionDivider title={`Client 1${isMarried ? ' — Primary' : ''}`} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" error={errors['c1.firstName']}>
              <input className={inputClass} style={INPUT_STYLE} value={c1.firstName}
                onChange={e => setC1(p => ({ ...p, firstName: e.target.value }))} placeholder="Sarah" />
            </Field>
            <Field label="Last Name *" error={errors['c1.lastName']}>
              <input className={inputClass} style={INPUT_STYLE} value={c1.lastName}
                onChange={e => setC1(p => ({ ...p, lastName: e.target.value }))} placeholder="Thompson" />
            </Field>
            <Field label="Date of Birth *" error={errors['c1.dob']}>
              <input type="date" className={inputClass} style={INPUT_STYLE} value={c1.dob}
                onChange={e => setC1(p => ({ ...p, dob: e.target.value }))} />
              {c1.dob && (
                <p className="text-xs mt-1" style={{ color: '#6B6560' }}>Age: {calcAge(c1.dob)} years old</p>
              )}
            </Field>
            <Field label="SSN Last 4 *" error={errors['c1.ssnLast4']}>
              <input className={inputClass} style={INPUT_STYLE} value={c1.ssnLast4}
                onChange={e => setC1(p => ({ ...p, ssnLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="4521" maxLength={4} inputMode="numeric" />
            </Field>
          </div>

          {isMarried && (
            <>
              <SectionDivider title="Client 2 — Spouse" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" error={errors['c2.firstName']}>
                  <input className={inputClass} style={INPUT_STYLE} value={c2.firstName}
                    onChange={e => setC2(p => ({ ...p, firstName: e.target.value }))} placeholder="Michael" />
                </Field>
                <Field label="Last Name *" error={errors['c2.lastName']}>
                  <input className={inputClass} style={INPUT_STYLE} value={c2.lastName}
                    onChange={e => setC2(p => ({ ...p, lastName: e.target.value }))} placeholder="Thompson" />
                </Field>
                <Field label="Date of Birth *" error={errors['c2.dob']}>
                  <input type="date" className={inputClass} style={INPUT_STYLE} value={c2.dob}
                    onChange={e => setC2(p => ({ ...p, dob: e.target.value }))} />
                  {c2.dob && (
                    <p className="text-xs mt-1" style={{ color: '#6B6560' }}>Age: {calcAge(c2.dob)} years old</p>
                  )}
                </Field>
                <Field label="SSN Last 4 *" error={errors['c2.ssnLast4']}>
                  <input className={inputClass} style={INPUT_STYLE} value={c2.ssnLast4}
                    onChange={e => setC2(p => ({ ...p, ssnLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="8834" maxLength={4} inputMode="numeric" />
                </Field>
              </div>
            </>
          )}
        </div>

        {/* ── SECTION B: Monthly Financials ── */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>B. Monthly Financials</h2>
          <div className="px-3 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
            All amounts are MONTHLY (after tax)
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={`${c1.firstName || 'Client 1'} Monthly Salary After Tax *`} error={errors['salaryC1']}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
                <input type="number" min="0" step="100" className={`${inputClass} pl-7`} style={INPUT_STYLE}
                  value={financials.salaryC1}
                  onChange={e => setFinancials(p => ({ ...p, salaryC1: e.target.value }))}
                  placeholder="8000" />
              </div>
            </Field>

            {isMarried && (
              <Field label={`${c2.firstName || 'Client 2'} Monthly Salary After Tax`} error={errors['salaryC2']}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
                  <input type="number" min="0" step="100" className={`${inputClass} pl-7`} style={INPUT_STYLE}
                    value={financials.salaryC2}
                    onChange={e => setFinancials(p => ({ ...p, salaryC2: e.target.value }))}
                    placeholder="7000" />
                </div>
              </Field>
            )}

            <Field label="Monthly Expense Budget *" error={errors['expenseBudget']}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
                <input type="number" min="0" step="100" className={`${inputClass} pl-7`} style={INPUT_STYLE}
                  value={financials.expenseBudget}
                  onChange={e => setFinancials(p => ({ ...p, expenseBudget: e.target.value }))}
                  placeholder="12000" />
              </div>
              <p className="text-xs mt-1" style={{ color: '#6B6560' }}>The agreed monthly transfer to spending account</p>
            </Field>

            <Field label="Insurance Deductibles Total">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
                <input type="number" min="0" step="100" className={`${inputClass} pl-7`} style={INPUT_STYLE}
                  value={financials.insuranceDeductibles}
                  onChange={e => setFinancials(p => ({ ...p, insuranceDeductibles: e.target.value }))}
                  placeholder="3500" />
              </div>
              <p className="text-xs mt-1" style={{ color: '#6B6560' }}>Sum of all insurance deductibles</p>
            </Field>
          </div>

          {/* Live calculated preview */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E3D8' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#6B6560' }}>
                Total Monthly Inflow
              </p>
              <p className="text-2xl font-bold" style={{ color: '#C4622D' }}>
                {formatCurrencyShort(totalInflow)}<span className="text-sm font-normal">/mo</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#6B6560' }}>
                = C1 {formatCurrencyShort(parseFloat(financials.salaryC1) || 0)}
                {isMarried ? ` + C2 ${formatCurrencyShort(parseFloat(financials.salaryC2) || 0)}` : ''}
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E3D8' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#6B6560' }}>
                Private Reserve Target
              </p>
              <p className="text-2xl font-bold" style={{ color: '#2D6A4F' }}>
                {formatCurrencyShort(reserveTarget)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6B6560' }}>
                = (6 × {formatCurrencyShort(parseFloat(financials.expenseBudget) || 0)}) + {formatCurrencyShort(parseFloat(financials.insuranceDeductibles) || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION C: Accounts ── */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>C. Accounts</h2>

          {/* Retirement accounts */}
          <SectionDivider title="Retirement Accounts" />
          <div className="space-y-3">
            {retAccounts.map((acct, i) => (
              <div key={acct.localId} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E3D8' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6560' }}>
                    Account {i + 1}
                  </span>
                  <button type="button" onClick={() => setRetAccounts(p => p.filter(a => a.localId !== acct.localId))}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors">✕ Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Owner *">
                    <select className={inputClass} style={INPUT_STYLE} value={acct.owner}
                      onChange={e => updateRetAccount(acct.localId, 'owner', e.target.value)}>
                      <option value="">Select owner…</option>
                      <option value="client1">Client 1 {c1.firstName ? `— ${c1.firstName}` : ''}</option>
                      {isMarried && <option value="client2">Client 2 {c2.firstName ? `— ${c2.firstName}` : ''}</option>}
                    </select>
                  </Field>
                  <Field label="Account Type *">
                    <select className={inputClass} style={INPUT_STYLE} value={acct.accountType}
                      onChange={e => updateRetAccount(acct.localId, 'accountType', e.target.value)}>
                      <option value="">Select type…</option>
                      {['IRA', 'Roth IRA', '401K', 'Pension'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Institution">
                    <input className={inputClass} style={INPUT_STYLE} value={acct.institutionName}
                      onChange={e => updateRetAccount(acct.localId, 'institutionName', e.target.value)}
                      placeholder="e.g. Charles Schwab" />
                  </Field>
                  <Field label="Account # Last 4">
                    <input className={inputClass} style={INPUT_STYLE} value={acct.accountNumberLast4}
                      onChange={e => updateRetAccount(acct.localId, 'accountNumberLast4', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="7823" maxLength={4} inputMode="numeric" />
                  </Field>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRetAccounts(p => [...p, { localId: uid(), owner: 'client1', category: 'retirement', accountType: '', institutionName: '', accountNumberLast4: '' }])}
              className="w-full py-2.5 rounded-lg border-2 border-dashed text-sm font-medium transition-colors"
              style={{ borderColor: '#E8E3D8', color: '#6B6560' }}
            >
              + Add Retirement Account
            </button>
          </div>

          {errors['accounts'] && (
            <p className="text-xs text-red-600 -mt-1">{errors['accounts']}</p>
          )}

          {/* Non-retirement accounts */}
          <SectionDivider title="Non-Retirement Accounts" />
          <div className="space-y-3">
            {nrAccounts.map((acct, i) => (
              <div key={acct.localId} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E3D8' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6560' }}>
                    Account {i + 1}
                  </span>
                  <button type="button" onClick={() => setNrAccounts(p => p.filter(a => a.localId !== acct.localId))}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors">✕ Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Owner *">
                    <select className={inputClass} style={INPUT_STYLE} value={acct.owner}
                      onChange={e => updateNrAccount(acct.localId, 'owner', e.target.value)}>
                      <option value="">Select owner…</option>
                      <option value="client1">Client 1 {c1.firstName ? `— ${c1.firstName}` : ''}</option>
                      {isMarried && <option value="client2">Client 2 {c2.firstName ? `— ${c2.firstName}` : ''}</option>}
                      <option value="joint">Joint</option>
                    </select>
                  </Field>
                  <Field label="Account Type *">
                    <select className={inputClass} style={INPUT_STYLE} value={acct.accountType}
                      onChange={e => updateNrAccount(acct.localId, 'accountType', e.target.value)}>
                      <option value="">Select type…</option>
                      {['Brokerage', 'Joint', 'Checking', 'HYSA'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Institution">
                    <input className={inputClass} style={INPUT_STYLE} value={acct.institutionName}
                      onChange={e => updateNrAccount(acct.localId, 'institutionName', e.target.value)}
                      placeholder="e.g. Pinnacle Bank" />
                  </Field>
                  <Field label="Account # Last 4">
                    <input className={inputClass} style={INPUT_STYLE} value={acct.accountNumberLast4}
                      onChange={e => updateNrAccount(acct.localId, 'accountNumberLast4', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="3344" maxLength={4} inputMode="numeric" />
                  </Field>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNrAccounts(p => [...p, { localId: uid(), owner: 'client1', category: 'non-retirement', accountType: '', institutionName: '', accountNumberLast4: '' }])}
              className="w-full py-2.5 rounded-lg border-2 border-dashed text-sm font-medium transition-colors"
              style={{ borderColor: '#E8E3D8', color: '#6B6560' }}
            >
              + Add Non-Retirement Account
            </button>
          </div>
        </div>

        {/* ── SECTION D: Trust ── */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>D. Trust</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setTrustEnabled(v => !v)}
              className="relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0"
              style={{ backgroundColor: trustEnabled ? '#C4622D' : '#E8E3D8' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: trustEnabled ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </div>
            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Trust established</span>
          </label>

          {trustEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2">
                <Field label="Property Address *" error={errors['trustAddress']}>
                  <input className={inputClass} style={INPUT_STYLE} value={trustAddress}
                    onChange={e => setTrustAddress(e.target.value)}
                    placeholder="4521 Peachtree Rd NE Atlanta GA 30305" />
                </Field>
              </div>
              <Field label="Current Property Value (Zillow)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
                  <input type="number" min="0" step="1000" className={`${inputClass} pl-7`} style={INPUT_STYLE}
                    value={trustValue} onChange={e => setTrustValue(e.target.value)} placeholder="485000" />
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B6560' }}>Updated from Zillow each quarter</p>
              </Field>
            </div>
          )}
        </div>

        {/* ── SECTION E: Liabilities ── */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>E. Liabilities</h2>

          <div className="space-y-3">
            {liabilities.map((l, i) => (
              <div key={l.localId} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E3D8' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6560' }}>
                    Liability {i + 1}
                  </span>
                  <button type="button" onClick={() => setLiabilities(p => p.filter(x => x.localId !== l.localId))}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors">✕ Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <Field label="Type *" error={errors[`liab.${i}.type`]}>
                      <input className={inputClass} style={INPUT_STYLE} value={l.liabilityType}
                        onChange={e => updateLiability(l.localId, 'liabilityType', e.target.value)}
                        placeholder="Primary Mortgage" />
                    </Field>
                  </div>
                  <Field label="Interest Rate % *" error={errors[`liab.${i}.rate`]}>
                    <input type="number" min="0" max="100" step="0.01" className={inputClass} style={INPUT_STYLE}
                      value={l.interestRate}
                      onChange={e => updateLiability(l.localId, 'interestRate', e.target.value)}
                      placeholder="4.75" />
                  </Field>
                  <Field label="Current Balance *" error={errors[`liab.${i}.balance`]}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B6560' }}>$</span>
                      <input type="number" min="0" step="1000" className={`${inputClass} pl-7`} style={INPUT_STYLE}
                        value={l.balance}
                        onChange={e => updateLiability(l.localId, 'balance', e.target.value)}
                        placeholder="312000" />
                    </div>
                  </Field>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLiabilities(p => [...p, { localId: uid(), liabilityType: '', interestRate: '', balance: '' }])}
              className="w-full py-2.5 rounded-lg border-2 border-dashed text-sm font-medium transition-colors"
              style={{ borderColor: '#E8E3D8', color: '#6B6560' }}
            >
              + Add Liability
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white"
        style={{ borderColor: '#E8E3D8' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            {Object.keys(errors).length > 0 && !serverError && (
              <p className="text-sm text-red-600">Please fix the errors above before saving.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors"
              style={{ borderColor: '#E8E3D8', color: '#1A1A1A', backgroundColor: 'white' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 inline-flex items-center gap-2"
              style={{ backgroundColor: saving ? '#A85426' : '#C4622D' }}
            >
              {saving && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
