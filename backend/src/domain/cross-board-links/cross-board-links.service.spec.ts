import { Test, TestingModule } from '@nestjs/testing';
import { CrossBoardLinksService } from './cross-board-links.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprStateService } from '../dapr/dapr-state.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('CrossBoardLinksService', () => {
  let service: CrossBoardLinksService;
  let prismaService: PrismaService;
  let daprStateService: DaprStateService;

  const mockPRMBoard = {
    id: 'board-prm',
    name: 'PRM Board',
    referenceModel: 'PRM',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockARMBoard = {
    id: 'board-arm',
    name: 'ARM Board',
    referenceModel: 'ARM',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockComponentPRM = {
    id: 'comp-prm',
    name: 'PRM Component',
    boardId: 'board-prm',
    type: 'KPI',
    properties: {},
    position: {},
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    board: mockPRMBoard,
  };

  const mockComponentARM = {
    id: 'comp-arm',
    name: 'ARM Component',
    boardId: 'board-arm',
    type: 'Service',
    properties: {},
    position: {},
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    board: mockARMBoard,
  };

  const mockCrossBoardLink = {
    id: 'link-1',
    sourceComponentId: 'comp-prm',
    targetComponentId: 'comp-arm',
    description: 'Cross-board link',
    linkType: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrossBoardLinksService,
        {
          provide: PrismaService,
          useValue: {
            board: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            component: {
              findUnique: jest.fn(),
            },
            crossBoardLink: {
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

    service = module.get<CrossBoardLinksService>(CrossBoardLinksService);
    prismaService = module.get<PrismaService>(PrismaService);
    daprStateService = module.get<DaprStateService>(DaprStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a cross-board link with valid transition', async () => {
      const createDto = {
        sourceComponentId: 'comp-prm',
        targetComponentId: 'comp-arm',
        description: 'Cross-board link',
      };

      jest
        .spyOn(prismaService.component, 'findUnique')
        .mockResolvedValueOnce(mockComponentPRM as any)
        .mockResolvedValueOnce(mockComponentARM as any);
      jest.spyOn(prismaService.crossBoardLink, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.crossBoardLink, 'create').mockResolvedValue(mockCrossBoardLink as any);
      jest.spyOn(daprStateService, 'setState').mockResolvedValue(undefined);

      const result = await service.create('user-1', createDto);

      expect(result).toEqual(mockCrossBoardLink);
      expect(prismaService.crossBoardLink.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const createDto = {
        sourceComponentId: 'comp-arm',
        targetComponentId: 'comp-prm', // ARM -> PRM is invalid (should be PRM -> ARM)
      };

      jest
        .spyOn(prismaService.component, 'findUnique')
        .mockResolvedValueOnce(mockComponentARM as any)
        .mockResolvedValueOnce(mockComponentPRM as any);

      await expect(service.create('user-1', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if components on same board', async () => {
      const createDto = {
        sourceComponentId: 'comp-prm-1',
        targetComponentId: 'comp-prm-2',
      };

      const sameBoard = { ...mockComponentPRM, id: 'comp-prm-1' };
      const sameBoardComp2 = { ...mockComponentPRM, id: 'comp-prm-2' };

      jest
        .spyOn(prismaService.component, 'findUnique')
        .mockResolvedValueOnce(sameBoard as any)
        .mockResolvedValueOnce(sameBoardComp2 as any);

      await expect(service.create('user-1', createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should find all cross-board links for user', async () => {
      jest.spyOn(prismaService.board, 'findMany').mockResolvedValue([mockPRMBoard, mockARMBoard] as any);
      jest
        .spyOn(prismaService.crossBoardLink, 'findMany')
        .mockResolvedValue([
          { ...mockCrossBoardLink, sourceComponent: mockComponentPRM, targetComponent: mockComponentARM },
        ] as any);
      jest.spyOn(prismaService.crossBoardLink, 'count').mockResolvedValue(1);

      const result = await service.findAll('user-1', {});

      expect(result.total).toBe(1);
      expect(prismaService.crossBoardLink.findMany).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a cross-board link', async () => {
      jest.spyOn(prismaService.crossBoardLink, 'findUnique').mockResolvedValue({
        ...mockCrossBoardLink,
        sourceComponent: mockComponentPRM,
        targetComponent: mockComponentARM,
      } as any);
      jest.spyOn(prismaService.crossBoardLink, 'delete').mockResolvedValue(mockCrossBoardLink as any);
      jest.spyOn(daprStateService, 'deleteState').mockResolvedValue(undefined);

      await service.delete('link-1', 'user-1');

      expect(prismaService.crossBoardLink.delete).toHaveBeenCalledWith({ where: { id: 'link-1' } });
    });
  });

  describe('getValidTransitions', () => {
    it('should return valid transitions', async () => {
      const transitions = await service.getValidTransitions();

      expect(transitions).toContainEqual(expect.objectContaining({ from: 'PRM', to: expect.arrayContaining(['BRM', 'DRM']) }));
      expect(transitions).toContainEqual(expect.objectContaining({ from: 'BRM', to: expect.arrayContaining(['ARM', 'IRM']) }));
    });
  });
});
