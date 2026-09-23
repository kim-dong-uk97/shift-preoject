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
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
const rows = () => qa('#member-body tr[data-member]');
const cellsOf = tr => [...tr.children].map(td => td.textContent.trim());
function search(kw) { q('#member-search').value = kw; fire(q('#member-search'), 'input'); }
// jsdom 은 레이아웃이 없어 scrollHeight 가 0이므로 스크롤 이벤트만 발생시킨다
const scrollBottom = () => fire(q('#member-scroll'), 'scroll');

console.log('\n[1] 메뉴 · 페이지');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const memNav = qa('.nav-item').find(b => b.dataset.title === '회원 관리');
check('회원 관리 하위 메뉴 제거', memNav.closest('.nav-group').querySelector('.submenu') === null);
check('회원 목록/이용 기록 sub-item 없음',
  qa('.sub-item').filter(b => ['회원 목록', '이용 기록'].includes(b.dataset.title)).length === 0);

click(memNav);
check('회원 페이지 표시', q('#page-members').style.display === 'block');
check('준비중 카드 숨김', q('#page-body').style.display === 'none');
check('요금 페이지 숨김', q('#page-fees').style.display === 'none');
check('제목', q('#page-title').textContent === '회원 관리');
check('부제', q('#page-desc').textContent === '회원 조회 · 이용 기록');

console.log('\n[2] 표 구조 · 기본 정보 4열');
const heads = qa('#page-members thead th').map(t => t.textContent.trim());
check('열 = 회원이름/나이/생년월일/전화번호/가입날짜/최신기록/상태',
  heads.join(',') === '회원이름,나이,생년월일,전화번호,가입날짜,최신기록,상태',
  heads.join(','));
check('검색창 존재', q('#member-search') !== null);
check('검색창 안내 문구', q('#member-search').placeholder.includes('전화번호'));
check('스크롤 컨테이너', q('#member-scroll') !== null);

console.log('\n[3] 초기 로드 30건');
check('첫 화면 30행', rows().length === 30, rows().length + '행');
check('전체 124명 표기', q('#member-count').textContent.includes('124명'), q('#member-count').textContent);
check('30명 표시 표기', q('#member-count').textContent.includes('30명 표시'));
check('더 보기 안내', q('#member-more').textContent.includes('스크롤하면'), q('#member-more').textContent);

const first = cellsOf(rows()[0]);
check('이름 채워짐', first[0].length >= 2, first[0]);
check('나이 표기(세)', /^\d{1,2}세$/.test(first[1]), first[1]);
check('생년월일 YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(first[2]), first[2]);
check('전화번호 마스킹(010-****-####)', /^010-\*{4}-\d{4}$/.test(first[3]), first[3]);
check('모든 행이 마스킹됨', rows().every(tr => /^010-\*{4}-\d{4}$/.test(cellsOf(tr)[3])));

console.log('\n[4] 나이 계산 검증 (오늘 2026-09-18)');
const bad = rows().map(cellsOf).filter(c => {
  const [y, m, d] = c[2].split('-').map(Number);
  let age = 2026 - y;
  if (918 < m * 100 + d) age--;
  return c[1] !== age + '세';
});
check('만 나이 계산 일치', bad.length === 0, bad.length ? JSON.stringify(bad[0]) : '');

console.log('\n[5] 스크롤로 더 불러오기');
scrollBottom();
check('60행으로 증가', rows().length === 60, rows().length + '행');
scrollBottom();
check('90행으로 증가', rows().length === 90);
scrollBottom();
check('120행으로 증가', rows().length === 120);
scrollBottom();
check('전체 124행에서 멈춤', rows().length === 124, rows().length + '행');
check('마지막 안내 문구', q('#member-more').textContent === '마지막 회원입니다', q('#member-more').textContent);
scrollBottom();
check('끝에서 더 늘지 않음', rows().length === 124);

console.log('\n[6] 이름 검색');
const target = cellsOf(rows()[5])[0];
search(target);
check('검색 결과 있음', rows().length > 0);
check('결과가 모두 일치', rows().every(tr => cellsOf(tr)[0].includes(target)));
check('건수 표기 전환', q('#member-count').textContent.includes('조건에 맞는'), q('#member-count').textContent);
check('검색 시 페이지 초기화', rows().length <= 30);

search('김');
check('성으로 검색', rows().every(tr => cellsOf(tr)[0].startsWith('김')));

console.log('\n[7] 전화번호 뒷자리 검색');
search('');
const fullPhone = null;
// 마스킹 전 원본 뒷자리로 검색되는지 확인
const sample = cellsOf(rows()[3])[3].slice(-4);
search(sample);
check('뒷자리로 검색됨', rows().length > 0, sample);
check('결과가 모두 해당 뒷자리', rows().every(tr => cellsOf(tr)[3].endsWith(sample)));
search('010-' + sample);
check('하이픈 포함 입력도 동작', rows().length > 0);

search('존재하지않는이름zzz');
check('결과 없음 안내', q('#member-body').textContent.includes('조건에 맞는 회원이 없습니다'));
check('결과 0명 표기', q('#member-count').textContent.includes('0명'), q('#member-count').textContent);
check('더 보기 문구 비움', q('#member-more').textContent === '');

search('');
check('검색 해제 시 복귀', rows().length === 30 && q('#member-count').textContent.includes('124명'));

console.log('\n[8] 행 클릭 -> 상세 + 이용 기록');
const clicked = cellsOf(rows()[2]);
click(rows()[2]);
check('상세 모달 열림', q('#member-modal').classList.contains('open'));
check('이름 표시', q('#mb-name').textContent === clicked[0], q('#mb-name').textContent);
check('회원번호 표시', q('#mb-sub').textContent.includes('M100'), q('#mb-sub').textContent);
const detail = q('#mb-rows').textContent;
check('나이 포함', detail.includes(clicked[1]));
check('생년월일 포함', detail.includes(clicked[2]));
check('상세에선 전화번호 전체 표시', /010-\d{4}-\d{4}/.test(detail), detail.replace(/\s+/g, ' '));
check('가입일 포함', detail.includes('가입일'));
check('이용 기록 있음', qa('#mb-logs .row').length >= 3, qa('#mb-logs .row').length + '건');
check('이용 기록에 좌석·시간', q('#mb-logs').textContent.includes('시간'));
check('이용 기록에 금액', q('#mb-logs').textContent.includes('원'));

click(q('#mb-close'));
check('모달 닫힘', !q('#member-modal').classList.contains('open'));

console.log('\n[9] 회귀');
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', q('#page-fees').style.display === 'block' && q('#page-members').style.display === 'none');
check('요금 카드 정상', qa('#pass-grid .prod').length === 5);
click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));
check('좌석 관리 정상', q('#page-seats #seat-panel') !== null);
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', q('#seat-slot #seat-panel') !== null && q('#dashboard').style.display === 'block');
const storeNav = qa('.nav-item').find(b => b.dataset.title === '직원관리');
click(storeNav);
// 근태 관리는 구현됐으므로, 아직 준비 중인 권한 설정으로 확인한다
click(qa('.sub-item').find(b => b.dataset.title === '권한 설정'));
check('미구현 메뉴는 준비중 유지', q('#page-body').style.display === 'flex');

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
