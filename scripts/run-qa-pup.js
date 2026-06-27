const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to http://localhost:3000
  console.log("Navigating to http://localhost:3000 (timeout: 3 minutes)...");
  await page.goto('http://localhost:3000', { timeout: 180000 });
  
  console.log("Waiting for textarea to appear (compilation check)...");
  await page.waitForSelector('textarea', { timeout: 180000 });
  
  console.log("Waiting an extra 5 seconds for page stability...");
  await delay(5000);
  
  // Take screenshot of homepage
  console.log("Taking homepage screenshot...");
  const homepagePath = '/Users/franckmenelikafaneeko/.gemini/antigravity/brain/019307ab-d2dd-42ba-a387-ce363aa87366/homepage.png';
  
  // Ensure the target directory exists
  fs.mkdirSync(path.dirname(homepagePath), { recursive: true });
  
  await page.screenshot({ path: homepagePath });
  console.log(`Saved homepage screenshot to: ${homepagePath}`);

  // Find the textareas
  console.log("Entering concepts...");
  const textareas = await page.$$('textarea');
  console.log(`Found ${textareas.length} textareas on the page.`);
  if (textareas.length < 2) {
    throw new Error(`Expected at least 2 textareas, found ${textareas.length}`);
  }
  
  await textareas[0].type('Philosophy of mind');
  await textareas[1].type('Artificial intelligence');
  
  // Find and click the Cross button
  console.log("Clicking the Cross button...");
  const buttons = await page.$$('button');
  let crossButton = null;
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text.includes('Croiser') || text.includes('Cross') || text.includes('COLLISION') || text.includes('Croise')) {
      crossButton = button;
      break;
    }
  }
  
  if (!crossButton) {
    throw new Error("Cross button not found");
  }
  
  await crossButton.click();
  
  // Wait for the crossing to finish (which queries SOUFFLE)
  console.log("Waiting for result page (15 seconds)...");
  await delay(15000);
  
  // Take screenshot of the result
  console.log("Taking result screenshot...");
  const resultPath = '/Users/franckmenelikafaneeko/.gemini/antigravity/brain/019307ab-d2dd-42ba-a387-ce363aa87366/result.png';
  await page.screenshot({ path: resultPath });
  console.log(`Saved result screenshot to: ${resultPath}`);
  
  // Print some page details
  const title = await page.title();
  console.log(`Final page title: ${title}`);
  
  await browser.close();
  console.log("QA automation run complete!");
})().catch(err => {
  console.error("QA automation run failed:", err);
  process.exit(1);
});
