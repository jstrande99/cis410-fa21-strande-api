const { response } = require("express");
const jwt = require("jsonwebtoken");
const rockwellConfig = require("../config.js");

const db = require("../dbConnectExec.js");

const auth = async(req,res,next)=>{
    // console.log("In the Middleware", req.header("Authorization"))
    // next();
    try{
        //1. decode token
        let myToken = req.header("Authorization").replace("Bearer ","");
        // console.log("token",myToken);

        let decoded = jwt.verify(myToken, rockwellConfig.JWT);
        console.log(decoded);

        let ContactPK = decoded.pk;

        //2. compare token with db 
        let query = `SELECT ContactPK, NameFirst, NameLast, Email
        FROM Contact
        WHERE ContactPK= ${ContactPK} and token = '${myToken}'`;

        let returnedUser = await db.executeQuery(query);
        console.log("returned user", returnedUser);

        //3. save user information in the request 
        if(returnedUser[0]){
            req.contact = returnedUser[0];
            next();

        }else{
            return res.status(401).send("Invalid credentials")
        }
    }
    catch(err){
        console.log(err);
        return res.status(401).send("Invalid credentials");
    }
}

module.exports = auth; 