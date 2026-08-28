/**
 * BullMQ workers — import once at app startup.
 * Cron jobs run via node-cron (see scheduler.service.js), not here.
 */

import organizationImportWorker from "./workers/organizationImport.worker.js";
import organizationDeleteWorker from "./workers/organizationDelete.worker.js";
import schoolImportWorker from "./workers/schoolImport.worker.js";
import { staffImportWorker } from "./workers/staffImport.worker.js";
import { studentImportWorker } from "./workers/studentImport.worker.js";
import { admissionImportWorker } from "./workers/admissionImport.worker.js";
import { timetableImportWorker } from "./workers/timetableImport.worker.js";

const workers = [
  organizationImportWorker,
  organizationDeleteWorker,
  schoolImportWorker,
  staffImportWorker,
  studentImportWorker,
  admissionImportWorker,
  timetableImportWorker,
];

export default workers;
