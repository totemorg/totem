// UNCLASSIFIED 

/**
 * nodejs:
 * @module totem
 * @requires http
 * @requires https
 * @requires fs
 * @requires constants
 * @requires clusters
 * @requires child-process
 * totem:
 * @requires mime
 * @requires enum
 * @requires dsvar
 * 3rd party:
 * @requires socket.io
 * @requires socket.io-clusterhub
 * @requires mysql
 * @requires xml2js
 * @requires toobusy
 * @requires json2csv
 * @requires js2xmlparser
 * @include README.md
 */

var												// NodeJS modules
	HTTP = require("http"),						//< NodeJs module
	HTTPS = require("https"),					//< NodeJs module
	CP = require("child_process"),				//< NodeJs module
	FS = require("fs"),							//< NodeJs module
	CONS = require("constants"),				//< NodeJs module
	CLUSTER = require("cluster"),				//< NodeJs module
	URL = require("url");						//< NodeJs module

var 											// 3rd party modules
	SIO = require('socket.io')					//< Socket.io client mesh
	SIOHUB = require('socket.io-clusterhub'),	//< Socket.io client mesh for multicore app
	MYSQL = require("mysql"),					//< mysql conector
	XML2JS = require("xml2js"),					//< xml to json parser (*)
	BUSY = null, //require('toobusy'),  		//< denial-of-service protector (cant install on NodeJS 5.x)
	JS2XML = require('js2xmlparser'), 			//< JSON to XML parser
	JS2CSV = require('json2csv'); 				//< JSON to CSV parser	
	
var 											// Totem modules
	DSVAR = require("dsvar"),				//< DSVAR database agnosticator
	MIME = require("mime"),						//< MIME content types
	ENUM = require("enum"); 					//< Basic enumerators

var 											// shortcuts
	Copy = ENUM.copy,
	Each = ENUM.each;

var 											// globals
	MAXFILES = 100;						//< max files to index
	
var
	TOTEM = module.exports = ENUM.extend({

	IO: null, 			//< reserved for socket.io

	Array: [ 			//< Array prototypes
		function joinify(cb) {
			
			var rtn = [];

			for (var n=0, N=this.length; n<N; n++) 
				rtn.push( cb ? cb(this[n]) : this[n] );
				
			return rtn.join(",");
		},
							
		function treeify(idx,kids,level,piv,wt) {
			
			if (!wt) 
				return this.treeify(0,recs.length,0,idx,"size");

			var recs = this;
			var key = piv[level];
			var levels = piv.length-1;
			var ref = recs[idx][key];
			var len = 0;
			var pos = idx, end = idx+kids;
			var tar = [];
			
			if (level<levels)
				while (pos<end) {
					var rec = recs[idx];
					var stop = (idx==end) ? true : (rec[key] != ref);
					
					if ( stop ) {
						//console.log([pos,idx,end,key,ref,recs.length]);
						//console.log(rec);
						
						var node = {
							name: key+":"+ref, 
							weight: len, //wt ? parseInt(rec[wt] || "0") : 0,
							children: recs.treeify(pos,len,level+1,piv,wt)
						};

						tar.push( node );
						pos = idx;
						len = 0;
						ref = (idx==end) ? null : recs[idx][key];
					}
					else {
						idx++;
						len++;
					}
				}
			else
				while (pos < end) {
					var rec = recs[pos++];
					tar.push({
						name: key+":"+rec[key], 
						weight: wt ? parseInt(rec[wt] || "1") : 1,
						doc: rec
					});
				}
				
			return tar;
		}
	
	],

	String: [ 			//< String prototypes
		function each(pat, rtn, cb) {
			
			var msg = this;
			
			while ( (idx = msg.indexOf(pat) ) >=0 ) {
				
				msg = msg.substr(0,idx) + cb(rtn) + msg.substr(idx+pat.length);
				
			}

			return msg;
		},

		function format(req,plugin) {
			
			/**
			 * @method Format
			 * 
			 * Format a string S containing ${X.key} tags.  The String wrapper for this
			 * method extends X with optional plugins like X.F = {fn: function (X){}, ...}.
			 * */
			function Format(X,S) {

			try {
				var rtn = eval("`" + S + "`");
				return rtn;
			}
			catch (err) {
				return "[bad]";
			}

		}
			
			req.plugin = req.F = plugin || {};
			return Format(req,this);
		},
	
		function parse(def) {
			
			var rtn = def;
			
			if (this)
				try {
					return JSON.parse(this);
				}
				catch (err) {

					if (!def) return null;

					var parms = (def.constructor == Function) 
							? def(this) 
							: this.split("&");

					parms.each(function (n,parm) {

						var	parts = parm.split("="),
							rhs = parts.pop(),
							lhs = parts.pop();

						if (lhs)
							try { 
								rtn[lhs] = JSON.parse(rhs); 
							}
							catch (err) { 
								rtn[lhs] = rhs;
							}
						else
								rtn[rhs] = null;
					});

					return rtn;
				}
		
			else
				return rtn;
			
		},
		
		function xmlParse(def, cb) {
			XML2JS.parseString(this, function (err,json) {				
				cb( err ? def : json );
			});
		},
						
		function tag(el,at) {
		
			if (el.constructor == String) {
				var rtn = "<"+el+" ";
				
				if (at)  
					for (var n in at) rtn += n + "='" + at[n] + "' ";
				
				switch (el) {
					case "embed":
					case "img":
					case "link":
						return rtn+">" + this;
					default:
						return rtn+">" + this + "</"+el+">";
				}
				//return rtn+">" + this + "</"+el+">";
			}
			else {
				var rtn = this;

				for (var n in el) rtn += "&" + n + "=" + el[n];
				return rtn;
			}
				
		}
	],
	
	/**
	 * @method start
	 * Configure and start the service
	 * */
	start: startServer,	
	
	/**
	 * @method stop
	 * Stop the service
	 * */
	stop: stopServer,
	
	/**
	 * @param jsons
	 * Site parms requiring json conversion when loaded
	 * */
	jsons: {  
	},
	
	/**
	 * @method thread
	 * Thread a new sql connection to a callback.
	 * */
	thread: DSVAR.thread,
		
	/**
	 * @param TO
	 * Time-Out values (reserved - not presently used)
	 * */
	TO : {							//< Time-outs in msecs
		COOKIE : 900000, 			//< Browser cookie 
		SESSION : 54000000,			//< Session  (legacy)
		SQLDB : 10000,				//< SQL query connection 
		ENGINE : 60000, 			//< Machine query connection 
		SOCKET : 120000,			//< Socket 
		LOCK : 30000 				//< Temporaray record lock 
	},
	
	/**
	 * @param crud 
	 * REST-to-CRUD translations
	 * */
	crud: {
		GET: "select",
		DELETE: "delete",
		POST: "insert",
		PUT: "update"
	},
	
	/**
	 * @param reqflags
	 * Options to parse request _flags
	 * */
	reqflags: {				//< Properties for request flags
		strips:	 			//< Flags to strips from request
			{"":1, "_":1, leaf:1, _dc:1, id:1, "=":1, "?":1, "request":1}, 		

		traps: {   			//< Traps to redefine flags
		},
		
		jsons: {  			///< Convert from json
		},
		
		lists: { 			 //< Convert from list
			encap: function encap(idx,recs) {
				var encap = {};
				encap[idx] = recs;
				return encap;
			},
			
			json: function json(idx,recs) {
				recs.each( function (n,rec) {
					idx.each( function (i,n) {
						try {
							rec[n] = (rec[n]||"").parse({});
						}
						catch (err) {
						}
					});
				});
				return recs;
			},
			
			xindex: function index(idx,recs) {
				var group = idx[2],
					x = idx[0],
					y = idx[1];
				
				if (group) {
					var rtn = {};
					recs.each( function (n,rec) {
						var xy = rtn[rec[group]];
						if (!xy) xy = rtn[rec[group]] = [];
						xy.push([rec[x], rec[y]]);
					});
				}
				else {
					var rtn = {group: []}, xy = rtn.group;
					recs.each( function (n,rec) {
						if (!xy) xy = rtn[rec[group]] = [];
						xy.push([rec[x], rec[y]]);
					});
				}
				
				return [rtn];
			},
				
			tree: function tree(idx,recs) {
				return recs.treeify(idx);
			}
		},
		
		id: "ID", 					//< SQL record id
		prefix: "_",				//< Prefix that indicates a field is a flag
		trace: "" 					//< Echo flags before and after parse		
	},

	/**
	 * @param fetchers
	 * Data fetcher X is used when a GET on X is
	 * requested.  These fetchers feed data pulled from the
	 * TOTEM.paths.url[req.table] URL to its callback.
	 * */
	fetchers: { 			//< data fetchers
		curl: curlFetch,
		wget: wgetFetch,
		http: httpFetch,
		plugin: {			//< example fetch url plugins
			ex1: function (req) {
				return req.profile.QoS + req.profile.Credit;
			},
			ex2: "save.file.jpg",
			wgetout: "wget.out"
		}
	},

	/**
	 * @param url
	 * Derived urls for this service
	 * */
	url: {					//< default urls for this service
		master: "nourl",
		worker: "nourl"
	},
	
	mysql: null,			//< mysql opts: {host,user,pass,flakey,sessions}
	encrypt: "",			//< https cofig passphrase
	cores: 0,				//< number of worker cores
	port: 8080,				//< service port
	host: "localhost", 		//< service host name
	proxy: false,			//< enable if https server being proxied

	name: "Totem",	
		//< service name to:
		// derive site parms from mysql openv.apps by Nick=name
		// set mysql name.table for guest clients,
		// identify server cert name.pfx file.

	site: { 				//< initial site context extened with mysql openv.apps
	},
	trust: [				//< https service trust store built from all *.crt files
	],
	server: null,			//< defined when service started
	
	// CRUDE interface
	select: dataSelect,		//< endpoints(request hash, response callback)
	update: null,
	delete: null,
	insert: null,
	execute: null,
	
	started: new Date(), 	//< totem start time
	retries: 5,				//< max number of fetch retries
	notify: true, 			//< notify every fetch
	
	nofaults: false,		//< service protection mode
	protect: {				//< service protections when in nofaults mode
		SIGUSR1:1,
		SIGTERM:1,
		SIGINT:1,
		SIGPIPE:1,
		SIGHUP:1,
		SIGBREAK:1,
		SIGWINCH:1,
		SIGKILL:1,
		SIGSTOP:1
	},	
	
	validator: null,		//< additional session validator
	
	admit: null, 			//< null to admit all clients
		/*{ "u.s. government": "required",
		  	"us": "optional"
		  }*/

	guest: {				//< default guest profile 
		Banned: "",
		QoS: 1,
		Credit: 100,
		Charge: 0,
		LikeUs: 0,
		Challenge: 1,
		Client: "guest",
		User: "guest",
		Group: "app1",
		Message: "Welcome guest - what is (riddle)?"
	},

	map: { 					//< riddle digit-to-jpeg map (null to disable riddles)
		0: ["10","210"],
		1: ["30","60"],
		2: ["50","160"],
		3: ["70","100"],
		4: ["20","90"],
		5: ["00","110"],
		6: ["130","180"],
		7: ["150","290"],
		8: ["170","310"],
		9: ["40","190"]
	},

	riddles: 0, 			//< number of riddles to protect site (0 to disable anti-bot)
	
	paths: { 				//< default paths to service files
		render: "public/jade/",
		
		default: "home.view",
		
		url: {
			//fetch: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			//default: "/home",
			//resetpass: "/resetpass",
			wget: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			curl: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			http: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			socketio: "/socket.io/socket.io.js"
		},
			
		certs: { 
			truststore: "certs/truststore/",
			server: "certs/"
		},
		
		mysql: {
			users: "SELECT client FROM ??.dblogs GROUP BY client",
			derive: "SELECT * FROM openv.apps WHERE ?",
			record: "INSERT INTO dblogs SET ?",
			engine: "SELECT *,count(ID) as Count FROM engines WHERE least(?,1)",
			search: "SELECT * FROM files HAVING Score > 0.1",
			credit: "SELECT * FROM files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 0,1",
			socket: "REPLACE sockets SET ?",
			session: "INSERT INTO sessions SET ?",
			guest: "SELECT * FROM openv.profiles WHERE Client='guest' LIMIT 0,1",
			pocs: "SELECT * FROM openv.POCs WHERE ?",
			distros: "SELECT Role,group_concat(DISTINCT openv.Address) AS Distro FROM openv.POCs WHERE ? GROUP BY Role" 
		},
		
		mime: {
			files: ".",
			captcha: ".",
			index: {
				files: "indexer"
			}
		}
	},

	errors: {
		pretty: function (err) { 
			return (err+"");
		},
		noRoute: new Error("no route"),
		invalidQuery: new Error("invalid query"),
		badGroup: new Error("invalid group requested"),
		lostConnection: new Error("client connection lost"),
		noDB: new Error("database not configured"),
		failedUser: new Error("failed modification of user profile"),
		missingPass: new Error("missing initial user password"),
		expiredCert: new Error("cert expired"),
		rejectedCert: new Error("cert rejected"),
		tooBusy: new Error("too busy - try again later")
	},

	indexer: Indexer,		//< default file indexer
	uploader: Uploader,		//< default file saver
	
	busy: 3000,				//< server toobusy check period in milliseconds
	
	// CRUDE extensions

	reader: {				//< by-type file readers/indexers/fetchers
		user: fetchUser,
		wget: fetchWget,
		curl: fetchCurl,
		http: fetchHttp,
		test: fetchTest
	},
	
	worker: {				//< by-action engine runner
	},

	sender: {				//< by-area file senders
	},
	
	emulator: {				//< by-action-table virtual table emulators
		select: {},
		delete: {},
		update: {},
		insert: {},
		execute: {}
	},
	
	sendFile: sendFile,
	
	setContext: function (sql,cb) { 
		var site = TOTEM.site,
			mysql = TOTEM.paths.mysql;
		
		site.pocs = [];
		site.distro = {};

		/*
		if (TOTEM.jsons)
			sql.query("SELECT * FROM openv.apps WHERE ?",{Name:TOTEM.name})
			.on("result", function (opts) {
				Each( TOTEM.jsons, function (n,def) {
					//Trace(`${n}=${site[n]}`)
					site[n.toLowerCase()] = (opts[n]||"").parse(def);
				});
			});*/

		if (pocs = mysql.pocs) 
			sql.query(pocs,{Site:TOTEM.name})
			.on("result", function (poc) {
				site.pocs.push(poc);
			});
				
		if (distros = mysql.distros) 
			sql.query(distros, {Site:TOTEM.name})
			.on("result", function (poc) {
				var role = poc.Role.toLowerCase().split(",")[0];
				
				site.distro[role] = poc.Distro;
				
				if (site.get)
					site.get[role] = function (where,idx) {
						return site.get(site.pocs,where,idx);
					};
				
			});
		
		if (guest = mysql.guest)
			sql.query(guest)
			.on("result", function (rec) {
				TOTEM.guest = Copy(rec,{});
			});

		if (derive = mysql.derive)
			sql.query(derive, {Nick:TOTEM.name})
			.on("result", function (opts) {
				
				Each(opts, function (key,val) {
					key = key.toLowerCase();

					if (key in TOTEM.jsons)
						site[key] = (val+"").parse(TOTEM.jsons[key]);
					else
						site[key] = val;

					if (key in TOTEM) 
						TOTEM[key] = val;
				});
				
				if (cb) cb();

				if (users = mysql.users) 
					sql.query(users, [site.db], function (err,users) {
						site.distro.user = users.joinify( function (user) {
							return user.client.tag("a",{href:"emailto:"+user.client});
						});
					});

			})
			.on("error", function (err) {
				Trace( "CANT DERIVE "+err );
			});
 
		else 
		if (cb) cb();
					
	},

	cache: { 				//< by-area cache
		
		never: {	//< useful while debugging client side stuff
			"base.js": 1,
			"grids.js": 1,
			"guides.js": 1,
			"jquery.js":1,
			"models.js":1,
			"jade": 1,
			"view": 1
		},
		
		clients: {
			js: {},
			css: {},
			ico: {}
		},
		
		"socket.io": {
			js: {}
		},
		
		certs: {} 		// reserved for client sessions
	},
	
	Function: Initialize,
	
	user: {					//< crude interface to user profiles
		select: selectUser,
		delete: deleteUser,
		update: updateUser,
		insert: insertUser
	}
		
});

//============================================
// Default CRUDE interface

function dataSelect(req,res) {	//< Default virtual table logic is real table
	req.sql.query("SELECT * FROM ??", req.table, function (err,data) {
		res(err || data);
	});
}
function dataUpdate(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}
function dataInsert(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}
function dataDelete(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}
function dataExecute(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}

//============================================
// Server methods

/**
 * @method startServer
 * 
 * Start this server with the desired options.
 * */
function startServer(opts) {

	TOTEM.extend(opts);
	
	var
		name  = TOTEM.name,
		mysql = TOTEM.mysql,
		paths = TOTEM.paths,
		site = TOTEM.site,
		cb = null; //additional Initialize;

	Trace(`STARTING ${name}`); 
	
	if (TOTEM.jsons)
		Each( TOTEM.jsons, function (n,def) {
			site[n] = def;
		});
	
	if (mysql) {

		//mysql.pool = MYSQL.createPool(mysql.opts);

		DSVAR.config({
			emit: TOTEM.IO ? TOTEM.IO.sockets.emit : null,

			mysql: Copy( { 
					opts: {
						host: mysql.host,
						user: mysql.user,
						password : mysql.pass,				// passphrase
						connectionLimit : mysql.sessions || 100, 		// max simultaneous connections
						//acquireTimeout : 10000, 			// connection acquire timer
						queueLimit: 0,  						// max concections to queue (0=unlimited)
						waitForConnections: true			// allow connection requests to be queued
					}
				}, mysql)
		});
		
		for (var n in mysql)
			if (n in paths) paths[n] = mysql[n];
		
		if (name && mysql)	// derive server and site parameters
			sqlThread( function (sql) {
				
				TOTEM.setContext(sql, function () {
					setupServer(cb);
				});

				sql.release();
			});	
		
		else
			setupServer(cb);
	}
	else
		setupServer(cb);

	return TOTEM;
}

/**
 * @method initServer
 * 
 * Attach the responder to this server then initialized.
 * */
function initServer(server,cb) {
	
	var name = TOTEM.name,
		site = TOTEM.site,
		paths = TOTEM.paths;
	
	Trace(`INITIALIZING ${name}`);
	
	TOTEM.server = server || { 	// define server
		listen: function () {
			Trace("NO SERVER");
		},
		on: function () {
			Trace("NO SERVER");
		}
	};
	
	if (server && name) 			// attach responder
		server.on("request", Responder);
	else
		Trace("NO SERVER");

	TOTEM.flush();  		// init of geoclient callstack via Function key

	if (TOTEM.init)  		// client init
		TOTEM.init(); 
	
	if (TOTEM.encrypt && paths.url.socketio) { 

		// Attach "/socket.io" to SIO and block same path from server
		var IO = TOTEM.IO = SIO(server, { // we want to use the defaults
				//serveClient: true, // default true to prevent server from intercepting path
				//path: "/socket.io" // default get-url that the client-side connect issues on calling io()
			}),
			HUBIO = TOTEM.HUBIO = new (SIOHUB); 		//< Hub fixes socket.io+cluster bug	
			
		Trace("ATTACHING socket.io AT "+IO.path());
		
		if (IO) { 							// Setup client web-socket support

			IO.on("connection", function (socket) {  // Trap every connect
				
				//Trace(">CONNECTING socket.io CLIENT");
				socket.on("select", function (req) { 		// Trap select (join request) connects
					
					Trace(`>Connecting ${req.client} ${req.message}`);
					
					sqlThread( function (sql) {
						//Trace("Socket opened");
						
						sql.query("SELECT * FROM ?? WHERE least(?) LIMIT 0,1", [
							"openv.profiles", {Client:req.client, Challenge:1}
						])
						.on("result", function (Prof) {

							sql.query("REPLACE INTO ?? SET ?", [
								Prof.Group+".sockets", {
								client: req.client,
								org: Prof.Group,
								location: req.location,
								joined: new Date(),
								message: Prof.msg
							}])
							.on("end", function () {
								//Trace("socket closed");
								sql.release();
							});

							challengeClient(req.client,Prof);
							
						})
						.on("end", sql.release);
					});
				});
			});	

			IO.on("disconnection", function (socket) {
				Trace(">>Disconnecting socket.io client");
			});	

		}
		else
			Trace("SOCKET.IO FAILED");
	
	}

	// The BUSY interface provides a mean to limit client connections that would lock the 
	// service (down deep in the tcp/icmp layer).  Busy thus helps to thwart denial of 
	// service attacks.  (Alas latest versions do not compile in latest NodeJS.)
	
	if (BUSY && TOTEM.busy) 
		BUSY.maxLag(TOTEM.busy);
	
	// derive urls to access master and worker clients
	
	TOTEM.url = {
		master: (TOTEM.encrypt ? "https" : "http") + "://" + TOTEM.host + ":" + (TOTEM.cores ? TOTEM.port+1 : TOTEM.port) + "/",
		worker: (TOTEM.encrypt ? "https" : "http") + "://" + TOTEM.host + ":" + TOTEM.port + "/"
	};
	
	if ( !TOTEM.server )  // no need to listen or initialize if router disabled
		return ;
	
	// listening on-routes message

	var endpts = [];	
	for (var n in TOTEM.select || {}) endpts.push(n);
	endpts = "["+endpts.join()+"]";

	if (TOTEM.cores) 					// Establish cores, master and workers
		if (CLUSTER.isMaster) {			// Establish master
			
			if (server)
				server.listen(TOTEM.port+1, function() {  // Establish master
					Trace(`SERVING ${TOTEM.url.master} AT [${endpts}]`);
					if (cb) cb();

				});
			
			else
			if (cb) cb();
			
			if (TOTEM.nofaults) {
				process.on("uncaughtException", function (err) {
					console.warn(`SERVICE FAULTED ${err}`);
				});
				
				process.on("exit", function (code) {
					console.warn(`SERVICE EXITED ${code}`);
				});

				for (var n in TOTEM.nofaults)
					process.on(n, function () {
						console.warn(`SERVICE SIGNALED ${n}`);
					});
			}

			CLUSTER.on('exit', function(worker, code, signal) {
				console.error(`CORE${worker.id} TERMINATED ${code||"ok"}`);
			});

			CLUSTER.on('online', function(worker) {
				console.info(`CORE${worker.id} CONNECTED`);
			});
			
			for (var core = 0; core < TOTEM.cores; core++) {  
				var worker = CLUSTER.fork(); 
				console.info(`CORE${worker.id} FORKED`);
			}
		}
		else {							// Establish core worker
			
			if (server)
				server.listen(TOTEM.port, function() {
					Trace(`CORE${CLUSTER.worker.id} ROUTING ${TOTEM.url.worker} AT ${endpts}`);
					if (cb) cb(TOTEM);
				});
			
			else
			if (cb) cb(TOTEM);
			
			if (TOTEM.nofaults)
				CLUSTER.worker.process.on("uncaughtException", function (err) {
					console.warn(`CORE${CLUSTER.worker.id} FAULTED ${err}`);
				});	
				
		}
	else 								// Establish worker
	if (server) 
		server.listen(TOTEM.port, function() {
			Trace(`SERVING ${TOTEM.url.master} AT ${endpts}`);
			if (cb) cb();
		});
	else
	if (cb) cb();
			
}
		
/**
 * @method connectServer
 * 
 * If the TOTEM server already connected, inherit the server; otherwise
 * define an the apprpriate http interface (https if encrypted, 
 * http if unencrypted), then start the server.
 * */
function connectServer(cb) {
	
	var 
		port = TOTEM.port,
		name = TOTEM.name,
		certs = TOTEM.paths.certs;
	
	Trace((TOTEM.encrypt?"ENCRYPTED":"UNENCRYPTED")+` CONNECTION ${name} ON PORT ${port}`);

	if (TOTEM.encrypt) {
		try {
			Each( FS.readdirSync(certs.truststore), function (n,file) {
				if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
					Trace("TRUSTING "+file);
					TOTEM.trust.push( FS.readFileSync(`${certs.truststore}${file}`,"utf-8") );
				}
			});
		}
		catch (err) {
		}

		if (port)
			initServer( HTTPS.createServer({
				passphrase: TOTEM.encrypt,		// passphrase for pfx
				pfx: FS.readFileSync(`${certs.server}${name}.pfx`),			// TOTEM.paths's pfx/p12 encoded crt+key TOTEM.paths
				ca: TOTEM.trust,				// list of TOTEM.paths authorities (trusted serrver.trust)
				crl: [],						// pki revocation list
				requestCert: true,
				rejectUnauthorized: true
				//secureProtocol: CONS.SSL_OP_NO_TLSv1_2
			}) , cb );

		else 
			initServer( null, cb );
	}
	
	else
	if (port)
		initServer( HTTP.createServer(), cb );
	
	else 
		initServer( null, cb );
	
}

/**
 * @method setupServer
 * 
 * Create the server's PKI certs (if they dont exist), then setup
 * its master-worker urls and callback the service initializer.
 * */
function setupServer(cb) {
	
	var 
		encrypt = TOTEM.encrypt,
		name = TOTEM.name,
		certs = TOTEM.paths.certs;

	Trace(`SETTINGUP ${name}`);
	
	TOTEM.cache.certs = {		// cache data fetching certs 
		pfx: "", //FS.readFileSync(`${certs.server}fetch.pfx`),
		crt: `${certs.server}fetch.crt`,
		key: `${certs.server}fetch.key`
	};
	
	if (encrypt)   // derive a pfx cert if this is an encrypted service
		FS.access(`${certs.server}${name}.pfx`, FS.F_OK, function (err) {

			if (err) {
				var owner = TOTEM.name;
				Trace(`CREATING SERVER CERTIFICATE FOR ${owner}`);
			
				createCert(owner,encrypt,function () {
					connectServer(cb);
				});				
			}
				
			else
				connectServer(cb);

		});
	else 
		connectServer(cb);
}

/**
 * @method stopServer
 * 
 * Stop the server.
 * */
function stopServer() {
		
	var server = TOTEM.server;
			
	if (server)
		server.close(function () {
			Trace("STOPPED");
		});
}

//============================================
// CRUDE routes for user maintenace

function selectUser(req,res) {
	
	var sql = req.sql, query = req.query || 1, isHawk = req.cert.isHawk;
			
	isHawk = 1;
	if (isHawk)
		// sql.context({users:{table:"openv.profiles",where:query,rec:res}})
		var q= sql.query(
			"SELECT * FROM openv.profiles WHERE least(?,1)", 
			[ query ], 
			function (err,users) {
				Trace(q.sql);

				res( err || users );
		});

	else
		// sql.context({users:{table:"openv.profiles",where:[{client:req.client},query],rec:res}})
		sql.query(
			"SELECT * FROM openv.profiles WHERE ? AND least(?,1)", 
			[ {client:req.client}, req.query ], 
			function (err,users) {
				res( err || users );
		});
}

function updateUser(req,res) {
			
	var sql = req.sql, query = req.query, isHawk = req.cert.isHawk; 
	
	if (sql.query)
		if (isHawk) 
			// sql.context({users:{table:"openv.profile",where:{client:query.user},rec:query}});
			var q= sql.query(
				"UPDATE openv.profiles SET ? WHERE ?", 
				[ query, {client:query.user} ], 
				function (err,info) {
					Trace(q.sql);

					res( err || TOTEM.errors.failedUser );
			});
		
		else
			sql.query(
				"UPDATE openv.profiles SET ? WHERE ?", 
				[ query, {client:req.client} ],
				function (err,info) {
					
					res( err || TOTEM.errors.failedUser );
			});
	else
		res( TOTEM.errors.failedUser );
			
}

function deleteUser(req,res) {
			
	var sql = req.sql, query = req.query, isHawk = req.cert.isHawk;  

	if (query)
		if (isHawk)
			// sql.context({users:{table:"openv.profiles",where:[ {client:query.user}, req.query ],rec:res}});
			var q = sql.query(
				"TEST FROM openv.profiles WHERE ? AND least(?,1)", 
				[ {client:query.user}, req.query ], 
				function (err,info) {
					console.log(q.sql);

					res( err || TOTEM.errors.failedUser );
					
					// res should remove their files and other 
					// allocated resources
			});

		else
			sql.query(
				"TEST FROM openv.profiles WHERE ? AND least(?,1)", 
				[ {client:req.client}, req.query ], 
				function (err,info) {
					res( err || TOTEM.errors.failedUser );
			});
	else
		res( TOTEM.errors.failedUser );
}
			
function insertUser (req,res) {
			
	var sql = req.sql, query = req.query || {}, isHawk = req.cert.isHawk; 
	
	var url = TOTEM.paths.url;
	
	if (req.cert.isHawk)
		if (query.pass)
			var q = sql.query(
				"SELECT * FROM openv.profiles WHERE Requested AND NOT Approved AND least(?,1)", 
				query.user ? {User: query.user} : 1 )
				
			.on("result", function (user) {
				Trace(q.sql);
				
				var init = {	
					Approved: new Date(),
					Banned: url.resetpass
						? "Please "+"s your password".tag("a",{href:url.resetpass})+" to access"
						: "",

					Client: user.User,					
					QoS: 0,

					Message:

`Greetings from ${site.Nick.tag("a",{href:TOTEM.url.master})}-

Admin:
	Please create an AWS EC2 account for ${owner} using attached cert.

To connect to ${site.Nick} from Windows:

1. Establish gateway using 

		Putty | SSH | Tunnels
		
	with the following LocalPort, RemotePort map:
	
		5001, ${TOTEM.url.master}:22
		5100, ${TOTEM.url.master}:3389
		5200, ${TOTEM.url.master}:8080
		5910, ${TOTEM.url.master}:5910
		5555, Dynamic
	
	and, for convienience:

		Pageant | Add Keys | your private ppk cert

2. Start a ${site.Nick} session using one of these methods:

	${Putty} | Session | Host Name = localhost:5001 
	Remote Desktop Connect| Computer = localhost:5100 
	${FF} | Options | Network | Settings | Manual Proxy | Socks Host = localhost, Port = 5555, Socks = v5 `

.replace(/\n/g,"<br>")					
					
				};

				sql.query(
					"UPDATE openv.profiles SET ? WHERE ?",
					[ init, {User: user.User} ],
					function (err) {
						
						createCert(user.User,pass,function () {

							Trace(`Created cert for ${user.User}`);
							
							CP.exec(
								`sudo adduser ${user.User} -gid ${user.Group}; sudo id ${user.User}`,
								function (err,out) {
									
									sql.query(
										"UPDATE openv.profiles SET ? WHERE ?",
										[ {uid: out}, {User:user.User} ]
									);

									console.log( err 
										? `Account failed for ${user.User} - require "sudo adduser" to protect this service`
										: `Account created and group rights assigned to ${user.User}`
									);
							});
						});
				});
			})
			.on("end", function() {
				res("User creation working");
			});
		
		else
			res( TOTEM.errors.missingPass );

	else
		sql.query(
			"INSERT openv.profiles SET ? WHERE ?", 
			[ req.query , {User:req.User} ], 
			function (err,info) {
				
				res( err || TOTEM.errors.failedUser );
		});
}

function fetchUser(req,res) {	
	var access = TOTEM.user,
		query = req.query;
		
	query.user = query.user || query.select || query.delete || query.update || query.insert;
	
	if (access) {
		for (var n in {select:1,delete:1,update:1,insert:1})			
			if (query[n]) {
				delete query[n];
				return access[n](req,res);
			}
		
		if (call = query.call) {
			delete query.call;
			return access[call](req,res);
		}
	}
	
	res( TOTEM.errors.failedUser );
}

//============================================
// PKI utilitities

/**
 * @method createCert
 * 
 * Create a cert for the desired owner with the desired passphrase with callback 
 * to cb when complete.
 * */
function createCert(owner,pass,cb) {

	function traceExecute(cmd,cb) {

		Trace(cmd.replace(/\n/g,"\\n"));

		CP.exec(cmd, function (err) {

			if (err)
				console.info({
					shell: cmd,
					error: err
				});

			cb();
		});
	}

	var name = TOTEM.paths.certs.server + owner, 
		pfx = name + ".pfx",
		key = name + ".key",
		crt = name + ".crt",
		ppk = name + ".ppk";
		
	traceExecute(`echo -e "\n\n\n\n\n\n\n" | openssl req -x509 -nodes -days 5000 -newkey rsa:2048 -keyout ${key} -out ${crt}`, function () { 
		
	traceExecute(
		`export PASS="${pass}";openssl pkcs12 -export -in ${crt} -inkey ${key} -out ${pfx} -passout env:PASS`, 
		function () {
		
	traceExecute(
		`puttygen ${owner}.key -N ${pass} -o ${ppk}`, 	
		function () {
		
		Trace("IGNORE puttygen ERRORS IF NOT INSTALLED"); 
		cb();
	});
	});
	});

}

/**
* @method validateCert
* @param {Object} con http connection
* @param {Object} req totem request
* @param {Function} res totem response
*
* Get, default, cache and validate the clients cert, then use this cert to prime the totem
* request (client, group, log, and profile).  Responds will null (valid session) or an Error (invalid session).
* 
* on-input req = {action, socketio, query, body, flags, joins}
* on-output req = adds {log, cert, client, org, locagio, group, profile, journal, joined, email, hawk and 
* connection metrics}
 * */
function validateCert(con,req,res) {
				
	function getCert() {
		var cert = {						//< Guest cert
			issuer: {O:"acme"},
			subjectaltname: "",
			subject: {C:"xx",ST:"xx",L:"xx",O:"acme",OU:"",CN:"",emailAddress:""},
			valid_to: null,
			valid_from: null
		};
		
		if (TOTEM.encrypt) {
			
			if ( con.getPeerCertificate )
				var cert =  con.getPeerCertificate() || cert;
			
			if (TOTEM.proxy) {
				var NA = Req.headers.ssl_client_notafter,
					NB = Req.headers.sll_client_notbefore,
					DN = Req.headers.ssl_client_s_dn;
					
				if (NA) cert.valid_to = new Date(
						[NA.substr(2,2),NA.substr(4,2),NA.substr(0,2)].join("/")+" "+
						[NA.substr(6,2),NA.substr(8,2),NA.substr(10,2)].join(":")
					);
					
				if (NB) cert.valid_to = new Date(
						[NB.substr(2,2),NB.substr(4,2),NB.substr(0,2)].join("/")+" "+
						[NB.substr(6,2),NB.substr(8,2),NB.substr(10,2)].join(":")
					);
				
				if (DN)
					Each(DN.split("/"), function (n,hdr) {
						if (hdr) {
							var sub = hdr.split("=");
							cert.subject[sub[0]] += sub[1];
						}
					});
					
				var CN = cert.subject.CN;
				
				if (CN) {
					CN = CN.split(" ");
					cert.subject.CN = CN[CN.length-1] + "@coe.ic.gov";
				}
			}

		}
			
		cert.client = (cert.subject.emailAddress || cert.subjectaltname || cert.subject.CN || TOTEM.guest.Client).split(",")[0].replace("email:","");

		var cache = TOTEM.cache.certs;
		
		if ( !cache[cert.client] ) cache[cert.client] = cert;
					
		return cert;
	}
				
	function admitClient(req, res, profile, cert, con) {
		
		var now = new Date(),		
			admit = TOTEM.admit,
			site = TOTEM.site,
			client = cert.client;

		if (TOTEM.encrypt) {

			if ( now < new Date(cert.valid_from) || now > new Date(cert.valid_to) )
				return res( TOTEM.errors.expiredCert );
				
			if (admit)
				if ( !(cert.issuer.O.toLowerCase() in admit && cert.subject.C.toLowerCase() in admit) ) 
					return res( TOTEM.errors.rejectedCert );
					
		}
	
		if (profile.Banned) 
			res( new Error(profile.Banned) );
			
		else 
			sql.query("show session status like 'Thread%'", function (err,stats) {

				if (err)
					stats = [{Value:0},{Value:0},{Value:0},{Value:0}];
					
				Copy({
					log: {  								// TOTEM monitored
						Cores: site.Cores, 					// number of safety core hyperthreads
						VMs: 1,								// number of VMs
						Event: now,		 					// start time
						Action: req.action, 				// db action
						Client: client, 				// client id
						Table: req.table, 					// db target
						ThreadsRunning: stats[3].Value,		// sql threads running
						ThreadsConnected: stats[1].Value,	// sql threads connected
						RecID: req.query.ID || 0,			// sql recID
						Stamp: TOTEM.name,					// site name
						Fault: "isp"						// fault codes
					},

					cert	: cert,
					client	: client,
					org		: cert.subject.O || "noorg",
					location: con.address().address,
					group	: profile.Group || TOTEM.site.db, 
					profile	: Copy(profile,{}),
					journal : true,				// db actions journaled
					joined	: now, 				// time joined
					email	: client, 			// email address from pki
					source	: req.table 		// db target
					//hawk	: site.Hawks[client] // client ui change-tracking (M=mod,U=nonmod,P=proxy)
				}, req);
					
				res(null);
				
			});	
	}
	
	var sql = req.sql,
		cert = getCert(),
		client = cert.client;
	
	if (TOTEM.mysql)	
		sql.query("SELECT *,count(ID) as Count FROM openv.profiles WHERE ? LIMIT 0,1", {client: client})
		.on("result", function (profile) {

			if (profile.Count)
				admitClient(req, res, profile, cert, con);
				
			else  {
				TOTEM.guest.Client = client;
				sql.query("INSERT INTO openv.profiles SET ?", TOTEM.guest, function (err) {
					
//console.log(err);
					admitClient(req, res, TOTEM.guest, cert, con);
				});
			}
			
		});
	
	else 
	if (TOTEM.encrypt)
		res( TOTEM.errors.noDB );
	
	else
		res( null );
}

//============================================
// MIME utilities

function Indexer(path,cb) {
	
	var files = [];
	
	Finder(path, function (n,file) {
		
		files.push( file );
		
	});
	
	cb( files );
	
}	

function Finder(path,cb) {
	try {
		FS.readdirSync(path).each( function (n,file) {
			if (n > MAXFILES) return true;
			
			if (file.charAt(0) != "_" && file.charAt(file.length-1) != "~") 
				cb(n,file);
		});
	}
	catch (err) {
		return;
	}
}

function Uploader(sql, files, area, cb) {

	function copyFile(source, target, cb) {
	  var cbCalled = false;
	  var rd = FS.createReadStream(source);
	  var wr = FS.createWriteStream(target);
	  
	  rd.on("error", function(err) {
		done(err);
	  });
	  
	  wr.on("error", function(err) {
		done(err);
	  });
	  wr.on("close", function(ex) {
		done();
	  });
	  
	  rd.pipe(wr);

	  function done(err) {
		if (!cbCalled) {
		  cb(err);
		  cbCalled = true;
		}
	  }
	}
	
	var arrived = new Date();
	
	files.each( function (n,file) {
		var name = file.name;
		var target = TOTEM.paths.mime[area]+"/"+area+"/"+file.name;

		try {
			if (file.image) {
				
				var prefix = "data:image/png;base64,";	
				var buf64 = new Buffer(file.image.substr(prefix.length),'base64');
				var temp = `tmp/temp.png`;  // many browsers only support png so convert to jpg
				
				FS.writeFile(temp, buf64.toString("binary"), {encoding:"binary"}, function (err) {
					console.info("SAVE "+name+" TO "+target+(err?" FAILED":""));

					if (!err && cb)
						LWIP.open(temp, function (err,image) {
						
							if (!err) {
								image.writeFile(target, function (err) {
									console.info("JPG convert "+(err||"ok"));
								});
																	
								if (cb)
									cb({
										Name: name,
										Area: area,
										Added: arrived,
										Size: file.size,
										Width: image.width(), 
										Height: image.height()
									});
							}

						});
				
				});
								
			}
			else
				copyFile(file.path,target,function (err) {
					
					console.info("SAVE "+file.path+" TO "+target+(err?" FAILED":""));

					if (cb) cb({
						Name: name,
						Area: area,
						Added: arrived,
						Size: file.size
					});
						
					if (false)
						APP.NEWREAD.JOB(sql,body.Area,name);
				});
		}
		catch (err) {
			console.info(err);
		}
	});
}

//============================================
// Data fetchers

function fetchWget(req,res) {	//< wget endpoint
	if (req.out) 
		TOTEM.fetchers.wgetout = req.out;
		
	if ( url = TOTEM.paths.url[req.table] )
		wgetFetch(url.format(req, TOTEM.fetchers.plugin),res);
}

function fetchCurl(req,res) {	//< curl endpoint
	if( url = TOTEM.paths.url[req.table] )
		curlFetch(url.format(req, TOTEM.fetchers.plugin),res);
}

function fetchHttp(req,res) {	//< http endpoint
	if ( url = TOTEM.paths.url[req.table] )
		httpFetch(url.format(req, TOTEM.fetchers.plugin),res);
}

function fetchTest(req,res) {	//< test endpoint
	
	var query = req.query,
		sql = req.sql;
		
	sql.query("SELECT *,count(ID) as Count FROM openv.riddles WHERE ? LIMIT 0,1", {ID:query.ID})
	.on("result", function (rid) {
		
		var ID = {ID:rid.ID},
			guess = (query.guess+"").replace(/ /g,"");

console.log(rid);

		if (rid.Count) 
			if (rid.Riddle == guess) {
				res( "pass" );
				sql.query("DELETE FROM openv.riddles WHERE ?",ID);
			}
			else
			if (rid.Attempts > rid.maxAttempts) {
				res( "fail" );
				sql.query("DELETE FROM openv.riddles WHERE ?",ID);
			}
			else {
				res( "retry" );
				sql.query("UPDATE openv.riddles SET Attempts=Attempts+1 WHERE ?",ID);
			}
		
	});
}

function curlFetch(url,cb) {

	var opts = URL.parse(url),
		certs = TOTEM.cache.certs,
		transport = {
			"http:": `curl ${url}`,
			"https:": `curl -k --cert ${certs.crt} --key ${certs.key} ${url}`
		};

	retryFetch(
		transport[opts.protocol],
		opts, 
		
		function (err,out) {
			cb( err || (out||"").parse(new Error(err)) );
	});

}

function wgetFetch(url,cb) { 
		
	var opts = URL.parse(url),
		certs = TOTEM.cache.certs,
		transport = {
			"http:": `wget -O ${TOTEM.fetchers.wgetout} ${url}`,
			"https:": `wget -O ${TOTEM.fetchers.wgetout} --no-check-certificate --certificate ${certs.crt} --private-key ${certs.key} ${url}`
		};
	
	retryFetch(
		transport[opts.protocol],
		opts, 

		function (err) {
			cb( err || TOTEM.fetchers.wgetout);
	});
	
}

function httpFetch(url,cb) {
			
	var 
		opts = URL.parse(url), 
		transport = {
			"http:": HTTP,
			"https:": HTTPS
		};
	
	opts.pfx = TOTEM.cache.certs.pfx;
	opts.passphrase = TOTEM.encrypt;
	opts.retry = TOTEM.retries;
	opts.rejectUnauthorized = false;
	opts.agent = false;

	/*if (opts.soap) {
		opts.headers = {
			"Content-Type": "application/soap+xml; charset=utf-8",
			"Content-Length": opts.soap.length
		};
		opts.method = "POST";
	}*/
	
	var req = transport[opts.protocol].request(opts, function(res) {
		res.setEncoding('utf-8');
		
		var text = "";
		res.on('data', function (chunk) {
			text += chunk;
		});

		res.on("end", function () {

			/*Trace("fetch", {
				status: res.statusCode,
				text: text,
				header: res.headers}); */
		
			cb( text.parse(null) );
		});
		
	});

	req.on('error', function(err) {
		Trace(`RETRYING(${opts.retry} ${err}`);
		if (opts.retry) opts.retry--;
	});

	/*if (opts.soap)
		req.write(opts.soap);*/
		
	req.end();
}

function retryFetch(cmd,opts,cb) {
		
	function trycmd(cmd,cb) {

		if (TOTEM.notify)
			Trace(`TRY[${opts.retry}] ${cmd}`);

		CP.exec(cmd, function (err,stdout,stderr) {
			if (err) {
				if (opts.retry) {
					opts.retry--;
					
					trycmd(cmd,cb);
				}
				else
					cb( new Error(`Halted ${cmd}`) );
			}
			else
			if (cb) cb(stdout);
		});
	}
	
	opts.retry = TOTEM.retries;

	if (opts.retry) 
		trycmd(cmd,cb);
	else
		CP.exec(cmd, function (err,stdout,stderr) {			
			cb( err ? opts.halted : stdout );
		});
}

//============================================
// Default send and read methods

function readTemplate(req,res) {
	
	var	sql = req.sql,
		route = TOTEM.execute[req.table];

	if (route)
		route(req,res);
	else
		res();			
}

function sendTemplate(req,res) {
	res( "there you go");
}

function sendFile(req,res) {

	res( function () {return req.path; } );

}

//============================================
// Antibot challenger

function initChallenger() {

	function Riddle(map, ref) {
		var 
			Q = {
				x: Math.floor(Math.random()*10),
				y: Math.floor(Math.random()*10),
				z: Math.floor(Math.random()*10),
				n: Math.floor(Math.random()*map["0"].length)
			},
			
			A = {
				x: "".tag("img", {src: `${ref}/${Q.x}/${map[Q.x][Q.n]}.jpg`}),
				y: "".tag("img", {src: `${ref}/${Q.y}/${map[Q.y][Q.n]}.jpg`}),
				z: "".tag("img", {src: `${ref}/${Q.z}/${map[Q.z][Q.n]}.jpg`})
			};
		
		return {
			Q: `${A.x} * ${A.y} + ${A.z}`,
			A: Q.x * Q.y + Q.z
		};
	}
	
	var riddle = TOTEM.riddle = [],
		N = TOTEM.riddles,
		map = TOTEM.map,
		ref = "/captcha";
	
	for (var n=0; n<N; n++)
		riddle.push( Riddle(map,ref) );
}

function getChallenge(msg,rid,ids) {

	var riddles = TOTEM.riddle,
		N = riddles.length;
	
	msg = (msg||"")
	.each("(riddle)", rid, function (rid) {
		
		var n = Math.floor( Math.random() * N ),
			QA = riddles[n];
		
		rid.push( QA.A );
		return QA.Q;
		
	})
	.each("(yesno)", rid, function (rid) {
		
		rid.push( "yes" );
		return "yes/no";
		
	})
	.each("(ids)", rid, function (rid) {
		
		var rtn = "", pre="";
		Each(ids, function (n, id) {
			rtn += pre + "(" + n + ")";
			pre = ", ";
		});
		
		return rtn;
	})
	.each("(rand)", rid, function (rid) {
		
		rid.push( val = Math.floor(Math.random()*10) );
		
		return "random integer between 0 and 9";
	})
	.each("(card)", rid, function (rid) {
		return "cac challenge TBD";
	})
	.each("(bio)", rid, function (rid) {
		return "bio challenge TBD";
	});
	
	Each(ids, function (n, id) {
		
		msg = msg.each("("+n+")", rid, function (rid) {			
			rid.push( id );
			return n;
		});
		
	});
	
	return msg;
}

function challengeClient(client, Prof) {
			
	if (Prof.Banned) 
		TOTEM.IO.emit("select", {
			message: Prof.Banned,
			rejected: true
		});
	else {
		var 
			rid = [],
			reply = (TOTEM.map && TOTEM.riddles)
					? getChallenge( Prof.Message, rid, (Prof.IDs||"").parse({}) )
					: Prof.Message;
	
		if (reply) 
			sqlThread( function (sql) {
				sql.query("INSERT INTO openv.riddles SET ?", {
					Riddle: rid.join(",").replace(/ /g,""),
					Client: client,
					Made: new Date(),
					Attempts: 0
				}, function (err,info) {
					
					TOTEM.IO.emit("select", {
						message: reply,
						riddles: rid.length,
						rejected: false,
						retries: Prof.Retries,
						timeout: Prof.Timeout,
						ID: info.insertId
					});
					
					if (Prof.Repoll) {
						
						var SaveProf = Copy(Prof,{});
						
						setInterval(function () {
							challengeClient(client, SaveProf);
						}, Prof.Repoll);
					}
					
					sql.release();
				});
			});
	}
}

//============================================
// TOTEM initalization

function Initialize () {
	
	Trace(`INITIALIZED WITH ${TOTEM.riddles} RIDDLES`);
	
	initChallenger();
	
}

//============================================
// Execution tracing

function Trace(msg,arg) {
	
	if (msg.constructor == String)
		console.log("T>"+msg);
	else
		console.log("T>"+msg.sql);

	if (arg) console.log(arg);
		
	return msg;
}

//====================================
// Node routing

function parseNode(req) {
	
	var
		node = URL.parse(req.node),
		query = req.query = (node.query||"").parse({}),
		areas = node.pathname.split("/"),
		file = req.file = areas.pop() || TOTEM.paths.default,
		parts = file.split("."),
		type = req.type = parts.pop(),
		table = req.table = parts.pop() || "",
		area = req.area = areas[1] || "";
		
	if ( req.path = TOTEM.paths.mime[req.area] )
		req.path += node.pathname;
		
	else
		req.area = "";

	if (false)
		console.log({
			a: req.area,
			t: req.type,
			f: req.file,
			p: req.path,
			d: req.table});
	
	// flags and joins
	
	var 
		reqflags = TOTEM.reqflags,
		strips = reqflags.strips,
		prefix = reqflags.prefix,
		lists = reqflags.lists,
		jsons = reqflags.jsons,
		traps = reqflags.traps,
		id = reqflags.id,
		trace = false, //query[reqflags.trace],
	
		body = req.body,
		flags = req.flags,
		joins = req.joins;

	if (trace)
		console.info({
			i: "before",
			a: req.action,
			q: query,
			b: body,
			f: flags
		});

	for (var n in query) 		// remove bogus query parameters and remap query flags and joins
		if ( n in strips ) 				// remove bogus
			delete query[n];
		else
		if (n.charAt(0) == prefix) {  	// remap flag
			var flag = n.substr(1);
			flags[flag] = query[n];
			delete query[n];
		}
		else {							// remap join
			var parts = n.split(".");
			if (parts.length>1) {
				joins[parts[0]] = n+"="+query[n];
				delete query[n];
			}
		}	

	for (var n in body) 		// remap body flags
		if (n.charAt(0) == prefix) {  
			flags[n.substr(1)] = body[n];
			delete body[n];
		}
	
	if (id in body) {  			// remap body record id
		query[id] = body[id];
		delete body[id];
	}
	
	for (var n in traps) 		// let traps remap query-flag parms
		if (flag = flags[n])
			traps[n](query,flags);
	
	if (trace)
		console.info({
			i: "after",
			a: req.action,
			q: query,
			b: body,
			f: flags,
			j: joins
		});
}						

function syncNodes(nodes, acks, req, res, cb) {
	
	if ( node = req.node = nodes.pop() )  	// grab last node
		routeNode( req, function (ack) { 	// route it and intercept its ack
			acks[req.file] = ack;
			syncNodes( nodes, acks, Copy(req,{}), res, cb );
		});

	else
	if (nodes.length) 	// still more nodes
		syncNodes( nodes, acks, Copy(req,{}), res, cb );
	
	else  				// no more nodes
		cb(acks);
}

function routeNode(req, res) {
	
	parseNode(req);

	var
		sql = req.sql,
		
		node = req.node,
		table = req.table,
		type = req.type,
		action = req.action,
		area = req.area,		
		route = null,
		paths = TOTEM.paths;

	if (route) 
		followRoute(route,req,res);
	
	else
	if (req.path) 
		followRoute( route = 
				TOTEM.sender[area] 
			|| 	TOTEM.reader[type] 
			|| 	sendFile, 
			
			req, res );

	else
	if ( route = TOTEM.reader[type] )
		followRoute(route,req,res);
		
	else
	if (table && paths.mysql.engine)
	
		sql.query(paths.mysql.engine, {		// find an engine
			Name: table,
			Enabled: 1
		})
		.on("result", function (eng) {

			Trace(`Engines = ${eng.Count}`);

			var route;

			if (eng.Count) 			// route to located engine
				if ( route = TOTEM.worker[action] )	
					followRoute(route,req,res);

				else
					res( TOTEM.errors.noRoute );
			else
			if ( route = 			// route to emulator, reader or default
					TOTEM.emulator[action][table]
				||	TOTEM.reader[table]
				||	TOTEM[action]
			)
				followRoute(route,req,res);
				
			else
				res( TOTEM.errors.noRoute );

		})
		.on("error", function (err) {
			res( TOTEM.errors.noRoute )
		})
	
	else
	if (table)				
		if (
			route = 
				TOTEM.emulator[action][table] 
			||	TOTEM.reader[type]
			|| 	TOTEM[action] )
				
			followRoute(route,req,res);

		else
			res( TOTEM.errors.noRoute );
	
	else
		res( TOTEM.errors.noRoute );
}

function followRoute(route,req,res) {
	Trace( 
		//`[${req.log.ThreadsConnected}/${req.log.ThreadsRunning}] ` 
		(route?route.name:"null").toUpperCase() 
		+ ` ${req.file} FOR ${req.client}@${req.group}`);
	
	route(req, res);
}

//============================================
// Thread processing

/**
 * @method Responder
 * @param {Object} Req http/https request
 * @param {Object} Res http/https response
 *
 * Responds to an HTTP/HTTPS request-repsonse thread.
 * */
function Responder(Req,Res) {	
	
	/** 
	 * Terminal response functions to respond with a string, file, db structure, or error message.
	 * */
	function sendString( data ) {
		//Trace("sql closed");
		Res.end( data );
		Req.req.sql.release();
	}
		
	function sendFileIndex( head, files ){
		
		switch (0) {
			case 0:
				files.each( function (n,file) {
					files[n] = file.tag("a",{href:`${file}`});
				});
				
				sendString(`${head}:<br>` + files.join("<br>") );
				break;
				
			case 1:
				sendString(`${head}:\n` + files.join("\n") );
				break;
		}
		
	}
	
	function sendCache(path,file,type,area) {

		var mime = MIME[type] || MIME.html  || "text/plain",
			paths = TOTEM.paths;
		
		//Trace(`SENDING ${path} AS ${mime} ${file} ${type} ${area}`);
		//Res.setHeader("Content-Type", mime );
		
		if (type) {
				
			var cache = TOTEM.cache;
			
			if (cache.never[file] || cache.never[type]) cache = null;
			if (cache) cache = cache[area];
			if (cache) cache = cache[type];
			
			var buf = cache ? cache[path] : null;
			
			if (buf)
				sendString( buf );
			else
				try {
					if (cache)
						sendString( cache[path] = FS.readFileSync(path) );
					else
						sendString( FS.readFileSync(path) );
				}
				catch (err) {
					sendError( "File not found" );
				}
		}
		else
		if ( 	( index = paths.mime.index ) &&
				( indexer = index[area] ) ) {

			TOTEM[indexer](path, function (files) {
				sendFileIndex(`Index of ${path}`, files);
			});
		}
		else
			sendError( "Index not found" );
		
	}		

	function sendError(msg) {
		Res.end( TOTEM.errors.pretty(msg) );
		Req.req.sql.release();
	}

	function sendDb( msg, cnt, data) {
	
		sendString( data
			? JSON.stringify({ 
				success: true,
				msg: msg,
				count: cnt,
				data: data
			})
			
			: JSON.stringify({ 
				success: false,
				msg: msg,
				count: cnt,
				data: []
			}) 
		);
		
	}
	
	/**
	 * Session response callback
	 * */
	function res(ack) {
		
		var req = Req.req,
			sql = req.sql,
			paths = TOTEM.paths;
		
		try {
			switch (ack.constructor) {
				case Error: 			// send error message
					
					switch (req.type) {
						case "db":

							sendDb(ack+"",0,null);
							break;
							
						default:
						
							sendError( ack );
					}
					break;
				
				case String: 			// send raw string
				
					switch (req.type) {
						case "db": 
							sendDb(ack,0,null);
							break;
							
						case "html": 
						case "txt":
						default:
							sendString( ack );
					}
					break;
					
				case Function: 			// send file via search or direct
				
					if (search = req.query.search && paths.mysql.search) 		// search for file via nlp/etc
						sql.query(paths.mysql.search, {FullSearch:search}, function (err, files) {
							
							if (err) 
								sendError("Files could not be scored");
								
							//else
							//if (file = files[0])
							//	sendCache( getPath(file.Area,file.Name), file.Name, file.Type );
							else
								sendError("No file found");
								
						});
					
					else {						
						if (paths.mysql.credit)
							sql.query( paths.mysql.credit, {Name:req.node,Area:req.area} )
							.on("result", function (file) {
								if (file.Client != req.client)
									sql.query("UPDATE openv.profiles SET Credit=Credit+1 WHERE ?",{Client: file.Client});
							});

						sendCache( ack(), req.file, req.type, req.area );
					}
				
					break;
					
				case Array: 			// send records

					var flags = req.flags;

					Each( TOTEM.reqflags.lists, function (n, conv) {
						if (flag = flags[n])
							if (conv) {
								//console.log([">>>>>> conv",n,flag,ack]);
								ack = conv(flag,ack,req);
							}
					});
					
					if (ack.constructor == Array)
						switch (req.type) {
							case "db": 
								switch (req.action) {
									case "select":

										sql.query("select found_rows()")
										.on('result', function (stat) {		// ack from sql				

											sendDb("data", stat["found_rows()"] || 0, ack);

										})
										.on("error", function () {  		// ack from virtual table

											sendDb("data", ack.length, ack);

										});

										break;

									case "update":
									case "delete":
									case "insert":
									case "execute":

										sendDb("info", 0, ack);
										break;

									default:
										sendError( TOTOM.errors.invalidQuery );
								}
								break;

							case "txt":
							case "csv":

								JS2CSV({ 
									data: ack, 
									fields: Object.keys( ack[0]||{} )
								} , function (err,csv) {

									if (err)
										sendError("Bad conversion");
									else 
										sendString( csv );
								});
								break;

							case "xml":

								sendString( JS2XML.parse(req.table, {  
									count: ack.length,
									data: ack
								}) );
								break;

							case "html": 

								var rtn = "";
								ack.each(function (n,html) {
									rtn += html;
								});
								sendString(rtn);
								break;

							case "json":
							default:

								sendString( JSON.stringify(ack) );
						}
					
					else
							res(ack);
					
					break;
			
				default:
				
					switch (req.type) {
						case "db": 
							
							sendDb( "info", 0, ack );
							break;
							
						case "txt":
						case "csv":
							
							JS2CSV(ack , function (err,csv) {
								if (err)
									sendError("Bad conversion");
								else 
									sendString( csv );
							});
							break;
		
						case "xml":
						
							sendString( JS2XML(req.table, ack) );
							break;
							
						case "html":
							
							sendString( ack );
							break;
							
						case "json":
						default:
							
							sendString( JSON.stringify(ack) );
					}
					break;
			
			}

		}
		catch (err) {
			sendError("Bad result - "+err);
		}
	}

	/**
	 * Feed computed link metrics on specified http connection
	 * to the callback.
	 * */
	function metrics() {	
		
		var con = Req.connection,
			req = Req.req;
		
		if (con && (record = TOTEM.paths.mysql.record)) {
		
			con._started = new Date();
			
			// If maxlisteners is not set to infinity=0, the connection 
			// becomes sensitive to a sql connector t/o and there will
			// be random memory leak warnings.
			
			con.setMaxListeners(0);
			con.on('close', function () { 		// cb when connection closed
					
				var secs = ((new Date()).getTime() - con._started.getTime()) / 1000;
				var bytes = con.bytesWritten;
				var paths = TOTEM.paths;

				sqlThread( function (sql) {

					sql.query(record, Copy( req.log || {} , {
						Delay: secs,
						Overhead: bytes,
						LinkSpeed: secs ? bytes / secs : 0,
						Event: con._started
					}), function () {
						//Trace("metrics closed");
						sql.release();
					});
					
				});
			});

		}
	}

	function getBody( cb ) {

		var body = "";
		
		Req
		.on("data", function (chunk) {
			body += chunk.toString();
		})
		.on("end", function () {
			cb( body.parse({}) );
		});
	}
		
	/** 
	 * Combat denial of service attacks by checking if http session is too busy.
	 * */
	function checkBusy() {
		
		if (BUSY && (busy = TOTEM.errors.tooBusy) )	
			if ( BUSY() )
				Res.end( TOTEM.errors.pretty( busy ) );
	}
	
	/**
	 * Start a connection thread cb(err) containing a Req.req.sql connector,
	 * a validated Req.req.cert certificate, and set appropriate Res headers. 
	 * 
	 * @param {Object} req request
	 * @param {Function} res response
	 *
	 * on-input req = {action, socketio, query, body, flags, joins}
	 * on-output req =  adds {log, cert, client, org, location, group, profile, journal, 
	 * joined, email, hawk and STATICS}
	 * */
	function conThread(req, res) {

		var con = Req.connection;

		resThread( req, function (sql) {

			metrics();

			if (con)
				validateCert(con, req, function (err) {
					if (err)
						res(err);
					else {
						Res.setHeader("Set-Cookie", 
							["client="+req.client, "service="+TOTEM.name]);		
					
						if (TOTEM.mysql)
							sql.query("USE ??", req.group, function (err) {
								
								if (err)
									res( TOTEM.errors.badGroup );
								
								else
								if (TOTEM.validator) 
									TOTEM.validator(req, res);
								
								else
									res(err);
								
							});
						
						else
						if (TOTEM.validator) 
							TOTEM.validator(req, res);
						
						else
							res( null );
					}
				});

			else
				res( TOTEM.errors.lostConnection );
		});
	}

	checkBusy();

	getBody( function (body) {

		var  							
			// parse request url into /area/nodes
			paths = TOTEM.paths,
			
			// prime session request hash
			req = Req.req = {
				action: TOTEM.crud[Req.method],
				socketio: TOTEM.encrypt ? TOTEM.paths.url.socketio : "",
				query: {},
				body: body,
				flags: {},
				joins: {},
				connection: Req.connection	// engines require for transferring work to workers
			},

			// get a clean url
			url = req.url = unescape(Req.url),
			
			// get a list of all nodes
			nodes = url ? url.split("$") : [];

		conThread( req, function (err) { 	// start session with client
			
			if (err) 					// validator rejected session
				res(err);
				
			else
			if (nodes.length == 1) {	// respond with only this node
				node = req.node = nodes.pop();	
				routeNode(req, function (ack) {	
//console.log({ack:ack});					
					Res.setHeader("Content-Type", MIME[req.type] || MIME.html || "text/plain");
					res(ack);
				});
			}
			
			else 					// sync and aggregate all nodes
				syncNodes(nodes, {}, req, res, function (ack) {
					
					Res.setHeader("Content-Type", "application/json");
					res(ack);
				});
				
		});
	});
}

function resThread(req, cb) {
	sqlThread( function (sql) {
		cb( req.sql = sql );
	});
}

function sqlThread(cb) {
	DSVAR.thread(cb);
}

// UNCLASSIFIED
