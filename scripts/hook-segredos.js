#!/usr/bin/env node
// Barra segredo antes de ir para o GitHub.
//   node scripts/hook-segredos.js staged   o que está no commit (hook pre-commit)
//   node scripts/hook-segredos.js push     tudo que ainda não está no origin/demo (hook pre-push)
// Instalação: scripts/instalar-hook-de-segredos.sh
const { execSync } = require('child_process');
const fs = require('fs');
const { nomeProibido, padroesNoTexto } = require('./segredos');

const executar = comando => execSync(comando, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const arquivosDoEscopo = modo => {
  if (modo === 'staged') {
    return executar('git diff --cached --name-only --diff-filter=ACM').split('\n');
  }
  let base;
  try {
    base = executar('git merge-base HEAD origin/demo 2>/dev/null').trim();
  } catch (erro) {
    base = executar('git rev-list --max-parents=0 HEAD').trim().split('\n').pop();
  }
  return executar(`git diff --name-only --diff-filter=ACM ${base} HEAD`).split('\n');
};

const modo = process.argv[2] || 'staged';
const problemas = [];
for (const caminho of arquivosDoEscopo(modo)) {
  if (!caminho) continue;
  if (nomeProibido(caminho)) {
    problemas.push(`${caminho}: arquivo de segredo`);
    continue;
  }
  if (!fs.existsSync(caminho)) continue;
  let texto = '';
  try {
    texto = fs.readFileSync(caminho, 'utf8');
  } catch (erro) {
    continue;
  }
  for (const nome of padroesNoTexto(caminho, texto)) problemas.push(`${caminho}: ${nome}`);
}

if (problemas.length > 0) {
  console.error('BLOQUEADO: segredo no que ia para o GitHub (repositório público).');
  for (const problema of problemas) console.error('  ' + problema);
  console.error('Tire do commit (git reset HEAD arquivo) e deixe fora do git.');
  process.exit(1);
}
