export type UserRole = 'super_admin' | 'admin' | 'employee';

export type GranularRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'VIEWER'
  | 'PET_READ'
  | 'PET_WRITE'
  | 'CUSTOMER_READ'
  | 'CUSTOMER_WRITE'
  | 'EMPLOYEE_READ'
  | 'EMPLOYEE_WRITE';

export interface PetUser {
  id: string;
  guid: string;
  username: string;
  email: string;
  name: string;
  app: string;
  tokenType: string;
  expiresIn: number;
  roles: GranularRole[];
  role: UserRole;
}

// --- Customer ---

export interface Customer {
  id?: string;
  publicId?: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerDto {
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

// --- Employee ---

export type EmployeeRole = 'VETERINARIAN' | 'ATTENDANT' | 'ADMINISTRATIVE' | 'MANAGER';

export interface Employee {
  id?: string;
  publicId?: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  role?: EmployeeRole;
  crmv?: string;
  hireDate?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeDto {
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  role?: EmployeeRole;
  crmv?: string;
  hireDate?: string;
}

// --- Pet ---

export type PetSpecies = 'DOG' | 'CAT' | 'BIRD' | 'REPTILE' | 'OTHER';
export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type PetStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED' | 'TRANSFERRED';

export interface PetTutor {
  id?: string;
  publicId?: string;
  customerId?: string;
  customerName?: string;
  primary?: boolean;
}

export interface PetTutorDto {
  customerId: string;
  primary?: boolean;
}

export interface Pet {
  id?: string;
  publicId?: string;
  name: string;
  species?: PetSpecies;
  breed?: string;
  gender?: PetGender;
  birthDate?: string;
  weight?: number;
  color?: string;
  observations?: string;
  tutors?: PetTutor[];
  primaryTutorId?: string;
  primaryTutorName?: string;
  status?: PetStatus;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PetDto {
  name: string;
  species?: PetSpecies;
  breed?: string;
  gender?: PetGender;
  birthDate?: string;
  weight?: number;
  color?: string;
  observations?: string;
  primaryTutorId?: string;
}

// --- Address ---

export interface Address {
  publicId?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CustomerAddress {
  publicId?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  number?: string;
  complement?: string;
  notes?: string;
  isDefault: boolean;
  address: Address;
}

export interface CustomerWithAddresses extends Customer {
  addresses?: CustomerAddress[];
}

export interface AddressDto {
  zipCode: string;
  number?: string;
  complement?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// --- Medical Procedures ---

export type ProcedureType = 'CONSULTATION' | 'SURGERY' | 'EXAM' | 'VACCINATION' | 'GROOMING' | 'OTHER';
export type ProcedureLocation = 'IN_CLINIC' | 'HOME_VISIT' | 'PARTNER' | 'EXTERNAL';
export type ProcedureStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProcedureMedication {
  medicationId: string;
  medicationName?: string;
  quantity: number;
  dosage: string;
  batchId?: string;
}

export interface ProcedureMedicationDto {
  medicationId: string;
  quantity: number;
  dosage: string;
}

export interface MedicalNote {
  content: string;
  authorId?: string;
  createdAt?: string;
}

export interface MedicalNoteDto {
  content: string;
}

export interface MedicalProcedure {
  publicId?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  type: ProcedureType;
  location?: ProcedureLocation;
  description: string;
  date: string;
  cost: number;
  observations?: string;
  status?: ProcedureStatus;
  petId: string;
  petName?: string;
  veterinarianId: string;
  veterinarianName?: string;
  medications?: ProcedureMedication[];
  notes?: MedicalNote[];
}

export interface MedicalProcedureDto {
  type: ProcedureType;
  location?: ProcedureLocation;
  description: string;
  date: string;
  cost: number;
  observations?: string;
  petId: string;
  veterinarianId: string;
  medications?: ProcedureMedicationDto[];
  notes?: MedicalNoteDto[];
}

export interface CompleteProcedureDto {
  medications?: ProcedureMedicationDto[];
  notes?: MedicalNoteDto[];
  observations?: string;
}

// --- Medications ---

export type MedicationType = 'INTERNAL' | 'EXTERNAL' | 'CONTROLLED';

export interface Medication {
  publicId?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  type: MedicationType;
  defaultDosage?: string;
  manufacturer?: string;
  description?: string;
  minimumStock: number;
  currentStock?: number;
}

export interface MedicationDto {
  name: string;
  type: MedicationType;
  defaultDosage?: string;
  manufacturer?: string;
  description?: string;
  minimumStock?: number;
}

// --- Stock Batches ---

export interface StockBatch {
  publicId?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  medicationId: string;
  medicationName?: string;
  batchNumber: string;
  quantity: number;
  initialQuantity: number;
  unitCost: number;
  expirationDate: string;
  entryDate?: string;
  status?: string;
}

export interface StockBatchDto {
  medicationId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  expirationDate: string;
}

export type { SortField, SearchRequest, PaginatedResponse, CurrencyCode, Language, TranslationSet } from '@app/core';
