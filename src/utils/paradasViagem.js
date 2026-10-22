import { distanceInMeters } from '../features/map/utils/geo';

// A rota do motorista não informa quais paradas são escolas: GET /rotas/{id}/pontos não
// traz o campo instituicao. Quando o ponto não traz, compara com as coordenadas das
// instituições cadastradas (GET /instituicoes/).
const RAIO_INSTITUICAO_M = 150;

export const instituicaoDaParada = (ponto, instituicoes) => {
  if (ponto.instituicao) return { nome: ponto.instituicao, tipo: null, endereco: null };
  let melhor = null;
  let menor = RAIO_INSTITUICAO_M;
  for (const inst of instituicoes) {
    if (typeof inst.latitude !== 'number' || typeof inst.longitude !== 'number') continue;
    const metros = distanceInMeters(
      { latitude: ponto.latitude, longitude: ponto.longitude },
      { latitude: inst.latitude, longitude: inst.longitude },
    );
    if (metros <= menor) {
      menor = metros;
      melhor = { nome: inst.nome, tipo: inst.tipo || null, endereco: inst.endereco || null };
    }
  }
  return melhor;
};

// Cada parada com seu estado: feita (antes da próxima), proxima ou pendente.
export const montarParadas = (pontos, concluidas, instituicoes) => {
  const resultado = [];
  for (let i = 0; i < pontos.length; i++) {
    let estado = 'pendente';
    if (i < concluidas) estado = 'feita';
    else if (i === concluidas) estado = 'proxima';
    resultado.push({
      ponto: pontos[i],
      numero: i + 1,
      estado,
      instituicao: instituicaoDaParada(pontos[i], instituicoes),
    });
  }
  return resultado;
};

const SEM_INSTITUICAO = 'Sem instituição informada';

// Alunos confirmados agrupados por instituição de ensino, para o motorista saber por
// quais precisa passar. Usa aluno.instituicao ({ id, nome, tipo }) do backend e, enquanto
// ele não vier, o ponto_destino do aluno. Sem nenhum dos dois, vai para "Sem instituição".
// Ordem: mais alunos primeiro; "Sem instituição informada" por último.
export const agruparConfirmadosPorInstituicao = alunos => {
  const grupos = new Map();
  for (const aluno of alunos || []) {
    if (!aluno.confirmacao) continue;
    let nome = SEM_INSTITUICAO;
    let tipo = null;
    let semInstituicao = true;
    if (aluno.instituicao && aluno.instituicao.nome) {
      nome = aluno.instituicao.nome;
      tipo = aluno.instituicao.tipo || null;
      semInstituicao = false;
    } else if (aluno.ponto_destino) {
      nome = aluno.ponto_destino;
      semInstituicao = false;
    }
    if (!grupos.has(nome)) grupos.set(nome, { nome, tipo, quantidade: 0, semInstituicao });
    grupos.get(nome).quantidade += 1;
  }
  const lista = Array.from(grupos.values());
  lista.sort((a, b) => {
    if (a.semInstituicao !== b.semInstituicao) return a.semInstituicao ? 1 : -1;
    return b.quantidade - a.quantidade;
  });
  return lista;
};
