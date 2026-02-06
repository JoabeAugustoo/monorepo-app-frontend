// ==================== Search Types ====================

export interface SortField {
  field: string;
  direction?: 'ASC' | 'DESC';
}

export interface SearchRequest {
  where?: Record<string, unknown>;
  skip: number;
  take: number;
  sort?: SortField[];
}

export interface CountResponse {
  total: number;
  active: number;
  inactive: number;
}

// ==================== Role Types ====================

export interface Role {
  publicId: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  applicationId?: string;
}

export interface RoleDTO {
  name: string;
  description?: string;
  applicationId?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  applicationId?: string;
}

// ==================== User Types ====================

export interface User {
  publicId: string;
  userGuid: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO {
  userName: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  userName?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

// ==================== Application Types ====================

export interface Application {
  publicId: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDTO {
  name: string;
  code: string;
  description?: string;
}

export interface CreateApplicationRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
}

// ==================== Auth Types ====================

export interface LoginRequest {
  username: string;
  password: string;
  applicationId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  applicationId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

// ==================== User Roles Types ====================

export interface AssignRoleRequest {
  userId: string;
  applicationId: string;
  roleId: string;
}

export interface UserRoleResponse {
  userId: string;
  userName: string;
  applicationId: string;
  applicationName: string;
  roleId: string;
  roleName: string;
  active: boolean;
  createdAt: string;
}

// ==================== Client Types ====================

export interface Client {
  publicId: string;
  clientId: string;
  name: string;
  description?: string;
  applicationId: string;
  applicationName: string;
  roles: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithSecret extends Client {
  clientSecret: string;
}

export interface CreateClientRequest {
  name: string;
  description?: string;
}

export interface UpdateClientRequest {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface AssignClientRoleRequest {
  rolePublicId: string;
}

export interface ClientRoleResponse {
  clientId: string;
  clientName: string;
  roleId: string;
  roleName: string;
  active: boolean;
  createdAt: string;
}

// ==================== User Application Roles Types ====================

export interface ApplicationInfo {
  public_id: string;
  name: string;
}

export interface UserApplicationRoles {
  application: ApplicationInfo;
  roles: string[];
}

export interface ApplicationUserInfo {
  publicId: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

// ==================== Application Search Response Types ====================

export interface UserRoleItem {
  publicId: string;
  name: string;
  active: boolean;
}

export interface ApplicationUserSearchResponse {
  publicId: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  active: boolean;
  createdAt: string;
  roles: UserRoleItem[];
}

export interface ApplicationRoleSearchResponse {
  publicId: string;
  name: string;
  description?: string;
  isAdministrative: boolean;
  isGlobal: boolean;
  active: boolean;
}

export interface AddUserToApplicationRequest {
  userPublicId: string;
  rolePublicIds: string[];
}

// ==================== Error Types ====================

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  path?: string;
}
