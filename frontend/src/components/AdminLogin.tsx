import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../firebase';
import { useUserRole } from '../context/UserRoleContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { hasAdminOtpVerified } from '../utils/adminOtpSession';
import { ensureAdminUserDocument, callSendAdminEmailOtp } from '../utils/adminLoginFlow';

function formatFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
  const rawMessage =
    err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';

  const mapCode = (c: string) => {
    switch (c) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Firebase rejected this email/password. In Firebase Console → Authentication, create the user (or reset the password) so it exactly matches what you use here.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is turned off. Enable it in Firebase Console → Authentication → Sign-in method.';
      case 'auth/user-disabled':
        return 'This account is disabled in Firebase.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Wait a few minutes or use a different network.';
      case 'auth/invalid-email':
        return 'That email format is not valid for Firebase Auth.';
      case 'auth/multi-factor-auth-required':
        return 'This account still uses app-based 2FA in Firebase. Remove multi-factor for this user under Firebase Console → Authentication, then use email codes instead.';
      default:
        return rawMessage ? `${rawMessage} (${c})` : `Sign-in failed (${c || 'unknown'}).`;
    }
  };

  if (err instanceof FirebaseError && err.code) {
    return mapCode(err.code);
  }
  if (code.startsWith('auth/')) {
    return mapCode(code);
  }
  return rawMessage || 'Login failed.';
}

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();

  useEffect(() => {
    if (!loading && isAdmin && hasAdminOtpVerified()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase();
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

    if (!ADMIN_EMAIL || ADMIN_PASSWORD === undefined || String(ADMIN_PASSWORD).length === 0) {
      toast.error('Admin login is not configured (missing or empty VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD).');
      return;
    }

    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setErrors({ ...newErrors, form: 'Invalid admin credentials.' });
      toast.error('Invalid admin credentials.');
      return;
    }

    setIsLoading(true);
    try {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        await ensureAdminUserDocument(user, email.trim());

        try {
          await callSendAdminEmailOtp();
        } catch (sendErr) {
          await auth.signOut();
          throw sendErr;
        }
        toast.success('Check your email for a 6-digit code.');
        navigate('/admin/login/verify', { replace: true, state: { email: email.trim() } });
      } catch (firebaseError: unknown) {
        const fe = firebaseError as { code?: string };
        if (fe.code === 'auth/multi-factor-auth-required') {
          await auth.signOut();
          throw new Error(formatFirebaseAuthError(firebaseError));
        }
        throw firebaseError;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : formatFirebaseAuthError(error);
      toast.error(msg);
      setErrors({ ...newErrors, form: msg });
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-white/80">Secure access for BookBloom administrators</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleInitialLogin} className="space-y-6">
              <div>
                <h2 className="text-[#2C3E50] text-2xl mb-2">Sign In</h2>
                <p className="text-gray-600 text-sm">Enter your administrator credentials</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="bookbloom78@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: '' });
                    }}
                    className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white">
                {isLoading ? 'Signing in...' : 'Sign In to Admin Portal'}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  After password verification, a one-time code is sent to your admin email. Configure SMTP for Cloud Functions using{' '}
                  <code className="text-xs">EMAIL_USER</code> / <code className="text-xs">EMAIL_PASS</code> (Gmail app password) or{' '}
                  <code className="text-xs">ADMIN_OTP_SMTP_*</code>.
                </p>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
}
