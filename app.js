const express = require('express')                  
const bodyParser = require('body-parser')
const path  = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')


const app = express()

//middleware
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.set('view engine', 'html')
app.use('/', express.static('views'));

// Mongo URI
const mongoURI = 'mongodb+srv://Admin:eS6cmvw0nBBvI89V@cluster0.fknh8.mongodb.net/test?retryWrites=true&w=majority'
// create mongo connection
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true }) 
//init gfs
let gfs
conn.once('open', ()=>{
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('uploads')
})
//create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });
//@route GET /
//@desc Loads from
app.get('/', (req, res) => {
    res.render('index');

})

//@route POST /upload
//@desc uploads file to db
app.post('/upload', express.static('upload'), upload.single('file') ,(req, res)=>{
    res.json({file: req.file})
    //res.redirect('/')
})
//route GET files
// desc: displays all files in json

app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if(!files) {
      return res.status(404).json({
        err: 'no files exist'})
    }
  return res.json(files)
  })
})

const port = 5000
app.listen(port, () =>{
    console.log(`server started on port ${port}`)
})


