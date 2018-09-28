const mongoose = require('mongoose');
const billSchema = require('./Bill');
const recieptSchema = require('./reciept');
let transactionSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    flatNo:{type:String,required:true},
    type:{type:String,required:true},
    bill:billSchema,
    reciept:recieptSchema,
    createdBy:{type:String,required:true},
    Date:{type: Date,default:Date.now}
});

module.exports = mongoose.model('Transaction',transactionSchema);