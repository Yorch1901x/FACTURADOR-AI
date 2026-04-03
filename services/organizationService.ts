
import {
  doc, setDoc, getDoc, collection, getDocs, query,
  where, deleteDoc, updateDoc, arrayUnion, arrayRemove, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';
import {
  Organization, OrgMember, UserProfile, InviteCode,
  Permission, MemberRole, AppSettings
} from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const randomCode = (): string =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const nowISO = (): string => new Date().toISOString();

// ─── Organization Service ─────────────────────────────────────────────────────

export const OrganizationService = {

  // ── User Profile ────────────────────────────────────────────────────────────

  /** Create or update user profile in Firestore */
  async ensureUserProfile(uid: string, email: string, displayName?: string): Promise<UserProfile> {
    if (!db) throw new Error('Firebase not initialized');
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    const profile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      organizationId: null,
      createdAt: nowISO(),
    };
    await setDoc(ref, profile);
    return profile;
  },

  /** Get user profile */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  },

  /** Set user's active organization */
  async setUserOrganization(uid: string, orgId: string | null): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    await setDoc(doc(db, 'users', uid), { organizationId: orgId }, { merge: true });
  },

  // ── Organization CRUD ───────────────────────────────────────────────────────

  /** Create a new organization. Adds owner as first member. */
  async createOrganization(
    ownerId: string,
    ownerEmail: string,
    ownerDisplayName: string,
    orgName: string,
  ): Promise<Organization> {
    if (!db) throw new Error('Firebase not initialized');

    const orgId = crypto.randomUUID();
    const org: Organization = { id: orgId, name: orgName, ownerId, createdAt: nowISO() };

    const defaultSettings: AppSettings = {
      companyName: orgName,
      companyTaxId: '',
      currency: 'CRC',
      exchangeRate: 520,
      taxRate: 13,
      address: '',
      hacienda: { environment: 'staging' },
    };

    const ownerMember: OrgMember = {
      uid: ownerId,
      email: ownerEmail,
      displayName: ownerDisplayName,
      role: 'owner',
      permissions: [],
      addedAt: nowISO(),
    };

    // Sequential writes (org doc first — other writes reference it for auth rules)
    await setDoc(doc(db, 'organizations', orgId), org);
    await setDoc(doc(db, 'organizations', orgId, 'settings', 'general'), defaultSettings);
    await setDoc(doc(db, 'organizations', orgId, 'members', ownerId), ownerMember);
    await setDoc(doc(db, 'users', ownerId), { organizationId: orgId }, { merge: true });

    return org;
  },

  /** Get organization metadata */
  async getOrganization(orgId: string): Promise<Organization | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'organizations', orgId));
    return snap.exists() ? (snap.data() as Organization) : null;
  },

  // ── Members ─────────────────────────────────────────────────────────────────

  /** Get current member record for a user */
  async getMember(orgId: string, uid: string): Promise<OrgMember | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'organizations', orgId, 'members', uid));
    return snap.exists() ? (snap.data() as OrgMember) : null;
  },

  /** Get all members of an organization */
  async getMembers(orgId: string): Promise<OrgMember[]> {
    if (!db) return [];
    const snap = await getDocs(collection(db, 'organizations', orgId, 'members'));
    return snap.docs.map(d => d.data() as OrgMember);
  },

  /**
   * Add a registered user (by email) to an organization.
   * Only the owner should call this.
   */
  async addMemberByEmail(
    orgId: string,
    email: string,
  ): Promise<{ success: boolean; message: string; member?: OrgMember }> {
    if (!db) return { success: false, message: 'Firebase no disponible.' };

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, message: 'No existe un usuario registrado con ese correo.' };
    }

    const userProfile = snap.docs[0].data() as UserProfile;

    const existing = await OrganizationService.getMember(orgId, userProfile.uid);
    if (existing) {
      return { success: false, message: 'El usuario ya es miembro de esta organización.' };
    }

    const member: OrgMember = {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      role: 'user',
      permissions: [],
      addedAt: nowISO(),
    };

    await setDoc(doc(db, 'organizations', orgId, 'members', userProfile.uid), member);
    await setDoc(doc(db, 'users', userProfile.uid), { organizationId: orgId }, { merge: true });

    return { success: true, message: 'Usuario agregado correctamente.', member };
  },

  /** Remove a member from an organization */
  async removeMember(orgId: string, uid: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'organizations', orgId, 'members', uid));
    await setDoc(doc(db, 'users', uid), { organizationId: null }, { merge: true });
  },

  // ── Permissions ──────────────────────────────────────────────────────────────

  /** Update the permissions array for a user member */
  async setMemberPermissions(
    orgId: string,
    uid: string,
    permissions: Permission[],
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    await updateDoc(doc(db, 'organizations', orgId, 'members', uid), { permissions });
  },

  // ── Invite Codes ─────────────────────────────────────────────────────────────

  /** Generate a 6-char invite code valid for 24 hours (single-use, deleted after redemption) */
  async createInviteCode(orgId: string, orgName: string, createdBy: string): Promise<InviteCode> {
    if (!db) throw new Error('Firebase not initialized');

    const code = randomCode();
    const now = new Date();
    // 24-hour expiry
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const invite: InviteCode = {
      code,
      orgId,
      orgName,
      createdBy,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      used: false,
    };

    await setDoc(doc(db, 'inviteCodes', code), invite);
    return invite;
  },

  /** Redeem an invite code. Adds user to org, then DELETES the code document. */
  async redeemInviteCode(
    code: string,
    uid: string,
    email: string,
    displayName: string,
  ): Promise<{ success: boolean; message: string; orgId?: string }> {
    if (!db) return { success: false, message: 'Firebase no disponible.' };

    // 1. Read the invite code
    const ref = doc(db, 'inviteCodes', code.toUpperCase().trim());
    const snap = await getDoc(ref);

    if (!snap.exists()) return { success: false, message: 'Código inválido, expirado o ya fue utilizado.' };

    const invite = snap.data() as InviteCode;

    if (invite.used) return { success: false, message: 'Este código ya fue utilizado.' };
    if (new Date() > new Date(invite.expiresAt)) {
      // Clean up expired code
      await deleteDoc(ref).catch(() => {});
      return { success: false, message: 'El código ha expirado. Solicita uno nuevo al administrador.' };
    }

    // 2. Check not already a member (safe try-catch for permission edge cases)
    let isAlreadyMember = false;
    try {
      const existing = await OrganizationService.getMember(invite.orgId, uid);
      isAlreadyMember = existing !== null;
    } catch {
      isAlreadyMember = false;
    }

    if (isAlreadyMember) {
      return { success: false, message: 'Ya eres miembro de esta organización.' };
    }

    // 3. Create the member record
    const member: OrgMember = {
      uid,
      email,
      displayName,
      role: 'user',
      permissions: [],
      addedAt: nowISO(),
    };

    await setDoc(doc(db, 'organizations', invite.orgId, 'members', uid), member);

    // 4. Link user profile to org
    await setDoc(doc(db, 'users', uid), { organizationId: invite.orgId }, { merge: true });

    // 5. DELETE the invite code — truly single-use, no trace left
    await deleteDoc(ref);

    return { success: true, message: 'Te has unido a la organización.', orgId: invite.orgId };
  },
};

