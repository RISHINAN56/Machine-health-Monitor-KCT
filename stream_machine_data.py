from __future__ import annotations

import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

DATASET_PATH = Path("machine_health_data.csv")
DASHBOARD_PATH = Path("iot_dashboard.html")
HOST = "0.0.0.0"
PORT = 8765


class CSVStreamer:
	"""Sequential CSV streamer that loops back to start when dataset ends."""

	REQUIRED_COLUMNS = {
		"timestamp",
		"temperature",
		"vibration",
		"motor_load",
		"rpm",
		"machine_health_score",
		"machine_status",
	}

	def __init__(self, dataset_path: Path):
		self.dataset_path = dataset_path
		self.df = self._load_dataframe()
		self.index = 0

	def _load_dataframe(self) -> pd.DataFrame:
		if not self.dataset_path.exists():
			raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")

		df = pd.read_csv(self.dataset_path)
		missing = self.REQUIRED_COLUMNS.difference(df.columns)
		if missing:
			raise ValueError(f"Missing required columns in dataset: {sorted(missing)}")
		if len(df) == 0:
			raise ValueError("Dataset is empty.")

		return df

	def next_row(self) -> dict:
		row = self.df.iloc[self.index].to_dict()
		self.index = (self.index + 1) % len(self.df)
		return row


streamer = CSVStreamer(DATASET_PATH)


class RequestHandler(BaseHTTPRequestHandler):
	protocol_version = "HTTP/1.1"

	def _send_headers(self, status: int, content_type: str) -> None:
		self.send_response(status)
		self.send_header("Content-Type", content_type)
		self.send_header("Cache-Control", "no-cache")
		self.send_header("Access-Control-Allow-Origin", "*")

	def do_GET(self):
		path = urlparse(self.path).path

		if path in {"/", "/dashboard"}:
			self._serve_dashboard()
			return

		if path == "/latest":
			row = streamer.next_row()
			payload = json.dumps(row).encode("utf-8")
			self._send_headers(200, "application/json")
			self.send_header("Content-Length", str(len(payload)))
			self.end_headers()
			self.wfile.write(payload)
			return

		if path == "/stream":
			self._serve_sse_stream()
			return

		if path == "/health":
			payload = b'{"status":"ok"}'
			self._send_headers(200, "application/json")
			self.send_header("Content-Length", str(len(payload)))
			self.end_headers()
			self.wfile.write(payload)
			return

		payload = b"Not Found"
		self._send_headers(404, "text/plain")
		self.send_header("Content-Length", str(len(payload)))
		self.end_headers()
		self.wfile.write(payload)

	def _serve_dashboard(self):
		if not DASHBOARD_PATH.exists():
			payload = b"Dashboard file not found."
			self._send_headers(404, "text/plain")
			self.send_header("Content-Length", str(len(payload)))
			self.end_headers()
			self.wfile.write(payload)
			return

		payload = DASHBOARD_PATH.read_bytes()
		self._send_headers(200, "text/html; charset=utf-8")
		self.send_header("Content-Length", str(len(payload)))
		self.end_headers()
		self.wfile.write(payload)

	def _serve_sse_stream(self):
		self.send_response(200)
		self.send_header("Content-Type", "text/event-stream")
		self.send_header("Cache-Control", "no-cache")
		self.send_header("Connection", "keep-alive")
		self.send_header("Access-Control-Allow-Origin", "*")
		self.end_headers()

		try:
			while True:
				row = streamer.next_row()
				payload = f"data: {json.dumps(row)}\n\n".encode("utf-8")
				self.wfile.write(payload)
				self.wfile.flush()
				time.sleep(1)
		except (BrokenPipeError, ConnectionResetError):
			pass

	def log_message(self, format: str, *args):
		return


if __name__ == "__main__":
	server = ThreadingHTTPServer((HOST, PORT), RequestHandler)
	print(f"Machine health stream server running at http://{HOST}:{PORT}")
	print("Endpoints: /dashboard, /stream, /latest, /health")
	server.serve_forever()
