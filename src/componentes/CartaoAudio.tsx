// src/componentes/CartaoAudio.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { cores } from '../tema/cores';
import { formatarTempo } from '../servicos/servicoAudio';
import { ItemAudio } from '../contexto/ContextoAudio';

interface Props {
  audio: ItemAudio;
  tocando?: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onShare: () => void;
}

export default function CartaoAudio({
  audio,
  tocando = false,
  onPlay,
  onDelete,
  onEdit,
  onShare,
}: Props) {
  const dataFormatada = audio.data || '29/09/2026';
  const horaFormatada = audio.hora || '14:35';

  return (
    <TouchableOpacity
      style={[styles.card, tocando && styles.cardTocando]}
      onPress={onPlay}
      activeOpacity={0.7}
    >
      <View style={styles.infoContainer}>
        {/* Nome do áudio acima */}
        <Text style={[styles.nome, tocando && { color: cores.azul }]} numberOfLines={1}>
          {audio.nome}
        </Text>

        {/* Duração · Data e Hora abaixo em campo pequeno */}
        <Text style={styles.detalhes}>
          {formatarTempo(audio.duracao)} · {dataFormatada} · {horaFormatada}
        </Text>
      </View>

      {/* Ícones de ação - Estilo Windows 11 */}
      <View style={styles.acoesContainer}>
        <TouchableOpacity
          style={styles.iconeBotao}
          onPress={onEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="edit-2" size={16} color={cores.azulClaro} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconeBotao}
          onPress={onShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="share-2" size={16} color={cores.textoSuave} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconeBotao}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={16} color={cores.vermelhoClaro} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: cores.borda,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTocando: {
    borderColor: cores.azul,
    backgroundColor: cores.fundoClaro,
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  nome: {
    color: cores.texto,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  detalhes: {
    color: cores.textoSuave,
    fontSize: 11,
    fontWeight: '400',
  },
  acoesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconeBotao: {
    padding: 2,
  },
});