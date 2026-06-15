const fs = require('fs');
const path = require('path');

const inFile = process.argv[2] || 'summary.json';
const outFile = process.argv[3] || 'k6-report.html';

if (!fs.existsSync(inFile)) {
  console.error(`Input file not found: ${inFile}`);
  process.exit(1);
}

const raw = fs.readFileSync(inFile, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(1);
}

const metrics = data.metrics || {};

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>k6 Summary Report</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;padding:18px}
    h1{font-size:18px}
    .metric{margin-bottom:18px;border:1px solid #ddd;padding:10px;border-radius:6px}
    table{border-collapse:collapse;width:100%}
    th,td{padding:6px 8px;border:1px solid #eee;text-align:left}
    th{background:#f6f6f6}
    caption{font-weight:bold;margin-bottom:6px}
  </style>
</head>
<body>
  <h1>k6 Summary Report</h1>
  <p>Generated from <strong>${escape(path.basename(inFile))}</strong></p>
`;

const metricNames = Object.keys(metrics);
if (metricNames.length === 0) {
  html += '<p>No metrics found in summary JSON.</p>\n';
} else {
  metricNames.forEach((name) => {
    const m = metrics[name];
    const values = m.values || m;
    html += `<div class="metric"><table><caption>${escape(name)} &nbsp; <small>(${escape(m.type||'')})</small></caption>`;
    html += '<thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
    Object.keys(values).forEach((k) => {
      const v = values[k];
      html += `<tr><td>${escape(k)}</td><td>${escape(typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`;
    });
    html += '</tbody></table></div>';
  });
}

html += '\n</body>\n</html>';

fs.writeFileSync(outFile, html, 'utf8');
console.log(`Report written to ${outFile}`);
