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

// Get all clubs
router.get('/', async (req, res) => {
    try {
        const clubsSnapshot = await db.collection('clubs').orderBy('createdAt', 'desc').get();
        const clubs = clubsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).send(clubs);
    } catch (error) {
        console.error("Fetch Clubs Error:", error);
        res.status(500).send({ message: 'Error fetching clubs', error: error.message });
    }
});

// Register a new club
router.post('/register', async (req, res) => {
    const { name, oneLineIntro, description, interviewDate, imageUrl, userId, tags, clubLink } = req.body; // Add oneLineIntro

    try {
        const clubRef = db.collection('clubs').doc(); // Create a new document with an auto-generated ID
        await clubRef.set({
            name,
            oneLineIntro: oneLineIntro || '', // Store one-line intro
            description,
            interviewDate,
            imageUrl: imageUrl || 'https://via.placeholder.com/400x300.png?text=Moari', // Default image
            userId, // Store the ID of the user who registered the club
            tags: tags || [], // Store tags, default to empty array
            clubLink: clubLink || '', // Store club link, default to empty string
            createdAt: admin.firestore.FieldValue.serverTimestamp() // Timestamp for when the club was created
        });
        res.status(201).send({ message: 'Club registered successfully!', clubId: clubRef.id });
    } catch (error) {
        console.error("Club Registration Error:", error);
        res.status(400).send({ message: 'Error registering club', error: error.message });
    }
});

// Get a single club by ID
router.get('/:id', async (req, res) => {
    try {
        const clubId = req.params.id;
        const clubDoc = await db.collection('clubs').doc(clubId).get();

        if (!clubDoc.exists) {
            return res.status(404).send({ message: 'Club not found' });
        }

        res.status(200).send({ id: clubDoc.id, ...clubDoc.data() });
    } catch (error) {
        console.error("Fetch Single Club Error:", error);
        res.status(500).send({ message: 'Error fetching club', error: error.message });
    }
});

// Get clubs by userId
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const clubsSnapshot = await db.collection('clubs').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
        const clubs = clubsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).send(clubs);
    } catch (error) {
        console.error("Fetch User Clubs Error:", error);
        res.status(500).send({ message: 'Error fetching user clubs', error: error.message });
    }
});

// Update a club
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, oneLineIntro, description, interviewDate, tags, clubLink, imageUrl } = req.body;
    const { uid } = req.user;

    try {
        const clubRef = db.collection('clubs').doc(id);
        const doc = await clubRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: '동아리를 찾을 수 없습니다.' });
        }

        const clubData = doc.data();
        if (clubData.userId !== uid) {
            return res.status(403).json({ message: '이 동아리를 수정할 권한이 없습니다.' });
        }

        await clubRef.update({
            name,
            oneLineIntro,
            description,
            interviewDate,
            tags,
            clubLink,
            imageUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: '동아리 정보가 성공적으로 수정되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
});

// Delete a club
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { uid } = req.user;

    try {
        const clubRef = db.collection('clubs').doc(id);
        const doc = await clubRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: '동아리를 찾을 수 없습니다.' });
        }
        if (doc.data().userId !== uid) {
            return res.status(403).json({ message: '이 동아리를 삭제할 권한이 없습니다.' });
        }
        await clubRef.delete();
        res.status(200).json({ message: '동아리가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
});

module.exports = router;
