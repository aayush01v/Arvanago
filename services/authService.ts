// FIX: Use compat version of Firebase for authentication.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './firebase.ts';
export { auth };

const googleProvider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    // FIX: Use compat syntax for signInWithPopup.
    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    // Log generic error without exposing system details
    console.error("Authentication error occurred");
    throw error;
  }
};

export const sendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await user.sendEmailVerification();
    } else {
      throw new Error("No user logged in to send verification email.");
    }
  } catch (error) {
    console.error("Verification email error");
    throw error;
  }
};

export const signUpWithEmail = async (name: string, email: string, pass: string) => {
  try {
    // FIX: Use compat syntax for createUserWithEmailAndPassword.
    const res = await auth.createUserWithEmailAndPassword(email, pass);
    const user = res.user;
    if (user) {
      await user.updateProfile({
        displayName: name
      });
      // Send verification email immediately to avoid race conditions with App.tsx auto-logout
      await user.sendEmailVerification();
    }
    return user;
  } catch (err) {
    console.error("Sign up error");
    throw err;
  }
}

export const signInWithEmail = async (email: string, pass: string) => {
  try {
    // FIX: Use compat syntax for signInWithEmailAndPassword.
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    console.error("Sign in error");
    throw err;
  }
}


export const signOutUser = async () => {
  try {
    // FIX: Use compat syntax for signOut.
    await auth.signOut();
  } catch (error) {
    console.error("Sign out error");
  }
};