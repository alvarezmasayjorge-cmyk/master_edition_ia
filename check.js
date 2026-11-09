import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Ejecutando verificaciones del proyecto Doctores Pro...\n');

const requiredFiles = [
  'index.html',
  'styles.css',
  'main.js',
  'config.js',
  'package.json',
  'server.js'
];

let errors = 0;

// 1. Verificar archivos esenciales
for (const file of requiredFiles) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Falta archivo esencial: ${file}`);
    errors++;
  } else {
    console.log(`✅ Archivo presente: ${file}`);
  }
}

// 2. Verificar sintaxis JavaScript con node -c
const jsFiles = ['main.js', 'config.js', 'server.js'];
for (const jsFile of jsFiles) {
  const fullPath = path.join(__dirname, jsFile);
  if (fs.existsSync(fullPath)) {
    try {
      execSync(`node -c "${fullPath}"`);
      console.log(`✅ Sintaxis JS válida: ${jsFile}`);
    } catch (e) {
      console.error(`❌ Error de sintaxis en: ${jsFile}`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n❌ Se encontraron ${errors} error(es) en la verificación.`);
  process.exit(1);
} else {
  console.log('\n✨ Todas las verificaciones pasaron exitosamente.');
}

