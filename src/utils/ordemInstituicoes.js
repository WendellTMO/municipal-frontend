import { instituicaoDaParada } from './paradasViagem';

// Ordem salva da rota: [{ instituicao_id, nome, tipo, ordem }] (GET /rotas/{id}/instituicoes/ordem).
// A instituição do dia pode vir com id ou só com nome (aluno sem instituicao.id), então casa pelos dois.
const normalizar = nome => String(nome || '').trim().toLowerCase();

export const posicaoNaOrdem = (instituicao, ordemSalva) => {
  for (let i = 0; i < ordemSalva.length; i++) {
    const salva = ordemSalva[i];
    if (instituicao.id && salva.instituicao_id === instituicao.id) return i;
    if (normalizar(salva.nome) === normalizar(instituicao.nome)) return i;
  }
  return -1;
};

// Instituições do dia pela ordem salva. As que não estão na ordem salva ficam por último,
// na ordem em que vieram (a ordem estável preserva o desempate por número de alunos).
export const mesclarOrdem = (instituicoes, ordemSalva) => {
  const salvas = [];
  const novas = [];
  for (const inst of instituicoes) {
    const posicao = posicaoNaOrdem(inst, ordemSalva);
    if (posicao >= 0) salvas.push({ inst, posicao });
    else novas.push(inst);
  }
  salvas.sort((a, b) => a.posicao - b.posicao);
  const resultado = [];
  for (const item of salvas) resultado.push(item.inst);
  for (const inst of novas) resultado.push(inst);
  return resultado;
};

// Nova lista com o item de `de` colocado na posição `para`.
export const moverItem = (lista, de, para) => {
  const copia = [...lista];
  if (de === para || de < 0 || de >= copia.length || para < 0 || para >= copia.length) return copia;
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
};

export const ordemMudou = (antes, depois) => {
  if (antes.length !== depois.length) return true;
  for (let i = 0; i < antes.length; i++) {
    if (antes[i].nome !== depois[i].nome) return true;
  }
  return false;
};

// Corpo do PUT: as instituições mostradas na nova ordem (só as que têm id) e depois as
// salvas que hoje não apareceram, mantendo a ordem relativa delas.
export const montarListaPut = (mostradas, ordemSalva) => {
  const ids = [];
  const vistos = new Set();
  for (const inst of mostradas) {
    if (!inst.id || vistos.has(inst.id)) continue;
    vistos.add(inst.id);
    ids.push(inst.id);
  }
  for (const salva of ordemSalva) {
    if (vistos.has(salva.instituicao_id)) continue;
    vistos.add(salva.instituicao_id);
    ids.push(salva.instituicao_id);
  }
  return ids;
};

// Entre as paradas que são instituição, aplica a ordem salva ocupando as mesmas posições.
// As demais paradas não mudam de lugar. A ordem dos pontos é renumerada pela posição final.
export const reordenarPontosPorInstituicao = (pontos, instituicoes, ordemSalva) => {
  if (!ordemSalva || ordemSalva.length === 0) return pontos;
  const posicoes = [];
  const paradasDeInstituicao = [];
  for (let i = 0; i < pontos.length; i++) {
    const inst = instituicaoDaParada(pontos[i], instituicoes);
    if (!inst) continue;
    posicoes.push(i);
    paradasDeInstituicao.push({ ...pontos[i], instituicao: inst });
  }
  const ordenadas = mesclarOrdem(
    paradasDeInstituicao.map(p => ({ ...p.instituicao, ponto: p })),
    ordemSalva,
  );
  const resultado = [...pontos];
  for (let k = 0; k < posicoes.length; k++) {
    resultado[posicoes[k]] = ordenadas[k].ponto;
  }
  return resultado.map((ponto, i) => ({ ...ponto, ordem: i + 1 }));
};
