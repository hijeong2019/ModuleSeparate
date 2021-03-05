var crypto = require('crypto');
//const { model } = require('mongoose');
var Schema = {};

Schema.createSchema = function(mongoose){
    //스키마 정의
    var UserSchema = mongoose.Schema({
        id : {type:String, required: true, unique:true},
        password : {type:String, required:true},
        name : {type:String, index:'hashed'},
        age:{type:Number,'default':-1},
        created_at : {type:Date, index:{unique:false},'default':Date.now},
        updated_at : {type:Date, index:{unique:false},'default':Date.now}
    });
    
    UserSchema.static('findById', function(id, callback){
        return this.find({id:id}, callback);
    });
    
    UserSchema.static('findAll',function(callback){
        return this.find({}, callback);
    });
    console.log('UserSchema 정의함');
    

    return UserSchema;
};

//module.exports에 userschema 객체 직접 할당
module.exports = Schema;