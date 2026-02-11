import { useState, useCallback } from 'react';

export function useSidebar(initialOpen = true) {
  const [aberto, setAberto] = useState(initialOpen);

  const alternar = useCallback(() => {
    setAberto((prev) => !prev);
  }, []);

  const abrir = useCallback(() => {
    setAberto(true);
  }, []);

  const fechar = useCallback(() => {
    setAberto(false);
  }, []);

  return { aberto, alternar, abrir, fechar };
}
