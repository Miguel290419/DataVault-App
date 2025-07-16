import {
  enablePromise,
  openDatabase,
  SQLiteDatabase,
} from 'react-native-sqlite-storage';

// Habilita el uso de Promises para las operaciones de la base de datos
enablePromise(true);

const databaseName = 'datavault.db'; // Nombre de tu archivo de base de datos
const databaseLocation = 'default';

export const getDBConnection = async (): Promise<SQLiteDatabase> => {
  return openDatabase({
    name: databaseName,
    location: databaseLocation,
  });
};

export const createNotesTable = async (db: SQLiteDatabase) => {
  const query = `
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;
  await db.executeSql(query);
  console.log('Tabla de notas creada o ya existente.');
};

export const saveNote = async (
  db: SQLiteDatabase,
  title: string,
  content: string,
) => {
  const now = Date.now();

  // Log 1: Verifica que los parámetros lleguen correctamente
  console.log('[saveNote] Parámetros recibidos:', { title, content, now });

  try {
    // Log 2: Antes de ejecutar el INSERT
    console.log('[saveNote] Ejecutando INSERT...');

    await db.executeSql(
      'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [title, content, now, now],
    );

    // Log 3: Confirmación de éxito
    console.log('[saveNote] Nota insertada correctamente');

    // Log 4: Verifica si la nota quedó en la DB (opcional)
    const [result] = await db.executeSql(
      'SELECT * FROM notes WHERE title = ?',
      [title],
    );
    console.log('[saveNote] Nota en DB:', result.rows.raw());
  } catch (error) {
    // Log 5: Captura errores
    console.error('[saveNote] Error al guardar:', error);
  }
};

export const getNotes = async (db: SQLiteDatabase): Promise<any[]> => {
  const selectQuery = 'SELECT * FROM notes ORDER BY updated_at DESC;';
  const [result] = await db.executeSql(selectQuery);
  const notes: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    notes.push(result.rows.item(i));
  }
  return notes;
};

export const updateNote = async (
  db: SQLiteDatabase,
  id: number,
  title: string,
  content: string,
) => {
  const now = Date.now();
  const updateQuery = `
    UPDATE notes
    SET title = ?, content = ?, updated_at = ?
    WHERE id = ?;
  `;
  await db.executeSql(updateQuery, [title, content, now, id]);
  console.log('Nota actualizada:', id);
};

export const deleteNote = async (db: SQLiteDatabase, id: number) => {
  const deleteQuery = 'DELETE FROM notes WHERE id = ?;';
  await db.executeSql(deleteQuery, [id]);
  console.log('Nota eliminada:', id);
};

export const getNoteById = async (
  db: SQLiteDatabase,
  id: number,
): Promise<any | null> => {
  const selectQuery = 'SELECT * FROM notes WHERE id = ?;';
  const [result] = await db.executeSql(selectQuery, [id]);
  if (result.rows.length > 0) {
    return result.rows.item(0);
  }
  return null;
};
