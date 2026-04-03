# Logo/Favicon Upload Fix — Deployment Guide

## Problem
POST requests to `/admin/settings` were returning **413 (Request Entity Too Large)** when uploading logo/favicon images. This happens because:
1. Images are base64-encoded for database storage
2. Base64 is ~33% larger than binary data
3. Production Nginx had no `client_max_body_size` limit (defaults to 1MB)

## What Was Fixed

### 1. **Image Compression** (Browser-side)
- File: `components/ui/settings-image-upload.tsx`
- Resizes images to max 1200x1200px
- Converts to WebP format at 80% quality
- Limits file input to 2MB before compression
- Reduces final base64 size significantly

**Result:** A 5MB image → ~200-300KB base64 string

### 2. **Nginx Configuration** 
- Files: `nginx-vps.conf`, `nginx-hostinger.conf`
- Added `client_max_body_size 50M;` to allow 50MB POST bodies
- Matches Next.js `serverActions.bodySizeLimit` setting

### 3. **Next.js Config** (Already set)
- `next.config.ts` already has `bodySizeLimit: '50mb'`

---

## Deployment Steps

### **Option A: Manual SSH (Recommended)**

1. **SSH into production VPS:**
   ```bash
   ssh root@147.93.29.199
   ```

2. **Pull latest code:**
   ```bash
   cd /root/kidokool-lms
   git pull origin main
   ```

3. **Copy updated nginx config:**
   ```bash
   cp /root/kidokool-lms/nginx-vps.conf /etc/nginx/sites-available/kidokool.xyz
   ```

4. **Test nginx config:**
   ```bash
   nginx -t
   ```
   Expected output: `successful, configuration test is ok`

5. **Reload nginx:**
   ```bash
   systemctl reload nginx
   ```

6. **Verify:**
   ```bash
   curl -s http://localhost:3000 | head -20
   ```

---

### **Option B: Using Deployment Script**

**Prerequisites:** `sshpass` must be installed
```bash
# On Windows with WSL or Git Bash:
bash deploy-nginx-update.sh

# On macOS/Linux:
brew install sshpass
bash deploy-nginx-update.sh
```

---

## Testing

1. Open `/admin/settings` in production
2. Upload a logo and favicon image (any PNG/JPG, even large ones)
3. Click **Save All Changes**
4. Verify no 413 errors in browser console
5. Refresh page and confirm images persist and display correctly

---

## Troubleshooting

**If you still get 413 errors:**

1. Check nginx is reloaded:
   ```bash
   systemctl status nginx
   ```

2. Verify config was updated:
   ```bash
   grep client_max_body_size /etc/nginx/sites-available/kidokool.xyz
   ```
   Should output: `client_max_body_size 50M;`

3. Check server logs:
   ```bash
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

4. If using Certbot (HTTPS), also update the HTTPS server block in `/etc/nginx/sites-available/kidokool.xyz` (the one with `listen 443 ssl`)

---

## What Changed (Technical Details)

| File | Change | Impact |
|------|--------|--------|
| `components/ui/settings-image-upload.tsx` | Added image compression via Canvas API | Reduces base64 payload ~90% |
| `nginx-vps.conf` | Added `client_max_body_size 50M;` | Allows 50MB POST bodies through nginx |
| `nginx-hostinger.conf` | Added `client_max_body_size 50M;` | Backup config for Hostinger deployment |
| `next.config.ts` | No change needed | Already allows 50MB |

---

## Notes

- Images are now stored as **base64 data URIs** directly in MySQL `site_settings` table
- No external storage (S3/MinIO) needed for logo/favicon
- Browser handles all compression before sending
- Maximum recommended image size: 2MB (before compression)
