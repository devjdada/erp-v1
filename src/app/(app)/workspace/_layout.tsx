import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '@/hooks/use-theme';
import { LayoutGrid, Calendar, ClipboardList, MessageSquare, User } from 'lucide-react-native';

export default function WorkspaceLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
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
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'LEAVE',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="work-order"
        options={{
          title: 'WORK ORDER',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'MESSAGES',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, size }) => <User color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}
