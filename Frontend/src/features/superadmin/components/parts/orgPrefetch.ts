import { orgService, schoolService } from '@/lib/api';
import type { Organization, School } from '@/types';

const cache = new Map<string, { org: Promise<Organization>; schools: Promise<School[]> }>();
const TTL_MS = 15_000;

export function prefetchOrganizationDetail(id: string) {
  if (cache.has(id)) return;
  cache.set(id, {
    org: orgService.getById(id),
    schools: schoolService.getAll(id),
  });
  setTimeout(() => cache.delete(id), TTL_MS);
}

export function takePrefetchedOrganization(id: string) {
  const entry = cache.get(id);
  cache.delete(id);
  return entry;
}
