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
            likeCount: doc.data().likeCount
        });
    });
    return res.json(asks);
})
.catch((err) => {
    console.error(err);
    res.status(500).json({error: err.code});
});
}

exports.postOneAsk = (req,res) => {
    if(req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Body must not be empty'});
    }
   const newAsk = {
       body: req.body.body,
       userHandle: req.user.handle,
       createdAt: new Date().toISOString()
   };

   db.collection('asks')
   .add(newAsk)
   .then((doc) => {
        res.json({ message: 'document $(doc.id) created successfully'});
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
      return res.status(400).json({ error: 'Must not be empty' });
  
    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      askId: req.params.askId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };
};