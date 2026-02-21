import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ReferenceModel } from '@prisma/client';

export class BoardFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ReferenceModel)
  referenceModel?: ReferenceModel;

  @IsOptional()
  take?: number = 10;

  @IsOptional()
  skip?: number = 0;
}
