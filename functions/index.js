const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();

const config = {
        apiKey: "AIzaSyAYKZWqzL6soA3gVoWmSYXDWQcrBBUPkgU",
        authDomain: "askit-ad0e8.firebaseapp.com",
        databaseURL: "https://askit-ad0e8.firebaseio.com",
        projectId: "askit-ad0e8",
        storageBucket: "askit-ad0e8.appspot.com",
        messagingSenderId: "342058893396",
        appId: "1:342058893396:web:daabfac1969ffbe09badc1",
        measurementId: "G-NQZC8X519J"
}

const firebase = require('firebase');
firebase.initializeApp(config);

const db = admin.firestore();

app.get('/asks',(req,res) => {
    db
    .collection('asks')
    .orderBy('createdAt','desc')
    .get()
    .then((data) => {
        let asks = [];
        data.forEach((doc) => {
        asks.push({
            askId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt:doc.data().createdAt,
            commentCount: doc.data().commentCount,
            likeCount: doc.data().likeCount
        });
    });
    return res.json(asks);
})
.catch((err) => consolore.error(err));
})


app.post('/asks',(req,res) => {
     if(req.method !== 'POST') {
         return res.status(400).json({ error: 'Method not allowed'});
     }
    const newAsk = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db.collection('asks')
    .add(newAsks)
    .then(doc => {
         res.json({ message: 'document $(doc.id) created successfully'});
    })
    .catch((err)=> {
        res.status(500).json({error: 'something went wrong'});
        console.error(err);
    });
});

//Signup route
app.post('/signup',(req,res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword, 
        handle: req.body.handle
    };

    //validate data
    let token, userId;
    db.doc('/users/${newUser.handle}')
        .get()
        .then((doc) => {
            if(doc.exists) {
                return res.status(400).json({ handle: 'this handle is already taken'});
            } else {
        return firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email,newUser.password);
            }
        })
        .then((data) => {
           userId = data.user.uid;
           return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                emails: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db.doc('/users/${newUser.handle}').set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({token});
        })
        .catch((err) => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already in use'});
            } else { 
                return res.status(500).json({error: err.code});
            }
        });
    });

exports.api = functions.region('europe-west3').https.onRequest(app);

