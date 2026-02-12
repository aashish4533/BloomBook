import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { apiClient } from '../services/apiClient';
import { SkillTest } from './SkillTest';

const STEPS = ['Identity', 'Certificates', 'Profiles', 'Skills'];

export const TutorVerificationForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<any>({});

    const [idFile, setIdFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);

    const [certFile, setCertFile] = useState<File | null>(null);
    const [certMetadata, setCertMetadata] = useState({ institution: '', degree: '', year: '' });

    const [profileLinks, setProfileLinks] = useState({ github: '', stackoverflow: '' });

    const [skillPassed, setSkillPassed] = useState(false);

    const storage = getStorage();

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
                e.target.value = ''; // Reset input
                setFile(null);
            }
        }
    };

    const handleIdentitySubmit = async () => {
        if (!idFile || !selfieFile) {
            setError('Please upload both ID and Selfie.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const idUrl = await handleFileUpload(idFile, `verification/${Date.now()}_id`);
            const selfieUrl = await handleFileUpload(selfieFile, `verification/${Date.now()}_selfie`);

            const result: any = await apiClient.verifyIdentity({ idUrl, selfieUrl });
            setVerificationStatus((prev: any) => ({ ...prev, identity: result }));
            setCurrentStep(1);
        } catch (err: any) {
            setError(err.message || 'Identity verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleCertificateSubmit = async () => {
        if (!certFile) {
            setError('Please upload a certificate.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const certUrl = await handleFileUpload(certFile, `certificates/${Date.now()}_cert`);
            const result: any = await apiClient.verifyCertificate({
                certificateUrl: certUrl,
                institutionName: certMetadata.institution,
                degreeName: certMetadata.degree,
                graduationYear: Number(certMetadata.year)
            });
            setVerificationStatus((prev: any) => ({ ...prev, certificate: result }));
            setCurrentStep(2);
        } catch (err: any) {
            setError(err.message || 'Certificate verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const result: any = await apiClient.verifyProfiles({
                githubUsername: profileLinks.github,
                stackOverflowId: profileLinks.stackoverflow
            });
            setVerificationStatus((prev: any) => ({ ...prev, profiles: result }));
            setCurrentStep(3);
        } catch (err: any) {
            setError(err.message || 'Profile verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkillComplete = (passed: boolean, score: number) => {
        setSkillPassed(passed);
        setVerificationStatus((prev: any) => ({ ...prev, skill: { passed, score } }));
        // Finalize 
        alert(passed ? 'Verification Complete! You passed.' : 'Skill test failed. Please try again later.');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    ← Back
                </button>
            </div>
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Tutor Verification</h1>

            {/* Progress Bar */}
            <div className="relative flex justify-between mb-8 px-2 md:px-0">
                {STEPS.map((step, idx) => (
                    <div key={step} className={`flex flex-col items-center z-10 w-1/4 ${idx <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors duration-300 ${idx <= currentStep ? 'bg-blue-100 border-2 border-blue-600' : 'bg-white border-2 border-gray-300'}`}>
                            {idx + 1}
                        </div>
                        <span className="text-xs md:text-sm font-medium">{step}</span>
                    </div>
                ))}
                {/* Connecting Line - Behind steps */}
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
                        <h2 className="text-2xl font-semibold">Identity Verification</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Government ID (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => onFileChange(e, setIdFile)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Selfie (JPG, PNG)</label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={(e) => onFileChange(e, setSelfieFile)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleIdentitySubmit}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify Identity'}
                        </button>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Certificate Verification</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Degree/Certificate (PDF, JPG, PNG)</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => onFileChange(e, setCertFile)}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Institution Name"
                                value={certMetadata.institution}
                                onChange={(e) => setCertMetadata({ ...certMetadata, institution: e.target.value })}
                                className="border p-2 rounded"
                            />
                            <input
                                type="text"
                                placeholder="Degree Name"
                                value={certMetadata.degree}
                                onChange={(e) => setCertMetadata({ ...certMetadata, degree: e.target.value })}
                                className="border p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Year"
                                value={certMetadata.year}
                                onChange={(e) => setCertMetadata({ ...certMetadata, year: e.target.value })}
                                className="border p-2 rounded"
                            />
                        </div>
                        <button
                            onClick={handleCertificateSubmit}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Analyzing...' : 'Analyze Certificate'}
                        </button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Professional Profiles</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Username</label>
                            <input
                                type="text"
                                value={profileLinks.github}
                                onChange={(e) => setProfileLinks(prev => ({ ...prev, github: e.target.value }))}
                                className="w-full border p-2 rounded"
                                placeholder="e.g. octocat"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Stack Overflow User ID</label>
                            <input
                                type="text"
                                value={profileLinks.stackoverflow}
                                onChange={(e) => setProfileLinks(prev => ({ ...prev, stackoverflow: e.target.value }))}
                                className="w-full border p-2 rounded"
                                placeholder="e.g. 123456"
                            />
                        </div>
                        <button
                            onClick={handleProfileSubmit}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Fetching...' : 'Verify Profiles'}
                        </button>
                        <button onClick={() => setCurrentStep(3)} className="text-sm text-gray-500 underline text-center w-full block mt-2">Skip this step</button>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-center mb-6">Final Step: Skill Assessment</h2>
                        <SkillTest subject="Computer Science" onComplete={handleSkillComplete} />
                    </div>
                )}
            </div>
        </div>
    );
};
