const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Work = require('./../models/workModel');

dotenv.config({path:'./config.env'});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB)
  .then(() =>{
    console.log('DB connection successfull!');
  })
  .catch(err => console.log('DB connection error:', err));

  //READ JSON FILE
const works = JSON.parse(fs.readFileSync(`${__dirname}/works-simple.json`, 'utf-8'));

