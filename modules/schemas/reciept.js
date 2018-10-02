const mongoose = require('mongoose');

let recieptSchema = mongoose.Schema({
    paymentType:{type:String,required:true},
    paid:{type:Boolean,required:true,default:false},
    billId:{type:mongoose.Schema.ObjectId,ref:'Transaction',required:true},
    total:Number
});

module.exports = recieptSchema;