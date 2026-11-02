import { Storage } from './storage';
import { estadoVazio } from './chegadasViagem';

const chave = viagemId => `chegadas_viagem_${viagemId}`;

// Estado salvo da viagem; dado ausente ou estragado volta como estado vazio.
export const lerChegadas = async viagemId => {
  const salvo = await Storage.getItem(chave(viagemId));
  if (salvo && Array.isArray(salvo.visitados) && Array.isArray(salvo.pendentes)) return salvo;
  return estadoVazio();
};

export const salvarChegadas = (viagemId, estado) => Storage.setItem(chave(viagemId), estado);

export const apagarChegadas = viagemId => Storage.removeItem(chave(viagemId));
