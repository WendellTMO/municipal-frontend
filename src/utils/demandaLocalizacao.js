// Estado e regra do push "demanda_localizacao": o backend pede a posição na hora
// quando um aluno abre o mapa. Sem este registro (nenhuma viagem em andamento aqui), o push é ignorado.
let envioAtual = null;

export function registrarEnvio(viagemId, enviar) {
  envioAtual = { viagemId, enviar };
}

export function limparEnvio() {
  envioAtual = null;
}

// Só dispara se o tipo for o certo, a viagem for a que está em andamento neste aparelho e houver login.
export function deveEnviarPorDemanda(dados, viagemEmAndamentoId, logado) {
  if (!logado || !viagemEmAndamentoId || !dados) return false;
  if (dados.tipo !== 'demanda_localizacao') return false;
  return dados.viagem_id === viagemEmAndamentoId;
}

export async function tratarMensagemDemanda(mensagem, logado) {
  if (!envioAtual) return false;
  const dados = mensagem ? mensagem.data : null;
  if (!deveEnviarPorDemanda(dados, envioAtual.viagemId, logado)) return false;
  await envioAtual.enviar();
  return true;
}
