// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. 이메일 로그인 처리
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공 시 App.js가 알아서 감지하므로 바로 이동만 하면 됨
      navigate('/');
    } catch (error) {
      console.error("Login Error:", error);
      alert('Invalid email or password.');
    }
  };

  // 2. 구글 로그인 처리
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google login failed.");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" required />
              I agree to the <a href="/terms">Terms and Conditions</a>
            </label>
          </div>
          <button type="submit" className="submit-btn">Login</button>
        </form>

        {/* 구글 로그인 버튼 추가 */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="submit-btn" 
            style={{ backgroundColor: '#4285F4', marginTop: '0' }}
          >
            Sign in with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;