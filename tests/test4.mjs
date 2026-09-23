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
window.confirm = (m) => { lastConfirm = m; return confirmAnswer; };
window.prompt = () => '종료';

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const toastText = () => q('#toast-wrap').textContent;

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
function openSeatById(id) { click(q('#seat-map .seat[data-id="' + id + '"]')); }

console.log('\n[1] 좌석 위 전원 표시 제거');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('pc-off 클래스 없음', qa('#seat-map .pc-off').length === 0);
check('범례에 PC 꺼짐 없음', !q('.seat-legend').textContent.includes('PC 꺼짐'));
check('범례 3종만 남음', qa('.seat-legend .legend').length === 3, qa('.seat-legend .legend').map(l => l.textContent).join(' / '));
check('CSS 에 .seat.pc-off 규칙 없음', !html.includes('.seat.pc-off'));
check('CSS 에 .legend i.dot 없음', !html.includes('.legend i.dot'));

console.log('\n[2] 초기 전원 : 이용 중인 자리만 켜짐');
const seatTitle = id => q('#seat-map .seat[data-id="' + id + '"]').title;
const useSeats = qa('#seat-map .seat.use');
const freeSeats = qa('#seat-map .seat.free');
const fixSeats = qa('#seat-map .seat.fix');
check('이용 중 좌석은 전부 켜짐', useSeats.every(s => !s.title.includes('PC 꺼짐')), useSeats.length + '석');
check('빈자리는 전부 꺼짐', freeSeats.every(s => s.title.includes('PC 꺼짐')), freeSeats.length + '석');
check('점검 중도 꺼짐', fixSeats.every(s => s.title.includes('PC 꺼짐')), fixSeats.length + '석');

console.log('\n[3] 모달 스위치 초기 상태');
const useId = useSeats[0].dataset.id;
const freeId = freeSeats[0].dataset.id;

openSeatById(useId);
check('이용 중 좌석 -> 스위치 ON', q('#sd-power-switch').getAttribute('aria-checked') === 'true');
check('상태 텍스트 켜짐', q('#sd-power-state').textContent === '켜짐');
check('재부팅 활성', q('#sd-reboot').disabled === false);
click(q('#sd-close'));

openSeatById(freeId);
check('빈자리 -> 스위치 OFF', q('#sd-power-switch').getAttribute('aria-checked') === 'false');
check('상태 텍스트 꺼짐', q('#sd-power-state').textContent === '꺼짐');
check('꺼진 PC 재부팅 비활성', q('#sd-reboot').disabled === true);

console.log('\n[4] 빈자리 PC 켜기 (입장 전 준비 시나리오)');
confirmAnswer = true;
click(q('#sd-power-switch'));
check('확인 문구', lastConfirm.includes(freeId) && lastConfirm.includes('켤까요'), lastConfirm);
check('스위치 ON', q('#sd-power-switch').getAttribute('aria-checked') === 'true');
check('툴팁에서 PC 꺼짐 사라짐', !seatTitle(freeId).includes('PC 꺼짐'), seatTitle(freeId));
check('재부팅 활성화', q('#sd-reboot').disabled === false);
check('ON 토스트', toastText().includes(freeId + ' PC 전원 ON'));
check('좌석은 여전히 빈자리', q('#seat-map .seat[data-id="' + freeId + '"]').classList.contains('free'));

click(q('#sd-power-switch'));
check('다시 끄면 OFF', q('#sd-power-switch').getAttribute('aria-checked') === 'false');
check('툴팁 PC 꺼짐 복귀', seatTitle(freeId).includes('PC 꺼짐'));
click(q('#sd-close'));

console.log('\n[5] 이용 중 좌석 경고 유지');
openSeatById(useId);
confirmAnswer = false;
click(q('#sd-power-switch'));
check('이용자 경고 유지', lastConfirm.includes('님이 이용 중입니다'), lastConfirm.replace(/\n/g, ' / '));
check('취소 시 켜짐 유지', q('#sd-power-switch').getAttribute('aria-checked') === 'true');
click(q('#sd-reboot'));
check('재부팅도 경고', lastConfirm.includes('재부팅할까요'));
confirmAnswer = true;
click(q('#sd-reboot'));
check('재부팅 후에도 켜짐', q('#sd-power-switch').getAttribute('aria-checked') === 'true');
check('재부팅 토스트', toastText().includes(useId + ' PC 재부팅'));
click(q('#sd-close'));

console.log('\n[6] 전체 제어 -> 모달 반영');
click(qa('#quick-actions .nav-action').find(b => b.dataset.action === 'on'));
openSeatById(freeId);
check('전체 ON 후 빈자리도 켜짐', q('#sd-power-switch').getAttribute('aria-checked') === 'true');
click(q('#sd-close'));
click(qa('#quick-actions .nav-action').find(b => b.dataset.action === 'off'));
openSeatById(useId);
check('전체 OFF 후 이용 중 좌석도 꺼짐', q('#sd-power-switch').getAttribute('aria-checked') === 'false');
click(q('#sd-close'));
click(qa('#quick-actions .nav-action').find(b => b.dataset.action === 'on'));

console.log('\n[7] 좌석 관리 · 편집 · 이동 회귀');
click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));
check('좌석 관리 진입', q('#page-seats #seat-panel') !== null);
click(q('#btn-seat-edit'));
check('편집 모드', q('#seat-map').classList.contains('editing'));
const before = qa('#seat-map .seat').length;
click(qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'plus'));
check('좌석 추가', qa('#seat-map .seat').length === before + 1);
const added = qa('#seat-map .seat').filter(s => s.dataset.id.startsWith('A-')).pop();
check('새 좌석은 전원 꺼짐', added.title.includes('PC 꺼짐'), added.title);
click(qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'minus'));
click(q('#edit-done'));
check('편집 종료', !q('#seat-map').classList.contains('editing'));

const u2 = qa('#seat-map .seat.use')[0];
openSeatById(u2.dataset.id);
check('좌석 이동 버튼', q('#sd-move').style.display === 'block');
click(q('#sd-move-start'));
check('이동 모드', q('#seat-map').classList.contains('moving'));
click(q('#move-cancel'));
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 복귀 시 좌석표 원위치', q('#seat-slot #seat-panel') !== null);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
