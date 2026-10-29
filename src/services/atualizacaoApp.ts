import apiConfig from '../config/api';
import { ATUALIZACAO_VIA_APK_ATIVA } from '../config/atualizacao';
import { Storage } from '../utils/storage';
import { apkUrlSegura, decidirAtualizacao, deveConsultar, notasDaVersao, urlArquivoVersao } from '../utils/atualizacaoApp';
import { lerVersaoInstalada } from './versaoApp';

const CHAVE_ULTIMA = 'atualizacao_ultima_consulta';
const TIMEOUT_MS = 5000;

export interface AtualizacaoApp {
  decisao: 'opcional' | 'obrigatoria';
  versionName: string;
  notas: string[];
  apkUrl: string;
}

const buscarJson = async (url: string): Promise<unknown> => {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const resposta = await fetch(url, {
      signal: controle.signal,
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!resposta.ok) return null;
    return await resposta.json();
  } finally {
    clearTimeout(timer);
  }
};

// Devolve a atualização pendente ou null. Nunca lança: erro de rede fica em silêncio.
export const verificarAtualizacao = async (agora: number = Date.now()): Promise<AtualizacaoApp | null> => {
  try {
    if (!ATUALIZACAO_VIA_APK_ATIVA) return null;
    const instalado = lerVersaoInstalada();
    if (!instalado) return null;

    const ultima = await Storage.getItem(CHAVE_ULTIMA);
    if (!deveConsultar(ultima, agora)) return null;

    const remoto: any = await buscarJson(urlArquivoVersao(apiConfig.baseUrl));
    if (!remoto) return null;

    let decisao: string = decidirAtualizacao(instalado.versionCode, remoto);
    const apkUrl = apkUrlSegura(remoto);
    if (decisao !== 'nenhuma' && !apkUrl) decisao = 'nenhuma';
    await Storage.setItem(CHAVE_ULTIMA, { em: agora, decisao });

    if (decisao === 'nenhuma' || !apkUrl) return null;
    const versionName = typeof remoto.versionName === 'string' ? remoto.versionName : '';
    return { decisao: decisao as AtualizacaoApp['decisao'], versionName, notas: notasDaVersao(remoto), apkUrl };
  } catch (e) {
    return null;
  }
};
