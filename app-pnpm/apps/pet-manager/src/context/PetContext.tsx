import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Pet } from '../types/pet';
import { petsMock } from '../mocks/pets';

interface PetContextType {
  pets: Pet[];
  adicionarPet: (pet: Omit<Pet, 'id' | 'dataCadastro'>) => void;
  atualizarPet: (id: string, pet: Omit<Pet, 'id' | 'dataCadastro'>) => void;
  removerPet: (id: string) => void;
  buscarPetPorId: (id: string) => Pet | undefined;
}

const PetContext = createContext<PetContextType | null>(null);

export function PetProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>(petsMock);

  const adicionarPet = useCallback((dados: Omit<Pet, 'id' | 'dataCadastro'>) => {
    const novoPet: Pet = {
      ...dados,
      id: uuidv4(),
      dataCadastro: new Date().toISOString().split('T')[0],
    };
    setPets((prev) => [...prev, novoPet]);
  }, []);

  const atualizarPet = useCallback((id: string, dados: Omit<Pet, 'id' | 'dataCadastro'>) => {
    setPets((prev) =>
      prev.map((pet) => (pet.id === id ? { ...pet, ...dados } : pet)),
    );
  }, []);

  const removerPet = useCallback((id: string) => {
    setPets((prev) => prev.filter((pet) => pet.id !== id));
  }, []);

  const buscarPetPorId = useCallback(
    (id: string) => {
      return pets.find((pet) => pet.id === id);
    },
    [pets],
  );

  return (
    <PetContext.Provider value={{ pets, adicionarPet, atualizarPet, removerPet, buscarPetPorId }}>
      {children}
    </PetContext.Provider>
  );
}

export function usePets() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets deve ser usado dentro de PetProvider');
  }
  return context;
}
