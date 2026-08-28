export class OrganizationResponseDTO {
  constructor(org) {
    this.id = org.id;
    this.name = org.name;
    this.slug = org.slug;
    this.code = org.code;
    this.logoUrl = org.logoUrl || null;
    this.themeColor = org.themeColor || null;
    this.phone = org.phone || null;
    this.email = org.email || null;
    this.website = org.website || null;
    this.facebookUrl = org.facebookUrl || null;
    this.instagramUrl = org.instagramUrl || null;
    this.twitterUrl = org.twitterUrl || null;
    this.youtubeUrl = org.youtubeUrl || null;
    // Super Admin login username (only populated on detail responses)
    this.adminUsername = org.users?.[0]?.username || null;
    // Real status field (spec §5) — SETUP_PENDING/ACTIVE/PARTIALLY_BLOCKED/BLOCKED
    this.status = org.status || "SETUP_PENDING";
    this.blockedBranchCount = org.blockedBranchCount ?? (org.branches ?? []).filter((b) => b.status === "BLOCKED").length;
    this.createdAt = org.createdAt;
    // Pass through relational counts (branches/users) when the repository
    // included them — powers count display without N+1 school fetches.
    if (org._count) this._count = org._count;
    if (org.revenue !== undefined) this.revenue = org.revenue;
  }

  static toDTO(org) {
    if (!org) return null;
    return new OrganizationResponseDTO(org);
  }
}
