/**
 * Cabeçalho dos painéis (aluno, motorista e gestor): avatar com iniciais, saudação,
 * linha de perfil e sino com contador. O avatar abre o menu da conta.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconNames } from './Icon';
import { topoDoCabecalho } from '../utils/topoCabecalho';
import { useAuth } from '../contexts/AuthContext';
import { confirmarSaida } from './SairDaConta';
import { saudacao, primeiroNome, iniciais, linhaPerfil } from '../utils/saudacao';
import ModalApp from './ModalApp';

const PainelHeader = ({
  perfil,
  unreadCount = 0,
  onBellPress,
  onOpenConfig,
}) => {
  const { user, logout } = useAuth();
  const topo = topoDoCabecalho(useSafeAreaInsets().top);
  const [menuVisivel, setMenuVisivel] = useState(false);

  const municipio = user?.municipio?.nome || '';
  const nome = user?.nome || '';

  const handleSair = () => {
    setMenuVisivel(false);
    confirmarSaida(logout);
  };

  const handleConfig = () => {
    setMenuVisivel(false);
    if (onOpenConfig) onOpenConfig();
  };

  const rotuloSino =
    unreadCount > 0
      ? `Notificações, ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
      : 'Notificações';

  return (
    <View style={[styles.header, { paddingTop: topo }]}>
      <TouchableOpacity
        style={styles.avatar}
        onPress={() => setMenuVisivel(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu da conta">
        <Text style={styles.avatarTexto}>{iniciais(nome)}</Text>
      </TouchableOpacity>

      <View style={styles.textos}>
        <Text style={styles.saudacao} numberOfLines={1} accessibilityRole="header">
          {saudacao()}
          {primeiroNome(nome) ? `, ${primeiroNome(nome)}` : ''}
        </Text>
        <Text style={styles.linha} numberOfLines={1}>
          {linhaPerfil({ perfil, municipio })}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.sino}
        onPress={onBellPress}
        accessibilityRole="button"
        accessibilityLabel={rotuloSino}>
        <Icon name={IconNames.notifications} size="lg" color="#FFFFFF" />
        {unreadCount > 0 ? (
          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <ModalApp
        visible={menuVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisivel(false)}>
        <TouchableOpacity
          style={styles.fundo}
          activeOpacity={1}
          onPress={() => setMenuVisivel(false)}
          accessibilityLabel="Fechar menu">
          <View style={[styles.menu, { marginTop: topo + 48 }]}>
            <View style={styles.menuTopo}>
              <Text style={styles.menuNome} numberOfLines={1}>
                {nome}
              </Text>
              {user?.email ? (
                <Text style={styles.menuEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleConfig}
              accessibilityRole="button"
              accessibilityLabel="Configurações">
              <Icon name={IconNames.settings} size="md" color={colors.text.secondary} />
              <Text style={styles.menuItemTexto}>Configurações</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSair}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta">
              <Icon name={IconNames.logout} size="md" color={colors.error.main} />
              <Text style={[styles.menuItemTexto, { color: colors.error.main }]}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ModalApp>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: 16, fontWeight: '800', color: colors.primary.main },
  textos: { flex: 1 },
  saudacao: { ...textStyles.h3, color: '#FFFFFF' },
  linha: { ...textStyles.bodySmall, color: '#DBEAFE', marginTop: 2 },
  sino: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error.main,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  contadorTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  fundo: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' },
  menu: {
    marginLeft: spacing.base,
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: spacing.sm,
  },
  menuTopo: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuNome: { ...textStyles.h5, color: colors.text.primary },
  menuEmail: { ...textStyles.bodySmall, color: colors.text.secondary, marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  menuItemTexto: { ...textStyles.body, color: colors.text.primary, fontWeight: '600' },
});

export default PainelHeader;
