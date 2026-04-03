import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Generates a skill test using OpenAI.
 */
export const requestSkillTest = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { subject, difficulty } = request.data;
  if (!subject) {
    throw new HttpsError("invalid-argument", "Subject is required.");
  }

  try {
    if (!geminiApiKey.value()) {
      const mockQuestions = [
        {
          id: 1,
          question: `What is a key concept in ${subject}?`,
          options: ["A", "B", "C", "D"],
          answer: "A",
        },
        {
          id: 2,
          question: `Explain the importance of ${subject}.`,
          options: ["X", "Y", "Z", "W"],
          answer: "X",
        },
      ];

      await admin.firestore()
        .collection("skillTests")
        .doc(request.auth.uid)
        .set({
          questions: mockQuestions,
          subject,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "pending",
        });

      return { questions: mockQuestions.map(({ answer, ...q }) => q) };
    }

    const prompt = `Generate 5 multiple choice questions for a ` +
      `${difficulty || "intermediate"} level test on "${subject}". ` +
      `Return the response in strictly valid JSON format: array of objects ` +
      `with keys: id (number), question (string), options (array of 4 ` +
      `strings), answer (string - must match one of the options exactly). ` +
      `Do not include any markdown formatting.`;

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    const content = response.text || "[]";
    let questions = [];
    try {
      questions = JSON.parse(content);
    } catch (e) {
      throw new Error("Failed to generate valid questions.");
    }

    await admin.firestore()
      .collection("skillTests")
      .doc(request.auth.uid)
      .set({
        questions,
        subject,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questionsForFrontend = questions.map((q: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { answer, ...rest } = q;
      return rest;
    });

    return { questions: questionsForFrontend };
  } catch (error: unknown) {
    logger.error("Skill Test Generation Error:", error);
    throw new HttpsError("internal", (error as Error).message);
  }
});

/**
 * Submits a skill test and calculates the score via Gemini AI.
 */
export const submitSkillTest = onCall({ cors: true, secrets: [geminiApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { answers } = request.data;

  try {
    const testDoc = await admin.firestore()
      .collection("skillTests")
      .doc(request.auth.uid)
      .get();

    if (!testDoc.exists) {
      throw new HttpsError("not-found", "No active test found for this user.");
    }

    const testData = testDoc.data();
    const questions = testData?.questions || [];
    let score = null;
    let passed = false;
    let finalStatus = "Pending Manual Review";
    let feedback = "";
    
    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
        const evalPrompt = `Evaluate the student's answers for a skill test on ${testData?.subject}.\n\nQuestions & Correct Answers: ${JSON.stringify(questions)}\n\nStudent Answers: ${JSON.stringify(answers)}\n\nPlease grade this test and provide structured feedback.`;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: evalPrompt,
            config: {
                systemInstruction: `You are an expert tutor evaluator. Output ONLY valid JSON using exactly this schema: { "score": number (0-100), "feedback": "string", "passed": boolean }`,
                responseMimeType: "application/json"
            }
        });

        const raw = response.text || "{}";
        const parsed = JSON.parse(raw);
        
        score = parsed.score;
        passed = parsed.passed;
        feedback = parsed.feedback;
        finalStatus = passed ? "Reviewing" : "Rejected";

    } catch (gradingError) {
        logger.error("Gemini Grading Failed:", gradingError);
        score = null;
        passed = false;
        feedback = "Automated grading failed or timed out. Awaiting human manual review.";
        finalStatus = "Pending Manual Review";
    }

    await admin.firestore()
      .collection("verifications")
      .doc(request.auth.uid)
      .set({
        skillTest: {
          subject: testData?.subject,
          score,
          feedback,
          passed,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        status: finalStatus
      }, { merge: true });

    await testDoc.ref.update({
      status: "completed",
      result: { score, passed, feedback },
    });
    
    // Update tutors document if it exists to keep in sync
    const tutorSnapshot = await admin.firestore().collection("tutors").where("userId", "==", request.auth.uid).limit(1).get();
    if (!tutorSnapshot.empty) {
      await tutorSnapshot.docs[0].ref.update({
        verificationStatus: finalStatus,
        testScore: score
      });
      logger.info(`Tutor ${request.auth.uid} position set to ${finalStatus} after Neural evaluation.`);
    }

    return { success: true, score, passed, finalStatus, feedback };
  } catch (error: unknown) {
    logger.error("Test Submission Error:", error);
    throw new HttpsError("internal", (error as Error).message);
  }
});
