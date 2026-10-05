import { createResource } from '../../api/resources';
import type {
  AvailableResourcesBPA,
  DailyWorkDescriptionBPA,
  DepthsLayersLength,
  DrillingBPA,
  DrillingBPADetail,
  WellDesign,
  WellDesignInLength,
} from '../../api/types';

export const drillingBpaApi = createResource<DrillingBPADetail, Record<string, unknown>>('drilling-bpas');
export const drillingBpaListApi = createResource<DrillingBPA, Record<string, unknown>>('drilling-bpas');

export const wellDesignApi = createResource<WellDesign, Record<string, unknown>>('well-designs');
export const wellDesignInLengthApi = createResource<WellDesignInLength, Record<string, unknown>>('well-designs-in-length');
export const depthsLayersLengthApi = createResource<DepthsLayersLength, Record<string, unknown>>('depths-layers-lengths');
export const dailyWorksBpaApi = createResource<DailyWorkDescriptionBPA, Record<string, unknown>>('daily-works-bpa');
export const availableResourcesBpaApi = createResource<AvailableResourcesBPA, Record<string, unknown>>('available-resources-bpa');
