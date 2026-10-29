export const URL_APK = '/buska.apk';

// iPadOS 13+ se apresenta como Macintosh; o ponto de toque o separa de um Mac.
export const ehIos = (userAgent, pontosDeToque = 0) => {
  const ua = userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && pontosDeToque > 1;
};

// Passos da tela de cadastro concluído no navegador. acao diz qual botão o passo mostra.
export const montarPassosApp = ios => {
  const passos = [{numero: 1, titulo: 'Cadastro concluído', feito: true}];

  if (ios) {
    passos.push({numero: 2, titulo: 'O app para iPhone chega em breve', feito: false});
  } else {
    passos.push({
      numero: 2,
      titulo: 'Baixe o app',
      feito: false,
      acao: 'baixar',
      texto: 'Ao instalar, o Android pode pedir para permitir a instalação de fontes desconhecidas.',
    });
  }

  passos.push({
    numero: 3,
    titulo: 'Abra o app e entre',
    feito: false,
    texto: 'Entre com o e-mail e a senha que você acabou de criar.',
  });
  return passos;
};
