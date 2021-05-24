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
const mongoURI = 'mongodb+srv://<username>:<password>@cluster0.fknh8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
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
    //res.json({file: req.file})
    res.redirect('/')
})
//route GET files
// desc: displays all files in json

app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if(!files || files.length === 0) {
      return res.status(404).json({
        err: 'no files exist'})
    }
  return res.json(files)
  })
})


//route GET /files/:filename
// desc: displays single file obj
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) =>{
    if(!file || file.length === 0) {
      return res.status(404).json({
        err: 'no file exist'})
    }
  return res.json(file)
  })

})


//@route GET /image/:filename
//@desc Display image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) =>{
    if(!file || file.length === 0) {
      return res.status(404).json({
        err: 'no such file exists'
      })
    }

    //check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      //read output to browser
      const readstream = gfs.createReadStream(file.filename)
      readstream.pipe(res)
    } else {
      res.status(404).json({
        err: "not an image"
      })
    }
  })

})


const port = 5000
app.listen(port, () =>{
    console.log(`server started on port ${port}`)
})


