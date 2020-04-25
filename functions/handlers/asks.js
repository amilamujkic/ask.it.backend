const { db } = require('../util/admin');
    
exports.getAllAsks = (req,res) => {
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
            likeCount: doc.data().likeCount,
            userImage: doc.data().userImage
        });
    });
    return res.json(asks);
})
.catch((err) => {
    console.error(err);
    res.status(500).json({error: err.code});
});
};

exports.postOneAsk = (req,res) => {
    if(req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Body must not be empty'});
    }
   const newAsk = {
       body: req.body.body,
       userHandle: req.user.handle,
       userImage: req.user.imageUrl,
       createdAt: new Date().toISOString(),
       likeCount: 0,
       commentCount: 0   
   };

   db.collection('asks')
   .add(newAsk)
   .then((doc) => {
      const resAsk = newAsk;
      resAsk.askId = doc.id;
      res.json(resAsk);
   })
   .catch((err)=> {
       res.status(500).json({error: 'something went wrong'});
       console.error(err); 
   });
};

//fetch one question

exports.getAsk = (req, res) => {
    let askData = {};
    db.doc(`/asks/${req.params.askId}`)
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return res.status(404).json({ error: 'Ask not found' });
          }

        askData = doc.data();
        askData.askId = doc.id;
        return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('askId', '==', req.params.askId)
        .get();
    })
    .then((data) => {
        askData.comments = [];
        data.forEach((doc) => {
          askData.comments.push(doc.data());
        });
        return res.json(askData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Comment on the comment

exports.commentOnAsk = (req, res) => {
    if (req.body.body.trim() === '')
      return res.status(400).json({ comment: 'Must not be empty' });
  
    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      askId: req.params.askId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };
 
    db.doc(`/asks/${req.params.askId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Ask not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'Something went wrong' });
    });

};

// like ask

exports.likeAsk = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('askId', '==', req.params.askId)
    .limit(1);

    const askDocument = db.doc(`/asks/${req.params.askId}`);

    let askData;

    askDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        askData = doc.data();
        askData.askId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Ask not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            askId: req.params.askId,
            userHandle: req.user.handle
          })
          .then(() => {
            askData.likeCount++;
            return askDocument.update({ likeCount: askData.likeCount });
          })
          .then(() => {
            return res.json(askData);
          });
      } else {
        return res.status(400).json({ error: 'Ask already liked' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//unlike ask

exports.unlikeAsk = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('askId', '==', req.params.askId)
    .limit(1);

  const askDocument = db.doc(`/asks/${req.params.askId}`);

  let askData;

  askDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        askData = doc.data();
        askData.askId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Ask not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'Ask not liked' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            askData.likeCount--;
            return askDocument.update({ likeCount: askData.likeCount });
          })
          .then(() => {
            res.json(askData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Delete asks

exports.deleteAsk = (req, res) => {
  const document = db.doc(`/asks/${req.params.askId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Ask not found' });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Ask deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};