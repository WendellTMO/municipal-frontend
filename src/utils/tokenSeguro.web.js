// Na web o token vive em cookie httpOnly: o JavaScript não lê nem grava. O que sobra aqui é
// limpar o token que versões antigas deixaram no armazenamento e saber se há sessão aberta.
import { Storage, STORAGE_KEYS } from './storage';

export const gravarToken = () => Storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
export const lerToken = async () => null;
export const apagarToken = () => Storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
// O perfil guardado no login marca a sessão aberta. O servidor confere o cookie a cada pedido.
export const temSessao = async () => !!(await Storage.getItem(STORAGE_KEYS.USER));
