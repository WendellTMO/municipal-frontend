// Texto do aviso azul para um push recebido com o app aberto. Push só de dados (como o pedido
// de localização ao motorista) chega sem título nem corpo e não deve virar aviso.
export const textoDoAviso = ({ title, body }) => {
  const titulo = (title || '').trim();
  const corpo = (body || '').trim();
  if (!titulo && !corpo) return null;
  if (!corpo) return titulo;
  return titulo ? `${titulo}\n${corpo}` : corpo;
};
