import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyArFj-8bx7pLBaFVjoL0tlrohQRinMydvY",
  authDomain: "moarilogin.firebaseapp.com",
  projectId: "moarilogin",
  storageBucket: "moarilogin.firebasestorage.app",
  messagingSenderId: "856968818682",
  appId: "1:856968818682:web:79d010ace54f3f7d393e43",
  measurementId: "G-SKWPP671LE"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 로그인 기능을 다른 파일에서 쓸 수 있게 내보내기
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();