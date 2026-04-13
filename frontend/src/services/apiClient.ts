import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/** Firebase ID tokens (JWTs) for custom REST APIs — see `utils/jwtAuth.ts`. Callable functions already send auth automatically. */
export {
  getFirebaseJwt,
  getFirebaseIdTokenResult,
  getBearerAuthorizationHeader,
  authenticatedFetch,
} from '../utils/jwtAuth';

export interface IdentityVerificationData {
    idUrl: string;
    selfieUrl: string;
}

export interface CertificateVerificationData {
    certificateUrl: string;
    institutionName?: string;
    degreeName?: string;
    graduationYear?: number;
}

export interface ProfileVerificationData {
    githubUsername?: string;
    stackOverflowId?: string;
}

export interface SkillTestRequest {
    subject: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillTestSubmission {
    answers: Record<number, string>;
}

export interface ReviewData {
    tutorId: string;
    rating: number;
    text: string;
}

export const apiClient = {
    verifyIdentity: async (data: IdentityVerificationData) => {
        const verify = httpsCallable(functions, 'verifyIdentity');
        const result = await verify(data);
        return result.data;
    },

    verifyCertificate: async (data: CertificateVerificationData) => {
        const verify = httpsCallable(functions, 'verifyCertificate');
        const result = await verify(data);
        return result.data;
    },

    verifyProfiles: async (data: ProfileVerificationData) => {
        const verify = httpsCallable(functions, 'verifyProfiles');
        const result = await verify(data);
        return result.data;
    },

    requestSkillTest: async (data: SkillTestRequest) => {
        const requestStart = httpsCallable(functions, 'requestSkillTest');
        const result = await requestStart(data);
        return result.data;
    },

    submitSkillTest: async (data: SkillTestSubmission) => {
        const submit = httpsCallable(functions, 'submitSkillTest');
        const result = await submit(data);
        return result.data;
    },

    addReview: async (data: ReviewData) => {
        const submitReview = httpsCallable(functions, 'addReview');
        const result = await submitReview(data);
        return result.data;
    }
};
