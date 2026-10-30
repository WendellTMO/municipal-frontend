/**
 * A barra inferior do app: uma só, montada em App.tsx abaixo do navegador. Aparece nas telas
 * principais de cada papel e some nas de detalhe, na biometria e com o teclado aberto.
 */
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Keyboard, Platform } from 'react-native';
import BarraInferior from './BarraInferior';
import { IconNames } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { assinarRotaAtual, lerRotaAtual, navegarGlobal } from '../navigation/rotaAtual';

// O mapa do ônibus continua na home (mini mapa) e no detalhe da viagem; a última aba é o perfil,
// onde ficam também as configurações e o Sair da conta (como o "You" do WhatsApp).
const itensAluno = [
  { id: 'inicio', rotulo: 'Início', icone: IconNames.home, destino: 'DashboardAluno' },
  { id: 'viagens', rotulo: 'Viagens', icone: IconNames.bus, acessibilidade: 'Minhas Viagens', destino: 'RotaAluno' },
  { id: 'rotas', rotulo: 'Rotas', icone: IconNames.route, acessibilidade: 'Rotas disponíveis', destino: 'SelecaoRotas' },
  { id: 'perfil', rotulo: 'Perfil', icone: IconNames.person, acessibilidade: 'Meu perfil', destino: 'EditarPerfilAluno' },
];

const itensMotorista = [
  { id: 'inicio', rotulo: 'Início', icone: IconNames.home, destino: 'DashboardMotorista' },
  { id: 'rotas', rotulo: 'Rotas', icone: IconNames.bus, acessibilidade: 'Minhas Rotas', destino: 'RotaMotorista' },
  { id: 'viagens', rotulo: 'Viagens', icone: IconNames.route, acessibilidade: 'Minhas Viagens', destino: 'ListaViagens' },
  { id: 'perfil', rotulo: 'Perfil', icone: IconNames.person, acessibilidade: 'Meu perfil e configurações', destino: 'ConfigNotificacoesMotorista' },
];

// Telas que mostram a barra, com o item que fica ativo em cada uma.
const PAPEIS = {
  ALUNO: {
    itens: itensAluno,
    rotas: { DashboardAluno: 'inicio', RotaAluno: 'viagens', MinhasRotas: 'viagens', SelecaoRotas: 'rotas', EditarPerfilAluno: 'perfil' },
  },
  MOTORISTA: {
    itens: itensMotorista,
    rotas: { DashboardMotorista: 'inicio', RotaMotorista: 'rotas', ListaViagens: 'viagens', ConfigNotificacoesMotorista: 'perfil' },
  },
};

const useTecladoAberto = () => {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const mostrar = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setAberto(true));
    const esconder = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setAberto(false));
    return () => {
      mostrar.remove();
      esconder.remove();
    };
  }, []);
  return aberto;
};

const BarraGlobal = () => {
  const { user } = useAuth();
  const rota = useSyncExternalStore(assinarRotaAtual, lerRotaAtual, lerRotaAtual);
  const tecladoAberto = useTecladoAberto();

  const papel = PAPEIS[String(user?.role || '').toUpperCase()];
  const ativo = papel && rota ? papel.rotas[rota] : null;
  if (!papel || !ativo || tecladoAberto) return null;

  const itens = papel.itens.map(item => ({
    ...item,
    onPress: () => navegarGlobal(item.destino, {}),
  }));
  return <BarraInferior itens={itens} ativo={ativo} />;
};

export default BarraGlobal;
