// 사이드바 "빠른 제어" 2 x 2 타일.
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

let confirmAnswer = true, lastConfirm = '';
let promptAnswer = '종료';
window.confirm = (m) => { lastConfirm = m; return confirmAnswer; };
window.prompt = () => promptAnswer;

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

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

const tiles = () => qa('#quick-actions .nav-action');
const tile = a => tiles().find(b => b.dataset.action === a);
const toastText = () => q('#toast-wrap').textContent;

console.log('\n[1] 자리와 구성');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('사이드바 맨 아래', q('#nav').lastElementChild.id === 'quick-actions');
check('바로 위에 빠른 제어 머리글',
  txt(q('#quick-actions').previousElementSibling) === '빠른 제어',
  txt(q('#quick-actions').previousElementSibling));
check('타일 4개', tiles().length === 4, tiles().length + '개');
check('소등 / 재부팅 / OFF / ON 순',
  tiles().map(b => b.dataset.action).join(',') === 'lights,reboot,off,on',
  tiles().map(b => b.dataset.action).join(','));

console.log('\n[2] 2 x 2 로 놓인다');
const wrap = ruleOf('.nav-actions');
check('.nav-actions 규칙', wrap !== null);
check('격자로 배치', /display: grid/.test(wrap), wrap);
check('두 칸씩 = 위 2 아래 2', /grid-template-columns: 1fr 1fr/.test(wrap), wrap);
check('칸 사이 간격', /gap: 8px/.test(wrap), wrap);
check('세로 목록이 아님', !/flex-direction: column/.test(wrap), wrap);

console.log('\n[3] 타일 모양');
const t = ruleOf('.nav-action');
check('.nav-action 규칙', t !== null);
check('네모 카드', /border: 1px solid var\(--border\)/.test(t) && /background: #fff/.test(t), t);
check('모서리 둥글게', /border-radius: 13px/.test(t), t);
check('아이콘 위 · 글자 아래', /flex-direction: column/.test(t), t);
check('가운데 정렬',
  /align-items: center/.test(t) && /justify-content: center/.test(t) && /text-align: center/.test(t), t);
check('아이콘과 글자 사이 간격', /gap: 8px/.test(t), t);
check('설명은 작게', /font-size: 11\.5px/.test(t), t);
check('호버가 부드럽게', /transition:/.test(t), t);
check('호버는 파란색', /color: var\(--point\)/.test(ruleOf('.nav-action:hover')),
  ruleOf('.nav-action:hover'));
check('전원 OFF 만 빨간 호버', /var\(--danger\)/.test(ruleOf('.nav-action.danger:hover')),
  ruleOf('.nav-action.danger:hover'));
check('좁은 화면에서는 한 줄에 하나', /\.nav-actions \{ grid-template-columns: 1fr; gap: 6px; \}/.test(html));

console.log('\n[4] 가운데 아이콘 · 아래 설명');
check('타일마다 아이콘 하나', tiles().every(b => b.querySelectorAll(':scope > svg').length === 1));
check('타일마다 설명 하나', tiles().every(b => b.querySelectorAll(':scope > span').length === 1));
check('아이콘이 설명보다 앞', tiles().every(b => b.firstElementChild.tagName.toLowerCase() === 'svg'));
check('설명 = 소등 / 재부팅 / PC OFF / PC ON',
  tiles().map(b => txt(b)).join(',') === '소등,재부팅,PC OFF,PC ON',
  tiles().map(b => txt(b)).join(','));
check('짧게 줄인 만큼 전체 뜻은 툴팁으로',
  tiles().map(b => b.getAttribute('title')).join(',') ===
  '전체 소등,전체 PC 재부팅,전체 PC 전원 OFF,전체 PC 전원 ON',
  tiles().map(b => b.getAttribute('title')).join(','));
// 아이콘만 보고 골라야 하니 네 개가 서로 달라야 한다
check('아이콘 4종 모두 다름',
  new Set(tiles().map(b => b.querySelector('svg').innerHTML)).size === 4,
  String(new Set(tiles().map(b => b.querySelector('svg').innerHTML)).size) + '종');
check('전원 OFF 는 위험 표시', tile('off').classList.contains('danger'));
check('나머지는 위험 표시 없음',
  tiles().filter(b => b.classList.contains('danger')).length === 1);

console.log('\n[5] 눌렀을 때 하던 일 그대로');
click(tile('lights'));
check('소등 확인창', lastConfirm.includes('소등'), lastConfirm);
check('소등 알림', toastText().includes('소등'), toastText());
check('페이지 이동 없음', q('#dashboard').style.display !== 'none');
check('메뉴 선택도 안 바뀜', q('.nav-item.active').dataset.title === '대시보드');

click(tile('reboot'));
check('재부팅 알림', toastText().includes('재부팅'), toastText());

click(tile('off'));
check('전원 OFF 알림', toastText().includes('전체 PC 종료'), toastText());

promptAnswer = '아무거나';
click(tile('off'));
check('확인 문구가 틀리면 취소', toastText().includes('취소'), toastText());
promptAnswer = '종료';

confirmAnswer = false;
const before = toastText();
click(tile('on'));
check('확인창에서 아니오 = 아무 일 없음', toastText() === before);
confirmAnswer = true;
click(tile('on'));
check('전원 ON 알림', toastText().includes('전원 ON'), toastText());

console.log('\n[6] 회귀');
check('메뉴는 여전히 8개', qa('#nav .nav-item').length === 8);
check('빠른 제어 안에 이동 메뉴 없음', qa('#quick-actions .nav-item').length === 0);
click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));
check('메뉴 이동 정상', q('#page-seats').style.display === 'block');

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
