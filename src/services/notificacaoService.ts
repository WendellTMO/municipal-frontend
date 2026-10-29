import { api } from '../api/client';
import type { Notificacao, NotificacaoInput } from '../types';

export const getNotificacoes = async (
  filters: { enviada?: boolean } = {},
): Promise<Notificacao[]> => {
  const params: Record<string, string> = {};
  if (filters.enviada !== undefined) {
    params.enviada = String(filters.enviada);
  }
  const response = await api.get<Notificacao[]>('/notificacoes', { params });
  return response.data;
};

export const getNotificacao = async (notificacaoId: string): Promise<Notificacao> => {
  const response = await api.get<Notificacao>(`/notificacoes/${notificacaoId}`);
  return response.data;
};

export const createNotificacao = async (
  notificacaoData: NotificacaoInput,
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/notificacoes', notificacaoData);
  return response.data;
};

export const markNotificacaoAsSent = async (
  notificacaoId: string,
): Promise<{ message: string }> => {
  const response = await api.patch<{ message: string }>(
    `/notificacoes/${notificacaoId}/lida`,
  );
  return response.data;
};

export const deleteNotificacao = async (
  notificacaoId: string,
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/notificacoes/${notificacaoId}`);
  return response.data;
};

export const updateNotificacaoSettings = async (
  usuarioId: string,
  settings: Record<string, unknown>,
): Promise<unknown> => {
  const response = await api.put(
    `/notificacoes/usuario/${usuarioId}/settings`,
    settings,
  );
  return response.data;
};

const notificacaoService = {
  getNotificacoes,
  getNotificacao,
  createNotificacao,
  markNotificacaoAsSent,
  deleteNotificacao,
  updateNotificacaoSettings,
};

export default notificacaoService;
