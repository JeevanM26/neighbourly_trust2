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

const customerApkPath = path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const workerApkPath = path.join(__dirname, 'worker', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/download/customer.apk') {
    if (fs.existsSync(customerApkPath)) {
      const stat = fs.statSync(customerApkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="Neighborly-Customer.apk"',
      });
      fs.createReadStream(customerApkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Customer APK is still compiling. Please refresh in a moment.');
    }
    return;
  }

  if (url === '/download/worker.apk') {
    if (fs.existsSync(workerApkPath)) {
      const stat = fs.statSync(workerApkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="Neighborly-Worker.apk"',
      });
      fs.createReadStream(workerApkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Worker APK is still compiling. Please refresh in a moment.');
    }
    return;
  }

  const customerExists = fs.existsSync(customerApkPath);
  const workerExists = fs.existsSync(workerApkPath);

  const customerSize = customerExists ? (fs.statSync(customerApkPath).size / (1024 * 1024)).toFixed(1) + ' MB' : 'Compiling...';
  const workerSize = workerExists ? (fs.statSync(workerApkPath).size / (1024 * 1024)).toFixed(1) + ' MB' : 'Compiling...';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Neighborly Trust — Download Apps</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #041B30; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 26px; font-weight: 800; color: #60A5FA; margin-bottom: 6px; }
    .header p { color: #94A3B8; font-size: 14px; }
    .card { background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 22px; width: 100%; max-width: 440px; margin-bottom: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .card-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
    .badge-customer { background: #1E3A8A; color: #93C5FD; }
    .badge-worker { background: #065F46; color: #6EE7B7; }
    .desc { color: #CBD5E1; font-size: 13px; margin-bottom: 18px; line-height: 1.4; }
    .btn { display: block; width: 100%; text-align: center; text-decoration: none; padding: 14px; border-radius: 14px; font-weight: 700; font-size: 15px; transition: transform 0.1s; }
    .btn-blue { background: #2563EB; color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
    .btn-green { background: #059669; color: #fff; box-shadow: 0 4px 14px rgba(5,150,105,0.4); }
    .btn:active { transform: scale(0.98); }
    .instructions { background: rgba(30, 58, 138, 0.25); border: 1px dashed rgba(96, 165, 250, 0.3); border-radius: 16px; padding: 16px; width: 100%; max-width: 440px; font-size: 12px; color: #93C5FD; line-height: 1.5; }
    .instructions h4 { margin-bottom: 8px; color: #BFDBFE; font-size: 13px; font-weight: 700; }
    .instructions ol { margin-left: 20px; }
    .instructions li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Neighborly Trust</h1>
    <p>Mobile Test Hub &amp; APK Installer</p>
  </div>

  <!-- Customer App Card -->
  <div class="card">
    <div class="card-title">
      <h2 style="font-size: 18px;">Customer App</h2>
      <span class="badge badge-customer">${customerSize}</span>
    </div>
    <p class="desc">Book local trusted service professionals, verify 4-digit PINs, and make encrypted WebRTC phone calls.</p>
    ${customerExists 
      ? `<a class="btn btn-blue" href="/download/customer.apk" download="Neighborly-Customer.apk">⬇️ Download Customer APK</a>`
      : `<button class="btn btn-blue" style="opacity:0.6;" disabled>⏳ Compiling APK...</button>`}
  </div>

  <!-- Worker Partner App Card -->
  <div class="card">
    <div class="card-title">
      <h2 style="font-size: 18px;">Worker Partner App</h2>
      <span class="badge badge-worker">${workerSize}</span>
    </div>
    <p class="desc">Receive instant booking radar notifications, accept gigs, navigate to customer locations, and track earnings.</p>
    ${workerExists 
      ? `<a class="btn btn-green" href="/download/worker.apk" download="Neighborly-Worker.apk">⬇️ Download Worker APK</a>`
      : `<button class="btn btn-green" style="opacity:0.6;" disabled>⏳ Compiling APK...</button>`}
  </div>

  <!-- Install Guide -->
  <div class="instructions">
    <h4>📲 How to Install on Android:</h4>
    <ol>
      <li>Tap the download button above on your phone.</li>
      <li>When prompted <i>"File might be harmful"</i>, tap <b>Download anyway</b>.</li>
      <li>Open the downloaded APK and tap <b>Install</b> (allow <i>Install unknown apps</i> if asked).</li>
      <li>Open Neighborly Trust and enjoy! 🎉</li>
    </ol>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Mobile Test Hub Running!`);
  console.log(`👉 Open on your phone browser (same Wi-Fi): http://${localIp}:${PORT}`);
  console.log(`👉 Or on this computer: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
