import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Modal, StyleSheet, View, Text, Pressable, Animated, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'primary' | 'secondary' | 'danger' | 'cancel';
}

export interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  const hideAlert = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
      if (callback) callback();
    });
  }, [opacityAnim, scaleAnim]);

  const handleButtonPress = (btn: AlertButton) => {
    hideAlert(() => {
      if (btn.onPress) {
        btn.onPress();
      }
    });
  };

  const renderIcon = (type: AlertType = 'info') => {
    const size = 26;
    switch (type) {
      case 'success':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <CheckCircle color="#10B981" size={size} strokeWidth={2.5} />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
            <AlertCircle color="#EF4444" size={size} strokeWidth={2.5} />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <AlertTriangle color="#F59E0B" size={size} strokeWidth={2.5} />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <Info color="#3B82F6" size={size} strokeWidth={2.5} />
          </View>
        );
    }
  };

  const getButtonStyle = (styleType?: 'primary' | 'secondary' | 'danger' | 'cancel') => {
    switch (styleType) {
      case 'danger':
        return {
          bg: '#EF4444',
          text: '#FFFFFF',
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: theme.backgroundSelected,
          text: theme.text,
          border: theme.border,
        };
      case 'cancel':
        return {
          bg: 'transparent',
          text: theme.textSecondary,
          border: 'transparent',
        };
      case 'primary':
      default:
        return {
          bg: theme.primary,
          text: '#FFFFFF',
          border: 'transparent',
        };
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {visible && options && (
        <Modal
          transparent
          animationType="none"
          visible={visible}
          onRequestClose={() => hideAlert()}
        >
          <Animated.View 
            style={[
              styles.overlay, 
              { 
                opacity: opacityAnim,
                backgroundColor: Platform.OS === 'web' ? 'rgba(7, 10, 19, 0.75)' : 'rgba(7, 10, 19, 0.65)' 
              }
            ]}
          >
            <Animated.View
              style={[
                styles.alertBox,
                {
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Header Icon + Close button */}
              <View style={styles.headerRow}>
                {renderIcon(options.type)}
                <Pressable 
                  onPress={() => hideAlert()} 
                  style={({ pressed }) => [
                    styles.closeButton, 
                    { backgroundColor: theme.backgroundSelected },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <X color={theme.textSecondary} size={16} />
                </Pressable>
              </View>

              {/* Title & Message */}
              <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {options.title}
                </Text>
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                  {options.message}
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {options.buttons && options.buttons.length > 0 ? (
                  options.buttons.map((btn, index) => {
                    const btnStyles = getButtonStyle(btn.style);
                    return (
                      <Pressable
                        key={index}
                        onPress={() => handleButtonPress(btn)}
                        style={({ pressed }) => [
                          styles.button,
                          {
                            backgroundColor: btnStyles.bg,
                            borderColor: btnStyles.border,
                            borderWidth: btnStyles.border !== 'transparent' ? 1 : 0,
                            flex: options.buttons!.length > 2 ? undefined : 1, // stack if > 2, side-by-side if 1-2
                          },
                          pressed && { opacity: 0.85 }
                        ]}
                      >
                        <Text style={[styles.buttonText, { color: btnStyles.text }]}>
                          {btn.text}
                        </Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <Pressable
                    onPress={() => hideAlert()}
                    style={({ pressed }) => [
                      styles.button,
                      {
                        backgroundColor: theme.primary,
                        flex: 1,
                      },
                      pressed && { opacity: 0.85 }
                    ]}
                  >
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                      OK
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        cursor: 'default',
      },
    }),
  },
  alertBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  contentContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 10,
  },
  message: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  buttonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
