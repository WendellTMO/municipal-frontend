import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {motoristaService} from '../../services/motoristaService';
import { colors, spacing, borderRadius, shadows, textStyles, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { StaticRouteMap, MapPointPicker } from '../../features/map/index';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import {
  validarLatitude,
  validarLongitude,
  dividirParColado,
  coordenadasValidas,
} from '../../utils/coordenadas';

const RotaMapaSimples = ({ pontos }) => {
  const { validPontos, hasValidPoints } = useMemo(() => {
    const valid = (pontos || []).filter(
      p =>
        p.latitude != null &&
        p.longitude != null &&
        !isNaN(Number(p.latitude)) &&
        !isNaN(Number(p.longitude)),
    );
    return { validPontos: valid, hasValidPoints: valid.length > 0 };
  }, [pontos]);

  if (!hasValidPoints) {
    return (
      <View style={mapStyles.container}>
        <View style={mapStyles.emptyMap}>
          <View style={mapStyles.emptyMapIcon}>
            <Icon name={IconNames.map} size="huge" color="#9CA3AF" />
          </View>
          <Text style={mapStyles.emptyTitle}>Mapa da Rota</Text>
          <Text style={mapStyles.emptyText}>Adicione pontos para visualizar a rota</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={mapStyles.container}>
      <View style={mapStyles.header}>
        <Text style={mapStyles.title}>Mapa da Rota</Text>
        <Text style={mapStyles.subtitle}>{validPontos.length} pontos</Text>
      </View>

      <View style={mapStyles.mapWrapper}>
        <StaticRouteMap pontosRota={validPontos} />
      </View>

      <View style={mapStyles.routeInfo}>
        <View style={mapStyles.routeInfoItem}>
          <View style={[mapStyles.infoDot, { backgroundColor: '#34A853' }]} />
          <Text style={mapStyles.infoLabel}>
            {validPontos[0]?.nome || validPontos[0]?.apelido || 'Início'}
          </Text>
        </View>

        <View style={mapStyles.routeInfoDivider}>
          <View style={mapStyles.routeInfoLine} />
          <Text style={mapStyles.routeInfoPoints}>
            {validPontos.length - 2 > 0 ? `+${validPontos.length - 2}` : ''}
          </Text>
          <View style={mapStyles.routeInfoLine} />
        </View>

        <View style={mapStyles.routeInfoItem}>
          <View style={[mapStyles.infoDot, { backgroundColor: '#EA4335' }]} />
          <Text style={mapStyles.infoLabel}>
            {validPontos[validPontos.length - 1]?.nome ||
              validPontos[validPontos.length - 1]?.apelido ||
              'Fim da Rota'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const mapStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.base,
    ...shadows.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  mapWrapper: {
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  zoomContainer: {
    width: '100%',
    height: '100%',
  },
  mapArea: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E8F0E8',
  },
  terrainBase: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F0E8',
  },
  terrainOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF4EA',
    opacity: 0.9,
  },
  routeSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5,
  },
  roadsPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  road: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  roadVertical: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    marginLeft: -14,
    marginTop: -38,
  },
  pinShadow: {
    position: 'absolute',
    bottom: -4,
    width: 10,
    height: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  pinStart: {
    backgroundColor: '#34A853', // Google green
  },
  pinEnd: {
    backgroundColor: '#EA4335', // Google red
  },
  pinMiddle: {
    backgroundColor: '#4285F4', // Google blue
  },
  pinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  pinPointerStart: {
    borderTopColor: '#34A853',
  },
  pinPointerEnd: {
    borderTopColor: '#EA4335',
  },
  pinPointerMiddle: {
    borderTopColor: '#4285F4',
  },
  tooltip: {
    position: 'absolute',
    top: -30,
    backgroundColor: '#3C4043',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    maxWidth: 120,
    ...shadows.sm,
  },
  tooltipText: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mapControls: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xs,
    ...shadows.sm,
  },
  controlButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 18,
    color: '#5F6368',
    fontWeight: '300',
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlTextDisabled: {
    color: '#BDBDBD',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#E8EAED',
  },
  attribution: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.sm,
  },
  attributionText: {
    fontSize: 10,
    color: '#70757A',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  infoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.xs,
  },
  infoLabel: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  routeInfoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  routeInfoLine: {
    width: 20,
    height: 2,
    backgroundColor: '#DADCE0',
  },
  routeInfoPoints: {
    ...textStyles.caption,
    color: colors.text.hint,
    paddingHorizontal: spacing.xs,
  },
  emptyMap: {
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyMapIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.text.secondary,
  },
  emptyText: {
    ...textStyles.caption,
    color: colors.text.hint,
    textAlign: 'center',
  },
});



const DefinirPontosRota = ({navigation, route}) => {
  const params = route?.params || {};
  const {rota: rotaParam, viagem, isNovaRota} = params;
  
  // Determine route ID from params
  const rotaId = rotaParam?.id || viagem?.rota_id;
  const rotaNome = rotaParam?.nome || viagem?.rota_nome || 'Rota';
  
  const toast = useToast();
  
  const [pontosRota, setPontosRota] = useState([]);
  const [pontosDisponiveis, setPontosDisponiveis] = useState([]);
  const [mostrarFormNovoPonto, setMostrarFormNovoPonto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [adicionando, setAdicionando] = useState(null);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);

  // New point creation state
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [resultadoSelecionado, setResultadoSelecionado] = useState(null);
  const [localizacaoPin, setLocalizacaoPin] = useState(null);
  const [nomePontoCustom, setNomePontoCustom] = useState('');
  const [modoPonto, setModoPonto] = useState('endereco');
  const [latTexto, setLatTexto] = useState('');
  const [lonTexto, setLonTexto] = useState('');
  const [latTocado, setLatTocado] = useState(false);
  const [lonTocado, setLonTocado] = useState(false);
  const tecladoDecimal = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';

  const atualizarCoordenadas = (lat, lon) => {
    setLatTexto(lat);
    setLonTexto(lon);
    setLocalizacaoPin(coordenadasValidas(lat, lon));
  };

  const handleMudarLatitude = texto => {
    setLatTocado(true);
    const par = dividirParColado(texto);
    if (par) {
      setLonTocado(true);
      atualizarCoordenadas(par.latitude, par.longitude);
      return;
    }
    atualizarCoordenadas(texto, lonTexto);
  };

  const handleMudarLongitude = texto => {
    setLonTocado(true);
    atualizarCoordenadas(latTexto, texto);
  };

  const handleMudarModo = modo => {
    if (modo === modoPonto) return;
    handleLimparNovoPonto();
    setModoPonto(modo);
  };

  const handleBuscarEndereco = async () => {
    if (!termoBusca.trim()) {
      toast.error('Digite um endereço para buscar.');
      return;
    }

    try {
      setBuscandoEndereco(true);
      setResultadosBusca([]);
      setResultadoSelecionado(null);
      setLocalizacaoPin(null);

      const query = encodeURIComponent(termoBusca);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=br&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BusKa/1.0.0-beta (React Native; contact: contato.buska@gmail.com)',
            'Accept': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        setResultadosBusca(data);
      } else {
        toast.error('Nenhum resultado. Tente um endereço mais específico (Ex: Rua das Flores, Campina Grande).');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar. Verifique sua conexão.');
    } finally {
      setBuscandoEndereco(false);
    }
  };

  const handleSelecionarResultado = (resultado) => {
    const lat = parseFloat(resultado.lat);
    const lon = parseFloat(resultado.lon);
    setResultadoSelecionado(resultado);
    setLocalizacaoPin({ latitude: lat, longitude: lon });

    const address = resultado.address || {};
    const nomeGuess =
      address.road ||
      address.pedestrian ||
      address.suburb ||
      address.neighbourhood ||
      resultado.display_name.split(',')[0];
    setNomePontoCustom(nomeGuess || '');
  };

  const handleLimparNovoPonto = () => {
    setResultadoSelecionado(null);
    setResultadosBusca([]);
    setLocalizacaoPin(null);
    setNomePontoCustom('');
    setTermoBusca('');
    setLatTexto('');
    setLonTexto('');
    setLatTocado(false);
    setLonTocado(false);
  };

  // Load existing points
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        
        // Load available points (municipality points) and deduplicate
        const todosOsPontos = await motoristaService.listarPontos().then(unwrapItems);
        const pontosUnicos = [];
        const idsVistos = new Set();
        for (const ponto of (todosOsPontos || [])) {
          const pontoId = String(ponto.id);
          if (!idsVistos.has(pontoId)) {
            idsVistos.add(pontoId);
            pontosUnicos.push(ponto);
          }
        }
        setPontosDisponiveis(pontosUnicos);
        
        // Load route points if editing existing route
        if (rotaId && !isNovaRota) {
          const pontosData = await motoristaService.listarPontosRota(rotaId).then(unwrapItems);
          setPontosRota(pontosData || []);
        }
      } catch (error) {
        console.error('Error loading points:', error);
        toast.error('Não foi possível carregar os pontos.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [rotaId, isNovaRota]);

  // Track added point IDs to prevent duplicates
  const pontosRotaIds = useMemo(() => 
    new Set(pontosRota.map(p => String(p.id))), 
    [pontosRota]
  );

  const handleAdicionarPontoExistente = (ponto) => {
    const pontoIdStr = String(ponto.id);
    
    // Prevent double-clicks
    if (adicionando === pontoIdStr) {
      return;
    }
    
    // Check using memoized Set for instant lookup
    if (pontosRotaIds.has(pontoIdStr)) {
      toast.warning('Este ponto já está na rota.');
      return;
    }
    
    // Lock this point while adding
    setAdicionando(pontoIdStr);
    
    setPontosRota(prev => {
      // Double-check inside updater to handle race conditions
      if (prev.some(p => String(p.id) === pontoIdStr)) {
        return prev;
      }
      return [...prev, {
        ...ponto,
        ordem: prev.length + 1,
      }];
    });
    
    toast.success(`${ponto.nome || ponto.apelido} adicionado!`);
    
    // Unlock after a short delay
    setTimeout(() => setAdicionando(null), 300);
  };

  const handleCriarNovoPonto = async () => {
    if (!nomePontoCustom.trim()) {
      toast.error('Informe o nome do ponto.');
      return;
    }

    if (!localizacaoPin) {
      toast.error('Selecione uma localização no mapa.');
      return;
    }

    const { latitude: lat, longitude: lon } = localizacaoPin;

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error('Coordenadas fora do intervalo válido.');
      return;
    }

    try {
      setSalvando(true);

      const novoPonto = await motoristaService.criarPonto({
        apelido: nomePontoCustom.trim(),
        latitude: lat,
        longitude: lon,
      });

      setPontosRota(prev => [
        ...prev,
        {
          id: novoPonto.id,
          nome: nomePontoCustom.trim(),
          apelido: nomePontoCustom.trim(),
          latitude: lat,
          longitude: lon,
          ordem: prev.length + 1,
        },
      ]);

      handleLimparNovoPonto();
      setMostrarFormNovoPonto(false);

      toast.success('Ponto criado e adicionado à rota!');
    } catch (error) {
      toast.error(error?.message || 'Erro ao criar ponto.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverPonto = (pontoId) => {
    // Use window.confirm for web compatibility (Alert.alert doesn't work well on web)
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Remover este ponto da rota?')) {
        setPontosRota(prev => prev.filter(p => p.id !== pontoId));
        toast.info('Ponto removido.');
      }
    } else {
      // Fallback for native
      Alert.alert(
        'Remover Ponto',
        'Tem certeza que deseja remover este ponto da rota?',
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => {
              setPontosRota(prev => prev.filter(p => p.id !== pontoId));
              toast.info('Ponto removido.');
            },
          },
        ],
      );
    }
  };

  const handleMoverPonto = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= pontosRota.length) return;
    
    const newPontos = [...pontosRota];
    [newPontos[index], newPontos[newIndex]] = [newPontos[newIndex], newPontos[index]];
    
    // Update ordem
    newPontos.forEach((p, i) => { p.ordem = i + 1; });
    setPontosRota(newPontos);
  };

  const handleSalvarPontos = async () => {
    if (pontosRota.length === 0) {
      toast.error('Adicione pelo menos um ponto.');
      return;
    }

    try {
      // For new routes, go to schedule configuration
      if (isNovaRota) {
        navigation.navigate('DefinirHorariosRota', {
          rota: { nome: rotaNome, pontos: pontosRota },
          isNovaRota: true,
          motorista_padrao_id: params.motorista_padrao_id || null,
          veiculo_padrao_id: params.veiculo_padrao_id || null,
        });
      } else {
        if (!rotaId) {
          toast.error('Rota não encontrada.');
          return;
        }
        
        setSalvando(true);
        await motoristaService.adicionarPontosRota(rotaId, {
          pontos: pontosRota.map((p, index) => ({
            ponto_id: p.id,
            ordem: index + 1,
          })),
        });
      
        toast.success('Pontos salvos com sucesso!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving points:', error);
      toast.error(error?.message || 'Erro ao salvar pontos.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.dark} />
          <Text style={styles.loadingText}>Carregando pontos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <SubHeader titulo="Pontos da Rota" subtitulo={rotaNome} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView}>
        <View style={styles.content}>
          
          {/* Route Map Visualization */}
          <RotaMapaSimples pontos={pontosRota} />
          
          {/* Current Route Points */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Pontos na Rota ({pontosRota.length})</Text>
            </View>
            
            {pontosRota.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name={IconNames.route} size="huge" color={colors.neutral[300]} />
                <Text style={styles.emptyText}>Nenhum ponto adicionado</Text>
                <Text style={styles.emptySubtext}>
                  Selecione pontos existentes ou crie novos abaixo
                </Text>
              </View>
            ) : (
              pontosRota.map((ponto, index) => (
                <View key={`${ponto.id}-${index}`} style={styles.pontoItem}>
                  {/* Drag handle */}
                  <View style={styles.dragHandle}>
                    <Icon name={IconNames.moreVert} size="sm" color={colors.neutral[400]} />
                  </View>
                  
                  <View style={styles.pontoOrdem}>
                    <Text style={styles.pontoOrdemText}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.pontoInfo}>
                    <Text style={styles.pontoNome}>{ponto.nome || ponto.apelido}</Text>
                    {ponto.latitude != null && ponto.longitude != null && (
                      <Text style={styles.pontoCoords}>
                        {Number(ponto.latitude).toFixed(5)}, {Number(ponto.longitude).toFixed(5)}
                      </Text>
                    )}
                  </View>
                  
                  {/* Move buttons */}
                  <View style={styles.pontoMoveActions}>
                    <TouchableOpacity 
                      style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                      onPress={() => handleMoverPonto(index, -1)}
                      disabled={index === 0}>
                      <Icon 
                        name={IconNames.expandLess} 
                        size="md" 
                        color={index === 0 ? colors.neutral[300] : colors.primary.dark} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.moveButton, index === pontosRota.length - 1 && styles.moveButtonDisabled]}
                      onPress={() => handleMoverPonto(index, 1)}
                      disabled={index === pontosRota.length - 1}>
                      <Icon 
                        name={IconNames.expandMore} 
                        size="md" 
                        color={index === pontosRota.length - 1 ? colors.neutral[300] : colors.primary.dark} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Remove button */}
                  <TouchableOpacity 
                    style={styles.removeButtonStyled}
                    onPress={() => handleRemoverPonto(ponto.id)}>
                    <Icon name={IconNames.delete} size="sm" color={colors.error.main} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Available Points */}
          {pontosDisponiveis.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pontos Disponíveis</Text>
              <Text style={styles.cardSubtitle}>Toque para adicionar à rota</Text>
              
              <View style={styles.pontosGrid}>
                {pontosDisponiveis.slice(0, 15).map(ponto => {
                  const pontoIdStr = String(ponto.id);
                  const isAdded = pontosRotaIds.has(pontoIdStr);
                  const isAdding = adicionando === pontoIdStr;
                  const isDisabled = isAdded || isAdding;
                  
                  return (
                    <TouchableOpacity
                      key={ponto.id}
                      style={[
                        styles.pontoChip, 
                        isAdded && styles.pontoChipAdded,
                        isAdding && styles.pontoChipAdding,
                      ]}
                      onPress={() => handleAdicionarPontoExistente(ponto)}
                      disabled={isDisabled}>
                      <Icon 
                        name={isAdded ? IconNames.checkCircle : IconNames.add} 
                        size="xs" 
                        color={isAdded ? colors.success.main : colors.primary.dark} 
                      />
                      <Text style={[styles.pontoChipText, isAdded && styles.pontoChipTextAdded]} numberOfLines={1}>
                        {ponto.apelido || ponto.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Create New Point */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeaderButton}
              onPress={() => {
                setMostrarFormNovoPonto(!mostrarFormNovoPonto);
                if (mostrarFormNovoPonto) handleLimparNovoPonto();
              }}>
              <View style={styles.cardHeaderLeft}>
                <Icon name={IconNames.add} size="md" color={colors.success.main} />
                <Text style={styles.cardTitle}>Criar Novo Ponto</Text>
              </View>
              <Icon
                name={mostrarFormNovoPonto ? IconNames.expandLess : IconNames.expandMore}
                size="md"
                color={colors.text.secondary}
              />
            </TouchableOpacity>

            {mostrarFormNovoPonto && (
              <View style={styles.formContainer}>

                {/* Mode selector */}
                <View style={npStyles.modeRow}>
                  {[['endereco', 'Endereço'], ['coordenadas', 'Coordenadas']].map(([modo, rotulo]) => (
                    <TouchableOpacity
                      key={modo}
                      style={[npStyles.modeButton, modoPonto === modo && npStyles.modeButtonActive]}
                      onPress={() => handleMudarModo(modo)}>
                      <Text style={[npStyles.modeText, modoPonto === modo && npStyles.modeTextActive]}>
                        {rotulo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {modoPonto === 'coordenadas' && (
                  <View>
                    <Text style={npStyles.fieldLabel}>Latitude</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="-7.2290"
                      placeholderTextColor={colors.text.hint}
                      value={latTexto}
                      onChangeText={handleMudarLatitude}
                      keyboardType={tecladoDecimal}
                    />
                    {latTocado && !!validarLatitude(latTexto) && (
                      <Text style={npStyles.fieldError}>{validarLatitude(latTexto)}</Text>
                    )}
                    <Text style={npStyles.fieldLabel}>Longitude</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="-35.9020"
                      placeholderTextColor={colors.text.hint}
                      value={lonTexto}
                      onChangeText={handleMudarLongitude}
                      keyboardType={tecladoDecimal}
                    />
                    {lonTocado && !!validarLongitude(lonTexto) && (
                      <Text style={npStyles.fieldError}>{validarLongitude(lonTexto)}</Text>
                    )}
                  </View>
                )}

                {/* Search row */}
                {modoPonto === 'endereco' && (
                <View style={npStyles.searchRow}>
                  <TextInput
                    style={[styles.input, npStyles.searchInput]}
                    placeholder="Ex: Praça Central, Campina Grande"
                    placeholderTextColor={colors.text.hint}
                    value={termoBusca}
                    onChangeText={setTermoBusca}
                    onSubmitEditing={handleBuscarEndereco}
                    returnKeyType="search"
                    editable={!resultadoSelecionado}
                  />
                  <TouchableOpacity
                    onPress={handleBuscarEndereco}
                    style={[npStyles.searchButton, resultadoSelecionado && npStyles.searchButtonDisabled]}
                    disabled={buscandoEndereco || !!resultadoSelecionado}>
                    {buscandoEndereco ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon name={IconNames.search} size="sm" color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
                )}

                {/* Search results list */}
                {resultadosBusca.length > 0 && !resultadoSelecionado && (
                  <View style={npStyles.resultsList}>
                    <Text style={npStyles.resultsTitle}>
                      {resultadosBusca.length} resultado(s) — toque para selecionar
                    </Text>
                    {resultadosBusca.map((r, i) => {
                      const parts = r.display_name.split(',');
                      const mainPart = parts.slice(0, 2).join(',').trim();
                      const subPart = parts.slice(2, 5).join(',').trim();
                      const isLast = i === resultadosBusca.length - 1;
                      return (
                        <TouchableOpacity
                          key={r.place_id || i}
                          style={[npStyles.resultItem, isLast && { borderBottomWidth: 0 }]}
                          onPress={() => handleSelecionarResultado(r)}>
                          <View style={npStyles.resultIconWrap}>
                            <Icon name={IconNames.location} size="sm" color={colors.primary.dark} />
                          </View>
                          <View style={npStyles.resultText}>
                            <Text style={npStyles.resultMain} numberOfLines={1}>{mainPart}</Text>
                            {!!subPart && (
                              <Text style={npStyles.resultSub} numberOfLines={1}>{subPart}</Text>
                            )}
                          </View>
                          <Icon name={IconNames.expandMore} size="sm" color={colors.neutral[400]} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Selected location + map picker + name */}
                {localizacaoPin && (modoPonto === 'coordenadas' || resultadoSelecionado) && (
                  <>
                    {/* Selected address header */}
                    <View style={npStyles.selectedHeader}>
                      <View style={npStyles.selectedInfo}>
                        <Text style={npStyles.selectedLabel}>Local selecionado</Text>
                        {modoPonto === 'endereco' && (
                          <Text style={npStyles.selectedAddress} numberOfLines={2}>
                            {resultadoSelecionado.display_name.split(',').slice(0, 3).join(',')}
                          </Text>
                        )}
                        <Text style={npStyles.coordText}>
                          {localizacaoPin.latitude.toFixed(6)}, {localizacaoPin.longitude.toFixed(6)}
                        </Text>
                      </View>
                      {modoPonto === 'endereco' && (
                        <TouchableOpacity
                          onPress={() => { setResultadoSelecionado(null); setLocalizacaoPin(null); }}
                          style={npStyles.changeButton}>
                          <Text style={npStyles.changeButtonText}>Trocar</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Interactive map picker */}
                    <View style={npStyles.mapPickerWrap}>
                      <MapPointPicker
                        key={modoPonto === 'coordenadas' ? `${localizacaoPin.latitude},${localizacaoPin.longitude}` : 'endereco'}
                        initialLocation={localizacaoPin}
                        onLocationChange={loc => setLocalizacaoPin(loc)}
                      />
                    </View>

                    {/* Name input */}
                    <TextInput
                      style={[styles.input, { marginTop: spacing.md }]}
                      placeholder="Nome do ponto (ex: Terminal Central)"
                      placeholderTextColor={colors.text.hint}
                      value={nomePontoCustom}
                      onChangeText={setNomePontoCustom}
                    />

                    {/* Confirm button */}
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { backgroundColor: colors.success.main },
                        salvando && styles.buttonDisabled,
                      ]}
                      onPress={handleCriarNovoPonto}
                      disabled={salvando}>
                      {salvando ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Icon name={IconNames.add} size="sm" color="#fff" />
                          <Text style={styles.saveButtonText}>Adicionar à Rota</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* Empty hint */}
                {modoPonto === 'endereco' && resultadosBusca.length === 0 && !resultadoSelecionado && !buscandoEndereco && (
                  <Text style={npStyles.hint}>
                    Busque um endereço ou local para adicionar um novo ponto à rota
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (salvando || pontosRota.length === 0) && styles.buttonDisabled,
          ]}
          onPress={handleSalvarPontos}
          disabled={salvando || pontosRota.length === 0}>
          {salvando ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <>
              <Icon name={IconNames.checkCircle} size="md" color={colors.text.inverse} />
              <Text style={styles.saveButtonText}>
                Salvar Rota ({pontosRota.length} pontos)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.base,
    ...textStyles.body,
    color: colors.text.secondary,
  },
  header: {
    backgroundColor: colors.background.paper,
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  backButtonText: {
    ...textStyles.body,
    color: colors.primary.dark,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardHeaderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  cardSubtitle: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...textStyles.caption,
    color: colors.text.hint,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  pontoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  dragHandle: {
    padding: spacing.xs,
    marginRight: spacing.xs,
    opacity: 0.5,
  },
  pontoOrdem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pontoOrdemText: {
    ...textStyles.caption,
    color: colors.text.inverse,
    fontWeight: fontWeight.bold,
  },
  pontoInfo: {
    flex: 1,
  },
  pontoNome: {
    ...textStyles.body,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  pontoCoords: {
    ...textStyles.caption,
    color: colors.text.hint,
    marginTop: spacing.xxs,
  },
  pontoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pontoMoveActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  moveButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  removeButton: {
    padding: spacing.sm,
  },
  removeButtonStyled: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error.light,
  },
  pontosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pontoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.lighter,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    maxWidth: '48%',
  },
  pontoChipAdded: {
    backgroundColor: colors.success.light,
    opacity: 0.7,
  },
  pontoChipAdding: {
    opacity: 0.5,
  },
  pontoChipText: {
    ...textStyles.caption,
    color: colors.primary.main,
    fontWeight: fontWeight.medium,
  },
  pontoChipTextAdded: {
    color: colors.success.dark,
    textDecorationLine: 'line-through',
  },
  formContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  coordRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success.main,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  createButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },
  footer: {
    padding: spacing.base,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.dark,
    padding: spacing.base,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

const npStyles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary.dark,
    borderColor: colors.primary.dark,
  },
  modeText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#fff',
  },
  fieldLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  fieldError: {
    color: colors.error.main,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchButton: {
    backgroundColor: colors.primary.dark,
    height: 48,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.4,
  },
  resultsList: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  resultsTitle: {
    ...textStyles.caption,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.paper,
    gap: spacing.sm,
  },
  resultIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.lighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultMain: {
    ...textStyles.body,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  resultSub: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.primary.lighter,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectedInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  selectedLabel: {
    ...textStyles.caption,
    color: colors.primary.main,
    fontWeight: fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedAddress: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  coordText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginTop: spacing.xxs,
  },
  changeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary.dark,
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    ...textStyles.caption,
    color: colors.primary.dark,
    fontWeight: fontWeight.semiBold,
  },
  mapPickerWrap: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  hint: {
    ...textStyles.caption,
    color: colors.text.hint,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});

export default DefinirPontosRota;
