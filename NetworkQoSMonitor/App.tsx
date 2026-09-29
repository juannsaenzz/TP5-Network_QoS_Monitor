import 'react-native-gesture-handler'; // Debe estar al principio de todo
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/PresentationLayer/AppNavigator';
import { Colors } from './src/PresentationLayer/Theme';
import { backgroundService } from './src/BackgroundLayer/BackgroundService';

function App(): React.JSX.Element {
  useEffect(() => {
    // Registramos la tarea recurrente ante el sistema operativo
    backgroundService.configure();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" {...({ backgroundColor: Colors.background } as any)} />
      <AppNavigator />
    </>
  );
}

export default App;
