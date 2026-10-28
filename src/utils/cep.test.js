import {cepParaConsulta, camposDoCep, mensagemErroCep, MSG_CEP_NAO_ENCONTRADO, MSG_CEP_INDISPONIVEL} from './cep';

const resposta = {cep: '58429900', logradouro: 'Rua A', bairro: 'Centro', cidade: 'Campina Grande', estado: 'pb'};

describe('cepParaConsulta', () => {
  it('devolve os 8 dígitos de um CEP completo', () => {
    expect(cepParaConsulta('58429-900')).toBe('58429900');
  });
  it('devolve vazio enquanto incompleto', () => {
    expect(cepParaConsulta('58429-9')).toBe('');
    expect(cepParaConsulta('')).toBe('');
    expect(cepParaConsulta(undefined)).toBe('');
  });
});

describe('camposDoCep', () => {
  it('preenche tudo e põe a UF em maiúsculas', () => {
    expect(camposDoCep(resposta, {})).toEqual({
      logradouro: 'Rua A',
      bairro: 'Centro',
      cidade: 'Campina Grande',
      estado: 'PB',
    });
  });
  it('mantém campos que o aluno editou', () => {
    const novos = camposDoCep(resposta, {logradouro: true, estado: true});
    expect(novos).toEqual({bairro: 'Centro', cidade: 'Campina Grande'});
  });
  it('ignora campos vazios da resposta', () => {
    const novos = camposDoCep({...resposta, logradouro: '', bairro: ''}, {});
    expect(novos).toEqual({cidade: 'Campina Grande', estado: 'PB'});
  });
});

describe('mensagemErroCep', () => {
  it('404 vira CEP não encontrado', () => {
    expect(mensagemErroCep({statusCode: 404})).toBe(MSG_CEP_NAO_ENCONTRADO);
  });
  it('429, 503 e rede viram indisponível', () => {
    expect(mensagemErroCep({statusCode: 429})).toBe(MSG_CEP_INDISPONIVEL);
    expect(mensagemErroCep({statusCode: 503})).toBe(MSG_CEP_INDISPONIVEL);
    expect(mensagemErroCep(new Error('Network'))).toBe(MSG_CEP_INDISPONIVEL);
  });
});
