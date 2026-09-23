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
window.confirm = () => true;

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*(?:,[^{]*)?\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}
const rows = () => qa('#member-body tr[data-member]');
const col = i => rows().map(tr => tr.children[i].textContent.trim());
const sortBtn = k => q('.th-sort[data-sort="' + k + '"]');
const scrollBottom = () => fire(q('#member-scroll'), 'scroll');

click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));

console.log('\n[1] 표 스타일 : 선 최소 · 여백 넓게');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const wrap = ruleOf('.tbl-wrap');
check('바깥 테두리 제거', wrap && !wrap.includes('border:'), wrap);
check('스크롤 유지', wrap && wrap.includes('overflow-y: auto'), wrap);
const cell = ruleOf('.tbl th, .tbl td');
check('행 여백 넓힘(15px)', cell && cell.includes('padding: 15px'), cell);
check('첫 열은 왼쪽 여백 최소', ruleOf('.tbl th:first-child, .tbl td:first-child') !== null);
const td = ruleOf('.tbl tbody td');
check('행 구분선은 옅은 선 하나', td && td.includes('#f1f2f4'), td);
check('본문 한 톤(굵기 600)', td && td.includes('font-weight: 600'), td);
check('회색 셀 처리 제거', !html.includes("'<td class=\"num sub\">'"));
check('머리글 고정 유지', (ruleOf('.tbl thead th') || '').includes('position: sticky'));

console.log('\n[2] 정렬 화살표');
check('정렬 버튼 5개', qa('#page-members .th-sort').length === 5,
  qa('#page-members .th-sort').map(b => b.dataset.sort).join(','));
check('이름/나이/생년월일/가입날짜/최신기록이 정렬 대상',
  qa('#page-members .th-sort').map(b => b.dataset.sort).join(',') === 'name,age,birth,joined,last');
check('전화번호는 정렬 없음', qa('#page-members th')[3].querySelector('.th-sort') === null);
check('화살표 아이콘 존재', qa('#page-members .th-sort .sort-ico').length === 5);
check('위/아래 삼각형 두 개', sortBtn('name').querySelectorAll('.up, .dn').length === 2);
check('기본은 정렬 표시 없음', qa('#page-members .th-sort').every(b => !b.hasAttribute('data-dir')));

console.log('\n[3] 이름 정렬');
click(sortBtn('name'));
check('오름차순 표시', sortBtn('name').getAttribute('data-dir') === 'asc');
let names = col(0);
check('한글 사전순 정렬',
  names.join() === names.slice().sort((a, b) => a.localeCompare(b, 'ko')).join(), names.slice(0, 3).join(' '));
click(sortBtn('name'));
check('다시 누르면 내림차순', sortBtn('name').getAttribute('data-dir') === 'desc');
names = col(0);
check('역순 정렬',
  names.join() === names.slice().sort((a, b) => b.localeCompare(a, 'ko')).join(), names.slice(0, 3).join(' '));

console.log('\n[4] 나이 정렬 (숫자)');
click(sortBtn('age'));
check('나이 오름차순 표시', sortBtn('age').getAttribute('data-dir') === 'asc');
check('이전 열 표시 해제', !sortBtn('name').hasAttribute('data-dir'));
let ages = col(1).map(v => parseInt(v, 10));
check('숫자 오름차순', ages.every((v, i) => i === 0 || ages[i - 1] <= v), ages.slice(0, 5).join(','));
click(sortBtn('age'));
ages = col(1).map(v => parseInt(v, 10));
check('숫자 내림차순', ages.every((v, i) => i === 0 || ages[i - 1] >= v), ages.slice(0, 5).join(','));

console.log('\n[5] 생년월일 정렬');
click(sortBtn('birth'));
const births = col(2);
check('날짜 오름차순', births.join() === births.slice().sort().join(), births.slice(0, 3).join(' '));
check('가장 오래된 생년이 위', births[0] < births[births.length - 1]);

console.log('\n[6] 정렬 + 검색 + 스크롤 함께 동작');
click(sortBtn('name'));
q('#member-search').value = '김';
fire(q('#member-search'), 'input');
check('검색 결과만 남음', rows().every(tr => tr.children[0].textContent.trim().startsWith('김')));
const kim = col(0);
check('검색 결과도 정렬 유지',
  kim.join() === kim.slice().sort((a, b) => a.localeCompare(b, 'ko')).join(), kim.slice(0, 3).join(' '));
check('검색 시 첫 페이지로', rows().length <= 30);
check('건수 표기 전환', q('#member-count').textContent.includes('조건에 맞는'), q('#member-count').textContent);

q('#member-search').value = '';
fire(q('#member-search'), 'input');
check('검색 해제 후 30명', rows().length === 30);
check('건수 표기 복귀', q('#member-count').textContent.startsWith('전체'), q('#member-count').textContent);
check('정렬은 유지', sortBtn('name').getAttribute('data-dir') === 'asc');
const sorted30 = col(0);
check('해제 후에도 정렬 순서',
  sorted30.join() === sorted30.slice().sort((a, b) => a.localeCompare(b, 'ko')).join());

scrollBottom();
check('스크롤로 60명', rows().length === 60);
const all60 = col(0);
check('이어붙인 뒤에도 정렬 순서',
  all60.join() === all60.slice().sort((a, b) => a.localeCompare(b, 'ko')).join());
scrollBottom(); scrollBottom(); scrollBottom();
check('끝까지 124명', rows().length === 124);

console.log('\n[7] 행 클릭 · 회귀');
click(rows()[0]);
check('상세 모달 유지', q('#member-modal').classList.contains('open'));
check('정렬된 첫 행과 이름 일치', q('#mb-name').textContent === col(0)[0], q('#mb-name').textContent);
click(q('#mb-close'));

click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
