var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');
var formidable = require("formidable");
var pug = require('pug');
var cmd = require('node-cmd');
var mkdirp = require('mkdirp');
var srt2vtt = require('srt-to-vtt');

const IGNORE = ['node_modules', 'tracks', 'other', 'css', 'js', 'templates'];
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const VALIDCHAR = 'abcdefghijklmnoqprstuvwxyz-0123456789'.split('');

var server = http.createServer(function(req, res){
	if(req.method.toLowerCase() == 'get'){
		displayPage(req,res);
	}else if(req.method.toLowerCase() == 'post'){
		if(req.url == '/getTrack'){
			getTrack(req,res);
		}
	}
});

function displayPage(req, res){
	var filePath = req.url;
	filePath = __dirname+filePath;
	var extname = path.extname(filePath);
	var contentType = "text/html";
	switch(extname){
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
		case '.mkv':
			contentType = 'video/webm';
			break;
		case '.vtt':
			contentType = 'text/vtt';
			break;
	}
	if(req.url == "/"){
		var p = "C:/Users/james/videos/anime/";
		var fileSys = {};
		var dirs = getDirectories(p).filter(item=>{return(IGNORE.indexOf(item) == -1)});

		Promise.all(dirs.map(dir => new Promise ((done, reject) => {
			var p = "C:/Users/james/videos/anime/" + dir;
			fs.readdir(p, (err, files) => {
				if (err) {
					throw err;
				}
				var videos = files.map(file => {
					return path.extname(file) == '.mkv' ? file : '';
				}).filter(file => {
					return file !== '';
				});
				var entry = {
					'show': dir,
					'eps': videos
				}
				done(entry);
			});
		}))).then(results => {
			var abcList = {};
			results.forEach((item, index) => {
				let showTitle = item["show"];
				if(ALPHABET.indexOf(showTitle[0].toLowerCase()) == -1){
					if(typeof abcList["#"] == 'undefined'){
						abcList["#"] = [showTitle];
					}else{
						abcList["#"].push(showTitle);
					}
				}else{
					if(typeof abcList[showTitle[0].toLowerCase()] == 'undefined'){
						abcList[showTitle[0].toLowerCase()] = [item];
					}else{
						abcList[showTitle[0].toLowerCase()].push(item);
					}
				}
			});
			fileSys['shows'] = abcList;
			//console.log(JSON.stringify(fileSys, null, '	'));
			let render = pug.renderFile('./templates/index.pug', fileSys);
			res.writeHead(200, {'Content-Type':contentType});
			res.end(render, 'utf8');
		}).catch(err => {
			console.error(err);
		});
	}else{
		fs.exists(filePath, function(exists) {
	        if (exists) {
	          fs.readFile(filePath, function(error, content) {
	              if (error) {
	                  res.writeHead(500);
	                  res.end();
	              }
	              else {                   
	                  res.writeHead(200, { 'Content-Type': contentType });
	                  res.end(content, 'utf8');                  
	              }
	          });
	        }
	    });
	}
}

function getDirectories (srcpath) {
  return fs.readdirSync(srcpath)
    .filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory());
}

function getTrack(req,res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		var show = fields.show;
		var episode = fields.episode;
		let episodepath = show + '/' + episode;
		let episodename = episode.split('.')[0];
		let trackpath = 'tracks/' + show;
		mkdirp(trackpath, err=>{
			if(err){
				console.log(err);
			}else{
				trackpath = trackpath + "/" + episodename;
				if (fs.existsSync(trackpath + '.vtt')) {
				    res.end();
				} else {
					cmd.get('mkv-subtitle-extractor ' + episodepath, function(err, data, stderr){
						let ogtrackpath = episodepath.split('.')[0] + '.srt';
						fs.rename(ogtrackpath, trackpath + '.srt', function(err){
							fs.createReadStream(trackpath + '.srt')
								.pipe(srt2vtt())
								.pipe(fs.createWriteStream(trackpath + '.vtt'));
							res.end();
						})
					});
				}
			}
		});
		res.end();
	});
}

server.listen(5000);
console.log("Listening on 5000... :)");