export type ReferenceModel = 'PRM' | 'BRM' | 'DRM' | 'ARM' | 'IRM' | 'SRM';

export type RelationshipType =
  | 'DEPENDS_ON'
  | 'COMMUNICATES_WITH'
  | 'CONTAINS'
  | 'SUPPORTS'
  | 'IMPLEMENTS';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  referenceModel: ReferenceModel;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  componentCount?: number;
  relationshipCount?: number;
}

export interface Position {
  x?: number;
  y?: number;
  gridPosition?: string;
}

export interface Component {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: Record<string, any>;
  position: Position;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Relationship {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  type: RelationshipType;
  description: string;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
  sourceComponent?: Component;
  targetComponent?: Component;
}

export interface CrossBoardLink {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  description: string;
  linkType: 'manual' | 'automated' | 'inferred';
  createdAt: Date;
  updatedAt: Date;
  sourceComponent?: Component & { board: Board };
  targetComponent?: Component & { board: Board };
}

export interface RefModel {
  id: ReferenceModel;
  name: string;
  shortName: string;
  description: string;
  componentTypes: string[];
  icon?: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  referenceModel: ReferenceModel;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
}

export interface CreateComponentRequest {
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, any>;
  position?: Position;
}

export interface UpdateComponentRequest {
  name?: string;
  type?: string;
  description?: string;
  properties?: Record<string, any>;
  position?: Position;
}

export interface CreateRelationshipRequest {
  sourceComponentId: string;
  targetComponentId: string;
  type: RelationshipType;
  description?: string;
}

export interface UpdateRelationshipRequest {
  type?: RelationshipType;
  description?: string;
}

export interface CreateCrossBoardLinkRequest {
  sourceComponentId: string;
  targetComponentId: string;
  description?: string;
  linkType?: 'manual' | 'automated' | 'inferred';
}

export interface UpdateCrossBoardLinkRequest {
  description?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
