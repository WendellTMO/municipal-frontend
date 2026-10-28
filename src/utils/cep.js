import {onlyDigits} from './masks';

export const MSG_CEP_NAO_ENCONTRADO = 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.';
export const MSG_CEP_INDISPONIVEL = 'Não foi possível consultar o CEP agora. Preencha o endereço manualmente.';

// Devolve os 8 dígitos do CEP, ou '' enquanto estiver incompleto.
export const cepParaConsulta = texto => {
  const digitos = onlyDigits(texto);
  return digitos.length === 8 ? digitos : '';
};

// Escolhe o que a resposta do CEP preenche. Campos que o aluno já editou ficam de fora,
// assim como campos que o serviço devolveu vazios.
export const camposDoCep = (resposta, editados) => {
  const novos = {};
  const origem = {
    logradouro: resposta.logradouro,
    bairro: resposta.bairro,
    cidade: resposta.cidade,
    estado: (resposta.estado || '').toUpperCase(),
  };
  const nomes = Object.keys(origem);
  for (const nome of nomes) {
    if (editados[nome]) continue;
    if (!origem[nome]) continue;
    novos[nome] = origem[nome];
  }
  return novos;
};

export const mensagemErroCep = erro => {
  if (erro && erro.statusCode === 404) return MSG_CEP_NAO_ENCONTRADO;
  return MSG_CEP_INDISPONIVEL;
};
