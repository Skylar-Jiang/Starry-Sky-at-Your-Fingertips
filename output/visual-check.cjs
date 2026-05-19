const { chromium } = require("playwright");

const baseUrl = "http://127.0.0.1:5174";

async function screenshot(page, path) {
  await page.screenshot({ path, fullPage: false });
  console.log(path);
}

async function drawWishTrail(page, start = { x: 190, y: 190 }) {
  await page.getByRole("button", { name: "画星轨许愿" }).click();
  await page.getByLabel("画星轨许愿区域").waitFor({ state: "visible" });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 70, start.y + 35, { steps: 8 });
  await page.mouse.move(start.x + 170, start.y + 90, { steps: 12 });
  await page.mouse.move(start.x + 285, start.y + 135, { steps: 14 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  await page.goto(baseUrl);
  await page.waitForSelector(".cloud-mist-field");
  await screenshot(page, "output/visual-517-1366-main.png");

  const mistBox = await page.locator(".cloud-mist-field").boundingBox();
  if (!mistBox) throw new Error("Missing cloud mist field");
  await page.mouse.move(mistBox.x + mistBox.width * 0.45, mistBox.y + mistBox.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(mistBox.x + mistBox.width * 0.55, mistBox.y + mistBox.height * 0.45, { steps: 8 });
  await page.mouse.move(mistBox.x + mistBox.width * 0.42, mistBox.y + mistBox.height * 0.58, { steps: 8 });
  await screenshot(page, "output/visual-517-1366-cloud-knead.png");
  await page.mouse.up();

  await drawWishTrail(page);
  await screenshot(page, "output/visual-517-1366-wish-trail.png");
  await page.mouse.up();
  await page.waitForTimeout(350);
  await screenshot(page, "output/visual-517-1366-wish-orb.png");
  await page.waitForTimeout(1900);
  await page.locator(".meteor-shower-layer").waitFor({ state: "visible" });
  await screenshot(page, "output/visual-517-1366-meteors.png");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseUrl);
  await page.waitForSelector(".cloud-mist-field");
  await screenshot(page, "output/visual-517-1440-main.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await page.waitForSelector(".cloud-mist-field");
  await screenshot(page, "output/visual-517-390-main.png");
  await drawWishTrail(page, { x: 60, y: 155 });
  await screenshot(page, "output/visual-517-390-wish-trail.png");
  await page.mouse.up();

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
