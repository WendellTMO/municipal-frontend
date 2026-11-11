import {
  aceitaPresenca,
  aposTocarNoPonto,
  corpoConfirmacao,
  erroDeCampoPonto,
  escolhaCompleta,
  filtrarPontos,
  inverterEscolha,
  linhaAtivaInicial,
  mensagemDeErroPonto,
  nomeDoPonto,
  precisaEscolher,
  sentidoDe,
} from './presenca';

test('só viagem agendada ou em andamento aceita presença', () => {
  expect(aceitaPresenca('AGENDADA')).toBe(true);
  expect(aceitaPresenca('EM_ANDAMENTO')).toBe(true);
  expect(aceitaPresenca('FINALIZADA')).toBe(false);
  expect(aceitaPresenca('CANCELADA')).toBe(false);
});

test('pede a escolha só quando o backend avisa', () => {
  expect(precisaEscolher({precisa_escolher_ponto: true})).toBe(true);
  expect(precisaEscolher({precisa_escolher_ponto: false})).toBe(false);
  expect(precisaEscolher({})).toBe(false);
  expect(precisaEscolher(null)).toBe(false);
});

test('o sentido vem de tipo ou sentido e assume IDA', () => {
  expect(sentidoDe({tipo: 'VOLTA'})).toBe('VOLTA');
  expect(sentidoDe({sentido: 'CIRCULAR'})).toBe('CIRCULAR');
  expect(sentidoDe({})).toBe('IDA');
});

test('o corpo da confirmação leva os dois pontos e pede para lembrar', () => {
  expect(corpoConfirmacao({embarqueId: 'e1', desembarqueId: 'd1'})).toEqual({
    ponto_embarque_id: 'e1',
    ponto_desembarque_id: 'd1',
    lembrar_escolha: true,
  });
});

test('a escolha só está completa com dois pontos diferentes', () => {
  expect(escolhaCompleta({embarqueId: 'e1', desembarqueId: 'd1'})).toBe(true);
  expect(escolhaCompleta({embarqueId: 'e1', desembarqueId: null})).toBe(false);
  expect(escolhaCompleta({embarqueId: null, desembarqueId: 'd1'})).toBe(false);
  expect(escolhaCompleta({embarqueId: 'x', desembarqueId: 'x'})).toBe(false);
});

test('inverter troca embarque e desembarque', () => {
  expect(inverterEscolha({embarqueId: 'casa', desembarqueId: 'escola'})).toEqual({
    embarqueId: 'escola',
    desembarqueId: 'casa',
  });
  expect(inverterEscolha({embarqueId: 'casa', desembarqueId: null})).toEqual({
    embarqueId: null,
    desembarqueId: 'casa',
  });
});

test('a linha ativa começa na que está vazia, embarque primeiro', () => {
  expect(linhaAtivaInicial({embarqueId: null, desembarqueId: null})).toBe('emb');
  expect(linhaAtivaInicial({embarqueId: null, desembarqueId: 'escola'})).toBe('emb');
  expect(linhaAtivaInicial({embarqueId: 'escola', desembarqueId: null})).toBe('des');
  expect(linhaAtivaInicial({embarqueId: 'a', desembarqueId: 'b'})).toBe('emb');
});

test('tocar no mapa preenche a linha ativa e passa para a outra quando ela está vazia', () => {
  let r = aposTocarNoPonto({embarqueId: null, desembarqueId: null}, 'emb', 'p1');
  expect(r).toEqual({escolha: {embarqueId: 'p1', desembarqueId: null}, ativo: 'des'});
  r = aposTocarNoPonto(r.escolha, r.ativo, 'p2');
  expect(r).toEqual({escolha: {embarqueId: 'p1', desembarqueId: 'p2'}, ativo: 'des'});
  // Com as duas preenchidas, o toque troca só a linha ativa.
  r = aposTocarNoPonto(r.escolha, 'des', 'p3');
  expect(r.escolha).toEqual({embarqueId: 'p1', desembarqueId: 'p3'});
});

test('tocar no ponto que já está na outra linha não faz nada', () => {
  const escolha = {embarqueId: 'p1', desembarqueId: null};
  expect(aposTocarNoPonto(escolha, 'des', 'p1')).toEqual({escolha, ativo: 'des'});
});

test('400 com details.field vira mensagem do campo', () => {
  const erro = {statusCode: 400, details: {field: 'ponto_embarque_id'}};
  expect(erroDeCampoPonto(erro)).toBe(true);
  expect(mensagemDeErroPonto(erro, 'x')).toBe('Escolha um ponto de embarque da rota.');
  expect(mensagemDeErroPonto({details: {field: 'ponto_desembarque_id'}}, 'x')).toBe(
    'Escolha um ponto de descida diferente do embarque.',
  );
  expect(erroDeCampoPonto({details: {field: 'outro'}})).toBe(false);
  expect(mensagemDeErroPonto(new Error('falhou'), 'padrão')).toBe('padrão');
});

test('acha o nome do ponto e omite quando a API não dá', () => {
  const pontos = [{id: 'p1', apelido: 'Praça'}];
  expect(nomeDoPonto(pontos, 'p1')).toBe('Praça');
  expect(nomeDoPonto(pontos, 'zz')).toBe('');
  expect(nomeDoPonto(null, 'p1')).toBe('');
});

test('a busca ordena em ordem alfabética e filtra sem acento nem maiúsculas', () => {
  const pontos = [
    {id: '1', apelido: 'Zé'},
    {id: '2', apelido: 'Água Branca'},
    {id: '3', apelido: 'Mercado'},
    {id: '4', apelido: 'Avenida'},
  ];
  expect(filtrarPontos(pontos, '').itens.map(p => p.id)).toEqual(['2', '4', '3', '1']);
  expect(filtrarPontos(pontos, 'agua').itens.map(p => p.id)).toEqual(['2']);
  expect(filtrarPontos(pontos, 'zzz')).toEqual({itens: [], total: 0});
});

test('a busca mostra no máximo o limite e informa o total', () => {
  const pontos = [];
  for (let i = 0; i < 60; i++) pontos.push({id: String(i), apelido: `Ponto ${String(i).padStart(2, '0')}`});
  const r = filtrarPontos(pontos, '', 50);
  expect(r.itens.length).toBe(50);
  expect(r.total).toBe(60);
});

test('a busca acha também pelo endereço', () => {
  const pontos = [
    {id: '1', apelido: 'Ponto perto do mercadinho', endereco: 'Rua das Flores, 120 - Bairro Novo'},
    {id: '2', apelido: 'Praça', endereco: null},
  ];
  expect(filtrarPontos(pontos, 'flores').itens.map(p => p.id)).toEqual(['1']);
  expect(filtrarPontos(pontos, 'bairro novo').total).toBe(1);
  expect(filtrarPontos(pontos, 'praca').itens.map(p => p.id)).toEqual(['2']);
});
