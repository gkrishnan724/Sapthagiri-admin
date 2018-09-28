const mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    username:{type:String,required:true,unique:true},
    passwd:{type:String,required:true}
});

module.exports = mongoose.model('User',userSchema);