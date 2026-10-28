import { api } from '../api/client';

export interface EnderecoCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export const cepService = {
  // GET /v1/cep/{cep} (público). cep: 8 dígitos, sem hífen.
  async buscar(cep: string): Promise<EnderecoCep> {
    const response = await api.get<EnderecoCep>(`/cep/${encodeURIComponent(cep)}`);
    return response.data;
  },
};
