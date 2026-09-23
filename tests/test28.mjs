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

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const submit = el => el.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();
const toastText = () => q('#toast-wrap').textContent;

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const sub = t => qa('.sub-item').find(b => b.dataset.title === t);
// 오늘 표 : 직원 / 직책 / 출근 / 퇴근 / 근무 / 상태 / 작업
const rows = () => qa('#attend-body tr');
const rowOf = n => rows().find(r => txt(r.children[0]) === n);
const cells = r => [...r.children].map(txt);
const stateOf = n => txt(rowOf(n).querySelector('.st'));
const monthRows = () => qa('#month-body tr');
const monthOf = n => monthRows().find(r => txt(r.children[0]) === n);
const won2num = t => Number(t.replace(/[^\d]/g, ''));

click(nav('직원관리'));
click(sub('근태 관리'));

console.log('\n[1] 메뉴 · 페이지');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('근태 페이지 표시', q('#page-attend').style.display === 'block');
check('제목', q('#page-title').textContent === '근태 관리');
check('부제', q('#page-desc').textContent === '출퇴근 기록 · 이번 달 집계');
check('권한 설정은 아직 준비 중', (() => {
  click(sub('권한 설정'));
  const r = q('#page-body').style.display === 'flex';
  click(sub('근태 관리'));
  return r;
})());

console.log('\n[2] 오늘 근태 요약');
check('날짜 · 기준 시각', /\d+월 \d+일 \([일월화수목금토]\) · \d{2}:\d{2} 기준/.test(txt(q('#attend-date'))),
  txt(q('#attend-date')));
const stats = () => qa('#attend-sum .stat');
const statOf = k => stats().find(c => c.dataset.stat === k);
const statNum = k => Number(txt(statOf(k).querySelector('.stat-value')).replace(/[^\d]/g, ''));
check('요약 카드 5개', stats().length === 5, stats().length + '개');
check('근무 중 / 퇴근 / 미출근 / 휴무 / 지각',
  stats().map(c => txt(c.querySelector('.stat-label'))).join(',') === '근무 중,퇴근,미출근,휴무,지각',
  stats().map(c => txt(c.querySelector('.stat-label'))).join(','));
check('카드마다 아이콘', stats().every(c => c.querySelector('.stat-ico svg')));
// 색과 배경은 CSS 한 곳에서 정한다 (인라인 색이 남아 있으면 제각각이 된다)
check('아이콘 상자에 인라인 색 없음',
  stats().every(c => !c.querySelector('.stat-ico').getAttribute('style')),
  stats().map(c => c.querySelector('.stat-ico').getAttribute('style')).join(' / '));
check('흰 바탕 + 파란 아이콘', (() => {
  const r = html.match(/\n\s*\.stat-ico \{([^}]*)\}/);
  return r && /background: #fff/.test(r[1]) && /color: var\(--point\)/.test(r[1]);
})());
check('아이콘 모양은 5종 모두 다름',
  new Set(stats().map(c => c.querySelector('.stat-ico svg').innerHTML)).size === 5);
check('숫자와 단위 분리', stats().every(c => c.querySelector('.stat-value .unit')));
check('미출근은 눈에 띄게', statOf('none').classList.contains('alert'));
check('0 인 항목은 힘 빼기',
  stats().filter(c => Number(txt(c.querySelector('.stat-value')).replace(/[^\d]/g, '')) === 0)
    .every(c => c.classList.contains('zero')));
check('전체 인원', txt(q('#attend-note')) === '전체 8명', txt(q('#attend-note')));

console.log('\n[3] 오늘 표 (급여 정보 없음)');
const headTexts = [...q('#attend-body').closest('table').querySelectorAll('thead th')].map(txt);
check('열 = 직원/직책/출근/퇴근/근무/상태',
  headTexts.slice(0, 6).join(',') === '직원,직책,출근,퇴근,근무,상태', headTexts.join(','));
check('시급 열 없음', !headTexts.includes('시급'));
check('직원 8명', rows().length === 8, rows().length + '명');
const peter = cells(rowOf('피터펜'));
check('직책', peter[1] === '점장', peter[1]);
check('출근 시각', /^\d{2}:\d{2}$/.test(peter[2]), peter[2]);
check('근무 시간', /시간 .*분/.test(peter[4]), peter[4]);
check('행에 금액 없음', !/원/.test(cells(rowOf('피터펜')).join(' ')));

console.log('\n[4] 상태 판정');
check('출근 후 퇴근 전 = 근무 중', stateOf('피터펜') === '근무 중', stateOf('피터펜'));
check('둘 다 찍힘 = 퇴근', stateOf('존 다알링') === '퇴근', stateOf('존 다알링'));
check('출근 안 함 = 미출근', stateOf('스미') === '미출근', stateOf('스미'));
check('휴무', stateOf('후크') === '휴무', stateOf('후크'));
check('예정보다 늦으면 지각 근무', stateOf('팅커벨') === '지각 근무', stateOf('팅커벨'));
check('미출근은 시간 칸이 빔', cells(rowOf('스미'))[2] === '—' && cells(rowOf('스미'))[4] === '—');
check('빈 칸 흐리게', rowOf('스미').children[2].classList.contains('dash'));

console.log('\n[5] 이번 달 집계는 점장 전용');
const zone = q('#page-attend .secure-zone');
check('집계가 잠금 영역 안', zone !== null && zone.querySelector('#month-body') !== null);
check('점장 전용 표시', txt(zone.querySelector('.chip')) === '점장 전용');
check('잠금 오버레이 있음', zone.querySelector('.secure-overlay') !== null);
check('해제 버튼 있음', zone.querySelector('.btn-unlock') !== null);
check('지금 잠그기 버튼', zone.querySelector('.btn-lock-toggle') !== null);
check('들어왔을 때 잠겨 있음', doc.body.classList.contains('locked'));

click(zone.querySelector('.btn-unlock'));
check('PIN 창 열림', q('#pin-modal').classList.contains('open'));
check('안내 문구 정상(이벤트 객체 아님)',
  !/object|Event/i.test(txt(q('#pin-desc'))), txt(q('#pin-desc')));
unlock();
check('해제됨', !doc.body.classList.contains('locked'));
check('카운트다운 표시', /\d:\d{2} 후 자동 잠금/.test(txt(zone.querySelector('.lock-msg'))),
  txt(zone.querySelector('.lock-msg')));

console.log('\n[6] 작업 버튼 · 출퇴근');
check('미출근에는 출근 버튼', rowOf('스미').querySelector('[data-in]') !== null);
check('근무 중에는 퇴근 버튼', rowOf('피터펜').querySelector('[data-out]') !== null);
check('퇴근 완료엔 버튼 없음', txt(rowOf('존 다알링').children[6]) === '');
check('휴무엔 버튼 없음', txt(rowOf('후크').children[6]) === '');

click(rowOf('스미').querySelector('[data-in]'));
check('출근 시각 기록', /^\d{2}:\d{2}$/.test(cells(rowOf('스미'))[2]), cells(rowOf('스미'))[2]);
check('상태 전환', ['근무 중', '지각 근무'].includes(stateOf('스미')), stateOf('스미'));
check('출근 토스트', toastText().includes('스미 출근'), toastText());
check('미출근 0명으로 갱신', statNum('none') === 0, String(statNum('none')));
check('0 이 되면 강조 해제', !statOf('none').classList.contains('alert'));
check('0 이면 힘 빠짐', statOf('none').classList.contains('zero'));

confirmAnswer = false;
click(rowOf('마이클').querySelector('[data-out]'));
check('취소하면 그대로', stateOf('마이클') === '근무 중' && cells(rowOf('마이클'))[3] === '—');
confirmAnswer = true;
click(rowOf('마이클').querySelector('[data-out]'));
check('확인 문구', lastConfirm.includes('마이클 님을 퇴근 처리'), lastConfirm);
check('퇴근 시각 기록', /^\d{2}:\d{2}$/.test(cells(rowOf('마이클'))[3]), cells(rowOf('마이클'))[3]);
check('상태 퇴근', stateOf('마이클') === '퇴근');
check('퇴근 토스트에 근무 시간', /마이클 퇴근 \d{2}:\d{2} · 근무 .*시간/.test(toastText()), toastText());

console.log('\n[7] 집계 내용');
const mHeads = [...q('#month-body').closest('table').querySelectorAll('thead th')].map(txt);
check('열 = 직원/근무일/근무 시간/시급/예상 급여',
  mHeads.join(',') === '직원,근무일,근무 시간,시급,예상 급여', mHeads.join(','));
check('직원 8명', monthRows().length === 8);
const mike = cells(monthOf('마이클'));
check('근무일', /^\d+일$/.test(mike[1]), mike[1]);
check('근무 시간', /시간 .*분/.test(mike[2]), mike[2]);
check('시급은 여기에만', /^[\d,]+원$/.test(mike[3]), mike[3]);
check('예상 급여 원화', /^[\d,]+원$/.test(mike[4]), mike[4]);
const baseOnly = Math.round(4320 / 60 * 10500);
check('오늘 근무가 급여에 더해짐', won2num(mike[4]) > baseOnly, baseOnly + ' vs ' + won2num(mike[4]));
check('근무일도 하루 늘어남', mike[1] === '13일', mike[1]);
check('총 인건비 표기', /총 .*시간.*예상 인건비 [\d,]+원/.test(txt(q('#month-note'))), txt(q('#month-note')));
check('휴무자도 포함', monthOf('후크') !== undefined);

console.log('\n[8] 다시 잠그기');
click(zone.querySelector('.btn-lock-toggle'));
check('잠김', doc.body.classList.contains('locked'));
check('잠금 토스트', toastText().includes('점장 전용 정보를 잠갔습니다'), toastText());
check('오늘 표는 계속 보임', rows().length === 8);

console.log('\n[9] 회귀');
click(nav('대시보드'));
check('대시보드 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
click(nav('회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(nav('매출·정산 관리'));
unlock();
check('매출 관리도 같은 잠금으로 열림', q('#page-sales').style.display === 'block');
check('매출 잠금 UI 도 그대로', q('#page-sales .btn-unlock') !== null);
click(nav('직원관리'));
click(sub('근태 관리'));
check('기록 유지', stateOf('마이클') === '퇴근');

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
