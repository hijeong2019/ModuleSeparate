var database;
var UserSchema;
var UserModel;

//데이터베이스 객체, 스키마 객체, 모델 객체를 이 모듈에서 사용할 수 있도록 전달
var init = function(database, schema, model){
    console.log('init 호출됨');

    db = database;
    UserSchema = schema;
    UserModel = model;
}

var login = function(req,res){
    console.log('user 모듈 안에 있는 login 호출됨');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;

    if(db){
        authUser(db, paramId, paramPassword, function(err, docs){
            if(err) {throw err};

            if(docs){
                console.dir(docs);
                var username = docs[0].name;
                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>로그인 성공</h1>');
                res.write('<div>사용자 아이디 : '+paramId+'</div>');
                res.write('<div>사용자 비번 : '+paramPassword+'</div>');
                res.write("<br><br><a href='/public/login.html'>다시 로그인하기<a>");
                res.end();
            }else{
                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>로그인 실패</h1>');
                res.write('<div> 아이디, 비번 다시확인</div>');
                res.write("<br><br><a href='/public/login.html'>다시 로그인하기<a>");
                res.end();
            }
        });
    }else{
        res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
        res.write('<h1>데이터베이스 연결 실패</h1>');
        res.end();
    }
}

var adduser = function(req,res){
    console.log('user 모듈 안에 있는 adduser 호출됨');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;

    console.log('요청 파라미터 : '+paramId+', '+paramPassword+', '+paramName);

    if(db){
        addUser(db, paramId, paramPassword, paramName, function(err, addedUser){
            if(err) {throw err;}

            if(addedUser){
                console.dir(addedUser);

                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>사용자 추가 성공</h1>');
                res.end();
            }else{
                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>사용자 추가 실패</h1>');
                res.end();
            }
        });
    }else{
        res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
        res.write('<h1>데이터베이스 연결 실패</h1>');
        res.end();
    }
}

var listuser = function(req,res){
    console.log('user 모듈 안에 있는 listuser 호출됨');

    if(db){
        //1.모든 사용자 검색
        UserModel.findAll(function(err,results){
            
      
            if(err){ //오류 발생 시 클라이언트로 오류 전송
                console.err('사용자 리스트 조회 중 오류 : '+err.stack);

                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>사용자 리스트 조회 중 오류 발생</h1>');
                res.write('<p>'+err.stack+'</p>');
                res.end();
                return;
            }

            if(results){ //결과 객체 있으면 리스트 전송
                console.dir(results._doc);

                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<title>사용자 리스트</title>')
                res.write('<h1>사용자 리스트 조회</h1>');
                res.write('<div><ul>');

                    for(var i=0; i<results.length; i++){
                        var curId = results[i]._doc.id;
                        var curName = results[i]._doc.name;
                        res.write('<li>#' + i + ' : ' + curId + ' , ' + curName + '</li>');
                    }

                res.write('</ul></div>');
                res.end();
            }else{ //결과 객체 없으면 실패 전송
                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>사용자 리스트 조회 실패</h1>');
                res.end();
            }
        });
    }else{ //데이터베이스 객체가 초기회되지 않았을 때 실패 전송
        res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
        res.write('<h1>데이터베이스 연결 실패</h1>');
        res.end();
    }
}

//사용자 인증 함수
var authUser = function(db, id, password, callback){
    console.log('authuser 호출'+id+', '+password);

    //1.아이디 사용해 검색
    UserModel.findById(id,function(err, results){
        if(err){
            callback(err, null);
            return;
        }
        console.log('아이디[%s]로 사용자 검색 결과',id);
        console.dir(results);

        if(results.length > 0){
            console.log('아이디와 알치하는 사용자 찾음');

            //2.비번 확인
            if(results[0]._doc.password == password){
                console.log('비번 일치함');
                callback(null, results);
            }else{
                console.log('비번 일치하지 않음');
                callback(null,null);
            }
        }else{
            console.log('아이디 일치하는 사용자 없음');
            callback(null,null);
        }
    });
};

//사용자 추가 함수
var addUser = function(db, id, password, name, callback){
    console.log('addUser 호출됨 : '+id+', '+password+', '+name);
    
    //UserModel 인스턴스 생성
    var user = new UserModel({"id":id,"password":password,"name":name});

    //save()로 저장
    user.save(function(err){
        if(err){
            callback(err,null);
            return;
        }
        console.log('사용자 데이터 추가함');
        callback(null,user);
    });
};


module.exports.init = init;
module.exports.login = login;
module.exports.adduser = adduser;
module.exports.listuser = listuser;