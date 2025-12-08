import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Add getDoc
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Mail, Lock, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin?: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

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

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
        const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
          throw new Error('Invalid admin credentials');
        }

        try {
          // 1. Try to Login
          // 1. Try to Login
          const userCredential = await signInWithEmailAndPassword(auth, email, password); // Capture result

          // Self-repair: Check if DB document exists
          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            // If DB is empty (wiped), recreate the Admin ID
            if (!userDocSnap.exists()) {
              await setDoc(userDocRef, {
                email: email,
                name: 'Admin',
                role: 'admin',
                createdAt: serverTimestamp(),
                verified: true
              });
              toast.success("Admin database profile restored.");
            }
          }
        } catch (error: any) {
          // 2. If user doesn't exist (or password changed in env), try to Register
          if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
              const { createUserWithEmailAndPassword } = await import('firebase/auth');
              // Create the Authentication User
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);

              // 3. CRITICAL FIX: Create the Database Document immediately
              await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                name: 'Admin',
                role: 'admin', // This grants access to the dashboard
                createdAt: serverTimestamp(),
                verified: true
              });

              toast.success("Admin account created and linked to database.");

            } catch (createError: any) {
              console.error("Creation failed:", createError);
              // If creation failed (e.g., email taken), throw the original login error
              throw error;
            }
          } else {
            throw error;
          }
        }

        // Success - 2FA DISABLED FOR DEPLOYMENT/TESTING
        // const code = Math.floor(100000 + Math.random() * 900000).toString();

        /*
        try {
          // Send OTP via Backend
          const response = await fetch('http://localhost:3001/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp: code }),
          });

          if (!response.ok) throw new Error('Failed to send email');

          setGeneratedOTP(code);
          setShowTwoFactor(true);
          toast.success('Verification code sent to your email');
        } catch (mailError) {
          console.error("Email failed, falling back to demo mode", mailError);
          setGeneratedOTP(code);
          setShowTwoFactor(true);
          toast.warning('Email service unavailable. Check console for OTP code.');
        }
        */

        // DIRECT LOGIN
        if (onLogin) onLogin();
        toast.success('Admin login successful');
        navigate('/admin/dashboard');

      } catch (error: any) {
        toast.error(error.message);
        setErrors({ ...newErrors, form: error.message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!twoFactorCode) {
      newErrors.twoFactorCode = '2FA code is required';
    } else if (twoFactorCode.length !== 6) {
      newErrors.twoFactorCode = 'Code must be 6 digits';
    } else if (twoFactorCode !== generatedOTP) {
      newErrors.twoFactorCode = 'Invalid OTP code';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      // Simulate 2FA verification
      setTimeout(() => {
        setIsLoading(false);
        if (onLogin) onLogin();
        toast.success('Admin login successful');
        navigate('/admin/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C3E50] to-[#34495E] flex items-center justify-center p-4">
      {/* Back Button */}
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C4A672] rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-3xl mb-2">Admin Portal</h1>
          <p className="text-white/80">Secure access for BookBloom administrators</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!showTwoFactor ? (
            <form onSubmit={handleInitialLogin} className="space-y-6">
              <div>
                <h2 className="text-[#2C3E50] text-2xl mb-2">Sign In</h2>
                <p className="text-gray-600 text-sm">Enter your administrator credentials</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@bookbloom.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
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
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                {isLoading ? 'Verifying...' : 'Continue to 2FA'}
              </Button>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  This is a secure admin area. All login attempts are monitored and logged.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
              <div>
                <h2 className="text-[#2C3E50] text-2xl mb-2">Two-Factor Authentication</h2>
                <p className="text-gray-600 text-sm mb-4">Enter the 6-digit code sent to your email</p>

                {/* DEMO ONLY: Display OTP for testing */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-center">
                  <p className="text-xs text-yellow-800 uppercase font-bold mb-1">Demo Mode: Your OTP Code</p>
                  <p className="text-3xl font-mono tracking-widest text-[#2C3E50]">{generatedOTP}</p>
                </div>
              </div>

              {/* 2FA Code */}
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Authentication Code</Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value.replace(/\D/g, ''));
                    setErrors({ ...errors, twoFactorCode: '' });
                  }}
                  className={`text-center text-2xl tracking-widest ${errors.twoFactorCode ? 'border-red-500' : ''}`}
                />
                {errors.twoFactorCode && (
                  <p className="text-sm text-red-500">{errors.twoFactorCode}</p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTwoFactor(false)}
                  className="w-full"
                >
                  Back
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-600 text-center">
                Don't have access to your authenticator?{' '}
                <a href="#" className="text-[#C4A672] hover:underline">
                  Use backup codes
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}