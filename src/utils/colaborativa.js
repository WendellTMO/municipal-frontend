// Demo: regras puras do compartilhamento da localização do ônibus pelos alunos.
import { distanciaMetros } from './coordenadas';

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

// Chegada ao destino: perto do ponto em 2 envios seguidos (cerca de 20 s), para não perguntar
// quando o ônibus só passa por ali. Sem resposta em 1 minuto o app para de compartilhar.
export const RAIO_DESTINO_M = 80;
export const LEITURAS_NO_DESTINO = 2;
export const PRAZO_RESPOSTA_MS = 60_000;
// Quem respondeu "ainda estou no ônibus" não é perguntado de novo por este tempo.
export const SILENCIO_APOS_RECUSA_MS = 10 * 60_000;

export function estaPertoDoDestino(leitura, destino) {
  if (!leitura || !destino) return false;
  const metros = distanciaMetros(leitura.latitude, leitura.longitude, destino.latitude, destino.longitude);
  return metros <= RAIO_DESTINO_M;
}

export function proximoContador(contador, dentro) {
  return dentro ? contador + 1 : 0;
}

export function devePerguntarSeChegou({ contador, silenciadoAte, agoraMs }) {
  return contador >= LEITURAS_NO_DESTINO && agoraMs >= silenciadoAte;
}
