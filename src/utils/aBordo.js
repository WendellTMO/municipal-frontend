import {distanciaMetros} from './coordenadas';

// Parâmetros do estado "a bordo". Ajuste aqui.
export const CHECAGEM_INTERVALO_MS = 5 * 60 * 1000;
export const LIMITE_A_BORDO_M = 150;
export const CHECAGENS_FORA_PARA_PERGUNTAR = 2;
// Leitura de GPS mais velha que isso deixa de valer e o mapa volta ao ônibus do motorista.
export const GPS_VALIDO_MS = 60 * 1000;

// Presença confirmada (manual ou automática) com a viagem em andamento. Nesse estado o
// cancelamento fica travado. Não depende do GPS.
export function presencaTravada(confirmada, statusViagem) {
  return !!confirmada && statusViagem === 'EM_ANDAMENTO';
}

// A bordo: presença travada e GPS do aluno com leitura recente.
export function estaABordo({confirmada, statusViagem, posicaoAluno, leituraEm, agora}) {
  if (!presencaTravada(confirmada, statusViagem)) {
    return false;
  }
  if (!posicaoAluno || !leituraEm) {
    return false;
  }
  return agora - leituraEm <= GPS_VALIDO_MS;
}

// Falta posição de um dos lados: não dá para dizer que desceu, então conta como a bordo.
export function alunoAindaABordo(posAluno, posOnibus, limiteMetros) {
  if (!posAluno || !posOnibus) {
    return true;
  }
  const metros = distanciaMetros(
    posAluno.latitude,
    posAluno.longitude,
    posOnibus.latitude,
    posOnibus.longitude,
  );
  return metros <= limiteMetros;
}

// Contador de checagens fora do limite seguidas. Uma checagem a bordo zera.
export function proximoContador(contador, aindaABordo) {
  return aindaABordo ? 0 : contador + 1;
}

export function devePerguntar(contador, limite = CHECAGENS_FORA_PARA_PERGUNTAR) {
  return contador >= limite;
}
