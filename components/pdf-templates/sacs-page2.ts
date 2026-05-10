export interface SacsPage2Data {
  clientName: string
  reportDate: string
  privateReserveBalance: number
  privateReserveTarget: number
  investmentBalance: number
  monthlyExpenses: number
  insuranceDeductibles: number
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function getSacsPage2Html(data: SacsPage2Data): string {
  const ficaFunded = data.privateReserveBalance >= data.privateReserveTarget
  const ficaStatus = ficaFunded
    ? `✅ Funded — ${fmt(data.privateReserveBalance - data.privateReserveTarget)} above target`
    : `⚠ Short — ${fmt(data.privateReserveTarget - data.privateReserveBalance)} below target`

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
.header-right { text-align:right; }
.client-name { font-size:15px; font-weight:bold; color:#1a1a1a; }
.report-date { font-size:11px; color:#666; margin-top:3px; }
.divider { height:2px; background:linear-gradient(to right,#3a9e4a,#ddd); margin:10px 0; }
/* ── Body ───────────────────────── */
.body { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:28px 0 24px; }
/* Circles row */
.circles-row {
  display:flex; align-items:center; justify-content:center;
  gap:0; width:100%;
}
/* FICA circle — light blue, larger */
.fica-circle {
  width:330px; height:330px; border-radius:50%;
  background:#a8c8e8;
  display:flex; flex-direction:column;
  align-items:center; justify-content:space-between;
  padding:32px 26px;
  box-shadow:0 4px 24px rgba(168,200,232,0.55);
  flex-shrink:0;
}
/* Investment circle — dark navy, smaller */
.inv-circle {
  width:250px; height:250px; border-radius:50%;
  background:#1a3a6b;
  display:flex; flex-direction:column;
  align-items:center; justify-content:space-between;
  padding:24px 20px;
  box-shadow:0 4px 24px rgba(26,58,107,0.45);
  flex-shrink:0;
}
.circle-label-dark  { font-size:12px; font-weight:bold; color:#1a3a6b; letter-spacing:1px; text-align:center; }
.circle-label-light { font-size:12px; font-weight:bold; color:white;   letter-spacing:1px; text-align:center; }
.pill-dark {
  background:white; border-radius:22px;
  padding:8px 20px;
  font-size:20px; font-weight:bold; color:#1a3a6b; text-align:center;
  white-space:nowrap;
}
.pill-light {
  background:rgba(255,255,255,0.2); border-radius:22px;
  border:1.5px solid rgba(255,255,255,0.6);
  padding:8px 16px;
  font-size:18px; font-weight:bold; color:white; text-align:center;
  white-space:nowrap;
}
.circle-sub-dark  { font-size:10px; color:#2a5a80; text-align:center; }
.circle-sub-light { font-size:10px; color:rgba(255,255,255,0.8); text-align:center; }
/* Arrow connector between circles */
.arrow-connector {
  display:flex; flex-direction:column; align-items:center;
  justify-content:center; width:120px; flex-shrink:0;
  padding:0 10px;
}
.dashed-line {
  width:100%; height:2px;
  background:repeating-linear-gradient(
    to right, #3a7dc4 0px, #3a7dc4 8px, transparent 8px, transparent 14px
  );
  margin:8px 0;
}
.double-arrow {
  display:flex; align-items:center; width:100%;
}
.arrow-left {
  width:0; height:0;
  border-top:8px solid transparent;
  border-bottom:8px solid transparent;
  border-right:12px solid #3a7dc4;
  flex-shrink:0;
}
.arrow-line { flex:1; height:3px; background:#3a7dc4; }
.arrow-right {
  width:0; height:0;
  border-top:8px solid transparent;
  border-bottom:8px solid transparent;
  border-left:12px solid #3a7dc4;
  flex-shrink:0;
}
/* Below circles labels */
.circles-labels {
  display:flex; justify-content:space-between;
  width:100%; padding:0 10px;
}
.circle-below-label {
  width:330px; text-align:center;
  font-size:12px; color:#444; line-height:1.6;
}
.circle-below-label.inv { width:250px; }
/* Status badge */
.status-badge {
  margin:0 auto;
  padding:10px 30px;
  border-radius:24px;
  font-size:14px; font-weight:600;
  text-align:center; display:inline-block;
}
.status-funded { background:#DCFCE7; color:#166534; border:1px solid #86EFAC; }
.status-short  { background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; }
/* Target annotation */
.target-note {
  font-size:11px; color:#666; text-align:center;
  margin-top:8px;
}
/* Bottom section */
.bottom-section { text-align:center; width:100%; }
.bottom-title { font-size:26px; font-weight:bold; color:#1a1a1a; letter-spacing:3px; }
.bottom-sub { font-size:14px; color:#2e6da4; font-style:italic; margin-top:10px; }
.footnote { font-size:9px; color:#888; text-align:center; margin-top:auto; padding-top:16px; }
</style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ── -->
  <div class="header">
    <div class="header-left">
      <div class="dollar-icon">$</div>
      <div>
        <div class="title">Simple Automated Cashflow System<br>(SACS) — Long Term Cashflow</div>
      </div>
    </div>
    <div class="header-right">
      <div class="client-name">${data.clientName}</div>
      <div class="report-date">${data.reportDate}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="body">

    <!-- ── CIRCLES + LABELS (grouped) ── -->
    <div style="width:100%; display:flex; flex-direction:column; align-items:center;">
      <div class="circles-row">

        <!-- FICA / Private Reserve circle -->
        <div class="fica-circle">
          <div class="circle-label-dark">PINNACLE PRIVATE RESERVE<br>(FICA ACCOUNT)</div>
          <div class="pill-dark">${fmt(data.privateReserveBalance)}</div>
          <div class="circle-sub-dark">Current Balance<br>Target: ${fmt(data.privateReserveTarget)}</div>
        </div>

        <!-- Arrow connector -->
        <div class="arrow-connector">
          <div class="dashed-line"></div>
          <div class="double-arrow">
            <div class="arrow-left"></div>
            <div class="arrow-line"></div>
            <div class="arrow-right"></div>
          </div>
          <div class="dashed-line"></div>
        </div>

        <!-- Investment circle -->
        <div class="inv-circle">
          <div class="circle-label-light">SCHWAB<br>INVESTMENT ACCOUNT</div>
          <div class="pill-light">${fmt(data.investmentBalance)}</div>
          <div class="circle-sub-light">Remainder</div>
        </div>

      </div><!-- /circles-row -->

      <!-- Below-circle labels -->
      <div class="circles-labels" style="margin-top:14px;">
        <div class="circle-below-label">
          <strong>6× Monthly Expenses + Deductibles</strong><br>
          6 × ${fmt(data.monthlyExpenses)} + ${fmt(data.insuranceDeductibles)}<br>
          = ${fmt(data.privateReserveTarget)} target
        </div>
        <div style="width:120px; flex-shrink:0;"></div>
        <div class="circle-below-label inv">
          <strong>Schwab Brokerage</strong><br>
          Investment portfolio
        </div>
      </div>

      <!-- Status badge — inside group so it stays tight -->
      <div style="text-align:center; margin-top:18px;">
        <span class="status-badge ${ficaFunded ? 'status-funded' : 'status-short'}">${ficaStatus}</span>
      </div>
    </div><!-- /circles+labels+badge group -->

    <!-- Bottom section -->
    <div class="bottom-section">
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:18px;">
        <div style="flex:1; height:2px; background:linear-gradient(to right, transparent, #2e6da4);"></div>
        <div style="width:10px; height:10px; border-radius:50%; background:#2e6da4;"></div>
        <div style="flex:1; height:2px; background:linear-gradient(to left, transparent, #2e6da4);"></div>
      </div>
      <div class="bottom-title">LONG TERM CASHFLOW</div>
      <div class="bottom-sub">(Magnified Private Reserve Cashflow)</div>
    </div>

  </div><!-- /body -->

  <div class="footnote">
    FICA = Financial Independence / Cashflow Account &nbsp;|&nbsp; Target = 6 months expenses + insurance deductibles
  </div>

</div>
</body>
</html>`
}
