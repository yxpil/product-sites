// Author: yxpil (scratch browser check) — headless Chrome pass over every generated product page.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = require("path").join(__dirname, "dist");
const PORT = 8127;
const CDP_PORT = 9228;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const check = (c, m) => { if (!c) failures.push(m); };
const manifest = JSON.parse(fs.readFileSync(ROOT + "/manifest.json", "utf8"));

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  fs.readFile(path.join(ROOT, p), (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(data);
  });
});

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id) {
        const q = this.pending.get(msg.id);
        if (q) { this.pending.delete(msg.id); msg.error ? q.reject(new Error(JSON.stringify(msg.error))) : q.resolve(msg.result); }
      } else this.listeners.forEach((f) => f(msg));
    });
  }
  on(f) { this.listeners.push(f); }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { resolve: res, reject: rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error("timeout " + method)); } }, 20000);
    });
  }
}
const getJson = (url) => new Promise((res, rej) => {
  http.get(url, (r) => { let s = ""; r.on("data", (d) => (s += d)); r.on("end", () => { try { res(JSON.parse(s)); } catch (e) { rej(e); } }); }).on("error", rej);
});

(async () => {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${path.join(__dirname, "chrome-profile-prod")}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--disable-dev-shm-usage", "about:blank"], { stdio: "ignore" });
  const pid = chrome.pid;
  try {
    let v = null;
    for (let i = 0; i < 60; i++) { try { v = await getJson(`http://127.0.0.1:${CDP_PORT}/json/version`); break; } catch (e) { await sleep(250); } }
    if (!v) throw new Error("no CDP");
    const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
    const cdp = new CDP(ws);
    const errors = [];
    cdp.on((m) => {
      if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.text);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value || a.description || "").join(" "));
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text);
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

    async function load(m, lang, width) {
      await cdp.send("Emulation.setLocaleOverride", { locale: lang === "zh" ? "zh-CN" : "en-US" });
      await cdp.send("Emulation.setUserAgentOverride", { userAgent: UA, acceptLanguage: lang === "zh" ? "zh-CN,zh;q=0.9" : "en-US,en;q=0.9" });
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: 900 });
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/${m.host}/index.html?lang=${lang}&t=${width}` });
      for (let i = 0; i < 100; i++) {
        const { result } = await cdp.send("Runtime.evaluate", { expression: "document.readyState", returnByValue: true });
        if (result.value === "complete") break;
        await sleep(30);
      }
      await sleep(80);
    }
    async function snap() {
      const { result } = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const d = document.documentElement, q = s => document.querySelector(s);
          const chips = Array.from(document.querySelectorAll(".chips li"));
          const links = Array.from(document.querySelectorAll(".docs a"));
          const clipped = Array.from(document.querySelectorAll("h1,.lede,.chips li,.get,.docs a,.btn,footer p"))
            .filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className || e.tagName);
          return {
            lang: d.lang, pending: d.hasAttribute("data-i18n-pending"), width: innerWidth, scroll: d.scrollWidth,
            h1: q("h1").innerText.trim(), h1h: Math.round(q("h1").getBoundingClientRect().height),
            chips: chips.length, chipText: chips.map(li => li.innerText).join(" | "),
            linkCount: links.length, linkText: links.map(a => a.querySelector("span").innerText).join(","),
            cta: q(".cta .btn.primary").getAttribute("href"),
            ctaText: q(".cta .btn.primary").innerText,
            getBody: q(".get").innerText,
            mainText: q("main").innerText + " " + q("footer").innerText, clipped: clipped,
            cols: getComputedStyle(q(".docs")).gridTemplateColumns.split(" ").length,
            stored: (() => { try { const k = Object.keys(localStorage).filter(x => x.endsWith("-lang")); return k.map(x => x + "=" + localStorage.getItem(x)).join(","); } catch (e) { return "err"; } })(),
          };
        })()`, returnByValue: true
      });
      return result.value;
    }

    let zhChipsRef = 0;
    for (const m of manifest) {
      await load(m, "zh", 1440);
      const zh = await snap();
      check(zh.lang === "zh-CN", `${m.host} zh lang ${zh.lang}`);
      check(!zh.pending, `${m.host} zh pending`);
      check(zh.scroll <= zh.width + 1, `${m.host} zh overflow ${zh.scroll}/${zh.width}`);
      check(zh.chips > 0 && zh.h1.length > 0, `${m.host} zh empty`);
      check(/[\u4e00-\u9fff]/.test(zh.mainText), `${m.host} zh has no Chinese`);
      check(zh.clipped.length === 0, `${m.host} zh clipped ${JSON.stringify(zh.clipped)}`);
      check(m.hasRelease ? zh.cta === `https://${m.host}/download` : /github\.com/.test(zh.cta), `${m.host} zh cta ${zh.cta}`);
      zhChipsRef = zh.chips;

      await load(m, "en", 1440);
      const en = await snap();
      check(en.lang === "en", `${m.host} en lang ${en.lang}`);
      check(!en.pending, `${m.host} en pending`);
      check(en.scroll <= en.width + 1, `${m.host} en overflow ${en.scroll}/${en.width}`);
      check(en.chips === zhChipsRef, `${m.host} en chip count ${en.chips} vs zh ${zhChipsRef}`);
      check(!/[\u4e00-\u9fff]/.test(en.mainText), `${m.host} EN text has Chinese: ${(en.mainText.match(/[\u4e00-\u9fff]+/g) || []).slice(0, 3)}`);
      check(en.chipText !== zh.chipText || !/[\u4e00-\u9fff]/.test(en.chipText), `${m.host} EN chips untranslated`);
      check(en.clipped.length === 0, `${m.host} en clipped ${JSON.stringify(en.clipped)}`);
      check(!/undefined|NaN/.test(en.mainText), `${m.host} en undefined text`);
      check(en.cols === 2, `${m.host} en desktop cols ${en.cols}`);

      await load(m, "zh", 390);
      const mob = await snap();
      check(mob.scroll <= mob.width + 1, `${m.host} mobile overflow ${mob.scroll}/${mob.width}`);
      check(mob.cols === 1, `${m.host} mobile cols ${mob.cols}`);
      check(mob.clipped.length === 0, `${m.host} mobile clipped ${JSON.stringify(mob.clipped)}`);

      // manual toggle persists
      await cdp.send("Runtime.evaluate", { expression: "document.getElementById('lang-toggle').click()" });
      await sleep(60);
      const after = await snap();
      check(after.lang === "en" && /-lang=en/.test(after.stored.replace(/"/g, "")), `${m.host} toggle ${after.lang} stored=${after.stored}`);
    }

    console.log(`pages=${manifest.length} failures=${failures.length} consoleErrors=${errors.length}`);
    for (const f of failures) console.log("  FAIL " + f);
    if (errors.length) console.log("  ERR", errors.slice(0, 10));
    await cdp.send("Browser.close").catch(() => {});
    ws.close();
  } finally {
    server.close();
    try { process.kill(pid); } catch (e) {}
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
