// Author: yxpil (scratch generator, outside the ONRouter repo)
// Renders one bilingual promo page per public yxpil product repo from collected repo facts.
// Honesty rule enforced in code: every Chinese tagline and chip must be a verbatim substring of the
// repo's own GitHub description, and the Chinese / English chip lists must have equal length.
const fs = require('node:fs');

const DIR = __dirname;
const facts = JSON.parse(fs.readFileSync(DIR + '/facts.json', 'utf8'));
const branches = JSON.parse(fs.readFileSync(DIR + '/branches.json', 'utf8'));
const byRepo = {};
for (const f of facts) byRepo[f.repo] = f;

// zhTag / zhChips are quoted from the repo description; enTag / enChips are their translation.
const PRODUCTS = [
  { repo: 'maylin', slug: 'maylin', cat: 'infra',
    zhTag: 'Maylin · 无 Docker 的 Rust 服务集群管理器',
    zhChips: ['子进程插件化（node / python / binary）', '多服务器集群', 'RBAC + Token API', 'cron 定时', '内置负载均衡与 WS 终端'],
    enTag: 'Maylin · a Rust service cluster manager without Docker',
    enChips: ['Sub-process plugins (node / python / binary)', 'Multi-server clusters', 'RBAC + token API', 'Cron scheduling', 'Built-in load balancing and a WS terminal'] },
  { repo: 'PLocalSwitch', slug: 'plocalswitch', cat: 'ai',
    zhTag: '本地 LLM API 代理网关',
    zhChips: ['对外统一 OpenAI v1 契约', '内部双向转换到 Anthropic / Gemini / Ollama / Bedrock 等 13 类上游协议', '双账本计费', '节点质量评估', '流式安全链路 + Tauri 桌面管理端'],
    enTag: 'Local LLM API proxy gateway',
    enChips: ['One OpenAI v1 contract on the outside', 'Two-way conversion to 13 upstream families (Anthropic / Gemini / Ollama / Bedrock)', 'Dual-ledger billing', 'Node quality scoring', 'Streaming-safe chain + Tauri desktop admin'] },
  { repo: 'PILCOMMIX', slug: 'pilcommix', cat: 'media',
    zhTag: '音频合成器',
    zhChips: ['Rust DSP 引擎 + Tauri 桌面端 + VST3 插件形态', '内置波形、滤波器、效果链与渲染示例工具'],
    enTag: 'Audio synthesizer',
    enChips: ['Rust DSP engine + Tauri desktop app + VST3 plugin form', 'Built-in waveforms, filters, effect chains and render tooling'] },
  { repo: 'DOCPI', slug: 'docpi', cat: 'webapp',
    zhTag: '本地运行的开发文档公示与协作系统',
    zhChips: ['项目 → 文件夹（可嵌套）→ 文档三级结构', 'Markdown 渲染', '全文搜索', '文件夹级权限与登录鉴权，Rust 后端 + SQLite'],
    enTag: 'Local development-docs publishing and collaboration system',
    enChips: ['Project → folder (nestable) → document, three levels', 'Markdown rendering', 'Full-text search', 'Folder-level permissions and login auth, Rust backend + SQLite'] },
  { repo: 'ADB', slug: 'adb', cat: 'ai',
    zhTag: 'Agent Debug Bridge · 零依赖 Node.js 智能体调试桥',
    zhChips: ['把 API 请求原样转发到任意上游', '全量落库 SQLite', '带会话分组、Token 统计与 Web 面板'],
    enTag: 'Agent Debug Bridge · a zero-dependency Node.js debug bridge for agent traffic',
    enChips: ['Forwards API requests verbatim to any upstream', 'Stores everything in SQLite', 'Session grouping, token stats and a web panel'] },
  { repo: 'PILALTU', slug: 'pilaltu', cat: 'infra',
    zhTag: '多端口复用网关',
    zhChips: ['自动识别本机各端口上的服务', '按 Cookie 把请求路由到不同后端', '一个端口当多个用', '页面按 Alt+U 呼出切换器'],
    enTag: 'Multi-port reuse gateway',
    enChips: ['Discovers what runs on your local ports', 'Routes requests to different backends by cookie', 'One port used as many', 'Alt+U opens the switcher'] },
  { repo: 'sniffgate', slug: 'sniffgate', cat: 'infra',
    zhTag: '多节点嗅探主备热切换网关',
    zhChips: ['对外统一 TCP / UDP 入口', '后端健康嗅探', '主备秒级热切换', '配置文件在线热加载（Rust）'],
    enTag: 'Multi-node sniffing failover gateway',
    enChips: ['One public TCP / UDP entry', 'Backend health sniffing', 'Second-level active-standby switching', 'Online config hot reload (Rust)'] },
  { repo: 'CloudSH', slug: 'cloudsh', cat: 'infra',
    zhTag: '云 SSH 中继',
    zhChips: ['被控主机主动外连云 VPS', '穿透 NAT / 防火墙，无需公网 IP 与开放端口', '一条命令远程执行（Rust：Server / Agent / Client 三件套）'],
    enTag: 'Cloud SSH relay',
    enChips: ['The controlled host dials out to a cloud VPS', 'Crosses NAT / firewall with no public IP and no open ports', 'Remote execution in one command (Rust: Server / Agent / Client)'] },
  { repo: 'MightBe', slug: 'mightbe', cat: 'ai',
    zhTag: '用 Rust 从零实现的神经网络实时修改框架 + 类 MySQL 的神经网络特征数据库',
    zhChips: ['自定义网络结构', '入库文本自动分词向量化', '联想检索与可解释推理（多跳 + 证据 + 置信度）', '模型可热更新'],
    enTag: 'A from-scratch Rust framework for live neural-network editing, plus a MySQL-like neural feature database',
    enChips: ['Custom network structures', 'Text tokenized and vectorized on insert', 'Associative retrieval and explainable inference (multi-hop + evidence + confidence)', 'Hot model updates'] },
  { repo: 'SM4Kit', slug: 'sm4kit', cat: 'lib',
    zhTag: 'SM4 分组密码（GB/T 32907-2016）多语言组件库',
    zhChips: ['JavaScript/TypeScript·Python·Go·Java·Rust·PHP·Ruby·C', '零依赖', '统一 API 与标准测试向量'],
    enTag: 'SM4 block cipher (GB/T 32907-2016) component library',
    enChips: ['JavaScript/TypeScript · Python · Go · Java · Rust · PHP · Ruby · C', 'Zero dependencies', 'One API and standard test vectors'] },
  { repo: 'ULocker', slug: 'ulocker', cat: 'security',
    zhTag: 'U 盘加密软件',
    zhChips: ['AES-256-GCM 分块加密', 'Argon2id 口令派生', '容器绑定 U 盘序列号换盘打不开', '改口令秒级完成，命令行 + 图形界面'],
    enTag: 'USB-drive encryption',
    enChips: ['AES-256-GCM chunked encryption', 'Argon2id password derivation', 'Bound to the USB drive serial, so it will not open on another drive', 'Second-level password change, CLI + GUI'] },
  { repo: 'CQRC', slug: 'cqrc', cat: 'lib',
    zhTag: '从零实现的彩色 / 风格化二维码生成库（零第三方依赖）',
    zhChips: ['C#（net8.0 / net10.0）与纯 JavaScript 双实现', '覆盖 ISO/IEC 18004 编码', 'GF(2⁸) Reed-Solomon 纠错与 ISO/IEC 21570 扩展'],
    enTag: 'A from-scratch colour / stylised QR code library with zero third-party dependencies',
    enChips: ['C# (net8.0 / net10.0) and pure JavaScript implementations', 'Covers ISO/IEC 18004 encoding', 'GF(2^8) Reed-Solomon correction and ISO/IEC 21570 extensions'] },
  { repo: 'PILScript', slug: 'pilscript', cat: 'lang',
    zhTag: '极简 JS 风格脚本语言（约 1500 行 Rust 解释器）',
    zhChips: ['dlopen 直接跨语言调用 C / C++ / Rust / Zig / Go 动态库', '零宏魔法', '适合作为写解释器的参考实现'],
    enTag: 'A minimal JS-flavoured scripting language (a ~1500-line Rust interpreter)',
    enChips: ['dlopen straight into C / C++ / Rust / Zig / Go dynamic libraries', 'No macro magic', 'A readable reference implementation for writing an interpreter'] },
  { repo: 'SPNIX', slug: 'spnix', cat: 'ai',
    zhTag: 'SPNIX — 极小的 Rust 终端 AI Agent',
    zhChips: ['内置 CHECK / DEL / EDIT / EXEC / LS / PLUGS / Todo / WRITE 工具集', 'OpenAI 协议直连'],
    enTag: 'SPNIX — a very small Rust terminal AI agent',
    enChips: ['Built-in CHECK / DEL / EDIT / EXEC / LS / PLUGS / Todo / WRITE tools', 'Talks the OpenAI protocol directly'] },
  { repo: 'HUMIX', slug: 'humix', cat: 'media',
    zhTag: 'HUMIX — 浏览器 / Tauri 人声合成器',
    zhChips: ['钢琴卷帘摆音符', '填中文或拼音歌词，播放时按旋律唱出来', '附带 OK_TTS 音素素材库'],
    enTag: 'HUMIX — a browser / Tauri voice synthesizer',
    enChips: ['Place notes on a piano roll', 'Type Chinese or pinyin lyrics and it sings them along the melody', 'Ships with the OK_TTS phoneme library'] },
  { repo: 'Fake_SSH_Play', slug: 'fakesshplay', cat: 'security',
    zhTag: 'SSH ASCII Art 蜜罐',
    zhChips: ['接受任意 SSH 连接并逐帧播放 Bad Apple', '附带 Web 仪表盘', 'Rust + russh 实现'],
    enTag: 'SSH ASCII-art honeypot',
    enChips: ['Accepts any SSH connection and plays Bad Apple frame by frame', 'Web dashboard included', 'Built on Rust + russh'] },
  { repo: 'PILSEOCORE', slug: 'pilseocore', cat: 'webapp',
    zhTag: '本地搜索引擎 / SEO 引擎',
    zhChips: ['多线程全网爬取（DNS 枚举 + 黑名单 + 关键词）', '倒排索引', '元搜索聚合', '统计面板，附带 MCP 服务与 Web 管理端'],
    enTag: 'Local search engine / SEO engine',
    enChips: ['Multithreaded crawling (DNS enumeration + blacklist + keywords)', 'Inverted index', 'Meta-search aggregation', 'Statistics panel, with an MCP server and web admin'] },
  { repo: 'PANOPTES', slug: 'panoptes', cat: 'ai',
    zhTag: '面向 AI Agent 的屏幕操作 MCP 服务器',
    zhChips: ['截图 + 鼠标键盘控制', '9 个工具经 Streamable HTTP 上的 JSON-RPC 2.0 暴露'],
    enTag: 'Screen-control MCP server for AI agents',
    enChips: ['Screenshots plus mouse and keyboard control', '9 tools exposed over JSON-RPC 2.0 on Streamable HTTP'] },
  { repo: 'SECFORGE', slug: 'secforge', cat: 'ai',
    zhTag: '面向 AI Agent 的安全 MCP 服务器',
    zhChips: ['把 neton / firelin / adonword / howcueme / memorypool 五个 BITECO 卫星工具聚合成 29 个 MCP 工具', '经 Streamable HTTP 暴露'],
    enTag: 'Security MCP server for AI agents',
    enChips: ['Aggregates five BITECO satellite tools (neton / firelin / adonword / howcueme / memorypool) into 29 MCP tools', 'Exposed over Streamable HTTP'] },
  { repo: 'Neton', slug: 'neton', cat: 'security',
    zhTag: '面向 AI Agent 的本地网络观测与诊断工具',
    zhChips: ['主机发现 / 端口 / ARP / DNS PTR / OUI 厂商识别', 'JSON in / JSON out 并附 MCP 服务（BIT 生态）'],
    enTag: 'Local network observation and diagnostics for AI agents',
    enChips: ['Host discovery / ports / ARP / DNS PTR / OUI vendor lookup', 'JSON in and JSON out, with an MCP server (BIT ecosystem)'] },
  { repo: 'Firelin', slug: 'firelin', cat: 'security',
    zhTag: '面向 AI Agent 的授权网络评估工具集',
    zhChips: ['TCP 端口扫描 / DNS 子域枚举 / 目录爆破 / HTTP 指纹识别', 'JSON in / JSON out 并附 MCP 服务（BIT 生态）'],
    enTag: 'Authorised network assessment toolkit for AI agents',
    enChips: ['TCP port scan / DNS subdomain enumeration / directory brute-force / HTTP fingerprinting', 'JSON in and JSON out, with an MCP server (BIT ecosystem)'] },
  { repo: 'MemoryPool', slug: 'memorypool', cat: 'ai',
    zhTag: '跨进程共享的持久记忆池',
    zhChips: ['独立于 BIT 自带 memories.json 的中央记忆服务', 'CLI / HTTP API / MCP 多路接入', 'JSONL 落盘（BIT 生态）'],
    enTag: 'A cross-process shared persistent memory pool',
    enChips: ['A central memory service independent of BIT\'s own memories.json', 'CLI / HTTP API / MCP access', 'JSONL on disk (BIT ecosystem)'] },
  { repo: 'HOWCUEME', slug: 'howcueme', cat: 'ai',
    zhTag: '条件自唤醒守护进程',
    zhChips: ['到点 / 文件变化 / HTTP 探测 / 进程出现等条件满足时', '自动触发 webhook、本地命令或唤醒 BIT 继续干活（BIT 生态）'],
    enTag: 'Condition-based self-waking daemon',
    enChips: ['Triggers on timers, file changes, HTTP probes and process conditions', 'Fires a webhook or a local command, or wakes BIT to keep working (BIT ecosystem)'] },
  { repo: 'ADONWORD', slug: 'adonword', cat: 'security',
    zhTag: '智能体主动防御哨兵',
    zhChips: ['文件完整性基线 / 可疑进程监控 / 监听端口告警', 'BIT 生态内可独立运行的 Rust 守护进程'],
    enTag: 'Proactive defence sentinel for agents',
    enChips: ['File-integrity baseline / suspicious-process monitoring / listening-port alerts', 'A Rust daemon that runs standalone inside the BIT ecosystem'] },
  { repo: 'BITSDK', slug: 'bitsdk', cat: 'lib',
    zhTag: 'BIT 官方多语言客户端 SDK',
    zhChips: ['用 Java / JavaScript / Go / Rust / C / C# / Lua 驱动本地 BIT', '对话、注册与远程调用工具、读审计与调试状态'],
    enTag: 'Official multi-language client SDK for BIT',
    enChips: ['Drive a local BIT from Java / JavaScript / Go / Rust / C / C# / Lua', 'Chat, register and call tools remotely, read audit and debug state'] },
  { repo: 'BrainTentacle', slug: 'braintentacle', cat: 'ai',
    zhTag: '触手怪 BrainTentacle · 桌面 AI Agent 中枢',
    zhChips: ['对话 / 工具 / 记忆 / 技能 / 安全脱敏 / MCP 扩展', 'Tauri + Rust + React', '覆盖 Windows·macOS·Linux·龙芯·RISC-V'],
    enTag: 'BrainTentacle · desktop AI agent hub',
    enChips: ['Chat / tools / memory / skills / safety redaction / MCP extensions', 'Tauri + Rust + React', 'Covers Windows, macOS, Linux, LoongArch and RISC-V'] },
  { repo: 'Nebula', slug: 'nebula', cat: 'data',
    zhTag: '本地优先的个人记忆 / 笔记检索引擎',
    zhChips: ['单文件加密存储（Argon2id + ChaCha20-Poly1305）', '类 SQL 接口', 'BM25 全文检索与联想查询，可开 TCP 加密服务'],
    enTag: 'Local-first personal memory and note search engine',
    enChips: ['Single-file encrypted storage (Argon2id + ChaCha20-Poly1305)', 'A SQL-like interface', 'BM25 full-text and associative queries, can serve encrypted TCP'] },
  { repo: 'styx-vision', slug: 'styxvision', cat: 'ai',
    zhTag: '本地图像理解：让没有视觉能力的语言模型也能「看见」图片',
    zhChips: ['零第三方依赖', '自带基线 JPEG 解码与提示词反推', '可脱离 Styx 独立使用'],
    enTag: 'Local image understanding, so vision-less language models can see',
    enChips: ['Zero third-party dependencies', 'Baseline JPEG decoder and prompt inversion included', 'Usable independently of Styx'] },
  { repo: 'DrawLib', slug: 'drawlib', cat: 'media',
    zhTag: 'DrawLib 绘画工作室',
    zhChips: ['纯前端零依赖 PNG 绘画软件', '19 种工具 / 120 个滤镜与调整 / 插件系统 / PS 风格菜单栏 / 完整历史记录'],
    enTag: 'DrawLib painting studio',
    enChips: ['Pure front-end, zero-dependency PNG painting software', '19 tools / 120 filters and adjustments / plugin system / PS-style menu bar / full history'] },
  { repo: 'ChatUI', slug: 'chatui', cat: 'ai',
    zhTag: '纯前端零后端零账号的 OpenAI 兼容聊天客户端',
    zhChips: ['15 家模型服务商、GFM 与 LaTeX 渲染', '长期记忆', '四格式导入导出，Tailwind v4 离线可用'],
    enTag: 'Pure front-end OpenAI-compatible chat client with no backend and no accounts',
    enChips: ['15 model providers, GFM and LaTeX rendering', 'Long-term memory', 'Import and export in four formats, Tailwind v4, works offline'] },
  { repo: 'ControlEcharts', slug: 'controlecharts', cat: 'webapp',
    zhTag: '基于 Tailwind CSS + Apache ECharts 的统计图表工作台',
    zhChips: ['38 种图表 / CSV 导入 / 单色多色配色', 'SVG 矢量导出，纯前端零构建离线可用'],
    enTag: 'Statistics chart workbench on Tailwind CSS + Apache ECharts',
    enChips: ['38 chart types / CSV import / single-colour and multi-colour palettes', 'SVG vector export; pure front-end, no build, offline'] },
  { repo: 'online-piano', slug: 'piano', cat: 'media',
    zhTag: '指尖钢琴 · 在线 MIDI 合成钢琴',
    zhChips: ['Web Audio 实时合成 36 种音色', '支持 MIDI 多轨多音色播放 / 导出', '屏幕触控、电脑键盘与外接 Web MIDI 键盘'],
    enTag: 'Online MIDI synthesis piano',
    enChips: ['Web Audio realtime synthesis across 36 timbres', 'Multi-track, multi-timbre MIDI playback and export', 'Touch screen, computer keyboard and external Web MIDI'] },
  { repo: 'drawbuddy', slug: 'drawbuddy', cat: 'webapp',
    zhTag: 'DrawBuddy · 万能绘图工作台',
    zhChips: ['流程图 / 时序图 / 思维导图 / 统计图表', '基于 Mermaid + Chart.js', '单页纯前端离线可用，导出 PNG / SVG'],
    enTag: 'DrawBuddy · universal diagramming workbench',
    enChips: ['Flowcharts / sequence diagrams / mind maps / statistical charts', 'Built on Mermaid + Chart.js', 'Single page, pure front-end, offline; exports PNG / SVG'] },
  { repo: 'VmTyper', slug: 'vmtyper', cat: 'tool',
    zhTag: '把剪贴板里的文本模拟成逐字键盘输入',
    zhChips: ['绕过那些禁止粘贴的网页 / 应用输入框', '可调速、可控制录入节奏'],
    enTag: 'Types clipboard text as simulated keystrokes, one character at a time',
    enChips: ['For web pages and apps that block pasting', 'Adjustable speed and rhythm'] },
  { repo: 'PILinstaller', slug: 'pilinstaller', cat: 'tool',
    zhTag: '自己用的 Windows 安装包生成器',
    zhChips: ['图形化向导配置品牌 / 授权协议 / 安装目录', '产出带卸载项的 C# WPF 安装程序', '并附带可供 AI 直接调用的 MCP 工具'],
    enTag: 'A Windows installer builder of my own',
    enChips: ['GUI wizard for branding / licence / install directory', 'Produces a C# WPF installer with an uninstall entry', 'Ships an MCP tool an AI can call directly'] },
  { repo: 'PILSoftFlow', slug: 'pilsoftflow', cat: 'infra',
    zhTag: '自动关机 + WOL 唤醒一体服务（纯 Node.js，零依赖）',
    zhChips: ['客户端访问离线后端时自动发 WOL 魔术包唤醒', '重型机空闲 5 分钟自动关机'],
    enTag: 'Auto-shutdown + WOL wake in one service (pure Node.js, zero dependencies)',
    enChips: ['Sends a WOL magic packet when a client reaches an offline backend', 'Shuts an idle heavy machine down after 5 minutes'] },
  { repo: 'whitelib', slug: 'whitelib', cat: 'media',
    zhTag: '基于 PyQt5 的色块抠图工具',
    zhChips: ['点击画布色块，容差内相连像素一键变透明', '同一套规则可批量套用到导入的全部图片', '另提供免环境 exe'],
    enTag: 'Click-to-key-out tool on PyQt5',
    enChips: ['Click a colour region and every connected pixel within tolerance turns transparent', 'The same rule batch-applies to all imported images', 'A no-environment exe is included'] },
  { repo: 'ROMbay', slug: 'rombay', cat: 'data',
    zhTag: '实验性 MySQL 协议代理',
    zhChips: ['把 ROM 的 SQL 数据加载进内存（RAM）加速读取', '同时做用户认证、权限管理与 SQL 执行审计'],
    enTag: 'Experimental MySQL protocol proxy',
    enChips: ['Loads SQL data into RAM for fast reads', 'Also handles user authentication, permission management and SQL execution audit'] },
  { repo: 'MQ', slug: 'mq', cat: 'data',
    zhTag: 'MQ — 事件驱动的模块化消息框架（Spring Boot 4 + JPA + H2）',
    zhChips: ['模块生命周期管理、依赖感知启动顺序', '支持通配符的事件总线'],
    enTag: 'MQ — event-driven modular messaging framework (Spring Boot 4 + JPA + H2)',
    enChips: ['Module lifecycle management, dependency-aware start order', 'Wildcard event bus'] },
  { repo: 'bit-mobile', slug: 'bitmobile', cat: 'ai',
    zhTag: 'BIT 安卓伴侣端（原生 Kotlin / Jetpack Compose）',
    zhChips: ['扫码配对桌面端', '随身对话 / 工具审批', 'LAN·IPv6·云中继多路连接'],
    enTag: 'BIT Android companion (native Kotlin / Jetpack Compose)',
    enChips: ['Pair with the desktop by QR code', 'Chat and approve tools on the go', 'LAN, IPv6 and cloud relay connections'] },
  { repo: 'TentacleTool', slug: 'tentacletool', cat: 'ai',
    zhTag: '触手怪的 MCP 工具集（monorepo）',
    zhChips: ['一个文件夹 = 一个独立工具集', '全部零依赖 Node 原生实现', '走 MCP Streamable HTTP 协议各自监听端口'],
    enTag: 'BrainTentacle\'s MCP tool collection (monorepo)',
    enChips: ['One folder = one standalone toolset', 'All zero-dependency native Node implementations', 'Each speaks MCP Streamable HTTP on its own port'] },
];

const CATS = {
  infra: ['网关与基础设施', 'Gateway & infrastructure'],
  ai: ['AI Agent 工具链', 'AI agent tooling'],
  media: ['音频与图像', 'Audio & imagery'],
  webapp: ['Web 应用', 'Web app'],
  lib: ['库与 SDK', 'Library & SDK'],
  security: ['安全与网络诊断', 'Security & network diagnostics'],
  lang: ['语言与解释器', 'Language & interpreter'],
  data: ['数据与存储', 'Data & storage'],
  tool: ['桌面小工具', 'Desktop utility'],
};

const errors = [];
const slugs = new Set();
for (const p of PRODUCTS) {
  const f = byRepo[p.repo];
  if (!f) { errors.push(`${p.repo}: no collected facts`); continue; }
  if (slugs.has(p.slug)) errors.push(`${p.repo}: duplicate slug ${p.slug}`);
  slugs.add(p.slug);
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(p.slug) || p.slug.length > 40) errors.push(`${p.repo}: bad slug ${p.slug}`);
  if (p.zhChips.length !== p.enChips.length) errors.push(`${p.repo}: chip count mismatch zh=${p.zhChips.length} en=${p.enChips.length}`);
  if (!f.desc.includes(p.zhTag)) errors.push(`${p.repo}: zhTag is not verbatim from the description`);
  for (const c of p.zhChips) if (!f.desc.includes(c)) errors.push(`${p.repo}: chip not verbatim: ${c}`);
}
if (errors.length) {
  console.error('FACT CHECK FAILED:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function favicon(name) {
  const initial = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase() || 'Y';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#0a0c0f"/><text x="32" y="45" font-family="monospace" font-size="34" fill="#ff6b3d" text-anchor="middle">${initial}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function dictJs(obj) {
  return Object.keys(obj).map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(obj[k])}`).join(',\n');
}

function page(p) {
  const f = byRepo[p.repo];
  const branch = branches[p.repo] || 'main';
  const repoUrl = 'https://github.com/yxpil/' + p.repo;
  const host = p.slug + '.yxpil.com';
  const hasRelease = f.tag !== 'no-release';
  const relDate = (f.tagDate || '').slice(0, 10);
  const docsMd = (f.docs || '').split(',').filter(n => n.endsWith('.md'));
  // Some descriptions already open with the product name; don't print it twice in <title>.
  const startsWithName = new RegExp('^\\s*' + p.repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(p.zhTag);
  const titleZh = startsWithName ? p.zhTag : `${f.repo} — ${p.zhTag}`;
  const titleEn = new RegExp('^\\s*' + p.repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(p.enTag)
    ? p.enTag : `${p.enTag} — ${f.repo}`;

  const links = [{ zh: 'README', en: 'README', url: `${repoUrl}/blob/${branch}/README.md` }];
  docsMd.forEach(n => links.push({ zh: n, en: n, url: `${repoUrl}/blob/${branch}/docs/${n}` }));
  if (hasRelease) links.push({ zh: 'Release 说明', en: 'Release notes', url: `${repoUrl}/releases/latest` });
  if (f.homepage) links.push({ zh: '在线页面', en: 'Hosted page', url: f.homepage });

  const en = {};
  en['eyebrow'] = CATS[p.cat][1];
  en['tagline'] = p.enTag;
  en['lede'] = p.enTag + ' — ' + p.enChips.join(' · ') + '.';
  p.enChips.forEach((c, i) => { en['chip.' + i] = c; });
  links.forEach((l, i) => { en['link.' + i] = l.en; });
  en['chips.title'] = 'What it does';
  en['get.title'] = 'Get it';
  en['get.body'] = hasRelease
    ? (f.assets > 0
      ? `Latest release ${f.tag}${relDate ? ', published ' + relDate : ''}, with ${f.assets} published asset${f.assets === 1 ? '' : 's'}. Archives and installers are listed on the GitHub Releases page.`
      : `Latest release ${f.tag}${relDate ? ', published ' + relDate : ''}, with notes on the GitHub Releases page.`)
    : 'No published binaries so far: build from source. The README describes the toolchain and the run command.';
  en['docs.title'] = 'Read';
  en['cta.download'] = 'Download latest';
  en['cta.repo'] = 'Source';
  en['skip'] = 'Skip to content';
  en['footer.served'] = 'This page is one static file, served by ONRouter.';
  en['footer.more'] = 'Other projects';
  en['meta.title'] = titleEn;

  const zh = {};
  zh['eyebrow'] = CATS[p.cat][0];
  zh['chips.title'] = '它能做什么';
  zh['get.title'] = '获取';
  zh['get.body'] = hasRelease
    ? (f.assets > 0
      ? `最新 release ${f.tag}${relDate ? '（' + relDate + '）' : ''}，随包 ${f.assets} 个产物。压缩包与安装包在 GitHub Releases 页面上。`
      : `最新 release ${f.tag}${relDate ? '（' + relDate + '）' : ''}，产物清单见 GitHub Releases 页面。`)
    : '还没有发布过二进制产物，从源码构建：仓库 README 写了工具链和启动命令。';
  zh['docs.title'] = '阅读';
  zh['cta.download'] = '下载最新版';
  zh['cta.repo'] = '源码';
  zh['skip'] = '跳到正文';
  zh['footer.served'] = '本页是一个静态文件，由 ONRouter 提供。';
  zh['footer.more'] = '其他项目';
  zh['meta.title'] = titleZh;
  zh['meta.description'] = f.desc;

  const chipLis = p.zhChips.map((c, i) => `        <li data-i18n="chip.${i}">${esc(c)}</li>`).join('\n');
  const linkLis = links.map((l, i) => `        <li><a href="${esc(l.url)}" rel="noopener"><span data-i18n="link.${i}">${esc(l.zh)}</span><span aria-hidden="true">↗</span></a></li>`).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleZh)}</title>
<meta name="description" id="meta-description" content="${esc(f.desc)}">
<link rel="canonical" href="https://${host}/">
<meta name="theme-color" content="#0a0c0f">
<meta property="og:type" content="website">
<meta property="og:url" content="https://${host}/">
<meta property="og:locale" id="og-locale" content="zh_CN">
<meta property="og:title" id="og-title" content="${esc(titleZh)}">
<meta property="og:description" id="og-description" content="${esc(p.zhChips.join('、'))}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${favicon(f.repo)}" type="image/svg+xml">
<style>
  :root {
    --bg: #0a0c0f; --panel: #101419; --line: #232a32; --line-soft: #1a2027;
    --text: #e9e6df; --muted: #9aa3ad; --dim: #6c7681; --accent: #ff6b3d;
    --sans: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.65; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 0 22px; }
  header { border-bottom: 1px solid var(--line-soft); position: sticky; top: 0; background: rgba(10,12,15,.92); z-index: 5; }
  .bar { display: flex; align-items: center; gap: 16px; height: 58px; }
  .brand { font-family: var(--mono); font-size: 15px; letter-spacing: .03em; color: var(--text); text-decoration: none; }
  .bar-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
  .bar-right a, .lang-toggle { font-family: var(--mono); font-size: 12.5px; color: var(--muted); text-decoration: none; }
  .lang-toggle { background: none; border: 1px solid var(--line); border-radius: 3px; padding: 4px 9px; cursor: pointer; }
  .lang-toggle:hover, .bar-right a:hover { color: var(--accent); border-color: var(--accent); }
  .skip { position: absolute; left: -9999px; }
  .skip:focus { position: static; }
  .hero { padding: 72px 0 34px; }
  .eyebrow { font-family: var(--mono); font-size: 11.5px; letter-spacing: .18em; color: var(--dim); margin: 0 0 14px; }
  h1 { font-size: clamp(26px, 5vw, 42px); line-height: 1.18; margin: 0 0 14px; letter-spacing: -.02em; font-weight: 660; }
  .lede { font-size: 16.5px; color: var(--muted); margin: 0; max-width: 66ch; }
  .lede, .chips li, .get, h1, .docs a span { overflow-wrap: anywhere; }
  .cta { display: flex; flex-wrap: wrap; gap: 12px; margin: 30px 0 0; }
  .btn { font-family: var(--mono); font-size: 13.5px; text-decoration: none; border: 1px solid var(--line); color: var(--text); padding: 11px 18px; border-radius: 3px; }
  .btn.primary { background: var(--accent); border-color: var(--accent); color: #12141a; font-weight: 600; }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .btn.primary:hover { color: #12141a; }
  section { padding: 40px 0; border-top: 1px solid var(--line-soft); }
  h2 { font-size: 20px; margin: 0 0 4px; letter-spacing: -.01em; }
  .chips { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 1px; background: var(--line-soft); border: 1px solid var(--line-soft); border-radius: 3px; overflow: hidden; }
  .chips li { background: var(--panel); padding: 13px 16px; font-size: 15px; }
  .get { margin: 18px 0 0; color: var(--muted); font-size: 15px; max-width: 66ch; }
  .docs { list-style: none; margin: 20px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--line-soft); border: 1px solid var(--line-soft); border-radius: 3px; overflow: hidden; }
  .docs li a { display: flex; justify-content: space-between; gap: 12px; padding: 13px 16px; background: var(--panel); color: var(--text); text-decoration: none; font-family: var(--mono); font-size: 12.5px; }
  .docs li a:hover { background: #13181e; color: var(--accent); }
  footer { border-top: 1px solid var(--line-soft); padding: 26px 0 44px; color: var(--dim); font-size: 13px; }
  footer p { margin: 0 0 8px; }
  footer a { color: var(--muted); text-decoration: none; border-bottom: 1px solid var(--line); }
  footer a:hover { color: var(--accent); border-color: var(--accent); }
  @media (max-width: 640px) { .docs { grid-template-columns: minmax(0, 1fr); } .hero { padding: 48px 0 26px; } }
</style>
<noscript><style>.lang-toggle { display: none; }</style></noscript>
<script>
(function () {
  var lang = "";
  try {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "zh" || q === "en") lang = q;
  } catch (e) {}
  if (!lang) {
    try {
      var stored = localStorage.getItem("${p.slug}-lang");
      if (stored === "zh" || stored === "en") lang = stored;
    } catch (e) {}
  }
  if (!lang) {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    lang = "en";
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).toLowerCase();
      if (code.indexOf("zh") === 0) { lang = "zh"; break; }
      if (code.indexOf("en") === 0) { lang = "en"; break; }
    }
  }
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.documentElement.setAttribute("data-lang", lang);
  if (lang === "en") {
    document.documentElement.setAttribute("data-i18n-pending", "");
    setTimeout(function () { document.documentElement.removeAttribute("data-i18n-pending"); }, 1500);
  }
})();
</script>
</head>
<body>
<a class="skip" href="#main" data-i18n="skip">跳到正文</a>
<header>
  <div class="wrap bar">
    <a class="brand" href="https://${host}/">${esc(f.repo)}</a>
    <div class="bar-right">
      <a href="${repoUrl}" rel="noopener" data-i18n="cta.repo">源码</a>
      <button class="lang-toggle" id="lang-toggle" type="button">EN</button>
    </div>
  </div>
</header>
<main id="main">
  <div class="wrap">
    <div class="hero">
      <p class="eyebrow" data-i18n="eyebrow">${esc(CATS[p.cat][0])}</p>
      <h1 data-i18n="tagline">${esc(p.zhTag)}</h1>
      <p class="lede" data-i18n="lede">${esc(f.desc)}</p>
      <p class="cta">
        ${hasRelease
          ? `<a class="btn primary" href="https://${host}/download" data-i18n="cta.download">下载最新版</a>`
          : `<a class="btn primary" href="${repoUrl}" rel="noopener" data-i18n="cta.download">下载最新版</a>`}
        <a class="btn" href="${repoUrl}" rel="noopener" data-i18n="cta.repo">源码</a>
      </p>
    </div>

    <section id="capabilities">
      <h2 data-i18n="chips.title">它能做什么</h2>
      <ul class="chips">
${chipLis}
      </ul>
    </section>

    <section id="get">
      <h2 data-i18n="get.title">获取</h2>
      <p class="get" data-i18n="get.body">${esc(zh['get.body'])}</p>
      <h2 style="margin-top:34px" data-i18n="docs.title">阅读</h2>
      <ul class="docs">
${linkLis}
      </ul>
    </section>
  </div>
</main>
<footer>
  <div class="wrap">
    <p data-i18n="footer.served">本页是一个静态文件，由 ONRouter 提供。</p>
    <p><a href="https://yxpil.com/" rel="noopener" data-i18n="footer.more">其他项目</a> · <a href="${repoUrl}" rel="noopener">${esc(f.repo)} on GitHub</a></p>
  </div>
</footer>
<script>
(function () {
  var root = document.documentElement;
  var KEY = "${p.slug}-lang";
  var toggle = document.getElementById("lang-toggle");
  var en = {
${dictJs(en)}
  };
  var zh = {
${dictJs(zh)}
  };
  var zhMarkup = {};
  Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
    zhMarkup[el.getAttribute("data-i18n")] = el.innerHTML;
  });
  function apply(next) {
    var english = next === "en";
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      var key = el.getAttribute("data-i18n");
      var value = english ? en[key] : zhMarkup[key];
      if (typeof value === "string") el.innerHTML = value;
    });
    document.title = english ? en["meta.title"] : zh["meta.title"];
    var md = document.getElementById("meta-description");
    if (md) md.setAttribute("content", english ? en["lede"] : zh["meta.description"]);
    var ogT = document.getElementById("og-title");
    if (ogT) ogT.setAttribute("content", english ? en["meta.title"] : zh["meta.title"]);
    var ogD = document.getElementById("og-description");
    if (ogD) ogD.setAttribute("content", english ? en["chip.0"] + ". " : zh["meta.description"]);
    var ogL = document.getElementById("og-locale");
    if (ogL) ogL.setAttribute("content", english ? "en_US" : "zh_CN");
    root.lang = english ? "en" : "zh-CN";
    root.setAttribute("data-lang", english ? "en" : "zh");
    if (toggle) {
      toggle.textContent = english ? "中文" : "EN";
      toggle.lang = english ? "zh-CN" : "en";
      toggle.setAttribute("aria-label", english ? "切换到中文" : "Switch to English");
    }
  }
  function current() { return root.getAttribute("data-lang") === "en" ? "en" : "zh"; }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = current() === "zh" ? "en" : "zh";
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
      try {
        var url = new URL(location.href);
        url.searchParams.set("lang", next);
        history.replaceState(null, "", url.toString());
      } catch (e) {}
    });
  }
  apply(current());
  root.removeAttribute("data-i18n-pending");
})();
</script>
</body>
</html>
`;
}

fs.mkdirSync(DIR + '/dist', { recursive: true });
const manifest = [];
for (const p of PRODUCTS) {
  const f = byRepo[p.repo];
  const host = p.slug + '.yxpil.com';
  fs.mkdirSync(`${DIR}/dist/${host}`, { recursive: true });
  fs.writeFileSync(`${DIR}/dist/${host}/index.html`, page(p));
  manifest.push({ host, slug: p.slug, repo: p.repo, tag: f.tag, hasRelease: f.tag !== 'no-release', assets: f.assets });
}
fs.writeFileSync(DIR + '/dist/manifest.json', JSON.stringify(manifest, null, 2));
console.log('generated', manifest.length, 'sites ->', DIR + '/dist');
