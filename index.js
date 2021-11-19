const { response } = require('express');
const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./dbConnectExec.js");
const rockwellConfig = require("./config.js");
const { connect } = require('mssql');
const auth = require("./middleware/authenticate.js");

const app = express();

app.use(express.json());

app.listen(5000,()=>{console.log("app is running on port 5000")});

app.get("/hi",(req, res)=>{res.send("Hello World")});

app.get("/",(req, res)=>{res.send("Api is running")});


app.post("/reviews", auth, async (req, res)=>{
    try{
        let movieFK = req.body.movieFK;
        let summary = req.body.summary;
        let rating = req.body.rating;

        if(!movieFK || !summary || !rating || !Number.isInteger(rating)){
            return res.status(400).send("Bad request");
        };

        summary = summary.replace("'","''");
        // console.log("summary", summary);
        // console.log("here is the contact ",req.contact);

        let insertQuery = `INSERT INTO review(Summary, Rating, MovieFK, ContactFK)
        OUTPUT inserted.ReviewPK, inserted.Summary, inserted.Rating, inserted.MovieFK
        VALUES('${summary}','${rating}','${movieFK}',${req.contact.ContactPK})`;

        let insertedReview = await db.executeQuery(insertQuery);
        // console.log("inserted review", insertedReview);

        // res.send("here is the response");

        res.status(201).send(insertedReview[0]);
    }
    catch(err){
        console.log("Error in POST /reviews", err);
        res.status(500).send();
    }
})

app.get("/contacts/me", auth,(req,res)=>{
    res.send(req.contact);
})

app.post("/contacts/login", async (req, res)=>{
    // console.log("/contacts/login called", req.body);

    // 1. data validation
    let email = req.body.email;
    let password = req.body.password;

    if(!email || !password){
        return res.status(400).send("Bad request");
    }

    // 2. check that user is in data base

    let query = `SELECT *
    FROM Contact
    WHERE email = '${email}'`;
    
    let result;

    try{
        result = await db.executeQuery(query);
    }catch(myError){
        console.log("error in /contacts/login", myError);
        return res.status(500).send();
    }
    // console.log("result", result);

    if(!result[0]){
        return res.status(401).send("Invalid user credentials");
    }

    // 3. check pass

    let user = result[0]; 

    if(!bcrypt.compareSync(password, user.Password)){
        console.log("Invalid password")
        return res.status(401).send("Invalid user credentials");
    }

    // 4. generate token

    let token = jwt.sign({pk:user.ContactPK}, rockwellConfig.JWT, {expiresIn: "60 minutes"});
    // console.log("token", token);


    // 5. Save token and respond

    let setTokenQuery = `UPDATE Contact
    SET token = '${token}'
    WHERE ContactPK = ${user.ContactPK}`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user:{
                nameFirst: user.nameFirst,
                nameLast: user.nameLast,
                Email: user.Email, 
                ContactPK: user.ContactPK
            }
        })
    }catch(myError){
        console.log("error in setting user token", myError);
        res.status(500).send()
    }

})

app.post("/contacts", async (req, res)=>{ 
    // res.send("/contacts called");

    // console.log("request body", req.body);

    let nameFirst = req.body.nameFirst;
    let nameLast = req.body.nameLast; 
    let email = req.body.email;
    let password = req.body.password;

    if(!nameFirst || !nameLast || !email || !password){ 
        return res.status(400).send("Bad request"); 
    }

    nameFirst = nameFirst.replace("'", "''");
    nameLast = nameLast.replace("'", "''");

    let emailCheckQuery = `SELECT email 
    FROM contact
    WHERE email = '${email}'`;

    let existingUser = await db.executeQuery(emailCheckQuery);

    // console.log("existing user", existingUser);

    if(existingUser[0]){return res.status(409).send("Duplicate email")};

    let hashedPassword = bcrypt.hashSync(password);

    let insertQuery = `INSERT INTO contact(NameFirst, NameLast, Email, Password)
    VALUES('${nameFirst}', '${nameLast}', '${email}', '${hashedPassword}')`;

    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{console.log("error in POST /contact",err);
        res.status(500).send(); 
    })
})


app.get("/movies", (req, res)=>
{
    //get data from database
    db.executeQuery(`SELECT *
    FROM movie
    LEFT JOIN Genre
    ON genre.GenrePK = movie.GenreFK`).then((theResults)=>{
        res.status(200).send(theResults);
    }).catch((myError)=>{
        console.log(myError);
        res.status(500).send();
    })
})

app.get("/movies/:pk",(req, res)=>{
    let pk = req.params.pk;
    // console.log(pk);
    let myQuery = `SELECT * 
    FROM movie
    LEFT JOIN Genre 
    ON genre.GenrePK = movie.GenreFk
    WHERE moviepk = ${pk}`

    db.executeQuery(myQuery)
    .then((result)=>{
        // console.log(result);
        if(result[0]){
            res.send(result[0]);
        }
        else{res.status(404).send("bad request");}
    })
    .catch((err)=>{
        console.log("Error in /movie/:pk", err); 
        res.status(500).send();
    })
});