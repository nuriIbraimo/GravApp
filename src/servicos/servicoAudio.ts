// src/servicos/servicoAudio.ts
import { Audio } from 'expo-av';
import type { ItemAudio } from '../contexto/ContextoAudio';

// 1. Pedir permissão do microfone
export const pedirPermissao = async (): Promise<boolean> => {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
};

// 2. Criar gravação com metering ativado
export const criarGravacao = async (): Promise<Audio.Recording> => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const opcoesGravacao = {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  };

  const { recording } = await Audio.Recording.createAsync(opcoesGravacao);
  return recording;
};

// 3. Parar gravação
export const pararGravacao = async (
  recording: Audio.Recording
): Promise<string | null> => {
  await recording.stopAndUnloadAsync();
  return recording.getURI();
};

// 4. Formatar tempo (segundos → MM:SS)
export const formatarTempo = (segundos: number): string => {
  if (!segundos || segundos < 0) return '00:00';
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
};

// 5. Criar objeto de áudio com data (DD/MM/AAAA) e hora (HH:MM)
export const criarAudio = (
  uri: string | null,
  nome: string,
  imagem: string | null
): ItemAudio => {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');

  return {
    id: Date.now().toString(),
    uri: uri || '',
    nome: nome || `Áudio ${horas}:${minutos}`,
    imagem: imagem || null,
    duracao: 0,
    data: `${dia}/${mes}/${ano}`,
    hora: `${horas}:${minutos}`,
  };
};