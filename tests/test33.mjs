// 좌석 한 칸 안에 이용자 정보가 보이는지.
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

let confirmAnswer = true;
window.confirm = () => confirmAnswer;

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);

function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*(?:,[^{]*)?\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

const seats = () => qa('#seat-map .seat');
const used = () => qa('#seat-map .seat.use');
const free = () => qa('#seat-map .seat.free');
const fixed = () => qa('#seat-map .seat.fix');
const part = (el, cls) => el.querySelector('.' + cls);

click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));

console.log('\n[1] 크기');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const seatCss = ruleOf('.seat');
const rowCss = ruleOf('.seat-row-seats');
check('.seat 규칙', seatCss !== null);
check('정사각형 제약 해제', !/aspect-ratio/.test(seatCss), seatCss);
check('높이 확보', /min-height: 86px/.test(seatCss), seatCss);
check('안쪽 여백', /padding: 9px 10px/.test(seatCss), seatCss);
check('여러 줄을 담는 세로 상자', /flex-direction: column/.test(seatCss), seatCss);
check('넘치는 글자는 가림', /overflow: hidden/.test(seatCss), seatCss);
// 구역마다 좌석 수가 달라, 열 수를 고정하면 24석 구역이 못 쓰게 좁아진다
check('최소 폭을 정하고 줄바꿈', /repeat\(auto-fill, minmax\(116px, 1fr\)\)/.test(rowCss), rowCss);
check('고정 열 수(--cols) 더 안 씀', !html.includes('--cols'));
check('maxCols 도 제거', !html.includes('maxCols'));

console.log('\n[2] 이용 중 좌석에 들어가는 정보');
check('이용 중 좌석 있음', used().length > 0, used().length + '석');
const u = used()[0];
check('좌석 번호', /^\d+$/.test(txt(part(u, 'seat-no'))), txt(part(u, 'seat-no')));
check('이용자 이름', (txt(part(u, 'seat-user')) || '').length >= 2, txt(part(u, 'seat-user')));
check('회원 / 비회원 표시',
  ['회원', '비회원'].indexOf(txt(part(u, 'seat-kind'))) > -1, txt(part(u, 'seat-kind')));
check('시작 시각', /^시작 \d{2}:\d{2}$/.test(txt(part(u, 'seat-line'))), txt(part(u, 'seat-line')));
check('남은 시간', /남음$/.test(txt(part(u, 'seat-remain'))), txt(part(u, 'seat-remain')));
check('모든 이용 중 좌석이 네 가지를 다 가짐',
  used().every(s => part(s, 'seat-no') && part(s, 'seat-user') &&
    part(s, 'seat-kind') && part(s, 'seat-line') && part(s, 'seat-remain')));
check('이름이 비어 있지 않음', used().every(s => txt(part(s, 'seat-user')).length > 0));
check('시작 시각 형식 전부 정상',
  used().every(s => /^시작 \d{2}:\d{2}$/.test(txt(part(s, 'seat-line')))));

console.log('\n[3] 남은 시간 표기');
// 0시간 40분 처럼 읽히면 칸만 잡아먹는다
check('한 시간 미만은 분만',
  used().every(s => !/^0시간/.test(txt(part(s, 'seat-remain')))),
  used().map(s => txt(part(s, 'seat-remain'))).filter(t => /^0시간/.test(t)).join(','));
check('시간·분 형식', used().every(s =>
  /^(\d+시간( \d+분)?|\d+분) 남음$/.test(txt(part(s, 'seat-remain')))),
  used().map(s => txt(part(s, 'seat-remain'))).slice(0, 5).join(' / '));
check('30분 미만이면 soon 표시',
  used().every(s => {
    const m = txt(part(s, 'seat-remain')).match(/^(\d+)분 남음$/);
    const soon = s.classList.contains('soon');
    return m ? (Number(m[1]) < 30) === soon : !soon;
  }));
check('soon 색 규칙 있음', ruleOf('.seat.use.soon .seat-remain') !== null);

console.log('\n[4] 회원과 비회원이 구분된다');
const members = used().filter(s => txt(part(s, 'seat-kind')) === '회원');
const guests = used().filter(s => txt(part(s, 'seat-kind')) === '비회원');
check('둘 다 존재', members.length > 0 && guests.length > 0,
  '회원 ' + members.length + ' / 비회원 ' + guests.length);
check('비회원만 guest 클래스', guests.every(s => part(s, 'seat-kind').classList.contains('guest')));
check('회원은 guest 아님', members.every(s => !part(s, 'seat-kind').classList.contains('guest')));
// 안을 채우면 파란 바탕이 탁해진다 — 둘 다 테두리만
const kindCss = ruleOf('.seat.use .seat-kind');
check('뒤에 바탕 없음', /background: none/.test(kindCss), kindCss);
check('테두리는 있음', /border-color: rgba\(255, 255, 255, 0\.55\)/.test(kindCss), kindCss);
// 한쪽만 테두리를 주면 짝이 안 맞아 보인다
check('회원 · 비회원이 같은 모양', ruleOf('.seat.use .seat-kind.guest') === null,
  ruleOf('.seat.use .seat-kind.guest'));

console.log('\n[5] 빈자리 · 점검 중');
const f = free()[0];
check('빈자리에도 번호', /^\d+$/.test(txt(part(f, 'seat-no'))));
check('빈자리 안내', txt(part(f, 'seat-empty')) === '빈자리', txt(part(f, 'seat-empty')));
check('빈자리엔 이용자 정보 없음',
  free().every(s => !part(s, 'seat-user') && !part(s, 'seat-kind') && !part(s, 'seat-remain')));
check('점검 중 안내',
  fixed().every(s => txt(part(s, 'seat-empty')) === '점검 중'),
  fixed().map(s => txt(part(s, 'seat-empty'))).join(','));

console.log('\n[6] 하던 일은 그대로');
check('좌석 수 유지', seats().length === 140, seats().length + '석');
check('툴팁 유지', used().every(s => s.title.indexOf(' · 사용 중') > -1));
check('빈자리 툴팁에 PC 꺼짐', free().every(s => s.title.includes('PC 꺼짐')));
const uid = used()[0].dataset.id;
click(q('#seat-map .seat[data-id="' + uid + '"]'));
check('좌석 상세 열림', q('#seat-modal').classList.contains('open'));
check('상세에 좌석 번호', txt(q('#sd-id')).includes(uid), txt(q('#sd-id')));
click(q('#sd-close'));

// 안쪽 글자를 눌러도 좌석이 열려야 한다 (이벤트는 위임으로 받는다)
click(part(used()[1], 'seat-user'));
check('이름을 눌러도 상세 열림', q('#seat-modal').classList.contains('open'));
click(q('#sd-close'));

console.log('\n[7] 자리 설정(편집)에서도');
click(q('#btn-seat-edit'));
check('편집 모드', q('#seat-map').classList.contains('editing'));
const before = seats().length;
click(qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'plus'));
check('좌석 추가', seats().length === before + 1);
const added = qa('#seat-map .seat').filter(s => s.dataset.id.startsWith('A-')).pop();
check('새 좌석도 빈자리 카드', txt(part(added, 'seat-empty')) === '빈자리');
click(qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'minus'));
check('원복', seats().length === before);
click(q('#btn-seat-edit'));
check('편집 종료', !q('#seat-map').classList.contains('editing'));

console.log('\n[8] 대시보드에서도 같은 좌석표');
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('대시보드로 옮겨짐', q('#dashboard').contains(q('#seat-map')));
check('정보도 그대로', qa('#seat-map .seat.use')[0].querySelector('.seat-user') !== null);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
