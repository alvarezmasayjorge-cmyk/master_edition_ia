import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targets = ['dist', 'public'];

console.log('📦 Construyendo sitio estático para producción y despliegue (Vercel / Netlify / Cloudflare)...\n');

for (const target of targets) {
  const outDir = path.join(__dirname, target);

  // 1. Limpiar o crear directorio de salida
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // 2. Archivos raíz a copiar
  const filesToCopy = [
    'index.html',
    'gracias.html',
    'styles.css',
    'script.js',
    'main.js',
    'config.js'
  ];

  for (const file of filesToCopy) {
    const src = path.join(__dirname, file);
    const dest = path.join(outDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // 3. Copiar carpeta assets si existe
  const assetsSrc = path.join(__dirname, 'assets');
  const assetsDest = path.join(outDir, 'assets');
  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  }

  const fingerprints = {};
  for (const name of ['styles.css', 'script.js']) {
    const content = fs.readFileSync(path.join(outDir, name));
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
    const ext = path.extname(name);
    const versioned = `${path.basename(name, ext)}.${hash}${ext}`;
    fs.renameSync(path.join(outDir, name), path.join(outDir, versioned));
    fingerprints[name] = versioned;
  }
  for (const name of ['index.html', 'gracias.html']) {
    const htmlPath = path.join(outDir, name);
    let html = fs.readFileSync(htmlPath, 'utf8');
    for (const [original, versioned] of Object.entries(fingerprints)) {
      html = html.replaceAll(`"${original}"`, `"${versioned}"`);
    }
    if (name === 'index.html') {
      const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
      html = html.replace(`<link rel="stylesheet" href="${fingerprints['styles.css']}">`, `<style>${css}</style>`);
    }
    fs.writeFileSync(htmlPath, html);
  }

  console.log(`✅ Carpeta generada correctamente: ${target}/`);
}

console.log('\n✨ Build terminado exitosamente compatible con Vercel (dist/ y public/).');

