// Liga o interceptor da API (que só enxerga o 401) ao AuthContext (dono da sessão em memória).
let aoExpirar = null;
let jaAvisou = false;

// Devolve a função que desfaz o registro. Registrar de novo libera um aviso novo.
export function registrarAoExpirar(funcao) {
  aoExpirar = funcao;
  jaAvisou = false;
  return () => {
    if (aoExpirar === funcao) aoExpirar = null;
  };
}

// Várias chamadas em paralelo levam 401 juntas, então só o primeiro aviso conta.
export function avisarSessaoExpirada() {
  if (!aoExpirar || jaAvisou) return;
  jaAvisou = true;
  aoExpirar();
}
