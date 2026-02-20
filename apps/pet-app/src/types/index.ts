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
  | 'EMPLOYEE_WRITE'
  | 'MEDICALPROCEDURE_READ'
  | 'MEDICALPROCEDURE_WRITE'
  | 'MEDICATION_READ'
  | 'MEDICATION_WRITE'
  | 'STOCKBATCH_READ'
  | 'STOCKBATCH_WRITE'
  | 'STOCKMOVEMENT_READ'
  | 'STOCKMOVEMENT_WRITE'
  | 'REVENUE_READ'
  | 'REVENUE_WRITE'
  | 'EXPENSE_READ'
  | 'EXPENSE_WRITE'
  | 'DEBT_READ'
  | 'DEBT_WRITE'
  | 'FINANCIALREPORT_READ'
  | 'TEMPLATE_READ'
  | 'TEMPLATE_WRITE'
  | 'DOCUMENT_READ'
  | 'DOCUMENT_WRITE'
  | 'REPORT_READ'
  | 'REPORT_WRITE'
  | 'APPLICATION_READ'
  | 'CLINIC_READ'
  | 'CLINIC_WRITE';

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
  hasAuthAccess?: boolean;
  authUserGuid?: string;
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
  createAuthUser?: boolean;
}

export interface EmployeeCreateResponse extends Employee {
  generatedUserName?: string;
  generatedPassword?: string;
  isExistingUser?: boolean;
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

// --- Documents & Signatures ---
export type DocumentType = 'SIGNATURE_REQUIRED' | 'SEND_ONLY';
export type DocumentStatus = 'PENDING' | 'SENT' | 'AWAITING_SIGNATURE' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';

export type DocumentLifecycleStatus =
  | 'GENERATING'
  | 'REPORT_FAILED'
  | 'REPORT_COMPLETED'
  | 'NO_SIGNATURE_REQUIRED'
  | 'UPLOADING_TO_SIGNATURE'
  | 'AWAITING_SIGNATURES'
  | 'PARTIALLY_SIGNED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED';
export type TemplateEngine = 'HANDLEBARS' | 'HTML';
export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type SpeciesSpecific = 'NO' | 'YES' | 'DEPENDS';
export type SignatureRequirement = 'NO' | 'YES' | 'OPTIONAL';

export interface DocumentTemplate {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  key: string;
  name: string;
  description?: string;
  engine: TemplateEngine;
  status: TemplateStatus;
  documentType: DocumentType;
  categoryId?: string;
  categoryName?: string;
  applicationId: string;
  applicationName: string;
  applicationCode: string;
  activeVersion?: number;
  speciesSpecific: SpeciesSpecific;
  tutorSignature: SignatureRequirement;
  vetSignature: SignatureRequirement;
}

export interface TemplateCategory {
  publicId: string;
  name: string;
  description?: string;
  applicationId: string;
  applicationName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSearchRequest {
  name?: string;
  key?: string;
  status?: TemplateStatus;
  engine?: TemplateEngine;
  documentType?: DocumentType;
  categoryId?: string;
  skip?: number;
  take?: number;
}

export interface TemplateSearchResponse {
  data: DocumentTemplate[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DocumentRecord {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  templateKey: string;
  templateName: string;
  templateVersion: number;
  documentType: DocumentType;
  status: DocumentStatus;
  petId: string;
  petName: string;
  customerId: string;
  customerName: string;
  sentAt?: string;
  signedAt?: string;
  expiresAt?: string;
}

export interface DocumentTracking {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  reportId?: string;
  templateKey: string;
  status: DocumentLifecycleStatus;
  errorMessage?: string;
  signatureDocumentId?: string;
  petId: string;
  customerId: string;
  documentName: string;
}

export interface SendDocumentDto {
  templateId: string;
  petId: string;
  petName: string;
  customerId: string;
  customerName: string;
  data: Record<string, unknown>;
}

export interface GenerateReportDto {
  templateKey: string;
  data: Record<string, unknown>;
  documentName: string;
  petId: string;
  customerId: string;
}

export interface GenerateReportResponse {
  trackingPublicId: string;
  reportId: string;
  status: DocumentLifecycleStatus;
}

export interface SignDocumentDto {
  signatureData: string;
  signedBy: string;
}

// --- Document Search ---

export interface DocumentSearchRequest {
  customerId?: string;
  petId?: string;
  skip?: number;
  take?: number;
}

export interface DocumentSearchResponse {
  data: DocumentRecord[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DocumentTrackingSearchResponse {
  data: DocumentTracking[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// --- Reports ---

export interface GenerateVaccinationAuthResponse {
  reportId: string;
  status: string;
  statusUrl: string;
}

export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ReportStatusResponse {
  reportId: string;
  status: ReportStatus;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  contentType?: string;
  fileExtension?: string;
  fileSize?: number;
}

// --- Clinic ---

export interface Clinic {
  publicId: string;
  tradeName: string;
  legalName: string;
  cnpj: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicCertificate {
  publicId: string;
  name: string;
  subjectCn: string;
  issuerCn: string;
  serialNumber?: string;
  fingerprint?: string;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdAt: string;
}

export interface ClinicDto {
  tradeName: string;
  legalName: string;
  cnpj: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
}

export type { SortField, SearchRequest, PaginatedResponse, CurrencyCode, Language, TranslationSet } from '@app/core';
