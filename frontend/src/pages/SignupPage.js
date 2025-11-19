// src/pages/SignupPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // 경로 주의

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // 비밀번호 확인 로직 (친구 코드 유지)
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      // 🔥 Firebase로 진짜 유저 생성
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Signup successful! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error("Signup Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Email already exists.');
      } else if (error.code === 'auth/weak-password') {
        alert('Password should be at least 6 characters.');
      } else {
        alert('Signup failed: ' + error.message);
      }
    }
  };

  // 👇 화면 디자인은 친구 코드 100% 유지
  return (
    <div className="container">
      <h2>Sign Up</h2>
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
              placeholder="Min 6 characters"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Sign Up</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;