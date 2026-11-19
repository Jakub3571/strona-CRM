# Lokalny serwer deweloperski dla strony:
#   GET  -> serwuje pliki jak zwykle (katalogi -> index.html)
#   POST /cms/save -> zapisuje content.json (to, co wysłał panel CMS)
# Uruchomienie (w głównym folderze strony):  python serwer.py
# Strona: http://localhost:8000/   Panel CMS: http://localhost:8000/cms/
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.split("?")[0] != "/cms/save":
            self.send_response(404)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(length)
        try:
            json.loads(data)  # walidacja, że to poprawny JSON
            (ROOT / "content.json").write_bytes(data)
            body = b'{"ok": true}'
            code = 200
        except Exception:
            body = b'{"ok": false, "error": "niepoprawny JSON"}'
            code = 400
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print("Strona:    http://localhost:8000/")
    print("Panel CMS: http://localhost:8000/cms/")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()