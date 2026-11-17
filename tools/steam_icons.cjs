// Lancé par Electron (tools/steam_achievements.cjs --icons) : dessine l'icône de chaque succès en 256 × 256, obtenue
// (couleurs) et non obtenue (grisée, assombrie), dans le dossier du fichier de travail.
'use strict';
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const job = process.argv[process.argv.length - 1];
const items = JSON.parse(fs.readFileSync(job, 'utf8'));
const dir = path.dirname(job);
// Couleur de fond par catégorie de succès.
const COLORS = { combat: '#7a2a24', explore: '#2a5a3a', eco: '#6a5220', magic: '#4a2a6a', defi: '#22406a' };

const page = `<!doctype html><meta charset="utf-8"><canvas id="c" width="256" height="256"></canvas><script>
const COLORS = ${JSON.stringify(COLORS)};
async function draw(item, locked) {
  const c = document.getElementById('c'), g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.filter = locked ? 'grayscale(1) brightness(0.55)' : 'none';
  const bg = g.createRadialGradient(128, 110, 20, 128, 128, 170);
  bg.addColorStop(0, COLORS[item.cat] || '#4a3a2a');
  bg.addColorStop(1, '#120c08');
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(8, 8, 240, 240, 34); g.fill();
  g.lineWidth = 10; g.strokeStyle = '#d4aa5a'; g.stroke();
  g.lineWidth = 3; g.strokeStyle = '#f6dc98'; g.beginPath(); g.roundRect(20, 20, 216, 216, 26); g.stroke();
  const svg = item.svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="168" height="168" ');
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  g.drawImage(img, 44, 44, 168, 168);
  g.filter = 'none';
  return c.toDataURL('image/png');
}
</script>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 300,
    height: 300,
    webPreferences: { offscreen: true }
  });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(page));
  for (const item of items)
    for (const locked of [false, true]) {
      const url = await win.webContents.executeJavaScript(
        'draw(' + JSON.stringify(item) + ',' + locked + ')'
      );
      const file = path.join(dir, item.name + (locked ? '_locked' : '') + '.png');
      fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    }
  console.log('steam/icons : ' + items.length * 2 + ' icônes (256 × 256)');
  app.quit();
});
