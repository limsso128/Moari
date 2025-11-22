// src/pages/LoginPage.js
import React, { useState, useContext } from 'react'; // useContext 추가
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithCustomToken } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { NotificationContext } from '../context/NotificationContext'; // NotificationContext 추가

function LoginPage() {
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext); // showNotification 가져오기
  const [userId, setUserId] = useState(''); // email을 userId로 변경
  const [password, setPassword] = useState('');

  // 1. 이메일 로그인 처리
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userId || !password) {
      showNotification('아이디와 비밀번호를 모두 입력해주세요.', 'error');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '알 수 없는 오류가 발생했습니다.');
      }

      await signInWithCustomToken(auth, data.token);
      showNotification('로그인 성공!', 'success');
      navigate('/');
    } catch (error) {
      console.error("Login Error:", error);
      showNotification('아이디 또는 비밀번호가 올바르지 않습니다.', 'error');
    }
  };

  // 2. 구글 로그인 처리
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      await signInWithCustomToken(auth, data.token);
      showNotification('구글 로그인 성공!', 'success');
      navigate('/');
    } catch (error) {
      console.error("Google Login Error:", error);
      showNotification("구글 로그인에 실패했습니다.", "error");
    }
  };

  return (
    <div className="container">
      <h2>로그인</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">로그인</button>
        </form>

        {/* 구글 로그인 버튼 추가 */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="submit-btn" 
            style={{ backgroundColor: '#8db3f1ff', marginTop: '0' }}
          >
            Google 계정으로 로그인
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;