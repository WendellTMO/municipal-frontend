// Só viagens agendadas ou em andamento aceitam confirmar ou cancelar presença.
export const aceitaPresenca = statusViagem =>
  statusViagem === 'AGENDADA' || statusViagem === 'EM_ANDAMENTO';

export const sentidoDe = viagem => (viagem && (viagem.tipo || viagem.sentido)) || 'IDA';

// A tela de pontos abre quando o backend avisa que ainda falta embarque ou desembarque.
export const precisaEscolher = viagem => !!(viagem && viagem.precisa_escolher_ponto);

const semAcento = texto =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// Pontos da busca: em ordem alfabética, filtrados pelo texto (sem acento nem maiúsculas) no
// apelido ou no endereço e limitados a `limite` para a lista não pesar em rota com muitas paradas.
export const filtrarPontos = (pontos, texto, limite = 50) => {
  const busca = semAcento(texto).trim();
  const achados = [];
  for (const ponto of pontos || []) {
    if (!busca || semAcento(ponto.apelido).includes(busca) || semAcento(ponto.endereco).includes(busca)) {
      achados.push(ponto);
    }
  }
  achados.sort((a, b) => String(a.apelido).localeCompare(String(b.apelido), 'pt-BR', {sensitivity: 'base'}));
  return {itens: achados.slice(0, limite), total: achados.length};
};

// Quem volta para casa faz o caminho inverso: basta trocar embarque e desembarque.
export const inverterEscolha = escolha => ({
  embarqueId: escolha.desembarqueId,
  desembarqueId: escolha.embarqueId,
});

// Pronta para confirmar: os dois pontos escolhidos e diferentes.
export const escolhaCompleta = escolha =>
  !!escolha.embarqueId && !!escolha.desembarqueId && escolha.embarqueId !== escolha.desembarqueId;

// A linha que recebe o próximo toque no mapa: a que ainda está vazia (embarque primeiro).
export const linhaAtivaInicial = escolha => (escolha.embarqueId && !escolha.desembarqueId ? 'des' : 'emb');

// Toque num ponto do mapa: preenche a linha ativa e passa para a outra se ela estiver vazia.
// Tocar no ponto que já está na outra linha não faz nada.
export const aposTocarNoPonto = (escolha, ativo, pontoId) => {
  if (pontoId === escolha.embarqueId || pontoId === escolha.desembarqueId) return {escolha, ativo};
  const campo = ativo === 'des' ? 'desembarqueId' : 'embarqueId';
  const outro = ativo === 'des' ? 'embarqueId' : 'desembarqueId';
  const nova = {...escolha, [campo]: pontoId};
  let proximo = ativo;
  if (!nova[outro]) proximo = ativo === 'des' ? 'emb' : 'des';
  return {escolha: nova, ativo: proximo};
};

// Corpo do PUT de confirmação: os dois pontos e o pedido para lembrar neste horário.
export const corpoConfirmacao = escolha => ({
  ponto_embarque_id: escolha.embarqueId,
  ponto_desembarque_id: escolha.desembarqueId,
  lembrar_escolha: true,
});

const MSG_CAMPO = {
  ponto_embarque_id: 'Escolha um ponto de embarque da rota.',
  ponto_desembarque_id: 'Escolha um ponto de descida diferente do embarque.',
};

// 400 com details.field vira mensagem junto à tela. Outros erros usam o texto recebido.
export const mensagemDeErroPonto = (erro, padrao) => {
  const campo = erro && erro.details && erro.details.field;
  if (MSG_CAMPO[campo]) return MSG_CAMPO[campo];
  return padrao;
};

export const erroDeCampoPonto = erro => {
  const campo = erro && erro.details && erro.details.field;
  return !!MSG_CAMPO[campo];
};

export const nomeDoPonto = (pontos, id) => {
  if (!pontos || !id) return '';
  for (const ponto of pontos) {
    if (ponto.id === id) return ponto.apelido;
  }
  return '';
};
