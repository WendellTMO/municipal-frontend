const MIN_S = 3;
const MAX_S = 60;

// Decide em ms quando enviar a próxima posição, usando o valor sugerido pelo backend.
export function proximoIntervaloMs(resposta, fallbackMs) {
  const sugerido = resposta ? resposta.intervalo_sugerido_segundos : undefined;
  if (typeof sugerido !== 'number' || !Number.isFinite(sugerido)) {
    return fallbackMs;
  }
  const limitado = Math.min(MAX_S, Math.max(MIN_S, sugerido));
  return limitado * 1000;
}
