import AES from 'react-native-aes-crypto';
import { Buffer } from 'buffer'; // Necesitarás instalar esta librería también

const AES_KEY = 'ThisIsAVerySecretKeyForTestingOnly123456'; // Debe ser de 32 bytes (256 bits)
const IV = 'RandomIVForTestin'; // Debe ser de 16 bytes (128 bits)

export const encrypt = async (plainText: string): Promise<string> => {
  try {
    const key = Buffer.from(AES_KEY, 'utf8').toString('hex');
    const iv = Buffer.from(IV, 'utf8').toString('hex');

    // Cifrar el texto plano
    const encrypted = await AES.encrypt(plainText, key, iv, 'aes-256-cbc');
    return encrypted;
  } catch (error) {
    console.error('Error al cifrar:', error);
    throw new Error('Error al cifrar la nota.');
  }
};

export const decrypt = async (cipherText: string): Promise<string> => {
  try {
    // Generar un hash de la clave si la original no tiene 32 bytes
    const key = Buffer.from(AES_KEY, 'utf8').toString('hex');
    const iv = Buffer.from(IV, 'utf8').toString('hex');

    // Descifrar el texto
    const decrypted = await AES.decrypt(cipherText, key, iv, 'aes-256-cbc');
    return decrypted;
  } catch (error) {
    console.error('Error al descifrar:', error);
    throw new Error(
      'Error al descifrar la nota. (Podría ser clave incorrecta o datos corruptos)',
    );
  }
};

export const generateSecureRandomBytes = async (
  length: number,
): Promise<string> => {
  try {
    const randomBytes = await AES.randomKey(length); // Genera bytes aleatorios en hexadecimal
    return randomBytes;
  } catch (error) {
    console.error('Error al generar bytes aleatorios:', error);
    throw new Error('No se pudieron generar bytes aleatorios seguros.');
  }
};

export const generateAESKeyAndIV = async (): Promise<{
  key: string;
  iv: string;
}> => {
  const key = await generateSecureRandomBytes(32); // 32 bytes = 256 bits
  const iv = await generateSecureRandomBytes(16); // 16 bytes = 128 bits
  return { key, iv };
};
