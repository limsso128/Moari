const router = require('express').Router();
const admin = require('../firebase');
const db = admin.firestore();

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).send('Unauthorized');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        req.user = await admin.auth().verifyIdToken(idToken);
        next();
    } catch (error) {
        return res.status(403).send('Unauthorized');
    }
};

// 메시지 전송
router.post('/send', verifyToken, async (req, res) => {
    const { receiverUid, message, clubId, clubName } = req.body;
    const senderUid = req.user.uid;

    try {
        const messageData = {
            senderUid,
            receiverUid,
            message,
            clubId,
            clubName,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        };

        const messageRef = await db.collection('messages').add(messageData);

        res.status(201).json({ 
            message: '메시지가 전송되었습니다.', 
            messageId: messageRef.id 
        });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: '메시지 전송 중 오류가 발생했습니다.', error: error.message });
    }
});

// 받은 메시지 목록 조회 (대화 상대 기준)
router.get('/conversations/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // 받은 메시지들 조회
        const receivedMessages = await db.collection('messages')
            .where('receiverUid', '==', userId)
            .get();

        // 보낸 메시지들 조회
        const sentMessages = await db.collection('messages')
            .where('senderUid', '==', userId)
            .get();

        console.log("Total received messages:", receivedMessages.size, "Total sent messages:", sentMessages.size);

        // 각 대화 상대별로 데이터 수집
        const conversationsMap = {};
        
        // 받은 메시지 처리
        receivedMessages.docs.forEach(doc => {
            const data = doc.data();
            const otherId = data.senderUid;
            const msgTime = data.createdAt?.toMillis?.() || new Date(data.createdAt).getTime() || 0;
            
            if (!conversationsMap[otherId]) {
                conversationsMap[otherId] = {
                    senderId: otherId,
                    lastMessage: data.message,
                    lastMessageTime: msgTime,
                    clubId: data.clubId,
                    clubName: data.clubName,
                    unread: 0
                };
            }
            
            // 최신 메시지 업데이트
            if (msgTime > conversationsMap[otherId].lastMessageTime) {
                conversationsMap[otherId].lastMessage = data.message;
                conversationsMap[otherId].lastMessageTime = msgTime;
                conversationsMap[otherId].clubId = data.clubId;
                conversationsMap[otherId].clubName = data.clubName;
            }
            
            // unread 카운트 (읽지 않은 받은 메시지만)
            if (!data.read) {
                conversationsMap[otherId].unread += 1;
            }
        });

        // 보낸 메시지 처리
        sentMessages.docs.forEach(doc => {
            const data = doc.data();
            const otherId = data.receiverUid;
            const msgTime = data.createdAt?.toMillis?.() || new Date(data.createdAt).getTime() || 0;
            
            if (!conversationsMap[otherId]) {
                conversationsMap[otherId] = {
                    senderId: otherId,
                    lastMessage: data.message,
                    lastMessageTime: msgTime,
                    clubId: data.clubId,
                    clubName: data.clubName,
                    unread: 0
                };
            } else {
                // 최신 메시지 업데이트 (보낸 메시지가 더 최근이면)
                if (msgTime > conversationsMap[otherId].lastMessageTime) {
                    conversationsMap[otherId].lastMessage = data.message;
                    conversationsMap[otherId].lastMessageTime = msgTime;
                    conversationsMap[otherId].clubId = data.clubId;
                    conversationsMap[otherId].clubName = data.clubName;
                }
            }
        });

        const conversations = Object.values(conversationsMap).sort((a, b) => 
            b.lastMessageTime - a.lastMessageTime
        );

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Fetch Conversations Error:", error);
        res.status(500).json({ message: '대화 목록 조회 중 오류가 발생했습니다.', error: error.message });
    }
});

// 특정 사용자와의 메시지 조회
router.get('/chat/:senderId/:receiverId', verifyToken, async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;
        
        console.log("Fetching chat messages between:", { senderId, receiverId, currentUser: req.user.uid });

        // 보낸 메시지들 조회 (orderBy 제거)
        const sentMessages = await db.collection('messages')
            .where('senderUid', '==', senderId)
            .where('receiverUid', '==', receiverId)
            .get();

        // 받은 메시지들 조회 (orderBy 제거)
        const receivedMessages = await db.collection('messages')
            .where('senderUid', '==', receiverId)
            .where('receiverUid', '==', senderId)
            .get();

        console.log("Sent messages:", sentMessages.size, "Received messages:", receivedMessages.size);

        // 두 배열 합치기 및 시간순 정렬 (JavaScript에서 정렬)
        const allMessages = [
            ...sentMessages.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ...receivedMessages.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        ].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
            const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
            return aTime - bTime;
        });

        // 받은 메시지들을 읽음 처리
        if (receivedMessages.size > 0) {
            const batch = db.batch();
            receivedMessages.docs.forEach(doc => {
                if (!doc.data().read) {
                    batch.update(doc.ref, { read: true });
                }
            });
            await batch.commit();
        }

        res.status(200).json(allMessages);
    } catch (error) {
        console.error("Fetch Chat Error:", error);
        res.status(500).json({ message: '채팅 조회 중 오류가 발생했습니다.', error: error.message });
    }
});

// 사용자 정보 조회
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await admin.auth().getUser(userId);
        
        res.status(200).json({
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email
        });
    } catch (error) {
        console.error("Fetch User Error:", error);
        res.status(500).json({ message: '사용자 정보 조회 중 오류가 발생했습니다.', error: error.message });
    }
});

module.exports = router;
