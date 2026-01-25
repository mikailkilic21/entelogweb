import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Home, Users, Box, Receipt, ShoppingCart, Banknote, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a', // slate-900
          borderTopWidth: 1,
          borderTopColor: '#1e293b', // slate-800
          // Removed hardcoded height/padding to let Safe Area handle it
        },
        tabBarActiveTintColor: '#3b82f6', // blue-500
        tabBarInactiveTintColor: '#64748b', // slate-500,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Cariler',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: 'Stok',
          tabBarIcon: ({ color }) => <Box size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Faturalar',
          tabBarIcon: ({ color }) => <Receipt size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Sipariş',
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="checks"
        options={{
          title: 'Çek/Senet',
          tabBarIcon: ({ color }) => <Banknote size={24} color={color} />,
        }}
      />

      {/* Hide explore from tab bar if not needed, or replace it. I'll hide it. */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
