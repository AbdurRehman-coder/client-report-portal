export interface AccountSnapshot {
  accountType: string
  institutionName: string
  accountNumberLast4: string
  balance: number
  cashBalance: number | null
  asOfDate: string
  owner: string
}

export interface LiabilitySnapshot {
  liabilityType: string
  interestRate: number
  balance: number
}

export interface TccData {
  clientName: string
  reportDate: string
  reportQuarter: string
  client1: { firstName: string; lastName: string; age: number; dob: string; ssnLast4: string }
  client2: { firstName: string; lastName: string; age: number; dob: string; ssnLast4: string } | null
  retirementAccountsC1: AccountSnapshot[]
  retirementAccountsC2: AccountSnapshot[]
  nonRetirementAccounts: AccountSnapshot[]
  trust: { name: string; address: string; value: number } | null
  liabilities: LiabilitySnapshot[]
  totals: {
    retirementC1: number
    retirementC2: number
    nonRetirement: number
    trustValue: number
    grandTotal: number
    totalLiabilities: number
  }
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDob(dob: string): string {
  const d = new Date(dob)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function accountOval(acc: AccountSnapshot): string {
  const hasCash = acc.cashBalance != null && acc.cashBalance > 0
  return `
    <div style="
      border:1.5px solid #555; border-radius:40%;
      padding:10px 8px; text-align:center; font-size:10px;
      min-width:130px; min-height:105px;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      background:white; margin:4px;
      line-height:1.4;
    ">
      <div style="font-weight:bold; color:#333;">ACCT #${acc.accountNumberLast4 || '----'}</div>
      <div style="font-size:9.5px; color:#555; text-transform:uppercase; letter-spacing:0.5px;">
        ${acc.accountType}
      </div>
      <div style="font-size:13px; font-weight:bold; color:#1a1a1a; margin:3px 0;">${fmt(acc.balance)}</div>
      <div style="font-size:8.5px; color:#888;">a/o ${acc.asOfDate}</div>
      ${hasCash ? `
        <div style="
          margin-top:5px; background:#f0f9f1; border:1px solid #6b8e4e;
          border-radius:50%; width:50px; height:50px;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          font-size:8px; color:#3a6e2a; line-height:1.2;
        ">
          <div style="font-weight:bold;">${fmt(acc.cashBalance!)}</div>
          <div>Cash</div>
        </div>
      ` : ''}
    </div>`
}

export function getTccHtml(data: TccData): string {
  const c1 = data.client1
  const c2 = data.client2

  // Build account oval rows
  const c1RetOvals = data.retirementAccountsC1.map(accountOval).join('')
  const c2RetOvals = data.retirementAccountsC2.map(accountOval).join('')
  const nonRetOvals = data.nonRetirementAccounts.map(accountOval).join('')

  const liabilityRows = data.liabilities.map(l => `
    <div style="display:flex; justify-content:space-between; font-size:10px; padding:2px 0; border-bottom:1px solid #eee;">
      <span>${l.liabilityType} (${l.interestRate}%)</span>
      <span style="font-weight:600;">${fmt(l.balance)}</span>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:816px; height:1056px;
  font-family:Arial,Helvetica,sans-serif;
  background:white; overflow:hidden; font-size:11px;
}
.page {
  width:816px; height:1056px;
  padding:16px 18px;
  display:flex; flex-direction:column;
  background:white;
}
/* ── TOP BAR ── */
.top-bar {
  display:flex; align-items:stretch;
  gap:8px; margin-bottom:8px;
}
.top-bar-left {
  flex:1;
  display:flex; flex-direction:column; justify-content:center;
  gap:4px;
}
.name-field {
  font-size:13px; font-weight:bold; color:#1a1a1a;
  border-bottom:1.5px solid #333; padding-bottom:3px;
  display:inline-block;
}
.name-label { font-size:10px; color:#666; margin-right:4px; }
.top-bar-center {
  background:#2c2c2c; color:white;
  border-radius:6px; padding:8px 20px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-width:160px;
}
.grand-total-label { font-size:9px; letter-spacing:1px; text-transform:uppercase; color:#aaa; }
.grand-total-amount { font-size:20px; font-weight:bold; color:white; line-height:1.1; margin:3px 0; }
.liab-box {
  background:#f0f0f0; border:1px solid #ccc;
  border-radius:6px; padding:8px 16px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-width:130px;
}
.liab-label { font-size:9px; color:#555; letter-spacing:0.5px; }
.liab-amount { font-size:14px; font-weight:bold; color:#444; margin-top:2px; }
.liab-date { font-size:8.5px; color:#888; margin-top:2px; }
/* ── CLIENT CIRCLES ROW ── */
.clients-row {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:6px; padding:0 4px;
}
.client-box {
  background:#3a3a3a; color:white;
  border-radius:6px; padding:8px 12px;
  text-align:center; min-width:110px;
}
.client-box-label { font-size:8.5px; color:#aaa; letter-spacing:0.5px; }
.client-box-amount { font-size:15px; font-weight:bold; color:white; margin-top:3px; }
.client-circle {
  width:150px; height:150px; border-radius:50%;
  background:#6b8e4e;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  padding:14px 10px; flex-shrink:0;
  box-shadow:0 3px 12px rgba(107,142,78,0.35);
}
.client-circle-name { font-size:14px; font-weight:bold; color:white; text-align:center; }
.client-circle-info { font-size:9px; color:rgba(255,255,255,0.85); text-align:center; margin-top:4px; line-height:1.5; }
/* ── SECTION DIVIDER ── */
.section-divider {
  display:flex; align-items:center; gap:8px;
  margin:6px 0 4px;
}
.section-divider-line { flex:1; height:1.5px; background:#6b8e4e; }
.section-divider-label {
  font-size:9px; font-weight:bold; color:#6b8e4e;
  letter-spacing:2px; text-transform:uppercase;
  white-space:nowrap;
}
/* ── ACCOUNT OVALS GRID ── */
.ovals-grid {
  display:flex; flex-wrap:wrap; gap:4px;
  justify-content:flex-start; align-items:flex-start;
  flex:1;
}
.retirement-row {
  display:flex; gap:8px; margin-bottom:4px;
}
.retirement-col {
  flex:1; display:flex; flex-wrap:wrap;
  align-items:flex-start; min-height:120px;
}
/* Trust oval — larger */
.trust-oval {
  border:2px solid #6b8e4e; border-radius:40%;
  padding:12px 16px; text-align:center;
  min-width:180px; min-height:120px;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  background:#f8fcf5; margin:4px;
}
/* ── LIABILITIES BOX ── */
.liab-box-inner {
  border:1px solid #ccc; border-radius:6px;
  padding:8px 10px; background:#f9f9f9;
  min-width:170px;
}
.liab-box-title { font-size:10px; font-weight:bold; color:#333; margin-bottom:5px; }
/* ── BOTTOM BAR ── */
.bottom-bar {
  display:flex; align-items:center; justify-content:space-between;
  gap:8px; margin-top:6px;
}
.nr-total-box {
  background:#2c2c2c; color:white;
  border-radius:6px; padding:7px 16px;
  font-size:12px; font-weight:bold; flex:1;
  display:flex; align-items:center; justify-content:center;
  letter-spacing:1px;
}
.footnote-box {
  border:1.5px solid #c0392b; border-radius:6px;
  padding:6px 10px; font-size:9px; color:#c0392b;
  max-width:200px; text-align:center;
}
</style>
</head>
<body>
<div class="page">

  <!-- ── TOP BAR ── -->
  <div class="top-bar">
    <div class="top-bar-left">
      <div>
        <span class="name-label">NAME:</span>
        <span class="name-field">${data.clientName}</span>
      </div>
      <div>
        <span class="name-label">DATE:</span>
        <span class="name-field">${data.reportQuarter}</span>
      </div>
    </div>
    <div class="top-bar-center">
      <div class="grand-total-label">GRAND TOTAL</div>
      <div class="grand-total-amount">${fmt(data.totals.grandTotal)}</div>
    </div>
    <div class="liab-box">
      <div class="liab-label">LIABILITIES</div>
      <div class="liab-amount">${fmt(data.totals.totalLiabilities)}</div>
      <div class="liab-date">a/o ${data.reportDate}</div>
    </div>
  </div>

  <!-- ── CLIENT CIRCLES ROW ── -->
  <div class="clients-row">
    <!-- C1 summary box -->
    <div class="client-box">
      <div class="client-box-label">${c1.firstName} RETIREMENT ONLY</div>
      <div class="client-box-amount">${fmt(data.totals.retirementC1)}</div>
    </div>

    <!-- C1 circle -->
    <div class="client-circle">
      <div class="client-circle-name">${c1.firstName}<br>${c1.lastName}</div>
      <div class="client-circle-info">
        Age: ${c1.age}<br>
        DOB: ${fmtDob(c1.dob)}<br>
        SSN: ***-**-${c1.ssnLast4}
      </div>
    </div>

    <!-- Spacer with grand total label -->
    <div style="text-align:center; flex:1; font-size:10px; color:#888;">
      Anderson Wealth<br>Management
    </div>

    <!-- C2 circle -->
    ${c2 ? `
    <div class="client-circle">
      <div class="client-circle-name">${c2.firstName}<br>${c2.lastName}</div>
      <div class="client-circle-info">
        Age: ${c2.age}<br>
        DOB: ${fmtDob(c2.dob)}<br>
        SSN: ***-**-${c2.ssnLast4}
      </div>
    </div>
    <div class="client-box">
      <div class="client-box-label">${c2.firstName} RETIREMENT ONLY</div>
      <div class="client-box-amount">${fmt(data.totals.retirementC2)}</div>
    </div>
    ` : '<div></div><div></div>'}
  </div>

  <!-- ── RETIREMENT SECTION ── -->
  <div class="section-divider">
    <div class="section-divider-line"></div>
    <div class="section-divider-label">Retirement</div>
    <div class="section-divider-line"></div>
    ${c2 ? `<div class="section-divider-label">Retirement</div><div class="section-divider-line"></div>` : ''}
  </div>

  <div class="retirement-row">
    <div class="retirement-col" style="justify-content:flex-start;">
      ${c1RetOvals || '<div style="font-size:10px;color:#999;padding:8px;">No retirement accounts</div>'}
    </div>
    ${c2 ? `
    <div style="width:1.5px; background:#ddd; align-self:stretch; flex-shrink:0;"></div>
    <div class="retirement-col" style="justify-content:flex-end;">
      ${c2RetOvals || '<div style="font-size:10px;color:#999;padding:8px;">No retirement accounts</div>'}
    </div>
    ` : ''}
  </div>

  <!-- ── NON-RETIREMENT SECTION ── -->
  <div class="section-divider" style="margin-top:6px;">
    <div class="section-divider-line"></div>
    <div class="section-divider-label">Non-Retirement</div>
    <div class="section-divider-line"></div>
    <div class="section-divider-label">Non-Retirement</div>
    <div class="section-divider-line"></div>
  </div>

  <!-- Non-retirement + trust + liabilities -->
  <div style="display:flex; align-items:flex-start; flex:1; gap:8px;">

    <!-- Non-retirement account ovals -->
    <div style="flex:1; display:flex; flex-wrap:wrap; align-items:flex-start;">
      ${nonRetOvals || '<div style="font-size:10px;color:#999;padding:8px;">No non-retirement accounts</div>'}
    </div>

    <!-- Trust oval + liabilities box -->
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px; min-width:190px; flex-shrink:0;">
      ${data.trust ? `
      <div class="trust-oval">
        <div style="font-size:9.5px; font-weight:bold; color:#6b8e4e; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">FAMILY TRUST</div>
        <div style="font-size:10px; color:#555; margin-bottom:6px; line-height:1.3;">${data.trust.address}</div>
        <div style="font-size:16px; font-weight:bold; color:#1a1a1a;">${fmt(data.trust.value)}</div>
        <div style="font-size:8.5px; color:#888; margin-top:3px;">Zillow Zestimate</div>
      </div>
      ` : ''}

      ${data.liabilities.length > 0 ? `
      <div class="liab-box-inner">
        <div class="liab-box-title">LIABILITIES</div>
        ${liabilityRows}
        <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; padding-top:4px; margin-top:2px; border-top:1.5px solid #999;">
          <span>Total</span>
          <span>${fmt(data.totals.totalLiabilities)}</span>
        </div>
        <div style="font-size:8px; color:#888; margin-top:4px; font-style:italic;">
          Displayed for reference only —<br>not subtracted from net worth
        </div>
      </div>
      ` : ''}
    </div>

  </div>

  <!-- ── BOTTOM BAR ── -->
  <div class="bottom-bar">
    <div class="nr-total-box">
      NON RETIREMENT TOTAL: ${fmt(data.totals.nonRetirement)}
    </div>
    <div class="footnote-box">
      * Indicates we do not have<br>up to date information
    </div>
  </div>

</div>
</body>
</html>`
}
