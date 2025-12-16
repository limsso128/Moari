import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';
import { NotificationContext } from '../context/NotificationContext';

function ChatPage() {
  const { receiverUid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useContext(NotificationContext);

  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [senderNames, setSenderNames] = useState({});
  const [selectedReceiver, setSelectedReceiver] = useState(receiverUid);
  const messagesEndRef = useRef(null);

  const clubId = searchParams.get('clubId');
  const clubName = searchParams.get('clubName');
  const authorName = searchParams.get('authorName');

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
    const fetchMessages = async () => {
      if (!currentUser || !selectedReceiver) return;

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/messages/chat/${selectedReceiver}/${currentUser.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('메시지 조회 실패');
        const data = await response.json();
        setMessages(data);
        
        // 메시지를 읽었으므로 해당 대화의 unread를 0으로 업데이트 + 마지막 메시지 동기화
        setConversations(prev => 
          prev.map(conv => {
            if (conv.senderId === selectedReceiver) {
              // 가장 최신 메시지를 찾아서 lastMessage 업데이트
              if (data.length > 0) {
                const lastMsg = data[data.length - 1];
                return { 
                  ...conv, 
                  unread: 0,
                  lastMessage: lastMsg.message,
                  lastMessageTime: lastMsg.createdAt?.toMillis?.() || new Date(lastMsg.createdAt).getTime() || conv.lastMessageTime
                };
              }
              return { ...conv, unread: 0 };
            }
            return conv;
          })
        );
      } catch (error) {
        console.error('Fetch messages error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReceiverInfo = async () => {
      if (!selectedReceiver) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/messages/user/${selectedReceiver}`);
        if (!response.ok) throw new Error('사용자 정보 조회 실패');
        const data = await response.json();
        setReceiverInfo(data);
      } catch (error) {
        console.error('Fetch user info error:', error);
      }
    };

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
      } finally {
        // 대화 목록 조회 완료 후 로딩 해제
        if (!selectedReceiver) {
          setLoading(false);
        }
      }
    };

    if (currentUser) {
      if (selectedReceiver) {
        fetchMessages();
        fetchReceiverInfo();
        
        // 채팅방에 있을 때 3초마다 메시지 갱신 (실시간)
        const messagesInterval = setInterval(() => {
          fetchMessages();
        }, 3000);
        
        // 5초마다 대화 목록도 함께 갱신 (unread 업데이트)
        const conversationInterval = setInterval(() => {
          fetchConversations();
        }, 5000);
        
        return () => {
          clearInterval(messagesInterval);
          clearInterval(conversationInterval);
        };
      }
      
      fetchConversations();
      
      // 5초마다 대화 목록 새로고침 (실시간 업데이트)
      const conversationInterval = setInterval(() => {
        fetchConversations();
      }, 5000);
      
      return () => clearInterval(conversationInterval);
    }
  }, [currentUser, selectedReceiver]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim()) {
      showNotification('메시지를 입력해주세요.', 'error');
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverUid: selectedReceiver,
          message: messageInput,
          clubId,
          clubName
        })
      });

      if (!response.ok) throw new Error('메시지 전송 실패');

      // 새 메시지 추가 (현재 시간 사용)
      const newMessage = {
        senderUid: currentUser.uid,
        receiverUid: selectedReceiver,
        message: messageInput,
        createdAt: new Date(),
        read: false
      };

      setMessages([...messages, newMessage]);
      
      // 사이드바 대화 목록 업데이트
      setConversations(prev => {
        const existingConv = prev.find(conv => conv.senderId === selectedReceiver);
        if (existingConv) {
          // 기존 대화 업데이트
          return prev.map(conv => 
            conv.senderId === selectedReceiver
              ? { ...conv, lastMessage: messageInput, lastMessageTime: Date.now() }
              : conv
          ).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        } else {
          // 새 대화 추가
          return [{
            senderId: selectedReceiver,
            lastMessage: messageInput,
            lastMessageTime: Date.now(),
            clubId,
            clubName,
            unread: 0
          }, ...prev];
        }
      });
      
      setMessageInput('');
    } catch (error) {
      console.error('Send message error:', error);
      showNotification('메시지 전송에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return <div className="container"><h2>로딩 중...</h2></div>;
  }

  return (
    <div className="chat-page-container">
      {/* 왼쪽 사이드바 - 대화 목록 */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button className="back-btn-small" onClick={() => navigate('/')}>
            ← 메인으로
          </button>
        </div>
        <div className="conversations-sidebar-list">
          {conversations.length === 0 ? (
            <p className="no-conversations">대화 내역이 없습니다</p>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.senderId}
                className={`conversation-sidebar-item ${selectedReceiver === conversation.senderId ? 'active' : ''}`}
                onClick={() => {
                  setSelectedReceiver(conversation.senderId);
                  // 즉시 unread를 0으로 업데이트
                  setConversations(prev => 
                    prev.map(conv => 
                      conv.senderId === conversation.senderId 
                        ? { ...conv, unread: 0 }
                        : conv
                    )
                  );
                }}
              >
                <div className="conversation-sidebar-info">
                  <h4>{senderNames[conversation.senderId] || '사용자'}</h4>
                  <p className="last-message-sidebar">{conversation.lastMessage}</p>
                  {conversation.clubName && (
                    <p className="club-info-sidebar">{conversation.clubName}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 오른쪽 채팅 영역 */}
      <div className="chat-page">
        <div className="chat-header">
          <div className="chat-header-info">
            <h2>{clubName || receiverInfo?.displayName || '채팅'}</h2>
          </div>
        </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>아직 대화가 없습니다.</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              // Firestore Timestamp를 Date 객체로 변환
              let msgDate = msg.createdAt;
              if (msgDate && typeof msgDate.toDate === 'function') {
                msgDate = msgDate.toDate();
              } else if (typeof msgDate === 'string') {
                msgDate = new Date(msgDate);
              } else if (!(msgDate instanceof Date)) {
                msgDate = new Date();
              }

              const dateString = `${msgDate.getFullYear()}년 ${msgDate.getMonth() + 1}월 ${msgDate.getDate()}일`;
              const timeString = msgDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
              
              const prevDate = index > 0 ? (() => {
                let prevMsgDate = messages[index - 1].createdAt;
                if (prevMsgDate && typeof prevMsgDate.toDate === 'function') {
                  prevMsgDate = prevMsgDate.toDate();
                } else if (typeof prevMsgDate === 'string') {
                  prevMsgDate = new Date(prevMsgDate);
                } else if (!(prevMsgDate instanceof Date)) {
                  prevMsgDate = new Date();
                }
                return `${prevMsgDate.getFullYear()}년 ${prevMsgDate.getMonth() + 1}월 ${prevMsgDate.getDate()}일`;
              })() : null;
              
              const showDateDivider = dateString !== prevDate;
              const isSent = msg.senderUid === currentUser.uid;

              return (
                <div key={index}>
                  {showDateDivider && (
                    <div className="date-divider">
                      {dateString}
                    </div>
                  )}
                  <div className={`message ${isSent ? 'sent' : 'received'}`}>
                    {isSent && (
                      <span className="message-time">
                        {timeString}
                      </span>
                    )}
                    <div className="message-content">
                      <p>{msg.message}</p>
                    </div>
                    {!isSent && (
                      <span className="message-time">
                        {timeString}
                      </span>
                    )}
                    {isSent && (
                      <span className={`message-status ${msg.read ? 'read' : 'unread'}`}>
                        {msg.read ? '읽음' : '안읽음'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
        />
        <button type="submit" className="send-btn">전송</button>
      </form>
      </div>
    </div>
  );
}

export default ChatPage;
