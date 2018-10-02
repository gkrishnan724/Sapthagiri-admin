const mongoose = require('mongoose');

let BillDetails = mongoose.Schema({
    maintanence:{type:Number,required:true},
},{strict:false});

let BillSchema = mongoose.Schema({
    details:BillDetails,
    particulars:{type:String,required:true},
    realised:{type:Boolean,required:true,default:false},
    arrears:{type:Number,required:true},
    total: {type:Number,required:true}
});

module.exports = BillSchema;