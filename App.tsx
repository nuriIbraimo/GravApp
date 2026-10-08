// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import TelaGravacao from './src/telas/TelaGravacao';
import TelaLista from './src/telas/TelaLista';
import UploadScreen from './src/screens/UploadScreen';
import { ProvedorAudio } from './src/contexto/ContextoAudio';
import { cores } from './src/tema/cores';

export type RootTabParamList = {
  Home: undefined;
  Biblioteca: undefined;
  Upload: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <ProvedorAudio>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: cores.azul,
            tabBarInactiveTintColor: cores.textoMuitoSuave,
            tabBarStyle: {
              backgroundColor: cores.fundoCartao,
              borderTopColor: cores.borda,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 6,
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={TelaGravacao}
            options={{
              tabBarLabel: 'Gravar',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Feather name="mic" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Biblioteca"
            component={TelaLista}
            options={{
              tabBarLabel: 'Biblioteca',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Feather name="folder" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Upload"
            component={UploadScreen}
            options={{
              tabBarLabel: 'Nuvem API',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Feather name="upload-cloud" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ProvedorAudio>
  );
}
