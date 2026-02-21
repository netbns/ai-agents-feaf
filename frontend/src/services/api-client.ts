import axios, { AxiosInstance } from 'axios';
import type {
  User,
  Board,
  Component,
  Relationship,
  CrossBoardLink,
  RefModel,
  ListResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateComponentRequest,
  UpdateComponentRequest,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  CreateCrossBoardLinkRequest,
  UpdateCrossBoardLinkRequest,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response - extract data from AxiosResponse
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  // Auth endpoints
  register(data: RegisterRequest): Promise<AuthResponse> {
    return this.client.post('/auth/register', data);
  }

  login(data: LoginRequest): Promise<AuthResponse> {
    return this.client.post('/auth/login', data);
  }

  // Board endpoints
  getBoards(params?: { page?: number; limit?: number; search?: string; referenceModel?: string }): Promise<ListResponse<Board>> {
    return this.client.get('/boards', { params });
  }

  getBoard(id: string): Promise<Board> {
    return this.client.get(`/boards/${id}`);
  }

  createBoard(data: CreateBoardRequest): Promise<Board> {
    return this.client.post('/boards', data);
  }

  updateBoard(id: string, data: UpdateBoardRequest): Promise<Board> {
    return this.client.patch(`/boards/${id}`, data);
  }

  deleteBoard(id: string): Promise<void> {
    return this.client.delete(`/boards/${id}`);
  }

  exportBoard(id: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    return this.client.get(`/boards/${id}/export`, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    }) as any;
  }

  // Component endpoints
  getComponents(boardId: string, params?: { page?: number; limit?: number; type?: string; search?: string }): Promise<ListResponse<Component>> {
    return this.client.get(
      `/boards/${boardId}/components`,
      { params },
    ) as any;
  }

  getComponent(boardId: string, componentId: string): Promise<Component> {
    return this.client.get(
      `/boards/${boardId}/components/${componentId}`,
    ) as any;
  }

  createComponent(boardId: string, data: CreateComponentRequest): Promise<Component> {
    return this.client.post(
      `/boards/${boardId}/components`,
      data,
    ) as any;
  }

  updateComponent(boardId: string, componentId: string, data: UpdateComponentRequest): Promise<Component> {
    return this.client.patch(
      `/boards/${boardId}/components/${componentId}`,
      data,
    ) as any;
  }

  deleteComponent(boardId: string, componentId: string): Promise<void> {
    return this.client.delete(
      `/boards/${boardId}/components/${componentId}`,
    ) as any;
  }

  updateComponentPositions(
    boardId: string,
    updates: Array<{ id: string; position: any }>,
  ): Promise<Component[]> {
    return this.client.patch(
      `/boards/${boardId}/positions`,
      updates,
    ) as any;
  }

  // Relationship endpoints
  getRelationships(boardId: string, params?: { page?: number; limit?: number; type?: string }): Promise<ListResponse<Relationship>> {
    return this.client.get(
      `/boards/${boardId}/relationships`,
      { params },
    ) as any;
  }

  getRelationship(boardId: string, relationshipId: string): Promise<Relationship> {
    return this.client.get(
      `/boards/${boardId}/relationships/${relationshipId}`,
    ) as any;
  }

  createRelationship(boardId: string, data: CreateRelationshipRequest): Promise<Relationship> {
    return this.client.post(
      `/boards/${boardId}/relationships`,
      data,
    ) as any;
  }

  updateRelationship(
    boardId: string,
    relationshipId: string,
    data: UpdateRelationshipRequest,
  ): Promise<Relationship> {
    return this.client.patch(
      `/boards/${boardId}/relationships/${relationshipId}`,
      data,
    ) as any;
  }

  deleteRelationship(boardId: string, relationshipId: string): Promise<void> {
    return this.client.delete(
      `/boards/${boardId}/relationships/${relationshipId}`,
    ) as any;
  }

  getComponentRelationships(componentId: string): Promise<Relationship[]> {
    return this.client.get(
      `/boards/component/${componentId}/relationships`,
    ) as any;
  }

  // Cross-board links endpoints
  getCrossBoardLinks(params?: { page?: number; limit?: number; linkType?: string }): Promise<ListResponse<CrossBoardLink>> {
    return this.client.get(
      '/cross-board-links',
      { params },
    ) as any;
  }

  getCrossBoardLink(linkId: string): Promise<CrossBoardLink> {
    return this.client.get(`/cross-board-links/${linkId}`) as any;
  }

  createCrossBoardLink(data: CreateCrossBoardLinkRequest): Promise<CrossBoardLink> {
    return this.client.post('/cross-board-links', data) as any;
  }

  updateCrossBoardLink(linkId: string, data: UpdateCrossBoardLinkRequest): Promise<CrossBoardLink> {
    return this.client.patch(
      `/cross-board-links/${linkId}`,
      data,
    ) as any;
  }

  deleteCrossBoardLink(linkId: string): Promise<void> {
    return this.client.delete(`/cross-board-links/${linkId}`) as any;
  }

  getComponentCrossBoardLinks(componentId: string): Promise<CrossBoardLink[]> {
    return this.client.get(
      `/cross-board-links/component/${componentId}`,
    ) as any;
  }

  getValidTransitions(): Promise<Array<{ from: string; to: string[] }>> {
    return this.client.get('/cross-board-links/valid-transitions') as any;
  }

  // Reference models endpoints
  getRefModels(): Promise<RefModel[]> {
    return this.client.get('/reference-models') as any;
  }

  getRefModel(id: string): Promise<RefModel> {
    return this.client.get(`/reference-models/${id}`) as any;
  }

  // Health endpoints
  healthLiveness(): Promise<any> {
    return this.client.get('/health/liveness') as any;
  }

  healthReadiness(): Promise<any> {
    return this.client.get('/health/readiness') as any;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
