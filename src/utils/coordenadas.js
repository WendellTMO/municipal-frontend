// Converte texto digitado ("-7,2290" ou "-7.2290") em número. Vazio ou inválido vira null.
export function parseNumeroDecimal(texto) {
  const limpo = String(texto == null ? '' : texto).trim().replace(',', '.');
  if (limpo === '' || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(limpo)) {
    return null;
  }
  return Number(limpo);
}

// Devolve a mensagem de erro em pt-BR, ou '' quando o texto é válido.
export function validarLatitude(texto) {
  if (String(texto == null ? '' : texto).trim() === '') {
    return 'Informe a latitude.';
  }
  const valor = parseNumeroDecimal(texto);
  if (valor === null) {
    return 'Latitude inválida. Use números, ex: -7.2290';
  }
  if (valor < -90 || valor > 90) {
    return 'A latitude deve estar entre -90 e 90.';
  }
  return '';
}

export function validarLongitude(texto) {
  if (String(texto == null ? '' : texto).trim() === '') {
    return 'Informe a longitude.';
  }
  const valor = parseNumeroDecimal(texto);
  if (valor === null) {
    return 'Longitude inválida. Use números, ex: -35.9020';
  }
  if (valor < -180 || valor > 180) {
    return 'A longitude deve estar entre -180 e 180.';
  }
  return '';
}

// Colar "-7.2290, -35.9020" (vírgula e espaço) separa o par. Senão devolve null.
export function dividirParColado(texto) {
  const partes = String(texto == null ? '' : texto).trim().split(/,\s+/);
  if (partes.length !== 2) {
    return null;
  }
  if (parseNumeroDecimal(partes[0]) === null || parseNumeroDecimal(partes[1]) === null) {
    return null;
  }
  return {latitude: partes[0].trim(), longitude: partes[1].trim()};
}

// Devolve {latitude, longitude} numéricos quando os dois campos são válidos, senão null.
export function coordenadasValidas(latTexto, lonTexto) {
  if (validarLatitude(latTexto) !== '' || validarLongitude(lonTexto) !== '') {
    return null;
  }
  return {latitude: parseNumeroDecimal(latTexto), longitude: parseNumeroDecimal(lonTexto)};
}

export function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Diz se a posição andou mais que a tolerância (em metros). Sem posição anterior, mudou.
export function posicaoMudou(anterior, atual, toleranciaM) {
  if (!anterior) {
    return true;
  }
  const andou = distanciaMetros(
    anterior.latitude,
    anterior.longitude,
    atual.latitude,
    atual.longitude,
  );
  return andou > toleranciaM;
}
