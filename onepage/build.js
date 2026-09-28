'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const SOURCE = path.resolve(ROOT, '..', 'do-ai');
const DIST = path.join(ROOT, 'dist');
const IMG_OUT = path.join(DIST, 'assets', 'img');
const VENDOR_OUT = path.join(DIST, 'assets', 'vendor');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VENDOR_FILES = ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js'];
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap&subset=latin-ext';
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Meble+Tina+Bohater%C3%B3w+Katynia+162+Cz%C4%99stochowa';

const ROOMS = [
  { id: 'pokoj-dzienny', name: 'Pokój dzienny', description: 'Miejsce łączące styl z codziennym życiem.', folder: '4_galerie-pomieszczen/01_pokoj-dzienny' },
  { id: 'jadalnia', name: 'Jadalnia', description: 'Wspólny stół i przestrzeń, która sprzyja rozmowie.', folder: '4_galerie-pomieszczen/02_jadalnia' },
  { id: 'sypialnia', name: 'Sypialnia', description: 'Wyciszenie i porządek na koniec dnia.', folder: '4_galerie-pomieszczen/03_sypialnia' },
  { id: 'pokoj-dzieciecy', name: 'Pokój dziecięcy i młodzieżowy', description: 'Przestrzeń, która rośnie razem z domownikami.', folder: '4_galerie-pomieszczen/04_pokoj-dzieciecy' },
  { id: 'przedpokoj', name: 'Przedpokój', description: 'Pierwsze wrażenie, uporządkowane od pierwszego progu.', folder: '4_galerie-pomieszczen/05_przedpokoj' }
];

const ROOM_CAPTIONS = {
  'pokoj-dzienny': {
    '01_cortina': "kolekcja CORTINA",
    '02_toronto': "kolekcja TORONTO",
    '03_toronto': "kolekcja TORONTO",
    '04_toronto': "kolekcja TORONTO",
    '05_shetland': "kolekcja SHETLAND",
    '06_shetland': "kolekcja SHETLAND",
    '07_shetland': "kolekcja SHETLAND",
    '08_summer': "kolekcja SUMMER",
    '09_summer': "kolekcja SUMMER",
    '10_summer': "kolekcja SUMMER",
    '11_summer': "kolekcja SUMMER",
    '12_linate': "kolekcja LINATE",
    '13_linate': "kolekcja LINATE",
    '14_linate': "kolekcja LINATE",
    '15_forest': "kolekcja FOREST",
    '16_forest': "kolekcja FOREST",
    '17_forest': "kolekcja FOREST",
    '18_forest': "kolekcja FOREST",
    '19_pello': "kolekcja PELLO",
    '20_imperial': "kolekcja IMPERIAL",
    '21_imperial-new': "kolekcja IMPERIAL NEW"
  },
  'jadalnia': {
    '01_arko': "jadalnia ARKO",
    '02_naomi': "jadalnia NAOMI",
    '03_summer': "jadalnia SUMMER",
    '04_nicol': "jadalnia NICOL",
    '05_pello': "jadalnia PELLO",
    '06_imperial': "jadalnia IMPERIAL",
    '07_linate': "jadalnia LINATE",
    '08_cortina': "jadalnia CORTINA"
  },
  'sypialnia': {
    '01_linate': "sypialnia LINATE",
    '02_naomi': "sypialnia NAOMI",
    '03_naomi': "sypialnia NAOMI",
    '04_lionel': "sypialnia LIONEL",
    '05_lionel': "sypialnia LIONEL",
    '06_nicol': "sypialnia NICOL",
    '07_nicol': "sypialnia NICOL",
    '08_linate': "sypialnia LINATE",
    '09_pello': "sypialnia PELLO",
    '10_pello': "sypialnia PELLO",
    '11_forest': "kolekcja FOREST",
    '12_forest': "kolekcja FOREST",
    '13_forest': "kolekcja FOREST",
    '14_forest': "kolekcja FOREST",
    '15_aspen': "łóżko ASPEN",
    '16_tokyo': "łóżko TOKYO"
  },
  'pokoj-dzieciecy': {
    '01_angel': "kolekcja ANGEL",
    '02_angel': "kolekcja ANGEL",
    '03_angel': "kolekcja ANGEL",
    '04_angel': "kolekcja ANGEL",
    '05_melody': "sofa MELODY",
    '06_melody': "sofa MELODY",
    '07_melody': "sofa MELODY",
    '08_montana': "narożnik MONTANA",
    '09_trixi': "kanapa TRIXI"
  },
  'przedpokoj': {
    '01_linate': "LINATE",
    '02_lhombre': "L'HOMBRE",
    '03_lhombre': "L'HOMBRE",
    '04_slim': "SLIM",
    '05_home': "HOME",
    '06_home': "HOME"
  }
};
const PRODUCT_COPY = {
  '01_komplety-wypoczynkowe': {
    title: 'Komplety wypoczynkowe',
    description: 'Miejsce, z którego aż nie chce się wstawać.'
  },
  '03_narozniki': {
    title: 'Narożniki',
    description: 'Narożnik to komfortowy mebel przeznaczony przede wszystkim do wypoczynku.'
  },
  'TRENTO_komplet_461x231': { title: 'Komplet TRENTO', description: 'Prosta forma i spokojna tkanina.' },
  'boston000': { title: 'Komplet BOSTON', description: 'Miękkie linie i jasne obicie.' },
  'tokyo01': { title: 'Komplet TOKYO', description: 'Wyraźny kontrast i czysta forma.' },
  'tokyoII01': { title: 'Komplet TOKYO II', description: 'Ta sama linia w innym zestawieniu.' }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function compareName(a, b) {
  return a.localeCompare(b, 'en', { sensitivity: 'base', numeric: false });
}

function listImages(folder) {
  const absolute = path.resolve(SOURCE, folder);
  if (!fs.existsSync(absolute)) return [];
  const found = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        found.push({ fullPath, name: entry.name, key: path.basename(entry.name, path.extname(entry.name)) });
      }
    }
  }
  walk(absolute);
  return found;
}

function compareRelative(a, b) {
  const aName = path.relative(SOURCE, a.fullPath).split(path.sep).join('/');
  const bName = path.relative(SOURCE, b.fullPath).split(path.sep).join('/');
  return compareName(aName, bName);
}

function imageDimensions(buffer, fileName = '') {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) break;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if (frameMarkers.has(marker) && length >= 7) {
        return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
      }
      offset += length;
    }
  }
  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const chunk = buffer.toString('ascii', offset, offset + 4);
      const length = buffer.readUInt32LE(offset + 4);
      const data = offset + 8;
      if (data + length > buffer.length) break;
      if (chunk === 'VP8X' && length >= 10) {
        return { width: 1 + buffer.readUIntLE(data + 4, 3), height: 1 + buffer.readUIntLE(data + 7, 3) };
      }
      if (chunk === 'VP8L' && length >= 5 && buffer[data] === 0x2f) {
        const b1 = buffer[data + 1], b2 = buffer[data + 2], b3 = buffer[data + 3], b4 = buffer[data + 4];
        return { width: 1 + b1 + ((b2 & 0x3f) << 8), height: 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10) };
      }
      if (chunk === 'VP8 ' && length >= 10 && buffer[data + 3] === 0x9d && buffer[data + 4] === 0x01 && buffer[data + 5] === 0x2a) {
        return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
      }
      offset = data + length + (length & 1);
    }
  }
  throw new Error(`Nie odczytano wymiarów obrazu: ${fileName}`);
}

function copyImage(record) {
  const relative = path.relative(SOURCE, record.fullPath);
  const target = path.join(IMG_OUT, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(record.fullPath, target);
  const dimensions = imageDimensions(fs.readFileSync(record.fullPath), relative);
  return {
    key: record.key,
    name: record.name,
    relative,
    url: `assets/img/${relative.split(path.sep).map(encodeURIComponent).join('/')}`,
    width: dimensions.width,
    height: dimensions.height
  };
}

function imageTag(image, alt, highPriority = false) {
  const priority = highPriority ? ' fetchpriority="high"' : '';
  const loading = highPriority ? 'eager' : 'lazy';
  return `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(alt)}" width="${image.width}" height="${image.height}" loading="${loading}" decoding="async"${priority}>`;
}

const arrowRight = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const arrowUp = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>';
const arrowDown = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15m-6-6 6 6 6-6"/></svg>';
const chevronLeft = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5-6.5 6.5 6.5 6.5"/></svg>';
const chevronRight = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg>';

function renderSlider({ label, title, description, items, product = false, reverse = false }) {
  const slideFigures = items.map((item, index) => {
    const itemTitle = item.title || title;
    const itemDescription = item.description || description || '';
    const caption = item.caption || '';
    const activeClass = index === 0 ? ' is-active' : '';
    const imageDimensions = item.image || item;
    const imageStyle = '';
    const figureCaption = product
      ? `<figcaption class="product-fallback"><strong>${escapeHtml(itemTitle)}</strong>${itemDescription ? `<span>${escapeHtml(itemDescription)}</span>` : ''}</figcaption>`
      : caption ? `<figcaption class="photo-cap">${escapeHtml(caption)}</figcaption>` : '';
    return `<figure class="slide-photo${activeClass}"${imageStyle} data-title="${escapeHtml(itemTitle)}" data-copy="${escapeHtml(itemDescription)}" data-caption="${escapeHtml(caption)}">${imageTag(item.image || item, item.alt)}${figureCaption}</figure>`;
  }).join('\n');
  const thumbnails = items.map((item, index) => {
    const name = item.title || title;
    const cap = item.caption ? ` — ${item.caption}` : '';
    return `<button type="button" data-thumb-index="${index}" aria-label="Pokaż zdjęcie ${escapeHtml(name + cap)}" aria-pressed="${index === 0 ? 'true' : 'false'}" tabindex="${index === 0 ? '0' : '-1'}">${imageTag(item.image || item, item.alt)}</button>`;
  }).join('\n');
  const className = `sl${reverse ? ' rev' : ''}`;
  const productAttr = product ? ' data-product="true"' : '';
  const copyClass = product ? ' class="product-dynamic"' : '';
  return `<div class="${className}" data-slider${productAttr} role="region" aria-label="${escapeHtml(title)}">
    <div class="foto">
      <div class="big" tabindex="0" role="group" aria-label="Zdjęcia: ${escapeHtml(title)}">${slideFigures}</div>
      <div class="thumbs">${thumbnails}</div>
    </div>
    <div class="opis">
      <div class="label" data-anim="label">${escapeHtml(label)}</div>
      <h2 data-slide-title data-anim="heading"${product ? ' data-product-title' : ''}${copyClass}>${escapeHtml(items[0].title || title)}</h2>
      <p data-slide-copy data-anim="text"${product ? ' data-product-copy' : ''}${copyClass}>${escapeHtml(items[0].description || description || '')}</p>
      <div class="podpis" data-live-caption aria-live="polite" aria-atomic="true">${escapeHtml(items[0].caption || '')}</div>
      <div class="ster">
        <span class="licz" data-live-count aria-live="polite" aria-atomic="true">01 / ${String(items.length).padStart(2, '0')}</span>
        <button class="arr" type="button" data-slide-prev aria-label="Poprzedni">${chevronLeft}</button>
        <button class="arr" type="button" data-slide-next aria-label="Następny">${chevronRight}</button>
      </div>
      <div><a class="btn" href="#kontakt">Zapytaj w salonie${arrowRight}</a></div>
    </div>
  </div>`;
}

function renderTab(room, index, active) {
  const tabId = `tab-${room.id}`;
  const panelId = `panel-${room.id}`;
  return `<button id="${tabId}" type="button" role="tab" aria-controls="${panelId}" aria-selected="${active ? 'true' : 'false'}" tabindex="${active ? '0' : '-1'}">${escapeHtml(room.name)}</button>`;
}

function renderRoomPanel(room, index, active) {
  const tabId = `tab-${room.id}`;
  const panelId = `panel-${room.id}`;
  const items = room.items.map((item) => ({ ...item, alt: room.name, title: room.name, description: room.description }));
  const slider = renderSlider({ label: `Pomieszczenia · ${String(index + 1).padStart(2, '0')}`, title: room.name, description: room.description, items });
  return `<div id="${panelId}" class="room-panel" role="tabpanel" aria-labelledby="${tabId}"${active ? '' : ' hidden'}>${slider}</div>`;
}

function renderProductTile(item, index) {
  return `<button class="product-tile" type="button" data-slide-to="${index}" aria-pressed="${index === 0 ? 'true' : 'false'}">${imageTag(item.image || item, item.title)}<span>${escapeHtml(item.title)}</span></button>`;
}

function renderDocument({ hero, rooms, products, variant = 'a' }) {
  const roomTabs = rooms.map((room, index) => renderTab(room, index, index === 0)).join('\n');
  const roomPanels = rooms.map((room, index) => renderRoomPanel(room, index, index === 0)).join('\n');
  const productItems = products.map((item) => ({
    ...item,
    title: PRODUCT_COPY[item.key]?.title || item.key,
    description: PRODUCT_COPY[item.key]?.description || '',
    alt: PRODUCT_COPY[item.key]?.title || item.key
  }));
  const productSlider = renderSlider({ label: 'Meble wypoczynkowe', title: productItems[0].title, items: productItems, product: true });
  const navItems = variant === 'b'
    ? [...rooms.map((room) => [room.id, room.name.replace(' i młodzieżowy', '')]), ['wypoczynkowe', 'Meble wypoczynkowe'], ['kontakt', 'Kontakt']]
    : [['pomieszczenia', 'Pomieszczenia'], ['wypoczynkowe', 'Meble wypoczynkowe'], ['kontakt', 'Kontakt']];
  const navLinks = navItems.map(([id, name]) => `<a href="#${id}">${escapeHtml(name)}</a>`).join('\n   ');
  const roomsSection = variant === 'b'
    ? rooms.map((room, index) => {
        const items = room.items.map((item) => ({ ...item, alt: room.name, title: room.name, description: room.description }));
        const slider = renderSlider({ label: `Pomieszczenia · ${String(index + 1).padStart(2, '0')}`, title: room.name, description: room.description, items, reverse: index % 2 === 1 });
        return ` <section class="sek${index % 2 ? ' alt' : ''}" id="${room.id}" aria-label="${escapeHtml(room.name)}">
  <div class="wrap">
   ${slider}
  </div>
 </section>`;
      }).join('\n')
    : ` <section class="sek" id="pomieszczenia" aria-labelledby="rooms-title">
  <div class="wrap">
   <div class="head"><div><div class="label" data-anim="label">Pomieszczenia</div><h2 id="rooms-title" data-anim="heading">Meble do<br>każdego wnętrza.</h2></div></div>
   <div class="tabs" role="tablist" aria-label="Pomieszczenia">${roomTabs}</div>
   <div class="room-panels">${roomPanels}</div>
  </div>
 </section>`;
  const favicon = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%2318120e%22/%3E%3Ctext x=%2232%22 y=%2247%22 text-anchor=%22middle%22 font-family=%22Georgia,serif%22 font-size=%2248%22 fill=%22%23c8a27a%22%3ET%3C/text%3E%3C/svg%3E';

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Meble Tina — meble, Częstochowa</title>
<meta name="description" content="Meble Tina — salon meblowy w Częstochowie, ul. Bohaterów Katynia 162/170. Pokój dzienny, jadalnia, sypialnia, meble wypoczynkowe.">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONT_HREF}" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<script defer src="assets/vendor/gsap.min.js"></script>
<script defer src="assets/vendor/ScrollTrigger.min.js"></script>
<script defer src="assets/vendor/SplitText.min.js"></script>
<script defer src="assets/js/main.js"></script>
</head>
<body${variant === 'b' ? ' class="nav-dlugi"' : ''}>
<header class="top" id="top">
 <div class="wrap">
  <a class="logo" href="#top"><span>MEBLE TINA</span><small>CZĘSTOCHOWA</small></a>
  <nav class="nav" id="nav" aria-label="Nawigacja główna">
   ${navLinks}
  </nav>
  <div class="hbtns">
   <a class="btn fill tel" href="tel:+48504473577" aria-label="Zadzwoń: +48 504 473 577"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5l2.6 3.4-1.7 2.4a12 12 0 007.2 7.2l2.4-1.7 3.4 2.6-1.3 3.1C11.8 21 3 12.2 3.5 4.8z"/></svg><span>Zadzwoń</span></a>
   <button class="mbtn" id="mbtn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mnav" data-label-closed="Menu" data-label-open="Zamknij">Menu</button>
  </div>
 </div>
</header>
<nav class="mnav" id="mnav" aria-label="Menu" aria-hidden="true">
 ${navLinks}
 <a class="btn fill" href="tel:+48504473577">Zadzwoń · +48 504 473 577</a>
</nav>

<section class="hero" aria-labelledby="hero-title">
 ${imageTag(hero, 'Narożnik modułowy w aranżacji salonu', true)}
 <div class="wrap"><div class="txt">
  <div class="label" data-anim="label">Fabryka mebli tapicerowanych · od 1984</div>
  <h1 id="hero-title" data-anim="heading" data-hero-title>Twój styl,<br>nasze wykonanie.</h1>
  <p data-anim="text">Meble z myślą o twoim domu.</p>
  <div class="btns"><a class="btn fill" href="#wypoczynkowe">Zobacz meble${arrowRight}</a><a class="btn" href="#kontakt">Kontakt</a></div>
 </div></div>
</section>

<div class="cechy"><div class="wrap">
 <div class="cecha"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 5v8l-8 5-8-5V8z"/></svg><b>Profesjonalne wykończenie</b><span>Doświadczony zespół</span></div>
 <div class="cecha"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg><b>Dbałość o każdy detal</b><span>Każdy element ma znaczenie</span></div>
 <div class="cecha"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15h16v4H4zM6 15V9a6 6 0 0112 0v6"/></svg><b>Stworzone z myślą o wygodzie</b><span>Komfort i radość każdego dnia</span></div>
 <div class="cecha"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V9l7-5 7 5v11zM10 20v-6h4v6"/></svg><b>Spełniamy marzenia</b><span>Twój styl, nasze wykonanie</span></div>
</div></div>

<main id="main">
${roomsSection}
 <section class="sek spot" id="wypoczynkowe" aria-label="Meble wypoczynkowe">
  <div class="wrap">
   ${productSlider}
  </div>
 </section>
</main>

<footer class="kontakt" id="kontakt">
 <div class="wrap">
  <div class="kgrid">
   <div><div class="label" data-anim="label">Kontakt</div><h2 data-anim="heading">Zapraszamy<br>do salonu.</h2></div>
   <div><div class="label" data-anim="label">Adres</div><p data-anim="text">ul. Bohaterów Katynia 162/170<br>Częstochowa</p><a class="btn" target="_blank" rel="noopener" href="${escapeHtml(MAPS_URL)}">Wyznacz trasę${arrowRight}</a></div>
   <div><div class="label" data-anim="label">Telefon i e-mail</div><p data-anim="text"><a href="tel:+48504473577">+48 504 473 577</a><br><a href="mailto:salon@mebletina.pl">salon@mebletina.pl</a></p></div>
   <div><div class="label" data-anim="label">Godziny otwarcia</div><p data-anim="text">poniedziałek–piątek: 10.00–18.00<br>sobota: 10.00–14.00</p></div>
  </div>
  <div class="stopka"><span>© Meble Tina</span><a href="#top">do góry${arrowUp}</a></div>
 </div>
</footer>
</body>
</html>`;
}

async function ensureVendors() {
  fs.mkdirSync(VENDOR_OUT, { recursive: true });
  for (const name of VENDOR_FILES) {
    const target = path.join(VENDOR_OUT, name);
    if (fs.existsSync(target) && fs.statSync(target).size > 2048) continue;
    const response = await fetch(`https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/${name}`);
    if (!response.ok) throw new Error(`Pobranie ${name} nie powiodło się: HTTP ${response.status}`);
    const contents = Buffer.from(await response.arrayBuffer());
    if (contents.length < 2048) throw new Error(`Pobrany plik ${name} jest niekompletny`);
    fs.writeFileSync(target, contents);
  }
}

function sortProducts(a, b) {
  const aNumeric = /^\d/.test(a.key);
  const bNumeric = /^\d/.test(b.key);
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
  return compareName(a.key, b.key) || compareRelative(a, b);
}

async function build() {
  if (!fs.existsSync(SOURCE)) throw new Error(`Brak katalogu źródłowego: ${SOURCE}`);
  await ensureVendors();
  fs.rmSync(IMG_OUT, { recursive: true, force: true });
  fs.mkdirSync(IMG_OUT, { recursive: true });

  const heroFiles = listImages('1_hero').sort(compareRelative);
  if (!heroFiles.length) throw new Error('Katalog 1_hero nie zawiera zdjęcia bohatera.');
  const hero = copyImage(heroFiles[0]);

  const productFiles = listImages('3_meble-wypoczynkowe').sort(sortProducts);
  if (!productFiles.length) throw new Error('Katalog 3_meble-wypoczynkowe nie zawiera zdjęć.');
  const products = productFiles.map((record) => ({ ...copyImage(record), key: record.key }));

  const rooms = ROOMS.map((room) => {
    const files = listImages(room.folder).sort(compareRelative);
    return {
      ...room,
      items: files.map((record) => ({
        ...copyImage(record),
        caption: ROOM_CAPTIONS[room.id]?.[record.key] || ''
      }))
    };
  }).filter((room) => room.items.length > 0);

  const html = renderDocument({ hero, rooms, products });
  const cssSource = path.join(ROOT, 'style.css');
  const jsSource = path.join(ROOT, 'main.js');
  if (!fs.existsSync(cssSource) || !fs.existsSync(jsSource)) throw new Error('Brak źródła style.css lub main.js w onepage/.');
  fs.mkdirSync(path.join(DIST, 'assets', 'css'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'assets', 'js'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(DIST, 'assets', 'css', 'style.css'), fs.readFileSync(cssSource));
  fs.writeFileSync(path.join(DIST, 'assets', 'js', 'main.js'), fs.readFileSync(jsSource));

  // wariant B: osobna sekcja na każde pomieszczenie; te same zasoby, kopia do dist-b
  const DIST_B = path.join(ROOT, 'dist-b');
  fs.rmSync(DIST_B, { recursive: true, force: true });
  fs.cpSync(DIST, DIST_B, { recursive: true });
  fs.writeFileSync(path.join(DIST_B, 'index.html'), renderDocument({ hero, rooms, products, variant: 'b' }), 'utf8');

  const imageCount = 1 + products.length + rooms.reduce((total, room) => total + room.items.length, 0);
  console.log(`Zbudowano onepage/dist: ${rooms.length} zakładek, ${products.length} mebli wypoczynkowych, ${imageCount} zdjęć.`);
  console.log('Wniosek: zachowano wariant A; sekcja kart kategorii ze starszej specyfikacji nie wchodzi do finalnego briefu.');
  console.log("wniosek: podpisy przedpokoju (LINATE, L'HOMBRE, SLIM, HOME) przypisane wg kolejności zdjęć i opisów serii na stronie przedpokoju.");
}

if (require.main === module) {
  build().catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}

module.exports = { build, ROOMS, ROOM_CAPTIONS, PRODUCT_COPY, imageDimensions };
