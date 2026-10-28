import {calcAge, toIsoDate} from './dataNascimento';
import {onlyDigits} from './masks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PIN_TAMANHO = 6;

export const ehMenor = dataNascimento => {
  const idade = calcAge(dataNascimento);
  return idade !== null && idade < 18;
};

// Erros por campo do formulário de completar cadastro. Objeto vazio quando está tudo certo.
export const validarCadastro = form => {
  const erros = {};

  if (!form.senha) {
    erros.senha = 'Senha é obrigatória.';
  } else if (form.senha.length < 8) {
    erros.senha = 'A senha deve ter pelo menos 8 caracteres.';
  }

  if (!form.confirmarSenha) {
    erros.confirmarSenha = 'Confirme sua senha.';
  } else if (form.senha !== form.confirmarSenha) {
    erros.confirmarSenha = 'As senhas não conferem.';
  }

  if (onlyDigits(form.cpf).length !== 11) {
    erros.cpf = 'CPF inválido.';
  }

  const idade = calcAge(form.dataNascimento);
  if (onlyDigits(form.dataNascimento).length !== 8) {
    erros.dataNascimento = 'Data de nascimento é obrigatória.';
  } else if (idade === null || idade < 0 || idade > 120) {
    erros.dataNascimento = 'Data de nascimento inválida.';
  }

  if (form.pedeTelefone && onlyDigits(form.telefone).length < 10) {
    erros.telefone = 'Telefone inválido.';
  }

  if (idade !== null && idade < 18) {
    if (form.nomeResponsavel.trim().length < 3) {
      erros.nomeResponsavel = 'Nome do responsável é obrigatório.';
    }
    if (onlyDigits(form.cpfResponsavel).length !== 11) {
      erros.cpfResponsavel = 'CPF do responsável inválido.';
    }
    if (!EMAIL_RE.test(form.emailResponsavel.trim())) {
      erros.emailResponsavel = 'E-mail do responsável inválido.';
    }
  }

  if (!form.aceiteTermos) {
    erros.aceiteTermos = 'É preciso aceitar os termos para concluir.';
  }

  return erros;
};

// Corpo do POST /convites/aceite/{token}. Só inclui o que o backend espera.
export const montarPayloadAceite = (pin, form) => {
  const payload = {
    pin,
    senha: form.senha,
    cpf: onlyDigits(form.cpf),
    data_nascimento: toIsoDate(form.dataNascimento),
    aceite_termos: true,
  };

  if (form.pedeTelefone) {
    payload.telefone = onlyDigits(form.telefone);
  }

  if (ehMenor(form.dataNascimento)) {
    payload.nome_responsavel = form.nomeResponsavel.trim();
    payload.cpf_responsavel = onlyDigits(form.cpfResponsavel);
    payload.email_responsavel = form.emailResponsavel.trim().toLowerCase();
  }

  return payload;
};

const MSG_INVALIDO =
  'Este link de convite é inválido, venceu ou já foi usado. Peça um novo convite ao gestor.';
const MSG_BLOQUEADO =
  'Este convite foi bloqueado depois de 5 tentativas erradas. Peça um novo convite ao gestor.';

// Traduz o erro da API em {tipo, texto}. Tipos: invalido, bloqueado, pin, conflito, outro.
// invalido e bloqueado encerram o convite (a tela só oferece ir ao login).
export const interpretarErroConvite = erro => {
  const status = erro && erro.statusCode;

  if (status === 404) {
    return {tipo: 'invalido', texto: MSG_INVALIDO};
  }
  if (status === 429) {
    return {tipo: 'bloqueado', texto: MSG_BLOQUEADO};
  }
  if (status === 409) {
    return {
      tipo: 'conflito',
      texto: 'Este CPF ou e-mail já tem cadastro. Tente entrar com a sua conta ou fale com o gestor.',
    };
  }
  if (status === 400) {
    const restantes = erro.details ? erro.details.tentativas_restantes : undefined;
    if (typeof restantes === 'number') {
      const palavra = restantes === 1 ? 'tentativa' : 'tentativas';
      return {tipo: 'pin', texto: `PIN incorreto. Resta${restantes === 1 ? '' : 'm'} ${restantes} ${palavra}.`};
    }
    return {tipo: 'outro', texto: erro.message || 'Dados inválidos. Confira as informações.'};
  }

  return {
    tipo: 'outro',
    texto: (erro && erro.message) || 'Não foi possível concluir agora. Tente novamente.',
  };
};

// O que fazer depois do aceite: entrar direto ou voltar ao login com um aviso.
// O backend devolve ACTIVE para quem entrou e requer_consentimento_responsavel para o menor.
export const destinoPosAceite = (status, requerConsentimento) => {
  if (status === 'ACTIVE') {
    return {loginAutomatico: true, mensagem: ''};
  }
  if (requerConsentimento) {
    return {
      loginAutomatico: false,
      mensagem:
        'Cadastro concluído. Enviamos um e-mail ao responsável. Depois da autorização, o gestor analisa o seu cadastro.',
    };
  }
  return {
    loginAutomatico: false,
    mensagem: 'Cadastro concluído. Aguarde a aprovação do gestor para entrar.',
  };
};
