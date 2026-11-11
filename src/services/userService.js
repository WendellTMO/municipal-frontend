import { api } from '../api/client';
import { gravarToken } from '../utils/tokenSeguro';

export const userService = {
  /**
   * Get current user profile
   * Backend: GET /v1/users/me
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get user by ID
   * Backend: GET /v1/users/{id}
   */
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * List all users (GESTOR only)
   * Backend: GET /v1/users/
   */
  async listUsers() {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Register or refresh the FCM push token for this device
   * Backend: PATCH /v1/users/fcm-token
   */
  async updateFcmToken(fcmToken) {
    try {
      const response = await api.patch('/users/fcm-token', { fcm_token: fcmToken });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Update own profile (nome, telefone, receber_notificacoes, cnh for motoristas)
   * Backend: PATCH /v1/users/me
   */
  async updateProfile(data) {
    try {
      const response = await api.patch('/users/me', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Change password
   * Backend: POST /v1/users/change-password
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    // Sem handleError: a tela usa getErrorMessageFromError para mostrar a mensagem do servidor.
    const response = await api.post('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword ?? newPassword,
    });
    // As outras sessões caem com a troca; o token novo mantém este aparelho logado.
    if (response.data?.token) await gravarToken(response.data.token);
    return response.data;
  },

  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.message || error.response.data?.error || 'Ocorreu um erro',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      return {
        message: 'Não foi possível conectar ao servidor. Tente novamente em instantes.',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'Ocorreu um erro inesperado',
        status: 0,
      };
    }
  },
};
