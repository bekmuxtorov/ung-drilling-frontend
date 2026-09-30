import { createResource } from '../../api/resources';
import type { DailyTransportItem, DailyWorkDescription, DerrickErectionOperation, OperationStage } from '../../api/types';

export const operationsApi = createResource<DerrickErectionOperation, Record<string, unknown>>('derrick-erection-operations');
export const stagesApi = createResource<OperationStage, Record<string, unknown>>('operation-stages');
export const dailyWorksApi = createResource<DailyWorkDescription, Record<string, unknown>>('daily-works');
export const dailyTransportsApi = createResource<DailyTransportItem, Record<string, unknown>>('daily-transports');
