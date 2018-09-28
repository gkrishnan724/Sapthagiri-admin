const mongoose = require('mongoose');
const userModel = require('./schemas/user');
const residentModel = require('./schemas/residents');
const transactionModel = require('./schemas/transaction');
const connectionURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sapthagiri'

function Database(connectionURI){
    this.connectionURI = connectionURI;
}

Database.prototype.connect = async function(){
    var self = this;
    if(!self.conn){
        try{
            self.conn = await mongoose.connect(self.connectionURI);
        }catch(err){
            console.log(err);
            return -1;
        }
    }
}

Database.prototype.getAllResidents = async function (){
    var self = this;
    self.connect();
    try{
        results = await residentModel.find({});
    }
    catch(err){
        console.log(err);
        return -1;
    }
    return results;
}

Database.prototype.getAllTransactions = async function(){
    var self = this;
    self.connect();
    try{
        results = await transactionModel.find({});
    }
    catch(err){
        console.log(err);
        return -1;
    }
    return results;
}

Database.prototype.getResident = async function(options){
    var self = this;
    self.connect();
    
    try{
        if(options._id && !mongoose.Types.ObjectId.isValid(options._id)){
            results = null;
            
        }
        else{
            results = await residentModel.findOne(options);
        }
    }
    catch(err){
        console.log(err);
        return -1;
    }
    return results;
}

Database.prototype.getTransaction = async function(options){
    var self = this;
    self.connect();
    try{
        if(options._id && !mongoose.Types.ObjectId.isValid(options._id)){
            results = null;
        }
        else{
            results = await transactionModel.findOne(options);
        }
        
    }
    catch(err){
        console.log(err);
        return -1;
    }
    return results;
}

Database.prototype.newResident = async function(options){
    var self = this;
    self.connect();
    try{
        var resident = new residentModel(options);
        await resident.save();
    }
    catch(err){
        console.log(err);
        return -1;
    }
    return 0;
}

Database.prototype.newTransaction = async function(options){
    var self = this;
    self.connect();
    try{
        var transaction = new transactionModel(options);
        await transaction.save();
    }catch(err){
        console.log(err);
        return -1;
    }
    return 0;
}

Database.prototype.updateResident = async function(id,options){
    var self = this;
    self.connect();
    try{
        await residentModel.update({_id:id},{$set:options});
    }
    catch(err){
        console.log(err);
        return -1;
    }
    return 0;
}

Database.prototype.updateTransaction = async function(tid,options){
    var self = this;
    self.connect();
    try{
        await transactionModel.update({_id:tid},{$set:options});
    }catch(err){
        console.log(err);
        return -1;
    }
    return 0;
}

Database.prototype.deleteResident = async function(id){
    var self = this;
    self.connect();
    try{
        await residentModel.deleteOne({_id:id});
    }catch(err){
        console.log(err);
        return -1;
    }
    return 0;
}

Database.prototype.deleteTransaction = async function(id){
    var self = this;
    self.connect();
    try{
        await transactionModel.deleteOne({_id:id});
    }catch(err){
        console.log(err);
        return -1;
    }
    return 0;
}

module.exports = Database;
