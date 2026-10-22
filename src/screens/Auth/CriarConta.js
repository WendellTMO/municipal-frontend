import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import {useAuth} from '../../contexts/AuthContext';
import {colors, spacing, borderRadius, shadows} from '../../theme';
import Icon, {IconNames} from '../../components/Icon';
import AuthBackground from '../../components/AuthBackground';
import AuthLogo from '../../components/AuthLogo';
import {api} from '../../api/client';
import {
  ErrorCode,
  getFieldValidationMessage,
  errorLogger,
} from '../../utils/errors';
import {unwrapItems} from '@/types';
import {formatCpf, formatPhone, formatCep, formatDate} from '../../utils/masks';

const {height: SCREEN_H} = Dimensions.get('screen');

const STEPS = {BASIC: 1, PERSONAL: 2, ADDRESS: 3};
const TOTAL_STEPS = 3;

const STEP_META = {
  [STEPS.BASIC]: {
    icon: 'email',
    title: 'Acesso',
    subtitle: 'Defina e-mail e senha',
  },
  [STEPS.PERSONAL]: {
    icon: 'person',
    title: 'Dados',
    subtitle: 'Informações pessoais',
  },
  [STEPS.ADDRESS]: {
    icon: 'location-on',
    title: 'Endereço',
    subtitle: 'Onde você mora?',
  },
};

const CriarConta = ({navigation}) => {
  const {register} = useAuth();

  const [step, setStep] = useState(STEPS.BASIC);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  // Date of birth and guardian
  const [dataNascimento, setDataNascimento] = useState('');
  const [emailResponsavel, setEmailResponsavel] = useState('');

  const calcAge = rawDate => {
    const digits = rawDate.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10) - 1;
    const year = parseInt(digits.slice(4, 8), 10);
    const birth = new Date(year, month, day);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) age--;
    return age;
  };

  const isMinor = calcAge(dataNascimento) !== null && calcAge(dataNascimento) < 18;

  const toIsoDate = rawDate => {
    const digits = rawDate.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  };

  const [instituicaoId, setInstituicaoId] = useState('');
  const [instituicoes, setInstituicoes] = useState([]);
  const [selectedInstitutionName, setSelectedInstitutionName] = useState('');
  const [institutionModalVisible, setInstitutionModalVisible] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState('');

  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [cepInfo, setCepInfo] = useState('');

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 550,
        delay: 120,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 450,
        delay: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  const latestInstitutionRequestRef = useRef(0);

  useEffect(() => {
    if (!institutionModalVisible) return;

    const trimmedSearch = institutionSearch.trim();

    // optional: don't search for very short strings
    if (trimmedSearch.length <= 1) {
      setInstituicoes([]);
      setLoadingInstituicoes(false);
      return;
    }

    const timeout = setTimeout(() => {
      loadInstituicoes(trimmedSearch);
    }, 300);

    return () => clearTimeout(timeout);
  }, [institutionSearch, institutionModalVisible]);

  const meta = STEP_META[step];

  const canOpenInstitutionModal = useMemo(
    () => step === STEPS.PERSONAL,
    [step],
  );

  const loadInstituicoes = async (search = '') => {
    const trimmedSearch = search.trim();
    const requestId = ++latestInstitutionRequestRef.current;
  
    if (!trimmedSearch) {
      setInstituicoes([]);
      setLoadingInstituicoes(false);
      return;
    }
  
    try {
      setLoadingInstituicoes(true);
  
      const response = await api.get('/instituicoes/public', {
        params: {
          search: trimmedSearch,
          limit: 30,
        },
      });
  
      // ignore stale response
      if (requestId !== latestInstitutionRequestRef.current) {
        return;
      }
  
      const payload = response?.data;
      const items = Array.isArray(payload?.items) ? payload.items : [];
  
      setInstituicoes(items);
    } catch (error) {
      if (requestId !== latestInstitutionRequestRef.current) {
        return;
      }
  
      errorLogger.debug('Could not load institutions', {
        error: error?.message,
      });
      setInstituicoes([]);
    } finally {
      if (requestId === latestInstitutionRequestRef.current) {
        setLoadingInstituicoes(false);
      }
    }
  };

  const openInstitutionModal = () => {
    if (!canOpenInstitutionModal) return;
    setInstitutionModalVisible(true);
    setInstitutionSearch('');
  };

  const closeInstitutionModal = () => {
    setInstitutionModalVisible(false);
  };

  const selectInstitution = item => {
    setInstituicaoId(item.id);
    setSelectedInstitutionName(item.nome);
    clearFieldError('instituicaoId');
    closeInstitutionModal();
  };

  const clearFieldError = field => {
    if (errors[field]) {
      setErrors(prev => {
        const next = {...prev};
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError('');
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = getFieldValidationMessage('email', 'required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = getFieldValidationMessage('email', 'invalid');
    }

    if (!senha) {
      newErrors.senha = getFieldValidationMessage('password', 'required');
    } else if (senha.length < 8) {
      newErrors.senha = getFieldValidationMessage('password', 'minLength');
    }

    if (!confirmarSenha) {
      newErrors.confirmarSenha = 'Confirme sua senha.';
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = getFieldValidationMessage(
        'password',
        'mismatch',
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!nome.trim()) {
      newErrors.nome = getFieldValidationMessage('nome', 'required');
    } else if (nome.trim().length < 3) {
      newErrors.nome = getFieldValidationMessage('nome', 'minLength');
    }

    const cpfDigits = cpf.replace(/\D/g, '');
    if (!cpfDigits) {
      newErrors.cpf = getFieldValidationMessage('cpf', 'required');
    } else if (cpfDigits.length !== 11) {
      newErrors.cpf = getFieldValidationMessage('cpf', 'invalid');
    }

    if (!matricula.trim()) {
      newErrors.matricula = getFieldValidationMessage('matricula', 'required');
    }

    if (!instituicaoId) {
      newErrors.instituicaoId = 'Selecione uma instituição de ensino.';
    }

    const age = calcAge(dataNascimento);
    if (!dataNascimento || dataNascimento.replace(/\D/g, '').length !== 8) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória.';
    } else if (age === null || age > 120) {
      newErrors.dataNascimento = 'Data de nascimento inválida.';
    }

    if (age !== null && age < 18) {
      if (!emailResponsavel.trim()) {
        newErrors.emailResponsavel = 'E-mail do responsável é obrigatório para menores de 18 anos.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailResponsavel)) {
        newErrors.emailResponsavel = 'E-mail do responsável inválido.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!cep.trim()) newErrors.cep = 'CEP é obrigatório.';
    if (!logradouro.trim()) newErrors.logradouro = 'Logradouro é obrigatório.';
    if (!numero.trim()) newErrors.numero = 'Número é obrigatório.';
    if (!bairro.trim()) newErrors.bairro = 'Bairro é obrigatório.';
    if (!cidade.trim()) newErrors.cidade = 'Cidade é obrigatória.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNextStep = () => {
    setGeneralError('');

    if (step === STEPS.BASIC && validateStep1()) {
      setStep(STEPS.PERSONAL);
      return;
    }

    if (step === STEPS.PERSONAL && validateStep2()) {
      setStep(STEPS.ADDRESS);
    }
  };

  const goPrevStep = () => {
    setGeneralError('');
    setErrors({});

    if (step === STEPS.PERSONAL) setStep(STEPS.BASIC);
    if (step === STEPS.ADDRESS) setStep(STEPS.PERSONAL);
  };

  const buscarCep = async valorCep => {
    const cepSomenteNumeros = valorCep.replace(/\D/g, '');

    if (cepSomenteNumeros.length !== 8) return;

    try {
      setLoadingCep(true);
      setCepInfo('');

      const response = await fetch(
        `https://viacep.com.br/ws/${cepSomenteNumeros}/json/`,
      );
      const data = await response.json();

      if (!data.erro) {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');

        clearFieldError('logradouro');
        clearFieldError('bairro');
        clearFieldError('cidade');
        clearFieldError('cep');

        if (!data.logradouro) {
          setCepInfo(
            'Este CEP é geral. Preencha logradouro e bairro manualmente.',
          );
        }
      } else {
        setErrors(prev => ({...prev, cep: 'CEP não encontrado'}));
      }
    } catch (error) {
      setGeneralError('Não foi possível buscar o CEP. Verifique sua conexão.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = text => {
    const formatted = formatCep(text);

    setCep(formatted);
    clearFieldError('cep');
    if (cepInfo) setCepInfo('');
    buscarCep(formatted);
  };

  const handleCriarConta = async () => {
    setGeneralError('');
    if (!validateStep3()) return;

    setLoading(true);

    try {
      const isoDate = toIsoDate(dataNascimento);
      const minor = isMinor;

      const result = await register({
        nome,
        email,
        password: senha,
        cpf: cpf.replace(/\D/g, ''),
        matricula,
        telefone: telefone ? telefone.replace(/\D/g, '') : undefined,
        instituicao_id: instituicaoId || undefined,
        data_nascimento: isoDate,
        email_responsavel: minor ? emailResponsavel.trim().toLowerCase() : undefined,
        endereco_casa: {
          logradouro: logradouro.trim(),
          numero: numero.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          cep: cep.replace(/\D/g, ''),
          latitude: -23.5505,
          longitude: -46.6333,
        },
      });

      if (result.success) {
        if (minor) {
          navigation.navigate('Login', {
            message: `Um e-mail foi enviado para ${emailResponsavel.trim()}. Após a confirmação do responsável, seu cadastro será analisado pelo gestor.`,
          });
        } else {
          navigation.navigate('Login');
        }
        return;
      }

      handleRegistrationError(result);
    } catch (error) {
      errorLogger.error(error, {context: 'CriarConta.handleCriarConta'});
      setGeneralError(
        error?.message || 'Ocorreu um erro inesperado. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldStepMap = {
    email: STEPS.BASIC,
    senha: STEPS.BASIC,
    confirmarSenha: STEPS.BASIC,
    nome: STEPS.PERSONAL,
    cpf: STEPS.PERSONAL,
    matricula: STEPS.PERSONAL,
    instituicaoId: STEPS.PERSONAL,
    telefone: STEPS.PERSONAL,
    dataNascimento: STEPS.PERSONAL,
    emailResponsavel: STEPS.PERSONAL,
    cep: STEPS.ADDRESS,
    logradouro: STEPS.ADDRESS,
    numero: STEPS.ADDRESS,
    bairro: STEPS.ADDRESS,
    cidade: STEPS.ADDRESS,
  };

  const navigateToEarliestErrorStep = errorFields => {
    const steps = errorFields.map(f => fieldStepMap[f]).filter(Boolean);
    if (steps.length > 0) setStep(Math.min(...steps));
  };

  const handleRegistrationError = result => {
    const {error, errorCode, field, fieldErrors} = result;

    const backendFieldMapping = {
      password: 'senha',
      instituicao_id: 'instituicaoId',
    };

    const validFormFields = [
      'nome',
      'email',
      'cpf',
      'matricula',
      'telefone',
      'senha',
      'confirmarSenha',
      'instituicaoId',
      'cep',
      'logradouro',
      'numero',
      'bairro',
      'cidade',
    ];

    const extractMessage = msg => {
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg) && msg.length > 0) {
        return typeof msg[0] === 'string' ? msg[0] : 'Campo inválido';
      }
      return 'Campo inválido';
    };

    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const mappedErrors = {};
      const unmappedFields = [];

      for (const [fieldName, errorMsg] of Object.entries(fieldErrors)) {
        if (
          fieldName === 'endereco_casa' &&
          typeof errorMsg === 'object' &&
          !Array.isArray(errorMsg)
        ) {
          for (const [nestedField, nestedError] of Object.entries(errorMsg)) {
            if (validFormFields.includes(nestedField)) {
              mappedErrors[nestedField] = extractMessage(nestedError);
            }
          }
          continue;
        }

        const mappedField = backendFieldMapping[fieldName] || fieldName;

        if (validFormFields.includes(mappedField)) {
          mappedErrors[mappedField] = extractMessage(errorMsg);
        } else {
          unmappedFields.push(fieldName);
        }
      }

      if (Object.keys(mappedErrors).length > 0) {
        setErrors(prev => ({...prev, ...mappedErrors}));
        navigateToEarliestErrorStep(Object.keys(mappedErrors));
      }

      if (unmappedFields.length > 0) {
        setGeneralError(
          `Erro em: ${unmappedFields.join(', ')}. Verifique os dados e tente novamente.`,
        );
      } else if (Object.keys(mappedErrors).length > 1) {
        setGeneralError('Verifique os campos destacados em vermelho.');
      }

      return;
    }

    if (field) {
      const mappedField = backendFieldMapping[field] || field;
      setErrors(prev => ({...prev, [mappedField]: error}));
      navigateToEarliestErrorStep([mappedField]);
      return;
    }

    const fieldErrorMap = {
      [ErrorCode.EMAIL_ALREADY_EXISTS]: {
        field: 'email',
        message: 'Este e-mail já está cadastrado.',
      },
      [ErrorCode.CPF_ALREADY_EXISTS]: {
        field: 'cpf',
        message: 'Este CPF já está cadastrado.',
      },
      [ErrorCode.INVALID_EMAIL]: {
        field: 'email',
        message: 'E-mail inválido.',
      },
      [ErrorCode.INVALID_CPF]: {
        field: 'cpf',
        message: 'CPF inválido.',
      },
      [ErrorCode.INVALID_PASSWORD]: {
        field: 'senha',
        message: error || 'Senha inválida.',
      },
      [ErrorCode.PASSWORD_TOO_WEAK]: {
        field: 'senha',
        message: error || 'Senha muito fraca.',
      },
    };

    if (fieldErrorMap[errorCode]) {
      const {field: errField, message: errMsg} = fieldErrorMap[errorCode];
      setErrors(prev => ({...prev, [errField]: errMsg}));
      navigateToEarliestErrorStep([errField]);
      return;
    }

    switch (errorCode) {
      case ErrorCode.REQUIRED_FIELD:
        setGeneralError(error || 'Preencha todos os campos obrigatórios.');
        break;
      case ErrorCode.NETWORK_ERROR:
        setGeneralError('Sem conexão. Verifique sua internet e tente novamente.');
        break;
      case ErrorCode.SERVICE_UNAVAILABLE:
        setGeneralError(
          'Servidor indisponível. Tente novamente em alguns minutos.',
        );
        break;
      default:
        setGeneralError(error || 'Não foi possível criar a conta.');
    }
  };

  const renderFieldError = field => {
    if (!errors[field]) return null;

    return (
      <View style={styles.fieldErrorContainer}>
        <Icon name={IconNames.error} size="xs" color={colors.error.main} />
        <Text style={styles.fieldErrorText}>{errors[field]}</Text>
      </View>
    );
  };

  const renderInstitutionItem = ({item}) => {
    const isSelected = instituicaoId === item.id;
  
    const location = [item.cidade, item.uf].filter(Boolean).join(' • ');
    const subtitleParts = [item.sigla, location].filter(Boolean);
  
    const tipoLabel =
      item.tipo ||
      item.organizacao_academica ||
      item.categoria_administrativa;
  
    return (
      <TouchableOpacity
        style={[
          styles.institutionCard,
          isSelected && styles.institutionCardSelected,
        ]}
        onPress={() => selectInstitution(item)}
        activeOpacity={0.82}>
        
        <View style={styles.institutionCardLeft}>
          <View
            style={[
              styles.institutionIconBadge,
              isSelected && styles.institutionIconBadgeSelected,
            ]}>
            <Icon
              name="school"
              size="sm"
              color={isSelected ? '#0347D0' : colors.neutral[500]}
            />
          </View>
  
          <View style={styles.institutionTextBlock}>
            {/* NAME */}
            <Text
              style={[
                styles.institutionName,
                isSelected && styles.institutionNameSelected,
              ]}
              numberOfLines={2}>
              {item.nome}
            </Text>
  
            {/* SUBTITLE */}
            {subtitleParts.length > 0 && (
              <Text style={styles.institutionMeta} numberOfLines={1}>
                {subtitleParts.join(' • ')}
              </Text>
            )}
  
            {/* BADGE */}
            {!!tipoLabel && (
              <View style={styles.institutionBadge}>
                <Text style={styles.institutionBadgeText}>
                  {tipoLabel}
                </Text>
              </View>
            )}
          </View>
        </View>
  
        {/* CHECK */}
        <View
          style={[
            styles.checkCircle,
            isSelected && styles.checkCircleSelected,
          ]}>
          {isSelected && (
            <Icon name={IconNames.check} size="xs" color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <AuthBackground />

      <TouchableOpacity
        style={styles.floatingBack}
        onPress={step > STEPS.BASIC ? goPrevStep : () => navigation.goBack()}
        activeOpacity={0.75}>
        <Icon
          name={IconNames.back}
          size="md"
          color={colors.neutral[700]}
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AuthLogo width={150} style={styles.logo} />
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{translateY: cardTranslateY}],
              },
            ]}>
            <View style={styles.progressBar}>
              {[1, 2, 3].map(s => (
                <View
                  key={s}
                  style={[
                    styles.progressSegment,
                    s <= step && styles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.stepHeader}>
              <View style={styles.stepIconBadge}>
                <Icon name={meta.icon} size="md" color="#0347D0" />
              </View>

              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>{meta.title}</Text>
                <Text style={styles.stepSubtitle}>{meta.subtitle}</Text>
              </View>

              <Text style={styles.stepCounter}>
                {step}/{TOTAL_STEPS}
              </Text>
            </View>

            {step === STEPS.BASIC && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-mail *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.email && styles.inputWrapperError,
                  ]}>
                  <Icon name="email" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.neutral[400]}
                    value={email}
                    onChangeText={text => {
                      setEmail(text);
                      clearFieldError('email');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </View>
                {renderFieldError('email')}

                <Text style={styles.label}>Senha *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.senha && styles.inputWrapperError,
                  ]}>
                  <Icon name="lock" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor={colors.neutral[400]}
                    value={senha}
                    onChangeText={text => {
                      setSenha(text);
                      clearFieldError('senha');
                    }}
                    secureTextEntry={!showSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowSenha(prev => !prev)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Icon
                      name={
                        showSenha
                          ? IconNames.visibilityOff
                          : IconNames.visibility
                      }
                      size="md"
                      color={colors.neutral[400]}
                    />
                  </TouchableOpacity>
                </View>
                {renderFieldError('senha')}

                <Text style={styles.label}>Confirmar senha *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmarSenha && styles.inputWrapperError,
                  ]}>
                  <Icon name="lock" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="Digite a senha novamente"
                    placeholderTextColor={colors.neutral[400]}
                    value={confirmarSenha}
                    onChangeText={text => {
                      setConfirmarSenha(text);
                      clearFieldError('confirmarSenha');
                    }}
                    secureTextEntry={!showConfirmarSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmarSenha(prev => !prev)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Icon
                      name={
                        showConfirmarSenha
                          ? IconNames.visibilityOff
                          : IconNames.visibility
                      }
                      size="md"
                      color={colors.neutral[400]}
                    />
                  </TouchableOpacity>
                </View>
                {renderFieldError('confirmarSenha')}
              </View>
            )}

            {step === STEPS.PERSONAL && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome completo *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.nome && styles.inputWrapperError,
                  ]}>
                  <Icon name="person" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome completo"
                    placeholderTextColor={colors.neutral[400]}
                    value={nome}
                    onChangeText={text => {
                      setNome(text);
                      clearFieldError('nome');
                    }}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                  />
                </View>
                {renderFieldError('nome')}

                <Text style={styles.label}>CPF *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.cpf && styles.inputWrapperError,
                  ]}>
                  <Icon name="badge" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor={colors.neutral[400]}
                    value={cpf}
                    onChangeText={text => {
                      setCpf(formatCpf(text));
                      clearFieldError('cpf');
                    }}
                    keyboardType="number-pad"
                    maxLength={14}
                  />
                </View>
                {renderFieldError('cpf')}

                <Text style={styles.label}>Matrícula *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.matricula && styles.inputWrapperError,
                  ]}>
                  <Icon name="school" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="Número da matrícula escolar"
                    placeholderTextColor={colors.neutral[400]}
                    value={matricula}
                    onChangeText={text => {
                      setMatricula(text);
                      clearFieldError('matricula');
                    }}
                  />
                </View>
                {renderFieldError('matricula')}

                <Text style={styles.label}>Instituição de ensino *</Text>
                <TouchableOpacity
                  style={[
                    styles.inputWrapper,
                    styles.selectWrapperModern,
                    errors.instituicaoId && styles.inputWrapperError,
                  ]}
                  onPress={openInstitutionModal}
                  activeOpacity={0.82}>
                  <View style={styles.selectContent}>
                    <View style={styles.selectIconBadge}>
                      <Icon name="school" size="sm" color="#0347D0" />
                    </View>

                    <View style={styles.selectTextContainer}>
                      <Text style={styles.selectLabelMini}>Instituição</Text>
                      <Text
                        style={[
                          styles.selectTextModern,
                          !selectedInstitutionName && styles.selectPlaceholder,
                        ]}
                        numberOfLines={1}>
                        {selectedInstitutionName || 'Selecione sua instituição'}
                      </Text>
                    </View>
                  </View>

                  <Icon name="expand-more" size="md" color={colors.neutral[400]} />
                </TouchableOpacity>
                {renderFieldError('instituicaoId')}

                <Text style={styles.label}>Telefone</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.telefone && styles.inputWrapperError,
                  ]}>
                  <Icon name="phone" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor={colors.neutral[400]}
                    value={telefone}
                    onChangeText={text => {
                      setTelefone(formatPhone(text));
                      clearFieldError('telefone');
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                </View>
                {renderFieldError('telefone')}

                <Text style={styles.label}>Data de nascimento *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.dataNascimento && styles.inputWrapperError,
                  ]}>
                  <Icon name="cake" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.neutral[400]}
                    value={dataNascimento}
                    onChangeText={text => {
                      setDataNascimento(formatDate(text));
                      clearFieldError('dataNascimento');
                      clearFieldError('emailResponsavel');
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
                {renderFieldError('dataNascimento')}

                {isMinor && (
                  <>
                    <View style={styles.minorBanner}>
                      <Icon name="family-restroom" size="md" color={colors.warning.dark} />
                      <Text style={styles.minorBannerText}>
                        Por ser menor de 18 anos, é necessária a autorização de um responsável legal.
                      </Text>
                    </View>

                    <Text style={styles.label}>E-mail do responsável *</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.emailResponsavel && styles.inputWrapperError,
                      ]}>
                      <Icon name="email" size="md" color={colors.neutral[400]} />
                      <TextInput
                        style={styles.input}
                        placeholder="responsavel@email.com"
                        placeholderTextColor={colors.neutral[400]}
                        value={emailResponsavel}
                        onChangeText={text => {
                          setEmailResponsavel(text);
                          clearFieldError('emailResponsavel');
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    {renderFieldError('emailResponsavel')}
                  </>
                )}
              </View>
            )}

            {step === STEPS.ADDRESS && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CEP *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.cep && styles.inputWrapperError,
                  ]}>
                  <Icon
                    name="location-on"
                    size="md"
                    color={colors.neutral[400]}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="00000-000"
                    placeholderTextColor={colors.neutral[400]}
                    value={cep}
                    onChangeText={handleCepChange}
                    keyboardType="number-pad"
                    maxLength={9}
                    editable={!loadingCep}
                  />
                  {loadingCep && (
                    <ActivityIndicator size="small" color="#0347D0" />
                  )}
                </View>
                {renderFieldError('cep')}
                {!!cepInfo && <Text style={styles.infoText}>{cepInfo}</Text>}

                <Text style={styles.label}>Logradouro *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.logradouro && styles.inputWrapperError,
                  ]}>
                  <Icon name="home" size="md" color={colors.neutral[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="Rua, Avenida, etc."
                    placeholderTextColor={colors.neutral[400]}
                    value={logradouro}
                    onChangeText={text => {
                      setLogradouro(text);
                      clearFieldError('logradouro');
                    }}
                  />
                </View>
                {renderFieldError('logradouro')}

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Número *</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.numero && styles.inputWrapperError,
                      ]}>
                      <TextInput
                        style={[styles.input, styles.inputNoPad]}
                        placeholder="123"
                        placeholderTextColor={colors.neutral[400]}
                        value={numero}
                        onChangeText={text => {
                          setNumero(text);
                          clearFieldError('numero');
                        }}
                      />
                    </View>
                    {renderFieldError('numero')}
                  </View>

                  <View style={styles.halfField}>
                    <Text style={styles.label}>Bairro *</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.bairro && styles.inputWrapperError,
                      ]}>
                      <TextInput
                        style={[styles.input, styles.inputNoPad]}
                        placeholder="Centro"
                        placeholderTextColor={colors.neutral[400]}
                        value={bairro}
                        onChangeText={text => {
                          setBairro(text);
                          clearFieldError('bairro');
                        }}
                      />
                    </View>
                    {renderFieldError('bairro')}
                  </View>
                </View>

                <Text style={styles.label}>Cidade *</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.cidade && styles.inputWrapperError,
                  ]}>
                  <Icon
                    name="location-city"
                    size="md"
                    color={colors.neutral[400]}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Sua cidade"
                    placeholderTextColor={colors.neutral[400]}
                    value={cidade}
                    onChangeText={text => {
                      setCidade(text);
                      clearFieldError('cidade');
                    }}
                  />
                </View>
                {renderFieldError('cidade')}
              </View>
            )}

            {!!generalError && (
              <View style={styles.errorContainer}>
                <Icon name={IconNames.error} size="sm" color={colors.error.main} />
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            )}

            {step < STEPS.ADDRESS ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goNextStep}
                activeOpacity={0.88}>
                <Text style={styles.primaryButtonText}>Continuar</Text>
                <Icon name={IconNames.forward} size="md" color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleCriarConta}
                disabled={loading}
                activeOpacity={0.88}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Criar conta</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Já tem uma conta?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.noteText}>* Campos obrigatórios</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={institutionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeInstitutionModal}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar instituição</Text>
              <TouchableOpacity onPress={closeInstitutionModal} activeOpacity={0.8}>
                <Icon name={IconNames.close} size="md" color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchWrapper}>
              <View style={styles.searchBar}>
                <Icon name="search" size="md" color={colors.neutral[400]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por nome, sigla ou cidade"
                  placeholderTextColor={colors.neutral[400]}
                  value={institutionSearch}
                  onChangeText={setInstitutionSearch}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {!!institutionSearch && (
                  <TouchableOpacity
                    onPress={() => setInstitutionSearch('')}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Icon name={IconNames.close} size="sm" color={colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {loadingInstituicoes ? (
              <View style={styles.modalCenterState}>
                <ActivityIndicator color="#0347D0" />
                <Text style={styles.modalStateText}>Buscando instituições...</Text>
              </View>
            ) : institutionSearch.trim().length < 2 ? (
              <View style={styles.modalCenterState}>
                <Icon name="search" size="lg" color={colors.neutral[300]} />
                <Text style={styles.modalStateTitle}>Encontre sua instituição</Text>
                <Text style={styles.modalStateText}>
                  Digite pelo menos 2 letras do nome, sigla ou cidade.
                </Text>
              </View>
            ) : (
              <FlatList
                data={instituicoes}
                keyExtractor={item => String(item.id)}
                renderItem={renderInstitutionItem}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalListContent}
                ListEmptyComponent={
                  <View style={styles.modalCenterState}>
                    <Icon name="search" size="lg" color={colors.neutral[300]} />
                    <Text style={styles.modalStateTitle}>
                      Nenhuma instituição encontrada
                    </Text>
                    <Text style={styles.modalStateText}>
                      Tente outro nome, sigla ou cidade.
                    </Text>
                  </View>
                }
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEF3FB',
  },

  logo: {
    marginTop: 40,
  },

  floatingBack: {
    position: 'absolute',
    top: 48,
    left: spacing.lg,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15,23,42,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  kav: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },

  card: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  progressBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border.light,
  },

  progressSegmentActive: {
    backgroundColor: '#0347D0',
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  stepHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  stepIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(3,71,208,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 22,
  },

  stepSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },

  stepCounter: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.text.disabled,
    marginLeft: spacing.md,
  },

  fieldGroup: {
    gap: spacing.xs,
  },

  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },

  inputWrapperError: {
    borderColor: colors.error.main,
  },

  input: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },

  inputFlex: {
    paddingRight: spacing.sm,
  },

  inputNoPad: {
    paddingHorizontal: 0,
  },

  selectWrapper: {
    justifyContent: 'space-between',
  },

  selectText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.primary,
  },

  selectPlaceholder: {
    color: colors.neutral[400],
  },

  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  halfField: {
    flex: 1,
  },

  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  fieldErrorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.error.main,
    flex: 1,
  },

  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.warning.dark,
    marginTop: spacing.xs,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.error.main,
  },

  errorText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.error.dark,
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: '#0347D0',
    marginTop: spacing.xl,
    ...shadows.sm,
  },

  primaryButtonDisabled: {
    opacity: 0.65,
  },

  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },

  loginText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.secondary,
  },

  loginLink: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#0347D0',
  },

  noteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: spacing.base,
  },

  minorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.dark,
  },

  minorBannerText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.warning.dark,
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.34)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: SCREEN_H * 0.72,
    maxHeight: SCREEN_H * 0.88,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    ...shadows.xl,
  },

  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.base,
    paddingTop: spacing.xs,
  },

  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text.primary,
  },

  modalSearchWrapper: {
    marginBottom: spacing.md,
  },

  modalListContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
  },

  institutionItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  institutionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },

  institutionMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },

  modalCenterState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },

  modalStateTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.text.primary,
  },

  modalStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  selectWrapperModern: {
    justifyContent: 'space-between',
    minHeight: 64,
  },
  
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  selectIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(3,71,208,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  
  selectTextContainer: {
    flex: 1,
  },
  
  selectLabelMini: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  
  selectTextModern: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.text.primary,
  },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  
  institutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderRadius: 18,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  
  institutionCardSelected: {
    borderColor: '#0347D0',
    backgroundColor: 'rgba(3,71,208,0.05)',
  },
  
  institutionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  
  institutionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  
  institutionIconBadgeSelected: {
    backgroundColor: 'rgba(3,71,208,0.10)',
  },
  
  institutionTextBlock: {
    flex: 1,
  },
  
  institutionNameSelected: {
    color: '#0347D0',
  },
  
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.paper,
  },
  
  checkCircleSelected: {
    backgroundColor: '#0347D0',
    borderColor: '#0347D0',
  },
  
  institutionMeta: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  
  institutionBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(3,71,208,0.08)',
  },
  
  institutionBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#0347D0',
  },
});

export default CriarConta;