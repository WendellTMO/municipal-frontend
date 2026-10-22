import { Platform } from 'react-native';

// Dica ao passar o mouse (title do DOM). O RN-web não repassa `title`, então a
// ref grava o atributo. No nativo devolve objeto vazio.
export const webTitleProps = label => {
  if (Platform.OS !== 'web') return {};
  return {
    ref: el => {
      if (el && el.setAttribute) el.setAttribute('title', label);
    },
  };
};
