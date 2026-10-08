/**
 * Serviço de Persistência Local (storageService.js)
 * Utiliza o @react-native-async-storage/async-storage para guardar
 * e recuperar a lista de áudios localmente no dispositivo.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_STORAGE = '@gravapp:audios';

/**
 * Função: Guardar a lista de áudios no AsyncStorage
 * @param {Array} audios - Lista de objetos de áudio a guardar
 */
export const salvarAudiosLocais = async (audios) => {
  try {
    const jsonAudios = JSON.stringify(audios);
    await AsyncStorage.setItem(CHAVE_STORAGE, jsonAudios);
  } catch (error) {
    console.error('Erro ao guardar áudios no AsyncStorage:', error);
  }
};

/**
 * Função: Carregar a lista de áudios guardados do AsyncStorage
 * @returns {Promise<Array>} Lista de áudios ou array vazio se não existir
 */
export const carregarAudiosLocais = async () => {
  try {
    const jsonAudios = await AsyncStorage.getItem(CHAVE_STORAGE);
    if (jsonAudios !== null) {
      return JSON.parse(jsonAudios);
    }
    return [];
  } catch (error) {
    console.error('Erro ao carregar áudios do AsyncStorage:', error);
    return [];
  }
};

/**
 * Função: Limpar todos os áudios guardados no AsyncStorage
 */
export const limparAudiosLocais = async () => {
  try {
    await AsyncStorage.removeItem(CHAVE_STORAGE);
  } catch (error) {
    console.error('Erro ao limpar AsyncStorage:', error);
  }
};
