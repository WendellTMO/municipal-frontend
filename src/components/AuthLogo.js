/**
 * AuthLogo
 *
 * Logo da marca (assets/logo-login.png, 1024x1080) com largura ajustável.
 */
import React from 'react';
import { Image } from 'react-native';

const AuthLogo = ({ width = 250, style = undefined }) => (
  <Image
    source={require('../../assets/logo-login.png')}
    style={[{ width, height: (width * 1080) / 1024, alignSelf: 'center' }, style]}
    resizeMode="contain"
  />
);

export default AuthLogo;
