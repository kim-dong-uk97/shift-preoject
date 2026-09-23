// 테스트를 한 번에 돌리고 합계를 낸다.
//   node tests/run.mjs          jsdom 테스트만 (서버 없이 동작)
//   node tests/run.mjs --live   실제 서버에 붙는 테스트까지
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const DIR = fileURLToPath(new URL('.', import.meta.url));
const withLive = process.argv.includes('--live');

// test.mjs, test4.mjs, test10.mjs … 숫자 순서로
const files = fs.readdirSync(DIR)
  .filter(f => /^test.*\.mjs$/.test(f))
  .filter(f => withLive || !f.includes('-live'))
  .sort((a, b) => {
    const n = x => Number((x.match(/\d+/) || [0])[0]);
    return n(a) - n(b);
  });

let pass = 0, fail = 0;
const failed = [];

for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(DIR, f)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/(\d+) passed, (\d+) failed/);

  if (!m) {
    failed.push(f);
    console.log(f.padEnd(18) + '결과 없음');
    console.log(out.trim().split('\n').slice(-6).join('\n'));
    continue;
  }

  pass += Number(m[1]);
  fail += Number(m[2]);
  console.log(f.padEnd(18) + m[1] + ' passed, ' + m[2] + ' failed');
  if (Number(m[2])) {
    failed.push(f);
    out.split('\n').filter(l => l.includes('  FAIL')).forEach(l => console.log('   ' + l.trim()));
  }
}

console.log('\n' + '-'.repeat(46));
console.log('합계 ' + pass + ' passed, ' + fail + ' failed  (' + files.length + ' suites)');
if (failed.length) console.log('실패한 파일 : ' + failed.join(', '));
process.exit(fail || failed.length ? 1 : 0);
