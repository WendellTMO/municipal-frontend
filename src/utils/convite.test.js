import {
  validarCadastro,
  montarPayloadAceite,
  interpretarErroConvite,
  destinoPosAceite,
  ehMenor,
} from './convite';

const anoAtras = n => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  d.setDate(d.getDate() - 2);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const formBase = () => ({
  senha: 'senha1234',
  confirmarSenha: 'senha1234',
  cpf: '123.456.789-09',
  dataNascimento: anoAtras(20),
  pedeTelefone: false,
  telefone: '',
  nomeResponsavel: '',
  cpfResponsavel: '',
  emailResponsavel: '',
  aceiteTermos: true,
  logradouro: 'Rua das Flores',
  numero: '120',
  bairro: 'Centro',
  cidade: 'Campina Grande',
  estado: 'pb',
  cep: '',
  complemento: '',
});

describe('ehMenor', () => {
  it('identifica menor e maior de idade', () => {
    expect(ehMenor(anoAtras(15))).toBe(true);
    expect(ehMenor(anoAtras(20))).toBe(false);
    expect(ehMenor('01/01')).toBe(false);
  });
});

describe('validarCadastro', () => {
  it('aceita um maior de idade completo', () => {
    expect(validarCadastro(formBase())).toEqual({});
  });

  it('valida senha, confirmação, CPF, data e termos', () => {
    const erros = validarCadastro({
      ...formBase(),
      senha: '123',
      confirmarSenha: '124',
      cpf: '123',
      dataNascimento: '',
      aceiteTermos: false,
    });
    expect(Object.keys(erros).sort()).toEqual(
      ['aceiteTermos', 'confirmarSenha', 'cpf', 'dataNascimento', 'senha'],
    );
  });

  it('exige os dados do responsável só para menor', () => {
    const menor = {...formBase(), dataNascimento: anoAtras(15)};
    const erros = validarCadastro(menor);
    expect(Object.keys(erros).sort()).toEqual(
      ['cpfResponsavel', 'emailResponsavel', 'nomeResponsavel'],
    );
    const completo = {
      ...menor,
      nomeResponsavel: 'Maria Silva',
      cpfResponsavel: '987.654.321-00',
      emailResponsavel: 'maria@email.com',
    };
    expect(validarCadastro(completo)).toEqual({});
  });

  it('exige telefone só quando o convite não trouxe', () => {
    expect(validarCadastro({...formBase(), pedeTelefone: true}).telefone).toBeDefined();
    expect(validarCadastro({...formBase(), pedeTelefone: true, telefone: '(83) 99999-9999'})).toEqual({});
  });
});

describe('endereço', () => {
  it('exige rua, número, bairro, cidade e UF', () => {
    const erros = validarCadastro({...formBase(), logradouro: ' ', numero: '', bairro: '', cidade: '', estado: 'P'});
    expect(Object.keys(erros).sort()).toEqual(['bairro', 'cidade', 'estado', 'logradouro', 'numero']);
  });

  it('CEP e complemento são opcionais, mas CEP incompleto é recusado', () => {
    expect(validarCadastro({...formBase(), cep: '58400-000'})).toEqual({});
    expect(validarCadastro({...formBase(), cep: '584'}).cep).toBeDefined();
  });
});

describe('montarPayloadAceite', () => {
  it('monta o corpo do maior de idade sem campos do responsável', () => {
    expect(montarPayloadAceite('123456', formBase())).toEqual({
      pin: '123456',
      senha: 'senha1234',
      cpf: '12345678909',
      data_nascimento: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      aceite_termos: true,
      endereco: {
        logradouro: 'Rua das Flores',
        numero: '120',
        bairro: 'Centro',
        cidade: 'Campina Grande',
        estado: 'PB',
      },
    });
  });

  it('inclui CEP só com dígitos e complemento quando preenchidos', () => {
    const payload = montarPayloadAceite('123456', {...formBase(), cep: '58400-000', complemento: ' Apto 2 '});
    expect(payload.endereco.cep).toBe('58400000');
    expect(payload.endereco.complemento).toBe('Apto 2');
  });

  it('inclui o responsável do menor e o telefone pedido', () => {
    const form = {
      ...formBase(),
      dataNascimento: anoAtras(15),
      pedeTelefone: true,
      telefone: '(83) 99999-9999',
      nomeResponsavel: ' Maria Silva ',
      cpfResponsavel: '987.654.321-00',
      emailResponsavel: ' Maria@Email.com ',
    };
    const payload = montarPayloadAceite('123456', form);
    expect(payload.telefone).toBe('83999999999');
    expect(payload.nome_responsavel).toBe('Maria Silva');
    expect(payload.cpf_responsavel).toBe('98765432100');
    expect(payload.email_responsavel).toBe('maria@email.com');
    expect(payload.telefone_responsavel).toBeUndefined();
  });
});

describe('interpretarErroConvite', () => {
  it('400 com erro de campo do endereço aponta os campos', () => {
    const r = interpretarErroConvite({statusCode: 400, details: {endereco: {estado: ['x']}}});
    expect(r.tipo).toBe('campo');
    expect(Object.keys(r.campos)).toEqual(['estado']);
  });

  it('404 vira link inválido', () => {
    expect(interpretarErroConvite({statusCode: 404}).tipo).toBe('invalido');
  });

  it('400 com tentativas restantes vira PIN errado', () => {
    const r = interpretarErroConvite({statusCode: 400, details: {tentativas_restantes: 3}});
    expect(r.tipo).toBe('pin');
    expect(r.texto).toContain('Restam 3 tentativas');
    expect(
      interpretarErroConvite({statusCode: 400, details: {tentativas_restantes: 1}}).texto,
    ).toContain('Resta 1 tentativa.');
  });

  it('429 vira bloqueado e 409 vira conflito', () => {
    expect(interpretarErroConvite({statusCode: 429}).tipo).toBe('bloqueado');
    expect(interpretarErroConvite({statusCode: 409}).tipo).toBe('conflito');
  });

  it('400 sem tentativas usa a mensagem do backend', () => {
    const r = interpretarErroConvite({statusCode: 400, message: 'Senha muito fraca.'});
    expect(r).toEqual({tipo: 'outro', texto: 'Senha muito fraca.'});
  });

  it('erro sem status usa texto padrão', () => {
    expect(interpretarErroConvite(null).tipo).toBe('outro');
  });
});

describe('destinoPosAceite', () => {
  it('ACTIVE entra direto, os pendentes vão ao login com aviso', () => {
    expect(destinoPosAceite('ACTIVE', false).loginAutomatico).toBe(true);
    expect(destinoPosAceite('PENDING_SIGNUP', true)).toMatchObject({loginAutomatico: false});
    expect(destinoPosAceite('PENDING_SIGNUP', true).mensagem).toContain('responsável');
    expect(destinoPosAceite('PENDING_APPROVAL', false).mensagem).toContain('gestor');
  });
});
