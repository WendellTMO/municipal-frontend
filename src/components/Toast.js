/**
 * Toast Component & Context
 * 
 * Accessible toast notifications for user feedback
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing, textStyles, borderRadius, shadows } from '../theme';
import Icon, { IconNames } from './Icon';
import { haptico } from '../utils/haptico';

// Toast types configuration
const TOAST_CONFIG = {
  success: {
    icon: IconNames.checkCircle,
    backgroundColor: colors.success.main,
    iconColor: colors.text.inverse,
  },
  error: {
    icon: IconNames.error,
    backgroundColor: colors.error.main,
    iconColor: colors.text.inverse,
  },
  warning: {
    icon: IconNames.warning,
    backgroundColor: colors.warning.main,
    iconColor: colors.warning.dark,
  },
  info: {
    icon: IconNames.info,
    backgroundColor: colors.secondary.main,
    iconColor: colors.text.inverse,
  },
};

/**
 * @typedef {{ showToast: Function, success: Function, error: Function, warning: Function, info: Function }} ToastAPI
 * @type {React.Context<ToastAPI | null>}
 */
const ToastContext = /** @type {React.Context<any>} */ (createContext(null));

// Provider Component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [fadeAnim]);

  const showToast = useCallback(({ type = 'info', message, duration = 3000 }) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ type, message });
    if (type === 'success') haptico('sucesso');
    else if (type === 'error') haptico('erro');
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (duration > 0) {
      timeoutRef.current = setTimeout(hideToast, duration);
    }
  }, [fadeAnim, hideToast]);

  // Helper methods for common toast types
  const success = useCallback((message, duration) => {
    showToast({ type: 'success', message, duration });
  }, [showToast]);

  const error = useCallback((message, duration) => {
    showToast({ type: 'error', message, duration: duration || 5000 });
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    showToast({ type: 'warning', message, duration });
  }, [showToast]);

  const info = useCallback((message, duration) => {
    showToast({ type: 'info', message, duration });
  }, [showToast]);

  // Estável: telas usam o toast como dependência de efeito. Objeto novo a cada render fazia a
  // tela recarregar, falhar e mostrar o toast de novo, sem fim.
  const contextValue = useMemo(
    () => ({ showToast, success, error, warning, info }),
    [showToast, success, error, warning, info],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const config = toast ? TOAST_CONFIG[toast.type] || TOAST_CONFIG.info : null;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            { backgroundColor: config.backgroundColor, opacity: fadeAnim },
            { transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            })}]},
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          accessibilityLabel={toast.message}
        >
          <Icon name={config.icon} size="sm" color={config.iconColor} />
          <Text style={[styles.toastMessage, { color: config.iconColor }]}>
            {toast.message}
          </Text>
          <TouchableOpacity 
            onPress={hideToast}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Fechar notificação"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name={IconNames.close} size="xs" color={config.iconColor} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

// Hook for using toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? spacing.lg : spacing.xxxl + spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.lg,
    zIndex: 9999,
  },
  toastMessage: {
    ...textStyles.body,
    flex: 1,
    flexWrap: 'wrap',
  },
});

export default { ToastProvider, useToast };
