// Busca de endereço no Nominatim (OpenStreetMap), usada nas telas que criam ponto.
export const ESPERA_BUSCA_MS = 900;
export const MIN_LETRAS_ENDERECO = 5;

// Devolve a lista de resultados (até 5). Lança erro se a rede ou o serviço falhar.
export async function buscarEnderecos(texto) {
  const query = encodeURIComponent(texto);
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=br&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'BusKa/1.0.0-beta (React Native; contact: contato.buska@gmail.com)',
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

// Nome sugerido para o ponto: rua, bairro ou o primeiro trecho do endereço completo.
export function nomeSugeridoEndereco(resultado) {
  const endereco = resultado.address || {};
  return (
    endereco.road ||
    endereco.pedestrian ||
    endereco.suburb ||
    endereco.neighbourhood ||
    resultado.display_name.split(',')[0] ||
    ''
  );
}
