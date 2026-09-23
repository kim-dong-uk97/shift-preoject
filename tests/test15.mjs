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
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

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
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);
const lines = () => qa('#order-items .order-line');
const lineOf = n => lines().find(l => txt(l.querySelector('.nm')) === n);

click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(cardOf('라면'));
click(cardOf('라면'));

console.log('\n[1] 칩 모양');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const st = ruleOf('.stepper');
check('.stepper 규칙 존재', st !== null);
check('둥근 칩(radius 999px)', st && st.includes('border-radius: 999px'), st);
check('얇은 테두리 한 줄', st && st.includes('border: 1px solid var(--border)'), st);
check('흰 배경', st && st.includes('background: #fff'), st);
check('내용 폭만 차지', st && st.includes('inline-flex'), st);
check('모서리 넘침 정리', st && st.includes('overflow: hidden'), st);
check('옛 sm 변형 제거', !html.includes('.stepper.sm'));
check('마크업도 stepper 단일 클래스', lines()[0].querySelector('.stepper').className === 'stepper',
  lines()[0].querySelector('.stepper').className);

console.log('\n[2] 칩 안 배치 : − 수량 +');
const stepper = lineOf('라면').querySelector('.stepper');
const kids = [...stepper.children];
check('자식 3개', kids.length === 3, kids.length + '개');
check('왼쪽이 마이너스', kids[0].classList.contains('minus') && txt(kids[0]) === '−', txt(kids[0]));
check('가운데가 수량', kids[1].classList.contains('step-qty') && txt(kids[1]) === '2', txt(kids[1]));
check('오른쪽이 플러스', kids[2].classList.contains('plus') && txt(kids[2]) === '+', txt(kids[2]));

console.log('\n[3] 버튼 스타일');
const btn = ruleOf('.step-btn');
check('원형 배경 제거', btn && btn.includes('border-radius: 0'), btn);
check('버튼 배경 없음(칩이 테두리 담당)', btn && btn.includes('background: none'), btn);
check('버튼 테두리 없음', btn && btn.includes('border: 0'), btn);
check('얇은 높이(24px)', btn && btn.includes('height: 24px'), btn);
check('파란 원형 + 제거', !/\.step-btn\.plus \{[^}]*background: var\(--point\)/.test(html));
check('− 호버 표시', (ruleOf('.step-btn:hover') || '').includes('var(--point)'), ruleOf('.step-btn:hover'));
check('+ 호버 표시', (ruleOf('.step-btn.plus:hover') || '').includes('var(--point-soft)'),
  ruleOf('.step-btn.plus:hover'));
check('비활성 호버 안 먹힘', ruleOf('.step-btn:disabled:hover') !== null);
const qty = ruleOf('.step-qty');
check('수량 가운데 정렬', qty && qty.includes('text-align: center'), qty);
check('수량 폭 고정(자리 안 흔들림)', qty && qty.includes('flex: 0 0 26px'), qty);
check('등폭 숫자', qty && qty.includes('tabular-nums'), qty);

console.log('\n[4] 동작 유지');
click(stepper.querySelector('.plus'));
check('+ 로 증가', txt(lineOf('라면').querySelector('.step-qty')) === '3');
check('카드 배지 동기화', txt(cardOf('라면').querySelector('.menu-qty')) === '3');
click(lineOf('라면').querySelector('.minus'));
check('− 로 감소', txt(lineOf('라면').querySelector('.step-qty')) === '2');
check('금액 재계산', txt(lineOf('라면')).includes('6,000원'), txt(lineOf('라면')));
click(lineOf('라면').querySelector('.minus'));
click(lineOf('라면').querySelector('.minus'));
check('0이면 줄 삭제', lineOf('라면') === undefined);

// 재고 한도에서 + 비활성
for (let i = 0; i < 9; i++) click(cardOf('돈까스'));
check('재고만큼 담김', txt(lineOf('돈까스').querySelector('.step-qty')) === '9');
check('한도 도달 시 + 비활성', lineOf('돈까스').querySelector('.plus').disabled === true);
check('− 는 여전히 활성', lineOf('돈까스').querySelector('.minus').disabled === false);
click(lineOf('돈까스').querySelector('.minus'));
check('줄이면 + 다시 활성', lineOf('돈까스').querySelector('.plus').disabled === false);

console.log('\n[5] 회귀');
check('× 삭제 버튼 유지', lineOf('돈까스').querySelector('[data-rm]') !== null);
click(lineOf('돈까스').querySelector('[data-rm]'));
check('줄 삭제', lines().length === 0);
check('주문 목록 높이 유지', ruleOf('.order-items').includes('height: 268px'));
check('메뉴 카드엔 스테퍼 없음', qa('#menu-grid .stepper').length === 0);
check('결제 수단 5개', qa('#pay-methods .pay-btn').length === 5);
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
