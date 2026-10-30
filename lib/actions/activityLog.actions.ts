"use server";

import { connectToDatabase } from "@/lib/database";
import ActivityLog from "@/lib/database/models/activityLog.model";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { GetActivityLogsParams, IActivityLog } from "@/types";
import { FilterQuery } from "mongoose";
import { escapeRegex, normalizePagination } from "@/lib/utils";

/**
 * Get paginated, filtered, and searchable activity audit logs. Super Admin only.
 */
export async function getActivityLogs(params?: GetActivityLogsParams) {
  await requireSuperAdmin();
  await connectToDatabase();

  const {
    module,
    action,
    actorEmail,
    search = "",
    startDate,
    endDate,
    page = 1,
    limit = 25,
  } = params || {};

  const pagination = normalizePagination(page, limit, 25, 100);
  const skip = (pagination.page - 1) * pagination.limit;
  const query: FilterQuery<typeof ActivityLog> = {};

  if (module && module !== "all") {
    query.module = module;
  }

  if (action && action !== "all") {
    query.action = action;
  }

  if (actorEmail && actorEmail !== "all") {
    query.actorEmail = actorEmail.toLowerCase().trim();
  }

  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(escapeRegex(term), "i");
    query.$or = [
      { details: regex },
      { actorEmail: regex },
      { resourceName: regex },
      { resourceId: regex },
      { action: regex },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),
    ActivityLog.countDocuments(query),
  ]);

  return {
    logs: JSON.parse(JSON.stringify(logs)) as IActivityLog[],
    total,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1,
    page: pagination.page,
  };
}

/**
 * Get all activity logs matching filter criteria for Excel export. Super Admin only.
 */
export async function getAllLogsForExport(params?: GetActivityLogsParams) {
  await requireSuperAdmin();
  await connectToDatabase();

  const {
    module,
    action,
    actorEmail,
    search = "",
    startDate,
    endDate,
  } = params || {};

  const query: FilterQuery<typeof ActivityLog> = {};

  if (module && module !== "all") {
    query.module = module;
  }
  if (action && action !== "all") {
    query.action = action;
  }
  if (actorEmail && actorEmail !== "all") {
    query.actorEmail = actorEmail.toLowerCase().trim();
  }
  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(escapeRegex(term), "i");
    query.$or = [
      { details: regex },
      { actorEmail: regex },
      { resourceName: regex },
      { resourceId: regex },
      { action: regex },
    ];
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const logs = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();
  return JSON.parse(JSON.stringify(logs)) as IActivityLog[];
}
