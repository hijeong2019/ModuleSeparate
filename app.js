// Express 기본 모듈
var express = require("express")
    , http = require("http")
    , path = require('path');

// Express 미들웨어
var bodyParser = require('body-parser'),
    static = require('serve-static'),
    cookieParser = require('cookie-parser');

var expressErrorHandler = require('express-error-handler');
var expressSession = require('express-session');
var crypto = require('crypto');

//express 객체 생성
var app = express();

app.set('port', process.env.PORT || 3000);

//bodyParser를 사용해 application.x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({extended : false}));

//bodyParser를 사용해 application/json 파싱
app.use(bodyParser.json());

//public 폴더를 static으로 오픈
app.use('/public',static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave : true,
    saveUninitialized : true
}));

var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit : 10,
    host : 'localhost',
    user : 'root',
    password: 'youndam515==!',
    database : 'test',
    debug : false
})


//라우터 객체 참조
var router = express.Router();

//로그인 라우팅 함수
router.route('/process/login').post(function(req,res){
    console.log('/process/login 호출');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;

    console.log('요청 파라미터 : '+paramId+', '+paramPassword);

    if(pool){
        authUser(paramId, paramPassword, function(err, rows){
            if(err) { //오류 발생 시 클라이언트로 오류 전송
                console.err('사용자 로그인 중 오류 발생 : '+err.stack);
                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>사용자 로그인 중 오류 발생</h1>');
                res.write('<p>'+err.stack+'</p>');
                res.end();
                return;
            }

            if(rows){
                console.dir(rows);
                var username = rows[0].name;
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
})

//사용자 추가 라우팅 함수 - 클라이언트에서 보내온 데이터를 이용해 데이터베이스에 추가
router.route('/process/adduser').post(function(req, res) {
	console.log('/process/adduser 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var paramAge = req.body.age || req.query.age;
	
    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName + ', ' + paramAge);
    
    // pool 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
	if (pool) {
		addUser(paramId, paramName, paramAge, paramPassword, function(err, addedUser) {
			// 동일한 id로 추가하려는 경우 에러 발생 - 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 추가 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 추가 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                
                return;
            }
			
            // 결과 객체 있으면 성공 응답 전송
			if (addedUser) {
				console.dir(addedUser);

				console.log('inserted ' + addedUser.affectedRows + ' rows');
	        	
	        	var insertId = addedUser.insertId;
	        	console.log('추가한 레코드의 아이디 : ' + insertId);
	        	
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 추가 성공</h2>');
				res.end();
			} else {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 추가  실패</h2>');
				res.end();
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}
	
});

//라우터 객체 등록
app.use('/',router);

//사용자 인증 함수
var authUser = function(id, password, callback){
    console.log('authuser 호출'+id+', '+password);
    //커넥션 풀에서 연결 객체 가져옴
    pool.getConnection(function(err,conn){
        if(err){
            if(conn){
                conn.release();
            }
            callback(err,null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : '+conn.threadId);

        var columns = ['id','name','age'];
        var tablename = 'users';

        var exec = conn.query("select ?? from ?? where id = ? and password = ?",[columns, tablename, id, password],function(err, rows){
            conn.release();
            console.log('실행대상 SQL : '+exec.sql);

            if(rows.length>0){
                console.log('아이디 [%s] 패스워드가 [%s]가 일치하는 사용자 찾음', id, password);
                callback(null,rows);
            }else{
                console.log('일치하는 사용자 찾지 못함');
                callback(null,null);
            }
        });
    })
};

//사용자 추가 함수
var addUser = function(id, name, age, password, callback) {
	console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + name + ', ' + age);
	
	// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            
            callback(err, null);
            return;
        }   
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

    	// 데이터를 객체로 만듦
    	var data = {id:id, name:name, age:age, password:password};
    	
        // SQL 문을 실행함
        var exec = conn.query('insert into users set ?', data, function(err, result) {
        	conn.release();  // 반드시 해제해야 함
        	console.log('실행 대상 SQL : ' + exec.sql);
        	
        	if (err) {
        		console.log('SQL 실행 시 에러 발생함.');
        		console.dir(err);
        		
        		callback(err, null);
        		
        		return;
        	}
        	
        	callback(null, result);
        	
        });
        
        conn.on('error', function(err) {      
              console.log('데이터베이스 연결 시 에러 발생함.');
              console.dir(err);
              
              callback(err, null);
        });
    });
	
}



var errorHandler = expressErrorHandler({
    static:{
        '404':'./public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//서버 시작
http.createServer(app).listen(app.get('port'),function(){
    console.log('express start : '+app.get('port'));

})