// Barra de status de referência (px) usada quando o aparelho não informa inset (web desktop).
const BARRA_REFERENCIA = 24;
// Respiro entre a área segura e o conteúdo do cabeçalho (o "desce 18 px" do painel).
const RESPIRO = 18;

// Preenchimento superior do cabeçalho: área segura real (ou a referência, se maior) mais o respiro.
export const topoDoCabecalho = (insetTop) => Math.max(insetTop || 0, BARRA_REFERENCIA) + RESPIRO;
