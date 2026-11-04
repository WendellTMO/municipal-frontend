// Lê a posição uma vez. O GPS preciso falha dentro de prédio, com o celular recém ligado e no
// navegador; nesses casos tenta a posição aproximada por rede, que quase sempre responde.
// Permissão negada (código 1) não adianta tentar de novo: avisa na hora.
export const PERMISSAO_NEGADA = 1;

export const lerPosicao = (geo, aoLer, aoFalhar) => {
  geo.getCurrentPosition(
    aoLer,
    erro => {
      if (erro && erro.code === PERMISSAO_NEGADA) {
        aoFalhar(erro);
        return;
      }
      geo.getCurrentPosition(aoLer, aoFalhar, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
  );
};
