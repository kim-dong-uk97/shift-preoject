// 상단 바 : 검색 + 주문 · 알림 배지. 어느 화면에서나 같은 자리, 같은 자료.
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
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
const num = t => Number(String(t).replace(/[^\d]/g, ''));

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

const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const sub = t => qa('.sub-item').find(b => b.dataset.title === t);
const oBadge = () => q('#badge-orders');
const cBadge = () => q('#badge-chat');
const oPop = () => q('#orders-pop');

const sPop = () => q('#search-pop');
const items = pop => [...pop.querySelectorAll('.pop-item, .pop-row')];
// 주문 목록은 칸을 맞춘 별도 줄(.pop-row)
const rows = () => [...oPop().querySelectorAll('.pop-row')];
const cell = (r, c) => txt(r.querySelector(c));
const type = v => { q('#top-search').value = v; q('#top-search').dispatchEvent(new window.Event('input', { bubbles: true })); };

console.log('\n[1] 상단 바에 붙어 있다');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('페이지 밖(상단 바)에 있음', q('.topbar .topbar-right') !== null);
check('본문 안이 아님', !q('#dashboard').contains(q('.topbar-right')));
check('검색창 · 주문 · 채팅', q('#top-search') && q('#btn-orders') && q('#btn-chat'));
// 문의는 결국 대화로 이어져서 벨은 채팅과 겹친다
check('알림 벨 제거', q('#btn-alerts') === null && q('#alerts-pop') === null);
check('벨 관련 코드도 정리', !html.includes('alerts-pop') && !html.includes('badge-alerts'));
check('채팅이 맨 오른쪽', (() => {
  const kids = [...q('.topbar-right').children];
  return kids.indexOf(q('#btn-chat').closest('.icon-wrap')) === kids.length - 1;
})());
const bar = ruleOf('.topbar');
check('스크롤해도 붙어 있음', /position: sticky/.test(bar) && /top: 0/.test(bar), bar);
check('본문보다 위로', /z-index: 30/.test(bar), bar);
check('바탕을 채워 내용이 비쳐 보이지 않게', /background: var\(--bg\)/.test(bar), bar);
// 모달(55)보다는 아래여야 가려진다
check('팝업은 모달 아래', /z-index: 40/.test(ruleOf('.pop')), ruleOf('.pop'));
// 상단 바 바탕이 회색이라 기본 회색 알약이면 검색창이 묻힌다
const topSearchCss = ruleOf('.topbar-right .tb-search');
check('검색창은 흰 바탕', /background: #fff/.test(topSearchCss), topSearchCss);
check('테두리로 경계 표시', /border-color: var\(--border\)/.test(topSearchCss), topSearchCss);
check('호버해도 회색으로 안 바뀜',
  /background: #fff/.test(ruleOf('.topbar-right .tb-search:hover')),
  ruleOf('.topbar-right .tb-search:hover'));
check('목록 도구줄 검색창은 그대로',
  /background: #f5f6f8/.test(ruleOf('.tb')), ruleOf('.tb'));

console.log('\n[2] 배지가 실제 자료를 센다');
// 진행 중(대기 4 + 조리 3) = 7, 아직 아무것도 안 봤으니 전부 안 읽음
check('주문 배지 7', txt(oBadge()) === '7', txt(oBadge()));
// 알림은 재고를 빼고 사람이 남긴 문의만 센다 (점검 4건)
check('채팅 배지 4', txt(cBadge()) === '4', txt(cBadge()));
check('0 이면 숨기는 규칙', /\.ic-badge\.zero \{ display: none; \}/.test(html));
check('채팅 배지는 빨강', /#badge-chat \{ background: var\(--danger\); \}/.test(html));

console.log('\n[3] 주문 패널');
click(q('#btn-orders'));
check('열림', oPop().classList.contains('open'));
check('버튼 눌림 표시', q('#btn-orders').classList.contains('on'));
check('aria-expanded', q('#btn-orders').getAttribute('aria-expanded') === 'true');
// 건수는 배지에 있으니 머리에는 다시 적지 않는다
check('머리에 건수 안 적음', !/\d+건/.test(txt(oPop().querySelector('.pop-head'))),
  txt(oPop().querySelector('.pop-head')));
check('대신 모두 읽음 버튼', oPop().querySelector('[data-read-all]') !== null);
check('버튼은 늘 같은 자리', /data-read-all/.test(html));
check('항목 7개', rows().length === 7, rows().length + '개');
// 줄글이 아니라 칸을 맞춘 네 칸이어야 한다
const rowCss = ruleOf('.pop-row');
check('격자로 칸 고정', /display: grid/.test(rowCss) &&
  /grid-template-columns: 54px minmax\(0, 1fr\) 42px 52px/.test(rowCss), rowCss);
const r0 = rows()[0];
check('좌석은 칩', cell(r0, '.pr-seat') === 'A-12', cell(r0, '.pr-seat'));
check('칩 모양', /border-radius: 999px/.test(ruleOf('.pr-seat')) &&
  /background: var\(--accent-soft\)/.test(ruleOf('.pr-seat')), ruleOf('.pr-seat'));
check('메뉴는 제 칸에서 말줄임', cell(r0, '.pr-menu') === '라면 + 공기밥',
  cell(r0, '.pr-menu'));
check('넘치면 말줄임', /text-overflow: ellipsis/.test(ruleOf('.pr-menu')), ruleOf('.pr-menu'));
check('상태는 태그로 한 칸', cell(r0, '.tag') === '대기', cell(r0, '.tag'));
check('경과 시간도 한 칸', /^(방금|\d+분 전)$/.test(cell(r0, '.pr-ago')), cell(r0, '.pr-ago'));
check('숫자 폭 고정', /tabular-nums/.test(ruleOf('.pr-ago')), ruleOf('.pr-ago'));
check('오른쪽 맞춤', /text-align: right/.test(ruleOf('.pr-ago')), ruleOf('.pr-ago'));
// 주문번호는 여기서 할 일이 없어 뺐다
check('#1041 같은 번호 없음', !rows().some(r => /#\d+/.test(txt(r))),
  rows().map(txt).join(' | '));
check('모든 줄이 네 칸을 다 채움', rows().every(r =>
  r.querySelector('.pr-seat') && r.querySelector('.pr-menu') &&
  r.querySelector('.tag') && r.querySelector('.pr-ago')));
check('대기 · 조리가 섞여 있음',
  new Set(rows().map(r => cell(r, '.tag'))).size === 2,
  rows().map(r => cell(r, '.tag')).join(','));
check('조리는 초록 태그', rows().some(r => r.querySelector('.tag').classList.contains('tag-cook')));
check('칸을 담을 만큼 넓어짐', /#orders-pop \{ width: 392px; \}/.test(html));
check('주문 관리 열기 버튼', oPop().querySelector('.pop-go') !== null);

console.log('\n[3-2] 눌러서 확인하면 배지가 하나씩 줄어든다');
click(rows()[0]);
check('주문 배지 6', txt(oBadge()) === '6', txt(oBadge()));
check('주문 관리로 이동', q('#page-orders').style.display === 'block');
click(q('#btn-orders'));
check('목록 건수는 그대로', rows().length === 7, rows().length + '개');
check('본 줄은 흐리게', rows()[0].classList.contains('read'));
check('나머지는 그대로', rows().slice(1).every(r => !r.classList.contains('read')));
check('아직 안 읽은 게 있으면 버튼 켜짐', oPop().querySelector('[data-read-all]').disabled === false);
click(rows()[0]);
check('같은 줄을 또 눌러도 안 줄어듦', txt(oBadge()) === '6', txt(oBadge()));
click(q('#btn-orders'));
click(rows()[1]);
check('다른 줄을 누르면 5', txt(oBadge()) === '5', txt(oBadge()));

console.log('\n[4] 한 번에 하나만');
const pageBefore = txt(q('#page-title'));
click(q('#btn-chat'));
check('채팅 열림', q('#chat').classList.contains('open'));
check('주문 패널은 닫힘', !oPop().classList.contains('open'));
check('주문 버튼 표시도 해제', !q('#btn-orders').classList.contains('on'));
check('보던 화면 그대로', txt(q('#page-title')) === pageBefore,
  pageBefore + ' -> ' + txt(q('#page-title')));
// 문의가 걸린 대화는 목록에서 바로 알아보게 표시한다
check('문의 표시가 붙음', qa('#chat-list .chat-row .mini').length > 0,
  String(qa('#chat-list .chat-row .mini').length));
check('문의 표시 글자', txt(qa('#chat-list .chat-row .mini')[0]) === '문의',
  txt(qa('#chat-list .chat-row .mini')[0]));
click(q('#chat-close'));

console.log('\n[5] 주문 패널로 이동');
click(q('#btn-orders'));
check('주문 열면 채팅은 닫힘', !q('#chat').classList.contains('open'));
check('줄을 눌러도 이동', rows().length > 0);
click(oPop().querySelector('.pop-go'));
check('주문 관리로 이동', q('#page-orders').style.display === 'block');
check('메뉴 선택도 따라옴', sub('주문 관리').classList.contains('active'));
check('바닥 버튼은 읽음으로 치지 않음', txt(oBadge()) === '5', txt(oBadge()));

console.log('\n[6] 바깥을 누르거나 Esc 로 닫힘');
click(q('#btn-orders'));
check('열림', oPop().classList.contains('open'));
click(doc.body);
check('바깥 클릭으로 닫힘', !oPop().classList.contains('open'));
click(q('#btn-orders'));
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('Esc 로 닫힘', !oPop().classList.contains('open'));

console.log('\n[7] 검색');
type('A-12');
check('결과 열림', sPop().classList.contains('open'));
check('좌석 묶음', txt(sPop().querySelector('.pop-cat')) === '좌석',
  txt(sPop().querySelector('.pop-cat')));
check('A-12 나옴', items(sPop()).some(i => txt(i).startsWith('A-12')),
  items(sPop()).map(txt).join(' | '));
click(items(sPop())[0]);
check('좌석 관리로 이동', q('#page-seats').style.display === 'block');
check('좌석 상세 열림', q('#seat-modal').classList.contains('open'));
check('검색창 비워짐', q('#top-search').value === '');
click(q('#sd-close'));

type('라면');
check('메뉴가 잡힘', items(sPop()).some(i => txt(i).startsWith('라면')),
  items(sPop()).map(txt).join(' | '));
check('메뉴 묶음 머리글', [...sPop().querySelectorAll('.pop-cat')].some(c => txt(c) === '메뉴'));
click(items(sPop()).find(i => txt(i).startsWith('라면')));
check('상품 관리로 이동', q('#page-store').style.display === 'block');
check('상품 검색어도 채움', q('#store-search').value === '라면', q('#store-search').value);

type('010-');
check('전화번호로 회원 찾기',
  [...sPop().querySelectorAll('.pop-cat')].some(c => txt(c) === '회원'),
  [...sPop().querySelectorAll('.pop-cat')].map(txt).join(','));
const mem = items(sPop()).find(i => /010-/.test(txt(i)));
click(mem);
check('회원 관리로 이동', q('#page-members').style.display === 'block');
check('회원 검색어도 채움', q('#member-search').value.length > 0, q('#member-search').value);

type('ㅁㄴㅇㄹ없는것');
check('없으면 안내', txt(sPop()).includes('결과가 없습니다'), txt(sPop()));
type('');
check('비우면 닫힘', !sPop().classList.contains('open'));

console.log('\n[8] 자료가 바뀌면 배지도 바뀐다');
click(nav('매점 관리'));
click(sub('상품 관리'));
// 앞 단계에서 검색어를 채워 뒀으니 지우고 시작한다
q('#store-search').value = '';
q('#store-search').dispatchEvent(new window.Event('input', { bubbles: true }));
click(qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '아이스크림'));
click(q('#btn-place'));
// 새로 들어온 주문은 안 읽음이라 배지가 하나 늘어난다 (앞에서 2건을 확인해 둔 상태)
check('새 주문이 오면 +1', txt(oBadge()) === '6', txt(oBadge()));

click(sub('주문 관리'));
const card = qa('#order-list .ord')[0];
click(card.querySelector('[data-next]'));
click(qa('#order-list .ord')[0].querySelector('[data-next]'));
check('완료하면 다시 -1', txt(oBadge()) === '5', txt(oBadge()));

// 재고는 배지와 무관하다 (재고 관리에서 본다)
const chatBefore = num(txt(cBadge()));
click(sub('재고 관리'));
const row = qa('#stock-list .stock-row')
  .find(r => txt(r.querySelector('.stock-name')) === '에너지드링크');
click(row);
click(q('#stock-detail [data-restock]'));
q('[data-key="add"]').value = '40';
submit(q('#form-modal-form'));
check('재고를 채워도 배지는 그대로', num(txt(cBadge())) === chatBefore,
  chatBefore + ' -> ' + num(txt(cBadge())));

console.log('\n[9] 어느 화면에서나 보인다');
['대시보드', '좌석 관리', '요금 관리', '회원 관리'].forEach(function (t) {
  click(nav(t));
  check(t + ' 에서도 상단 바', q('.topbar-right') !== null && q('#badge-orders') !== null);
});
check('이동해도 배지 값 유지', txt(oBadge()) === '5', txt(oBadge()));

console.log('\n[10] 점검 목록은 대화로 이어진다');
click(nav('대시보드'));
const fixRows = qa('#fix-list .row');
check('점검 4건', fixRows.length === 4, fixRows.length + '건');
check('건수 표기', txt(q('#fix-note')) === '4건', txt(q('#fix-note')));
click(fixRows[0]);
check('그 좌석 대화가 열림',
  q('#chat').classList.contains('open') && txt(q('#chat-seat')) === fixRows[0].dataset.fix,
  txt(q('#chat-seat')));
click(q('#chat-close'));

console.log('\n[11] 모두 읽음 처리');
click(q('#btn-orders'));
const readAll = () => oPop().querySelector('[data-read-all]');
const liveN = rows().length;
check('안 읽은 게 남아 있음', num(txt(oBadge())) > 0, txt(oBadge()));
check('버튼 있음', readAll() !== null);
check('안 읽은 게 있으면 켜짐', readAll().disabled === false);
click(readAll());
check('배지 0', txt(oBadge()) === '0', txt(oBadge()));
check('배지 숨김', oBadge().classList.contains('zero'));
// 다시 그리느라 눌린 버튼이 떨어져 나가도 패널이 닫히면 안 된다
check('패널은 열린 채', oPop().classList.contains('open'));
check('줄 수는 그대로', rows().length === liveN, rows().length + ' / ' + liveN);
check('전부 흐리게', rows().every(r => r.classList.contains('read')));
// 버튼이 사라지면 자리가 움직여서, 자리는 지키고 꺼 두기만 한다
check('버튼은 그대로 있음', readAll() !== null);
check('다 읽었으면 꺼짐', readAll().disabled === true);
click(readAll());
check('꺼진 버튼을 눌러도 아무 일 없음',
  txt(oBadge()) === '0' && oPop().classList.contains('open'));
check('알림 문구', q('#toast-wrap').textContent.includes('모두 읽음 처리'),
  q('#toast-wrap').textContent);
click(doc.body);
check('바깥을 누르면 그때는 닫힘', !oPop().classList.contains('open'));

// 새 주문이 들어오면 다시 안 읽음이 생긴다
click(nav('매점 관리'));
click(sub('상품 관리'));
q('#store-search').value = '';
q('#store-search').dispatchEvent(new window.Event('input', { bubbles: true }));
click(qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '콜라'));
click(q('#btn-place'));
check('새 주문은 다시 안 읽음', txt(oBadge()) === '1', txt(oBadge()));
click(q('#btn-orders'));
check('버튼이 다시 켜짐', readAll() !== null && readAll().disabled === false);
click(doc.body);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
