import { Tabs } from 'expo-router';
import React from 'react';
import { Home, LayoutGrid, Landmark, MoreHorizontal } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a', // slate-900
          borderTopWidth: 1,
          borderTopColor: '#1e293b', // slate-800
          // Let Safe Area handle height and padding automatically
        },
        tabBarActiveTintColor: '#3b82f6', // blue-500
        tabBarInactiveTintColor: '#64748b', // slate-500
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color }) => <Home size={26} color={color} />,
        }}
      />

      {/* 2. Transactions Hub */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'İşlemler',
          tabBarIcon: ({ color }) => <LayoutGrid size={26} color={color} />,
        }}
      />

      {/* 3. Banks (NEW!) */}
      <Tabs.Screen
        name="banks"
        options={{
          title: 'Bankalar',
          tabBarIcon: ({ color }) => <Landmark size={26} color={color} />,
        }}
      />

      {/* 4. More Menu */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'Daha Fazla',
          tabBarIcon: ({ color }) => <MoreHorizontal size={26} color={color} />,
        }}
      />

      {/* Hidden tabs - accessible via router but not in tab bar */}
      <Tabs.Screen
        name="accounts"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="products"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="invoices"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="orders"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="checks"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="menu"
        options={{ href: null }}
      />
    </Tabs>
  );
}
