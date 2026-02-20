export type {
  MenuItem,
  AppRoute,
  LoginCredenciais,
  AuthRespostaLogin,
  AuthUsuario,
  UserMenuConfig,
  TranslationSet,
  SortField,
  SearchRequest,
  PaginatedResponse,
} from '@app/core';

// ==================== Enums ====================

export enum DocumentStatus {
  PENDING = 'PENDING',
  SIGNING = 'SIGNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum SignerStatus {
  PENDING = 'PENDING',
  OTP_SENT = 'OTP_SENT',
  OTP_VERIFIED = 'OTP_VERIFIED',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum EvidenceType {
  DOCUMENT_CREATED = 'DOCUMENT_CREATED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  COMPANY_SIGNED = 'COMPANY_SIGNED',
  SIGNED_BY_COMPANY = 'SIGNED_BY_COMPANY',
  SIGNER_ADDED = 'SIGNER_ADDED',
  OTP_REQUESTED = 'OTP_REQUESTED',
  OTP_VERIFIED = 'OTP_VERIFIED',
  SIGNER_SIGNED = 'SIGNER_SIGNED',
  SIGNED_BY_SIGNER = 'SIGNED_BY_SIGNER',
  DOCUMENT_COMPLETED = 'DOCUMENT_COMPLETED',
  DOCUMENT_CANCELLED = 'DOCUMENT_CANCELLED',
}

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  PASSPORT = 'PASSPORT',
}

export enum OtpChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// ==================== Company (CompanyResponseDto) ====================

export interface Company {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  cnpj: string;
  applicationPublicId?: string;
}

export interface CompanyDTO {
  name: string;
  cnpj: string;
  applicationPublicId?: string;
}

export interface CountResponse {
  total: number;
  active: number;
  inactive: number;
}

// ==================== Application ====================

export interface Application {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  externalId?: string;
  description?: string;
}

export interface ApplicationDTO {
  name: string;
  code: string;
  externalId?: string;
  description?: string;
}

// ==================== Certificate (CertificateResponseDto) ====================

export interface Certificate {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  companyPublicId: string;
  applicationPublicId?: string;
  fingerprint: string;
  subjectCn: string;
  issuerCn: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
}

// ==================== Document (DocumentResponseDto) ====================

export interface Document {
  publicId: string;
  trackingPublicId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  companyPublicId: string;
  applicationPublicId?: string;
  fileName: string;
  s3Key: string;
  originalHash: string;
  currentHash: string;
  status: DocumentStatus;
  chainValid: boolean;
  signersFinalized: boolean;
  metadata?: Record<string, unknown>;
}

// Extended response when fetching by ID (may include embedded relations)
export interface DocumentDetail extends Document {
  companyName?: string;
  companyCnpj?: string;
  signers?: Signer[];
  evidenceChain?: EvidenceEvent[];
  signatures?: Signature[];
}

export interface SignWithCompanyRequest {
  certificatePublicId: string;
  password: string;
}

export interface DocumentTimelineResponse {
  events: EvidenceEvent[];
  chainValid: boolean;
}

// ==================== Signer (SignerResponseDto / CreateSignerDto) ====================

export interface Signer {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  document: string;
  documentType: DocumentType;
  email: string;
  phone?: string;
  signOrder: number;
  token: string;
  tokenExpiresAt: string;
  status: SignerStatus;
}

export interface CreateSignerDTO {
  documentPublicId: string;
  name: string;
  document: string;
  documentType: DocumentType;
  email: string;
  phone?: string;
  signOrder?: number;
}

// ==================== Signature (SignatureResponseDto) ====================

export interface Signature {
  publicId: string;
  type: string; // 'COMPANY' | 'EXTERNAL'
  hash: string;
  ipAddress?: string;
  userAgent?: string;
  signedAt: string;
  createdAt: string;
}

// ==================== Evidence (EvidenceEventResponseDto) ====================

export interface EvidenceEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// ==================== Signing (Public) ====================

export interface SigningTokenResponse {
  signer: {
    publicId: string;
    name: string;
    email: string;
    phone?: string;
    status: SignerStatus;
  };
  document: {
    publicId: string;
    fileName: string;
    status: DocumentStatus;
    company: {
      name: string;
      cnpj: string;
    };
  };
  previewUrl: string;
}

export interface SigningInfo {
  documentId: string;
  documentName: string;
  companyName: string;
  companyCnpj: string;
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  status: SignerStatus;
  previewUrl: string;
}

export interface OtpRequest {
  channel: OtpChannel;
}

export interface OtpVerifyRequest {
  code: string;
}

// ==================== Verification (VerificationResponseDto) ====================

export interface VerificationResponse {
  documentId: string;
  fileName: string;
  status: DocumentStatus;
  originalHash: string;
  currentHash: string;
  companyName: string;
  companyCnpj: string;
  applicationName?: string;
  applicationExternalId?: string;
  signatures: Signature[];
  evidenceChain: EvidenceEvent[];
  chainValid: boolean;
  createdAt: string;
}

// ==================== Dashboard ====================

export interface DashboardStats {
  companies: CountResponse;
  certificates: CountResponse;
  applications: CountResponse;
}

export interface DocumentsByStatusItem {
  status: string;
  count: number;
}

export interface DocumentsByStatusResponse {
  data: DocumentsByStatusItem[];
  total: number;
}

export interface ApplicationSeriesItem {
  period: string;
  count: number;
}

export interface DocumentsByApplicationItem {
  applicationName: string;
  applicationPublicId: string;
  series: ApplicationSeriesItem[];
}

export interface DocumentsByApplicationResponse {
  data: DocumentsByApplicationItem[];
}

// ==================== Auth ====================

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string;
  app: string;
  username: string;
  email: string;
  roles: string[];
  config?: {
    theme?: string;
  };
  iat?: number;
  exp?: number;
}

export interface SignatureUser {
  id: string;
  guid: string;
  username: string;
  email: string;
  name: string;
  app: string;
  roles: string[];
}
