import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';
import { auth } from '../firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SimpleMdeReact from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { WithContext as ReactTags } from 'react-tag-input';

function ClubEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);

  const [name, setName] = useState('');
  const [oneLineIntro, setOneLineIntro] = useState('');
  const [description, setDescription] = useState('');
  const [interviewDate, setInterviewDate] = useState(null);
  const [tags, setTags] = useState([]);
  const [clubLink, setClubLink] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [imageUrl, setImageUrl] = useState(''); // To hold the existing image URL

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
    const fetchClubData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/clubs/${id}`);
        if (!response.ok) throw new Error('동아리 정보를 불러오는데 실패했습니다.');
        const data = await response.json();

        if (currentUser && data.userId !== currentUser.uid) {
            showNotification('이 동아리를 수정할 권한이 없습니다.', 'error');
            navigate('/mypage');
            return;
        }

        setName(data.name);
        setOneLineIntro(data.oneLineIntro);
        setDescription(data.description);
        setInterviewDate(new Date(data.interviewDate));
        setClubLink(data.clubLink);
        setTags(data.tags.map(tag => ({ id: tag, text: tag })));
        setImageUrl(data.imageUrl); // Set existing image URL
      } catch (error) {
        showNotification(error.message, 'error');
        navigate('/mypage');
      }
    };

    if (currentUser) {
        fetchClubData();
    }
  }, [id, currentUser, navigate, showNotification]);

  const handleDeleteTag = (i) => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAdditionTag = (tag) => {
    setTags([...tags, tag]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !oneLineIntro || !description || !interviewDate || tags.length === 0 || !clubLink) {
      showNotification('모든 필드를 채워주세요.', 'error');
      return;
    }

    const formattedInterviewDate = interviewDate.toISOString().split('T')[0];
    const token = await currentUser.getIdToken();

    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          oneLineIntro,
          description,
          interviewDate: formattedInterviewDate,
          tags: tags.map(tag => tag.text),
          clubLink,
          imageUrl, // Send back the image URL
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '동아리 정보 수정 중 오류가 발생했습니다.');
      }

      showNotification('동아리 정보가 성공적으로 수정되었습니다!', 'success');
      navigate(`/club/${id}`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    hideIcons: ["guide", "fullscreen", "side-by-side"],
  }), []);

  return (
    <div className="container">
      <h2>동아리 정보 수정</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="clubName">동아리 이름</label>
            <input type="text" id="clubName" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="oneLineIntro">한 줄 소개</label>
            <input type="text" id="oneLineIntro" value={oneLineIntro} onChange={(e) => setOneLineIntro(e.target.value)} maxLength="100" required />
          </div>
          <div className="form-group">
            <label htmlFor="tags">태그</label>
            <ReactTags
              tags={tags}
              handleDelete={handleDeleteTag}
              handleAddition={handleAdditionTag}
              placeholder="태그를 입력하고 Enter를 누르세요"
              classNames={{
                tags: 'react-tags',
                tagInput: 'react-tags__input',
                tagInputField: 'react-tags__inputField',
                selected: 'react-tags__selected',
                tag: 'react-tags__tag',
                suggestions: 'react-tags__suggestions',
                activeSuggestion: 'react-tags__activeSuggestion'
              }}
              tagComponent={({ tag, index, onDelete }) => (
                <span key={index} className="react-tags__tag" onClick={() => onDelete(index)}>
                  {tag.text}
                </span>
              )}
              removeComponent={() => <></>}
              minQueryLength={0}
              allowUnique={true}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">동아리 설명</label>
            <SimpleMdeReact value={description} onChange={setDescription} options={mdeOptions} />
          </div>
          <div className="form-group">
            <label htmlFor="clubLink">동아리 신청 링크</label>
            <input type="url" id="clubLink" value={clubLink} onChange={(e) => setClubLink(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="interviewDate">면접 날짜</label>
            <DatePicker id="interviewDate" selected={interviewDate} onChange={(date) => setInterviewDate(date)} dateFormat="yyyy-MM-dd" required />
          </div>
          <button type="submit" className="submit-btn">수정 완료</button>
        </form>
      </div>
    </div>
  );
}

export default ClubEditPage;