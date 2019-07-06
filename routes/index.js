var express = require('express');
var router = express.Router();
var mongodb=require('mongodb').MongoClient;
var objectId=require('mongodb').ObjectID;
var assert=require('assert');
var executeCode=require('child_process').exec;
var fs=require('fs');
var mongoUrl='mongodb://localhost:27017';
var dbname='myproject';

/* GET home page. */
router.get('/', function(req, res, next) {
  //console.log(req.session.success);
  // res.render('index', { title: 'Form Validation',success: req.session.success,errors: req.session.errors });
  // req.session.errors=null;
  // req.session.success=null;

  res.render('index',{chosenLanguage:'java',sourceCode:'',output:null});
});

// router.get('/get-data',function(req,res,next){
//   let resultArray=[];
//   mongodb.connect(mongoUrl,function(error,client){
//     assert.equal(null,error);
//     let db=client.db(dbname);
//     let cursor=db.collection('user-data').find();
//     cursor.forEach(function(doc,err){
//       assert.equal(null,err);
//       resultArray.push(doc);
//     }, function(){
//       res.render('index',{items: resultArray});
//     })
//   })

// });

// router.post('/insert',function(req,res,next){

//   let item={
//     title:req.body.title,
//     content:req.body.content,
//     author:req.body.author
//   };

//   mongodb.connect(mongoUrl, function(error,client){
//     assert.equal(null,error);
//     let db=client.db(dbname);
//     console.log('connected');
//     db.collection('user-data').insertOne(item,function(error,result){
//       assert.equal(null,error);
//       console.log('Item successfully inserted');
//     })
//   })
//   res.redirect('/');

// });

// router.post('/update',function(req,res,next){
//   let item={
//     title:req.body.title,
//     content:req.body.content,
//     author:req.body.author
//   }
//   let id=req.body.id;

//   mongodb.connect(mongoUrl,function(error,client){
//     assert.equal(null,error);
//     let db=client.db(dbname);
//     db.collection('user-data').updateOne({"_id": objectId(id)},{$set: item},function(error,result){
//       assert.equal(null,error);
//       console.log('Item successfully updated');
//     })
//   })
//   res.redirect('/');
// });

// router.post('/delete',function(req,res,next){
//   mongodb.connect(mongoUrl,function(error,client){
//     assert.equal(null,error);
//     let db=client.db(dbname);
//     db.collection('user-data').deleteOne({"_id": objectId(req.body.id)},function(error,result){
//       assert.equal(null,error);
//       console.log('Item successfully deleted');
//     })
//   })
//   res.redirect('/');

// });



// router.post('/submit',function(req,res,next){
//   req.check('email','Invalid email id').isEmail();
//   req.check('password','Invalid password').isLength({min: 4}).equals(req.body['confirm_password']);

//   let errors=req.validationErrors();
//   //console.log(errors);
//   if(errors){
//     req.session.errors=errors;
//     req.session.success=false;
//   }
//   else
//   {
//     req.session.success=true;
//   }
//   res.redirect('/');
// })

router.post('/submit-code',function(req,res,next){
  if(req.body.chosenLanguage=='java')
  {
    fs.writeFile('test.java',req.body.sourceCode,function(err){
      if(err){
        console.log('File creation failed');
      }
      else{
        runCode('test.java',req,res);
      }
    });
  }
  else{
    fs.writeFile('test.py',req.body.sourceCode,function(err){
      if(err){
        console.log('File creation failed');
      }
      else{
        runPythonCode('test.py',req,res);
      }
    });
  }
});

function runCode(fileName,req,res)
{
  let compile=executeCode('javac '+fileName);

  compile.stderr.on('data',function(data){
    if(data!=null){
      console.error(data);
      fs.unlink(fileName,function(err){
        if(err){
          console.error('File deletion failed');
        }
        else{
          res.render('index',{chosenLanguage:req.body.chosenLanguage,sourceCode:req.body.sourceCode,output:data});
        }
      });
    }
  });
  compile.stdout.on('close',function(data){
    console.log('Compiled successfully');
    let output=executeCode('java '+fileName.slice(0,fileName.indexOf('.')));
    output.stdout.on('data',function(data){
      console.log(data);
      output.kill();
      fs.unlink(fileName,function(err){
        if(err){
          console.error('File deletion failed');
        }
        else{
          fileName=fileName.slice(0,fileName.indexOf('.'))+'.class';
          fs.unlink(fileName,function(err){
            if(err){
              console.log('File deletion failed');
            }
            else{
              console.log('Program execution successful');
              res.render('index',{chosenLanguage:req.body.chosenLanguage,sourceCode:req.body.sourceCode,output:data});
            }
          });
        }
      });
    });
  });
}
function runPythonCode(fileName,req,res){
  let output=executeCode('python '+fileName);

  output.stdout.on('data',function(data){
    if(data!=null){
      fs.unlink(fileName,function(err){
        if(err){
          console.error('File deletion failed');
        }
        else{
          res.render('index',{chosenLanguage:req.body.chosenLanguage,sourceCode:req.body.sourceCode,output:data});
        }
      });
    }
  });
  output.stderr.on('data',function(data){
    if(data!=null){
      console.log(data);
      fs.unlink(fileName,function(err){
        if(err){
          console.log('File deletion failed');
        }
        else{
          res.render('index',{chosenLanguage:req.body.chosenLanguage,sourceCode:req.body.sourceCode,output:data});
        }
      });
    }
  });
}

module.exports = router;
