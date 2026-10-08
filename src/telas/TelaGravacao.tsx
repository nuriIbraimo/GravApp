// src/telas/TelaGravacao.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  TextInput, Modal, TouchableOpacity
} from 'react-native';
import { Audio } from 'expo-av';
import Feather from '@expo/vector-icons/Feather';
import BotaoGravador from '../componentes/BotaoGravador';
import OndaViva from '../componentes/OndaViva';
import {
  pedirPermissao, criarGravacao, pararGravacao,
  formatarTempo, criarAudio
} from '../servicos/servicoAudio';
import { enviarAudioParaApi } from '../services/apiService';
import { usarAudios } from '../contexto/ContextoAudio';
import { cores, espacamento } from '../tema/cores';

export default function TelaGravacao() {
  const { audios, setAudios } = usarAudios();

  const [gravando, setGravando] = useState<boolean>(false);
  const [pausado, setPausado] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [segundos, setSegundos] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);

  const [modalVisivel, setModalVisivel] = useState<boolean>(false);
  const [uriTemporario, setUriTemporario] = useState<string | null>(null);
  const [nomeTemp, setNomeTemp] = useState<string>('');
  const [aGuardar, setAGuardar] = useState<boolean>(false);

  // Cronómetro
  useEffect(() => {
    let interval: any;
    if (gravando && !pausado) {
      interval = setInterval(() => setSegundos((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gravando, pausado]);

  // Ação de premir o Botão Gravador
  const handlePressGravador = async () => {
    if (!gravando) {
      const permitido = await pedirPermissao();
      if (!permitido) {
        Alert.alert('Permissão negada', 'É necessária permissão para aceder ao microfone.');
        return;
      }

      try {
        const rec = await criarGravacao();

        rec.setOnRecordingStatusUpdate((status) => {
          if (status.isRecording && status.metering !== undefined) {
            const db = status.metering;
            const norm = Math.max(0, Math.min(1, (db + 60) / 60));
            setVolume(norm);
          }
        });

        setRecording(rec);
        setSegundos(0);
        setVolume(0);
        setGravando(true);
        setPausado(false);
      } catch (e: any) {
        Alert.alert('Erro', 'Não foi possível iniciar a gravação: ' + (e.message || e));
      }
    } else {
      if (!recording) return;

      try {
        if (!pausado) {
          await recording.pauseAsync();
          setPausado(true);
          setVolume(0);
        } else {
          await recording.startAsync();
          setPausado(false);
        }
      } catch (e: any) {
        console.error('Erro ao pausar/retomar:', e);
      }
    }
  };

  // Parar e Guardar
  const handlePararEGuardar = async () => {
    if (!recording) return;

    try {
      const uri = await pararGravacao(recording);
      setUriTemporario(uri);
      setNomeTemp(`Áudio ${audios.length + 1}`);
      setGravando(false);
      setPausado(false);
      setRecording(null);
      setVolume(0);
      setModalVisivel(true);
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível parar a gravação: ' + (e.message || e));
    }
  };

  // ✅ GUARDAR LOCALMENTE E SINCRONIZAR EM BACKGROUND
  const handleSalvar = async () => {
    if (!nomeTemp.trim()) {
      Alert.alert('Aviso', 'O nome da gravação não pode estar vazio.');
      return;
    }

    if (aGuardar) return;
    setAGuardar(true);

    try {
      const novoAudio = criarAudio(uriTemporario, nomeTemp.trim(), null);
      novoAudio.duracao = segundos;

      // 1. Guardar localmente no contexto (AsyncStorage automático)
      setAudios([novoAudio, ...audios]);

      // 2. Tentar enviar para a API REST backend em background (sem bloquear o app se estiver offline)
      enviarAudioParaApi(novoAudio).catch((err) => {
        console.log('Servidor API offline ou inacessível. Áudio mantido apenas localmente:', err.message);
      });

      setModalVisivel(false);
      setUriTemporario(null);
      setSegundos(0);
      Alert.alert('Guardado!', 'O teu áudio foi guardado com sucesso.');
    } catch (e: any) {
      console.error('Erro ao guardar localmente:', e);
      Alert.alert('Erro', 'Não foi possível guardar o áudio localmente.');
    } finally {
      setAGuardar(false);
    }
  };

  const handleDescartar = () => {
    setModalVisivel(false);
    setUriTemporario(null);
    setSegundos(0);
  };

  return (
    <View style={styles.container}>
      {/* Topo: Cronómetro */}
      <View style={styles.topoContainer}>
        <Text style={styles.cronometro}>{formatarTempo(segundos)}</Text>
        <Text style={styles.estadoTexto}>
          {gravando
            ? pausado
              ? 'Pausado'
              : 'A gravar...'
            : 'Pronto para gravar'}
        </Text>
      </View>

      {/* Centro: Onda Viva */}
      <View style={styles.centroContainer}>
        <OndaViva volume={volume} gravando={gravando} pausado={pausado} />
      </View>

      {/* Base: Botões */}
      <View style={styles.baseContainer}>
        <BotaoGravador
          gravando={gravando}
          pausado={pausado}
          onPress={handlePressGravador}
        />

        {gravando && (
          <TouchableOpacity
            style={styles.botaoParar}
            onPress={handlePararEGuardar}
            activeOpacity={0.8}
          >
            <Feather name="square" size={13} color={cores.texto} style={{ marginRight: 8 }} />
            <Text style={styles.textoBotaoParar}>Parar e guardar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal para nomear */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Guardar gravação</Text>
            <Text style={styles.modalSubtitulo}>
              Duração: {formatarTempo(segundos)}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do áudio"
              placeholderTextColor={cores.textoSuave}
              value={nomeTemp}
              onChangeText={setNomeTemp}
              autoFocus
              editable={!aGuardar}
            />

            <TouchableOpacity
              style={[styles.botaoGuardar, aGuardar && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={aGuardar}
            >
              <Text style={styles.textoBotaoModal}>
                {aGuardar ? 'A guardar...' : 'Guardar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoDescartar}
              onPress={handleDescartar}
              disabled={aGuardar}
            >
              <Text style={styles.textoBotaoDescartar}>Descartar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    paddingHorizontal: espacamento.grande,
    paddingTop: 50,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  cronometro: {
    fontSize: 56,
    fontWeight: '200',
    color: cores.texto,
    letterSpacing: 2,
  },
  estadoTexto: {
    fontSize: 14,
    color: cores.textoSuave,
    marginTop: 4,
  },
  centroContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginVertical: 10,
  },
  baseContainer: {
    alignItems: 'center',
    marginBottom: 45,
    minHeight: 140,
    justifyContent: 'center',
  },
  botaoParar: {
    backgroundColor: cores.vermelho,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoParar: {
    color: cores.texto,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: espacamento.grande,
  },
  modalCard: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 20,
    padding: espacamento.grande,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    textAlign: 'center',
  },
  modalSubtitulo: {
    color: cores.textoSuave,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    fontSize: 13,
  },
  input: {
    backgroundColor: cores.fundoClaro,
    borderRadius: 12,
    padding: 14,
    color: cores.texto,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  botaoGuardar: {
    backgroundColor: cores.azul,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  textoBotaoModal: {
    color: cores.texto,
    fontWeight: 'bold',
    fontSize: 16,
  },
  botaoDescartar: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoBotaoDescartar: {
    color: cores.vermelhoClaro,
    fontWeight: '600',
    fontSize: 15,
  },
});