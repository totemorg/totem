// UNCLASSIFIED 

/**
@class TOTEM

@requires http
@requires https
@requires fs
@requires constants
@requires clusters
@requires child-process
@requires os
@requires vm

@requires enum
@requires jsdb

@requires mime
@requires socket.io
@requires socket.io-clusterhub
@requires mysql
@requires xml2js
@requires toobusy
@requires json2csv
@requires js2xmlparser
@requires toobusy-js

Referenced external vars:
		SERVICE_NAME || "Totem1",
		SERVICE_PASS || "",
		SERVICE_WORKER_URL || "https://localhost:8443", 
		SERVICE_MASTER_URL || "http://localhost:8080"
		MYSQL_HOST || "localhost",
		MYSQL_HOST || "nobody",
		MYSQL_PASS || "secret",
		SHARD0 || "http://localhost:8080/task",
		SHARD1 || "http://localhost:8080/task",
		SHARD2 || "http://localhost:8080/task",
		SHARD3 || "http://localhost:8080/task"

Required MySQL openv.datasets:
	apps, sessions, profiles, aspreqts, ispreqts, swreqts, hwreqts, riddles, syslogs
	
Required MySQL app.datasets:
	dblogs, files
 */

var	
	// globals
	TRACE = "T>",
	ENV = process.env,
	
	// NodeJS modules
	HTTP = require("http"),						//< http interface
	HTTPS = require("https"),					//< https interface
	CP = require("child_process"),				//< spawn OS shell commands
	FS = require("fs"),							//< access file system
	CONS = require("constants"),				//< constants for setting tcp sessions
	CLUSTER = require("cluster"),				//< multicore  processing
	URL = require("url"),						//< url parsing
	NET = require("net"), 				// network interface
	VM = require("vm"), 					// virtual machines for tasking
	OS = require('os'),				// OS utilitites

	// 3rd party modules
	MIME = require("mime"), 			//< file mime types
	SIO = require('socket.io'), 			//< Socket.io client mesh
	SIOHUB = require('socket.io-clusterhub'),	//< Socket.io client mesh for multicore app
	MYSQL = require("mysql"),					//< mysql conector
	XML2JS = require("xml2js"),					//< xml to json parser (*)
	BUSY = require('toobusy-js'),  		//< denial-of-service protector (cant install on NodeJS 5.x+)
	JS2XML = require('js2xmlparser'), 			//< JSON to XML parser
	JS2CSV = require('json2csv'),				//< JSON to CSV parser	
	
	// Totem modules
	JSDB = require("jsdb"),				//< JSDB database agnosticator
	sqlThread = JSDB.thread;

const { Copy,Each,Log } = require("enum");
	
function Trace(msg,sql) {
	TRACE.trace(msg,sql);
}

var
	TOTEM = module.exports = {

	init: function () {},
		
	/**
	@cfg {Object}
	Plugins for tasker engine context
	*/
	plugins: {
		console: console,
		log: console.log
	},
		
	/**
	@cfg {Boolean}
	@member TOTEM
	Enabled when master/workers on encrypted service
	*/
	onEncrypted: {
		true: false,   // on master 
		false: false	// on worker
	},
		
	/**
	@cfg {Function}
	@method tasker
	@member TOTEM
	@param {Object} opts tasking options (see example)
	@param {Function} task tasker of the form ($) => {return msg} where $ contains process info
	@param {Function} cb callback of the form (msg) => {...} to process msg returned by task
	Spread one or more tasks to workers residing in a compute node cloud as follows:
	
		tasker({  		// example
			keys: "i,j,k",  	// e.g. array indecies
			i: [0,1,2,3],  		// domain of index i
			j: [4,8],				// domain of index j
			k: [0],					// domain of index k
			qos: 0,				// regulation time in ms if not zero
			local: false, 		// enable to run task local, i.e. w/o workers and nodes
			workers: 4, 		// limit number of workers (aka cores) per node
			nodes: 3 			// limit number of nodes (ala locales) in the cluster
		}, 
			// here, a simple task that returns a message 
			($) => "my result is " + (i + j*k) + " from " + $.worker + " on "  + $.node,

			// here, a simple callback that displays the task results
			(msg) => console.log(msg) 
		);
	
	*/				
	tasker: function (opts, task, cb) {

		function genDomain(depth, keys, opts, index, lastIndex, cb) {
			var
				key = keys[depth],
				idxs = opts[key] || [],
				N = idxs.length;

			//Log(depth,key, index, N, lastIndex);
			if (key)
				idxs.forEach( function (idx,n) {
					index[key] = idx;
					genDomain(depth+1, keys, opts, index, lastIndex && n==N-1, cb);
				});
			
			else
				cb( Copy(index,{}), lastIndex);
		}
	
		function nodeCB(err) {
			if (err) Log(err);
		}
		
		var 
			paths = TOTEM.paths,
			fetch = TOTEM.fetchData,
			fetches = 0, 
			node = 0,
			nodeURL = paths.nodes[node],
			nodeReq = {
				domain: [],
				client: opts.client || "guest",
				credit: opts.credit || 10e3,
				name: opts.name || "atask",
				qos: opts.qos || 0,
				cb: cb+""
			},
			dom = nodeReq.domain, 
			keys = opts.keys || "",
			cores = opts.cores || opts.workers || 10,
			shards = opts.shards || 100,
			nodes = opts.nodes || opts.locales || 50;

		if ( opts.local )
			genDomain(0, keys.split(","), opts, {}, true, function (index) {
				cb( task(index) );
			});
		
		else
			genDomain(0, keys.split(","), opts, {}, true, function (index, isLast) {
				dom.push( index );

				if ( isLast || (dom.length == shards) ) {
					if ( ++fetches > cores ) {
						nodeURL = paths.nodes[++node];
						if ( !nodeURL) nodeURL = paths.nodes[node = 0];
						fetches = 0;
					}

					if (task) 
						if (task.constructor == Array)
							task.forEach( function (task) {
								nodeReq.task = task+"";
								fetch( nodeURL, null, nodeReq, nodeCB);
							});

						else {
							nodeReq.task = task+"";
							fetch( nodeURL, null, nodeReq, nodeCB);
						}

					else
						dom.forEach( cb );

					dom.length = 0;
				}
			});
	},
					
	/**
	@cfg {Object}
	Watchdogs {name: dog(sql, lims), ... } run every dog.cycle seconds with a dog.trace message using
	specified dog.parms.  When the watchdog is invoked it is given a sql connector and its lims attributes.
	*/		
	dogs: { //< watchdog functions(sql, lims)
	},
	
	watchFile: function (area, name, cb) { 
	/**
	@private
	@method  watchFile
	Establish smart file watcher when file at area/name has changed.
	@param {String} area Name of folder being watched
	@param {String} name Name of file being watched
	@param {Function} callback cb(sql, name, path) when file at path has changed
	*/
		var 
			path = area + name,
			watchMods = TOTEM.watchMods;
		
		Trace("WATCHING " + name);
		
		watchMods[path] = 0; 

		FS.watch(path, function (ev, file) {  
			var 
				path = area + file,
				isSwap = file.charAt(0) == ".";

			if (file && !isSwap)
				switch (ev) {
					case "change":
						sqlThread( function (sql) {
							Trace(ev.toUpperCase()+" "+file, sql);

							FS.stat(path, function (err, stats) {

								if ( !err && (watchMods[path] - stats.mtime) ) {
									watchMods[path] = stats.mtime;
									cb(sql, file, path);
								}

							});
						});

						break;

					case "delete":
					case "rename":
					default:

				}
		});
	},
		
	createCert: createCert, //< method to create PKI certificate
		
	/**
	@cfg {String}
	@member TOTEM
	Node divider NODE $$ NODE ....  ("" disables dividing).
	*/
	nodeDivider: "??", 				//< node divider
	
	/**
	@cfg {Number}
	@member TOTEM
	Max files to index by the indexFile() method (0 disables).
	*/
	maxIndex: 1000,						//< max files to index

	/**
	@cfg {Object}
	@private
	@member TOTEM
	Reserved for socket.io support to multiple clients
	*/
	IO: null, 

	/**
	@cfg {Object}
	@member TOTEM
	Reserved for dataset attributes derived by JSDB.config
	*/
	dsAttrs: {
	},
		
	/**
	@cfg {Function}
	@member TOTEM
	@method config
	Configure and start the service with options and optional callback when started.
	@param {Object} opts configuration options following ENUM.Copy() conventions
	@param {Function} cb callback(err) when service started
	*/
	config: configService,	
	
	/**
	@cfg {Function}
	@member TOTEM	
	@method stop
	Stop the server.
	*/
	stop: stopService,
	
	/**
	@member TOTEM	
	@method thread
	@param {Function} cb callback(sql connector)
	Thread a new sql connection to a callback.  Unless overridden, will default to the JSDB thread method.
	 * */
	thread: sqlThread,
		
	/**
	@cfg {Object}  
	@member TOTEM
	REST-to-CRUD translations
	*/
	crud: {
		GET: "select",
		DELETE: "delete",
		POST: "insert",
		PUT: "update"
	},
	
	/**
	@cfg {Object} 
	@member TOTEM
	Options to parse request flags
	
			traps: { flag:cb(query,flags), ...} // sets trap cb for a _flag=list to reorganize the query and flags hash,
			edits: { flag:cb(list,data,req), ...} // sets data conversion cb for a _flag=list,
			prefix:  "_" 	// sets flag prefix
	*/
	reqFlags: {				//< Properties for request flags
		strips:	 			//< Flags to strips from request
			{"":1, "_":1, leaf:1, _dc:1}, 		

		//ops: "<>!*$|%/^~",
		id: "ID", 					//< SQL record id
		prefix: "_",				//< Prefix that indicates a field is a flag
		trace: "_trace",		//< Echo flags before and after parse	
		blog: function (recs, req, res) {  //< Default blogger
			res(recs);
		},
		encap: function (recs,req,res) {  //< dataset.encap to encap records
			var rtn = {};
			rtn[req.flags.encap] = recs;
			res(rtn);
		}		
	},

	/**
	@cfg {Object} 
	@member TOTEM
	Mysql connection options	
	*/		
	mysql: { //< null to disable database
		host: ENV.MYSQL_HOST || "localhost",
		user: ENV.MYSQL_USER || "nobody",
		pass: ENV.MYSQL_PASS || "secret",
		sessions: 1000
	},
	
	sockets: false, 	//< enabled to support web sockets
		
	/**
	@cfg {Number} [cores=0]
	@member TOTEM	
	Number of worker cores (0 for master-only).  If cores>0, masterport should != workPort, master becomes HTTP server, and workers
	become HTTP/HTTPS depending on encrypt option.  In the coreless configuration, master become HTTP/HTTPS depending on 
	encrypt option, and there are no workers.  In this way, a client can access stateless workers on the workerport, and stateful 
	workers via the masterport.	
	*/				
	cores: 0,	//< Number of worker cores (0 for master-only)
		
	/**
	@cfg {String} [host="localhost"]
	@member TOTEM	
	Service host name 
	*/		
	//host: "localhost", 		//< Service host name 

	/**
	@cfg {Object}
	@member TOTEM	
	Folder watching callbacks cb(path) 
	*/				
	onFile: {		//< File folder watchers with callbacks cb(path) 
	},
		
	watchMods: { 	//< List to track changed files as OS will trigger multiple change evented when file changed
	},
		
	/**
	@cfg {Boolean} [behindProxy=false]
	@member TOTEM	
	Enable if https server being proxied
	*/				
	behindProxy: false,		//< Enable if https server being proxied

	/**
	@cfg {String} [name="Totem"]
	@member TOTEM	
	Name of this service used to
		1) derive site parms from mysql openv.apps by Nick=name
		2) set mysql name.table for guest clients,
		3) identify server cert name.pfx file.
	If the Nick=name is not located in openv.apps, the supplied	config() options are not overridden.
	*/	
	host: { 
		name: ENV.SERVICE_NAME || "Totem1",
		encrypt: ENV.SERVICE_PASS || "",
		worker:  ENV.SERVICE_WORKER_URL || "https://localhost:8443", 
		master:  ENV.SERVICE_MASTER_URL || "http://localhost:8080"
	},
		
	/**
	@cfg {Object} 
	@member TOTEM	
	Site context extended by the mysql derived query when service starts
	*/
	site: {  	// reserved for derived context vars		
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	Endpoint reqTypes cb(ack data as string || error)
	*/
	reqTypes: {  
		db: function (ack, req, res) {			
			req.sql.query("select found_rows()")
			.on('result', function (stat) {		// records sourced from sql				
				res({ 
					success: true,
					msg: "ok",
					count: stat["found_rows()"] || 0,
					data: ack
				});
			})
			.on("error", function () {  		// records sourced from virtual table
				res({ 
					success: true,
					msg: "ok",
					count: ack.length,
					data: ack
				});
			});
		},
		
		csv: function (ack, req, res) {
			JS2CSV({ 
				data: ack, 
				fields: Object.keys( ack[0]||{} )
			} , function (err,csv) {
					res( err || csv );
			});
		},
		
		"": function (ack,req,res) {
			res( ack );
		},
		
		json: function (ack,req,res) {
			res( ack );
		},
		
		xml: function (ack, req, res) {
			res( JS2XML.parse(req.table, {  
				count: ack.length,
				data: ack
			}) );
		}
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management
	*/				
	byTable: {				
		riddle: checkRiddle,
		task: runTask
	},
		
	/**
	@cfg {Object} 
	@member TOTEM	
	By-action endpoint routers for accessing engines
	*/				
	byAction: {
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-type endpoint routers  {type: method(req,res), ... } for accessing dataset readers
	*/				
	byType: {
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-area endpoint routers {area: method(req,res), ... } for sending/cacheing files
	*/		
	byArea: {	
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-action-table endpoint routers {action: {table: method(req,res), ...}, ... } for accessing virtual tables
	*/		
	byActionTable: {	
		select: {
			//user: selectUser
		},
		delete: {
			//user: deleteUser
		},
		update: {
			//user: updateUser
		},
		insert: {
			//user: insertUser
		},
		execute: {
			//user: executeUser
		}
	},
	
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Trust store extened with certs in the certs.truststore folder when the service starts in encrypted mode
	*/		
	trustStore: [ ],   //< reserved for trust store
		
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	CRUDE (req,res) method to respond to Totem request
	*/				
	server: null,  //< established by TOTEM at config
	
	//======================================
	// CRUDE interface
		
	/**
	@cfg {Function}
	@method select
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	select: selectDS,	
	/**
	@cfg {Function}	
	@method update
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	update: updateDS,
	/**
	@cfg {Function}	
	@method delete
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	delete: deleteDS,
	/**
	@cfg {Function}
	@method insert
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	insert: insertDS,
	/**
	@cfg {Function}
	@method execute
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	execute: executeDS,

	//======================================
		
	/**
	@cfg {Date} 
	@private
	@member TOTEM	
	totem start time
	*/		
	started: null, 		//< totem start time
		
	fetch: 	{	//< data fetching
		/**
		@cfg {Function} 
		@private
		@member TOTEM	
		Data fetcher method
		*/
		fetcher: fetchData,

		/**
		@cfg {Number} [retries=5]
		@member TOTEM	
		Maximum number of retries the data fetcher will user
		*/				
		retries: 5,			//< Maximum number of retries the data fetcher will user

		/**
		@cfg {Boolean} [trace=true]
		@member TOTEM	
		Enable/disable tracing of data fetchers
		*/		
		trace: true 		//< Enable/disable tracing of data fetchers
	},

	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Service protections when in guard mode
	*/
	faultless: false,  //< enable to use all defined guards
		
	guards:  {	// faults to trap 
		//SIGUSR1:1,
		//SIGTERM:1,
		//SIGINT:1,
		//SIGPIPE:1,
		//SIGHUP:1,
		//SIGBREAK:1,
		//SIGWINCH:1,
		//SIGKILL:1,
		//SIGSTOP:1 
	},	
	
	admitRules: {  // empty or null to disable rules
		// CN: "james brian d jamesbd",
		// O: "u.s. governement",
		// OU: ["nga", "dod"],
		// C: "us"
	},

	admitClient: function (req, profile, cb) { 
		/**
		@cfg {Object} 
		@member TOTEM
		Attaches the profile, group and a session metric log to this req request (cert,sql) with 
		callback cb(error) where error reflects testing of client cert and profile credentials.
		*/		
		function cpuavgutil() {				// compute average cpu utilization
			var avgUtil = 0;
			var cpus = OS.cpus();

			cpus.each(function (n,cpu) {
				idle = cpu.times.idle;
				busy = cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.user;
				avgUtil += busy / (busy + idle);
			});
			return avgUtil / cpus.length;
		}		

		function admit() {
			sql.query("show session status like 'Thread%'", function (err,stats) {  // attach session metric logs
				if (err)
					stats = [{Value:0},{Value:0},{Value:0},{Value:0}];

				req.log = new Object({  // add session metric logs to request
					Event: now,		 					// start time
					Action: req.action, 				// db action
					ThreadsRunning: stats[3].Value,		// sql threads running
					ThreadsConnected: stats[1].Value,	// sql threads connected
					Stamp: TOTEM.host.name,					// site name
					Util : cpuavgutil(),				// cpu utilization
					Fault: "isp"						// fault codes
					//Cores: site.Cores, 					// number of safety core hyperthreads
					//VMs: 1,								// number of VMs
					//Client: client, 				// client id
					//Table: req.table, 					// db target
					//RecID: req.query.ID || 0,			// sql recID
				});
				req.profile = new Object( profile );
				req.group = profile.Group;

				/*
					//org		: cert.subject.O || "guest",  // cert organization 
					//serverip: sock ? sock.address().address : "unknown",
					//onencrypted: CLUSTER.isWorker,  // flag
					//journal : true,				// journal db actions
					//email	: client, 			// email address from pki
					//profile	: new Object(profile),  // complete profile
					//group	: profile.Group, // || TOTEM.site.db, 
					//joined	: now, 				// time joined
					//client	: client			// client ID
				*/

				cb( null );
			});	
		}
		
		var 
			cert = req.cert,
			sql = req.sql,
			now = new Date(),
			errors = TOTEM.errors,
			rules = TOTEM.admitRules;

		if (cert) 
			if ( now < new Date(cert.valid_from) || now > new Date(cert.valid_to) )
				cb( errors.expiredCert );

			else
			if ( user = cert.subject || cert.issuer ) {
				for (var key in rules) 
					 if ( test = user[key] ) {
						if ( test.toLowerCase().indexOf( rule[key] ) < 0 ) 
							return cb( errors.rejectedClient );
					 }

					else
						return cb( errors.rejectedClient );

				if ( msg = profile.Banned)  // block client if banned
					cb( new Error( msg ) );

				else
					admit();
			}
		
			else
				cb( errors.rejectedClient );
		
		else
		if ( req.encrypted )
			cb( errors.rejectedClient );
		
		else 
			admit();
	},

	/**
	@cfg {Object}
	@member TOTEM	
	Default guest profile (unencrypted or client profile not found).  Null to bar guests.
	*/		
	guestProfile: {				//< null if guests are barred
		Banned: "",
		QoS: 10000,
		Credit: 100,
		Charge: 0,
		LikeUs: 0,
		Challenge: 1,
		Client: "guest@guest.org",
		User: "guest",
		Group: "app",
		IDs: "{}",
		Repoll: true,
		Retries: 5,
		Timeout: 30,
		Message: "Welcome guest - what is (riddle)?"
	},

	/**
	@cfg {Number} [riddles=0]
	@member TOTEM	
	Number of riddles to protect site (0 to disable anti-bot)
	*/		
	riddles: 0, 			
	
	riddle: [],  //< reserved for riddles
		
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Riddle digit-to-jpeg map (null to disable riddles)
	*/				
	riddleMap: { 					
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

	//proxy: proxyThread,  //< default relay if needed
	//workers: [],
		
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Default paths to service files
	*/		
	paths: { 			
		nourl: "/ping",
		
		url: {
			//fetch: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			//default: "/home",
			//resetpass: "/resetpass",
			wget: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			curl: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			http: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
			socketio: "/socket.io/socket.io.js",
			riddler: "/riddle"
		},
			
		certs: "./certs/", 
		
		mysql: {
			users: "SELECT 'user' AS Role, group_concat(DISTINCT dataset SEPARATOR ';') AS Contact FROM app.dblogs WHERE instr(dataset,'@')",
			derive: "SELECT * FROM openv.apps WHERE ? LIMIT 1",
			saveMetrics: "INSERT INTO app.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?, Event=?",
			search: "SELECT * FROM app.files HAVING Score > 0.1",
			//credit: "SELECT * FROM app.files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 1",
			getProfile: "SELECT * FROM openv.profiles WHERE ? LIMIT 1",
			newProfile: "INSERT INTO openv.profiles SET ?",
			getSession: "SELECT * FROM openv.sessions WHERE ? LIMIT 1",
			newSession: "INSERT INTO openv.sessions SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1",
			challenge: "SELECT * FROM openv.profiles WHERE least(?,1) LIMIT 1",
			guest: "SELECT * FROM openv.profiles WHERE Client='guest@guest.org' LIMIT 1",
			pocs: "SELECT lower(Hawk) AS Role, group_concat(DISTINCT Client SEPARATOR ';') AS Contact FROM openv.roles GROUP BY hawk"
		},
		
		nodes: {  // available nodes for task sharding
			0: ENV.SHARD0 || "http://localhost:8080/task",
			1: ENV.SHARD1 || "http://localhost:8080/task",
			2: ENV.SHARD2 || "http://localhost:8080/task",
			3: ENV.SHARD3 || "http://localhost:8080/task"
		},
			
		mime: { // default static file areas
			files: ".", // path to shared files 
			captcha: ".",  // path to antibot captchas
			index: { //< paths for allowed file indexers ("" to use url path)
				files: ""
			},
			extensions: {  // extend mime types as needed
			}
		}
	},

	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Error messages
	*/		
	errors: {
		pretty: function (err) { 
			return err+"";
		},
		badMethod: new Error("unsupported request method"),
		noProtocol: new Error("no protocol specified to fetch"),
		noRoute: new Error("no route"),
		badQuery: new Error("invalid query"),
		badGroup: new Error("invalid group requested"),
		lostConnection: new Error("client connection lost"),
		noDB: new Error("database unavailable"),
		noProfile: new Error("user profile could not be determined"),
		failedUser: new Error("failed modification of user profile"),
		missingPass: new Error("missing initial user password"),
		expiredCert: new Error("cert expired"),
		rejectedClient: new Error("client rejected - bad cert, profile or session"),
		tooBusy: new Error("too busy - try again later"),
		noFile: new Error("file not found"),
		noIndex: new Error("cannot index files here"),
		badType: new Error("no such dataset type"),
		badReturn: new Error("nothing returned"),
		noSockets: new Error("socket.io failed"),
		noService: new Error("no service  to start"),
		noData: new Error("no data returned"),
		retry: new Error("data fetch retries exceeded"),
		notAllowed: new Error("this endpoint is disabled"),
		noAccess: new Error("no access to master core at this endpoint")
	},

	/**
	@method 
	@cfg {Function}
	@member TOTEM	
 	File indexFile
	*/		
	indexFile: indexFile,

	/**
	@method 
	@cfg {Function}
	@member TOTEM	
 	Get a file and make it if it does not exist
	*/
	getFile: getFile,
		
	/**
	@cfg {Function}
	@method uploadFile
	@member TOTEM	
	File uploadFile 
	*/			
	uploadFile: uploadFile,
	
	/**
	@cfg {Number}
	@member TOTEM	
	Server toobusy check period in seconds
	*/		
	busycycle: 5000,  //< site too-busy check interval [ms] (0 disables)
			
	/**
	@cfg {Function}
	@private
	@member TOTEM	
	Sets the site context parameters available in TOTEM.site.
	*/		
	setContext: function (sql,cb) { 
		var 
			site = TOTEM.site,
			paths = TOTEM.paths,
			mysql = paths.mysql;
		
		site.pocs = {};
		site.distro = {};

		if (pocs = mysql.pocs) 
			sql.query(pocs)
			.on("result", function (poc) {
				site.pocs[poc.Role] = poc.Contact;
				site.distro[poc.Role] = poc.Role.link("mailto:"+poc.Contact);
			});

		if (users = mysql.users) 
			sql.query(users)
			.on("result", function (poc) {
				site.pocs[poc.Role] = poc.Contact;
				site.distro[poc.Role] = poc.Role.link("mailto:"+poc.Contact);				
			});
		
		if (guest = mysql.guest)
			sql.query(guest)
			.on("result", function (rec) {
				TOTEM.guestProfile = Copy(rec,{});
				delete TOTEM.guestProfile.ID;
			});

		if (derive = mysql.derive)  // derive site context vars
			sql.query(derive, {Nick:TOTEM.host.name})
			.on("result", function (opts) {
				Each(opts, function (key,val) {
					key = key.toLowerCase();
					site[key] = val;

					if ( (val||0).constructor == String)
						try {
							site[key] = JSON.parse( val );
						}
						catch (err) {
						}

					if (key in TOTEM) 
						TOTEM[key] = site[key];
				});
				
				if (cb) cb();
			});
		
		sql.query("SELECT count(ID) AS Fails FROM openv.aspreqts WHERE Status LIKE '%fail%'", [], function (err,asp) {
		sql.query("SELECT count(ID) AS Fails FROM openv.ispreqts WHERE Status LIKE '%fail%'", [], function (err,isp) {
		sql.query("SELECT count(ID) AS Fails FROM openv.swreqts WHERE Status LIKE '%fail%'", [], function (err,sw) {
		sql.query("SELECT count(ID) AS Fails FROM openv.hwreqts WHERE Status LIKE '%fail%'", [], function (err,hw) {

			site.warning = [
				site.warning || "",
				"ASP".fontcolor(asp[0].Fails ? "red" : "green").tag("a",{href:"/help?from=asp"}),
				"ISP".fontcolor(isp[0].Fails ? "red" : "green").tag("a",{href:"/help?from=isp"}),
				"SW".fontcolor(sw[0].Fails ? "red" : "green").tag("a",{href:"/help?from=swap"}),   // mails list of failed swapIDs (and link to all sw reqts) to swap PMO
				"HW".fontcolor(hw[0].Fails ? "red" : "green").tag("a",{href:"/help?from=pmo"})   // mails list of failed hw reqts (and link to all hw reqts) to pod lead
			].join(" ");

		});
		});
		});
		});
		
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	@private
	*/		
	cache: { 				//< cacheing options
		
		never: {	//< files to never cache - useful while debugging client side stuff
			"base.js": 1,
			"extjs.js": 1,
			"jquery.js":1,
			"flow.js":1,
			"dojo.js":1,
			"games.js":1,
			"capture.js":1,
			"jade": 1,
			"view": 1,
			"gif": 1
		},
		
		clients: {  // byType cache of clients area
			js: {},
			css: {},
			ico: {}
		},
		
		"socket.io": {  // byType cache of socketio area
			js: {}
		},
		
		learnedTables: true, 
		
		certs: {} 		// reserved for client crts (pfx, crt, and key reserved for server)
	}
	
};

/**
 * @class TOTEM
 **/

function selectDS(req,res) {	//< Default virtual table logic is real table
/**
 * @private
 * @method deleteDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	if (TOTEM.mysql)
		req.sql.query("SELECT * FROM ??.??", [req.group,req.table], function (err,data) {
			res(err || data);
		});
	
	else
		res(TOTEM.errors.noDB);
}

function updateDS(req,res) {
/**
 * @private
 * @method updateDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	//Log(req.table, TOTEM.byTable);
	
	if ( route = TOTEM.byTable[req.table] )
		route(req, res);
	
	else
		res( TOTEM.errors.noRoute );
}

function insertDS(req,res) {
/**
 * @private
 * @method insertDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.errors.notAllowed );
}

function deleteDS(req,res) {
/**
 * @private
 * @method deleteDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.errors.notAllowed );
}

function executeDS(req,res) {
/**
 * @private
 * @method executeDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.errors.notAllowed );
}

/**
 * @class TOTEM
 **/

function configService(opts,cb) {
/**
 * @private
 * @method configService
 * Configure JSDB, define site context, then protect, connect, start and initialize this server.
 * @param {Object} opts configuration options following the ENUM.Copy() conventions.
 * @param {Function} cb callback(err) after service configured
 * */

	//TOTEM.extend(opts);
	if (opts) Copy(opts, TOTEM, ".");
	
	var
		name  = TOTEM.host.name,
		paths = TOTEM.paths,
		site = TOTEM.site;

	Trace(`CONFIG ${name}`); 
	
	TOTEM.started = new Date();

	Copy(paths.mime.extensions, MIME.types);

	if (mysql = TOTEM.mysql) 
		JSDB.config({   // establish the db agnosticator 
			//emit: TOTEM.IO.sockets.emit,   // cant set socketio until server started

			fetcher: TOTEM.fetch.fetcher,
			
			mysql: Copy({ 
				opts: {
					host: mysql.host,   // hostname 
					user: mysql.user, 	// username
					password : mysql.pass,				// passphrase
					connectionLimit : mysql.sessions || 100, 		// max simultaneous connections
					//acquireTimeout : 10000, 			// connection acquire timer
					queueLimit: 100,  						// max concections to queue (0=unlimited)
					waitForConnections: true			// allow connection requests to be queued
				}
			}, mysql)
		}, function (err) {  // derive server vars and site context vars
		
			if (err)
				Trace(err);
			
			else
				JSDB.thread( function (sql) {
					Trace(`DERIVE ${name}`);

					for (var n in mysql)   // derive server paths
						if (n in paths) paths[n] = mysql[n];

					if (name)	// derive site context
						TOTEM.setContext(sql, function () {
							protectService(cb || function (err) {
								Trace(err || `STARTED ${name} ENCRYPTED`, sql);
							});
						});

					//TOTEM.dsAttrs = JSDB.dsAttrs;
					sql.release();
				});
		});	

	else
		protectService(cb || function (err) {
			Trace(err || `STARTED ${name} STANDALONE`);
		});
	
	return TOTEM;
}

function startService(server,cb) {
/**
 * @private
 * @method startService
 * Attach port listener to this server then initialize it.
 * @param {Object} server HTTP/HTTP server
 * @param {Function} cb callback(err) when started.
 * */
	
	var 
		name = TOTEM.host.name,
		site = TOTEM.site,
		onEncrypted = TOTEM.onEncrypted[CLUSTER.isMaster],
		paths = TOTEM.paths.mysql;
	
	Trace(`START ${name}`);
	
	TOTEM.server = server || { 	// define server
		listen: function () {
			Trace("NO SERVER");
		},
		on: function () {
			Trace("NO SERVER");
		}
	};
	
	if (server && name) {			// attach responder
		//server.on("connection", simThread);
		
		server.on("request", sesThread);
	}
	
	else
		return cb( TOTEM.errors.noService );

	//TOTEM.flush();  		// flush enum's config callback stack

	if ( onEncrypted && site.urls.socketio) {   // attach "/socket.io" with SIO and setup connection listeners
		var 
			guestProfile = TOTEM.guestProfile,
			IO = TOTEM.IO = new SIO(server, { // use defaults but can override ...
				//serveClient: true, // default true to prevent server from intercepting path
				//path: "/socket.io" // default get-url that the client-side connect issues on calling io()
			}),
			HUBIO = TOTEM.HUBIO = new (SIOHUB); 		//< Hub fixes socket.io+cluster bug	
			
		if (IO) { 							// Setup client web-socket support
			Trace("SOCKETS AT "+IO.path());

			JSDB.emit =	IO.sockets.emit;
			
			IO.on("connect", function (socket) {  // Trap every connect				
				//Trace("ALLOW SOCKETS");
				socket.on("select", function (req) { 		// Trap connect raised on client "select/join request"
					
					Trace(`CONNECTING ${req.client}`);
					sqlThread( function (sql) {	

						if (newSession = paths.newSession) 
							sql.query(newSession,  {
								Client	: req.client,
								Connects: 1,
								Location: "unknown", //req.location,
								//ipAddress: req.ip,
								Joined: new Date(),
								Message: req.message
							});

						if (challenge = paths.challenge)
							sql.query(challenge, {Client:req.client}, function (err,profs) {
								
								if ( profile = profs[0] )							 // || guestProfile(sql, req.client) 
									if ( profile.Challenge)
										challengeClient(req.client, profile);	
								
							});

						sql.release();
					});
				});
			});	

			/*
			IO.on("connect_error", function (err) {
				Log(err);
			});
			
			IO.on("disconnection", function (socket) {
				Log(">>DISCONNECT CLIENT");
			});	*/
			
			cb(null);
		}
		
		else 
			return cb( TOTEM.errors.noSockets );	
	}
	
	else
		cb(null);
		
	// The BUSY interface provides a mean to limit client connections that would lock the 
	// service (down deep in the tcp/icmp layer).  Busy thus helps to thwart denial of 
	// service attacks.  (Alas latest versions do not compile in latest NodeJS.)
	
	if (BUSY && TOTEM.busycycle) 
		BUSY.maxLag(TOTEM.busycycle);
	
	// listening on-routes message

	//Log(TOTEM.cores, TOTEM.doms, CLUSTER.isMaster, server);
	
	if (TOTEM.cores) 					// Start for master-workers
		if (CLUSTER.isMaster) {			// Establish master port
			server.listen( parseInt(TOTEM.doms.master.port), function() {  // Establish master  TOTEM.masterport
				Trace(`MASTER AT ${site.urls.master}`);
			});
			
			CLUSTER.on('exit', function(worker, code, signal) {
				Trace(`CORE${worker.id} TERMINATED ${code||"ok"}`);
			});

			CLUSTER.on('online', function(worker) {
				Trace(`CORE${worker.id} CONNECTED`);
			});
			
			for (var core = 0; core < TOTEM.cores; core++) {  
				worker = CLUSTER.fork();
				//Trace(`FORK core-${worker.id}`);
			}
		}
		
		else 								// Establish worker port			
			server.listen( TOTEM.doms.worker.port , function() {  //TOTEM.workerport
				Trace(`CORE${CLUSTER.worker.id} AT ${site.urls.worker}`);
			});
	
	else 								// Establish master-only
		server.listen( TOTEM.doms.master.port, function() {  //TOTEM.workerport
			Trace(`MASTER AT ${site.urls.master}`);
		});
			
	if ( TOTEM.faultless)  { // catch core faults
		process.on("uncaughtException", function (err) {
			Trace(`FAULTED ${err}`);
		});

		process.on("exit", function (code) {
			Trace(`HALTED ${code}`);
		});

		for (var signal in TOTEM.guards)
			process.on(signal, function () {
				Trace(`SIGNALED ${signal}`);
			});
	}

	if (TOTEM.riddles) initChallenger();
		
	sqlThread( function (sql) {
		if (CLUSTER.isMaster) initializeService(sql);
		TOTEM.init(sql);
		sql.release();
	});
	
}
		
function connectService(cb) {
/**
 * @private
 * @method connectService
 * If the TOTEM server already connected, inherit the server; otherwise define a suitable http interface (https if encrypted, 
 * http if unencrypted), then start and initialize the service.
 * @param {Function} cb callback(err) when connected
 * */
	
	var 
		host = TOTEM.host,
		name = host.name,
		paths = TOTEM.paths,
		certs = TOTEM.cache.certs,
		onEncrypted = TOTEM.onEncrypted[CLUSTER.isMaster],
		trustStore = TOTEM.trustStore,
		cert = certs.totem = {  // totem service certs
			pfx: FS.readFileSync(`${paths.certs}${name}.pfx`),
			key: FS.readFileSync(`${paths.certs}${name}.key`),
			crt: FS.readFileSync(`${paths.certs}${name}.crt`)
		};

	certs.fetch = { 		// data fetching certs
		pfx: FS.readFileSync(`${paths.certs}fetch.pfx`),
		key: FS.readFileSync(`${paths.certs}fetch.key`),
		crt: FS.readFileSync(`${paths.certs}fetch.crt`),
		ca: FS.readFileSync(`${paths.certs}fetch.ca`),			
		_pfx: `${paths.certs}fetch.pfx`,
		_crt: `${paths.certs}fetch.crt`,
		_key: `${paths.certs}fetch.key`,
		_ca: `${paths.certs}fetch.ca`,
		_pass: ENV.FETCH_PASS
	};
	
	//Log( TOTEM.onEncrypted, CLUSTER.isMaster, CLUSTER.isWorker );
	
	if ( onEncrypted ) {  
		try {  // build the trust strore
			Each( FS.readdirSync(paths.certs+"/truststore"), function (n,file) {
				if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
					Trace("TRUSTING "+file);
					trustStore.push( FS.readFileSync( `${paths.certs}truststore/${file}`, "utf8") );
				}
			});
		}
		
		catch (err) {
		}

		startService( HTTPS.createServer({
			passphrase: host.encrypt,		// passphrase for pfx
			pfx: cert.pfx,			// pfx/p12 encoded crt and key 
			ca: trustStore,				// list of TOTEM.paths authorities (trusted serrver.trust)
			crl: [],						// pki revocation list
			requestCert: true,
			rejectUnauthorized: true
			//secureProtocol: CONS.SSL_OP_NO_TLSv1_2
		}) , cb );
	}
	
	else 
		startService( HTTP.createServer(), cb );
}

function protectService(cb) {
/**
 * @private
 * @method protectService
 * Create the server's PKI certs (if they dont exist), setup site urls, then connect, start and initialize this service.  
 * @param {Function} cb callback(err) when protected
 * 
 * */
	
	var 
		host = TOTEM.host,
		name = host.name,
		paths = TOTEM.paths,
		sock = TOTEM.sockets ? paths.url.socketio : "", 
		urls = TOTEM.site.urls = TOTEM.cores   // establish site urls
			? {  
				socketio: sock,
				worker:  host.worker, 
				master:  host.master
			}
			: {
				socketio: sock,
				worker:  host.master,
				master:  host.master
			},
		doms = TOTEM.doms = {
			master: URL.parse(urls.master),
			worker: URL.parse(urls.worker)
		},
		pfx = `${paths.certs}${name}.pfx`,
		onEncrypted = TOTEM.onEncrypted = {
			true: doms.master.protocol == "https:",   //  at master 
			false: doms.worker.protocol == "https:"		// at worker
		};
	
	//Log(onEncrypted, doms);
	Trace( `PROTECTING ${name} USING ${pfx}` );
	
	if ( onEncrypted )   // derive a pfx cert if protecting an encrypted service
		FS.access( pfx, FS.F_OK, function (err) {

			if (err) 
				createCert(name,host.encrypt, function () {
					connectService(cb);
				});				
				
			else
				connectService(cb);

		});
	
	else 
		connectService(cb);
}

function stopService() {
/**
 * @private
 * @method stopService
 * Stop the server.
 * */
		
	var server = TOTEM.server;
			
	if (server)
		server.close(function () {
			Trace("STOPPED");
		});
}

function initializeService(sql) {
	
	var
		site = TOTEM.site;
	
	Trace([ // splash
		"HOSTING " + site.nick,
		"AT "+site.urls.master,
		"USING " + site.db ,
		"FROM " + process.cwd(),
		"WITH " + (site.urls.socketio||"NO")+" SOCKETS",
		"WITH " + (TOTEM.faultless?"GUARDED":"UNGUARDED")+" THREADS",
		"WITH "+ (TOTEM.riddles?"ANTIBOT":"NO ANTIBOT") + " PROTECTION",
		"WITH " + (site.sessions||"UNLIMITED")+" CONNECTIONS",
		"WITH " + (TOTEM.cores ? TOTEM.cores + " WORKERS AT "+site.urls.worker : "NO WORKERS")
	].join("\n- ")	);

	// clear system logs
	
	sql.query("DELETE FROM openv.syslogs");

	// initialize file watcher

	sql.query("UPDATE app.files SET State='watching' WHERE Area='uploads' AND State IS NULL");
	
	var watchMods = TOTEM.watchMods;

	Each(TOTEM.onFile, function (area, cb) {  // callback cb(sql,name,area) when file changed
		FS.readdir( area, function (err, files) {
			if (err) 
				Log(err);

			else
				files.each( function (n,file) {
					var first = file.charAt(0);
					
					if (first != "." && first != "_") 
						TOTEM.watchFile( area, file, cb );
				});
		});	
	});
	
	// start watch dogs
	
	Each( TOTEM.dogs, function (key, dog) {
		if ( dog.cycle ) {
			//Trace("DOGING "+key);
			dog.trace = TRACE+dog.name.toUpperCase();
			setInterval( function (args) {

				//Trace("DOG "+args.name);

				dog(dog);  // feed dog attributes as parameters

			}, dog.cycle*1e3, {
				name: key
			});
		}
	});	
}

/**
@class USER_MAINT legacy endpoints to manage users and their profiles.  Moved to FLEX.
 */

/*
function selectUser(req,res) {
/ **
@private
@method selectUser
Return user profile information
@param {Object} req Totem session request 
@param {Function} res Totem response
 * /
	
	var sql = req.sql, query = req.query || 1, isHawk = req.cert.isHawk;
			
	isHawk = 1;
	if (isHawk)
		Trace(sql.query(
			"SELECT * FROM openv.profiles WHERE least(?,1)", 
			[ query ], 
			function (err,users) {
				res( err || users );
		}).sql);

	else
		sql.query(
			"SELECT * FROM openv.profiles WHERE ? AND least(?,1)", 
			[ {client:req.client}, req.query ], 
			function (err,users) {
				res( err || users );
		});
}

function updateUser(req,res) {
/  **
@private
@method updateUser
Update user profile information
@param {Object} req Totem session request 
@param {Function} res Totem response
 * /
			
	var sql = req.sql, query = req.query, isHawk = req.cert.isHawk; 
	
	if (sql.query)
		if (isHawk) 
			// sql.context({users:{table:"openv.profile",where:{client:query.user},rec:query}});
			Trace(sql.query(
				"UPDATE openv.profiles SET ? WHERE ?", 
				[ query, {client:query.user} ], 
				function (err,info) {
					res( err || TOTEM.errors.failedUser );
			}).sql);
		
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
/ **
@private
@method deleteUser
Remove user profile.
@param {Object} req Totem session request 
@param {Function} res Totem response
 * /
			
	var sql = req.sql, query = req.query, isHawk = req.cert.isHawk;  

	if (query)
		if (isHawk)
			// sql.context({users:{table:"openv.profiles",where:[ {client:query.user}, req.query ],rec:res}});
			Trace(sql.query(
				"TEST FROM openv.profiles WHERE ? AND least(?,1)", 
				[ {client:query.user}, req.query ], 
				function (err,info) {
					res( err || TOTEM.errors.failedUser );
					
					// res should remove their files and other 
					// allocated resources
			}).sql);

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
/ **
@private
@method insertUser
Create user profile, associated certs and distribute info to user
@param {Object} req Totem session request 
@param {Function} res Totem response
 * /
			
	var sql = req.sql, query = req.query || {}, isHawk = req.cert.isHawk, url = TOTEM.paths.url;
	
	if (req.cert.isHawk)
		if (query.pass)
			sql.query(
				"SELECT * FROM openv.profiles WHERE Requested AND NOT Approved AND least(?,1)", 
				query.user ? {User: query.user} : 1 )
				
			.on("result", function (user) {
				var init = Copy({	
					Approved: new Date(),
					Banned: url.resetpass
						? "Please "+"reset your password".tag("a", {href:url.resetpass})+" to access"
						: "",

					Client: user.User,					
					QoS: 0,

					Message:

`Greetings from ${site.Nick.tag("a",{href:site.urls.master})}-

Admin:
	Please create an AWS EC2 account for ${owner} using attached cert.

To connect to ${site.Nick} from Windows:

1. Establish gateway using 

		Putty | SSH | Tunnels
		
	with the following LocalPort, RemotePort map:
	
		5001, ${site.urls.master}:22
		5100, ${site.urls.master}:3389
		5200, ${site.urls.master}:8080
		5910, ${site.urls.master}:5910
		5555, Dynamic
	
	and, for convienience:

		Pageant | Add Keys | your private ppk cert

2. Start a ${site.Nick} session using one of these methods:

	${Putty} | Session | Host Name = localhost:5001 
	Remote Desktop Connect| Computer = localhost:5100 
	${FF} | Options | Network | Settings | Manual Proxy | Socks Host = localhost, Port = 5555, Socks = v5 `

.replace(/\n/g,"<br>")					
					
				}, Copy(TOTEM.guestProfile,{}) );

				sql.query(
					"UPDATE openv.profiles SET ? WHERE ?",
					[ init, {User: user.User} ],
					function (err) {
						
						createCert(user.User, pass, function () {

							Trace(`CREATE CERT FOR ${user.User}`, sql);
							
							CP.exec(
								`sudo adduser ${user.User} -gid ${user.Group}; sudo id ${user.User}`,
								function (err,out) {
									
									sql.query(
										"UPDATE openv.profiles SET ? WHERE ?",
										[ {uid: out}, {User:user.User} ]
									);

									Log( err 
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

function executeUser(req,res) {	
/ **
@private
@method executeUser
Fetch user profile for processing
@param {Object} req Totem session request 
@param {Function} res Totem response
 * /
	var 
		access = TOTEM.user,
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
*/

/**
@class PKI_CERTS utilities to create and manage PKI certs
 */

function createCert(owner,pass,cb) { 
/**
@private
@method createCert
Create a cert for the desired owner with the desired passphrase then callback cb() when complete.
@param {String} owner userID to own this cert
@param {String} password for this cert
@param {Function} cb callback when completed
*/

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

	var 
		paths = TOTEM.paths,
		name = `${paths.certs}${owner}`, 
		truststore = `${paths.certs}truststore`,
		pfx = name + ".pfx",
		key = name + ".key",
		crt = name + ".crt",
		ppk = name + ".ppk";
		
	Trace( "CREATE SELF-SIGNED SERVER CERT FOR "+owner );			
	
	traceExecute(
		`echo -e "\n\n\n\n\n\n\n" | openssl req -x509 -nodes -days 5000 -newkey rsa:2048 -keyout ${key} -out ${crt}`, 
		function () { 
		
	traceExecute(
		`export PASS="${pass}";openssl pkcs12 -export -in ${crt} -inkey ${key} -out ${pfx} -passout env:PASS`, 
		function () {
		
	traceExecute(
		`cp ${crt} ${truststore}`,
		function () {
			
	traceExecute(
		`puttygen ${owner}.key -N ${pass} -o ${ppk}`, 	
		function () {
		
		Trace("IGNORE PUTTYGEN ERRORS IF NOT INSTALLED"); 
		cb();
	});
	});
	});
	});

}

function validateClient(req,res) {  
/**
@private
@method validateClient
@param {Object} req totem request
@param {Function} res totem response

Attaches log, profile, group, client, cert and joined info to this req request (sql, reqSocket) with callback res(error) where
error is null if session is admitted by admitClient.  
*/
	
	function getCert(sock) {  //< Return cert for https/http connection on this socket (w or w/o proxy).
		var 
			cert =  sock ? sock.getPeerCertificate ? sock.getPeerCertificate() : null : null;		
		
		if (TOTEM.behindProxy) {  // update cert with originating cert info that was placed in header
			var 
				cert = new Object(cert),  // clone so we can modify
				NA = Req.headers.ssl_client_notafter,
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

			if ( CN = cert.subject.CN ) {
				CN = CN.split(" ");
				cert.subject.CN = CN[CN.length-1] + "@lost.org";
			}
		}
		
		return cert;
	}
				
	var 
		sql = req.sql,
		cert = req.encrypted ? getCert( req.reqSocket ) : null,
		certs = TOTEM.cache.certs,
		guest = "guest@guest.org",
		paths = TOTEM.paths.mysql,
		errors = TOTEM.errors,
		admitClient = TOTEM.admitClient;
	
	req.cert = certs[req.client] = cert ? new Object(cert) : null;
	req.joined = new Date();
	req.client = cert 
		? (cert.subject.emailAddress || cert.subjectaltname || cert.subject.CN || guest).split(",")[0].replace("email:","")
		: guest;

	if (TOTEM.mysql)  // derive client's profile from db
		sql.query(paths.getProfile, {client: req.client}, function (err,profs) {
			
			if ( profile = profs[0] || makeGuest(sql, req.client) ) 
				admitClient(req, profile, res);
			
			else
				res( errors.rejectedClient );
					
		});
	
	else 
	if ( req.encrypted )  // db required on encrypted service
		res( errors.noDB );

	else
	if ( profile = makeGuest(sql, req.client) )  { // guests allowed
		//req.socket = null;
		req.reqSocket = null;   // disable guest session metrics
		admitClient(req, profile, res);	
	}
	
	else
		res( errors.rejectedClient );
}

/**
@class FILE_ACCESS file cacheing, indexing and uploading
 */

function indexFile(path,cb) {	
/**
@private
@method indexFile
@param {String} path file path
@param {Function} cb totem response
*/
	var 
		files = [],
		maxIndex = TOTEM.maxIndex;
	
	findFile(path, function (file) {
		if ( files.length < maxIndex)
			files.push( (file.indexOf(".")<0) ? file+"/" : file );
	});
	
	cb( files );
}	

function findFile(path,cb) {
/**
@private
@method findFile
@param {String} path file path
@param {Function} cb totem response
*/
	try {
		FS.readdirSync(path).forEach( function (file) {
			if (file.charAt(0) != "_" && file.charAt(file.length-1) != "~") 
				cb(file);
		});
	}
	catch (err) {
	}	
}

function getFile(client, filepath, cb) {  
/**
@private
@method getFile
@param {String} client file owner to make new files
@param {String} filepath path to the file
@param {Function} cb callback(area, fileID, sql) if no errors
Access (create if needed) a file then callback cb(area, fileID, sql) if no errors
*/
	
	var
		parts = filepath.split("/"),
		name = parts.pop() || "",
		area = parts[0] || "";

	JSDB.forFirst( 
		"FILE", 
		"SELECT ID FROM app.files WHERE least(?,1) LIMIT 1", {
			Name: name,
			//Client: client,
			Area: area
		}, 
		function (file, sql) {

		if ( file )
			cb( area, file.ID, sql );

		else
			sql.forAll( 
				"FILE", 
				"INSERT INTO app.files SET _State_Added=now(), ?", {
					Name: name,
					Client: client,
					Path: filepath,
					Area: area
				}, 
				function (info) {
					cb( area, info.insertId, sql );
			});

	});
}

function uploadFile( client, srcStream, sinkPath, tags, cb ) { 
/**
@private
@method uploadFile
@param {String} client file owner
@param {Stream} source stream
@param {String} sinkPath path to target file
@param {Object} tags hach of tags to add to file
@param {Function} cb callback(fileID) if no errors encountered
*/
	getFile(client, sinkPath, function (area, fileID, sql) {
		var 
			folder = TOTEM.paths.mime[area],
			sinkStream = FS.createWriteStream( folder + "/" + sinkPath, "utf8")
				.on("finish", function() {  // establish sink stream for export pipe

					Log("totem done uploading");
					sqlThread( function (sql) {

						sql.query("UPDATE apps.files SET ? WHERE ?", [{
							_Ingest_Tag: JSON.stringify(tags || null),
							_State_Notes: "Please go " + "here".tag("a", {href:"/files.view"}) + " to manage your holdings."
						}, {ID: fileID} ] );
						
						sql.release();
					});
				})
				.on("error", function (err) {
					Log("totem upload error", err);
					sqlThread( function (sql) {
						sql.query("UPDATE app.files SET ? WHERE ?", [ {
							_State_Notes: "Upload failed: " + err 
						}, {ID: fileID} ] );

						sql.release();
					});
				});

		Log("uploading to", folder, sinkPath);

		if (cb) cb(fileID);  // callback if provided
		
		if (srcStream)   // if a source stream was provided, start pipe to copy source to sink
			srcStream.pipe(sinkStream);  
	});

}

/**
@class DATA_FETCHING methods to pull external data from other services
 */

function fetchData(path, query, body, cb) {
	
	function retry(cmd,opts,cb) {

		function trycmd(cmd,cb) {

			if (TOTEM.fetch.trace)
				Trace(`TRY[${opts.retry}] ${cmd}`);

			CP.exec(cmd, function (err,stdout,stderr) {
				if (err) {
					if (opts.retry) {
						opts.retry--;

						trycmd(cmd,cb);
					}
					else
						cb( TOTEM.errors.retry );
				}
				else
				if (cb) cb(null, stdout);
			});
		}

		opts.retry = TOTEM.fetch.retries;

		if (opts.retry) 
			trycmd(cmd,cb);
		
		else
			CP.exec(cmd, function (err,stdout,stderr) {			
				cb( err , stdout );
			});
	}

	function getResponse(Res) {
		var body = "";
		Res.on("data", function (chunk) {
			body += chunk.toString();
		});

		Res.on("end", function () {
			try {
				cb( JSON.parse(body) );
			}
			catch (err) {
				cb( body );
			}
		});
	}

	var 
		url = query ? path.parseJS( Copy(query, {
			degs: (dd) => Math.floor(dd),
			mins: (dd) => Math.floor( (dd - Math.floor(dd))*60 )
		})) : path,
		opts = URL.parse(url),
		protocol = opts.protocol || "",
		cert = TOTEM.cache.certs.fetch;

	opts.retry = TOTEM.retries;
	opts.rejectUnauthorized = false;
	opts.agent = false;
	opts.method = body ? "PUT" : "GET";
	opts.port = opts.port ||  (protocol.endsWith("s:") ? 443 : 80);
	// opts.cipher = " ... "
	// opts.headers = { ... }
	// opts.Cookie = ["x=y", ...]
	/*if (opts.soap) {
		opts.headers = {
			"Content-Type": "application/soap+xml; charset=utf8",
			"Content-Length": opts.soap.length
		};
		opts.method = "POST";
	}*/
	
	//Log(opts,url);
	Trace("FETCH "+url);
		
	switch (protocol) {
		case "curl:": 
			retry(
				`curl ` + url.replace(protocol, "http:"),
				opts, 
				function (err,out) {
					try {
						cb( JSON.parse(out) );
					}
					catch (err) {
						cb( out );
					}
			});	
			break;
			
		case "curls":
			retry(
				`curl -gk --cert ${cert._crt}:${cert._pass} --key ${cert._key} --cacert ${cert._ca}` + url.replace(protocol, "https:"),
				opts, 
				function (err,out) {
					try {
						cb( JSON.parse(out) );
					}
					catch (err) {
						cb( out );
					}
			});	
			break;
			
		case "wget:":
			var 
				parts = url.split(" >> "),
				url = parts[0],
				out = parts[1] || "./temps/wget.jpg";
	
			retry(
				`wget -O ${out} ` + url.replace(protocol, "http:"),
				opts, 
				function (err) {
					cb( err ? null : "ok" );
			});
			break;
			
		case "wgets:":
			var 
				parts = url.split(" >> "),
				url = parts[0],
				out = parts[1] || "./temps/wget.jpg";
	
			retry(
				`wget -O ${out} --no-check-certificate --certificate ${cert._crt} --private-key ${cert._key} ` + url.replace(protocol, "https:"),
				opts, 
				function (err) {
					cb( err ? null : "ok" );
			});
			break;

		case "http:":
			var Req = HTTP.request(opts, getResponse);
			Req.on('error', function(err) {
				Log(err);
				cb( null );
			});
			//Log("http", opts, body);
			
			if ( body )
				Req.write( JSON.stringify(body) );  // body parms

			Req.end();
			break;

		case "https:":
			opts.pfx = cert.pfx;
			opts.passphrase = cert._pass;
			
			var Req = HTTPS.request(opts, getResponse);
			Req.on('error', function(err) {
				Log(err);
				cb( null );
			});

			if ( body )
				Req.write( JSON.stringify( body ) );  // body parms

			Req.end();
			break;
			
		default: 
			cb(null);
	}
}

/**
@class ANTIBOT data theft protection
 */

function checkRiddle(req,res) {	//< endpoint to check clients response to a riddle
/**
@private
@method checkRiddle
Endpoint to check clients response req.query to a riddle created by challengeClient.
@param {Object} req Totem session request
@param {Function} res Totem response callback
*/
	var 
		query = req.query,
		sql = req.sql;
		
	if (query.ID)
		sql.query("SELECT * FROM openv.riddles WHERE ? LIMIT 1", {Client:query.ID}, function (err,rids) {
			
			if ( rid = rids[0] ) {
				var 
					ID = {Client:rid.ID},
					guess = (query.guess+"").replace(/ /g,"");

				Log([rid,query]);

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
				
			}
			
			else
				res( TOTEM.errors.notAllowed  );

		});
	
	else
		res( TOTEM.errors.notAllowed );
}

function initChallenger() {
/**
@private
@method initChallenger
Create a set of TOTEM.riddles challenges.
*/
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
	
	var 
		riddle = TOTEM.riddle,
		N = TOTEM.riddles,
		map = TOTEM.riddleMap,
		ref = "/captcha";
	
	for (var n=0; n<N; n++) 
		riddle.push( Riddle(map,ref) );
}

function makeRiddles(msg,rid,ids) { //< turn msg with riddle markdown into a riddle
/**
@private
@method checkRiddle
Endpoint to check clients response req.query to a riddle created by challengeClient.
@param {String} msg riddle mask contianing (riddle), (yesno), (ids), (rand), (card), (bio) keys
@param {Array} rid List of riddles returned
@param {Object} ids Hash of {id: value, ...} replaced by (ids) key
*/
	var 
		riddles = TOTEM.riddle,
		N = riddles.length;
	
	if (N)
		return msg
			.replace(/\(riddle\)/g, (pat) => {
				var QA = riddles[Math.floor( Math.random() * N )];
				rid.push( QA.A );
				return QA.Q;
			})
			.replace(/\(yesno\)/g, (pat) => {
				var QA = riddles[Math.floor( Math.random() * N )];
				rid.push( QA.A );
				return QA.Q;
			})
			.replace(/\(ids\)/g, (pat) => {
				var rtn = [];
				Each(ids, function (key, val) {
					rtn.push( key );
					rid.push( val );
				});
				return rtn.join(", ");
			})
			.replace(/\(rand\)/g, (pat) => {
				rid.push( Math.floor(Math.random()*10) );
				return "random integer between 0 and 9";		
			})
			.replace(/\(card\)/g, (pat) => {
				return "cac card challenge TBD";
			})
			.replace(/\(bio\)/g, (pat) => {
			return "bio challenge TBD";
		});
	
	else
		return msg;
}

function challengeClient(client, profile) { //< create a challenge and rely it to the client
/**
@private
@method challengeClient
Challenge a client with specified profile parameters
@param {String} client being challenged
@param {Object} profile with a .Message riddle mask and a .IDs = {key:value, ...}
*/
	var 
		rid = [],
		reply = (TOTEM.riddleMap && TOTEM.riddles)
				? makeRiddles( profile.Message, rid, (profile.IDs||"").parseJSON({}) )
				: profile.Message;

	if (reply && TOTEM.IO) 
		sqlThread( function (sql) {
			sql.query("REPLACE INTO openv.riddles SET ?", {
				Riddle: rid.join(",").replace(/ /g,""),
				Client: client,
				Made: new Date(),
				Attempts: 0,
				maxAttempts: profile.Retries
			}, function (err,info) {

				TOTEM.IO.emit("select", {
					message: reply,
					riddles: rid.length,
					rejected: false,
					retries: profile.Retries,
					timeout: profile.Timeout,
					ID: client, //info.insertId,
					callback: TOTEM.paths.url.riddler
				});

				sql.release();
			});
		});
}

/**
@class ENDPOINT_ROUTING methods to route notes byType, byAction, byTable, byActionTable, byArea.
*/

function parseNode(req) {
/**
@private
@method parseNode
Parse node request req.node = /TABLE?QUERY&INDEX || /FILEAREA/FILENAME to define 
the req .table, .path, .filearea, .filename, .type and the req .query, .index, .joins and .flags.
@param {Object} req Totem session request
*/
	var
		node = URL.parse( req.node ),
		path = req.path = node.path || "",
		areas = node.pathname.split("/"),
		file = req.filename = areas.pop() || "", //(areas[1] ? "" : TOTEM.paths.default),
		parts = req.parts = file.split("."),
		table = req.table = parts[0] || "",
		type = req.type = parts[1] || "",
		area = req.filearea = areas[1] || "",
		query = req.query = {},
		index = req.index = {},	
		site = req.site = TOTEM.site,
		joins = req.joins = {},
		flags = req.flags = {},
		src = node.path.parsePath(query,index,query);
	
	//Log(">>>>>", src, ">>>>", query);
	
	if ( req.filepath = req.filearea ? TOTEM.paths.mime[req.filearea] || req.filearea : "" ) 
		req.filepath += node.pathname;

	else {
		req.filearea = "";

		var 
			reqFlags = TOTEM.reqFlags,
			strips = reqFlags.strips,
			prefix = reqFlags.prefix,
			traps = reqFlags.traps,
			id = reqFlags.id,
			body = req.body;

		/*
		Log({before: {
			a: req.action,
			q: query,
			b: body,
			f: flags
		}}); */

		for (var n in query) 		// strip bogus query parameters 
			if ( n in strips )
				delete query[n];

			else
			if (n.charAt(0) == prefix) {  	// remap flag
				flags[n.substr(1)] = query[n];
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

		if (traps)
			for (var n in traps) 		// traps remap query-flag parms
				if ( flags[n] )
					traps[n](req);

		/*
		Log({after: {
			a: req.action,
			q: query,
			b: body,
			f: flags
		}}); */
	}
}						

function syncNodes(nodes, acks, req, res) {
/**
@private
@method syncNodes
@param {Array} nodes
@param {Object} acks
@param {Object} req Totem session request
@param {Function} res Totem response callback
Submit nodes=[/dataset.type, /dataset.type ...]  on the current request thread req to the routeNode() 
method, aggregate results, then send with supplied response().
*/
	
	if ( node = req.node = nodes.pop() )  	// grab last node
		routeNode( req, function (ack) { 	// route it and intercept its ack
			acks[req.table] = ack;
			syncNodes( nodes, acks, Copy(req,{}), res );
		});

	else
	if (nodes.length) 	// still more nodes
		syncNodes( nodes, acks, Copy(req,{}), res );
	
	else  				// no more nodes
		res(acks);
}

function routeNode(req, res) {
/**
@private
@method routeNode
@param {Object} req Totem session request
@param {Function} res Totem response callback

Parse the node=/dataset.type on the current req thread, then route it to the approprate TOTEM byArea, 
byType, byActionTable, engine or file indexFile (see config documentation).
*/
	
	parseNode(req);

	function sendFile(req,res) {
		//Log("send file", req.filepath);
		res( function () {return req.filepath; } );
	}

	function followRoute(route,req,res) {
	/**
	@private
	@method followRoute
	@param {Function} route method endpoint to process session 
	@param {Object} req Totem session request
	@param {Function} res Totem response callback

	Log session metrics, trace the current route, then callback route on the supplied 
	request-response thread
	*/

		function logMetrics(sock) { //< log session metrics 
			if ( saveMetrics=TOTEM.paths.mysql.saveMetrics ) {
				var log = req.log;

				sock._started = new Date();

				/*
				If maxlisteners is not set to infinity=0, the connection becomes sensitive to a sql 
				connector t/o and there will be random memory leak warnings.
				*/

				sock.setMaxListeners(0);
				sock.on('close', function () { 		// cb when connection closed
					var 
						secs = sock._started ? ((new Date()).getTime() - sock._started.getTime()) / 1000 : 0,
						bytes = sock.bytesWritten,
						log = req.log;

					sqlThread( function (sql) {

						if (false)  // grainular track
							sql.query(saveMetrics, [ Copy(log, {
								Delay: secs,
								Transfer: bytes,
								Event: sock._started,
								Dataset: req.table,
								Client: rec.client,
								Actions: 1
							}), bytes, secs, log.Event  ]);

						else { // bucket track
							sql.query(saveMetrics, [ Copy(log, {
								Delay: secs,
								Transfer: bytes,
								Event: sock._started,
								Dataset: req.table,
								Actions: 1
							}), bytes, secs, log.Event  ]);

							sql.query(saveMetrics, [ Copy(log, {
								Delay: secs,
								Transfer: bytes,
								Event: sock._started,
								Dataset: req.client,
								Actions: 1
							}), bytes, secs, log.Event  ]);
						}

						sql.release();

					});
				});

			}
		}

		if ( !req.filepath && req.encrypted )   // dont log file requests
			if ( sock = req.reqSocket )  // dont log http request // req.socket
				logMetrics( sock );  

		var myid = CLUSTER.isMaster ? 0 : CLUSTER.worker.id;

		Trace( 
			(route?route.name:"null").toUpperCase() 
			+ ` ${req.filename} FOR ${req.client} ON CORE${myid}.${req.group}`, req.sql);

		route(req, res);

		/*
		if ( CLUSTER.isWorker || !TOTEM.cores ) {
		}
		else
		if (route.name == "simThread")
			route(req,res);

		else
			res(TOTEM.errors.noAccess);
		*/
	}

	var
		sql = req.sql,
		node = req.node,
		table = req.table,
		type = req.type,
		action = req.action,
		area = req.filearea,
		paths = TOTEM.paths;

	//Log([action,req.filepath,area,table,type]);
	
	if (req.filepath && ( route = TOTEM.byArea[area] || sendFile ) )
		followRoute( route, req, res );

	else
	if ( route = TOTEM.byType[type] ) 
		followRoute(route,req,res);
	
	else
	if ( route = TOTEM.byActionTable[action][table])
		followRoute(route,req,res);
	
	else
	if ( route = TOTEM.byTable[table] ) 
		followRoute(route,req,res);
	
	else  // attempt to route to engines then to database
	if ( route = TOTEM.byAction[action] ) 
		route(req, function (ack) { 
			//Log({engroute: ack});
			
			if (ack)
				res( ack );
				
			else
				if ( route = TOTEM[action] ) 
					if ( TOTEM.cache.learnedTables )
						followRoute( TOTEM.byActionTable[action][table] = route,req,res);
			
					else
						followRoute( route,req,res);

				else 
					res( TOTEM.errors.noRoute );
		});	
	
	else
	if ( route = TOTEM[action] )
		followRoute(route,req,res);

	else 
		res( TOTEM.errors.noRoute );
}

/**
@class THREAD_PROCESSING sql and session thread processing
*/

function sesThread(Req,Res) {	
/**
@method sesThread
@param {Object} Req http/https request
@param {Object} Res http/https response

Created a HTTP/HTTPS request-repsonse session thread.  UsesTOTEM's byTable, byArea, byType, byActionTable to
route this thread to the appropriate (req,res)-endpoint, where the newly formed request req contains

		method: "GET, ... " 		// http method and its ...
		action: "select, ...",		// corresponding crude name
		socketio: "path"  // filepath to client's socketio.js
		query: {...}, 		// query ke-value parms from url
		body: {...},		// body key-value parms from request body
		flags: {...}, 		// _flags key-value parms parsed from url
		index: {...}		// x:EXPR indecies from url
		joins: {...}, 		// from.to dataset joins from url
		files: [...] 		// files uploaded
		site: {...}			// skinning context keys
		sql: connector 		// sql database connector (dummy if no mysql config)
		url	: "url"				// complete "/area/.../name.type?query" url
		search: "query"		// query part
		path: "/..."			// path part 
		filearea: "area"		// area part
		filename: "name"	// name part
		type: "type" 			// type part 
		connection: socket		// http/https socket to retrieve client cert 

The newly form response res method accepts a string, an objects, an array, an error, or a file-cache function
to appropriately respond and close this thread and its sql connection.  The session is validated and logged, and 
the client is challenged as necessary.
 */
	
	// Session terminating functions to respond with a string, file, db structure, or error message.
	
	function sendString( data ) {  // Send string
		Res.end( data );
		Req.req.sql.release();
	}
		
	function sendFileIndex( head, files ) {  // Send list of files under specified folder
		
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
	
	function sendCache(path,file,type,area) { // Cache and send file to client
		
		var 
			//mime = MIME[type] || MIME.html  || "text/plain",
			paths = TOTEM.paths;
			index = paths.mime.index;
		
		//Trace(`SENDING ${path} AS ${mime} ${file} ${type} ${area}`);
		
		if (type) {  // cache and send file
				
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
					sendError( TOTEM.errors.noFile );
				}
		}
		
		else
		if ( area in index )  // index files
			TOTEM.indexFile( index[area] || path, function (files) { 
				sendFileIndex(`Index of ${path}`, files);
			});
		
		else
			sendError( TOTEM.errors.noIndex );
		
	}		

	function sendError(err) {  // Send pretty error message
		Res.end( TOTEM.errors.pretty(err) );
		Req.req.sql.release();
	}

	function sendRecords(ack, req, res) {  // Send records via converter
		var 
			reqTypes = TOTEM.reqTypes,
			errors = TOTEM.errors;
		
		if (ack)
			if ( conv = reqTypes[req.type] )
				conv(ack, req, function (rtn) {
					
					if (rtn) 
						switch (rtn.constructor) {
							case Error:
								sendError( rtn );
								break;

							case String:
								sendString( rtn );
								break;

							case Array:
							case Object:
							default:
								try {
									sendString( JSON.stringify(rtn) );
								}
								catch (err) {
									sendErrror( errors.noData );
								}
						} 
					
					else
						sendError( errors.noData );
				});

			else 
				sendError( errors.badType );
		
		else
			sendErrror( errors.noData ); 
	}
	
	function res(ack) {  // Session response callback
		
		var
			req = Req.req,
			sql = req.sql,
			errors = TOTEM.errors,
			mime = ( (ack||0).constructor == Error) 
				? MIME.types.html
				: MIME.types[req.type] || MIME.types.html || "text/plain",
			paths = TOTEM.paths;

		Res.setHeader("Content-Type", mime);
		Res.statusCode = 200;
		
		if (ack)
			switch (ack.constructor) {  // send ack based on its type
				case Error: 			// send error message
					
					switch (req.type) {
						case "db":  
							sendString( JSON.stringify({ 
								success: false,
								msg: ack+"",
								count: 0,
								data: []
							}) );
							break;
							
						default:
							sendError( ack );
					}
					break;
				
				case Function: 			// send file via search or direct
				
					if ( (search = req.query.search) && paths.mysql.search) 		// search for file via nlp/etc
						sql.query(paths.mysql.search, {FullSearch:search}, function (err, files) {
							
							if (err) 
								sendError( errors.noFile );
								
							else
								sendError( errors.noFile );  // reserved functionality
								
						});
					
					else {			
						if ( credit = paths.mysql.credit)  // credit/charge client when file pulled from file system
							sql.query( credit, {Name:req.node,Area:req.filearea} )
							.on("result", function (file) {
								if (file.Client != req.client)
									sql.query("UPDATE openv.profiles SET Credit=Credit+1 WHERE ?",{Client: file.Client});
							});

						sendCache( ack(), req.filename, req.type, req.filearea );
					}
				
					break;
					
				case Array: 			// send data records 

					var flag = TOTEM.reqFlags;
					
					if ( req.flags.blog )   // blog back selected keys
						flag.blog( ack, req, function (recs) {
							sendRecords(recs,req,res);
						});

					else
					if ( req.flags.encap )   // encap selected keys
						flag.encap( ack, req, function (recs) {
							sendRecords(recs,req,res);
						});
						
					else
						sendRecords(ack,req,res);
					
					break;

				case String:  			// send message
					sendString(ack);
					break;
			
				case Object:
				default: 					// send data record
					sendRecords([ack],req,res);
					break;
			
			}

		else
			sendError( errors.noData );
	}

	function getBody( cb ) { // Feed body and file parameters to callback

		var body = ""; 
		
		Req
		.on("data", function (chunk) {
			body += chunk.toString();
		})
		.on("end", function () {
			if (body)
				cb( body.parseJSON( function () {  // yank files if body not json
					
					var files = [], parms = {};
					
					body.split("\r\n").each( function (n,line) {
						if (line) 
							if (parms.type) {  // type was defined so have the file data
								files.push( Copy(parms,{data: line, size: line.length}) );
								parms = {};
							}
							else {
								//Trace("LOAD "+line);

								line.split(";").each(function (n,arg) {  // process one file at a time

									var tok = arg
										.replace("Content-Disposition: ","disposition=")
										.replace("Content-Type: ","type=")
										.split("="), 

										val = tok.pop(), 
										key = tok.pop();

									if (key)
										parms[key.replace(/ /g,"")] = val.replace(/"/g,"");

								});
							}
					});

//Log(files);
					return {files: files};
				}) );
			
			else
				cb( {} );
		});
	}
		
	function startSession( cb ) { //< callback cb() if not combating denial of service attacks
	/**
	@private
	@method startSession
	Start session and protect from denial of service attacks.
	@param {Function} callback() when completed
	*/
		
		if (BUSY && (busy = TOTEM.errors.tooBusy) )	
			if ( BUSY() )
				return Res.end( TOTEM.errors.pretty( busy ) );
		
		switch ( Req.method ) {
			case "PUT":
			case "GET":
			case "POST":
			case "DELETE":
				return cb();
				
			case "OPTIONS":  // client making cross-domain call - must respond with what are valid methods
				//Req.method = Req.headers["access-control-request-method"];
				Res.writeHead(200, {
					"access-control-allow-origin": "*", 
					"access-control-allow-methods": "POST, GET, DELETE, PUT, OPTIONS"
				});
				Res.end();

				/*res.header = function () {
					Res.writeHead(200);
					Res.socket.write(Res._header);
					Res.socket.write(Res._header);
					Res._headerSent = true;
				}; */
				
				break;
				
			default:
				Res.end( TOTEM.errors.pretty(TOTEM.errors.badMethod) );
		}
		
	}
	
	function conThread(req, res) {  
	/**
	 @private
	 @method conThread
	 Start a session by attaching sql, cert, client, profile and session info to this request req with callback res(error).  
	 @param {Object} req request
	 @param {Function} res response
	 * */
		var 
			errors = TOTEM.errors,
			paths = TOTEM.paths.mysql;
		
		if (sock = req.reqSocket )
			if (TOTEM.mysql)  // running with database so attach a sql connection 
				sqlThread( function (sql) {
					req.sql = sql;

					validateClient(req, function (err) {
						if (err)
							res(err);

						else 
						if ( getSession = paths.getSession )
							sql.query(getSession, {Client: req.client}, function (err,ses) {

								if ( err )
									return res(err);

								req.session = new Object( ses[0] || {
									Client: "guest@guest.org",
									Connects: 1,
									//ipAddress : "unknown",
									Location: "unknown",
									Joined: new Date()
								});

								res(null);
							});
						
						else {  // using dummy sessions
							req.session = {};
							res( null );
						}
					});
				});
		
			else {  // running w/o database so use dummy session
				req.session = {};
				res( null );
			}
 		
		else 
			res( errors.lostConnection );
 			//Res.end( TOTEM.errors.pretty(TOTEM.errors.lostConnection ) );
	}

	function getSocket() {  // returns suitable response socket depending on cross/same domain session
		if ( Req.headers.origin ) {  // cross domain session is in progress from master (on http) to its workers (on https)
			Res.writeHead(200, {"content-type": "text/plain", "access-control-allow-origin": "*"});
			Res.socket.write(Res._header);
			Res._headerSent = true;
			return Res.socket;
		}
		else   // same domain (http-to-http or https-to-https) so must use the request socket
			return Req.socket;
	}
		
	startSession( function() {  // process if session not busy
		
		getBody( function (body) {  // setup request with body parms 
			/* 
			Define request req 
				.method = GET | PUT | POST | DELETE
				.action = select | update | insert | delete
				.reqSocket = socket to complete request
				.resSocket = socket to complete response
				socketio: path to client's socketio
				body = hash of request key:value 
				url = clean url
			*/
			var 
				paths = TOTEM.paths,		// parse request url into /area/nodes
				onEncrypted = TOTEM.onEncrypted[CLUSTER.isMaster],  // request being made to encrypted service
				req = Req.req = {			// prime session request
					method: Req.method,
					action: TOTEM.crud[Req.method],
					reqSocket: Req.socket,   // use supplied request socket 
					resSocket: getSocket,		// use this method to return a response socket
					encrypted: onEncrypted,
					socketio: onEncrypted ? TOTEM.site.urls.socketio : "",
					body: body,
					url: (Req.url == "/") ? paths.nourl : unescape(Req.url)
				},

				/*
				There exists an edge case wherein an html tag within json content, e.g a <img src="/ABC">
				embeded in a json string, is reflected back the server as a /%5c%22ABC%5c%22, which 
				unescapes to /\\"ABC\\".  This is ok but can be confusing.
				*/				
				url = req.url,  // get a clean url
							
				nodes = TOTEM.nodeDivider  // get a list of all nodes on the url
					? url ? url.split(TOTEM.nodeDivider) : []
					: url ? [url] : [] ;

			conThread( req, function (err) { 	// start client connection and set the response header

				// must carefully set appropriate headers to prevent http-parse errors when using master-worker proxy
				if ( onEncrypted )
					Res.setHeader("Set-Cookie", ["client="+req.client, "service="+TOTEM.host.name] );						
				
				if (err) 					// connection rejected so we are done
					res(err);

				else
				if (nodes.length == 1) {	// respond with only this node
					node = req.node = nodes.pop();	
					routeNode(req, res);
				}

				else 					// respond with aggregate of all nodes
					syncNodes(nodes, {}, req, res);

			});

		});
	
	});
}

/*function resThread(req, cb) {
/ **
@private
@method resThread
@param {Object} req Totem session request
@param {Function} cb sql connector callback(sql)

Callback with request set to sql conector
* /
	sqlThread( function (sql) {
		cb( req.sql = sql );
	});
}*/

function proxyThread(req, res) {  // not presently used but might want to support later
	
	var 
		pathto = 
			TOTEM.site.urls.master + req.path,  
			 //TOTEM.site.urls.master + "/news",  
			//"http://localhost:8081" + req.path,
		
		proxy = URL.parse( pathto );

	proxy.method = req.method;
	
	Log(proxy, pathto);
	
	/*
	var sock = NET.connect( proxy.port );
	sock.setEncoding("utf8");
	sock.write("here is some data for u");
	sock.on("data", function (d) {
		Log("sock rx", d);
		res(d);
	}); */
	
	var Req = HTTP.request( pathto, function(Res) {
		Log("==========SETUP", Res.statusCode, Res.headers);
		
		var body = "";

		Res.setEncoding("utf8");
		Res.on('data', function (chunk) {  // will not trigger unless worker fails to end socket
			body += chunk;
		});

		Res.on("end", function () {
			Log("=========rx "+body);
			res(body);
		});
		
		Res.on("error", function (err) {
			Log("what??? "+err);
		}); 
		
	}); 

	Req.on('error', function(err) {
		Log("=========tx "+err);
		res("oh well");
	});
	
	//Log( "RELAY TX "+JSON.stringify( req.body) );

	if (proxy.method == "PUT") 
		Req.write( JSON.stringify(req.body) );

	Req.end( );

	
/*  
generic
		var http = require('http');

http.createServer(function(request, response) {
  var proxy = http.createClient(80, request.headers['host'])
  var proxy_request = proxy.request(request.method, request.url, request.headers);
  proxy_request.addListener('response', function (proxy_response) {
    proxy_response.addListener('data', function(chunk) {
      response.write(chunk, 'binary');
    });
    proxy_response.addListener('end', function() {
      response.end();
    });
    response.writeHead(proxy_response.statusCode, proxy_response.headers);
  });
  request.addListener('data', function(chunk) {
    proxy_request.write(chunk, 'binary');
  });
  request.addListener('end', function() {
    proxy_request.end();
  });
}).listen(8080);
*/
	
/*
var net = require('net');

var LOCAL_PORT  = 6512;
var REMOTE_PORT = 6512;
var REMOTE_ADDR = "192.168.1.25";

var server = net.createServer(function (socket) {
    socket.on('data', function (msg) {
        Log('  ** START **');
        Log('<< From client to proxy ', msg.toString());
        var serviceSocket = new net.Socket();
        serviceSocket.connect(parseInt(REMOTE_PORT), REMOTE_ADDR, function () {
            Log('>> From proxy to remote', msg.toString());
            serviceSocket.write(msg);
        });
        serviceSocket.on("data", function (data) {
            Log('<< From remote to proxy', data.toString());
            socket.write(data);
            Log('>> From proxy to client', data.toString());
        });
    });
});

server.listen(LOCAL_PORT);
Log("TCP server accepting connection on port: " + LOCAL_PORT);
*/
	
}

function makeGuest( sql, client ) {  // return a suitable guest profile or null
	
	function userID(client) {  // return suitable userID given a client name
		var 
			parts = client.split("@"),
			parts = (parts[0]+".x.x").split("."),
			userid = (parts[2]=="x") 
					? parts[1].substr(0,6) + parts[0].charAt(0) 
					: parts[2].substr(0,6) + parts[0].charAt(0) + parts[1].charAt(0);

		Log(client,parts,userid);
		return userid;
	}
	
	var paths = TOTEM.paths.mysql;
	
	if (profile = TOTEM.guestProfile) {  // allowing guests
		return Copy({
			Client: client,
			User: userID(client),
			Login: client,
			Requested: new Date()
		}, new Object(profile));

		sql.query( paths.newProfile, profile );
	}
	
	else
		return null;
}
		
/*
function simThread(sock) { 
	//Req.setSocketKeepAlive(true);
	Log({ip: sock.remoteAddress, port: sock.remotePort});
	sock.setEncoding("utf8");
	sock.on("data", function (req) {
		Log("sock data>>>>",req);
		var 
			Req = Copy({
				socket: sock  // used if master makes handoff
			}, JSON.parse(req)),
			
			Res = {  // used if master does not makes handoff
				end: function (ack) {
					sock.write(ack);
				}
			};
				
		sesThread(Req,Res);
	});
} */

function runTask(req,res) {
	var 
		query = req.query,
		body = req.body,
		sql = req.sql,
		task = body.task,
		dom = body.domain,
		cb = body.cb,
		$ = JSON.stringify({
			worker: CLUSTER.isWorker ? CLUSTER.worker.id : 0,
			node: process.env.HOSTNAME
		}),
		engine = `(${cb})( (${task})(${$}) )`,
		plugins = TOTEM.plugins;

	res( "ok" );

	//Log(body);
	//Log(engine);
	
	if ( task && cb ) 
		dom.forEach( function (index) {

			function runEngine(idx) {
				VM.runInContext( engine, VM.createContext( Copy(plugins, idx) ));
			}

			if (body.qos) 
				sql.insertJob({ // job descriptor 
					index: Copy(index,{}),
					priority: 0,
					qos: body.qos, 
					class: req.table,
					client: body.client,
					credit: body.credit,
					name: body.name,
					task: body.name,
					notes: [
							req.table.tag("?",req.query).tag("a", {href:"/" + req.table + ".run"}), 
							((body.credit>0) ? "funded" : "unfunded").tag("a",{href:req.url}),
							"RTP".tag("a", {
								href:`/rtpsqd.view?task=${body.name}`
							}),
							"PMR brief".tag("a", {
								href:`/briefs.view?options=${body.name}`
							})
					].join(" || ")
				}, function (sql,job) {
					//Log("reg job" , job);
					runEngine( job.index );
				});
		
			else
				runEngine( index );
		});
}

[  //< date prototypes
].extend(Date);

[ //< Array prototypes
	function parseJSON(rec,def) {
		this.forEach( function (key) {
			try {
				rec[key] = rec[key].parseJSON(def);
			}
			catch (err) {
				//Log(err,key,rec[key]);
				rec[key] = def || null;
			}
		});
	}
	/*
	function treeify(idx,kids,level,piv,wt) {
	/ **
	@private
	@method treeify
	@member Array
	Returns list as a tree containing children,weight,name leafs.
	@param [Number] idx starting index (0 on first call)
	@param [Number] kids number of leafs following starting index (this.length on first call)
	@param [Number] level current depth (0 on first call)
	@param [Array] piv pivots
	@param [String] wt key name that contains leaf weight (defaults to "size")
	* /		

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
					//Log([pos,idx,end,key,ref,recs.length]);

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
	} */
].extend(Array);

[ //< String prototypes
	function trace(msg,sql) {	
		var pre = this+"";

		if (sql) {
			var 
				parts = msg.split(" "),
				action = parts[0],
				target = parts[1],
				client = "";

			parts.each( function (n,part) {
				if ( part == "FOR" ) client = parts[n+1];
			});

			sql.query("INSERT INTO openv.syslogs SET ?", {
				Action: action,
				Target: target,
				Module: pre,
				t: new Date(),
				Client: client
			});

			console.log(pre,msg);
		}
		else
			console.log(pre,msg);
	},
	
	function tag(el,at,eq) {
	/**
	@method tag
	Tag url (el=?) or tag html (el=html tag) with specified attributes.
	@param {String} el tag element
	@param {String} at tag attributes
	@return {String} tagged results
	*/

		if ( el == "?" || el == "&" ) {  // tag a url
			var rtn = this+el;

			for (var n in at) {
				var val = at[n];
				rtn += n + (eq||"=") + ((typeof val == "string") ? val : JSON.stringify(val)) + "&"; 
			}

			return rtn;	
		}

		else {  // tag html
			var rtn = "<"+el+" ";

			for (var n in at) {
				var val = at[n];
				rtn += n + "='" + val + "' ";
			}

			switch (el) {
				case "embed":
				case "img":
				case "link":
				case "input":
					return rtn+">" + this;
				default:
					return rtn+">" + this + "</"+el+">";
			}
		}
	},

	/**
	@private
	@member String
	Return an EMAC "...${...}..." string using supplied req $-tokens and plugin methods.
	*/
	function parseJS(query) {
		return VM.runInContext( "`" + this + "`" , VM.createContext(query));
	},
	
	function parseJSON(def) {
		try { 
			return JSON.parse(this);
		}
		catch (err) {  

			if ( !def ) // no default method so return null
				return null;

			else
			if (def.constructor == Function)  // use supplied parse method
				return def(this);

			else
				return def;
		}
	},

	function parsePath(query,index,trap) { 
	/**
	@private
	@member String
	Parse a "&key=val&key=val?query&relation& ..." query into 
	the default hash def = {key:val, key=val?query, relation:null, key:json, ...}.
	*/

		function parse(parm, op, qual, store, cb) {
			var	
				parts = parm.split(op),  
				key = parts[0] + qual,
				val = parts[1];
			
			if (val) 
				try {
					store[key] = JSON.parse(val);
				}
				catch (err) {
					store[key] = val;
				}

			else 
				if (cb) cb();
		}

		var 
			parts = this.split("?"),
			pathname = parts[0],
			parms = parts[1],
			parms = parms ? parms.split("&") : [];

		parms.forEach( function (parm) {
			if (parm) 
				parse( parm, "=", "", query, function () {
				parse( parm, ":", ":", index || {}, function () {
				parse( parm, "<", "<$", query, function () {
				parse( parm, ">", ">$", query, function () {
					if (trap) trap[parm] = null;
				}); }); });	});
		});

		return pathname;
	},

	function parseXML(def, cb) {
	/**
	@private
	@member String
	Callback cb(xml parsed) string
	*/
		XML2JS.parseString(this, function (err,json) {				
			cb( err ? def : json );
		});
	}

].extend(String);
	
switch (process.argv[2]) { //< unit tests
	case "T1": 
		var TOTEM = require("../totem");

		Trace({
			msg: "Im simply a Totem interface so Im not even running as a service", 
			default_fetcher_endpts: TOTEM.byTable,
			default_protect_mode: TOTEM.faultless,
			default_cores_used: TOTEM.cores
		});
		break;

	case "T2": 
		var TOTEM = require("../totem").config({
			mysql: null,
			faultless: true,
			cores: 2
		}, function (err) {

			Trace( err || 
`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
with 2 cores and the default endpoint routes` );

		});
		break;

	case "T3": 
		var TOTEM = require("../totem").config({
		},  function (err) {
			Trace( err ||
`I'm a Totem service with no cores. I do, however, have a mysql database from which I've derived 
my startup options (see the openv.apps table for the Nick="Totem1").  
No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
these files. `
			);
		});
		break;

	case "T4": 
		var TOTEM = require("../totem").config({
			byTable: {
				dothis: function dothis(req,res) {  //< named handlers are shown in trace in console
					res( "123" );

					Trace({
						do_query: req.query
					});
				},

				dothat: function dothat(req,res) {

					if (req.query.x)
						res( [{x:req.query.x+1,y:req.query.x+2}] );
					else
						res( new Error("We have a problem huston") );

					Trace({
						msg: `Like dothis, but needs an ?x=value query`, 
						or_query: req.query,
						or_user: [req.client,req.group]
					});
				}
			}
		}, function (err) {
			Trace( err || {
				msg:
`As always, if the openv.apps Encrypt is set for the Nick="Totem" app, this service is now **encrypted** [*]
and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
aka core), Im running unprotected, and have a mysql database.  
[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
associated public NICK.crt and private NICK.key certs it creates.`,
				my_endpoints: TOTEM.byTable
			});
		});
		break;

	case "T5": 
		var TOTEM = require("../totem").config({
			riddles: 20
		}, function (err) {
			Trace( err || {
				msg:
`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.`, 
				mysql_derived_parms: TOTEM.site
			});
		});
		break;

	case "T6":
		var TOTEM = require("../totem").config({
			faultless: false,	// ex override default 
			cores: 3,		// ex override default
			mysql: { 		// provide a database
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			"byTable.": {  // define endpoints
				test: function (req,res) {
					res(" here we go");  // endpoint must always repond to its client 
					if (CLUSTER.isMaster)  // setup tasking examples on on master
						switch (req.query.opt || 1) {  // test example tasker
							case 1: 
								TOTEM.tasker({  // setup tasking for loops over these keys
									keys: "i,j",
									i: [1,2,3],
									j: [4,5]
								}, 
									// define the task which returns a message msg
									($) => "hello i,j=" + [i,j] + " from worker " + $.worker + " on " + $.node, 

									// define the message msg handler
									(msg) => console.log(msg)
								);
								break;

							case 2:
								TOTEM.tasker({
									qos: 1,
									keys: "i,j",
									i: [1,2,3],
									j: [4,5]
								}, 
									($) => "hello i,j=" + [i,j] + " from worker " + $.worker + " on " + $.node, 
									(msg) => console.log(msg)
								);
								break;

							case 3:
								break;
						}

				}
			}

		}, function (err) {
			Trace( err || "Testing tasker with database and 3 cores at /test endpoint" );
		});
		break;
		
	case "TX":
		var TOTEM = require("../totem").config({
		},  function (err) {				
			Trace( err || "db maintenance" );

			if (CLUSTER.isMaster)
			TOTEM.thread( function (sql) {

				switch (process.argv[3]) {
					case 1: 
						sql.query( "select voxels.id as voxelID, chips.id as chipID from app.voxels left join app.chips on voxels.Ring = chips.Ring", function (err,recs) {
							Log(err);
							recs.each( function (n, rec) {
								sql.query("update app.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], function (err) {
									Log(err);
								});
							});
						});
						break;

					case 2:
						sql.query("select ID, Ring from app.voxels", function (err, recs) {
							recs.each( function (n, rec) {
								sql.query(
									"update app.voxels set Point=geomFromText(?) where ?", 
									[ `POINT(${rec.Ring[0][0].x} ${rec.Ring[0][0].y})` , {ID: rec.ID} ], 
									function (err) {
										Log(err);
								});
							});
						});
						break;

					case 3:
						sql.query( "select voxels.id as voxelID, cache.id as chipID from app.voxels left join app.cache on voxels.Ring = cache.geo1", function (err,recs) {
							Log(err);
							recs.each( function (n, rec) {
								sql.query("update app.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], function (err) {
									Log(err);
								});
							});
						});
						break;

					case 4:
						sql.query("select ID, geo1 from app.cache where bank='chip'", function (err, recs) {
							recs.each( function (n, rec) {
								if (rec.geo1)
									sql.query(
										"update app.cache set x1=?, x2=? where ?", 
										[ rec.geo1[0][0].x, rec.geo1[0][0].y, {ID: rec.ID} ], 
										function (err) {
											Log(err);
									});
							});
						});
						break;

					case 5: 
						var parms = {
ring: "[degs] closed ring [lon, lon], ... ]  specifying an area of interest on the earth's surface",
"chip length": "[m] length of chip across an edge",
"chip samples": "[pixels] number of pixels across edge of chip"
						};
						//get all tables and revise field comments with info data here -  archive parms - /parms in flex will
						//use getfileds to get comments and return into

					case 6:
						var 
							RAN = require("../randpr"),
							ran = new RAN({
								models: ["sinc"],
								Mmax: 150,  // max coherence intervals
								Mstep: 5 	// step intervals
							});

						ran.config( function (pc) {
							var 
								vals = pc.values,
								vecs = pc.vectors,
								N = vals.length, 
								ref = vals[N-1];

							vals.forEach( (val, idx) => {
								var
									save = {
										correlation_model: pc.model,
										coherence_intervals: pc.intervals,
										eigen_value: val,
										eigen_index: idx,
										ref_value: ref,
										max_intervals: ran.Mmax,
										eigen_vector: JSON.stringify( vecs[idx] )
									};

								sql.query("INSERT INTO app.pcs SET ? ON DUPLICATE KEY UPDATE ?", [save,save] );	
							});
						});
						break;	
				}

			});

		});		
		break;
}

// UNCLASSIFIED
