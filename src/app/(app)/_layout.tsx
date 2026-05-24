import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Briefcase, Truck, Settings, Users } from 'lucide-react-native';
import CustomDrawerContent from '@/components/CustomDrawerContent';

export default function AppLayout() {
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.backgroundElement,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontFamily: 'PlusJakartaSans_700Bold',
          },
          drawerStyle: {
            backgroundColor: theme.backgroundElement,
            width: 260,
            borderRightWidth: 1,
            borderRightColor: theme.border,
          },
          drawerActiveTintColor: theme.primary,
          drawerInactiveTintColor: theme.textSecondary,
          drawerActiveBackgroundColor: theme.backgroundSelected,
          drawerLabelStyle: {
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 15,
            marginLeft: -10,
          },
        }}
      >
        <Drawer.Screen
          name="workspace"
          options={{
            title: 'My Workspace',
            headerShown: false,
            drawerIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
          }}
        />
        <Drawer.Screen
          name="fleet"
          options={{
            title: 'Fleet Management',
            drawerIcon: ({ color, size }) => <Truck color={color} size={size} />,
          }}
        />
        <Drawer.Screen
          name="hr"
          options={{
            title: 'HR',
            drawerIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            drawerIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
