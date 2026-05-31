const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://andamus.vercel.app/it';
const ROUTES = [
  '/', 
  '/cerca', 
  '/offri', 
  '/richieste', 
  '/profilo', 
  '/gruppi', 
  '/hubs', 
  '/hubs/events', 
  '/eventi', 
  '/statistiche', 
  '/coming-soon'
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    https.get(BASE_URL + route, (res) => {
      resolve({ route, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ route, status: 'ERROR' });
    });
  });
}

async function run() {
  let report = '# Route Health Report\n\n| Route | HTTP Status | Verdict |\n|---|---|---|\n';
  
  for (const route of ROUTES) {
    const { status } = await checkRoute(route);
    let verdict = '❌ ERROR';
    if (status === 200) verdict = '✅ LIVE';
    else if ([301, 302, 307, 308].includes(status)) verdict = '✅ REDIRECT';
    
    report += `| \`${route}\` | ${status} | ${verdict} |\n`;
  }
  
  fs.writeFileSync('route_health_report.md', report);
  console.log('Route health report generated.');
}

run();
