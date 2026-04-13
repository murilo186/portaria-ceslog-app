import { relatorioRuntimeDeps } from "./dependencies";
import { createRelatorioItemCrudService } from "./createRelatorioItemCrudService";
import { createRelatorioLifecycleService } from "./createRelatorioLifecycleService";
import { createRelatorioQueryService } from "./createRelatorioQueryService";
import type { RelatorioServiceApi, RelatorioServiceDeps } from "./types";

export type { RelatorioServiceApi, RelatorioServiceDeps } from "./types";

export function createRelatorioService({ repository, runtime = relatorioRuntimeDeps }: RelatorioServiceDeps): RelatorioServiceApi {
  const context = {
    repository,
    runtime,
  };

  const lifecycleService = createRelatorioLifecycleService(context);
  const queryService = createRelatorioQueryService(context);
  const itemCrudService = createRelatorioItemCrudService(context);

  return {
    ...lifecycleService,
    ...queryService,
    ...itemCrudService,
  };
}
