import { api } from '../api/client';

export type TipoFeedback = 'BUG' | 'SUGESTAO' | 'DUVIDA';

export interface FeedbackRequest {
  tipo: TipoFeedback;
  mensagem: string;
  tela: string | null;
  versao_app: string | null;
  plataforma: 'android' | 'ios' | 'web';
}

export interface FeedbackResponse {
  id: string;
  message: string;
}

export const enviarFeedback = async (
  data: FeedbackRequest,
): Promise<FeedbackResponse> => {
  const response = await api.post<FeedbackResponse>('/feedback', data);
  return response.data;
};

const feedbackService = { enviarFeedback };

export default feedbackService;
