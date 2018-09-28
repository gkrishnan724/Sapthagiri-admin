const mongoose = require('mongoose');

let residentSchema = mongoose.Schema({
    _id: mongoose.Schema.ObjectId,
    flatNo: {type:Number,required:true,unique:true},
    owner:{type:String,required:true},
    associate:String,
    email:[String],
    phone:[String],
    currentDues:{type:Number,required:true,default:0}
});

module.exports = mongoose.model('Resident',residentSchema);