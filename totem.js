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

@requires mime
@requires enum
@requires dsvar

@requires socket.io
@requires socket.io-clusterhub
@requires mysql
@requires xml2js
@requires toobusy
@requires json2csv
@requires js2xmlparser
 */

var												// NodeJS modules
	HTTP = require("http"),						//< NodeJs module
	HTTPS = require("https"),					//< NodeJs module
	CP = require("child_process"),				//< NodeJs module
	FS = require("fs"),							//< NodeJs module
	CONS = require("constants"),				//< NodeJs module
	CLUSTER = require("cluster"),				//< NodeJs module
	URL = require("url"),						//< NodeJs module
	OS = require('os');					// OS utilitites

var 											// 3rd party modules
	SIO = require('socket.io'), 			//< Socket.io client mesh
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

var
	TOTEM = module.exports = ENUM.extend({

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
	Reserved for dataset attributes derived by DSVAR.config
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
						  
		function joinify(cb) {
		/**
		@private
		@member Array
		Return list joined under control by an optional callback.
		@param {Function} cb callback(val) returns item for join
		*/
			
			var rtn = [];

			for (var n=0, N=this.length; n<N; n++) 
				rtn.push( cb ? cb(this[n]) : this[n] );
				
			return rtn.join(",");
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
						//console.log([pos,idx,end,key,ref,recs.length]);
						
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
	
		function parse(rtn) { 
		/**
		@private
		@member String
		Parse a JSON string or parse a "&key=val&key=val?query&relation& ..." string into 
		the default rtn = {key:val, key=val?query, relation:null, key:json, ...} hash.
		*/
			
			if (this)
				try {  // could be json string
					return JSON.parse(this);
				}
				catch (err) {  // "&key=val ..." string
					
					if ( !rtn ) // no default method so return null
						return null;
					
					else
					if (rtn.constructor == Function)  // use supplied parse method
						return rtn(this);
					
					var key = "";

					this.split("?").each( function (m,parms) {
						
						if (m && key) 
							rtn[key] += "?" + escape(parms);
					
						else
							parms.split("&").each(function (n,parm) {  // get a key=val parm
						
								var	
									parts = parm.split("="),  // split into key=val
									val = parts.pop();

								key = parts.pop(); 

								if (key)   // key = val used
									try {  // val could be json 
										rtn[key] = JSON.parse(val); 
									}
									catch (err) { 
										rtn[key] = unescape(val);
									}
						
								else 		// store key relationship (e.g. key<val or simply key)
									rtn[parm] = null;
							});
					});

					return rtn;
				}
		
			else
				return rtn;
			
		},
		
		function xmlParse(def, cb) {
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
	Thread a new sql connection to a callback.  Unless overridden, will default to the DSVAR thread method.
	@param {Function} cb callback(sql connector)
	 * */
	thread: DSVAR.thread,
		
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
	reqflags: {				//< Properties for request flags
		strips:	 			//< Flags to strips from request
			{"":1, "_":1, leaf:1, _dc:1, id:1, "=":1, "?":1, "request":1}, 		

		traps: {   			//< Traps to redefine flags
		},
		
		edits: { 			 //< Data convertors
		},
		
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
	Number of worker cores (0 for master-only startup)
	*/				
	cores: 0,	//< Number of worker cores (0 for master-only startup)
		
	/**
	@cfg {Number} [port=8080]
	@member TOTEM	
	Service port number
	*/				
	port: 8080,				  //< Service port number
		
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
		
	/**
	@cfg {Boolean} [proxy=false]
	@member TOTEM	
	Enable if https server being proxied
	*/				
	proxy: false,		//< Enable if https server being proxied

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
	Endpoint converters cb(ack data as string || error)
	*/
	converters: {  
		db: function (ack, req, cb) {
			if ( ack.constructor == Array ) 
				req.sql.query("select found_rows()")
				.on('result', function (stat) {		// ack from sql				

					cb({ 
						succcess: true,
						msg: "",
						count: stat["found_rows()"] || 0,
						data: ack
					});

				})
				.on("error", function () {  		// ack from virtual table

					cb({ 
						success: true,
						msg: "",
						count: ack.length,
						data: ack
					});

				});

			else 
				cb({ 
					success: true,
					msg: "",
					count: 0,
					data: ack
				});
		},
		
		csv: function (ack, req, cb) {
			JS2CSV({ 
				data: ack, 
				fields: Object.keys( ack[0]||{} )
			} , function (err,csv) {
				cb( err ? TOTEM.errors.badType : csv );
			});
		},
		
		xml: function (ack, req, cb) {
			cb( JS2XML.parse(req.table, {  
				count: ack.length,
				data: ack
			}) );
		}
		
		/*
		html: function (ack, req, cb) {
			var rtn = "";
			ack.each(function (n,html) {
				rtn += html;
			});
			cb(rtn);
		}*/
	},

	/**
	@cfg {Object} 
	@member TOTEM	
	By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management
	*/				
	byTable: {				
		wget: fetchWget,
		curl: fetchCurl,
		http: fetchHttp,
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
			user: selectUser
		},
		delete: {
			user: deleteUser
		},
		update: {
			user: updateUser
		},
		insert: {
			user: insertUser
		},
		execute: {
			user: executeUser
		}
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
	@cfg {Boolean} [faultless=false]
	@member TOTEM	
	Enable/disable service protection mode
	*/		
	faultless: false,		//< Enable/disable service protection mode
		
	/**
	@cfg {Object} 
	@private
	@member TOTEM	
	Service protections when in faultless mode
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
			
		certs: { 
			truststore: "certs/truststore/",
			server: "certs/"
		},
		
		mysql: {
			users: "SELECT 'user' AS Role, group_concat(DISTINCT dataset SEPARATOR ';') AS Contact FROM app.dblogs WHERE instr(dataset,'@')",
			derive: "SELECT *, count(ID) AS Count FROM openv.apps WHERE ? LIMIT 0,1",
			record: "INSERT INTO app.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?, Event=?",
			search: "SELECT * FROM app.files HAVING Score > 0.1",
			credit: "SELECT * FROM app.files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 0,1",
			upsession: "INSERT INTO openv.sessions SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1,?",
			challenge: "SELECT *,count(ID) as Count FROM openv.profiles WHERE least(?) LIMIT 0,1",
			guest: "SELECT * FROM openv.profiles WHERE Client='guest' LIMIT 0,1",
			pocs: "SELECT lower(Hawk) AS Role, group_concat(DISTINCT Client SEPARATOR ';') AS Contact FROM openv.roles GROUP BY hawk",
		},
		
		mime: { // default static file areas
			files: ".", // path to shared files 
			captcha: ".",  // path to antibot captchas
			index: { // indexers
				files: "indexer"
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
			return (err+"");
		},
		noProtocol: new Error("no protocol specified to fetch"),
		noRoute: new Error("no route"),
		badQuery: new Error("invalid query"),
		badGroup: new Error("invalid group requested"),
		lostConnection: new Error("client connection lost"),
		noDB: new Error("no database available"),
		noProfile: new Error("user profile could not be determined"),
		failedUser: new Error("failed modification of user profile"),
		missingPass: new Error("missing initial user password"),
		expiredCert: new Error("cert expired"),
		rejectedCert: new Error("cert rejected"),
		tooBusy: new Error("too busy - try again later"),
		noFile: new Error("file not found"),
		noIndex: new Error("no file indexer provider"),
		badType: new Error("bad dataset presentation type"),
		badReturn: new Error("nothing returned"),
		noSockets: new Error("socket.io failed"),
		noService: new Error("no service  to start"),
		badData: new Error("data has circular reference"),
		retryFetch: new Error("data fetch retries exceeded"),
		cantConfig: new Error("cant derive config options")
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
	uploader: uploadFile,	
	
	/**
	@cfg {Number}
	@member TOTEM	
	Server toobusy check period in seconds
	*/		
	busycycle: 3,  //< site too-busy check interval [s] (0 disables)
			
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
				Trace( TOTEM.errors.cantConfig );
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
	cache: { 				//< by-area cache
		
		never: {	//< stuff to never cache - useful while debugging client side stuff
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
		
		clients: {  // file types under clients areas being cached
			js: {},
			css: {},
			ico: {}
		},
		
		"socket.io": {  // cache js in socketio area 
			js: {}
		},
		
		certs: {} 		// reserved for crts in certs area
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
	res( TOTEM.paths.TOTEM.errors.noRoute );
}

function deleteDS(req,res) {
/**
 * @private
 * @method deleteDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.paths.TOTEM.errors.noRoute );
}

function executeDS(req,res) {
/**
 * @private
 * @method executeDS
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
	res( TOTEM.paths.TOTEM.errors.noRoute );
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

	Trace(`CONFIGURING ${name}`); 
	
	TOTEM.started = new Date();

	Each(TOTEM.watch, function (folder, cb) {
		FS.readdir( folder, function (err, files) {
			if (err) 
				Trace(err);
			
			else
				files.each(function (n,file) {
					var path = folder + "/" + file;

					Trace("WATCHING "+path);
					FS.watch(path, function (ev, file) {  //{persistent: false, recursive: false}, 

						Trace(ev+" "+file);

						if (TOTEM.thread && file)
							switch (ev) {
								case "change":
									TOTEM.thread( function (sql) {
										/*READ.byType(sql, path+file, function (keys) {
											console.log(["keys",keys]);
										});
										*/
										if (file.charAt(0) == ".") { // swp being updated
											path = folder+"/"+file.substr(1).replace(".swp","");
											cb(path, ev, sql);
										}

										/*
										else
											cb(path, ev, sql);
										*/
									});

									break;

								case "x":
								default:

							}
					});
				});
		});	
	});
				
	if (mysql) 
		DSVAR.config({   // establish the db agnosticator 
			//io: TOTEM.IO,   // cant set socketio until after server defined by startService

			mysql: Copy({ 
				opts: {
					host: mysql.host,   // hostname 
					user: mysql.user, 	// username
					password : mysql.pass,				// passphrase
					connectionLimit : mysql.sessions || 100, 		// max simultaneous connections
					//acquireTimeout : 10000, 			// connection acquire timer
					queueLimit: 0,  						// max concections to queue (0=unlimited)
					waitForConnections: true			// allow connection requests to be queued
				}
			}, mysql)
		}, function (sql) {  // derive server vars and site context vars
		
			for (var n in mysql)  // derive server paths
				if (n in paths) paths[n] = mysql[n];

			if (name)	// derive site context
				TOTEM.setContext(sql, function () {
					protectService(cb || function (err) {
						Trace(err || `STARTED ${name} ENCRYPTED`);
					});
				});

			TOTEM.dsAttrs = DSVAR.dsAttrs;
			//sql.release();
		});	

	else
		protectService(cb || function (err) {
			Trace(err || `STARTED ${name} UNENCRYPTED`);			
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
	
	Trace(`STARTING ${name}`);
	
	TOTEM.server = server || { 	// define server
		listen: function () {
			Trace("NO SERVER");
		},
		on: function () {
			Trace("NO SERVER");
		}
	};
	
	if (server && name) 			// attach responder
		server.on("request", sesThread);
	
	else
		return cb( TOTEM.errors.noService );

	TOTEM.flush();  		// init of client callstack via its Function key

	if (TOTEM.encrypt && site.urls.socketio) {   // attach "/socket.io" with SIO and setup connection listeners
		var 
			IO = TOTEM.IO = DSVAR.io = SIO(server, { // use defaults but can override ...
				//serveClient: true, // default true to prevent server from intercepting path
				//path: "/socket.io" // default get-url that the client-side connect issues on calling io()
			}),
			HUBIO = TOTEM.HUBIO = new (SIOHUB); 		//< Hub fixes socket.io+cluster bug	
			
		if (IO) { 							// Setup client web-socket support
			Trace("ATTACHING CLIENT SOCKETS AT "+IO.path());
			
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

			IO.on("connect_error", function (err) {
				Trace(err);
			});
			
			IO.on("disconnection", function (socket) {
				Trace(">>DISCONNECT CLIENT");
			});	
			
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

	var endpts = Object.keys( TOTEM.select ).join();

	if (TOTEM.cores) 					// Establish master and worker cores
		if (CLUSTER.isMaster) {			// Establish master
			
			server.listen(TOTEM.port+1, function() {  // Establish master
				Trace(`SERVING ${site.urls.master} AT [${endpts}]`);
			});
			
			if ( TOTEM.faultless) {
				process.on("uncaughtException", function (err) {
					console.warn(`SERVICE FAULTED ${err}`);
				});
				
				process.on("exit", function (code) {
					console.warn(`SERVICE EXITED ${code}`);
				});

				for (var n in TOTEM.faultless)
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
		
		else {								// Establish worker cores
			server.listen(TOTEM.port, function() {
				Trace(`CORE${CLUSTER.worker.id} ROUTING ${site.urls.worker} AT [${endpts}]`);
				//cb(null);
			});
			
			if ( TOTEM.faultless)
				CLUSTER.worker.process.on("uncaughtException", function (err) {
					console.warn(`CORE${CLUSTER.worker.id} FAULTED ${err}`);
				});	
		}
	
	else 								// Establish worker
		server.listen(TOTEM.port, function() {
			Trace(`SERVING ${site.urls.master} AT ${endpts}`);
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
		port = TOTEM.port,
		name = TOTEM.name,
		certs = TOTEM.paths.certs;
	
	Trace((TOTEM.encrypt?"ENCRYPTED":"UNENCRYPTED")+` CONNECTION ${name} ON PORT ${port}`);

	if (TOTEM.encrypt) {  // build the trust strore
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
			startService( HTTPS.createServer({
				passphrase: TOTEM.encrypt,		// passphrase for pfx
				pfx: FS.readFileSync(`${certs.server}${name}.pfx`),			// TOTEM.paths's pfx/p12 encoded crt+key TOTEM.paths
				ca: TOTEM.trust,				// list of TOTEM.paths authorities (trusted serrver.trust)
				crl: [],						// pki revocation list
				requestCert: true,
				rejectUnauthorized: true
				//secureProtocol: CONS.SSL_OP_NO_TLSv1_2
			}) , cb );

		else 
			startService( null, cb );
	}
	
	else
	if (port)
		startService( HTTP.createServer(), cb );
	
	else 
		startService( null, cb );
	
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
		encrypt = TOTEM.encrypt,
		name = TOTEM.name,
		certs = TOTEM.paths.certs;

	Trace(`PROTECTING ${name}`);
	
	TOTEM.site.urls = {  // establish site urls
		socketio:TOTEM.sockets ? TOTEM.paths.url.socketio : "",
		master: (TOTEM.encrypt ? "https" : "http") + "://" + TOTEM.host + ":" + (TOTEM.cores ? TOTEM.port+1 : TOTEM.port) + "/",
		worker: (TOTEM.encrypt ? "https" : "http") + "://" + TOTEM.host + ":" + TOTEM.port + "/"					
	};
					
	TOTEM.cache.certs = {		// cache data fetching certs 
		pfx: FS.readFileSync(`${certs.server}fetch.pfx`),
		crt: `${certs.server}fetch.crt`,
		key: `${certs.server}fetch.key`
	};
	
	if (encrypt)   // derive a pfx cert if this is an encrypted service
		FS.access(`${certs.server}${name}.pfx`, FS.F_OK, function (err) {

			if (err) {
				var owner = TOTEM.name;
				Trace(`CREATING SERVER CERTIFICATE FOR ${owner}`);
			
				createCert(owner,encrypt,function () {
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
			Trace(`STOPPED ${TOTEM.name}`);
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
			var q = sql.query(
				"SELECT * FROM openv.profiles WHERE Requested AND NOT Approved AND least(?,1)", 
				query.user ? {User: query.user} : 1 )
				
			.on("result", function (user) {
				Trace(q.sql);
				
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

function executeUser(req,res) {	
/**
@private
@method executeUser
Fetch user profile for processing
@param {Object} req Totem request 
@param {Function} res Totem response
 */
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
		name = TOTEM.paths.certs.server + owner, 
		truststore = TOTEM.paths.certs.server + "truststore",
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

function validateCert(req,res) {
/**
@method validateCert
@param {Object} req totem request
@param {Function} res totem response

Responds will res(null) if session is valid or res(err) if session invalid.  Adds the client's session metric log, 
org, serverip, group, profile, db journalling flag, time joined, email and client ID to this req request.  
 * */
				
	function getCert() {
	/*
	Return a suitable cert for https or http connections for this req.connection.  If we are going through a
	proxy, cert information is derived from the request headers.
	*/
	
		var 
			con = req.connection,
			cert =  (con ? con.getPeerCertificate ? con.getPeerCertificate() : null : null) || {		//< default cert
				issuer: {},
				subjectaltname: "",
				subject: {},
				valid_to: null,
				valid_from: null
			};			
		
		if (TOTEM.proxy) {  // when going through a proxy, must update cert with originating cert info that was placed in header
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
				
	function admitClient(req, res, profile, cert, client) {
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
		
		if (TOTEM.encrypt) {  // validate client's cert

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
				serverip: req.connection ? req.connection.address().address : "unknown",
				group	: profile.Group, // || TOTEM.site.db, 
				profile	: new Object(profile),  // complete profile
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
				Trace("ADMITTING GUEST");
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
		req.connection = null;
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

function uploadFile( files, area, cb) {
/**
@private
@method uploadFile
@param {Object} sql sql connector
@param {Array} files files to upload
@param {String} area area to upload files into
@param {Function} res totem response
*/

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
		var 
			name = file.filename,
			target = TOTEM.paths.mime[area]+"/"+area+"/"+name;

		//console.log([name, target, file]);
		
		cb( file );
		
		if ( file.image ) {

			var prefix = "data:image/png;base64,";	
			var buf64 = new Buffer(file.image.substr(prefix.length), 'base64');
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
			switch ( file.type ) { 
				/*
				case "image/jpeg":  // legacy

					var buf = new Buffer(file.data, "base64");
					FS.writeFile(target, buf.toString("binary"), {encodings:"binary"}, function (err) {
						console.log(err);
					});
					break;
				*/
					
				case "image/jpeg":
				case "application/pdf":
				case "application/javascript":
				default:
					var buf = new Buffer(file.data,"base64");
					FS.writeFile(target, buf,  "base64", function (err) {
						if (err) console.log(err);
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

	var opts = URL.parse(url),
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
		opts = URL.parse(url),
		certs = TOTEM.cache.certs,
		transport = {
			"http:": `wget -O ${TOTEM.fetchers.plugin.wgetout} "${url}"`,
			"https:": `wget -O ${TOTEM.fetchers.plugin.wgetout} --no-check-certificate --certificate ${certs.crt} --private-key ${certs.key} "${url}"`
		};
	
	retryFetch(
		transport[opts.protocol],
		opts, 
		function (err) {
			cb( err ? null : TOTEM.fetchers.plugin.wgetout);
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
	
	//console.log(opts);
	
	if (opts.protocol) {
		var req = transport[opts.protocol].request(opts, function(res) {
			res.setEncoding('utf-8');

			var atext = "";
			res.on('data', function (chunk) {
				atext += chunk;
			});

			res.on("end", function () {
				try {
					cb( JSON.parse(atext) );
				}
				catch (err) {
					cb( null );
				}					
			});

		});

		req.on('error', function(err) {
			cb( null );
		});

		/*if (opts.soap)
			req.write(opts.soap);*/

		req.end();
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

console.log([rid,query]);

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
				? makeRiddles( profile.Message, rid, (profile.IDs||"").parse({}) )
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
	
	Trace(`INITIALIZED WITH ${TOTEM.riddles} RIDDLES`);
	
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
		search = req.search = node.query || "",
		query = req.query = search.parse({}),
		areas = node.pathname.split("/"),
		file = req.file = areas.pop() || (areas[1] ? "" : TOTEM.paths.default),
		parts = req.parts = file.split("."),
		type = req.type = parts[1] || "",
		table = req.table = parts[0] || "",
		area = req.area = areas[1] || "";
		
	if ( req.path = req.area ? TOTEM.paths.mime[req.area] || req.area : "" )
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
		edits = reqflags.edits,
		traps = reqflags.traps,
		id = reqflags.id,
		trace = query[reqflags.trace],
	
		body = req.body,
		flags = req.flags,
		joins = req.joins;

	/*
	console.log({
			i: "before",
			a: req.action,
			q: query,
			b: body,
			f: flags
		});
	*/
	
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
		if ( flags[n] )
			traps[n](req);
	
	if (trace)
		console.log({
			action: req.action,
			query: query,
			body: body,
			flags: flags,
			joins: joins
		});
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
			acks[req.file] = ack;
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
		res( function () {return req.path; } );
	}

	var
		sql = req.sql,
		node = req.node,
		table = req.table,
		type = req.type,
		action = req.action,
		area = req.area,
		paths = TOTEM.paths;

	//console.log([action,req.path,area,table,type]);
	
	if (req.path) 
		followRoute( route = TOTEM.byArea[area] || sendFile, req, res );

	else
	if ( route = TOTEM.byType[type] ) 
		followRoute(route,req,res);
	
	else
	if ( route = TOTEM.byActionTable[action][table])
		followRoute(route,req,res);
	
	else
	if ( route = TOTEM.byTable[table] ) 
		followRoute(route,req,res);
	
	/*
	else  // attempt to route to engines then to database
	if ( route = TOTEM.byAction ) 
		route[action](req, function (ack) { 
			if ( (ack||0).constructor == Error)
				if ( route = TOTEM[action] )
					followRoute(route,req,res);

				else 
					res( TOTEM.errors.noRoute );

			else 
				res( ack );
		});	
	*/
	
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
		
		if ((con=req.connection) && (record=TOTEM.paths.mysql.record)) {
			var log = req.log;
		
			con._started = new Date();
			
			/*
			If maxlisteners is not set to infinity=0, the connection becomes sensitive to a sql 
			connector t/o and there will be random memory leak warnings.
			*/
			
			con.setMaxListeners(0);
			con.on('close', function () { 		// cb when connection closed
				
				var 
					secs = ((new Date()).getTime() - con._started.getTime()) / 1000,
					bytes = con.bytesWritten,
					log = req.log;
				
				sqlThread( function (sql) {

					if (false)  // grainular track
						sql.query(record, [ Copy(log, {
							Delay: secs,
							Transfer: bytes,
							Event: con._started,
							Dataset: req.table,
							Client: rec.client,
							Actions: 1
						}), bytes, secs, log.Event  ]);
					
					else { // bucket track
						sql.query(record, [ Copy(log, {
							Delay: secs,
							Transfer: bytes,
							Event: con._started,
							Dataset: req.table,
							Actions: 1
						}), bytes, secs, log.Event  ]);

						sql.query(record, [ Copy(log, {
							Delay: secs,
							Transfer: bytes,
							Event: con._started,
							Dataset: req.client,
							Actions: 1
						}), bytes, secs, log.Event  ]);
					}
					
					sql.release();
					
				});
			});

		}
	}

	if ( !req.path ) logMetrics();  // dont log file requests
	
	Trace( 
		(route?route.name:"null").toUpperCase() 
		+ ` ${req.file} FOR ${req.group}.${req.client}`);
	
	route(req, res);
}

/**
@class THREAD sql and session thread processing
*/

function sesThread(Req,Res) {	
/**
 * @method sesThread
 * @param {Object} Req http/https request
 * @param {Object} Res http/https response
 *
 * Holds a HTTP/HTTPS request-repsonse session thread.
 * */
	
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
			mime = MIME[type] || MIME.html  || "text/plain",
			paths = TOTEM.paths;
			index = paths.mime.index;
		
		//Trace(`SENDING ${path} AS ${mime} ${file} ${type} ${area}`);
		//Res.setHeader("Content-Type", mime );
		
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

	function sendData(ack, req, res) {  // Send data via converter
		if (ack)
			if (req.type)
				if (conv = TOTEM.converters[req.type])
					conv(ack, req, function (rtn) {
						switch (rtn.constructor) {
							case Error:
								sendError( rtn );
								break;

							case String:
								sendString( rtn );
								break;

							default:
								try {
									sendString( JSON.stringify(rtn) );
								}
								catch (err) {
									sendErrror(TOTEM.badData);
								}
						}
					});

				else
				if (ack.constructor == String)
					sendString(ack);
		
				else
					try {
						sendString(JSON.stringify(ack));
					}
					catch (err) {
						sendErrror(TOTEM.badData);
					}
					//sendError( TOTEM.errors.badType );

			else
			if (ack.constructor == String)
				sendString(ack);
		
			else
				try {
					sendString(JSON.stringify(ack));
				}
				catch (err) {
					sendErrror(TOTEM.badData);
				}
		
		else
			sendErrror(TOTEM.badData);
	}
	
	function res(ack) {  // Session response callback
		
		var
			req = Req.req,
			sql = req.sql,
			paths = TOTEM.paths;

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
							sql.query( paths.mysql.credit, {Name:req.node,Area:req.area} )
							.on("result", function (file) {
								if (file.Client != req.client)
									sql.query("UPDATE openv.profiles SET Credit=Credit+1 WHERE ?",{Client: file.Client});
							});

						sendCache( ack(), req.file, req.type, req.area );
					}
				
					break;
					
				case Array: 			// send records with applicable conversions

					var flags = req.flags;

					Each( TOTEM.reqflags.edits, function (n, conv) {  // do applicable conversions
						if (conv) 
							if (flag = flags[n])  
								conv(flag.split(","),ack,req);
					});
					
					sendData(ack,req,res);
					
					break;

				case String:  			// send message
					
					sendString(ack);
					break;
			
				default: 					// send data as-is

					sendData(ack,req,res);
					break;
			
			}
		}

		catch (err) {
			sendError( TOTEM.errors.badReturn );
		}
	}

	function getBody( cb ) { // Feed body and file parameters to callback

		var body = "", file = "filename:";
		
		Req
		.on("data", function (chunk) {
			body += chunk.toString();
		})
		.on("end", function () {
			if (body)
				cb( body.parse( function () {  // yank files if body not json
					
					var files = [], parms = {};
					
					body.split("\r\n").each( function (n,line) {
						if (line) 
							if (parms.type) {  // type was defined so have the file data
								files.push( Copy(parms,{data: line, size: line.length}) );
								parms = {};
							}
							else {
								//Trace("LOAD "+line);

								line.split(";").each(function (n,arg) {

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

//console.log(files);
					return {files: files};
				}) );
			
			else
				cb( {} );
		});
	}
		
	function startSession( cb ) { // Combat denial of service attacks by checking if session is too busy.
	/**
	@private
	@method startSession
	Start session and protect from denial of service attacks.
	@param {Function} callback() when completed
	*/
		
		if (BUSY && (busy = TOTEM.errors.tooBusy) )	
			if ( BUSY() )
				Res.end( TOTEM.errors.pretty( busy ) );
			else
				cb();
		else
			cb();
	}
	
	function conThread(req, res) {
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

		var con = req.connection = Req.connection;

		if (con)
			resThread( req, function (sql) {
				validateCert(req, function (err) {
					if (err)
						res(err);

					else {						
						Res.setHeader("Set-Cookie", 
							["client="+req.client, "service="+TOTEM.name]);		

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
					}
				});
			});
		
		else
			res( TOTEM.errors.lostConnection );
	}

	startSession( function() {  // process if session not busy
		getBody( function (body) {  // parse body, query and route

			var 
				// parse request url into /area/nodes
				paths = TOTEM.paths,

				// prime session request hash
				req = Req.req = {
					action: TOTEM.crud[Req.method],
					socketio: TOTEM.encrypt ? TOTEM.site.urls.socketio : "",
					query: {},
					body: body,
					flags: {},
					joins: {},
					site: TOTEM.site,
					connection: Req.connection	// engines require for transferring work to workers
				},

				// get a clean url
				/* there exists an edge case wherein an html tag within json content, e.g <img src="/ABC">, 
				is reflected back the server as a /%5c%22ABC%5c%22 which then unescapes to /\\"ABC\\".
				This is ok but can be confusing.
				*/
				
				url = req.url = unescape(Req.url),

				// get a list of all nodes
				nodes = (nodeDivider = TOTEM.nodeDivider)
					? url ? url.split(nodeDivider) : []
					: url ? [url] : [];

			conThread( req, function (err) { 	// start session with client

				if (err) 					// session validator rejected (bad cert)
					res(err);

				else
				if (nodes.length == 1) {	// respond with only this node
					node = req.node = nodes.pop();	
					routeNode(req, function (ack) {	
						Res.setHeader("Content-Type", MIME[req.type] || MIME.html || "text/plain");
						res(ack);
					});
				}

				else 					// respond with aggregate of all nodes
					syncNodes(nodes, {}, req, function (ack) {
						Res.setHeader("Content-Type", "application/json");
						res(ack);
					});

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

function sqlThread(cb) {
/**
 * @private
 * @method sqlThread
 * @param {Function} cb sql connector callback(sql)
 *
 * Callback with sql connector
 * */
	DSVAR.thread(cb);
}

function Trace(msg,arg) {
	ENUM.trace("T>",msg,arg);
}

// UNCLASSIFIED
