import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // Link는 안 써서 뺐습니다

// 👇 Firebase 관련 기능 추가
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

// 페이지 및 컴포넌트 import
import MainPage from './pages/main';
import ClubRegistrationPage from './pages/register';
import ClubDetailPage from './pages/detail';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import Navbar from './components/Navbar';

// 초기 클럽 데이터 (유지)
const initialClubs = [
  {
    id: 1,
    name: 'The Code Brewers',
    description: 'A club for passionate developers who love coffee and code.',
    interviewDate: '2025-03-15',
    userId: 'admin', // 예시 ID
  },
];

const CLUBS_STORAGE_KEY = 'moari-clubs';
// ❌ USERS_STORAGE_KEY, SESSION_STORAGE_KEY는 이제 필요 없어서 삭제했습니다.

function AppContent() {
  const navigate = useNavigate();

  // 1. 클럽 데이터 관리 (친구 코드 유지)
  const [clubs, setClubs] = useState(() => {
    const storedClubs = localStorage.getItem(CLUBS_STORAGE_KEY);
    return storedClubs ? JSON.parse(storedClubs) : initialClubs;
  });

  // ❌ [users] 상태 삭제 (Firebase가 회원정보 관리함)

  // 2. 현재 로그인한 유저 상태
  const [currentUser, setCurrentUser] = useState(null);

  // 클럽 데이터 저장 (친구 코드 유지)
  useEffect(() => {
    localStorage.setItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));
  }, [clubs]);

  // 🔥 3. Firebase 로그인 상태 감지기 (새로 추가됨)
  // (새로고침 해도 로그인이 유지되도록 해주는 핵심 코드입니다)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 로그인 됨
        console.log("현재 로그인한 유저:", user.email);
        setCurrentUser(user);
      } else {
        // 로그아웃 됨
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ❌ [users] 저장하는 useEffect 삭제
  // ❌ [currentUser]를 sessionStorage에 저장하는 useEffect 삭제 (Firebase가 알아서 함)

  // ❌ signup, login 함수 삭제 
  // (LoginPage.js, SignupPage.js 파일 안에서 직접 Firebase랑 통신하게 바꿨으므로 여기선 필요 없음)

  // 4. 로그아웃 함수 (Firebase 버전으로 수정)
  const logout = async () => {
    await signOut(auth);
    alert("Logged out successfully.");
    navigate('/');
  };

  // 5. 클럽 추가 함수
  const addClub = (club) => {
    if (!currentUser) {
      alert("Please log in to register a club.");
      return;
    }
    // 친구 코드: userId: currentUser.id -> Firebase 코드: currentUser.uid (고유ID)
    const newClub = { ...club, id: Date.now(), userId: currentUser.uid };
    setClubs([...clubs, newClub]);
  };

  return (
    <div>
      {/* Navbar에 로그아웃 기능 전달 */}
      <Navbar currentUser={currentUser} logout={logout} />
      <main>
        <Routes>
          <Route path="/" element={<MainPage clubs={clubs} />} />
          <Route path="/club/:id" element={<ClubDetailPage clubs={clubs} />} />
          
          {/* 👇 중요: 이제 login={login} 같은 props를 전달하지 않습니다 (각 파일이 알아서 함) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* 보호된 라우트 (로그인 안 하면 로그인 페이지로 보냄) */}
          <Route 
            path="/register" 
            element={currentUser ? <ClubRegistrationPage addClub={addClub} /> : <LoginPage />}
          />
          <Route 
            path="/mypage" 
            element={currentUser ? <MyPage clubs={clubs} currentUser={currentUser} /> : <LoginPage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default AppContent;