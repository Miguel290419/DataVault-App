import React, { useEffect, useState } from 'react';
import { View, Button, StyleSheet, TextInput, Text, Alert } from 'react-native';
import * as Keychain from 'react-native-keychain';

type AuthScreenProps = {
  onAuthSuccess: () => void;
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkPassword = async () => {
      const creds = await Keychain.getInternetCredentials(
        'datavault_master_password',
      );
      setIsFirstTime(!creds);
    };
    checkPassword();
  }, []);

  const handleCreatePassword = async () => {
    if (password.length < 4) {
      Alert.alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    await Keychain.setInternetCredentials(
      'datavault_master_password',
      'user',
      password,
    );
    setLoading(false);
    onAuthSuccess();
  };

  const handleLogin = async () => {
    setLoading(true);
    const creds = await Keychain.getInternetCredentials(
      'datavault_master_password',
    );
    setLoading(false);
    if (creds && creds.password === inputPassword) {
      onAuthSuccess();
    } else {
      Alert.alert('Contraseña incorrecta');
    }
  };

  if (isFirstTime === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isFirstTime ? (
        <>
          <Text style={styles.title}>Crea una contraseña maestra</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button
            title={loading ? 'Guardando...' : 'Crear contraseña'}
            onPress={handleCreatePassword}
            disabled={loading}
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>Ingresa tu contraseña maestra</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry
            value={inputPassword}
            onChangeText={setInputPassword}
          />
          <Button
            title={loading ? 'Verificando...' : 'Ingresar'}
            onPress={handleLogin}
            disabled={loading}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default AuthScreen;
