import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({ message, type, onHide, duration = 3000 }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return theme.success;
      case 'error': return theme.error;
      case 'warning': return theme.warning;
      default: return theme.link;
    }
  };

  const show = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: insets.top + Spacing.md,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [insets.top, opacity, translateY]);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  }, [onHide, opacity, translateY]);

  useEffect(() => {
    show();
    const timer = setTimeout(hide, duration);
    return () => clearTimeout(timer);
  }, [duration, hide, show]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: theme.backgroundSecondary,
          borderColor: getColor(),
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
        <Feather name={getIcon() as any} size={20} color={getColor()} />
      </View>
      <View style={styles.content}>
        <ThemedText type="body" style={styles.message}>{message}</ThemedText>
      </View>
      <Pressable onPress={hide} style={styles.closeButton}>
        <Feather name="x" size={16} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: Spacing.xs,
  },
});
