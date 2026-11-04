import { distanceInMeters } from '../features/map/utils/geo';

// A rota do motorista não informa quais paradas são escolas: GET /rotas/{id}/pontos não
// traz o campo instituicao. Quando o ponto não traz, compara com as coordenadas das
// instituições cadastradas (GET /instituicoes/).
const RAIO_INSTITUICAO_M = 150;

export const instituicaoDaParada = (ponto, instituicoes) => {
  // O backend manda instituicao como texto (antigo) ou como objeto { id, nome, tipo }.
  const doPonto = ponto.instituicao;
  if (doPonto && typeof doPonto === 'object' && doPonto.nome) {
    return { id: doPonto.id || null, nome: doPonto.nome, tipo: doPonto.tipo || null, endereco: doPonto.endereco || null };
  }
  if (doPonto && typeof doPonto === 'string') return { id: null, nome: doPonto, tipo: null, endereco: null };
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
      melhor = { id: inst.id || null, nome: inst.nome, tipo: inst.tipo || null, endereco: inst.endereco || null };
    }
  }
  return melhor;
};

// Ids dos pontos em que algum aluno confirmado embarca ou desce. Devolve null enquanto ninguém
// confirmou: sem confirmação nenhuma não dá para dispensar parada, o motorista segue a rota inteira.
export const pontosUsadosPorConfirmados = alunos => {
  const usados = new Set();
  for (const aluno of alunos || []) {
    if (!aluno.confirmacao) continue;
    if (aluno.ponto_embarque_id) usados.add(String(aluno.ponto_embarque_id));
    if (aluno.ponto_destino_id) usados.add(String(aluno.ponto_destino_id));
  }
  return usados.size > 0 ? usados : null;
};

// Cada parada com seu estado: feita (id em `visitados`, em qualquer ordem), proxima (a primeira
// ainda não feita da lista) ou pendente. Com alunos confirmados, a parada em que nenhum deles
// embarca nem desce fica `dispensavel` (pode ser pulada) e nunca é a próxima.
export const montarParadas = (pontos, visitados, instituicoes, alunos) => {
  const resultado = [];
  const usados = pontosUsadosPorConfirmados(alunos);
  let achouProxima = false;
  for (let i = 0; i < pontos.length; i++) {
    let estado = 'pendente';
    const dispensavel = usados !== null && !usados.has(String(pontos[i].id));
    if (visitados.includes(pontos[i].id)) {
      estado = 'feita';
    } else if (!achouProxima && !dispensavel) {
      estado = 'proxima';
      achouProxima = true;
    }
    resultado.push({
      ponto: pontos[i],
      numero: i + 1,
      estado,
      dispensavel: dispensavel && estado !== 'feita',
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
    let id = null;
    if (aluno.instituicao && aluno.instituicao.nome) {
      id = aluno.instituicao.id || null;
      nome = aluno.instituicao.nome;
      tipo = aluno.instituicao.tipo || null;
      semInstituicao = false;
    } else if (aluno.ponto_destino) {
      nome = aluno.ponto_destino;
      semInstituicao = false;
    }
    if (!grupos.has(nome)) grupos.set(nome, { id, nome, tipo, quantidade: 0, semInstituicao });
    grupos.get(nome).quantidade += 1;
  }
  const lista = Array.from(grupos.values());
  lista.sort((a, b) => {
    if (a.semInstituicao !== b.semInstituicao) return a.semInstituicao ? 1 : -1;
    return b.quantidade - a.quantidade;
  });
  return lista;
};
