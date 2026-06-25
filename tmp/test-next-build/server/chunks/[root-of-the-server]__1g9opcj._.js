module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},27319,e=>{"use strict";e.i(36701);var t=e.i(37709),t=t;let r=new t.Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});e.s(["anthropic",0,r],27319)},71648,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),s=e.i(61916),o=e.i(74677),i=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),c=e.i(47587),p=e.i(66012),x=e.i(70101),h=e.i(26937),b=e.i(10372),v=e.i(93695);e.i(52474);var m=e.i(220),R=e.i(27319);let g=new TextEncoder;function y(e){return g.encode(`data: ${JSON.stringify(e)}

`)}let f=`You are "캔디 AI", a friendly Korean herbal health consultant for HanCandy (한캔디) — 한약 기반 무설탕 기능성 캔디 브랜드입니다.

## 제품 라인업 (3종, 핵심성분 공통: 맥문동 + 금은화)

### 1호 그린 — Aqua & Vitality "수분과 활력의 오아시스"
- 컨셉: 침샘\xb7구강정화 / 인공 산미 없이 점막 보호하며 자연스럽게 구강 촉촉함 채움
- 핵심성분: 맥문동(수분공급, 1순위) + 금은화(천연방어막/염증정화, 2순위)
- 가격: 9,900원 / 50g (25개입)
- 추천 상황:
  * 중요 미팅\xb7발표 전 (목소리 맑게, 긴장성 구강 건조 완화)
  * 산책\xb7조깅\xb7등산\xb7러닝 (호흡으로 건조해진 구강 수분 보충)
  * 장거리 운전 (에어컨\xb7난방으로 메마른 구강)
  * 노화로 인한 구강 건조

### 2호 블루 — Protect & Calm "보호와 진정의 쉼표"
- 컨셉: 위장\xb7점막 보호 / 식후 속을 지키는 식물성 점막 보호막
- 핵심성분: 맥문동(수분) + 금은화(진정) + 마/산약(천연 점성 코팅) + 유근피(뮤신 코팅)
- 가격: 10,900원 / 50g (25개입)
- 추천 상황:
  * 기상 직후 공복 (빈 위장 점막 보호)
  * 매운 음식\xb7기름진 식사\xb7커피 후 (위장 진정)
  * 등산\xb7러닝 중 복압 상승 시
  * 장거리 운전\xb7사무직 (장시간 앉아 위장 컨디션 유지)

### 3호 옐로우 — Empty & Light "비움과 소화의 마침표"
- 컨셉: 순환\xb7배출 / 꽉 막힌 답답함을 뚫어주는 시원한 순환 에너지
- 핵심성분: 맥문동(토대) + 금은화(정화) + 나복자+진피(가스 배출/소통) + 산사자+생강(분해/온기)
- 가격: 11,900원 / 50g (25개입)
- 추천 상황:
  * 기름진 식사\xb7고기\xb7튀김 직후 (소화 지원)
  * 복부 팽만\xb7가스 불편감
  * 몸이 무겁고 소화 안 되는 날
  * 사무직\xb7수험생 등 장시간 앉아있는 생활

## 추천 로직 (상황 → 호 매핑)
- 미팅\xb7발표\xb7목소리\xb7구강 건조\xb7입 마름 → **1호 그린**
- 운동(조깅\xb7등산\xb7러닝\xb7자전거)에서의 구강 건조 → **1호 그린**
- 장거리 운전 + 구강 쪽 불편 → **1호 그린**
- 식후 속 불편\xb7더부룩\xb7위장\xb7속 쓰림\xb7공복\xb7커피 → **2호 블루** (단, 가스\xb7팽만이 주 증상이면 3호 우선)
- 더부룩함\xb7팽만\xb7가스\xb7소화 안 됨\xb7장 활동 부족 → **3호 옐로우**
- 기름진 식사\xb7고기\xb7튀김 후 → **3호 옐로우**
- 컨디션이 전반적으로 안 좋고 소화도 안 됨 → **3호 옐로우**
- 복합 증상(구강 건조 + 식후 속 불편) → 1호 + 2호 병용 제안
- 식사 전\xb7중 구강 + 식사 후 위장 → 1호(식전)\xb72호(식후) 순서 제안

## 역할 지침
- 사용자의 증상\xb7상황\xb7라이프스타일을 먼저 파악하고 맞는 호를 추천
- 추천 시 반드시 이유를 핵심성분과 연결해 간결하게 설명
- 의약품이 아님을 명시 — "도움이 될 수 있습니다" 표현 사용, "치료합니다" 금지
- 알레르기\xb7복약 중인 경우 전문의 상담 권유
- 따뜻하고 친근한 한국어 사용, 적절한 이모지 포함
- 모든 제품 무설탕(당류 0g), 자일리톨+스테비아 감미
- 한캔디 브랜드: 주식회사 아이젯(aizet.co.kr) / hancandy.co.kr — 현재 출시 준비 중임을 언급 가능

첫 응답은 따뜻하게 인사하고, 어떤 상황이나 불편함이 있는지 물어보세요.`;async function w(e){let t=(await e.json()).messages??[];return new Response(new ReadableStream({async start(e){try{for await(let r of(await R.anthropic.messages.stream({model:"claude-haiku-4-5-20251001",max_tokens:700,system:f,messages:t.map(e=>({role:e.role,content:e.content}))})))"content_block_delta"===r.type&&"text_delta"===r.delta.type&&e.enqueue(y({type:"delta",text:r.delta.text}));e.enqueue(y({type:"done"}))}catch(t){e.enqueue(y({type:"error",message:String(t)}))}finally{e.close()}}}),{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}e.s(["POST",0,w,"runtime",0,"nodejs"],1149);var C=e.i(1149);let E=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/hancandy/chat/route",pathname:"/api/hancandy/chat",filename:"route",bundlePath:""},distDir:"/tmp/test-next-build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/hancandy/chat/route.ts",nextConfigOutput:"",userland:C,...{}}),{workAsyncStorage:_,workUnitAsyncStorage:A,serverHooks:P}=E;async function k(e,t,a){a.requestMeta&&(0,n.setRequestMeta)(e,a.requestMeta),E.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let R="/api/hancandy/chat/route";R=R.replace(/\/index$/,"")||"/";let g=await E.prepare(e,t,{srcPage:R,multiZoneDraftMode:!1});if(!g)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:y,deploymentId:f,params:w,nextConfig:C,parsedUrl:_,isDraftMode:A,prerenderManifest:P,routerServerContext:k,isOnDemandRevalidate:T,revalidateOnlyGenerated:q,resolvedPathname:N,clientReferenceManifest:S,serverActionsManifest:O}=g,j=(0,i.normalizeAppPath)(R),H=!!(P.dynamicRoutes[j]||P.routes[N]),I=async()=>((null==k?void 0:k.render404)?await k.render404(e,t,_,!1):t.end("This page could not be found"),null);if(H&&!A){let e=!!P.routes[N],t=P.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(C.adapterPath)return await I();throw new v.NoFallbackError}}let U=null;!H||E.isDev||A||(U="/index"===(U=N)?"/":U);let M=!0===E.isDev||!H,D=H&&!M;O&&S&&(0,o.setManifestsSingleton)({page:R,clientReferenceManifest:S,serverActionsManifest:O});let K=e.method||"GET",$=(0,s.getTracer)(),F=$.getActiveScopeSpan(),B=!!(null==k?void 0:k.isWrappedByNextServer),L=!!(0,n.getRequestMeta)(e,"minimalMode"),V=(0,n.getRequestMeta)(e,"incrementalCache")||await E.getIncrementalCache(e,C,P,L);null==V||V.resetRequestCache(),globalThis.__incrementalCache=V;let G={params:w,previewProps:P.preview,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:M,incrementalCache:V,cacheLifeProfiles:C.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>E.onRequestError(e,t,a,n,k)},sharedContext:{buildId:y,deploymentId:f}},W=new l.NodeNextRequest(e),X=new l.NodeNextResponse(t),z=d.NextRequestAdapter.fromNodeNextRequest(W,(0,d.signalFromNodeResponse)(t));try{let n,o=async e=>E.handle(z,G).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=$.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${K} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",a),n.updateName(t))}else e.updateName(`${K} ${R}`)}),i=async n=>{var s,i;let l=async({previousCacheEntry:r})=>{try{if(!L&&T&&q&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(n);e.fetchMetrics=G.renderOpts.fetchMetrics;let i=G.renderOpts.pendingWaitUntil;i&&a.waitUntil&&(a.waitUntil(i),i=void 0);let l=G.renderOpts.collectedTags;if(!H)return await (0,p.sendResponse)(W,X,s,G.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,x.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[b.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==G.renderOpts.collectedRevalidate&&!(G.renderOpts.collectedRevalidate>=b.INFINITE_CACHE)&&G.renderOpts.collectedRevalidate,a=void 0===G.renderOpts.collectedExpire||G.renderOpts.collectedExpire>=b.INFINITE_CACHE?void 0:G.renderOpts.collectedExpire;return{value:{kind:m.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:R,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:T})},!1,k),t}},d=await E.handleResponse({req:e,nextConfig:C,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:P,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:q,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:L});if(!H)return null;if((null==d||null==(s=d.value)?void 0:s.kind)!==m.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});L||t.setHeader("x-nextjs-cache",T?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),A&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,x.fromNodeOutgoingHttpHeaders)(d.value.headers);return L&&H||u.delete(b.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,h.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(W,X,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};B&&F?await i(F):(n=$.getActiveScopeSpan(),await $.withPropagatedContext(e.headers,()=>$.trace(u.BaseServerSpan.handleRequest,{spanName:`${K} ${R}`,kind:s.SpanKind.SERVER,attributes:{"http.method":K,"http.target":e.url}},i),void 0,!B))}catch(t){if(t instanceof v.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:T})},!1,k),H)throw t;return await (0,p.sendResponse)(W,X,new Response(null,{status:500})),null}}e.s(["handler",0,k,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:_,workUnitAsyncStorage:A})},"routeModule",0,E,"serverHooks",0,P,"workAsyncStorage",0,_,"workUnitAsyncStorage",0,A],71648)},6714,e=>{e.v(t=>Promise.all(["server/chunks/[externals]_node_fs_1t1l-4-._.js"].map(t=>e.l(t))).then(()=>t(2157)))},11105,e=>{e.v(t=>Promise.all(["server/chunks/[externals]_node_path_1pmhwj3._.js"].map(t=>e.l(t))).then(()=>t(50227)))},46735,e=>{e.v(t=>Promise.all(["server/chunks/[externals]__1j5vgk-._.js","server/chunks/[root-of-the-server]__1fbyaci._.js"].map(t=>e.l(t))).then(()=>t(83085)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__1g9opcj._.js.map