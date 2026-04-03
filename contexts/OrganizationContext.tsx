
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Organization, OrgMember, Permission, MemberRole } from '../types';
import { OrganizationService } from '../services/organizationService';
import { useAuth } from './AuthContext';
import { logger } from '../services/logger';

interface OrganizationContextType {
  /** Active organization metadata */
  organization: Organization | null;
  /** Current user's member record (null if not in org yet) */
  member: OrgMember | null;
  /** All members of the organization — only populated for owners */
  members: OrgMember[];
  loading: boolean;
  /** Reload member list (owner action) */
  refreshMembers: () => Promise<void>;
  /** True if current user is the owner */
  isOwner: boolean;
  /** Check if current user has a specific permission (owner always returns true) */
  hasPermission: (p: Permission) => boolean;
  /** Org ID shortcut */
  orgId: string | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  member: null,
  members: [],
  loading: true,
  refreshMembers: async () => {},
  isOwner: false,
  hasPermission: () => false,
  orgId: null,
});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [member, setMember] = useState<OrgMember | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = userProfile?.organizationId ?? null;

  const loadOrgData = useCallback(async () => {
    if (!user || !orgId) {
      setOrganization(null);
      setMember(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [org, mem] = await Promise.all([
        OrganizationService.getOrganization(orgId),
        OrganizationService.getMember(orgId, user.uid),
      ]);
      setOrganization(org);
      setMember(mem);

      // Load full member list if owner
      if (mem?.role === 'owner') {
        const allMembers = await OrganizationService.getMembers(orgId);
        setMembers(allMembers);
      }
    } catch (err) {
      logger.error('OrganizationContext: Failed to load org data', err);
    } finally {
      setLoading(false);
    }
  }, [user, orgId]);

  useEffect(() => { loadOrgData(); }, [loadOrgData]);

  const refreshMembers = async () => {
    if (!orgId) return;
    const allMembers = await OrganizationService.getMembers(orgId);
    setMembers(allMembers);
  };

  const isOwner = member?.role === 'owner';

  const hasPermission = (p: Permission): boolean => {
    if (isOwner) return true; // owner bypasses all checks
    return member?.permissions.includes(p) ?? false;
  };

  return (
    <OrganizationContext.Provider
      value={{ organization, member, members, loading, refreshMembers, isOwner, hasPermission, orgId }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
