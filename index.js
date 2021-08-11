var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var multer = require('multer');
const fs = require('fs')
var rfs = require('rotating-file-stream')
var morgan = require('morgan');
const winston = require('winston');
const mongoose = require('mongoose');

require('dotenv').config({path: './.env.example'});



mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('DB Connected!')
});



var app = express();
const port = 3000;

const upload_path = 'D:/Apache/Apache24/htdocs/Server/Nodejs/Second/public';

app.use(express.static('public'));
//var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'log/project.log' })
  ]
});

logger.info('Hello again distributed logs');

var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
})

loggerstream = {
  write: function (message, encoding) {
    logger.info(message);
  }
};

app.use(morgan('combined', { stream: accessLogStream }));
//app.use(morgan('combined', { stream: loggerstream }));

//var pattern = ':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms';
//app.use(morgan(pattern, { stream: accessLogStream }));
//var upload = multer({ dest: 'public/' })
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, upload_path)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname)
  }
})

var fileFilter = function(req, file, cb) {
	console.log(file)
	if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        cb('Only image files are allowed!', false);
    }
    cb(null, true);
}

var limits = { fileSize: 1 * 1024 * 1024 }	//1MB

var upload = multer({ storage: storage, fileFilter: fileFilter, limits: limits });



//app.use('/static', express.static(path.join(__dirname, 'public')))
//http://localhost:3000/static/hello.html
//var favicon = require('serve-favicon');


// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
//form-urlencoded
// for parsing application/json
app.use(bodyParser.json());

// for parsing multipart/form-data
//app.use(upload.array());

//app.use(favicon(path.join(__dirname, 'images', 'favicon.ico')));

app.post('/profile', upload.single('file_name'), function (req, res, next) {
	const maxSize = 1 * 1024 * 1024; // for 1MB 
	var data = {'one': 'Test'};
	res.json(data);
});

app.get('/', function(req, res, next) {
	res.send('<img src="/SampleJPGImage_5mbmb.jpg" />');
});

app.get('/:id', function(req, res, next) {
	const kittySchema = new mongoose.Schema({
	  id: {}
	});
	const Kitten = mongoose.model('Kitten', kittySchema);
	const silence = new Kitten({ id: req.params.id });
	/*Kitten.updateOne({ id: 550 }, { id: 10 }, function(err, re) {
		if(err) {
			logger.info(err);
			return handleError(err);	
		}
		console.log(res);
		res.json('Updated');
	});*/
	Kitten.insertMany([{ id: req.params.id }, {id : 564}], function(err) {
		if(err) {
			logger.info(err);
			return handleError(err);	
		}
		res.json('Saved Many');
	});
	silence.save(function(err) {
		if(err) {
			logger.info(err);
			return handleError(err);	
		}
		res.json('Saved');
	})
	
	/*Kitten.find(function (err, kittens) {
	  if (err) return console.error(err);
	  res.json(req.kittens);
	})*/
	//res.json(req.params);
});

app.get('/create/collection', (req, res, next) => {
	const userSchema = new mongoose.Schema({ name: String })
	const User = mongoose.model('User', userSchema);

	User.createCollection().then(function(collection) {
	  console.log('Collection is created!');
	});

	res.json('Failed');
});

app.get('/mongoose/insert', (req, res, next) => {
	const userSchema = new mongoose.Schema({ name: String })
	const User = mongoose.model('Users', userSchema);
	const saveUser = new User({name: 'Test'});

	saveUser.save(function(err) {
		if(err) {
			console.log('Collection is created!', err);
			res.json('Error');
		} else {
			res.json('Success');
		}
	});
});


app.get('/mongoose/schema', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String,
		uno: Number,
		_uid: mongoose.Schema.Types.ObjectId,
		ser: mongoose.Schema.Types.Mixed,
		comments: [{ body: String}],
		created: Date
	});
	const User = mongoose.model('Users', userSchema);
	const saveUser = new User({
		name: "Surendar",
		uno: 654,
		_uid: new mongoose.Types.ObjectId,
		ser: {one: 'Test'},
		comments: [{ body: 'Body'}],
		created: new Date
	});

	saveUser.save(function(err) {
		if(err) {
			res.json('Error');
		} else {
			res.json('Success');
		}
	});
});

app.get('/mongoose/insertmany', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: mongoose.Schema.Types.Mixed
	});

	userSchema.pre('save', function(next) {
		const err = new Error('something went wrong');
		next();
	})

	const User = mongoose.model('Many', userSchema);
	const saveUser = [{name: "Surendar2"}, {name: "Raj2"}];

	User.insertMany(saveUser, function(err) {
		if(err) {
			res.json('Error');
		} else {
			res.json('Success');
		}
	});
});

//Update only document
app.get('/mongoose/update/one', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);
	User.update({name: "Raj1"}, {name: "New Name1"}, function(err){
		if(err) {
			res.json('Error');
		} else {
			res.json('Success');
		}
	});
});

//It update one record
app.get('/mongoose/update', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);
	User.update({name: "Updated"}, {name: "Raj2"}, function(err){
		if(err) {
			res.json('Error');
		} else {
			res.json('Success');
		}
	});
});


//It update many record
app.get('/mongoose/update/many', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);
	User.updateMany({name: "Raj2"}, {name: "Updated"}, function(err){
		if(err) {
			res.json('Error');
		} else {
			res.json('Success');
		}
	});
});


//It update by ID
app.get('/mongoose/update/id', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);
	User.findByIdAndUpdate("60ae9f7bdd0f510de8a59e68", {name: "ID"}, function(err){
		if(err) {
			res.json('Error');
		} else {
			res.json('Success');
		}
	});
});


//It select
app.get('/mongoose/select', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);
	//await MyModel.find({ name: 'john', age: { $gte: 18 } }).exec();
	User.find({ name: 'Updated' }, function (err, docs) {
		if(err) {
			res.json('Error');
			console.log(err);
		} else {
			console.log(docs);
			res.json('Success');
		}
	});
});


//It select with options
app.get('/mongoose/select/option', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Users', userSchema);
	//await MyModel.find({ name: 'john', age: { $gte: 18 } }).exec();
	User.find().limit(3).sort({name: 1}).select({name: 1, uno: 1}).exec(function(err, doc){
		if(err) {
			res.json('Error');
			console.log(err);
		} else {
			console.log(doc);
			res.json(doc);
		}
	});
});


app.get('/mongoose/delete', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);
	User.deleteOne({ name: 'Surendar2' }, function (err) {
		if(err) {
			res.json('Error');
			console.log(err);
		} else {
			res.json('Success');
		}
	});
});


app.get('/mongoose/delete/many', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);
	User.deleteMany({ name: 'Surendar2' }, function (err) {
		if(err) {
			res.json('Error');
			console.log(err);
		} else {
			res.json('Success');
		}
	});
});



//Bulk actions
app.get('/mongoose/bulk', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: String
	});
	const User = mongoose.model('Many', userSchema);

	User.bulkWrite([
	  {
	    insertOne: {
	      document: {
	        name: 'Eddard Stark'
	      }
	    }
	  },
	  {
	    updateOne: {
	      filter: { name: 'Surendar2' },
	      update: { name: 'Hand of the King' }
	    }
	  },
	  {
	    deleteOne: {
	        filter: { name: 'ID' }
	    }
	  }
	]).then((err, bres) => {
		if(err) {
			console.log(err);
			res.json('Error');
		} else {
			console.log(res.insertedCount, res.modifiedCount, res.deletedCount);
			res.json('Success');
		}
	});
});


app.get('/mongoose/validation', (req, res, next) => {
	const userSchema = new mongoose.Schema({
		name: {
			type: String,
			required: [true, 'Required Name']
		},
		age: {
			type: Number,
			required: [true, 'Required Age'],
			min: [1, '{VALUE} => Minimum 6 characters'],
			validate: {
				validator: async function(v) {
						return new Promise((resolve, reject) => {
							if(v > 5 ) {
								resolve(true);
							} else {
								resolve(false);
							}
						})
				},
				message: props => `${props.value} is not a valid phone number!`
			}
		}
	});

	const User = db.model('User', userSchema);

	const userData = new User({
		name: 'Surendar',
		age: 4
	});

	const err = userData.validateSync();

	if(err) {
		res.json({'MyError': err});
	}

	userData.save(function(err) {
		if(err) {
			res.json({'MyErrors': err});
		} else {
			res.json('Success');
		}
	});
});



app.post('/file', (req, res, next) => {

	/*var myJSON = req.filename;
	fs.writeFile('./public/test.txt', myJSON, err => {
	  if (err) {
	    console.error(err)
	    return
	  }
	  console.log('Success Test');
	});*/
  	res.send('Success');
})

app.post('/posts', function(req, res, next) {
	console.log(req.body);
	res.send('Post');
});

app.all('*', function(req, res){
	res.send('Sorry, this is an invalid URL.');
});


app.use(function (err, req, res, next) {
  console.log(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
  	var data = { 'result': 'fail', 'error': { 'code': 1001, 'message': 'File is too big' } };
    res.json(data)
    return 
  }
  res.send('Something');
})


http.createServer(app).listen(port, () => {
	console.log('Listening port 3000');
})