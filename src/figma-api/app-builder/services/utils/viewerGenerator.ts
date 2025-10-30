// src/figma-api/app-builder/services/utils/viewerGenerator.ts

import fs from 'fs-extra';
import path from 'path';

type BundleType = 'esbuild' | 'expo' | 'expo_server';

/**
 * Generate viewer HTML with iPhone frame
 */
export async function generateViewer(
    buildPath: string,
    bundleType: BundleType,
    expoServerUrl?: string
): Promise<void> {
    // Determine the iframe source based on bundle type
    const iframeSrcAttribute = bundleType === 'expo_server'
        ? `src="${expoServerUrl}?t=${Date.now()}"`  // Add timestamp for cache busting
        : `src=""`;

    const iframeSrcScript = bundleType === 'expo_server'
        ? ''
        : `
    const currentPath = window.location.pathname;
    document.getElementById('prototypeFrame').src = currentPath + '/bundle/index.html';
  `;

    const badgeColor = bundleType === 'expo' ? '#4CAF50' : bundleType === 'expo_server' ? '#FF9800' : '#2196F3';
    const badgeText = bundleType === 'expo' ? 'PRODUCTION' : bundleType === 'expo_server' ? '🔴 LIVE DEV' : 'DEV BUILD';
    const badgeAnimation = bundleType === 'expo_server' ? 'animation: pulse 2s infinite;' : '';

    const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prototype Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .device-frame {
      width: 375px;
      height: 812px;
      background: #000;
      border-radius: 40px;
      padding: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
    }
    .device-notch {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 25px;
      background: #000;
      border-radius: 0 0 20px 20px;
      z-index: 10;
    }
    .device-screen {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      overflow: hidden;
      background: #fff;
    }
    .device-screen iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .share-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .bundle-badge {
      background: ${badgeColor};
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      ${badgeAnimation}
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .share-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .share-button:hover { background: #5568d3; }
    .share-button:active { transform: scale(0.98); }
    .copied-toast {
      position: fixed;
      top: 100px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s;
    }
    .copied-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="share-controls">
    <div class="bundle-badge">${badgeText}</div>
    <button class="share-button" onclick="copyUrl()">📋 Copy Link</button>
    <button class="share-button" onclick="openFullscreen()">🔍 Fullscreen</button>
  </div>
  <div class="copied-toast" id="toast">Link copied to clipboard!</div>
  <div class="device-frame" id="deviceFrame">
    <div class="device-notch"></div>
    <div class="device-screen">
      <iframe ${iframeSrcAttribute} id="prototypeFrame"></iframe>
    </div>
  </div>
  <script>
    function copyUrl() {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast();
      }).catch(err => console.error('Failed to copy:', err));
    }
    function showToast() {
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
    function openFullscreen() {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      }
    }
    ${iframeSrcScript}
  </script>
</body>
</html>`;

    await fs.writeFile(path.join(buildPath, 'index.html'), viewerHtml);
}