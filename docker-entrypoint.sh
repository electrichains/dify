#!/bin/bash
set -e

MODE=${MODE:-api}

if [ "$MODE" = "worker" ]; then
  export PORT=${PORT:-10000}
  python3 -c "
import http.server
import os
import socketserver

PORT = int(os.environ.get('PORT', 10000))

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')
    def log_message(self, format, *args):
        pass

with socketserver.TCPServer(('', PORT), HealthHandler) as httpd:
    httpd.serve_forever()
" &
  echo "Health check server started on port ${PORT}"
else
  export PORT=5001
  echo "API mode - serving on port ${PORT}"
fi

exec /bin/bash /entrypoint.sh "$@"
