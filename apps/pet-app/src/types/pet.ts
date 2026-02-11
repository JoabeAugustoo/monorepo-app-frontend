export type Especie = 'Cao' | 'Gato' | 'Ave' | 'Outro';
export type Sexo = 'Macho' | 'Femea';

export interface Vacina {
  nome: string;
  data: string;
}

export interface Pet {
  id: string;
  nome: string;
  especie: Especie;
  raca: string;
  idade: number;
  sexo: Sexo;
  nomeTutor: string;
  telefoneTutor: string;
  emailTutor: string;
  vacinas: Vacina[];
  peso: number;
  observacoes: string;
  dataCadastro: string;
}
