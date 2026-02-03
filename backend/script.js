require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(()=>{
    console.log("SUCCESS:Connected to MongoDB");
  })
  .catch((err)=>{
    console.log("ERROR:Could not connect to MongoDB");
    console.log(err.message);
  });


app.get('/',(req,res)=>{
  res.send("Backend Server is Running!");
});

const PORT=process.env.PORT||5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});