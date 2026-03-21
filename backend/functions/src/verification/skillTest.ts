import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { OpenAI } from "openai";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

/**
 * Generates a skill test using OpenAI.
 */
export const requestSkillTest = onCall({ cors: "*" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { subject, difficulty } = request.data;
  if (!subject) {
    throw new HttpsError("invalid-argument", "Subject is required.");
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    let questions = [];
    try {
      questions = JSON.parse(content || "[]");
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
 * Submits a skill test and calculates the score.
 */
export const submitSkillTest = onCall({ cors: "*" }, async (request) => {
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
    let score = 0;
    const total = questions.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions.forEach((q: any) => {
      if (answers[q.id] === q.answer) {
        score++;
      }
    });

    const percentage = (score / total) * 100;
    const passed = percentage >= 80;
    
    // Phase 3 States: Pending, Reviewing, Verified, Rejected
    const finalStatus = passed ? "Reviewing" : "Rejected";

    await admin.firestore()
      .collection("verifications")
      .doc(request.auth.uid)
      .set({
        skillTest: {
          subject: testData?.subject,
          score,
          total,
          percentage,
          passed,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        status: finalStatus
      }, { merge: true });

    await testDoc.ref.update({
      status: "completed",
      result: { score, total, passed },
    });
    
    // Update tutors document if it exists to keep in sync
    const tutorSnapshot = await admin.firestore().collection("tutors").where("userId", "==", request.auth.uid).limit(1).get();
    if (!tutorSnapshot.empty) {
      await tutorSnapshot.docs[0].ref.update({
        verificationStatus: finalStatus,
        testScore: percentage
      });
      logger.info(`Tutor ${request.auth.uid} position set to ${finalStatus} after Knowledge Mass evaluation.`);
    }

    return { success: true, score, total, passed, finalStatus };
  } catch (error: unknown) {
    logger.error("Test Submission Error:", error);
    throw new HttpsError("internal", (error as Error).message);
  }
});
