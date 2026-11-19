# Strona nowoczesnekorepetycje.pl — uporządkowana wersja

Wygląda dokładnie tak samo jak poprzednia strona, ale kod jest podzielony:
HTML w katalogach stron, style w `css/`, skrypty w `js/`, panel CMS w `cms/`.

## Struktura

- `index.html`, `404.html`, `favicon.*`, `content.json`, `README.md`
- `css/` — base, pages, features, release, mobile, legal, legal-pages, custom-page, 404
- `js/` — release, main, pages, cookie-consent, content
- `cms/` — panel CMS: index.html, cms.css, cms.js
- `assets/` — obrazki, fonty, wideo (nie ruszać)
- `<strona>/index.html` — każda podstrona w swoim katalogu

## CMS (bez API)

- `content.json` — nadpiski napisów/liczb/obrazków
- `js/content.js` podmienia elementy `data-nk-slot`, liczby `data-stat`, obrazki `data-nk-media`
- panel `/cms/` → edytuj pola → „Zapisz zmiany” → zapis bezpośrednio do `content.json`
  (przez POST /cms/save, nic się nie pobiera — strona aktualizuje się sama)
- puste pole napisu = element znika ze strony
- UWAGA: na serwerze zabezpiecz `/cms/` hasłem (WSGI)

## Zasady

1. Ścieżki absolutne `/css/...`, `/js/...`, `/assets/...`
2. Po zmianie CSS/JS podnieś `?v=` (obecnie `?v=20261119`)
3. Nie ruszaj `data-nk-slot` / `data-nk-media` / `data-stat`
4. Brak inline `<script>`/`<style>` (wyjątek: `<noscript>` z loaderem)
5. Brak API — formularz = fallback „skopiuj wiadomość” (`NK_LIVE_FORM = false` w `js/pages.js`)
6. Sekrety tylko w pliku środowiskowym na serwerze — nigdy w repo

## Formatowanie / start / deploy

```
npx prettier@3.5.3 --write "*.html" "*/index.html" "css/*.css" "js/*.js" "cms/*" "kontakt/*.css" "dziekujemy/*.css"
python serwer.py                  →  strona: localhost:8000  |  CMS: localhost:8000/cms/
                                    (panel zapisuje zmiany bezpośrednio do content.json przez POST /cms/save)
zip folderu (bez .git, Z content.json) → PythonAnywhere Files → ~/strona → unzip
```