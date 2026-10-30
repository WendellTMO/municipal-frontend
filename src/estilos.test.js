// Toda chave usada como styles.algo precisa existir no `const styles = StyleSheet.create({...})`
// do mesmo arquivo. Um estilo apagado sem querer não dá erro: a tela só se desmonta no aparelho.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname);

const arquivos = pasta => {
  const lista = [];
  for (const nome of fs.readdirSync(pasta)) {
    const caminho = path.join(pasta, nome);
    if (fs.statSync(caminho).isDirectory()) {
      lista.push(...arquivos(caminho));
    } else if (/\.(js|tsx)$/.test(nome) && !/\.test\./.test(nome)) {
      lista.push(caminho);
    }
  }
  return lista;
};

// Chaves de primeiro nível do bloco `const styles = StyleSheet.create({ ... })`.
const chavesDoBloco = texto => {
  const inicio = texto.indexOf('const styles = StyleSheet.create({');
  if (inicio < 0) return null;
  const linhas = texto.slice(inicio).split('\n').slice(1);
  const chaves = new Set();
  let nivel = 0;
  for (const linha of linhas) {
    const m = linha.match(/^ {2}([A-Za-z0-9_]+):/);
    if (m && nivel === 0) chaves.add(m[1]);
    nivel += (linha.match(/\{/g) || []).length - (linha.match(/\}/g) || []).length;
    if (nivel < 0) break;
  }
  return chaves;
};

test('nenhum styles.algo usado sem estar definido', () => {
  const problemas = [];
  for (const arquivo of arquivos(RAIZ)) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    const chaves = chavesDoBloco(texto);
    if (!chaves) continue;
    const usados = new Set();
    for (const m of texto.matchAll(/\bstyles\.([A-Za-z0-9_]+)/g)) usados.add(m[1]);
    const faltam = [...usados].filter(u => !chaves.has(u));
    if (faltam.length > 0) problemas.push(`${path.relative(RAIZ, arquivo)}: ${faltam.join(', ')}`);
  }
  expect(problemas).toEqual([]);
});
