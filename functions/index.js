const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth'); 

const cors = require('cors');
app.use(cors());	

const { db } = require('./util/admin');

const { getAllAsks,  postOneAsk, getAsk, commentOnAsk, likeAsk, unlikeAsk, deleteAsk } = require('./handlers/asks');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead} = require('./handlers/users');

// Asks routes
app.get('/asks', getAllAsks);
app.post('/ask', FBAuth, postOneAsk);
app.get('/ask/:askId', getAsk);
app.post('/ask/:askId/comment',FBAuth, commentOnAsk);
app.get('/ask/:askId/like', FBAuth, likeAsk);
app.get('/ask/:askId/unlike', FBAuth, unlikeAsk);
app.delete('/ask/:askId',FBAuth, deleteAsk);

//Users routes
app.post('/signup',signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user:handle',getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);


exports.api = functions.region('europe-west3').https.onRequest(app);

exports.createNotificationOnLike = functions.region('europe-west3').firestore.document('likes/{id}')
.onCreate((snapshot) => {
    return db
      .doc(`/asks/${snapshot.data().askID}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            askId: doc.id
          });
        }
      })
      .catch((err) => console.error(err));
  });

  exports.deleteNotificationOnUnLike = functions
  .region('europe-west3')
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });


exports.createNotificationOnComment = functions
  .region('europe-west3')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/asks/${snapshot.data().askId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            askId: doc.id
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

  exports.onUserImageChange = functions
  .region('europe-west3')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      const batch = db.batch();
      return db
        .collection('asks')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const ask = db.doc(`/asks/${doc.id}`);
            batch.update(ask, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

  exports.onAskDelete = functions
  .region('europe-west3')
  .firestore.document('/asks/{askId}')
  .onDelete((snapshot, context) => {
    const askId = context.params.askId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('askId', '==', askId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection('likes')
          .where('askId', '==', askId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('askId', '==', askId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });


