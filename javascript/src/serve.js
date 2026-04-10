import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

/**
 * Serve a single HTML file over localhost.
 * Uses port 0 so the OS picks an available port automatically.
 * Returns { url, server } — caller is responsible for server.close().
 */
export function serveReport(htmlPath) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        const html = readFileSync(htmlPath);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (err) {
        res.writeHead(500);
        res.end(err.message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ url: `http://localhost:${port}`, server });
    });

    server.on('error', reject);
  });
}
