// Texto sem acento e em minúsculas, para a busca achar "São" digitando "sao".
const simplificar = texto =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// Instituições cujo nome ou sigla contém todas as palavras digitadas, em qualquer ordem.
export const filtrarInstituicoes = (instituicoes, busca) => {
  const palavras = simplificar(busca).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return instituicoes;
  const achadas = [];
  for (const inst of instituicoes) {
    const alvo = simplificar(`${inst.nome} ${inst.sigla || ''}`);
    let todas = true;
    for (const palavra of palavras) {
      if (!alvo.includes(palavra)) todas = false;
    }
    if (todas) achadas.push(inst);
  }
  return achadas;
};
