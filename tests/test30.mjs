// 사이드바 하위 메뉴가 아코디언처럼 한 번에 하나만, 부드럽게 여닫히는지 확인한다.
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

// 저장소 안의 admin/index.html 을 읽는다 (이 파일 기준 상대 경로)
const ADMIN = new URL('../admin/index.html', import.meta.url);
const html = fs.readFileSync(ADMIN, 'utf8');
const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
dom.virtualConsole.on('jsdomError', e => errors.push(e.message));
const { window } = dom;
const doc = window.document;

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const submit = el => el.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));

function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const sub = t => qa('.sub-item').find(b => b.dataset.title === t);
const panelOf = t => nav(t).closest('.nav-group').querySelector('.submenu');
// 지금 펼쳐져 있는 묶음의 상위 메뉴 이름들
const openTitles = () => qa('.submenu.open')
  .map(p => p.closest('.nav-group').querySelector('.nav-item').dataset.title);

console.log('\n[1] 시작 상태');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('하위 메뉴를 가진 묶음 3개',
  qa('.submenu').length === 3, qa('.submenu').length + '개');
check('처음엔 전부 접혀 있음', openTitles().length === 0, openTitles().join(','));
check('접힘 상태의 aria-expanded=false',
  ['매점 관리', '직원관리', '매장관리'].every(t => nav(t).getAttribute('aria-expanded') === 'false'));

console.log('\n[2] 하나 펼치면 하나만 열린다');
click(nav('매점 관리'));
check('매점 관리 펼쳐짐', openTitles().join(',') === '매점 관리', openTitles().join(','));
check('aria-expanded=true', nav('매점 관리').getAttribute('aria-expanded') === 'true');
check('상위 메뉴에도 open 표시', nav('매점 관리').classList.contains('open'));

click(nav('직원관리'));
check('직원관리만 남는다', openTitles().join(',') === '직원관리', openTitles().join(','));
check('매점 관리는 접힘', !panelOf('매점 관리').classList.contains('open'));
check('접힌 쪽 aria 도 되돌아감', nav('매점 관리').getAttribute('aria-expanded') === 'false');
check('접힌 쪽 open 클래스도 제거', !nav('매점 관리').classList.contains('open'));

click(nav('매장관리'));
check('매장관리만 남는다', openTitles().join(',') === '매장관리', openTitles().join(','));
check('직원관리 접힘', !panelOf('직원관리').classList.contains('open'));

console.log('\n[3] 같은 메뉴를 다시 누르면 접힌다');
click(nav('매장관리'));
check('토글로 닫힘', openTitles().length === 0, openTitles().join(','));
check('aria=false', nav('매장관리').getAttribute('aria-expanded') === 'false');

console.log('\n[4] 하위 메뉴를 고르면 그 묶음은 열린 채 유지');
click(nav('매점 관리'));
click(sub('재고 관리'));
check('재고 관리 선택', sub('재고 관리').classList.contains('active'));
check('매점 관리는 계속 펼쳐짐', openTitles().join(',') === '매점 관리', openTitles().join(','));
check('페이지 이동', q('#page-stock').style.display === 'block');
check('부제', q('#page-desc').textContent === '매점 재고 확인 · 입고');
// 아직 화면이 없는 하위 항목은 부제 자리에 경로를 보여 준다
click(nav('매장관리'));
click(sub('보안 설정'));
check('준비 중 화면은 경로 표시', q('#page-desc').textContent === '매장관리 > 보안 설정',
  q('#page-desc').textContent);
check('고른 묶음만 펼쳐짐', openTitles().join(',') === '매장관리', openTitles().join(','));
click(nav('매점 관리'));
click(sub('재고 관리'));

console.log('\n[5] 하위 없는 메뉴를 누르면 열린 묶음이 접힌다');
click(nav('대시보드'));
check('전부 접힘', openTitles().length === 0, openTitles().join(','));
check('대시보드로 이동', q('#dashboard').style.display !== 'none');
check('이전 하위 선택 해제', !sub('재고 관리').classList.contains('active'));

click(nav('좌석 관리'));
check('좌석 관리 이동', q('#page-seats').style.display === 'block');
check('여전히 전부 접힘', openTitles().length === 0);

console.log('\n[6] 잠긴 메뉴에서도 규칙이 유지된다');
click(nav('매점 관리'));
check('먼저 매점 관리를 펼쳐 둠', openTitles().join(',') === '매점 관리');
click(nav('매출·정산 관리'));
check('PIN 요구', q('#pin-modal').classList.contains('open'));
check('잠겨 있는 동안은 그대로', openTitles().join(',') === '매점 관리', openTitles().join(','));
unlock();
check('해제 후 이동', q('#page-sales').style.display === 'block');
check('하위 없는 메뉴라 접힘', openTitles().length === 0, openTitles().join(','));

click(nav('직원관리'));
click(sub('근태 관리'));
check('잠긴 묶음의 하위도 정상 이동', q('#page-attend').style.display === 'block');
check('직원관리만 펼쳐짐', openTitles().join(',') === '직원관리', openTitles().join(','));

console.log('\n[7] 부드럽게 여닫기');
// display 로는 전환이 걸리지 않는다 — 높이를 줄여서 접어야 한다
const closed = ruleOf('.submenu');
const opened = ruleOf('.submenu.open');
check('접힘 상태를 display:none 으로 두지 않음', !/display: none/.test(closed), closed);
check('접히면 높이 0', /height: 0/.test(closed), closed);
check('넘치는 내용은 가린다', /overflow: hidden/.test(closed));
check('높이에 전환', /height 0\.26s/.test(closed), closed);
check('여백도 같이 줄어 위아래가 붙음',
  /margin: 0 0 0 22px/.test(closed) && /margin: 2px 0 6px 22px/.test(opened),
  closed + ' // ' + opened);
check('열리면 서서히 나타남', /opacity: 0/.test(closed) && /opacity: 1/.test(opened));
check('접힌 동안은 초점도 안 감',
  /visibility: hidden/.test(closed) && /visibility: visible/.test(opened));
check('다 접힌 뒤에 숨긴다', /visibility 0s linear 0\.26s/.test(closed), closed);
check('열 때는 곧바로 보인다', /visibility 0s(?!\s*linear)/.test(opened), opened);
check('화살표도 같은 속도', /transition: transform 0\.26s/.test(ruleOf('.nav-item .chev')),
  ruleOf('.nav-item .chev'));
check('모션 줄이기 설정 존중', /prefers-reduced-motion: reduce/.test(html));
check('좁은 화면에서는 그대로 감춤', /\.submenu, \.submenu\.open \{ display: none; \}/.test(html));
// 항목 앞 표시는 글 흐름 안에 있어 패널에 따로 자리를 잡아 줄 필요가 없다 (test29)
check('안쪽 여백을 따로 두지 않음', !/padding-left/.test(closed), closed);

// 높이 값은 스크립트가 넣는다 (jsdom 은 scrollHeight 가 0 이라 숫자 자체는 보지 않는다)
click(nav('매점 관리'));
check('열 때 높이를 직접 넣음', panelOf('매점 관리').style.height !== '',
  JSON.stringify(panelOf('매점 관리').style.height));
click(nav('매점 관리'));
check('접으면 0', panelOf('매점 관리').style.height === '0px', panelOf('매점 관리').style.height);
click(nav('직원관리'));
click(nav('매장관리'));
check('밀려난 쪽도 0 으로 접힘', panelOf('직원관리').style.height === '0px',
  panelOf('직원관리').style.height);
click(nav('대시보드'));
check('하위 없는 메뉴로 가도 0', panelOf('매장관리').style.height === '0px');

console.log('\n[8] 죽은 코드 정리');
check('마크업에 data-page 없음', qa('[data-page]').length === 0);
check('스크립트에도 data-page 분기 없음', !/hasAttribute\('data-page'\)/.test(html));

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
