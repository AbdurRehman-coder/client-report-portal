export interface SacsPage1Data {
  clientName: string
  reportDate: string
  c1Name: string
  c2Name: string | null
  c1MonthlySalary: number
  c2MonthlySalary: number
  inflowMonthly: number
  outflowMonthly: number
  excessMonthly: number
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function getSacsPage1Html(data: SacsPage1Data): string {
  const prTarget = data.outflowMonthly * 6
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:816px; height:1056px;
  font-family:Arial,Helvetica,sans-serif;
  background:white; overflow:hidden;
}
.page {
  width:816px; height:1056px;
  padding:28px 40px 20px 40px;
  display:flex; flex-direction:column;
  background:white;
}
/* ── Header ─────────────────────── */
.header {
  display:flex; align-items:flex-start; justify-content:space-between;
  margin-bottom:10px;
}
.header-left { display:flex; align-items:flex-start; gap:14px; }
.dollar-icon {
  width:58px; height:58px; border-radius:50%;
  background:#3a9e4a;
  display:flex; align-items:center; justify-content:center;
  color:white; font-size:30px; font-weight:bold; flex-shrink:0;
  box-shadow:0 2px 8px rgba(58,158,74,0.4);
}
.title { font-size:17px; font-weight:bold; color:#1a1a1a; line-height:1.25; }
.salary-line { font-size:12px; color:#3a9e4a; font-weight:700; line-height:1.6; margin-top:4px; }
.header-right { text-align:right; }
.client-name { font-size:15px; font-weight:bold; color:#1a1a1a; }
.report-date { font-size:11px; color:#666; margin-top:3px; }
.divider { height:2px; background:linear-gradient(to right,#3a9e4a,#ddd); margin:10px 0; }
/* ── Body ───────────────────────── */
.body { flex:1; display:flex; flex-direction:column; }
/* Circles row */
.circles-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:0 10px; margin-top:24px;
}
.circle {
  width:220px; height:220px; border-radius:50%;
  display:flex; flex-direction:column;
  align-items:center; justify-content:space-between;
  padding:20px 18px; flex-shrink:0;
}
.circle-green { background:#3a9e4a; box-shadow:0 4px 16px rgba(58,158,74,0.4); }
.circle-red   { background:#c0392b; box-shadow:0 4px 16px rgba(192,57,43,0.4); }
.circle-blue  { background:#2e6da4; box-shadow:0 4px 16px rgba(46,109,164,0.4); }
.circle-label {
  font-size:12px; font-weight:bold; color:white;
  text-align:center; letter-spacing:1px; text-transform:uppercase;
}
.circle-pill {
  background:white; border-radius:24px;
  padding:7px 20px;
  font-size:20px; font-weight:bold; color:#1a1a1a;
  text-align:center; white-space:nowrap;
}
.circle-floor { font-size:9.5px; color:rgba(255,255,255,0.85); text-align:center; }
/* Arrow zone */
.arrow-zone {
  flex:1; display:flex; flex-direction:column;
  align-items:center; justify-content:center; padding:0 8px;
}
.h-arrow { display:flex; align-items:center; width:100%; }
.h-arrow-line { flex:1; height:4px; background:#c0392b; }
.h-arrow-head {
  width:0; height:0;
  border-top:10px solid transparent;
  border-bottom:10px solid transparent;
  border-left:16px solid #c0392b;
}
.arrow-label { font-size:11px; color:#c0392b; font-weight:700; text-align:center; margin-top:4px; }
.arrow-sub   { font-size:9.5px; color:#888; text-align:center; margin-top:2px; font-style:italic; }
/* L-arrow connector */
.connector {
  position:relative; width:100%; height:110px;
  margin-top:8px;
}
.conn-v {
  position:absolute; left:120px; top:0;
  width:3px; height:100%; background:#2e6da4;
}
.conn-h {
  position:absolute; left:120px; bottom:0;
  width:268px; height:3px; background:#2e6da4;
}
.conn-arrow-down {
  position:absolute; left:379px; bottom:-8px;
  width:0; height:0;
  border-left:8px solid transparent;
  border-right:8px solid transparent;
  border-top:12px solid #2e6da4;
}
.conn-amount {
  position:absolute; left:14px; top:28px;
  font-size:13px; font-weight:bold; color:#2e6da4;
}
/* PR section */
.pr-section {
  display:flex; flex-direction:column; align-items:center;
  margin-top:6px;
}
.pr-piggy { font-size:36px; line-height:1; margin:2px 0; }
.bottom-label {
  font-size:15px; font-weight:bold; color:#1a1a1a;
  letter-spacing:2px; margin-top:14px; text-align:center;
}
.x-label { font-size:11px; color:#555; text-align:center; margin-top:4px; }
.footnote {
  font-size:9px; color:#888; text-align:center;
  margin-top:auto; padding-top:10px;
}
/* Docs icon (stacked rectangles top-right) */
.docs-icon {
  position:relative; width:36px; height:44px; flex-shrink:0;
}
.doc-rect {
  position:absolute; width:28px; height:36px;
  border:1.5px solid #aaa; background:white; border-radius:3px;
}
</style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ── -->
  <div class="header">
    <div class="header-left">
      <div class="dollar-icon">$</div>
      <div>
        <div class="title">Simple Automated Cashflow System<br>(SACS)</div>
        <div class="salary-line">${fmt(data.c1MonthlySalary)} - ${data.c1Name}</div>
        ${data.c2Name ? `<div class="salary-line">${fmt(data.c2MonthlySalary)} - ${data.c2Name}</div>` : ''}
      </div>
    </div>
    <div style="display:flex; align-items:flex-start; gap:14px;">
      <div class="header-right">
        <div class="client-name">${data.clientName}</div>
        <div class="report-date">${data.reportDate}</div>
      </div>
      <!-- Stacked docs icon -->
      <div class="docs-icon">
        <div class="doc-rect" style="top:8px; left:8px; background:#f5f5f5;"></div>
        <div class="doc-rect" style="top:4px; left:4px; background:#ebebeb;"></div>
        <div class="doc-rect" style="top:0; left:0; background:white;"></div>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="body">

    <!-- ── CIRCLES ROW ── -->
    <div class="circles-row">

      <!-- Inflow -->
      <div class="circle circle-green">
        <div class="circle-label">INFLOW</div>
        <div class="circle-pill">${fmt(data.inflowMonthly)}</div>
        <div class="circle-floor">$1,000 Floor</div>
      </div>

      <!-- Arrow zone -->
      <div class="arrow-zone">
        <div class="h-arrow">
          <div class="h-arrow-line"></div>
          <div class="h-arrow-head"></div>
        </div>
        <div class="arrow-label">X = ${fmt(data.outflowMonthly)}/month*</div>
        <div class="arrow-sub">Automated transfer on the 28th</div>
      </div>

      <!-- Outflow -->
      <div class="circle circle-red">
        <div class="circle-label">OUTFLOW</div>
        <div class="circle-pill">${fmt(data.outflowMonthly)}</div>
        <div class="circle-floor">$1,000 Floor</div>
      </div>

    </div><!-- /circles-row -->

    <!-- ── L-SHAPED CONNECTOR ── -->
    <div class="connector">
      <div class="conn-v"></div>
      <div class="conn-h"></div>
      <div class="conn-arrow-down"></div>
      <div class="conn-amount">${fmt(data.excessMonthly)}/mo*</div>
    </div>

    <!-- ── PRIVATE RESERVE CIRCLE ── -->
    <div class="pr-section">
      <div class="circle circle-blue">
        <div class="circle-label">PRIVATE RESERVE</div>
        <div class="pr-piggy">🐷</div>
        <div class="circle-pill" style="font-size:13px; padding:5px 14px;">
          Target: ${fmt(prTarget)}
        </div>
      </div>

      <div class="bottom-label">MONTHLY CASHFLOW</div>
      <div class="x-label">X = Monthly Expenses</div>
    </div>

  </div><!-- /body -->

  <div class="footnote">* Approximate monthly amount</div>

</div>
</body>
</html>`
}
