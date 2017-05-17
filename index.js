var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');
var pug = require('pug');

const IGNORE = ['node_modules', 'js', 'css', 'tracks', 'templates', '.git', 'other'];
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

var server = http.createServer(function(req, res){
	if(req.method.toLowerCase() == 'get'){
		displayPage(req,res);
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
		case '.css':
			contentType = 'text/css';
	}
	if(req.url == "/"){
		var p = "./";
		var fileSys = {};
		var dirs = getDirectories(p).filter(item=>{return(IGNORE.indexOf(item) == -1)});

		Promise.all(dirs.map(dir => new Promise ((done, reject) => {
			var p = './' + dir;
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
			console.log(results);
			results.forEach((item, index) => {
				let showTitle = item["show"];
				if(ALPHABET.indexOf(showTitle[0]) == -1){
					if(typeof abcList["#"] == 'undefined'){
						abcList["#"] = [showTitle];
					}else{
						abcList["#"].push(showTitle);
					}
				}else{
					if(typeof abcList[showTitle[0]] == 'undefined'){
						abcList[showTitle[0]] = [item];
					}else{
						abcList[showTitle[0]].push(item);
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

server.listen(5000);
console.log("Listening on 5000... :)");