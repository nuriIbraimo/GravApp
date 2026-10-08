/**
 * Tela de Upload (UploadScreen.js)
 * Permite ao utilizador enviar os áudios locais para a API REST backend Node.js + Express
 * e sincronizar/listar os áudios presentes na nuvem/servidor.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { usarAudios } from '../contexto/ContextoAudio';
import {
  enviarAudioParaApi,
  buscarAudiosDaApi,
  eliminarAudioDaApi,
  API_URL,
} from '../services/apiService';
import { cores, espacamento } from '../tema/cores';

export default function UploadScreen() {
  const { audios, setAudios } = usarAudios();
  const [carregando, setCarregando] = useState(false);
  const [audiosNuvem, setAudiosNuvem] = useState([]);
  const [enviandoId, setEnviandoId] = useState(null);

  // Carregar os áudios da API quando a tela é aberta
  const carregarNuvem = async () => {
    setCarregando(true);
    try {
      const lista = await buscarAudiosDaApi();
      setAudiosNuvem(lista);
    } catch (e) {
      console.log('API offline ou inacessível:', e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarNuvem();
  }, []);

  // Enviar um áudio local específico para a API
  const handleUpload = async (item) => {
    setEnviandoId(item.id);
    try {
      const resultado = await enviarAudioParaApi(item);
      Alert.alert('Sucesso!', `O áudio "${resultado.nome}" foi enviado para a API.`);
      carregarNuvem();
    } catch (e) {
      Alert.alert('Erro no Upload', 'Certifica-te que o servidor backend está a rodar na porta 3000.\n' + e.message);
    } finally {
      setEnviandoId(null);
    }
  };

  // Eliminar um áudio da API
  const handleEliminarNuvem = async (id) => {
    Alert.alert('Eliminar da Nuvem', 'Queres eliminar este áudio do servidor API?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarAudioDaApi(id);
            setAudiosNuvem(audiosNuvem.filter((a) => String(a.id) !== String(id)));
            Alert.alert('Sucesso', 'Áudio eliminado do servidor.');
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>☁️ Sincronização API</Text>
        <Text style={styles.subtitulo}>Servidor: {API_URL}</Text>
      </View>

      <TouchableOpacity
        style={styles.botaoAtualizar}
        onPress={carregarNuvem}
        disabled={carregando}
      >
        <Text style={styles.textoBotaoAtualizar}>
          {carregando ? 'A carregar...' : '🔄 Atualizar Lista da API'}
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECÇÃO 1: ÁUDIOS LOCAIS PRONTOS PARA UPLOAD */}
        <Text style={styles.seccaoTitulo}>Áudios Locais ({audios.length})</Text>

        {audios.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhum áudio local gravado.</Text>
        ) : (
          audios.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.nomeAudio}>{item.nome}</Text>
                <Text style={styles.detalhes}>
                  {item.data} · {item.hora}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.botaoUpload}
                onPress={() => handleUpload(item)}
                disabled={enviandoId === item.id}
              >
                {enviandoId === item.id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.textoBotaoUpload}>☁️ Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* SECÇÃO 2: ÁUDIOS GUARDADOS NA API REST */}
        <Text style={[styles.seccaoTitulo, { marginTop: 24 }]}>
          Guardados no Servidor API ({audiosNuvem.length})
        </Text>

        {audiosNuvem.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhum áudio enviado para a API ainda.</Text>
        ) : (
          audiosNuvem.map((item) => (
            <View key={item.id} style={[styles.card, styles.cardNuvem]}>
              <View style={styles.info}>
                <Text style={styles.nomeAudio}>{item.nome}</Text>
                <Text style={styles.detalhes}>
                  ID: {item.id} · {item.data}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.botaoEliminarNuvem}
                onPress={() => handleEliminarNuvem(item.id)}
              >
                <Text style={styles.textoEliminar}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: espacamento.grande,
    marginBottom: 14,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.texto,
  },
  subtitulo: {
    fontSize: 12,
    color: cores.textoSuave,
    marginTop: 4,
  },
  botaoAtualizar: {
    marginHorizontal: espacamento.grande,
    backgroundColor: cores.fundoClaro,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  textoBotaoAtualizar: {
    color: cores.azulClaro,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: espacamento.grande,
    paddingBottom: 100,
  },
  seccaoTitulo: {
    color: cores.texto,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textoVazio: {
    color: cores.textoSuave,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  card: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: cores.borda,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardNuvem: {
    borderColor: cores.azul,
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  nomeAudio: {
    color: cores.texto,
    fontSize: 15,
    fontWeight: 'bold',
  },
  detalhes: {
    color: cores.textoSuave,
    fontSize: 11,
    marginTop: 2,
  },
  botaoUpload: {
    backgroundColor: cores.azul,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  textoBotaoUpload: {
    color: cores.texto,
    fontWeight: 'bold',
    fontSize: 13,
  },
  botaoEliminarNuvem: {
    padding: 6,
  },
  textoEliminar: {
    fontSize: 18,
  },
});
