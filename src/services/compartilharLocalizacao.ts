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
  corpoDoRelato,
  deveParar,
  leituraDeveSerEnviada,
} from '../utils/colaborativa';
import { iniciarServicoViagem, pararServicoViagem } from './servicoViagem';

type Leitura = { latitude: number; longitude: number; precisao: number; em: number };
type Sessao = {
  viagemId: string;
  soltarTela: () => void;
  observador: number | null;
  temporizador: ReturnType<typeof setInterval>;
};
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
const ouvintes = new Set<(viagemId: string | null) => void>();

const avisarOuvintes = () => {
  const atual = sessao ? sessao.viagemId : null;
  ouvintes.forEach((ouvinte) => ouvinte(atual));
};

export const viagemCompartilhando = (): string | null => (sessao ? sessao.viagemId : null);

export function escutarCompartilhamento(ouvinte: (viagemId: string | null) => void): () => void {
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

async function enviarAgora(): Promise<void> {
  if (!sessao || !leituraDeveSerEnviada(ultimaLeitura, Date.now())) return;
  const viagemId = sessao.viagemId;
  try {
    await api.post(`/viagens/${viagemId}/colaborativa/relato`, corpoDoRelato(ultimaLeitura as Leitura));
  } catch (erro) {
    const codigo = (erro as { statusCode?: number | null })?.statusCode;
    // Viagem encerrada, janela de horário fechada ou presença cancelada: não adianta insistir.
    if (deveParar(codigo ?? null) && sessao && sessao.viagemId === viagemId) {
      await pararCompartilhamento(false);
    }
  }
}

export async function iniciarCompartilhamento(viagemId: string): Promise<ResultadoInicio> {
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
  sessao = { viagemId, soltarTela, observador, temporizador };
  avisarOuvintes();
  return 'ok';
}

export async function pararCompartilhamento(avisarServidor = true): Promise<void> {
  const atual = sessao;
  if (!atual) return;
  sessao = null;
  clearInterval(atual.temporizador);
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
