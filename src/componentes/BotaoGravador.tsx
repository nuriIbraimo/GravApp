// src/componentes/BotaoGravador.tsx
import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { cores } from '../tema/cores';

interface Props {
  gravando: boolean;
  pausado?: boolean;
  onPress: () => void;
}

export default function BotaoGravador({ gravando, pausado = false, onPress }: Props) {
  const batimento = useRef(new Animated.Value(1)).current;

  // Animação de batimento (scale 1 → 1.08 → 1) em loop de 800ms durante gravação
  useEffect(() => {
    let animacao: Animated.CompositeAnimation | null = null;

    if (gravando && !pausado) {
      animacao = Animated.loop(
        Animated.sequence([
          Animated.timing(batimento, {
            toValue: 1.08,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(batimento, {
            toValue: 1.0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      animacao.start();
    } else {
      Animated.timing(batimento, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animacao) animacao.stop();
    };
  }, [gravando, pausado, batimento]);

  // Determinar cor do botão
  let corFundo = cores.azul; // Azul quando pronto (#2196F3)
  if (gravando && !pausado) {
    corFundo = cores.vermelho; // Vermelho quando grava (#E53935)
  } else if (pausado) {
    corFundo = cores.textoSuave; // Cinza quando pausado (#9E9E9E)
  }

  return (
    <Animated.View style={{ transform: [{ scale: batimento }] }}>
      <TouchableOpacity
        style={[styles.botao, { backgroundColor: corFundo, shadowColor: corFundo }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {!gravando ? (
          <Text style={styles.textoGravar}>Gravar</Text>
        ) : !pausado ? (
          <Feather name="pause" size={30} color="#FFFFFF" />
        ) : (
          <Feather name="play" size={30} color="#FFFFFF" style={{ marginLeft: 3 }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  botao: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  textoGravar: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});