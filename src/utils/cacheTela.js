/**
 * Guarda na memória o último dado de cada tela para mostrá-lo na hora ao voltar a ela, enquanto o
 * dado novo é buscado por trás. A chave leva o id do usuário. Morre ao fechar o app e é esvaziado no
 * logout. O dado guardado pode estar velho: quem usa sempre busca o novo logo em seguida.
 */
const guardados = new Map();

// A Home e a tela Viagens do aluno buscam a mesma lista: o mesmo nome faz a Viagens abrir na hora.
export const CACHE_VIAGENS_ALUNO = 'viagens-aluno';

export const chaveDoCache = (usuarioId, nome) => `${usuarioId || 'sem-usuario'}:${nome}`;

export const lerCache = chave => guardados.get(chave);

export const guardarCache = (chave, valor) => {
  guardados.set(chave, valor);
};

export const limparCache = () => {
  guardados.clear();
};
