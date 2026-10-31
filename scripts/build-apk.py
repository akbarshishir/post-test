#!/usr/bin/env python3
import os
import shutil
import subprocess
import zipfile
import base64
import hashlib

def build_apk():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    staging_dir = '/tmp/apk-staging'
    base_dir = '/tmp/apk-base'
    dist_dir = os.path.join(root_dir, 'dist')

    print("=== Step 1: Cleaning and preparing staging ===")
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir)
    os.makedirs(staging_dir, exist_ok=True)

    # 1. Copy base Android files from /tmp/apk-base
    for item in ['AndroidManifest.xml', 'classes.dex', 'resources.arsc']:
        src = os.path.join(base_dir, item)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(staging_dir, item))
            print(f"Copied {item} ({os.path.getsize(src)} bytes)")
        else:
            raise FileNotFoundError(f"Missing base file: {src}")

    res_src = os.path.join(base_dir, 'res')
    if os.path.exists(res_src):
        shutil.copytree(res_src, os.path.join(staging_dir, 'res'))
        print("Copied res directory")

    # Ensure app.bundle.js is generated from the latest main index chunk
    dist_assets = os.path.join(dist_dir, 'assets')
    js_files = [f for f in os.listdir(dist_assets) if f.startswith('index-') and f.endswith('.js')]
    if js_files:
        main_chunk = os.path.join(dist_assets, js_files[0])
        bundle_out = os.path.join(dist_assets, 'app.bundle.js')
        print(f"Bundling {main_chunk} into standalone IIFE bundle {bundle_out}...")
        subprocess.run([
            'npx', 'esbuild', main_chunk,
            '--bundle', '--format=iife', '--target=chrome80',
            f'--outfile={bundle_out}', '--minify'
        ], check=True)

    # 2. Copy web assets to assets/ inside staging
    assets_dir = os.path.join(staging_dir, 'assets')
    os.makedirs(assets_dir, exist_ok=True)

    for item in os.listdir(dist_dir):
        s = os.path.join(dist_dir, item)
        d = os.path.join(assets_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)

    print(f"Copied dist web assets to {assets_dir}")

    # 3. Create mobile-optimized index.html for Android WebView
    # Replace ES module script with classic script to avoid Chromium file:// CORS issues
    index_path = os.path.join(assets_dir, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Find the CSS file in assets
    css_files = [f for f in os.listdir(os.path.join(dist_dir, 'assets')) if f.endswith('.css')]
    css_ref = f"./assets/{css_files[0]}" if css_files else "./assets/index.css"

    # Android WebView HTML with robust fallback and app.bundle.js
    android_html = f"""<!doctype html>
<html lang="bn">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>কাগজ বক্স - অফলাইন পিওএস ম্যানেজার</title>
    <meta name="theme-color" content="#0f172a" />
    <link rel="icon" type="image/svg+xml" href="./icon.svg" />
    <link rel="stylesheet" href="{css_ref}">
    <link rel="manifest" href="./manifest.webmanifest">
    <script>
      window.__IS_ANDROID_APK__ = true;
      // Disable service worker on file:// protocol to avoid SecurityError
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {{
        window.addEventListener('load', function() {{
          navigator.serviceWorker.register('./sw.js').catch(function() {{}});
        }});
      }}
    </script>
  </head>
  <body class="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
    <div id="root">
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; text-align: center;">
        <div style="width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #2563eb, #1d4ed8); display: flex; align-items: center; justify-content: center; font-size: 30px; margin-bottom: 16px; box-shadow: 0 10px 25px -5px rgba(37,99,235,0.4);">
          📦
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">কাগজ বক্স - অফলাইন পিওএস</h1>
        <p style="margin: 0 0 24px 0; font-size: 13px; color: #94a3b8;">অ্যাপটি চালু হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
        <div style="width: 36px; height: 36px; border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <style>@keyframes spin {{ to {{ transform: rotate(360deg); }} }}</style>
      </div>
    </div>
    <!-- Direct synchronous IIFE bundle (no CORS on file://) -->
    <script src="./assets/app.bundle.js"></script>
  </body>
</html>
"""
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(android_html)
    print("Prepared Android WebView index.html")

    # 4. Generate META-INF signatures (APK Signature Scheme v1)
    meta_dir = os.path.join(staging_dir, 'META-INF')
    os.makedirs(meta_dir, exist_ok=True)

    # Collect all files to sign
    all_files = []
    for root, _, files in os.walk(staging_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, staging_dir)
            if not rel_path.startswith('META-INF'):
                all_files.append((rel_path.replace(os.sep, '/'), full_path))

    # Sort files deterministically
    all_files.sort(key=lambda x: x[0])

    manifest_lines = ["Manifest-Version: 1.0\nCreated-By: 1.0 (Android)\n\n"]
    sf_lines = ["Signature-Version: 1.0\nCreated-By: 1.0 (Android)\n"]

    manifest_file_blocks = {}
    for rel_path, full_path in all_files:
        with open(full_path, 'rb') as f:
            content = f.read()
        digest = base64.b64encode(hashlib.sha256(content).digest()).decode('ascii')
        block = f"Name: {rel_path}\nSHA-256-Digest: {digest}\n\n"
        manifest_lines.append(block)
        manifest_file_blocks[rel_path] = block

    manifest_content = "".join(manifest_lines).encode('utf-8')
    manifest_path = os.path.join(meta_dir, 'MANIFEST.MF')
    with open(manifest_path, 'wb') as f:
        f.write(manifest_content)

    manifest_digest = base64.b64encode(hashlib.sha256(manifest_content).digest()).decode('ascii')
    sf_lines.append(f"SHA-256-Digest-Manifest: {manifest_digest}\n\n")

    for rel_path, _ in all_files:
        block = manifest_file_blocks[rel_path].encode('utf-8')
        block_digest = base64.b64encode(hashlib.sha256(block).digest()).decode('ascii')
        sf_lines.append(f"Name: {rel_path}\nSHA-256-Digest: {block_digest}\n\n")

    sf_content = "".join(sf_lines).encode('utf-8')
    sf_path = os.path.join(meta_dir, 'ANDROIDD.SF')
    with open(sf_path, 'wb') as f:
        f.write(sf_content)

    # Sign ANDROIDD.SF using openssl CMS / PKCS#7
    key_path = '/tmp/debug.key'
    crt_path = '/tmp/debug.crt'
    rsa_path = os.path.join(meta_dir, 'ANDROIDD.RSA')

    subprocess.run([
        'openssl', 'cms', '-sign', '-nodetach',
        '-in', sf_path,
        '-signer', crt_path,
        '-inkey', key_path,
        '-outform', 'DER',
        '-out', rsa_path
    ], check=True)
    print("Generated APK Signature v1 (MANIFEST.MF, ANDROIDD.SF, ANDROIDD.RSA)")

    # 5. Pack everything into APK zip
    output_apk = '/tmp/app-debug.apk'
    if os.path.exists(output_apk):
        os.remove(output_apk)

    with zipfile.ZipFile(output_apk, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        # Write files in order: AndroidManifest, assets, classes.dex, res, resources.arsc, META-INF
        for root, _, files in os.walk(staging_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, staging_dir).replace(os.sep, '/')
                z.write(full_path, rel_path)

    apk_size = os.path.getsize(output_apk)
    print(f"Built APK: {output_apk} (Size: {apk_size} bytes / {apk_size / (1024*1024):.2f} MB)")
    if apk_size < 1024 * 1024:
        raise ValueError(f"APK size {apk_size} is less than 1MB!")

    # 6. Copy to required locations:
    destinations = [
        os.path.join(root_dir, '.build-outputs', 'app-debug.apk'),
        os.path.join(root_dir, 'APK_DOWNLOAD', 'app-debug.apk'),
        os.path.join(root_dir, 'public', 'downloads', 'app-debug.apk'),
    ]

    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(output_apk, dest)
        print(f"Copied APK to: {dest} ({os.path.getsize(dest)} bytes)")

    print("APK build and deployment complete!")

if __name__ == '__main__':
    build_apk()
