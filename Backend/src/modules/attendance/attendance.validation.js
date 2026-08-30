import { z } from "zod";

export const createDeviceSchema = z.object({
  body: z.object({
    deviceName: z.string().min(2, "Device name must be at least 2 characters"),
    type: z.enum(["QR_WEB_CAMERA", "QR_HANDHELD_SCANNER", "RFID_READER"]).optional(),
    deviceMac: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const scanQrSchema = z.object({
  body: z.object({
    identifierCode: z.string().min(1, "Identifier code (QR value) is required"),
    deviceId: z.string().uuid("Invalid device ID format").optional(),
    method: z.enum(["QR", "RFID", "MANUAL"]).optional().default("QR"),
    scannedAt: z.string().datetime().optional(),
    synced: z.boolean().optional().default(true),
  }),
});

export const syncOfflineScansSchema = z.object({
  body: z.object({
    scans: z.array(
      z.object({
        identifierCode: z.string().min(1),
        deviceId: z.string().uuid().optional(),
        method: z.enum(["QR", "RFID", "MANUAL"]).optional().default("QR"),
        scannedAt: z.string().datetime(),
      })
    ).min(1, "At least one scan record is required"),
  }),
});

export const manualOverrideSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID"),
    date: z.string().min(1, "Date is required (YYYY-MM-DD)"),
    status: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE", "MANUAL_OVERRIDE"]),
    remarks: z.string().optional(),
  }),
});

export const bulkSectionAttendanceSchema = z.object({
  body: z.object({
    sectionId: z.string().uuid("Invalid section ID"),
    date: z.string().min(1, "Date is required (YYYY-MM-DD)"),
    records: z.array(
      z.object({
        studentId: z.string().uuid("Invalid student ID"),
        status: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE"]),
        remarks: z.string().optional(),
      })
    ).min(1, "At least one student record is required"),
  }),
});

export const updateAttendanceRecordSchema = z.object({
  body: z.object({
    status: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE", "MANUAL_OVERRIDE"]).optional(),
    remarks: z.string().optional(),
  }),
});

export const markStaffAttendanceSchema = z.object({
  body: z.object({
    date: z.string().min(1, "Date is required (YYYY-MM-DD)"),
    records: z.array(
      z.object({
        userId: z.string().uuid("Invalid user/staff ID"),
        status: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE"]),
        remarks: z.string().optional(),
      })
    ).min(1, "At least one staff record is required"),
  }),
});

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const addOffDaySchema = z.object({
  body: z.object({
    date: dateOnly,
    reason: z.string().trim().max(80, "Reason too long").optional(),
  }),
});

export const removeOffDaySchema = z.object({
  params: z.object({
    date: dateOnly,
  }),
});

export const updateWeeklyOffSchema = z.object({
  body: z.object({
    weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  }),
});

