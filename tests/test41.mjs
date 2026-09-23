// 매장관리 : 카운터 설정 · 환경 설정
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
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
const toastText = () => q('#toast-wrap').textContent;
const typeIn = (el, v) => { el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const sub = t => qa('.sub-item').find(b => b.dataset.title === t);
const go = t => { click(nav('매장관리')); click(sub(t)); };
const set = k => q('[data-set="' + k + '"]');
const sw = k => q('[data-set-switch="' + k + '"]');
const cards = id => qa('#' + id + ' .set-card');
const titles = id => cards(id).map(c => txt(c.querySelector('.set-title')));

console.log('\n[1] 메뉴에 두 화면이 붙었다');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('매장관리 하위 3개',
  nav('매장관리').closest('.nav-group').querySelectorAll('.sub-item').length === 3);
check('카운터 설정 · 환경 설정', sub('카운터 설정') && sub('환경 설정'));

go('카운터 설정');
check('카운터 화면 표시', q('#page-counter').style.display === 'block');
check('준비 중 카드 아님', q('#page-body').style.display === 'none');
check('제목', q('#page-title').textContent === '카운터 설정');
check('부제', q('#page-desc').textContent === '카운터 화면 동작 · 점장 잠금',
  q('#page-desc').textContent);

console.log('\n[2] 카운터 설정 내용');
check('카드 3장', cards('counter-set').length === 3, cards('counter-set').length + '장');
check('화면 / 점장 잠금 / 주문', titles('counter-set').join(',') === '화면,점장 잠금,주문',
  titles('counter-set').join(','));
check('처음 열리는 화면 고르기', set('counter.home') !== null &&
  set('counter.home').tagName === 'SELECT');
check('좌석표 작게 스위치', sw('counter.compactSeat') !== null);
check('해제 유지 시간', set('counter.lockMin') !== null && set('counter.lockMin').value === '5',
  set('counter.lockMin') && set('counter.lockMin').value);
check('전원 재확인 스위치', sw('counter.confirmPower') !== null);
check('주문 소리 스위치', sw('counter.orderSound') !== null);
check('저장 전에는 저장됨 표시', txt(q('#counter-note')) === '모두 저장되었습니다',
  txt(q('#counter-note')));

console.log('\n[3] 바꾸면 저장 전이라고 알려 준다');
click(sw('counter.orderSound'));
check('스위치 꺼짐', sw('counter.orderSound').getAttribute('aria-checked') === 'false');
check('안 저장됨 표시', txt(q('#counter-note')) === '저장하지 않은 변경이 있습니다',
  txt(q('#counter-note')));
check('눈에 띄게', q('#counter-save').closest('.set-foot').classList.contains('dirty'));
click(q('#counter-save'));
check('저장 알림', toastText().includes('설정을 저장했습니다'), toastText());
check('표시 원복', txt(q('#counter-note')) === '모두 저장되었습니다');
check('값 유지', sw('counter.orderSound').getAttribute('aria-checked') === 'false');

console.log('\n[4] 잘못된 값은 막는다');
typeIn(set('counter.lockMin'), '0');
click(q('#counter-save'));
check('0분 차단', toastText().includes('1분 이상'), toastText());
check('저장 안 됨', txt(q('#counter-note')) === '저장하지 않은 변경이 있습니다');
typeIn(set('counter.lockMin'), '10');
click(q('#counter-save'));
check('고치면 저장', txt(q('#counter-note')) === '모두 저장되었습니다');
// 저장한 값이 실제 잠금 동작과 안내 문구에 반영돼야 한다
check('잠금 안내 문구도 10분',
  qa('.ov-desc').every(el => txt(el) === 'PIN을 입력하면 10분간 표시됩니다.'),
  qa('.ov-desc').map(txt).join(' | '));
click(nav('매출·정산 관리'));
q('#pin-input').value = '1234';
q('#pin-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
check('해제 알림도 10분', toastText().includes('10분간'), toastText());

console.log('\n[5] 좌석표 크기 설정이 실제로 먹는다');
go('카운터 설정');
click(sw('counter.compactSeat'));
click(q('#counter-save'));
click(nav('대시보드'));
check('작게 끄면 기본 크기', !q('#seat-map').classList.contains('compact'));
go('카운터 설정');
click(sw('counter.compactSeat'));
click(q('#counter-save'));
click(nav('대시보드'));
check('다시 켜면 작게', q('#seat-map').classList.contains('compact'));

console.log('\n[6] 환경 설정 내용');
go('환경 설정');
check('환경 화면 표시', q('#page-config').style.display === 'block');
check('카운터 화면 숨김', q('#page-counter').style.display === 'none');
check('제목', q('#page-title').textContent === '환경 설정');
check('카드 4장', cards('config-set').length === 4, cards('config-set').length + '장');
check('공지 / 영업시간 / 매장 정보 / 알림',
  titles('config-set').join(',') === '공지사항,영업시간,매장 정보,알림 설정',
  titles('config-set').join(','));

console.log('\n[7] 공지사항');
check('띄우기 스위치', sw('notice.on') !== null);
check('내용 입력칸', set('notice.text') !== null &&
  set('notice.text').tagName === 'TEXTAREA');
check('배너가 떠 있음', q('#notice-bar').style.display === 'flex',
  q('#notice-bar').style.display);
check('배너 글이 설정과 같음', txt(q('#notice-text')) === set('notice.text').value,
  txt(q('#notice-text')));
// 배너는 어느 화면에서나 보인다
click(nav('대시보드'));
check('다른 화면에서도 배너', q('#notice-bar').style.display === 'flex');
check('본문 위에 있음', !q('#dashboard').contains(q('#notice-bar')));

go('환경 설정');
typeIn(set('notice.text'), '오늘 22시부터 청소년 이용이 제한됩니다.');
click(q('#config-save'));
check('배너 글도 바뀜', txt(q('#notice-text')) === '오늘 22시부터 청소년 이용이 제한됩니다.',
  txt(q('#notice-text')));

click(q('#notice-close'));
check('닫으면 이번만 사라짐', q('#notice-bar').style.display === 'none');
check('설정은 그대로 켜짐', sw('notice.on').getAttribute('aria-checked') === 'true');

click(sw('notice.on'));
click(q('#config-save'));
check('끄면 안 뜸', q('#notice-bar').style.display === 'none');
click(sw('notice.on'));
click(q('#config-save'));
check('다시 켜면 뜸', q('#notice-bar').style.display === 'flex');

console.log('\n[8] 영업시간');
check('24시간 스위치', sw('hours.allDay') !== null);
check('평일 여닫는 시각', set('hours.weekOpen').value === '10:00' &&
  set('hours.weekClose').value === '24:00',
  set('hours.weekOpen').value + '~' + set('hours.weekClose').value);
check('주말은 따로', set('hours.endOpen') !== null && set('hours.endClose') !== null);
// 자정을 넘기는 매장이라 26:00 같은 표기를 쓴다
check('새벽까지도 적힘', set('hours.endClose').value === '26:00',
  set('hours.endClose').value);
check('마감 주문 시간', set('hours.lastOrder').value === '30', set('hours.lastOrder').value);

typeIn(set('hours.weekOpen'), '열시');
click(q('#config-save'));
check('형식 틀리면 차단', toastText().includes('10:00 처럼'), toastText());
typeIn(set('hours.weekOpen'), '11:00');
click(q('#config-save'));
check('고치면 저장', txt(q('#config-note')) === '모두 저장되었습니다');

console.log('\n[9] 매장 정보');
check('상호', set('store.name').value.length > 0, set('store.name').value);
check('사업자번호 · 전화 · 주소',
  set('store.biz') && set('store.tel') && set('store.addr'));
typeIn(set('store.name'), '');
click(q('#config-save'));
check('상호 비우면 차단', toastText().includes('상호를 입력'), toastText());
typeIn(set('store.name'), 'SHIFT PC 강남점');
click(q('#config-save'));
check('되돌리면 저장', txt(q('#config-note')) === '모두 저장되었습니다');

console.log('\n[10] 알림 설정');
const alertRows = () => [...cards('config-set')[3].querySelectorAll('.set-row')];
check('알림 5가지', alertRows().length === 5, alertRows().length + '개');
// 22시가 되면 미성년 이용자를 알려 주는 게 핵심
check('청소년 시간 알림 있음',
  alertRows().some(r => txt(r.querySelector('b')) === '청소년 이용 시간 종료'),
  alertRows().map(r => txt(r.querySelector('b'))).join(','));
check('기본 22:00', set('alert.minor').value === '22:00', set('alert.minor').value);
check('켜져 있음', sw('alert.minor').getAttribute('aria-checked') === 'true');
check('시각이 필요 없는 알림은 시각칸 없음',
  set('alert.stock') === null && sw('alert.stock') !== null);
check('마감 안내도 시각 있음', set('alert.close') !== null);
check('미출근은 꺼 둔 상태', sw('alert.attend').getAttribute('aria-checked') === 'false');

typeIn(set('alert.minor'), '22시');
click(q('#config-save'));
check('알림 시각 형식도 검사', toastText().includes('22:00 처럼'), toastText());
typeIn(set('alert.minor'), '21:30');
click(q('#config-save'));
check('고치면 저장', txt(q('#config-note')) === '모두 저장되었습니다');
check('바꾼 시각 유지', set('alert.minor').value === '21:30', set('alert.minor').value);
click(sw('alert.attend'));
click(q('#config-save'));
check('미출근 켜짐', sw('alert.attend').getAttribute('aria-checked') === 'true');

console.log('\n[11] 화면을 오가도 값이 남는다');
click(nav('대시보드'));
go('환경 설정');
check('상호 유지', set('store.name').value === 'SHIFT PC 강남점', set('store.name').value);
check('알림 시각 유지', set('alert.minor').value === '21:30', set('alert.minor').value);
check('영업시간 유지', set('hours.weekOpen').value === '11:00', set('hours.weekOpen').value);
go('카운터 설정');
check('잠금 시간 유지', set('counter.lockMin').value === '10', set('counter.lockMin').value);

console.log('\n[12] 보안 설정은 아직 준비 중');
go('보안 설정');
check('준비 중 카드', q('#page-body').style.display === 'flex');
check('경로 표시', q('#page-desc').textContent === '매장관리 > 보안 설정',
  q('#page-desc').textContent);

console.log('\n[13] 회귀');
click(nav('대시보드'));
check('대시보드 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
click(nav('좌석 관리'));
check('좌석 관리 정상', qa('#seat-map .seat').length === 140);
check('설정 화면 숨김',
  q('#page-counter').style.display === 'none' && q('#page-config').style.display === 'none');

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
