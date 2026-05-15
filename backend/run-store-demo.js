const puppeteer = require('puppeteer');
const fs = require('fs');

async function runDemo() {
  const artifactDir = 'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\677f8dd4-accc-4b9d-8c9a-ed0a9725c30a';
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // 1. Go to Login
    console.log('Navigating to Store App...');
    await page.goto('http://localhost:8082/auth/login');
    await page.waitForSelector('input[placeholder="Enter your phone number"]', { timeout: 10000 });
    
    // Type phone
    await page.type('input[placeholder="Enter your phone number"]', '9130974599');
    await page.screenshot({ path: `${artifactDir}/demo_store_1_login.png` });
    console.log('Saved screenshot: demo_store_1_login.png');
    
    // Click Continue
    const continueBtn = await page.$x("//div[contains(text(), 'Continue')]");
    if (continueBtn.length > 0) {
      await continueBtn[0].click();
    }
    
    // 2. Go to OTP
    console.log('Waiting for OTP screen...');
    await page.waitForSelector('input[placeholder="Enter OTP (1234 for dev)"]', { timeout: 10000 });
    await page.type('input[placeholder="Enter OTP (1234 for dev)"]', '1234');
    await page.screenshot({ path: `${artifactDir}/demo_store_2_otp.png` });
    console.log('Saved screenshot: demo_store_2_otp.png');
    
    // Click Verify & Login
    const verifyBtn = await page.$x("//div[contains(text(), 'Verify & Login')]");
    if (verifyBtn.length > 0) {
      await verifyBtn[0].click();
    }
    
    // 3. Go to Dashboard (should show No Store Registered)
    console.log('Waiting for Dashboard (No Store)...');
    await page.waitForTimeout(3000); // give time for navigation and API response
    await page.screenshot({ path: `${artifactDir}/demo_store_3_dashboard_empty.png` });
    console.log('Saved screenshot: demo_store_3_dashboard_empty.png');
    
    // Click Register Your Store
    const registerBtn = await page.$x("//div[contains(text(), 'Register Your Store')]");
    if (registerBtn.length > 0) {
      await registerBtn[0].click();
    }
    
    // 4. Registration Form
    console.log('Waiting for Registration form...');
    await page.waitForTimeout(2000);
    await page.type('input[placeholder="Store Name"]', 'My Kirana Shop');
    await page.type('input[placeholder="Short description"]', 'Best grocery store in town');
    await page.type('input[placeholder="Full Address"]', '123 Main Street, Mumbai');
    await page.type('input[placeholder="Contact Number"]', '9999888877');
    await page.screenshot({ path: `${artifactDir}/demo_store_4_registration.png` });
    console.log('Saved screenshot: demo_store_4_registration.png');
    
    // Click Create Store
    const createBtn = await page.$x("//div[contains(text(), 'Create Store')]");
    if (createBtn.length > 0) {
      await createBtn[0].click();
    }
    
    // 5. Back to Dashboard (With Store)
    console.log('Waiting for Dashboard (With Store)...');
    await page.waitForTimeout(3000); // give time for navigation and API response
    await page.screenshot({ path: `${artifactDir}/demo_store_5_dashboard_success.png` });
    console.log('Saved screenshot: demo_store_5_dashboard_success.png');
    
    console.log('Demo completed successfully!');
  } catch (error) {
    console.error('Error during demo:', error);
    await page.screenshot({ path: `${artifactDir}/demo_store_error.png` });
  } finally {
    await browser.close();
  }
}

runDemo();
