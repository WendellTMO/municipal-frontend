import React from 'react';
import {Linking, Platform, StyleSheet, Text, View} from 'react-native';
import Tappable from '../../components/Tappable';
import PassoNumerado from '../../components/PassoNumerado';
import {colors, spacing} from '../../theme';
import {ehIos, montarPassosApp, URL_APK} from '../../utils/passosApp';
import {styles} from './ConviteShell';

const userAgent = () => (typeof navigator !== 'undefined' ? navigator.userAgent : '');
const pontosDeToque = () => (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0);

// Tela final do cadastro feito no navegador: leva o aluno ao APK em vez de ao app web.
// Dentro de ConviteShell. onContinuarNavegador faz o login automático (Android, link pequeno); onIrParaLogin leva ao login (iPhone).
const CadastroConcluido = ({onContinuarNavegador, onIrParaLogin, entrando}) => {
  const ios = ehIos(userAgent(), pontosDeToque());
  const passos = montarPassosApp(ios);

  const baixar = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.href = URL_APK;
    else Linking.openURL(URL_APK);
  };

  return (
    <View>
      <Text style={styles.title}>Tudo pronto!</Text>
      {passos.map(passo => (
        <PassoNumerado key={passo.numero} {...passo}>
          {passo.acao === 'baixar' ? (
            <Tappable
              style={[styles.primaryButton, local.botaoBaixar]}
              onPress={baixar}
              accessibilityLabel="Baixar o app para Android">
              <Text style={styles.primaryButtonText}>Baixar o app para Android</Text>
            </Tappable>
          ) : null}
        </PassoNumerado>
      ))}

      {ios ? (
        <Tappable
          style={[styles.primaryButton, entrando && styles.primaryButtonDisabled]}
          onPress={onIrParaLogin}
          disabled={entrando}
          accessibilityLabel="Entrar pelo navegador">
          <Text style={styles.primaryButtonText}>Entrar pelo navegador</Text>
        </Tappable>
      ) : (
        <Tappable
          style={local.link}
          onPress={onContinuarNavegador}
          disabled={entrando}
          sombra={false}
          accessibilityLabel="Prefiro continuar pelo navegador">
          <Text style={local.linkTexto}>Prefiro continuar pelo navegador</Text>
        </Tappable>
      )}
    </View>
  );
};

const local = StyleSheet.create({
  botaoBaixar: {marginTop: spacing.md, height: 56},
  link: {minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg},
  linkTexto: {fontFamily: 'Inter-Medium', fontSize: 14, color: colors.text.secondary, textDecorationLine: 'underline'},
});

export default CadastroConcluido;
