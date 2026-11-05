// Visual dos quatro botões da tela da viagem do motorista, em teste:
//   B: botões de 52 px com o nome embaixo e Finalizar mais baixo.
//   C: botões de 44 px com o nome embaixo, linha da parada e Finalizar mais baixos.
// O motorista escolhe em Meu perfil. Quando houver uma vencedora, some a escolha e fica uma só.
import { useCallback, useEffect, useState } from 'react';
import { Storage } from './storage';

export const CHAVE_BOTOES_VIAGEM = 'botoes_viagem';
export const VARIANTE_PADRAO = 'B';

export const OPCOES_BOTOES_VIAGEM = [
  { id: 'B', texto: 'Botões maiores' },
  { id: 'C', texto: 'Botões compactos' },
];

export const ROTULOS_DOS_BOTOES = { roteiro: 'Paradas', chegada: 'Cheguei', aviso: 'Avisar', alunos: 'Alunos' };

const MEDIDAS = {
  B: { botao: 52, icone: 'lg', finalizar: 68, iconeProxima: 44 },
  C: { botao: 44, icone: 'base', finalizar: 72, iconeProxima: 36 },
};

export const variantePermitida = valor => (valor === 'B' || valor === 'C' ? valor : VARIANTE_PADRAO);

export const medidasDosBotoes = variante => MEDIDAS[variantePermitida(variante)];

export const useBotoesDaViagem = () => {
  const [variante, setVariante] = useState(VARIANTE_PADRAO);

  useEffect(() => {
    let vivo = true;
    Storage.getItem(CHAVE_BOTOES_VIAGEM).then(guardada => {
      if (vivo) setVariante(variantePermitida(guardada));
    });
    return () => {
      vivo = false;
    };
  }, []);

  const escolher = useCallback(nova => {
    const valida = variantePermitida(nova);
    setVariante(valida);
    Storage.setItem(CHAVE_BOTOES_VIAGEM, valida);
  }, []);

  return [variante, escolher];
};
