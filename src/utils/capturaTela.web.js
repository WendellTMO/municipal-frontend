// Imagem da página para anexar ao relato (web). Devolve JPEG em base64, ou null se não der.
// O html2canvas só entra no navegador quando alguém abre o feedback, fora do pacote principal.
export const LIMITE_BASE64 = 530000;
const LARGURA_MAXIMA = 720;
const TEMPO_MAXIMO_MS = 5000;
const QUALIDADES = [0.6, 0.45, 0.3];

export const tamanhoDaTela = () =>
  typeof window === 'undefined' ? null : `${window.innerWidth}x${window.innerHeight}`;

const desenhar = async () => {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(document.body, {
    scale: Math.min(1, LARGURA_MAXIMA / window.innerWidth),
    width: window.innerWidth,
    height: window.innerHeight,
    x: window.scrollX,
    y: window.scrollY,
    // Janelas (Modal) são criadas fora do #root. A da própria captura já está aberta quando o
    // html2canvas começa a copiar a página, e não pode sair na imagem.
    ignoreElements: elemento => elemento.parentElement === document.body && elemento.id !== 'root',
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
  });
  for (const qualidade of QUALIDADES) {
    const base64 = canvas.toDataURL('image/jpeg', qualidade).split(',')[1];
    if (base64 && base64.length <= LIMITE_BASE64) return base64;
  }
  return null;
};

export const capturarTela = async () => {
  if (typeof document === 'undefined') return null;
  try {
    const espera = new Promise(resolve => setTimeout(() => resolve(null), TEMPO_MAXIMO_MS));
    return await Promise.race([desenhar(), espera]);
  } catch {
    return null;
  }
};
