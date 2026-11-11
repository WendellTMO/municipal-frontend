import { api } from '../api/client';
import { Storage, STORAGE_KEYS } from '../utils/storage';
import { gravarToken, lerToken, apagarToken } from '../utils/tokenSeguro';
import { ValidationError, errorLogger } from '../utils/errors';
import type {
  AlunoResponse,
  LoginRequest,
  TokenResponse,
  UserResponse,
  AlunoSelfSignupRequest,
  UserInfo,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../types';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export const authService = {
  /**
   * Login user
   * Backend: POST /v1/auth/login
   * Returns: { access_token, token_type }
   */
  async login(
    loginData: LoginRequest
  ): Promise<TokenResponse> {
    // Client-side validation
    if (!loginData.email?.trim()) {
      throw new ValidationError('E-mail é obrigatório', 'email');
    }
    if (!loginData.password) {
      throw new ValidationError('Senha é obrigatória', 'password');
    }

    const payload: LoginRequest = {
      email: normalizeEmail(loginData.email),
      password: loginData.password,
    };

    const response = await api.post<TokenResponse>('/auth/login', payload);

    const { token, user } = response.data;

    // Store token
    await gravarToken(token);
    
    let loginUser: UserResponse | undefined = user;
    try {
      // Try to get complete user profile
      const userResponse = await api.get<UserResponse>('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      loginUser = userResponse.data;
    } catch (e) {
      // Use login user data as fallback
      errorLogger.debug('Using login user data as fallback', { error: e.message });
    }

    // Store user info
    await Storage.setItem(STORAGE_KEYS.USER, loginUser);

    errorLogger.info('User logged in successfully', { userId: loginUser?.id, role: loginUser?.role });

    return { token, user: loginUser };
  },

  /**
   * Register new student (public endpoint)
   * Backend: POST /v1/alunos/signup
   */
  async register(
    userData: AlunoSelfSignupRequest
  ): Promise<AlunoResponse> {
    // Client-side validation
    if (!userData.nome?.trim()) {
      throw new ValidationError('Nome é obrigatório', 'nome', null, { nome: 'Nome é obrigatório' });
    }
    if (!userData.email?.trim()) {
      throw new ValidationError('E-mail é obrigatório', 'email', null, { email: 'E-mail é obrigatório' });
    }
    if (!userData.password || userData.password.length < 8) {
      throw new ValidationError('Senha deve ter pelo menos 8 caracteres', 'password', null, { password: 'Senha deve ter pelo menos 8 caracteres' });
    }
    if (!userData.cpf || userData.cpf.replace(/\D/g, '').length !== 11) {
      throw new ValidationError('CPF inválido. Informe os 11 dígitos', 'cpf', null, { cpf: 'CPF inválido. Informe os 11 dígitos' });
    }
    if (!userData.instituicao_id) {
      throw new ValidationError('Instituição é obrigatória', 'instituicao_id', null, { instituicao_id: 'Instituição é obrigatória' });
    }
    if (!userData.endereco_casa) {
      throw new ValidationError('Endereço é obrigatório', 'endereco_casa', null, { endereco_casa: 'Endereço é obrigatório' });
    }

    const payload: AlunoSelfSignupRequest = {
      ...userData,
      nome: userData.nome.trim(),
      email: normalizeEmail(userData.email),
      password: userData.password,
      cpf: onlyDigits(userData.cpf),
      telefone: userData.telefone ? onlyDigits(userData.telefone) : undefined,
      data_nascimento: userData.data_nascimento,
      email_responsavel: userData.email_responsavel ?? undefined,
      endereco_casa: userData.endereco_casa,
    };

    const response = await api.post<AlunoResponse>('/alunos/signup', payload);

    errorLogger.info('User registered successfully', {
      email: payload.email,
    });

    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    errorLogger.info('User logging out...');
    await apagarToken();
    await Storage.removeItem(STORAGE_KEYS.USER);
    errorLogger.info('User logged out successfully');
  },

  /**
   * Get current user from storage
   */
  async getCurrentUser(): Promise<UserResponse | UserInfo | undefined> {
    return await Storage.getItem(STORAGE_KEYS.USER);
  },

  /**
   * Refresh user data from server
   */
  async refreshUserData(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/users/me');
    const user = response.data;
    await Storage.setItem(STORAGE_KEYS.USER, user);

    return user;
  },

  /**
   * Update stored user data
   */
  async updateStoredUser(userData: UserResponse | UserInfo): Promise<void> {
    await Storage.setItem(STORAGE_KEYS.USER, userData);
  },

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    return await lerToken();
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await lerToken();
    return !!token;
  },

  /**
   * Change password
   * Backend: POST /v1/users/change-password
   */
  async changePassword(
    changePasswordData: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    if (!changePasswordData.current_password) {
      throw new ValidationError('Senha atual é obrigatória', 'current_password', null, { current_password: 'Senha atual é obrigatória' });
    }
    if (!changePasswordData.new_password || changePasswordData.new_password.length < 6) {
      throw new ValidationError('Nova senha deve ter pelo menos 6 caracteres', 'new_password', null, { new_password: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    const response = await api.post<ChangePasswordResponse>('/users/change-password', changePasswordData);
    errorLogger.info('Password changed successfully');
    return response.data;
  },
};
