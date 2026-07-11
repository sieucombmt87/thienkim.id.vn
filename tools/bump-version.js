// =============================================
// TK BUMP VERSION
// Mỗi lần có update, chạy:
//   node tools/bump-version.js
// để +1 patch version (0.0.2 -> 0.0.3 -> 0.0.4 ...)
// =============================================

const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, '..', 'config', 'version.js');
const README_FILE = path.join(__dirname, '..', 'README.md');

function bump() {
  const src = fs.readFileSync(VERSION_FILE, 'utf8');
  const m = src.match(/TK_VERSION\s*=\s*'([0-9]+)\.([0-9]+)\.([0-9]+)'/);
  if (!m) {
    console.error('Khong tim thay TK_VERSION trong config/version.js');
    process.exit(1);
  }
  const major = parseInt(m[1], 10);
  const minor = parseInt(m[2], 10);
  const patch = parseInt(m[3], 10);
  const next = `${major}.${minor}.${patch + 1}`;
  const prev = `${major}.${minor}.${patch}`;

  const updated = src.replace(
    /TK_VERSION\s*=\s*'[0-9]+\.[0-9]+\.[0-9]+'/,
    `TK_VERSION = '${next}'`
  );
  fs.writeFileSync(VERSION_FILE, updated, 'utf8');

  // Cap nhat README neu co entry TKver cu
  if (fs.existsSync(README_FILE)) {
    let readme = fs.readFileSync(README_FILE, 'utf8');
    const today = new Date().toISOString().slice(0, 10);
    const entry = `# TKver${next} - Auto Bump\n\n- Bump version tu dong: ${prev} -> ${next} (${today}).\n\n`;
    if (!readme.startsWith(`# TKver${next}`)) {
      readme = entry + readme;
      fs.writeFileSync(README_FILE, readme, 'utf8');
    }
  }

  console.log(`OK: ${prev} -> ${next}`);
  console.log(`Da cap nhat ${VERSION_FILE}`);
  console.log(`Nho commit + push de version moi len GitHub Pages.`);
}

bump();