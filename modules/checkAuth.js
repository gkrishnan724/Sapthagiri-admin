const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY  || 'lol';
module.exports = function(req,res,next){
    if(req.headers.authorization){
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token,secretKey,function(err,decoded){
            if(err){
                console.log(err);
                res.status(401).json({
                    message:"Authentication failed"
                });
                
            }
            req.userData = decoded;
            next();
        });
    }
    else{
        res.status(401).json({
            message:"Authentication failed"
        });
    }
    
    
    
}