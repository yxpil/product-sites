// Author: yxpil (scratch checker)
// Verifies generated product pages: i18n key coverage, no undefined text, and every outbound link
// resolvable against the collected repo facts (README exists, docs file listed, release exists).
const fs = require('node:fs');
const path = require('node:path');

const DIR = __dirname;
const facts = {};
for (const f of JSON.parse(fs.readFileSync(DIR + '/facts.json', 'utf8'))) facts[f.repo] = f;
const manifest = JSON.parse(fs.readFileSync(DIR + '/dist/manifest.json', 'utf8'));
const branches = JSON.parse(fs.readFileSync(DIR + '/branches.json', 'utf8'));

let bad = 0;
const problems = [];
for (const m of manifest) {
  const file = `${DIR}/dist/${m.host}/index.html`;
  const html = fs.readFileSync(file, 'utf8');
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(x => x[1]);
  const dictBlock = html.split('var en = {')[1] || '';
  const dictText = dictBlock.slice(0, dictBlock.indexOf('\n  };'));
  const dictKeys = new Set([...dictText.matchAll(/^\s{4}"([^"]+)":/gm)].map(x => x[1]));
  for (const k of keys) {
    if (!dictKeys.has(k)) problems.push(`${m.host}: no EN entry for ${k}`);
  }
  if (/undefined|NaN/.test(html)) problems.push(`${m.host}: literal undefined/NaN in output`);
  if (!html.includes(`<link rel="canonical" href="https://${m.host}/">`)) problems.push(`${m.host}: canonical mismatch`);

  const hrefs = [...new Set([...html.matchAll(/href="(https:[^"]+)"/g)].map(x => x[1]).filter(h => !h.startsWith('data:')))];
  for (const raw of hrefs) {
    const h = raw.replace(/&amp;/g, '&');
    if (h === `https://${m.host}/download` && !m.hasRelease) problems.push(`${m.host}: /download CTA but no release`);
    if (h === `https://${m.host}/download`) continue;
    if (h.startsWith('https://github.com/yxpil/')) {
      const rest = h.slice('https://github.com/yxpil/'.length);
      const repo = rest.split('/')[0];
      const f = facts[repo];
      if (!f) { problems.push(`${m.host}: unknown repo ${repo}`); continue; }
      const branch = branches[repo] || 'main';
      if (rest.includes('/blob/')) {
        const fp = rest.slice(rest.indexOf('/blob/') + 6);
        if (!fp.startsWith(branch + '/')) problems.push(`${m.host}: blob off default branch: ${fp}`);
        const p = fp.slice(branch.length + 1);
        if (p === 'README.md') { if (!f.readmeBytes) problems.push(`${m.host}: README link but README is empty in ${repo}`); }
        else if (!(f.docs || '').split(',').includes(p.split('/')[1])) problems.push(`${m.host}: docs link not in repo docs listing: ${p}`);
      }
      if (rest.includes('/releases/') && !m.hasRelease) problems.push(`${m.host}: release link but no release`);
      continue;
    }
    if (h === 'https://yxpil.com/') continue;
    if (h === `https://${m.host}/`) continue;
    if (!/^https:\/\/(github\.com\/yxpil\/|yxpil\.com\/)/.test(h) && !/\.github\.io\//.test(h)) {
      problems.push(`${m.host}: unexpected external href ${h}`);
    }
  }
  bad += 0;
}

function restOf(h) { return h; }

console.log(`checked ${manifest.length} pages, ${problems.length} problems`);
for (const p of problems) console.log('  ' + p);
process.exit(problems.length ? 1 : 0);
