const express = require('express');
const bodyParser = require('body-parser');
const dbconnection = require('./modules/db');
const mongoose = require('mongoose');
const path = require('path');
const billModel = require('./modules/schemas/Bill');
const recieptModel = require('./modules/schemas/reciept');
var app = express();
const PORT = process.env.PORT || 5000;
const connectionURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sapthagiri'

// Middlewares
app.use(bodyParser.urlencoded({'extended':'true'})); 
app.use(bodyParser.json());  
app.use("/public", express.static(path.join(__dirname, 'public')));


//Routes
app.get('/api/viewresident/:resident_id',function(req,res){
    let db = new dbconnection(connectionURI);
    console.log(req.params.resident_id);
    let results = db.getResident({_id:req.params.resident_id});
    if(results == -1){
        res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            if(!data){
                res.status(404).json({
                    message: "Resident does not exist"
                });
            }
            else{
                res.status(200).json(data);
            }    
        });
        
    }
});

app.get('/api/viewtransaction/:transaction_id',function(req,res){
    let db = new dbconnection(connectionURI);
    let results = db.getTransaction({_id:req.params.transaction_id});
    if(results == -1){
        res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            
            if(!data){
                res.status(404).json({
                    message: "Transaction does not exist"
                });
            }
            else{
                res.status(200).json(data);
            }    
        });
        
    }
});

app.get('/api/getallresidents',function(req,res){
    let db = new dbconnection(connectionURI);
    let results = db.getAllResidents();
    if(results == -1){
        res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            res.status(200).json(data);
        });
    }
});

app.get('/api/getalltransactions',function(req,res){
    let db = new dbconnection(connectionURI);
    let results = db.getAllTransactions();
    if(results == -1){
        res.status(500).json({
            message:"Internal server error"
        });
    }
    else{
        results.then(function(data){
            res.status(200).json(data);
        });
    }
});

app.post('/api/createresident',function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo || !req.body.owner){
        res.status(500).json({
            message: "Missing required fields"
        });
        return;
    }
    duplicate = db.getResident({flatNo:req.body.flatNo});
    duplicate.then(function(data){
        if(data){
            res.status(500).json({
                message: "Resident already exists with flatNo: " + req.body.flatNo
            });
            return;
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
                    res.status(200).json({
                        id:payload._id
                    });
                }
                else{
                    res.status(500).json({
                        message: "Failed to save new resident to database"
                    });
                }
            });
        }
    });
});

app.post('/api/createtransaction',function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo || !req.body.type || !req.body.createdBy || (!req.body.bill && !req.body.reciept) || (req.body.type == "bill" && !req.body.bill) || (req.body.type=="reciept") && !req.body.reciept){
        res.status(500).json({
            message:"Missing required fields"
        });
        return;
    }
    let result = db.getResident({flatNo:req.body.flatNo});
    result.then(function(data){
        if(!data){
            res.status(500).json({
                message:"No entry for resident with flatNo: "+req.body.flatNo
            });
            return;
        }
        else{
            let payload = {};
            payload._id = mongoose.Types.ObjectId();
            payload.type = req.body.type;
            payload.createdBy = req.body.createdBy
            payload.flatNo = req.body.flatNo;
            if(payload.type == "bill"){
                if(!req.body.bill.details.maintanence){
                    res.status(500).json({
                        message:"Maintanence field missing in Bill details"
                    });
                    return;
                }
                let billdetails = req.body.bill.details;
                let total = 0
                for(var costs in billdetails){
                    total += billdetails[costs];
                }
                req.body.bill.total = total;
                payload.bill = req.body.bill;
                console.log(payload);
            }
            else if(payload.type == "reciept"){
                if(!req.body.reciept.paymentType || !req.body.reciept.total){
                    res.status(500).json({
                        message:"missing entries in reciept details"
                    });
                    return;
                }
                payload.reciept = req.body.reciept;
            }
            if(req.body.date){
                payload.Date = new Date(req.body.date);
            }
            let result = db.newTransaction(payload);
            result.then(function(data){
                if(data == 0){
                    res.status(200).json({
                        id:payload._id
                    });
                }
                else{
                    res.status(500).json({
                        message: "Failed to create new transaction in database"
                    });
                }
            });
        }
    });
    
});

app.put('/api/updateresident',function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo){
        res.status(500).json({
            message: "Missing required fields"
        });
        return;
    }
    duplicate = db.getResident({flatNo:req.body.flatNo});
    duplicate.then(function(data){
        if(!data){
            res.status(500).json({
                message: "No such resident exists with flat: " + req.body.flatNo
            });
            return;
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
            let status = db.updateResident(data._id,payload);
            status.then(function(response){
                
                if(response == 0){
                    res.status(200).json({
                        id:data._id
                    });
                }
                else{
                    res.status(500).json({
                        message: "Failed to update resident in database"
                    });
                }
            });
        }
    });
});

app.put('/api/updatetransaction',function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body._id){
        res.status(500).json({
            message:"Missing required fields"
        });
        return;
    }
    let result = db.getTransaction({_id:req.body._id});
    result.then(function(data){
        if(!data){
            res.status(500).json({
                message:"No entry for transaction id: " + req.body._id
            });
            return;
        }
        else{
            let payload = {};
            if(req.body.createdBy){
                payload.createdBy = req.body.createdBy
            }
            if(req.body.flatNo){
                let result = db.getResident({flatNo:req.body.flatNo});
                result.then(function(response){
                    if(!response){
                        res.status(500).json({
                            message: "No such flat exists with flatNo: "+req.body.flatNo
                        });
                    }
                    else{
                        payload.flatNo = response.flatNo;
                    }
                });
            }
            if(data.type == "bill"){
                if(!req.body.bill.details || !req.body.bill.details.maintanence){
                    res.status(500).json({
                        message:"Mandatory fields missing for bill"
                    });
                    return;
                }
                let billdetails = req.body.bill.details;
                let total = 0
                for(var costs in billdetails){
                    total += billdetails[costs];
                }
                req.body.bill.total = total;
                payload.bill = req.body.bill;
            }
            else if(data.type == "reciept"){
                if(!req.body.reciept){
                    res.status(500).json({
                        message:"Missing reciept details for reciept"
                    });
                }
                payload.reciept = req.body.reciept;
            }
            if(req.body.date){
                payload.Date = new Date(req.body.date);
            }
            let result = db.updateTransaction(req.body._id,payload);
            result.then(function(data){
                if(data == 0){
                    res.status(200).json({
                        id:req.body._id
                    });
                }
                else{
                    res.status(500).json({
                        message: "Failed to update ransaction in database"
                    });
                }
            });
        }
    });
});

app.delete('/api/deleteresident',function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body.flatNo){
        res.status(500).json({
            message:"No flat no provided for deletion"
        });
        return;
    }
    let status = db.getResident({flatNo:req.body.flatNo});
    status.then(function(data){
        if(!data){
            res.status(500).json({
                message: "No such entry with flatNo: "+req.body.flatNo
            });
            return;
        }
        status = db.deleteResident(data._id);
        status.then(function(data){
            if(data == 0){
                res.status(200).json({
                    message: "Successfully deleted resident entry"
                });
                return;
            }
            else{
                res.status(500).json({
                    message: "Error occured while deleting resident entry from db"
                });
                return;
            }
        });
        
    })
});

app.delete('/api/deletetransaction',function(req,res){
    let db = new dbconnection(connectionURI);
    if(!req.body._id){
        res.status(500).json({
            message:"No id provided for deletion"
        });
        return;
    }
    let status = db.getTransaction({_id:req.body._id});
    status.then(function(data){
        if(!data){
            res.status(500).json({
                message: "No such transaction with id:  "+req.body._id
            });
            return;
        }
        status = db.deleteTransaction(data._id);
        status.then(function(data){
            if(data == 0){
                res.status(200).json({
                    message: "Successfully deleted transaction entry"
                });
                return;
            }
            else{
                res.status(500).json({
                    message: "Error occured while deleting transaction entry from db"
                });
                return;
            }
        }); 
    });
});

//Static
app.get('*', function(req, res) {
    res.sendfile('./public/index.html');
});

//Handle 404
app.use(function(req,res){
    res.status(404).json({
        message:"Page not found"
    });
})

//Handle 500
app.use(function(err,req,res){
    res.status(500).json({
        message:"Internal server error",
        error: err.message
    });
});


app.listen(PORT,function(){
    console.log("Server started at Port: " + PORT);
});

