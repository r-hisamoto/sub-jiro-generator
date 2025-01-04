import { useState, useEffect, useCallback } from 'react';

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

interface UseHuggingFaceAuthProps {
  onAuthSuccess?: () => void;
  onAuthError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseHuggingFaceAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  token: string | null;
  authenticate: (token: string) => Promise<void>;
  logout: () => void;
  retry: () => Promise<void>;
}

export const useHuggingFaceAuth = ({
  onAuthSuccess,
  onAuthError,
  retryAttempts = 3,
  retryDelay = 1000,
}: UseHuggingFaceAuthProps = {}): UseHuggingFaceAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentRetryCount, setCurrentRetryCount] = useState(0);
  const [lastAttemptedToken, setLastAttemptedToken] = useState<string | null>(null);

  const validateToken = (token: string): boolean => {
    if (!token || token.length < 8) {
      throw new AuthError('無効なトークンです', 'INVALID_TOKEN');
    }
    return true;
  };

  const handleAuthError = useCallback((err: unknown) => {
    if (err instanceof AuthError) {
      setError(err);
    } else if (err instanceof Error) {
      if (err.message.includes('network')) {
        setError(new AuthError('ネットワークエラーが発生しました', 'NETWORK_ERROR'));
      } else if (err.message.includes('timeout')) {
        setError(new AuthError('接続がタイムアウトしました', 'TIMEOUT_ERROR'));
      } else {
        setError(new AuthError('認証中にエラーが発生しました', 'UNKNOWN_ERROR'));
      }
    } else {
      setError(new AuthError('予期せぬエラーが発生しました', 'UNEXPECTED_ERROR'));
    }
    onAuthError?.(error as Error);
  }, [error, onAuthError]);

  const authenticate = async (accessToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setLastAttemptedToken(accessToken);
      setCurrentRetryCount(0);

      validateToken(accessToken);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://huggingface.co/api/whoami', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AuthError(
          response.status === 401 ? '認証に失敗しました' : 'APIエラーが発生しました',
          response.status === 401 ? 'UNAUTHORIZED' : 'API_ERROR'
        );
      }

      localStorage.setItem('hf_token', accessToken);
      setToken(accessToken);
      setIsAuthenticated(true);
      onAuthSuccess?.();
    } catch (err) {
      handleAuthError(err);
      localStorage.removeItem('hf_token');
    } finally {
      setIsLoading(false);
    }
  };

  const retry = async () => {
    if (!lastAttemptedToken || currentRetryCount >= retryAttempts) {
      throw new AuthError('これ以上リトライできません', 'RETRY_LIMIT_EXCEEDED');
    }

    setCurrentRetryCount((prev) => prev + 1);
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    return authenticate(lastAttemptedToken);
  };

  const logout = () => {
    localStorage.removeItem('hf_token');
    setToken(null);
    setIsAuthenticated(false);
    setCurrentRetryCount(0);
    setLastAttemptedToken(null);
    setError(null);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('hf_token');
    if (storedToken) {
      authenticate(storedToken).catch(console.error);
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    token,
    authenticate,
    logout,
    retry,
  };
}; 