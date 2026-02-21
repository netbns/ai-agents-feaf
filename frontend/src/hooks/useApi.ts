import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiClient from '../services/api-client';
import type {
  Board,
  Component,
  Relationship,
  RefModel,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateComponentRequest,
  UpdateComponentRequest,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
} from '@/types';

// Board hooks
export const useBoards = (params?: any) => {
  return useQuery(['boards', params], () => apiClient.getBoards(params));
};

export const useBoard = (id: string | null) => {
  return useQuery(['board', id], () => (id ? apiClient.getBoard(id) : null), {
    enabled: !!id,
  });
};

export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation((data: CreateBoardRequest) => apiClient.createBoard(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['boards']);
    },
  });
};

export const useUpdateBoard = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation((data: UpdateBoardRequest) => apiClient.updateBoard(boardId, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['board', boardId]);
      queryClient.invalidateQueries(['boards']);
    },
  });
};

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();
  return useMutation((boardId: string) => apiClient.deleteBoard(boardId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['boards']);
    },
  });
};

export const useExportBoard = () => {
  return useMutation(
    ({ boardId, format }: { boardId: string; format: 'json' | 'csv' }) =>
      apiClient.exportBoard(boardId, format),
  );
};

// Component hooks
export const useComponents = (boardId: string | null, params?: any) => {
  return useQuery(
    ['components', boardId, params],
    () => (boardId ? apiClient.getComponents(boardId, params) : null),
    { enabled: !!boardId },
  );
};

export const useComponent = (boardId: string | null, componentId: string | null) => {
  return useQuery(
    ['component', boardId, componentId],
    () =>
      boardId && componentId
        ? apiClient.getComponent(boardId, componentId)
        : null,
    { enabled: !!boardId && !!componentId },
  );
};

export const useCreateComponent = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation((data: CreateComponentRequest) => apiClient.createComponent(boardId, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['components', boardId]);
    },
  });
};

export const useUpdateComponent = (boardId: string, componentId: string) => {
  const queryClient = useQueryClient();
  return useMutation((data: UpdateComponentRequest) => apiClient.updateComponent(boardId, componentId, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['components', boardId]);
      queryClient.invalidateQueries(['component', boardId, componentId]);
    },
  });
};

export const useDeleteComponent = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation((componentId: string) => apiClient.deleteComponent(boardId, componentId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['components', boardId]);
    },
  });
};

export const useUpdateComponentPositions = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    (updates: Array<{ id: string; position: any }>) =>
      apiClient.updateComponentPositions(boardId, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['components', boardId]);
      },
    },
  );
};

// Relationship hooks
export const useRelationships = (boardId: string | null, params?: any) => {
  return useQuery(
    ['relationships', boardId, params],
    () => (boardId ? apiClient.getRelationships(boardId, params) : null),
    { enabled: !!boardId },
  );
};

export const useCreateRelationship = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    (data: CreateRelationshipRequest) =>
      apiClient.createRelationship(boardId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['relationships', boardId]);
      },
    },
  );
};

export const useUpdateRelationship = (boardId: string, relationshipId: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    (data: UpdateRelationshipRequest) =>
      apiClient.updateRelationship(boardId, relationshipId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['relationships', boardId]);
      },
    },
  );
};

export const useDeleteRelationship = (boardId: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    (relationshipId: string) =>
      apiClient.deleteRelationship(boardId, relationshipId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['relationships', boardId]);
      },
    },
  );
};

// Reference models hooks
export const useRefModels = () => {
  return useQuery(['ref-models'], () => apiClient.getRefModels());
};

export const useRefModel = (id: string | null) => {
  return useQuery(['ref-model', id], () => (id ? apiClient.getRefModel(id) : null), {
    enabled: !!id,
  });
};

// Health hooks
export const useHealthCheck = () => {
  return useQuery(['health'], () => apiClient.healthLiveness(), {
    refetchInterval: 30000, // 30 seconds
  });
};
