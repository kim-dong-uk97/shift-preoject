// 도구줄 세 컨트롤이 같은 껍데기(.tb)로 그려지는지 확인한다.
// jsdom 은 레이아웃을 계산하지 않으므로 구조와 CSS 선언으로 검사한다.
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

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
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

click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));

console.log('\n[1] 세 가지가 같은 껍데기를 쓴다');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const items = [...q('#page-members .toolbar').children];
check('구성 3개', items.length === 3, items.length + '개');
check('셋 다 .tb 클래스', items.every(el => el.classList.contains('tb')),
  items.map(el => el.className).join(' / '));
check('검색 / 상태 / 필터 순',
  items[0].classList.contains('tb-search') &&
  items[1].classList.contains('tb-select') &&
  items[2].classList.contains('tb-btn'));

console.log('\n[2] 껍데기가 모양과 높이를 전담');
const tb = ruleOf('.tb');
check('.tb 규칙 존재', tb !== null);
check('높이 38px', tb && tb.includes('height: 38px'), tb);
check('세로 가운데', tb && tb.includes('align-items: center'), tb);
check('알약 모양', tb && tb.includes('border-radius: 999px'), tb);
check('같은 배경', tb && tb.includes('background: #f5f6f8'), tb);
check('같은 테두리', tb && tb.includes('border: 1px solid transparent'), tb);
check('같은 글자', tb && tb.includes('font-size: 13px') && tb.includes('font-weight: 600'), tb);
check('상자 계산 고정', tb && tb.includes('box-sizing: border-box'), tb);

console.log('\n[3] 안쪽 컨트롤은 자기 모양을 버린다');
const inner = ruleOf('.tb input');
check('input·select 공용 규칙', inner !== null);
check('껍데기를 꽉 채움', inner && inner.includes('height: 100%'), inner);
check('자체 여백 없음', inner && inner.includes('padding: 0') && inner.includes('margin: 0'), inner);
check('자체 테두리 없음', inner && inner.includes('border: 0'), inner);
check('자체 배경 없음', inner && inner.includes('background: none'), inner);
check('글자 물려받음', inner && inner.includes('font-size: inherit'), inner);

console.log('\n[4] 높이를 흔들던 옛 규칙이 사라졌는지');
check('.search-pill 제거', !html.includes('search-pill'));
check('input 개별 padding 없음', !/\.tb input[^{]*\{[^}]*padding: \d+px \d+px/.test(html));
check('select 개별 height 없음', !/\.tb-select select \{[^}]*height:/.test(html));
check('button 개별 height 없음', !/\.tb-btn \{[^}]*height:/.test(html));
// 도구줄 안에서 높이를 한 곳에서만 정해야 다시 어긋나지 않는다
const tbCss = html.slice(
  html.indexOf('/* ---------- 목록 상단 도구줄 ---------- */'),
  html.indexOf('/* 회원 상태 */')
);
check('도구줄 안 height 지정은 .tb 한 곳뿐',
  (tbCss.match(/height: 38px/g) || []).length === 1,
  String((tbCss.match(/height: 38px/g) || []).length) + '곳');
check('안쪽 컨트롤은 100% 로만', (tbCss.match(/height: 100%/g) || []).length === 1);

console.log('\n[5] 각자 필요한 차이만');
check('검색만 폭을 가짐', /\.tb-search \{[^}]*flex: 0 1 300px/.test(html));
check('상태는 화살표 자리 확보', /\.tb-select \{[^}]*padding-right: 32px/.test(html));
check('안내 문구 흐리게', /\.tb-search input::placeholder \{[^}]*var\(--text-sub\)/.test(html));
check('필터 켜짐 표시', /\.tb-btn\.on \{[^}]*var\(--point-soft\)/.test(html));
check('호버는 흰색 아님', (ruleOf('.tb:hover') || '').includes('#ebedf0'), ruleOf('.tb:hover'));
check('입력 중에만 흰 바탕', /\.tb-search:focus-within \{[^}]*background: #fff/.test(html));

console.log('\n[6] 마크업 구조');
check('검색은 label 이라 어디를 눌러도 입력됨', items[0].tagName === 'LABEL');
check('검색 아이콘은 형제 요소', items[0].querySelector(':scope > svg') !== null);
check('상태 화살표도 형제 요소', items[1].querySelector(':scope > svg') !== null);
check('버튼 안에 아이콘 + 글자',
  items[2].querySelector('svg') !== null && q('#member-filter-label') !== null);
check('id 그대로', q('#member-search') && q('#member-status') && q('#btn-member-filter'));

console.log('\n[7] 동작 회귀');
q('#member-search').value = '김';
fire(q('#member-search'), 'input');
check('검색 동작', qa('#member-body tr[data-member]').every(r => txt(r.children[0]).startsWith('김')));
q('#member-search').value = '';
fire(q('#member-search'), 'input');
q('#member-status').value = 'rest';
fire(q('#member-status'), 'change');
check('상태 필터 동작', qa('#member-body tr[data-member]').every(r => txt(r.querySelector('.st')) === '휴면'));
q('#member-status').value = 'all';
fire(q('#member-status'), 'change');
click(q('#btn-member-filter'));
check('필터 창 열림', q('#form-modal').classList.contains('open'));
q('[data-key="age"]').value = '20';
q('#form-modal-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
check('필터 적용', q('#btn-member-filter').classList.contains('on'));
check('켜짐 표기', txt(q('#member-filter-label')) === '회원 필터링 1', txt(q('#member-filter-label')));
click(q('#btn-member-filter'));
q('[data-key="age"]').value = 'all';
q('#form-modal-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
check('목록 복귀', qa('#member-body tr[data-member]').length === 30);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
