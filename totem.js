// UNCLASSIFIED 

/**
@class totem

@requires http
@requires https
@requires fs
@requires constants
@requires clusters
@requires child-process

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
	MULTINODES = "$$", 				//< node divider
	MAXFILES = 100;						//< max files to index
	
var
	TOTEM = module.exports = ENUM.extend({

	IO: null, 			//< reserved for socket.io

	dsAttrs: {			//< reserved for openv dataset attributes derived by DSVAR.config
	},
		
	session: { 	//< reserved to track client sessions
	},
		
	Array: [ 			//< Array prototypes
		
		function hyper(refs, arg) {
			var rtns = [], ref = ref[0];
			this.each( function (n,lab) {
				rtns.push( lab.hyper(refs[n] || ref) );
			});
			return rtns.join(arg);
		},
						  
		/**
		@member Array
		Joins a list under control by an optional callback.
		@param {Function} cb callback(val) returns item for join
		*/
		function joinify(cb) {
			
			var rtn = [];

			for (var n=0, N=this.length; n<N; n++) 
				rtn.push( cb ? cb(this[n]) : this[n] );
				
			return rtn.join(",");
		},
							
		/**
		@method treeify
		@member Array
		Return a list in tree (children,size) form given indecies.
		@param [Array] idx
		*/		
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
		/**
		@method each
		@member String
		Enumerate over pattern found in a string.
		@param {String} pat pattern to find
		@param {Array} rtn list being extended by callback
		@param {Function} cb callback(rtn)
		*/
		function each(pat, rtn, cb) {
			
			var msg = this;
			
			while ( (idx = msg.indexOf(pat) ) >=0 ) {
				
				msg = msg.substr(0,idx) + cb(rtn) + msg.substr(idx+pat.length);
				
			}

			return msg;
		},

		/**
		@method format
		@member String
		*/
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
	
		/**
		@method parse
		@member String
		Parse a JSON string or parse a "&key=val&key=val?query&relation& ..." string into 
		the default rtn = {key:val, key=val?query, relation:null, key:json, ...} hash.
		*/
		function parse(rtn) { 
			
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
						
								else 		// store "key RELATION val"
									rtn[parm] = null;
							});
					});

					return rtn;
				}
		
			else
				return rtn;
			
		},
		
		/**
		@method xmlParse
		@member String
		*/
		function xmlParse(def, cb) {
			XML2JS.parseString(this, function (err,json) {				
				cb( err ? def : json );
			});
		},
						
		/**
		@method hyper
		@member String
		Make a hyperlink
		*/
		function hyper(ref) {
			if (ref)
				if (ref.charAt(0) == ":")
					return this.link( "/"+(ref.substr(1)||this.toLowerCase())+".view" );
				else
					return this.link(ref);
			else
				return this.link(ref || "/"+this.toLowerCase()+".view");
		},
		
		/**
		@method tag
		@member String
		*/
		function tag(el,at) {
		
			if (el.constructor == String) {
				var rtn = "<"+el+" ";
				
				if (at)  
					for (var n in at) rtn += n + "='" + at[n] + "' ";
				
				switch (el) {
					case "embed":
					case "img":
					case "link":
					case "input":
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
	 * @method
	 * @member totem
	 * Configure and start the service
	 * */
	config: configService,	
	
	/**
	@method
	@member totem
	Stop the service
	 * */
	stop: stopService,
	
	/**
	@method
	@member totem
	Thread a new sql connection to a callback.  Unless overridden, will default to the DSVAR thread method.
	 * */
	thread: DSVAR.thread,
		
	/**
	@cfg {Object}  
	@member totem
	REST-to-CRUD translations
	*/
	crud: {
		GET: "select",
		DELETE: "delete",
		POST: "insert",
		PUT: "update"
	},
	
	/**
	@cfg {Object} reqflags
	@member totem
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
	@cfg {Object} fetchers
	@member totem
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
			wgetout: "wget.out"
		}
	},

	/**
	@cfg {Object} 
	@member totem
	Mysql connection options: 
	
		host: name
		user: name
		pass: phrase
		sessions: number
		
	*/		
	mysql: null,			
	
	/**
	@cfg {String} [encrypt=""]
	@member totem
	Cert passphrase to start encrypted service
	*/		
	encrypt: "",		

	/**
	@cfg {Number} [cores=0]
	@member totem	
	Number of worker cores (0 for master-only startup)
	*/				
	cores: 0,	
		
	/**
	@cfg {Number} [port=8080]
	Service port number
	*/				
	port: 8080,				
		
	/**
	@cfg {String} [host="localhost"]
	Service host name 
	*/		
	host: "localhost", 		
		
	/**
	@cfg {Boolean} [proxy=false]
	Enable if https server being proxied
	*/				
	proxy: false,

	/**
	@cfg {String} [name="Totem"]
	Identifies this Totem service and will be used to
		+ derive site parms from mysql openv.apps by Nick=name
		+ set mysql name.table for guest clients,
		+ identify server cert name.pfx file.
	*/	
	name: "Totem",

	/**
	@cfg {Object} 
	The site context extended by the mysql derived query when service starts
	*/
	site: { // reserved for derived context vars
		
	},

	/**
	@cfg {Object} 
	NODE.TYPE converters to callback cb(ack data as string || error)
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
		},
		
		html: function (ack, req, cb) {
			var rtn = "";
			ack.each(function (n,html) {
				rtn += html;
			});
			cb(rtn);
		}
	},

	/**
	@cfg {Object} 
	@private
	Ttrust store extened with certs in the certs.truststore folder when the service starts in encrypted mode
	*/		
	trust: [ ],   
		
	/**
	@cfg {Object} 
	CRUDE (req,res) method to respond to Totem request
	*/				
	server: null,
	
	/**
	@method
	@param {Object} req Totem request
	@param {Function} res Totem responder
	CRUDE (req,res) method to respond to a Totem request
	*/				
	select: dataSelect,	
	/**
	@method
	@param {Object} req Totem request
	@param {Function} res Totem responder
	CRUDE (req,res) method to respond to a Totem request
	*/				
	update: null,
	/**
	@method
	@param {Object} req Totem request
	@param {Function} res Totem responder
	CRUDE (req,res) method to respond to a Totem request
	*/				
	delete: null,
	/**
	@method
	@param {Object} req Totem request
	@param {Function} res Totem responder
	CRUDE (req,res) method to respond to a Totem request
	*/				
	insert: null,
	/**
	@method
	@param {Object} req Totem request
	@param {Function} res Totem responder
	CRUDE (req,res) method to respond to a Totem request
	*/				
	execute: null,

	/**
	@cfg {Date} 
	@private
	totem start time
	*/		
	started: null, 
		
	/**
	@cfg {Number} [retries=5]
	Maximum number of retries the data fetcher will user
	*/				
	retries: 5,	
		
	/**
	@cfg {Boolean} [notify=true]
	Enable/disable tracing of data fetchers
	*/		
	notify: true, 	

	/**
	@cfg {Boolean} [nofaults=false]
	Enable/disable service protection mode
	*/		
	nofaults: false,
		
	/**
	@cfg {Object} 
	@private
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
	Additional session validator(req,res) responds will null if client validated, otherwise
	responds with an error.
	*/		
	validator: null,	
	
	/**
	@cfg {Object} 
	Null to admitRule all clients, or {X:"required", Y: "optional", ...} to admitRule clients with cert organizational
	credentials X.
	*/		
	admitRule: null, 	
		/*{ "u.s. government": "required",
		  	"us": "optional"
		  }*/

	/**
	@cfg {Object}
	Default guest profile (unencrypted or client profile not found)
	*/		
	guestProfile: {				
		Banned: "",
		QoS: 1,
		Credit: 100,
		Charge: 0,
		LikeUs: 0,
		Challenge: 1,
		Client: "guest@nowhere.org",
		User: "guest@nowhere",
		Group: "app1",
		Repoll: true,
		Retries: 5,
		Timeout: 30,
		Message: "Welcome guest - what is (riddle)?"
	},

	/**
	@cfg {Object} 
	@private
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
	Number of riddles to protect site (0 to disable anti-bot)
	*/		
	riddles: 0, 			
	
	/**
	@cfg {Object} 
	@private
	Default paths to service files
	*/		
	paths: { 			
		render: "public/jade/",
		
		default: "/home.view",
		
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
			users: "SELECT Client FROM openv.profiles",
			derive: "SELECT * FROM openv.apps WHERE ?",
			record: "INSERT INTO app1.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?, Event=?",
			engine: "SELECT *,count(ID) as Count FROM engines WHERE least(?,1)",
			search: "SELECT * FROM files HAVING Score > 0.1",
			credit: "SELECT * FROM files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 0,1",
			socket: "REPLACE sockets SET ?",
			session: "INSERT INTO sessions SET ?",
			guest: "SELECT * FROM openv.profiles WHERE Client='guest' LIMIT 0,1",
			pocs: "SELECT * FROM openv.POCs WHERE ?",
			distros: "SELECT Role,group_concat(DISTINCT openv.Address) AS Distro FROM openv.POCs WHERE ? GROUP BY Role" 
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
	@cfg {Object} 
	@private
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
		noDB: new Error("database not configured"),
		noProfile: new Error("user profile could not be determined"),
		failedUser: new Error("failed modification of user profile"),
		missingPass: new Error("missing initial user password"),
		expiredCert: new Error("cert expired"),
		rejectedCert: new Error("cert rejected"),
		tooBusy: new Error("too busy - try again later"),
		noFile: new Error("file not found"),
		noIndex: new Error("index not found"),
		badType: new Error("bad presentation type"),
		badReturn: new Error("response fault"),
		noSockets: new Error("scoket.io failed"),
		noService: new Error("no service  to start"),
		badData: new Error("data has circular reference")
	},

	/**
	@method 
 	File indexer
	*/		
	indexer: indexFile,

	/**
	@method 
	File uploader 
	*/			
	uploader: uploadFile,	
	
	/**
	@cfg {Number} [busy=300]
	Server toobusy check period in milliseconds
	*/		
	busy: 3000,				
	
	/**
	@cfg {Object} 
	CRUDE(req,res) methods for Toteam reader routes
	*/		
	reader: {				//< by-type file readers/indexers/fetchers
		user: fetchUser,
		wget: fetchWget,
		curl: fetchCurl,
		http: fetchHttp,
		riddle: getRiddle
	},
	
	/**
	@cfg {Object} 
	CRUDE(req,res) methods for Toteam worker routes
	*/				
	worker: {				//< by-action engine runner
	},

	/**
	@cfg {Object} 
	CRUDE(req,res) methods for Toteam sender routes	
	*/		
	sender: {				//< by-area file senders
	},
	
	/**
	@cfg {Object} 
	CRUDE(req,res) methods for Toteam emulator routes	
	*/		
	emulator: {				//< by-action-table virtual table emulators
		select: {},
		delete: {},
		update: {},
		insert: {},
		execute: {}
	},
	
	/**
	@cfg {Object} 
	@private
	*/		
	sendFile: sendFile,
	
	/**
	@method
	@private
	Defines the site context parameters available in TOTEM.site.
	*/		
	setContext: function (sql,cb) { 
		var site = TOTEM.site,
			mysql = TOTEM.paths.mysql;
		
		site.pocs = [];
		site.distro = {};

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
				TOTEM.guestProfile = Copy(rec,{});
			});

		if (derive = mysql.derive)  // derive site context vars
			sql.indexJsons( "openv.apps", {}, function (jsons) {	// get site json vars
			
				sql.query(derive, {Nick:TOTEM.name})
				.on("result", function (opts) {

					Each(opts, function (key,val) {
						key = key.toLowerCase();

						if (def = jsons[key])
							site[key] = (val+"").parse(def);
						
						else
							site[key] = val;

						if (key in TOTEM) 
							TOTEM[key] = val;
					});

					if (cb) cb();

					if (users = mysql.users) 
						sql.query(users, function (err,users) {
							site.distro.user = users.joinify( function (user) {
								return user.Client.tag("a", {href:"emailto:"+user.Client});
							});
						});

				})
				.on("error", function (err) {
					Trace( "CANT DERIVE "+err );
				});
			});
		
		else 
		if (cb) cb();
					
	},

	/**
	@cfg {Object} 
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
	ENUM will callback this initializer when the service is started
	*/		
	Function: Initialize,
	
	/**
	@cfg {Object} 
	*/		
	user: {					//< crude interface to user profiles
		select: selectUser,
		delete: deleteUser,
		update: updateUser,
		insert: insertUser
	}
		
});

/**
 * @class support.data
 * Default CRUDE interface for datasets
 **/

/**
 * @method dataSelect
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
function dataSelect(req,res) {	//< Default virtual table logic is real table
	req.sql.query("SELECT * FROM ??", req.table, function (err,data) {
		res(err || data);
	});
}
/**
 * @method dataUpdate
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
function dataUpdate(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}
/**
 * @method dataInsert
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
function dataInsert(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}
/**
 * @method dataDelete
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
function dataDelete(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}
/**
 * @method dataExecute
 * @param {Object} req Totem's request
 * @param {Function} res Totem's response callback
 * */
function dataExecute(req,res) {
	res( TOTEM.paths.TOTEM.errors.noRoute );
}

/**
 * @class support.service
 * Service methods.
 **/

/**
 * @method configService
 * Start this server with the desired options.
 * @param {Object} opts configuration options
 * */
function configService(opts, cb) {

	TOTEM.extend(opts);
	
	var
		name  = TOTEM.name,
		mysql = TOTEM.mysql,
		paths = TOTEM.paths,
		site = TOTEM.site;
		//cb = null; //additional Initialize;

	Trace(`CONFIGURING ${name}`); 
	
	TOTEM.started = new Date();

	if (mysql) 
		DSVAR.config({   // establish the db agnosticator 
			//io: TOTEM.IO,   // can setup its socketio only after server defined by startService

			mysql: Copy({ 
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
		}, function (sql) {  // derive server vars and site context vars
		
			for (var n in mysql)  // derive server paths
				if (n in paths) paths[n] = mysql[n];

			if (name)	// derive site context
				TOTEM.setContext(sql, function () {
					protectService(cb || function (err) {
						Trace(err || `STARTED ${name} ENCRYPTED`);
					});
				});

			TOTEM.dsAttrs = DSVAR.attrs;
			//sql.release();
		});	

	else
		protectService(cb || function (err) {
			Trace(err || `STARTED ${name} UNENCRYPTED`);			
		});
	
	return TOTEM;
}

/**
 * @method startService
 * Attach the responder to this server then initialized.
 * @param {Object} server HTTP/HTTP server
 * @param {Function} cb callback() when service initialized.
 * */
function startService(server,cb) {
	
	var name = TOTEM.name,
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

	site.masterURL = (TOTEM.encrypt ? "https" : "http") + "://" + TOTEM.host + ":" + (TOTEM.cores ? TOTEM.port+1 : TOTEM.port) + "/";
	site.workerURL = (TOTEM.encrypt ? "https" : "http") + "://" + TOTEM.host + ":" + TOTEM.port + "/";
	
	TOTEM.flush();  		// init of client callstack via its Function key

	// (TOTEM.init) TOTEM.init();  // legacy init
	
	if (TOTEM.encrypt && paths.url.socketio) {   // establish web sockets with clients

		// Attach "/socket.io" to SIO and block same path from server, and relay socketio
		// to the DSVAR interface so that it can sync client changes.
		
		var IO = TOTEM.IO = DSVAR.io = SIO(server, { // use defaults but can override ...
				//serveClient: true, // default true to prevent server from intercepting path
				//path: "/socket.io" // default get-url that the client-side connect issues on calling io()
			}),
			HUBIO = TOTEM.HUBIO = new (SIOHUB); 		//< Hub fixes socket.io+cluster bug	
			
		Trace("ATTACHING socket.io AT "+IO.path());

		if (IO) { 							// Setup client web-socket support
			IO.on("connection", function (socket) {  // Trap every connect
				
				//Trace(">CONNECTING socket.io CLIENT");
				socket.on("select", function (req) { 		// Trap select (join request) connects
					
					var ses = TOTEM.session[req.client];

					Trace(`>Connecting ${req.client} >>> ${req.message}`);

					if (!ses)
					sqlThread( function (sql) {
						//Trace("Socket opened");
						
						sql.query("SELECT * FROM openv.profiles WHERE least(?) LIMIT 0,1", {Client:req.client, Challenge:1})
						.on("result", function (prof) {

							if (!prof.Repoll) 
								var ses = TOTEM.session[req.client] = {repoll: prof.Repoll};
							
							challengeClient(req.client, prof);
							
						})
						.on("end", sql.release);
					});
				});
			});	

			IO.on("disconnection", function (socket) {
				Trace(">>Disconnecting socket.io client");
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
	
	if (BUSY && TOTEM.busy) 
		BUSY.maxLag(TOTEM.busy);
	
	// listening on-routes message

	var endpts = [];	
	for (var n in TOTEM.select || {}) endpts.push(n);
	endpts = "["+endpts.join()+"]";

	if (TOTEM.cores) 					// Establish master and worker cores
		if (CLUSTER.isMaster) {			// Establish master
			
			server.listen(TOTEM.port+1, function() {  // Establish master
				Trace(`SERVING ${site.masterURL} AT [${endpts}]`);
			});
			
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
		
		else {								// Establish worker cores
			server.listen(TOTEM.port, function() {
				Trace(`CORE${CLUSTER.worker.id} ROUTING ${site.workerURL} AT ${endpts}`);
				//cb(null);
			});
			
			if (TOTEM.nofaults)
				CLUSTER.worker.process.on("uncaughtException", function (err) {
					console.warn(`CORE${CLUSTER.worker.id} FAULTED ${err}`);
				});	
		}
	
	else 								// Establish worker
		server.listen(TOTEM.port, function() {
			Trace(`SERVING ${site.masterURL} AT ${endpts}`);
		});
			
}
		
/**
 * @method connectService
 * If the TOTEM server already connected, inherit the server; otherwise
 * define an the apprpriate http interface (https if encrypted, 
 * http if unencrypted), then start the server.
 * @param {Function} cb callback when done
 *
 * */
function connectService(cb) {
	
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

/**
 * @method protectService
 * Create the server's PKI certs (if they dont exist), then setup
 * its master-worker urls and callback the service initializer.
 * @param {Function} cb callback when done
 * 
 * */
function protectService(cb) {
	
	var 
		encrypt = TOTEM.encrypt,
		name = TOTEM.name,
		certs = TOTEM.paths.certs;

	Trace(`PROTECTING ${name}`);
	
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

/**
 * @method stopService
 * 
 * Stop the server.
 * */
function stopService() {
		
	var server = TOTEM.server;
			
	if (server)
		server.close(function () {
			Trace(`STOPPED ${TOTEM.name}`);
		});
}

//============================================
// User maintenance CRUDE interface

/**
@class support.user
CRUDE interface to user profiles
 */

/**
@method selectUser
Return user profile information
@param {Object} req Totem request 
@param {Function} res Totem response
 */
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

/**
@method updateUser
Update user profile information
@param {Object} req Totem request 
@param {Function} res Totem response
 */
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

/**
@method deleteUser
Remove user profile.
@param {Object} req Totem request 
@param {Function} res Totem response
 */
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
			
/**
@method insertUser
Create user profile, associated certs and distribute info to user
@param {Object} req Totem request 
@param {Function} res Totem response
 */
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
						? "Please "+"s your password".tag("a", {href:url.resetpass})+" to access"
						: "",

					Client: user.User,					
					QoS: 0,

					Message:

`Greetings from ${site.Nick.tag("a",{href:site.masterURL})}-

Admin:
	Please create an AWS EC2 account for ${owner} using attached cert.

To connect to ${site.Nick} from Windows:

1. Establish gateway using 

		Putty | SSH | Tunnels
		
	with the following LocalPort, RemotePort map:
	
		5001, ${site.masterURL}:22
		5100, ${site.masterURL}:3389
		5200, ${site.masterURL}:8080
		5910, ${site.masterURL}:5910
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

/**
@method fetchUser
Fetch user profile for processing
@param {Object} req Totem request 
@param {Function} res Totem response
 */
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

//=============================================
// PKI support

/**
@class support.cert
PKI cert utilitities
 */

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
* on-output req = adds {log, cert, client, org, locagio, group, profile, journal, joined, email, hawk}
 * */
function validateCert(req,res) {
				
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
			
		cert.client = (cert.subject.emailAddress || cert.subjectaltname || cert.subject.CN || TOTEM.guestProfile.Client).split(",")[0].replace("email:","");

		var cache = TOTEM.cache.certs;
		
		if ( !cache[cert.client] ) cache[cert.client] = cert;
					
		return cert;
	}
				
	function admitClient(req, res, profile, cert, con) {
		
		var 
			now = new Date(),		
			admitRule = TOTEM.admitRule,
			site = TOTEM.site,
			client = cert.client;

		if (TOTEM.encrypt) {  // validate client's cert

			if ( now < new Date(cert.valid_from) || now > new Date(cert.valid_to) )
				return res( TOTEM.errors.expiredCert );

			if (admitRule)
				if ( !(cert.issuer.O.toLowerCase() in admitRule && cert.subject.C.toLowerCase() in admitRule) ) 
					return res( TOTEM.errors.rejectedCert );

		}
	
		if (profile.Banned)  // block client if banned
			res( new Error(profile.Banned) );
			
		else  // start session metric logging
			sql.query("show session status like 'Thread%'", function (err,stats) {

				if (err)
					stats = [{Value:0},{Value:0},{Value:0},{Value:0}];
					
				Copy({  // add session metric logs and session parms
					log: {  								// potential session metrics to log
						//Cores: site.Cores, 					// number of safety core hyperthreads
						//VMs: 1,								// number of VMs
						Event: now,		 					// start time
						Action: req.action, 				// db action
						//Client: client, 				// client id
						//Table: req.table, 					// db target
						ThreadsRunning: stats[3].Value,		// sql threads running
						ThreadsConnected: stats[1].Value,	// sql threads connected
						//RecID: req.query.ID || 0,			// sql recID
						Stamp: TOTEM.name,					// site name
						Fault: "isp"						// fault codes
					},

					cert	: cert,
					client	: client,
					org		: cert.subject.O || "noorg",
					ipaddress: con.address().address,
					location: null,
					group	: profile.Group || TOTEM.site.db, 
					profile	: Copy(profile,{}),
					journal : true,				// db actions journaled
					joined	: now, 				// time joined
					email	: client 			// email address from pki
					//source	: req.table 		// db source dataset, view or engine
					//hawk	: site.Hawks[client] // client ui change-tracking (M=mod,U=nonmod,P=proxy)
				}, req);
					
				res(null);
				
				sql.query("INSERT INTO openv.sockets SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1", {
					client	: client,
					org		: cert.subject.O || "noorg",
					location: "tbd"
				});

			});	
	}
	
	var 
		con = req.connection,
		sql = req.sql,
		cert = getCert(),
		client = cert.client;
	
	if (TOTEM.mysql)  // get client's profile
		sql.query("SELECT *,count(ID) as Count FROM openv.profiles WHERE ? LIMIT 0,1", {client: client})
		.on("result", function (profile) {
//console.log(profile);
			
			if (profile.Count)
				admitClient(req, res, profile, cert, con);
				
			else {
				delete TOTEM.guestProfile.ID;
				sql.query("INSERT INTO openv.profiles SET ?", Copy({
					Client: client,
					User: client.replace("ic.gov","").replace(/\./g,"").toLowerCase()
				}, TOTEM.guestProfile), function (err) {
					
					admitClient(req, res, TOTEM.guestProfile, cert, con);
					
				});
			}
			
		})
		.on("error", function (err) {
			res( TOTEM.errors.noProfile );
		});
	
	else 
	if (TOTEM.encrypt)
		res( TOTEM.errors.noDB );
	
	else
		res( null );
}

//=============================================
// Static file indexing and uploading

/**
@class support.file
MIME static file indexing and uploading
 */

/**
* @method indexFile
* @param {Object} path file path
* @param {Function} cb totem response
*/
function indexFile(path,cb) {
	
	var files = [];
	
	findFile(path, function (n,file) {
		
		files.push( file );
		
	});
	
	cb( files );
	
}	

/**
* @method findFile
* @param {Object} path file path
* @param {Function} cb totem response
*/
function findFile(path,cb) {
	
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

/**
* @method uploadFile
* @param {Object} sql sql connector
* @param {Array} files files to upload
* @param {String} area area to upload files into
* @param {Function} res totem response
*/
function uploadFile( files, area, cb) {

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
		var name = file.filename;
		var target = TOTEM.paths.mime[area]+"/"+area+"/"+name;

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

//========================================
// External data fetchers

/**
@class support.fetch
External data fetchers
 */

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

function curlFetch(url,cb) {

	var opts = URL.parse(url),
		certs = TOTEM.cache.certs,
		transport = {
			"http:": `curl "${url}"`,
			"https:": `curl -k --cert ${certs.crt} --key ${certs.key} "${url}"`
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
			"http:": `wget -O ${TOTEM.fetchers.wgetout} "${url}"`,
			"https:": `wget -O ${TOTEM.fetchers.wgetout} --no-check-certificate --certificate ${certs.crt} --private-key ${certs.key} "${url}"`
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
	
	if (opts.protocol) {
		var req = transport[opts.protocol].request(opts, function(res) {
			res.setEncoding('utf-8');

			var text = "";
			res.on('data', function (chunk) {
				text += chunk;
			});

			res.on("end", function () {
				cb( text.parse() || text );
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
	else
		cb( TOTEM.errors.noProtocol );
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

/**
@class support.templates
 Default send and read methods
 */
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

//==========================================
// Antibot protection
 
/**
@class support.antibot
 Antibot protection
 */

function getRiddle(req,res) {	//< request riddle endpoint
	
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
		else 
			res( "fail" );
		
	});
}

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
		map = TOTEM.riddleMap,
		ref = "/captcha";
	
	for (var n=0; n<N; n++)
		riddle.push( Riddle(map,ref) );
}

function makeRiddle(msg,rid,ids) {

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

function challengeClient(client, prof) {
			
	var 
		rid = [],
		reply = (TOTEM.riddleMap && TOTEM.riddles)
				? makeRiddle( prof.Message, rid, (prof.IDs||"").parse({}) )
				: prof.Message;

	if (reply) 
		sqlThread( function (sql) {
			sql.query("INSERT INTO openv.riddles SET ?", {
				Riddle: rid.join(",").replace(/ /g,""),
				Client: client,
				Made: new Date(),
				Attempts: 0,
				maxAttempts: prof.Retries
			}, function (err,info) {

				TOTEM.IO.emit("select", {
					message: reply,
					riddles: rid.length,
					rejected: false,
					retries: prof.Retries,
					timeout: prof.Timeout * 1e3,
					ID: info.insertId
				});

				sql.release();
			});
		});
}

//============================================
// Initalization

function Initialize () {
	
	Trace(`INITIALIZED WITH ${TOTEM.riddles} RIDDLES`);
	
	initChallenger();
	
}

//============================================
// Node routing and tracing

function Trace(msg,arg) {
	
	if (msg.constructor == String)
		console.log("T>"+msg);
	else
		console.log("T>"+msg.sql);

	if (arg) console.log(arg);
		
	return msg;
}

/**
@class support.routing
Totem routing methods
 */
function parseNode(req) {
	
	var
		node = URL.parse(req.node),
		search = req.search = node.query || "",
		query = req.query = search.parse({}),
		areas = node.pathname.split("/"),
		file = req.file = areas.pop() || (areas[1] ? "" : TOTEM.paths.default),
		parts = file.split("."),
		type = req.type = parts[1] || "",
		table = req.table = parts[0] || "",
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

/**
Submit nodes=[/dataset.type, /dataset.type ...]  on the current request thread req to the routeNode() 
method, aggregate results, then send with supplied response().
*/
function syncNodes(nodes, acks, req, res) {
	
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

/*
Parse the node=/dataset.type on the current req thread, then route it to the approprate sender, 
reader, emulator, engine or file indexer according to 

	dataset	route to
	=============================
	area 	sender[area] || reader[type]
	file		reader[type]	
	name	engine[name] || worker[action]
	table		emulator[action][table] || reader[type] || crud[action]
*/
function routeNode(req, res) {
	
	parseNode(req);

	var
		sql = req.sql,
		node = req.node,
		table = req.table,
		type = req.type,
		action = req.action,
		area = req.area,
		paths = TOTEM.paths;

	if (req.path) 
		followRoute( route = TOTEM.sender[area] || TOTEM.reader[type] || sendFile, req, res );

	else
	if ( route = TOTEM.emulator[action][table] )
		followRoute(route,req,res);
	
	else
	if ( route = TOTEM.reader[table] ) 
		followRoute(route,req,res);
	
	else
	if ( route = TOTEM.reader[type] ) 
		followRoute(route,req,res);

	else
	if ( route = TOTEM.worker[action] )	
		followRoute(route,req, function (ack) {
			if (ack.constructor == Error)
				if ( route = TOTEM[action] ) 
					followRoute(route,req,res);

				else
					res( TOTEM.errors.noRoute );
			
			else
				res(ack);
		});
		
	else
	if ( route = TOTEM[action] )
		followRoute(route,req,res);

	else
		res( TOTEM.errors.noRoute );
}

/*
Log session metrics, trace the current route, then callback route on the supplied 
request-response thread
*/
function followRoute(route,req,res) {

	function logMetrics() { // log session metrics 
		
		if ((con=req.connection) && (record=TOTEM.paths.mysql.record)) {
			var log = req.log;
		
			con._started = new Date();
			
			// If maxlisteners is not set to infinity=0, the connection 
			// becomes sensitive to a sql connector t/o and there will
			// be random memory leak warnings.
			
			con.setMaxListeners(0);
			con.on('close', function () { 		// cb when connection closed
				
				var 
					secs = ((new Date()).getTime() - con._started.getTime()) / 1000,
					bytes = con.bytesWritten,
					log = req.log;
				
				sqlThread( function (sql) {

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
					
					sql.release();
					
				});
			});

		}
	}

	if ( !req.path ) logMetrics();  // dont log file requests
	
	Trace( 
		(route?route.name:"null").toUpperCase() 
		+ ` ${req.file} FOR ${req.client}@${req.group}`);
	
	route(req, res);
}

//===============================================
// Thread processing

/**
@class support
Thread processing
 */

/**
 * @method sesThread
 * @param {Object} Req http/https request
 * @param {Object} Res http/https response
 *
 * Holds a HTTP/HTTPS request-repsonse session thread.
 * */
function sesThread(Req,Res) {	
	
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
		
		var mime = MIME[type] || MIME.html  || "text/plain",
			paths = TOTEM.paths;
		
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
		if ( 	( index = paths.mime.index ) && ( indexer = index[area] ) ) { // index files

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
				sendError( TOTEM.errors.badType );
		
		else
			try {
				sendString( JSON.stringify(ack) );
			}
			catch (err) {
				sendErrror(TOTEM.badData);
			}
	}
	
	function res(ack) {  // Session response callback
		
		var req = Req.req,
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
				
					if (search = req.query.search && paths.mysql.search) 		// search for file via nlp/etc
						sql.query(paths.mysql.search, {FullSearch:search}, function (err, files) {
							
							if (err) 
								sendError( TOTEM.errors.noFile );
								
							else
								sendError( TOTEM.errors.noFile );
								
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
		
		if (BUSY && (busy = TOTEM.errors.tooBusy) )	
			if ( BUSY() )
				Res.end( TOTEM.errors.pretty( busy ) );
			else
				cb();
		else
			cb();
	}
	
	/**
	 * Start a connection thread cb(err) containing a Req.req.sql connector,
	 * a validated Req.req.cert certificate, and set appropriate Res headers. 
	 * 
	 * @param {Object} req request
	 * @param {Function} res response
	 *
	 * on-input req = {action, socketio, query, body, flags, joins}
	 * on-output req =  adds {log, cert, client, org, ipaddress, group, profile, journal, 
	 * joined, email, hawk and STATICS}
	 * */
	function conThread(req, res) {

		var con = req.connection = Req.connection;

		resThread( req, function (sql) {
			if (con)
				validateCert(req, function (err) {
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

	startSession( function() {  // process if session not busy
		getBody( function (body) {  // parse body, query and route

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
				nodes = url ? url.split(MULTINODES) : [];

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

/**
 * @method resThread
 * @param {Object} req Totem request
 * @param {Function} cb sql connector callback(sql)
 *
 * Callback with request set to sql conector
 * */
function resThread(req, cb) {
	sqlThread( function (sql) {
		cb( req.sql = sql );
	});
}

/**
 * @method sqlThread
 * @param {Function} cb sql connector callback(sql)
 *
 * Callback with sql connector
 * */
function sqlThread(cb) {
	DSVAR.thread(cb);
}

// UNCLASSIFIED
