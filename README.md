# PixelGet

High-speed PixelDrain CDN link generator with retro metallic UI.

## Features

- ✅ Generate CDN links for PixelDrain URLs (`/u/`, `/l/`, `/d/`)
- ✅ QR code generation for easy mobile transfer
- ✅ Link validation via Cloudflare Worker
- ✅ History (localStorage, last 10 generations)
- ✅ Export to .txt file
- ✅ Copy individual or all links
- ✅ Retro minimalist design (silver/gray metallic theme)

## Usage

1. Paste PixelDrain URLs (one per line)
2. Click **Generate Links**
3. Copy the CDN links and paste into IDM/JDownloader
4. Download without rate limits

## Deploy to Cloudflare Pages

### Option 1: GitHub Integration

1. Fork or clone this repo
2. Go to [Cloudflare Pages](https://dash.cloudflare.com/)
3. Click **Create a project** → **Connect to Git**
4. Select this repository
5. Build settings: Leave empty (static site)
6. Click **Save and Deploy**

### Option 2: Direct Upload

1. Download this repo as ZIP
2. Go to [Cloudflare Pages](https://dash.cloudflare.com/)
3. Click **Upload assets**
4. Drag and drop the folder
5. Deploy ✅

## Cloudflare Worker Setup (for link validation)

Create a new Cloudflare Worker with this code:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing url parameter' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    try {
      const response = await fetch(targetUrl, { method: 'HEAD' });
      
      return new Response(JSON.stringify({
        ok: response.ok,
        status: response.status
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
```

Deploy the worker and update `WORKER_ENDPOINT` in `script.js` to your worker URL.

## Tech Stack

- Pure HTML/CSS/JavaScript (no frameworks)
- QRCode.js for QR generation
- localStorage for history
- Cloudflare Worker for CORS bypass

## License

MIT

---

Made with 🔥 by **itsaxt**
