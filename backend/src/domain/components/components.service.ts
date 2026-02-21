import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprStateService } from '../dapr/dapr-state.service';
import { RefModelsService } from '../ref-models/ref-models.service';
import { CreateComponentDto, UpdateComponentDto, ComponentFilterDto } from './dto/component.dto';
import { Component, Prisma } from '@prisma/client';

@Injectable()
export class ComponentsService {
  private readonly stateStoreName = 'components-state';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly daprStateService: DaprStateService,
    private readonly refModelsService: RefModelsService,
  ) {}

  async create(
    boardId: string,
    userId: string,
    createComponentDto: CreateComponentDto,
  ): Promise<Component> {
    // Verify board exists and belongs to user
    const board = await this.prismaService.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add components to this board',
      );
    }

    // Validate component type matches board reference model
    const model = this.refModelsService.getModelById(board.referenceModel);
    if (!model.componentTypes.includes(createComponentDto.type)) {
      throw new BadRequestException(
        `Component type ${createComponentDto.type} is not valid for ${board.referenceModel} model. Valid types: ${model.componentTypes.join(', ')}`,
      );
    }

    // Create component
    const component = await this.prismaService.component.create({
      data: {
        name: createComponentDto.name,
        description: createComponentDto.description || '',
        type: createComponentDto.type,
        properties: createComponentDto.properties || {},
        positionX: createComponentDto.position?.x || 0,
        positionY: createComponentDto.position?.y || 0,
        boardId: boardId,
      },
    });

    // Cache in Dapr state
    await this.daprStateService.setState(
      `${this.stateStoreName}:${component.id}`,
      component,
      3600, // 1 hour TTL
    );

    return component;
  }

  async findByBoard(
    boardId: string,
    userId: string,
    filterDto: ComponentFilterDto,
  ): Promise<{ data: Component[]; total: number }> {
    // Verify board exists and belongs to user
    const board = await this.prismaService.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view components from this board',
      );
    }

    const skip = ((filterDto.page || 1) - 1) * (filterDto.limit || 20);
    const take = filterDto.limit || 20;

    const where: Prisma.ComponentWhereInput = {
      boardId: boardId,
    };

    if (filterDto.type) {
      where.type = filterDto.type;
    }

    if (filterDto.search) {
      where.OR = [
        { name: { contains: filterDto.search, mode: 'insensitive' } },
        { description: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaService.component.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.component.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(componentId: string, userId: string): Promise<Component> {
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

    return component;
  }

  async update(
    componentId: string,
    userId: string,
    updateComponentDto: UpdateComponentDto,
  ): Promise<Component> {
    const component = await this.findOne(componentId, userId);

    // If type is being updated, validate it against board reference model
    if (updateComponentDto.type && updateComponentDto.type !== component.type) {
      const board = await this.prismaService.board.findUnique({
        where: { id: component.boardId },
      });
      const model = this.refModelsService.getModelById(board.referenceModel);
      if (!model.componentTypes.includes(updateComponentDto.type)) {
        throw new BadRequestException(
          `Component type ${updateComponentDto.type} is not valid for ${board.referenceModel} model`,
        );
      }
    }

    const updated = await this.prismaService.component.update({
      where: { id: componentId },
      data: {
        name: updateComponentDto.name,
        description: updateComponentDto.description,
        type: updateComponentDto.type,
        properties: updateComponentDto.properties,
        positionX: updateComponentDto.position?.x,
        positionY: updateComponentDto.position?.y,
      },
    });

    // Update Dapr cache
    await this.daprStateService.setState(
      `${this.stateStoreName}:${componentId}`,
      updated,
      3600,
    );

    return updated;
  }

  async delete(componentId: string, userId: string): Promise<void> {
    const component = await this.findOne(componentId, userId);

    await this.prismaService.component.delete({
      where: { id: componentId },
    });

    // Remove from Dapr cache
    await this.daprStateService.deleteState(`${this.stateStoreName}:${componentId}`);
  }

  async updateBulkPositions(
    boardId: string,
    userId: string,
    updates: Array<{ id: string; position: { x?: number; y?: number } }>,
  ): Promise<Component[]> {
    // Verify board exists and belongs to user
    const board = await this.prismaService.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    if (board.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this board',
      );
    }

    // Update positions for all components
    const updated = await Promise.all(
      updates.map((update) =>
        this.prismaService.component.update({
          where: { id: update.id },
          data: {
            positionX: update.position?.x ?? 0,
            positionY: update.position?.y ?? 0,
          },
        }),
      ),
    );

    // Update Dapr cache for all
    await Promise.all(
      updated.map((component) =>
        this.daprStateService.setState(
          `${this.stateStoreName}:${component.id}`,
          component,
          3600,
        ),
      ),
    );

    return updated;
  }
}
