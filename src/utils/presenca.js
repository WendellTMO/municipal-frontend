// Só viagens agendadas ou em andamento aceitam confirmar ou cancelar presença.
export const aceitaPresenca = statusViagem =>
  statusViagem === 'AGENDADA' || statusViagem === 'EM_ANDAMENTO';

export const sentidoDe = viagem => (viagem && (viagem.tipo || viagem.sentido)) || 'IDA';

// A folha de escolha abre quando o backend avisa que ainda não há padrão salvo.
export const precisaEscolher = viagem => !!(viagem && viagem.precisa_escolher_ponto);

export const tituloEscolha = sentido => {
  if (sentido === 'VOLTA') return 'Onde você vai descer?';
  if (sentido === 'CIRCULAR') return 'Escolha seus pontos';
  return 'Onde você vai embarcar?';
};

// IDA escolhe o embarque, VOLTA escolhe a descida, CIRCULAR escolhe os dois.
export const pedeEmbarque = sentido => sentido !== 'VOLTA';
export const pedeDesembarque = sentido => sentido !== 'IDA';

export const escolhaCompleta = (sentido, escolha) => {
  if (pedeEmbarque(sentido) && !escolha.embarqueId) return false;
  if (pedeDesembarque(sentido) && !escolha.desembarqueId) return false;
  return true;
};

// Campos do corpo do PUT de confirmação e do PUT de meu-ponto-embarque, por sentido.
export const montarPontosDaEscolha = (sentido, escolha) => {
  const campos = {};
  if (pedeEmbarque(sentido)) campos.ponto_embarque_id = escolha.embarqueId;
  if (pedeDesembarque(sentido)) campos.ponto_desembarque_id = escolha.desembarqueId;
  return campos;
};

export const montarCorpoConfirmacao = (sentido, escolha, lembrar) => {
  const campos = montarPontosDaEscolha(sentido, escolha);
  if (lembrar) campos.lembrar_escolha = true;
  return campos;
};

const MSG_CAMPO = {
  ponto_embarque_id: 'Escolha um ponto de embarque da rota.',
  ponto_desembarque_id: 'Escolha um ponto de descida da rota.',
};

// 400 com details.field vira mensagem junto à folha. Outros erros usam o texto recebido.
export const mensagemDeErroPonto = (erro, padrao) => {
  const campo = erro && erro.details && erro.details.field;
  if (MSG_CAMPO[campo]) return MSG_CAMPO[campo];
  return padrao;
};

export const erroDeCampoPonto = erro => {
  const campo = erro && erro.details && erro.details.field;
  return !!MSG_CAMPO[campo];
};

// Linha pequena do card: "Embarca em X", "Desce em Y" ou as duas na circular.
export const linhaDosPontos = (sentido, nomeEmbarque, nomeDesembarque) => {
  const partes = [];
  if (pedeEmbarque(sentido) && nomeEmbarque) partes.push(`Embarca em ${nomeEmbarque}`);
  if (pedeDesembarque(sentido) && nomeDesembarque) partes.push(`Desce em ${nomeDesembarque}`);
  return partes.join(' · ');
};

// Ponto da instituição: desce nele na IDA e embarca nele na VOLTA. Nome só vem da API.
export const instituicaoDoSentido = (sentido, viagem, pontos) => {
  let pontoId = null;
  if (sentido === 'IDA') pontoId = viagem.ponto_destino_id;
  if (sentido === 'VOLTA') pontoId = viagem.ponto_embarque_id;
  if (!pontoId || !pontos) return {pontoId: null, nome: ''};
  for (const ponto of pontos) {
    if (ponto.id === pontoId) {
      return {pontoId, nome: ponto.instituicao ? ponto.instituicao.nome : ''};
    }
  }
  return {pontoId, nome: ''};
};

export const nomeDoPonto = (pontos, id) => {
  if (!pontos || !id) return '';
  for (const ponto of pontos) {
    if (ponto.id === id) return ponto.apelido;
  }
  return '';
};
