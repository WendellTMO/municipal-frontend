export const POSICAO_PROXIMA = 'proxima';
export const POSICAO_FIM = 'fim';
export const APELIDO_MAX = 100;

// Monta o corpo do POST /viagens/{id}/pontos. Ponto existente manda só ponto_id e posicao;
// ponto novo manda apelido (se houver), latitude, longitude e posicao. Sem nada escolhido, null.
export function montarCorpoParada({ pontoExistente, pino, nome, posicao }) {
  const posicaoFinal = posicao === POSICAO_FIM ? POSICAO_FIM : POSICAO_PROXIMA;
  if (pontoExistente) {
    return { ponto_id: String(pontoExistente.id), posicao: posicaoFinal };
  }
  if (!pino) {
    return null;
  }
  const corpo = { latitude: pino.latitude, longitude: pino.longitude, posicao: posicaoFinal };
  const apelido = String(nome == null ? '' : nome).trim().slice(0, APELIDO_MAX);
  if (apelido !== '') {
    corpo.apelido = apelido;
  }
  return corpo;
}

// Mensagem em pt-BR para o erro já interpretado pelo cliente da API (statusCode e message).
export function mensagemErroParada(erro) {
  const status = erro && erro.statusCode;
  if (status === 409) return 'Esse ponto já está na viagem.';
  if (status === 403) return 'Você não pode alterar esta viagem.';
  if (status === 404) return 'Viagem ou ponto não encontrado.';
  if (status === 400) return 'Não foi possível adicionar. A viagem precisa estar em andamento.';
  return (erro && erro.message) || 'Não foi possível adicionar a parada.';
}

// A resposta traz ponto_id; a tela guarda cada parada com id (mesmo formato dos pontos da rota).
export function paradasDaResposta(pontos) {
  const lista = [];
  for (const p of pontos || []) {
    lista.push({
      id: p.ponto_id,
      apelido: p.apelido,
      latitude: p.latitude,
      longitude: p.longitude,
      ordem: p.ordem,
    });
  }
  return lista;
}
