/**
 * Contexto de Áudio (AudioContext.js)
 * Provede a lista de áudios e persistência local para os componentes.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { carregarAudiosLocais, salvarAudiosLocais } from '../services/storageService';

const AudioContext = createContext({
  audios: [],
  setAudios: () => {},
  carregado: false,
});

export const AudioProvider = ({ children }) => {
  const [audios, setAudiosState] = useState([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dadosLocais = await carregarAudiosLocais();
        setAudiosState(dadosLocais);
      } catch (e) {
        console.error('Erro ao carregar áudios locais:', e);
      } finally {
        setCarregado(true);
      }
    };
    carregar();
  }, []);

  useEffect(() => {
    if (carregado) {
      salvarAudiosLocais(audios);
    }
  }, [audios, carregado]);

  return (
    <AudioContext.Provider value={{ audios, setAudios: setAudiosState, carregado }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
export default AudioContext;
