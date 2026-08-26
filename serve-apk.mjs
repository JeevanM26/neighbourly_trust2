import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8080;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

const customerApkPath = fs.existsSync(path.join(__dirname, 'apks', 'HeroHand-Customer.apk')) 
  ? path.join(__dirname, 'apks', 'HeroHand-Customer.apk') 
  : path.join(__dirname, 'apks', 'HandsOfHeros-Customer.apk');

const workerApkPath = fs.existsSync(path.join(__dirname, 'apks', 'HeroHand-Partner.apk')) 
  ? path.join(__dirname, 'apks', 'HeroHand-Partner.apk') 
  : path.join(__dirname, 'apks', 'HandsOfHeros-Partner.apk');

const adminApkPath = fs.existsSync(path.join(__dirname, 'apks', 'HeroHand-Admin.apk')) 
  ? path.join(__dirname, 'apks', 'HeroHand-Admin.apk') 
  : path.join(__dirname, 'apks', 'ShramiXs-Admin.apk');

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/download/customer.apk') {
    if (fs.existsSync(customerApkPath)) {
      const stat = fs.statSync(customerApkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="HeroHand-Customer.apk"',
      });
      fs.createReadStream(customerApkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Customer APK not found.');
    }
    return;
  }

  if (url === '/download/worker.apk') {
    if (fs.existsSync(workerApkPath)) {
      const stat = fs.statSync(workerApkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="HeroHand-Partner.apk"',
      });
      fs.createReadStream(workerApkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Worker APK not found.');
    }
    return;
  }

  if (url === '/download/admin.apk') {
    if (fs.existsSync(adminApkPath)) {
      const stat = fs.statSync(adminApkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="HeroHand-Admin.apk"',
      });
      fs.createReadStream(adminApkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Admin APK not found.');
    }
    return;
  }

  const customerExists = fs.existsSync(customerApkPath);
  const workerExists = fs.existsSync(workerApkPath);
  const adminExists = fs.existsSync(adminApkPath);

  const customerSize = customerExists ? (fs.statSync(customerApkPath).size / (1024 * 1024)).toFixed(1) + ' MB' : 'Available';
  const workerSize = workerExists ? (fs.statSync(workerApkPath).size / (1024 * 1024)).toFixed(1) + ' MB' : 'Available';
  const adminSize = adminExists ? (fs.statSync(adminApkPath).size / (1024 * 1024)).toFixed(1) + ' MB' : 'Available';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ShramiXs — Download Mobile Apps (Android & iOS)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #041B30; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 32px 16px; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 28px; font-weight: 900; color: #F59E0B; margin-bottom: 6px; letter-spacing: -0.5px; }
    .header p { color: #94A3B8; font-size: 14px; }
    .card { background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 22px; padding: 22px; width: 100%; max-width: 480px; margin-bottom: 18px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); }
    .card-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; }
    .badge-customer { background: #1E3A8A; color: #93C5FD; }
    .badge-worker { background: #065F46; color: #6EE7B7; }
    .badge-admin { background: #78350F; color: #FDE68A; }
    .desc { color: #CBD5E1; font-size: 13px; margin-bottom: 16px; line-height: 1.4; }
    .btn { display: block; width: 100%; text-align: center; text-decoration: none; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 14px; transition: transform 0.1s; }
    .btn-blue { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
    .btn-green { background: linear-gradient(135deg, #059669, #047857); color: #fff; box-shadow: 0 4px 14px rgba(5,150,105,0.4); }
    .btn-amber { background: linear-gradient(135deg, #D97706, #B45309); color: #fff; box-shadow: 0 4px 14px rgba(217,119,6,0.4); }
    .btn:active { transform: scale(0.98); }
    .instructions { background: rgba(30, 58, 138, 0.25); border: 1px dashed rgba(96, 165, 250, 0.35); border-radius: 18px; padding: 18px; width: 100%; max-width: 480px; font-size: 13px; color: #93C5FD; line-height: 1.5; margin-bottom: 16px; }
    .instructions h4 { margin-bottom: 8px; color: #BFDBFE; font-size: 14px; font-weight: 800; }
    .instructions ol { margin-left: 20px; }
    .instructions li { margin-bottom: 4px; }
    .ios-box { background: rgba(245, 158, 11, 0.1); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: 18px; padding: 18px; width: 100%; max-width: 480px; font-size: 13px; color: #FDE68A; line-height: 1.5; }
    .ios-box h4 { margin-bottom: 8px; color: #F59E0B; font-size: 14px; font-weight: 800; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HeroHand · Hands of ShramiXs</h1>
    <p>Official Android Packages &amp; APK Installer</p>
    <p style="font-size: 12px; color: #38BDF8; margin-top: 4px;">Helplines: 8867269712 · 9480150995 · 6364419562 | Email: herohand4@gmail.com</p>
  </div>

  <!-- 1. Customer App Card -->
  <div class="card">
    <div class="card-title">
      <h2 style="font-size: 18px; font-weight: 800;">📱 Customer App (HeroHand)</h2>
      <span class="badge badge-customer">${customerSize}</span>
    </div>
    <p class="desc">Book verified electricians, plumbers, carpenters, and home cleaners with instant dispatch, map tracking, and free in-app calls.</p>
    <a class="btn btn-blue" href="/download/customer.apk" download="HeroHand-Customer.apk">⬇️ Download Customer APK (Android)</a>
  </div>

  <!-- 2. Worker Partner App Card -->
  <div class="card">
    <div class="card-title">
      <h2 style="font-size: 18px; font-weight: 800;">🛠️ Partner App (HeroHand Partner)</h2>
      <span class="badge badge-worker">${workerSize}</span>
    </div>
    <p class="desc">Receive instant gig dispatch radar alerts, accept customer jobs, navigate, complete with 4-digit PIN, and manage daily earnings.</p>
    <a class="btn btn-green" href="/download/worker.apk" download="HeroHand-Partner.apk">⬇️ Download Partner APK (Android)</a>
  </div>

  <!-- 3. Admin Hub Card -->
  <div class="card">
    <div class="card-title">
      <h2 style="font-size: 18px; font-weight: 800;">👑 Super Admin Hub</h2>
      <span class="badge badge-admin">${adminSize}</span>
    </div>
    <p class="desc">Private management cockpit: Monitor live tasks, call customers for reviews, and track platform 8% commission finances.</p>
    <a class="btn btn-amber" href="/download/admin.apk" download="HeroHand-Admin.apk">⬇️ Download Admin APK (Android)</a>
  </div>

  <!-- Android Guide -->
  <div class="instructions">
    <h4>🤖 How to Install on Android:</h4>
    <ol>
      <li>Tap the download button above on your Android phone.</li>
      <li>Tap <b>Download anyway</b> if prompted.</li>
      <li>Open the APK file and tap <b>Install</b>.</li>
    </ol>
  </div>

  <!-- iOS / iPhone Guide -->
  <div class="ios-box">
    <h4>🍎 How to Install on iPhone (iOS):</h4>
    <ol style="margin-left: 20px;">
      <li>Open Safari on your iPhone and visit the deployment link (e.g. <b>https://neighbourly-trust2.vercel.app</b>).</li>
      <li>Tap the <b>Share button</b> (square with arrow at the bottom).</li>
      <li>Scroll down and tap <b>"Add to Home Screen"</b>.</li>
      <li>The app icon will appear on your iPhone screen and run in <b>full-screen standalone app mode</b> with offline support! 🎉</li>
    </ol>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  SHRAMIXS MOBILE APP DOWNLOAD SERVER RUNNING`);
  console.log(`======================================================`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  Phone URL:   http://${localIp}:${PORT}`);
  console.log(`======================================================\n`);
});
