import React, {useState} from 'react';
import {ActivityIndicator, Text, TextInput, View} from 'react-native';
import {Icon, IconNames} from '../../components';
import Tappable from '../../components/Tappable';
import {colors, spacing} from '../../theme';
import {conviteService} from '../../services/conviteService';
import {PIN_TAMANHO, interpretarErroConvite} from '../../utils/convite';
import ConviteShell, {ConviteEncerrado, styles} from './ConviteShell';

const pinStyle = {
  textAlign: 'center',
  fontFamily: 'Inter-Bold',
  fontSize: 28,
  letterSpacing: 10,
  height: 64,
};

const ConvitePin = ({navigation, route}) => {
  const token = (route && route.params && route.params.token) || '';

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState('');
  const [encerrado, setEncerrado] = useState(token ? '' : interpretarErroConvite({statusCode: 404}).texto);
  const [focused, setFocused] = useState(false);

  const irParaLogin = () => navigation.navigate('Login');

  const confirmar = async digitos => {
    if (loading) return;
    setAviso('');
    setLoading(true);
    try {
      const dados = await conviteService.validar(token, digitos);
      navigation.navigate('CompletarCadastro', {
        token,
        pin: digitos,
        convite: dados.convite,
        termos: dados.termos,
      });
    } catch (erro) {
      const resultado = interpretarErroConvite(erro);
      if (resultado.tipo === 'invalido' || resultado.tipo === 'bloqueado') {
        setEncerrado(resultado.texto);
      } else {
        setAviso(resultado.texto);
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  const aoDigitar = texto => {
    const digitos = texto.replace(/\D/g, '').slice(0, PIN_TAMANHO);
    setPin(digitos);
    if (aviso) setAviso('');
    if (digitos.length === PIN_TAMANHO) confirmar(digitos);
  };

  if (encerrado) {
    return (
      <ConviteShell>
        <ConviteEncerrado texto={encerrado} onLogin={irParaLogin} />
      </ConviteShell>
    );
  }

  const completo = pin.length === PIN_TAMANHO;

  return (
    <ConviteShell>
      <Text style={styles.title}>Confirme seu convite</Text>
      <Text style={styles.subtitle}>
        Digite o PIN de 6 dígitos que chegou no mesmo e-mail do convite.
      </Text>

      <Text style={styles.label}>PIN</Text>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          !!aviso && styles.inputWrapperError,
        ]}>
        <TextInput
          style={[styles.input, pinStyle]}
          value={pin}
          onChangeText={aoDigitar}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={PIN_TAMANHO}
          placeholder="000000"
          placeholderTextColor={colors.neutral[300]}
          autoFocus
          editable={!loading}
          accessibilityLabel="PIN do convite"
        />
      </View>

      {aviso ? (
        <View style={styles.errorContainer}>
          <Icon name={IconNames.warning} size="sm" color={colors.error.main} />
          <Text style={styles.errorText}>{aviso}</Text>
        </View>
      ) : null}

      <Tappable
        style={[styles.primaryButton, (!completo || loading) && styles.primaryButtonDisabled]}
        onPress={() => confirmar(pin)}
        disabled={!completo || loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Continuar</Text>
        )}
      </Tappable>
    </ConviteShell>
  );
};

export default ConvitePin;
