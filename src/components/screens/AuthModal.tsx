import React, { useMemo, useRef, useState } from 'react';
import { X, User, Mail, Lock, Phone, LogOut, Camera, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { user, login, signup, logout, updateProfile, changePassword } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = useMemo(() => {
    const value = (user?.name || name || 'U').trim();
    return value.charAt(0).toUpperCase();
  }, [user?.name, name]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) onClose();
    else setError(result.error || 'Unable to sign in');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!signupName.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const result = await signup(email.trim(), password, signupName.trim());
      if (result.success) {
        setMessage('Account created. If email confirmation is enabled, verify your email, then sign in.');
        setIsSignup(false);
        setPassword('');
      } else {
        setError(result.error || 'Unable to create account.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally { setLoading(false); }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Please choose an image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setProfileSaving(true);
    setError(null);
    setMessage(null);
    const result = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      avatar_url: avatar,
    });
    setProfileSaving(false);
    if (result.success) setMessage('Profile updated successfully.');
    else setError(result.error || 'Could not update profile.');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    const result = await changePassword(newPassword);
    setPasswordSaving(false);
    if (result.success) {
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully.');
    } else {
      setError(result.error || 'Could not change password.');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-modal max-w-sm w-full relative animate-slide-up border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1">
          <X size={20} />
        </button>

        {user && user.id !== 'guest-usr' ? (
          <div className="p-6">
            <div className="text-center pt-1">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-brand-500/20 shadow-md bg-brand-500 flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-extrabold">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800"
                  title="Change profile photo"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </div>
              <p className="text-[10px] text-slate-400 mb-3">Photo optional · your name initial is used by default</p>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Account Profile</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage your MyPlan account details</p>
            </div>

            {message && (
              <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} /> <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">{error}</div>
            )}

            <form onSubmit={handleProfileSave} className="mt-5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="Enter mobile number" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input value={user.email} readOnly className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/70 text-xs font-semibold text-slate-500 cursor-not-allowed" />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Login email is linked to your Supabase account.</p>
              </div>

              <button type="submit" disabled={profileSaving} className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold disabled:opacity-60">
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            <div className="my-5 border-t border-slate-100 dark:border-slate-700" />

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Change Password</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Set a new password for your MyPlan account.</p>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" minLength={6} className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold" />
                <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute right-3 top-2.5 text-slate-400">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" minLength={6} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold" />
              <button type="submit" disabled={passwordSaving} className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold disabled:opacity-60">
                {passwordSaving ? 'Changing...' : 'Change Password'}
              </button>
            </form>

            <div className="mt-5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Your Data Isolated</h4>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-0.5 leading-tight">Only your own tasks are loaded for this account.</p>
              </div>
            </div>

            <button onClick={async () => { await logout(); onClose(); }} className="mt-4 w-full py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="p-6 space-y-4">
            <div className="text-center pt-1">
              <div className="w-16 h-16 rounded-full bg-brand-500 mx-auto flex items-center justify-center text-white mb-3">
                <User size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{isSignup ? 'Create Your MyPlan Account' : 'Sign In to MyPlan'}</h3>
              <p className="text-xs text-slate-400 mt-1">{isSignup ? 'Sign up with your own email and password' : 'Access your private tasks and reminders'}</p>
            </div>
            {message && <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">{message}</div>}
            {error && <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">{error}</div>}
            {isSignup && <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative"><User size={16} className="absolute left-3 top-3 text-slate-400" /><input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} required autoComplete="name" placeholder="Your name" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold" /></div>
            </div>}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative"><Mail size={16} className="absolute left-3 top-3 text-slate-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold" /></div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Password</label>
              <div className="relative"><Lock size={16} className="absolute left-3 top-3 text-slate-400" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="At least 6 characters" className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl bg-brand-500 text-white font-bold text-xs shadow-float disabled:opacity-60">{loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}</button>
            <p className="text-center text-xs text-slate-500">{isSignup ? 'Already have an account?' : 'New to MyPlan?'} <button type="button" onClick={() => { setIsSignup(v => !v); setError(null); setMessage(null); }} className="font-bold text-brand-500 hover:underline">{isSignup ? 'Sign In' : 'Create Account'}</button></p>
          </form>
        )}
      </div>
    </div>
  );
};
