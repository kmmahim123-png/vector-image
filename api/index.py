from http.server import BaseHTTPRequestHandler
import json
import base64
import os
import tempfile
import sys
import io

# Ensure root workspace is in sys.path so modules can be imported in Vercel serverless
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import engine_pro
import color_separator
import cut_generator
import zip_separations

class handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0]
        if clean_path.endswith('/status') or clean_path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            status_data = {
                "status": "online",
                "app": "Free Vector Image Pro",
                "version": "5.0.0-enterprise-ai",
                "engine": "VisionCortex VTracer Rust Core + OpenCV Bilateral AI Filtering",
                "platform": "Vercel Cloud Serverless"
            }
            self.wfile.write(json.dumps(status_data).encode('utf-8'))
            return

        if clean_path.endswith('/ads.txt') or clean_path == '/ads.txt' or clean_path == '/api/ads.txt':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b"google.com, pub-4491918633486621, DIRECT, f08c47fec0942fa0\n")
            return

        self.send_response(404)
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(b'{"error": "Endpoint not found"}')

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        clean_path = self.path.split('?')[0]

        if clean_path.endswith('/vectorize') or clean_path == '/api/vectorize':
            try:
                data = json.loads(body.decode('utf-8'))
                img_b64 = data.get('imageBase64', '')
                opts = data.get('options', {})

                if not img_b64:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self._send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "No image data supplied"}).encode('utf-8'))
                    return

                # Strip data URL prefix
                if ',' in img_b64:
                    img_b64 = img_b64.split(',', 1)[1]
                raw_bytes = base64.b64decode(img_b64)

                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as in_f:
                    in_f.write(raw_bytes)
                    in_path = in_f.name

                out_path = in_path + '.svg'

                try:
                    result = engine_pro.vectorize_pro(in_path, out_path, opts)
                    svg_content = result.pop('svgContent', '')

                    response_payload = {
                        "success": True,
                        "svg": svg_content,
                        "stats": {
                            "width": result.get('width', 400),
                            "height": result.get('height', 400),
                            "pathsCount": result.get('pathsCount', 0),
                            "colorsCount": result.get('colorsCount', 0),
                            "svgSizeKb": result.get('svgSizeKb', 0),
                            "engine": "Enterprise AI Spline Engine"
                        },
                        "palette": result.get('palette', [])
                    }

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self._send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps(response_payload).encode('utf-8'))

                finally:
                    if os.path.exists(in_path):
                        try: os.remove(in_path)
                        except Exception: pass
                    if os.path.exists(out_path):
                        try: os.remove(out_path)
                        except Exception: pass

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Vectorization failed: {str(e)}"}).encode('utf-8'))
            return

        elif clean_path.endswith('/screen-print-zip') or clean_path == '/api/screen-print-zip':
            try:
                data = json.loads(body.decode('utf-8'))
                svg_str = data.get('svg', '')
                w = int(data.get('width', 800))
                h = int(data.get('height', 800))

                with tempfile.NamedTemporaryFile(suffix='.svg', delete=False, mode='w', encoding='utf-8') as in_f:
                    in_f.write(svg_str)
                    in_svg = in_f.name

                out_zip = in_svg + '.zip'
                try:
                    zip_separations.make_separations_zip(in_svg, out_zip, w, h)
                    with open(out_zip, 'rb') as zf:
                        zip_bytes = zf.read()

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/zip')
                    self.send_header('Content-Disposition', 'attachment; filename="Screen_Print_Separations.zip"')
                    self._send_cors_headers()
                    self.end_headers()
                    self.wfile.write(zip_bytes)
                finally:
                    if os.path.exists(in_svg):
                        try: os.remove(in_svg)
                        except Exception: pass
                    if os.path.exists(out_zip):
                        try: os.remove(out_zip)
                        except Exception: pass

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Separation failed: {str(e)}"}).encode('utf-8'))
            return

        elif clean_path.endswith('/cut-contour') or clean_path == '/api/cut-contour':
            try:
                data = json.loads(body.decode('utf-8'))
                img_b64 = data.get('imageBase64', '')
                offset = int(data.get('offset', 6))

                if ',' in img_b64:
                    img_b64 = img_b64.split(',', 1)[1]
                raw_bytes = base64.b64decode(img_b64)

                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as in_f:
                    in_f.write(raw_bytes)
                    in_png = in_f.name

                out_svg = in_png + '_cut.svg'
                try:
                    res = cut_generator.generate_cut_path(in_png, out_svg, offset)
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/svg+xml')
                    self._send_cors_headers()
                    self.end_headers()
                    self.wfile.write(res['svg'].encode('utf-8'))
                finally:
                    if os.path.exists(in_png):
                        try: os.remove(in_png)
                        except Exception: pass
                    if os.path.exists(out_svg):
                        try: os.remove(out_svg)
                        except Exception: pass

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Cut contour failed: {str(e)}"}).encode('utf-8'))
            return

        self.send_response(404)
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(b'{"error": "Endpoint not found"}')
