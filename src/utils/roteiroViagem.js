import { formatarSentido } from './formatarSentido';

export const TITULO_EMBARQUE = 'Pontos de Embarque';
export const TITULO_INSTITUICAO = 'Instituição de Ensino';
export const TITULO_DESEMBARQUE = 'Pontos de Desembarque';

export const textoAlunos = quantidade => {
  if (quantidade === 1) return '1 aluno';
  return `${quantidade} alunos`;
};

// Nomes dos alunos confirmados que embarcam (ou descem) no ponto indicado.
const nomesNoPonto = (alunos, campo, pontoId) => {
  const nomes = [];
  if (!pontoId) return nomes;
  for (const aluno of alunos || []) {
    if (!aluno.confirmacao) continue;
    if (String(aluno[campo]) !== String(pontoId)) continue;
    nomes.push(aluno.nome || '');
  }
  return nomes;
};

// Linha de uma parada comum: pílula com "N alunos" (ou "0") e a lista de nomes.
const itemComum = (parada, nomes) => {
  const quantidade = nomes.length;
  return {
    chave: String(parada.ponto.id ?? parada.numero),
    numero: parada.numero,
    estado: parada.estado,
    nome: parada.ponto.apelido || `Ponto ${parada.numero}`,
    detalhe: null,
    instituicao: false,
    etiquetas: [{ texto: quantidade === 0 ? '0' : textoAlunos(quantidade), tom: quantidade === 0 ? 'cinza' : 'azul' }],
    listas: [{ titulo: null, nomes }],
    vazio: quantidade === 0,
  };
};

// Linha da instituição: "Descem N" e/ou "Sobem N", conforme o sentido.
const itemInstituicao = (parada, alunos, mostraDescem, mostraSobem) => {
  const descem = nomesNoPonto(alunos, 'ponto_destino_id', parada.ponto.id);
  const sobem = nomesNoPonto(alunos, 'ponto_embarque_id', parada.ponto.id);
  const etiquetas = [];
  const listas = [];
  const doisLados = mostraDescem && mostraSobem;
  if (mostraDescem) {
    etiquetas.push({ texto: `Descem ${descem.length}`, tom: 'ambar' });
    listas.push({ titulo: doisLados ? 'Descem' : null, nomes: descem });
  }
  if (mostraSobem) {
    etiquetas.push({ texto: `Sobem ${sobem.length}`, tom: 'ambar' });
    listas.push({ titulo: doisLados ? 'Sobem' : null, nomes: sobem });
  }
  const inst = parada.instituicao;
  let detalhe = null;
  if (inst) detalhe = inst.tipo || inst.endereco || null;
  let total = 0;
  for (const lista of listas) total += lista.nomes.length;
  return {
    chave: String(parada.ponto.id ?? parada.numero),
    numero: parada.numero,
    estado: parada.estado,
    nome: inst ? inst.nome : parada.ponto.apelido,
    detalhe,
    instituicao: true,
    etiquetas,
    listas,
    vazio: total === 0,
  };
};

const montarGrupo = (titulo, itens, mostrarTotal) => {
  let total = 0;
  for (const item of itens) {
    for (const lista of item.listas) total += lista.nomes.length;
  }
  return { titulo, itens, total: mostrarTotal ? total : null };
};

/**
 * Grupos do Roteiro, na ordem Embarque, Instituição, Desembarque.
 * tipo: sentido da viagem (IDA, VOLTA, CIRCULAR). paradas: saída de montarParadas.
 * alunos: viagem.alunos, com confirmacao, nome, ponto_embarque_id e ponto_destino_id.
 */
export const montarRoteiro = (tipo, paradas, alunos) => {
  const sentido = formatarSentido(tipo);
  const ida = sentido === 'Ida';
  const volta = sentido === 'Volta';
  const circular = sentido === 'Circular';

  let posInstituicao = -1;
  for (let i = 0; i < paradas.length; i++) {
    if (paradas[i].instituicao) {
      posInstituicao = i;
      break;
    }
  }
  const temInstituicao = posInstituicao >= 0;

  const embarque = [];
  const instituicoes = [];
  const desembarque = [];

  for (let i = 0; i < paradas.length; i++) {
    const parada = paradas[i];
    if (parada.instituicao) {
      instituicoes.push(itemInstituicao(parada, alunos, ida || circular, volta || circular));
      continue;
    }
    const sobem = nomesNoPonto(alunos, 'ponto_embarque_id', parada.ponto.id);
    const descem = nomesNoPonto(alunos, 'ponto_destino_id', parada.ponto.id);

    if (ida) {
      embarque.push(itemComum(parada, sobem));
    } else if (volta) {
      desembarque.push(itemComum(parada, descem));
    } else if (!temInstituicao) {
      embarque.push(itemComum(parada, sobem));
    } else if (i < posInstituicao) {
      embarque.push(itemComum(parada, sobem));
      if (descem.length > 0) desembarque.push(itemComum(parada, descem));
    } else {
      desembarque.push(itemComum(parada, descem));
      if (sobem.length > 0) embarque.push(itemComum(parada, sobem));
    }
  }

  // O circular mistura os dois lados: a ordem do grupo segue a ordem da rota.
  const ordemRota = (a, b) => a.numero - b.numero;
  embarque.sort(ordemRota);
  desembarque.sort(ordemRota);

  const grupos = [];
  if (embarque.length > 0) grupos.push(montarGrupo(TITULO_EMBARQUE, embarque, true));
  if (instituicoes.length > 0) grupos.push(montarGrupo(TITULO_INSTITUICAO, instituicoes, false));
  if (desembarque.length > 0) grupos.push(montarGrupo(TITULO_DESEMBARQUE, desembarque, true));
  return grupos;
};
