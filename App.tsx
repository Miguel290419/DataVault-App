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
  Platform, // Para detectar el sistema operativo
} from 'react-native';
import {
  getDBConnection,
  createNotesTable,
  saveNote,
  getNotes,
  updateNote,
  deleteNote,
  getNoteById,
} from './src/db-services'; // Asegúrate que la ruta sea correcta
import { SQLiteDatabase } from 'react-native-sqlite-storage';

// Define la interfaz para tu objeto Nota
interface Note {
  id: number;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

const App = () => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteTitle, setCurrentNoteTitle] = useState('');
  const [currentNoteContent, setCurrentNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // Función para cargar las notas desde la base de datos
  const loadNotes = useCallback(async (connection: SQLiteDatabase) => {
    try {
      const storedNotes = await getNotes(connection);
      setNotes(storedNotes);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      Alert.alert('Error', 'No se pudieron cargar las notas.');
    }
  }, []);

  // Efecto para inicializar la base de datos y cargar las notas al inicio
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

  // Manejador para guardar o actualizar una nota
  const handleSaveOrUpdateNote = async () => {
    if (!db) return; // Asegura que la DB esté conectada
    if (!currentNoteTitle.trim()) {
      // Valida que el título no esté vacío
      Alert.alert('Error', 'El título de la nota no puede estar vacío.');
      return;
    }

    try {
      if (editingNoteId) {
        // Si hay un ID de nota en edición, actualiza
        await updateNote(
          db,
          editingNoteId,
          currentNoteTitle,
          currentNoteContent,
        );
        Alert.alert('Éxito', 'Nota actualizada correctamente.');
      } else {
        // Si no, guarda una nueva nota
        await saveNote(db, currentNoteTitle, currentNoteContent);
        Alert.alert('Éxito', 'Nota guardada correctamente.');
      }
      // Limpia los campos y el ID de edición
      setCurrentNoteTitle('');
      setCurrentNoteContent('');
      setEditingNoteId(null);
      await loadNotes(db); // Recarga las notas para actualizar la lista
    } catch (error) {
      console.error('Error al guardar/actualizar nota:', error);
      Alert.alert('Error', 'Hubo un problema al guardar/actualizar la nota.');
    }
  };

  // Manejador para eliminar una nota
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
              await loadNotes(db); // Recarga las notas
            } catch (error) {
              console.error('Error al eliminar nota:', error);
              Alert.alert('Error', 'No se pudo eliminar la nota.');
            }
          },
        },
      ],
    );
  };

  // Manejador para cargar una nota en los campos de edición
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

  // Componente de item individual para la lista de notas
  const renderNoteItem = ({ item }: { item: Note }) => (
    <View style={styles.noteItem}>
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteContent} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.noteActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditNote(item.id)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteNote(item.id)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView // Ayuda a que los inputs no se oculten por el teclado
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.header}>Mis Notas Seguras</Text>

      <TextInput
        style={styles.input}
        placeholder="Título de la nota"
        value={currentNoteTitle}
        onChangeText={setCurrentNoteTitle}
      />
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Contenido de la nota"
        multiline
        numberOfLines={4}
        value={currentNoteContent}
        onChangeText={setCurrentNoteContent}
      />
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveOrUpdateNote}
        disabled={!db} // Deshabilita si la DB no está lista
      >
        <Text style={styles.saveButtonText}>
          {editingNoteId ? 'Actualizar Nota' : 'Guardar Nueva Nota'}
        </Text>
      </TouchableOpacity>
      {editingNoteId && ( // Botón para cancelar edición
        <TouchableOpacity
          style={[styles.saveButton, styles.cancelEditButton]}
          onPress={() => {
            setEditingNoteId(null);
            setCurrentNoteTitle('');
            setCurrentNoteContent('');
          }}
        >
          <Text style={styles.saveButtonText}>Cancelar Edición</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.listHeader}>Todas las Notas</Text>
      {notes.length === 0 ? (
        <Text style={styles.noNotesText}>No hay notas guardadas aún.</Text>
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
    paddingTop: Platform.OS === 'android' ? 40 : 60, // Ajuste de paddingTop para Android/iOS
    backgroundColor: '#f0f4f8', // Fondo más suave
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b0bec5',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#34495e',
  },
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#3498db', // Azul principal
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
  cancelEditButton: {
    backgroundColor: '#95a5a6', // Gris para cancelar
  },
  listHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#cfd8dc',
    paddingBottom: 5,
  },
  noteList: {
    flex: 1,
  },
  noteListContent: {
    paddingBottom: 20, // Espacio al final de la lista
  },
  noNotesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 20,
  },
  noteItem: {
    backgroundColor: '#ffffff',
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
    color: '#2c3e50',
  },
  noteContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10, // Espacio entre botones
  },
  actionButton: {
    backgroundColor: '#2ecc71', // Verde para editar
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#e74c3c', // Rojo para eliminar
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App;
