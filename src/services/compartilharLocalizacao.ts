/**
 * Demo: o aluno a bordo compartilha a posição do celular para o ônibus aparecer no mapa dos
 * colegas quando o motorista não usa o app. A sessão fica neste módulo, e não numa tela, para
 * continuar quando o aluno troca de tela. No Android o serviço em primeiro plano (o mesmo do
 * motorista) mantém o envio com a tela bloqueada. No site o navegador só envia com a aba visível.
 */
import { api } from '../api/client';
import { requestLocationPermission } from '../features/map/hooks/useLocationPermission';
import { manterTelaAcesa } from '../utils/telaAcesa';
import {
  INTERVALO_ENVIO_MS,
  PRAZO_RESPOSTA_MS,
  SILENCIO_APOS_RECUSA_MS,
  corpoDoRelato,
  devePerguntarSeChegou,
  deveParar,
  estaPertoDoDestino,
  leituraDeveSerEnviada,
  proximoContador,
} from '../utils/colaborativa';
import { iniciarServicoViagem, pararServicoViagem } from './servicoViagem';

type Leitura = { latitude: number; longitude: number; precisao: number; em: number };
type Destino = { latitude: number; longitude: number; nome?: string };
type Sessao = {
  viagemId: string;
  destino: Destino | null;
  soltarTela: () => void;
  observador: number | null;
  temporizador: ReturnType<typeof setInterval>;
  // Chegada ao destino: envios seguidos perto dele, pergunta em andamento e silêncio depois de uma recusa.
  noDestino: number;
  perguntando: boolean;
  prazoDaResposta: ReturnType<typeof setTimeout> | null;
  silenciadoAte: number;
};
export type EstadoSessao = { viagemId: string | null; perguntando: boolean };
export type MotivoParada = 'manual' | 'chegada' | 'erro';
export type ResultadoInicio = 'ok' | 'sem-permissao' | 'sem-gps';

let Geolocation: typeof navigator.geolocation | null = null;
try {
  Geolocation = require('@react-native-community/geolocation').default;
} catch {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    Geolocation = navigator.geolocation;
  }
}

let sessao: Sessao | null = null;
let ultimaLeitura: Leitura | null = null;
let motivoDaUltimaParada: MotivoParada = 'manual';
const ouvintes = new Set<(estado: EstadoSessao) => void>();

export const estadoDaSessao = (): EstadoSessao => ({
  viagemId: sessao ? sessao.viagemId : null,
  perguntando: sessao ? sessao.perguntando : false,
});

const avisarOuvintes = () => {
  const atual = estadoDaSessao();
  ouvintes.forEach((ouvinte) => ouvinte(atual));
};

export const viagemCompartilhando = (): string | null => (sessao ? sessao.viagemId : null);
export const motivoDaParada = (): MotivoParada => motivoDaUltimaParada;

export function escutarCompartilhamento(ouvinte: (estado: EstadoSessao) => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

const guardarLeitura = (posicao: { coords: { latitude: number; longitude: number; accuracy?: number } }) => {
  ultimaLeitura = {
    latitude: posicao.coords.latitude,
    longitude: posicao.coords.longitude,
    precisao: posicao.coords.accuracy || 30,
    em: Date.now(),
  };
};

// A cada envio confere se o aluno chegou ao destino. Pergunta uma vez; sem resposta, para sozinho.
function verificarChegada(): void {
  const atual = sessao;
  if (!atual || !atual.destino || atual.perguntando) return;
  atual.noDestino = proximoContador(atual.noDestino, estaPertoDoDestino(ultimaLeitura, atual.destino));
  if (!devePerguntarSeChegou({ contador: atual.noDestino, silenciadoAte: atual.silenciadoAte, agoraMs: Date.now() })) {
    return;
  }
  atual.perguntando = true;
  atual.prazoDaResposta = setTimeout(() => {
    pararCompartilhamento(true, 'chegada');
  }, PRAZO_RESPOSTA_MS);
  avisarOuvintes();
}

// Resposta do aluno à pergunta "você chegou ao seu destino?".
export function responderChegada(cheguei: boolean): void {
  const atual = sessao;
  if (!atual || !atual.perguntando) return;
  if (atual.prazoDaResposta) clearTimeout(atual.prazoDaResposta);
  atual.prazoDaResposta = null;
  if (cheguei) {
    pararCompartilhamento(true, 'chegada');
    return;
  }
  atual.perguntando = false;
  atual.noDestino = 0;
  atual.silenciadoAte = Date.now() + SILENCIO_APOS_RECUSA_MS;
  avisarOuvintes();
}

async function enviarAgora(): Promise<void> {
  if (!sessao || !leituraDeveSerEnviada(ultimaLeitura, Date.now())) return;
  verificarChegada();
  if (!sessao) return;
  const viagemId = sessao.viagemId;
  try {
    await api.post(`/viagens/${viagemId}/colaborativa/relato`, corpoDoRelato(ultimaLeitura as Leitura));
  } catch (erro) {
    const codigo = (erro as { statusCode?: number | null })?.statusCode;
    // Viagem encerrada, janela de horário fechada ou presença cancelada: não adianta insistir.
    if (deveParar(codigo ?? null) && sessao && sessao.viagemId === viagemId) {
      await pararCompartilhamento(false, 'erro');
    }
  }
}

export async function iniciarCompartilhamento(
  viagemId: string,
  destino: Destino | null = null,
): Promise<ResultadoInicio> {
  if (sessao && sessao.viagemId === viagemId) return 'ok';
  if (sessao) await pararCompartilhamento(true);
  const geo = Geolocation;
  if (!geo) return 'sem-gps';
  if (!(await requestLocationPermission())) return 'sem-permissao';

  // Android: serviço em primeiro plano com notificação fixa. Sem ele o envio pode parar com a tela bloqueada.
  await iniciarServicoViagem();
  const soltarTela = manterTelaAcesa();
  ultimaLeitura = null;
  const opcoes = { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 };
  const observador = geo.watchPosition(guardarLeitura, () => {}, {
    ...opcoes,
    distanceFilter: 0,
    interval: 5_000,
    fastestInterval: 3_000,
  } as PositionOptions);
  geo.getCurrentPosition(
    (posicao) => {
      guardarLeitura(posicao);
      enviarAgora();
    },
    () => {},
    opcoes,
  );
  const temporizador = setInterval(enviarAgora, INTERVALO_ENVIO_MS);
  sessao = {
    viagemId,
    destino,
    soltarTela,
    observador,
    temporizador,
    noDestino: 0,
    perguntando: false,
    prazoDaResposta: null,
    silenciadoAte: 0,
  };
  avisarOuvintes();
  return 'ok';
}

export async function pararCompartilhamento(
  avisarServidor = true,
  motivo: MotivoParada = 'manual',
): Promise<void> {
  const atual = sessao;
  if (!atual) return;
  sessao = null;
  motivoDaUltimaParada = motivo;
  clearInterval(atual.temporizador);
  if (atual.prazoDaResposta) clearTimeout(atual.prazoDaResposta);
  if (atual.observador != null && Geolocation) Geolocation.clearWatch(atual.observador);
  atual.soltarTela();
  ultimaLeitura = null;
  avisarOuvintes();
  await pararServicoViagem();
  if (avisarServidor) {
    try {
      await api.delete(`/viagens/${atual.viagemId}/colaborativa/relato`);
    } catch {
      // O servidor descarta a leitura sozinho em 30 s.
    }
  }
}

export type EstadoColaborativo = {
  ativa: boolean;
  pode_compartilhar?: boolean;
  motivo?: string | null;
  destino?: Destino | null;
  compartilhando?: number;
  eu_compartilhando?: boolean;
  em_andamento?: boolean;
  sinal_ha_segundos?: number | null;
};

export async function buscarEstado(viagemId: string): Promise<EstadoColaborativo> {
  const resposta = await api.get<EstadoColaborativo>(`/viagens/${viagemId}/colaborativa`);
  return resposta.data;
}

export async function pedirLocalizacao(viagemId: string): Promise<{ avisados: number; motivo?: string }> {
  const resposta = await api.post<{ avisados: number; motivo?: string }>(
    `/viagens/${viagemId}/colaborativa/pedido`,
  );
  return resposta.data;
}
