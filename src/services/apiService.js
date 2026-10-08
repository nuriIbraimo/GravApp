/**
 * Serviço de Comunicação REST API (apiService.js)
 * 
 * Deteta o IP do PC automaticamente usando o Expo Constants.
 * Nunca mais precisas de mudar o IP manualmente.
 */

import Constants from 'expo-constants';

// ============ CONFIGURAÇÃO DO BACKEND (RENDER / LOCAL) ============
const RENDER_URL = 'https://gravapp-backend.onrender.com';

const getApiUrl = () => {
  // 1. Se houver variável de ambiente definida via Expo, usa essa
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Em produção ou EAS Update, usa o URL do Render
  if (!__DEV__) {
    return RENDER_URL;
  }

  // 3. Em desenvolvimento local no Expo Go, deteta o IP da máquina
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }

  // 4. Fallback para emulador ou Render
  return RENDER_URL;
};

const BASE_HOST = getApiUrl();
export const API_URL = `${BASE_HOST}/api`;

console.log('🔗 API URL:', API_URL);

// ============ GET: Listar todos os áudios ============
export const buscarAudiosDaApi = async () => {
  try {
    const resposta = await fetch(`${API_URL}/audios`);
    if (!resposta.ok) throw new Error('Erro ao obter áudios da API');
    const dados = await resposta.json();

    // Converte URIs relativas em URLs completas
    return dados.map((item) => ({
      ...item,
      uri: item.uri?.startsWith('/') ? `${BASE_HOST}${item.uri}` : item.uri,
      imagem: item.imagem?.startsWith('/') ? `${BASE_HOST}${item.imagem}` : item.imagem,
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar áudios da API:', error.message);
    throw error;
  }
};

// ============ GET: Buscar áudio por ID ============
export const buscarAudioPorId = async (id) => {
  try {
    const resposta = await fetch(`${API_URL}/audios/${id}`);
    if (!resposta.ok) throw new Error('Áudio não encontrado');
    const item = await resposta.json();
    return {
      ...item,
      uri: item.uri?.startsWith('/') ? `${BASE_HOST}${item.uri}` : item.uri,
      imagem: item.imagem?.startsWith('/') ? `${BASE_HOST}${item.imagem}` : item.imagem,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes:', error.message);
    throw error;
  }
};

// ============ POST: Enviar áudio ============
export const enviarAudioParaApi = async (itemAudio) => {
  try {
    const formData = new FormData();

    if (itemAudio.uri) {
      const nomeFicheiro = itemAudio.uri.split('/').pop() || `audio_${Date.now()}.m4a`;
      const tipoExt = nomeFicheiro.endsWith('.mp3') ? 'audio/mpeg' : 'audio/m4a';

      formData.append('audio', {
        uri: itemAudio.uri,
        name: nomeFicheiro,
        type: tipoExt,
      });
    }

    formData.append('id', String(itemAudio.id));
    formData.append('nome', itemAudio.nome);
    formData.append('duracao', String(itemAudio.duracao));
    formData.append('data', itemAudio.data || '');
    formData.append('hora', itemAudio.hora || '');

    const resposta = await fetch(`${API_URL}/audios`, {
      method: 'POST',
      body: formData,
    });

    if (!resposta.ok) throw new Error('Falha no upload do áudio');
    return await resposta.json();
  } catch (error) {
    console.error('❌ Erro ao enviar áudio:', error.message);
    throw error;
  }
};

// ============ POST: Enviar imagem ============
export const enviarImagemParaApi = async (id, uriImagem) => {
  try {
    const formData = new FormData();
    const nomeFicheiro = uriImagem.split('/').pop() || `imagem_${Date.now()}.jpg`;

    formData.append('imagem', {
      uri: uriImagem,
      name: nomeFicheiro,
      type: 'image/jpeg',
    });

    const resposta = await fetch(`${API_URL}/audios/${id}/imagem`, {
      method: 'POST',
      body: formData,
    });

    if (!resposta.ok) throw new Error('Falha no upload da imagem');
    return await resposta.json();
  } catch (error) {
    console.error('❌ Erro ao enviar imagem:', error.message);
    throw error;
  }
};

// ============ DELETE: Eliminar áudio ============
export const eliminarAudioDaApi = async (id) => {
  try {
    const resposta = await fetch(`${API_URL}/audios/${id}`, {
      method: 'DELETE',
    });
    if (!resposta.ok) throw new Error('Erro ao eliminar áudio');
    return await resposta.json();
  } catch (error) {
    console.error('❌ Erro ao eliminar áudio:', error.message);
    throw error;
  }
};

// ============ TESTE: Verificar conexão ============
export const testarConexao = async () => {
  try {
    const resposta = await fetch(`${API_URL}/audios`);
    return resposta.ok;
  } catch {
    return false;
  }
};