import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage, functions } from '../firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { GraduationCap, School, Loader2, Upload } from 'lucide-react';

type Tier = 'school' | 'university';

interface StudentTuitionVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTier?: Tier | null;
  onSubmitted?: () => void;
}

export function StudentTuitionVerification({
  open,
  onOpenChange,
  defaultTier,
  onSubmitted,
}: StudentTuitionVerificationProps) {
  const [tier, setTier] = useState<Tier | null>(defaultTier ?? null);
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && defaultTier) setTier(defaultTier);
  }, [open, defaultTier]);

  const reset = () => {
    setTier(defaultTier ?? null);
    setGuardianEmail('');
    setGuardianPhone('');
    setInstitutionalEmail('');
    setFiles([]);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list.slice(0, 5));
  };

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please sign in.');
      return;
    }
    if (!tier) {
      toast.error('Choose your academic level.');
      return;
    }

    setSubmitting(true);
    try {
      const documentUrls: string[] = [];
      for (const file of files) {
        const safe = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `student_verification/${user.uid}/${safe}`);
        await uploadBytes(storageRef, file);
        documentUrls.push(await getDownloadURL(storageRef));
      }

      const submitFn = httpsCallable(functions, 'submitStudentVerification', { timeout: 120000 });
      await submitFn({
        tier,
        documentUrls,
        guardianEmail: tier === 'school' ? guardianEmail.trim() : '',
        guardianPhone: tier === 'school' ? guardianPhone.trim() : '',
        institutionalEmail: tier === 'university' ? institutionalEmail.trim() : '',
      });

      toast.success('Verification submitted. An admin will review your documents.');
      onSubmitted?.();
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#C4A672]" />
            Student verification (Tuition Hub)
          </DialogTitle>
          <DialogDescription>
            Choose your path and upload proof. We run OCR on images to help admins review. Guardian contact is required for
            school-level students (accountability). University students may use an institutional email and/or ID / transcript.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-sm font-medium">I am in</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setTier('school')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm ${
                  tier === 'school' ? 'border-[#C4A672] bg-[#C4A672]/10' : 'border-gray-200'
                }`}
              >
                <School className="w-5 h-5 shrink-0 text-[#C4A672]" />
                <span>School / College (Grades 8–12)</span>
              </button>
              <button
                type="button"
                onClick={() => setTier('university')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm ${
                  tier === 'university' ? 'border-[#C4A672] bg-[#C4A672]/10' : 'border-gray-200'
                }`}
              >
                <GraduationCap className="w-5 h-5 shrink-0 text-[#C4A672]" />
                <span>University / Higher education</span>
              </button>
            </div>
          </div>

          {tier === 'school' && (
            <div className="space-y-3 border-t pt-3">
              <div>
                <Label htmlFor="g-email">Parent / guardian email *</Label>
                <Input
                  id="g-email"
                  type="email"
                  className="mt-1"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <Label htmlFor="g-phone">Guardian phone (optional)</Label>
                <Input
                  id="g-phone"
                  className="mt-1"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="+92…"
                />
              </div>
              <div>
                <Label>Document * (fee voucher, exam slip, or school ID — image or PDF, max 10 MB each)</Label>
                <label className="mt-1 flex items-center gap-2 cursor-pointer text-sm text-[#C4A672]">
                  <Upload className="w-4 h-4" />
                  <span>Choose files</span>
                  <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFiles} />
                </label>
                {files.length > 0 && <p className="text-xs text-gray-500 mt-1">{files.length} file(s) selected</p>}
              </div>
            </div>
          )}

          {tier === 'university' && (
            <div className="space-y-3 border-t pt-3">
              <div>
                <Label htmlFor="uni-email">University email (optional if you upload ID)</Label>
                <Input
                  id="uni-email"
                  type="email"
                  className="mt-1"
                  value={institutionalEmail}
                  onChange={(e) => setInstitutionalEmail(e.target.value)}
                  placeholder="you@university.edu"
                />
              </div>
              <div>
                <Label>Student ID or transcript (optional if email above)</Label>
                <label className="mt-1 flex items-center gap-2 cursor-pointer text-sm text-[#C4A672]">
                  <Upload className="w-4 h-4" />
                  <span>Choose files</span>
                  <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFiles} />
                </label>
                {files.length > 0 && <p className="text-xs text-gray-500 mt-1">{files.length} file(s) selected</p>}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#C4A672] hover:bg-[#8B7355]"
              onClick={() => void submit()}
              disabled={submitting || !tier}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit for review'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
