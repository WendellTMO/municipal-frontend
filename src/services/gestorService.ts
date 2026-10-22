import { api } from '../api/client';
import type { AlunoListResponse, InstituicaoCreateRequest, InstituicaoListResponse, InstituicaoResponse, MotoristaCreateRequest, OnibusCreateRequest, OnibusListResponse, OnibusResponse, RelatorioEstatisticas, RotaCreateRequest, RotaListResponse, RotaResponse, UserListResponse, UserResponse, ViagemCreateRequest, ViagemListQueryParams, ViagemListResponse, ViagemLoteRequest, ViagemLoteResponse, ViagemResponse } from '../types';

export const gestorService = {
  /**
   * List all routes in the municipality
   * Backend: GET /v1/rotas/
   * GESTOR sees all routes in their prefeitura
   */
  async listarRotas(): Promise<RotaListResponse> {
    const response = await api.get<RotaListResponse>('/rotas/');
    return response.data;
  },

  /**
   * List all trips with optional filters
   * Backend: GET /v1/viagens/
   * @param {object} filters - { data_inicio?, data_fim?, status?, motorista_id?, rota_id? }
   */
  async listarViagens(
    filters: ViagemListQueryParams = {}
  ): Promise<ViagemListResponse> {    
    const response = await api.get<ViagemListResponse>('/viagens/', { params: filters });
    return response.data;
  },

  /**
   * Create a new trip
   * Backend: POST /v1/viagens/
   * @param {object} viagemData - { rota_id, horario_id, data, motorista_id?, veiculo_id? }
   */
  async criarViagem(
    viagemData: ViagemCreateRequest
  ): Promise<ViagemResponse> {
    const response = await api.post<ViagemResponse>('/viagens/', viagemData);
    return response.data;
  },

  /**
   * Generate trips in batch for a date
   * Backend: POST /v1/viagens/gerar-lote
   * @param {object} viagemData - { data: string (YYYY-MM-DD) }
   */
  async gerarViagensBatch(
    viagemData: ViagemLoteRequest
  ): Promise<ViagemLoteResponse> {
    const response = await api.post<ViagemLoteResponse>('/viagens/gerar-lote', viagemData);
    return response.data;
  },

  /**
   * List all users (drivers, students, gestors)
   * Backend: GET /v1/users/
   */
  async listarUsuarios(): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/users/');
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
   * List all students
   * Backend: GET /v1/alunos/
   */
  async listarAlunos(status?: string): Promise<AlunoListResponse> {
    const params = status ? { status } : undefined;
    const response = await api.get<AlunoListResponse>('/alunos/', { params });
    return response.data;
  },

  /**
   * Create a new driver
   * Backend: POST /v1/users/motoristas
   * @param {object} motoristaData - { nome, email, password, cpf, cnh, telefone?, salario? }
   */
  async criarMotorista(
    motoristaData: MotoristaCreateRequest
  ): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/users/motoristas', motoristaData);
    return response.data;
  },

  /**
   * Create a new route
   * Backend: POST /v1/rotas/
   */
  async criarRota(rotaData: RotaCreateRequest): Promise<RotaResponse> {
    const response = await api.post<RotaResponse>('/rotas/', rotaData);
    return response.data;
  },

  /**
   * List all buses
   * Backend: GET /v1/onibus/
   */
  async listarOnibus(): Promise<OnibusListResponse> {
    const response = await api.get<OnibusListResponse>('/onibus/');
    return response.data;
  },

  /**
   * Create a new bus
   * Backend: POST /v1/onibus/
   */
  async criarOnibus(onibusData: OnibusCreateRequest): Promise<OnibusResponse> {
    const response = await api.post<OnibusResponse>('/onibus/', onibusData);
    return response.data;
  },

  /**
   * Update a bus
   * Backend: PATCH /v1/onibus/{id}
   */
  async atualizarOnibus(
    onibusId: string,
    data: Partial<OnibusCreateRequest>
  ): Promise<OnibusResponse> {
    const response = await api.patch<OnibusResponse>(`/onibus/${onibusId}`, data);
    return response.data;
  },

  /**
   * Delete a bus
   * Backend: DELETE /v1/onibus/{id}
   */
  async excluirOnibus(onibusId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/onibus/${onibusId}`);
    return response.data;
  },

  /**
   * Delete a motorista (gestor only)
   * Backend: DELETE /v1/users/motoristas/{id}
   */
  async deletarMotorista(motoristaId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/users/motoristas/${motoristaId}`);
    return response.data;
  },

  /**
   * List all institutions
   * Backend: GET /v1/instituicoes/
   */
  async listarInstituicoes(): Promise<InstituicaoListResponse> {
    const response = await api.get<InstituicaoListResponse>('/instituicoes/');
    return response.data;
  },

  /**
   * Create a new institution
   * Backend: POST /v1/instituicoes/
   */
  async criarInstituicao(instituicaoData: InstituicaoCreateRequest): Promise<InstituicaoResponse> {
    const response = await api.post<InstituicaoResponse>('/instituicoes/', instituicaoData);
    return response.data;
  },

  /**
   * Delete an institution
   * Backend: DELETE /v1/instituicoes/{id}
   */
  async excluirInstituicao(instituicaoId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/instituicoes/${instituicaoId}`);
    return response.data;
  },

  /**
   * Get operational report for a date range
   * Backend: GET /v1/dashboard/relatorios/periodo
   * Returns: viagens_realizadas, alunos_transportados, vagas_desperdicadas, km_total_rodado, media_alunos_por_km
   */
  async obterRelatorio(dataInicio: string, dataFim: string): Promise<RelatorioEstatisticas> {
    const response = await api.get<RelatorioEstatisticas>('/dashboard/relatorios/periodo', {
      params: { data_inicio: dataInicio, data_fim: dataFim },
    });
    return response.data;
  },
};
