// 채팅 : 오른쪽에 창 하나. 목록에서 좌석을 골라 말을 건다.
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
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
const toastText = () => q('#toast-wrap').textContent;

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
const chat = () => q('#chat');
const open = () => chat().classList.contains('open');
const thread = () => chat().classList.contains('thread');
const msgs = () => qa('#chat-body .msg-row');
const rows = () => qa('#chat-list .chat-row');
const rowOf = seat => rows().find(r => r.dataset.chat === seat);
const say = t => { q('#chat-input').value = t; submit(q('#chat-form')); };
const dels = () => qa('#chat-body .msg-del');
const pick = v => { q('#chat-pick').value = v; q('#chat-pick').dispatchEvent(new window.Event('input', { bubbles: true })); };

const badge = () => txt(q('#badge-chat'));
const moreBtn = () => q('#chat-list [data-chat-more]');
const CAP = 5;
// 목록이 접혀 있으면 안 보이는 대화가 있어 검색으로 집어 온다
const openBy = seat => { pick(seat); click(rows().find(r => r.dataset.chat === seat)); };

console.log('\n[1] 상단 바 채팅 버튼');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('버튼 있음', q('#btn-chat') !== null);
check('상단 바 안', q('.topbar-right').contains(q('#btn-chat')));
check('알림 벨은 없앰', q('#btn-alerts') === null);
check('채팅이 맨 오른쪽', (() => {
  const kids = [...q('.topbar-right').children];
  return kids.indexOf(q('#btn-chat').closest('.icon-wrap')) === kids.length - 1;
})());
// 상대가 마지막으로 말한 대화 = 아직 답을 안 한 것
check('안 읽음 배지 4', badge() === '4', badge());
check('배지 0 이면 숨김 규칙', /\.ic-badge\.zero \{ display: none; \}/.test(html));
check('좌석 상세엔 채팅 버튼 없음', q('#sd-chat') === null);

console.log('\n[2] 창 자리');
const css = ruleOf('.chat');
check('화면에 고정', /position: fixed/.test(css), css);
check('오른쪽 위', /top: 96px/.test(css) && /right: 32px/.test(css), css);
check('팝오버(40)보다 위 · 모달(55)보다 아래', /z-index: 45/.test(css), css);
check('처음엔 닫힘', !open());
check('페이지 밖에 있음', !q('#dashboard').contains(chat()));

console.log('\n[3] 열면 대화 목록');
click(q('#btn-chat'));
check('열림', open());
check('목록 화면', !thread());
check('버튼 눌림 표시', q('#btn-chat').classList.contains('on'));
// 목록이 길어 5개까지만 보인다
check('5개까지만 보임', rows().length === CAP, rows().length + '개');
// 건수는 배지에 있으니 머리에는 다시 적지 않는다
check('머리에 건수 안 적음', q('#chat-list-sub') === null);
check('대신 모두 읽음 버튼', q('#chat-read-all') !== null);
check('안 읽은 게 있으면 켜짐', q('#chat-read-all').disabled === false);
// 답을 기다리는 대화가 위로 와야 눈에 띈다
check('안 읽은 대화가 맨 위',
  rows().slice(0, 4).every(r => txt(r.querySelector('.n')) !== '0'),
  rows().map(r => r.dataset.chat + ':' + txt(r.querySelector('.n'))).join(' '));
check('안 읽음 0 은 배지 감춤',
  rows().filter(r => txt(r.querySelector('.n')) === '0')
    .every(r => r.querySelector('.n').classList.contains('zero')));

const r0 = rowOf('C-14');
check('좌석 칩', txt(r0.querySelector('.pr-seat')) === 'C-14', txt(r0.querySelector('.pr-seat')));
check('상대 이름 · 상태', txt(r0.querySelector('.t')).length >= 2, txt(r0.querySelector('.t')));
check('마지막 말 미리보기', txt(r0.querySelector('.p')) === '네 감사합니다',
  txt(r0.querySelector('.p')));
check('마지막 시각', /^\d{2}:\d{2}$/.test(txt(r0.querySelector('.at'))), txt(r0.querySelector('.at')));
check('내가 보낸 말은 "나 :" 로 구분',
  txt(rowOf('B-09').querySelector('.p')).startsWith('나 : '),
  txt(rowOf('B-09').querySelector('.p')));
// 이름 위 · 내용 아래, 둘 다 늘 보인다
check('이름과 내용이 위아래로',
  /flex-direction: column/.test(ruleOf('.chat-row .g')), ruleOf('.chat-row .g'));
check('내용 줄이 따로', rows().every(r => r.querySelector('.p') !== null));
check('내용이 비어 있지 않음', rows().every(r => txt(r.querySelector('.p')).length > 0),
  rows().map(r => txt(r.querySelector('.p'))).join(' | '));

// 긴 말은 15자에서 끊는다 (칸 폭에 기대면 줄마다 끊기는 자리가 달라진다)
check('15자 넘으면 ... 으로 끊음',
  rows().every(r => {
    const t = txt(r.querySelector('.p')).replace(/^나 : /, '');
    return t.endsWith('...') ? t.length <= 18 : t.length <= 15;
  }),
  rows().map(r => txt(r.querySelector('.p'))).join(' | '));
check('긴 말은 실제로 잘림',
  txt(rowOf('E-02').querySelector('.p')) === 'E-02 키보드 일부 키가...',
  txt(rowOf('E-02').querySelector('.p')));
// 끊긴 자리가 공백이면 " ..." 처럼 떠 보인다
check('끝 공백은 지우고 붙임',
  !rows().some(r => / \.\.\.$/.test(txt(r.querySelector('.p')))),
  rows().map(r => txt(r.querySelector('.p'))).join(' | '));
check('짧은 말은 그대로', txt(rowOf('C-14').querySelector('.p')) === '네 감사합니다',
  txt(rowOf('C-14').querySelector('.p')));

const cReadAll = () => q('#chat-read-all');

console.log('\n[3-2] 더보기 · 스크롤');
check('더보기 버튼', moreBtn() !== null);
check('남은 개수 표기', txt(moreBtn()) === '더보기 7개', txt(moreBtn()));
click(moreBtn());
check('전부 펼쳐짐', rows().length === 12, rows().length + '개');
check('버튼이 접기로', txt(moreBtn()) === '접기', txt(moreBtn()));
// 10개가 넘으면 창이 통째로 길어지지 않고 목록만 스크롤된다
const listCss = ruleOf('.chat-list');
check('목록에 높이 한계', /max-height: 520px/.test(listCss), listCss);
check('넘치면 목록만 스크롤', /overflow-y: auto/.test(listCss), listCss);
check('창 자체는 화면 안', /max-height: calc\(100vh - 140px\)/.test(ruleOf('.chat')));
click(moreBtn());
check('다시 5개', rows().length === CAP, rows().length + '개');
check('버튼도 원래대로', txt(moreBtn()) === '더보기 7개', txt(moreBtn()));

console.log('\n[4] 목록에서 골라 대화');
click(rowOf('C-14'));
check('대화 화면으로', thread());
check('좌석', txt(q('#chat-seat')) === 'C-14', txt(q('#chat-seat')));
check('문의는 부제로', txt(q('#chat-sub')).includes('문의 · 모니터 깜빡임'), txt(q('#chat-sub')));
check('말풍선 3개', msgs().length === 3, msgs().length + '개');
check('상대는 왼쪽', msgs()[0].classList.contains('you'));
check('카운터는 오른쪽', msgs()[1].classList.contains('me'));
check('열어 보면 안 읽음 해제', badge() === '3', badge());

console.log('\n[5] 답장');
say('   ');
check('빈 답장은 안 보냄', msgs().length === 3, msgs().length + '개');
say('모니터 교체해 두었습니다. 확인 부탁드려요.');
check('말풍선 4개', msgs().length === 4, msgs().length + '개');
check('내가 보낸 쪽', msgs()[3].classList.contains('me'));
check('보낸 시각', /^\d{2}:\d{2}$/.test(txt(msgs()[3].querySelector('.msg-at'))),
  txt(msgs()[3].querySelector('.msg-at')));
check('입력창 비움', q('#chat-input').value === '');
check('알림', toastText().includes('C-14 에 메시지'), toastText());

console.log('\n[5-2] 보낸 메시지 삭제');
// 지우는 건 내가 보낸 말만 — 상대 말은 기록으로 남겨야 한다
check('내 말에만 지우기 버튼',
  dels().length === msgs().filter(m => m.classList.contains('me')).length,
  dels().length + ' / ' + msgs().filter(m => m.classList.contains('me')).length);
check('상대 말엔 버튼 없음',
  msgs().filter(m => m.classList.contains('you')).every(m => m.querySelector('.msg-del') === null));
// 평소엔 숨어 있다가 그 말풍선에 잠깐 머물면 뜬다
const delCss = ruleOf('.msg-del');
check('평소엔 안 보임', /opacity: 0/.test(delCss), delCss);
check('안 보일 땐 눌리지도 않음', /pointer-events: none/.test(delCss), delCss);
const delOn = ruleOf('.msg-row:hover .msg-del');
check('말풍선에 머물면 나옴', /opacity: 1/.test(delOn), delOn);
check('바로가 아니라 잠깐 뒤에', /transition-delay: 0\.45s/.test(delOn), delOn);
check('뜨면 눌 수 있음', /pointer-events: auto/.test(delOn), delOn);
check('테두리로 버튼임을 표시', /border: 1px solid var\(--border\)/.test(delCss), delCss);
check('누르려 하면 빨갛게', /var\(--danger\)/.test(ruleOf('.msg-del:hover')),
  ruleOf('.msg-del:hover'));
check('메시지마다 번호', msgs().every(m => m.dataset.msg));

confirmAnswer = false;
click(dels()[dels().length - 1]);
check('취소하면 그대로', msgs().length === 4, msgs().length + '개');

confirmAnswer = true;
const lastText = txt(msgs()[3].querySelector('.msg'));
click(dels()[dels().length - 1]);
check('확인 문구', lastConfirm.includes('삭제'), lastConfirm);
check('한 줄 사라짐', msgs().length === 3, msgs().length + '개');
check('그 말이 없어짐', !txt(q('#chat-body')).includes(lastText), txt(q('#chat-body')));
check('삭제 알림', toastText().includes('메시지를 삭제'), toastText());
check('상대 말은 그대로', msgs().filter(m => m.classList.contains('you')).length === 2);

console.log('\n[6] 목록으로 되돌아가기');
click(q('#chat-back'));
check('목록 화면', !thread() && open());
// 방금 지웠으니 미리보기도 그 앞 말로 돌아가 있어야 한다
check('미리보기도 삭제 반영', txt(rowOf('C-14').querySelector('.p')) === '네 감사합니다',
  txt(rowOf('C-14').querySelector('.p')));
check('안 읽음 해제 반영', txt(rowOf('C-14').querySelector('.n')) === '0');

console.log('\n[7] 원하는 좌석에 말 걸기');
pick('D-0');
check('좌석 고르기 머리글', txt(q('#chat-list .pop-cat')) === '좌석 고르기',
  txt(q('#chat-list .pop-cat')));
check('대화 없던 좌석도 나옴', rows().length > 0, rows().length + '개');
check('새 대화 안내', rows().every(r => txt(r.querySelector('.p')) === '새 대화 시작' ||
  txt(r.querySelector('.p')).length > 0));
const newSeat = rows()[0].dataset.chat;
click(rows()[0]);
check('그 좌석과 대화 열림', thread() && txt(q('#chat-seat')) === newSeat, txt(q('#chat-seat')));
check('아직 말이 없음', msgs().length === 0);
check('안내 문구', txt(q('#chat-body')).includes('주고받은 말이 없습니다'), txt(q('#chat-body')));
say('자리 이용 안내 도와드릴까요?');
check('첫 말이 들어감', msgs().length === 1 && msgs()[0].classList.contains('me'));
click(q('#chat-back'));
check('대화 수가 하나 늘어남', txt(moreBtn()) === '더보기 8개', txt(moreBtn()));
check('펼치면 새 대화도 있음', (() => {
  click(moreBtn());
  const ok = rowOf(newSeat) !== undefined && rows().length === 13;
  click(moreBtn());
  return ok;
})());

console.log('\n[8] 이름으로도 찾는다');
const useSeat = qa('#seat-map .seat.use')[0];
const userName = txt(useSeat.querySelector('.seat-user'));
pick(userName);
check('이용자 이름으로 찾기', rows().length > 0, rows().length + '개');
check('그 좌석이 들어 있음', rows().some(r => r.dataset.chat === useSeat.dataset.id),
  rows().map(r => r.dataset.chat).join(','));
pick('ㅁㄴㅇㄹ');
check('없으면 안내', txt(q('#chat-list')).includes('맞는 좌석이 없습니다'), txt(q('#chat-list')));
pick('');
check('비우면 대화 목록으로', rows().length === CAP && moreBtn() !== null,
  rows().length + '개');

console.log('\n[9] 문의가 걸린 대화는 표시가 붙는다');
// 알림 벨을 없앴으니 문의 여부는 대화 목록에서 알 수 있어야 한다
openBy('B-09');
check('B-09 대화', open() && thread() && txt(q('#chat-seat')) === 'B-09', txt(q('#chat-seat')));
check('문의가 부제로', txt(q('#chat-sub')).includes('문의 · 헤드셋 불량'), txt(q('#chat-sub')));
check('같은 대화', msgs().length === 2, msgs().length + '개');
click(q('#chat-back'));
pick('B-09');
check('목록에도 문의 표시', rowOf('B-09').querySelector('.mini') !== null);
check('표시 글자', txt(rowOf('B-09').querySelector('.mini')) === '문의',
  txt(rowOf('B-09').querySelector('.mini')));
pick('A-03');
check('문의 없는 대화엔 표시 없음', rowOf('A-03').querySelector('.mini') === null);
pick('');

console.log('\n[10] 화면을 옮기지 않는다');
click(nav('회원 관리'));
click(q('#btn-chat'));
openBy('G-11');
check('회원 관리 그대로', q('#page-members').style.display === 'block');
check('대화만 열림', thread() && txt(q('#chat-seat')) === 'G-11');
click(q('#chat-seat-go'));
check('좌석 관리로 이동', q('#page-seats').style.display === 'block');
check('좌석 상세까지 열림', q('#seat-modal').classList.contains('open'));
check('채팅 창은 닫힘', !open());
click(q('#sd-close'));

console.log('\n[11] 대시보드 점검 목록에서도');
click(nav('대시보드'));
click(qa('#fix-list .row')[2]);
check('E-02 대화 열림', open() && thread() && txt(q('#chat-seat')) === 'E-02',
  txt(q('#chat-seat')));

console.log('\n[12] 여닫기');
click(q('#btn-chat'));
check('버튼을 다시 누르면 닫힘', !open());
click(q('#btn-chat'));
check('다시 열면 목록부터', open() && !thread());
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('Esc 로 닫힘', !open());
click(q('#btn-chat'));
click(q('#chat-close'));
check('× 로도 닫힘', !open());

console.log('\n[12-2] 대화 모두 읽음');
click(q('#btn-chat'));
check('안 읽은 게 남아 있음', Number(badge()) > 0, badge());
check('버튼 있음', cReadAll() !== null);
check('안 읽은 게 있으면 켜짐', cReadAll().disabled === false);
click(cReadAll());
check('배지 0', badge() === '0', badge());
check('배지 숨김', q('#badge-chat').classList.contains('zero'));
check('줄마다 안 읽음도 0', rows().every(r => txt(r.querySelector('.n')) === '0'));
check('안 읽음 표시 감춤',
  rows().every(r => r.querySelector('.n').classList.contains('zero')));
check('창은 열린 채', open() && !thread());
// 버튼이 사라지면 머리 자리가 들썩인다 — 자리는 지키고 꺼 두기만 한다
check('버튼은 그대로 있고 꺼짐', cReadAll() !== null && cReadAll().disabled === true);
click(cReadAll());
check('꺼진 버튼을 눌러도 아무 일 없음', badge() === '0' && open());
check('알림 문구', toastText().includes('모두 읽음 처리'), toastText());
click(q('#chat-close'));

console.log('\n[13] 회귀');
check('주문 · 채팅 배지 그대로', q('#badge-orders') !== null && q('#badge-chat') !== null);
click(q('#btn-orders'));
check('주문 패널 열면 채팅은 닫힘', !open());
click(doc.body);
click(nav('좌석 관리'));
check('좌석 관리 정상', qa('#seat-map .seat').length === 140);
click(qa('#seat-map .seat')[0]);
check('좌석 상세 정상', q('#seat-modal').classList.contains('open'));
click(q('#sd-close'));

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
