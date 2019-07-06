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
  res.render('index',{chosenLanguage:'java',sourceCode:'',output:null});
});

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

//For Java
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

//For Python
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
