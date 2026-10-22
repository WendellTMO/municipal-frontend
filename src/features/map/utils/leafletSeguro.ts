// Remoção segura de um mapa Leaflet. Se a tela fecha no meio de uma animação de zoom,
// o Leaflet ainda dispara _onZoomTransitionEnd (setTimeout de 250 ms) depois do remove()
// e quebra com "undefined is not an object (evaluating 'el._leaflet_pos')".
// shortcut: usa o campo privado _animatingZoom, que o próprio callback consulta para
// se abortar; trocar se uma versão futura do Leaflet expuser um jeito público.
export function destruirMapa(map: unknown): void {
  const m = map as {
    stop?: () => void;
    off?: () => void;
    remove?: () => void;
    _animatingZoom?: boolean;
  };
  try {
    m.stop?.();
    m.off?.();
  } catch {
    // mapa já meio desmontado: segue para o remove
  }
  m._animatingZoom = false;
  try {
    m.remove?.();
  } catch {
    // nada a fazer: o contêiner já saiu da tela
  }
}
