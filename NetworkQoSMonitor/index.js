/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import BackgroundFetch from 'react-native-background-fetch';
import { performBackgroundMeasurement } from './src/BackgroundLayer/BackgroundService';

AppRegistry.registerComponent(appName, () => App);

// Registramos el Headless Task para Android (cuando la app está muerta)
BackgroundFetch.registerHeadlessTask(async (event) => {
  const taskId = event.taskId;
  const isTimeout = event.timeout;
  
  if (isTimeout) {
    BackgroundFetch.finish(taskId);
    return;
  }
  
  await performBackgroundMeasurement(taskId);
});
