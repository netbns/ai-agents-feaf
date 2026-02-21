import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipsService } from './relationships.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprStateService } from '../dapr/dapr-state.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('RelationshipsService', () => {
  let service: RelationshipsService;
  let prismaService: PrismaService;
  let daprStateService: DaprStateService;

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    referenceModel: 'PRM',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockComponent1 = {
    id: 'comp-1',
    name: 'Component 1',
    boardId: 'board-1',
    type: 'KPI',
    properties: {},
    position: {},
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockComponent2 = {
    id: 'comp-2',
    name: 'Component 2',
    boardId: 'board-1',
    type: 'KPI',
    properties: {},
    position: {},
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRelationship = {
    id: 'rel-1',
    sourceComponentId: 'comp-1',
    targetComponentId: 'comp-2',
    type: 'DEPENDS_ON',
    description: 'Test relationship',
    boardId: 'board-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationshipsService,
        {
          provide: PrismaService,
          useValue: {
            board: {
              findUnique: jest.fn(),
            },
            component: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            relationship: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: DaprStateService,
          useValue: {
            setState: jest.fn(),
            deleteState: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RelationshipsService>(RelationshipsService);
    prismaService = module.get<PrismaService>(PrismaService);
    daprStateService = module.get<DaprStateService>(DaprStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a relationship', async () => {
      const createDto = {
        sourceComponentId: 'comp-1',
        targetComponentId: 'comp-2',
        type: 'DEPENDS_ON',
      };

      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest
        .spyOn(prismaService.component, 'findUnique')
        .mockResolvedValueOnce(mockComponent1 as any)
        .mockResolvedValueOnce(mockComponent2 as any);
      jest.spyOn(prismaService.relationship, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.relationship, 'create').mockResolvedValue(mockRelationship as any);
      jest.spyOn(daprStateService, 'setState').mockResolvedValue(undefined);

      const result = await service.create('board-1', 'user-1', createDto);

      expect(result).toEqual(mockRelationship);
      expect(prismaService.relationship.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if source and target are the same', async () => {
      const createDto = {
        sourceComponentId: 'comp-1',
        targetComponentId: 'comp-1',
        type: 'DEPENDS_ON',
      };

      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.component, 'findUnique').mockResolvedValue(mockComponent1 as any);

      await expect(service.create('board-1', 'user-1', createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if relationship already exists', async () => {
      const createDto = {
        sourceComponentId: 'comp-1',
        targetComponentId: 'comp-2',
        type: 'DEPENDS_ON',
      };

      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest
        .spyOn(prismaService.component, 'findUnique')
        .mockResolvedValueOnce(mockComponent1 as any)
        .mockResolvedValueOnce(mockComponent2 as any);
      jest.spyOn(prismaService.relationship, 'findFirst').mockResolvedValue(mockRelationship as any);

      await expect(service.create('board-1', 'user-1', createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByBoard', () => {
    it('should find relationships by board', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.relationship, 'findMany').mockResolvedValue([mockRelationship] as any);
      jest.spyOn(prismaService.relationship, 'count').mockResolvedValue(1);

      const result = await service.findByBoard('board-1', 'user-1', { page: 1, limit: 20 });

      expect(result.data).toEqual([mockRelationship]);
      expect(result.total).toBe(1);
    });
  });

  describe('findByComponent', () => {
    it('should find relationships by component', async () => {
      jest.spyOn(prismaService.component, 'findUnique').mockResolvedValue({
        ...mockComponent1,
        board: mockBoard,
      } as any);
      jest.spyOn(prismaService.relationship, 'findMany').mockResolvedValue([mockRelationship] as any);

      const result = await service.findByComponent('comp-1', 'user-1');

      expect(result).toEqual([mockRelationship]);
    });
  });

  describe('delete', () => {
    it('should delete a relationship', async () => {
      jest.spyOn(prismaService.relationship, 'findUnique').mockResolvedValue({
        ...mockRelationship,
        board: mockBoard,
      } as any);
      jest.spyOn(prismaService.relationship, 'delete').mockResolvedValue(mockRelationship as any);
      jest.spyOn(daprStateService, 'deleteState').mockResolvedValue(undefined);

      await service.delete('rel-1', 'user-1');

      expect(prismaService.relationship.delete).toHaveBeenCalledWith({ where: { id: 'rel-1' } });
    });
  });
});
