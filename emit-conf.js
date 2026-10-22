// Author: yxpil (scratch generator)
// Emits the ONRouter vhost blocks for the generated product pages, mirroring the shape of the
// existing onrouter.yxpil.com block in /etc/onrouter/onrouter.conf (flattened config, top-level
// server blocks, same cert, same headers).
const fs = require('node:fs');

const DIR = __dirname;
const manifest = JSON.parse(fs.readFileSync(DIR + '/dist/manifest.json', 'utf8'));
const branches = JSON.parse(fs.readFileSync(DIR + '/branches.json', 'utf8'));

const out = [
  '',
  '# ================= 产品宣传页（生成物：prodsites/build.js + emit-conf.js）=================',
  '# 每个产品一个静态目录 /var/www/<host>/index.html；证书复用 *.yxpil.com 的 Origin CA 证书。',
  '# 文案全部来自仓库自身的 description / release / 文档路径，不写死任何实际工作任务。',
  '# 未发布过二进制产物的站点没有 /download，页面按钮直接指向仓库。',
  '',
];

for (const m of manifest) {
  const repoUrl = 'https://github.com/yxpil/' + m.repo;
  const branch = branches[m.repo] || 'main';
  out.push(`# ---- ${m.repo} (${m.hasRelease ? 'release ' + m.tag : 'no release'}) ----`);
  out.push('server {');
  out.push('    listen 80;');
  out.push(`    server_name ${m.host};`);
  out.push('    return 301 https://$host$request_uri;');
  out.push('}');
  out.push('');
  out.push('server {');
  out.push('    listen 443 ssl;');
  out.push('    http2 on;');
  out.push(`    server_name ${m.host};`);
  out.push('    ssl_certificate     /opt/selfhost/certs/yxpil.com/fullchain.pem;');
  out.push('    ssl_certificate_key /opt/selfhost/certs/yxpil.com/privkey.pem;');
  out.push('    ssl_protocols TLSv1.2 TLSv1.3;');
  out.push('');
  out.push(`    root /var/www/${m.host};`);
  out.push('    index index.html;');
  out.push('    expires 1h;');
  out.push('');
  out.push('    add_header X-Content-Type-Options nosniff always;');
  out.push('    add_header Referrer-Policy strict-origin-when-cross-origin always;');
  out.push('    add_header X-Frame-Options SAMEORIGIN always;');
  out.push('');
  if (m.hasRelease) {
    out.push('    location = /download {');
    out.push(`        return 302 ${repoUrl}/releases/latest;`);
    out.push('    }');
    out.push('');
  }
  out.push('    location = /docs {');
  out.push(`        return 302 ${repoUrl}/blob/${branch}/README.md;`);
  out.push('    }');
  out.push('');
  out.push('    location / {');
  out.push('    }');
  out.push('}');
  out.push('');
}

fs.writeFileSync(DIR + '/dist/products.conf', out.join('\n'));
console.log('wrote', DIR + '/dist/products.conf', out.length, 'lines,', manifest.length, 'hosts,',
  manifest.filter(m => m.hasRelease).length, 'with /download');
