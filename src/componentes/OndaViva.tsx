// src/componentes/OndaViva.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { cores } from '../tema/cores';

interface Props {
  volume: number; // 0.0 a 1.0
  gravando: boolean;
  pausado: boolean;
}

const TOTAL_BARRAS = 40;

export default function OndaViva({ volume, gravando, pausado }: Props) {
  // 40 Animated.Value para as alturas de cada barra
  const alturas = useRef(
    Array.from({ length: TOTAL_BARRAS }, () => new Animated.Value(4))
  ).current;

  useEffect(() => {
    if (!gravando || pausado) {
      // Quando não grava ou está pausado, todas as barras voltam a 4px
      const animacoes = alturas.map((altura) =>
        Animated.timing(altura, {
          toValue: 4,
          duration: 200,
          useNativeDriver: false,
        })
      );
      Animated.parallel(animacoes).start();
      return;
    }

    // Quando está a gravar, calcula a altura para cada barra
    const animacoes = alturas.map((altura, i) => {
      // Distância normalizada em relação ao centro (0 no centro, 1 nas extremidades)
      const distCentro = Math.abs(i - (TOTAL_BARRAS - 1) / 2) / ((TOTAL_BARRAS - 1) / 2);
      
      // Fator de pico no centro (mais alto no meio ~1.0, mais baixo nas pontas ~0.3)
      const fatorCentro = Math.max(0.2, 1 - Math.pow(distCentro, 1.4) * 0.75);

      // Variação orgânica para dar movimento individual às barras
      const variacao = 0.6 + Math.sin(i * 0.7 + Date.now() * 0.01) * 0.4;

      // Volume ajustado
      const volLimpo = Math.max(0, Math.min(1, volume));

      // Altura alvo entre 4px e 90px
      const alturaAlvo = Math.max(
        4,
        Math.min(90, 4 + volLimpo * 86 * fatorCentro * variacao)
      );

      return Animated.timing(altura, {
        toValue: alturaAlvo,
        duration: 120,
        useNativeDriver: false,
      });
    });

    Animated.parallel(animacoes).start();
  }, [volume, gravando, pausado]);

  return (
    <View style={styles.container}>
      {alturas.map((altura, i) => {
        // Barras da esquerda (0 a 19): vermelho | Barras da direita (20 a 39): branco
        const ehEsquerda = i < TOTAL_BARRAS / 2;
        const corBarra = ehEsquerda ? cores.vermelho : cores.texto;

        return (
          <Animated.View
            key={i}
            style={[
              styles.barra,
              {
                height: altura,
                backgroundColor: corBarra,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100%',
    paddingHorizontal: 10,
  },
  barra: {
    width: 3,
    marginHorizontal: 1.5,
    borderRadius: 2,
    minHeight: 4,
  },
});
