import { Test, TestingModule } from '@nestjs/testing';
import { ComponentsService } from './components.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprStateService } from '../dapr/dapr-state.service';
import { RefModelsService } from '../ref-models/ref-models.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ComponentsService', () => {
  let service: ComponentsService;
  let prismaService: PrismaService;
  let daprStateService: DaprStateService;
  let refModelsService: RefModelsService;

  const mockComponent = {
    id: 'comp-1',
    name: 'KPI-001',
    description: 'Test KPI',
    type: 'KPI',
    properties: { color: '#FF5733' },
    position: { x: 100, y: 100 },
    boardId: 'board-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBoard = {
    id: 'board-1',
    name: 'Test Board',
    description: 'Test',
    referenceModel: 'PRM',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComponentsService,
        {
          provide: PrismaService,
          useValue: {
            board: {
              findUnique: jest.fn(),
            },
            component: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
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
        {
          provide: RefModelsService,
          useValue: {
            getModelById: jest.fn().mockReturnValue({
              id: 'PRM',
              name: 'Performance Reference Model',
              componentTypes: ['KPI', 'METRIC'],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ComponentsService>(ComponentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    daprStateService = module.get<DaprStateService>(DaprStateService);
    refModelsService = module.get<RefModelsService>(RefModelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a component', async () => {
      const createDto = {
        name: 'KPI-001',
        type: 'KPI',
        description: 'Test KPI',
        position: { x: 100, y: 100 },
      };

      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.component, 'create').mockResolvedValue(mockComponent as any);
      jest.spyOn(daprStateService, 'setState').mockResolvedValue(undefined);

      const result = await service.create('board-1', 'user-1', createDto);

      expect(result).toEqual(mockComponent);
      expect(prismaService.component.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'KPI-001',
            type: 'KPI',
          }),
        }),
      );
    });

    it('should throw NotFoundException if board does not exist', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create('board-1', 'user-1', { name: 'Test', type: 'KPI' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if board does not belong to user', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue({
        ...mockBoard,
        userId: 'other-user',
      } as any);

      await expect(
        service.create('board-1', 'user-1', { name: 'Test', type: 'KPI' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if component type is invalid for model', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(refModelsService, 'getModelById').mockReturnValue({
        id: 'PRM',
        componentTypes: ['KPI'],
      } as any);

      await expect(
        service.create('board-1', 'user-1', { name: 'Test', type: 'INVALID_TYPE' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByBoard', () => {
    it('should find components by board', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(mockBoard as any);
      jest.spyOn(prismaService.component, 'findMany').mockResolvedValue([mockComponent] as any);
      jest.spyOn(prismaService.component, 'count').mockResolvedValue(1);

      const result = await service.findByBoard('board-1', 'user-1', { page: 1, limit: 20 });

      expect(result.data).toEqual([mockComponent]);
      expect(result.total).toBe(1);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      jest.spyOn(prismaService.board, 'findUnique').mockResolvedValue(null);

      await expect(
        service.findByBoard('board-1', 'user-1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should find one component', async () => {
      jest.spyOn(prismaService.component, 'findUnique').mockResolvedValue({
        ...mockComponent,
        board: mockBoard,
      } as any);

      const result = await service.findOne('comp-1', 'user-1');

      expect(result).toEqual(expect.objectContaining({ id: 'comp-1' }));
    });

    it('should throw NotFoundException if component does not exist', async () => {
      jest.spyOn(prismaService.component, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('comp-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a component', async () => {
      const updateDto = { name: 'Updated Name' };

      jest.spyOn(prismaService.component, 'findUnique').mockResolvedValue({
        ...mockComponent,
        board: mockBoard,
      } as any);
      jest.spyOn(prismaService.component, 'update').mockResolvedValue({
        ...mockComponent,
        name: 'Updated Name',
      } as any);
      jest.spyOn(daprStateService, 'setState').mockResolvedValue(undefined);

      const result = await service.update('comp-1', 'user-1', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(prismaService.component.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a component', async () => {
      jest.spyOn(prismaService.component, 'findUnique').mockResolvedValue({
        ...mockComponent,
        board: mockBoard,
      } as any);
      jest.spyOn(prismaService.component, 'delete').mockResolvedValue(mockComponent as any);
      jest.spyOn(daprStateService, 'deleteState').mockResolvedValue(undefined);

      await service.delete('comp-1', 'user-1');

      expect(prismaService.component.delete).toHaveBeenCalledWith({
        where: { id: 'comp-1' },
      });
    });
  });
});
