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
const submit = el => el.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const rows = () => qa('#member-body tr[data-member]');
const cells = tr => [...tr.children].map(txt);
const stateOf = tr => txt(tr.querySelector('.st'));
function search(kw) { q('#member-search').value = kw; fire(q('#member-search'), 'input'); }
function setStatus(v) { q('#member-status').value = v; fire(q('#member-status'), 'change'); }
const scrollBottom = () => fire(q('#member-scroll'), 'scroll');

click(nav('회원 관리'));

console.log('\n[1] 상단 도구줄');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const tb = q('#page-members .toolbar');
check('도구줄 존재', tb !== null);
check('구성 3개 (검색 · 상태 · 필터)', tb.children.length === 3, tb.children.length + '개');
check('검색이 알약 껍데기 안',
  q('#member-search').closest('.tb').classList.contains('tb-search'));
check('검색 안내 문구', q('#member-search').placeholder === '회원 이름 또는 전화번호로 검색...',
  q('#member-search').placeholder);
check('상태 드롭다운', q('#member-status') !== null);
check('상태 5종', q('#member-status').options.length === 5,
  [...q('#member-status').options].map(o => o.textContent).join(','));
check('첫 항목이 모든 상태', q('#member-status').options[0].textContent === '모든 상태');
check('필터 버튼', q('#btn-member-filter') !== null);
check('필터 버튼 문구', txt(q('#member-filter-label')) === '회원 필터링');

console.log('\n[2] 표 구성');
const heads = qa('#page-members thead th').map(txt);
check('열 = 회원이름/나이/생년월일/전화번호/가입날짜/최신기록/상태',
  heads.join(',') === '회원이름,나이,생년월일,전화번호,가입날짜,최신기록,상태',
  heads.join(','));
check('열 7개', heads.length === 7, heads.length + '개');
check('첫 화면 30행', rows().length === 30);

const c = cells(rows()[0]);
check('이름', c[0].length >= 2, c[0]);
check('나이 N세', /^\d{1,2}세$/.test(c[1]), c[1]);
check('생년월일', /^\d{4}-\d{2}-\d{2}$/.test(c[2]), c[2]);
check('전화번호 마스킹', /^010-\*{4}-\d{4}$/.test(c[3]), c[3]);
check('가입날짜', /^\d{4}-\d{2}-\d{2}$/.test(c[4]), c[4]);
check('최신기록', /^\d{4}-\d{2}-\d{2}$/.test(c[5]), c[5]);
check('상태 배지', ['이용 중', '최근 방문', '일반', '휴면'].includes(c[6]), c[6]);
check('보기 버튼 제거', rows()[0].querySelector('.view-btn') === null);
check('작업 칸도 제거', rows()[0].children.length === 7, rows()[0].children.length + '칸');
check('.view-btn CSS 제거', !html.includes('.view-btn'));

console.log('\n[3] 최신기록 · 상태 계산');
check('최신기록이 가입일 이후', rows().every(r => cells(r)[5] >= cells(r)[4]),
  cells(rows().find(r => cells(r)[5] < cells(r)[4]) || rows()[0]).join(' / '));
const today = new Date();
const todayStr = today.getFullYear() + '-' +
  String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
check('최신기록이 미래가 아님', rows().every(r => cells(r)[5] <= todayStr));
const live = rows().find(r => stateOf(r) === '이용 중');
check('오늘 방문 = 이용 중', !live || cells(live)[5] === todayStr,
  live ? cells(live)[5] + ' vs ' + todayStr : '해당 없음');

console.log('\n[4] 상태 필터');
setStatus('rest');
check('휴면만 표시', rows().length > 0 && rows().every(r => stateOf(r) === '휴면'));
check('건수 문구 전환', txt(q('#member-count')).includes('조건에 맞는'), txt(q('#member-count')));
setStatus('live');
check('이용 중만 표시', rows().every(r => stateOf(r) === '이용 중'));
setStatus('all');
check('전체 복귀', rows().length === 30 && txt(q('#member-count')).startsWith('전체'));

console.log('\n[5] 회원 필터링');
click(q('#btn-member-filter'));
check('필터 폼 열림', q('#form-modal').classList.contains('open') &&
  q('#form-title').textContent === '회원 필터링');
check('나이대 선택', q('[data-key="age"]') !== null && q('[data-key="age"]').options.length === 5);
check('가입 시기 선택', q('[data-key="join"]') !== null && q('[data-key="join"]').options.length === 4);
q('[data-key="age"]').value = '20';
submit(q('#form-modal-form'));
check('20대만 표시', rows().length > 0 &&
  rows().every(r => { const a = parseInt(cells(r)[1], 10); return a >= 20 && a < 30; }),
  rows().map(r => cells(r)[1]).slice(0, 5).join(','));
check('버튼 활성 표시', q('#btn-member-filter').classList.contains('on'));
check('적용 개수 표기', txt(q('#member-filter-label')) === '회원 필터링 1',
  txt(q('#member-filter-label')));

click(q('#btn-member-filter'));
q('[data-key="age"]').value = 'all';
submit(q('#form-modal-form'));
check('필터 해제', rows().length === 30 && !q('#btn-member-filter').classList.contains('on'));
check('문구 원복', txt(q('#member-filter-label')) === '회원 필터링');

console.log('\n[6] 검색 · 정렬 · 스크롤 유지');
search('김');
check('이름 검색', rows().every(r => cells(r)[0].startsWith('김')));
search('');
check('검색 해제', rows().length === 30);

click(q('.th-sort[data-sort="joined"]'));
const joins = rows().map(r => cells(r)[4]);
check('가입날짜 정렬', joins.join() === joins.slice().sort().join(), joins.slice(0, 3).join(' '));
check('가입날짜 정렬 표시', q('.th-sort[data-sort="joined"]').getAttribute('data-dir') === 'asc');
click(q('.th-sort[data-sort="last"]'));
const lasts = rows().map(r => cells(r)[5]);
check('최신기록 정렬', lasts.join() === lasts.slice().sort().join(), lasts.slice(0, 3).join(' '));
check('정렬 대상 5개', qa('#page-members .th-sort').length === 5,
  qa('#page-members .th-sort').map(b => b.dataset.sort).join(','));

scrollBottom();
check('스크롤로 60행', rows().length === 60);
scrollBottom(); scrollBottom(); scrollBottom();
check('끝까지 124행', rows().length === 124);

console.log('\n[7] 보기 · 상세');
const target = cells(rows()[3]);
click(rows()[3]);
check('행 클릭으로 상세 열림', q('#member-modal').classList.contains('open'));
check('이름 일치', txt(q('#mb-name')) === target[0]);
const detail = txt(q('#mb-rows'));
check('상세에 상태', ['이용 중', '최근 방문', '일반', '휴면'].some(s => detail.includes(s)), detail);
check('상세에 가입일', detail.includes(target[4]));
check('상세에 최근 방문', detail.includes(target[5]));
check('상세는 전화번호 전체', /010-\d{4}-\d{4}/.test(detail));
check('이용 기록 최신이 최신기록과 일치',
  txt(qa('#mb-logs .row')[0]).includes(target[5]), txt(qa('#mb-logs .row')[0]));
click(q('#mb-close'));

click(rows()[5]);
check('다른 행도 동작', q('#member-modal').classList.contains('open'));
click(q('#mb-close'));

console.log('\n[8] 회귀');
click(nav('대시보드'));
check('대시보드 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
click(nav('요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);
click(nav('매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));
check('상품 관리 정상', qa('#menu-grid .prod').length === 14);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
