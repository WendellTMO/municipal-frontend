// Núcleo da telemetria de uso: fila em memória e agregação das chamadas à API. Sem imports de
// react-native nem da API, para ser testável no jest e para o cliente HTTP poder usá-lo sem ciclo.
//
// O que entra: nome do evento e números ou textos curtos (tela, tempo, resultado). Nunca texto
// digitado, nome, e-mail, CPF ou coordenada. Quem chama escolhe os campos; aqui só se limpa o texto.
//
// shortcut: a fila vive em memória (200 eventos). Sem internet por muito tempo, ou fechando o app
// antes do envio, os mais antigos se perdem. Subir para o armazenamento do aparelho se isso importar.

export const MAX_FILA = 200;
export const MAX_POR_LOTE = 50;

let fila = [];
let agregados = {};
let ligada = true;

export const ligarTelemetria = valor => {
  ligada = !!valor;
  if (!ligada) {
    fila = [];
    agregados = {};
  }
};

export const telemetriaLigada = () => ligada;

// "DashboardAluno" vira "dashboard_aluno".
export const nomeEmMinusculas = nome =>
  String(nome || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9_.:\-/]/g, '_')
    .slice(0, 80);

// Tira o que pode identificar alguém de uma mensagem de erro: e-mail, CPF e números longos.
export const limparTexto = texto =>
  String(texto || '')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '#email')
    .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '#cpf')
    .replace(/\d{6,}/g, '#')
    .slice(0, 120);

// "/viagens/3f2a.../acao?x=1" vira "/viagens/:id/acao". Rota agrupada, sem id de ninguém.
export const rotaDaApi = url => {
  const semQuery = String(url || '').split('?')[0];
  const semHost = semQuery.replace(/^https?:\/\/[^/]+/, '').replace(/^\/v1(?=\/)/, '');
  return semHost
    .split('/')
    .map(parte => (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f-]{4,}$/i.test(parte) || /^\d+$/.test(parte) ? ':id' : parte))
    .join('/');
};

export const registrar = (tipo, nome, props) => {
  if (!ligada) return;
  fila.push({ tipo, nome: nomeEmMinusculas(nome), props: props || undefined, em: Date.now() });
  if (fila.length > MAX_FILA) fila = fila.slice(fila.length - MAX_FILA);
};

export const registrarAcao = (nome, props) => registrar('acao', nome, props);

// Uma chamada à API. Entra só no agregado: no fim vira um evento por rota com contagem e tempos.
export const registrarApi = (metodo, url, status, ms) => {
  if (!ligada) return;
  const rota = rotaDaApi(url);
  if (rota.startsWith('/telemetria')) return;
  const chave = `${String(metodo || 'get').toLowerCase()}:${rota}`.slice(0, 80);
  const atual = agregados[chave] || { n: 0, erros: 0, ms_total: 0, ms_max: 0 };
  atual.n += 1;
  if (!status || status >= 400) atual.erros += 1;
  atual.ms_total += ms;
  if (ms > atual.ms_max) atual.ms_max = ms;
  agregados[chave] = atual;
};

// Tira da fila o que vai no próximo envio, já com os agregados da API virados em eventos.
export const retirarLote = (max = MAX_POR_LOTE) => {
  const agora = Date.now();
  for (const chave of Object.keys(agregados)) {
    const a = agregados[chave];
    fila.push({
      tipo: 'api',
      nome: chave,
      props: { n: a.n, erros: a.erros, ms_medio: Math.round(a.ms_total / a.n), ms_max: Math.round(a.ms_max) },
      em: agora,
    });
  }
  agregados = {};
  const lote = fila.slice(0, max);
  fila = fila.slice(max);
  return lote;
};

// Devolve ao começo da fila o lote que não chegou ao servidor.
export const devolverLote = lote => {
  fila = lote.concat(fila).slice(0, MAX_FILA);
};

export const tamanhoDaFila = () => fila.length;

export const zerarParaTeste = () => {
  fila = [];
  agregados = {};
  ligada = true;
};
