import {
  getClosedReportsCache,
  getOpenReportCache,
  getReportDetailCache,
  invalidateRelatorioReadCaches,
  setClosedReportsCache,
  setOpenReportCache,
  setReportDetailCache,
} from "./cache";
import { assertCanManageItem, getDateRange } from "./policies";
import { closeStaleOpenReports } from "./staleReports";
import { sanitizeNullableText, sanitizeText } from "../../utils/sanitize";
import { getCurrentBusinessDateKey, getCurrentDate } from "../../utils/clock";
import { getBusinessDateKey } from "../../utils/date";

export type RelatorioRuntimeDeps = {
  cache: {
    getClosedReportsCache: typeof getClosedReportsCache;
    getOpenReportCache: typeof getOpenReportCache;
    getReportDetailCache: typeof getReportDetailCache;
    invalidateRelatorioReadCaches: typeof invalidateRelatorioReadCaches;
    setClosedReportsCache: typeof setClosedReportsCache;
    setOpenReportCache: typeof setOpenReportCache;
    setReportDetailCache: typeof setReportDetailCache;
  };
  policies: {
    assertCanManageItem: typeof assertCanManageItem;
    getDateRange: typeof getDateRange;
  };
  staleReports: {
    closeStaleOpenReports: typeof closeStaleOpenReports;
  };
  sanitize: {
    sanitizeNullableText: typeof sanitizeNullableText;
    sanitizeText: typeof sanitizeText;
  };
  clock: {
    getBusinessDateKey: typeof getBusinessDateKey;
    getCurrentBusinessDateKey: typeof getCurrentBusinessDateKey;
    getCurrentDate: typeof getCurrentDate;
  };
};

export const relatorioRuntimeDeps: RelatorioRuntimeDeps = {
  cache: {
    getClosedReportsCache,
    getOpenReportCache,
    getReportDetailCache,
    invalidateRelatorioReadCaches,
    setClosedReportsCache,
    setOpenReportCache,
    setReportDetailCache,
  },
  policies: {
    assertCanManageItem,
    getDateRange,
  },
  staleReports: {
    closeStaleOpenReports,
  },
  sanitize: {
    sanitizeNullableText,
    sanitizeText,
  },
  clock: {
    getBusinessDateKey,
    getCurrentBusinessDateKey,
    getCurrentDate,
  },
};
