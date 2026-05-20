import { Tabs, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Calendar, ClipboardList, MessageSquare, User as UserIcon, Plus, FileText, Megaphone } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn, FadeOut } from 'react-native-reanimated';

export default function WorkspaceLayout() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(isMenuOpen ? 135 : 0);
  }, [isMenuOpen, rotation]);

  const animatedFabStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.backgroundElement,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: 64 + insets.bottom,
            paddingBottom: 10 + insets.bottom,
            paddingTop: 8,
            elevation: 8,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 4,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarLabelStyle: {
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 9,
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'DASHBOARD',
            tabBarIcon: ({ color }) => <LayoutGrid color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="leave"
          options={{
            title: 'LEAVE',
            tabBarIcon: ({ color }) => <Calendar color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: () => (
              <View style={styles.fabPlaceholder} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        <Tabs.Screen
          name="work-order"
          options={{
            title: 'WORK ORDER',
            tabBarIcon: ({ color }) => <ClipboardList color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'MESSAGES',
            tabBarIcon: ({ color }) => <MessageSquare color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {isMenuOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setIsMenuOpen(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.backdrop}
          />
        </Pressable>
      )}

      {isMenuOpen && (
        <View style={[styles.speedDial, { bottom: 84 + insets.bottom }]}>
          <Animated.View entering={FadeIn.delay(50)} exiting={FadeOut} style={styles.speedDialItem}>
            <Pressable
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/(app)/workspace/documents');
              }}
              style={styles.speedDialButtonContainer}
            >
              <View style={[styles.speedDialLabelWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={[styles.speedDialLabel, { color: theme.text }]} numberOfLines={1}>Documents</Text>
              </View>
              <View style={[styles.speedDialButton, { backgroundColor: theme.primary }]}>
                <FileText color="#FFFFFF" size={18} />
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(100)} exiting={FadeOut} style={styles.speedDialItem}>
            <Pressable
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/(app)/workspace/announcements');
              }}
              style={styles.speedDialButtonContainer}
            >
              <View style={[styles.speedDialLabelWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={[styles.speedDialLabel, { color: theme.text }]} numberOfLines={1}>Bulletins</Text>
              </View>
              <View style={[styles.speedDialButton, { backgroundColor: '#F59E0B' }]}>
                <Megaphone color="#FFFFFF" size={18} />
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(150)} exiting={FadeOut} style={styles.speedDialItem}>
            <Pressable
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/(app)/workspace/chat');
              }}
              style={styles.speedDialButtonContainer}
            >
              <View style={[styles.speedDialLabelWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={[styles.speedDialLabel, { color: theme.text }]} numberOfLines={1}>Support Chat</Text>
              </View>
              <View style={[styles.speedDialButton, { backgroundColor: '#10B981' }]}>
                <MessageSquare color="#FFFFFF" size={18} />
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200)} exiting={FadeOut} style={styles.speedDialItem}>
            <Pressable
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/(app)/workspace/profile');
              }}
              style={styles.speedDialButtonContainer}
            >
              <View style={[styles.speedDialLabelWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={[styles.speedDialLabel, { color: theme.text }]} numberOfLines={1}>My Profile</Text>
              </View>
              <View style={[styles.speedDialButton, { backgroundColor: '#64748B' }]}>
                <UserIcon color="#FFFFFF" size={18} />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      )}

      <Pressable
        onPress={() => setIsMenuOpen(!isMenuOpen)}
        style={[styles.mainFab, { backgroundColor: theme.primary, bottom: 12 + insets.bottom }]}
      >
        <Animated.View style={animatedFabStyle}>
          <Plus color="#FFFFFF" size={26} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabPlaceholder: {
    width: 64,
    height: 64,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  mainFab: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    zIndex: 1001,
  },
  speedDial: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
    zIndex: 1000,
  },
  speedDialItem: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedDialButtonContainer: {
    position: 'relative',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedDialLabelWrapper: {
    position: 'absolute',
    right: 54,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  speedDialLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  speedDialButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});

