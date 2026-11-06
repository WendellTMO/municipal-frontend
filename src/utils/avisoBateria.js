// Cartão da tela inicial do motorista sobre a bateria. Alguns celulares (realme, Xiaomi, Samsung)
// desligam o app em segundo plano e o Android não deixa o app saber se o motorista já liberou, então
// o aviso aparece uma vez e some quando ele responde.
export const CHAVE_AVISO_BATERIA = 'aviso_bateria_respondido';

// Só no Android, e só enquanto o motorista não respondeu.
export const deveMostrarAvisoDeBateria = (plataforma, respondido) => plataforma === 'android' && !respondido;
