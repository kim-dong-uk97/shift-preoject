// 정적 파일만 내보내는 작은 서버. 라이브 테스트와 눈으로 볼 때 쓴다.
//   npm run serve   →  http://localhost:3001/admin
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer(function (req, res) {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // 상위 경로로 빠져나가는 요청은 막는다
  const target = path.normalize(path.join(ROOT, url));
  if (!target.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }

  // 폴더로 들어오면 index.html 로 보낸다.
  // (배포 환경과 같게 두어야 상대 경로로 걸린 이미지가 같은 방식으로 풀린다)
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    res.writeHead(307, { Location: url.replace(/\/$/, '') + '/index.html' }).end();
    return;
  }

  fs.readFile(target, function (err, buf) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, function () {
  console.log('http://localhost:' + PORT + '/admin');
});
