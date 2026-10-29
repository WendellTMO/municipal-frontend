import {
  deveEnviarPorDemanda,
  limparEnvio,
  registrarEnvio,
  tratarMensagemDemanda,
} from './demandaLocalizacao';

const dados = { tipo: 'demanda_localizacao', viagem_id: 'v1' };

describe('deveEnviarPorDemanda', () => {
  it('envia quando tipo, viagem e login conferem', () => {
    expect(deveEnviarPorDemanda(dados, 'v1', true)).toBe(true);
  });
  it('ignora tipo diferente', () => {
    expect(deveEnviarPorDemanda({ ...dados, tipo: 'aviso' }, 'v1', true)).toBe(false);
  });
  it('ignora viagem diferente da em andamento', () => {
    expect(deveEnviarPorDemanda(dados, 'v2', true)).toBe(false);
  });
  it('ignora quando não há viagem em andamento', () => {
    expect(deveEnviarPorDemanda(dados, undefined, true)).toBe(false);
  });
  it('ignora sem login', () => {
    expect(deveEnviarPorDemanda(dados, 'v1', false)).toBe(false);
  });
  it('ignora mensagem sem dados', () => {
    expect(deveEnviarPorDemanda(undefined, 'v1', true)).toBe(false);
  });
});

describe('tratarMensagemDemanda', () => {
  afterEach(() => limparEnvio());

  it('chama o envio registrado quando a mensagem vale', async () => {
    const enviar = jest.fn(async () => {});
    registrarEnvio('v1', enviar);
    expect(await tratarMensagemDemanda({ data: dados }, true)).toBe(true);
    expect(enviar).toHaveBeenCalledTimes(1);
  });
  it('não envia sem viagem registrada', async () => {
    expect(await tratarMensagemDemanda({ data: dados }, true)).toBe(false);
  });
  it('não envia para outra viagem', async () => {
    const enviar = jest.fn(async () => {});
    registrarEnvio('v2', enviar);
    expect(await tratarMensagemDemanda({ data: dados }, true)).toBe(false);
    expect(enviar).not.toHaveBeenCalled();
  });
});
