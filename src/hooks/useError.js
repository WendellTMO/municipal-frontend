/**
 * useError Hook
 * React hook for handling errors in components
 */

import { useState, useCallback } from 'react';
import {
  parseApiError,
  getErrorMessageFromError,
  isRetryableError,
  requiresReauth,
  errorLogger,
  ErrorCategory,
} from '../utils/errors';
import { useAuth } from '../contexts/AuthContext';
import { alertar } from '../utils/alerta';

/**
 * Hook for handling errors with automatic parsing and display
 */
export function useError() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle an error - parse, log, and optionally display
   */
  const handleError = useCallback((err, options = {}) => {
    const {
      showAlert = false,
      context = {},
      onAuthError = null,
    } = options;

    // Parse the error
    const parsedError = parseApiError(err);
    
    // Log the error
    errorLogger.error(parsedError, context);
    
    // Set error state
    setError(parsedError);
    
    // Handle authentication errors
    if (requiresReauth(parsedError)) {
      if (onAuthError) {
        onAuthError(parsedError);
      } else {
        alertar(
          'Sessão Expirada',
          'Sua sessão expirou. Por favor, faça login novamente.',
          [
            {
              text: 'OK',
              onPress: () => logout(),
            },
          ]
        );
      }
      return parsedError;
    }
    
    // Show alert if requested
    if (showAlert) {
      alertar('Erro', parsedError.message);
    }
    
    return parsedError;
  }, [logout]);

  /**
   * Execute an async function with error handling
   */
  const executeWithErrorHandling = useCallback(async (
    asyncFn,
    options = {}
  ) => {
    const {
      showAlert = true,
      onError = null,
      onSuccess = null,
      context = {},
      retryCount = 0,
      retryDelay = 1000,
    } = options;

    setIsLoading(true);
    clearError();

    let attempts = 0;
    const maxAttempts = retryCount + 1;

    while (attempts < maxAttempts) {
      try {
        const result = await asyncFn();
        setIsLoading(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return { success: true, data: result, error: null };
      } catch (err) {
        attempts++;
        
        const parsedError = parseApiError(err);
        
        // Check if we should retry
        const shouldRetry = 
          attempts < maxAttempts && 
          isRetryableError(parsedError);
        
        if (shouldRetry) {
          errorLogger.info(`Retrying request (attempt ${attempts}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
          continue;
        }
        
        // Final error handling
        setIsLoading(false);
        handleError(err, { showAlert, context });
        
        if (onError) {
          onError(parsedError);
        }
        
        return { success: false, data: null, error: parsedError };
      }
    }
  }, [clearError, handleError]);

  /**
   * Show error in alert
   */
  const showErrorAlert = useCallback((title = 'Erro') => {
    if (error) {
      alertar(title, error.message);
    }
  }, [error]);

  /**
   * Get error message for a specific field (validation errors)
   */
  const getFieldError = useCallback((fieldName) => {
    if (!error) return null;
    
    if (error.field === fieldName) {
      return error.message;
    }
    
    if (error.details && Array.isArray(error.details)) {
      const fieldError = error.details.find(
        e => e.field === fieldName || e.loc?.includes(fieldName)
      );
      if (fieldError) {
        return fieldError.message || fieldError.msg;
      }
    }
    
    return null;
  }, [error]);

  /**
   * Check if error is of a specific category
   */
  const isErrorCategory = useCallback((category) => {
    return error?.category === category;
  }, [error]);

  return {
    error,
    isLoading,
    errorMessage: error?.message || null,
    clearError,
    handleError,
    executeWithErrorHandling,
    showErrorAlert,
    getFieldError,
    isErrorCategory,
    isNetworkError: isErrorCategory(ErrorCategory.NETWORK),
    isAuthError: isErrorCategory(ErrorCategory.AUTHENTICATION),
    isValidationError: isErrorCategory(ErrorCategory.VALIDATION),
  };
}

export default useError;
