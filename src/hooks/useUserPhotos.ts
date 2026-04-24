import { useState, useEffect } from "react";
import { api } from "../services/api";

export const useUserPhotos = (donoDoPostId: string | number, prestadorSelecionadoId: string | number, isOpen: boolean) => {
  const [userImageMap, setUserImageMap] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (isOpen) {
      const buscarFotos = async () => {
        try {
          const resDono = await api.get(`/cadastro/getcadastro/${donoDoPostId}`);
          const resPrestador = await api.get(`/cadastro/getcadastro/${prestadorSelecionadoId}`);
          
          setUserImageMap({
            [Number(donoDoPostId)]: resDono.data.imagemUrl || null,
            [Number(prestadorSelecionadoId)]: resPrestador.data.imagemUrl || null,
          });
        } catch (error) {
          console.error("Erro ao buscar fotos:", error);
        }
      };
      buscarFotos();
    }
  }, [isOpen, donoDoPostId, prestadorSelecionadoId]);

  return { userImageMap };
};
