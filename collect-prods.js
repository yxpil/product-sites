// Author: yxpil (helper, scratch tool outside the repo)
// Collects release facts for candidate product repos in one GraphQL call and prints a digest.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const repos = [
  'maylin', 'PLocalSwitch', 'PILCOMMIX', 'DOCPI', 'ADB', 'PILALTU', 'sniffgate', 'CloudSH',
  'MightBe', 'SM4Kit', 'ULocker', 'CQRC', 'PILScript', 'SPNIX', 'HUMIX', 'Fake_SSH_Play',
  'PILSEOCORE', 'PANOPTES', 'SECFORGE', 'Neton', 'Firelin', 'MemoryPool', 'HOWCUEME',
  'ADONWORD', 'BITSDK', 'BrainTentacle', 'Nebula', 'styx-vision', 'DrawLib', 'ChatUI',
  'ControlEcharts', 'online-piano', 'drawbuddy', 'VmTyper', 'PILinstaller', 'Compositor',
  'PILSoftFlow', 'whitelib', 'ROMbay', 'MQ', 'bit-mobile', 'TentacleTool',
  'inkdock', 'openmeet', 'overmarked', 'PILBroadcast', 'PILHOME', 'PILPublisher', 'Styx',
  'yxpil-ui', 'ToolsForMy', 'multilingual-sensitive-words', 'A-PILCat', 'bit', 'sapni',
];

let query = '{\n';
repos.forEach((r, i) => {
  query += `  r${i}: repository(owner: "yxpil", name: "${r}") {\n`;
  query += `    name description homepageUrl isArchived stargazerCount\n`;
  query += `    latestRelease { tagName publishedAt assetCount: releaseAssets(first: 100) { totalCount } }\n`;
  query += `    readme: object(expression: "HEAD:README.md") { ... on Blob { byteSize text } }\n`;
  query += `    docs: object(expression: "HEAD:docs") { ... on Tree { entries { name } } }\n`;
  query += `  }\n`;
});
query += '}\n';

const out = execFileSync('gh', ['api', 'graphql', '-f', 'query=' + query], {
  maxBuffer: 256 * 1024 * 1024, encoding: 'utf8',
});
const OUT_DIR = __dirname;
fs.mkdirSync(OUT_DIR, { recursive: true });
const data = JSON.parse(out).data;
const rows = [];
repos.forEach((r, i) => {
  const n = data['r' + i];
  if (!n) { rows.push({ repo: r, missing: true }); return; }
  const readme = n.readme && n.readme.text ? n.readme.text : '';
  fs.writeFileSync(OUT_DIR + '/' + r + '.README.md', readme);
  rows.push({
    repo: n.name,
    archived: n.isArchived,
    stars: n.stargazerCount,
    homepage: n.homepageUrl || '',
    tag: n.latestRelease ? n.latestRelease.tagName : 'no-release',
    assets: n.latestRelease ? n.latestRelease.assetCount.totalCount : 0,
    docs: n.docs ? n.docs.entries.map(e => e.name).join(',') : '',
    readmeBytes: readme.length,
    tagDate: n.latestRelease ? n.latestRelease.publishedAt : '',
    desc: (n.description || '').replace(/\s+/g, ' ').trim(),
  });
});
fs.writeFileSync(OUT_DIR + '/facts.json', JSON.stringify(rows, null, 2));
for (const r of rows) {
  console.log(`${r.repo}\ttag=${r.tag}\tassets=${r.assets}\treadme=${r.readmeBytes}\tarch=${r.archived}\tstard=${r.stars}\thome=${r.homepage}\ndocs=${r.docs}\ndesc=${r.desc}\n`);
}
