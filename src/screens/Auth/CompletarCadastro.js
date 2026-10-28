import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TextInput, View, StyleSheet} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {Icon, IconNames} from '../../components';
import Tappable from '../../components/Tappable';
import {colors, spacing, borderRadius} from '../../theme';
import {conviteService} from '../../services/conviteService';
import {cepService} from '../../services/cepService';
import {formatCep, formatCpf, formatDate, formatPhone} from '../../utils/masks';
import {camposDoCep, cepParaConsulta, mensagemErroCep} from '../../utils/cep';
import {
  destinoPosAceite,
  ehMenor,
  interpretarErroConvite,
  montarPayloadAceite,
  validarCadastro,
} from '../../utils/convite';
import ConviteShell, {ConviteEncerrado, styles} from './ConviteShell';

const FORM_VAZIO = {
  senha: '',
  confirmarSenha: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  complemento: '',
  nomeResponsavel: '',
  cpfResponsavel: '',
  emailResponsavel: '',
  aceiteTermos: false,
};

const CompletarCadastro = ({navigation, route}) => {
  const {login} = useAuth();
  const params = (route && route.params) || {};
  const {token, pin, convite, termos} = params;

  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [focused, setFocused] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erroGeral, setErroGeral] = useState('');
  const [encerrado, setEncerrado] = useState('');
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState({tipo: '', texto: ''});
  const camposEditados = useRef({}); // campos digitados à mão: o CEP não sobrescreve
  const inputs = useRef({});

  // Consulta o CEP ao completar 8 dígitos. O cleanup descarta respostas de CEPs antigos.
  useEffect(() => {
    const cep = cepParaConsulta(form.cep);
    setAvisoCep({tipo: '', texto: ''});
    setConsultandoCep(false);
    if (!cep) return undefined;

    let descartar = false;
    setConsultandoCep(true);
    cepService
      .buscar(cep)
      .then(resposta => {
        if (descartar) return;
        const novos = camposDoCep(resposta, camposEditados.current);
        setForm(atual => ({...atual, ...novos}));
        if (inputs.current.numero) inputs.current.numero.focus();
      })
      .catch(erro => {
        if (descartar) return;
        setAvisoCep({tipo: 'erro', texto: mensagemErroCep(erro)});
      })
      .finally(() => {
        if (!descartar) setConsultandoCep(false);
      });
    return () => {
      descartar = true;
    };
  }, [form.cep]);

  const irParaLogin = mensagem => navigation.navigate('Login', mensagem ? {message: mensagem} : {});

  // Chegou sem passar pelo PIN (ex.: refresh): volta ao fluxo do link.
  if (!token || !pin || !convite) {
    return (
      <ConviteShell>
        <ConviteEncerrado
          texto="Abra o link do convite de novo e digite o PIN para continuar."
          onLogin={() => irParaLogin()}
        />
      </ConviteShell>
    );
  }

  if (encerrado) {
    return (
      <ConviteShell>
        <ConviteEncerrado texto={encerrado} onLogin={() => irParaLogin()} />
      </ConviteShell>
    );
  }

  const pedeTelefone = !convite.telefone;
  const menor = ehMenor(form.dataNascimento);

  const mudar = (campo, valor) => {
    camposEditados.current[campo] = true;
    setForm(atual => ({...atual, [campo]: valor}));
    if (erros[campo]) setErros(atual => ({...atual, [campo]: undefined}));
    if (erroGeral) setErroGeral('');
  };

  const concluir = async () => {
    if (loading) return;
    const formCompleto = {...form, pedeTelefone};
    const novosErros = validarCadastro(formCompleto);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setLoading(true);
    setErroGeral('');
    try {
      const resposta = await conviteService.aceitar(token, montarPayloadAceite(pin, formCompleto));
      const destino = destinoPosAceite(resposta.status, resposta.requer_consentimento_responsavel);
      if (destino.loginAutomatico) {
        const resultado = await login({email: convite.email, password: form.senha});
        if (!resultado || !resultado.success) {
          irParaLogin('Cadastro concluído. Entre com o seu e-mail e a senha que você acabou de criar.');
        }
        return;
      }
      irParaLogin(destino.mensagem);
    } catch (erro) {
      const resultado = interpretarErroConvite(erro);
      if (resultado.tipo === 'invalido' || resultado.tipo === 'bloqueado') {
        setEncerrado(resultado.texto);
      } else if (resultado.tipo === 'campo') {
        setErros(resultado.campos);
        setErroGeral(resultado.texto);
      } else {
        setErroGeral(resultado.texto);
      }
    } finally {
      setLoading(false);
    }
  };

  const erroDoCampo = campo =>
    erros[campo] ? (
      <View style={styles.fieldErrorContainer}>
        <Icon name={IconNames.error} size="xs" color={colors.error.main} />
        <Text style={styles.fieldErrorText}>{erros[campo]}</Text>
      </View>
    ) : null;

  const campo = (chave, rotulo, extras) => (
    <View key={chave}>
      <Text style={styles.label}>{rotulo}</Text>
      <View
        style={[
          styles.inputWrapper,
          focused === chave && styles.inputWrapperFocused,
          !!erros[chave] && styles.inputWrapperError,
        ]}>
        {extras.icone ? <Icon name={extras.icone} size="md" color={colors.neutral[400]} /> : null}
        <TextInput
          ref={el => {
            inputs.current[chave] = el;
          }}
          style={styles.input}
          value={form[chave]}
          onChangeText={texto => mudar(chave, extras.mascara ? extras.mascara(texto) : texto)}
          onFocus={() => setFocused(chave)}
          onBlur={() => setFocused('')}
          placeholder={extras.placeholder}
          placeholderTextColor={colors.neutral[400]}
          keyboardType={extras.teclado}
          secureTextEntry={!!extras.senha && !mostrarSenha}
          autoCapitalize={extras.teclado === 'email-address' ? 'none' : extras.capitalizar}
          maxLength={extras.maxLength}
          autoCorrect={false}
        />
        {extras.carregando ? <ActivityIndicator size="small" color={colors.neutral[400]} /> : null}
        {extras.senha && chave === 'senha' ? (
          <Tappable onPress={() => setMostrarSenha(v => !v)} sombra={false} accessibilityLabel="Mostrar senha">
            <Icon
              name={mostrarSenha ? IconNames.visibilityOff : IconNames.visibility}
              size="md"
              color={colors.neutral[400]}
            />
          </Tappable>
        ) : null}
      </View>
      {erroDoCampo(chave)}
    </View>
  );

  return (
    <ConviteShell>
      <Text style={styles.title}>Complete seu cadastro</Text>
      <View style={local.convidado}>
        <Text style={local.convidadoNome}>{convite.nome}</Text>
        <Text style={local.convidadoEmail}>{convite.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Acesso</Text>
      {campo('senha', 'Senha *', {icone: 'lock', placeholder: 'Mínimo 8 caracteres', senha: true})}
      {campo('confirmarSenha', 'Confirmar senha *', {icone: 'lock', placeholder: 'Repita a senha', senha: true})}

      <Text style={styles.sectionTitle}>Seus dados</Text>
      {campo('cpf', 'CPF *', {icone: 'badge', placeholder: '000.000.000-00', teclado: 'number-pad', mascara: formatCpf})}
      {campo('dataNascimento', 'Data de nascimento *', {
        icone: 'cake',
        placeholder: 'dd/mm/aaaa',
        teclado: 'number-pad',
        mascara: formatDate,
      })}
      {pedeTelefone
        ? campo('telefone', 'Telefone *', {
            icone: 'phone',
            placeholder: '(00) 00000-0000',
            teclado: 'phone-pad',
            mascara: formatPhone,
          })
        : null}

      <Text style={styles.sectionTitle}>Onde você mora</Text>
      {campo('logradouro', 'Rua *', {icone: 'home', placeholder: 'Nome da rua', capitalizar: 'words'})}
      {campo('numero', 'Número *', {placeholder: '120', teclado: 'default'})}
      {campo('bairro', 'Bairro *', {placeholder: 'Bairro', capitalizar: 'words'})}
      {campo('cidade', 'Cidade *', {placeholder: 'Cidade', capitalizar: 'words'})}
      {campo('estado', 'UF *', {
        placeholder: 'PB',
        teclado: 'default',
        capitalizar: 'characters',
        maxLength: 2,
        mascara: texto => texto.replace(/[^A-Za-z]/g, '').toUpperCase(),
      })}
      {campo('cep', 'CEP', {
        placeholder: '00000-000',
        teclado: 'number-pad',
        mascara: formatCep,
        carregando: consultandoCep,
      })}
      {avisoCep.texto ? <Text style={local.cepAviso}>{avisoCep.texto}</Text> : null}
      {campo('complemento', 'Complemento', {placeholder: 'Apto, bloco, referência'})}

      {menor ? (
        <View>
          <Text style={styles.sectionTitle}>Dados do responsável</Text>
          <Text style={styles.subtitle}>
            Você tem menos de 18 anos. Enviaremos um e-mail ao responsável para autorizar o cadastro.
          </Text>
          {campo('nomeResponsavel', 'Nome do responsável *', {icone: 'person', placeholder: 'Nome completo'})}
          {campo('cpfResponsavel', 'CPF do responsável *', {
            icone: 'badge',
            placeholder: '000.000.000-00',
            teclado: 'number-pad',
            mascara: formatCpf,
          })}
          {campo('emailResponsavel', 'E-mail do responsável *', {
            icone: 'email',
            placeholder: 'responsavel@email.com',
            teclado: 'email-address',
          })}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Termos de uso</Text>
      <ScrollView style={local.termosCaixa} nestedScrollEnabled>
        <Text style={local.termosTexto}>{termos ? termos.texto : ''}</Text>
      </ScrollView>
      <Tappable
        style={local.aceiteLinha}
        onPress={() => mudar('aceiteTermos', !form.aceiteTermos)}
        sombra={false}
        accessibilityRole="checkbox"
        accessibilityState={{checked: form.aceiteTermos}}>
        <Icon
          name={form.aceiteTermos ? 'check-box' : 'check-box-outline-blank'}
          size="lg"
          color={form.aceiteTermos ? '#0347D0' : colors.neutral[400]}
        />
        <Text style={local.aceiteTexto}>Li e aceito os termos de uso</Text>
      </Tappable>
      {erroDoCampo('aceiteTermos')}

      {erroGeral ? (
        <View style={styles.errorContainer}>
          <Icon name={IconNames.warning} size="sm" color={colors.error.main} />
          <Text style={styles.errorText}>{erroGeral}</Text>
        </View>
      ) : null}

      <Tappable
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={concluir}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Concluir cadastro</Text>
        )}
      </Tappable>
    </ConviteShell>
  );
};

const local = StyleSheet.create({
  convidado: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  convidadoNome: {fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.text.primary},
  convidadoEmail: {fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary, marginTop: 2},
  termosCaixa: {
    maxHeight: 160,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  termosTexto: {fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary, lineHeight: 19},
  cepAviso: {fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary, marginTop: spacing.xs},
  aceiteLinha: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md},
  aceiteTexto: {flex: 1, fontFamily: 'Inter-Medium', fontSize: 14, color: colors.text.primary},
});

export default CompletarCadastro;
