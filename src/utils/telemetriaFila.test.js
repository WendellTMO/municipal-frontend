import {
  MAX_FILA,
  devolverLote,
  ligarTelemetria,
  limparTexto,
  nomeEmMinusculas,
  registrar,
  registrarAcao,
  registrarApi,
  retirarLote,
  rotaDaApi,
  tamanhoDaFila,
  celulaDoToque,
  registrarToque,
  zerarParaTeste,
} from './telemetriaFila';

beforeEach(zerarParaTeste);

describe('nomes e rotas', () => {
  it('nome de tela vira minúsculas com _', () => {
    expect(nomeEmMinusculas('DashboardAluno')).toBe('dashboard_aluno');
    expect(nomeEmMinusculas('InicioFimViagem')).toBe('inicio_fim_viagem');
  });

  it('rota da API troca id por :id e tira host, versão e query', () => {
    expect(rotaDaApi('/viagens/3f2a9c1e-1111-4222-8333-444455556666/acao?x=1')).toBe('/viagens/:id/acao');
    expect(rotaDaApi('https://buska.lsd.ufcg.edu.br/v1/rotas/12/pontos')).toBe('/rotas/:id/pontos');
    expect(rotaDaApi('/users/me')).toBe('/users/me');
  });

  it('mensagem de erro perde e-mail, CPF e número longo', () => {
    const limpo = limparTexto('Falha de joao@exemplo.com cpf 123.456.789-09 tel 83999999999');
    expect(limpo).not.toMatch(/joao@|123\.456|83999999999/);
    expect(limpo.length).toBeLessThanOrEqual(120);
  });
});

describe('fila', () => {
  it('guarda eventos e entrega em lote, do mais antigo para o mais novo', () => {
    registrar('tela', 'DashboardAluno', { dur_s: 4 });
    registrarAcao('presenca_confirmar');
    const lote = retirarLote();
    expect(lote.map(e => e.nome)).toEqual(['dashboard_aluno', 'presenca_confirmar']);
    expect(tamanhoDaFila()).toBe(0);
  });

  it('passa de 200 e descarta os mais antigos', () => {
    for (let i = 0; i < MAX_FILA + 30; i += 1) registrar('acao', 'clique', { i });
    expect(tamanhoDaFila()).toBe(MAX_FILA);
    expect(retirarLote(1)[0].props.i).toBe(30);
  });

  it('lote que falhou volta para o começo', () => {
    registrar('acao', 'a');
    registrar('acao', 'b');
    const lote = retirarLote(1);
    registrar('acao', 'c');
    devolverLote(lote);
    expect(retirarLote().map(e => e.nome)).toEqual(['a', 'b', 'c']);
  });

  it('desligada não guarda nada e limpa o que tinha', () => {
    registrar('acao', 'antes');
    ligarTelemetria(false);
    registrar('acao', 'depois');
    registrarApi('get', '/viagens', 200, 50);
    expect(tamanhoDaFila()).toBe(0);
    expect(retirarLote()).toEqual([]);
  });
});

describe('agregação da API', () => {
  it('vira um evento por rota com contagem, erros, média e máximo', () => {
    registrarApi('GET', '/viagens/3f2a9c1e-1111-4222-8333-444455556666', 200, 100);
    registrarApi('GET', '/viagens/aaaa9c1e-1111-4222-8333-444455556666', 500, 300);
    registrarApi('post', '/viagens/12/localizacao', 200, 40);
    const lote = retirarLote();
    const viagem = lote.find(e => e.nome === 'get:/viagens/:id');
    expect(viagem.tipo).toBe('api');
    expect(viagem.props).toEqual({ n: 2, erros: 1, ms_medio: 200, ms_max: 300 });
    expect(lote.find(e => e.nome === 'post:/viagens/:id/localizacao').props.n).toBe(1);
  });

  it('a própria telemetria não entra na conta', () => {
    registrarApi('post', '/telemetria', 200, 20);
    expect(retirarLote()).toEqual([]);
  });
});

describe('toques', () => {
  it('célula da grade 6x10, com bordas dentro da grade', () => {
    expect(celulaDoToque(0, 0, 600, 1000)).toBe('c0r0');
    expect(celulaDoToque(350, 550, 600, 1000)).toBe('c3r5');
    expect(celulaDoToque(600, 1000, 600, 1000)).toBe('c5r9');
    expect(celulaDoToque(10, 10, 0, 0)).toBeNull();
  });

  it('toques na mesma tela e célula viram um evento com contagem', () => {
    registrarToque('DashboardAluno', 'c1r2');
    registrarToque('DashboardAluno', 'c1r2');
    registrarToque('DashboardAluno', 'c4r8');
    const lote = retirarLote();
    expect(lote).toEqual([
      expect.objectContaining({ tipo: 'toque', nome: 'dashboard_aluno', props: { celula: 'c1r2', n: 2 } }),
      expect.objectContaining({ tipo: 'toque', nome: 'dashboard_aluno', props: { celula: 'c4r8', n: 1 } }),
    ]);
    expect(retirarLote()).toEqual([]);
  });

  it('desligada, não guarda toque', () => {
    ligarTelemetria(false);
    registrarToque('Login', 'c0r0');
    ligarTelemetria(true);
    expect(retirarLote()).toEqual([]);
  });
});
