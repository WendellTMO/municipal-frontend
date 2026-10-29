const fs = require('fs');
const path = require('path');
const { iconSize } = require('./spacing');

// Tamanho de ícone fora da escala cai em silêncio no padrão de 24 px (já deixou o sino do estado vazio pequeno).
const listarArquivos = dir => {
  const arquivos = [];
  for (const nome of fs.readdirSync(dir)) {
    const caminho = path.join(dir, nome);
    if (fs.statSync(caminho).isDirectory()) {
      arquivos.push(...listarArquivos(caminho));
    } else if (/\.(js|tsx|ts)$/.test(nome) && !/\.test\./.test(nome)) {
      arquivos.push(caminho);
    }
  }
  return arquivos;
};

test('todo <Icon size="nome"> usa um nome da escala de tamanhos', () => {
  const validos = Object.keys(iconSize);
  const invalidos = [];
  for (const arquivo of listarArquivos(path.join(__dirname, '..'))) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    for (const achado of texto.matchAll(/<Icon\b[^>]*\bsize="(\w+)"/g)) {
      if (!validos.includes(achado[1])) invalidos.push(`${arquivo}: ${achado[1]}`);
    }
  }
  expect(invalidos).toEqual([]);
});
