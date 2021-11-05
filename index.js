const { response } = require('express');
const express = require('express');

const db = require("./dbConnectExec.js");


const app = express();

app.listen(5000,()=>{console.log("app is running on port 5000")});

app.get("/hi",(req, res)=>{res.send("Hello World")});

app.get("/",(req, res)=>{res.send("Api is running")});

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