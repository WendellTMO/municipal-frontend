const ROTULOS = { IDA: 'Ida', VOLTA: 'Volta', CIRCULAR: 'Circular' };

// "IDA", "ida" ou "SentidoViagem.IDA" -> "Ida". Valor desconhecido volta como veio.
export const formatarSentido = valor => {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  const partes = texto.split('.');
  const chave = partes[partes.length - 1].trim().toUpperCase();
  if (ROTULOS[chave]) return ROTULOS[chave];
  return texto;
};
