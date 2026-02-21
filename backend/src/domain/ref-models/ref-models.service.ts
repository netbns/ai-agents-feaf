import { Injectable } from '@nestjs/common';
import { REFERENCE_MODELS, ReferenceModelDef } from './ref-models.constants';
import { ReferenceModel } from '@prisma/client';

@Injectable()
export class RefModelsService {
  getAllModels(): ReferenceModelDef[] {
    return Object.values(REFERENCE_MODELS);
  }

  getModelById(id: string): ReferenceModelDef | null {
    const model = ReferenceModel[id];
    return REFERENCE_MODELS[model] || null;
  }

  getComponentTypesForModel(models: ReferenceModel): string[] {
    return REFERENCE_MODELS[models]?.componentTypes || [];
  }
}
