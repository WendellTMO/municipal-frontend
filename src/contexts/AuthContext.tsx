import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { parseApiError, requiresReauth, errorLogger } from '../utils/errors';
import { ErrorCode } from '../utils/errors/errorTypes';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../components/Toast';
import {
  biometriaDisponivel,
  desligarNoLogout,
  gravarPreferencia,
  lerPreferencia,
  pedirBiometria,
} from '../services/biometria';
import { deveBloquear, deveOferecer } from '../utils/biometriaFluxo';
import { deveEncerrarSessao } from '../utils/lembrarMe';
import { Storage, STORAGE_KEYS } from '../utils/storage';
import type { 
  AlunoResponse,
  AlunoSelfSignupRequest,
  LoginRequest,
  TokenResponse,
  UserInfo,
  UserResponse,
} from '../types';

type LoginSuccessResult = {
  success: true;
  user: AuthUser;
};

type LoginErrorResult = {
  success: false;
  error: string;
  errorCode?: string;
  errorCategory?: string;
};

type LoginResult = LoginSuccessResult | LoginErrorResult;

type RegisterSuccessResult<TData = unknown> = {
  success: true;
  data: TData;
};

type RegisterErrorResult = {
  success: false;
  error: string;
  errorCode?: string;
  errorCategory?: string;
  field?: string;
  fieldErrors: Record<string, string>;
};

type RegisterResult<TData = unknown> =
  | RegisterSuccessResult<TData>
  | RegisterErrorResult;


type AuthContextValue = {
  user: UserResponse | UserInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (loginData: LoginRequest, lembrar?: boolean) => Promise<TokenResponse>;
  register: (userData: AlunoSelfSignupRequest) => Promise<AlunoResponse>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  biometria: {
    disponivel: boolean;
    ativa: boolean;
    /** Pergunta pós-login pendente (Sim / Agora não). */
    oferta: boolean;
    /** Sessão restaurada que ainda espera a biometria. */
    bloqueado: boolean;
    responderOferta: (aceitou: boolean) => Promise<void>;
    alternar: (ligar: boolean) => Promise<void>;
    desbloquear: () => Promise<boolean>;
  };
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<UserResponse | UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [bioDisponivel, setBioDisponivel] = useState<boolean>(false);
  const [bioAtiva, setBioAtiva] = useState<boolean>(false);
  const [bioOferta, setBioOferta] = useState<boolean>(false);
  const [bioBloqueado, setBioBloqueado] = useState<boolean>(false);

  const toast = useToast();

  const handleForegroundMessage = useCallback(({ title, body }) => {
    toast.info(`${title}${body ? `\n${body}` : ''}`, 5000);
  }, [toast]);

  usePushNotifications(isAuthenticated, handleForegroundMessage);

  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      const hasToken = await authService.isAuthenticated();
      const sessaoTemporaria = await Storage.getItem(STORAGE_KEYS.SESSAO_TEMPORARIA);

      if (deveEncerrarSessao({ temToken: hasToken, sessaoTemporaria })) {
        await authService.logout();
        await Storage.removeItem(STORAGE_KEYS.SESSAO_TEMPORARIA);
        return;
      }

      if (!hasToken) {
        return;
      }

      try {
        const fullUserData = await userService.getCurrentUser();
        setUser(fullUserData);
        // Decide o bloqueio antes de marcar como autenticado, para o painel não piscar.
        const disponivel = await biometriaDisponivel();
        const preferencia = await lerPreferencia();
        setBioDisponivel(disponivel);
        setBioAtiva(preferencia === 'sim');
        setBioBloqueado(deveBloquear({ disponivel, preferencia }));
        setIsAuthenticated(true);
      } catch (error: unknown) {
        const parsedError = parseApiError(error);

        if (requiresReauth(parsedError)) {
          await authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error: unknown) {
      errorLogger.error(error, { context: 'checkAuthStatus' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuthStatus();
  }, [checkAuthStatus]);

  // Depois de um login com senha, pergunta uma vez se quer entrar com biometria.
  const prepararOferta = useCallback(async (): Promise<void> => {
    const disponivel = await biometriaDisponivel();
    const preferencia = await lerPreferencia();
    setBioDisponivel(disponivel);
    setBioAtiva(preferencia === 'sim');
    setBioBloqueado(false);
    setBioOferta(deveOferecer({ disponivel, preferencia }));
  }, []);

  const responderOferta = useCallback(async (aceitou: boolean): Promise<void> => {
    setBioOferta(false);
    if (!aceitou) {
      await gravarPreferencia('nao');
      return;
    }
    const confirmou = await pedirBiometria('Confirme para ativar a biometria');
    if (confirmou) {
      await gravarPreferencia('sim');
      setBioAtiva(true);
    }
  }, []);

  const alternarBiometria = useCallback(async (ligar: boolean): Promise<void> => {
    if (!ligar) {
      await gravarPreferencia('nao');
      setBioAtiva(false);
      return;
    }
    const confirmou = await pedirBiometria('Confirme para ativar a biometria');
    if (confirmou) {
      await gravarPreferencia('sim');
      setBioAtiva(true);
    }
  }, []);

  const desbloquear = useCallback(async (): Promise<boolean> => {
    const confirmou = await pedirBiometria('Confirme que é você para entrar');
    if (confirmou) setBioBloqueado(false);
    return confirmou;
  }, []);

  const login = useCallback(
    async (loginData: LoginRequest, lembrar = true): Promise<LoginResult> => {
      try {
        const { user: loggedInUser } = await authService.login(loginData);
        await Storage.setItem(STORAGE_KEYS.SESSAO_TEMPORARIA, !lembrar);

        try {
          const fullUserData = await userService.getCurrentUser();
          await authService.updateStoredUser(fullUserData);
          setUser(fullUserData);
          setIsAuthenticated(true);
          void prepararOferta();

          return {
            success: true,
            user: fullUserData,
          };
        } catch {
          if (loggedInUser) {
            setUser(loggedInUser);
            setIsAuthenticated(true);
            void prepararOferta();

            return {
              success: true,
              user: loggedInUser,
            };
          }
          return {
            success: false,
            error: 'Failed to get user data',
          };
        }
      } catch (error: unknown) {
        const parsedError = parseApiError(error);
        errorLogger.userError('login', parsedError, { email: loginData.email });

        const message =
          parsedError.code === ErrorCode.UNAUTHORIZED
            ? 'E-mail ou senha incorretos.'
            : parsedError.message;

        return {
          success: false,
          error: message,
          errorCode: parsedError.code,
          errorCategory: parsedError.category,
        };
      }
    },
    [prepararOferta],
  );

  const register = useCallback(
    async (userData: AlunoSelfSignupRequest): Promise<RegisterResult> => {
      try {
        const response = await authService.register(userData);
        errorLogger.info('Registration successful', { email: userData.email });

        return {
          success: true,
          data: response,
        };
      } catch (error: unknown) {
        const parsedError = parseApiError(error);
        errorLogger.userError('register', parsedError, {
          email: userData.email,
        });

        return {
          success: false,
          error: parsedError.message,
          errorCode: parsedError.code,
          errorCategory: parsedError.category,
          field: parsedError.field,
          fieldErrors: parsedError.details ?? {},
        };
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      errorLogger.info('Logout initiated', { userId: user?.id });
      await authService.logout();
      await Storage.removeItem(STORAGE_KEYS.SESSAO_TEMPORARIA);
      await desligarNoLogout();
      setBioAtiva(false);
      setBioBloqueado(false);
      setBioOferta(false);
      setUser(null);
      setIsAuthenticated(false);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      errorLogger.info('Logout completed');
    } catch (error: unknown) {
      errorLogger.error(error, { context: 'logout' });
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      checkAuthStatus,
      biometria: {
        disponivel: bioDisponivel,
        ativa: bioAtiva,
        oferta: bioOferta,
        bloqueado: bioBloqueado,
        responderOferta,
        alternar: alternarBiometria,
        desbloquear,
      },
    }),
    [
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      checkAuthStatus,
      bioDisponivel,
      bioAtiva,
      bioOferta,
      bioBloqueado,
      responderOferta,
      alternarBiometria,
      desbloquear,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
