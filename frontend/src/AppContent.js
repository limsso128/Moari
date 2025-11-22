import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import MainPage from './pages/main';
import ClubRegistrationPage from './pages/register';
import ClubDetailPage from './pages/detail';
import LoginPage from './pages/LoginPage';
import ClubEditPage from './pages/ClubEditPage'; // 수정 페이지 import
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import { NotificationContext } from './context/NotificationContext';

function AppContent() {
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);

  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for global search term

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("현재 로그인한 유저:", user.email);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    showNotification("성공적으로 로그아웃되었습니다.", "success");
    navigate('/');
  };

  return (
    <div>
      <Notification />
      <Navbar 
        currentUser={currentUser} 
        logout={logout}
        searchTerm={searchTerm} // Pass searchTerm to Navbar
        onSearchChange={setSearchTerm} // Pass setter function to Navbar
      />
      <main>
        <Routes>
          <Route path="/" element={<MainPage searchTerm={searchTerm} />} />
          <Route path="/club/:id" element={<ClubDetailPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route 
            path="/register" 
            element={currentUser ? <ClubRegistrationPage /> : <LoginPage />}
          />
          <Route 
            path="/club/edit/:id" 
            element={currentUser ? <ClubEditPage /> : <LoginPage />}
          />
          <Route 
            path="/mypage" 
            element={currentUser ? <MyPage currentUser={currentUser} /> : <LoginPage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default AppContent;