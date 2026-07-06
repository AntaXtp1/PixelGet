# PixelGet - Deployment Guide

## 🚀 Deploy ke Cloudflare Pages

### Step 1: Connect Repository

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih akun lu → **Workers & Pages**
3. Klik **Create application**
4. Pilih tab **Pages**
5. Klik **Connect to Git**
6. Authorize GitHub
7. Select repository: **AntaXtp1/PixelGet**
8. Klik **Begin setup**

### Step 2: Configure Build

**Project name:** `pixelget` (atau nama bebas)
**Production branch:** `main`
**Build settings:**
- Framework preset: **None**
- Build command: **(kosong)**
- Build output directory: **(kosong)**

Klik **Save and Deploy**

✅ Deploy selesai! Lu akan dapet URL: `https://pixelget.pages.dev`

---

## 🔧 Setup Cloudflare Worker (Link Validation)

Worker ini bypass CORS untuk validasi link CDN.

### Step 1: Create Worker

1. Di Cloudflare Dashboard → **Workers & Pages**
2. Klik **Create application** → **Create Worker**
3. Nama: `pixelget-validator`
4. Klik **Deploy**

### Step 2: Edit Worker Code

Klik **Edit code**, hapus semua, paste ini:

```javascript
export default {
  async fetch(request) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing url parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validate target URL
    if (!targetUrl.startsWith('https://cdn.pixeldrain.eu.cc/')) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Invalid URL'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      // HEAD request to check if file exists
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000) // 8s timeout
      });

      return new Response(JSON.stringify({
        ok: response.ok,
        status: response.status,
        size: response.headers.get('Content-Length'),
        type: response.headers.get('Content-Type')
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        ok: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};
```

Klik **Save and deploy**

### Step 3: Copy Worker URL

Worker URL format: `https://pixelget-validator.<SUBDOMAIN>.workers.dev`

Copy URL ini.

### Step 4: Update script.js

Di repo GitHub, edit `script.js` line 5:

```javascript
// Ganti ini:
const WORKER_ENDPOINT = '/api/validate';

// Jadi:
const WORKER_ENDPOINT = 'https://pixelget-validator.<SUBDOMAIN>.workers.dev';
```

Commit & push → Cloudflare Pages auto-redeploy.

---

## ✅ Testing

1. Buka `https://pixelget.pages.dev`
2. Paste URL: `https://pixeldrain.com/u/3MnE32At`
3. Klik **Generate Links**
4. Klik **QR** → QR code muncul
5. Klik **Validate** → status berubah jadi OK/FAILED
6. Klik **Copy** → link ter-copy
7. Check History panel → entry tersimpan

---

## 🐛 Troubleshooting

### QR code ga muncul
- Check browser console (F12)
- CDN `qrcode.min.js` harus ke-load dari jsdelivr
- Di local (`file://`) emang ga works, tapi di production (HTTPS) works

### Validation stuck "CHECKING..."
- Worker belum di-setup atau URL salah
- Check worker logs di Cloudflare Dashboard
- Pastikan CORS headers ada

### History ga ke-save
- localStorage disabled di browser settings
- Private/Incognito mode block localStorage
- Check browser console untuk error

---

## 📱 Mobile Testing

Scan QR code atau share link Cloudflare Pages ke HP lu, test di mobile browser.

---

## 🔄 Update Production

```bash
cd D:/tools/pixeldrain-bypass
# Edit files
git add .
git commit -m "Update: describe changes"
git push
```

Cloudflare Pages auto-deploy dalam ~1 menit.

---

**Done!** 🎉
