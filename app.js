
/**
 * Module dependencies.
 */

var request = require('request'),
	url = require('url'),
	jsdom = require('jsdom'),
	express = require('express'),
	fs = require('fs');
;

var maxNumber = 8;

var reserveKey = ["abstract","boolean","break","byte","case","catch","char","class","const","continue","debugger","default",
"delete","do","double","else","enum","export","extends","final","finally","float","for","function","goto","if","implements",
"import","in","instanceof","int","interface","long","native","new","package","private","protected","public","return",
"short","static","super","switch","synchronized","this","throw","throws","transient","try","typeof","var","void","volatile",
"while","with","true","false","listener","window","load","event","timers","url","nav","img","link","page","div","html","main","http"];
var reserveWord = ["aboard","about","above","across","after","against","along","amid","among","anti","around","as","at",
"before","behind","below","beneath","beside","besides","between","beyond","but","by","concerning","considering","despite",
"down","during","except","excepting","excluding","following","for","from","in","inside","into","like","minus","near",
"of","off","on","onto","opposite","outside","over","past","per","plus","regarding","round","save","since","than","through",
"to","toward","towards","under","underneath","unlike","until","up","upon","versus","via","with","within","without","not",
"the","more","get","and"];

var sortOrder = function(x, y) {
	return y.count - x.count
};


function getPage (someUri, callback) {
  request({uri: someUri}, function (error, response, body) {
      console.log("Fetched " +someUri+ " OK!");
      callback(body);
    });
}

var app = express.createServer(function (req, res) {
	requestedUri = url.parse(req.url).pathname;
	requestedUri = requestedUri.substring(1);
	console.log("Got request for " +requestedUri);
	if(requestedUri.match('stylesheets/style.css')){
		//handle css file
		var filePath = './public' + req.url;
		//console.log("Got request for " +filePath);
		fs.readFile(filePath, function(error, content) {
			res.writeHead(200, { 'Content-Type': 'text/css' });
            		res.end(content, 'utf-8');  
		});
	} else if (!requestedUri.match('^http') && !access) {
		//handle invalid url
		res.writeHead(500, {"Content-Type": "text/html"})
		res.write();
		res.end("Invalid url");  	
	} else {
		 
			//handle request to http websites
			request({uri: requestedUri}, function (error, response, body) {
		      	//console.log("Fetched " +someUri+ " OK!");
			var output = [];//sort output
			var hashtable = {};
			var result = this;		
			result.items = new Array();
			jsdom.env({
					html: body,
					scripts: ['http://code.jquery.com/jquery-1.6.min.js']
				}, function(err, window){
			var $ = window.jQuery; 
			var text = $('body').text();

			text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
			//add space between lower case and upper case
	
			text = text.toLowerCase();

			text = text.replace(/[\W]/g, ' ');
			
			//replace non words			
			text = text.replace(/\s{2,}/g, ' ');

			//replace mutispace			
			text = text.replace(/\s+$/g, '');
			
			//replace end space			
			text = text.split(/\s+/);

			//split and save into hashtable if the word length is between 2 and 50			
			//console.log(text); //debug
			for ( var i = 0, textlen = text.length, s; i < textlen; ++i) {
				s = text[i];				  
				if(s.length>2 && s.length <50)
					hashtable[s] = (hashtable[s] || 0) + 1;	
			}
			//set resevered word and keyword in javascript to negative
			for ( var i = 0, len = reserveKey.length, s; i < len; ++i) {
				s = reserveKey[i];
				if(hashtable[s]) hashtable[s]= -1;	
			}
			for ( var i = 0, len = reserveWord.length, s; i < len; ++i) {
				s = reserveWord[i];
				if(hashtable[s]) hashtable[s]= -1;
			}
			//put count >=1 element into array to reduce the number in sorting
			for(var i in hashtable){
				if(hashtable[i]>=1)
					output.push({"key" : i, "count" : hashtable[i]});
			}
			//sort
			output.sort(sortOrder);
	
			//generate result 	
			for ( var i = 0; i < maxNumber; ++i) {
				result.items[i] = {
				    word: output[i].key
				};
			}				
			//console.log(result); //debug	
				
			res.render('bar', {
					title: 'bar',		          
					items: result.items
			       		});
				});   	      
		    	});
    	}
});
app.listen(process.env.PORT||8080);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
