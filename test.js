// UNCLASSIFIED
/**
 * Test/run a Totem configuration CONFIG using 
 * 
 * 		. maint.sh CONFIG			# with new environment variables
 * 		node test.js CONFIG			# with current environment variables
 *		forever start test.js CONFIG  # keep it up forever and ever
 *
 * A null CONFIG will return a list of available configurations.
 * */

var ENV = process.env;

var ENUM = require("enum");

ENUM.test({

	N1: function () {
		
		var TOTEM = require("../totem");

		Trace(
			"Im simply a Totem interface so Im not running any service", {
			default_fetcher_endpts: TOTEM.reader,
			default_protect_mode: TOTEM.nofaults,
			default_cores_used: TOTEM.cores
		});
	},
	
	N2: function () {
		
		Trace(
`I **will become** a Totem client running in fault protection mode, no database yet, but I am running
with 2 cores and the default endpoint routes` );

		var TOTEM = require("../totem").config({
			nofaults: true,
			cores: 2
		}, function (err) {
			Trace(err || "Ok - Im started and ready to rock!");
		});
		
	},
	
	N3: function () {
		
		var TOTEM = require("../totem").config({
			name: "Totem",
			
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			}
		},  function (err) {				
			Trace( err ||
`I **have become** a Totem client, with no cores, but 
I do have mysql database from which I've derived my start() 
options from openv.apps.nick = TOTEM.name = "Totem"`, {

				mysql_derived_site_parms: TOTEM.site
			});
		});
		
	},
	
	N4: function () {
		
		var TOTEM = require("../totem").config({
			encrypt: ENV.SERVICE_PASS,
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			reader: {
				dothis: function dothis(req,res) {  //< named handlers are shown in trace in console
					res( "123" );
					
					Trace({
						do_query: req.query
					});
				},

				orthis: function orthis(req,res) {
					
					if (req.query.x)
						res( [{x:req.query.x+1,y:req.query.x+2}] );
					else
						res( new Error("We have a problem huston") );
						
					Trace(
`Like dothis, but needs an ?x=value query`, {
						or_query: req.query,
						or_user: [req.client,req.group]
					});
				}
			}
		}, function (err) {
			Trace( err || 
`Now stronger and **encrypted** -- try my https /dothis and /orthis endpoints.
Ive only requested 1 core, and Im unprotected, with a mysql database.  
If my client.pfx does not already exists, Totem will create the client.pfx 
and associated pems (public client.crt and private client.key).` , {
				my_endpoints: TOTEM.reader
			});
		});
		
	},
	
	N5: function () {
		var TOTEM = require("../totem").config({
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
	
			riddles: 10
		}, function (err) {
			Trace( err ||
`I am Totem client, with no cores but I do have mysql database and
I have an anti-bot shield!!`, {
				mysql_derived_parms: TOTEM.site
			});
		});
	},
	
	E1: function () {

		var ENGINE = require("../engine");
		var TOTEM = require("../totem");

		Trace( "A Totem+Engine client has been created", {
			a_tau_template: ENGINE.tau("somejob.pdf"),
			engine_errors: ENGINE.error,
			get_endpts: TOTEM.reader,
			my_paths: TOTEM.paths
		});
		
	},
	
	E2: function () {

		var TOTEM = require("../totem");
		
		TOTEM.config({}, function (err) {
			Trace( err || "Started but I will now power down" );
			TOTEM.stop();
		});

		var ENGINE = require("../engine").config({
			thread: TOTEM.thread
		});

	},
			
	E3: function () {

		var TOTEM = require("../totem").config({
			"reader.": {
				chipper: function Chipper(req,res) {				
					res( 123 );
				}
			},
			
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			}
			
		});

		var ENGINE = require("../engine").config({
			thread: TOTEM.thread
		});
	},
	
	E4: function () {
		
		var TOTEM = require("../totem").config({
			"reader.": {
				test: function Chipper(req,res) {
					
					var itau = [ENGINE.tau()];
					var otau = [ENGINE.tau()];

					switch (req.query.config) {
						case "cv": // program and step haar opencv machine 
							parm =	{
								tau: [], 
								ports: {
									frame:	 {},
									helipads: {scale:0.05,dim:100,delta:0.1,hits:10,cascade:["c1/cascade"]},
									faces:	 {scale:0.05,dim:100,delta:0.1,hits:10,cascade:["haarcascade_frontalface_alt","haarcascade_eye_tree_eyeglasses"]}
							}};

							itau[0].job = "test.jpg";
							console.log(parm);

							for (var n=0,N=1;n<N;n++)  // program N>1 to test reprogram
								console.log(`INIT[${n}] = `, ENGINE.opencv("opencv.Me.Thread1","setup",parm));

							for (var n=0,N=5;n<N;n++) // step N>1 to test multistep
								console.log(`STEP[${n}] = `, ENGINE.opencv("opencv.Me.Thread1","frame",itau));

							// returns badStep if the cascades were undefined at the program step
							console.log("STEP = ", ENGINE.opencv("opencv.Me.Thread1","helipads",otau));
							console.log(otau);
							break;

						// python machines fail with "cant find forkpty" if "import cv2" attempted

						case "py1": // program python machine
							parm =	{ 
								tau:	[{job:"redefine on run"}],
								ports: {	
							}};
							pgm = `
print 'Look mom - Im running python!'
print tau
tau = [{'x':[11,12],'y':[21,22]}]
`;

							// By default python attempts to connect to mysql.  
							// So, if mysql service not running or mysql.connector module not found, this will not run.
							console.log({py:pgm, ctx: parm});
							console.log("INIT = ", ENGINE.python("py1.thread",pgm,parm));
							console.log(parm.tau);
							break;

						case "py2": // program and step python machine 
							parm =	{ 
								tau:	[{job:"redefine on run"}],
								ports: { 	
									frame:	 {},
									helipads:{scale:1.01,dim:100,delta:0.1,hits:10,cascade:["c1/cascade"]},
									faces:	 {scale:1.01,dim:100,delta:0.1,hits:10,cascade:["haarcascade_frontalface_alt","haarcascade_eye_tree_eyeglasses"]}
							}};

							itau[0].job = "test.jpg";
							pgm = `
print 'Look mom - Im running python!'
def frame(tau,parms):
	print parms
	return -101
def helipads(tau,parms):
	print parms
	return -102
def faces(tau,parms):
	print parms
	return -103
`;		
							console.log({py:pgm, ctx: parm});
							console.log("INIT = ", ENGINE.python("py2.Me.Thread1",pgm,parm));
							// reprogramming ignored
							//console.log("INIT = ", ENGINE.python("py2.Me.Thread1",pgm,parm));

							for (var n=0,N=1; n<N; n++)
								console.log(`STEP[${n}] = `, ENGINE.python("py2.Me.Thread1","frame",itau));

							console.log("STEP = ", ENGINE.python("py2.Me.Thread1","helipads",otau));
							break;

						case "py3": // program and step python machine string with reinit along the way
							parm =	{ 
								tau:	[{job:"redefine on run"}],
								ports: {	
									frame:	 {},
									helipads:{scale:1.01,dim:100,delta:0.1,hits:10,cascade:["c1/cascade"]},
									faces:	 {scale:1.01,dim:100,delta:0.1,hits:10,cascade:["haarcascade_frontalface_alt","haarcascade_eye_tree_eyeglasses"]}
							}};

							itau[0].job = "test.jpg";
							pgm = `
print 'Look mom - Im running python!'
def frame(tau,parms):
	print parms
	return -101
def helipads(tau,parms):
	print parms
	return -102
def faces(tau,parms):
	print parms
	return -103
`;

							console.log({py:pgm, ctx: parm});
							console.log("INIT = ", ENGINE.python("py3",pgm,parm));
							console.log("STEP = ", ENGINE.python("py3","frame",itau));
							// reprogramming ignored
							//console.log("REINIT = ", ENGINE.python("py3",pgm,parm));
							//console.log("STEP = ", ENGINE.python("py3","frame",itau));
							console.log(otau);
							break;

						case "js": // program and step a js machine string
							parm =	{ 
								ports: {	
									frame:	 {},
									helipads:{scale:1.01,dim:100,delta:0.1,hits:10,cascade:["c1/cascade"]},
									faces:	 {scale:1.01,dim:100,delta:0.1,hits:10,cascade:["haarcascade_frontalface_alt","haarcascade_eye_tree_eyeglasses"]}
							}};

							itau[0].job = "test.jpg";
							pgm = `
CON.log('Look mom - Im running javascript!');
function frame(tau,parms) { 
	CON.log("here I come to save the day");
	tau[0].xyz=123; 
	return 0; 
}
function helipads(tau,parms) { 
	tau[0].results=666; 
	return 101; 
}
function faces(tau,parms) { return 102; }
`;

							console.log({py:pgm, ctx: parm});
							console.log("INIT = ", ENGINE.js("mytest",pgm,parm));
							// frame should return a 0 = null noerror
							console.log("STEP = ", ENGINE.js("mytest","frame",itau));
							console.log(itau);
							// helipads should return a 101 = badload error
							console.log("STEP = ", ENGINE.js("mytest","helipads",otau));
							console.log(otau);
							break;	
					}
					
					res( "thanks!" );
				}
			},
			
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			}
			
		}, function (err) {
			Trace( "Unit test my engines with /test?config=cv | py1 | py2 | py3 | js" );
		});

		var ENGINE = require("../engine").config({
			thread: TOTEM.thread
		});

	},
	
	C1: function () {
		
		var CHIPPER = require("../chipper");
		
		var TOTEM = require("../totem").config({
			"reader.": {
				chip: CHIPPER.chippers,

				wfs: function (req,res) {
					res("here i go again");
					
					TOTEM.fetchers.http(ENV.WFS_TEST, function (data) {
						console.log(data);
					});
					
				}

			},				
			
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			}
		}, function (err) {
			Trace( err || "Go ahead and test my default /chip and /wfs endpoints", {
				my_readers: TOTEM.reader
			});
		});
		
		CHIPPER.config({
			thread: TOTEM.thread
		});

	},
	
	D1: function () {

		var DEBE = require("../debe").config({
			name: ENV.SERVICE_NAME,
			encrypt: ENV.SERVICE_PASS,
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			watch: {
				"./uploads": function (file) {
				}
			}
			
		}, function (err) {
			Trace( err || "Yowzers - An encrypted DEBE service with a database watching files in uploads area" );
		});

	},
	
	D2: function () {
		
		var DEBE = require("../debe").config({
			encrypt: ENV.SERVICE_PASS,
			riddles: 10,
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			"reader.": {
				wfs: function (req,res) {
					res("here i go again");
					
					TOTEM.fetchers.http(ENV.WFS_TEST, function (data) {
						console.log(data);
					});
				}

			}
		}, function (err) {
			Trace( "This bad boy in an encrypted service with a database and has an /wfs endpoint" );
		});
			
	}
	
});	

function Trace(msg,arg) {
	ENUM.trace("U>",msg,arg);	
}

// UNCLASSIFIED
