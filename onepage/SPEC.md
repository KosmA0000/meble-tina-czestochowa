# Meble Tina — one-page w stylu makiety NOVAIRE (`../wzorce/w1.jpg`)

Wynik: `onepage/dist/index.html` + `dist/assets/{css,js,img,vendor}`. Budowa: `onepage/build.js` (Node, bez frameworka), który:
- kopiuje zdjęcia z `../do-ai/**` do `dist/assets/img/` — plik dopasowany po **przedrostku nazwy bez rozszerzenia** (np. `01_hero-naroznik-modulowy.*`), dowolne z .jpg/.jpeg/.png/.webp; gdy jest kilka, bierze najnowszy (mtime). Dzięki temu podmiana grafiki AI = ponowne `node build.js`;
- odczytuje wymiary obrazów (nagłówki JPEG/PNG/WebP, własny parser — bez paczek) i wpisuje `width/height`;
- generuje `dist/index.html` z szablonu w `build.js` (teksty poniżej wpisane w build.js — to jedyne źródło tekstu).
Pliki zapisuj przez `node -e` / `fs.writeFileSync` (apply_patch na Windows nie działa). Uwaga na limit długości linii poleceń Windows (błąd 206) — długie treści pisz do pliku skryptem.

## Styl — skopiować makietę w1 (obejrzyj `../wzorce/w1.jpg`, 736×920 px, to widok ~1440 px zmniejszony)
- Paleta (tokeny na `:root`): tło `--bg:#18120e`, panel/pasy `--bg2:#211813`, karta `--card:#2a1f18`, tekst `--ink:#efe6da`, tekst drugi `--muted:#b3a18c`, akcent brąz/złoto `--gold:#c8a27a` (przycisk wypełniony: tło gold, tekst `#1a130f`), linie `--line:rgba(239,230,218,.14)`. Tylko ciemny motyw (makieta jest ciemna) — `color-scheme: dark`.
- Typografia: nagłówki **cienki serif, WERSALIKI**, lekki tracking, ciasna interlinia (~1.0–1.05): `"Cormorant Garamond"` 300/400 (latin-ext!). Tekst, etykiety, menu, przyciski: `"DM Sans"` 300–500; etykiety i menu małe (11–12 px) wersaliki z `letter-spacing:.14em`. Google Fonts: `family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap`.
- Przyciski: prostokątne, zaokrąglenie 2–3 px, małe wersaliki; wariant wypełniony (gold) i obrysowany (1 px `--line` jaśniejszy, tekst ink). Strzałki „→” jako SVG inline.
- Ikony pasa cech: cienkie SVG liniowe (stroke 1.2, kolor gold/ink), rysowane inline — bez bibliotek, bez tekstu w ikonach.
- Szerokość treści ~1320 px, marginesy boczne 40 px desktop / 16 px mobile. Brak poziomego przewijania strony na 360 px.

## Struktura (kolejność = kolejność makiety)
1. **Nagłówek** (sticky, przezroczysty nad hero, po przewinięciu tło `--bg` z `backdrop-filter`): po lewej znak słowny „MEBLE TINA” (serif, wersaliki, tracking) + pod nim mały wiersz „CZĘSTOCHOWA”; środek: kotwice `Pomieszczenia` (#pomieszczenia), `Meble wypoczynkowe` (#wypoczynkowe), `Kontakt` (#kontakt); prawa: przycisk wypełniony `Zadzwoń` → `tel:+48504473577`. Mobile (<900): przycisk-hamburger (`aria-label="Menu"`, `aria-expanded`) → panel pełnoekranowy z tymi samymi kotwicami + telefonem; zamyka Esc i klik w link. Aktywna kotwica podświetlana podczas przewijania (IntersectionObserver).
2. **Hero** (jak „DESIGN THE WAY YOU LIVE.”): zdjęcie `1_hero/01_hero-naroznik-modulowy` na całą szerokość, wysokość ~min(100svh, 820px), `object-fit:cover`, `object-position` prawa strona; gradient z lewej (`--bg` → przezroczysty ~55%) i z dołu. Po lewej:
   - etykieta: `FABRYKA MEBLI TAPICEROWANYCH · OD 1984`
   - H1: `MEBLE Z MYŚLĄ` / `O TWOIM DOMU.` (2 linie)
   - akapit: `Jakość wykończenia i dbałość o każdy element — w meblach, które na co dzień tworzą wnętrze.`
   - przyciski: `Zobacz meble` (wypełniony → #wypoczynkowe), `Kontakt` (obrys → #kontakt)
   - na dole: `PRZEWIŃ W DÓŁ` + cienka strzałka w dół.
3. **Pas 4 cech** (jak TIMELESS DESIGN…): 4 kolumny rozdzielone pionowymi liniami, ikona + etykieta + podpis (mobile 2×2):
   - `JAKOŚĆ WYKOŃCZENIA` / `Staranność w szczegółach`
   - `DBAŁOŚĆ O DETAL` / `Każdy element ma znaczenie`
   - `WYGODA` / `Komfort na co dzień`
   - `PONADCZASOWA FORMA` / `Styl, który zostaje`
4. **Sekcja #pomieszczenia** (jak „DESIGNED FOR MODERN LIVING.”): lewa kolumna ~30%: etykieta `POMIESZCZENIA`, H2 `MEBLE DO` / `KAŻDEGO WNĘTRZA.`; prawa: karty — zdjęcie u góry (proporcja ~4:3, cover), pod nim na ciemnym tle nazwa (serif wersaliki) i krótki podpis. 6 kart: desktop 3×2, tablet 2×3, mobile przewijany poziomo pas (scroll-snap) z widocznym brzegiem następnej karty. Karty 1–5 są linkami-kotwicami do sekcji pomieszczeń z p. 4a (strzałka „→” w prawym dolnym rogu jak na makiecie, cała karta klikalna, hover: zdjęcie `scale 1.04`, 0.6 s). Karta 6 (Biuro i gabinet domowy) bez linku i bez strzałki — w źródle ta strona jest pusta („strona w trakcie”), więc nie ma własnej sekcji. Nazwy (dosłownie ze źródła) + podpisy:
   - `2_pomieszczenia/01_pokoj-dzienny` — `Pokój dzienny` / `Miejsce na odpoczynek.`
   - `02_jadalnia` — `Jadalnia` / `Przy wspólnym stole.`
   - `03_sypialnia` — `Sypialnia` / `Spokój na koniec dnia.`
   - `04_pokoj-dzieciecy` — `Pokój dziecięcy i młodzieżowy` / `Przestrzeń do dorastania.`
   - `05_przedpokoj` — `Przedpokój` / `Pierwsze wrażenie domu.`
   - `06_biuro` — `Biuro i gabinet domowy` / `Porządek w pracy.`
4a. **Sekcje pomieszczeń** (dodane na życzenie właściciela; 5 sekcji jedna pod drugą, id: `#pokoj-dzienny`, `#jadalnia`, `#sypialnia`, `#pokoj-dzieciecy`, `#przedpokoj`). Zdjęcia: `../do-ai/4_galerie-pomieszczen/<NN_pokoj>/NN_*.{jpg,png,webp}` — build.js czyta **całą zawartość** każdego podfolderu (posortowaną po nazwie), więc właściciel może dodawać/usuwać/podmieniać pliki; podpis zdjęcia = mapa nazwa→podpis poniżej, a dla pliku spoza mapy — brak podpisu. Układ każdej sekcji w stylu spotlightu z makiety (duże zdjęcie + tekst obok), strony naprzemiennie (zdjęcie lewa/prawa), tło naprzemiennie `--bg`/`--bg2`:
   - duże zdjęcie ~60% szerokości, proporcja 16:9, `object-fit:cover`, zaokrąglenie 2 px; pod nim pas miniatur (wszystkie zdjęcia pomieszczenia, 16:9, ~120 px szer., przewijany poziomo na mobile; aktywna ze złotą ramką 1 px, pozostałe `opacity:.55`);
   - obok: etykieta `POMIESZCZENIA · 0N` (N = numer 1–5), H2 = nazwa pomieszczenia wersalikami, akapit (tekst poniżej), podpis aktywnego zdjęcia (małe wersaliki `--muted`, np. „KOLEKCJA TORONTO”; pusty → element ukryty), licznik `01 / 06` i dwie okrągłe strzałki ‹ › jak w #wypoczynkowe; przycisk obrys `Zapytaj w salonie` → #kontakt;
   - zachowanie jak slider #wypoczynkowe (crossfade 0.6 s, klawiatura, swipe, bez autoodtwarzania). Wspólny komponent JS dla wszystkich sliderów.
   - Nad pierwszą sekcją pomieszczeń: cienki sticky (pod nagłówkiem) pasek zakładek `Pokój dzienny · Jadalnia · Sypialnia · Pokój dziecięcy i młodzieżowy · Przedpokój` (kotwice, aktywna podświetlona złotą kreską; widoczny tylko gdy przewijamy obszar sekcji pomieszczeń; na mobile przewijany poziomo).
   Teksty sekcji (własne, neutralne):
   1. `#pokoj-dzienny` — `Pokój dzienny` / `Miejsce, w którym dom spotyka się na co dzień. Spokojne formy i staranne wykończenie.` — podpisy: 01_toronto „kolekcja TORONTO”, 02_shetland „kolekcja SHETLAND”, 03_summer „kolekcja SUMMER”, 04_linate „kolekcja LINATE”, 05_arko „kolekcja ARKO”, 06_cortina „kolekcja CORTINA”.
   2. `#jadalnia` — `Jadalnia` / `Wspólny stół i przestrzeń, która sprzyja rozmowie.` — 01_naomi „jadalnia NAOMI”, 02_nicol „jadalnia NICOL”, 03_pello „jadalnia PELLO”, 04_cortina „jadalnia CORTINA”, 05_arko „jadalnia ARKO”.
   3. `#sypialnia` — `Sypialnia` / `Wyciszenie i porządek na koniec dnia.` — 01_lionel „sypialnia LIONEL”, 02_naomi „sypialnia NAOMI”, 03_nicol „sypialnia NICOL”, 04_linate „sypialnia LINATE”, 05_aspen „łóżko ASPEN”, 06_tokyo „łóżko TOKYO”.
   4. `#pokoj-dzieciecy` — `Pokój dziecięcy i młodzieżowy` / `Przestrzeń, która rośnie razem z domownikami.` — 01–04_angel „kolekcja ANGEL”, 05_trixi „kanapa TRIXI”.
   5. `#przedpokoj` — `Przedpokój` / `Pierwsze wrażenie, uporządkowane od progu.` — zdjęcia bez podpisów (źródło nie przypisuje nazw serii do zdjęć — LUKA).

5. **Sekcja #wypoczynkowe** (jak spotlight „NOVAIRE ARC CHAIR”, tło `--bg2` z delikatnym ciepłym radialnym światłem): lewa ~55% duże zdjęcie (bez ramki, `object-fit:contain` lub cover z miękkim winietowaniem krawędzi przez mask-image), prawa: etykieta `MEBLE WYPOCZYNKOWE`, H2 = nazwa pozycji, akapit, przycisk obrys `Zapytaj w salonie` → #kontakt. Prawy górny róg licznik `01 / 06`, prawy dolny dwie okrągłe strzałki ‹ › (`aria-label="Poprzedni"/"Następny"`). Klawiatura ←/→ gdy sekcja w fokusie, swipe na dotyku, bez autoodtwarzania. Przejście: crossfade zdjęcia (0.6 s) + tekst jak animacja nagłówka. Folder `3_meble-wypoczynkowe` zmieniony przez właściciela — 6 plików; build.js czyta całą zawartość folderu (sortowanie: najpierw pliki zaczynające się od cyfr, potem reszta alfabetycznie bez rozróżniania wielkości liter), podpisy z mapy poniżej, plik spoza mapy → nazwa z pliku bez rozszerzenia, bez akapitu. Pozycje (nazwy dosłownie ze źródła; opisy 1–2 z `meble-tapicerowane-efc2.json`, 3–6: źródło nie ma opisu kompletów → własny neutralny podpis):
   1. `01_komplety-wypoczynkowe` — `Komplety wypoczynkowe` / `Fotele, sofy dwuosobowe, sofy trzyosobowe właśnie tak najkrócej sprecyzować można komplety wypoczynkowe. Nowoczesne lub klasyczne zestawy, sam wiesz jaki styl Tobie odpowiada.`
   2. `03_narozniki` — `Narożniki` / `Narożnik to komfortowy mebel przeznaczony przede wszystkim do wypoczynku.`
   3. `TRENTO_komplet_461x231` — `Komplet TRENTO` / `Prosta forma i spokojna tkanina.`
   4. `boston000` — `Komplet BOSTON` / `Miękkie linie i jasne obicie.`
   5. `tokyo01` — `Komplet TOKYO` / `Wyraźny kontrast i czysta forma.`
   6. `tokyoII01` — `Komplet TOKYO II` / `Ta sama linia w innym zestawieniu.`
   Te zdjęcia są małe (461×231) — do czasu grafik AI pokazuj je w proporcji 2:1, `object-fit:cover`, bez powiększania ponad ~1.6× (max-width), wyśrodkowane w polu.
   Pod sliderem (desktop) rząd 6 miniatur-kafelków jak „MATERIALS MATTER” (zdjęcie + podpis wersalikami na dole z gradientem), klik = przejście do danej pozycji; aktywna z cienką złotą ramką.
6. **Stopka #kontakt** (tło `--bg2`, góra z linią): lewa: H2 `ZAPRASZAMY` / `DO SALONU.` + `MEBLE TINA`; dalej 3 kolumny:
   - `ADRES` — `ul. Bohaterów Katynia 162/170` / `Częstochowa` + link obrys `Wyznacz trasę` → `https://www.google.com/maps/search/?api=1&query=Meble+Tina+Bohater%C3%B3w+Katynia+162+Cz%C4%99stochowa` (nowa karta, rel=noopener)
   - `KONTAKT` — `+48 504 473 577` (tel:) / `salon@mebletina.pl` (mailto:)
   - `GODZINY OTWARCIA` — `poniedziałek–piątek: 10.00–18.00` / `sobota: 10.00–14.00`
   - dół: `© Meble Tina` i kotwica „do góry”.

## Twarde zakazy
- Żadnych innych tekstów niż wyżej (zero cen, wymiarów, terminów, gwarancji, liczb, opinii, „darmowa dostawa” itp.). Żadnego newslettera, wyszukiwarki, koszyka, ikon konta.
- Żadnych innych zdjęć niż z `../do-ai` (39 plików: 1 hero + 6 kart + 6 wypoczynkowe + 26 w `4_galerie-pomieszczen`). Żadnych zdjęć stockowych/placeholderów.
- `alt` zdjęć = nazwa pozycji (np. „Pokój dzienny”), hero: „Narożnik modułowy w aranżacji salonu”.

## Ruch (GSAP 3.13 + ScrollTrigger + SplitText z `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/`, skopiowane lokalnie do `dist/assets/vendor/`; wartości z `../szablon/ANIMACJE.md`)
- H1/H2: wzorzec 2 (Ronnsquare): linie w masce, `from(lines,{y:'100%',opacity:0,duration:1.2,stagger:0.12,ease:'expo.out'})`, `start:'top 75%'` (H1 od razu po `document.fonts.ready`).
- akapity: wzorzec 1 (Storey) `yPercent:100→0, 0.75, power2.out, stagger 0.06, start 'top 95%', once`.
- etykiety wersalikami: wzorzec 3 (ecoLINEAR) `yPercent:110,opacity:0 → 0/1, 0.9, power3.out, 'top 78%', once`.
- karty pomieszczeń (≥768 px): parallax Muuto per wiersz — karta 1 `y:'5%'`, 2 `'-30%'`, 3 `'-15%'`, `ease:'none'`, scrub `top bottom → bottom top`; wiersz z `padding-block`, by karty nie nachodziły na sąsiednie bloki.
- hero: zdjęcie `scale 1.08→1` 1.6 s `power2.out` na starcie.
- `prefers-reduced-motion: reduce` → brak animacji. Bez JS wszystko widoczne (stany początkowe tylko pod `html.js`).

## Weryfikacja (napisz `onepage/verify.js`, uruchom, wynik do `onepage/verify-wynik.txt`)
- lista całego widocznego tekstu z `dist/index.html` = dokładnie teksty z tej specyfikacji (różnica wypisana, oczekiwane 0);
- każdy plik z `../do-ai/**` (poza LISTA.md) użyty w dist, każdy obraz istnieje, brak innych `<img>`/`url()`;
- brak cyfr poza: 1984, liczniki sliderów (01–06), numery `0N` etykiet pomieszczeń, adres/telefon/godziny, `©`;
- HTML poprawny (brak niezamkniętych tagów — parse5 jest w `../zrodlo/node_modules`).
Na koniec wypisz w logu listę decyzji podjętych samodzielnie oznaczonych słowem „wniosek” i braki jako „LUKA”.
