// Envia a telemetria de uso ao backend (POST /v1/telemetria). Tudo aqui é em segundo plano: nada
// espera por ele e qualquer falha é engolida. Ver src/utils/telemetriaFila.js para o que entra.
import { AppState, Platform } from 'react-native';
import { api } from '../api/client';
import { Storage } from '../utils/storage';
import { assinarRotaAtual, lerRotaAtual } from '../navigation/rotaAtual';
import { descreverDispositivo } from '../utils/dispositivo';
import { APP_VERSION, textoDaVersao } from '../utils/feedback';
import { lerVersaoInstalada } from './versaoApp';
import { devolverLote, ligarTelemetria, limparTexto, registrar, retirarLote, telemetriaLigada } from '../utils/telemetriaFila';

export const CHAVE_TELEMETRIA = 'telemetria_ligada';
const INTERVALO_MS = 30000;

const sessaoId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let ativo = false;
let temporizador = null;
let cancelarRota = null;
let rotaAnterior = null;
let inicioDaTela = 0;
let errosInstalados = false;

const contexto = () => {
  const aparelho = descreverDispositivo(
    Platform.OS,
    Platform.constants,
    typeof navigator !== 'undefined' ? navigator.userAgent : '',
  );
  return {
    sessao_id: sessaoId,
    versao_app: textoDaVersao(APP_VERSION, lerVersaoInstalada()?.versionCode),
    plataforma: Platform.OS,
    dispositivo: aparelho?.dispositivo ?? null,
    versao_so: aparelho?.versao_so ?? null,
  };
};

// Fecha a tela que estava aberta, com o tempo que ficou, e abre a nova.
const aoMudarRota = () => {
  const agora = Date.now();
  if (rotaAnterior) registrar('tela', rotaAnterior, { dur_s: Math.round((agora - inicioDaTela) / 1000) });
  rotaAnterior = lerRotaAtual();
  inicioDaTela = agora;
};

export const enviarTelemetria = async () => {
  if (!ativo || !telemetriaLigada()) return;
  const lote = retirarLote();
  if (lote.length === 0) return;
  try {
    await api.post('/telemetria', { contexto: contexto(), eventos: lote });
  } catch (erro) {
    devolverLote(lote);
  }
};

const instalarCapturaDeErros = () => {
  if (errosInstalados) return;
  errosInstalados = true;
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', e => registrar('erro', 'js_erro', { msg: limparTexto(e.message), tela: rotaAnterior || '' }));
    window.addEventListener('unhandledrejection', e =>
      registrar('erro', 'promessa_rejeitada', { msg: limparTexto(e.reason && e.reason.message ? e.reason.message : e.reason), tela: rotaAnterior || '' }),
    );
    return;
  }
  const utilitarios = global.ErrorUtils;
  if (!utilitarios || !utilitarios.setGlobalHandler) return;
  const anterior = utilitarios.getGlobalHandler && utilitarios.getGlobalHandler();
  utilitarios.setGlobalHandler((erro, fatal) => {
    registrar('erro', fatal ? 'js_erro_fatal' : 'js_erro', { msg: limparTexto(erro && erro.message), tela: rotaAnterior || '' });
    if (anterior) anterior(erro, fatal);
  });
};

export const lerPreferenciaDeTelemetria = async () => (await Storage.getItem(CHAVE_TELEMETRIA)) !== false;

export const iniciarTelemetria = async () => {
  if (ativo) return;
  const ligada = await lerPreferenciaDeTelemetria();
  ligarTelemetria(ligada);
  if (!ligada) return;
  ativo = true;
  instalarCapturaDeErros();
  registrar('sessao', 'app_aberto');
  aoMudarRota();
  cancelarRota = assinarRotaAtual(aoMudarRota);
  temporizador = setInterval(enviarTelemetria, INTERVALO_MS);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') enviarTelemetria();
    });
  } else {
    AppState.addEventListener('change', estado => {
      if (estado !== 'active') enviarTelemetria();
    });
  }
};

// Ao sair da conta: manda o que sobrou e desliga. Outro usuário não herda a fila.
export const pararTelemetria = async () => {
  if (!ativo) return;
  aoMudarRota();
  await enviarTelemetria();
  ativo = false;
  rotaAnterior = null;
  if (temporizador) clearInterval(temporizador);
  temporizador = null;
  if (cancelarRota) cancelarRota();
  cancelarRota = null;
  ligarTelemetria(true);
};

// Chave de Configurações. Desligar apaga a fila e para de coletar na hora.
export const definirTelemetria = async ligada => {
  await Storage.setItem(CHAVE_TELEMETRIA, ligada);
  if (ligada) {
    await iniciarTelemetria();
  } else {
    ativo = false;
    if (temporizador) clearInterval(temporizador);
    temporizador = null;
    if (cancelarRota) cancelarRota();
    cancelarRota = null;
    ligarTelemetria(false);
  }
};
