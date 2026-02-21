import { ReferenceModel } from '@prisma/client';

const PRMComponentTypes = ['KPI', 'METRIC', 'MEASUREMENT_CATEGORY'] as const;
const BRMComponentTypes = ['BUSINESS_FUNCTION', 'SERVICE', 'CAPABILITY'] as const;
const DRMComponentTypes = ['DATA_ENTITY', 'STANDARD', 'EXCHANGE_FORMAT'] as const;
const ARMComponentTypes = ['APPLICATION', 'INTERFACE', 'APPLICATION_SERVICE'] as const;
const IRMComponentTypes = ['INFRASTRUCTURE_ELEMENT', 'PLATFORM', 'NETWORK_COMPONENT'] as const;
const SRMComponentTypes = ['SECURITY_CONTROL', 'POLICY', 'RISK_ELEMENT'] as const;

export interface ReferenceModelDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  componentTypes: string[];
  icon: string;
}

export const REFERENCE_MODELS: Record<ReferenceModel, ReferenceModelDef> = {
  [ReferenceModel.PRM]: {
    id: 'PRM',
    name: 'Performance Reference Model',
    shortName: 'PRM',
    description:
      'Provides metrics and Key Performance Indicators (KPIs) for enterprise performance measurement and tracking.',
    componentTypes: [...PRMComponentTypes],
    icon: '📊',
  },
  [ReferenceModel.BRM]: {
    id: 'BRM',
    name: 'Business Reference Model',
    shortName: 'BRM',
    description:
      'Represents the business functions, services, and capabilities of the enterprise.',
    componentTypes: [...BRMComponentTypes],
    icon: '🏢',
  },
  [ReferenceModel.DRM]: {
    id: 'DRM',
    name: 'Data Reference Model',
    shortName: 'DRM',
    description:
      'Defines the data entities, standards, and exchange formats used across the enterprise.',
    componentTypes: [...DRMComponentTypes],
    icon: '📁',
  },
  [ReferenceModel.ARM]: {
    id: 'ARM',
    name: 'Application Reference Model',
    shortName: 'ARM',
    description:
      'Describes the application portfolio and integration architecture of the enterprise.',
    componentTypes: [...ARMComponentTypes],
    icon: '⚙️',
  },
  [ReferenceModel.IRM]: {
    id: 'IRM',
    name: 'Infrastructure Reference Model',
    shortName: 'IRM',
    description:
      'Represents infrastructure elements, platforms, and network components.',
    componentTypes: [...IRMComponentTypes],
    icon: '🖥️',
  },
  [ReferenceModel.SRM]: {
    id: 'SRM',
    name: 'Security Reference Model',
    shortName: 'SRM',
    description:
      'Defines security controls, policies, and risk management elements.',
    componentTypes: [...SRMComponentTypes],
    icon: '🔒',
  },
};

export const getComponentTypesForModel = (
  model: ReferenceModel,
): string[] => {
  return REFERENCE_MODELS[model]?.componentTypes || [];
};

export const getReferenceModel = (id: string): ReferenceModelDef | null => {
  const model = ReferenceModel[id];
  return REFERENCE_MODELS[model] || null;
};
