export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type TemplateEngine = 'HANDLEBARS' | 'HTML';
export type DocumentType = 'SIGNATURE_REQUIRED' | 'SEND_ONLY';

export interface Template {
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
}

export interface TemplateDto {
  key: string;
  name: string;
  description?: string;
  engine?: TemplateEngine;
  status?: TemplateStatus;
  documentType?: DocumentType;
  categoryId?: string;
  applicationId: string;
  applicationName: string;
  applicationCode: string;
}

export interface TemplateVersion {
  publicId: string;
  version: number;
  filePath: string;
  checksum: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

// --- TemplateCategory ---

export interface TemplateCategory {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  applicationId: string;
  applicationName?: string;
}

export interface TemplateCategoryDto {
  name: string;
  description?: string;
  applicationId: string;
}

// --- Application ---

export interface Application {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description?: string;
}

export interface ApplicationDto {
  name: string;
  code: string;
  description?: string;
}

// --- Reports ---

export interface CountResponse {
  total: number;
  active: number;
  inactive: number;
}

export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ReportSearchRequest {
  applicationId?: string;
  templateKey?: string;
  status?: ReportStatus;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  skip?: number;
  take?: number;
}

export interface GenerateReportDto {
  templateKey: string;
  applicationId: string;
  data: Record<string, unknown>;
  format?: string;
  callbackUrl?: string;
}

export interface GenerateReportResponseDto {
  reportId: string;
  status: string;
  statusUrl: string;
}

export interface GeneratedReport {
  publicId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  templateKey: string;
  templateName?: string;
  version: number;
  contentType: string;
  applicationName: string;
  format?: string;
  fileSize?: number;
  status: ReportStatus;
  downloadUrl?: string;
  errorMessage?: string;
  completedAt?: string;
  fileExtension?: string;
  categoryName?: string;
  data?: Record<string, unknown>;
}

export interface ReportUser {
  id: string;
  username: string;
  email: string;
  name: string;
}

export type { SearchRequest, PaginatedResponse } from '@app/core';
