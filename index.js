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
    FROM movies 
    LEFT JOIN Genre
    ON genre.GenrePK = movie.GenreFK`).then((theResults)=>{
        res.status(200).send(theResults);
    }).catch((myError)=>{
        console.log(myError);
        res.status(500).send();
    })
})