import auditRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";

class AuditService {
  /**
   * Record an audit entry. Never throws — logging failures must not break
   * the primary request (fire-and-forget by design, await-safe).
   *
   * @param {object} entry
   * @param {string} [entry.actorId]    user id who performed the action
   * @param {string} [entry.actorName]  snapshot of actor display name
   * @param {string} [entry.actorRole]  snapshot of actor role
   * @param {string} entry.action       see AUDIT_ACTIONS
   * @param {string} entry.entityType   ORGANIZATION/SCHOOL/USER/STUDENT/PARENT/AUTH
   * @param {string} [entry.entityId]
   * @param {string} [entry.entityName]
   * @param {string} [entry.organizationId]
   * @param {string} [entry.schoolId]
   * @param {string} [entry.details]    JSON string with extras (reason, etc.)
   * @param {string} [entry.ipAddress]
   */
  async record(entry) {
    try {
      if (!entry || !entry.action || !entry.entityType) return;
      await auditRepository.create({
        actorId: entry.actorId || null,
        actorName: entry.actorName || null,
        actorRole: entry.actorRole || null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        entityName: entry.entityName || null,
        organizationId: entry.organizationId || null,
        schoolId: entry.schoolId || null,
        details: entry.details || null,
        ipAddress: entry.ipAddress || null,
      });
    } catch (err) {
      // Audit logging must never break the main flow.
    }
  }

  /**
   * Convenience: build the entry from a typical authenticated request.
   */
  fromRequest(user, req, entry) {
    return {
      actorId: user?.id,
      actorName: user?.name,
      actorRole: user?.role,
      ipAddress: req?.ip,
      ...entry,
    };
  }

  /**
   * List audit entries with filters.
   * - SUPER_ADMIN → platform-wide
   * - ADMIN       → own school branch only
   * - others      → forbidden
   */
  _buildWhere(user, { action, entityType, search, fromDate, toDate }) {
    const where = {};
    if (user.role === "ADMIN") {
      where.schoolId = user.schoolId;
    } else if (user.role !== "SUPER_ADMIN") {
      throw ApiError.forbiddenError(
        "You do not have permission to view the activity log."
      );
    }
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (search) {
      where.OR = [
        { actorName: { contains: search, mode: "insensitive" } },
        { entityName: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }
    return where;
  }

  async listLogs(user, { action, entityType, search, fromDate, toDate, page = 1, pageSize = 50 }) {
    const where = this._buildWhere(user, { action, entityType, search, fromDate, toDate });
    return auditRepository.list({
      where,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
  }

  async exportCsv(user, params) {
    const where = this._buildWhere(user, params);
    return auditRepository.exportCsv({ where, limit: 5000 });
  }
}

export default new AuditService();
