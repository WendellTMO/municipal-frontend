import { api } from '../api/client';
import type {
  RotaListResponse,
  RotaDetailResponse,
  RotaHorarioListResponse,
  ViagemAgendaAlunoResponse,
  ViagemAgendaAlunoListResponse,
  ViagemAlunoConfirmacaoResponse,
  PontoFlatResponse,
  PontoFlatListResponse,
  AlunoMeUpdateRequest,
  AlunoResponse,
} from '../types';
import { unwrapItems } from '../types';

export type EnderecoAluno = {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  complemento?: string | null;
};

// Normalized UI representation of a ViagemAgendaAlunoResponse
export type ViagemAgendaUI = {
  id: string | undefined;
  data: string | undefined;
  dia_semana: string | undefined;
  horario_inicio: string | undefined;
  tipo: string | undefined;
  rota_id: string | undefined;
  rota_nome: string | undefined;
  status_confirmacao: boolean | undefined;
  ponto_embarque_id: string | undefined;
  ponto_destino_id: string | undefined;
  /** true quando ainda não confirmou e não há ponto padrão salvo para o sentido */
  precisa_escolher_ponto: boolean;
  /** Trip operational status (AGENDADA | EM_ANDAMENTO | FINALIZADA | CANCELADA) */
  status_viagem: string | undefined;
  /** Motivo informado por quem cancelou (só em viagem CANCELADA) */
  motivo_cancelamento?: string | null;
  alunos_confirmados_count: number;
  total_alunos: number;
};

function normalizeViagemAgenda(viagem: ViagemAgendaAlunoResponse): ViagemAgendaUI {
  const raw = viagem as Record<string, unknown>;
  return {
    id: viagem.viagem_id,
    data: viagem.data,
    dia_semana: viagem.dia_semana,
    horario_inicio: viagem.horario_saida,
    tipo: viagem.sentido,
    rota_id: viagem.rota_id,
    rota_nome: viagem.rota_nome,
    status_confirmacao: viagem.status_confirmacao,
    ponto_embarque_id: viagem.ponto_embarque_id,
    ponto_destino_id: (raw.ponto_destino_id as string) ?? undefined,
    precisa_escolher_ponto: (raw.precisa_escolher_ponto as boolean) ?? false,
    status_viagem: (raw.status_viagem as string) ?? 'AGENDADA',
    motivo_cancelamento: (raw.motivo_cancelamento as string | null) ?? null,
    alunos_confirmados_count: (raw.alunos_confirmados_count as number) ?? 0,
    total_alunos: (raw.total_alunos as number) ?? 0,
  };
}

export type EscolhaPontos = {
  ponto_embarque_id?: string;
  ponto_desembarque_id?: string;
  lembrar_escolha?: boolean;
};

export type MeuPonto = {
  rota_id: string;
  ponto_embarque: { id: string; apelido: string } | null;
  ponto_desembarque: { id: string; apelido: string } | null;
};

export const alunoService = {
  /**
   * List all available routes
   * Backend: GET /v1/rotas/
   * Note: Backend filters by role - ALUNOs see routes they can subscribe to
   */
  async listarRotas(
    opcoes: { limit?: number; offset?: number; q?: string; uf?: string; incluirOutras?: boolean } = {},
  ): Promise<RotaListResponse> {
    const params: Record<string, string | number | boolean> = {};
    if (opcoes.limit) params.limit = opcoes.limit;
    if (opcoes.offset) params.offset = opcoes.offset;
    if (opcoes.q) params.q = opcoes.q;
    if (opcoes.uf) params.uf = opcoes.uf;
    if (opcoes.incluirOutras) params.incluir_outras = true;
    const response = await api.get<RotaListResponse>('/rotas/', { params });
    return response.data;
  },

  /**
   * List routes the student is enrolled in
   * Backend: GET /v1/rotas/me
   */
  async listarMinhasRotas(): Promise<RotaListResponse> {
    const response = await api.get<RotaListResponse>('/rotas/me');
    return response.data;
  },

  /**
   * Get route details with points
   * Backend: GET /v1/rotas/{id}
   */
  async obterRota(rotaId: string): Promise<RotaDetailResponse> {
    const response = await api.get<RotaDetailResponse>(`/rotas/${rotaId}`);
    return response.data;
  },

  /**
   * Subscribe or unsubscribe from a route
   * Backend: POST /v1/rotas/{id}/inscricao
   * @param {string} rotaId - Route UUID
   * @param {string} acao - 'inscrever' or 'desinscrever'
   */
  async gerenciarInscricaoRota(
    rotaId: string,
    acao: 'inscrever' | 'desinscrever',
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/rotas/${rotaId}/inscricao`, { acao });
    return response.data;
  },

  /**
   * List upcoming trips for student agenda
   * Backend: GET /v1/viagens/aluno/agenda
   * Normalizes backend response to frontend format
   */
  async listarViagens(
    pagina: { limit?: number; offset?: number; rotaId?: string } = {},
  ): Promise<ViagemAgendaUI[]> {
    const params: Record<string, string | number> = {};
    if (pagina.limit) params.limit = pagina.limit;
    if (pagina.offset) params.offset = pagina.offset;
    if (pagina.rotaId) params.rota_id = pagina.rotaId;
    const response = await api.get<ViagemAgendaAlunoListResponse>('/viagens/aluno/agenda', { params });
    return unwrapItems(response.data).map(normalizeViagemAgenda);
  },

  /**
   * List trips the student has confirmed presence
   * Uses same endpoint as listarViagens
   */
  async listarMinhasViagens(): Promise<ViagemAgendaUI[]> {
    return this.listarViagens();
  },

  /**
   * Get boarding points for a trip
   * Backend: GET /v1/viagens/{id}/pontos-embarque
   */
  async listarPontosEmbarque(viagemId: string): Promise<PontoFlatListResponse> {
    if (!viagemId) {
      return { items: [], total: 0 };
    }
    try {
      const response = await api.get<PontoFlatListResponse>(`/viagens/${viagemId}/pontos-embarque`);
      return response.data;
    } catch {
      return { items: [], total: 0 };
    }
  },

  /**
   * TODO: This endpoint is not right
   * Get presence/confirmation status for a trip
   */
  async obterPresencaViagem(
    viagemId: string,
  ): Promise<{ presente: boolean; ponto_embarque?: unknown }> {
    if (!viagemId) {
      return { presente: false };
    }
    try {
      // TODO: this endpoint returns PontoFlatListResponse per the spec —
      // confirm with backend whether confirmado/ponto_embarque fields exist here
      const response = await api.get<{ confirmado?: boolean; ponto_embarque?: unknown }>(
        `/viagens/${viagemId}/pontos-embarque`,
      );
      return {
        presente: response.data.confirmado ?? false,
        ponto_embarque: response.data.ponto_embarque,
      };
    } catch {
      return { presente: false };
    }
  },

  /**
   * Confirm or cancel presence for a trip
   * Backend: PUT /v1/viagens/{id}/confirmacao
   * `escolha` leva ponto_embarque_id, ponto_desembarque_id e lembrar_escolha (ver utils/presenca).
   */
  async alterarPresencaViagem(
    viagemId: string,
    confirmacao: boolean,
    escolha: EscolhaPontos = {},
  ): Promise<ViagemAlunoConfirmacaoResponse> {
    if (!viagemId) {
      throw new Error('ID da viagem é obrigatório');
    }
    const payload = confirmacao ? { confirmacao, ...escolha } : { confirmacao };
    const response = await api.put<ViagemAlunoConfirmacaoResponse>(
      `/viagens/${viagemId}/confirmacao`,
      payload,
    );

    return response.data;
  },

  /** GET /v1/rotas/{id}/meu-ponto-embarque: pontos que o aluno pediu para lembrar */
  async obterMeuPonto(rotaId: string): Promise<MeuPonto> {
    const response = await api.get<MeuPonto>(`/rotas/${rotaId}/meu-ponto-embarque`);
    return response.data;
  },

  /** PUT /v1/rotas/{id}/meu-ponto-embarque: guarda embarque e/ou desembarque padrão */
  async salvarMeuPonto(
    rotaId: string,
    pontos: { ponto_embarque_id?: string; ponto_desembarque_id?: string },
  ): Promise<MeuPonto> {
    const response = await api.put<MeuPonto>(`/rotas/${rotaId}/meu-ponto-embarque`, pontos);
    return response.data;
  },

  /** DELETE /v1/rotas/{id}/meu-ponto-embarque: esquece a escolha, o app volta a perguntar */
  async esquecerMeuPonto(rotaId: string): Promise<MeuPonto> {
    const response = await api.delete<MeuPonto>(`/rotas/${rotaId}/meu-ponto-embarque`);
    return response.data;
  },

  /**
   * List all points for a route
   * Backend: GET /v1/rotas/{id}/pontos
   */
  async listarPontosRota(rotaId: string, sentido?: string): Promise<PontoFlatListResponse> {
    if (!rotaId) {
      return { items: [], total: 0 };
    }
    // Com o sentido da viagem (IDA ou VOLTA) o servidor devolve só os pontos que valem nela.
    const response = await api.get<PontoFlatListResponse>(`/rotas/${rotaId}/pontos`, {
      params: sentido ? { sentido } : undefined,
    });
    return response.data;
  },

  /**
   * Get route schedules
   * Backend: GET /v1/rotas/{id}/horarios
   */
  async listarHorariosRota(rotaId: string): Promise<RotaHorarioListResponse> {
    const response = await api.get<RotaHorarioListResponse>(`/rotas/${rotaId}/horarios`);
    return response.data;
  },

  /**
   * Busca instituições da prefeitura do aluno por nome ou sigla (sem acento, melhores primeiro).
   * Backend: GET /v1/instituicoes/busca?q=&limit=
   */
  async buscarInstituicoes(q: string, limit = 20): Promise<{ id: string; nome: string; sigla?: string | null; uf?: string | null }[]> {
    const response = await api.get('/instituicoes/busca', { params: { q, limit } });
    return unwrapItems(response.data) as { id: string; nome: string; sigla?: string | null; uf?: string | null }[];
  },

  /** GET /v1/alunos/me: perfil do aluno, com `endereco` salvo (ou null) */
  async obterPerfil(): Promise<AlunoResponse & { endereco?: EnderecoAluno | null }> {
    const response = await api.get<AlunoResponse & { endereco?: EnderecoAluno | null }>('/alunos/me');
    return response.data;
  },

  /**
   * Update student profile
   * Backend: PUT /v1/alunos/me
   */
  async atualizarPerfil(dados: AlunoMeUpdateRequest): Promise<AlunoResponse> {
    const response = await api.put<AlunoResponse>('/alunos/me', dados);
    return response.data;
  },
};
