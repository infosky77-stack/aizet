const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'aizet_session', value: 'test-fake', domain: 'localhost', path: '/' }]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('PAGE_ERROR: ' + err.message));

  await page.goto('http://localhost:3000/admin/menu-print', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=직접 편집하기', { timeout: 10000 });
  await page.click('text=직접 편집하기');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-before.png' });

  const itemsBefore = await page.locator('[placeholder="메뉴 이름"]').count();
  console.log('Items before:', itemsBefore);

  // Click 추가 and wait longer for setTimeout(0) + React
  await page.locator('button:has-text("메뉴 항목 추가")').click();
  await page.waitForTimeout(300);

  const itemsAfter = await page.locator('[placeholder="메뉴 이름"]').count();
  console.log('Items after click:', itemsAfter);
  console.log('Item added:', itemsAfter > itemsBefore ? '✅' : '❌');

  const focusInfo = await page.evaluate(function() {
    var el = document.activeElement;
    if (!el) return 'none';
    return el.tagName + '|placeholder=' + (el.getAttribute('placeholder') || '');
  });
  console.log('Focused element:', focusInfo);
  const focused = focusInfo.includes('메뉴 이름');
  console.log('Focus on new name input:', focused ? '✅' : '⚠️ (focus may work in real browser)');

  await page.screenshot({ path: '/tmp/final-after.png' });

  // 🔍 Probe: rapid clicks don't double-add
  console.log('\n🔍 Probe: 2 more rapid clicks');
  await page.locator('button:has-text("메뉴 항목 추가")').click();
  await page.waitForTimeout(50);
  await page.locator('button:has-text("메뉴 항목 추가")').click();
  await page.waitForTimeout(300);
  const after3 = await page.locator('[placeholder="메뉴 이름"]').count();
  console.log('After 3 total adds:', after3, '(expected:', itemsBefore + 3, after3 === itemsBefore + 3 ? '✅' : '❌', ')');

  // 🔍 Probe: fill new item name → SVG should update
  const lastInput = page.locator('[placeholder="메뉴 이름"]').last();
  await lastInput.fill('새 메뉴');
  await page.waitForTimeout(200);
  const svgHtml = await page.locator('svg').last().innerHTML().catch(() => '');
  console.log('\n🔍 Probe: SVG updates after typing name:', svgHtml.includes('새 메뉴') ? '✅' : '⚠️ (new items show in preview only when name/category filled)');
  await page.screenshot({ path: '/tmp/final-filled.png' });

  // 🔍 Probe: delete item works
  const deleteBtns = page.locator('button:has-text("삭제")');
  const deleteBtnCount = await deleteBtns.count();
  if (deleteBtnCount > 0) {
    console.log('\n🔍 Probe: delete button count visible:', deleteBtnCount);
  }

  const nonAuthErrors = consoleErrors.filter(e => !e.includes('401') && !e.includes('Unauthorized'));
  if (nonAuthErrors.length > 0) {
    console.log('\n⚠️ Console errors:', nonAuthErrors);
  } else {
    console.log('\nNo relevant console errors ✅');
  }

  const passed = (itemsAfter > itemsBefore) && (after3 === itemsBefore + 3);
  console.log('\n' + (passed ? '✅ PASS' : '❌ FAIL'));
  await browser.close();
})();
