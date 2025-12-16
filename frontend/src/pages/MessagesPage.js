import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { NotificationContext } from '../context/NotificationContext';

function MessagesPage() {
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [senderNames, setSenderNames] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return;

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/messages/conversations/${currentUser.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('대화 목록 조회 실패');
        const data = await response.json();
        setConversations(data);

        // 발신자 정보 조회
        for (const conversation of data) {
          try {
            const userResponse = await fetch(`http://localhost:5000/api/messages/user/${conversation.senderId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setSenderNames(prev => ({
                ...prev,
                [conversation.senderId]: userData.displayName
              }));
            }
          } catch (error) {
            console.error('Fetch sender info error:', error);
          }
        }
      } catch (error) {
        console.error('Fetch conversations error:', error);
        showNotification('대화 목록을 불러오지 못했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 3000); // 3초마다 갱신
      return () => clearInterval(interval);
    }
  }, [currentUser, navigate, showNotification]);

  const handleConversationClick = (senderId) => {
    navigate(`/chat/${senderId}`);
  };

  if (loading) {
    return <div className="container"><h2>로딩 중...</h2></div>;
  }

  return (
    <div className="container">
      <h2>메시지</h2>
      {conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>아직 받은 메시지가 없습니다.</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.senderId}
              className="conversation-item"
              onClick={() => handleConversationClick(conversation.senderId)}
            >
              <div className="conversation-info">
                <h3>{senderNames[conversation.senderId] || '사용자'}</h3>
                <p className="last-message">{conversation.lastMessage}</p>
                {conversation.clubName && (
                  <p className="club-info">{conversation.clubName}</p>
                )}
              </div>
              {conversation.unread > 0 && (
                <div className="unread-badge">{conversation.unread}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
