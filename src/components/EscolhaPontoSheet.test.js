import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';

let mapaProps = null;

// O jest do projeto não transforma o react-native: os componentes viram elementos simples que
// guardam as props, e o teste exercita a lógica da tela (toques, troca, confirmação).
jest.mock('react-native', () => {
  const React = require('react');
  const simples = nome => ({children, ...props}) => React.createElement(nome, props, children);
  return {
    View: simples('View'),
    Text: simples('Text'),
    TextInput: simples('TextInput'),
    ActivityIndicator: simples('ActivityIndicator'),
    StyleSheet: {create: x => x, hairlineWidth: 1, absoluteFillObject: {}, flatten: x => x},
    Animated: {
      View: simples('AnimatedView'),
      Value: class {
        interpolate() {
          return '0deg';
        }
      },
      timing: () => ({start: () => {}}),
    },
    Platform: {OS: 'ios', select: o => o.ios},
    useWindowDimensions: () => ({height: 800, width: 400}),
  };
});
jest.mock('../theme', () => {
  const profundo = new Proxy(function () {}, {
    get: (_, chave) => (chave === Symbol.toPrimitive ? () => '#000' : profundo),
  });
  return {borderRadius: profundo, colors: profundo, shadows: profundo, spacing: profundo, textStyles: profundo};
});
jest.mock('./Tappable', () => {
  const React = require('react');
  return ({children, ...props}) => React.createElement('Tappable', props, children);
});
jest.mock('./Button', () => {
  const React = require('react');
  return ({title, ...props}) => React.createElement('Button', {...props, accessibilityLabel: title}, title);
});
jest.mock('./Icon', () => ({
  __esModule: true,
  default: () => null,
  IconNames: {close: 'close', search: 'search', myLocation: 'my-location', warning: 'warning'},
}));
jest.mock('../features/map/index', () => ({
  MapaEscolhaPontos: props => {
    require('./EscolhaPontoSheet.test').capturar(props);
    return null;
  },
}));
jest.mock('./ModalApp', () => ({children}) => children);
jest.mock('react-native-safe-area-context', () => ({SafeAreaView: ({children}) => children}));
jest.mock('../features/map/hooks/useLocationPermission', () => ({
  requestLocationPermission: () => Promise.resolve(true),
}));

export const capturar = props => {
  mapaProps = props;
};

import EscolhaPontoSheet from './EscolhaPontoSheet';

const pontos = [
  {id: 'p1', apelido: 'Ponto do mercadinho', endereco: 'Rua das Flores, 120 - Bairro Novo', latitude: -7.23, longitude: -35.88, ordem: 1},
  {id: 'p2', apelido: 'Praça do Bairro Novo', endereco: 'Avenida Brasil, 45', latitude: -7.24, longitude: -35.87, ordem: 2},
  {id: 'p3', apelido: 'Posto da BR', endereco: null, latitude: -7.25, longitude: -35.86, ordem: 3},
];

const montar = (extra = {}) => {
  const aoConfirmar = jest.fn();
  let arvore;
  act(() => {
    arvore = TestRenderer.create(
      <EscolhaPontoSheet
        visible
        pontos={pontos}
        inicial={{embarqueId: null, desembarqueId: null}}
        erro=""
        salvando={false}
        onClose={() => {}}
        onConfirmar={aoConfirmar}
        {...extra}
      />,
    );
  });
  return {arvore, aoConfirmar};
};

const achar = (arvore, rotulo) => {
  const lista = arvore.root.findAll(n => n.props.accessibilityLabel === rotulo && typeof n.props.onPress === 'function');
  if (lista.length === 0) throw new Error(`sem botão "${rotulo}"`);
  return lista[0];
};
const textos = arvore =>
  arvore.root
    .findAll(n => typeof n.props.children === 'string')
    .map(n => n.props.children);
const tocarNoMapa = id => act(() => mapaProps.aoTocarPonto(id));

test('abre sem pontos escolhidos, com Confirmar e Inverter desabilitados', () => {
  const {arvore} = montar();
  expect(textos(arvore)).toContain('Seus pontos');
  expect(textos(arvore)).toContain('Toque em um ponto do mapa');
  expect(achar(arvore, 'Inverter embarque e desembarque').props.disabled).toBe(true);
  expect(mapaProps.embarqueId).toBeNull();
  expect(mapaProps.desembarqueId).toBeNull();
});

test('tocar no mapa preenche embarque, depois desembarque, e libera o Confirmar', () => {
  const {arvore, aoConfirmar} = montar();
  tocarNoMapa('p1');
  tocarNoMapa('p2');
  expect(mapaProps.embarqueId).toBe('p1');
  expect(mapaProps.desembarqueId).toBe('p2');
  expect(textos(arvore)).toContain('Ponto do mercadinho');
  expect(textos(arvore)).toContain('Rua das Flores, 120 - Bairro Novo');
  expect(textos(arvore)).toContain('Praça do Bairro Novo');
  act(() => achar(arvore, 'Confirmar presença').props.onPress());
  expect(aoConfirmar).toHaveBeenCalledWith({embarqueId: 'p1', desembarqueId: 'p2'});
});

test('Inverter troca embarque e desembarque na tela e no mapa', () => {
  const {arvore, aoConfirmar} = montar();
  tocarNoMapa('p1');
  tocarNoMapa('p2');
  expect(achar(arvore, 'Inverter embarque e desembarque').props.disabled).toBeFalsy();

  act(() => achar(arvore, 'Inverter embarque e desembarque').props.onPress());

  expect(mapaProps.embarqueId).toBe('p2');
  expect(mapaProps.desembarqueId).toBe('p1');
  act(() => achar(arvore, 'Confirmar presença').props.onPress());
  expect(aoConfirmar).toHaveBeenCalledWith({embarqueId: 'p2', desembarqueId: 'p1'});
});

test('Inverter funciona com um ponto só', () => {
  const {arvore} = montar({inicial: {embarqueId: null, desembarqueId: 'p3'}});
  act(() => achar(arvore, 'Inverter embarque e desembarque').props.onPress());
  expect(mapaProps.embarqueId).toBe('p3');
  expect(mapaProps.desembarqueId).toBeNull();
});

test('o Confirmar fica desabilitado enquanto falta um ponto', () => {
  const {arvore} = montar();
  tocarNoMapa('p1');
  expect(achar(arvore, 'Confirmar presença').props.disabled).toBe(true);
});

test('na ida o desembarque já vem preenchido e o primeiro toque vai para o embarque', () => {
  const {arvore} = montar({inicial: {embarqueId: null, desembarqueId: 'p3'}});
  tocarNoMapa('p1');
  expect(mapaProps.embarqueId).toBe('p1');
  expect(mapaProps.desembarqueId).toBe('p3');
  expect(achar(arvore, 'Confirmar presença').props.disabled).toBeFalsy();
});

test('a busca acha o ponto pelo nome e preenche a linha ativa', () => {
  const {arvore} = montar();
  const campo = arvore.root.findAll(n => n.props.accessibilityLabel === 'Buscar ponto pelo nome' && n.props.onChangeText)[0];
  act(() => campo.props.onChangeText('praca'));
  act(() => achar(arvore, 'Praça do Bairro Novo').props.onPress());
  expect(mapaProps.embarqueId).toBe('p2');
});

test('mostra o erro recebido', () => {
  const {arvore} = montar({erro: 'Escolha um ponto de descida diferente do embarque.'});
  expect(textos(arvore)).toContain('Escolha um ponto de descida diferente do embarque.');
});
