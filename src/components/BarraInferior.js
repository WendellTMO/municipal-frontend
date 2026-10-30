/**
 * Barra de navegação inferior (como Mercado Pago, Instagram e WhatsApp): os atalhos principais
 * ficam no rodapé, onde o polegar alcança primeiro. O item ativo ganha uma pílula azul atrás do
 * ícone. Cuida sozinha da área segura de baixo (barra de gestos do Android, home do iPhone).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, shadows, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import Tappable from './Tappable';
import { useFeedbackPadrao } from './FeedbackPadraoContext';

const BarraInferior = ({ itens, ativo }) => {
  const insets = useSafeAreaInsets();
  // O botão de feedback fica logo acima da barra, não por cima dos itens.
  useFeedbackPadrao('barra');
  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} accessibilityRole="tablist">
      {itens.map(item => {
        const selecionado = item.id === ativo;
        const cor = selecionado ? colors.primary.main : colors.neutral[500];
        return (
          <Tappable
            key={item.id}
            style={[styles.item, item.desativado && styles.desativado]}
            onPress={item.onPress}
            disabled={item.desativado}
            sombra={false}
            navega
            accessibilityRole="tab"
            accessibilityLabel={item.acessibilidade || item.rotulo}
            accessibilityState={{ selected: selecionado, disabled: !!item.desativado }}>
            <View style={[styles.pilula, selecionado && styles.pilulaAtiva]}>
              <Icon name={item.icone} size="base" color={cor} />
            </View>
            <Text style={[styles.rotulo, { color: cor }, selecionado && styles.rotuloAtivo]} numberOfLines={1}>
              {item.rotulo}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
};

export const BarraAluno = ({ navigation, ativo, aoLocalizacao, semViagem = false }) => (
  <BarraInferior
    ativo={ativo}
    itens={[
      { id: 'inicio', rotulo: 'Início', icone: IconNames.home, onPress: () => navigation.navigate('DashboardAluno') },
      { id: 'viagens', rotulo: 'Viagens', icone: IconNames.bus, acessibilidade: 'Minhas Viagens', onPress: () => navigation.navigate('RotaAluno') },
      {
        id: 'localizacao',
        rotulo: 'Localização',
        icone: IconNames.location,
        acessibilidade: 'Localização do ônibus',
        desativado: semViagem,
        onPress: aoLocalizacao || (() => navigation.navigate('DashboardAluno')),
      },
      { id: 'rotas', rotulo: 'Rotas', icone: IconNames.route, acessibilidade: 'Rotas disponíveis', onPress: () => navigation.navigate('SelecaoRotas') },
      { id: 'perfil', rotulo: 'Perfil', icone: IconNames.person, acessibilidade: 'Editar meu perfil', onPress: () => navigation.navigate('EditarPerfilAluno') },
    ]}
  />
);

export const BarraMotorista = ({ navigation, ativo }) => (
  <BarraInferior
    ativo={ativo}
    itens={[
      { id: 'inicio', rotulo: 'Início', icone: IconNames.home, onPress: () => navigation.navigate('DashboardMotorista') },
      { id: 'rotas', rotulo: 'Rotas', icone: IconNames.bus, acessibilidade: 'Minhas Rotas', onPress: () => navigation.navigate('RotaMotorista') },
      { id: 'viagens', rotulo: 'Viagens', icone: IconNames.route, acessibilidade: 'Minhas Viagens', onPress: () => navigation.navigate('ListaViagens') },
      { id: 'ajustes', rotulo: 'Ajustes', icone: IconNames.settings, acessibilidade: 'Configurações', onPress: () => navigation.navigate('ConfigNotificacoesMotorista') },
    ]}
  />
);

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  item: { flex: 1, alignItems: 'center', gap: 2, minHeight: 56 },
  desativado: { opacity: 0.4 },
  pilula: { width: 56, height: 30, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  pilulaAtiva: { backgroundColor: colors.primary.lighter },
  rotulo: { ...textStyles.caption, fontSize: 11, lineHeight: 14 },
  rotuloAtivo: { fontWeight: '700' },
});

export default BarraInferior;
