import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { apiClient } from '../services/apiClient';
import { SkillTest } from './SkillTest';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Star, Trophy, BookOpen, ArrowRight } from 'lucide-react';

const STEPS = ['Profile Orbit', 'Integrity Checksum', 'Scanning Credentials', 'Cognitive Index'];

// ─── Success / Failure Screen ────────────────────────────────────────────────
const VerificationCompleteScreen: React.FC<{
  passed: boolean;
  score: number;
  onGoHome: () => void;
  onRetry: () => void;
}> = ({ passed, score, onGoHome, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {passed ? (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Success Glow Badge */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 rounded-full bg-[#C4A672] opacity-30 animate-ping" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#C4A672] to-[#8B7355] flex items-center justify-center shadow-2xl shadow-[#C4A672]/40">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Stabilization Complete
              </h1>
              <p className="text-[#C4A672] text-lg font-semibold mt-2 tracking-widest uppercase">
                You are now an Academic Navigator
              </p>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Your trajectory has been locked into the BookBloom ecosystem. Students can now discover and hire you as a verified tutor.
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-[#C4A672]" />
                Cognitive Index Results
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Final Score</span>
                <span className="text-white font-bold text-xl">{score} / 100</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-[#C4A672] to-amber-300 transition-all duration-1000"
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: 'Identity', icon: '✅' },
                  { label: 'Credentials', icon: '✅' },
                  { label: 'Skill Test', icon: '✅' },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3">
                    <div className="text-lg">{item.icon}</div>
                    <div className="text-gray-300 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGoHome}
                className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Go to Tuition Hub <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Home
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Failure Badge */}
            <div className="relative mx-auto w-32 h-32">
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl shadow-red-500/40">
                <XCircle className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Orbit Failed
              </h1>
              <p className="text-red-400 text-lg font-semibold mt-2 tracking-widest uppercase">
                Knowledge Mass Insufficient
              </p>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Your Cognitive Index score of <strong className="text-white">{score}</strong> did not meet the required threshold. Please review your subject material and try again.
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left space-y-4">
              <h3 className="text-white font-semibold">Cognitive Index Results</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Score Achieved</span>
                <span className="text-red-400 font-bold text-xl">{score} / 100</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onRetry}
                className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Retry Skill Test
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Form ────────────────────────────────────────────────────────────────
export const TutorVerificationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<any>({});

  // Step 4: result state
  const [done, setDone] = useState(false);
  const [finalPassed, setFinalPassed] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certMetadata, setCertMetadata] = useState({ institution: '', degree: '', year: '' });

  const [profileLinks, setProfileLinks] = useState({ github: '', stackoverflow: '' });
  const [profileData, setProfileData] = useState({
    bio: '',
    subject: '',
    hourlyRate: '',
    specialization: ''
  });

  const storage = getStorage();
  const navigate = useNavigate();

  const handleFileUpload = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const validateFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPG, and PNG are allowed.');
      return false;
    }
    return true;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setError(null);
        setFile(file);
      } else {
        e.target.value = '';
        setFile(null);
      }
    }
  };

  const handleIdentitySubmit = async () => {
    if (!idFile || !selfieFile) { setError('Please upload both ID and Selfie.'); return; }
    setLoading(true); setError(null);
    try {
      const userId = auth.currentUser?.uid || 'temp_user';
      const idUrl = await handleFileUpload(idFile, `verification/${userId}/${Date.now()}_id`);
      const selfieUrl = await handleFileUpload(selfieFile, `verification/${userId}/${Date.now()}_selfie`);
      const result: any = await apiClient.verifyIdentity({ idUrl, selfieUrl });
      if (result.status === 'grounded' || result.status === 'Rejected') {
        setError(result.message || 'Atmospheric Re-entry denied. Integrity Checksum failed twice.');
        return;
      }
      setVerificationStatus((prev: any) => ({ ...prev, identity: result }));
      setCurrentStep(2); // Next is Credentials
    } catch (err: any) {
      console.error("Integrity Checksum Complete Error Object:", err);
      console.error("Error Code:", err.code);
      console.error("Error Details:", err.details);
      setError(err.message || 'Identity verification failed due to an internal server error. Please check the console.');
    } finally { 
      setLoading(false); 
    }
  };

  const handleCertificateSubmit = async () => {
    if (!certFile) { setError('Please upload a certificate.'); return; }
    setLoading(true); setError(null);
    try {
      const userId = auth.currentUser?.uid || 'temp_user';
      const certUrl = await handleFileUpload(certFile, `verification/${userId}/${Date.now()}_cert`);
      const result: any = await apiClient.verifyCertificate({
        certificateUrl: certUrl,
        institutionName: certMetadata.institution,
        degreeName: certMetadata.degree,
        graduationYear: Number(certMetadata.year)
      });
      setVerificationStatus((prev: any) => ({ ...prev, certificate: result }));
      setCurrentStep(3); // Next is Skill Test
    } catch (err: any) {
      setError(err.message || 'Certificate verification failed.');
    } finally { setLoading(false); }
  };

  const handleProfileSubmit = async () => {
    if (!profileData.bio.trim() || !profileData.subject.trim()) {
      setError('Please fill in Bio and Primary Subject.');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('Please sign in to continue.');
      return;
    }
    setLoading(true); setError(null);
    try {
      const { setDoc, doc, getDoc } = await import('firebase/firestore');
      const tutorRef = doc(db, 'tutors', uid);
      const existing = await getDoc(tutorRef);
      const prev = existing.data();
      const alreadyVerified =
        prev && (prev.verified === true || prev.verificationStatus === 'Verified');

      const payload: Record<string, unknown> = {
        userId: uid,
        name: auth.currentUser!.displayName || 'Anonymous',
        avatar: auth.currentUser!.photoURL || '',
        bio: profileData.bio,
        subject: profileData.subject,
        hourlyRate: parseFloat(profileData.hourlyRate || '0'),
        specialization: profileData.specialization,
        createdAt: new Date(),
      };
      if (!alreadyVerified) {
        payload.verificationStatus = 'Pending';
        payload.verified = false;
      }

      await setDoc(tutorRef, payload, { merge: true });

      setCurrentStep(1); // Move to Integrity Checksum
    } catch (err: any) {
      setError(err.message || 'Profile initialization failed.');
    } finally { setLoading(false); }
  };

  const handleSkillComplete = (passed: boolean, score: number) => {
    setVerificationStatus((prev: any) => ({ ...prev, skill: { passed, score } }));
    setFinalPassed(passed);
    setFinalScore(score);
    setDone(true);
  };

  // ── Show the completion screen instead of the main form
  if (done) {
    return (
      <VerificationCompleteScreen
        passed={finalPassed}
        score={finalScore}
        onGoHome={() => navigate('/tuition')}
        onRetry={() => {
          setDone(false);
          setCurrentStep(3); // re-enter skill test phase
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
          ← Back
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-center text-[#2C3E50]">Tutor Command Center</h1>
      <p className="text-center text-gray-500 mb-8 max-w-2xl mx-auto">
        Welcome, aspiring Academic Navigator. Complete the Atmospheric Re-entry phases below to stabilize your teaching trajectory.
      </p>

      {/* Progress Bar */}
      <div className="relative flex justify-between mb-8 px-2 md:px-0">
        {STEPS.map((step, idx) => (
          <div key={step} className={`flex flex-col items-center z-10 w-1/4 ${idx <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors duration-300 ${idx < currentStep ? 'bg-blue-600 border-2 border-blue-600 text-white' : idx === currentStep ? 'bg-blue-100 border-2 border-blue-600' : 'bg-white border-2 border-gray-300'}`}>
              {idx < currentStep ? <CheckCircle className="w-5 h-5" /> : idx + 1}
            </div>
            <span className="text-xs md:text-sm font-medium">{step}</span>
          </div>
        ))}
        <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 -z-0">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}

        {currentStep === 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2C3E50]">Phase 1: Profile Orbit</h2>
            <p className="text-sm text-gray-600">Establish your baseline profile information for students to discover.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Subject</label>
                <input type="text" value={profileData.subject} onChange={e => setProfileData(prev => ({ ...prev, subject: e.target.value }))} className="w-full border p-2 rounded" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                <input type="text" value={profileData.specialization} onChange={e => setProfileData(prev => ({ ...prev, specialization: e.target.value }))} className="w-full border p-2 rounded" placeholder="e.g. Calculus & Algebra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (Rs.)</label>
                <input type="number" value={profileData.hourlyRate} onChange={e => setProfileData(prev => ({ ...prev, hourlyRate: e.target.value }))} className="w-full border p-2 rounded" placeholder="e.g. 1500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea value={profileData.bio} onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))} className="w-full border p-2 rounded h-24" placeholder="Describe your teaching style and experience..." />
              </div>
            </div>
            <button onClick={handleProfileSubmit} disabled={loading} className="w-full bg-[#C4A672] text-white py-3 rounded hover:bg-[#8B7355] transition-colors disabled:opacity-50">
              {loading ? 'Initializing Orbit...' : 'Initiate Profile Orbit'}
            </button>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2C3E50]">Phase 2: Integrity Checksum</h2>
            <p className="text-sm text-gray-600">Establish your physical baseline against government registries. Failsafe limit: 2 attempts.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Government ID (PDF, JPG, PNG)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileChange(e, setIdFile)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selfie (JPG, PNG)</label>
                <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => onFileChange(e, setSelfieFile)} className="w-full border p-2 rounded" />
              </div>
            </div>
            <button onClick={handleIdentitySubmit} disabled={loading} className="w-full bg-[#C4A672] text-white py-3 rounded hover:bg-[#8B7355] transition-colors disabled:opacity-50">
              {loading ? 'Initializing Checksum...' : 'Initiate Integrity Check'}
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2C3E50]">Phase 3: Scanning Credentials</h2>
            <p className="text-sm text-gray-600">Upload your academic payloads for authenticity processing.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Degree Data (PDF, JPG, PNG)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileChange(e, setCertFile)} className="w-full border p-2 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Institution Name" value={certMetadata.institution} onChange={(e) => setCertMetadata({ ...certMetadata, institution: e.target.value })} className="border p-2 rounded" />
              <input type="text" placeholder="Degree Name" value={certMetadata.degree} onChange={(e) => setCertMetadata({ ...certMetadata, degree: e.target.value })} className="border p-2 rounded" />
              <input type="number" placeholder="Year" value={certMetadata.year} onChange={(e) => setCertMetadata({ ...certMetadata, year: e.target.value })} className="border p-2 rounded" />
            </div>
            <button onClick={handleCertificateSubmit} disabled={loading} className="w-full bg-[#C4A672] text-white py-3 rounded hover:bg-[#8B7355] transition-colors disabled:opacity-50">
              {loading ? 'Scanning Payload...' : 'Submit Academic Payload'}
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-6 text-[#2C3E50]">Final Phase: Cognitive Index Evaluation</h2>
            <p className="text-center text-sm text-gray-600 mb-6">Prove your Knowledge Mass to complete stabilization.</p>
            <SkillTest subject={profileData.subject || "General"} onComplete={handleSkillComplete} />
          </div>
        )}
      </div>
    </div>
  );
};
