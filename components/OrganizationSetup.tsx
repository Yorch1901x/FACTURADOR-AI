
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrganizationService } from '../services/organizationService';
import { logger } from '../services/logger';
import {
  Building2, Users, Plus, Key, Loader2, ChevronRight,
  Sparkles, ArrowLeft, CheckCircle2, AlertCircle, LogOut
} from 'lucide-react';

type Step = 'choose' | 'create' | 'join';

const OrganizationSetup: React.FC = () => {
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('choose');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Refreshes the user profile and polls until organizationId is set
   * (Firestore propagation can lag slightly after createOrganization writes).
   */
  const waitForOrg = async (): Promise<void> => {
    for (let i = 0; i < 8; i++) {
      await refreshProfile();
      const profile = await OrganizationService.getUserProfile(user!.uid);
      if (profile?.organizationId) {
        navigate('/workspace', { replace: true });
        return;
      }
      await new Promise(r => setTimeout(r, 600));
    }
    // Fallback: force navigation even if profile didn't update
    navigate('/workspace', { replace: true });
  };

  const email = user?.email ?? '';
  const displayName = userProfile?.displayName ?? email.split('@')[0];

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await OrganizationService.createOrganization(
        user!.uid,
        email,
        displayName,
        orgName.trim(),
      );
      await waitForOrg();
    } catch (err) {
      logger.error('OrganizationSetup.create', err);
      setError('Error al crear la organización. Intente nuevamente.');
      setLoading(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await OrganizationService.redeemInviteCode(
        inviteCode.trim(),
        user!.uid,
        email,
        displayName,
      );
      if (result.success) {
        setSuccess('¡Te has unido! Cargando tu espacio de trabajo…');
        await waitForOrg();
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      logger.error('OrganizationSetup.join', err);
      setError('Error al unirse. Intente nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full opacity-5 animate-orb"
        style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full opacity-5 animate-orb-alt"
        style={{ background: 'radial-gradient(circle, #d1d5db 0%, transparent 65%)' }} />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
            <Sparkles size={22} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Facturador AI</h1>
            <p className="text-gray-600 text-xs">Configuración inicial</p>
          </div>
        </div>

        {/* ── STEP: choose ─────────────────────────────────────── */}
        {step === 'choose' && (
          <div className="space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Bienvenido</h2>
              <p className="text-gray-400 text-sm">
                Hola, <span className="text-white font-semibold">{email}</span>.<br />
                Para continuar, crea una organización o únete a una existente.
              </p>
            </div>

            <button
              onClick={() => setStep('create')}
              className="w-full group relative overflow-hidden bg-white text-black rounded-2xl p-5 flex items-center gap-4 font-bold hover:bg-gray-100 transition-all shadow-xl"
            >
              <div className="h-12 w-12 rounded-xl bg-black flex items-center justify-center flex-shrink-0 shadow-inner">
                <Building2 size={22} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-black text-lg">Crear una organización</p>
                <p className="text-gray-500 font-normal text-sm">Soy dueño de un negocio</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setStep('join')}
              className="w-full group bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-2xl p-5 flex items-center gap-4 font-bold transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Key size={22} className="text-gray-300" />
              </div>
              <div className="text-left flex-1">
                <p className="font-black text-lg">Unirme con un código</p>
                <p className="text-gray-500 font-normal text-sm">Tengo un código de invitación</p>
              </div>
              <ChevronRight size={20} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={logout}
              className="w-full mt-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-400 text-sm py-3 transition-colors"
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        )}

        {/* ── STEP: create ─────────────────────────────────────── */}
        {step === 'create' && (
          <div>
            <button onClick={() => { setStep('choose'); setError(''); }}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors">
              <ArrowLeft size={15} /> Volver
            </button>
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <Building2 size={20} className="text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Nueva Organización</h2>
                  <p className="text-gray-500 text-xs">Serás el administrador (owner)</p>
                </div>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="Ej. Inversiones del Valle S.A."
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg">
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Creando…</>
                    : <><Plus size={18} /> Crear Organización</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── STEP: join ───────────────────────────────────────── */}
        {step === 'join' && (
          <div>
            <button onClick={() => { setStep('choose'); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors">
              <ArrowLeft size={15} /> Volver
            </button>
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <Key size={20} className="text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Unirse con Código</h2>
                  <p className="text-gray-500 text-xs">Solicita el código al administrador</p>
                </div>
              </div>

              <form onSubmit={handleJoinOrg} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Código de invitación
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all text-center text-2xl font-mono tracking-[0.5em]"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle size={16} className="flex-shrink-0" /><span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                    <CheckCircle2 size={16} className="flex-shrink-0" /><span>{success}</span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg">
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Verificando…</>
                    : <><Users size={18} /> Unirse a la Organización</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationSetup;
