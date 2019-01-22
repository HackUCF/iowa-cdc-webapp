let express = require('express');
let router = express.Router();
let as = require('../src/aerospike');

router.post('/', function (req, res, next) {
    if (!req.body.set || req.body.set != "propaganda" || req.body.set != "comments")
      req.body.set = "comments";
    
    as.addComment(function () {
    res.redirect('/about/'+req.body.set)
  }, req.body.set || "comments", req.body)
});

router.get('/:set?', function (req, res, next) {
  if (!req.body.set || req.body.set != "propaganda" || req.body.set != "comments")
    req.body.set = "comments";
  
  as.getComments(function (err, all) {
          for(i of all){
              delete i.key.digest;
              delete i.ttl;
              delete i.gen;
          }
          let comments=JSON.stringify(all, null, 4).replace(/\\n/g, '\<br \/\>')
          res.render('about.html', {settings: settings, comments:comments})
   }, req.body.set || "comments");
});


module.exports=router;
