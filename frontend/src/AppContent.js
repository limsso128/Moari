import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import MainPage from './pages/main';
import ClubRegistrationPage from './pages/register';
import ClubDetailPage from './pages/detail';
import LoginPage from './pages/LoginPage';
import ClubEditPage from './pages/ClubEditPage'; // 수정 페이지 import
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import { NotificationContext } from './context/NotificationContext';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useContext(NotificationContext);

  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for global search term
  const [unreadCount, setUnreadCount] = useState(0);

  // 채팅 페이지인지 확인
  const isChatPage = location.pathname.startsWith('/chat');

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

  // 읽지 않은 메시지 수 조회
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser) return;

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/messages/conversations/${currentUser.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const totalUnread = data.reduce((sum, conv) => sum + (conv.unread || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Fetch unread count error:', error);
      }
    };

    if (currentUser && !isChatPage) {
      fetchUnreadCount();
      // 5초마다 갱신 (실시간 업데이트)
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, isChatPage]);

  // 페이지 이동 시 즉시 unreadCount 갱신
  useEffect(() => {
    if (currentUser && !isChatPage) {
      const fetchUnreadCount = async () => {
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch(`http://localhost:5000/api/messages/conversations/${currentUser.uid}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const totalUnread = data.reduce((sum, conv) => sum + (conv.unread || 0), 0);
            setUnreadCount(totalUnread);
          }
        } catch (error) {
          console.error('Fetch unread count error:', error);
        }
      };

      fetchUnreadCount();
    }
  }, [location.pathname]);

  const logout = async () => {
    await signOut(auth);
    showNotification("성공적으로 로그아웃되었습니다.", "success");
    navigate('/');
  };

  return (
    <div>
      <Notification />
      {!isChatPage && (
        <Navbar 
          currentUser={currentUser} 
          logout={logout}
          searchTerm={searchTerm} // Pass searchTerm to Navbar
          onSearchChange={setSearchTerm} // Pass setter function to Navbar
          unreadCount={unreadCount}
        />
      )}
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
          <Route 
            path="/chat/:receiverUid?" 
            element={currentUser ? <ChatPage /> : <LoginPage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default AppContent;