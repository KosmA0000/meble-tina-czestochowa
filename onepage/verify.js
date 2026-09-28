'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawn, execFileSync } = require('node:child_process');
const parse5 = require(path.resolve(__dirname, '..', 'zrodlo', 'node_modules', 'parse5'));
const { ROOMS, ROOM_CAPTIONS, PRODUCT_COPY, imageDimensions } = require('./build.js');

const ROOT = __dirname;
const SOURCE = path.join(ROOT, '..', 'do-ai');
const DIST = path.join(ROOT, 'dist');
const HTML_FILE = path.join(DIST, 'index.html');
const CSS_FILE = path.join(DIST, 'assets', 'css', 'style.css');
const JS_FILE = path.join(DIST, 'assets', 'js', 'main.js');
const REPORT_FILE = path.join(ROOT, 'verify-wynik.txt');
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const failures = [];
const notes = [];

function attrs(node) {
  return Object.fromEntries((node.attrs || []).map((attribute) => [attribute.name, attribute.value]));
}
function classes(node) {
  return new Set((attrs(node).class || '').split(/\s+/).filter(Boolean));
}
function allNodes(root) {
  const result = [];
  (function visit(node) {
    result.push(node);
    for (const child of node.childNodes || []) visit(child);
  })(root);
  return result;
}
function textOf(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(textOf).join(' ');
}
function visibleTextNodes(root, { preview = false } = {}) {
  const result = [];
  function visit(node) {
    if (node.nodeName === '#text') {
      result.push(node.value);
      return;
    }
    const at = attrs(node);
    const classList = classes(node);
    if (['script', 'style', 'svg', 'noscript'].includes(node.tagName)) return;
    if (Object.prototype.hasOwnProperty.call(at, 'hidden') || at['aria-hidden'] === 'true') return;
    if (classList.has('war') || classList.has('product-fallback')) return;
    if (classList.has('slide-photo') && !classList.has('is-active')) return;
    if (preview && classList.has('label') && textOf(node).replace(/\s+/g, ' ').trim() === 'Telefon i e-mail') return;
    for (const child of node.childNodes || []) visit(child);
  }
  visit(root);
  return result;
}
function words(value) {
  return value.toLocaleLowerCase('pl').match(/[\p{L}\p{N}]+/gu) || [];
}
function parseDocument(file) {
  const html = fs.readFileSync(file, 'utf8');
  const parseErrors = [];
  const document = parse5.parse(html, { onParseError: (error) => parseErrors.push(error) });
  return { html, document, parseErrors, nodes: allNodes(document) };
}
function sourceImages(directory) {
  const found = [];
  if (!fs.existsSync(directory)) return found;
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase())) found.push(full);
    }
  }
  visit(directory);
  return found;
}
function relativeSourceFromUrl(url) {
  const prefix = 'assets/img/';
  if (!url.startsWith(prefix)) return null;
  try {
    return url.slice(prefix.length).split('/').map(decodeURIComponent).join(path.sep);
  } catch {
    return null;
  }
}
function fail(message) { failures.push(message); }


async function verifyMobileWidth() {
  const candidates = [
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];
  const browser = candidates.find((candidate) => fs.existsSync(candidate));
  if (!browser) return { ok: false, error: 'Chrome lub Edge nie jest dostępny do pomiaru 360 px.' };

  const profile = path.resolve(ROOT, '.verify-chrome-' + process.pid);
  const rootPrefix = path.resolve(ROOT) + path.sep;
  if (!profile.startsWith(rootPrefix)) return { ok: false, error: 'Ścieżka profilu przeglądarki wychodzi poza onepage/.' };
  const url = require('node:url').pathToFileURL(HTML_FILE).href;
  const child = spawn(browser, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', '--window-size=360,900', '--remote-debugging-port=0',
    '--user-data-dir=' + profile, 'about:blank'
  ], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  let socket = null;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    let port = 0;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (fs.existsSync(portFile)) {
        port = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]);
        break;
      }
      await delay(100);
    }
    if (!port) throw new Error('Chromium nie otworzył portu DevTools.');

    const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
    const target = targets.find((entry) => entry.type === 'page');
    if (!target) throw new Error('Chromium nie udostępnił karty pomiarowej.');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    const pending = new Map();
    let sequence = 0;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    };
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    const pageLoaded = new Promise((resolve) => {
      const listener = (event) => {
        if (JSON.parse(event.data).method !== 'Page.loadEventFired') return;
        socket.removeEventListener('message', listener);
        resolve();
      };
      socket.addEventListener('message', listener);
    });
    await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 900, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url });
    await Promise.race([pageLoaded, delay(10000)]);
    await delay(900);
    const evaluation = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({viewport:innerWidth,rootClient:document.documentElement.clientWidth,rootScroll:document.documentElement.scrollWidth,bodyClient:document.body.clientWidth,bodyScroll:document.body.scrollWidth})',
      returnByValue: true
    });
    const metrics = JSON.parse(evaluation.result.value);
    const ok = metrics.viewport === 360 && metrics.rootClient === metrics.rootScroll && metrics.bodyClient === metrics.bodyScroll;
    return { ok, metrics };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    if (socket) {
      try {
        const browserClosed = new Promise((resolve) => socket.addEventListener('close', resolve, { once: true }));
        socket.send(JSON.stringify({ id: 0, method: 'Browser.close' }));
        await Promise.race([browserClosed, delay(1200)]);
      } catch {}
      try { socket.close(); } catch {}
    }
    if (child.pid) try { execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
    await delay(600);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        fs.rmSync(profile, { recursive: true, force: true });
        if (!fs.existsSync(profile)) break;
      } catch {}
      await delay(150);
    }
  }
}

async function run() {
  const htmlInfo = parseDocument(HTML_FILE);
  const css = fs.readFileSync(CSS_FILE, 'utf8');
  const js = fs.readFileSync(JS_FILE, 'utf8');
  const previewInfo = parseDocument(path.join(ROOT, 'podglad', 'index.html'));
  const pageBody = htmlInfo.nodes.find((node) => node.tagName === 'body');
  const previewBody = previewInfo.nodes.find((node) => node.tagName === 'body');
  if (!pageBody || !previewBody) fail('Brak elementu body w wygenerowanym HTML lub podglądzie.');

  if (htmlInfo.parseErrors.length) fail(`Parse5 zgłosił błędy HTML: ${htmlInfo.parseErrors.map((entry) => entry.code).join(', ')}`);
  if (previewInfo.parseErrors.length) fail(`Parse5 zgłosił błędy w podglądzie: ${previewInfo.parseErrors.map((entry) => entry.code).join(', ')}`);

  const ids = new Set();
  const duplicateIds = [];
  for (const node of htmlInfo.nodes) {
    if (!node.tagName) continue;
    const at = attrs(node);
    if (at.id) {
      if (ids.has(at.id)) duplicateIds.push(at.id);
      ids.add(at.id);
    }
  }
  if (duplicateIds.length) fail(`Powtórzone id: ${[...new Set(duplicateIds)].join(', ')}`);
  const brokenAnchors = [];
  for (const node of htmlInfo.nodes) {
    if (node.tagName !== 'a') continue;
    const href = attrs(node).href || '';
    if (href.startsWith('#') && href.length > 1 && !ids.has(decodeURIComponent(href.slice(1)))) brokenAnchors.push(href);
  }
  if (brokenAnchors.length) fail(`Kotwice bez celu: ${[...new Set(brokenAnchors)].join(', ')}`);

  const images = htmlInfo.nodes.filter((node) => node.tagName === 'img');
  const usedSourcePaths = new Set();
  const badImageAttrs = [];
  for (const node of images) {
    const at = attrs(node);
    const relative = relativeSourceFromUrl(at.src || '');
    if (!relative) {
      badImageAttrs.push(`${at.src || '(brak src)'}: ścieżka poza assets/img`);
      continue;
    }
    usedSourcePaths.add(relative.toLocaleLowerCase('en'));
    const diskPath = path.join(DIST, 'assets', 'img', relative);
    if (!fs.existsSync(diskPath)) {
      badImageAttrs.push(`${at.src}: plik nie istnieje`);
      continue;
    }
    if (!at.alt || !Number(at.width) || !Number(at.height)) badImageAttrs.push(`${at.src}: brak alt lub width/height`);
    if (at.decoding !== 'async') badImageAttrs.push(`${at.src}: brak decoding="async"`);
    if (!at.src.includes('1_hero/') && at.loading !== 'lazy') badImageAttrs.push(`${at.src}: obraz poza hero nie jest lazy`);
    const dimensions = imageDimensions(fs.readFileSync(diskPath), at.src);
    if (Number(at.width) !== dimensions.width || Number(at.height) !== dimensions.height) {
      badImageAttrs.push(`${at.src}: width/height nie zgadzają się z nagłówkiem obrazu`);
    }
    const normalized = relative.split(path.sep).join('/');
    if (normalized.startsWith('1_hero/')) {
      if (at.alt !== 'Narożnik modułowy w aranżacji salonu') badImageAttrs.push(`${at.src}: błędny alt hero`);
      if (at.fetchpriority !== 'high') badImageAttrs.push(`${at.src}: hero bez fetchpriority="high"`);
    } else if (normalized.startsWith('3_meble-wypoczynkowe/')) {
      const key = path.basename(relative, path.extname(relative));
      const expectedAlt = PRODUCT_COPY[key]?.title || key;
      if (at.alt !== expectedAlt) badImageAttrs.push(`${at.src}: alt powinien brzmieć „${expectedAlt}”`);
    } else if (normalized.startsWith('4_galerie-pomieszczen/')) {
      const folder = normalized.split('/')[1];
      const room = ROOMS.find((entry) => entry.folder.endsWith(folder));
      if (room && at.alt !== room.name) badImageAttrs.push(`${at.src}: alt powinien brzmieć „${room.name}”`);
    }
  }
  if (badImageAttrs.length) fail(`Problemy z obrazami: ${badImageAttrs.slice(0, 8).join('; ')}`);

  const sourceFiles = sourceImages(SOURCE);
  const expectedSourcePaths = new Set(sourceFiles.map((file) => path.relative(SOURCE, file).toLocaleLowerCase('en')));
  const unusedSourceImages = [...expectedSourcePaths].filter((file) => !usedSourcePaths.has(file));
  if (unusedSourceImages.length) fail(`Nieużyte zdjęcia źródłowe: ${unusedSourceImages.join(', ')}`);
  const distImages = sourceImages(path.join(DIST, 'assets', 'img'));
  if (distImages.length !== sourceFiles.length) fail(`Liczba obrazów w dist (${distImages.length}) różni się od źródeł (${sourceFiles.length}).`);
  if (usedSourcePaths.size !== sourceFiles.length) fail(`W HTML użyto ${usedSourcePaths.size} z ${sourceFiles.length} zdjęć źródłowych.`);

  const cssRadiusError = /(?:^|[;{\s])border-radius\s*:\s*(?:0\b|2px\b)(?:\s*!important)?\s*;/im;
  if (cssRadiusError.test(css)) fail('CSS zawiera border-radius ustawione dokładnie na 0 lub 2px.');
  for (const token of ['--r-lg', '--r-md', '--r-sm', '--r-pill']) if (!css.includes(token)) fail(`Brak tokenu zaokrąglenia ${token}.`);
  if (/url\s*\(/i.test(css)) fail('CSS zawiera url(), więc może odwoływać się do obrazu spoza do-ai.');
  if (htmlInfo.html.includes('class="war"') || /\?w=b/.test(htmlInfo.html)) fail('HTML zawiera przełącznik wariantów.');

  const tabs = htmlInfo.nodes.filter((node) => node.tagName === 'button' && attrs(node).role === 'tab');
  const panels = htmlInfo.nodes.filter((node) => classes(node).has('room-panel'));
  const expectedRooms = ROOMS.filter((room) => sourceImages(path.join(SOURCE, room.folder)).length > 0);
  if (tabs.length !== expectedRooms.length || panels.length !== expectedRooms.length) {
    fail(`Zakładki/panele pomieszczeń nie zgadzają się ze źródłami (${tabs.length}/${panels.length}, oczekiwano ${expectedRooms.length}).`);
  }
  if (panels.filter((panel) => Object.prototype.hasOwnProperty.call(attrs(panel), 'hidden')).length !== Math.max(0, panels.length - 1)) {
    fail('Początkowy stan paneli nie ukrywa wszystkich poza pierwszym.');
  }

  try {
    new vm.Script(js, { filename: JS_FILE });
  } catch (error) {
    fail(`Błąd składni main.js: ${error.message}`);
  }
  for (const name of ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js']) {
    const file = path.join(DIST, 'assets', 'vendor', name);
    if (!fs.existsSync(file)) {
      fail(`Brak biblioteki ${name}.`);
      continue;
    }
    const vendor = fs.readFileSync(file, 'utf8');
    if (!vendor.includes('3.13.0')) fail(`${name} nie jest bundlami GSAP 3.13.0.`);
    if (!htmlInfo.html.includes(`assets/vendor/${name}`)) fail(`${name} nie jest podłączony w HTML.`);
  }

  const expectedText = [
    ...visibleTextNodes(previewBody, { preview: true }),
    'Meble do każdego wnętrza.', 'Zapytaj w salonie', 'MEBLE TINA', 'Telefon i e-mail', 'Pomieszczenia', '01 / 06', '01 / 21', '01 / 16', '01 / 09', '01 / 08',
    ...ROOMS.flatMap((room) => [room.name, room.description]),
    ...Object.values(ROOM_CAPTIONS).flatMap((captions) => Object.values(captions)),
    ...Object.values(PRODUCT_COPY).flatMap((product) => [product.title, product.description])
  ];
  const productSourceFolder = path.join(SOURCE, '3_meble-wypoczynkowe');
  for (const file of sourceImages(productSourceFolder)) {
    const key = path.basename(file, path.extname(file));
    expectedText.push(PRODUCT_COPY[key]?.title || key);
  }
  const allowedWords = new Set(words(expectedText.join(' ')));
  const visibleText = visibleTextNodes(pageBody).join(' ').replace(/\s+/g, ' ').trim();
  const extras = [...new Set(words(visibleText).filter((word) => !allowedWords.has(word)))].sort(compareWords);
  if (extras.length) fail(`Nadmiarowe słowa w widocznym tekście: ${extras.join(', ')}`);

  const digitsRemainder = visibleText
    .replace(/1984/g, ' ')
    .replace(/Pomieszczenia\s*·\s*0[1-5]/g, ' ')
    .replace(/\b\d{2}\s*\/\s*\d{2}\b/g, ' ') // licznik slajdów NN / NN
    .replace(/162\/170/g, ' ')
    .replace(/\+48\s*504\s*473\s*577/g, ' ')
    .replace(/10\.00\s*[–-]\s*18\.00/g, ' ')
    .replace(/10\.00\s*[–-]\s*14\.00/g, ' ');
  const extraDigits = digitsRemainder.match(/\d+/g) || [];
  if (extraDigits.length) fail(`Niedozwolone liczby w widocznym tekście: ${extraDigits.join(', ')}`);

  const title = htmlInfo.nodes.find((node) => node.tagName === 'title');
  if (!title || textOf(title).trim() !== 'Meble Tina — meble, Częstochowa') fail('Nieprawidłowy title w head.');
  const htmlNode = htmlInfo.nodes.find((node) => node.tagName === 'html');
  if (attrs(htmlNode || {}).lang !== 'pl') fail('Brak lang="pl".');
  if (images.length !== 71) notes.push(`HTML ma ${images.length} znaczników img przy obecnych galeriach.`);
  if (sourceFiles.length !== 33) notes.push(`Katalog do-ai ma teraz ${sourceFiles.length} zdjęć, zamiast bazowych 33.`);

  const mobile = await verifyMobileWidth();
  if (!mobile.ok) fail(`Pomiar 360 px nie powiódł się: ${mobile.error || JSON.stringify(mobile.metrics)}`);

  const lines = [
    `Status: ${failures.length ? 'BŁĄD' : 'PASS'}`,
    `HTML: ${htmlInfo.parseErrors.length} błędów parse5; ${images.length} znaczników img, wszystkie ze źródeł do-ai.`,
    `Zdjęcia: ${usedSourcePaths.size}/${sourceFiles.length} plików źródłowych użytych; pliki, alt i wymiary sprawdzone.`,
    `Zakładki: ${tabs.length} ról tab i ${panels.length} statycznych paneli.` ,
    `Kotwice: ${brokenAnchors.length} uszkodzonych; tekst: ${extras.length} nadmiarowych słów.`,
    `CSS: promienie i tokeny zaokrągleń sprawdzone; url(): ${/url\s*\(/i.test(css) ? 'znaleziono' : 'brak'}.`,
    `Liczby niedozwolone: ${extraDigits.length}.`,
    `Mobile 360 px: ${mobile.metrics ? `html ${mobile.metrics.rootScroll}/${mobile.metrics.rootClient}, body ${mobile.metrics.bodyScroll}/${mobile.metrics.bodyClient}` : 'pomiar niedostępny'}.`,
    'Wniosek: wariant A zachowuje jedną sekcję pomieszczeń z zakładkami; starsze karty kategorii pominięto.',
    'Wniosek: podpisy przedpokoju (LINATE, L\'HOMBRE, SLIM, HOME) przypisane wg kolejności zdjęć i opisów serii na stronie źródłowej.',
    ...notes.map((note) => `UWAGA: ${note}`),
    ...failures.map((failure) => `BŁĄD: ${failure}`)
  ];
  const report = lines.join('\r\n') + '\r\n';
  fs.writeFileSync(REPORT_FILE, report, 'utf8');
  process.stdout.write(report);
  if (failures.length) process.exitCode = 1;
}

function compareWords(a, b) { return a.localeCompare(b, 'en', { sensitivity: 'base' }); }

run();
