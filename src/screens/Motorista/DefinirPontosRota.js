import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TelaSegura from '../../components/TelaSegura';
import FolhaInferior from '../../components/FolhaInferior';
import ListaReordenavel from '../../components/ListaReordenavel';
import {motoristaService} from '../../services/motoristaService';
import {colors, spacing, textStyles, fontWeight} from '../../theme';
import Icon, {IconNames} from '../../components/Icon';
import {useToast} from '../../components/Toast';
import {StaticRouteMap} from '../../features/map/index';
import {unwrapItems} from '../../types';
import {confirmAction} from '../../utils/confirm';
import {topoDoCabecalho} from '../../utils/topoCabecalho';
import {alturaVisivel} from '../../utils/folhaInferior';
import {
  buscarEnderecos,
  nomeSugeridoEndereco,
  ESPERA_BUSCA_MS,
  MIN_LETRAS_ENDERECO,
} from '../../utils/enderecoNominatim';
import {
  filtrarPontos,
  textoContagem,
  textoContinuar,
  interpretarEntrada,
  nomeSugeridoCoordenadas,
  nomeDoPonto,
  detalheDoPonto,
  renumerar,
} from '../../utils/pontosRota';

const ALTURA_RODAPE = 76;
const ALTURA_CARTAO_TOPO = 58;

const Abas = ({itens, ativa, onMudar, pequena}) => (
  <View style={pequena ? styles.subAbas : styles.abas}>
    {itens.map(item => {
      const ativaAgora = item.id === ativa;
      return (
        <TouchableOpacity
          key={item.id}
          style={[
            pequena ? styles.subAba : styles.aba,
            {flex: item.peso || 1},
            ativaAgora && (pequena ? styles.subAbaAtiva : styles.abaAtiva),
          ]}
          onPress={() => onMudar(item.id)}
          accessibilityRole="tab"
          accessibilityState={{selected: ativaAgora}}>
          <Text style={[styles.abaTexto, ativaAgora && styles.abaTextoAtivo]} numberOfLines={1}>
            {item.texto}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const DefinirPontosRota = ({navigation, route}) => {
  const params = route?.params || {};
  const {rota: rotaParam, viagem, isNovaRota} = params;
  const rotaId = rotaParam?.id || viagem?.rota_id;
  const rotaNome = rotaParam?.nome || viagem?.rota_nome || 'Rota';

  const toast = useToast();
  const insets = useSafeAreaInsets();
  const topoCartao = topoDoCabecalho(insets.top) - 8;
  const reservaTopo = topoCartao + ALTURA_CARTAO_TOPO + 12;

  const [pontosRota, setPontosRota] = useState([]);
  const [pontosDisponiveis, setPontosDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const [alturaTela, setAlturaTela] = useState(600);
  const [snap, setSnap] = useState('meia');
  const [aba, setAba] = useState('pontos');
  const [subAba, setSubAba] = useState('buscar');

  const [termoBusca, setTermoBusca] = useState('');
  const [entrada, setEntrada] = useState('');
  const [resultadosEndereco, setResultadosEndereco] = useState([]);
  const [resultadoEscolhido, setResultadoEscolhido] = useState(null);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [pino, setPino] = useState(null);
  const [nomeNovo, setNomeNovo] = useState('');
  const [nomeEditado, setNomeEditado] = useState(false);
  const buscaAtual = useRef(0);

  // Carrega os pontos do município (e os da rota, ao editar), como a tela antiga.
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const todosOsPontos = await motoristaService.listarPontos().then(unwrapItems);
        const pontosUnicos = [];
        const idsVistos = new Set();
        for (const ponto of todosOsPontos || []) {
          const pontoId = String(ponto.id);
          if (!idsVistos.has(pontoId)) {
            idsVistos.add(pontoId);
            pontosUnicos.push(ponto);
          }
        }
        setPontosDisponiveis(pontosUnicos);

        if (rotaId && !isNovaRota) {
          const pontosData = await motoristaService.listarPontosRota(rotaId).then(unwrapItems);
          setPontosRota(pontosData || []);
        } else {
          // Rota nova ainda sem pontos: abre direto no cadastro.
          setAba('adicionar');
          setSnap('expandida');
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

  const pontosRotaIds = useMemo(() => new Set(pontosRota.map(p => String(p.id))), [pontosRota]);
  const pontosNoMapa = useMemo(() => renumerar(pontosRota), [pontosRota]);
  const busca = useMemo(() => filtrarPontos(pontosDisponiveis, termoBusca), [pontosDisponiveis, termoBusca]);

  const limparNovoPonto = () => {
    buscaAtual.current += 1;
    setEntrada('');
    setResultadosEndereco([]);
    setResultadoEscolhido(null);
    setBuscandoEndereco(false);
    setPino(null);
    setNomeNovo('');
    setNomeEditado(false);
  };

  const sugerirNome = nome => {
    if (!nomeEditado) setNomeNovo(nome);
  };

  const escolherResultado = resultado => {
    setResultadoEscolhido(resultado);
    setPino({latitude: parseFloat(resultado.lat), longitude: parseFloat(resultado.lon)});
    sugerirNome(nomeSugeridoEndereco(resultado));
  };

  const buscarEndereco = async texto => {
    const minha = ++buscaAtual.current;
    try {
      setBuscandoEndereco(true);
      const data = await buscarEnderecos(texto);
      if (minha !== buscaAtual.current) return;
      if (data && data.length > 0) {
        setResultadosEndereco(data);
        escolherResultado(data[0]);
      } else {
        setResultadosEndereco([]);
        toast.error('Nenhum resultado. Tente um endereço mais específico (Ex: Rua das Flores, Campina Grande).');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      if (minha === buscaAtual.current) toast.error('Não foi possível buscar o endereço agora. Tente novamente.');
    } finally {
      if (minha === buscaAtual.current) setBuscandoEndereco(false);
    }
  };

  // Campo único: par de coordenadas solta o pino direto; texto vira busca de endereço depois de uma pausa.
  const interpretacao = interpretarEntrada(entrada);
  useEffect(() => {
    if (aba !== 'adicionar' || subAba !== 'endereco') return undefined;
    if (interpretacao.tipo === 'coordenadas') {
      buscaAtual.current += 1;
      setResultadosEndereco([]);
      setResultadoEscolhido(null);
      setBuscandoEndereco(false);
      const local = {latitude: interpretacao.latitude, longitude: interpretacao.longitude};
      setPino(local);
      sugerirNome(nomeSugeridoCoordenadas(local));
      return undefined;
    }
    setPino(null);
    setResultadosEndereco([]);
    setResultadoEscolhido(null);
    if (interpretacao.tipo !== 'endereco' || interpretacao.texto.length < MIN_LETRAS_ENDERECO) {
      return undefined;
    }
    const espera = setTimeout(() => buscarEndereco(interpretacao.texto), ESPERA_BUSCA_MS);
    return () => clearTimeout(espera);
  }, [entrada, aba, subAba]);

  const soltarPinoNoMapa = local => {
    if (aba !== 'adicionar' || subAba !== 'mapa') return;
    setPino(local);
    sugerirNome(nomeSugeridoCoordenadas(local));
  };

  const mudarAba = nova => {
    if (nova === aba) return;
    limparNovoPonto();
    setAba(nova);
    setSnap(nova === 'pontos' ? 'meia' : subAba === 'mapa' ? 'meia' : 'expandida');
  };

  const mudarSubAba = nova => {
    if (nova === subAba) return;
    limparNovoPonto();
    setSubAba(nova);
    setSnap(nova === 'mapa' ? 'meia' : 'expandida');
  };

  const adicionarPontoExistente = ponto => {
    if (pontosRotaIds.has(String(ponto.id))) {
      toast.warning('Este ponto já está na rota.');
      return;
    }
    setPontosRota(prev => [...prev, {...ponto, ordem: prev.length + 1}]);
    toast.success(`${nomeDoPonto(ponto)} adicionado!`);
  };

  const criarNovoPonto = async () => {
    const nome = nomeNovo.trim();
    if (!nome) {
      toast.error('Informe o nome do ponto.');
      return;
    }
    if (!pino) {
      toast.error('Selecione uma localização no mapa.');
      return;
    }
    const {latitude: lat, longitude: lon} = pino;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error('Coordenadas fora do intervalo válido.');
      return;
    }
    try {
      setSalvando(true);
      const novoPonto = await motoristaService.criarPonto({
        apelido: nome,
        latitude: lat,
        longitude: lon,
      });
      setPontosRota(prev => [
        ...prev,
        {id: novoPonto.id, nome, apelido: nome, latitude: lat, longitude: lon, ordem: prev.length + 1},
      ]);
      limparNovoPonto();
      setAba('pontos');
      setSnap('meia');
      toast.success('Ponto criado e adicionado à rota!');
    } catch (error) {
      toast.error(error?.message || 'Erro ao criar ponto.');
    } finally {
      setSalvando(false);
    }
  };

  const removerPonto = pontoId => {
    confirmAction({
      title: 'Remover este ponto da rota?',
      message: 'O ponto continua cadastrado no município.',
      confirmText: 'Remover',
      destructive: true,
      onConfirm: () => {
        setPontosRota(prev => prev.filter(p => p.id !== pontoId));
        toast.info('Ponto removido.');
      },
    });
  };

  const salvarPontos = async () => {
    if (pontosRota.length === 0) {
      toast.error('Adicione pelo menos um ponto.');
      return;
    }
    try {
      if (isNovaRota) {
        navigation.navigate('DefinirHorariosRota', {
          rota: {nome: rotaNome, pontos: renumerar(pontosRota)},
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
          pontos: pontosRota.map((p, index) => ({ponto_id: p.id, ordem: index + 1})),
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
      <TelaSegura style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.dark} />
          <Text style={styles.loadingText}>Carregando pontos...</Text>
        </View>
      </TelaSegura>
    );
  }

  const numeroNovo = pontosRota.length + 1;
  const rodape =
    aba === 'pontos' || snap === 'recolhida' ? (
      <TouchableOpacity
        style={[styles.botaoPrimario, (salvando || pontosRota.length === 0) && styles.botaoDesativado]}
        onPress={salvarPontos}
        disabled={salvando || pontosRota.length === 0}
        accessibilityRole="button">
        {salvando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botaoPrimarioTexto}>{textoContinuar(pontosRota.length)}</Text>
        )}
      </TouchableOpacity>
    ) : null;

  const campoComLimpar = (valor, aoMudar, placeholder, rotulo) => (
    <View style={styles.campoBusca}>
      <Icon name={IconNames.search} size="md" color={colors.primary.main} />
      <TextInput
        style={styles.campoBuscaTexto}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={rotulo}
      />
      {valor !== '' ? (
        <TouchableOpacity
          style={styles.limpar}
          onPress={() => aoMudar('')}
          accessibilityRole="button"
          accessibilityLabel="Limpar">
          <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const formularioNovoPonto = (status, textoApoio) => (
    <>
      {status}
      <Text style={styles.rotuloCampo}>Nome do ponto</Text>
      <TextInput
        style={styles.campoNome}
        value={nomeNovo}
        onChangeText={texto => {
          setNomeNovo(texto);
          setNomeEditado(true);
        }}
        placeholder="Ex: Terminal Central"
        placeholderTextColor={colors.text.disabled}
        accessibilityLabel="Nome do ponto"
      />
      <TouchableOpacity
        style={[styles.botaoPrimario, (!pino || salvando) && styles.botaoDesativado]}
        onPress={criarNovoPonto}
        disabled={!pino || salvando}
        accessibilityRole="button">
        {salvando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Icon name={IconNames.add} size="md" color="#FFFFFF" />
            <Text style={styles.botaoPrimarioTexto}> Adicionar como ponto {numeroNovo}</Text>
          </>
        )}
      </TouchableOpacity>
      {textoApoio ? <Text style={styles.apoio}>{textoApoio}</Text> : null}
    </>
  );

  const linhaStatus = (texto, ok) => (
    <View style={styles.status}>
      {ok ? <Icon name={IconNames.check} size="sm" color={colors.success.dark} /> : null}
      <Text style={[styles.statusTexto, ok && {color: colors.success.dark}]} numberOfLines={2}>
        {texto}
      </Text>
    </View>
  );

  const conteudoBuscar = (
    <>
      {campoComLimpar(termoBusca, setTermoBusca, 'Buscar ponto pelo nome', 'Buscar ponto pelo nome')}
      {termoBusca.trim() === '' ? (
        <Text style={styles.contagem}>Digite para buscar entre os {pontosDisponiveis.length} pontos do município.</Text>
      ) : (
        <>
          <Text style={styles.contagem}>{textoContagem(busca.total, pontosDisponiveis.length)}</Text>
          {busca.itens.map(ponto => {
            const naRota = pontosRotaIds.has(String(ponto.id));
            return (
              <View key={String(ponto.id)} style={styles.resultado}>
                <Icon name={IconNames.location} size="md" color={colors.text.secondary} />
                <View style={styles.resultadoTextos}>
                  <Text style={styles.nome} numberOfLines={1}>
                    {nomeDoPonto(ponto)}
                  </Text>
                  <Text style={styles.detalhe} numberOfLines={1}>
                    {detalheDoPonto(ponto)}
                  </Text>
                </View>
                {naRota ? (
                  <View style={styles.selo}>
                    <Text style={styles.seloTexto}>Na rota</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.botaoMais}
                    onPress={() => adicionarPontoExistente(ponto)}
                    accessibilityRole="button"
                    accessibilityLabel={`Adicionar ${nomeDoPonto(ponto)}`}>
                    <Icon name={IconNames.add} size="md" color={colors.primary.main} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </>
      )}
    </>
  );

  const conteudoEndereco = () => {
    let status = null;
    if (interpretacao.tipo === 'coordenadas') {
      status = linhaStatus('Coordenadas reconhecidas', true);
    } else if (buscandoEndereco) {
      status = linhaStatus('Buscando endereço...', false);
    } else if (resultadoEscolhido) {
      status = linhaStatus(resultadoEscolhido.display_name, true);
    } else if (interpretacao.tipo === 'endereco' && interpretacao.texto.length < MIN_LETRAS_ENDERECO) {
      status = linhaStatus('Continue digitando o endereço.', false);
    }
    const apoio =
      interpretacao.tipo === 'coordenadas'
        ? `Latitude ${String(interpretacao.latitude).replace('.', ',')} · Longitude ${String(
            interpretacao.longitude,
          ).replace('.', ',')}`
        : 'Aceita também "-7.2290, -35.8808"';
    const outros = [];
    for (const r of resultadosEndereco) {
      if (r !== resultadoEscolhido) outros.push(r);
    }
    return (
      <>
        {campoComLimpar(entrada, setEntrada, 'Endereço ou latitude, longitude', 'Endereço ou coordenadas')}
        {formularioNovoPonto(status, apoio)}
        {outros.length > 0 ? <Text style={styles.contagem}>Outros resultados</Text> : null}
        {outros.slice(0, 3).map(r => (
          <TouchableOpacity
            key={String(r.place_id)}
            style={styles.resultado}
            onPress={() => escolherResultado(r)}
            accessibilityRole="button">
            <Icon name={IconNames.location} size="md" color={colors.text.secondary} />
            <Text style={[styles.detalhe, styles.resultadoTextos]} numberOfLines={2}>
              {r.display_name}
            </Text>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const conteudoMapa = formularioNovoPonto(
    linhaStatus(
      pino
        ? `Pino em ${pino.latitude.toFixed(5)}, ${pino.longitude.toFixed(5)}`
        : 'Segure em qualquer lugar do mapa para soltar um pino.',
      false,
    ),
    null,
  );

  return (
    <TelaSegura style={styles.container}>
      <View style={styles.palco} onLayout={e => setAlturaTela(e.nativeEvent.layout.height)}>
        <View style={StyleSheet.absoluteFill}>
          <StaticRouteMap
            pontosRota={pontosNoMapa}
            altura="100%"
            numerar
            pino={pino}
            aoTocarLongo={soltarPinoNoMapa}
            margemTopo={reservaTopo}
            margemBase={alturaVisivel(snap, alturaTela, reservaTopo, ALTURA_RODAPE)}
          />
        </View>

        <View style={[styles.cartaoTopo, {top: topoCartao}]} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar">
            <Icon name={IconNames.back} size="md" color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.cartaoTextos}>
            <Text style={styles.cartaoTitulo} numberOfLines={1} accessibilityRole="header">
              Pontos da Rota
            </Text>
            <Text style={styles.cartaoSub} numberOfLines={1}>
              {rotaNome}
            </Text>
          </View>
        </View>

        {aba === 'adicionar' && subAba === 'mapa' && !pino ? (
          <View style={[styles.dica, {top: topoCartao + ALTURA_CARTAO_TOPO + 8}]} pointerEvents="none">
            <Text style={styles.dicaTexto}>Toque longo para soltar um pino</Text>
          </View>
        ) : null}

        <FolhaInferior
          alturaTela={alturaTela}
          reservaTopo={reservaTopo}
          alturaRodape={ALTURA_RODAPE}
          snap={snap}
          onMudarSnap={setSnap}
          rodape={rodape}>
          <Abas
            itens={[
              {id: 'pontos', texto: `Pontos da rota (${pontosRota.length})`},
              {id: 'adicionar', texto: 'Adicionar ponto'},
            ]}
            ativa={aba}
            onMudar={mudarAba}
          />
          {aba === 'adicionar' ? (
            <Abas
              pequena
              itens={[
                {id: 'buscar', texto: 'Buscar'},
                {id: 'endereco', texto: 'Endereço ou coord.', peso: 1.8},
                {id: 'mapa', texto: 'Mapa'},
              ]}
              ativa={subAba}
              onMudar={mudarSubAba}
            />
          ) : null}
          <ScrollView
            style={styles.rolagem}
            contentContainerStyle={[
              styles.rolagemConteudo,
              {paddingBottom: rodape ? ALTURA_RODAPE + spacing.base : spacing.xl},
            ]}
            scrollEnabled={!arrastando}
            keyboardShouldPersistTaps="handled">
            {aba === 'pontos' ? (
              pontosRota.length === 0 ? (
                <View style={styles.vazio}>
                  <Text style={styles.nome}>Nenhum ponto adicionado</Text>
                  <Text style={styles.detalhe}>Use a aba Adicionar ponto para montar a rota.</Text>
                </View>
              ) : (
                <ListaReordenavel
                  itens={pontosRota}
                  chaveDe={ponto => String(ponto.id)}
                  onMudar={setPontosRota}
                  onArrastando={setArrastando}
                  renderItem={ponto => (
                    <View style={styles.linhaPonto}>
                      <View style={styles.numero}>
                        <Text style={styles.numeroTexto}>{pontosRota.indexOf(ponto) + 1}</Text>
                      </View>
                      <View style={styles.resultadoTextos}>
                        <Text style={styles.nome} numberOfLines={1}>
                          {nomeDoPonto(ponto)}
                        </Text>
                        <Text style={styles.detalhe} numberOfLines={1}>
                          {detalheDoPonto(ponto)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.lixeira}
                        onPress={() => removerPonto(ponto.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remover ${nomeDoPonto(ponto)}`}>
                        <Icon name={IconNames.delete} size="md" color={colors.error.main} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )
            ) : null}
            {aba === 'adicionar' && subAba === 'buscar' ? conteudoBuscar : null}
            {aba === 'adicionar' && subAba === 'endereco' ? conteudoEndereco() : null}
            {aba === 'adicionar' && subAba === 'mapa' ? conteudoMapa : null}
          </ScrollView>
        </FolhaInferior>
      </View>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  // clip (web) impede que focar um campo fora da área visível role o palco inteiro.
  palco: {flex: 1, overflow: Platform.OS === 'web' ? 'clip' : 'hidden'},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md},
  loadingText: {...textStyles.body, color: colors.text.secondary},
  cartaoTopo: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    height: ALTURA_CARTAO_TOPO,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 18,
    paddingHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
  },
  voltar: {width: 46, height: 46, alignItems: 'center', justifyContent: 'center'},
  cartaoTextos: {flex: 1, marginLeft: spacing.xs},
  cartaoTitulo: {...textStyles.h4, color: colors.text.primary},
  cartaoSub: {...textStyles.caption, color: colors.text.secondary},
  dica: {
    position: 'absolute',
    left: spacing.base,
    backgroundColor: colors.text.primary,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    zIndex: 20,
  },
  dicaTexto: {...textStyles.caption, color: '#FFFFFF'},
  abas: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
  },
  aba: {flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11},
  abaAtiva: {backgroundColor: colors.background.paper},
  subAbas: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginTop: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  subAba: {flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  subAbaAtiva: {borderBottomWidth: 2, borderBottomColor: colors.primary.main},
  abaTexto: {...textStyles.bodySmall, fontWeight: fontWeight.semiBold, color: colors.text.secondary},
  abaTextoAtivo: {color: colors.primary.main},
  rolagem: {flex: 1},
  rolagemConteudo: {paddingHorizontal: spacing.base, paddingTop: spacing.md},
  vazio: {paddingVertical: spacing.xl, gap: spacing.xs},
  linhaPonto: {flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingLeft: spacing.sm},
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  numeroTexto: {...textStyles.bodySmall, fontWeight: fontWeight.bold, color: '#FFFFFF'},
  lixeira: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  nome: {...textStyles.body, fontWeight: fontWeight.semiBold, color: colors.text.primary},
  detalhe: {...textStyles.caption, color: colors.text.secondary},
  campoBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.primary.main,
    borderRadius: 14,
    paddingLeft: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  campoBuscaTexto: {
    flex: 1,
    ...textStyles.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
    outlineStyle: 'none',
  },
  limpar: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  contagem: {...textStyles.caption, color: colors.text.secondary, marginVertical: spacing.sm},
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  resultadoTextos: {flex: 1},
  botaoMais: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selo: {
    paddingHorizontal: spacing.sm,
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: colors.success.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seloTexto: {...textStyles.caption, fontWeight: fontWeight.semiBold, color: colors.success.dark},
  status: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginVertical: spacing.sm},
  statusTexto: {...textStyles.caption, color: colors.text.secondary, flex: 1},
  rotuloCampo: {...textStyles.caption, color: colors.text.secondary, marginBottom: spacing.xs},
  campoNome: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.md,
    outlineStyle: 'none',
  },
  apoio: {...textStyles.caption, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm},
  botaoPrimario: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPrimarioTexto: {...textStyles.button, fontWeight: fontWeight.bold, color: '#FFFFFF'},
  botaoDesativado: {opacity: 0.5},
});

export default DefinirPontosRota;
