import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getDBConnection,
  createNotesTable,
  saveNote,
  getNotes,
  updateNote,
  deleteNote,
  getNoteById,
} from '../src/db-services';
import { SQLiteDatabase } from 'react-native-sqlite-storage';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

const lightTheme = {
  background: '#f0f4f8',
  text: '#2c3e50',
  card: '#fff',
  input: '#fff',
  border: '#b0bec5',
  primary: '#3498db',
  secondary: '#2ecc71',
  danger: '#e74c3c',
};

const darkTheme = {
  background: '#181a20',
  text: '#f5f6fa',
  card: '#23262f',
  input: '#23262f',
  border: '#444',
  primary: '#2980b9',
  secondary: '#27ae60',
  danger: '#c0392b',
};

const NotesScreen = () => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteTitle, setCurrentNoteTitle] = useState('');
  const [currentNoteContent, setCurrentNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
    systemColorScheme === 'dark' ? 'dark' : 'light',
  );
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const loadNotes = useCallback(async (connection: SQLiteDatabase) => {
    try {
      const storedNotes = await getNotes(connection);
      setNotes(storedNotes);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      Alert.alert('Error', 'No se pudieron cargar las notas.');
    }
  }, []);

  useEffect(() => {
    const initDb = async () => {
      try {
        const connection = await getDBConnection();
        setDb(connection);
        await createNotesTable(connection);
        await loadNotes(connection);
      } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        Alert.alert('Error', 'No se pudo conectar a la base de datos.');
      }
    };
    initDb();
  }, [loadNotes]);

  useEffect(() => {
    return () => {
      if (db) {
        db.close().then(() => console.log('Base de datos cerrada.'));
      }
    };
  }, [db]);

  const handleSaveOrUpdateNote = async () => {
    if (!db) return;
    if (!currentNoteTitle.trim()) {
      Alert.alert('Error', 'El título de la nota no puede estar vacío.');
      return;
    }
    try {
      if (editingNoteId) {
        await updateNote(
          db,
          editingNoteId,
          currentNoteTitle,
          currentNoteContent,
        );
        Alert.alert('Éxito', 'Nota actualizada correctamente.');
      } else {
        await saveNote(db, currentNoteTitle, currentNoteContent);
        Alert.alert('Éxito', 'Nota guardada correctamente.');
      }
      setCurrentNoteTitle('');
      setCurrentNoteContent('');
      setEditingNoteId(null);
      await loadNotes(db);
    } catch (error) {
      console.error('Error al guardar/actualizar nota:', error);
      Alert.alert('Error', 'Hubo un problema al guardar/actualizar la nota.');
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!db) return;
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await deleteNote(db, id);
              Alert.alert('Éxito', 'Nota eliminada correctamente.');
              await loadNotes(db);
            } catch (error) {
              console.error('Error al eliminar nota:', error);
              Alert.alert('Error', 'No se pudo eliminar la nota.');
            }
          },
        },
      ],
    );
  };

  const handleEditNote = async (id: number) => {
    if (!db) return;
    try {
      const noteToEdit = await getNoteById(db, id);
      if (noteToEdit) {
        setCurrentNoteTitle(noteToEdit.title);
        setCurrentNoteContent(noteToEdit.content);
        setEditingNoteId(noteToEdit.id);
      }
    } catch (error) {
      console.error('Error al cargar nota para editar:', error);
      Alert.alert('Error', 'No se pudo cargar la nota para editar.');
    }
  };

  const handleToggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Olvidaste tu contraseña?',
      'No te preocupes! :D \n\nContactate con el equipo de Datavault al siguiente número: 0424-2407455.\n\nTiempo de respuesta: aproximadamente 2 semanas.\n\n',
      [{ text: 'OK' }],
      { cancelable: true },
    );
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <View style={[styles.noteItem, { backgroundColor: theme.card }]}>
      <Text style={[styles.noteTitle, { color: theme.text }]}>
        {item.title}
      </Text>
      <Text
        style={[styles.noteContent, { color: theme.text }]}
        numberOfLines={2}
      >
        {item.content}
      </Text>
      <View style={styles.noteActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.secondary }]}
          onPress={() => handleEditNote(item.id)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deleteButton,
            { backgroundColor: theme.danger },
          ]}
          onPress={() => handleDeleteNote(item.id)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.text }]}>Data Vault</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.iconButton} onPress={handleHelpPress}>
            <Ionicons
              name="help-circle-outline"
              size={28}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleTheme}
          >
            <Ionicons
              name={themeMode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={28}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.input,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder="Título de la nota"
        placeholderTextColor={themeMode === 'dark' ? '#aaa' : '#888'}
        value={currentNoteTitle}
        onChangeText={setCurrentNoteTitle}
      />
      <TextInput
        style={[
          styles.input,
          styles.contentInput,
          {
            backgroundColor: theme.input,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder="Contenido de la nota"
        placeholderTextColor={themeMode === 'dark' ? '#aaa' : '#888'}
        multiline
        numberOfLines={4}
        value={currentNoteContent}
        onChangeText={setCurrentNoteContent}
      />
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={handleSaveOrUpdateNote}
        disabled={!db}
      >
        <Text style={styles.saveButtonText}>
          {editingNoteId ? 'Actualizar Nota' : 'Guardar Nueva Nota'}
        </Text>
      </TouchableOpacity>
      {editingNoteId && (
        <TouchableOpacity
          style={[
            styles.saveButton,
            styles.cancelEditButton,
            { backgroundColor: theme.border },
          ]}
          onPress={() => {
            setEditingNoteId(null);
            setCurrentNoteTitle('');
            setCurrentNoteContent('');
          }}
        >
          <Text style={styles.saveButtonText}>Cancelar Edición</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.listHeader, { color: theme.text }]}>
        Todas las Notas
      </Text>
      {notes.length === 0 ? (
        <Text style={[styles.noNotesText, { color: theme.text }]}>
          No hay notas guardadas aún.
        </Text>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id.toString()}
          style={styles.noteList}
          contentContainerStyle={styles.noteListContent}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  iconButton: {
    marginLeft: 10,
    padding: 4,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelEditButton: {},
  listHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  noteList: {
    flex: 1,
  },
  noteListContent: {
    paddingBottom: 20,
  },
  noNotesText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  noteItem: {
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noteTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButton: {},
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NotesScreen;
