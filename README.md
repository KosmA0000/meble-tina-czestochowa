# Meble Tina — strona one-page

- `onepage/dist/` — wersja A (pomieszczenia w zakładkach)
- `onepage/dist-b/` — wersja B (osobna sekcja na każde pomieszczenie)
- `do-ai/` — zdjęcia źródłowe; po podmianie plików uruchom w `onepage/`: `node build.js` (buduje obie wersje), potem `node verify.js`.
- `onepage/podglad/` — zatwierdzony szkic układu.

Podgląd lokalny: w `onepage/` uruchom `python -m http.server 8765` i otwórz `http://127.0.0.1:8765/dist/` lub `/dist-b/`.
