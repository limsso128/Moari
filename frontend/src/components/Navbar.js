import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ currentUser, logout, searchTerm, onSearchChange }) {
  return (
    <nav>
      <div className="nav-left">
        <h1><Link to="/" className='logoText'>Moari</Link></h1>
      </div>
      <div className="nav-center">
        <input
          type="text"
          placeholder="태그 또는 동아리 검색"
          className="search-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="nav-links">
        {currentUser ? (
          <>
            <Link to="/mypage" className="nav-link">마이페이지</Link>
            <Link to="/register" className="nav-link">동아리 등록</Link>
            <button onClick={logout} className="nav-link">로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
