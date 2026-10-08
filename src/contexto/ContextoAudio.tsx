// src/contexto/ContextoAudio.tsx
import React, {
  createContext, useContext, useState, useEffect, ReactNode
} from 'react';
import { carregarAudiosLocais, salvarAudiosLocais } from '../services/storageService';

export interface ItemAudio {
  id: string;
  uri: string;
  nome: string;
  imagem: string | null;
  duracao: number;
  data: string;
  hora: string;
}

interface TipoContexto {
  audios: ItemAudio[];
  setAudios: (audios: ItemAudio[]) => void;
  recarregar: () => Promise<void>;
  carregado: boolean;
}

const ContextoAudio = createContext<TipoContexto>({
  audios: [],
  setAudios: () => {},
  recarregar: async () => {},
  carregado: false,
});

export const ProvedorAudio = ({ children }: { children: ReactNode }) => {
  const [audios, setAudiosState] = useState<ItemAudio[]>([]);
  const [carregado, setCarregado] = useState(false);

  // Carregar os áudios guardados no AsyncStorage no arranque
  const recarregar = async () => {
    try {
      const listaLocais = await carregarAudiosLocais();
      setAudiosState(listaLocais);
    } catch (e) {
      console.error('Erro ao carregar do AsyncStorage:', e);
    } finally {
      setCarregado(true);
    }
  };

  useEffect(() => {
    recarregar();
  }, []);

  // Guardar automaticamente no AsyncStorage sempre que a lista mudar (após carregamento inicial)
  useEffect(() => {
    if (carregado) {
      salvarAudiosLocais(audios);
    }
  }, [audios, carregado]);

  const setAudios = (novos: ItemAudio[]) => {
    setAudiosState(novos);
  };

  return (
    <ContextoAudio.Provider value={{ audios, setAudios, recarregar, carregado }}>
      {children}
    </ContextoAudio.Provider>
  );
};

export const usarAudios = () => useContext(ContextoAudio);