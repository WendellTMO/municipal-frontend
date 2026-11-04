// Sem imports de react-native: recebe os dados prontos e fica testável no jest.
// Devolve { dispositivo, versao_so } para o relato de feedback, para achar bug que só acontece em um aparelho.

export const DISPOSITIVO_MAX = 100;
export const VERSAO_SO_MAX = 40;

const cortar = (texto, max) => (texto ? String(texto).trim().slice(0, max) || null : null);

// Do navegador: "Safari 27.0.1" e "iOS 18.7". Cada regex só vale para o seu navegador.
const lerNavegador = ua => {
  const edge = /Edg\/([\d.]+)/.exec(ua);
  if (edge) return `Edge ${edge[1]}`;
  const chrome = /(?:Chrome|CriOS)\/([\d.]+)/.exec(ua);
  if (chrome) return `Chrome ${chrome[1]}`;
  const firefox = /(?:Firefox|FxiOS)\/([\d.]+)/.exec(ua);
  if (firefox) return `Firefox ${firefox[1]}`;
  const safari = /Version\/([\d.]+).*Safari/.exec(ua);
  if (safari) return `Safari ${safari[1]}`;
  return null;
};

const lerSistemaDoNavegador = ua => {
  const ios = /OS (\d+)[_.](\d+)(?:[_.](\d+))? like Mac OS X/.exec(ua);
  if (ios) return `iOS ${ios[1]}.${ios[2]}`;
  const android = /Android ([\d.]+)/.exec(ua);
  if (android) return `Android ${android[1]}`;
  const mac = /Mac OS X (\d+)[_.](\d+)/.exec(ua);
  if (mac) return `macOS ${mac[1]}.${mac[2]}`;
  if (/Windows NT/.test(ua)) return 'Windows';
  return null;
};

// "SM-S911B" de "Linux; Android 14; SM-S911B) AppleWebKit": só quando o navegador entrega o modelo.
const lerModeloAndroidDoNavegador = ua => {
  const modelo = /Android [\d.]+; ([^;)]+)\)/.exec(ua);
  return modelo && modelo[1] !== 'K' ? modelo[1].trim() : null;
};

// plataforma: 'android' | 'ios' | 'web'. constantes: Platform.constants do react-native. ua: navigator.userAgent (web).
export const descreverDispositivo = (plataforma, constantes = {}, ua = '') => {
  if (plataforma === 'android') {
    const fabricante = constantes.Manufacturer || constantes.Brand || '';
    const modelo = constantes.Model || '';
    const versao = constantes.Release ? `Android ${constantes.Release}${constantes.Version ? ` (API ${constantes.Version})` : ''}` : null;
    return { dispositivo: cortar(`${fabricante} ${modelo}`, DISPOSITIVO_MAX), versao_so: cortar(versao, VERSAO_SO_MAX) };
  }
  if (plataforma === 'ios') {
    const aparelho = constantes.interfaceIdiom === 'pad' ? 'iPad' : 'iPhone';
    const versao = constantes.osVersion ? `iOS ${constantes.osVersion}` : null;
    return { dispositivo: aparelho, versao_so: cortar(versao, VERSAO_SO_MAX) };
  }
  const navegador = lerNavegador(ua);
  const modelo = lerModeloAndroidDoNavegador(ua);
  const dispositivo = [modelo, navegador].filter(Boolean).join(' · ');
  return { dispositivo: cortar(dispositivo, DISPOSITIVO_MAX), versao_so: cortar(lerSistemaDoNavegador(ua), VERSAO_SO_MAX) };
};
