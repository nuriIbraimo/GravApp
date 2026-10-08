// src/telas/TelaLista.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, TextInput, Modal, Share, Platform,
  ActivityIndicator
} from 'react-native';
import { Audio } from 'expo-av';
import Feather from '@expo/vector-icons/Feather';
import { usarAudios, ItemAudio } from '../contexto/ContextoAudio';
import { formatarTempo } from '../servicos/servicoAudio';
import { eliminarAudioDaApi } from '../services/apiService';
import CartaoAudio from '../componentes/CartaoAudio';
import { cores, espacamento } from '../tema/cores';

// Função auxiliar para confirmar (funciona na web e telemóvel)
const confirmar = (titulo: string, mensagem: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }
  return new Promise((resolve) => {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
};

// Função auxiliar para mostrar mensagem
const mostrarMensagem = (titulo: string, mensagem: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
};

export default function TelaLista({ navigation }: { navigation?: any }) {
  const { audios, setAudios, carregado } = usarAudios();

  const [som, setSom] = useState<Audio.Sound | null>(null);
  const [audioAtual, setAudioAtual] = useState<ItemAudio | null>(null);
  const [tocando, setTocando] = useState<boolean>(false);
  const [posicao, setPosicao] = useState<number>(0);
  const [duracao, setDuracao] = useState<number>(0);

  const [editando, setEditando] = useState<ItemAudio | null>(null);
  const [nomeEdit, setNomeEdit] = useState<string>('');

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (som) {
        som.unloadAsync().catch(() => {});
      }
    };
  }, [som]);

  // Tocar ou pausar áudio
  const tocarOuPausar = async (audio: ItemAudio) => {
    try {
      if (audioAtual?.id === audio.id && som) {
        if (tocando) {
          await som.pauseAsync();
          setTocando(false);
        } else {
          await som.playAsync();
          setTocando(true);
        }
        return;
      }

      if (som) {
        await som.unloadAsync();
        setSom(null);
        setTocando(false);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audio.uri },
        { shouldPlay: true }
      );

      setSom(sound);
      setAudioAtual(audio);
      setTocando(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosicao(status.positionMillis / 1000);
          setDuracao((status.durationMillis || 0) / 1000);
          setTocando(status.isPlaying);
          if (status.didJustFinish) {
            setTocando(false);
            setPosicao(0);
          }
        }
      });
    } catch (e: any) {
      mostrarMensagem('Erro', 'Não foi possível tocar o áudio.');
    }
  };

  const pausarOuRetomarPlayer = async () => {
    if (!som) return;
    try {
      if (tocando) {
        await som.pauseAsync();
        setTocando(false);
      } else {
        await som.playAsync();
        setTocando(true);
      }
    } catch (e) {
      console.error('Erro:', e);
    }
  };

  const saltar = async (segundos: number) => {
    if (som) {
      const novaPos = Math.max(0, Math.min(duracao, posicao + segundos));
      await som.setPositionAsync(novaPos * 1000);
    }
  };

  // ✅ ELIMINAR ÁUDIO
  const eliminar = async (id: string) => {
    const confirmado = await confirmar(
      'Eliminar áudio',
      'Tens a certeza que queres eliminar este áudio?'
    );

    if (!confirmado) return;

    try {
      if (audioAtual?.id === id && som) {
        await som.unloadAsync().catch(() => {});
        setSom(null);
        setAudioAtual(null);
        setTocando(false);
      }

      // Eliminar da lista local (guardado no AsyncStorage via Contexto)
      setAudios(audios.filter((a) => a.id !== id));

      // Tentar eliminar na API REST backend em background
      eliminarAudioDaApi(id).catch(() => {});
    } catch (e) {
      console.log('Erro ao eliminar:', e);
      mostrarMensagem('Erro', 'Não foi possível eliminar.');
    }
  };

  const abrirEdicao = (audio: ItemAudio) => {
    setEditando(audio);
    setNomeEdit(audio.nome);
  };

  const guardarEdicao = () => {
    if (!editando) return;
    if (!nomeEdit.trim()) {
      mostrarMensagem('Aviso', 'O nome não pode estar vazio.');
      return;
    }

    const novosAudios = audios.map((a) =>
      a.id === editando.id ? { ...a, nome: nomeEdit.trim() } : a
    );
    setAudios(novosAudios);
    setEditando(null);
  };

  const minimizarPlayer = async () => {
    if (som) {
      await som.pauseAsync().catch(() => {});
    }
    setTocando(false);
    setAudioAtual(null);
  };

  // Partilhar
  const partilharAudio = async (audio: ItemAudio) => {
    try {
      const mensagem = `🎵 ${audio.nome}\nDuração: ${formatarTempo(audio.duracao)}\n${audio.uri}`;

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: audio.nome,
            text: mensagem,
          });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(mensagem);
          window.alert('✅ Link copiado para a área de transferência!');
        } else {
          window.alert(`Link do áudio:\n${audio.uri}`);
        }
        return;
      }

      await Share.share({
        title: audio.nome,
        message: mensagem,
      });
    } catch (e: any) {
      console.log('Erro ao partilhar:', e);
    }
  };

  // Loading inicial
  if (!carregado) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={cores.azul} />
        <Text style={{ color: cores.textoSuave, marginTop: 12 }}>
          A carregar a biblioteca...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Biblioteca</Text>
          <Text style={styles.subtitulo}>{audios.length} gravação(ões)</Text>
        </View>
        <TouchableOpacity
          style={styles.botaoNuvemHeader}
          onPress={() => navigation?.navigate('Upload')}
        >
          <Text style={{ fontSize: 22 }}>☁️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {audios.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Feather name="music" size={44} color={cores.textoMuitoSuave} style={{ marginBottom: 12 }} />
            <Text style={styles.vazioTexto}>Sem gravações</Text>
            <Text style={styles.vazioSubtexto}>
              Grava o teu primeiro áudio na Home!
            </Text>
          </View>
        ) : (
          audios.map((item) => (
            <CartaoAudio
              key={item.id}
              audio={item}
              tocando={audioAtual?.id === item.id && tocando}
              onPlay={() => tocarOuPausar(item)}
              onEdit={() => abrirEdicao(item)}
              onShare={() => partilharAudio(item)}
              onDelete={() => eliminar(item.id)}
            />
          ))
        )}
      </ScrollView>

      {audioAtual && (
        <View style={styles.playerContainer}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerNome} numberOfLines={1}>
              {audioAtual.nome}
            </Text>
            <TouchableOpacity
              style={styles.botaoMinimizar}
              onPress={minimizarPlayer}
            >
              <Feather name="minus" size={18} color={cores.textoSuave} />
            </TouchableOpacity>
          </View>

          <Text style={styles.playerTempo}>
            {formatarTempo(posicao)} / {formatarTempo(duracao)}
          </Text>

          <View style={styles.barraFundo}>
            <View
              style={[
                styles.barraProgresso,
                { width: `${duracao > 0 ? (posicao / duracao) * 100 : 0}%` },
              ]}
            />
          </View>

          <View style={styles.playerControlos}>
            <TouchableOpacity style={styles.botaoSkip} onPress={() => saltar(-5)}>
              <Feather name="rotate-ccw" size={12} color={cores.texto} style={{ marginRight: 4 }} />
              <Text style={styles.textoSkip}>5s</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoPlayPlayer} onPress={pausarOuRetomarPlayer}>
              {tocando ? (
                <Feather name="pause" size={18} color={cores.texto} />
              ) : (
                <Feather name="play" size={18} color={cores.texto} style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoSkip} onPress={() => saltar(5)}>
              <Text style={styles.textoSkip}>5s</Text>
              <Feather name="rotate-cw" size={12} color={cores.texto} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={!!editando} transparent animationType="slide">
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Editar nome</Text>

            <TextInput
              style={styles.input}
              value={nomeEdit}
              onChangeText={setNomeEdit}
              placeholder="Nome do áudio"
              placeholderTextColor={cores.textoSuave}
              autoFocus
            />

            <TouchableOpacity style={styles.botaoGuardarModal} onPress={guardarEdicao}>
              <Text style={styles.textoBotaoModal}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCancelarModal}
              onPress={() => setEditando(null)}
            >
              <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo, paddingTop: 45 },
  header: { paddingHorizontal: espacamento.grande, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  botaoNuvemHeader: { padding: 8, backgroundColor: cores.fundoClaro, borderRadius: 12, borderWidth: 1, borderColor: cores.borda },
  titulo: { fontSize: 26, fontWeight: 'bold', color: cores.texto },
  subtitulo: { fontSize: 13, color: cores.textoSuave, marginTop: 2 },
  scrollContent: { paddingHorizontal: espacamento.grande, paddingBottom: 220 },
  vazioContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  vazioTexto: { color: cores.texto, fontSize: 18, fontWeight: 'bold' },
  vazioSubtexto: { color: cores.textoSuave, fontSize: 14, marginTop: 8, textAlign: 'center' },
  playerContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: cores.fundoCartao,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 14, borderTopWidth: 1, borderColor: cores.borda,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  playerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  playerNome: { color: cores.texto, fontSize: 15, fontWeight: 'bold', flex: 1, marginRight: 8 },
  botaoMinimizar: { padding: 4, borderRadius: 4 },
  playerTempo: { color: cores.textoSuave, fontSize: 11, marginTop: 2 },
  barraFundo: { height: 4, backgroundColor: cores.fundoClaro, borderRadius: 2, marginVertical: 8, overflow: 'hidden' },
  barraProgresso: { height: 4, backgroundColor: cores.azul, borderRadius: 2 },
  playerControlos: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  botaoSkip: { backgroundColor: cores.fundoClaro, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  textoSkip: { color: cores.texto, fontSize: 12, fontWeight: '600' },
  botaoPlayPlayer: { width: 44, height: 44, borderRadius: 22, backgroundColor: cores.azul, justifyContent: 'center', alignItems: 'center' },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', padding: espacamento.grande },
  modalCard: { backgroundColor: cores.fundoCartao, borderRadius: 20, padding: espacamento.grande, borderWidth: 1, borderColor: cores.borda },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: cores.texto, textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: cores.fundoClaro, borderRadius: 12, padding: 14, color: cores.texto, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: cores.borda },
  botaoGuardarModal: { backgroundColor: cores.azul, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  textoBotaoModal: { color: cores.texto, fontWeight: 'bold', fontSize: 16 },
  botaoCancelarModal: { backgroundColor: 'transparent', padding: 12, borderRadius: 12, alignItems: 'center' },
  textoBotaoCancelar: { color: cores.vermelhoClaro, fontWeight: '600', fontSize: 15 },
});