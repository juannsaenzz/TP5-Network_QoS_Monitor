import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from './Theme';

// Importaremos las pantallas acá cuando las creemos
import HomeScreen from './screens/HomeScreen';
import SpeedTestScreen from './screens/SpeedTestScreen';
import HistoryScreen from './screens/HistoryScreen';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
            elevation: 0, // Saca la sombra en Android
            shadowOpacity: 0, // Saca la sombra en iOS
          },
          headerTintColor: Colors.primary,
          headerTitleAlign: 'center',
          drawerActiveBackgroundColor: Colors.primaryLight,
          drawerActiveTintColor: Colors.textDark,
          drawerInactiveTintColor: Colors.surface,
          drawerStyle: {
            backgroundColor: Colors.primary, // Fondo naranja del menú
            width: 240,
          },
        }}
      >
        <Drawer.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Medidor QoS' }} 
        />
        <Drawer.Screen 
          name="Speed Test" 
          component={SpeedTestScreen} 
          options={{ title: 'Gráficos Temporales' }}
        />
        <Drawer.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{ title: 'Historial de Mapa' }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
