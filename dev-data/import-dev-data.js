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
const works = JSON.parse(fs.readFileSync(`${__dirname}/data/works-simple.json`, 'utf-8'));

//IMPORT DATA INTO DB
const importData = async() =>{
    try {
        await Work.create(works);
        console.log('Data successfully loaded!');
    } catch (error) {
        console.log(error);
    }

    process.exit();
}

//DELETE ALL EXISTING DATA FROM DB
const deleteData = async() =>{
    try {
        await Work.deleteMany();
        console.log('Data successfully deleted!');
        
    } catch (error) {
        console.log(error);
    } 

    process.exit();
}

// USING THE TERMINAL TO IMPORT OR DELETE
if(process.argv[2] === '--import'){
    importData()
} else if (process.argv[2] === '--delete'){
    deleteData();
}



// node dev-data/import-dev-data.js --delete
// node dev-data/import-dev-data.js --import

