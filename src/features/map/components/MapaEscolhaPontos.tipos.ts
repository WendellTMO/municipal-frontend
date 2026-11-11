export type PontoDoMapa = {
  id: string;
  apelido: string;
  latitude: number;
  longitude: number;
};

export type MapaEscolhaPontosProps = {
  pontos: PontoDoMapa[];
  embarqueId: string | null;
  desembarqueId: string | null;
  /** Ponto mais próximo do aluno: anel dourado e etiqueta com a distância */
  destaque: { id: string; rotulo: string } | null;
  usuario: { latitude: number; longitude: number } | null;
  aoTocarPonto: (id: string) => void;
  altura?: number;
};
