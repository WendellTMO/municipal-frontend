import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sem borda superior: o topo da área segura é do cabeçalho (SubHeader e PainelHeader).
const TelaSegura = (props) => <SafeAreaView edges={['left', 'right', 'bottom']} {...props} />;

export default TelaSegura;
