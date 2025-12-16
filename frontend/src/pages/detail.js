import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown
import { auth } from '../firebase';

function ClubDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [clubAuthorName, setClubAuthorName] = useState('');

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/clubs/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClub(data);

        // 작성자 정보 조회
        if (data.userId) {
          try {
            const userResponse = await fetch(`http://localhost:5000/api/messages/user/${data.userId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setClubAuthorName(userData.displayName);
            }
          } catch (error) {
            console.error('Fetch author info error:', error);
          }
        }
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [id]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleChatClick = () => {
    if (!currentUser) {
      alert('로그인 후 채팅할 수 있습니다.');
      navigate('/login');
      return;
    }
    navigate(`/chat/${club.userId}?clubId=${club.id}&clubName=${encodeURIComponent(club.name)}&authorName=${encodeURIComponent(clubAuthorName)}`);
  };

  if (loading) {
    return <div className="container"><h2>로딩 중...</h2></div>;
  }

  if (error) {
    return <div className="container"><h2>오류: {error.message}</h2></div>;
  }

  if (!club) {
    return <div className="container"><h2>동아리를 찾을 수 없습니다.</h2></div>;
  }

  return (
    <div className="container">
      <div className="club-detail">
        {club.imageUrl && (
          <div className="club-image-container">
            <img src={club.imageUrl} alt={club.name} className="club-image" />
          </div>
        )}
        <h2>{club.name}</h2>
        <div className="club-detail-divider"></div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{club.description}</ReactMarkdown>
        
        <div className="club-info-section">
          {club.tags && club.tags.length > 0 && (
            <div className="club-tags-detail">
              <strong>태그:</strong>
              <div className="club-tags-list">
                {club.tags.map((tag, index) => (
                  <span key={index} className="club-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          {club.clubLink && (
            <div className="club-link-detail">
              <strong>신청 링크:</strong>
              <a href={club.clubLink} target="_blank" rel="noopener noreferrer" className="club-link-button">
                신청하기
              </a>
            </div>
          )}
          
          <div className="club-interview-detail">
            <strong>면접 날짜:</strong> <span className="interview-date">{club.interviewDate}</span>
          </div>
        </div>

        <div className="chat-button-container">
          <button onClick={handleChatClick} className="chat-btn">
            채팅하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClubDetailPage;