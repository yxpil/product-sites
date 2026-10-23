# product-sites

每个公开产品一个宣传页，挂在 `<slug>.yxpil.com`，由 ONRouter 自己静态服务。
仓库里放的是**生成器和生成物**，页面文案不手写。

## 事实来源（生成时强校验）

- 中文标题与每条能力点必须是该仓库 GitHub description 的**逐字子串**，`build.js` 会逐条断言，
  不满足直接退出——改文案要先改仓库描述，不能只在页面里美化。
- 英文能力点与中文一一对应（条数不等也会报错），是同一批条款的翻译，不额外加承诺。
- release 标签、发布日期、产物数量、`docs/` 文件列表、默认分支都来自 `collect-prods.js` 抓的
  GitHub API，落盘在 `facts.json` / `branches.json`。
- 没发布过二进制产物的站点没有 `/download`，页面按钮直接指向仓库；有 release 的才写产物数量。
- 页面上不出现任何实际工作任务、内部域名或运维信息。

## 流程

```bash
node collect-prods.js   # 拉 description / latest release / docs 列表 / README（README 落盘但不入库）
node build.js           # 生成 dist/<host>/index.html，内含事实断言
node check.js           # i18n 键覆盖、链接按 facts 校验、canonical 一致性
node emit-conf.js       # 生成 dist/products.conf（每站点 80/443 两个 server 块）
node browser-check.js   # headless Chrome：zh/en、390/1440、溢出、console、语言切换持久化
```

`browser-check.js` 顶部是本机 Chrome 路径；它逐页检查 EN 视图里不残留中文、正文没有溢出、
`?lang=` / `localStorage` / 手动切换三者优先级正确。

## 部署到边缘

- 静态目录：`/var/www/<host>/index.html`（只换 HTML 不需要 reload）
- vhost：把 `dist/products.conf` 追加到 `/etc/onrouter/onrouter.conf`——生产配置是扁平结构，
  `server {}` 写在顶层，追加到文件末尾即可
- 证书复用 `/opt/selfhost/certs/yxpil.com/`（SAN 为 `*.yxpil.com`）；DNS 侧已有 `*.yxpil.com`
  通配记录，加站点不需要动 Cloudflare
- 先 `/usr/local/sbin/onrouter -c /etc/onrouter/onrouter.conf -t`，通过再 `systemctl reload onrouter`
- `verify-remote.sh`（在生产机上跑）按 `hosts.txt` 逐条验证 `/`、`/docs`、`/download` 的状态与
  Location 目标；未发布产物的站点 `/download` 应为 404

## 当前状态

52 个站点，其中 43 个有 GitHub Release；清单见 `hosts.txt`，页面在 `dist/`。
