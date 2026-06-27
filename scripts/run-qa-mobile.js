const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log("Launching browser emulating mobile viewport...");
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set mobile viewport (iPhone X dimensions)
  await page.setViewport({
    width: 375,
    height: 812,
    isMobile: true,
    hasTouch: true
  });

  // Navigate to http://localhost:3000
  console.log("Navigating to http://localhost:3000 on mobile...");
  await page.goto('http://localhost:3000', { timeout: 180000 });
  
  console.log("Waiting for textarea to appear...");
  await page.waitForSelector('textarea', { timeout: 180000 });
  
  console.log("Waiting 5 seconds for page load stability...");
  await delay(5000);
  
  // Take screenshot of mobile homepage
  const homepagePath = '/Users/franckmenelikafaneeko/.gemini/antigravity/brain/019307ab-d2dd-42ba-a387-ce363aa87366/mobile_homepage.png';
  fs.mkdirSync(path.dirname(homepagePath), { recursive: true });
  await page.screenshot({ path: homepagePath });
  console.log(`Saved mobile homepage screenshot to: ${homepagePath}`);

  // Find and click hamburger menu
  console.log("Locating mobile hamburger button...");
  const buttons = await page.$$('button');
  let hamburger = null;
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text.includes('☰')) {
      hamburger = button;
      break;
    }
  }
  
  if (hamburger) {
    console.log("Clicking hamburger menu...");
    await hamburger.click();
    await delay(1000);
    
    // Take screenshot of mobile menu open
    const menuPath = '/Users/franckmenelikafaneeko/.gemini/antigravity/brain/019307ab-d2dd-42ba-a387-ce363aa87366/mobile_menu.png';
    await page.screenshot({ path: menuPath });
    console.log(`Saved mobile menu screenshot to: ${menuPath}`);
    
    // Close the hamburger menu by clicking it again
    // Re-locate to handle any DOM changes
    const menuButtons = await page.$$('button');
    let closeButton = null;
    for (const b of menuButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('✕')) {
        closeButton = b;
        break;
      }
    }
    if (closeButton) {
      console.log("Closing hamburger menu...");
      await closeButton.click();
      await delay(1000);
    }
  } else {
    console.warn("⚠️ Mobile hamburger button not found!");
  }

  // Type concepts
  console.log("Typing concepts in mobile inputs...");
  const textareas = await page.$$('textarea');
  if (textareas.length >= 2) {
    await textareas[0].type('Darwin evolution theory');
    await textareas[1].type('Buddhist philosophy of mindfulness');
    
    // Find the cross button
    const actionButtons = await page.$$('button');
    let crossBtn = null;
    for (const b of actionButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Croiser') || text.includes('Cross') || text.includes('COLLISION') || text.includes('Croise')) {
        crossBtn = b;
        break;
      }
    }
    
    if (crossBtn) {
      console.log("Triggering narrative crossing on mobile...");
      await crossBtn.click();
      
      console.log("Waiting for mobile result to render...");
      await delay(15000);
      
      // Take screenshot of mobile result
      const resultPath = '/Users/franckmenelikafaneeko/.gemini/antigravity/brain/019307ab-d2dd-42ba-a387-ce363aa87366/mobile_result.png';
      await page.screenshot({ path: resultPath });
      console.log(`Saved mobile result screenshot to: ${resultPath}`);
    } else {
      console.warn("⚠️ Cross button not found!");
    }
  } else {
    console.warn("⚠️ Not enough textareas found on mobile homepage!");
  }

  await browser.close();
  console.log("Mobile QA automation run complete!");
})().catch(err => {
  console.error("Mobile QA automation run failed:", err);
  process.exit(1);
});
