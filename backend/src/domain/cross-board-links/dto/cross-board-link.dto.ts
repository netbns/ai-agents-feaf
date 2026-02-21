import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCrossBoardLinkDto {
  @ApiProperty({ example: 'component-1-on-prm-id' })
  @IsString()
  sourceComponentId: string;

  @ApiProperty({ example: 'component-2-on-arm-id' })
  @IsString()
  targetComponentId: string;

  @ApiPropertyOptional({ example: 'Maps to Architecture Model' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'manual' })
  @IsOptional()
  @IsString()
  linkType?: string; // 'manual', 'automated', 'inferred'
}

export class UpdateCrossBoardLinkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CrossBoardLinkFilterDto {
  @ApiPropertyOptional({ example: 'manual' })
  @IsOptional()
  @IsString()
  linkType?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number = 20;
}
