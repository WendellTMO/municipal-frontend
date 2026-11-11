// Na web não há cofre do sistema: o token fica no armazenamento do navegador.
import { Storage, STORAGE_KEYS } from './storage';

export const gravarToken = token => Storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
export const lerToken = () => Storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
export const apagarToken = () => Storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
