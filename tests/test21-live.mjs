// 실제 서버에 붙어서 확인하는 테스트.
// 파일이 디스크에 있어도 "서빙되는 주소" 때문에 상대 경로가 깨질 수 있어서,
// 브라우저와 같은 방식으로 URL 을 풀어 실제로 200 이 오는지 본다.
import { JSDOM } from 'jsdom';

const ORIGIN = 'http://localhost:3001';
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

console.log('\n[1] /admin 진입');
let res;
try {
  res = await fetch(ORIGIN + '/admin', { redirect: 'follow' });
} catch (e) {
  console.log('  서버에 붙을 수 없습니다 (' + e.message + '). npm run dev 먼저 실행하세요.');
  process.exit(1);
}
check('/admin 응답 200', res.status === 200, String(res.status));

const pageUrl = res.url;
check('주소에 경로 구분자 존재 (상대경로 해석 기준)',
  new URL(pageUrl).pathname.split('/').length > 2, pageUrl);

const html = await res.text();
check('관리자 페이지 내용', html.includes('Shift Admin'));

console.log('\n[2] 메뉴 사진이 실제로 열리는지');
const doc = new JSDOM(html).window.document;
const srcs = [...doc.querySelectorAll('script')]
  .map(s => s.textContent)
  .join('\n')
  .match(/menu\/[a-z0-9-]+\.png/g) || [];
const unique = [...new Set(srcs)];
check('메뉴 사진 14장 참조', unique.length === 14, unique.length + '장');

const results = await Promise.all(unique.map(async (src) => {
  const url = new URL(src, pageUrl).href;       // 브라우저와 같은 해석
  try {
    const r = await fetch(url);
    return { src, url, status: r.status, size: Number(r.headers.get('content-length') || 0) };
  } catch (e) {
    return { src, url, status: 0, size: 0 };
  }
}));

const broken = results.filter(r => r.status !== 200);
check('전부 200 으로 열림', broken.length === 0,
  broken.map(b => b.src + ' -> ' + b.url + ' (' + b.status + ')').join(', '));
check('빈 파일 없음', results.every(r => r.size > 1000),
  results.filter(r => r.size <= 1000).map(r => r.src).join(', '));

console.log('\n[3] 잘못된 해석은 여전히 404 (회귀 감시)');
const wrong = await fetch(ORIGIN + '/menu/ramyeon.png');
check('루트 경로로는 안 열림 (상대경로가 루트로 풀리면 실패했다는 뜻)',
  wrong.status === 404, String(wrong.status));

console.log('\n[4] 두 주소 모두 동작');
for (const p of ['/admin', '/admin/index.html']) {
  const r = await fetch(ORIGIN + p, { redirect: 'follow' });
  check(p + ' 접근 가능', r.status === 200, String(r.status));
}

console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
