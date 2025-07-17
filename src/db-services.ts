import {
  enablePromise,
  openDatabase,
  SQLiteDatabase,
} from 'react-native-sqlite-storage';
import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';

enablePromise(true);

const databaseName = 'datavault.db';
const databaseLocation = 'default';

const ENCRYPTION_PASSPHRASE = 'MiFraseSecretaMuySeguraParaAES256!'; // passphrase
const PBKDF2_SALT = 'algun_salt_unico_para_derivacion'; // salt for key derivation

const ENCRYPTION_KEY = CryptoJS.PBKDF2(
  ENCRYPTION_PASSPHRASE,
  PBKDF2_SALT,
  { keySize: 256 / 32, iterations: 1000 }, // keySize in WordArray words (1 word = 4 bytes)
);

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
  console.log('[saveNote] Parámetros recibidos:', { title, content, now });

  try {
    // Encrypt title
    const titleIv = CryptoJS.lib.WordArray.random(16 / 4); // 16 bytes = 4 words
    const encryptedTitle = CryptoJS.AES.encrypt(title, ENCRYPTION_KEY, {
      iv: titleIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const encryptedTitleBase64 = encryptedTitle.toString();
    const titleIvBase64 = titleIv.toString(CryptoJS.enc.Base64);
    const titleToSave = `${titleIvBase64}:${encryptedTitleBase64}`;

    // Encrypt content
    const contentIv = CryptoJS.lib.WordArray.random(16 / 4); // 16 bytes = 4 words
    const encryptedContent = CryptoJS.AES.encrypt(content, ENCRYPTION_KEY, {
      iv: contentIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const encryptedContentBase64 = encryptedContent.toString();
    const contentIvBase64 = contentIv.toString(CryptoJS.enc.Base64);
    const contentToSave = `${contentIvBase64}:${encryptedContentBase64}`;

    console.log('[saveNote] Ejecutando INSERT...');
    await db.executeSql(
      'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [titleToSave, contentToSave, now, now],
    );

    console.log('[saveNote] Nota insertada correctamente');

    const [result] = await db.executeSql(
      'SELECT * FROM notes WHERE title = ?',
      [titleToSave],
    );
    console.log('[saveNote] Nota en DB:', result.rows.raw());
  } catch (error) {
    console.error('[saveNote] Error al guardar:', error);
    throw error;
  }
};

export const getNotes = async (db: SQLiteDatabase): Promise<any[]> => {
  const selectQuery = 'SELECT * FROM notes ORDER BY updated_at DESC;';
  const [result] = await db.executeSql(selectQuery);
  const notes: any[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);

    // Check if title and content are in the expected encrypted format
    if (
      !row.title ||
      !row.content ||
      typeof row.title !== 'string' ||
      typeof row.content !== 'string' ||
      row.title.indexOf(':') === -1 ||
      row.content.indexOf(':') === -1
    ) {
      console.warn(
        '[getNotes] Título o contenido no cifrado o inválido encontrado, saltando descifrado:',
        row.id,
      );
      notes.push(row);
      continue;
    }

    try {
      // Decrypt title
      const [titleIvBase64, encryptedTitleBase64] = row.title.split(':');
      const titleIv = CryptoJS.enc.Base64.parse(titleIvBase64);
      const decryptedTitle = CryptoJS.AES.decrypt(
        encryptedTitleBase64,
        ENCRYPTION_KEY,
        {
          iv: titleIv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      const decryptedTitleContent = decryptedTitle.toString(CryptoJS.enc.Utf8);

      // Decrypt content
      const [contentIvBase64, encryptedContentBase64] = row.content.split(':');
      const contentIv = CryptoJS.enc.Base64.parse(contentIvBase64);
      const decryptedContent = CryptoJS.AES.decrypt(
        encryptedContentBase64,
        ENCRYPTION_KEY,
        {
          iv: contentIv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      const decryptedContentText = decryptedContent.toString(CryptoJS.enc.Utf8);

      notes.push({
        ...row,
        title: decryptedTitleContent,
        content: decryptedContentText,
      });
    } catch (decryptionError) {
      console.error(
        '[getNotes] Error al descifrar nota:',
        row.id,
        decryptionError,
      );
      notes.push(row); // Push original if decryption fails
    }
  }
  console.log('[getNotes] Notas cargadas y descifradas.');
  return notes;
};

export const updateNote = async (
  db: SQLiteDatabase,
  id: number,
  title: string,
  content: string,
) => {
  const now = Date.now();

  try {
    // Encrypt title
    const titleIv = CryptoJS.lib.WordArray.random(16 / 4); // 16 bytes = 4 words
    const encryptedTitle = CryptoJS.AES.encrypt(title, ENCRYPTION_KEY, {
      iv: titleIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const encryptedTitleBase64 = encryptedTitle.toString();
    const titleIvBase64 = titleIv.toString(CryptoJS.enc.Base64);
    const titleToSave = `${titleIvBase64}:${encryptedTitleBase64}`;

    // Encrypt content
    const contentIv = CryptoJS.lib.WordArray.random(16 / 4); // 16 bytes = 4 words
    const encryptedContent = CryptoJS.AES.encrypt(content, ENCRYPTION_KEY, {
      iv: contentIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const encryptedContentBase64 = encryptedContent.toString();
    const contentIvBase64 = contentIv.toString(CryptoJS.enc.Base64);
    const contentToSave = `${contentIvBase64}:${encryptedContentBase64}`;

    const updateQuery = `
      UPDATE notes
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?;
    `;
    await db.executeSql(updateQuery, [titleToSave, contentToSave, now, id]);
    console.log('Nota actualizada:', id);
  } catch (error) {
    console.error('[updateNote] Error al actualizar:', error);
    throw error;
  }
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
    const row = result.rows.item(0);

    // Check if title and content are in the expected encrypted format
    if (
      !row.title ||
      !row.content ||
      typeof row.title !== 'string' ||
      typeof row.content !== 'string' ||
      row.title.indexOf(':') === -1 ||
      row.content.indexOf(':') === -1
    ) {
      console.warn(
        '[getNoteById] Título o contenido no cifrado o inválido encontrado, saltando descifrado:',
        row.id,
      );
      return row;
    }

    try {
      // Decrypt title
      const [titleIvBase64, encryptedTitleBase64] = row.title.split(':');
      const titleIv = CryptoJS.enc.Base64.parse(titleIvBase64);
      const decryptedTitle = CryptoJS.AES.decrypt(
        encryptedTitleBase64,
        ENCRYPTION_KEY,
        {
          iv: titleIv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      const decryptedTitleContent = decryptedTitle.toString(CryptoJS.enc.Utf8);

      // Decrypt content
      const [contentIvBase64, encryptedContentBase64] = row.content.split(':');
      const contentIv = CryptoJS.enc.Base64.parse(contentIvBase64);
      const decryptedContent = CryptoJS.AES.decrypt(
        encryptedContentBase64,
        ENCRYPTION_KEY,
        {
          iv: contentIv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      const decryptedContentText = decryptedContent.toString(CryptoJS.enc.Utf8);

      return {
        ...row,
        title: decryptedTitleContent,
        content: decryptedContentText,
      };
    } catch (decryptionError) {
      console.error(
        '[getNoteById] Error al descifrar nota:',
        row.id,
        decryptionError,
      );
      return row;
    }
  }
  return null;
};
