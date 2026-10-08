// src/servicos/servicoNuvem.ts
import { supabase } from './supabase';
import type { ItemAudio } from '../contexto/ContextoAudio';

// ============================================================
// ENVIAR ÁUDIO
// ============================================================
export const enviarAudioNuvem = async (audio: ItemAudio): Promise<void> => {
  try {
    // 1. Ler o ficheiro
    const response = await fetch(audio.uri);
    const blob = await response.blob();

    // 2. LIMPAR o nome (remover caracteres inválidos)
    const nomeLimpo = audio.nome
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);

    const dataLimpa = audio.data.replace(/\//g, '-');
    const horaLimpa = audio.hora.replace(/:/g, '-');

    // 3. Nome do ficheiro SEM caracteres inválidos
    const nomeFicheiro = `${audio.id}__${nomeLimpo}__${audio.duracao}__${dataLimpa}__${horaLimpa}.m4a`;

    console.log('📤 Nome do ficheiro:', nomeFicheiro);

    // 4. Enviar para o Storage
    const { error } = await supabase.storage
      .from('audios')
      .upload(nomeFicheiro, blob, {
        contentType: 'audio/m4a',
        upsert: true,
      });

    if (error) throw error;

    console.log('✅ Áudio enviado!');
  } catch (e) {
    console.error('❌ Erro ao enviar:', e);
    throw e;
  }
};

// ============================================================
// CARREGAR ÁUDIOS
// ============================================================
export const carregarAudiosNuvem = async (): Promise<ItemAudio[]> => {
  try {
    const { data, error } = await supabase.storage
      .from('audios')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    const audios: ItemAudio[] = [];

    for (const ficheiro of data || []) {
      if (ficheiro.name.endsWith('/')) continue;

      const semExtensao = ficheiro.name.replace('.m4a', '');
      const partes = semExtensao.split('__');

      if (partes.length < 5) continue;

      const [id, nome, duracao, data, hora] = partes;

      const { data: urlData } = supabase.storage
        .from('audios')
        .getPublicUrl(ficheiro.name);

      audios.push({
        id,
        uri: urlData.publicUrl,
        nome: nome.replace(/_/g, ' '),
        imagem: null,
        duracao: parseFloat(duracao) || 0,
        data: data.replace(/-/g, '/'),
        hora: hora.replace(/-/g, ':'),
      });
    }

    return audios;
  } catch (e) {
    console.error('❌ Erro ao carregar:', e);
    return [];
  }
};

// ============================================================
// ELIMINAR ÁUDIO
// ============================================================
export const eliminarAudioNuvem = async (id: string): Promise<void> => {
  try {
    const { data } = await supabase.storage.from('audios').list('', { limit: 1000 });

    const ficheiro = data?.find((f) => f.name.startsWith(`${id}__`));

    if (!ficheiro) {
      console.log('Ficheiro não encontrado');
      return;
    }

    await supabase.storage.from('audios').remove([ficheiro.name]);

    console.log('✅ Áudio eliminado!');
  } catch (e) {
    console.error('❌ Erro ao eliminar:', e);
  }
};