const mongoose = require('mongoose');

let BillDetails = mongoose.Schema({
    maintanence:{type:Number,required:true}
},{strict:false});

let BillSchema = mongoose.Schema({
    details:BillDetails,
    total: {type:Number,required:true}
});

module.exports = BillSchema;