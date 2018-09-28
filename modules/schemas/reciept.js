const mongoose = require('mongoose');

let recieptSchema = mongoose.Schema({
    paymentType:{type:String,required:true},
    paid:{type:Boolean,required:true,default:false},
    total:Number
});

module.exports = recieptSchema;