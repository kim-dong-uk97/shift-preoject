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

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

console.log('\n[1] 타일 구조');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const grid = q('#dashboard .kpi-grid.tiles');
check('공개 지표에 tiles 적용', grid !== null);
const tiles = qa('#dashboard .kpi-grid.tiles > .kpi');
check('타일 4개', tiles.length === 4);
check('타일마다 아이콘 박스', tiles.every(t => t.querySelector('.kpi-icon')));
check('아이콘은 SVG', tiles.every(t => t.querySelector('.kpi-icon svg')));
check('색상 클래스 c1~c4', tiles.map((t, i) => t.querySelector('.kpi-icon').classList.contains('c' + (i + 1))).every(Boolean),
  tiles.map(t => t.querySelector('.kpi-icon').className).join(' / '));

console.log('\n[2] 읽는 순서 = 아이콘 → 라벨 → 숫자');
const first = tiles[0];
check('첫 자식이 아이콘', first.firstElementChild.classList.contains('kpi-icon'));
const textBlock = first.lastElementChild;
const order = [...textBlock.children].map(el => el.className.split(' ')[0]);
check('라벨 → 값 → 보조 순서', order.join(',') === 'kpi-label,kpi-value,kpi-sub', order.join(','));

console.log('\n[3] 지표 내용 보존');
const labels = tiles.map(t => t.querySelector('.kpi-label').textContent.trim());
check('라벨 4종 그대로',
  labels.join(',') === '사용 중 좌석,현재 이용 고객,좌석 회전율,매점 주문 대기', labels.join(','));
check('kpi-use id 유지', q('#kpi-use') !== null);
check('kpi-rate id 유지', q('#kpi-rate') !== null);
check('좌석 수 자동 반영', /\d+\s*\/\s*\d+석/.test(q('#kpi-use').textContent.replace(/\s+/g, ' ')),
  q('#kpi-use').textContent);
check('가동률 자동 반영', /%$/.test(q('#kpi-rate').textContent), q('#kpi-rate').textContent);
check('보조 문구 유지', tiles.every(t => t.querySelector('.kpi-sub').textContent.trim().length > 0));
check('단위 표기 유지', tiles.every(t => t.querySelector('.kpi-value .unit')));

console.log('\n[4] 점장 전용 지표는 기존 스타일 유지');
const secure = q('.secure-body .kpi-grid');
check('점장 지표 grid 존재', secure !== null);
check('점장 지표에는 tiles 미적용', !secure.classList.contains('tiles'));
check('점장 지표에는 아이콘 없음', secure.querySelectorAll('.kpi-icon').length === 0);
check('점장 지표 4개 유지', secure.querySelectorAll('.kpi').length === 4);

console.log('\n[5] CSS 규칙');
check('.tiles .kpi 규칙 존재', html.includes('.tiles .kpi {'));
check('둥근 모서리 20px', /\.tiles \.kpi \{[^}]*border-radius: 20px/s.test(html));
check('정사각형 느낌 min-height', /\.tiles \.kpi \{[^}]*min-height: 172px/s.test(html));
check('그림자 적용', /\.tiles \.kpi \{[^}]*box-shadow/s.test(html));
check('아이콘 4색 정의', ['c1', 'c2', 'c3', 'c4'].every(c => html.includes('.kpi-icon.' + c + ' {')));
check('좁은 화면 대응', /@media \(max-width: 720px\)[\s\S]*?\.tiles \.kpi \{/.test(html));

console.log('\n[6] 좌석 변동 시 타일 갱신');
const before = q('#kpi-use').textContent;
click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));
click(q('#btn-seat-edit'));
click(qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'plus'));
check('좌석 추가 시 타일 숫자 변동', q('#kpi-use').textContent !== before,
  before + ' -> ' + q('#kpi-use').textContent);
click(qa('.zone-btn').find(b => b.dataset.zone === 'A' && b.dataset.act === 'minus'));
click(q('#edit-done'));
check('원복', q('#kpi-use').textContent === before);

console.log('\n[7] 회귀');
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', q('#dashboard').style.display === 'block' && q('#seat-slot #seat-panel') !== null);
click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
