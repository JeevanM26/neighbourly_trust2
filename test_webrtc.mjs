import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser with fake media streams...");
  const browser = await chromium.launch({
    headless: true, // run headlessly
    channel: 'msedge',
    args: [
      '--disable-gpu',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--auto-accept-camera-and-microphone-capture'
    ]
  });

  const workerContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
  const customerContext = await browser.newContext({ permissions: ['microphone', 'camera'] });

  const workerPage = await workerContext.newPage();
  const customerPage = await customerContext.newPage();

  console.log("Navigating to Worker App...");
  await workerPage.goto('http://localhost:3001');
  
  // Wait for loading to finish
  await workerPage.waitForTimeout(2000);

  // WORKER LOGIN
  const workerPhone = '7975182162';
  
  if (await workerPage.locator('[placeholder="Your full name"]').isVisible()) {
      console.log("Logging into Worker...");
      await workerPage.fill('[placeholder="Your full name"]', 'Test Worker');
      await workerPage.fill('[placeholder="10-digit number"]', workerPhone);
      await workerPage.click('button:has-text("Continue")');
      
      await workerPage.waitForSelector('input.otp-box');
      const otpInputs = await workerPage.locator('input.otp-box').all();
      for (let i = 0; i < 6; i++) {
          await otpInputs[i].fill('123456'[i]);
      }
      
      // Wait for navigation
      await workerPage.waitForTimeout(2000);
  }
  
  // If it's the skills step:
  if (await workerPage.locator('text=Step 1 of 2').isVisible()) {
      console.log("Completing Worker onboarding...");
      await workerPage.locator('button.skill-pill').first().click();
      await workerPage.click('button:has-text("Set Your Rates")');
      await workerPage.click('button:has-text("Start Taking Bookings")');
      await workerPage.waitForTimeout(2000);
  }

  // Ensure worker is online
  const goOnlineBtn = workerPage.locator('text=Go Online');
  if (await goOnlineBtn.isVisible()) {
      await goOnlineBtn.click();
      await workerPage.waitForTimeout(1000);
  }
  
  console.log("Worker is online and ready.");

  // CUSTOMER LOGIN
  console.log("Navigating to Customer App...");
  await customerPage.goto('http://localhost:3000');
  
  await customerPage.waitForTimeout(2000);

  if (await customerPage.locator('text=Select your language').isVisible()) {
     await customerPage.locator('button:has-text("English")').click();
  }

  if (await customerPage.locator('[placeholder="Enter your full name"]').isVisible()) {
      console.log("Logging into Customer...");
      await customerPage.fill('[placeholder="Enter your full name"]', 'Test Customer');
      await customerPage.fill('[placeholder="98765 43210"]', '9535024317');
      await customerPage.click('button:has-text("Continue")');
      
      await customerPage.waitForSelector('input.otp-box');
      const otpInputsC = await customerPage.locator('input.otp-box').all();
      for (let i = 0; i < 6; i++) {
          await otpInputsC[i].fill('123456'[i]);
      }
      await customerPage.waitForTimeout(2000);
  }

  console.log("Waiting for Test Worker to appear in Customer App...");
  // The worker might just appear as "Test Worker" on the map or in a list
  await customerPage.waitForSelector('text=Test Worker', { timeout: 15000 });
  
  console.log("Clicking Test Worker...");
  await customerPage.locator('text=Test Worker').first().click();

  console.log("Waiting for Call button...");
  await customerPage.waitForSelector('button:has-text("Call")');
  console.log("Initiating Call...");
  await customerPage.click('button:has-text("Call")');

  // Verify Worker receives call
  console.log("Waiting for Worker to receive incoming call...");
  await workerPage.waitForSelector('text=Incoming Call', { timeout: 15000 });
  console.log("Accepting call...");
  await workerPage.click('button:has-text("Accept")');
  
  // Verify Call connects
  console.log("Waiting for connection...");
  await customerPage.waitForSelector('text=Connected', { timeout: 15000 });
  await workerPage.waitForSelector('text=Connected', { timeout: 15000 });
  
  console.log("TEST PASSED: WebRTC Connection Established!");
  
  await customerPage.screenshot({ path: 'customer-call-connected.png' });
  await workerPage.screenshot({ path: 'worker-call-connected.png' });

  await browser.close();
})().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
