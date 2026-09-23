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
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

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
const salesNav = () => qa('.nav-item').find(b => b.dataset.title === '매출·정산 관리');
const payRows = () => qa('#pay-body tr');
const won = t => /[\d,]+원/.test(t);

console.log('\n[1] 대시보드에서 매출 제거');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('대시보드에 매출 블록 없음', q('#dashboard .secure-zone') === null);
check('대시보드에 잠금 오버레이 없음', q('#dashboard .secure-overlay') === null);
check('대시보드 지표는 공개 4개만', qa('#dashboard .kpi').length === 4,
  qa('#dashboard .kpi').length + '개');
check('공개 지표에 매출 없음', !txt(q('#dashboard .kpi-grid')).includes('매출'),
  txt(q('#dashboard .kpi-grid')));
check('좌석표가 지표 바로 다음', q('#dashboard').children[1].querySelector('#seat-panel') !== null);

console.log('\n[2] 매출·정산 메뉴 · 잠금');
check('하위 메뉴 제거', salesNav().closest('.nav-group').querySelector('.submenu') === null);
check('전체매출/상품매출/결제내역 sub-item 없음',
  qa('.sub-item').filter(b => ['전체 매출 현황', '상품 매출 현황', '결제 내역'].includes(b.dataset.title)).length === 0);
check('data-secure 그룹 유지', salesNav().closest('.nav-group').hasAttribute('data-secure'));

click(salesNav());
check('잠긴 상태에선 PIN 모달', q('#pin-modal').classList.contains('open'));
check('아직 페이지 안 열림', q('#page-sales').style.display !== 'block');
unlock();
check('PIN 통과 후 페이지 열림', q('#page-sales').style.display === 'block');
check('제목', q('#page-title').textContent === '매출·정산 관리');
check('부제', q('#page-desc').textContent === '전체 매출 · 상품 매출 · 결제 내역');
check('준비중 카드 숨김', q('#page-body').style.display === 'none');
check('잠금 해제 상태', !doc.body.classList.contains('locked'));

console.log('\n[3] 잠금 UI 가 페이지로 이동');
// 잠금 UI 는 여러 화면에서 함께 쓰려고 class 로 되어 있다
check('잠금 UI 가 매출 페이지 안에', q('#page-sales .lock-msg') !== null);
check('지금 잠그기 버튼', q('#page-sales .btn-lock-toggle') !== null);
check('잠금 해제 버튼', q('#page-sales .btn-unlock') !== null);
check('오버레이', q('#page-sales .secure-overlay') !== null);
check('카운트다운 표시', /\d:\d{2} 후 자동 잠금/.test(txt(q('#page-sales .lock-msg'))),
  txt(q('#page-sales .lock-msg')));
click(q('#page-sales .btn-lock-toggle'));
check('지금 잠그기 동작', doc.body.classList.contains('locked'));
check('잠겨도 페이지는 유지', q('#page-sales').style.display === 'block');
click(q('#page-sales .btn-unlock'));
check('잠금 해제 버튼이 PIN 호출', q('#pin-modal').classList.contains('open'));
unlock();
check('다시 해제됨', !doc.body.classList.contains('locked'));
check('잠금 시 전체를 가리는 규칙', html.includes('body.locked .secure-body > *:not(.secure-overlay)'));

console.log('\n[4] 상단 지표 4개');
check('지표 4개', qa('#sales-kpi .kpi').length === 4);
const labels = qa('#sales-kpi .kpi-label').map(txt);
check('오늘 매출 / 좌석·매점 / 객단가 / 신규 가입',
  labels.join(',') === '오늘 매출,좌석 / 매점 매출,객단가,오늘 신규 가입', labels.join(','));
check('금액은 원화', won(txt(qa('#sales-kpi .kpi-value')[0])), txt(qa('#sales-kpi .kpi-value')[0]));
check('증감 표시', qa('#sales-kpi .up, #sales-kpi .down').length >= 1);

console.log('\n[5] 전체 매출 탭 : 추이 + 구성비');
check('기본 탭은 전체 매출', q('.tab[data-stab="total"]').classList.contains('active'));
check('전체 매출 영역 표시', q('#sales-total').style.display !== 'none');
check('기간 칩 3개', qa('#sales-range .chip-btn').length === 3);
check('일별이 기본', qa('#sales-range .chip-btn')[0].classList.contains('on'));
check('일별 막대 14개', qa('#sales-chart .chart-col').length === 14, qa('#sales-chart .chart-col').length + '개');
check('막대마다 좌석·매점 두 층',
  qa('#sales-chart .chart-col').every(c => c.querySelector('.seat') && c.querySelector('.store')));
check('막대 높이 지정', qa('#sales-chart .chart-bar').every(b => /height:/.test(b.getAttribute('style'))));
check('최고 막대 강조 1개', qa('#sales-chart .chart-col.peak').length === 1);
check('합계·평균·최고 요약', ['합계', '평균', '최고'].every(k => txt(q('#sales-chart-sum')).includes(k)),
  txt(q('#sales-chart-sum')));
check('구성비 막대 2단', qa('#mix-bar span').length === 2);
check('구성비 합 100%', (() => {
  const w = qa('#mix-bar span').map(s => parseFloat(s.getAttribute('style').match(/width:([\d.]+)%/)[1]));
  return Math.abs(w[0] + w[1] - 100) < 0.2;
})(), qa('#mix-bar span').map(s => s.getAttribute('style')).join(' '));
check('범례에 좌석·매점 금액', ['좌석', '매점'].every(k => txt(q('#mix-legend')).includes(k)));

const dayChart = txt(q('#sales-chart-sum'));
click(qa('#sales-range .chip-btn')[1]);
check('주별 전환', qa('#sales-range .chip-btn')[1].classList.contains('on'));
check('주별 막대 12개', qa('#sales-chart .chart-col').length === 12);
check('요약 갱신', txt(q('#sales-chart-sum')) !== dayChart);
check('주별 라벨', txt(q('#mix-note')) === '최근 12주', txt(q('#mix-note')));
click(qa('#sales-range .chip-btn')[2]);
check('월별 막대 12개', qa('#sales-chart .chart-col').length === 12);
check('월별 라벨은 N월', /^\d{1,2}월$/.test(txt(qa('#sales-chart .lb')[0])), txt(qa('#sales-chart .lb')[0]));
click(qa('#sales-range .chip-btn')[0]);

console.log('\n[6] 상품 매출 탭');
click(q('.tab[data-stab="product"]'));
check('탭 전환', q('#sales-product').style.display === 'block' && q('#sales-total').style.display === 'none');
check('메뉴 14개 순위', qa('#product-rank .rank-row').length === 14, qa('#product-rank .rank-row').length + '개');
const amts = qa('#product-rank .rank-amt').map(e => Number(txt(e).replace(/[^\d]/g, '')));
check('매출 내림차순', amts.every((v, i) => i === 0 || amts[i - 1] >= v), amts.slice(0, 5).join(','));
check('1~3위 강조', qa('#product-rank .rank-row.top').length === 3);
check('순위 번호', txt(qa('#product-rank .rank-no')[0]) === '1');
check('메뉴 사진 사용', qa('#product-rank .rank-thumb img').length === 14);
check('판매 수량·기여도 표기',
  /\d+개 판매 · 기여도 [\d.]+%/.test(txt(qa('#product-rank .rank-meta')[0])),
  txt(qa('#product-rank .rank-meta')[0]));
check('기여도 막대 폭', /width:[\d.]+%/.test(qa('#product-rank .rank-fill')[0].getAttribute('style')));
check('1위 막대가 100%', qa('#product-rank .rank-fill')[0].getAttribute('style').includes('width:100.0%'));
check('합계 표기', won(txt(q('#product-note'))), txt(q('#product-note')));

console.log('\n[7] 결제 내역 탭');
click(q('.tab[data-stab="pay"]'));
check('탭 전환', q('#sales-pay').style.display === 'block');
const heads = qa('#sales-pay thead th').map(txt);
check('열 6개', heads.join(',') === '주문번호,시각,좌석,구분,결제수단,금액', heads.join(','));
check('첫 화면 40건', payRows().length === 40, payRows().length + '건');
check('전체 건수·합계 표기', txt(q('#pay-count')).includes('전체 180건') && won(txt(q('#pay-count'))),
  txt(q('#pay-count')));
check('더 보기 안내', txt(q('#pay-more')).includes('스크롤하면'), txt(q('#pay-more')));
const first = [...payRows()[0].children].map(txt);
check('주문번호 #형식', /^#\d+$/.test(first[0]), first[0]);
check('시각 HH:MM', /^\d{2}:\d{2}$/.test(first[1]), first[1]);
check('좌석 표기', /^[A-G]-\d{2}$/.test(first[2]), first[2]);
check('구분 좌석/매점', ['좌석', '매점'].includes(first[3]), first[3]);
check('결제수단 5종 중 하나',
  ['현금', '네이버페이', '카카오페이', '카드결제', 'SHIFT결제'].includes(first[4]), first[4]);
check('금액 원화', won(first[5]), first[5]);

fire(q('#pay-scroll'), 'scroll');
check('스크롤로 80건', payRows().length === 80);
for (let i = 0; i < 5; i++) fire(q('#pay-scroll'), 'scroll');
check('끝까지 180건', payRows().length === 180);
check('마지막 안내', txt(q('#pay-more')) === '마지막 결제입니다', txt(q('#pay-more')));

q('#pay-search').value = '카카오페이';
fire(q('#pay-search'), 'input');
check('결제수단 검색', payRows().length > 0 &&
  payRows().every(r => txt([...r.children][4]) === '카카오페이'));
check('검색 건수 표기', txt(q('#pay-count')).includes('검색'), txt(q('#pay-count')));
q('#pay-search').value = 'A-01';
fire(q('#pay-search'), 'input');
check('좌석 검색', payRows().every(r => txt([...r.children][2]) === 'A-01'));
q('#pay-search').value = 'zzz없음';
fire(q('#pay-search'), 'input');
check('결과 없음 안내', txt(q('#pay-body')).includes('검색 결과가 없습니다'));
q('#pay-search').value = '';
fire(q('#pay-search'), 'input');
check('검색 해제 복귀', payRows().length === 40 && txt(q('#pay-count')).includes('전체 180건'));

console.log('\n[8] 회귀');
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('대시보드 정상', q('#dashboard').style.display === 'block' && q('#seat-slot #seat-panel') !== null);
check('매출 페이지 숨김', q('#page-sales').style.display === 'none');
check('지표 타일 4개', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
check('빠른 제어 유지', qa('#quick-actions .nav-action').length === 4);
click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
check('매점 관리 정상', qa('#menu-grid .prod').length === 14);
click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);
click(salesNav());
check('해제 상태에선 PIN 없이 바로 진입',
  q('#page-sales').style.display === 'block' && !q('#pin-modal').classList.contains('open'));

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
