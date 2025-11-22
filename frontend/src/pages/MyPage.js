import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

function MyPage({ currentUser }) {
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useContext(NotificationContext);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchMyClubs = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/clubs/user/${currentUser.uid}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMyClubs(data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyClubs();
  }, [currentUser]);

  const handleDelete = async (clubId, clubName) => {
    if (window.confirm(`'${clubName}' 동아리를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || '삭제 중 오류가 발생했습니다.');
        }

        setMyClubs(myClubs.filter(club => club.id !== clubId));
        showNotification('동아리가 성공적으로 삭제되었습니다.', 'success');
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="container">
        <h2>마이페이지</h2>
        <p style={{ textAlign: 'center' }}>당신의 동아리를 보려면 <Link to="/login">로그인</Link> 해주세요.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="container"><h2>로딩 중...</h2></div>;
  }

  if (error) {
    return <div className="container"><h2>오류: {error.message}</h2></div>;
  }

  return (
    <div className="container">
      <h2>내가 등록한 동아리</h2>
      {myClubs.length === 0 ? (
        <p style={{ textAlign: 'center' }}>아직 등록한 동아리가 없습니다. <Link to="/register" className="accent-link">지금 등록해보세요!</Link></p>
      ) : (
        <div className="club-list">
          {myClubs.map(club => (
            <div key={club.id} className="club-card-container">
              <Link to={`/club/${club.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="club-card">
                  <div className="club-card-image-container">
                    <img 
                      src={club.imageUrl || 'https://via.placeholder.com/400x300.png?text=Moari'} 
                      alt={club.name} 
                      className="club-card-image" 
                    />
                  </div>
                  <div className="club-card-content">
                    <h3>{club.name}</h3>
                    <p>{club.oneLineIntro}</p>
                    <div className="club-card-footer">
                      <p><strong>면접일:</strong> {club.interviewDate}</p>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="club-card-actions">
                <Link to={`/club/edit/${club.id}`} className="action-btn edit-btn" title="수정">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </Link>
                <button onClick={() => handleDelete(club.id, club.name)} className="action-btn delete-btn" title="삭제">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyPage;
