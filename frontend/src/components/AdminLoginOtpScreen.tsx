import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Shield, KeyRound } from 'lucide-react';
import { markAdminOtpVerified, clearAdminOtpSession } from '../utils/adminOtpSession';
import {
  ensureAdminUserDocument,
  callSendAdminEmailOtp,
  callVerifyAdminEmailOtp,
} from '../utils/adminLoginFlow';

type LocationState = { email?: string } | null;

function formatCallableError(err: unknown): string {
  const e = err as { message?: string };
  if (e?.message && typeof e.message === 'string') return e.message;
  return 'Request failed. Try again.';
}

export function AdminLoginOtpScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [email, setEmail] = useState(state?.email?.trim() || '');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ code?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      toast.error('Session expired. Sign in again.');
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!email) {
      setEmail(u.email || '');
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setErrors({ code: 'Enter the 6-digit code from your email.' });
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    const adminEmail = (email || user.email || '').trim();
    if (!adminEmail) {
      toast.error('Missing email. Start over from sign in.');
      navigate('/admin/login', { replace: true });
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      await callVerifyAdminEmailOtp(code);
      await ensureAdminUserDocument(user, adminEmail);
      markAdminOtpVerified();
      toast.success('Admin login successful');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      toast.error(formatCallableError(err));
      setErrors({ code: formatCallableError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) {
      navigate('/admin/login', { replace: true });
      return;
    }
    setIsLoading(true);
    try {
      await callSendAdminEmailOtp();
      toast.success('A new code was sent to your email.');
    } catch (err: unknown) {
      toast.error(formatCallableError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    clearAdminOtpSession();
    await auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C3E50] to-[#34495E] flex items-center justify-center p-4">
      <Link
        to="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C4A672] rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-3xl mb-2">Admin Portal</h1>
          <p className="text-white/80">Verify your email code</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 text-[#C4A672] mb-4">
            <KeyRound className="w-6 h-6" />
            <h2 className="text-[#2C3E50] text-xl font-semibold">Email verification</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Enter the 6-digit code we sent to{' '}
            <span className="font-medium text-[#2C3E50]">{email || 'your admin email'}</span>.
          </p>

          <form onSubmit={(e) => void handleVerify(e)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-otp">One-time code</Label>
              <Input
                id="admin-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setErrors({});
                }}
                className={`text-center text-2xl tracking-[0.35em] font-mono ${errors.code ? 'border-red-500' : ''}`}
              />
              {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              {isLoading ? 'Verifying…' : 'Verify and continue'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full"
              onClick={() => void handleResend()}
            >
              Resend code
            </Button>
            <Button type="button" variant="ghost" className="w-full text-gray-600" onClick={() => void handleBack()}>
              Back to sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
