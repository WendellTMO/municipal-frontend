import { InstituicaoListResponse, LocalizacaoRequest, PontoCreateRequest, PontoFlatListResponse, PontoListResponse, PontoResponse, RotaCreateRequest, RotaDetailResponse, RotaHorarioCreateRequest, RotaHorarioListResponse, RotaHorarioResponse, RotaListResponse, RotaPontosAddRequest, RotaResponse, RotaUpdateRequest, UserListResponse, ViagemCreateRequest, ViagemListQueryParams, ViagemListResponse, ViagemResponse, ViagemAcaoRequest } from '@/types';
import { api } from '../api/client';

interface LocalizacaoResponse {
  latitude: number;
  longitude: number;
  atualizado_em: string;
}

interface EnviarLocalizacaoResponse {
  message: string;
  distancia_metros: number;
}

export type OrdemInstituicao = { instituicao_id: string; nome: string; tipo?: string | null; ordem: number };

export const motoristaService = {
  /**
   * List routes assigned to the driver
   * Backend: GET /v1/rotas/me
   */
  async listarRotas(): Promise<RotaListResponse> {
    const response = await api.get<RotaListResponse>('/rotas/me');
    return response.data;
  },

  /**
   * Get route details
   * Backend: GET /v1/rotas/{id}
   */
  async obterRota(rotaId: string): Promise<RotaDetailResponse> {
      const response = await api.get<RotaDetailResponse>(`/rotas/${rotaId}`);
      return response.data;
  },

  /**
   * Create a new route
   * Backend: POST /v1/rotas/
   * @param {object} rotaData - { nome, pontos?, horarios? }
   */
  async criarRota(rotaData: RotaCreateRequest): Promise<RotaResponse> {
    const response = await api.post<RotaResponse>('/rotas/', rotaData);
    return response.data;
  },

  /**
   * Update a route
   * Backend: PUT /v1/rotas/{id}
   */
  async atualizarRota(rotaId: string, dados: RotaUpdateRequest): Promise<RotaResponse> {
    const response = await api.put<RotaResponse>(`/rotas/${rotaId}`, dados);
    return response.data;
  },

  /**
   * Delete a route
   * Backend: DELETE /v1/rotas/{id}
   */
  async excluirRota(rotaId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/rotas/${rotaId}`);
    return response.data;
  },

  /**
   * List all points in the municipality
   * Backend: GET /v1/pontos/
   */
  async listarPontos(): Promise<PontoListResponse> {
    const response = await api.get<PontoListResponse>('/pontos/');
    return response.data;
  },

  /**
   * Create a new point
   * Backend: POST /v1/pontos/
   * @param {object} pontoData - { apelido?, latitude, longitude }
   */
  async criarPonto(pontoData: PontoCreateRequest): Promise<PontoResponse> {
    const response = await api.post<PontoResponse>('/pontos/', pontoData);
    return response.data;
  },

  async adicionarPontosRota(rotaId: string, pontosData: RotaPontosAddRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/rotas/${rotaId}/pontos`, {
      pontos: pontosData.pontos?.map((p, index) => ({
        ponto_id: String(p.ponto_id),
        ordem: p.ordem || index + 1,
      })),
    });
    return response.data;
  },

  /**
   * List points for a route (ordered by ordem)
   * Backend: GET /v1/rotas/{id}/pontos
   */
  async listarPontosRota(rotaId: string): Promise<PontoFlatListResponse> {
    if (!rotaId) return { items: [], total: 0 };
    const response = await api.get<PontoFlatListResponse>(`/rotas/${rotaId}/pontos`);
    return response.data;
  },

  /**
   * Instituições de ensino (nome, tipo e coordenadas), para marcar as paradas que são escolas.
   * Backend: GET /v1/instituicoes/
   */
  async listarInstituicoes(): Promise<InstituicaoListResponse> {
    const response = await api.get<InstituicaoListResponse>('/instituicoes/');
    return response.data;
  },

  /**
   * Ordem salva das instituições de ensino da rota (só as que já foram ordenadas).
   * Backend: GET /v1/rotas/{id}/instituicoes/ordem
   */
  async obterOrdemInstituicoes(rotaId: string): Promise<{ items: OrdemInstituicao[]; total: number }> {
    const response = await api.get<{ items: OrdemInstituicao[]; total: number }>(`/rotas/${rotaId}/instituicoes/ordem`);
    return response.data;
  },

  /**
   * Regrava a ordem inteira das instituições da rota.
   * Backend: PUT /v1/rotas/{id}/instituicoes/ordem
   */
  async salvarOrdemInstituicoes(rotaId: string, instituicaoIds: string[]): Promise<{ items: OrdemInstituicao[]; total: number }> {
    const response = await api.put<{ items: OrdemInstituicao[]; total: number }>(`/rotas/${rotaId}/instituicoes/ordem`, {
      instituicao_ids: instituicaoIds,
    });
    return response.data;
  },

  /**
   * List trips assigned to the driver
   * Backend: GET /v1/viagens/minhas
   */
  async listarViagens(): Promise<ViagemListResponse> {
    const response = await api.get<ViagemListResponse>('/viagens/minhas');
    return response.data;
  },

  /**
   * List all trips in the prefeitura (for gestores)
   * Backend: GET /v1/viagens/
   * @param {object} filters - Optional filters { data_inicio, data_fim, status, motorista_id, rota_id }
   */
  async listarTodasViagens(
    filters: ViagemListQueryParams = {}
  ): Promise<ViagemListResponse> {
    const response = await api.get<ViagemListResponse>('/viagens/', { params: filters });
    return response.data;
  },

  /**
   * Create a new trip (requires GESTOR role in backend)
   * Backend: POST /v1/viagens/
   * @param {object} viagemData - { rota_id, horario_id, data, motorista_id?, veiculo_id? }
   */
  async criarViagem(viagemData: ViagemCreateRequest): Promise<ViagemResponse> {
    const response = await api.post<ViagemResponse>('/viagens/', viagemData);
    return response.data;
  },

  /**
   * Start a trip
   * Backend: PUT /v1/viagens/{id}/acao
   */
  async iniciarViagem(viagemId: string): Promise<ViagemResponse> {
    const payload : ViagemAcaoRequest = {
      acao: 'INICIAR',
    };
    const response = await api.put<ViagemResponse>(`/viagens/${viagemId}/acao`, payload);
    return response.data;
  },

  /**
   * Finish a trip
   * Backend: PUT /v1/viagens/{id}/acao
   */
  async finalizarViagem(viagemId: string): Promise<ViagemResponse> {
    const payload : ViagemAcaoRequest = {
      acao: 'FINALIZAR',
    };
    const response = await api.put<ViagemResponse>(`/viagens/${viagemId}/acao`, payload);
    
    return response.data;
  },

  /**
   * Send current driver/bus GPS position (real-time tracking).
   * Backend: POST /v1/viagens/{id}/localizacao
   * @param {string} viagemId - Trip UUID
   * @param {object} position - { latitude: number, longitude: number }
   */
  async enviarLocalizacao(
    viagemId: string,
    position: LocalizacaoRequest
  ): Promise<EnviarLocalizacaoResponse> {
    if (!viagemId || position?.latitude == null || position?.longitude == null) {
      throw new Error('viagemId e latitude/longitude são obrigatórios');
    }
    const response = await api.post<EnviarLocalizacaoResponse>(`/viagens/${viagemId}/localizacao`, position);
    return response.data;
  },

  /**
   * Get current driver/bus GPS position (real-time tracking).
   * Backend: GET /v1/viagens/{id}/localizacao
   * @param {string} viagemId - Trip UUID
   * @returns {Promise<{latitude: number, longitude: number, atualizado_em: string}>} Current position
   */
  async obterLocalizacao(viagemId: string): Promise<LocalizacaoResponse> {
    if (!viagemId) {
      throw new Error('viagemId é obrigatório');
    }
    
    const response = await api.get<LocalizacaoResponse>(`/viagens/${viagemId}/localizacao`);
    return response.data;
  },

  /**
   * List all drivers
   * Backend: GET /v1/users/motoristas
   */
  async listarMotoristas(): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/users/motoristas');
    return response.data;
  },

  /**
   * List route schedules
   * Backend: GET /v1/rotas/{id}/horarios
   */
  async listarHorariosRota(rotaId: string): Promise<RotaHorarioListResponse> {
    const response = await api.get<RotaHorarioListResponse>(`/rotas/${rotaId}/horarios`);
    return response.data;
  },

  /**
   * Add schedule to a route
   * Backend: POST /v1/rotas/{id}/horarios
   * @param {string} rotaId - Route UUID
   * @param {object} horarioData - { horario_saida, sentido, dias }
   */
  async adicionarHorarioRota(
    rotaId: string,
    horarioData: RotaHorarioCreateRequest
  ): Promise<RotaHorarioResponse> {
    const response = await api.post<RotaHorarioResponse>(
      `/rotas/${rotaId}/horarios`,
      {
        horario_saida: horarioData.horario_saida,
        sentido: horarioData.sentido,
        dias: horarioData.dias,
      }
    );
    return response.data;
  },
};
