import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, FEEDBACK_COLLECTION } from '../config/firebase';
import type { StructuredFeedback, FirebaseSubmitResult } from '../types';

export class FirebaseRepository {
  private defaultCollection: string;

  constructor(defaultCollection = FEEDBACK_COLLECTION) {
    this.defaultCollection = defaultCollection;
  }

  async submitFeedback(feedback: StructuredFeedback): Promise<FirebaseSubmitResult> {
    const docId = feedback.sessionId;

    // Use anchor's name as the collection name (sanitized for Firestore)
    const rawAnchor = feedback.anchorName?.trim();
    const anchorCollection = rawAnchor ? rawAnchor.replace(/\//g, '-') : this.defaultCollection;

    const record = {
      id: docId,
      sessionId: feedback.sessionId,
      anchorName: feedback.anchorName,
      timestamp: feedback.timestamp,
      summary: feedback.summary,
      sentiment: feedback.sentiment,
      interestLevel: feedback.interestLevel,
      liked: feedback.liked || [],
      concerns: feedback.concerns || [],
      painPoints: feedback.painPoints || [],
      suggestions: feedback.suggestions || [],
      followUpRequired: Boolean(feedback.followUpRequired),
      transcript: feedback.transcript || '',
      anchorSpeech: feedback.anchorSpeech || '',
      participantSpeech: feedback.participantSpeech || '',
      participantSentiment: feedback.participantSentiment || feedback.sentiment,
      dialogue: feedback.dialogue || [],
      createdAt: serverTimestamp(),
      platform: 'Technology Innovation Summit 2026',
    };

    // Save locally as offline backup/cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `tis_firebase_feedback_${anchorCollection}_${docId}`;
        window.localStorage.setItem(key, JSON.stringify(record));
        const listKey = `tis_firebase_feedback_sessions_${anchorCollection}`;
        const existingStr = window.localStorage.getItem(listKey);
        const existing = existingStr ? JSON.parse(existingStr) : [];
        if (!existing.includes(docId)) {
          existing.unshift(docId);
          window.localStorage.setItem(listKey, JSON.stringify(existing));
        }
      }
    } catch (e) {
      console.warn('Local cache warning:', e);
    }

    try {
      // 1. Store record inside anchor's specific collection
      const anchorDocRef = doc(db, anchorCollection, docId);
      await setDoc(anchorDocRef, record);

      // 2. Also save to the global default collection if different so data is aggregated
      if (anchorCollection !== this.defaultCollection) {
        try {
          const globalDocRef = doc(db, this.defaultCollection, docId);
          await setDoc(globalDocRef, record);
        } catch (globalErr) {
          console.warn('Global collection sync warning (anchor collection succeeded):', globalErr);
        }
      }

      return {
        success: true,
        documentId: docId,
        collectionName: anchorCollection,
      };
    } catch (err) {
      console.error('Firebase submission error:', err);
      const message = err instanceof Error ? err.message : 'Unknown Firestore error';
      return {
        success: false,
        documentId: docId,
        collectionName: anchorCollection,
        error: `Firebase Firestore error: ${message}`,
      };
    }
  }
}
