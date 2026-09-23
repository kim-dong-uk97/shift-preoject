// 좌석표 한 벌을 두 화면에서 나눠 쓴다.
// 대시보드 = 한 치수 작은 칸(내용은 그대로), 좌석 관리 = 기본 크기 + 자리 설정.
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

function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*(?:,[^{]*)?\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}
const px = (rule, prop) => {
  const m = (rule || '').match(new RegExp('(?:^|[;{ ])' + prop + ':\\s*(-?[\\d.]+)(px|)(?=[;\\s}])'));
  return m ? parseFloat(m[1]) : null;
};

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const map = () => q('#seat-map');
const seats = () => qa('#seat-map .seat');
const used = () => qa('#seat-map .seat.use');
const free = () => qa('#seat-map .seat.free');
const compact = () => map().classList.contains('compact');
const part = (el, cls) => el.querySelector('.' + cls);

console.log('\n[1] 대시보드로 시작하면 작은 좌석표');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('대시보드가 첫 화면', q('#dashboard').style.display !== 'none');
check('좌석표가 대시보드 안', q('#seat-slot').contains(map()));
// 처음 열었을 때도 작은 모드여야 한다 (화면 이동 없이 바로 보이는 상태)
check('처음부터 작은 모드', compact());
check('자리 설정 버튼 숨김', q('#btn-seat-edit').style.display === 'none');
check('좌석 수는 그대로', seats().length === 140, seats().length + '석');

console.log('\n[2] 줄어든 건 크기뿐');
const cRow = ruleOf('.seat-map.compact .seat-row-seats');
const cSeat = ruleOf('.seat-map.compact .seat');
const bRow = ruleOf('.seat-row-seats');
const bSeat = ruleOf('.seat');
check('칸 최소 폭이 더 작음', px(cRow, 'minmax') === null || /minmax\(96px, 1fr\)/.test(cRow), cRow);
check('기본보다 좁아짐', /minmax\(116px, 1fr\)/.test(bRow) && /minmax\(96px, 1fr\)/.test(cRow),
  bRow + ' -> ' + cRow);
check('칸 사이도 좁게', px(cRow, 'gap') < px(bRow, 'gap'),
  px(bRow, 'gap') + ' -> ' + px(cRow, 'gap'));
check('높이도 낮게', px(cSeat, 'min-height') < px(bSeat, 'min-height'),
  px(bSeat, 'min-height') + ' -> ' + px(cSeat, 'min-height'));
check('안쪽 여백도 줄임', /padding: 7px 8px/.test(cSeat), cSeat);
// 글자만 작아질 뿐 사라지지 않는다
check('이름 글자 크기만 줄임', /font-size: 11\.5px/.test(ruleOf('.seat-map.compact .seat-user')),
  ruleOf('.seat-map.compact .seat-user'));
check('남은 시간도 그대로 둠', ruleOf('.seat-map.compact .seat-remain') !== null);
check('숨기는 규칙 없음',
  !/\.seat-map\.compact[^{]*\{[^}]*display: none/.test(html),
  (html.match(/\.seat-map\.compact[^{]*\{[^}]*display: none[^}]*\}/) || [''])[0]);
check('정사각형으로 눌러 버리지 않음', !/aspect-ratio/.test(cSeat), cSeat);

console.log('\n[3] 작은 모드에서도 정보가 다 나온다');
const u = used()[0];
check('좌석 번호', part(u, 'seat-no') !== null && /^\d+$/.test(txt(part(u, 'seat-no'))));
check('이용자 이름', (txt(part(u, 'seat-user')) || '').length >= 2, txt(part(u, 'seat-user')));
check('회원 / 비회원', ['회원', '비회원'].indexOf(txt(part(u, 'seat-kind'))) > -1,
  txt(part(u, 'seat-kind')));
check('시작 시각', /^시작 \d{2}:\d{2}$/.test(txt(part(u, 'seat-line'))), txt(part(u, 'seat-line')));
check('남은 시간', /남음$/.test(txt(part(u, 'seat-remain'))), txt(part(u, 'seat-remain')));
check('모든 이용 중 좌석이 네 가지를 다 가짐',
  used().every(s => part(s, 'seat-no') && part(s, 'seat-user') &&
    part(s, 'seat-kind') && part(s, 'seat-line') && part(s, 'seat-remain')));
check('빈자리 안내도 그대로', txt(part(free()[0], 'seat-empty')) === '빈자리',
  txt(part(free()[0], 'seat-empty')));
check('안내 문구는 원래대로', txt(q('#seat-panel-note')) === '좌석을 클릭하면 상세 · 좌석 이동',
  txt(q('#seat-panel-note')));

console.log('\n[4] 좌석 관리로 가면 기본 크기');
click(nav('좌석 관리'));
check('좌석 관리 화면', q('#page-seats').style.display === 'block');
check('좌석표가 옮겨감', q('#page-seats').contains(map()));
check('작은 모드 해제', !compact());
check('자리 설정 버튼 노출', q('#btn-seat-edit').style.display === 'inline-flex');
check('정보는 여기서도 그대로', part(used()[0], 'seat-user') !== null);

console.log('\n[5] 오가도 상태가 유지된다');
const uid = used()[0].dataset.id;
const uname = txt(part(used()[0], 'seat-user'));
click(nav('대시보드'));
check('다시 작은 모드', compact());
check('좌석 수 유지', seats().length === 140);
check('같은 이용자', txt(q('#seat-map .seat[data-id="' + uid + '"] .seat-user')) === uname, uname);
click(nav('좌석 관리'));
check('다시 기본 크기', !compact());

console.log('\n[6] 편집 중에 나가도 뒤엉키지 않는다');
click(q('#btn-seat-edit'));
check('편집 모드', map().classList.contains('editing'));
check('편집 안내 문구', txt(q('#seat-panel-note')).includes('좌석 수 조절'),
  txt(q('#seat-panel-note')));
click(nav('대시보드'));
check('편집 해제', !map().classList.contains('editing'));
check('작은 모드로 전환', compact());
check('안내 문구 복귀', txt(q('#seat-panel-note')) === '좌석을 클릭하면 상세 · 좌석 이동',
  txt(q('#seat-panel-note')));

console.log('\n[7] 작은 칸에서도 누르면 상세가 열린다');
click(q('#seat-map .seat[data-id="' + uid + '"]'));
check('좌석 상세 열림', q('#seat-modal').classList.contains('open'));
check('좌석 번호 일치', txt(q('#sd-id')).includes(uid), txt(q('#sd-id')));
click(q('#sd-close'));
// 칸 안 글자를 눌러도 열려야 한다
click(part(used()[1], 'seat-user'));
check('이름을 눌러도 열림', q('#seat-modal').classList.contains('open'));
click(q('#sd-close'));

console.log('\n[8] 회귀');
check('대시보드 KPI 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
click(nav('매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));
check('매점 정상', qa('#menu-grid .prod').length > 0);
click(nav('대시보드'));
check('좌석표 복귀', q('#seat-slot').contains(map()) && compact());

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
