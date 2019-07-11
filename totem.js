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
@requires stream
@requires str

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
*/

var	
	// globals
	TRACE = "T>",
	ENV = process.env,
	
	// NodeJS modules
	STREAM = require("stream"), 	// pipe-able streams
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

const { Copy,Each,Log,isError,isArray,isString,isFunction,isEmpty } = require("enum");
	
function Trace(msg,sql) {
	TRACE.trace(msg,sql);
}

var
	TOTEM = module.exports = {

	queues: JSDB.queues, 	// pass along
		
	reroute: { //< table -> db.table translators
	},
		
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
		
	onUpdate: null,
		
	/**
	@cfg {Function}
	@method tasker
	@member TOTEM

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
			$ => "my result is " + (i + j*k) + " from " + $.worker + " on "  + $.node,

			// here, a simple callback that displays the task results
			msg => console.log(msg) 
		);
	
	@param {Object} opts tasking options (see example)
	@param {Function} task tasker of the form ($) => {return msg} where $ contains process info
	@param {Function} cb callback of the form (msg) => {...} to process msg returned by task
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
			fetcher = TOTEM.fetcher,
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
			cores = opts.cores || opts.workers || 10,		// cores (aka workers) on each node
			shards = opts.shards || 100,	// shards on each core (aka worker)
			nodes = opts.nodes || opts.locales || 50;	// nodes in compute cloud

		if ( opts.local )	// run all shards locally
			genDomain(0, keys.split(","), opts, {}, true, index => {
				cb( task(index) );
			});
		
		else	// distribute shards over the cloud and over workers
			genDomain(0, keys.split(","), opts, {}, true, (index, isLast) => {
				dom.push( index );		// push index set on node request

				if ( isLast || (dom.length == shards) ) {  // last index or shards exhausted
					if ( ++fetches > cores ) {	// distribute to next node
						nodeURL = paths.nodes[++node];
						if ( !nodeURL) nodeURL = paths.nodes[node = 0];	// recycle nodes
						fetches = 0;
					}

					if (task) 
						if ( isArray(task) )
							task.forEach( task => {		// multiple tasks supplied
								nodeReq.task = task+"";
								fetcher( nodeURL, nodeReq, nodeCB);
							});

						else {	// post the task request to the node
							nodeReq.task = task+"";
							fetcher( nodeURL, nodeReq, nodeCB);
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
	
	/**
	@cfg {Function}
	@private
	@method watchFile
	Establish smart file watcher when file at area/name has changed.
	@param {String} path to file being watched
	@param {Function} callback cb(sql, name, path) when file at path has changed
	*/
	watchFile: function (path, cb) { 
		var 
			mTimes = TOTEM.mTimes;
		
		Trace("WATCHING " + path);
		
		mTimes[path] = 0; 

		FS.watch(path, function (ev, file) {  
			var 
				isSwap = file.charAt(0) == ".";

			if (file && !isSwap)
				switch (ev) {
					case "change":
						sqlThread( sql => {
							Trace(ev.toUpperCase()+" "+file, sql);

							FS.stat(path, function (err, stats) {

								//Log(path, err, stats);
								if ( !err && (mTimes[path] != stats.mtime) ) {
									mTimes[path] = stats.mtime;
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
		
	/**
	@cfg {Function}
	@private
	@method createCert
	Create a PKI cert given user name and password.
	@param {String} path to file being watched
	@param {Function} callback cb(sql, name, path) when file at path has changed
	*/
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
	@cfg {Function}
	@private
	@method emitter
	Communicate with socket.io clients
	*/
	emitter: null,
		
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
	@cfg {Function}
	@member TOTEM	
	@method thread
	Thread a new sql connection to a callback.  Unless overridden, will default to the JSDB thread method.
	@param {Function} cb callback(sql connector)
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
	*/
	reqFlags: {				//< Properties for request flags
		traps: { //< cb(query) traps to reorganize query
			filters: req => {
				var 
					flags = req.flags,
					where = req.where,
					filters = flags.filters,
					escape = MYSQL.escape,
					escapeId = MYSQL.escapeId;
				
				if (filters)
				filters.forEach( (filter) => where[ filter.property ] = escapeId(filter.property).SQLfind( escape(filter.value) ) );
			}
		},
		strips:	 			//< Flags to strips from request
			{"":1, "_":1, leaf:1, _dc:1}, 		

		//ops: "<>!*$|%/^~",
		id: "ID", 					//< SQL record id
		prefix: "_",				//< Prefix that indicates a field is a flag
		trace: "_trace",		//< Echo flags before and after parse	
		blog: function (recs, req, res) {  //< Default blogger
			res(recs);
		}
	},

	/**
	@cfg {Object} 
	@member TOTEM
	MySQL connection options {host, user, pass, sessions} or nul l to disable
	*/		
	mysql: { //< null to disable database
		host: ENV.MYSQL_HOST || "localhost",
		user: ENV.MYSQL_USER || "mysqluser",
		pass: ENV.MYSQL_PASS || "mysqlpass",
		sessions: 1000
	},
	
	/**
	@cfg {Boolean} [sockets=false]
	@member TOTEM
	Enabled to support web sockets
	*/
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
	@cfg {Object}
	@member TOTEM	
	Folder watching callbacks cb(path) 
	*/				
	onFile: {		//< File folder watchers with callbacks cb(path) 
	},
	
	/**
	@cfg {Object}
	@member TOTEM	
	File mod-times tracked as OS will trigger multiple events when file changed
	*/
	mTimes: { 	//< File mod-times tracked as OS will trigger multiple events when file changed
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
	site: {  	//< reserved for derived context vars		
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	Endpoint reqTypes cb(data data as string || error)
	*/
	reqTypes: {  //< record data convertors
		db: function (data, req, res) {			
			req.sql.query("select found_rows()")
			.on('result', function (stat) {		// records sourced from sql				
				res({ 
					success: true,
					msg: "ok",
					count: stat["found_rows()"] || 0,
					data: data
				});
			})
			.on("error", function () {  		// records sourced from virtual table
				res({ 
					success: true,
					msg: "ok",
					count: data.length,
					data: data
				});
			});
		},
		
		csv: function (data, req, res) {
			JS2CSV({ 
				data: data, 
				fields: Object.keys( data[0]||{} )
			} , function (err,csv) {
					res( err || csv );
			});
		},
		
		"": function (data,req,res) {
			res( data );
		},
		
		json: function (data,req,res) {
			res( data );
		},
		
		xml: function (data, req, res) {
			res( JS2XML.parse(req.table, {  
				count: data.length,
				data: data
			}) );
		}
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management
	*/				
	byTable: {			  //< by-table routers	
		riddle: sysValidate,
		task: sysTask,
		ping: sysPing
	},
		
	/**
	@cfg {Object} 
	@member TOTEM	
	By-action endpoint routers for accessing engines
	*/				
	byAction: { //< by-action routers
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-type endpoint routers  {type: method(req,res), ... } for accessing dataset readers
	*/				
	byType: {  //< by-type routers
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-area endpoint routers {area: method(req,res), ... } for sending/cacheing files
	*/		
	byArea: {	//< by-area routers
		stores: sysFile,
		uploads: sysFile,
		shares: sysFile
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-action-table endpoint routers {action: {table: method(req,res), ...}, ... } for accessing virtual tables
	*/		
	byActionTable: {	//< by-action-table routers
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
	
	//====================================== CRUDE interface
		
	/**
	@cfg {Function}
	@method selectDS
	@member TOTEM	
	CRUDE (req,res) method to respond to a select||GET request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	select: selectDS,	
	/**
	@cfg {Function}	
	@method update
	@member TOTEM	
	CRUDE (req,res) method to respond to a update||POST request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	update: updateDS,
	/**
	@cfg {Function}	
	@method delete
	@member TOTEM	
	CRUDE (req,res) method to respond to a delete||DELETE request
	@param {Object} req Totem session request
	@param {Function} res Totem responder
	*/				
	delete: deleteDS,
	/**
	@cfg {Function}
	@method insert
	@member TOTEM	
	CRUDE (req,res) method to respond to a insert||PUT request
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

	//====================================== MISC
		
	/**
	@cfg {Date} 
	@private
	@member TOTEM	
	totem start time
	*/		
	started: null, 		//< totem start time
		
	/**
	@cfg {Function} 
	@private
	@member TOTEM	
	Fetches data from this/other service and forward returned information (as a string, "" if an error occured) to the provided callback.
	@param {String} path "http || https || curl || curls || wget || wgets || / "-prefixed url
	@param {Object} post POST parameters or null
	@param {Function} cb callback(string results)
	 */
	fetcher: Copy({
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
	}, function fetcher(path, post, cb) {	//< data fetching
	
			function retry(cmd, cb) {  // wget-curl retry logic

				function trycmd(retries, cmd, cb) {

					if (trace)
						Trace(`TRY[${opts.retry}] ${cmd}`);

					CP.exec(cmd, function (err,stdout,stderr) {
						if (err) 
							if ( retries ) 
								trycmd( --retries, cmd, cb);
							
							else
								cb( TOTEM.errors.retry );
						
						else
						if (cb) cb(null, stdout);
					});
				}

				if ( retries ) 
					trycmd( retries, cmd, cb);

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
					cb( body );
				});
			}

			var 
				url = (path.charAt(0) == "/") ? TOTEM.host.master + path : path,
				opts = URL.parse(url),
				protocol = opts.protocol || "",
				trace = this.trace,
				retries = this.retries,
				cert = TOTEM.cache.certs.fetch;

			opts.rejectUnauthorized = false;
			opts.agent = false;
			opts.method = post ? "PUT" : "GET";
			opts.port = opts.port ||  (protocol.endsWith("s:") ? 443 : 80);
			// opts.cipher = " ... "
			// opts.headers = { ... }
			// opts.Cookie = ["x=y", ...]
			/*if (opts.soap) {
				opts.headers = {
					"Content-Type": "application/soap+xml; charset=utf-8",
					"Content-Length": opts.soap.length
				};
				opts.method = "POST";
			}*/

			//Log(opts,url);
			Trace("FETCH "+url);

			switch (protocol) {
				case "curl:": 
					retry( `curl ` + url.replace(protocol, "http:"), (err,out) => {
						cb( err ? "" : out );
					});
					break;

				case "curls":
					retry( `curl -gk --cert ${cert._crt}:${cert._pass} --key ${cert._key} --cacert ${cert._ca}` + url.replace(protocol, "https:"), (err,out) => {
						cb( err ? "" : out );
					});	
					break;

				case "wget:":
					var 
						parts = url.split(" >> "),
						url = parts[0],
						out = parts[1] || "./temps/wget.jpg";

					retry( `wget -O ${out} ` + url.replace(protocol, "http:"), (err) => {
						cb( err ? "" : "ok" );
					});
					break;

				case "wgets:":
					var 
						parts = url.split(" >> "),
						url = parts[0],
						out = parts[1] || "./temps/wget.jpg";

					retry( `wget -O ${out} --no-check-certificate --certificate ${cert._crt} --private-key ${cert._key} ` + url.replace(protocol, "https:"), (err) => {
						cb( err ? "" : "ok" );
					});
					break;

				case "http:":
					try {
						var Req = HTTP.request(opts, getResponse);
					} 
					catch (err) {
						cb( "" );
					}

					Req.on('error', function(err) {
						Log("FETCH FAIL", err);
						cb( "" );
					});

					if ( post )
						Req.write( JSON.stringify(post) );  // post parms

					Req.end();
					break;

				case "https:":
					opts.pfx = cert.pfx;
					opts.passphrase = cert._pass;

					try {
						var Req = HTTPS.request(opts, getResponse);
					}
					catch (err) {
						return cb( "" );
					}

					Req.on('error', function(err) {
						//Log("FETCH FAIL", err);
						cb( "" );
					});

					if ( body )
						Req.write( JSON.stringify( body ) );  // body parms

					Req.end();
					break;

				default: 
					cb( "" );
			}
		}),

	/**
	@cfg {Boolean} 
	@member TOTEM	
	Enable/disable service fault protection guards
	*/
	faultless: false,  //< enable to use all defined guards
		
	/**
	@cfg {Object} 
	@member TOTEM	
	Service guard modes
	*/
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
	
	/**
	@cfg {Object} 
	@member TOTEM	
	Client admission rules
	*/
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
		function admit(cb) {  // callback cb(log || null) with session log 
			cb({ 
				Event: now,		 					// start time
				Action: req.action, 				// db action
				Stamp: TOTEM.host.name  // site name
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
					admit( (log) => {
						req.log = log ? new Object(log) : null;
						req.profile = new Object( profile );
						req.group = profile.Group;
						cb( null );
					});
			}
		
			else
				cb( errors.rejectedClient );
		
		else
		if ( req.encrypted )
			cb( errors.rejectedClient );
		
		else 
			admit( (log) => {
				req.log = log ? new Object(log) : null;
				req.profile = new Object( profile );
				req.group = profile.Group;
				cb( null );
			});
	},

	/**
	@cfg {Object}
	@member TOTEM	
	Default guest profile (unencrypted or client profile not found).  Null to bar guests.
	*/		
	guestProfile: {				//< null if guests are barred
		Banned: "",  // nonempty to ban user
		QoS: 10,  // [secs] job regulation interval
		Credit: 100,  // job cred its
		Charge: 0,	// current job charges
		LikeUs: 0,	// number of user likeus
		Challenge: 1,		// enable to challenge user at session join
		Client: "guest@guest.org",		// default client id
		User: "guest",		// default user ID (reserved for login)
		Group: "app",		// default group name (db to access)
		IDs: "{}",		// challenge key:value pairs
		Repoll: true,	// challenge repoll during active sessions
		Retries: 5,		// challenge number of retrys before session killed
		Timeout: 30,	// challenge timeout in secs
		Message: "Welcome guest - what is (riddle)?"		// challenge message with riddles, ids, etc
	},

	/**
	@cfg {Number} [riddles=0]
	@member TOTEM	
	Number of riddles to protect site (0 to disable anti-bot)
	*/		
	riddles: 0, 			
	
	/**
	@cfg {Array} 
	@private
	@member TOTEM	
	Store generated riddles to protect site 
	*/		
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
		
		home: "",	
		certs: "./certs/", 
		
		mysql: {
			//logThreads: "show session status like 'Thread%'",
			users: "SELECT 'users' AS Role, group_concat( DISTINCT lower(dataset) SEPARATOR ';' ) AS Clients FROM app.dblogs WHERE instr(dataset,'@')",
			derive: "SELECT * FROM openv.apps WHERE ? LIMIT 1",
			//logMetrics: "INSERT INTO app.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?, Event=?",
			search: "SELECT * FROM app.files HAVING Score > 0.1",
			//credit: "SELECT * FROM app.files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 1",
			getProfile: "SELECT * FROM openv.profiles WHERE ? LIMIT 1",
			newProfile: "INSERT INTO openv.profiles SET ?",
			getSession: "SELECT * FROM openv.sessions WHERE ? LIMIT 1",
			newSession: "INSERT INTO openv.sessions SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1",
			challenge: "SELECT * FROM openv.profiles WHERE least(?,1) LIMIT 1",
			guest: "SELECT * FROM openv.profiles WHERE Client='guest@guest.org' LIMIT 1",
			pocs: "SELECT lower(Hawk) AS Role, group_concat( DISTINCT lower(Client) SEPARATOR ';' ) AS Clients FROM openv.roles GROUP BY hawk"
		},
		
		nodes: {  // available nodes for task sharding
			0: ENV.SHARD0 || "http://localhost:8080/task",
			1: ENV.SHARD1 || "http://localhost:8080/task",
			2: ENV.SHARD2 || "http://localhost:8080/task",
			3: ENV.SHARD3 || "http://localhost:8080/task"
		},
			
		mime: { // default static file areas
			files: ".", // path to shared files 
			"socket.io": ".", // path to socket.io
			captcha: ".",  // path to antibot captchas
			index: { //< paths for allowed file indexers ("" to use url path)
				files: ""
			},
			extensions: {  // Extend mime types as needed
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
		pretty: err => { 
			return err+"";
		},
		noID: new Error("missing record ID"),
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
		badReturn: new Error("data could not be returned"),
		noSockets: new Error("socket.io failed"),
		noService: new Error("no service  to start"),
		noData: new Error("no data returned"),
		retry: new Error("data fetch retries exceeded"),
		notAllowed: new Error("this endpoint is disabled"),
		noID: new Error("missing record id"),
		noSession: new Error("no such session started"),
		noAccess: new Error("no access to master core at this endpoint")
	},

	/**
	@method 
	@cfg {Function}
	@member TOTEM	
 	File indexer
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
	File uploader 
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

		if (pocs = mysql.pocs) 
			sql.query(pocs)
			.on("result", poc => site.pocs[poc.Role] = poc.Clients || "" )
			.on("end", () => Log(TRACE, "POCs", site.pocs) );

		if (users = mysql.users) 
			sql.query(users)
			.on("result", poc => site.pocs[poc.Role] = poc.Clients || "" )
			.on("end", () => Log(TRACE, "POCs", site.pocs) );
		
		if (guest = mysql.guest)
			sql.query(guest)
			.on("result", rec => {
				TOTEM.guestProfile = Copy(rec,{});
				delete TOTEM.guestProfile.ID;
			});

		if (derive = mysql.derive)  // derive site context vars
			sql.query(derive, {Nick:TOTEM.host.name})
			.on("result", opts => {
				Each(opts, function (key,val) {
					key = key.toLowerCase();
					site[key] = val;

					if ( isString(val||0) )
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
				"ASP".fontcolor(asp[0].Fails ? "red" : "green").tag( "/help?from=asp" ),
				"ISP".fontcolor(isp[0].Fails ? "red" : "green").tag( "/help?from=isp" ),
				"SW".fontcolor(sw[0].Fails ? "red" : "green").tag( "/help?from=swap" ),   // mails list of failed swapIDs (and link to all sw reqts) to swap PMO
				"HW".fontcolor(hw[0].Fails ? "red" : "green").tag( "/help?from=pmo" )   // mails list of failed hw reqts (and link to all hw reqts) to pod lead
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
	File cache
	*/		
	cache: { 				//< cacheing options
		
		never: {	//< files to never cache - useful while debugging client side stuff
			"base.js": 1,
			"extjs.js": 1,
			"jquery.js":1,
			"jade": 1
		},
		
		clients: {  // cache clients area
		},
		
		"socket.io": {  // cache socketio area
		},
		
		learnedTables: true, 
		
		certs: {} 		// cache client crts (pfx, crt, and key reserved for server)
	}
	
};

/**
 * @class TOTEM.End_Points.CRUD_Interface
 * Create / insert / post, Read / select / get, Update / put, Delete methods.
 */

function selectDS(req, res) {
	/**
	@private
	@method selectDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		where = req.where,
		index = flags.index || req.index;
	
	sql.runQuery({
		trace: flags.trace,
		crud: req.action,
		from: req.table,
		db: req.group || "app",
		pivot: flags.pivot,
		browse: flags.browse,		
		where: where,
		index: index,
		having: {},
		client: req.client
	}, null, function (err,recs) {

		if ( isEmpty(index) )
			res( err || recs );
		
		else
		if (err) 
			res( err );

		else {
			recs.forEach( (rec) => {
				Each(index, (key) => {
					try {
						rec[key] = JSON.parse( rec[key] );
					}
					catch (err) {
					}
				});
			});
			res( recs );
		}
	});
}

function insertDS(req, res) {
	/**
	@private
	@method insertDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		body = req.body,
		escapeId = MYSQL.escapeId,
		escape = MYSQL.escape;

	for (var key in body) body[key] = `${escapeId(key)} = ${escape(body[key])}`;
	
	sql.runQuery({
		trace: flags.trace,
		crud: req.action,
		from: req.table,
		db: req.group || "app",
		set: body,
		client: req.client
	}, TOTEM.emitter, function (err,info) {

		//Log(info);
		res( err || info );

	});
	
}

function deleteDS(req, res) {
	/**
	@private
	@method deleteDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/		
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		where = req.where;

	if ( where.ID )
		sql.runQuery({
			trace: flags.trace,			
			crud: req.action,
			from: req.table,
			db: req.group || "app",
			where: where,
			client: req.client
		}, TOTEM.emitter, function (err,info) {

			//Log(info);
			res( err || info );

		});
	
	else
		res( TOTEM.errors.noID );
	
}

function updateDS(req, res) {
	/**
	@private
	@method updateDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/	
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		body = req.body,
		ds = req.table,
		where = req.where,
		escapeId = MYSQL.escapeId,
		escape = MYSQL.escape;

	Log(req.action, where, body);
	//for (var key in body) body[key] = `${escapeId(key)} = ${escape(body[key])}`;
	//Log(body);
	
	if ( isEmpty(body) )
		res( TOTEM.errors.noBody );
	
	else
	if ( where.ID )
		sql.runQuery({
			trace: flags.trace,
			crud: req.action,
			from: req.table,
			db: req.group || "app",
			where: where,
			set: body,
			client: req.client
		}, TOTEM.emitter, function (err,info) {

			//Log(info);
			res( err || info );

			if ( onUpdate = TOTEM.onUpdate ) 
				onUpdate(sql, ds, body);
			
		});
	
	else
		res( TOTEM.errors.noID );
	
}

/*
function selectDS(req,res) {	//< Default virtual table logic is real table
/ **
 * @private
 * @method deleteDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * * /
	if (TOTEM.mysql)
		req.sql.query("SELECT * FROM ??.??", [req.group,req.table], function (err,data) {
			res(err || data);
		});
	
	else
		res(TOTEM.errors.noDB);
} */

/*
function updateDS(req,res) {
/ **
 * @private
 * @method updateDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * * /
	//Log(req.table, TOTEM.byTable);
	
	if ( route = TOTEM.byTable[req.table] )
		route(req, res);
	
	else
		res( TOTEM.errors.noRoute );
} */

/*
function insertDS(req,res) {
/ **
 * @private
 * @method insertDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * * /
	res( TOTEM.errors.notAllowed );
} */

/*
function deleteDS(req,res) {
/ **
 * @private
 * @method deleteDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * * /
	res( TOTEM.errors.notAllowed );
}  */

function executeDS(req,res) {
/**
 @private
 @method executeDS
 @param {Object} req Totem's request
 @param {Function} res Totem's response callback
 */
	res( TOTEM.errors.notAllowed );
}

/**
 * @class TOTEM.Utilities.Configuration_and_Startup
 **/

function configService(opts,cb) {
/**
 @private
 @method configService
 @param {Object} opts configuration options following the ENUM.Copy() conventions.
 @param {Function} cb callback(err) after service configured
 Configure JSDB, define site context, then protect, connect, start and initialize this server.
 */

	//TOTEM.Extend(opts);
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
			//emitter: TOTEM.IO.sockets.emit,   // cant set socketio until server started

			reroute: TOTEM.reroute,  // db translators
			
			fetcher: TOTEM.fetcher,
			
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
		}, err => {  // derive server vars and site context vars
		
			if (err)
				Trace(err);
			
			else
				JSDB.thread( sql => {
					Trace(`DERIVE ${name}`);

					for (var n in mysql)   // derive server paths
						if (n in paths) paths[n] = mysql[n];

					if (name)	// derive site context
						TOTEM.setContext(sql, function () {
							protectService(cb || function(err) {
								Trace(err || `STARTED ${name} ENCRYPTED`, sql);
							});
						});

					//TOTEM.dsAttrs = JSDB.dsAttrs;
					sql.release();
				});
		});	

	else
		protectService(cb || function(err) {
			Trace(err || `STARTED ${name} STANDALONE`);
		});
	
	return TOTEM;
}

function startService(server,cb) {
/**
 @private
 @method startService
 Attach port listener to this server then initialize it.
 @param {Object} server HTTP/HTTP server
 @param {Function} cb callback(err) when started.
 */
	
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

			TOTEM.emitter = IO.sockets.emit;
			
			IO.on("connect", socket => {  // Trap every connect				
				//Trace("ALLOW SOCKETS");
				socket.on("select", req => { 		// Trap connect raised on client "select/join request"
					
					Trace(`CONNECTING ${req.client}`);
					sqlThread( sql => {	

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
			IO.on("connect_error", err => {
				Log(err);
			});
			
			IO.on("disconnection", socket => {
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
		process.on("uncaughtException", err => {
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
		
	sqlThread( sql => {
		if (CLUSTER.isMaster) initializeService(sql);
		TOTEM.init(sql);
		sql.release();
	});
	
}
		
function connectService(cb) {
/**
 @private
 @method connectService
 If the TOTEM server already connected, inherit the server; otherwise define a suitable http interface (https if encrypted, 
 http if unencrypted), then start and initialize the service.
 @param {Function} cb callback(err) when connected
 */
	
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
		key: "", //FS.readFileSync(`${paths.certs}fetch.key`),
		crt: "", //FS.readFileSync(`${paths.certs}fetch.crt`),
		ca: "", //FS.readFileSync(`${paths.certs}fetch.ca`),			
		_pfx: `${paths.certs}fetch.pfx`,
		_crt: `${paths.certs}fetch.crt`,
		_key: `${paths.certs}fetch.key`,
		_ca: `${paths.certs}fetch.ca`,
		_pass: ENV.FETCH_PASS
	};
	
	//Log( TOTEM.onEncrypted, CLUSTER.isMaster, CLUSTER.isWorker );
	
	if ( onEncrypted ) {  // have encrypted services so start https service
		try {  // build the trust strore
			Each( FS.readdirSync(paths.certs+"/truststore"), function (n,file) {
				if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
					Trace("TRUSTING "+file);
					trustStore.push( FS.readFileSync( `${paths.certs}truststore/${file}`, "utf-8") );
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
	
	else // unencrpted services so start http service
		startService( HTTP.createServer(), cb );
}

function protectService(cb) {
/**
 @private
 @method protectService
 Create the server's PKI certs (if they dont exist), setup site urls, then connect, start and initialize this service.  
 @param {Function} cb callback(err) when protected
 */
	
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
		FS.access( pfx, FS.F_OK, err => {

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
 @private
 @method stopService
 Stop the server.
 */
		
	var server = TOTEM.server;
			
	if (server)
		server.close(function () {
			Trace("STOPPED");
		});
}

function initializeService(sql) {
/**
 @private
 @method initializeService
 Initialize service, file watchers and start watch dogs.
 @param {Object} sql connectors
*/	
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

	// initialize file watcher

	sql.query("UPDATE app.files SET State='watching' WHERE Area='uploads' AND State IS NULL");
	
	var mTimes = TOTEM.mTimes;

	Each(TOTEM.onFile, function (area, cb) {  // callback cb(sql,name,area) when file changed
		FS.readdir( area, function (err, files) {
			if (err) 
				Log(err);

			else
				files.forEach( file => {
					var first = file.charAt(0);
					
					if (first != "." && first != "_") 
						TOTEM.watchFile( area+file, cb );
				});
		});	
	});
	
	// start watch dogs
	
	Each( TOTEM.dogs, function (key, dog) {
		if ( dog.cycle ) {  // attach sql threaders and setup watchdog interval
			//Trace("DOGING "+key);
			dog.trace = dog.name.toUpperCase();
			dog.forEach = JSDB.forEach;
			dog.forAll = JSDB.forAll;
			dog.forFirst = JSDB.forFirst;
			dog.thread = JSDB.thread;
			dog.site = TOTEM.site;
			
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
@class TOTEM.End_Points.User_Managment
Legacy endpoints to manage users and their profiles.  Moved to FLEX.
 */

function selectUser(req,res) {
/**
@private
@deprecated
@method selectUser
Return user profile information
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
	
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
/**
@private
@deprecated
@method updateUser
Update user profile information
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
			
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
/**
@private
@deprecated
@method deleteUser
Remove user profile.
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
			
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
/**
@private
@deprecated
@method insertUser
Create user profile, associated certs and distribute info to user
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
			
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
						? "Please "+"reset your password".tag( url.resetpass )+" to access"
						: "",

					Client: user.User,					
					QoS: 0,

					Message:

`Greetings from ${site.Nick.tag(site.urls.master)}-

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
					err => {
						
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
/**
@private
@deprecated
@method executeUser
Fetch user profile for processing
@param {Object} req Totem session request 
@param {Function} res Totem response
*/
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

/**
@class TOTEM.Utilities.PKI_Certs
Utilities to create and manage PKI certs
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

		CP.exec(cmd, err => {

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

Attaches log, profile, group, client, cert and joined info to this req request (sql, reqSocket) with callback res(error) where
error is null if session is admitted by admitClient.  

@param {Object} req totem request
@param {Function} res totem response
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
@class TOTEM.Utilities.File_Access
File cacheing, indexing and uploading
 */

function indexFile(path,cb) {	
/**
@private
@method indexFile
@param {String} path file path
@param {Function} cb totem response
*/
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

	var 
		files = [],
		maxIndex = TOTEM.maxIndex;
	
	findFile(path, function (file) {
		if ( files.length < maxIndex)
			files.push( (file.indexOf(".")<0) ? file+"/" : file );
	});
	
	cb( files );
}	

function getFile(client, name, cb) {  
/**
@private
@method getFile
Get (or create if needed) a file with callback cb(fileID, sql) if no errors
@param {String} client owner of file
@param {String} name of file to get/make
@param {Function} cb callback(area, fileID, sql) if no errors
*/

	JSDB.forFirst( 
		"FILE", 
		"SELECT ID FROM app.files WHERE least(?,1) LIMIT 1", {
			Name: name
			//Client: client,
			//Area: area
		}, 
		function (file, sql) {

		if ( file )
			cb( file.ID, sql );

		else
			sql.forAll( 
				"FILE", 
				"INSERT INTO app.files SET _State_Added=now(), ?", {
					Name: name,
					Client: client
					// Path: filepath,
					// Area: area
				}, 
				function (info) {
					cb( info.insertId, sql );
			});

	});
}

function uploadFile( client, srcStream, sinkPath, tags, cb ) { 
/**
@private
@method uploadFile
Uploads a source stream srcStream to a target file sinkPath owned by a 
specified client.  Optional tags are logged with the upload.
@param {String} client file owner
@param {Stream} source stream
@param {String} sinkPath path to target file
@param {Object} tags hach of tags to add to file
@param {Function} cb callback(fileID) if no errors encountered
*/
	var
		parts = sinkPath.split("/"),
		name = parts.pop() || "";
	
	getFile(client, name, function ( fileID, sql ) {
		var 
			sinkStream = FS.createWriteStream( sinkPath, "utf-8")
				.on("finish", function() {  // establish sink stream for export pipe

					Trace("UPLOADED FILE");
					sqlThread( sql => {

						sql.query("UPDATE apps.files SET ? WHERE ?", [{
							_Ingest_Tag: JSON.stringify(tags || null),
							_State_Notes: "Please go " + "here".tag("/files.view") + " to manage your holdings."
						}, {ID: fileID} ] );
						
						sql.release();
					});
				})
				.on("error", err => {
					Log("totem upload error", err);
					sqlThread( sql => {
						sql.query("UPDATE app.files SET ? WHERE ?", [ {
							_State_Notes: "Upload failed: " + err 
						}, {ID: fileID} ] );

						sql.release();
					});
				});

		Log("uploading to", sinkPath);

		if (cb) cb(fileID);  // callback if provided
		
		if (srcStream)   // if a source stream was provided, start pipe to copy source to sink
			srcStream.pipe(sinkStream);  
	});

}

/**
@class TOTEM.Utilities.Antibot_Protection
Data theft protection
 */

function sysValidate(req,res) {	//< endpoint to check clients response to a riddle
/**
@private
@method sysValidate
Endpoint to check clients response req.query to a riddle created by challengeClient.
@param {Object} req Totem session request
@param {Function} res Totem response callback
*/
	var 
		query = req.query,
		sql = req.sql,
		id = query.ID || query.id;
		
	if (id)
		sql.query("SELECT * FROM openv.riddles WHERE ? LIMIT 1", {Client:id}, function (err,rids) {
			
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
				res( TOTEM.errors.noSession  );

		});
	
	else
		res( TOTEM.errors.noID );
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
@method makeRiddles
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
				? makeRiddles( profile.Message, rid, (profile.IDs||"").parseJSON( {} ) )
				: profile.Message;

	if (reply && TOTEM.IO) 
		sqlThread( sql => {
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
@class TOTEM.Utilities.Endpoint_Routing 
Methods to route notes byType, byAction, byTable, byActionTable, byArea.
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
		query = req.query = {},
		index = req.index = {},	
		where = req.where = {},
		flags = req.flags = {},
		path = req.path = "." + req.node.parseURL(query, index, flags, where),	//  ./area1/area2/.../table.type
		areas = path.split("/"),						// [".", area1, area2, ...]
		file = req.file = areas.pop() || "",		// table.type
		parts = file.split("."),							// [table, type, ...]
		table = req.table = parts[0] || "",	
		type = req.type = parts[1] || "",
		area = req.area = areas[1] || "",
		site = req.site = TOTEM.site;
	
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

	for (var key in query) 		// strip or remap bogus keys
		if ( key in strips )
			delete query[key];

	for (var key in flags) 	// trap special flags
		if ( trap = traps[key] )
			trap(req);
			
	for (var key in body) 		// remap body flags
		if (key.charAt(0) == prefix) {  
			flags[key.substr(1)] = body[key];
			delete body[key];
		}

	if (id in body) {  			// remap body record id
		query[id] = body[id];
		where[id] = `${id} = ${body[id]}`;
		delete body[id];
	}

	/*
	Log({after: {
		a: req.action,
		q: query,
		b: body,
		f: flags
	}}); */
}						

function routeNodes(nodes, acks, req, res) {
/**
@private
@method routeNodes
Submit nodes=[/dataset.type, /dataset.type ...]  on the current request thread req to the routeNode() 
method, aggregate results, then send with supplied response().
@param {Array} nodes
@param {Object} acks
@param {Object} req Totem session request
@param {Function} res Totem response callback
*/
	
	if ( node = req.node = nodes.pop() )  	// grab last node
		routeNode( req, function (data) { 	// route it and intercept its data
			acks[req.table] = data;
			routeNodes( nodes, acks, Copy(req,{}), res );
		});

	else
	if (nodes.length) 	// still more nodes
		routeNodes( nodes, acks, Copy(req,{}), res );
	
	else  				// no more nodes
		res(acks);
}

function routeNode(req, res) {
/**
@private
@method routeNode

Parse the node=/dataset.type on the current req thread, then route using byArea, byType, byTable,
byActionTable, or byAction routers.

@param {Object} req Totem session request
@param {Function} res Totem response callback
*/
	
	parseNode(req);

	function sendFile(req,res) {
		res( function () {return req.path; } );
	}

	function followRoute(route,req,res) {
	/**
	@private
	@method followRoute

	Log session metrics, trace the current route, then callback route on the supplied 
	request-response thread

	@param {Function} route method endpoint to process session 
	@param {Object} req Totem session request
	@param {Function} res Totem response callback
	*/

		function logMetrics(log, sock) { //< log session metrics 
			if ( logMetrics = TOTEM.paths.mysql.logMetrics ) {

				sock._started = new Date();

				/*
				If maxlisteners is not set to infinity=0, the connection becomes sensitive to a sql 
				connector t/o and there will be random memory leak warnings.
				*/

				sock.setMaxListeners(0);
				sock.on('close', function () { 		// cb when connection closed
					var 
						secs = sock._started ? ((new Date()).getTime() - sock._started.getTime()) / 1000 : 0,
						bytes = sock.bytesWritten;
						//log = req.log;

					sqlThread( sql => {

						sql.query(logMetrics, [ Copy(log, {
							Delay: secs,
							Transfer: bytes,
							Event: sock._started,
							Dataset: "",
							Client: req.client,
							Actions: 1
						}), bytes, secs, log.Event  ]);

						sql.release();

					});
				});

			}
		}

		if ( !req.area && req.encrypted )   // log if file path unspecified
			if ( sock = req.reqSocket )  // log if http request socket
				if ( log = req.log )  // log if logging enabled
					logMetrics( log, sock );  

		var myid = CLUSTER.isMaster ? 0 : CLUSTER.worker.id;

		Trace( ( route.name || ("db"+req.action)).toUpperCase() + ` ${req.file} FOR ${req.client} ON CORE${myid}`, req.sql );

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
		area = req.area,
		path = req.path,
		paths = TOTEM.paths;

	//Log([action,path,area,table,type]);
	
	if (area)
		if ( route = TOTEM.byArea[area] )
			followRoute( route, req, res );
	
		else
			followRoute( sendFile, req, res );

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
		route(req, function (data) { 
			//Log({engroute: data});
			
			if (data)
				res( data );
				
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
@class TOTEM.Utilities.Thread_Processing
sql and session thread processing
*/

function sesThread(Req,Res) {	
/**
@method sesThread

Creates a HTTP/HTTPS request-repsonse session thread, then uses the byTable, byArea, 
byType, byActionTable config to route this thread to the appropriate (req,res)-endpoint.
The newly formed request req contains:

		.method: "GET, ... " 		// http method and its ...
		.action: "select, ...",		// corresponding crude name
		.socketio: "path"  // filepath to client's socketio.js
		.where: {...}, 		// sql-ized query keys from url
		.body: {...},		// body keys from request 
		.post: "..."			// raw body text
		.flags: {...}, 		// flag keys from url
		.index: {...}		// sql-ized index keys from url
		.query: {...}, 		// raw keys from url
		.files: [...] 		// files uploaded
		.site: {...}			// skinning context keys
		.sql: connector 		// sql database connector (dummy if no mysql config)
		.url	: "url"				// complete "/area/.../name.type?query" url
		.search: "query"		// query part
		.path: "/..."			// path part 
		.filearea: "area"		// area part
		.filename: "name"	// name part
		.type: "type" 			// type part 
		.connection: socket		// http/https socket to retrieve client cert 

The newly formed response res method accepts a string, an objects, an array, an error, or 
a file-cache function to appropriately respond and close this thread and its sql connection.  
The session is validated and logged, and the client is challenged as necessary.

@param {Object} Req http/https request
@param {Object} Res http/https response
 */
	
	// Session terminating functions to respond with a string, file, db structure, or error message.
	
	function sendString( data ) {  // Send string
		Res.end( data );
		Req.req.sql.release();
	}
		
	function sendFile(path,file,type,area) { // Cache and send file to client
		
		// Trace(`SENDING ${path}`);
		
		var 
			cache = TOTEM.cache,
			errors = TOTEM.errors,
			never = cache.never,
			cache = (never[file] || never[type]) ? {} : cache[area] || cache[type] || {};

		//Log(path, cache[path] ? "cached" : "!cached");
		
		if ( buf = cache[path] )
			sendString( buf );

		else
			FS.readFile( path, (err,buf) => {
				if (err)
					sendError( errors.noFile );

				else
					sendString( cache[path] = new Buffer(buf) );
			});
	}		

	function sendError(err) {  // Send pretty error message
		Res.end( TOTEM.errors.pretty(err) );
		Req.req.sql.release();
	}

	function sendObject(obj) {
		try {
			sendString( JSON.stringify(obj) );
		}
		catch (err) {
			sendErrror( errors.badReturn );
		}		
	}
	
	function sendRecords(recs, req) {  // Send records via converter
		var 
			reqTypes = TOTEM.reqTypes,
			errors = TOTEM.errors;
		
		if (recs)
			if ( conv = reqTypes[req.type] )  // process record conversions
				conv(recs, req, recs => {
					
					if (recs) 
						switch (recs.constructor.name) {
							case "Error":
								sendError( recs );
								break;

							case "String":
								sendString( recs );
								break;

							case "Array":
							case "Object":
							default:
								sendObject( recs );
						} 
					
					else
						sendError( errors.badReturn );
				});

			else 
				sendObject( recs );
		
		else
			sendErrror( errors.badReturn ); 
	}
	
	function res(data) {  // Session response callback
		
		var
			req = Req.req,
			sql = req.sql,
			errors = TOTEM.errors,
			mime = isError(data||0)
				? MIME.types.html
				: MIME.types[req.type] || MIME.types.html || "text/plain",
			paths = TOTEM.paths;

		Res.setHeader("Content-Type", mime);
		Res.statusCode = 200;
			
		if (data)
			switch (data.constructor.name) {  // send based on its type
				case "Error": 			// send error message
					
					switch (req.type) {
						case "db":  
							sendString( JSON.stringify({ 
								success: false,
								msg: data+"",
								count: 0,
								data: []
							}) );
							break;
							
						default:
							sendError( data );
					}
					break;
				
				case "Function": 			// send file (search or direct)
				
					if ( (search = req.query.search) && paths.mysql.search) 		// search for file via (e.g. nlp) score
						sql.query(paths.mysql.search, {FullSearch:search}, function (err, files) {
							
							if (err) 
								sendError( errors.noFile );
								
							else
								sendError( errors.noFile );  // reserved functionality
								
						});
					
					else {			
						if ( credit = paths.mysql.credit)  // credit/charge client when file pulled from file system
							sql.query( credit, {Name:req.node,Area:req.area} )
							.on("result", function (file) {
								if (file.Client != req.client)
									sql.query("UPDATE openv.profiles SET Credit=Credit+1 WHERE ?",{Client: file.Client});
							});

						sendFile( data(), req.file, req.type, req.area );
					}
				
					break;
					
				case "Array": 			// send data records 

					var flag = TOTEM.reqFlags;
					
					if ( req.flags.blog )   // blog back selected keys
						flag.blog( data, req, recs => {
							sendRecords(recs,req);
						});

					else
						sendRecords(data,req);
					
					break;

				case "String":  			// send message
				case "Buffer":
					sendString(data);
					break;
			
				case "Object":
				default: 					// send data record
					sendObject(data);
					break;			
			}

		else
			sendString( data || "" );
			//sendError( errors.noData );
	}

	function getBody( cb ) { // Feed body to callback

		var body = ""; 
		
		Req
		.on("data", function (chunk) {
			body += chunk.toString();
		})
		.on("end", function () {
			cb( body );
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
				sqlThread( sql => {
					req.sql = sql;

					validateClient(req, err => {
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
		
		getBody( body => {  // setup request with body parms 
			/* 
			Define request req 
				.method = GET | PUT | POST | DELETE
				.action = select | update | insert | delete
				.reqSocket = socket to complete request
				.resSocket = socket to complete response
				.socketio: path to client's socketio
				.body = hash of request key:value 
				.post = raw body text
				.url = clean url
			*/
			var 
				paths = TOTEM.paths,		// parse request url into /area/nodes
				onEncrypted = TOTEM.onEncrypted[CLUSTER.isMaster],  // request being made to encrypted service
				req = Req.req = {			// prime session request
					method: Req.method,		// get,put, etc
					started: Req.headers.Date,  // time client started request
					action: TOTEM.crud[Req.method],
					reqSocket: Req.socket,   // use supplied request socket 
					resSocket: getSocket,		// use this method to return a response socket
					encrypted: onEncrypted,	// on encrypted worker
					socketio: onEncrypted ? TOTEM.site.urls.socketio : "",		// path to socket.io
					body: body.parseJSON( body => {  // get parameters or yank files from body 
					
						var files = [], parms = {};

						body.split("\r\n").forEach( line => {
							if (line) 
								if (parms.type) {  // type was defined so have the file data
									files.push( Copy(parms,{data: line, size: line.length}) );
									parms = {};
								}
								else {
									//Trace("LOAD "+line);

									line.split(";").forEach( arg => {  // process one file at a time

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
					}),		// body parameters
					post: body,		// raw body text
					url: (Req.url == "/") ? paths.nourl : unescape(Req.url)		// requested url
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

			conThread( req, err => { 	// start client connection and set the response header

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
					routeNodes(nodes, {}, req, res);

			});

		});
	
	});
}

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
	sock.setEncoding("utf-8");
	sock.write("here is some data for u");
	sock.on("data", function (d) {
		Log("sock rx", d);
		res(d);
	}); */
	
	var Req = HTTP.request( pathto, function(Res) {
		Log("==========SETUP", Res.statusCode, Res.headers);
		
		var body = "";

		Res.setEncoding("utf-8");
		Res.on('data', function (chunk) {  // will not trigger unless worker fails to end socket
			body += chunk;
		});

		Res.on("end", function () {
			Log("=========rx "+body);
			res(body);
		});
		
		Res.on("error", err => {
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

var server = net.createServer(socket => {
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

		//Log(client,parts,userid);
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
	sock.setEncoding("utf-8");
	sock.on("data", req => {
		Log("sock data>>>>",req);
		var 
			Req = Copy({
				socket: sock  // used if master makes handoff
			}, JSON.parse(req)),
			
			Res = {  // used if master does not makes handoff
				end: function (data) {
					sock.write(data);
				}
			};
				
		sesThread(Req,Res);
	});
} */

/**
@class TOTEM.End_Points.System
*/
function sysTask(req,res) {  //< task sharding
/**
@method sysTask
Totem (req,res)-endpoint to shard a task to totem compute nodes.
@param {Object} req Totem request
@param {Function} res Totem response
*/
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
							req.table.tag("?",req.query).tag( "/" + req.table + ".run" ), 
							((body.credit>0) ? "funded" : "unfunded").tag( req.url ),
							"RTP".tag( `/rtpsqd.view?task=${body.name}` ),
							"PMR brief".tag( `/briefs.view?options=${body.name}` )
					].join(" || ")
				}, function (sql,job) {
					//Log("reg job" , job);
					runEngine( job.index );
				});
		
			else
				runEngine( index );
		});
}

function sysPing(req,res) {
/**
@method sysPing
Totem (req,res)-endpoint to test client connection
@param {Object} req Totem request
@param {Function} res Totem response
*/
	res("hello " + req.client + " " + TOTEM.paths.home );
}

function sysFile(req, res) {
/**
@method sysFile
Totem (req,res)-endpoint to send uncached, static files from a requested area.
@param {Object} req Totem request
@param {Function} res Totem response
*/
	
	var 
		sql = req.sql, 
		query = req.query, 
		index = req.index,
		body = req.body,
		client = req.client,
		action = req.action,
		area = req.table,
		path = req.path,
		errors = TOTEM.errors,
		now = new Date();
	
	/*Log({
		p: path,
		q: query,
		b: body,
		a: area,
		c: client,
		n: req.file
	}); */
	
	switch (action) {
		case "select":
			
			if ( req.file )
				try {		// sysFile files are never static so we never cache them
					FS.readFile(path,  (err,buf) => res( err || new Buffer(buf) ) );
				}
				catch (err) {
					res( errors.noFile );
				}
				
			else
				indexFile( path, files => {  // Send list of files under specified folder

					files.forEach( (file,n) => {
						files[n] = file.tag( file );
					});

					res(`Index of ${path}:<br>` + files.join("<br>") );
				});
			
			break;
					
		case "delete":
			res( errors.noFile );
			break;
			
		case "update":
		case "insert":
			var
				canvas = body.canvas || {objects:[]},
				attach = [],
				image = body.image,
				files = image ? [{
					filename: client, //name, // + ( files.length ? "_"+files.length : ""), 
					size: image.length/8, 
					image: image
				}] : body.files || [],
				tags = Copy(query.tag || {}, {Location: query.location || "POINT(0 0)"});

			res( "uploading" );

			canvas.objects.forEach( obj => {	// upload provided canvas objects

				switch (obj.type) {
					case "image": // ignore blob
						break;

					case "rect":

						attach.push(obj);

						sql.query("REPLACE INTO proofs SET ?", {
							top: obj.top,
							left: obj.left,
							width: obj.width,
							height: obj.height,
							label: tag,
							made: now,
							name: area+"."+name
						});
						break;			
				}
			});

			files.forEach( function (file, n) {

				var 
					buf = new Buffer(file.data,"base64"),
					srcStream = new STREAM.Readable({  // source stream for event ingest
						objectMode: true,
						read: function () {  // return null if there are no more events
							this.push( buf );
							buf = null;
						}
					});

				Trace(`UPLOAD ${file.filename} INTO ${area} FOR ${client}`, sql);

				uploadFile( client, srcStream, "./"+area+"/"+file.filename, tags, function (fileID) {

					if (false)
					sql.query(	// this might be generating an extra geo=null record for some reason.  works thereafter.
						   "INSERT INTO ??.files SET ?,Location=GeomFromText(?) "
						+ "ON DUPLICATE KEY UPDATE Client=?,Added=now(),Revs=Revs+1,Location=GeomFromText(?)", [ 
							req.group, {
									Client: req.client,
									Name: file.filename,
									Area: area,
									Added: new Date(),
									Classif: query.classif || "",
									Revs: 1,
									Ingest_Size: file.size,
									Ingest_Tag: query.tag || ""
								}, geoloc, req.client, geoloc
							]);

					if (false)
					sql.query( // credit the client
						"UPDATE openv.profiles SET Credit=Credit+?,useDisk=useDisk+? WHERE ?", [ 
							1000, file.size, {Client: req.client} 
						]);

					if (false) //(file.image)
						switch (area) {
							case "proofs": 

								sql.query("REPLACE INTO proofs SET ?", {
									top: 0,
									left: 0,
									width: file.Width,
									height: file.Height,
									label: tag,
									made: now,
									name: area+"."+name
								});

								sql.query(
									"SELECT detectors.ID, count(ID) AS counts FROM app.detectors LEFT JOIN proofs ON proofs.label LIKE detectors.PosCases AND proofs.name=? HAVING counts",
									[area+"."+name]
								)
								.on("result", function (det) {
									sql.query("UPDATE detectors SET Dirty=Dirty+1");
								});

								break;

						}
				});
			});
			break;
			
	}
}

[  //< date prototypes
].Extend(Date);

[ //< Array prototypes
	function parseJSON(ctx,def) {
		this.forEach( function (key) {
			try {
				ctx[key] = (ctx[key] || "").parseJSON( (val) => def || null );
			}
			catch (err) {
				//Log(err,key,rec[key]);
				ctx[key] = def || null;
			}
		});
		return ctx;
	}
].Extend(Array);

[ //< String prototypes
	function tag(el,at) {
	/**
	@member String
	@method tag

	Tag url (el = ? || &) or html (el = html tag) with specified attributes.

	@param {String} el tag element = ? || & || html tag
	@param {String} at tag attributes = {key: val, ...}
	@return {String} tagged results
	*/

		if (!at) { at = {href: el}; el = "a"; }
		
		if ( el == "?" || el == "&" ) {  // tag a url
			var rtn = this;

			Each(at, (key,val) => {
				rtn += el + key + "=" + ( (typeof val == "string") ? val : JSON.stringify(val) ); 
				el = "&";
			});

			return rtn;	
		}

		else {  // tag html
			var rtn = "<"+el+" ";

			Each( at, (key,val) => rtn += key + "='" + val + "' " );

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

	function parseEval($) {
	/**
	@member String
	@method parseEval

	Parse "$.KEY" || "$[INDEX]" expressions given $ hash.

	@param {Object} $ source hash
	*/
		try {
			return eval(this+"");
		}
		
		catch (err) {
			return err+"";
		}
	},
	
	function parseJS(query, cb) {
	/**
	@member String
	Return an EMAC "...${...}..." string using supplied req $-tokens and plugin methods.
	@param {Object} query context hash
	*/
		try {
			return VM.runInContext( this+"", VM.createContext(query));
		}
		catch (err) {
			//Log("parseJS", this+"", err);
			if ( cb ) 
				return cb(this, err);
			
			else
				return err+"";
		}
	},
	
	function parseEMAC(query) {
	/**
	@member String
	Return an EMAC "...${...}..." string using supplied req $-tokens and plugin methods.
	@param {Object} query context hash
	*/
		try {
			return VM.runInContext( "`" + this + "`" , VM.createContext(query));
		}
		catch (err) {
			return err+"";
		}
	},
	
	function parseJSON(def) {
	/**
	@member String
	@method parseJSON
	Parse string into json.
	@param {Function,Object} def default object or callback that returns default
	*/
		
		try { 
			return JSON.parse(this);
		}
		catch (err) {  
			return def ? (isFunction(def) ? def(this+"") : def) || null : null;
		}
	},

	function parseURL(query,index,flags,where) { 
	/**
	@member String
	@method parseURL
	
	Parse a "PATH?PARM&PARM&..." url into the specified query, index, flags, or keys hash
	as directed by the PARM = ASKEY := REL || REL || _FLAG = VALUE where 
	REL = X OP X || X, X = KEY || KEY$[IDX] || KEY$.KEY

	@param {Object} query hash of query keys
	@param {Object} index hash of sql-ized indexing keys
	@param {Object} flags hash of flag keys
	@param {Object} where hash of sql-ized conditional keys
	*/
		
		function doParm(str) {  // expand parm str 
			doSample( str, res => { // not sampling so try relation
				doRelation(res, where, res => {	// not relation so try index
					//Log("last guess", res);
					return index[res] = escapeId(res);  
				});
			});
		}

		function doSample(str, cb) {  // expand lhs := rhs or callback cb(str)
			function rep(lhs,op,rhs) {
				expand = true;
				var
					rel = doRelation(rhs, {}, res => {	// not relation so assume id
						//Log("no test", res);
						return escapeId(res); 
					});

				return `${rel} AS ${escapeId(lhs)}`;
			}
				
			var 
				expand = false,
				res = str.replace( 
					/(.*)(:=)(.*)/, 
					(rem,lhs,op,rhs) => index[lhs] = rep(lhs,op,rhs) );

			return expand ? res : cb( res );
		}

		function doStore(str, cb) {  // expand "store$expression, ..." or callback(str)
			function rep(lhs,op,rhs) {
				expand = true;
				
				var exs = rhs.split(",");
				exs.forEach( (ex,n) => exs[n] = escape(op+ex) );
				return `json_extract(${escapeId(lhs)}, ${exs.join(",")} )`;
			}

			var 
				expand = false,
				res = str.replace( 
					/(.*)(\$)(.*)/, 
					(rem,lhs,op,rhs) => rep(lhs,op,rhs)  );

			return expand ? res : cb( str );
		}

		function doRelation(str, where, cb) {  // expand "where op val" || "_flag = json" or callback(str)
			
			function rep(lhs,op,rhs) {
				//Log("dotest", lhs, op, rhs);
				expand = true;
				var
					key = doStore(lhs, res => { // lhs not a store so assume keys
						var keys = res.split(",");
						keys.forEach( (key,n) => keys[n] = escapeId(key) );
						return keys.join(",");
					}),
					val = doStore(rhs, res => escape(res) );

				return key.SQLfind(val);
			}

			var
				expand = false,
				res = str.replace( 	// _flag=json
					/^_(.*)(=)(.*)/, 
					(rem,lhs,op,rhs) => {  
						expand = true; 
						
						switch (lhs) {
							case "bin":
								where[lhs] = `MATCH(Description) AGAINST( '${rhs}' IN BOOLEAN MODE)`;
								break;
							case "exp":
								where[lhs] = `MATCH(Description) AGAINST( '${rhs}' IN QUERY EXPANSION)`;
								break;
							case "nlp":
								where[lhs] = `MATCH(Description) AGAINST( '${rhs}' IN NATURAL LANGUAuGE MODE)`;
								break;
							default:
								flags[lhs] = rhs.parseJSON( res => res );
						}
						return rhs;
					});

			if (expand) 
				return res;
			
			else {
				res = str.replace( // where op val
					/(.*)(<=|>=|\!=)(.*)/, 		// \/=|\^=|\|=|
					(rem,lhs,op,rhs) => where[lhs] = rep(lhs,op,rhs) );
				
				if (expand)
					return res;
				
				else {				
					res = str.replace( // where op val
						/(.*)(=|<|>)(.*)/, 
						(rem,lhs,op,rhs) => {
							if (op == "=") query[lhs] = rhs.parseJSON(rhs);		// same raw to query as well
							return where[lhs] = rep(lhs,op,rhs);
						});

					return expand ? res : doStore(str, cb );
				}
			}
		}
		
		var 
			escape = MYSQL.escape,
			escapeId = MYSQL.escapeId,
			parts = this.split("?");

		if ( parms = parts[1] )
			parms.split("&").forEach( (parm) => {
				if (parm) 
					doParm( parm );
			});

		//Log({query: query, index: index, flags: flags, where: where, path: parts[0]});
		
		return parts[0];
	},

	function parseXML(cb) {
	/**
	@member String
	@method parseXML
	
	Parse XML string into json and callback cb(json) 

	@param {Function} cb callback( json || null if error )
	*/
		XML2JS.parseString(this, function (err,json) {				
			cb( err ? null : json );
		});
	}
].Extend(String);

/**
@class TOTEM.Unit_Tests_Use_Cases
*/

switch (process.argv[2]) { //< unit tests
	case "?":
		Log("unit test with 'node totem.js [T1 || T2 || ...]'");
		break;

	case "T1": 
	/**
	@method T1
	Create simple service but dont start it.
	*/
		var TOTEM = require("../totem");

		Trace({
			msg: "Im simply a Totem interface so Im not even running as a service", 
			default_fetcher_endpts: TOTEM.byTable,
			default_protect_mode: TOTEM.faultless,
			default_cores_used: TOTEM.cores
		});
		break;

	case "T2": 
	/**
	@method T2
Totem service running in fault protection mode, no database, no UI; but I am running
with 2 workers and the default endpoint routes.
	*/
		var TOTEM = require("../totem").config({
			mysql: null,
			faultless: true,
			cores: 2
		}, err => {

			Trace( err || 
`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
with 2 workers and the default endpoint routes` );

		});
		break;

	case "T3": 
	/**
	@method T3
I'm a Totem service with no workers. I do, however, have a mysql database from which I've derived 
my startup options (see the openv.apps table for the Nick="Totem1").  
No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
these files. 
	*/

		var TOTEM = require("../totem").config({
		},  err => {
			Trace( err ||
`I'm a Totem service with no workers. I do, however, have a mysql database from which I've derived 
my startup options (see the openv.apps table for the Nick="Totem1").  
No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
these files. `
			);
		});
		break;

	case "T4": 
	/**
	@method T4
As always, if the openv.apps Encrypt is set for the Nick="Totem" app, this service is now **encrypted** [*]
and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
aka core), Im running unprotected, and have a mysql database.  
[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
associated public NICK.crt and private NICK.key certs it creates.
	*/
		
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
		}, err => {
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
	/**
	@method T5
I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.
	*/
		
		var TOTEM = require("../totem").config({
			riddles: 20
		}, err => {
			Trace( err || {
				msg:
`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.`, 
				mysql_derived_parms: TOTEM.site
			});
		});
		break;

	case "T6":
	/**
	@method T6
Testing tasker with database and 3 cores at /test endpoint.
	*/
		
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

		}, err => {
			Trace( err || "Testing tasker with database and 3 cores at /test endpoint" );
		});
		break;
		
	case "T7":
	/**
	@method T7
	*/
		
		var TOTEM = require("../totem").config({
		},  err => {				
			Trace( err || "db maintenance" );

			if (CLUSTER.isMaster)
			TOTEM.thread( sql => {

				switch (process.argv[3]) {
					case 1: 
						sql.query( "select voxels.id as voxelID, chips.id as chipID from app.voxels left join app.chips on voxels.Ring = chips.Ring", function (err,recs) {
							Log(err);
							recs.forEach( rec => {
								sql.query("update app.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], err => {
									Log(err);
								});
							});
						});
						break;

					case 2:
						sql.query("select ID, Ring from app.voxels", function (err, recs) {
							recs.forEach( rec => {
								sql.query(
									"update app.voxels set Point=geomFromText(?) where ?", 
									[ `POINT(${rec.Ring[0][0].x} ${rec.Ring[0][0].y})` , {ID: rec.ID} ], 
									err => {
										Log(err);
								});
							});
						});
						break;

					case 3:
						sql.query( "select voxels.id as voxelID, cache.id as chipID from app.voxels left join app.cache on voxels.Ring = cache.geo1", function (err,recs) {
							Log(err);
							recs.forEach( rec => {
								sql.query("update app.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], err => {
									Log(err);
								});
							});
						});
						break;

					case 4:
						sql.query("select ID, geo1 from app.cache where bank='chip'", function (err, recs) {
							recs.forEach( rec => {
								if (rec.geo1)
									sql.query(
										"update app.cache set x1=?, x2=? where ?", 
										[ rec.geo1[0][0].x, rec.geo1[0][0].y, {ID: rec.ID} ], 
										err => {
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
