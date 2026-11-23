// Demo: regras puras do compartilhamento da localização do ônibus pelos alunos.

export const INTERVALO_ENVIO_MS = 10_000;
// Leitura de GPS mais velha que isso não é enviada: o aparelho perdeu o sinal.
export const LEITURA_VALIDADE_MS = 20_000;

// Resposta de erro que encerra o compartilhamento: viagem fora do ar, sem confirmação ou recurso desligado.
export function deveParar(statusCode) {
  return statusCode === 400 || statusCode === 403 || statusCode === 404;
}

export function leituraDeveSerEnviada(leitura, agoraMs) {
  if (!leitura) return false;
  return agoraMs - leitura.em <= LEITURA_VALIDADE_MS;
}

export function corpoDoRelato(leitura) {
  return {
    latitude: leitura.latitude,
    longitude: leitura.longitude,
    precisao: leitura.precisao,
  };
}

// Texto do aviso quando ninguém envia a posição. Vazio quando já há quem compartilhe.
export function avisoSemCompartilhamento(estado) {
  if (!estado || !estado.ativa) return '';
  if (estado.compartilhando > 0 || estado.eu_compartilhando) return '';
  if (estado.sinal_ha_segundos != null && estado.sinal_ha_segundos <= 60) return '';
  return 'Ninguém está compartilhando a localização do ônibus agora.';
}
