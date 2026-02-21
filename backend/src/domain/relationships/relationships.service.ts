import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprStateService } from '../dapr/dapr-state.service';
import { CreateRelationshipDto, UpdateRelationshipDto, RelationshipFilterDto } from './dto/relationship.dto';
import { Relationship, Prisma } from '@prisma/client';

@Injectable()
export class RelationshipsService {
  private readonly stateStoreName = 'relationships-state';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly daprStateService: DaprStateService,
  ) {}

  async create(
    boardId: string,
    userId: string,
    createRelationshipDto: CreateRelationshipDto,
  ): Promise<Relationship> {
    // Verify board exists and belongs to user
    const board = await this.prismaService.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add relationships to this board',
      );
    }

    // Verify both components exist and belong to the same board
    const [sourceComponent, targetComponent] = await Promise.all([
      this.prismaService.component.findUnique({
        where: { id: createRelationshipDto.sourceComponentId },
      }),
      this.prismaService.component.findUnique({
        where: { id: createRelationshipDto.targetComponentId },
      }),
    ]);

    if (!sourceComponent) {
      throw new NotFoundException(
        `Source component with ID ${createRelationshipDto.sourceComponentId} not found`,
      );
    }

    if (!targetComponent) {
      throw new NotFoundException(
        `Target component with ID ${createRelationshipDto.targetComponentId} not found`,
      );
    }

    if (sourceComponent.boardId !== boardId || targetComponent.boardId !== boardId) {
      throw new BadRequestException(
        'Both components must belong to the same board',
      );
    }

    if (sourceComponent.id === targetComponent.id) {
      throw new BadRequestException(
        'A component cannot have a relationship with itself',
      );
    }

    // Check for duplicate relationship
    const existing = await this.prismaService.relationship.findFirst({
      where: {
        sourceComponentId: sourceComponent.id,
        targetComponentId: targetComponent.id,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Relationship already exists between these components`,
      );
    }

    // Create relationship
    const relationship = await this.prismaService.relationship.create({
      data: {
        sourceComponentId: sourceComponent.id,
        targetComponentId: targetComponent.id,
        type: createRelationshipDto.type,
        description: createRelationshipDto.description || '',
        boardId: boardId,
      },
    });

    // Cache in Dapr state
    await this.daprStateService.setState(
      `${this.stateStoreName}:${relationship.id}`,
      relationship,
      3600,
    );

    return relationship;
  }

  async findByBoard(
    boardId: string,
    userId: string,
    filterDto: RelationshipFilterDto,
  ): Promise<{ data: Relationship[]; total: number }> {
    // Verify board exists and belongs to user
    const board = await this.prismaService.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view relationships from this board',
      );
    }

    const skip = ((filterDto.page || 1) - 1) * (filterDto.limit || 20);
    const take = filterDto.limit || 20;

    const where: Prisma.RelationshipWhereInput = {
      boardId: boardId,
    };

    if (filterDto.type) {
      where.type = filterDto.type;
    }

    const [data, total] = await Promise.all([
      this.prismaService.relationship.findMany({
        where,
        skip,
        take,
        include: {
          sourceComponent: true,
          targetComponent: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.relationship.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(relationshipId: string, userId: string): Promise<Relationship> {
    const relationship = await this.prismaService.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        board: true,
        sourceComponent: true,
        targetComponent: true,
      },
    });

    if (!relationship) {
      throw new NotFoundException(
        `Relationship with ID ${relationshipId} not found`,
      );
    }

    if (relationship.board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this relationship',
      );
    }

    return relationship;
  }

  async update(
    relationshipId: string,
    userId: string,
    updateRelationshipDto: UpdateRelationshipDto,
  ): Promise<Relationship> {
    await this.findOne(relationshipId, userId);

    const updated = await this.prismaService.relationship.update({
      where: { id: relationshipId },
      data: {
        type: updateRelationshipDto.type,
        description: updateRelationshipDto.description,
      },
    });

    // Update Dapr cache
    await this.daprStateService.setState(
      `${this.stateStoreName}:${relationshipId}`,
      updated,
      3600,
    );

    return updated;
  }

  async delete(relationshipId: string, userId: string): Promise<void> {
    const relationship = await this.findOne(relationshipId, userId);

    await this.prismaService.relationship.delete({
      where: { id: relationshipId },
    });

    // Remove from Dapr cache
    await this.daprStateService.deleteState(
      `${this.stateStoreName}:${relationshipId}`,
    );
  }

  async findByComponent(
    componentId: string,
    userId: string,
  ): Promise<Relationship[]> {
    // Verify component exists and get its board
    const component = await this.prismaService.component.findUnique({
      where: { id: componentId },
      include: { board: true },
    });

    if (!component) {
      throw new NotFoundException(
        `Component with ID ${componentId} not found`,
      );
    }

    if (component.board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this component',
      );
    }

    // Find all relationships involving this component
    return this.prismaService.relationship.findMany({
      where: {
        OR: [
          { sourceComponentId: componentId },
          { targetComponentId: componentId },
        ],
      },
      include: {
        sourceComponent: true,
        targetComponent: true,
      },
    });
  }
}
