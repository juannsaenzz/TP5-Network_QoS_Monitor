import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { mySchema } from './schema';
import Measurement from './Measurement';

// Configuramos el adaptador a SQLite
const adapter = new SQLiteAdapter({
  schema: mySchema,
  // (Opcional) jsi: true, // Si usás TurboModules/JSI para máxima performance
  onSetUpError: error => {
    // Si hay un error levantando la base de datos local
    console.error('Error inicializando WatermelonDB', error);
  }
});

// Instanciamos la base de datos
export const database = new Database({
  adapter,
  modelClasses: [
    Measurement,
  ],
});
