import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import Logger from "../../lib/utils/logger.js";
import evolutionService from "../../services/evolution.service.js";
import { instanceNameFor } from "../../services/whatsappProvider.js";

const logger = new Logger("whatsapp-instance-service");

/** Row ko safe shape me return karta hai (qrCode data-url hai, UI direct img bana sakta hai). */
function shape(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organizationId,
    schoolId: row.schoolId,
    instanceName: row.instanceName,
    integration: row.integration,
    state: row.state,
    phoneNumber: row.phoneNumber,
    displayName: row.displayName,
    profilePicUrl: row.profilePicUrl,
    isEnabled: row.isEnabled,
    qrCode: row.state === "AWAITING_QR" ? row.qrCode : null,
    qrExpiresAt: row.qrExpiresAt,
    lastConnectedAt: row.lastConnectedAt,
    lastError: row.lastError,
    updatedAt: row.updatedAt,
  };
}

class WhatsAppInstanceService {
  /** Branch-level access check (same rules as storage settings). */
  async _assertAccess(requester, organizationId, schoolId) {
    if (!organizationId) throw ApiError.badRequestError("organizationId is required");
    if (!schoolId) {
      throw ApiError.badRequestError("schoolId is required - WhatsApp instance belongs to a branch");
    }
    if (requester.role === "SUPER_ADMIN") {
      await this._assertBranchInOrg(organizationId, schoolId);
      return;
    }
    if (requester.role === "ADMIN" && requester.organizationId === organizationId) {
      const allowed = new Set(
        [requester.schoolId, ...(Array.isArray(requester.branchAccess) ? requester.branchAccess : [])].filter(Boolean)
      );
      if (!allowed.has(schoolId)) {
        throw ApiError.forbiddenError("You can only manage WhatsApp for a branch you administer");
      }
    } else {
      throw ApiError.forbiddenError("You cannot manage WhatsApp for this organization");
    }
    await this._assertBranchInOrg(organizationId, schoolId);
  }

  async _assertBranchInOrg(organizationId, schoolId) {
    const branch = await prisma.school.findFirst({
      where: { id: schoolId, organizationId },
      select: { id: true },
    });
    if (!branch) throw ApiError.badRequestError("schoolId does not belong to this organization");
  }

  async getStatus(requester, organizationId, schoolId) {
    await this._assertAccess(requester, organizationId, schoolId);
    const row = await prisma.whatsAppInstance.findUnique({ where: { schoolId } });
    return shape(row);
  }

  async listByOrg(requester, organizationId) {
    if (!organizationId) throw ApiError.badRequestError("organizationId is required");
    if (requester.role !== "SUPER_ADMIN" && !(requester.role === "ADMIN" && requester.organizationId === organizationId)) {
      throw ApiError.forbiddenError("You cannot view WhatsApp instances for this organization");
    }
    const rows = await prisma.whatsAppInstance.findMany({
      where: { organizationId },
      include: { school: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({ ...shape(r), schoolName: r.school?.name || null }));
  }

  /** Instance create karke QR deta hai; row upsert. */
  async connect(requester, organizationId, schoolId) {
    await this._assertAccess(requester, organizationId, schoolId);
    const instanceName = instanceNameFor(schoolId);

    let row = await prisma.whatsAppInstance.findUnique({ where: { schoolId } });
    if (!row) {
      row = await prisma.whatsAppInstance.create({
        data: { organizationId, schoolId, instanceName, integration: "WHATSAPP_BAILEYS", state: "DISCONNECTED" },
      });
    }

    try {
      await evolutionService.createInstance({ instanceName, integration: "WHATSAPP_BAILEYS" });
    } catch (err) {
      // Instance already exists server-side → QR refresh se aage badh jao.
      const msg = String(err?.message || "").toLowerCase();
      if (!msg.includes("already") && !msg.includes("exist") && !msg.includes("409")) {
        await this._markFailed(row.id, err.message);
        throw err;
      }
    }

    const qr = await evolutionService.getQr(instanceName);
    row = await prisma.whatsAppInstance.update({
      where: { id: row.id },
      data: {
        state: "AWAITING_QR",
        qrCode: qr.qr,
        qrExpiresAt: new Date(Date.now() + 60_000),
        lastError: qr.qr ? null : "QR not generated yet",
      },
    });
    logger.logger.info(`[WhatsApp] QR issued for ${instanceName}`);
    return shape(row);
  }

  async refreshQr(requester, organizationId, schoolId) {
    const row = await this._assertAccess(requester, organizationId, schoolId);
    const existing = await prisma.whatsAppInstance.findUnique({ where: { schoolId } });
    if (!existing) {
      return this.connect(requester, organizationId, schoolId);
    }
    const qr = await evolutionService.getQr(existing.instanceName);
    const updated = await prisma.whatsAppInstance.update({
      where: { id: existing.id },
      data: {
        state: "AWAITING_QR",
        qrCode: qr.qr,
        qrExpiresAt: new Date(Date.now() + 60_000),
        lastError: qr.qr ? null : "QR not generated yet",
      },
    });
    return shape(updated);
  }

  /** Evolution se live state pull karta hai; CONNECTED hone par number save + enabled. */
  async sync(requester, organizationId, schoolId) {
    await this._assertAccess(requester, organizationId, schoolId);
    const row = await prisma.whatsAppInstance.findUnique({ where: { schoolId } });
    if (!row) return null;

    let stateRes;
    try {
      stateRes = await evolutionService.connectionState(row.instanceName);
    } catch (err) {
      const updated = await prisma.whatsAppInstance.update({
        where: { id: row.id },
        data: { lastError: err.message },
      });
      return shape(updated);
    }

    if (stateRes.connected) {
      const live = await evolutionService.fetchInstance(row.instanceName);
      const ownerJid = live?.ownerJid || live?.number || "";
      const phoneNumber = ownerJid.replace(/@.*$/, "").replace(/^whatsapp:/, "") || row.phoneNumber;
      const updated = await prisma.whatsAppInstance.update({
        where: { id: row.id },
        data: {
          state: "CONNECTED",
          phoneNumber,
          displayName: live?.profileName || row.displayName,
          isEnabled: true,
          qrCode: null,
          qrExpiresAt: null,
          lastConnectedAt: new Date(),
          lastError: null,
        },
      });
      return shape(updated);
    }

    const updated = await prisma.whatsAppInstance.update({
      where: { id: row.id },
      data: {
        state: stateRes.state === "close" ? "DISCONNECTED" : row.state,
        lastError: null,
      },
    });
    return shape(updated);
  }

  async setEnabled(requester, organizationId, schoolId, isEnabled) {
    await this._assertAccess(requester, organizationId, schoolId);
    const row = await prisma.whatsAppInstance.findUnique({ where: { schoolId } });
    if (!row) throw ApiError.notFoundError("No WhatsApp instance for this branch");
    const updated = await prisma.whatsAppInstance.update({
      where: { id: row.id },
      data: { isEnabled: Boolean(isEnabled) },
    });
    return shape(updated);
  }

  async remove(requester, organizationId, schoolId) {
    await this._assertAccess(requester, organizationId, schoolId);
    const row = await prisma.whatsAppInstance.findUnique({ where: { schoolId } });
    if (!row) return true;
    await evolutionService.safeDeleteInstance(row.instanceName);
    await prisma.whatsAppInstance.delete({ where: { id: row.id } });
    logger.logger.info(`[WhatsApp] instance removed for ${row.instanceName}`);
    return true;
  }

  async _markFailed(id, message) {
    try {
      await prisma.whatsAppInstance.update({ where: { id }, data: { state: "FAILED", lastError: String(message).slice(0, 500) } });
    } catch { /* ignore */ }
  }
}

export default new WhatsAppInstanceService();
