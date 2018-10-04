const express = require('express');
const bodyParser = require('body-parser');
const dbconnection = require('./modules/db');
const bcrypt  = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const billModel = require('./modules/schemas/Bill');
const recieptModel = require('./modules/schemas/reciept');
const ejs = require('ejs');
const pdf = require('html-pdf');
const numToWords = require('num-to-words');
const secretKey = process.env.SECRET_KEY || 'lol';
const checkAuth = require('./modules/checkAuth');
var app = express();
const PORT = process.env.PORT || 5000;
const connectionURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sapthagiri'

// Middlewares
app.use(bodyParser.urlencoded({'extended':'true'})); 
app.use(bodyParser.json());  
app.use("/public", express.static(path.join(__dirname, 'public')));



app.post('/api/login',function(req,res){
    let db  = new dbconnection(connectionURI);
    if(!req.body.username || !req.body.password){
        return res.status(500).json({
            message:"Mandatory field not provided for login"
        });
    }
    let result = db.getUser({username:req.body.username});
    result.then(function(data){
        if(!data){
            return res.status(401).json({
                message:"Authentication failed"
            });
        }
        bcrypt.compare(req.body.password,data.password,function(err,resp){
            if(err){
                return res.status(401).json({
                    message:"Authentication failed"
                });
            }
            if(resp){
                let token = jwt.sign({userId:data._id,username:data.username},secretKey,{expiresIn:"1h"});
                return res.status(200).json({
                    message:"Authentication successful",
                    token: token
                });
            }
            
            return res.status(401).json({
                message:"Authentication failed"
            });
        });
    });

});

app.post('/api/signup',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.username || !req.body.password){
        return res.status(500).json({
            message: "Mandatory data not provided"
        });
    }
    let result = db.getUser({username:req.body.username});
    result.then(function(data){
        if(data){
            return res.status(500).json({
                message: "User already exists with username " + req.body.username
            });
        }
        bcrypt.hash(req.body.password,10,function(err,hash){
            if(err){
                return res.status(500).json({
                    message: "Unable to register user in database"
                });
            }
            result = db.newUser({_id:new mongoose.Types.ObjectId(),username:req.body.username,password:hash});
            result.then(function(data){
                if(data == 0){
                    return res.status(200).json({
                        message: "Sucessfully created user"
                    });
                }
                return res.status(500).json({
                    message: "Unable to register user in database"
                });
            });
        });
        
    });
    
});
//Routes
app.get('/api/viewresident/:resident_id',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    let results = db.getResident({_id:req.params.resident_id});
    if(results == -1){
        return res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            if(!data){
                return res.status(404).json({
                    message: "Resident does not exist"
                });
            }
            else{
                results = db.getAllTransactions({flatNo:data.flatNo});
                results.then(function(transaction){
                    data.transactions = transaction;
                    return res.status(200).json(data);    
                });
            }    
        });
        
    }
});



app.get('/api/viewtransaction/:transaction_id',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    let results = db.getTransaction({_id:req.params.transaction_id});
    if(results == -1){
        return res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            
            if(!data){
                return res.status(404).json({
                    message: "Transaction does not exist"
                });
            }
            else{
                return res.status(200).json(data);
            }    
        });
        
    }
});

app.get('/api/getallresidents',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    let results = db.getAllResidents();
    if(results == -1){
        return res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            return res.status(200).json(data);
        }); 
    }
});

app.get('/api/getalltransactions',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    let results = db.getAllTransactions();
    if(results == -1){
        return res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            return res.status(200).json(data);
        });
    }
});

app.post('/api/createresident',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo || !req.body.owner){
        return res.status(500).json({
            message: "Missing required fields"
        });
        
    }
    duplicate = db.getResident({flatNo:req.body.flatNo});
    duplicate.then(function(data){
        if(data){
            return res.status(500).json({
                message: "Resident already exists with flatNo: " + req.body.flatNo
            });
            
        }
        else{
            let payload = {}
            payload._id = mongoose.Types.ObjectId();
            payload.flatNo = req.body.flatNo;
            payload.owner = req.body.owner;
            if(req.body.associate){
                payload.associate = req.body.associate;
            }
            if(req.body.email){
                payload.email = req.body.email;
            }
            if(req.body.phone){
                payload.phone = req.body.phone;
            }
            if(req.body.currentDues){
                payload.currentDues = req.body.currentDues;
            }
            let status = db.newResident(payload);
            status.then(function(data){
                if(data == 0){
                    return res.status(200).json({
                        id:payload._id
                    });
                }
                else{
                    return res.status(500).json({
                        message: "Failed to save new resident to database"
                    });
                }
            });
        }
    });
});

app.post('/api/createtransaction',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo || !req.body.type || !req.body.createdBy || (!req.body.bill && !req.body.reciept) || (req.body.type == "bill" && !req.body.bill) || (req.body.type=="reciept") && !req.body.reciept){
        return res.status(500).json({
            message:"Missing required fields"
        });
        
    }
    let result = db.getResident({flatNo:req.body.flatNo});
    result.then(function(data){
        if(!data){
            return res.status(500).json({
                message:"No entry for resident with flatNo: "+req.body.flatNo
            });
            
        }
        else{
            let payload = {};
            payload._id = mongoose.Types.ObjectId();
            payload.type = req.body.type;
            payload.createdBy = req.body.createdBy
            payload.flatNo = req.body.flatNo;
            if(payload.type == "bill"){
                if(!req.body.bill.details.maintanence || !req.body.bill.particulars){
                    return res.status(500).json({
                        message:"Missing required fields for bills"
                    });
                    
                }
                let billdetails = req.body.bill.details;
                let total = 0
                for(var costs in billdetails){
                    total += billdetails[costs];
                }
                req.body.bill.arrears = data.currentDues;
                total += req.body.bill.arrears;
                req.body.bill.total = total;
                payload.bill = req.body.bill;
                if(req.body.date){
                    payload.Date = new Date(req.body.date);
                }
                let result = db.newTransaction(payload);
                result.then(function(st){
                    if(st == 0){
                        let rest = db.updateResident({_id:data._id},{currentDues:total});
                        return res.status(200).json({
                            id:payload._id
                        });
                    }
                    else{
                        return res.status(500).json({
                            message: "Failed to create new transaction in database"
                        });
                    }
                });
                
                
            }
            else if(payload.type == "reciept"){
                if(!req.body.reciept.paymentType || !req.body.reciept.total || !req.body.reciept.billId){
                    return res.status(500).json({
                        message:"Missing entries in reciept details"
                    });
                    
                }
                let rest = db.getTransaction({_id:req.body.reciept.billId});
                rest.then(function(data2){
                    if(!data2){
                        return res.status(500).json({
                            message:"No Bill exists with billId: "+req.body.reciept.billId
                        });
                    }
                    else{
                        payload.reciept = req.body.reciept;
                        if(req.body.date){
                            payload.Date = new Date(req.body.date);
                        }
                        let result = db.newTransaction(payload);
                        result.then(function(st){
                            if(st == 0){
                                let dues = data.currentDues - req.body.reciept.total;
                                rest2 = db.updateResident({_id:data._id},{currentDues:dues});
                                return res.status(200).json({
                                    id:payload._id
                                });
                            }
                            else{
                                return res.status(500).json({
                                    message: "Failed to create new transaction in database"
                                });
                            }
                        });    
                        
                    }
                });
                
            }
           
        }
    });
    
});

app.put('/api/updateresident',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo){
        return res.status(500).json({
            message: "Missing required fields"
        });
        
    }
    duplicate = db.getResident({flatNo:req.body.flatNo});
    duplicate.then(function(data){
        if(!data){
            return res.status(500).json({
                message: "No such resident exists with flat: " + req.body.flatNo
            });
            
        }
        else{
            let payload = {};
            if(req.body.owner){
                payload.owner = req.body.owner;
            }
            if(req.body.associate){
                payload.associate = req.body.associate;
            }
            if(req.body.email){
                payload.email = req.body.email;
            }
            if(req.body.phone){
                payload.phone = req.body.phone;
            }
            if(req.body.currentDues){
                payload.currentDues = req.body.currentDues;
            }
            let status = db.updateResident({_id:data._id},payload);
            status.then(function(response){
                
                if(response == 0){
                    return res.status(200).json({
                        id:data._id
                    });
                }
                else{
                    return res.status(500).json({
                        message: "Failed to update resident in database"
                    });
                }
            });
        }
    });
});

app.put('/api/updatetransaction',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body._id){
        return res.status(500).json({
            message:"Missing required fields"
        });
        
    }
    let result = db.getTransaction({_id:req.body._id});
    result.then(function(data){
        if(!data){
            return res.status(500).json({
                message:"No entry for transaction id: " + req.body._id
            });
            
        }
        else{
            let payload = {};
            if(req.body.createdBy){
                payload.createdBy = req.body.createdBy
            }
            var changeflat;
            if(req.body.flatNo){
                let result = db.getResident({flatNo:req.body.flatNo});
                result.then(function(response){
                    if(!response){
                        return res.status(500).json({
                            message: "No such flat exists with flatNo: "+req.body.flatNo
                        });
                    }
                    else{
                        payload.flatNo = response.flatNo;
                        changeflat = response.arrears;
                    }
                });
            }
            if(data.type == "bill"){
                if(!req.body.bill.details || !req.body.bill.details.maintanence || !req.body.bill.particulars){
                    return res.status(500).json({
                        message:"Mandatory fields missing for bill"
                    });
                    
                }
                let billdetails = req.body.bill.details;
                let total = 0
                for(var costs in billdetails){
                    total += Number(billdetails[costs]);
                }
                if(changeflat){
                    total += changeflat
                    req.body.bill.arrears = changeflat;
                }
                else{
                    req.body.bill.arrears = data.arrears;
                }
                req.body.bill.total = total;
                payload.bill = req.body.bill;
            }
            else if(data.type == "reciept"){
                if(!req.body.reciept){
                    return res.status(500).json({
                        message:"Missing reciept details for reciept"
                    });
                }
                payload.reciept = req.body.reciept;
            }
            if(req.body.date){
                payload.Date = new Date(req.body.date);
            }
            let result = db.updateTransaction({_id:req.body._id},payload);
            result.then(function(data){
                if(data == 0){
                    return res.status(200).json({
                        id:req.body._id
                    });
                }
                else{
                    return res.status(500).json({
                        message: "Failed to update ransaction in database"
                    });
                }
            });
        }
    });
});

app.delete('/api/deleteresident',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo){
        return res.status(500).json({
            message:"No flat no provided for deletion"
        });
        
    }
    let status = db.getResident({flatNo:req.body.flatNo});
    status.then(function(data){
        if(!data){
            return res.status(500).json({
                message: "No such entry with flatNo: "+req.body.flatNo
            });
            
        }
        status = db.deleteResident(data._id);
        status2 = db.deleteTransactions({flatNo:data.flatNo});
        status.then(function(data){
            if(data == 0){
                return res.status(200).json({
                    message: "Successfully deleted resident entry"
                });
                
            }
            else{
                return res.status(500).json({
                    message: "Error occured while deleting resident entry from db"
                });
                
            }
        });
        
    })
});

app.delete('/api/deletetransaction',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body._id){
        return res.status(500).json({
            message:"No id provided for deletion"
        });
        
    }
    let status = db.getTransaction({_id:req.body._id});
    status.then(function(data){
        if(!data){
            return res.status(500).json({
                message: "No such transaction with id:  "+req.body._id
            });
            
        }
        rest2 = db.getResident({flatNo:data.flatNo});
        rest2.then(function(d2){
            if(data.type == "bill"){
                let dues = d2.currentDues - data.total;
                rest = db.updateResident({flatNo:data.flatNo},{currentDues:dues});
            }
            else{
                let dues = d2.currentDues + data.total;
                rest = db.updateResident({flatNo:data.flatNo},{currentDues:dues});
            }
        });
       
        status = db.deleteTransaction(data._id);
        status.then(function(data){
            if(data == 0){
                return res.status(200).json({
                    message: "Successfully deleted transaction entry"
                });
                
            }
            else{
                return res.status(500).json({
                    message: "Error occured while deleting transaction entry from db"
                });
                
            }
        }); 
    });
});

app.get('/api/getcopy/:transaction_id',checkAuth,function(req,res){
    let db = new dbconnection(connectionURI);
    let status = db.getTransaction({_id:req.params.transaction_id});
    status.then(function(data){
        if(!data){
            return res.status(500).json({
                message:"No such transaction exists with id: "+transaction_id
            });
        }
        else{
            result = db.getResident({flatNo:data.flatNo});
            result.then(function(d){
                data.owner = d.owner;
                if(data.type == "bill"){
                    data.bill.totalinWords  = numToWords.numToWords(data.bill.total);
                    ejs.renderFile('./templates/bill.ejs',data,function(err,str){
                        if(err){
                            return res.status(500).json({
                                message:"Unable to generate bill",
                                err:err.message
                            });
                            
                        }
                        let html = str;
                        pdf.create(html,{"orientation":"landscape"}).toFile('./templates/transaction.pdf',function(err,resp){
                            if(err){
                                return res.status(500).json({
                                    message:"Unable to generate bill",
                                    err:err.message
                                });
                                
                            }
                            res.sendFile(resp.filename);
                        });
                    });
                }
                else{
                    
                    data.reciept.totalinWords = numToWords.numToWords(data.reciept.total);
                    rest = db.getTransaction({_id:data.reciept.billId});
                    rest.then(function(data2){
                        data.reciept.particulars = data2.bill.particulars;
                        ejs.renderFile('./templates/reciept.ejs',data,function(err,str){
                            if(err){
                                return res.status(500).json({
                                    message:"Unable to generate reciept",
                                    err:err.message
                                });
                                
                            }
                            let html = str;
                            pdf.create(html,{"orientation":"landscape"}).toFile('./templates/transaction.pdf',function(err,resp){
                                if(err){
                                    return res.status(500).json({
                                        message:"Unable to generate reciept",
                                        err:err.message
                                    });
                                    
                                }
                                res.sendfile(resp.filename);
                            });
                        });
                    });
                }
                
            });
            
        }
    });
});

//Static
app.get('*', function(req, res) {
    res.sendfile('./public/index.html');
});

//Handle 404
app.use(function(req,res){
    return res.status(404).json({
        message:"Page not found"
    });
})

//Handle 500
app.use(function(err,req,res){
    return res.status(500).json({
        message:"Internal server error",
        error: err.message
    });
});


app.listen(PORT,function(){
    console.log("Server started at Port: " + PORT);
});


function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
}