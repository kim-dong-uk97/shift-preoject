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
function setField(k, v) {
  const el = q('[data-key="' + k + '"]');
  if (el.type === 'checkbox') el.checked = v; else el.value = String(v);
}
const formOpen = () => q('#form-modal').classList.contains('open');
const cardText = el => el.textContent.replace(/\s+/g, ' ').trim();
const cards = sel => qa(sel + ' .prod');

click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));

console.log('\n[1] 표 -> 키오스크 카드 전환');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('요금 영역에서 표 제거', qa('#page-fees .tbl').length === 0);
check('좌석 종류 카드 2개', cards('#rate-grid').length === 2);
check('충전 상품 카드 5개', cards('#pass-grid').length === 5);
check('상품 추가 카드 존재', q('#pass-grid .prod-add') !== null);

console.log('\n[2] 카드 내용 = 고객이 보는 정보');
const pass3 = cards('#pass-grid').find(c => cardText(c).includes('3시간권'));
check('상품명', cardText(pass3).includes('3시간권'));
check('회원가가 대표 가격', q('.prod-price', pass3) === null || pass3.querySelector('.prod-price').textContent.includes('3,300원'),
  pass3.querySelector('.prod-price').textContent);
check('비회원가 병기', cardText(pass3).includes('비회원 3,900원'));
check('이용 시간 표기', cardText(pass3).includes('3시간'));
check('시간당 단가 표기', cardText(pass3).includes('1,100원'));

const rateOpen = cards('#rate-grid')[0];
check('좌석 종류 시간당 단가', rateOpen.querySelector('.prod-price').textContent.includes('1,200원'));
check('좌석 종류 / 시간 단위', rateOpen.querySelector('.prod-price').textContent.includes('/ 시간'));

console.log('\n[3] 카드마다 수정 / 삭제');
check('모든 상품 카드에 수정 버튼', cards('#pass-grid').every(c => c.querySelector('[data-edit]')));
check('모든 상품 카드에 삭제 버튼', cards('#pass-grid').every(c => c.querySelector('[data-del]')));
check('좌석 종류 삭제는 비활성', cards('#rate-grid').every(c => c.querySelector('[data-del]').disabled));
check('비활성 사유 툴팁', cards('#rate-grid')[0].querySelector('[data-del]').title.includes('삭제할 수 없습니다'));
check('판매 중지 상품은 흐리게', cards('#pass-grid').some(c => c.classList.contains('off')));
check('판매 중지 뱃지', cards('#pass-grid').some(c => cardText(c).includes('판매 중지')));

console.log('\n[4] 카드에서 수정');
click(cards('#pass-grid')[0].querySelector('[data-edit]'));
check('PIN 잠금 동작', q('#pin-modal').classList.contains('open'));
unlock();
check('수정 폼 오픈', formOpen() && q('#form-title').textContent === '정액권 수정');
check('기존 값 로드', q('[data-key="name"]').value === '1시간권', q('[data-key="name"]').value);
setField('member', 1400);
setField('guest', 1700);
submit(q('#form-modal-form'));
check('카드에 즉시 반영', cards('#pass-grid')[0].querySelector('.prod-price').textContent.includes('1,400원'));
check('비회원가 반영', cardText(cards('#pass-grid')[0]).includes('비회원 1,700원'));
check('시간당 재계산', cardText(cards('#pass-grid')[0]).includes('1,400원'));

console.log('\n[5] 좌석 종류 수정');
click(cards('#rate-grid')[0].querySelector('[data-edit]'));
check('시간 요금 폼', formOpen() && q('#form-title').textContent === '시간 요금 수정');
setField('open_member', 1300);
setField('open_guest', 1600);
submit(q('#form-modal-form'));
check('좌석 카드 반영', cards('#rate-grid')[0].querySelector('.prod-price').textContent.includes('1,300원'));
check('회원 할인 재계산(300원)', cardText(cards('#rate-grid')[0]).includes('300원'));
check('심야가 연동', q('#night-sum').textContent.includes('1,040원'), q('#night-sum').textContent.replace(/\s+/g, ' '));

console.log('\n[6] 삭제');
const before = cards('#pass-grid').length;
confirmAnswer = false;
click(cards('#pass-grid')[0].querySelector('[data-del]'));
check('취소하면 유지', cards('#pass-grid').length === before);
confirmAnswer = true;
const delName = cards('#pass-grid')[0].querySelector('.prod-name').textContent;
click(cards('#pass-grid')[0].querySelector('[data-del]'));
check('확인 문구에 판매분 안내', lastConfirm.includes('이미 판매된 정액권'), lastConfirm.replace(/\n/g, ' / '));
check('카드 삭제됨', cards('#pass-grid').length === before - 1);
check('해당 상품 사라짐', !cards('#pass-grid').some(c => c.querySelector('.prod-name').textContent === delName));
check('삭제 토스트', toastText().includes('삭제했습니다'));

console.log('\n[7] 상품 추가 카드');
const n2 = cards('#pass-grid').length;
click(q('#pass-grid .prod-add'));
check('추가 폼 오픈', formOpen() && q('#form-title').textContent === '정액권 추가');
setField('name', '7시간권');
setField('hours', 7);
setField('member', 7000);
setField('guest', 8400);
setField('on', true);
submit(q('#form-modal-form'));
check('카드 추가됨', cards('#pass-grid').length === n2 + 1);
check('새 카드 내용', cards('#pass-grid').some(c => cardText(c).includes('7시간권') && cardText(c).includes('7,000원')));
check('추가 카드는 항상 맨 뒤', q('#pass-grid').lastElementChild.classList.contains('prod-add'));

console.log('\n[8] 이벤트 카드');
click(q('.tab[data-tab="event"]'));
check('이벤트 카드 5개', cards('#event-grid').length === 5);
check('이벤트 등록 카드', q('#event-grid .prod-add') !== null);
const first = cards('#event-grid')[0];
check('진행 중이 맨 앞', cardText(first).includes('진행 중'), cardText(first));
check('혜택이 대표 값', first.querySelector('.prod-price').textContent.includes('할인') || first.querySelector('.prod-price').textContent.includes('추가'),
  first.querySelector('.prod-price').textContent);
check('대상·기간 표기', cardText(first).includes('~'));
check('진행 중 아닌 카드는 흐리게', cards('#event-grid').some(c => c.classList.contains('off')));

const evBefore = cards('#event-grid').length;
confirmAnswer = false;
click(first.querySelector('[data-del]'));
check('진행 중 이벤트 삭제 경고', lastConfirm.includes('지금 진행 중입니다'), lastConfirm.replace(/\n/g, ' / '));
check('취소 시 유지', cards('#event-grid').length === evBefore);
confirmAnswer = true;
click(cards('#event-grid')[0].querySelector('[data-del]'));
check('이벤트 삭제됨', cards('#event-grid').length === evBefore - 1);

click(q('#event-grid .prod-add'));
check('이벤트 등록 폼', formOpen() && q('#form-title').textContent === '이벤트 등록');
setField('name', '테스트 이벤트');
setField('from', '2026-11-01');
setField('to', '2026-11-30');
setField('value', 15);
submit(q('#form-modal-form'));
check('이벤트 추가됨', cards('#event-grid').length === evBefore);
check('예정 상태로 표시', cards('#event-grid').some(c => cardText(c).includes('테스트 이벤트') && cardText(c).includes('예정')));

console.log('\n[9] 검증 규칙 유지 + 회귀');
click(q('#event-grid .prod-add'));
setField('name', '값 검증');
setField('from', '2026-12-10');
setField('to', '2026-12-01');
submit(q('#form-modal-form'));
check('종료일 역전 차단', q('#form-error').classList.contains('show'), q('#form-error').textContent);
click(q('#form-cancel'));

click(q('.tab[data-tab="base"]'));
click(q('#btn-night-edit'));
check('심야 할인 수정 유지', formOpen() && q('#form-title').textContent === '심야 할인 수정');
click(q('#form-cancel'));

click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));
check('좌석 관리 정상', q('#page-seats #seat-panel') !== null);
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', q('#seat-slot #seat-panel') !== null);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
