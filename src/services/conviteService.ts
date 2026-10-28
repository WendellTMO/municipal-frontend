import { api } from '../api/client';

export interface ConviteInfo {
  nome: string;
  email: string;
  telefone: string | null;
  instituicao: { id: string; nome: string } | null;
  rota: { id: string; nome: string } | null;
}

export interface ValidarConviteResponse {
  convite: ConviteInfo;
  termos: { versao: string; texto: string };
}

// Formato plano devolvido por POST /convites/aceite/{token}/validar
interface ValidarConviteApi {
  nome: string;
  email: string;
  telefone: string | null;
  instituicao_id: string | null;
  instituicao_nome: string | null;
  rota_id: string | null;
  rota_nome: string | null;
  termos_versao: string;
  termos_texto: string;
}

export interface AceitarConviteResponse {
  id: string;
  email: string;
  status: string;
  requer_consentimento_responsavel: boolean;
}

export const conviteService = {
  // POST /v1/convites/aceite/{token}/validar (público)
  async validar(token: string, pin: string): Promise<ValidarConviteResponse> {
    const response = await api.post<ValidarConviteApi>(
      `/convites/aceite/${encodeURIComponent(token)}/validar`,
      { pin },
    );
    const d = response.data;
    return {
      convite: {
        nome: d.nome,
        email: d.email,
        telefone: d.telefone,
        instituicao: d.instituicao_id ? { id: d.instituicao_id, nome: d.instituicao_nome || '' } : null,
        rota: d.rota_id ? { id: d.rota_id, nome: d.rota_nome || '' } : null,
      },
      termos: { versao: d.termos_versao, texto: d.termos_texto },
    };
  },

  // POST /v1/convites/aceite/{token} (público)
  async aceitar(token: string, payload: Record<string, unknown>): Promise<AceitarConviteResponse> {
    const response = await api.post<AceitarConviteResponse>(
      `/convites/aceite/${encodeURIComponent(token)}`,
      payload,
    );
    return response.data;
  },
};
