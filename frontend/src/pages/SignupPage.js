// src/pages/SignupPage.js
import React, { useState, useContext } from 'react'; // useContext 추가
import { useNavigate, Link } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext'; // NotificationContext 추가

function SignupPage() {
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext); // showNotification 가져오기
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (password !== confirmPassword) {
      showNotification('비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '알 수 없는 오류가 발생했습니다.');
      }

      showNotification('회원가입 성공! 로그인 페이지로 이동합니다.', 'success');
      navigate('/login');
    } catch (error) {
      console.error("Signup Error:", error);
      showNotification(error.message, 'error');
    }
  };

  return (
    <div className="container">
      <h2>회원가입</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
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
              placeholder="6자리 이상"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">가입하기</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;