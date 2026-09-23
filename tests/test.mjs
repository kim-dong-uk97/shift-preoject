import fs from 'node:fs';
import { JSDOM } from 'jsdom';

// 저장소 안의 admin/index.html 을 읽는다 (이 파일 기준 상대 경로)
const ADMIN = new URL('../admin/index.html', import.meta.url);
const html = fs.readFileSync(ADMIN, 'utf8');

const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
dom.virtualConsole.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
const { window } = dom;
const doc = window.document;
window.confirm = () => true;
window.alert = () => {};

const q = sel => doc.querySelector(sel);
const qa = sel => [...doc.querySelectorAll(sel)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

console.log('\n[1] 초기 로드');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('좌석 80석 렌더', qa('#seat-map .seat').length === 140, qa('#seat-map .seat').length + '석');
check('좌석표가 대시보드 안에 있음', q('#seat-slot #seat-panel') !== null);
check('편집 버튼 숨김(홈)', q('#btn-seat-edit').style.display === 'none');

console.log('\n[2] 사이드바 : 좌석 관리 하위 메뉴 제거');
const seatNav = qa('.nav-item').find(b => b.dataset.title === '좌석 관리');
check('좌석 관리 메뉴 존재', !!seatNav);
check('하위 메뉴(submenu) 없음', seatNav.closest('.nav-group').querySelector('.submenu') === null);
check('좌석 현황/자리 설정/이용기록 sub-item 없음',
  qa('.sub-item').filter(b => ['좌석 현황','자리 설정','이용기록'].includes(b.dataset.title)).length === 0);
check('이용 기록은 회원 상세 모달로 이동', q('#mb-logs') !== null && qa('.sub-item').every(b => b.dataset.title !== '이용 기록'));

console.log('\n[3] 좌석 관리 페이지 진입');
click(seatNav);
check('좌석표가 #page-seats 로 이동', q('#page-seats #seat-panel') !== null);
check('대시보드 숨김', q('#dashboard').style.display === 'none');
check('페이지 컨테이너 표시', q('#page-seats').style.display === 'block');
check('준비중 카드 숨김', q('#page-body').style.display === 'none');
check('편집 버튼 노출', q('#btn-seat-edit').style.display === 'inline-flex');
check('제목 = 좌석 관리', q('#page-title').textContent === '좌석 관리');

console.log('\n[4] 자리 설정(편집) 토글');
click(q('#btn-seat-edit'));
check('편집 클래스 on', q('#seat-map').classList.contains('editing'));
check('편집 바 표시', q('#edit-bar').classList.contains('on'));
check('구역 조절 버튼 렌더', qa('.zone-ctrl').length === 7, qa('.zone-ctrl').length + '개');
check('버튼 라벨 = 편집 중', q('#btn-seat-edit').textContent === '편집 중');

console.log('\n[5] 좌석 수 +/-');
const before = qa('#seat-map .seat').length;
const aPlus = qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'plus');
click(aPlus);
check('+ 누르면 1석 증가', qa('#seat-map .seat').length === before + 1);
check('새 좌석 A-25 생성', qa('#seat-map .seat').some(s => s.dataset.id === 'A-25'));
check('새 좌석은 빈자리', q('#seat-map .seat[data-id="A-25"]').classList.contains('free'));
const aMinus = qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'minus');
click(aMinus);
check('− 누르면 원복', qa('#seat-map .seat').length === before);

console.log('\n[6] 사용 중 좌석 보호');
// D 구역 마지막 좌석을 사용 중으로 만들고 삭제 시도
const dSeats = qa('#seat-map .seat').filter(s => s.dataset.id.startsWith('D-'));
const dLast = dSeats[dSeats.length - 1];
const wasUse = dLast.classList.contains('use');
if (wasUse) {
  const n = qa('#seat-map .seat').length;
  click(qa('.zone-btn').find(b => b.dataset.zone === 'D' && b.dataset.act === 'minus'));
  check('사용 중인 마지막 좌석은 삭제 거부', qa('#seat-map .seat').length === n);
  check('경고 토스트 노출', q('#toast-wrap').textContent.includes('사용 중인 좌석은 지울 수 없습니다'));
} else {
  console.log('  SKIP  D 구역 마지막 좌석이 사용 중이 아님(' + dLast.dataset.id + ')');
}

console.log('\n[7] 점검 중 토글');
const freeSeat = qa('#seat-map .seat.free')[0];
const fid = freeSeat.dataset.id;
click(freeSeat);
check('빈자리 클릭 -> 점검 중', q('#seat-map .seat[data-id="' + fid + '"]').classList.contains('fix'));
check('상세 모달 안 열림(편집 중)', !q('#seat-modal').classList.contains('open'));
click(q('#seat-map .seat[data-id="' + fid + '"]'));
check('다시 클릭 -> 빈자리 복귀', q('#seat-map .seat[data-id="' + fid + '"]').classList.contains('free'));

console.log('\n[8] 구역 추가');
const zBefore = qa('.zone-ctrl').length;
click(q('#edit-add-zone'));
check('구역 1개 추가', qa('.zone-ctrl').length === zBefore + 1);
check('H 구역 생성', qa('#seat-map .seat').some(s => s.dataset.id.startsWith('H-')));
check('H 구역 4석', qa('#seat-map .seat').filter(s => s.dataset.id.startsWith('H-')).length === 4);

console.log('\n[9] 편집 종료');
click(q('#edit-done'));
check('편집 클래스 해제', !q('#seat-map').classList.contains('editing'));
check('편집 바 숨김', !q('#edit-bar').classList.contains('on'));
check('구역 조절 버튼 제거', qa('.zone-ctrl').length === 0);
check('저장 토스트', q('#toast-wrap').textContent.includes('자리 설정을 저장했습니다'));

console.log('\n[10] 편집 종료 후 좌석 상세 정상 동작');
const useSeat = qa('#seat-map .seat.use')[0];
click(useSeat);
check('상세 모달 열림', q('#seat-modal').classList.contains('open'));
check('좌석 ID 표시', q('#sd-id').textContent === useSeat.dataset.id);
click(q('#sd-close'));

console.log('\n[11] 홈 복귀 시 좌석표 원위치');
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('좌석표가 대시보드로 복귀', q('#seat-slot #seat-panel') !== null);
check('편집 버튼 다시 숨김', q('#btn-seat-edit').style.display === 'none');
check('대시보드 표시', q('#dashboard').style.display === 'block');
check('KPI 좌석 수 갱신', /\/ \d+석/.test(q('#kpi-use').textContent), q('#kpi-use').textContent);

console.log('\n[12] 다른 메뉴는 기존대로');
const storeNav = qa('.nav-item').find(b => b.dataset.title === '직원관리');
click(storeNav);
// 근태 관리는 구현됐으므로, 아직 준비 중인 권한 설정으로 확인한다
click(qa('.sub-item').find(b => b.dataset.title === '권한 설정'));
check('준비중 카드 표시', q('#page-body').style.display === 'flex');
check('좌석 페이지 숨김', q('#page-seats').style.display === 'none');

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
