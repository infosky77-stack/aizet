// AIZET 에이전트 코어 — headless Chromium으로 슈퍼에디터 education 콘텐츠를 열어
// "학습 화면 게시" 버튼을 누른다. 제품 코드(EducationPublishButton)의 경로를 그대로
// 타므로 이 태스크의 성공이 실브라우저 게시의 성공을 보증한다(제품 코드 수정 0).
//
// 로컬 에이전트(대표 PC)판에서 이 모듈은 그대로 재사용된다 — 바뀌는 것은 호출부가
// 넘기는 baseUrl(운영 도메인)과 headless 옵션뿐. 인증은 cookie 인자로만 받는다
// (어떻게 얻는지는 모름 — session.server.mjs든 실로그인이든 무관).
import { chromium } from 'playwright';

/**
 * education 콘텐츠를 찾거나 만들어 게시하고, 무인증 컨텍스트로 공개 학습화면을 검증한다.
 * 반환: { learnPath, warnings, publishStatus, publicCheck } / 실패 시 throw.
 */
export async function runPublishTask({
  baseUrl,
  cookie,                       // { name, value }
  episode = 1,
  folderTitle = '3분 한국어',
  contentTitle = '3분 한국어 1편 — 기본 모음',
  publishTimeoutMs = 15 * 60_000,
  headless = true,
  log = console.log,
  failShotPath = null,          // 실패 시 스크린샷 저장 경로(.png)
}) {
  const browser = await chromium.launch({ headless });
  let page = null;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ ...cookie, url: baseUrl }]);
    page = await ctx.newPage();
    page.setDefaultTimeout(20_000);

    // ── 안전장치: dialog(confirm/alert) = 이상 신호 → 즉시 기각하고 중단 ──────
    // confirm("영상 없이 게시?")을 기각하면 버튼이 게시 없이 종료되므로 반쪽 게시가
    // 발생하지 않고, alert(게시 실패)도 같은 경로로 잡아 보고한다.
    let dialogMessage = null;
    page.on('dialog', (d) => {
      dialogMessage = d.message();
      d.dismiss().catch(() => {});
    });

    // publish API 응답 캡처(warnings 확보) — 클릭 전에 리스너 등록
    let publishRes = null;
    page.on('response', (res) => {
      if (res.url().includes('/api/admin/education/publish')) {
        publishRes = res;
      }
    });

    // ── 1) education 폴더 팝업 진입 ─────────────────────────────────────────
    await page.goto(`${baseUrl}/admin/super-editor/folders?domain=education`);
    await page.getByText('한국어교육 폴더').first().waitFor();
    log('[agent] education 폴더 화면 진입');

    // ── 2) 콘텐츠 찾기(재실행 멱등) 또는 폴더+콘텐츠 생성 ────────────────────
    if (await page.getByText(contentTitle).count()) {
      await page.getByText(contentTitle).first().click();
      log(`[agent] 기존 콘텐츠 "${contentTitle}" 열기`);
    } else {
      if (await page.getByText(folderTitle).count()) {
        await page.getByText(folderTitle).first().click();
        await page.waitForURL(/folderId=/);
        log(`[agent] 기존 폴더 "${folderTitle}" 진입`);
      } else {
        await page.getByRole('button', { name: '새 하위 폴더' }).click();
        const folderInput = page.getByPlaceholder('폴더 이름');
        await folderInput.fill(folderTitle);
        await page.locator('div.flex.gap-2', { has: folderInput }).getByRole('button', { name: '만들기' }).click();
        await page.getByText(folderTitle).first().click();
        await page.waitForURL(/folderId=/);
        log(`[agent] 폴더 "${folderTitle}" 생성·진입`);
      }
      if (await page.getByText(contentTitle).count()) {
        await page.getByText(contentTitle).first().click();
        log(`[agent] 기존 콘텐츠 "${contentTitle}" 열기`);
      } else {
        await page.getByRole('button', { name: '여기에 콘텐츠 만들기' }).click();
        const contentInput = page.getByPlaceholder(/콘텐츠 제목/);
        await contentInput.fill(contentTitle);
        await page.locator('div.flex.gap-2', { has: contentInput }).getByRole('button', { name: '만들기' }).click();
        log(`[agent] 콘텐츠 "${contentTitle}" 생성(스냅샷은 1편 프리셋으로 해석됨)`);
      }
    }
    await page.waitForURL(/contentId=/);

    // ── 3) 게시 버튼 준비 대기(스냅샷 로드 → 6유닛 → 활성화) ─────────────────
    const publishBtn = page.getByRole('button', { name: /학습 화면 게시|영상 렌더|카드 생성 중|업로드 중/ });
    await publishBtn.waitFor();
    await page.waitForFunction(
      () => {
        const btn = [...document.querySelectorAll('button')]
          .find((b) => b.textContent?.includes('학습 화면 게시'));
        return btn && !btn.disabled;
      },
      { timeout: 30_000 },
    );
    log('[agent] 게시 버튼 활성 확인(스냅샷 로드 완료) — 클릭');
    await publishBtn.click();

    // ── 4) 렌더→게시 완료 대기: 성공 링크 표시가 완료 신호 ────────────────────
    const successLink = page.getByRole('link', { name: '학습 화면 새창 열기' });
    const deadline = Date.now() + publishTimeoutMs;
    let lastLabel = '';
    for (;;) {
      if (dialogMessage) throw new Error(`게시 중단 — 브라우저 dialog 감지: "${dialogMessage}"`);
      if (await successLink.count()) break;
      if (Date.now() > deadline) throw new Error(`게시 타임아웃(${publishTimeoutMs / 60_000}분 초과)`);
      const label = (await publishBtn.textContent().catch(() => '')) ?? '';
      if (label.trim() && label.trim() !== lastLabel) {
        lastLabel = label.trim();
        log(`[agent] 진행: ${lastLabel}`);
      }
      await page.waitForTimeout(2_000);
    }

    if (!publishRes) throw new Error('게시 완료 링크는 떴지만 publish 응답을 캡처하지 못했습니다');
    const publishStatus = publishRes.status();
    const body = await publishRes.json().catch(() => null);
    if (publishStatus !== 200 || !body?.ok) {
      throw new Error(`publish 응답 이상 (HTTP ${publishStatus}): ${JSON.stringify(body)}`);
    }
    log(`[agent] 게시 완료 — learnPath=${body.learnPath}, warnings ${body.warnings?.length ?? 0}건`);

    // ── 5) 무인증 컨텍스트로 공개 학습화면 검증(공개/비공개 경계 그대로) ──────
    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    const res = await publicPage.goto(`${baseUrl}/learn/korean/${episode}`);
    const status = res?.status() ?? 0;
    const publicCheck = {
      status,
      header: await publicPage.getByText(`3분 한국어 · 제${episode}편`).count() > 0,
      videoSection: await publicPage.getByText('영상으로 배우기').count() > 0,
      videoElement: await publicPage.locator('video').count() > 0,
      ebookSection: await publicPage.getByText('이북으로 배우기').count() > 0,
    };
    await publicCtx.close();
    if (status !== 200) throw new Error(`공개 학습화면 검증 실패 — HTTP ${status}`);
    log(`[agent] 공개 검증: ${JSON.stringify(publicCheck)}`);

    return { learnPath: body.learnPath, warnings: body.warnings ?? [], publishStatus, publicCheck };
  } catch (e) {
    if (failShotPath && page) {
      await page.screenshot({ path: failShotPath, fullPage: true }).catch(() => {});
      log(`[agent] 실패 스크린샷: ${failShotPath}`);
    }
    throw e;
  } finally {
    await browser.close();
  }
}
