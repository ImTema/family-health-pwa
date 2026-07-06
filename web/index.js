// ponytail: stdlib static file server for Hostinger Node hosting, no server-side rendering needed (adapter-static build)
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const BUILD_DIR = join(import.meta.dirname, 'build')
const PORT = process.env.PORT || 3000

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
}

createServer(async (req, res) => {
  const safePath = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(BUILD_DIR, safePath)

  try {
    const data = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream' })
    res.end(data)
  } catch {
    const fallback = await readFile(join(BUILD_DIR, 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(fallback)
  }
}).listen(PORT, () => console.log(`Serving ${BUILD_DIR} on port ${PORT}`))
