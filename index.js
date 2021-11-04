const { response } = require('express');
const express = require('express');

const app = express();

app.listen(5000,()=>{console.log("app is running on port 5000")});

app.get("/hi",(req, res)=>{res.send("Hello World")});

app.get("/",(req, res)=>{res.send("Api is running")});