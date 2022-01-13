// UNCLASSIFIED   

const	
	// NodeJS modules
				  
	ENV = process.env,
	STREAM = require("stream"), 				// pipe-able streams
	HTTP = require("http"),						// http interface
	HTTPS = require("https"),					// https interface
	CP = require("child_process"),				// spawn OS shell commands
	FS = require("fs"),							// access file system
	CONS = require("constants"),				// constants for setting tcp sessions
	CLUSTER = require("cluster"),				// multicore  processing
	CRYPTO = require("crypto"),					// crypto for SecureLink
	//NET = require("net"), 					// network interface
	VM = require("vm"), 						// virtual machines for tasking
	OS = require('os'),							// OS utilitites

	// 3rd party modules
	  
	//AGENT = require("http-proxy-agent"),		// agent to access proxies
	SCRAPE = require("cheerio"), 				// scraper to load proxies
	MIME = require("mime"), 					// file mime types
	{ escape, escapeId } = SQLDB = require("mysql"),	//< mysql conector
	XML2JS = require("xml2js"),					// xml to json parser (*)
	BUSY = require('toobusy-js'),  				// denial-of-service protector (cant install on NodeJS 5.x+)
	JS2XML = require('js2xmlparser'), 			// JSON to XML parser
	JS2CSV = require('json2csv'),				// JSON to CSV parser	
	{ testClient } = SECLINK = require("securelink"),			// secure com and login
	{ sqlThread, neoThread } = JSDB = require("jsdb"),		// database agnosticator
	  
	{ Copy,Each,Stream,Clock,isError,isArray,isString,isFunction,isEmpty,typeOf,isObject,Fetch } = require("enums");

/**
@module TOTEM.String
*/
Copy({ //< String prototypes
	/**
	Parse XML string into json and callback cb(json) 

	@extends String
	@param {Function} cb callback( json || null if error )
	*/
	parseXML: function (cb) {
		XML2JS.parseString(this, function (err,json) {				
			cb( err ? null : json );
		});
	},
}, String.prototype);

/**
Provides a [barebones web service]{@link https://github.com/totemstan/totem}.  This module documented 
in accordance with [jsdoc]{@link https://jsdoc.app/}.

@module TOTEM
@author [ACMESDS](https://totemstan.github.io)

@requires http
@requires https
@requires fs
@requires constants
@requires cluster
@requires child_process
@requires os
@requires stream
@requires vm
@requires crypto

@requires enums
@requires jsdb
@requires securelink
@requires socketio

@requires mime
@requires mysql
@requires xml2js
@requires toobusy
@requires json2csv
@requires js2xmlparser
@requires toobusy-js
@requires cheerio

@example

// npm test T1
// Create simple service but dont start it.
Log({
	msg: "Im simply a Totem interface so Im not even running as a service", 
	default_fetcher_endpts: TOTEM.byTable,
	default_protect_mode: TOTEM.guard,
	default_cores_used: TOTEM.cores
});

@example

// npm test T2
// Totem service running in fault protection mode, no database, no UI; but I am running
// with 2 workers and the default endpoint routes.

TOTEM.config({
	mysql: null,
	guard: true,
	cores: 2
}, sql => {

	Log( 
`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
with 2 workers and the default endpoint routes` );

});

@example

// npm test T3
// A Totem service with no workers.

TOTEM.config({
}, sql => {
	Log( 
`I'm a Totem service with no workers. I do, however, have a mysql database from which I've derived 
my startup options (see the openv.apps table for the Nick="Totem1").  
No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
these files. `
	);
});

@example

// npm test T4
// Only 1 worker, unprotected, a mysql database, and two endpoints.

TOTEM.config({
	byTable: {
		dothis: function dothis(req,res) {  //< named handlers are shown in trace in console
			res( "123" );

			Log("", {
				do_query: req.query
			});
		},

		dothat: function dothat(req,res) {

			if (req.query.x)
				res( [{x:req.query.x+1,y:req.query.x+2}] );
			else
				res( new Error("We have a problem huston") );

			Log("", {
				msg: `Like dothis, but needs an ?x=value query`, 
				or_query: req.query,
				or_user: req.client
			});
		}
	}
}, sql => {
	Log("", {
		msg:
`As always, if the openv.apps Encrypt is set for the Nick="Totem" app, this service is now **encrypted** [*]
and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
aka core), Im running unprotected, and have a mysql database.  
[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
associated public NICK.crt and private NICK.key certs it creates.`,
		my_endpoints: T.byTable
	});
});

@example

// npm test T5
// no cores but a mysql database and an anti-bot shield

TOTEM.config({
	"secureIO.challenge.extend": 20
}, sql => {
	Log("", {
		msg:
`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.`, 
		mysql_derived_parms: T.site
	});
});

@example

// npm test T6
// Testing tasker with database, 3 cores and an additional /test endpoint.

TOTEM.config({
	guard: false,	// ex override default 
	cores: 3,		// ex override default

	"byTable.": {  // define endpoints
		test: function (req,res) {
			res(" here we go");  // endpoint must always repond to its client 
			if (CLUSTER.isMaster)  // setup tasking examples on on master
				switch (req.query.opt || 1) {  // test example runTask
					case 1: 
						T.runTask({  // setup tasking for loops over these keys
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
						T.runTask({
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

}, sql => {
	Log( "Testing runTask with database and 3 cores at /test endpoint" );
});

@example

// npm test T7
// Conduct db maintenance

TOTEM.config({
}, sql => {				
	Log( "db maintenance" );

	if (CLUSTER.isMaster)
		switch (process.argv[3]) {
			case 1: 
				sql.query( "select voxels.id as voxelID, chips.id as chipID from openv.voxels left join openv.chips on voxels.Ring = chips.Ring", function (err,recs) {
					recs.forEach( rec => {
						sql.query("update openv.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], err => {
							Log(err);
						});
					});
				});
				break;

			case 2:
				sql.query("select ID, Ring from openv.voxels", function (err, recs) {
					recs.forEach( rec => {
						sql.query(
							"update openv.voxels set Point=geomFromText(?) where ?", 
							[ `POINT(${rec.Ring[0][0].x} ${rec.Ring[0][0].y})` , {ID: rec.ID} ], 
							err => {
								Log(err);
						});
					});
				});
				break;

			case 3:
				sql.query( "select voxels.id as voxelID, cache.id as chipID from openv.voxels left join openv.cache on voxels.Ring = cache.geo1", function (err,recs) {
					Log(err);
					recs.forEach( rec => {
						sql.query("update openv.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], err => {
							Log(err);
						});
					});
				});
				break;

			case 4:
				sql.query("select ID, geo1 from openv.cache where bank='chip'", function (err, recs) {
					recs.forEach( rec => {
						if (rec.geo1)
							sql.query(
								"update openv.cache set x1=?, x2=? where ?", 
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

						sql.query("INSERT INTO openv.pcs SET ? ON DUPLICATE KEY UPDATE ?", [save,save] );	
					});
				});
				break;	
		}
});		

@example

// npm test T8
// Conduct neo4j database maintenance

const $ = require("../man/man.js");
TOTEM.config();
neoThread( neo => {
	neo.cypher( "MATCH (n:gtd) RETURN n", {}, (err,nodes) => {
		Log("nodes",err,nodes.length,nodes[0]);
		var map = {};
		nodes.forEach( (node,idx) => map[node.n.name] = idx );
		//Log(">map",map);

		neo.cypher( "MATCH (a:gtd)-[r]->(b:gtd) RETURN r", {}, (err,edges) => {
			Log("edges",err,edges.length,edges[0]);
			var 
				N = nodes.length,	
				cap = $([N,N], (u,v,C) => C[u][v] = 0 ),
				lambda = $([N,N], (u,v,L) => L[u][v] = 0),
				lamlist = $(N, (n,L) => L[n] = [] );

			edges.forEach( edge => cap[map[edge.r.srcId]][map[edge.r.tarId]] = 1 );

			//Log(">cap",cap);

			for (var s=0; s<N; s++)
				for (var t=s+1; t<N; t++) {
					var 
						{cutset} = $.MaxFlowMinCut(cap,s,t),
						cut = lambda[s][t] = lambda[t][s] = cutset.length;

					lamlist[cut].push([s,t]);
				}

			lamlist.forEach( (list,r) => {
				if ( r && list.length ) Log(r,list);
			});

		});
	});
});	


*/

const 
	{ 	Log, Trace,
		byArea, byType, byAction, byTable, CORS,
		defaultType, 
		$master, $worker, 
	 	createCert, loginClient,
		getBrick, routeRequest, setContext,
		filterFlag, paths, sqls, errors, site, maxFiles, isEncrypted, behindProxy, admitRules,
		filterType,tableRoutes, dsThread, startDogs, cache } = TOTEM = module.exports = {
	
	Log: (...args) => console.log(">>>totem", args),
	Trace: (msg,args,req) => "totem".trace(msg, req, msg => console.log(msg,args) ),	
		
	/**
	Enable to support cross-origin-scripting
	*/
			
	CORS: false,	//< enable to support cross-origin-scripting
		
	/**
	Default NODE type during a route
	*/
	defaultType: "run",

	/**
	SecureLink configuration settings.  Null to disable.
	*/
	secureIO: {
		/**
		Socketio i/f set on SECLINK config
		*/
		sio: null,		//< set on configuration
			
		/**
		Name of SECLINK host for determining trusted clinets etc
		*/
		host: ENV.LINK_HOST || "totem",
		
		/**
		Used to inspect unencrypted messages
		*/
		inspect: (doc,to,cb) => { 
			//throw new Error("link inspect never configured"); 
		},
		
		/**
		Specifiies client challenge options
		*/
		challenge: {
			/**
			Number of antibot riddles to extend 
			@cfg {Number} [extend=0]
			*/		
			extend: 10,

			/**
			Antibot riddle store to protect site 
			@cfg {Array} 
			@private
			*/		
			store: [], 

			/**
			Riddle digit-to-jpeg map (null to disable riddles)
			@cfg {Object} 
			@private
			*/				
			map: { 					
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

			checkEndpoint: "/riddle.html",
			captchaEndpoint: "/captcha" 		 // path to antibot captchas
		}
	},

	/**
	Validate a client's session by attaching a log, profile, group, client, 
	cert and joined info to this `req` request then callback `res`(error) with 
	a null `error` if the session was sucessfully validated.  

	@param {Object} req totem session request
	@param {Function} res totem session responder
	*/
	loginClient: (req,cb) => {  

		function getCert(sock) {  //< Return cert presented on this socket (w or w/o proxy).
			const 
				cert = sock.getPeerCertificate();

			// Log("getcert>>>>>>>>", cert, cert.subjectaltname);
			if (behindProxy) {  // update cert with originating cert info that was placed in header
				const 
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
		
		const 
			{ sql, cookie, encrypted, reqSocket, ipAddress } = req,
			cookies = req.cookies = {},
			{ Login, host } = SECLINK,
			cert = (encrypted && reqSocket.getPeerCertificate) ? getCert(reqSocket) : null,
			now = new Date(),
			guest = `guest${ipAddress}@${host}`;

		if ( cert ) {		// client on encrypted socket so has a pki cert
			const
				[x,client] = (cert.subjectaltname||"").toLowerCase().split(",")[0].match(/email:(.*)/) || [];

			if ( client ) {		// found a client
				// Log("CHECKCERT", account, cookie, cookies);

				// Log("cert>>>", cert, admitRules);

				if ( now < new Date(cert.valid_from) || now > new Date(cert.valid_to) )
					cb( errors.badCert );

				else
				if ( check = cert.subject || cert.issuer ) {
					for (var key in admitRules) 
						if ( test = check[key] ) {
							if ( test.toLowerCase().indexOf( admitRules[key] ) < 0 ) 
								return cb( errors.badCert );
						}

						else
							return cb( errors.badCert );
				}

				Login( client, function guestSession(err,prof) { // no-authentication session
					cb( err, prof );
				});
			}

			else
				cb( errors.badCert );
		}
		
		else {
			if ( cookie ) 						//  providing cookie to define client profile
				cookie.split("; ").forEach( cook => {
					const [key,val] = cook.split("=");
					if ( val != "undefined" ) cookies[key] = val;
				});

			//Log(">>>>>>>>>>>>>>>>>>cookies", cookie, cookies);
		
			Login( cookies.session || guest, function guestSession(err,prof) { // no-authentication session
				cb( err, prof );
			});
		}
	},
		
	/**
	Start a dataset thread.
	@param {Object} req Totem endpoint request
	@param {Function} cb callback(competed req)
	*/
	dsThread: (req,cb) => {
		const
			{ url, body, client } = req,
			query = req.query = {},
			index = req.index = {},
			flags = req.flags = {},
			where = req.where = {},
			[path,table,type,area] = url.parsePath(query, index, flags, where);

		const
			{ strips, prefix, traps, id } = filterFlag;

		for (var key in query) 		// strip or remap bogus keys
			if ( key in strips )
				delete query[key];

		for (var key in flags) 	// trap special flags
			if ( trap = traps[key] )
				trap(req);

		for (var key in body) 		// remap body flags
			if ( key.startsWith(prefix) ) {  
				flags[key.substr(1)] = body[key]+"";
				delete body[key];
			}

		if (id in body) {  			// remap body record id
			where["="][id] = query[id] = body[id]+""; 
			delete body[id];
		}

		for (var key in query) 		// strip or remap bogus keys
			if ( key in strips )
				delete query[key];

		for (var key in flags) 	// trap special flags
			if ( trap = traps[key] )
				trap(req);

		for (var key in body) 		// remap body flags
			if ( key.startsWith(prefix) ) {  
				flags[key.substr(1)] = body[key]+"";
				delete body[key];
			}

		if (id in body) {  			// remap body record id
			where["="][id] = query[id] = body[id]+""; 
			delete body[id];
		}

		//Log({u:url, f: flags, q:query, b:body, i:index, w:where});
		//Log([path,table,type,area]);
		
		sqlThread( sql => {
			req.ds = ( 
				tableRoutes[flags.notebook || flags.nb || flags.project || flags.option || flags.task || table] 
				|| (req => `app.${table}`)
				) (req);
			req.path = path;
			req.area = area;
			req.table = table || "ping";
			req.type = type || ""; //defaultType;
			req.sql = sql;
			
			cb(req);
		});
	},

	tableRoutes: {	// setup default DataSet routes
	},

	/**
	MySQL connection options
	*/
	mysql: { 		// database connection or null to disable
		host: ENV.MYSQL_HOST,
		user: ENV.MYSQL_USER,
		pass: ENV.MYSQL_PASS
	},
					
	sql: (query,args,cb) => sqlThread(sql => {
		//Log(sql);
		sql.query(query,args,(err,recs) => { 
			if (!err && cb) cb(recs); 
			Log(err || errors.ok);
		});
	}),
					
	/**
	Route NODE = /DATASET.TYPE requests using the configured byArea, byType, byTable, 
	byActionTable then byAction routers.	

	The provided response method accepts a string, an objects, an array, an error, or 
	a file-cache function and terminates the session's sql connection.  The client is 
	validated and their session logged.

	In phase3 of the session setup, the following is added to the req:

		files: [...]		// list of files being uploaded
		//canvas: {...}		// canvas being uploaded
		query: {...} 		// raw keys from url
		where: {...} 		// sql-ized query keys from url
		body: {...}			// body keys from request 
		flags: {...} 		// flag keys from url
		index: {...}		// sql-ized index keys from url
		path: "/[area/...]name.type"			// requested resource
		area: "name"		// file area being requested
		table: "name"		// name of sql table being requested
		ds:	"db.name"		// fully qualified sql table
		body: {...}			// json parsed post
		type: "type" 		// type part 

	@cfg {Function}
	@param {Object} req session request
	@param {Object} res session response
	*/
	routeRequest: (req,res) => {
		function route(req, res) {	//< Parse and route the NODE = /DATASET.TYPE request
			/*
			Log session metrics, trace the current route, then callback route on the supplied 
			request-response thread.
			*/
			function followRoute(route) {	//< route the request

				function logSession(sock) { //< log session metrics 
					
					sock._log = { 
						Event: new Date(), 			// start time
						Client: req.client
					};	

					/*
					If maxlisteners is not set to infinity=0, the connection becomes sensitive to a sql 
					connector t/o and there will be random memory leak warnings.
					*/

					sock.setMaxListeners(0);
					
					sock.on('close', () => { 		// cb when connection closed
						const
							{ _log } = sock;
						
						var 
							started = _log.Event,
							ended = new Date(),
							secs = (ended.getTime() - started.getTime()) * 1e-3,
							bytes = sock.bytesWritten;

						sqlThread( sql => {
							sql.query(logMetrics, [{
								Delay: secs,
								Transfer: bytes,
								Event: started,
								Dataset: "",
								Actions: 1,
								Client: _log.Client,
							}, bytes, secs] );
						});
					});
				}

				const
					{ logMetrics } = sqls,
					{ area, table, path, flags } = req;
				
				Log( route.name.toUpperCase(), path );
				
				if ( area || !table ) // routing a file or no endpoint 
					/* trap for legacy socket.io 
					if ( area == "socket.io" && !table)	// ignore keep-alives from legacy socket.io 
						Log("HUSH SOCKET.IO");

					else	// send file
					*/
					route( req, txt => res(txt) );
				
				else {
					//Log("log check", req.area, req.reqSocket?true:false, req.log );
					if ( logMetrics )
						if ( sock = req.reqSocket ) 
							logSession( sock );  

					route(req, recs => {	// route request and capture records
						if ( recs ) {
							// Log("route flags", flags);
							/*
							var call = null;
							for ( var key in flags ) if ( !call ) {	// perform single data modifier
								if ( key.startsWith("$") ) key = "$";
								if ( call = filterFlag[key] ) {
									call( recs, req, recs => res(req, recs) );
									break;
								}
							}

							if ( !call ) res(recs);  */
							
							var mod;
							for ( var key in flags ) mod = filterFlag[key];
							
							if ( mod ) 
								mod( recs, req, recs => res(recs) );
							
							else
								res(recs);
						}

						else
							res(null);
					});
				}
			}
			
			/*
			function checkAccess( cb ) {
				
				if ( true ) 
					cb(true);
				
				else {
					const
						power = {
							guest: 1,
							reporter: 2,
							reviewer: 3,
							developer: 4,
							owner: 5
						},
						tx = {
							pub: "reviewer",
							publish: "reviewer",
							exe: "reporter",
							doc: "guest",
							run: "guest",
							exam: "guest",
							brief: "guest",
							browse: "guest",
							export: "reviewer",
							import: "reviewer",
							mod: "developer",
						};						  

					sql.query("SELECT Access FROM openv.acl WHERE least(?) LIMIT 1", {
					Client: client,
					Resource: table
				}, (err,recs) => {
					const
						{Access} = recs[0] || {Access:"guest"},
						minPower = power[tx[type] || "guest"];
					
					Log( "check "+type, Access, power[Access], minPower );
					cb( power[Access] >= minPower );
				});
				}
			}
			*/
			
			dsThread( req, req => {
				const
					{area,table,action,path,ds} = req;

				//Log({a:area, t:table, p: path, ds: ds, act: action});
				
				if ( area || !table ) 	// send file
					followRoute( function send(req,res) {	// provide a route to send a file
						const
							{area,table,type,path} = req;

						//Log(area,path,type);
						if ( path.endsWith("/") )		// requesting folder
							if ( route = byArea[area] || byArea.default )
								route(req,res);

							else
								res( errors.noRoute );

						else {	// requesting file						
							const
								file = table+"."+type,
								{ never } = cache,
								neverCache = never[file] || never[area];

							//Log("cache", file, "never=", neverCache, "cached=", path in cache);

							if ( path in cache )
								res( cache[path] );

							else
								Fetch( "file:" + path, txt => {
									if ( !neverCache ) cache[path] = txt; 
									res(txt);
								});
						}
					});

				else
				if ( table ) {
					if ( route = byTable[table] ) 	// route by endpoint name
						followRoute( route );

					else  
					if ( route = byType[req.type] ) // route by type
						followRoute( route );

					/*
					else
					if ( route = byAction[action] ) {	// route by crud action
						if ( route = route[table] )
							followRoute( route );

						else
						if ( route = TOTEM[action] )
							followRoute( route );

						else
							res( errors.noRoute );
					}*/

					else
					if ( route = byAction[action] )	// route to database
						followRoute( route );

					else 
						res( errors.noRoute );
				}

				else
					res( errors.noRoute );
			});
		}
					
		const 
			{ post } = req;

		req.body = post.parseJSON( post => {  // get parameters or yank files from body 
			var 
				files = req.files = [], 
				parms = {}, 
				file = "", 
				rem,filename,name,type;

			if (post)
				try {	// attempt extjs file upload
					post.split("\r\n").forEach( (line,idx) => {	// parse file posting parms
						if ( idx % 2 )
							files.push({
								filename: filename.replace(/'/g,""),
								name: name,
								data: line,
								type: type,
								size: line.length
							});

						else {
							[rem,filename,name,type] = line.match( /<; filename=(.*) name=(.*) ><\/;>type=(.*)/ ) || [];

							if ( !filename ) 
								line.split("&").forEach( parm => {
									var [rem,key,value] = parm.match( /(.*)=(.*)/ ) || ["",parm,""];
									parms[key] = value;
								});
						}
						/*
						if (parms.type) {  // type was defined so have the file data
							files.push( Copy(parms,{data: line, size: line.length}) );
							parms = {};
						}
						else {
							//Log("LOAD", line);

							line.split(";").forEach( (arg,idx) => {  // process one file at a time
	Log("line ",idx,line.length);
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
						*/										
					});
				}
				
				catch (err) {
					Log("POST FAILED", post);
				}

			//Log("body files=", files.length);
			return parms;
		});		// get body parameters/files

		route( req, res );
	},

	/**
	Start watchdogs
	*/
	startDogs: (sql,dogs) => {
		sql.query(
			"SELECT * FROM openv.dogs WHERE Enabled AND Every")
		
		.on("result", task => {
			//Log(">>>>dog", task, dogs[task.Name], every", task.Every);
			if ( dog = dogs[task.Name.toLowerCase()] )
				sql.queueTask( new Clock("totem",task.Every), {
					Client: "totem",
					Name: task.Name,
					Class: "totem",
					Task: "watchdog",
					Notes: task.Description
				}, (recs,job,res) => {
					Log(">>>dog", job);
					dog(sql, job);
					res();
				});
		});
	},

	/**
	Error messages
	@cfg {Object} 
	*/		
	errors: {
		ok: "ok",
		pretty: err => (err+"").replace("Error:",""),
		noBody: new Error("no body keys"),
		badMethod: new Error("unsupported request method"),
		noRoute: new Error("no route found"),
		noDB: new Error("database unavailable"),
		badReturn: new Error("no data returned"),
		noEndpoint: new Error("endpoint disabled"),
		noID: new Error("missing record id"),
		badCert: new Error("invalid PKI credentials"),
		badLogin: new Error("login failed"),
		isBusy: "Too busy",
		noSocket: new Error("socket lost"),
		noClient: new Error("missiing client credentials")
		//noProtocol: new Error("no fetch protocol specified"),
		//badQuery: new Error("invalid query"),
		//badGroup: new Error("invalid group requested"),
		//lostConnection: new Error("client connection lost"),
		//noProfile: new Error("user profile could not be determined"),
		//failedUser: new Error("failed modification of user profile"),
		//missingPass: new Error("missing initial user password"),
		//expiredCert: new Error("cert expired"),
		//rejectedClient: new Error("client rejected - bad cert, profile or session"),
		//tooBusy: new Error("too busy - try again later"),
		//noFile: new Error("file not found"),
		//noIndex: new Error("cannot index files here"),
		//badType: new Error("no such dataset type"),
		//noSockets: new Error("socket.io failed"),
		//noService: new Error("no service  to start"),
		//retry: new Error("fetch retries exceeded"),
		//noAccess: new Error("no access to master core at this endpoint"),
	},

	//api: { },

	/**
	Configure and start the service with options and optional callback when started.
	Configure database, define site context, then protect, connect, start and initialize this server.
	@cfg {Function}
	@param {Object} opts configuration options following the Copy() conventions.
	@param {Function} cb callback(err) after service configured
	*/
	config: (opts,cb) => {
		function addEndpoints(pts) {
			const
				{ byAction, byType } = pts;

			if ( byAction ) {
				Copy(byAction, TOTEM.byAction);
				delete pts.byAction;
			}

			if ( byType ) {
				Copy(byType, TOTEM.byType);
				delete pts.byType;
			}

			Copy(pts, byTable);
		}

		function docEndpoints(sql) {
			
			const 
				host = ENV.SERVICE_MASTER_URL,
				docEditpoints = false,
				docNotebooks = false;
			
			if ( docEditpoints ) // build endpoint docs			
				Stream(byTable, {}, (val,skey,cb) => {	// system endpoints
					//Log("build doc", host, cb?"stream":"end", skey);
					
					if ( cb ) // streaming ... scan endpoint
						if ( val.name == "sysNav" ) 
							cb( "Navigator".replace(/\n/mg,"<br>") );

						else
							Fetch( `${host}/${skey}.help`, doc => {
								//Log(">>>>doc",skey,"=>",doc);
								cb( `${skey}: ${doc}`.replace(/\n/mg,"<br>") );
							});

					else	// stream terminated ... scan notebooks
					if ( docNotebooks )
						Fetch( `${host}/notebooks`, books => {	// notebook endpoints
							JSON.parse(books).forEach( book => {
								fkey.push( [
									`${book.Name}:`, book.run, book.help, book.publish, book.get, book.brief
								].join(" ") );
							});

							sql.query("UPDATE openv.apps SET ? WHERE ?", [{
								Doc: skey.concat(fkey).join("<br>")
							}, {
								nick: site.nick
							}]);
						});
					
					else
						sql.query("UPDATE openv.apps SET ? WHERE ?", [{
							Doc: skey.concat(skey).join("<br>")
						}, {
							nick: site.nick
						}]);
				});
			
			else
				Trace("Bypassing endpoint doc/scan");
		}
		
		/**
		Configure (create, start then initialize) a service that will handle its request-response 
		sessions.

		The session request is constructed in 3 phases: startRequest, startResponse, then routeRequest.
		As these phases are performed, the request hash req is extended.

		@param {Function} agent callback(req,res) to handle session request-response 
		*/
		function configService(init) {  	//< configure, create, then start the server

			/**
			Create and start the HTTP/HTTPS server.  If starting a HTTPS server, the truststore
			is scanned for PKI certs.
			*/
			function createServer() {		//< create and start the server
				
				/**
				Start service and attach listener.  Established the secureIO if configured.  Establishes
				server-busy tests to thwart deniel-of-service attackes and process guards to trap faults.  When
				starting the master process, other configurations are completed.  Watchdogs and proxies are
				also established.
				
				@param {Object} server server being started
				@param {Numeric} port port number to listen on
				@param {Function} cb callback listener cb(Req,Res)
				*/				
				function startServer(server, port, agent) {	//< attach listener callback cb(Req,Res) to the specified port
					const 
						{ initialize, secureIO, name, dogs, guard, guards, proxy, proxies, cores, sendMail } = TOTEM;
					
					Log(`STARTING ${name}`);

					if ( secureIO )		// setup secure link sessions with a guest profile
						sqlThread( sql => {
							sql.query( "SELECT * FROM openv.profiles WHERE Client='Guest' LIMIT 1", [], (err,recs) => {
								Log( recs[0] 
									? "Guest logins enabled"
									: "Guest logins disabled" );
								
								SECLINK.config( Copy(secureIO, {
									server: server,
									sqlThread: sqlThread,
									notify: sendMail,
									guest: recs[0]
								}) );
								
								secureIO.sio = SECLINK.sio;
							});
						});

					/*
					The BUSY interface provides a means to limit client connections that would lock the 
					service (down deep in the tcp/icmp layer).  Busy thus helps to thwart denial of 
					service attacks.  (Alas latest versions do not compile in latest NodeJS.)
					*/

					if (BUSY && TOTEM.busyTime) BUSY.maxLag(TOTEM.busyTime);

					if (guard)  { // catch core faults
						process.on("uncaughtException", err => Log( "FAULTED" , err) );

						process.on("exit", code => Log( "HALTED", code ) );

						for (var signal in guards)
							process.on(signal, () => Log( "SIGNALED", signal) );
					}

					server.on("request", agent);

					server.listen( port, () => {  	// listen on specified port
						Log("LISTENING ON", port);
						
						if (sqlThread() )
							sqlThread( sql => {
								initialize( sql, sql => {
									if (init) init(sql);	
								});
							});
						
						else
							Trace( errors.noDB );
					});

					if (CLUSTER.isMaster)	{ // setup listener on master port
						CLUSTER.on('exit', (worker, code, signal) =>  Log("WORKER TERMINATED", code || errors.ok));

						CLUSTER.on('online', worker => Log("WORKER CONNECTED"));

						for (var core = 0; core < TOTEM.cores; core++) // create workers
							worker = CLUSTER.fork();
						
						const { modTimes, onFile, watchFile,secureIO } = TOTEM;

						Each(onFile, (area, cb) => {  // callback cb(sql,name,area) when file changed
							FS.readdir( area, (err, files) => {
								if (err) 
									Log(err);

								else
									files.forEach( file => {
										if ( !file.startsWith(".") && !file.startsWith("_") )
											watchFile( area+file, cb );
									});
							});	
						});

						Log( [ // splash
							"HOSTING " + site.nick,
							"AT " + `(${site.master}, ${site.worker})`,
							"FROM " + process.cwd(),
							"WITH " + (guard?"GUARDED":"UNGUARDED")+" THREADS",
							"WITH "+ (secureIO ? secureIO.sio ? "SECURE" : "INSECURE" : "NO")+" LINKS",
							"WITH " + (site.sessions||"UNLIMITED") + " CONNECTIONS",
							"WITH " + (cores ? cores + " WORKERS AT "+site.worker : "NO WORKERS"),
							"POCS " + JSON.stringify(site.pocs)
						].join("\n- ") );

						sqlThread( sql => {	// initialize file watcher, proxies, watchdog and endpoints
							sql.query("UPDATE openv.files SET State='watching' WHERE Area='uploads' AND State IS NULL");

							if ( dogs )		// start watch dogs
								startDogs( sql, dogs );

							if ( proxies ) 	{ 	// setup rotating proxies
								sql.query(	// out with the old
									"DELETE FROM openv.proxies WHERE hour(timediff(now(),created)) >= 2");

								proxies.forEach( (proxy,src) => {	// in with the new
									Fetch( proxy, html => {
										//Log(">>>proxy", proxy, html.length);
										var 
											$ = SCRAPE.load(html),
											now = new Date(),
											recs = [];

										switch (proxy) {
											case "https://free-proxy-list.net":
											case "https://sslproxies.org":
												var cols = {
													ip: 1,
													port: 2,
													org: 3,
													type: 5,
													proto: 6
												};

												$("table").each( (idx,tab) => {
													//Log("table",idx); 
													if ( idx==0 )
														for ( var key in cols ) {
															if ( col = cols[key] )
																$( `td:nth-child(${col})`, tab).each( (i,v) => {
																	if ( col == 1 ) recs.push( Copy(cols, {
																		source: src,
																		created: now
																	}) );
																	var rec = recs[i];
																	rec[ key ] = $(v).text();
																}); 
														}
												}); 
												break;

											default:
												Log("ignoring proxy", proxy);
										}

										Log("SET PROXIES", recs);
										recs.forEach( rec => {
											sql.query(
												"INSERT INTO openv.proxies SET ? ON DUPLICATE KEY UPDATE ?", 
												[rec, {created: now, source:src}]);
										});
									});
								});
							}

							docEndpoints(sql);
						});
					}
				}

				const 
					{ crudIF,name,cache,trustStore,certs } = TOTEM,
					port = parseInt( CLUSTER.isMaster ? $master.port : $worker.port );

				//Log( ">>start", isEncrypted(), $master, $worker );

				certs.totem = {  // totem service certs
					pfx: FS.readFileSync(`${paths.certs}${name}.pfx`),
					//key: FS.readFileSync(`${paths.certs}${name}.key`),
					//crt: FS.readFileSync(`${paths.certs}${name}.crt`)
				};

				//Log("enc>>>", isEncrypted(), paths.certs+"truststore" );
				
				Each( FS.readdirSync(paths.certs+"truststore"), (n,file) => {
					if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
						Log("TRUSTING", file);
						trustStore.push( FS.readFileSync( `${paths.certs}truststore/${file}`, "utf-8") );
					}
				});

				const
					server = TOTEM.server = isEncrypted() 
						? HTTPS.createServer({
							passphrase: TOTEM.passEncrypted,		// passphrase for pfx
							pfx: certs.totem.pfx,			// pfx/p12 encoded crt and key 
							ca: trustStore,				// list of pki authorities (trusted serrver.trust)
							crl: [],						// pki revocation list
							requestCert: true,
							rejectUnauthorized: true,
							secureProtocol: 'TLSv1_2_method',
							//secureOptions: CONS.SSL_OP_NO_TLSv1_0
						})	// using encrypted services so use https 			
						: HTTP.createServer();		  // using unencrpted services so use http 

				startServer( server, port, (Req,Res) => {		// start server with provided req-res agent
					/**
					Provide a request hash req to the supplied session, or terminate the session 
					if the service is too busy.

					In phase1 of session setup, the following is added to this req:

						host: "proto://domain:port"	// requested host 
						cookie: "...."		// client cookie string
						agent: "..."		// client browser info
						ipAddress: "..."	// client ip address
						referer: "proto://domain:port/query"	//  url during a cross-site request
						method: "GET|PUT|..." 			// http request method
						action: "select|update| ..."	// corresponding crude name
						started: date		// date stamp when requested started
						encrypted: bool		// true if request on encrypted server
						post: "..."			// raw body text
						url	: "/query"		// requested url path
						reqSocket: socket	// socket to retrieve client cert 
						resSocket: socket	// socket to accept response
						site: {...}			// site info

					@param {Function} ses session(req) callback accepting the provided request
					*/
					function startRequest( ses ) { 		// start request and callback session cb
						function getSocket() {  //< returns suitable response socket depending on cross/same domain session
							if ( Req.headers.origin ) {  // cross domain session is in progress from master (on http) to its workers (on https)
								Res.writeHead(200, {"content-type": "text/plain", "access-control-allow-origin": "*"});
								Res.socket.write(Res._header);
								Res._headerSent = true;
								return Res.socket;
							}

							else   // same domain (http-to-http or https-to-https) so must use the request socket
								return Req.socket;
						}

						function getPost( cb ) { // Feed raw post to callback
							var post = ""; 

							Req
							.on("data", chunk => post += chunk.toString() )
							.on("end", () => cb( post ) );
						}

						switch ( Req.method ) {	// get post parms depending on request type being made
							case "PUT":
							case "GET":
							case "POST":
							case "DELETE":
								getPost( post => {
									//Log(">>>>post", post);
									//Log(Req.headers, Req.url);
									ses(null, {			// prime session request
										cookie: Req.headers["cookie"] || "",
										ipAddress: Req.connection.remoteAddress,
										host: $master.protocol+"//"+Req.headers["host"],	// domain being requested
										referer: Req.headers["referer"], 	// proto://domain used
										agent: Req.headers["user-agent"] || "",	// requester info
										post: post, // raw post body
										method: Req.method,		// get,put, etc
										started: new Date(),  // Req.headers.Date,  // time client started request
										action: crudIF[Req.method],	// crud action being requested
										reqSocket: Req.socket,   // use supplied request socket 
										resSocket: getSocket,		// attach method to return a response socket
										encrypted: isEncrypted(),	// on encrypted worker
										url: unescape( Req.url || "/" ),	// unescaped url
										site: site			// site info
										/*
										There exists an edge case wherein an html tag within json content, e.g a <img src="/ABC">
										embeded in a json string, is reflected back the server as a /%5c%22ABC%5c%22, which 
										unescapes to /\\"ABC\\".  This is ok but can be confusing.
										*/
									});
								});
								break;

							case "OPTIONS":  // client making cross-domain call - must respond with what are valid methods
								//Req.method = Req.headers["access-control-request-method"];
								//Log(">>>>>>opts req", Req.headers);
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
								ses( errors.badMethod );
						}
					}

					if ( BUSY ? BUSY() : false )	// trap DNS attacks
						Res.end( errors.isBusy );

					else
						startRequest( (err,req) => {  // start request if service not busy
							/**
							Provide a response to a session after attaching cert, client, profile 
							and session info to this request.  

							In phase2 of the session setup, the following is added to this req:
							
								log: {...}			// info to trap socket stats
								client: "..."		// name of client from cert or "guest"
								cert: {...} 		// full client cert

							@param {Function} cb connection accepting the provided response callback
							*/
							function startResponse( ses ) {  	// start response using this session callback								
								if ( req.reqSocket )	// have a valid request socket so ....
									loginClient(req, (err,prof) => {	// get client profile
										if (prof) {			// client accepted so start session
											req.client = prof.Client;
											req.profile = prof;

											const 
												{ sql, client } = req,
												{ addConnect } = sqls;

											ses(null, data => {  // Provide session response callback

												function sendString( data ) {  // Send string - terminate sql connection
													Res.end( data );
												}

												function sendError(err) {  // Send pretty error message - terminate sql connection
													switch ( req.type ) {
														case "html":
														case "db":
															Res.end( errors.pretty(err) );
															break;

														default:
															Res.end( err+"" );
													}
												}

												function sendObject(obj) {
													try {
														sendString( JSON.stringify(obj) );
													}
													catch (err) {  // infinite cycle
														sendError( errors.badReturn );
													}		
												}

												function sendRecords(recs) { // Send records via converter
													if ( route = filterType[req.type] )  // process record conversions
														route(recs, req, recs => {
															if (recs) 
																switch ( typeOf(recs) ) {
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
												}

												const
													{ req } = Req,
													{ sql } = req,
													mimes = MIME.types,
													mime = mimes[ isError(data||0) ? "html" : req.type ] || mimes.html;

												// set appropriate headers to prevent http-parse errors when using master-worker proxy

												/*
												if ( req.encrypted )
													Res.setHeader("Set-Cookie", ["client="+req.client, "service="+TOTEM.name] );						
												*/

												try {
													Res.setHeader("Content-Type", mime);

													if ( CORS ) {	// support CORS
														Res.setHeader("Access-Control-Allow-Origin", "*");
														Res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
														Res.setHeader("Access-Control-Allow-Headers", '*');
														Res.setHeader("Status", "200 OK");
														Res.setHeader("Vary", "Accept");
													}

													/*
													Experimental:
													self.send_header('Content-Type', 'application/octet-stream')
													*/

													Res.statusCode = 200;

													if (data != null)
														switch ( typeOf(data) ) {  // send based on its type
															case "Error": 			// send error message
																sendError( data );
																break;

															case "Array": 			// send data records 
																sendRecords(data);
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
														sendError( errors.badReturn );
												}

												catch (err) {
													Res.end();
												}	
											});	

											if ( addConnect )	// optional logging of connections
												sql.query(addConnect, {
													Client: client,
													Message: "joined", //JSON.stringify(cert),
													Joined: new Date()
												});
										}
										
										else
											ses( err || errors.badLogin );
									});

								else 	// lost request socket for some reason so ...
									res( errors.noSocket );
							}

							//Log("startReq", err);

							if (err)
								Res.end( errors.pretty( err ) );

							else {
								Req.req = req;
								startResponse( (err,res) => {	// route the request on the provided response callback
									//Log("startRes", err);

									if ( err ) 
										Res.end( errors.pretty( err ) );

									else
										routeRequest(req,res); 
								});
							}
						});
				});
			}

			const
				{ name, cores } = TOTEM,
				pfx = `${paths.certs}${name}.pfx` ;

			Log( `PROTECTING ${name} USING ${pfx}` );

			Copy( new URL(site.master), $master);
			Copy( new URL(site.worker), $worker);
			
			site.domain = $master.hostname;
			site.host = $master.protocol+"//"+$master.host;
			//Log(">>domain",site.master, $master, site.worker, $worker, site.domain, site.host);
			
			if ( isEncrypted() )   // get a pfx cert if protecting an encrypted service
				FS.access( pfx, FS.F_OK, err => {
					if (err) // create self-signed cert then connect
						createCert(	`${paths.certs}${name}`, TOTEM.passEncrypted, () => {
							createServer();
						});	

					else // got the pfx so connect
						createServer();
				});

			else 
				createServer();
		}

		const
			{ name } = TOTEM;
		
		Log(`CONFIGURING ${name}`); 

		if (opts) Copy(opts, TOTEM, ".");

		try {
			addEndpoints( require(paths.userEndpts) );
		}
		
		catch (err) {
			Trace("Bad endpts");
		}
		
		Each( paths.mimes, (key,val) => {	// extend or remove mime types
			if ( val ) 
				MIME.types[key] = val;
			else
				delete MIME.types[key];
		});

		JSDB.config(null, sql => {
			if ( sql ) 
				setContext(sql, () => {
					configService(cb);
				});
			
			else 
				configService(cb);
		});	
	},

	/**
	*/
	initialize: (sql,init) => {
		init(sql);
	},
	
	queues: JSDB.queues, 	// pass along
		
	/**
	Common methods for task sharding
	@cfg {Object}
	*/
	tasking: {
		console: console,
		log: console.log
	},
	
	onUpdate: null,
		
	/**
	Shard one or more tasks to workers residing in a compute node cloud.

	@example
	runTask({  		// example
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

	@cfg {Function}
	@param {Object} opts tasking options (see example)
	@param {Function} task runTask of the form ($) => {return msg} where $ contains process info
	@param {Function} cb callback of the form (msg) => {...} to process msg returned by task
	*/				
	runTask: function (opts, task, cb) {

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
			fetches = 0, 
			node = 0,
			nodeURL = paths.nodes[node],
			nodeReq = {
				domains: [],
				client: opts.client || "guest",
				credit: opts.credit || 10e3,
				name: opts.name || "atask",
				qos: opts.qos || 0,
				cb: cb+""
			},
			doms = nodeReq.domains, 
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
				doms.push( index );		// push index set on node request

				if ( isLast || (doms.length == shards) ) {  // last index or shards exhausted
					if ( ++fetches > cores ) {	// distribute to next node
						nodeURL = paths.nodes[++node];
						if ( !nodeURL) nodeURL = paths.nodes[node = 0];	// recycle nodes
						fetches = 0;
					}

					if (task) 
						if ( isArray(task) )
							task.forEach( task => {		// multiple tasks supplied
								nodeReq.task = task+"";
								Fetch( nodeURL, nodeReq );
							});

						else {	// post the task request to the node
							nodeReq.task = task+"";
							Fetch( nodeURL, nodeReq );
						}

					else
						doms.forEach( cb );

					doms.length = 0;
				}
			});
	},
					
	/**
	Watchdogs {name: dog(sql, lims), ... } run at intervals dog.cycle seconds usings its
	dog.trace, dog.parms, sql connector and threshold parameters.
	@cfg {Object}
	*/		
	dogs: { //< watchdog functions(sql, lims)
	},
	
	/**
	Establish smart file watcher when file at area/name has changed.
	@cfg {Function}
	@param {String} path to file being watched
	@param {Function} callback cb(sql, name, path) when file at path has changed
	*/
	watchFile: function (path, cb) { 
		const 
			{ modTimes } = TOTEM;
		
		Log("WATCHING", path);
		
		modTimes[path] = 0; 

		try {
			FS.watch(path, function (ev, file) {  
				var 
					isSwap = file.startsWith(".");

				if (file && !isSwap)
					switch (ev) {
						case "change":
							sqlThread( sql => {
								Log(ev.toUpperCase(), file);

								FS.stat(path, function (err, stats) {

									//Log(path, err, stats);
									if ( !err && (modTimes[path] != stats.mtime) ) {
										modTimes[path] = stats.mtime;
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
		}
		
		catch (err) {
			Log("watch file", err);
		}
	},
		
	/**
	Create a cert for the desired owner with the desired passphrase then 
	callback cb() when complete.

	@param {String} owner userID to own this cert
	@param {String} password for this cert
	@param {Function} cb callback when completed
	*/
	createCert: (path,pass,cb) => { 

		function traceExecute(cmd,cb) {

			Log(cmd.replace(/\n/g,"\\n"));

			CP.exec(cmd, err => {

				if (err)
					console.info({
						shell: cmd,
						error: err
					});

				cb();
			});
		}

		const 
			truststore = `${paths.certs}truststore`,
			pfx = path + ".pfx",
			key = path + ".key",
			crt = path + ".crt",
			ppk = path + ".ppk";

		Log( "CREATE SELF-SIGNED CERT", path );	

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

			Log("IGNORE PUTTYGEN ERRORS IF NOT INSTALLED"); 
			cb();
		});
		});
		});
		});

	},
	
	/**
	Stop the server.
	@cfg {Function}
	*/
	stop: stopService,
	
	/**
	Thread a new sql connection to a callback.  
	@cfg {Function}
	@param {Function} cb callback(sql connector)
	*/
	sqlThread: sqlThread,

	/**
	Thread a new neo4j connection to a callback.  
	@cfg {Function}
	@param {Function} cb callback(sql connector)
	*/
	neoThread: neoThread,
			
	/**
	REST-to-CRUD translations
	@cfg {Object}  
	*/
	crudIF: {
		GET: "select",
		DELETE: "delete",
		POST: "insert",
		PUT: "update"
	},
	
	/**
	Options to parse request flags
	@cfg {Object} 
	*/
	filterFlag: {				//< Properties for request flags
		traps: { //< cb(query) traps to reorganize query
			filters: req => {
				var 
					flags = req.flags,
					where = req.where,
					filters = flags.filters;
				
				if (filters && filters.forEach )
					filters.forEach( filter => where["="][ filter.property ] = filter.value || "" );
			}
		},
		strips:	 			//< Flags to strips from request
			{"":1, "_":1, leaf:1, _dc:1}, 		

		//ops: "<>!*$|%/^~",
		id: "ID", 					//< db record id
		prefix: "_"				//< Prefix that indicates a field is a flag
		//trace: "_trace",		//< Echo flags before and after parse	
		/*blog: function (recs, req, res) {  //< Default blogger
			res(recs);
		} */
	},

	/**
	Number of worker cores (0 for master-only).  If cores>0, masterport should != workPort, master becomes HTTP server, and workers
	become HTTP/HTTPS depending on encrypt option.  In the coreless configuration, master become HTTP/HTTPS depending on 
	encrypt option, and there are no workers.  In this way, a client can access stateless workers on the workerport, and stateful 
	workers via the masterport.	
	@cfg {Number} [cores=0]
	*/				
	cores: 0,	//< Number of worker cores (0 for master-only)
		
	/**
	Folder watching callbacks cb(path) 
	@cfg {Object}
	*/				
	onFile: {		//< File folder watchers with callbacks cb(path) 
	},
	
	/**
	File mod-times tracked as OS will trigger multiple events when file changed
	@cfg {Object}
	*/
	modTimes: { 	//< File mod-times tracked as OS will trigger multiple events when file changed
	},
		
	/**
	Enable if https server being proxied
	@cfg {Boolean} [behindProxy=false]
	*/				
	behindProxy: false,		//< Enable if https server being proxied

	/**		
	Service name used to
		1) derive site parms from mysql openv.apps by Nick=name
		2) set mysql name.table for guest clients,
		3) identify server cert name.pfx file.

	If the Nick=name is not located in openv.apps, the supplied	config() options 
	are not overridden.
	*/
	name: "Totem",

	/**
	Enabled when master/workers on encrypted service
	@cfg {Boolean}
	*/
	passEncrypted: ENV.SERVICE_PASS || "",
			
	isEncrypted: () => ( CLUSTER.isMaster ? $master.protocol : $worker.protocol ) == "https:",

	/**
	Host information: https encryption passphrase,
	domain name of workers, domain name of master.
	@cfg {String} [name="Totem"]
	*/	

	$master: { // derived
	},
	
	$worker: { // derived
	},
			
	/**
	Site context extended by the mysql derived query when service starts
	@cfg {Object} 
	*/
	site: {  	//< reserved for derived context vars
		nick: "totem",
		socketio: 
			"/socketio/socketio-client.js",		// working
			//  "/socket.io/socket.io-client.js",	// buggy
		
		started: new Date(),
		worker:  ENV.SERVICE_WORKER_URL || "http://localhost:8081", 
		master:  ENV.SERVICE_MASTER_URL || "http://localhost:8080",
		domain: "tbd.domain.org",
		pocs: {
			admin: "admin@tbd.org",
			overlord: "overlord@tbd.org",
			super: "super@tbd.org",
			user: "user@tbd.org"
		}		
	},

	/**
	Endpoint filterType cb(data data as string || error)
	@cfg {Object} 
	*/
	filterType: {  //< record data convertors
		csv: (recs, req, res) => {
			JS2CSV({ 
				recs: recs, 
				fields: Object.keys( recs[0]||{} )
			} , function (err,csv) {
					res( err || csv );
			});
		},
		
		"": (recs,req,res) => res( recs ),
			
		json: (recs,req,res) => res( recs ),
		
		xml: (recs, req, res) => {
			res( JS2XML.parse(req.table, {  
				count: recs.length,
				recs: recs
			}) );
		}		
	},

	/**
	By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management
	@cfg {Object} 
	*/	
	byTable: { 			  //< by-table routers	
		/**
		Endpoint to test connectivity.

		@param {Object} req Totem request
		@param {Function} res Totem response
		*/
		ping: (req,res) => {
			const 
				{ client, site, type } = req,
				{ nick } = site;

			if (type == "help")
			return res("Send connection status");

			res( `Welcome ${client} to ${nick}` );
		},

		/**
		Endpoint to shard a task to the compute nodes.

		@param {Object} req Totem request
		@param {Function} res Totem response
		*/
		task: (req,res) => {  //< task sharding
			const {query,body,sql,type,table,url} = req;
			const {task,domains,cb,client,credit,name,qos} = body;

			if ( type == "help" ) 
			return res("Shard specified task to the compute nodes given task post parameters");

			var 
				$ = JSON.stringify({
					worker: CLUSTER.isMaster ? 0 : CLUSTER.worker.id,
					node: process.env.HOSTNAME
				}),
				engine = `(${cb})( (${task})(${$}) )`;

			res( errors.ok );

			if ( task && cb ) 
				doms.forEach( index => {

					function runTask(idx) {
						VM.runInContext( engine, VM.createContext( Copy( TOTEM.tasking || {}, idx) ));
					}

					if (qos) 
						sql.queueTask( new Clock("totem", "second"), { // job descriptor 
							index: Copy(index,{}),
							//priority: 0,
							Class: table,
							Client: client,
							Name: name,
							Task: name,
							Notes: [
									table.tag("?",query).link( "/" + table + ".run" ), 
									((credit>0) ? "funded" : "unfunded").link( url ),
									"RTP".link( `/rtpsqd.view?task=${name}` ),
									"PMR brief".link( `/briefs.view?options=${name}` )
							].join(" || ")
						}, (recs,job,res) => {
							//Log("reg job" , job);
							runTask( job.index );
							res();
						});

					else
						runTask( index );
				});
		},

		/**
		Endpoint to validate clients response to an antibot challenge.

		@param {Object} req Totem session request
		@param {Function} res Totem response callback
		*/
		riddle: (req,res) => {
			const 
				{ query, sql, type, body, action } = req,
				{ client , guess } = (action=="select") ? query : body;

			if ( type == "help" ) 
			return res("Validate session.");

			Log(">>>Validate", client,guess);

			if (client && guess)
				testClient(client,guess,res);
				/*
				sql.query("SELECT Riddle FROM openv.riddles WHERE CLIENT=? LIMIT 1",[client], (err,recs) => {
					if ( rec = recs[0] )
						res( (rec.Riddle == guess.replace(/ /g,"")) ? "pass" : "fail" );
					
					else
						res( "fail" );
				});
				*/

			else
				res( errors.noClient );
		}	
	},
		
	/**
	By-action endpoint routers for accessing engines
	@cfg {Object} 
	*/				
	byAction: { //< by-action routers
		/**
		CRUD endpoint to respond to a select||GET request
		@cfg {Function}
		@param {Object} req Totem session request
		@param {Function} res Totem session response
		*/
		select: (req, res) => {
			const 
				{ sql, flags, client, where, index, ds } = req;

			//Log("selDS", ds, index);

			sql.Select( ds, index, where, flags, (err,recs) => {
				res( err || recs );
			});
		},	

		/**
		CRUD endpoint to respond to a update||POST request
		@cfg {Function}	
		@param {Object} req Totem session request
		@param {Function} res Totem session response
		*/
		update: (req, res) => {
			const 
				{ sql, flags, body, where, query, client, ds, table } = req,
				{ sio } = SECLINK;

			//Log({w:where, q:query, b:body, t:table, ds: ds});

			if ( isEmpty(body) )
				res( errors.noBody );

			else
			if ( !query.ID )
				res( errors.noID );

			else {
				sql.query(	// update db logs if it exits
					"INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1", {
						Dataset: table,
						Client: client
					});

				sql.Update(ds, where, body, (err,info) => {

					body.ID = query.ID;
					res( err || body );

					if ( sio && !err ) // Notify other clients of change
						sio.emit( "update", {
							ds: table, 
							change: {}, 
							recID: query.ID || -1, 
							by: client
						});				
				});
			}
		},

		/**
		CRUD endpoint to respond to a delete||DELETE request
		@cfg {Function}	
		@param {Object} req Totem session request
		@param {Function} res Totem session response
		*/
		delete: (req, res) => {
			const 
				{ sql, flags, where, query, body, client, ds, table } = req,
				{ sio } = SECLINK;

			if ( !query.ID )
				res( errors.noID );

			else
				sql.Delete(ds, where, (err,info) => {
					body.ID = query.ID;
					res( err || body );

					if ( sio && !err ) // Notify other clients of change
						sio.emit( "delete", {
							ds: table, 
							change: {}, 
							recID: query.ID || -1, 
							by: client
						});	

				});
		},

		/**
		CRUD endpoint to respond to a insert||PUT request
		@cfg {Function}
		@param {Object} req Totem session request
		@param {Function} res Totem session response
		*/
		insert: (req, res) => {
			const 
				{ sql, flags, body, client, ds,table } = req,
				{ sio } = SECLINK;

			sql.Insert(ds,body,(err,info) => {
				res( err || {ID: info.insertId} );

				if ( sio && !err ) // Notify other clients of change
					sio.emit( "insert", {
						ds: table, 
						change: body, 
						recID: info.insertId,
						by: client
					});			
			});
		},

		/**
		CRUD endpoint to respond to a Totem request
		@cfg {Function}
		@param {Object} req Totem session request
		@param {Function} res Totem session response
		*/
		execute: (req,res) => {
			res( errors.noEndpoint );
		}
	},

	/**
	By-type endpoint routers  {type: method(req,res), ... } for accessing dataset readers
	@cfg {Object} 
	*/				
	byType: {  //< by-type routers
	},

	/**
	By-area endpoint routers {area: method(req,res), ... } for sending/cacheing files
	@cfg {Object} 
	*/		
	byArea: {
		default: (req,res) => {
			const
				{client,path} = req;

			Fetch( "file:" + path, files => {
				req.type = "html"; // otherwise default type is json.
				res(
					`hello ${client}<br>Index of ${path}<br>` +
					files.map( file => file.link( file ) ).join("<br>") 
				);
			});
		}
	},

	/**
	Trust store extened with certs in the certs.truststore folder when the service starts in encrypted mode
	@cfg {Object} 
	*/		
	trustStore: [ ],   //< reserved for trust store
		
	/**
	CRUD endpoint to respond to Totem request
	@cfg {Object} 
	*/				
	server: null,  //< established by TOTEM at config
	
	//====================================== MISC
		
	/**
	Enable/disable service fault protection guards
	@cfg {Boolean} 
	*/
	guard: false,  //< enable to use all defined guards
		
	/**
	Service guard modes
	@cfg {Object} 
	*/
	guards: {	// faults to trap 
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
	Client admission rules
	@cfg {Object} 
	*/
	admitRules: {  // empty to disable rules
		// CN: "james brian d jamesbd",
		// O: "u.s. government",
		// OU: ["nga", "dod"],
		// C: "us"
	},

	sendMail: msg => { throw new Error("sendMail never configured"); },
	/**
	*/
	proxies: null, /* [	// rotating proxy services
		//"https://free-proxy-list.net",
		//https://luminato.io
		"https://sslproxies.org"
	], */

	/**
	Default paths to service files
	@cfg {Object} 
	*/		
	paths: { 			
		//fetch: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
		//default: "/gohome",
		//resetpass: "/resetpass",
		
		//wget: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
		//curl: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
		//http: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",

		crud: ["create","select","update","delete","execute"],
			
		certs: "./config/certs/",

		//serviceEndpts: "./endpts",
		userEndpts: "./config/endpts",
			
		nodes: {  // available nodes for task sharding
			0: ENV.SHARD0 || "http://localhost:8080/task",
			1: ENV.SHARD1 || "http://localhost:8080/task",
			2: ENV.SHARD2 || "http://localhost:8080/task",
			3: ENV.SHARD3 || "http://localhost:8080/task"
		},

		mimes: {  // Extend and remove mime types as needed
		}
	},

	//lookups: {},
	//Lookups: {},
		
	/**
	*/
	sqls: {	// sql queries
		//getAccount:	"SELECT Trusted, validEmail, Banned, aes_decrypt(unhex(Password),?) AS Password, SecureCom FROM openv.profiles WHERE Client=? AND !Online", 
		//addAccount:	"INSERT INTO openv.profiles SET ?,Password=hex(aes_encrypt(?,?)),SecureCom=if(?,concat(Client,Password),'')", 
		//setToken: "UPDATE openv.profiles SET Password=hex(aes_encrypt(?,?)), SecureCom=if(?,concat(Client,Password),''), TokenID=null WHERE TokenID=?",
		//getToken: "SELECT Client FROM openv.profiles WHERE TokenID=?", 
		//addToken: "UPDATE openv.profiles SET SessionID=? WHERE Client=?",
		//addSession: "UPDATE openv.profiles SET Online=1, SessionID=? WHERE Client=?",
		//endSession: "UPDATE openv.profiles SET Online=0, SessionID=null WHERE Client=?",
		//logThreads: "show session status like 'Thread%'",
		//users: "SELECT 'users' AS Role, group_concat( DISTINCT lower(dataset) SEPARATOR ';' ) AS Clients FROM openv.dblogs WHERE instr(dataset,'@')",
		derive: "SELECT * FROM openv.apps WHERE ? LIMIT 1",
		// logMetrics: "INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?",
		search: "SELECT * FROM openv.files HAVING Score > 0.1",
		//credit: "SELECT * FROM openv.files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 1",
		//getProfile: "SELECT * FROM openv.profiles WHERE Client=? LIMIT 1",
		//addSession: "INSERT INTO openv.sessions SET ?",
		//addProfile: "INSERT INTO openv.profiles SET ?",
		//getSession: "SELECT * FROM openv.sessions WHERE ? LIMIT 1",
		//addConnect: "INSERT INTO openv.sessions SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1",
		//challenge: "SELECT *,concat(client,password) AS Passphrase FROM openv.profiles WHERE Client=? LIMIT 1",
		//guest: "SELECT * FROM openv.profiles WHERE Client='guest@totem.org' LIMIT 1",
		pocs: "SELECT admin,overlord, group_concat( DISTINCT lower(Client) SEPARATOR ';' ) AS Users FROM openv.profiles GROUP BY admin,overlord"
	},

	/**
	Get (or create if needed) a file with callback cb(fileID, sql) if no errors

	@param {String} client owner of file
	@param {String} name of file to get/make
	@param {Function} cb callback(file, sql) if no errors
	@cfg {Function}
	*/

	getBrick: (client, name, cb) => {  
		sqlThread( sql => {
			sql.forFirst( 
				"FILE", 
				"SELECT ID FROM openv.files WHERE least(?,1) LIMIT 1", {
					Name: name
					//Client: client,
					//Area: area
				}, 
				file => {

					if ( file )
						cb( file );

					else
						sql.forAll( 
							"FILE", 
							"INSERT INTO openv.files SET _State_Added=now(), ?", {
								Name: name,
								Client: client
								// Path: filepath,
								// Area: area
							}, 
							info => {
								cb({
									ID: info.insertId, 
									Name: name,
									Client: client
								});
							});
				});	
		});
	},

	/**
	File uploader 
	@cfg {Function}
	*/			
	uploadFile: uploadFile,

	/**
	Server toobusy check period in seconds
	@cfg {Number}
	*/		
	busyTime: 5000,  //< site too-busy check interval [ms] (0 disables)

	/**
	Sets the site context parameters.
	@cfg {Function}
	*/		
	setContext: function (sql,cb) { 
		Log(`CONTEXTING ${TOTEM.name}`);
	
		const 
			{pocs,derive} = sqls;

		site.warning = "";

		/*
		const 
			{lookups,Lookups} = TOTEM;

		site.lookups = lookups,
		site.Lookups = Lookups;
		
		sql.query("SELECT Ref AS `Key`,group_concat(DISTINCT Path SEPARATOR '|') AS `Select` FROM openv.lookups GROUP BY Ref", [], (err,recs) => {
			if (recs)
				recs.forEach( rec => {
					lookups[rec.Key] = rec.Select;
				});
			
			else
				throw new Error("Check if mysql service is running");
			//Log(">>>lookups", lookups);
		});
		
		sql.query("SELECT Ref,Path,Name FROM openv.lookups", [], (err,recs) => {
			if (recs)
				recs.forEach( rec => {
					const 
						{Ref,Path,Name} = rec,
						Lookup = Lookups[Ref] || (Lookups[Ref] = {});

					Lookup[Name] = Path;
				});
			
			else
				throw new Error("Check if mysql service is running");
			//Log(">>>Lookups", Lookups);
		});
		*/
		
		/*
		if (users) 
			sql.query(users)
			.on("result", user => site.pocs["user"] = (user.Clients || "").toLowerCase() );
			//.on("end", () => Log("user pocs", site.pocs) );
		*/
		
		sql.query(derive, {Nick:TOTEM.name})
		.on("result", opts => {
			Each(opts, (key,val) => {
				key = key.toLowerCase();
				try {
					site[key] = JSON.parse( val );
				}
				catch (err) {
					site[key] = val;
				}

				//Log(">>>site",key,val);
				if (key in TOTEM) 
					TOTEM[key] = site[key];
			});
		})
		.on("end", () => {
		
			sql.query(pocs, [], (err,recs) => {
				recs.forEach( rec => {
					if ( rec.admin ) site.pocs.admin = rec.Users.toLowerCase();
					if ( rec.overlord ) site.pocs.overlord = rec.Users.toLowerCase();
				});
							 
				if (cb) cb();
			});
			
		});
		
		/* legacy
		sql.query("SELECT count(ID) AS Fails FROM openv.aspreqts WHERE Status LIKE '%fail%'").on("result", asp => {
		sql.query("SELECT count(ID) AS Fails FROM openv.ispreqts WHERE Status LIKE '%fail%'").on("result", isp => {
		sql.query("SELECT count(ID) AS Fails FROM openv.swreqts WHERE Status LIKE '%fail%'").on("result", sw => {
		sql.query("SELECT count(ID) AS Fails FROM openv.hwreqts WHERE Status LIKE '%fail%'").on("result", hw => {

			site.warning = [
				site.warning || "",
				"ASP".fontcolor(asp.Fails ? "red" : "green").link( "/help?from=asp" ),
				"ISP".fontcolor(isp.Fails ? "red" : "green").link( "/help?from=isp" ),
				"SW".fontcolor(sw.Fails ? "red" : "green").link( "/help?from=swap" ),   // mails list of failed swapIDs (and link to all sw reqts) to swap PMO
				"HW".fontcolor(hw.Fails ? "red" : "green").link( "/help?from=pmo" )   // mails list of failed hw reqts (and link to all hw reqts) to pod lead
			].join(" ");

		});
		});
		});
		});
		*/
	},

	certs: {}, 		// server and client cert cache (pfx, crt, and key)

	/**
	File cache
	@cfg {Object} 
	*/		
	cache: { 				//< file cacheing options
		never: {	//< files to never cache - useful while debugging client side stuff
			uis: 1,
			jades: 1
		}
	}

};

/**
Stop the server.
*/
function stopService(cb) {
	if (server = TOTEM.server)
		server.close( () => {
			Trace("SERVICE STOPPED");
			if (cb) cb();
		});
	
	else {
		Trace("SERVICE NEVER STARTED");
		if (cb) cb();
	}
}

/**
Uploads a source stream `srcStream` to a target file `sinkPath` owned by the 
specified `client`; optional `tags` are tagged to the upload and the callback 
`cb` is made if the upload was successful.

@param {String} client file owner
@param {Stream} source stream
@param {String} sinkPath path to target file
@param {Object} tags hash of tags to add to file
@param {Function} cb callback(file) if upload successful
*/
function uploadFile( client, srcStream, sinkPath, tags, cb ) { 
	var
		parts = sinkPath.split("/"),
		name = parts.pop() || "";
	
	getBrick(client, name, file => {
		var 
			sinkStream = FS.createWriteStream( sinkPath, "utf-8")
				.on("finish", function() {  // establish sink stream for export pipe

					//Log("UPLOADED FILE");
					sqlThread( sql => {
						sql.query("UPDATE apps.files SET ? WHERE ?", [{
							_Ingest_Tag: JSON.stringify(tags || null),
							_State_Notes: "Please go " + "here".link("/files.view") + " to manage your holdings."
						}, {ID: file.ID} ] );
					});
				})
				.on("error", err => {
					Log("totem upload error", err);
					sqlThread( sql => {
						sql.query("UPDATE openv.files SET ? WHERE ?", [ {
							_State_Notes: "Upload failed: " + err 
						}, {ID: file.ID} ] );
					});
				});

		//Log("uploading to", sinkPath);

		if (cb) cb(file.ID);  // callback if provided
		
		if (srcStream)   // if a source stream was provided, start pipe to copy source to sink
			srcStream.pipe(sinkStream);  
	});

}

/*
function proxyThread(req, res) {  // not presently used but might want to support later
	
	var 
		pathto = 
			site.master + req.path,  
			 //site.master + "/news",  
			//"http://localhost:8081" + req.path,
		
		proxy = URL.parse( pathto );

	proxy.method = req.method;
	
	Log(proxy, pathto);
	
	/ *
	var sock = NET.connect( proxy.port );
	sock.setEncoding("utf-8");
	sock.write("here is some data for u");
	sock.on("data", function (d) {
		Log("sock rx", d);
		res(d);
	}); * /
	
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

	Req.on('error', err => {
		Log("=========tx "+err);
		res("oh well");
	});
	
	//Log( "RELAY TX "+JSON.stringify( req.body) );

	if (proxy.method == "PUT") 
		Req.write( JSON.stringify(req.body) );

	Req.end( );

	
	/ *  
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
	* /

	/ *
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
	* /
	
}
*/

/*
function isAdmin(client) {
	return site.pocs.admin.indexOf(client) >= 0;
}
*/
		
/*
function simThread(sock) { 
	//Req.setSocketKeepAlive(true);
	Log({ip: sock.remoteAddress, port: sock.remotePort});
	sock.setEncoding("utf-8");
	sock.on("data", req => {
		var 
			Req = Copy({
				socket: sock  // used if master makes handoff
			}, JSON.parse(req)),
			
			Res = {  // used if master does not makes handoff
				end: function (data) {
					sock.write(data);
				}
			};
				
		startServer(Req,Res);
	});
} */

//Log(">>>>fetch oauth", Config.oauthHosts);

async function prime(cb) {
	cb();
}

switch (process.argv[2]) { //< unit tests
	case "?":
		Log("unit test with 'node totem.js [T1 || T2 || ...]'");
		break;

	case "T1": 
		Log({
			msg: "Im simply a Totem interface so Im not even running as a service", 
			default_fetcher_endpts: TOTEM.byTable,
			default_protect_mode: TOTEM.guard,
			default_cores_used: TOTEM.cores
		});
		break;

	case "T2": 
		TOTEM.config({
			mysql: null,
			guard: true,
			cores: 2
		}, sql => {

			Log( 
`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
with 2 workers and the default endpoint routes` );

		});
		break;

	case "start": 

		TOTEM.config(null, sql => {
			Log( 
`I'm a Totem service with no workers. I do, however, have a mysql database from which I've derived 
my startup options (see the openv.apps table for the Nick="Totem1").  
No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
these files. `
			);
		});
		break;

	case "T4": 
		TOTEM.config({
			byTable: {
				dothis: function dothis(req,res) {  //< named handlers are shown in trace in console
					res( "123" );

					Log("", {
						do_query: req.query
					});
				},

				dothat: function dothat(req,res) {

					if (req.query.x)
						res( [{x:req.query.x+1,y:req.query.x+2}] );
					else
						res( new Error("We have a problem huston") );

					Log("", {
						msg: `Like dothis, but needs an ?x=value query`, 
						or_query: req.query,
						or_user: req.client
					});
				}
			}
		}, sql => {
			Log("", {
				msg:
`As always, if the openv.apps Encrypt is set for the Nick="Totem" app, this service is now **encrypted** [*]
and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
aka core), Im running unprotected, and have a mysql database.  
[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
associated public NICK.crt and private NICK.key certs it creates.`,
				my_endpoints: T.byTable
			});
		});
		break;

	case "T5": 
		TOTEM.config({
			"secureIO.challenge.extend": 20
		}, sql => {
			Log("", {
				msg:
`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.`, 
				mysql_derived_parms: T.site
			});
		});
		break;

	case "T6":
		TOTEM.config({
			guard: false,	// ex override default 
			cores: 3,		// ex override default

			"byTable.": {  // define endpoints
				test: function (req,res) {
					res(" here we go");  // endpoint must always repond to its client 
					if (CLUSTER.isMaster)  // setup tasking examples on on master
						switch (req.query.opt || 1) {  // test example runTask
							case 1: 
								T.runTask({  // setup tasking for loops over these keys
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
								T.runTask({
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

		}, sql => {
			Log( "Testing runTask with database and 3 cores at /test endpoint" );
		});
		break;
		
	case "T7":
		TOTEM.config({
		}, sql => {				
			Log( "db maintenance" );

			if (CLUSTER.isMaster)
				switch (process.argv[3]) {
					case 1: 
						sql.query( "select voxels.id as voxelID, chips.id as chipID from openv.voxels left join openv.chips on voxels.Ring = chips.Ring", function (err,recs) {
							recs.forEach( rec => {
								sql.query("update openv.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], err => {
									Log(err);
								});
							});
						});
						break;

					case 2:
						sql.query("select ID, Ring from openv.voxels", function (err, recs) {
							recs.forEach( rec => {
								sql.query(
									"update openv.voxels set Point=geomFromText(?) where ?", 
									[ `POINT(${rec.Ring[0][0].x} ${rec.Ring[0][0].y})` , {ID: rec.ID} ], 
									err => {
										Log(err);
								});
							});
						});
						break;

					case 3:
						sql.query( "select voxels.id as voxelID, cache.id as chipID from openv.voxels left join openv.cache on voxels.Ring = cache.geo1", function (err,recs) {
							Log(err);
							recs.forEach( rec => {
								sql.query("update openv.voxels set chipID=? where ID=?", [rec.chipID, rec.voxelID], err => {
									Log(err);
								});
							});
						});
						break;

					case 4:
						sql.query("select ID, geo1 from openv.cache where bank='chip'", function (err, recs) {
							recs.forEach( rec => {
								if (rec.geo1)
									sql.query(
										"update openv.cache set x1=?, x2=? where ?", 
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

								sql.query("INSERT INTO openv.pcs SET ? ON DUPLICATE KEY UPDATE ?", [save,save] );	
							});
						});
						break;	
				}
		});		
		break;
		
	case "T8":
		const $ = require("../man/man.js");
		TOTEM.config();
		neoThread( neo => {
			neo.cypher( "MATCH (n:gtd) RETURN n", {}, (err,nodes) => {
				Log("nodes",err,nodes.length,nodes[0]);
				var map = {};
				nodes.forEach( (node,idx) => map[node.n.name] = idx );
				//Log(">map",map);
				
				neo.cypher( "MATCH (a:gtd)-[r]->(b:gtd) RETURN r", {}, (err,edges) => {
					Log("edges",err,edges.length,edges[0]);
					var 
						N = nodes.length,	
						cap = $([N,N], (u,v,C) => C[u][v] = 0 ),
						lambda = $([N,N], (u,v,L) => L[u][v] = 0),
						lamlist = $(N, (n,L) => L[n] = [] );
					
					edges.forEach( edge => cap[map[edge.r.srcId]][map[edge.r.tarId]] = 1 );
					
					//Log(">cap",cap);
					
					for (var s=0; s<N; s++)
						for (var t=s+1; t<N; t++) {
							var 
								{cutset} = $.MaxFlowMinCut(cap,s,t),
								cut = lambda[s][t] = lambda[t][s] = cutset.length;
							
							lamlist[cut].push([s,t]);
						}
					
					lamlist.forEach( (list,r) => {
						if ( r && list.length ) Log(r,list);
					});
						
				});
			});
		});
		break;
		
	case "INGTD":
		prime( () => {
			TOTEM.config({name:""}, sql => {
				sql.ingestFile("./config/stores/_noarch/gtd.csv", {
					target: "gtd",
					//limit: 10,
					batch: 500,
					keys: [
						"eventid varchar(16) unique key",
						"date varchar(10)",
						"latitude float",
						"longitude float",
						"weaptype1_txt varchar(64)",
						"provstate varchar(64)",
						"region_txt varchar(32)",
						"country_txt varchar(32)",
						"attacktype1_txt varchar(32)",
						"targtype1_txt varchar(32)",
						"nperps int(11)",
						"gname varchar(64)",
						"natlty1_txt varchar(32)",
						"nkill int(11)",
						"nkillus int(11)",
						"nkillter int(11)",
						"nwound int(11)",
						"nwoundus int(11)",
						"nwoundte int(11)",
						"propvalue float",
						"INT_LOG int(11)",
						"INT_IDEO int(11)",
						"INT_ANY int(11)"
					]
				});
			});
		});
		break;
		
	case "INGTDSCITE":
		prime( () => {
			TOTEM.config({name:""}, sql => {
				sql.ingestFile("./config/stores/_noarch/gtdscite.csv", {
					target: "gtd",
					//limit: 10,
					batch: 500,
					keys: [
						"eventid varchar(16) unique key",
						"scite1_source varchar(64)",
					]
				});
			});
		});
		break;
		
	case "INMEX":
		prime( () => {
			TOTEM.config({name:""}, sql => {
				sql.ingestFile("./config/stores/_noarch/centam.csv", {
					keys: "Criminal_group varchar(32),_Year int(11),Outlet_name varchar(32),Event varchar(32),Rival_group varchar(32),_Eventid varchar(8)",
					batch: 500,
					//limit: 1000
				}, 'Country == "Mexico"' );
			});
		});
		break;
		
	case "T11":
		TOTEM.config({name:""}, sql => {
			sql.batch( "gtd", {batch:100}, recs => {
				Log("streamed", recs.length);
			});
		});
		break;
			
	case "T12":
		prime( () => {
			TOTEM.config({name:""}, sql => {
				var q = sql.query("SELECT * FROM gtd where(?) LIMIT 1",{"a<":1}, err => Log(err));
				Log(q.sql);
			});
		});
		break;
		
	case "G1":
		var 
			apiKey = "AIzaSyBp56CJJA0FE5enebW5_4mTssTGaYzGqz8", // "nowhere stan" / nowhere1234 / mepila7915@lege4h.com
			searchEngine = "017944666033550212559:c1vclesecjc", // full web engine
			query = "walmart",
			url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngine}&gl=us&q=${query}`;
			
		prime( () => {
			TOTEM.config({name:""}, sql => {
				Fetch( url , txt => {
					Log(txt);
				});
			});
		});
		break;
			
	case "G2":
		TOTEM.config({name:""}, sql => {
			for (var n=0,N=2000; n<N; n++)
				Fetch("mask://www.drudgereport.com", txt => Log(txt.length));
		});
		break;
			
	case"SC":
		const smartcard = require('smartcard');
		const Devices = smartcard.Devices;
		const Iso7816Application = smartcard.Iso7816Application;

		const devices = new Devices();

		devices.on('device-activated', event => {
			const currentDevices = event.devices;
			let device = event.device;
			console.log(`Device '${device}' activated, devices: ${currentDevices}`);

			for (let prop in currentDevices) {
				console.log("Devices: " + currentDevices[prop]);
			}

			console.log("dev", device);

			device.on('card-inserted', event => {
				let card = event.card;
				console.log(`Card '${card.getAtr()}' inserted into '${event.device}'`);

				card.on('command-issued', event => {
					console.log(`Command '${event.command}' issued to '${event.card}' `);
				});

				card.on('response-received', event => {
					console.log(`Response '${event.response}' received from '${event.card}' in response to '${event.command}'`);
				});	

				const application = new Iso7816Application(card);

				console.log(">>>card", card);
				switch (1) {
					case 1:
						 application.selectFile(
							// [0x31, 0x50, 0x41, 0x59, 0x2E, 0x53, 0x59, 0x53, 0x2E, 0x44, 0x44, 0x46, 0x30, 0x31] 
							// [0x3B ,0x6B ,0x00 ,0x00 ,0x80 ,0x65 ,0xB0 ,0x83 ,0x01 ,0x04 ,0x74 ,0x83 ,0x00 ,0x90 ,0x00], 0x10, 0x00 
							 // G+D fips card
							 // select EF using p1p2 = 0200, DF using 0100
							[0x3B ,0xF9 ,0x18 ,0x00 ,0x00 ,0x00 ,0x53 ,0x43 ,0x45 ,0x37 ,0x20 ,0x03 ,0x00 ,0x20 ,0x46], 0x10, 0x00   
						)
						.then(response => {
							console.info(`Select PSE Response: '${response}' '${response.meaning()}'`);
						}).catch(error => {
							console.error('Error:', error, error.stack);
						});
						break;

					case 2:
						application.issueCommand( new CommandApdu({
							cla: 0x00,
							ins: 0xA4,
							p1: 0x10,
							p2: 0x00
						}) );

						break;
				}

			});

			device.on('card-removed', event => {
				console.log(`Card removed from '${event.name}' `);
			});	

		});

		break;

}

// UNCLASSIFIED
