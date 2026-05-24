import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Calendar, CheckCircle, Menu, UserCircle } from 'lucide-react-native';

export default function HRLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
          name="directory"
          options={{
            title: 'DIRECTORY',
            tabBarIcon: ({ color }) => <Users color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'ATTENDANCE',
            tabBarIcon: ({ color }) => <Calendar color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="leave"
          options={{
            title: 'LEAVE',
            tabBarIcon: ({ color }) => <UserCircle color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="permissions"
          options={{
            title: 'PERMISSIONS',
            tabBarIcon: ({ color }) => <CheckCircle color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'MORE',
            tabBarIcon: ({ color }) => <Menu color={color} size={20} />,
          }}
        />
        <Tabs.Screen name="reports" options={{ href: null }} />
        <Tabs.Screen name="departments" options={{ href: null }} />
        <Tabs.Screen name="careers" options={{ href: null }} />
        <Tabs.Screen name="tools" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
