import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprStateService } from '../dapr/dapr-state.service';
import {
  CreateCrossBoardLinkDto,
  UpdateCrossBoardLinkDto,
  CrossBoardLinkFilterDto,
} from './dto/cross-board-link.dto';
import { CrossBoardLink, Prisma } from '@prisma/client';

interface ValidCrossBoardTransition {
  from: string;
  to: string[];
}

@Injectable()
export class CrossBoardLinksService {
  private readonly stateStoreName = 'cross-board-links-state';

  // Valid transitions between FEAF reference models
  private readonly validTransitions: ValidCrossBoardTransition[] = [
    { from: 'PRM', to: ['BRM', 'DRM'] },
    { from: 'BRM', to: ['ARM', 'IRM'] },
    { from: 'DRM', to: ['ARM', 'IRM'] },
    { from: 'ARM', to: ['IRM', 'SRM'] },
    { from: 'IRM', to: ['SRM'] },
    { from: 'SRM', to: [] },
  ];

  constructor(
    private readonly prismaService: PrismaService,
    private readonly daprStateService: DaprStateService,
  ) {}

  private isValidTransition(from: string, to: string): boolean {
    const transition = this.validTransitions.find((t) => t.from === from);
    return transition ? transition.to.includes(to) : false;
  }

  async create(
    userId: string,
    createCrossBoardLinkDto: CreateCrossBoardLinkDto,
  ): Promise<CrossBoardLink> {
    // Verify both components exist and belong to user's boards
    const [sourceComponent, targetComponent] = await Promise.all([
      this.prismaService.component.findUnique({
        where: { id: createCrossBoardLinkDto.sourceComponentId },
        include: { board: true },
      }),
      this.prismaService.component.findUnique({
        where: { id: createCrossBoardLinkDto.targetComponentId },
        include: { board: true },
      }),
    ]);

    if (!sourceComponent) {
      throw new NotFoundException(
        `Source component with ID ${createCrossBoardLinkDto.sourceComponentId} not found`,
      );
    }

    if (!targetComponent) {
      throw new NotFoundException(
        `Target component with ID ${createCrossBoardLinkDto.targetComponentId} not found`,
      );
    }

    if (sourceComponent.board.userId !== userId || targetComponent.board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to link components from these boards',
      );
    }

    if (sourceComponent.boardId === targetComponent.boardId) {
      throw new BadRequestException(
        'Components must be on different boards for a cross-board link',
      );
    }

    // Validate transition
    const sourceBoard = sourceComponent.board;
    const targetBoard = targetComponent.board;

    if (!this.isValidTransition(sourceBoard.referenceModel, targetBoard.referenceModel)) {
      throw new BadRequestException(
        `Invalid transition from ${sourceBoard.referenceModel} to ${targetBoard.referenceModel}. ` +
          `Valid targets for ${sourceBoard.referenceModel} are: ${this.validTransitions.find((t) => t.from === sourceBoard.referenceModel)?.to.join(', ') || 'none'}`,
      );
    }

    // Check for duplicate link
    const existing = await this.prismaService.crossBoardLink.findFirst({
      where: {
        sourceComponentId: sourceComponent.id,
        targetComponentId: targetComponent.id,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Cross-board link already exists between these components',
      );
    }

    // Create cross-board link
    const link = await this.prismaService.crossBoardLink.create({
      data: {
        sourceComponentId: sourceComponent.id,
        targetComponentId: targetComponent.id,
        sourceBoardRef: sourceBoard.referenceModel,
        targetBoardRef: targetBoard.referenceModel,
        description: createCrossBoardLinkDto.description || '',
        linkType: createCrossBoardLinkDto.linkType || 'manual',
      },
    });

    // Cache in Dapr state
    await this.daprStateService.setState(
      `${this.stateStoreName}:${link.id}`,
      link,
      7200, // 2 hour TTL for cross-board links
    );

    return link;
  }

  async findAll(
    userId: string,
    filterDto: CrossBoardLinkFilterDto,
  ): Promise<{ data: CrossBoardLink[]; total: number }> {
    // Get all boards for user to filter by
    const userBoards = await this.prismaService.board.findMany({
      where: { userId },
      select: { id: true },
    });

    const boardIds = userBoards.map((b) => b.id);

    const skip = ((filterDto.page || 1) - 1) * (filterDto.limit || 20);
    const take = filterDto.limit || 20;

    const where: Prisma.CrossBoardLinkWhereInput = {
      OR: [
        { sourceComponent: { boardId: { in: boardIds } } },
        { targetComponent: { boardId: { in: boardIds } } },
      ],
    };

    if (filterDto.linkType) {
      where.linkType = filterDto.linkType;
    }

    const [data, total] = await Promise.all([
      this.prismaService.crossBoardLink.findMany({
        where,
        skip,
        take,
        include: {
          sourceComponent: { include: { board: true } },
          targetComponent: { include: { board: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.crossBoardLink.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(linkId: string, userId: string): Promise<CrossBoardLink> {
    const link = await this.prismaService.crossBoardLink.findUnique({
      where: { id: linkId },
      include: {
        sourceComponent: { include: { board: true } },
        targetComponent: { include: { board: true } },
      },
    });

    if (!link) {
      throw new NotFoundException(`Cross-board link with ID ${linkId} not found`);
    }

    if (
      link.sourceComponent.board.userId !== userId ||
      link.targetComponent.board.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this cross-board link',
      );
    }

    return link;
  }

  async update(
    linkId: string,
    userId: string,
    updateCrossBoardLinkDto: UpdateCrossBoardLinkDto,
  ): Promise<CrossBoardLink> {
    await this.findOne(linkId, userId);

    const updated = await this.prismaService.crossBoardLink.update({
      where: { id: linkId },
      data: {
        description: updateCrossBoardLinkDto.description,
      },
    });

    // Update Dapr cache
    await this.daprStateService.setState(
      `${this.stateStoreName}:${linkId}`,
      updated,
      7200,
    );

    return updated;
  }

  async delete(linkId: string, userId: string): Promise<void> {
    const link = await this.findOne(linkId, userId);

    await this.prismaService.crossBoardLink.delete({
      where: { id: linkId },
    });

    // Remove from Dapr cache
    await this.daprStateService.deleteState(
      `${this.stateStoreName}:${linkId}`,
    );
  }

  async findByComponent(
    componentId: string,
    userId: string,
  ): Promise<CrossBoardLink[]> {
    // Verify component exists and belongs to user
    const component = await this.prismaService.component.findUnique({
      where: { id: componentId },
      include: { board: true },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }

    if (component.board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this component',
      );
    }

    // Find all cross-board links involving this component
    return this.prismaService.crossBoardLink.findMany({
      where: {
        OR: [
          { sourceComponentId: componentId },
          { targetComponentId: componentId },
        ],
      },
      include: {
        sourceComponent: { include: { board: true } },
        targetComponent: { include: { board: true } },
      },
    });
  }

  async getValidTransitions(): Promise<ValidCrossBoardTransition[]> {
    return this.validTransitions;
  }
}
