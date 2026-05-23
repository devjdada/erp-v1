import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Calendar, Target, ClipboardList, MessageSquare } from 'lucide-react-native';

export default function WorkspaceLayout() {
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
          name="tasks"
          options={{
            title: 'TASKS',
            tabBarIcon: ({ color }) => <Target color={color} size={20} />,
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
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="documents" options={{ href: null }} />
        <Tabs.Screen name="announcements" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="tickets" options={{ href: null }} />
        <Tabs.Screen name="visitors" options={{ href: null }} />
        <Tabs.Screen name="corrections" options={{ href: null }} />
        <Tabs.Screen name="loans" options={{ href: null }} />
        <Tabs.Screen name="permissions" options={{ href: null }} />
        <Tabs.Screen name="movements" options={{ href: null }} />
        <Tabs.Screen name="requisitions" options={{ href: null }} />
        <Tabs.Screen name="tools" options={{ href: null }} />
        <Tabs.Screen name="task/[id]" options={{ href: null }} />
        <Tabs.Screen name="requisition/[id]" options={{ href: null }} />
        <Tabs.Screen name="requisition/create" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
