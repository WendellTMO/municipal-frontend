import {
  aceitaPresenca,
  erroDeCampoPonto,
  escolhaCompleta,
  inverterEscolha,
  filtrarPontos,
  instituicaoDoSentido,
  instituicaoDiferente,
  instituicoesDaRota,
  embarqueForaDaInstituicao,
  linhaDosPontos,
  montarPontosPadrao,
  mensagemDeErroPonto,
  montarCorpoConfirmacao,
  nomeDoPonto,
  precisaEscolher,
  sentidoDe,
  separarInstituicoes,
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

test('o corpo da confirmação muda com o sentido', () => {
  const escolha = {embarqueId: 'e1', desembarqueId: 'd1'};
  expect(montarCorpoConfirmacao('IDA', escolha, false)).toEqual({ponto_embarque_id: 'e1'});
  // Na VOLTA o embarque só vai no corpo quando o aluno escolheu um ponto (a folha manda null senão).
  expect(montarCorpoConfirmacao('VOLTA', {embarqueId: null, desembarqueId: 'd1'}, false)).toEqual({
    ponto_desembarque_id: 'd1',
  });
  expect(montarCorpoConfirmacao('VOLTA', escolha, false)).toEqual({
    ponto_embarque_id: 'e1',
    ponto_desembarque_id: 'd1',
  });
  expect(montarCorpoConfirmacao('CIRCULAR', escolha, true)).toEqual({
    ponto_embarque_id: 'e1',
    ponto_desembarque_id: 'd1',
    lembrar_escolha: true,
  });
});

test('a escolha só está completa com os pontos que o sentido exige', () => {
  expect(escolhaCompleta('IDA', {embarqueId: 'e1', desembarqueId: null})).toBe(true);
  expect(escolhaCompleta('IDA', {embarqueId: null, desembarqueId: 'd1'})).toBe(false);
  expect(escolhaCompleta('VOLTA', {embarqueId: null, desembarqueId: 'd1'})).toBe(true);
  expect(escolhaCompleta('CIRCULAR', {embarqueId: 'e1', desembarqueId: null})).toBe(false);
  expect(escolhaCompleta('CIRCULAR', {embarqueId: 'e1', desembarqueId: 'd1'})).toBe(true);
});

test('400 com details.field vira mensagem do campo', () => {
  const erro = {statusCode: 400, details: {field: 'ponto_embarque_id'}};
  expect(erroDeCampoPonto(erro)).toBe(true);
  expect(mensagemDeErroPonto(erro, 'x')).toBe('Escolha um ponto de embarque da rota.');
  expect(mensagemDeErroPonto({details: {field: 'ponto_desembarque_id'}}, 'x')).toBe(
    'Escolha um ponto de descida da rota.',
  );
  expect(erroDeCampoPonto({statusCode: 500})).toBe(false);
  expect(mensagemDeErroPonto({statusCode: 500}, 'falhou')).toBe('falhou');
});

test('a linha do card segue o sentido', () => {
  expect(linhaDosPontos('IDA', 'Praça', 'UFCG')).toBe('Embarca em Praça');
  expect(linhaDosPontos('VOLTA', 'UFCG', 'Praça')).toBe('Desce em Praça');
  expect(linhaDosPontos('CIRCULAR', 'A', 'B')).toBe('Embarca em A · Desce em B');
  expect(linhaDosPontos('IDA', '', 'UFCG')).toBe('');
});

test('acha o nome da instituição e dos pontos, e omite quando a API não dá', () => {
  const pontos = [
    {id: 'p1', apelido: 'Praça', instituicao: null},
    {id: 'p2', apelido: 'Campus', instituicao: {nome: 'UFCG'}},
  ];
  expect(instituicaoDoSentido('IDA', {ponto_destino_id: 'p2'}, pontos)).toEqual({pontoId: 'p2', id: null, nome: 'UFCG'});
  expect(instituicaoDoSentido('VOLTA', {ponto_embarque_id: 'p2'}, pontos).nome).toBe('UFCG');
  expect(instituicaoDoSentido('IDA', {ponto_destino_id: 'p1'}, pontos).nome).toBe('');
  expect(instituicaoDoSentido('CIRCULAR', {}, pontos).pontoId).toBeNull();
  expect(nomeDoPonto(pontos, 'p1')).toBe('Praça');
  expect(nomeDoPonto(pontos, 'zz')).toBe('');
  expect(nomeDoPonto(null, 'p1')).toBe('');
});

test('instituicoesDaRota lista cada instituição uma vez, com o ponto dela', () => {
  const pontos = [
    {id: 'p1', apelido: 'Praça', instituicao: null},
    {id: 'p2', apelido: 'Campus', instituicao: {id: 'i1', nome: 'UFCG'}},
    {id: 'p3', apelido: 'Portão', instituicao: {id: 'i1', nome: 'UFCG'}},
    {id: 'p4', apelido: 'Escola', instituicao: {id: 'i2', nome: 'Escola Municipal'}},
  ];
  expect(instituicoesDaRota(pontos)).toEqual([
    {id: 'i1', nome: 'UFCG', pontoId: 'p2'},
    {id: 'i2', nome: 'Escola Municipal', pontoId: 'p4'},
  ]);
  expect(instituicoesDaRota(null)).toEqual([]);
});

test('instituicaoDiferente só vale com as duas conhecidas e distintas', () => {
  expect(instituicaoDiferente('i2', 'i1')).toBe(true);
  expect(instituicaoDiferente('i1', 'i1')).toBe(false);
  expect(instituicaoDiferente('i1', null)).toBe(false);
  expect(instituicaoDiferente(null, 'i1')).toBe(false);
});

test('o corpo da confirmação leva a instituição só fora da circular', () => {
  expect(montarCorpoConfirmacao('IDA', {embarqueId: 'p1'}, false, 'i2').instituicao_id).toBe('i2');
  expect(montarCorpoConfirmacao('VOLTA', {desembarqueId: 'p1'}, false, 'i2').instituicao_id).toBe('i2');
  expect(montarCorpoConfirmacao('CIRCULAR', {embarqueId: 'a', desembarqueId: 'b'}, false, 'i2').instituicao_id).toBeUndefined();
  expect(montarCorpoConfirmacao('IDA', {embarqueId: 'p1'}, false).instituicao_id).toBeUndefined();
});

test('separa as instituições do aluno das outras da rota e filtra as outras pelo texto', () => {
  const rota = [
    {id: 'a', nome: 'UFCG', pontoId: '1'},
    {id: 'b', nome: 'Faculdade São José', pontoId: '2'},
    {id: 'c', nome: 'Escola Técnica', pontoId: '3'},
  ];
  const tudo = separarInstituicoes(rota, ['c', 'x', 'a'], '');
  expect(tudo.minhas.map(i => i.id)).toEqual(['c', 'a']);
  expect(tudo.outras.map(i => i.id)).toEqual(['b']);
  expect(separarInstituicoes(rota, [], 'SAO jose').outras.map(i => i.id)).toEqual(['b']);
  expect(separarInstituicoes(rota, [], 'zzz').outras).toEqual([]);
});

test('embarque da VOLTA em ponto sem instituição conta como escolha do aluno', () => {
  const pontos = [
    {id: 'inst', apelido: 'Escola', instituicao: {id: 'i1', nome: 'UFCG'}},
    {id: 'rua', apelido: 'Praça', instituicao: null},
  ];
  expect(embarqueForaDaInstituicao(pontos, 'rua')).toBe(true);
  expect(embarqueForaDaInstituicao(pontos, 'inst')).toBe(false);
  expect(embarqueForaDaInstituicao(pontos, null)).toBe(false);
  expect(embarqueForaDaInstituicao(null, 'rua')).toBe(false);
});

test('o embarque da VOLTA nunca entra no padrão lembrado', () => {
  const escolha = {embarqueId: 'rua', desembarqueId: 'd1'};
  expect(montarPontosPadrao('VOLTA', escolha)).toEqual({ponto_desembarque_id: 'd1'});
  expect(montarPontosPadrao('IDA', escolha)).toEqual({ponto_embarque_id: 'rua'});
});

test('a linha do card mostra o embarque da VOLTA só quando é um ponto escolhido', () => {
  expect(linhaDosPontos('VOLTA', 'Praça', 'Casa')).toBe('Desce em Casa');
  expect(linhaDosPontos('VOLTA', 'Praça', 'Casa', true)).toBe('Embarca em Praça · Desce em Casa');
});

test('a caixa de pontos ordena em ordem alfabética e filtra sem acento nem maiúsculas', () => {
  const pontos = [
    {id: '1', apelido: 'Praça da Matriz'},
    {id: '2', apelido: 'Água Branca'},
    {id: '3', apelido: 'bairro novo'},
    {id: '4', apelido: 'Avenida Central'},
  ];
  expect(filtrarPontos(pontos, '').itens.map(p => p.id)).toEqual(['2', '4', '3', '1']);
  expect(filtrarPontos(pontos, 'agua').itens.map(p => p.id)).toEqual(['2']);
  expect(filtrarPontos(pontos, 'AV').itens.map(p => p.id)).toEqual(['4']);
  expect(filtrarPontos(pontos, 'zzz')).toEqual({itens: [], total: 0});
});

test('a caixa de pontos mostra no máximo o limite e informa o total', () => {
  const pontos = [];
  for (let i = 0; i < 60; i++) pontos.push({id: String(i), apelido: `Ponto ${String(i).padStart(2, '0')}`});
  const r = filtrarPontos(pontos, '', 50);
  expect(r.itens.length).toBe(50);
  expect(r.total).toBe(60);
  expect(filtrarPontos(pontos, '5', 50).total).toBe(15);
});

test('inverter troca embarque e descida', () => {
  expect(inverterEscolha({embarqueId: 'casa', desembarqueId: 'escola'})).toEqual({
    embarqueId: 'escola',
    desembarqueId: 'casa',
  });
  expect(inverterEscolha({embarqueId: 'casa', desembarqueId: null})).toEqual({
    embarqueId: null,
    desembarqueId: 'casa',
  });

test('a busca da caixa de pontos acha também pelo endereço', () => {
  const pontos = [
    {id: '1', apelido: 'Ponto perto do mercadinho', endereco: 'Rua das Flores, 120 - Bairro Novo'},
    {id: '2', apelido: 'Praça', endereco: null},
  ];
  expect(filtrarPontos(pontos, 'flores').itens.map(p => p.id)).toEqual(['1']);
  expect(filtrarPontos(pontos, 'bairro novo').total).toBe(1);
  expect(filtrarPontos(pontos, 'praca').itens.map(p => p.id)).toEqual(['2']);
});
