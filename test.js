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

function Trace(msg,arg) {
	
	console.log("U>"+msg);

	if (arg) console.log(arg);
}

require("../enum").test({

	N1: function () {
		
		var TOTEM = require("../totem");

		Trace(
			"Im simply the default Totem interface so Im not running any service", {
			default_fetcher_endpts: TOTEM.reader,
			default_protect_mode: TOTEM.nofaults,
			default_cores_used: TOTEM.cores
		});
	},
	
	N2: function () {
		
		Trace(
`I **will be** a Totem client running in fault protection mode, no database yet, but I am running
with 2 cores and the default endpoint routes` );

		var TOTEM = require("../totem").start({
			nofaults: true,
			cores: 2
		});
		
	},
	
	N3: function () {
		
		var TOTEM = require("../totem").start({
			name: "Totem",
			
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			
			init: function () {				
				Trace(
`I **have become** a Totem client, with no cores, but 
I do have mysql database from which I've derived my start() options from openv.apps.nick = TOTEM.name = "Totem"`, {

					mysql_derived_site_parms: TOTEM.site
				});
			}
		});
		
	},
	
	N4: function () {
		
		var TOTEM = require("../totem").start({
			encrypt: ENV.SERVICE_PASS,
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			reader: {
				dothis: function dothis(req,res) {  //< named handlers are shown in trace in console
					res( "123" );
					
					Trace(		
`PKI-encrypted Totem service, 2 cores, unprotected, with a mysql database, and \n
(dothis,orthis) endpoints.  If the servers client.pfx does not exists, Totem will\n
create the client.pfx and associated pems (public client.crt and private client.key).` , {

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
			},
			
			init: function () {
				Trace(
					"try my **encrypted** (dothis,orthis) endpoints", {
					my_endpoints: TOTEM.reader
				});
			}
		});
		
	},
	
	N5: function () {
		var TOTEM = require("../totem").start({
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
	
			riddles: 10,
			
			init: function () {
				
				Trace(
`I am Totem client, with no cores but I do have mysql database and
I have anti-bot protection!!`, {
					mysql_derived_parms: TOTEM.site
				});
			}
		});
	},
	
	E1: function () {

		var ENGINE = require("../engine");
		var TOTEM = require("../totem");

		Trace( "A default Totem client", {
			a_tau_template: ENGINE.tau("somejob.pdf"),
			engine_errors: ENGINE.error,
			get_endpts: TOTEM.reader,
			my_paths: TOTEM.paths
		});
		
	},
	
	E2: function () {

		var TOTEM = require("../totem");
		
		TOTEM.start({
			
			init: function () {

				Trace( "Totem being powered down" );
				
				TOTEM.stop();
			}
		});

		var ENGINE = require("../engine").config({
			thread: TOTEM.thread
		});

	},
			
	E3: function () {
		
		var TOTEM = require("../totem").start({

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

		Trace( "Starting a trivial Totem with a chipper fetcher and a database" );
	},
	
	E4: function () {
		
		var TOTEM = require("../totem").start({

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
			
		});

		var ENGINE = require("../engine").config({
			thread: TOTEM.thread
		});

		Trace( "Unit test engines with /test?config=cv | py1 | py2 | py3 | js" );

	},
	
	C1: function () {
		
		var CHIPPER = require("../chipper");
		
		var TOTEM = require("../totem").start({
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
			},
			
			init: function () {

				Trace( "Test my default endpoints", {
					my_readers: TOTEM.reader
				});
			}
		});
		
		CHIPPER.config({
			thread: TOTEM.thread
		});

	},
	
	D1: function () {
		
		var TOTEM = require("../debe").start({
			//encrypt: ENV.SERVICE_PASS,
			
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			
			init: function () {

				Trace( "Encrypted Totem client with a database" );
				//debe_mysql:TOTEM.mysql,
				//debe_site: TOTEM.site
				
			}
			
		});
			
	},
	
	D2: function () {
		
		var TOTEM = require("../debe").start({
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

			},				
			
			init: function () {

				Trace( "Unencrypted dev-Totem client with a database and wfs endpoint" );
				
			}
			
		});
			
	}
	
	
});	

// UNCLASSIFIED
