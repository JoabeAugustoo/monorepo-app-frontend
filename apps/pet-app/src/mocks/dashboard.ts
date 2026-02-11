import { Pet, Especie } from '../types/pet';

export function contarPorEspecie(pets: Pet[]): Record<Especie, number> {
  return pets.reduce(
    (acc, pet) => {
      acc[pet.especie] = (acc[pet.especie] || 0) + 1;
      return acc;
    },
    { Cao: 0, Gato: 0, Ave: 0, Outro: 0 } as Record<Especie, number>,
  );
}

export function totalPets(pets: Pet[]): number {
  return pets.length;
}

export function cadastrosRecentes(pets: Pet[], limite = 5): Pet[] {
  return [...pets]
    .sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime())
    .slice(0, limite);
}

export function mediaIdade(pets: Pet[]): number {
  if (pets.length === 0) return 0;
  const soma = pets.reduce((acc, pet) => acc + pet.idade, 0);
  return Math.round((soma / pets.length) * 10) / 10;
}
