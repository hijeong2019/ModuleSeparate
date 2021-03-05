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
var mongoose = require('mongoose');

var user = require('./routes/user')

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

var db;
var UserSchema;
var UserModel;
function connectDB(){
    var databaseUrl = 'mongodb://localhost:27017/local' //데이터베이스 연결 정보
    console.log('데이터베이스 연결 시도');
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl);
    db = mongoose.connection;

    db.on('error', console.error.bind(console,'mongoose connection error'));
    db.on('open',function(){
        console.log('데이터베이스에 연결됨 : '+databaseUrl);

        createUserSchema(db);
    });

    //연결 끊어졌을 때 5초 뒤 재연결
    db.on('disconnected', function(){
        console.log('연결이 끊어졌습니다. 5초 뒤 재연결합니다.');
        setInterval(connectDB, 5000);
    });
}

function createUserSchema() {
    //user_schema.js 모듈 불러오기
    UserSchema = require('./database/user_schema').createSchema(mongoose);

    //UserModel 정의
    UserModel = mongoose.model('users2', UserSchema);
    console.log('usermodel 정의함');

    user.init(db, UserSchema, UserModel);
}

//라우터 객체 참조
var router = express.Router();

//로그인 라우팅 함수
router.route('/process/login').post(user.login);

//사용자 추가 라우팅 함수 - 클라이언트에서 보내온 데이터를 이용해 데이터베이스에 추가
router.route('/process/adduser').post(user.adduser);

//사용자 리스트 함수
router.route('/process/listuser').post(user.listuser);

//라우터 객체 등록
app.use('/',router);





var errorHandler = expressErrorHandler({
    static:{
        '404':'./public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//서버 시작
http.createServer(app).listen(app.get('port'),function(){
    console.log('express start'+app.get('port'));

    connectDB();
})