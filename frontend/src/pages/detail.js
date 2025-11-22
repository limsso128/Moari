import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

function ClubDetailPage() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/clubs/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClub(data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [id]);

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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{club.description}</ReactMarkdown>
                {club.tags && club.tags.length > 0 && (
                  <div className="club-tags">
                    <strong>태그:</strong>
                    {club.tags.map((tag, index) => (
                      <span key={index} className="club-tag">{tag}</span>
                    ))}
                  </div>
                )}
                {club.clubLink && (
                  <p>
                    <strong>신청 링크:</strong>{' '}
                    <a href={club.clubLink} target="_blank" rel="noopener noreferrer" className="club-link-button">
                      신청하기
                    </a>
                  </p>
                )}
                <p><strong>면접 날짜:</strong> {club.interviewDate}</p>
              </div>
            </div>
          );
        }
        
        export default ClubDetailPage;