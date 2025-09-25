const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const hostname = '0.0.0.0'
const port = process.env.PORT || 8080

// Check if production build exists
const hasBuild = fs.existsSync('.next/BUILD_ID')
const dev = !hasBuild

// Azure environment detection
const isAzure = process.env.WEBSITE_SITE_NAME || process.env.AZURE_WEBAPP_NAME

console.log(`Starting server: dev=${dev}, port=${port}, NODE_ENV=${process.env.NODE_ENV}, hasBuild=${hasBuild}, isAzure=${!!isAzure}`)
console.log(`Environment variables: PORT=${process.env.PORT}, WEBSITE_SITE_NAME=${process.env.WEBSITE_SITE_NAME}`)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

console.log('Next.js app created, preparing...')

app.prepare().then(() => {
  console.log('Next.js app prepared, creating server...')
  
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  server.once('error', (err) => {
    console.error('Server error:', err)
    process.exit(1)
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log('Server is listening and ready to accept connections')
  })

}).catch((err) => {
  console.error('Failed to start server:', err)
  console.error('Error details:', err.stack)
  process.exit(1)
})
