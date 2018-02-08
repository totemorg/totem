// UNCLASSIFIED 

/**
@class TOTEM

nodejs
@requires http
@requires https
@requires fs
@requires constants
@requires clusters
@requires child-process
@requires os

totem
@requires enum
@requires jsdb

3rd party
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

var												// NodeJS modules
	HTTP = require("http"),						//< http interface
	HTTPS = require("https"),					//< https interface
	CP = require("child_process"),				//< spawn OS shell commands
	FS = require("fs"),							//< access file system
	CONS = require("constants"),				//< constants for setting tcp sessions
	CLUSTER = require("cluster"),				//< multicore  processing
	URL = require("url"),						//< url parsing
	NET = require("net"), 				// network interface
	OS = require('os');					// OS utilitites

var 											// 3rd party modules
	MIME = require("mime"), 			//< file mime types
	SIO = require('socket.io'), 			//< Socket.io client mesh
	SIOHUB = require('socket.io-clusterhub'),	//< Socket.io client mesh for multicore app
	MYSQL = require("mysql"),					//< mysql conector
	XML2JS = require("xml2js"),					//< xml to json parser (*)
	BUSY = require('toobusy-js'),  		//< denial-of-service protector (cant install on NodeJS 5.x+)
	JS2XML = require('js2xmlparser'), 			//< JSON to XML parser
	JS2CSV = require('json2csv'); 				//< JSON to CSV parser	
	
var 											// Totem modules
	JSDB = require("jsdb"),				//< JSDB database agnosticator
	ENUM = require("enum"),					//< Basic enumerators
	sqlThread = JSDB.thread,
	Copy = ENUM.copy,
	Each = ENUM.each,
	Log = console.log;

var
	TOTEM = module.exports = ENUM.extend({

	dogs: { //< watchdog functions(sql, lims)
	},
		
	watchFile: function (area, name, cb) { //< callback cb(sql, name, path) when file at path has changed
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
	nodeDivider: "$$", 				//< node divider
	
	/**
	@cfg {Number}
	@member TOTEM
	Max files to index by the indexer() method (0 disables).
	*/
	maxFiles: 100,						//< max files to index

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
		
	Array: [ 			//< Array prototypes
		
		function hyper(refs, arg) {
		/**
		@private
		@member Array
		Returns list containing hyperlink list joined by an arg spearator.
		@param {Function} cb callback(val) returns item for join
		*/		
			var rtns = [], ref = ref[0];
			this.each( function (n,lab) {
				rtns.push( lab.hyper(refs[n] || ref) );
			});
			return rtns.join(arg);
		},
						  
		function treeify(idx,kids,level,piv,wt) {
		/**
		@private
		@method treeify
		@member Array
		Returns list as a tree containing children,weight,name leafs.
		@param [Number] idx starting index (0 on first call)
		@param [Number] kids number of leafs following starting index (this.length on first call)
		@param [Number] level current depth (0 on first call)
		@param [Array] piv pivots
		@param [String] wt key name that contains leaf weight (defaults to "size")
		*/		
			
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
		}
	
	],

	String: [ 			//< String prototypes
		function each(pat, rtn, cb) {
		/**
		@private
		@member String
		Enumerate over pattern found in a string.
		@param {String} pat pattern to find
		@param {Array} rtn list being extended by callback
		@param {Function} cb callback(rtn)
		*/
			
			var msg = this;
			
			while ( (idx = msg.indexOf(pat) ) >=0 ) {
				
				msg = msg.substr(0,idx) + cb(rtn) + msg.substr(idx+pat.length);
				
			}

			return msg;
		},

		function format(req,plugin) {
		/**
		@private
		@member String
		Return an EMAC "...${...}..." string using supplied req $-tokens and plugin methods.
		*/
			
			function Format(X,S) {
			/*
			 * Format a string S containing ${X.key} tags.  The String wrapper for this
			 * method extends X with optional plugins like X.F = {fn: function (X){}, ...}.
			 */

				try {
					return eval("`" + S + "`");
				}
				catch (err) {
					return S;
				}

			}
			
			req.plugin = req.F = plugin || {};
			return Format(req,this);
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
		
		function parseQuery(def) { 
		/**
		@private
		@member String
		Parse a "&key=val&key=val?query&relation& ..." query into 
		the default hash def = {key:val, key=val?query, relation:null, key:json, ...}.
		*/
			
			var lastkey = "";

			this.split("?").each( function (qn, query) {
				query.split("&").each( function (pn,parm) {

					if (parm) 								
						if ( qn ) def[lastkey] += (pn ? "&" : "?") + parm;

						else {
							var	
								parts = parm.split("="),  // split into key=val
								key = parts[0],
								val = parm.substr( key.length+1 );

							if (key)   // key = val used
								try {  // val could be json 
									def[lastkey = key] = JSON.parse(val); 
								}
								catch (err) { 
									def[lastkey = key] = unescape(val);
								}

							else 		// store key relationship (e.g. key<val or simply key)
								def[parm] = null;
						}
				});
			});

			//Log([this+"", def]);
			return def;
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
		},
						
		function hyper(ref) {
		/**
		@private
		@member String
		Return a hyperlink of given label string.
		*/
			if (ref)
				if (ref.charAt(0) == ":")
					return this.link( "/"+(ref.substr(1)||this.toLowerCase())+".view" );
				else
					return this.link(ref);
			else
				return this.link(ref || "/"+this.toLowerCase()+".view");
		}
		
	],
	
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
	@private
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
	
			traps: { flag:cb(query,flags), ...} // sets trap cb for a _flag=list to reorganize the query and flags hash,
			edits: { flag:cb(list,data,req), ...} // sets data conversion cb for a _flag=list,
			prefix:  "_" 	// sets flag prefix
	*/
	reqFlags: {				//< Properties for request flags
		strips:	 			//< Flags to strips from request
			{"":1, "_":1, leaf:1, _dc:1, id:1, "=":1, "?":1, "request":1}, 		

		id: "ID", 					//< SQL record id
		prefix: "_",				//< Prefix that indicates a field is a flag
		trace: "_trace" 		//< Echo flags before and after parse		
	},

	/**
	@cfg {Object} 
	@member TOTEM
	Data fetcher X is used when a GET on X is requested.  Fetchers feed data pulled from the
	TOTEM.paths.url[req.table] URL (formatted by an optional plugin context) to its callback:
	
			X: cb(url, res),
			X: cb(...),
			...
			plugin: {
				var: ...
				var: ...
				...
				method: function () {...}
				method: function () {...}
				...
			}
	*/
	fetchers: { 			//< data fetchers
		curl: curlFetch,
		wget: wgetFetch,
		http: httpFetch,
		plugin: {			//< example fetch url plugins
			ex1: function (req) {
				return req.profile.QoS + req.profile.Credit;
			},
			ex2: "save.file.jpg",
			wgetout: "./shares/wget.out"
		}
	},

	/**
	@cfg {Object} 
	@member TOTEM
	Mysql connection options: 
	
		host: name
		user: name
		pass: phrase
		sessions: number	
	*/		
	mysql: null,			
	
	/**
	@cfg {String} [encrypt=""]
	@member TOTEM
	Cert passphrase to start encrypted service
	*/		
	encrypt: "",		//< passphrase when service encypted 
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
	@cfg {Number} [masterport=8080]
	@member TOTEM	
	Port for master HTTP/HTTPS service.  If cores>0, masterport should != workPort, master becomes HTTP server, and workers
	become HTTP/HTTPS depending on encrypt option.  In the coreless configuration, master become HTTP/HTTPS depending on 
	encrypt option, and there are no workers.  In this way, a client can access stateless workers on the workerport, and stateful 
	workers via the masterport.	
	*/				
	masterport: 8080,				 //< master port for stateful threads
	/**
	@cfg {Number} [workerport=8443]
	@member TOTEM	
	Port for worker HTTP/HTTPS service.  If cores>0, masterport should != workPort, master becomes HTTP server, and workers
	become HTTP/HTTPS depending on encrypt option.  In the coreless configuration, master become HTTP/HTTPS depending on 
	encrypt option, and there are no workers.  In this way, a client can access stateless workers on the workerport, and stateful 
	workers via the masterport.	
	*/				
	workerport: 8443, 				//< worker port for stateless threads
		
	/**
	@cfg {String} [host="localhost"]
	@member TOTEM	
	Service host name 
	*/		
	host: "localhost", 		//< Service host name 

	/**
	@cfg {Obect}
	@member TOTEM	
	Folder watching callbacks cb(path) 
	*/				
	watch: {		//< Folder watching callbacks cb(path) 
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
	name: "Totem",

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
		riddle: checkRiddle
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
	
	fetch: {
		wget: fetchWget,
		curl: fetchCurl,
		http: fetchHttp
	},

	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Trust store extened with certs in the certs.truststore folder when the service starts in encrypted mode
	*/		
	trust: [ ],   
		
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	CRUDE (req,res) method to respond to Totem request
	*/				
	server: null,
	
	//======================================
	// CRUDE interface
		
	/**
	@cfg {Function}
	@method select
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem request
	@param {Function} res Totem responder
	*/				
	select: selectDS,	
	/**
	@cfg {Function}	
	@method update
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem request
	@param {Function} res Totem responder
	*/				
	update: updateDS,
	/**
	@cfg {Function}	
	@method delete
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem request
	@param {Function} res Totem responder
	*/				
	delete: deleteDS,
	/**
	@cfg {Function}
	@method insert
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem request
	@param {Function} res Totem responder
	*/				
	insert: insertDS,
	/**
	@cfg {Function}
	@method execute
	@member TOTEM	
	CRUDE (req,res) method to respond to a Totem request
	@param {Object} req Totem request
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
	started: null, //< totem start time
		
	/**
	@cfg {Number} [retries=5]
	@member TOTEM	
	Maximum number of retries the data fetcher will user
	*/				
	retries: 5,			//< Maximum number of retries the data fetcher will user
		
	/**
	@cfg {Boolean} [notify=true]
	@member TOTEM	
	Enable/disable tracing of data fetchers
	*/		
	notify: true, 	//< Enable/disable tracing of data fetchers

	/**
	@cfg {Boolean} [nofaults=false]
	@member TOTEM	
	Enable/disable service protection mode
	*/		
	nofaults: false,		//< Enable/disable service protection mode
		
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Service protections when in nofaults mode
	*/		
	protect: {				
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
	
	/**
	@cfg {Function} 
	@member TOTEM	
	Additional session validator(req,res) responds will null if client validated, otherwise
	responds with an error.
	*/		
	validator: null,	
	
	/**
	@cfg {Object} 
	@member TOTEM	
	Null to admitRule all clients, or {X:"required", Y: "optional", ...} to admitRule clients with cert organizational
	credentials X.
	*/		
	admitRule: null, 	
		/*{ "u.s. government": "required",
		  	"us": "optional"
		  }*/

	/**
	@cfg {Object}
	@member TOTEM	
	Default guest profile (unencrypted or client profile not found)
	*/		
	guestProfile: {				
		Banned: "",
		QoS: 10000,
		Credit: 100,
		Charge: 0,
		LikeUs: 0,
		Challenge: 1,
		Client: "guest@guest.org",
		User: "guest@guest",
		Group: "app",
		Repoll: true,
		Retries: 5,
		Timeout: 30,
		Message: "Welcome guest - what is (riddle)?"
	},

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
	@cfg {Number} [riddles=0]
	@member TOTEM	
	Number of riddles to protect site (0 to disable anti-bot)
	*/		
	riddles: 0, 			
	
	//proxy: proxyService,  //< default relay if needed
	isEncryptedWorker: false, 	//< enabled by config if worker service is HTTPS encrypted
	//workers: [],
		
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Default paths to service files
	*/		
	paths: { 			
		default: "files/",
		
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
			derive: "SELECT *, count(ID) AS Count FROM openv.apps WHERE ? LIMIT 0,1",
			record: "INSERT INTO app.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?, Event=?",
			search: "SELECT * FROM app.files HAVING Score > 0.1",
			credit: "SELECT * FROM app.files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 0,1",
			upsession: "INSERT INTO openv.sessions SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1,?",
			challenge: "SELECT *,count(ID) as Count FROM openv.profiles WHERE least(?) LIMIT 0,1",
			guest: "SELECT * FROM openv.profiles WHERE Client='guest' LIMIT 0,1",
			pocs: "SELECT lower(Hawk) AS Role, group_concat(DISTINCT Client SEPARATOR ';') AS Contact FROM openv.roles GROUP BY hawk"
		},
		
		mime: { // default static file areas
			files: ".", // path to shared files 
			captcha: ".",  // path to antibot captchas
			index: { // indexers
				files: "indexer"
			},
			extensions: {  // extend mime types as needed
			}
		}
	},

	/**
	@cfg {Boolean} 
	@member TOTEM	
	Enable to admit guest clients making https requests
	*/		
	admitGuests: true, //< enable to admit guest clients making https requests
		
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
		noRoute: new Error("no endpoint here"),
		badQuery: new Error("invalid query"),
		badGroup: new Error("invalid group requested"),
		lostConnection: new Error("client connection lost"),
		noDB: new Error("database unavailable"),
		noProfile: new Error("user profile could not be determined"),
		failedUser: new Error("failed modification of user profile"),
		missingPass: new Error("missing initial user password"),
		expiredCert: new Error("cert expired"),
		rejectedCert: new Error("cert rejected"),
		tooBusy: new Error("too busy - try again later"),
		noFile: new Error("file not found"),
		noIndex: new Error("cannot index files here"),
		badType: new Error("no such dataset type"),
		badReturn: new Error("nothing returned"),
		noSockets: new Error("socket.io failed"),
		noService: new Error("no service  to start"),
		noData: new Error("no data returned"),
		retryFetch: new Error("data fetch retries exceeded"),
		notAllowed: new Error("this dataset interface is disabled"),
		noAccess: new Error("no access to master core at this endpoint")
	},

	/**
	@method 
	@config {Function}
	@member TOTEM	
 	File indexer
	*/		
	indexer: indexFile,

	/**
	@cfg {Function}
	@method uploader
	@member TOTEM	
	File uploader 
	*/			
	uploader: uploadStream,	
	
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
			});

		if (derive = mysql.derive)  // derive site context vars
			sql.query(derive, {Nick:TOTEM.name})
			.on("result", function (opts) {

				if ( opts.Count )
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
			})
			.on("error", function (err) {
				Log(err);
				throw TOTEM.errors.noDB;
			});
			/*
			sql.indexJsons( "openv.apps", {}, function (jsons) {	// get site json vars
			}); */
		
		else 
		if (cb) cb();
					
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
	},
	
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	ENUM will callback this initializer when the service is started
	*/		
	Function: Initialize  //< added to ENUM callback stack
	
});

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
	res( TOTEM.paths.TOTEM.errors.noRoute );
}

function insertDS(req,res) {
/**
 * @private
 * @method insertDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.paths.TOTEM.errors.notAllowed );
}

function deleteDS(req,res) {
/**
 * @private
 * @method deleteDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.paths.TOTEM.errors.notAllowed );
}

function executeDS(req,res) {
/**
 * @private
 * @method executeDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.paths.TOTEM.errors.notAllowed );
}

/**
 * @class TOTEM
 **/

function configService(opts,cb) {
/**
 * @private
 * @method configService
 * Configure, protect, connect, then start this server.
 * @param {Object} opts configuration options following the ENUM.Copy() conventions.
 * @param {Function} cb callback() after service configured
 * */

	TOTEM.extend(opts);
	
	var
		name  = TOTEM.name,
		mysql = TOTEM.mysql,
		paths = TOTEM.paths,
		site = TOTEM.site;

	Trace(`CONFIG ${name}`); 
	
	TOTEM.started = new Date();

	Copy(paths.mime.extensions, MIME.types);

	if (mysql) 
		JSDB.config({   // establish the db agnosticator 
			//io: TOTEM.IO,   // cant set socketio until after server defined by startService

			fetchers: TOTEM.fetchers,
			
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
		}, function (sql) {  // derive server vars and site context vars
		
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

	else
		protectService(cb || function (err) {
			Trace(err || `STARTED ${name} UNENCRYPTED`, sql);			
		});
	
	return TOTEM;
}

function startService(server,cb) {
/**
 * @private
 * @method startService
 * Attach the responder to this server then initialized.
 * @param {Object} server HTTP/HTTP server
 * @param {Function} cb callback(err) when service initialized.
 * */
	
	var 
		name = TOTEM.name,
		site = TOTEM.site,
		paths = TOTEM.paths;
	
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

	TOTEM.flush();  		// flush enum's config callback stack

	if (TOTEM.isEncryptedWorker && site.urls.socketio) {   // attach "/socket.io" with SIO and setup connection listeners
		var 
			IO = TOTEM.IO = JSDB.io = SIO(server, { // use defaults but can override ...
				//serveClient: true, // default true to prevent server from intercepting path
				//path: "/socket.io" // default get-url that the client-side connect issues on calling io()
			}),
			HUBIO = TOTEM.HUBIO = new (SIOHUB); 		//< Hub fixes socket.io+cluster bug	
			
		if (IO) { 							// Setup client web-socket support
			Trace("ATTACH SOCKETS AT "+IO.path());
			
			IO.on("connection", function (socket) {  // Trap every connect				
				//Trace(">ALLOW CLIENT CONNECTIONS");
				socket.on("select", function (req) { 		// Trap connect raised on client "select/join request"
					
					Trace(`>CONNECTING ${req.client}`);
					sqlThread( function (sql) {	

						var ses = {
							Client	: req.client,
							Location: req.location,
							Connects: 1,
							ipAddress: req.ip,
							Joined: new Date(),
							Message: req.message
						};
						
						if (upsession = paths.mysql.upsession) 
							sql.query(upsession, [ses, {
								Location: req.location,
								ipAddress: req.ip,
								Joined: new Date()
							}]);

						if (challenge = paths.mysql.challenge)
							sql.query(challenge, {Client:req.client, Challenge:1})
							.on("result", function (profile) {

								if (profile.Count) challengeClient(req.client, profile);	

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
			
			cb( null );
		}
		
		else 
			return cb( TOTEM.errors.noSockets );	
	}
	
	else
		cb( null );
		
	// The BUSY interface provides a mean to limit client connections that would lock the 
	// service (down deep in the tcp/icmp layer).  Busy thus helps to thwart denial of 
	// service attacks.  (Alas latest versions do not compile in latest NodeJS.)
	
	if (BUSY && TOTEM.busycycle) 
		BUSY.maxLag(TOTEM.busycycle);
	
	// listening on-routes message

	if (TOTEM.cores) 					// Start for master-workers
		if (CLUSTER.isMaster) {			// Establish master port
			
			server.listen(TOTEM.masterport, function() {  // Establish master
				Trace(`SERVE ${site.urls.master}`);
			});
			
			CLUSTER.on('exit', function(worker, code, signal) {
				Trace(`TERMINATE core-${worker.id} ${code||"ok"}`);
			});

			CLUSTER.on('online', function(worker) {
				Trace(`CONNECT core-${worker.id}`);
			});
			
			for (var core = 0; core < TOTEM.cores; core++) {  
				worker = CLUSTER.fork();
				Trace(`FORK core-${worker.id}`);
			}
		}
		
		else 								// Establish worker port			
			server.listen(TOTEM.workerport, function() {
				Trace(`SERVE ${site.urls.worker} ON core-${CLUSTER.worker.id}`);
			});
	
	else 								// Establish master-only
		server.listen(TOTEM.workerport, function() {
			Trace(`SERVE ${site.urls.master}`);
		});
		
			
	if ( TOTEM.nofaults)  { // catch core faults
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

	if (CLUSTER.isMaster)
		sqlThread( function (sql) {
			initializeService(sql);
		});
	
}
		
function connectService(cb) {
/**
 * @private
 * @method connectService
 * If the TOTEM server already connected, inherit the server; otherwise
 * define an the apprpriate http interface (https if encrypted, 
 * http if unencrypted), then start the server.
 * @param {Function} cb callback when done
 * */
	
	var 
		name = TOTEM.name,
		paths = TOTEM.paths,
		certs = TOTEM.cache.certs;
		
	if ( TOTEM.isEncryptedWorker ) {  

		Copy({		// cache server data fetching certs 
			pfx: FS.readFileSync(`${paths.certs}${name}.pfx`),
			crt: `${paths.certs}${name}.crt`,
			key: `${paths.certs}${name}.key`
		}, certs);

		//Log({certcache: certs});
		
		try {  // build the trust strore
			Each( FS.readdirSync(paths.certs+"/truststore"), function (n,file) {
				if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
					Trace("TRUSTING "+file);
					TOTEM.trust.push( FS.readFileSync( `${paths.certs}truststore/${file}`, "utf8") );
				}
			});
		}
		
		catch (err) {
		}

		startService( HTTPS.createServer({
			passphrase: TOTEM.encrypt,		// passphrase for pfx
			pfx: certs.pfx,			// TOTEM.paths's pfx/p12 encoded crt+key TOTEM.paths
			ca: TOTEM.trust,				// list of TOTEM.paths authorities (trusted serrver.trust)
			crl: [],						// pki revocation list
			requestCert: true,
			rejectUnauthorized: true
			//secureProtocol: CONS.SSL_OP_NO_TLSv1_2
		}) , cb );
	}
	
	//else
	//if (CLUSTER.isMaster && TOTEM.cores)
	//	startService( NET.createServer(), cb );
	
	else 
		startService( HTTP.createServer(), cb );
		
	
}

function protectService(cb) {
/**
 * @private
 * @method protectService
 * Create the server's PKI certs (if they dont exist), setup its urls, then connect the service.
 * @param {Function} cb callback when done
 * 
 * */
	
	var 
		name = TOTEM.name,
		dom = ( TOTEM.encrypt ? "https://" : "http://" ) + TOTEM.host,
		paths = TOTEM.paths,
		sock = TOTEM.sockets ? paths.url.socketio : "", 
		pfxfile = `${paths.certs}${name}.pfx`;

	Trace(`PROTECT ${name}`);
	
	TOTEM.site.urls = TOTEM.cores 
		? {  // establish site urls
			socketio: sock,
			worker:  dom + ":" + TOTEM.workerport,
			master:  "http://" + TOTEM.host + ":" + TOTEM.masterport
		}
		
		: {
			socketio: sock,
			worker:  dom + ":" + TOTEM.workerport,
			master:  dom + ":" + TOTEM.workerport,
		};

	if ( TOTEM.isEncryptedWorker  = TOTEM.encrypt && (CLUSTER.isWorker || !TOTEM.cores) )   // derive a pfx cert if this is an encrypted service
		FS.access( pfxfile, FS.F_OK, function (err) {

			if (err) {
				var owner = TOTEM.name;
				Trace( "CREATE SERVERCERT FOR "+owner );
			
				createCert(owner,TOTEM.encrypt,function () {
					connectService(cb);
				});				
			}
				
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
			Trace(`STOP ${TOTEM.name}`);
		});
}

function initializeService(sql) {
	
	// clear system logs
	
	sql.query("DELETE FROM openv.syslogs");

	// initialize file watcher

	sql.query("UPDATE app.files SET State='watching' WHERE Area='uploads' AND State IS NULL");
	
	var watchMods = TOTEM.watchMods;

	Each(TOTEM.watch, function (area, cb) {  // callback cb(sql,name,area) when file changed
		FS.readdir( area, function (err, files) {
			if (err) 
				Trace(err);

			else
				files.each(function (n,file) {

					if (file.charAt(0) != ".") 
						TOTEM.watchFile( area, file, cb);
				});
		});	
	});
	
	// start watch dogs
	
	Each( TOTEM.dogs, function (key, dog) {
		if ( dog.cycle ) {
			Trace("DOGGING "+key);
			setInterval( function (args) {

				Trace("DOG "+args.name);

				sqlThread( function (sql) {
					dog(sql, dog);
				});

			}, dog.cycle*1e3, {
				name: key
			});
		}
	});
}

/**
@class USER maintenance of users and their profiles
 */

function selectUser(req,res) {
/**
@private
@method selectUser
Return user profile information
@param {Object} req Totem request 
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
@method updateUser
Update user profile information
@param {Object} req Totem request 
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
@method deleteUser
Remove user profile.
@param {Object} req Totem request 
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
@method insertUser
Create user profile, associated certs and distribute info to user
@param {Object} req Totem request 
@param {Function} res Totem response
 */
			
	var sql = req.sql, query = req.query || {}, isHawk = req.cert.isHawk; 
	
	var url = TOTEM.paths.url;
	
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
/**
@private
@method executeUser
Fetch user profile for processing
@param {Object} req Totem request 
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
@class PKI utilities to create and manage PKI certs
 */

function createCert(owner,pass,cb) {
/**
 * @method createCert
 * 
 * Create a cert for the desired owner with the desired passphrase with callback 
 * to cb when complete.
 * */

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
		
	traceExecute(`echo -e "\n\n\n\n\n\n\n" | openssl req -x509 -nodes -days 5000 -newkey rsa:2048 -keyout ${key} -out ${crt}`, function () { 
		
	traceExecute(
		`export PASS="${pass}";openssl pkcs12 -export -in ${crt} -inkey ${key} -out ${pfx} -passout env:PASS`, 
		function () {
		
	traceExecute(
		`cp ${crt} ${truststore}`,
		function () {
			
	traceExecute(
		`puttygen ${owner}.key -N ${pass} -o ${ppk}`, 	
		function () {
		
		Trace("IGNORE PREVIOUS PUTTYGEN ERRORS IF NOT INSTALLED"); 
		cb();
	});
	});
	});
	});

}

function validateClient(req,res) {  //< validate client with callback res(null) if client can be admitted otherwise res(error)
/**
@method validateClient
@param {Object} req totem request
@param {Function} res totem response

Responds will res(null) if session is valid or res(err) if session invalid.  Adds the client's session metric log, 
org, serverip, group, profile, db journalling flag, time joined, email and client ID to this req request.  
 * */
	
	function getCert() {
	/*
	Return a suitable cert for https or http connections for this req.socket.  If we are going through a
	proxy, cert information is derived from the request headers.
	*/
	
		var 
			cert =  (sock ? sock.getPeerCertificate ? sock.getPeerCertificate() : null : null) || {		//< default cert
				issuer: {},
				subjectaltname: "",
				subject: {},
				valid_to: null,
				valid_from: null
			};			
		
		if (TOTEM.behindProxy) {  // when going through a proxy, must update cert with originating cert info that was placed in header
			var 
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

			var CN = cert.subject.CN;

			if (CN) {
				CN = CN.split(" ");
				cert.subject.CN = CN[CN.length-1] + "@coe.ic.gov";
			}
		}
		
		return cert;
	}
				
	function admitClient(req, res, profile, cert, client) {   // callback res(null) if client can be admited; otherwise res(error)
	/* 
	If the client's cert is good,respond with res(null), then add the client's session metric log, org, serverip, 
	group, profile, db journalling flag, time joined, email and client ID to this req request.  The cert is also
	cached for future data fetching to https sites.  If the cert is bad, then respond with res(err).
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
		
		if ( TOTEM.isEncryptedWorker ) {  // validate client's cert

			if ( now < new Date(cert.valid_from) || now > new Date(cert.valid_to) )
				return res( TOTEM.errors.expiredCert );

			if (admitRule = TOTEM.admitRule)
				if ( !(cert.issuer.O.toLowerCase() in admitRule && cert.subject.C.toLowerCase() in admitRule) ) 
					return res( TOTEM.errors.rejectedCert );

		}

		if (profile.Banned)  // block client if banned
			return res( new Error(profile.Banned) );
			
		sql.query("show session status like 'Thread%'", function (err,stats) {  		// start session metric logging
			if (err)
				stats = [{Value:0},{Value:0},{Value:0},{Value:0}];
			
			Copy({  // add session metric logs and session parms
				log: {  								// potential session metrics to log
					Event: now,		 					// start time
					Action: req.action, 				// db action
					ThreadsRunning: stats[3].Value,		// sql threads running
					ThreadsConnected: stats[1].Value,	// sql threads connected
					Stamp: TOTEM.name,					// site name
					Util : cpuavgutil(),				// cpu utilization
					Fault: "isp"						// fault codes
					//Cores: site.Cores, 					// number of safety core hyperthreads
					//VMs: 1,								// number of VMs
					//Client: client, 				// client id
					//Table: req.table, 					// db target
					//RecID: req.query.ID || 0,			// sql recID
				},

				org		: cert.subject.O || "unknown",  // cert organization 
				serverip: sock ? sock.address().address : "unknown",
				group	: profile.Group, // || TOTEM.site.db, 
				profile	: new Object(profile),  // complete profile
				onencrypted: CLUSTER.isWorker,  // flag
				journal : true,				// journal db actions
				joined	: now, 				// time joined
				email	: client, 			// email address from pki
				client	: client			// client ID
			}, req);

			res(null);
		});	
		
	}
	
	var 
		sql = req.sql,
		sock = req.reqSocket,
		cert = getCert(),
		now = new Date(),		
		client = (cert.subject.emailAddress || cert.subjectaltname || cert.subject.CN || TOTEM.guestProfile.Client).split(",")[0].replace("email:","");

	TOTEM.cache.certs[client] = new Object(cert);
		
	if (TOTEM.mysql)  // get client's profile
		sql.query("SELECT *,count(ID) as Count FROM openv.profiles WHERE ? LIMIT 0,1", {client: client})
		.on("result", function (profile) {
			
			if (profile.Count)
				admitClient(req, res, profile, cert, client);
				
			else
			if (TOTEM.admitGuests) {
				delete TOTEM.guestProfile.ID;
				Trace("ADMIT GUEST", sql);
				sql.query(  // prime a profile if it does not already exist
					"INSERT INTO openv.profiles SET ?", Copy({
					Client: client,
					User: client.replace("ic.gov","").replace(/\./g,"").toLowerCase()
				}, TOTEM.guestProfile), function (err) {
					
					admitClient(req, res, TOTEM.guestProfile, cert, client);
					
				});
			}
			else
				res( TOTEM.errors.noProfile );
			
		})
		.on("error", function (err) {
			res( TOTEM.errors.noProfile );
		});
	
	else 
	if (TOTEM.encrypt)
		res( TOTEM.errors.noDB );
	
	else {  // setup guest connection
		req.socket = null;
		admitClient(req, res, TOTEM.guestProfile, cert, client);		
		res( null );
	}
}

/**
@class MIME static file indexing and uploading
 */

function indexFile(path,cb) {	
/**
* @method indexFile
* @param {Object} path file path
* @param {Function} cb totem response
*/
	var files = [];
	
	findFile(path, function (n,file) {
		files.push( (file.indexOf(".")>=0) ? file : file+"/" );
	});
	
	cb( files );
}	

function findFile(path,cb) {
/**
* @method findFile
* @param {Object} path file path
* @param {Function} cb totem response
*/
	if (maxFiles = TOTEM.maxFiles)
		try {
			FS.readdirSync(path).each( function (n,file) {
				if (n > maxFiles) return true;

				if (file.charAt(0) != "_" && file.charAt(file.length-1) != "~") 
					cb(n,file);
			});
		}
		catch (err) {
		}
	
	else
		cb( [] );
	
}

function getFile(client, filepath, cb) {  // allocate a file with callback cb(sql, area, fileID) if no errors
	var
		parts = filepath.split("/"),
		name = parts.pop() || "",
		area = parts[0] || "";

	sqlThread( function (sql) {		
		sql.getFirst( 
			"FILE", 
			"SELECT ID FROM app.files WHERE least(?,1) LIMIT 1", {
				Name: name,
				Client: client,
				Area: area
			}, 
			function (file) {

			if ( file )
				cb( sql, area, file.ID );

			else
				sql.getAll( 
					"FILE", 
					"INSERT INTO app.files SET Added=now(), ?", {
						Name: name,
						Client: client,
						Area: area,
						Notes: "Please visit " + "here".tag("a", {href:"/files.view"}) + " to manage your files"
					}, 
					function (info) {
						cb( sql, area, info.insertId );
					});

		});
	});
}

function uploadStream( srcStream, client, sinkPath, tags, cb ) {  // callback cb(fileID) if no errors
	
	getFile(client, sinkPath, function (sql, area, fileID) {
		var 
			notes = "Please visit " + "here".tag("a",{href:"/files.view"}) + " to manage your holdings.",
			folder = TOTEM.paths.mime[area],
			sinkStream = FS.createWriteStream( folder + "/" + sinkPath, "utf8")
				.on("finish", function() {  // establish sink stream for export pipe
					//Trace("EXPORTED "+sinkPath);
					Log("totem done uploading");
					sqlThread( function (sql) {

						//if (cb) cb(fileID);

						sql.query("UPDATE apps.files SET ? WHERE ?", [ Copy( tags || {}, {
							Notes: "Uploaded on " + new Date() + notes
						}), {ID: fileID} ] );

						sql.release();
					});
				})
				.on("error", function (err) {
					Log("totem upload error", err);
					sqlThread( function (sql) {
						sql.query("UPDATE app.files SET ? WHERE ?", [ {
							Notes: "Upload failed: " + err + notes
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

function uploadFile( files, client, area, tags, cb) {
/**
@private
@method uploadFile
@param {Object} sql sql connector
@param {Array} files files to upload
@param {String} area area to upload files into
@param {Function} res totem response
*/

	/*
	function copyFile(srcFile, sinkFile, cb) {
		var src = FS.createReadStream(srcFile);
		var sink = FS.createWriteStream(sinkFile);
		
		sink		
			.on("finish", function() {  // establish sink stream for export pipe
				//Trace("EXPORTED "+filePath);
				sql.query("UPDATE apps.files SET ? WHERE ?", {
					Notes: "Exported on " + new Date() + notes
				}, {ID: fileID} );
			})
			.on("error", function (err) {
				Log("Ingest File Error", err);
				sql.query("UPDATE app.files SET ? WHERE ?", {
					Notes: "Export failed: " + err + notes
				}, {ID: fileID} );
			});
		
		/ *
		var cbCalled = false;
		function done(err) {
			if (!cbCalled) {
				cb(err);
				cbCalled = true;
			}
		}
		rs.on("error", function(err) {
		done(err);
		});

		ws.on("error", function(err) {
		done(err);
		});
		ws.on("close", function(ex) {
		done();
		}); * /

		src.pipe(sink);
	}

	var arrived = new Date();
	*/
	
	files.each( function (n,file) {
		var 
			name = file.filename,
			target = TOTEM.paths.mime[area]+"/"+area+"/"+name;

		Trace(`UPLOAD ${name}`);
		
		cb( file );
		
		if ( file.image ) {

			var prefix = "data:image/png;base64,";	
			var buf64 = new Buffer(file.image.substr(prefix.length), 'base64');
			var temp = `tmp/temp.png`;  // many browsers only support png so convert to jpg

			FS.writeFile(temp, buf64.toString("binary"), {encoding:"binary"}, function (err) {
				Log("SAVE "+name+" TO "+target+(err?" FAILED":""));

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
			switch ( file.type ) { 
				/*
				case "image/jpeg":  // legacy

					var buf = new Buffer(file.data, "base64");
					FS.writeFile(target, buf.toString("binary"), {encodings:"binary"}, function (err) {
						Log(err);
					});
					break;
				*/
					
				case "image/jpeg":
				case "application/pdf":
				case "application/javascript":
				default:
					var 
						buf = new Buffer(file.data,"base64");
					
					FS.writeFile(target, buf,  "base64", function (err) {
						if (err) Log(err);
					}); 
			}

		/*
		copyFile(file.path, target, function (err) {

			console.info("SAVE "+file.path+" TO "+target+(err?" FAILED":""));

			if (cb) cb({
				Name: name,
				Area: area,
				Added: arrived,
				Size: file.size
			});

			if (false)
				APP.NEWREAD.JOB(sql,body.Area,name);
		});*/
	
	});
}

/**
@class FETCH method to pull external data
 */

function fetchWget(req,res) {	//< wget endpoint
	if (req.out) 
		TOTEM.fetchers.plugin.wgetout = req.out;
		
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

function curlFetch(url,cb) {

	var 
		opts = URL.parse(url),
		certs = TOTEM.cache.certs,
		transport = {
			"http:": `curl "${url}"`,
			"https:": `curl -gk --cert ${certs.crt} --key ${certs.key} "${url}"`
		};

	retryFetch(
		transport[opts.protocol],
		opts, 
		function (err,out) {
			try {
				cb( JSON.parse(out));
			}
			catch (err) {
				cb( null );
			}
	});

}

function wgetFetch(url,cb) { 
		
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
						cb( TOTEM.errors.retryFetch );
				}
				else
				if (cb) cb(null, stdout);
			});
		}

		opts.retry = TOTEM.retries;

		if (opts.retry) 
			trycmd(cmd,cb);
		
		else
			CP.exec(cmd, function (err,stdout,stderr) {			
				cb( err , stdout );
			});
	}

	var 
		parts = url.split(" >> "),
		url = parts[0],
		out = parts[1] || "./shares/junk.jpg",		
	
		opts = URL.parse(url),
		certs = TOTEM.cache.certs,
		transport = {
			"http:": `wget -O ${out} "${url}"`,
			"https:": `wget -O ${out} --no-check-certificate --certificate ${certs.crt} --private-key ${certs.key} "${url}"`
		};
	
	retryFetch(
		transport[opts.protocol],
		opts, 
		function (err) {
			cb( err ? null : "ok" );
	});
	
}

function httpFetch(url,cb) {
			
	var 
		opts = URL.parse(url), 
		certs = TOTEM.cache.certs,
		transport = {
			"http:": HTTP,
			"https:": HTTPS
		};
	
	opts.pfx = certs.pfx;
	opts.passphrase = TOTEM.encrypt;
	opts.retry = TOTEM.retries;
	opts.rejectUnauthorized = false;
	opts.agent = false;

	/*if (opts.soap) {
		opts.headers = {
			"Content-Type": "application/soap+xml; charset=utf8",
			"Content-Length": opts.soap.length
		};
		opts.method = "POST";
	}*/
	
	Trace("FETCH "+url);
	
	if (opts.protocol) {
		var Req = transport[opts.protocol].request(opts, function(Res) {
			var body = "";
			Res.on('data', function (chunk) {
				body += chunk.toString();
			});

			Res.on("end", function () {
				try {
					cb( JSON.parse(body) );
				}
				catch (err) {
					cb( null );
				}					
			});

		});

		Req.on('error', function(err) {
			cb( null );
		});

		/*if (opts.soap)
			Req.write(opts.soap);*/  // only for put method

		Req.end();
	}
	
	else
		cb( null );
}

/*
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
*/

/**
@class ANTIBOT data theft protection
 */

function checkRiddle(req,res) {	//< endpoint to check clients response to a riddle
/**
@private
@method checkRiddle
Endpoint to check clients response req.query to a riddle created by challengeClient.
@param {Object} req http request
@param {Function} res Totem response callback
*/
	var 
		query = req.query,
		sql = req.sql;
		
	sql.query("SELECT *,count(ID) as Count FROM openv.riddles WHERE ? LIMIT 0,1", {Client:query.ID})
	.on("result", function (rid) {
		
		var 
			ID = {Client:rid.ID},
			guess = (query.guess+"").replace(/ /g,"");

Log([rid,query]);

		if (rid.Count) 
			if (rid.Riddle == guess) {
				res( "pass" );
				//sql.query("DELETE FROM openv.riddles WHERE ?",ID);
			}
			else
			if (rid.Attempts > rid.maxAttempts) {
				res( "fail" );
				//sql.query("DELETE FROM openv.riddles WHERE ?",ID);
			}
			else {
				res( "retry" );
				sql.query("UPDATE openv.riddles SET Attempts=Attempts+1 WHERE ?",ID);
			}
		else 
			res( "fail" );
		
	});
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
	
	var riddle = TOTEM.riddle = [],
		N = TOTEM.riddles,
		map = TOTEM.riddleMap,
		ref = "/captcha";
	
	for (var n=0; n<N; n++)
		riddle.push( Riddle(map,ref) );
}

function makeRiddles(msg,rid,ids) {
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
		return "cac card challenge TBD";
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

function challengeClient(client, profile) {
/**
@private
@method challengeClient
Challenge a client with specified profile parameters
@param {String} client name of client being challenged
@param {Object} profile client's profile .Message = riddle mask, .IDs = {id:value, ...}
*/
	var 
		rid = [],
		reply = (TOTEM.riddleMap && TOTEM.riddles)
				? makeRiddles( profile.Message, rid, profile.IDs.parseJSON({}) )
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

function Initialize () {
/**
@private
@member TOTEM
@method 
Initialize TOTEM.
*/
	
	Trace(`INIT ${TOTEM.name} WITH ${TOTEM.riddles} RIDDLES`);
	
	initChallenger();
	
}

/**
@class ROUTING methods to route notes byType, byAction, byTable, byActionTable, byArea.
*/

function parseNode(req) {
/**
@private
@method parseNode
Parse node request to define req.table, .path, .area, .query, .search, .type, .file, .flags, and .body.
@param {Object} req http session
*/
	var
		node = URL.parse(req.node),
		path = req.path = node.path,
		search = req.search = node.query || "",
		query = req.query = search.parseQuery({}),
		areas = node.pathname.split("/"),
		file = req.filename = areas.pop() || (areas[1] ? "" : TOTEM.paths.default),
		parts = req.parts = file.split("."),
		type = req.type = parts[1] || "",
		table = req.table = parts[0] || "",
		area = req.filearea = areas[1] || "";

	//Log("requset",req);
	
	if ( req.filepath = req.filearea ? TOTEM.paths.mime[req.filearea] || req.filearea : "" )
		req.filepath += node.pathname;

	else {
		req.filearea = "";

		// flags and joins

		var 
			reqFlags = TOTEM.reqFlags,
			strips = reqFlags.strips,
			prefix = reqFlags.prefix,
			traps = reqFlags.traps,
			id = reqFlags.id,
			body = req.body,
			flags = req.flags,
			joins = req.joins;

		/*
		Log({before: {
			a: req.action,
			q: query,
			b: body,
			f: flags
		}}); */

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

		if (traps)
			for (var n in traps) 		// let traps remap query-flag parms
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
Parse the node=/dataset.type on the current req thread, then route it to the approprate TOTEM byArea, 
byType, byActionTable, engine or file indexer (see config documentation).
*/
	
	parseNode(req);

	function sendFile(req,res) {
		//Log("send file", req.filepath);
		res( function () {return req.filepath; } );
	}1

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

function followRoute(route,req,res) {
/**
@private
@method followRoute
Log session metrics, trace the current route, then callback route on the supplied 
request-response thread
*/

	function logMetrics() { // log session metrics 
		
		if ( sock=req.socket ) 
		if ( record=TOTEM.paths.mysql.record ) {
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
						sql.query(record, [ Copy(log, {
							Delay: secs,
							Transfer: bytes,
							Event: sock._started,
							Dataset: req.table,
							Client: rec.client,
							Actions: 1
						}), bytes, secs, log.Event  ]);
					
					else { // bucket track
						sql.query(record, [ Copy(log, {
							Delay: secs,
							Transfer: bytes,
							Event: sock._started,
							Dataset: req.table,
							Actions: 1
						}), bytes, secs, log.Event  ]);

						sql.query(record, [ Copy(log, {
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

	if ( !req.filepath && TOTEM.isEncryptedWorker ) logMetrics();  // dont log file requests
	var myid = CLUSTER.isMaster ? 0 : CLUSTER.worker.id;

	Trace( 
		(route?route.name:"null").toUpperCase() 
		+ ` ${req.filename} FOR ${req.group}.${req.client} ON CORE${myid}`, req.sql);

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

/**
@class THREAD sql and session thread processing
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
			joins: {...}, 		// experimental ds from-to joins
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
		if ( indexer = index[area] ) { // index files
			TOTEM[indexer](path, function (files) { // use configured indexer
				sendFileIndex(`Index of ${path}`, files);
			});
		}
		
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
			if ( conv = reqTypes[req.type] || reqTypes.default )
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
			sendErrror( errors. noData ); 
	}
	
	function res(ack) {  // Session response callback
		
		var
			req = Req.req,
			sql = req.sql,
			mime = ( (ack||0).constructor == Error) 
				? MIME.types.html
				: MIME.types[req.type] || MIME.types.html || "text/plain",
			paths = TOTEM.paths;

		Res.setHeader("Content-Type", mime);
		Res.statusCode = 200;
		
		try {		
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
								sendError( TOTEM.errors.noFile );
								
							else
								sendError( TOTEM.errors.noFile );  // reserved functionality
								
						});
					
					else {		// credit/charge client when file pulled from file system	
						if (paths.mysql.credit)
							sql.query( paths.mysql.credit, {Name:req.node,Area:req.filearea} )
							.on("result", function (file) {
								if (file.Client != req.client)
									sql.query("UPDATE openv.profiles SET Credit=Credit+1 WHERE ?",{Client: file.Client});
							});

						sendCache( ack(), req.filename, req.type, req.filearea );
					}
				
					break;
					
				case Array: 			// send data records 

					if ( blog = req.flags.blog ) {  // blog back selected keys
						var keys = blog.split(","), recs = ack;
						if ( blog = TOTEM.reqFlags.blog ) {
							recs.each( function (n, rec) {
								keys.each(function (n,key) {
									if ( val = rec[key] )
										if (val.constructor == String)
											blog( val, rec, req.table, function (html) {
												rec[key] = html;
											});
								});
							});
							sendRecords(ack,req,res);
						}
						else
							sendRecords(ack,req,res);
					}
					
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
		}

		catch (err) {
			sendError( TOTEM.errors.badReturn );
		}
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
	
	function conThread(req, res) {  //< establish request connection with callbacl res(null) if started otherwise res(error)
	/**
	 * @private
	 * @method conThread
	 * Start a connection thread cb(err) containing a Req.req.sql connector,
	 * a validated Req.req.cert certificate, and set appropriate Res headers. 
	 * 
	 * @param {Object} req request
	 * @param {Function} res response
	 *
	 * on-input req = {action, socketio, query, body, flags, joins}
	 * on-output req =  adds {log, cert, client, org, serverip, session, group, profile, journal, 
	 * joined, email and STATICS}
	 * */

		if (sock = req.reqSocket )
			resThread( req, function (sql) {
				validateClient(req, function (err) {
					if (err)
						res(err);

					else 
						if (TOTEM.mysql)
							sql.query("SELECT * FROM openv.sessions WHERE ?", {Client: req.client}, function (err,ses) {
								
								if ( err )
									return res(err);
								
								if ( !ses.length)
									req.session = {
										Client: "guest",
										ipAddress : "unknown",
										Location: "unknown",
										Joined: new Date()
									};
								
								else
									req.session = new Object(ses[0]);
									
								if (validator = TOTEM.validator) 
									validator(req, res);
								
								else
									res(null);
								
							});

						else
						if (validator = TOTEM.validator) 
							validator(req, res);

						else
							res( null );
				});
			});
		
		else 
			Res.end( TOTEM.errors.pretty(TOTEM.errors.lostConnection ) );
	}

	function getSocket() {  // returns req/res socket if this isnt/is a cross domain session
		if ( Req.headers.origin ) {  // xdom session is progress from master (http) to its workers (https)
			Res.writeHead(200, {"content-type": "text/plain", "access-control-allow-origin": "*"});
			Res.socket.write(Res._header);
			Res._headerSent = true;
			return Res.socket;
		}
		else 
			return Req.socket;
	}
		
	startSession( function() {  // process if session not busy
		
		getBody( function (body) {  // parse body, query and route

			var 
				// parse request url into /area/nodes
				paths = TOTEM.paths,

				// prime session request hash
				req = Req.req = {
					method: Req.method,
					action: TOTEM.crud[Req.method],
					reqSocket: Req.socket,
					resSocket: getSocket,
					socketio: TOTEM.encrypt ? TOTEM.site.urls.socketio : "",
					query: {},
					body: body,
					flags: {},
					joins: {},
					site: TOTEM.site
				},

				// get a clean url
				/*
				There exists an edge case wherein an html tag within json content, e.g <img src="/ABC">, 
				is reflected back the server as a /%5c%22ABC%5c%22 which then unescapes to /\\"ABC\\".
				This is ok but can be confusing.
				*/				
				url = req.url = unescape(Req.url),

				// get a list of all nodes
				nodes = (nodeDivider = TOTEM.nodeDivider)
					? url ? url.split(nodeDivider) : []
					: url ? [url] : [] ;

			conThread( req, function (err) { 	// start session with client

				// must carefully set appropriate heads to prevent http-parse errors when using master-worker proxy
				if ( TOTEM.isEncryptedWorker )
					Res.setHeader("Set-Cookie", ["client="+req.client, "service="+TOTEM.name] );						

				
				if (err) 					// session validator rejected (bad cert)
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

function resThread(req, cb) {
/**
 * @private
 * @method resThread
 * @param {Object} req Totem request
 * @param {Function} cb sql connector callback(sql)
 *
 * Callback with request set to sql conector
 * */
	sqlThread( function (sql) {
		cb( req.sql = sql );
	});
}

function Trace(msg,sql) {
	ENUM.trace("T>",msg,sql);
}

function proxyService(req, res) {  // not presently used but might want to support later
	
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

							
// UNCLASSIFIED
