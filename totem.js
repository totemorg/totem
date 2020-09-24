// UNCLASSIFIED   

/**
	@module totem
	Basic web service.  See https://github.com/totemstan/totem.git.

	@requires http
	@requires https
	@requires fs
	@requires constants
	@requires cluster
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

function Trace(msg,req,res) {
	"totem".trace(msg,req,res);
}
	
const	
	// NodeJS modules
				  
	ENV = process.env,
	STREAM = require("stream"), 				// pipe-able streams
	HTTP = require("http"),						//< http interface
	HTTPS = require("https"),					//< https interface
	CP = require("child_process"),				//< spawn OS shell commands
	FS = require("fs"),							//< access file system
	CONS = require("constants"),				//< constants for setting tcp sessions
	CLUSTER = require("cluster"),				//< multicore  processing
	URL = require("url"),						//< url parsing
	NET = require("net"), 						// network interface
	VM = require("vm"), 						// virtual machines for tasking
	OS = require('os'),							// OS utilitites

	// 3rd party modules
	  
	AGENT = require("http-proxy-agent"),		// agent to access proxies
	SCRAPE = require("cheerio"), 				// web scraper to load proxies
	MIME = require("mime"), 					//< file mime types
	SIO = require('socket.io'), 				//< Socket.io client mesh
	SIOHUB = require('socket.io-clusterhub'),	//< Socket.io client mesh for multicore app
	{ escape, escapeId } = SQLDB = require("mysql"),	//< mysql conector
	XML2JS = require("xml2js"),					//< xml to json parser (*)
	BUSY = require('toobusy-js'),  				//< denial-of-service protector (cant install on NodeJS 5.x+)
	JS2XML = require('js2xmlparser'), 			//< JSON to XML parser
	JS2CSV = require('json2csv'),				//< JSON to CSV parser	
	NEO4J = require("neo4j-driver"),			// light-weight graph database	
	NEODRIVER = NEO4J.driver( ENV.NEO4J, NEO4J.auth.basic('neo4j', 'NGA'), { disableLosslessIntegers: true } ),

	// Totem modules
	JSDB = require("jsdb"),						//< database agnosticator
	{ Copy,Each,Log,Stream,
		isError,isArray,isString,isFunction,isEmpty,typeOf,isObject,Fetch } = require("enum");
	  
// neo4j i/f

function NEOCONNECTOR() {
	this.trace = 
			args => {};
			//args => console.log(args); 
}
	
function neoThread(cb) {
	cb( new NEOCONNECTOR( ) );
}

[
	function cypher(query,params,cb) {// submit cypher query to neo4j

		var 
			neo = this,
			ses = NEODRIVER.session();	// no pooled connectors so must create and close them

		if ( params )
			Each( params, (key,val) => {	// fix stupid $tokens in neo4j driver
				if ( isObject(val) ) {
					query = query.replace(new RegExp("\\$"+key,"g"), arg => "{".tag(":",val)+"}" );
					delete params[key];
				}
			});

		neo.trace(query);

		ses
		.run( query, params )
		.then( res => {
			
			var 
				recs = res.records,
				Recs = [];
			
			if (recs)
				recs.forEach( (rec,n) => {
					var Rec = {};
					rec.keys.forEach( key => Rec[key] = rec.get(key) );
					Recs.push( Rec );
				});
			
			if (cb) cb(null, Recs);
		})
		.catch( err => {
			neo.trace(err);
			if (cb) cb( err, null );
		})
		.then( () => {
			ses.close();
		})
	},

	function clearNet( net ) {
		Log( "clear net", net);	
		
		this.cypher( `MATCH (n:${net}) DETACH DELETE n` );
	},
	
	function makeNodes(net, now, nodes, res ) {		// add typed-nodes to neo4j
		var 
			neo = this;

		Stream( nodes, {}, (props, node, cb) => {
			//Log(">>neosave", node,props);

			if (cb) { // add node
				props.created = now;
			
				//Log(">add", node, props);
				
				neo.cypher(
					`MERGE (n:${net}:${props.type} {name:$name}) ON CREATE SET n += $props`, {
						name: node,
						props: props
				}, err => {
					neo.trace( err );
					cb();
				});
			}
					 
			else	// all nodes added so move forward
				res( null );
		});
		
	},

	function makeEdge( net, name, created, pair ) { // link existing typed-nodes by topic
		var 
			[src,tar,props] = pair,
			neo = this;
		
		neo.cypher(
			`MATCH (a:${net} {name:$srcName}), (b:${net} {name:$tarName}) `
			+ "MERGE "
			+ `(a)-[r:${name}]-(b) `
			+ "ON CREATE SET r = $props ", {
					srcName: src.name,
					tarName: tar.name,
					props: Copy( props||{}, {
						created: created
					})
		}, err => {
			neo.trace( err );
		});
	},
	
	function saveNet( net, nodes, edges ) {
		var 
			now = new Date(),
			neo = this;
		
		//neo.cypher( `CREATE CONSTRAINT ON (n:${net}) ASSERT n.name IS UNIQUE` );

		Log("save net", net);
		
		neo.makeNodes( net, now, nodes, () => {
			//Log(">> edges", edges, "db=", db);
			Each( edges, (name,pairs) => neo.savePairs( net, now, name, pairs ) );
		});	
	},
	
	function savePairs( net, now, name, pairs ) {
		var 
			neo = this;
		
		pairs.forEach( pair => {
			neo.makeEdge( net, name, now, pair );
		});
	}

].Extend(NEOCONNECTOR);

// totem i/f

const 
	{ operators, reqFlags,paths,errors,site, maxFiles, isEncrypted, domain, behindProxy, admitClient,
	 sqlThread,filterRecords,guestProfile,routeDS, startDogs,startJob,endJob } = TOTEM = module.exports = {
	
	routeDS: {	// setup default DataSet routes
		default: req => "app."+req.table
	},

	mysql: { 		// database connection or null to disable
		host: ENV.MYSQL_HOST,
		user: ENV.MYSQL_USER,
		pass: ENV.MYSQL_PASS
	},
					
	// data ingest
	sql: (query,args,cb) => sqlThread(sql => {
		//Log(sql);
		sql.query(query,args,(err,recs) => { 
			if (!err && cb) cb(recs); 
			Log(err || "ok");
		});
	}),
					
	/*
	_streamCsvTable: (path, {batch, filter, limit, skip}, cb) => {
		
		function parse(buf,idx,keys) {
			if ( idx ) {	/// at data row
				var 
					rec = {},
					cols = buf.split(",");

				if ( cols.length == keys.length ) {	// full row buffer
					keys.forEach( (key,m) => rec[key] = cols[m] );
					return rec;
				}

				else	// incomplete row buffer
					return null;
			}

			else {	// at header row
				buf.split(",").forEach( key => keys.push(key));
				Log(">>>header keys", keys);
				return keys;
			}
		}
		
		var 
			keys = [];
		
		FS.open( path, "r", (err, fd) => {
			if (err) 
				cb(null);	// signal pipe end

			else {	// start pipe stream
				var 
					tot = pos = 0,
					recs = [],
					rem = "",
					src = FS.createReadStream( "", { fd:fd, encoding: "utf8" }),
					sink = new STREAM.Writable({
						objectMode: true,
						write: (bufs,en,sinkcb) => {
							(rem+bufs).split("\n").forEach( buf => {
								if (buf)	// got non-empty buffer 
									if ( !limit || tot < limit )	// below record limit
										if ( rec = parse(	// parse record
														buf,
														//pos ? buf : buf.substr(1),	// have to skip 1st char at start - why?
														pos++,	// advance position marker
														keys	// stash for header keys
													) ) {	// valid event record so stack it
											
											if ( !filter || filter(rec) ) {	// stack valid records
												if ( pos > skip ) {	// past the skip point
													recs.push( rec );	// extend record batch
													tot++;	// adjust total number of records processed

													if ( batch && recs.length >= batch ) {	// flush this batch of records
														cb( recs );
														recs.length = 0;
													}
												}
											}
										}

										else	// invalid event record so append to remainder
											rem = buf;
							});
							sinkcb(null);  // signal no errors
						}
					});

				sink
					.on("finish", () => {
						if ( recs.length ) cb( recs );
						if ( batch ) cb( null ) ; 	// signal pipe end
					})
					.on("error", err => cb(null) );

				src.pipe(sink);  // start the pipe
			}
		});			
	},
	*/
	
	/**
		Route NODE = /DATASET.TYPE requests using the configured byArea, byType, byTable, byActionTable, 
		and byAction routers.	

		The provided response method accepts a string, an objects, an array, an error, or 
		a file-cache function and terminates the session's sql connection.  The client is 
		validated and their session logged.

		@param {Object} req session request
		@param {Object} res session response
	*/
	routeRequest: (req,res) => {
		function routeNode(node, req, cb) {	//< Parse and route the NODE = /DATASET.TYPE request
			function followRoute(route) {

				/**
				Log session metrics, trace the current route, then callback route on the supplied 
				request-response thread

				@private
				@param {Function} route method endpoint to process session 
				@param {Object} req Totem session request
				@param {Function} res Totem response callback
				*/
				function logMetrics( logAccess, log, sock) { //< log session metrics 
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

						sqlThread( sql => {
							sql.query(logAccess, [ Copy(log, {
								Delay: secs,
								Transfer: bytes,
								Event: sock._started,
								Dataset: "",
								Client: req.client,
								Actions: 1
							}), bytes, secs, log.Event  ], err => Log("dblog", err) );
						});
					});
				}

				//Log("log check", req.area, req.reqSocket?true:false, req.log );
				if ( !req.area )   // log if file not being specified
					if ( sock = req.reqSocket )  // log if http has a request socket
						if ( log = req.log )  // log if session logged
							if ( logAccess = paths.mysql.logMetrics )	// log if logging enabled
								logMetrics( logAccess, log, sock );  

				Trace( ( route.name || ("db"+req.action)).toUpperCase() + ` ${req.file}` );

				route(req, recs => {	// route request and capture records
					var call = null;
					if ( recs )
						for ( var key in req.flags ) if ( !call ) {	// perform once-only data restructing conversion
							if ( key.startsWith("$") ) key = "$";
							if ( call = reqFlags[key] ) {
								call( recs, req, recs => cb(req, recs) );
								break;
							}
						}

					if ( !call )
						cb(req,recs);
				});
			}

			var
				action = req.action,
				query = req.query = {},
				index = req.index = {},	
				where = req.where = {},
				flags = req.flags = {},
				path = req.path = "." + node.parseURL(query, index, flags, where),		//  .[/area1/area2/...]/table.type
				areas = path.split("/"),						// [".", area1, area2, ...]
				file = req.file = areas.pop() || "",		// table.type
				[x,table,type] = [x,req.table,req.type] = file.match( /(.*)\.(.*)/ ) || ["", file, ""],
				area = req.area = areas[1] || "",
				body = req.body,
				ds = req.ds = (routeDS[table] || routeDS.default)(req);
			
			//Log([ds,action,path,area,table,type]);

			//req.site = site;

			const { strips, prefix, traps, id } = reqFlags;

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

			const { byArea,byType,byAction,byTable } = TOTEM;

			if ( area ) {	// send file
				//Log(">>>route area", area);
				if ( area == "socket.io" && !table )	// ignore socket keep-alives
					res( "hush" );

				else
				if ( route = byArea[area] )		// send uncached, static file
					followRoute( route );

				else	// send cashed file
					followRoute( (req,res) => {	// provide a route to send a file
						res( () => req.path );
					});
			}

			else
			if ( !table && (route=byArea[""]) ) 
				route(req,res); 

			else
			if ( route = byType[type] ) // route by type
				followRoute( route );

			else	
			if ( route = byTable[table] ) 	// route by endpoint name
				followRoute( route );

			else  
			if ( route = byAction[action] ) {	// route by crud action
				if ( route = route[table] )
					followRoute( route );

				else
				if ( route = TOTEM[action] )
					followRoute( route );				

				else
					cb( req, errors.noRoute);
			}

			else
			if ( route = TOTEM[action] )	// route to database
				followRoute( route );

			else 
				cb( req, errors.noRoute );
		}
					
		const { post, url } = req;
		const { nodeDivider } = TOTEM;
		
		req.body = post.parseJSON( post => {  // get parameters or yank files from body 
			var files = [], parms = {}, file = "", rem,filename,name,type;

			if (post)
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
						//Trace("LOAD "+line);

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

			//Log("body files=", files.length);
			return {files: files, parms: parms};
		});		// get body parameters/files
		
		var
			nodes = url.split(nodeDivider);

		if ( !nodes.length )
			res( null );

		else
		if (nodes.length == 1) 	// route just this node
			routeNode( nodes[0], req, (req,recs) => {
				//Log("exit route node", typeOf(recs), typeOf(recs[0]) );
				res(recs);
			});

		else {	// serialize nodes
			var 
				routes = nodes.length,
				routed = 0,
				rtns = {};

			nodes.forEach( node => {	// enumerate nodes
				if ( node )
					routeNode( node, Copy(req,{}), (req,recs) => {	// route the node and capture returned records
						rtns[req.table] = recs;
						//Log(">>node", req.table, recs);
						
						if ( ++routed == routes ) res( rtns );
					});
			});
		}
	},

	startDogs: (sql,dogs) => {
		sql.query(
			"SELECT * FROM app.dogs WHERE Enabled AND ifnull(Starts,now()) <= now()", [])
		
		.on("result", task => {
			var dog = TOTEM.dogs[task.Name.toLowerCase()];
			if ( dog )
				sql.startJob( Copy(task, {
					every: task.Every,
					ends: task.Ends,
					name: task.Name
				}), (sql,job,end) => {
					dog(sql,job);
					end(sql,job);
				});
		});
	},

	/**
		Defines url query parameter operators.
	*/
	operators: ["=", "<", "<=", ">", ">=", "!=", "!bin=", "!exp=", "!nlp="],

	/**
		Error messages
		@cfg {Object} 
	*/		
	errors: {
		pretty: err => { 
			return err+"";
		},
		badMethod: new Error("unsupported request method"),
		noProtocol: new Error("no fetch protocol specified"),
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
		badReturn: new Error("no data returned"),
		noSockets: new Error("socket.io failed"),
		noService: new Error("no service  to start"),
		noData: new Error("invalid dataset or query"),
		retry: new Error("fetch retries exceeded"),
		notAllowed: new Error("this endpoint is disabled"),
		noID: new Error("missing record id"),
		noSession: new Error("no such session started"),
		noAccess: new Error("no access to master core at this endpoint")
	},

	api: {
	},

	/**
		Configure and start the service with options and optional callback when started.
		Configure JSDB, define site context, then protect, connect, start and initialize this server.
		@cfg {Function}
		@param {Object} opts configuration options following the Copy() conventions.
		@param {Function} cb callback(err) after service configured
	*/
	config: (opts,cb) => {
		/**
		Setup (connect, start then initialize) a service that will handle its request-response sessions
		with the provided agent(req,res).
		
		The session request is constructed in the following phases:
		
			// connectSession phase
			host: "..."			// domain name being accessed by client
			agent: "..."		// client browser info
			method: "GET|PUT|..." 			// http request method
			action: "select|update| ..."	// corresponding crude name
			started: date		// date stamp when requested started
			encrypted: bool		// true if request on encrypted server
			socketio: "path"  	// filepath to client's socketio.js
			post: "..."			// raw body text
			url	: "..."			// complete url requested
			reqSocket: socket	// socket to retrieve client cert 
			resSocket: socket	// socket to accept response
			sql: connector 		// sql database connector 

			// validateClient phase
			joined: date		// time admitted
			client: "..."		// name of client from cert or "guest"
			cert: {...} 		// fill client cert
			
			// routeRequest phase
			query: {...} 		// raw keys from url
			where: {...} 		// sql-ized query keys from url
			body: {...}			// body keys from request 
			flags: {...} 		// flag keys from url
			index: {...}		// sql-ized index keys from url
			files: [...] 		// files uploaded
			//site: {...}		// skinning context
			path: "/[area/...]name.type"			// requested resource
			area: "name"		// file area being requested
			table: "name"		// name of sql table being requested
			ds:	"db.name"		// fully qualified sql table
			body: {...}			// json parsed post
			type: "type" 		// type part 

		@param {Function} agent callback(req,res) to handle session request-response 
		*/
		function setupService(agent) {  

			/*
			If the service is already connected, inherit the server; otherwise define a suitable 
			http/https interface, then start and initialize the service.
			*/
			function connectService() {
				
				/*
				Attach a port listener to service then start it.
				*/
				function startService(port, cb) {
					const 
						{ routeRequest, sockets, name, server } = TOTEM,
						{ mysql, proxies } = paths;
					
					Trace(`STARTING ${name}`);

					/*
					TOTEM.server = server;  || { 	// define server
						listen: function () {
							Trace("NO SERVER");
						},
						on: function () {
							Trace("NO SERVER");
						}
					}; */

					if ( sockets ) {   // attach socket.io and setup connection listeners
						const 
							IO = TOTEM.IO = new SIO(server, { // use defaults but can override ...
								//serveClient: true, // default true to prevent server from intercepting path
								//path: "/socket.io" // default get-url that the client-side connect issues on calling io()
							}),
							HUBIO = TOTEM.HUBIO = new (SIOHUB); 		//< Hub fixes socket.io+cluster bug	

						if (IO) { 							// Using socketio so setup client web-socket support
							Trace("SOCKETS AT "+IO.path());

							TOTEM.emitter = IO.sockets.emit;

							IO.on("connect", socket => {  // Trap every connect				
								socket.on("select", req => { 		// Trap connect raised on client "select/join request"
									Trace(`CONNECTING ${req.client}`);
									sqlThread( sql => {	
										/*
										if (newSession = mysql.newSession) 
											sql.query(newSession,  {
												Client	: req.client,
												Connects: 1,
												Location: "unknown", //req.location,
												//ipAddress: req.ip,
												Joined: new Date(),
												Message: req.message
											});
										*/
										
										if (challenge = mysql.challenge)
											sql.query(challenge, {Client:req.client}).on("results", profile => {
											if ( profile.Challenge)
												challengeClient(sql, req.client, profile);	
										});
									});
								});
							});	

							/*
							// for debugging
							IO.on("connect_error", err => {
								Log(err);
							});

							IO.on("disconnection", socket => {
								Log(">>DISCONNECT CLIENT");
							});	*/
						}

						else 
							return TOTEM.initialize( errors.noSockets );	
					}

					// The BUSY interface provides a means to limit client connections that would lock the 
					// service (down deep in the tcp/icmp layer).  Busy thus helps to thwart denial of 
					// service attacks.  (Alas latest versions do not compile in latest NodeJS.)

					if (BUSY && TOTEM.busyTime) 
						BUSY.maxLag(TOTEM.busyTime);

					if (TOTEM.guard)  { // catch core faults
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

					TOTEM.initialize(null);	
					
					server.on("request", cb);

					server.listen( port, () => {  
						Trace("LISTENING ON " + port);
					});

					if (CLUSTER.isMaster)	{ // setup listener on master port
						CLUSTER.on('exit', (worker, code, signal) =>  {
							Trace("WORKER TERMINATED " + code || "ok");
						});

						CLUSTER.on('online', worker => {
							Trace("WORKER CONNECTED");
						});

						for (var core = 0; core < TOTEM.cores; core++) // create workers
							worker = CLUSTER.fork();
						
						const { guard, riddles, cores } = TOTEM;
						
						sqlThread( sql => {	// get a sql connection
							Trace( [ // splash
								"HOSTING " + site.nick,
								"AT "+`(${site.master}, ${site.worker})`,
								"DATABASE " + site.db ,
								"FROM " + process.cwd(),
								"WITH " + (sockets||"NO")+" SOCKETS",
								"WITH " + (guard?"GUARDED":"UNGUARDED")+" THREADS",
								"WITH "+ (riddles?"ANTIBOT":"NO ANTIBOT") + " PROTECTION",
								"WITH " + (site.sessions||"UNLIMITED")+" CONNECTIONS",
								"WITH " + (cores ? cores + " WORKERS AT "+site.worker : "NO WORKERS"),
								"POCS " + JSON.stringify(site.pocs)
							].join("\n- ") );

							// initialize file watcher

							sql.query("UPDATE openv.files SET State='watching' WHERE Area='uploads' AND State IS NULL");

							var modTimes = TOTEM.modTimes;

							Each(TOTEM.onFile, (area, cb) => {  // callback cb(sql,name,area) when file changed
								FS.readdir( area, (err, files) => {
									if (err) 
										Log(err);

									else
										files.forEach( file => {
											if ( !file.startsWith(".") && !file.startsWith("_") )
												TOTEM.watchFile( area+file, cb );
										});
								});	
							});

							if ( dogs = TOTEM.dogs )		// start watch dogs
								startDogs( sql, dogs );
							
							if ( false ) {	// setup proxies
								sql.query(	// out with the old
									"DELETE FROM openv.proxies WHERE hour(timediff(now(),created)) >= 2");

								if ( proxies ) 	// in with the new
									proxies.forEach( (proxy,src) => {
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
						});
					}
				}

				const 
					{ crudIF,sockets,name,cache,trustStore,certs } = TOTEM,
					{ master, worker } = domain,
					port = parseInt( CLUSTER.isMaster ? master.port : worker.port );

				// Log( "start>>>", isEncrypted, CLUSTER.isMaster );

				certs.totem = {  // totem service certs
					pfx: FS.readFileSync(`${paths.certs}${name}.pfx`),
					//key: FS.readFileSync(`${paths.certs}${name}.key`),
					//crt: FS.readFileSync(`${paths.certs}${name}.crt`)
				};

				//Log("enc>>>", isEncrypted[CLUSTER.isMaster], paths.certs+"truststore" );
				
				if ( isEncrypted[CLUSTER.isMaster] ) {  // have encrypted services so start https service
					Each( FS.readdirSync(paths.certs+"truststore"), (n,file) => {
						if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
							Trace("TRUSTING " + file);
							trustStore.push( FS.readFileSync( `${paths.certs}truststore/${file}`, "utf-8") );
						}
					});

					TOTEM.server = HTTPS.createServer({
						passphrase: isEncrypted.pass,		// passphrase for pfx
						pfx: certs.totem.pfx,			// pfx/p12 encoded crt and key 
						ca: trustStore,				// list of pki authorities (trusted serrver.trust)
						crl: [],						// pki revocation list
						requestCert: true,
						rejectUnauthorized: true,
						secureProtocol: 'TLSv1_2_method',
						//secureOptions: CONS.SSL_OP_NO_TLSv1_0
					});					
				}

				else  // unencrpted services so start http service
					TOTEM.server = HTTP.createServer();
				
				startService( port, (Req,Res) => {		// start session
					/**
					Provide a request to the supplied session, or terminate the session if the service
					is too busy.
					
					@param {Function} ses session accepting the provided request
					*/
					function startRequest( ses ) { 
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

						function connectSession() {
							switch ( Req.method ) {	// get post parms depending on request type being made
								case "PUT":
								case "GET":
								case "POST":
								case "DELETE":
									getPost( post => {
										sqlThread( sql => {
											//Log(Req.headers);
											ses({			// prime session request
												host: Req.headers.host,	// domain being requested
												agent: Req.headers["user-agent"],	// requester info
												sql: sql,	// sql connector
												post: post, // raw post body
												method: Req.method,		// get,put, etc
												started: Req.headers.Date,  // time client started request
												action: crudIF[Req.method],	// crud action being requested
												reqSocket: Req.socket,   // use supplied request socket 
												resSocket: getSocket,		// use this method to return a response socket
												encrypted: isEncrypted[CLUSTER.isMaster],	// on encrypted worker
												socketio: sockets ? paths.socketio : "",		// path to socket.io
												url: unescape( Req.url || "/" )	// unescaped url
												/*
												There exists an edge case wherein an html tag within json content, e.g a <img src="/ABC">
												embeded in a json string, is reflected back the server as a /%5c%22ABC%5c%22, which 
												unescapes to /\\"ABC\\".  This is ok but can be confusing.
												*/
											});
										});
									});
									break;

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
									Res.end( errors.pretty(errors.badMethod) );
							}
						}
						
						if ( isBusy = BUSY ? BUSY() : false )	// trap DNS attacks
							return Res.end( errors.pretty( errors.toobusy ) );

						else
							connectSession();
					}

					startRequest( req => {  // start request if service not busy.
						/**
						Provide a response to a session after attaching sql, cert, client, profile 
						and session info to this request.  

						@param {Function} ses session accepting the provided response callback
						*/
						function startResponse( ses ) {  
							function res(data) {  // Session response callback

								// Session terminators respond with a string, file, db structure, or error message.

								function sendString( data ) {  // Send string - terminate sql connection
									Res.end( data );
								}

								function sendFile(path,file,type,area) { // Cache and send file to client - terminate sql connection

									// Trace(`SENDING ${path}`);

									var 
										cache = TOTEM.cache,
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
												sendString( cache[path] = Buffer.from(buf) ); //new Buffer(buf) );
										});
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
									if ( route = filterRecords[req.type] )  // process record conversions
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

								var
									req = Req.req,
									sql = req.sql,
									mimes = MIME.types,
									mime = mimes[ isError(data||0) ? "html" : req.type ] || mimes.html;

								// set appropriate headers to prevent http-parse errors when using master-worker proxy
								if ( req.encrypted )
									Res.setHeader("Set-Cookie", ["client="+req.client, "service="+TOTEM.name] );						

								Res.setHeader("Content-Type", mime);
								/*
								Res.setHeader("Access-Control-Allow-Origin", "*");
								Res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
								Res.setHeader("Access-Control-Allow-Headers", '*');
								Res.setHeader("Status", "200 OK");
								Res.setHeader("Vary", "Accept");
								//self.send_header('Content-Type', 'application/octet-stream')
								*/

								Res.statusCode = 200;

								if (data != null)
									switch ( typeOf(data) ) {  // send based on its type
										case "Error": 			// send error message
											sendError( data );
											break;

										case "Function": 			// send file (search or direct)
											sendFile( data(), req.file, req.type, req.area );
											/*
											if ( (search = req.query.search) && paths.mysql.search) 		// search for file via (e.g. nlp) score
												sql.query(paths.mysql.search, {FullSearch:search}, (err, files) => {

													if (err) 
														sendError( errors.noFile );

													else
														sendError( errors.noFile );  // reserved functionality

												});

											else {			
												if ( credit = paths.mysql.credit)  // credit/charge client when file pulled from file system
													sql.query( credit, {Name:req.node,Area:req.area} )
													.on("result", file => {
														if (file.Client != req.client)
															sql.query("UPDATE openv.profiles SET Credit=Credit+1 WHERE ?",{Client: file.Client});
													});

												sendFile( data(), req.file, req.type, req.area );
											}  */

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
									sendError( errors.noData );
							}

							if (sock = req.reqSocket )	// have a valid request socket so ....
								validateClient(req, err => {	// admit good client
									//Log("prof>>>", req.profile);
									
									if (err)
										res(err);

									else  {
										ses(res);
										const {sql,client} = req;
										sql.query(paths.mysql.newSession, {
											Client: client,
											Message: "joined", //JSON.stringify(cert),
											Joined: new Date()
										});
									}
									/*
									if ( getSession = paths.mysql.getSession )
										req.sql.query(getSession, {Client: req.client}, (err,ses) => {
											if ( err )
												res(err);

											else {
												req.session = new Object( ses[0] || {
													Client: "guest@guest.org",
													Connects: 1,
													//ipAddress : "unknown",
													Location: "unknown",
													Joined: new Date()
												});
												cb( res );
											}
										});

									else {  // using dummy sessions
										req.session = {};
										cb( res );
									}*/

								});

							else 	// lost reqest socket for some reason so ...
								res( errors.lostConnection );
						}

						Req.req = req;
						startResponse( res => {	// route the request on the provided response callback
							routeRequest(req,res);
						});
					});
				});
			}

			const
				{name,cores} = TOTEM,
				pfx = `${paths.certs}${name}.pfx` ;

			Trace( `PROTECTING ${name} USING ${pfx}` );

			domain.master = URL.parse(site.master);
			domain.worker = URL.parse(site.worker);
			
			isEncrypted.true = domain.master.protocol == "https:";
			isEncrypted.false = domain.worker.protocol == "https:";
			
			Log(domain);
			
			if ( isEncrypted[CLUSTER.isMaster] )   // get a pfx cert if protecting an encrypted service
				FS.access( pfx, FS.F_OK, err => {
					if (err) // create self-signed cert then connect
						createCert(name, isEncrypted.pass, () => {
							connectService();
						});	

					else // got the pfx so connect
						connectService();
				});

			else 
				connectService();
		}

		if (opts) Copy(opts, TOTEM, ".");

		//Trace(`CONFIGURING ${name}`); 

		Each( paths.mimes, (key,val) => {	// extend or remove mime types
			if ( val ) 
				MIME.types[key] = val;
			else
				delete MIME.types[key];
		});

		neoThread( neo => {	// add prototypes and test neo4j connection
			if (false) // test connection
				neo.cypher(
					// 'MATCH (u:User {email: {email}}) RETURN u',
					'MERGE (alice:Person {name : $nameParam}) RETURN alice.name AS name', {
						// email: 'alice@example.com',
						nameParam: 'Alice'
				}, (err, recs) => {
					if (err) 
						Trace( err );

					else 
						if ( rec = recs[0] ) 
							Log("neodb test alice user", rec );
									// JSON.stringify(rec['u'], null, 4));

						else
							Log('neodb test - alice has no records.');
				});

			if (false) // clear db on startup
				neo.cypher(
					"MATCH (n) DETACH DELETE n", {}, err => {
					Trace( err || "CLEAR GRAPH DB" );
				});  
		});
		
		const {dbTrack,routeRequest,setContext,name} = TOTEM;
		
		JSDB.config({   // establish the db agnosticator 
			//emitter: TOTEM.IO.sockets.emit,   // cant set socketio until server starte
			track: dbTrack
			//fetch: fetch			
		}, err => {  // derive server vars and site context vars
			if (err)
				Trace(err);

			else
				sqlThread( sql => {
					//for (var key in mysql)   // derive server paths
					//	if (key in paths) paths[key] = mysql[key];

					if (name)	// derive site context
						setContext(sql, () => {
							setupService(routeRequest);
							if (cb) cb(sql);
						});
					
					else
					if (cb) cb( sql );
				});
		});	
	},

	initialize: err => {
		Trace( `INITIALIZING ${TOTEM.name}` );
	},
	
	/**
		Common time intervals for watchdogs, queues and setintervals.
		@cfg {Object}
	*/
	/*
	timeIntervals: {
		ms: 1e-3,
		second: 1,
		sec: 1,
		minute: 60,
		min: 60,
		hour: 3600,
		hr: 3600,
		day: 86400,
		week: 604800,
		wk: 604800,
		month: 2419200,
		mth: 2419200,
		year: 31449600,
		yr: 31449600
	},  */

	requestFile: sysFile,
	
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
		var 
			modTimes = TOTEM.modTimes;
		
		Trace("WATCHING " + path);
		
		modTimes[path] = 0; 

		try {
			FS.watch(path, function (ev, file) {  
				var 
					isSwap = file.startsWith(".");

				if (file && !isSwap)
					switch (ev) {
						case "change":
							sqlThread( sql => {
								Trace(ev.toUpperCase()+" "+file);

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
		Create a PKI cert given user name and password.

		@cfg {Function}
		@private
		@method createCert
		@param {String} path to file being watched
		@param {Function} callback cb(sql, name, path) when file at path has changed
	*/
	createCert: createCert, //< method to create PKI certificate
		
	/**
		Node divider NODE $$ NODE ....  ("" disables dividing).
		@cfg {String}
		@member TOTEM
	*/
	nodeDivider: "??", 				//< node divider
	
	/**
		Max files to index by the getIndex() method (0 disables).
		@cfg {Number}
		@member TOTEM
	*/
	maxFiles: 1000,						//< max files to index

	/**
		Communicate with socket.io clients
		@cfg {Function}
		@method emitter
	*/
	emitter: null,
		
	/**
		Reserved for socket.io support to multiple clients
		@cfg {Object}
		@member TOTEM
	*/
	IO: null, 

	/**
		Reserved for dataset attributes derived by JSDB config
		@cfg {Object}
		@member TOTEM
	*/
	dsAttrs: {
	},
		
	/**
		Stop the server.
		@cfg {Function}
		@member TOTEM	
		@method stop
	*/
	stop: stopService,
	
	/**
		Thread a new sql connection to a callback.  Unless overridden, will default to the JSDB thread method.
		@cfg {Function}
		@param {Function} cb callback(sql connector)
	*/
	sqlThread: JSDB.thread,
		
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
	reqFlags: {				//< Properties for request flags
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
		Enabled to support web sockets
		@cfg {Boolean} [sockets=false]
	*/
	sockets: false, 	//< enabled to support web sockets
		
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
	name: ENV.SERVICE_NAME || "Totem1",

	/**
		Enabled when master/workers on encrypted service
		@cfg {Boolean}
	*/
	isEncrypted: {
		pass: ENV.SERVICE_PASS || "",
		true: false,	// derived
		false: false	// derived
	}, //() => TOTEM.domain[ CLUSTER.isMaster ? "master" : "worker" ].protocol == "https:",

	/**
		Host information: https encryption passphrase,
		domain name of workers, domain name of master.
		@cfg {String} [name="Totem"]
	*/	

	domain: { // derived
		master: null, 
		worker: null
	},
		
	/**
		Site context extended by the mysql derived query when service starts
		@cfg {Object} 
	*/
	site: {  	//< reserved for derived context vars		
		started: new Date(),
		worker:  ENV.SERVICE_WORKER_URL || "https://localhost:8443", 
		master:  ENV.SERVICE_MASTER_URL || "http://localhost:8080",
		pocs: {
			admin: ENV.ADMIN || "tbd@org.com",
			overlord: ENV.OVERLORD || "tbd@org.com",
			super: ENV.SUPER || "tbd@org.com"
		}		
	},

	/**
		Endpoint filterRecords cb(data data as string || error)
		@cfg {Object} 
	*/
	filterRecords: {  //< record data convertors
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
	byTable: {			  //< by-table routers	
		riddle: checkClient,
		task: sysTask
	},
		
	/**
		By-action endpoint routers for accessing engines
		@cfg {Object} 
	*/				
	byAction: { //< by-action routers
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
	byArea: {	//< by-area routers
		"": sysFile,
		stores: sysFile
		//uploads: sysFile,
		//shares: sysFile,
		//stash: sysFile
	},

	/**
		Trust store extened with certs in the certs.truststore folder when the service starts in encrypted mode
		@cfg {Object} 
	*/		
	trustStore: [ ],   //< reserved for trust store
		
	/**
		CRUDE (req,res) method to respond to Totem request
		@cfg {Object} 
	*/				
	server: null,  //< established by TOTEM at config
	
	//====================================== CRUDE interface
		
	/**
		CRUDE (req,res) method to respond to a select||GET request
		@cfg {Function}
		@param {Object} req Totem session request
		@param {Function} res Totem responder
	*/				
	select: selectDS,	
	
	/**
		CRUDE (req,res) method to respond to a update||POST request
		@cfg {Function}	
		@param {Object} req Totem session request
		@param {Function} res Totem responder
	*/				
	update: updateDS,
	
	/**
		CRUDE (req,res) method to respond to a delete||DELETE request
		@cfg {Function}	
		@param {Object} req Totem session request
		@param {Function} res Totem responder
	*/				
	delete: deleteDS,
	
	/**
		CRUDE (req,res) method to respond to a insert||PUT request
		@cfg {Function}
		@param {Object} req Totem session request
		@param {Function} res Totem responder
	*/				
	insert: insertDS,
	
	/**
		CRUDE (req,res) method to respond to a Totem request
		@cfg {Function}
		@param {Object} req Totem session request
		@param {Function} res Totem responder
	*/				
	execute: executeDS,

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
	guards:  {	// faults to trap 
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
	admitRules: {  // empty or null to disable rules
		// CN: "james brian d jamesbd",
		// O: "u.s. government",
		// OU: ["nga", "dod"],
		// C: "us"
	},

	/**
	Attaches the profile, group and a session metric log to this req request (cert,sql) with 
	callback cb(error) where error reflects testing of client cert and profile credentials.
	@cfg {Object} 
	*/		
	admitClient: function (req, cb) { 
		function admit(cb) {  // callback cb(log || null) with session log 
			cb({ 
				Event: now,		 					// start time
				Action: req.action, 				// db action
				Stamp: TOTEM.name  // site name
			});				
		}
		
		const { cert, sql, profile } = req;
		
		var 
			now = new Date(),
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

				if ( msg = profile.Banned )  // block client if banned
					cb( new Error( msg ) );

				else
					admit( log => {
						req.log = log ? new Object(log) : null;
						//req.group = profile.Group;
						cb( null );
					});
			}
		
			else
				cb( errors.rejectedClient );
		
		else
		if ( req.encrypted )
			cb( errors.rejectedClient );
		
		else 
			admit( log => {
				req.log = log ? new Object(log) : null;
				req.profile = new Object( profile );
				//req.group = profile.Group;
				cb( null );
			});
	},

	/**
		Default guest profile (unencrypted or client profile not found).  Null to bar guests.
		@cfg {Object}
	*/		
	guestProfile: {				//< null if guests are barred
		Banned: "",  // nonempty to ban user
		QoS: 10,  // [secs] job regulation interval
		Credit: 100,  // job cred its
		Charge: 0,	// current job charges
		LikeUs: 0,	// number of user likeus
		Challenge: 1,		// enable to challenge user at session join
		Client: "guest@guest.org",		// default client id
		User: "",		// default user ID (reserved for login)
		Login: "",	// existing login ID
		Group: "app",		// default group name (db to access)
		IDs: "{}",		// challenge key:value pairs
		Repoll: true,	// challenge repoll during active sessions
		Retries: 5,		// challenge number of retrys before session killed
		Timeout: 30,	// challenge timeout in secs
		Message: "Welcome guest - what is (riddle)?"		// challenge message with riddles, ids, etc
	},

	/**
		Number of riddles to protect site (0 to disable anti-bot)
		@cfg {Number} [riddles=0]
	*/		
	riddles: 0, 			
	
	/**
		Store generated riddles to protect site 
		@cfg {Array} 
		@private
	*/		
	riddle: [],  //< reserved for riddles
		
	/**
		Riddle digit-to-jpeg map (null to disable riddles)
		@cfg {Object} 
		@private
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
		Default paths to service files
		@cfg {Object} 
	*/		
	paths: { 			
		//fetch: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
		//default: "/gohome",
		//resetpass: "/resetpass",
		proxies: [
			//"https://free-proxy-list.net",
			"https://sslproxies.org"
		],
		//wget: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
		//curl: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
		//http: "http://localhost:8081?return=${req.query.file}&opt=${plugin.ex1(req)+plugin.ex2}",
		riddler: "/riddle",

		certs: "./certs/", 
		sockets: ".", // path to socket.io
		socketio: "/socket.io/socket.io.js",

		mysql: {
			//logThreads: "show session status like 'Thread%'",
			users: "SELECT 'users' AS Role, group_concat( DISTINCT lower(dataset) SEPARATOR ';' ) AS Clients FROM openv.dblogs WHERE instr(dataset,'@')",
			derive: "SELECT * FROM openv.apps WHERE ? LIMIT 1",
			// logMetrics: "INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?, Event=?",
			search: "SELECT * FROM openv.files HAVING Score > 0.1",
			//credit: "SELECT * FROM openv.files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 1",
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

		captcha: "./captcha",  // path to antibot captchas
			
		mimes: {  // Extend and remove mime types as needed
		}
	},

	/**
		File indexer
		@method 
		@cfg {Function}
	*/		
	getIndex: getIndex,

	/**
		Get a file and make it if it does not exist
		@method 
		@cfg {Function}
	*/
	getFile: getFile,

	/**
		File uploader 
		@cfg {Function}
		@method uploadFile
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
		Trace(`CONTEXTING ${TOTEM.name}`);
	
		const 
			{pocs,users,guest,derive} = paths.mysql;

		if (pocs) 
			sql.query(pocs)
			.on("result", poc => site.pocs[poc.Role] = (poc.Clients || "").toLowerCase() );
			//.on("end", () => Log("POCs", site.pocs) );

		if (users) 
			sql.query(users)
			.on("result", poc => site.pocs[poc.Role] = (poc.Clients || "").toLowerCase() );
			//.on("end", () => Log("POCs", site.pocs) );

		if (guest)
			sql.query(guest)
			.on("result", rec => {
				if ( guestProfile ) {
					Copy( rec, guestProfile );
					delete guestProfile.ID;
				}
			});

		if (derive)  // derive site context vars
			sql.query(derive, {Nick:TOTEM.name})
			.on("result", opts => {
				Each(opts, (key,val) => {
					key = key.toLowerCase();
					site[key] = val;
					//Log(">>site",key,val);
					
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

		site.warning = "";
		sql.query("SELECT count(ID) AS Fails FROM openv.aspreqts WHERE Status LIKE '%fail%'").on("result", asp => {
		sql.query("SELECT count(ID) AS Fails FROM openv.ispreqts WHERE Status LIKE '%fail%'").on("result", isp => {
		sql.query("SELECT count(ID) AS Fails FROM openv.swreqts WHERE Status LIKE '%fail%'").on("result", sw => {
		sql.query("SELECT count(ID) AS Fails FROM openv.hwreqts WHERE Status LIKE '%fail%'").on("result", hw => {

			site.warning = [
				site.warning || "",
				"ASP".fontcolor(asp.Fails ? "red" : "green").tag( "/help?from=asp" ),
				"ISP".fontcolor(isp.Fails ? "red" : "green").tag( "/help?from=isp" ),
				"SW".fontcolor(sw.Fails ? "red" : "green").tag( "/help?from=swap" ),   // mails list of failed swapIDs (and link to all sw reqts) to swap PMO
				"HW".fontcolor(hw.Fails ? "red" : "green").tag( "/help?from=pmo" )   // mails list of failed hw reqts (and link to all hw reqts) to pod lead
			].join(" ");

		});
		});
		});
		});

	},

	certs: {}, 		// server and client cert cache (pfx, crt, and key)

	/**
		File cache
		@cfg {Object} 
	*/		
	cache: { 				//< file cacheing options

		never: {	//< files to never cache - useful while debugging client side stuff
			"base.js": 1,
			"extjs.js": 1,
			"jquery.js":1,
			"jade": 1
		},

		clients: {  // cache clients area
		},

		"socket.io": {  // cache socketio area
		}
	}

};

/**
	@class TOTEM.Utilities.Configuration_and_Startup
*/

/**
	Stop the server.
	@memberof Server_Utilities
*/
		
function stopService() {
	if (server = TOTEM.server)
		server.close(function () {
			Trace("STOPPED");
		});
	
	sqlThread( sql => sql.end() );				  
}

/**
	Create a cert for the desired owner with the desired passphrase then 
	callback cb() when complete.

	@memberof PKI_Utilities
	@param {String} owner userID to own this cert
	@param {String} password for this cert
	@param {Function} cb callback when completed
*/
function createCert(owner,pass,cb) { 

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

/**
	Validate a client's session by attaching a log, profile, group, client, 
	cert and joined info to this req request then callback res(error) with 
	null error if session was validated.  

	@memberof PKI_Utilities
	@param {Object} req totem request
	@param {Function} res totem response
*/
function validateClient(req,res) {  
	
	function getCert(sock) {  //< Return cert presented on this socket (w or w/o proxy).
		var 
			cert =  sock.getPeerCertificate ? sock.getPeerCertificate() : null;		
		
		//Log("getcert>>>", cert);
		if (behindProxy && cert) {  // update cert with originating cert info that was placed in header
			var 
				//cert = new Object(cert),  // clone so we can modify
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

	function makeProfile( sql, client ) {  // return a suitable guest profile or null

		if ( guestProfile ) {  // allowing guests
			var
				guest = Copy({
					Client: client,
					//User: client.replace(/(.*)\@(.*)/g,(x,L,R) => L ).replace(/\./g,"").substr(0,12),
					//Login: "",
					Requested: new Date()
				}, Copy(guestProfile,{}) );

			sql.query( paths.mysql.newProfile, guest );
			return guest;
		}

		else	// blocking guests
			return null;
	}
	
	const 
		{ sql,encrypted,reqSocket } = req,
		{ mysql } = paths,
		guest = "email:guest@guest.org",
		cert = encrypted ? getCert( reqSocket ) : {
			subject: {
				C: "",
				O: "",
				OU: "",
				CN: ""
			},
			subjectaltname: ""
		},
		joined = req.joined = new Date(),
		client = req.client = (cert.subjectaltname||guest).toLowerCase().split(",")[0].replace("email:","");
		
	//req.cert = certs[client] = cert ? new Object(cert) : null;
	req.cert = new Object(cert);
	//Log("client>>>",client);
	
	sql.query(mysql.getProfile, {client: client}, (err,profs) => {

		if ( err ) 
			if ( encrypted )  // profile required on https service so return error
				res( errors.noDB );

			else
			if ( profile = makeProfile(sql, req.client) )  { // admit guest client on http service
				//req.socket = null;
				req.reqSocket = null;   // disable guest session metrics
				req.profile = profile;
				admitClient(req, res);	
			}

			else
				res( errors.rejectedClient );
		
		else			
		if ( profile = profs[0] ) { // admit known client
			req.profile = Copy(profile,{});
			admitClient(req, res);
		}

		else	// admit guest client
		if ( profile = makeProfile(sql, req.client) ) {
			req.profile = profile;
			admitClient(req, res);
		}

		else
			res( errors.rejectedClient );
	});
}

/**
	Callback cb(files) with files list under specified path.

	@memberof File_Utilities
	@param {String} path file path
	@param {Function} cb totem response
*/
function getIndex(path,cb) {	
	function sysNav(path,cb) {
		
		if ( path == "./" ) 
			Object.keys(TOTEM.byArea).forEach( area => {
				if (area) cb(area);
			});
		
		else
			try {
				FS.readdirSync(path).forEach( file => {
					//Log(path,file);
					var
						ignore = file.endsWith("~") || file.startsWith("~") || file.startsWith("_") || file.startsWith(".");

					if ( !ignore ) cb(file);
				});
			}
			catch (err) {
			}	
	}

	var 
		files = [];
	
	sysNav(path, file => {
		if ( files.length < maxFiles )
			files.push( (file.indexOf(".")>=0) ? file : file+"/" );
	});
	
	cb( files );
}	

/**
	Get (or create if needed) a file with callback cb(fileID, sql) if no errors

	@memberof File_Utilities
	@param {String} client owner of file
	@param {String} name of file to get/make
	@param {Function} cb callback(file, sql) if no errors
*/
function getFile(client, name, cb) {  

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
}

/**
	Uploads a source stream srcStream to a target file sinkPath owned by a 
	specified client.  Optional tags are logged with the upload.

	@memberof File_Management
	@param {String} client file owner
	@param {Stream} source stream
	@param {String} sinkPath path to target file
	@param {Object} tags hach of tags to add to file
	@param {Function} cb callback(file) if upload sucessful
*/
function uploadFile( client, srcStream, sinkPath, tags, cb ) { 
	var
		parts = sinkPath.split("/"),
		name = parts.pop() || "";
	
	getFile(client, name, file => {
		var 
			sinkStream = FS.createWriteStream( sinkPath, "utf-8")
				.on("finish", function() {  // establish sink stream for export pipe

					//Trace("UPLOADED FILE");
					sqlThread( sql => {
						sql.query("UPDATE apps.files SET ? WHERE ?", [{
							_Ingest_Tag: JSON.stringify(tags || null),
							_State_Notes: "Please go " + "here".tag("/files.view") + " to manage your holdings."
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

function proxyThread(req, res) {  // not presently used but might want to support later
	
	var 
		pathto = 
			site.master + req.path,  
			 //site.master + "/news",  
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

	Req.on('error', err => {
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

/**
	@class TOTEM.Utilities.Antibot_Protection
	Data theft protection
*/

/**
	Validate clients response to an antibot challenge.

	@param {Object} req Totem session request
	@param {Function} res Totem response callback
*/
function checkClient (req,res) {
	const 
		{ query, sql } = req,
		{ id } = query;
	
	if (id)
		sql.query("SELECT * FROM openv.riddles WHERE ? LIMIT 1", {Client:id}, (err,rids) => {

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
				res( errors.noSession  );

		});

	else
		res( errors.noID );
}

/**
	Create antibot challenges.
*/
function initChallenger () {
	function Riddle(map, path) {
		const { floor, random } = Math;
		
		var 
			Q = {
				x: floor(random()*10),
				y: floor(random()*10),
				z: floor(random()*10),
				n: floor(random()*map["0"].length)
			},

			A = {
				x: "".tag("img", {src: `${path}/${Q.x}/${map[Q.x][Q.n]}.jpg`}),
				y: "".tag("img", {src: `${path}/${Q.y}/${map[Q.y][Q.n]}.jpg`}),
				z: "".tag("img", {src: `${path}/${Q.z}/${map[Q.z][Q.n]}.jpg`})
			};

		return {
			Q: `${A.x} * ${A.y} + ${A.z}`,
			A: Q.x * Q.y + Q.z
		};
	}

	const {riddle, riddles, riddleMap} = TOTEM;

	if ( captcha = paths.captcha )
		for (var n=0; n<riddles; n++) 
			riddle.push( Riddle(riddleMap,captcha) );
}

/**
	Check clients response req.query to a antibot challenge.

	@param {String} msg riddle mask contianing (riddle), (yesno), (ids), (rand), (card), (bio) keys
	@param {Array} rid List of riddles returned
	@param {Object} ids Hash of {id: value, ...} replaced by (ids) key
*/
function makeRiddles (msg,rid,ids) { 
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

/**
	Create an antibot challenge and relay to client with specified profile parameters

	@param {String} client being challenged
	@param {Object} profile with a .Message riddle mask and a .IDs = {key:value, ...}
*/
function challengeClient (sql, client, profile) { 
	const
	{ riddler } = paths,
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
			}, (err,info) => {
				TOTEM.IO.emit("select", {
					message: reply,
					riddles: rid.length,
					rejected: false,
					retries: profile.Retries,
					timeout: profile.Timeout,
					ID: client, //info.insertId,
					callback: riddler
				});
			});
		});
}

/**
 @class TOTEM.End_Points.CRUDE_Interface
 Create / insert / post, Read / select / get, Update / put, Delete and Execute methods.
*/

/**
	CRUD select endpoint.
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
*/
function selectDS(req, res) {
	const 
		{ sql, flags, client, where, index, action, ds } = req,
		{ trace, pivot, browse, sort, limit, offset } = flags;
	
	sql.Index( ds, index, [], (index,jsons) => {
		sql.Query(
			"SELECT SQL_CALC_FOUND_ROWS ${index} FROM ?? ${where} ${having} ${limit} ${offset}", 
			[ ds ], {
				trace: trace,
				pivot: pivot,
				browse: browse,		
				sort: sort,
				limit: limit || 0,
				offset: offset || 0,
				where: where,
				index: index,
				having: null,
				jsons: jsons,
				client: client
			}, (err,recs) => {
			
			res( err || recs );

		});
	});
}

/**
	CRUD insert endpoint.
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
*/
function insertDS(req, res) {
	const 
		{ sql, flags, body, client, action, ds } = req,
		{ trace } = flags;

	sql.Query(
		"INSERT INTO ?? ${set}", [ds,body], {
			trace: trace,
			set: body,
			client: client,
			emitter: TOTEM.emitter
		}, (err,info) => {

			res( err || info );

		});
}

/**
	CRUD delete endpoint.
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
*/	
function deleteDS(req, res) {
	const 
		{ sql, flags, where, query, client, action, ds } = req,
		{ trace } = flags;

	if ( isEmpty(where) )
		res( errors.noID );
		
	else
		sql.Query(
			"DELETE FROM ?? ${where}", [ds], {
				trace: trace,			
				where: where,
				client: client,
				emitter: TOTEM.emitter
			}, (err,info) => {

				res( err || info );

			});
}

/**
	CRUD update endpoint.
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
*/	
function updateDS(req, res) {
	const 
		{ sql, flags, body, where, client, action, ds,table } = req,
		{ trace } = flags;
	
	//Log(where,body);
	
	if ( isEmpty(body) )
		res( errors.noBody );
	
	else
	if ( isEmpty( where ) )
		res( errors.noID );
	
	else
		sql.Query(
			"UPDATE ?? ${set} ${where}", [ds,body], {
				trace: trace,
				from: ds,
				where: where,
				set: body,
				client: client,
				emitter: TOTEM.emitter
			}, (err,info) => {

				res( err || info );

				if ( onUpdate = TOTEM.onUpdate )
					onUpdate(sql, table, body);

			});
	
}

/**
	CRUD execute endpoint.
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
*/
function executeDS(req,res) {
	res( errors.notAllowed );
}

/**
 @class TOTEM.End_Points.Users_Interface
 Create user maint end points
*/

function isAdmin(client) {
	return site.pocs.admin.indexOf(client) >= 0;
}

/**
	Return user profile information
	@private
	@deprecated
	@method selectUser
	@param {Object} req Totem session request 
	@param {Function} res Totem response
*/
function selectUser(req,res) {
	
	const { sql, query, client, cert } = req;
			
	if (isAdmin(client))
		Trace(sql.query(
			"SELECT * FROM openv.profiles WHERE least(?,1)", 
			[ query ], 
			function (err,users) {
				res( err || users );
		}).sql);

	else
		sql.query(
			"SELECT * FROM openv.profiles WHERE ? AND least(?,1)", 
			[ {client:client}, query ], 
			function (err,users) {
				res( err || users );
		});
}

/**
	Update user profile information
	@private
	@deprecated
	@method updateUser
	@param {Object} req Totem session request 
	@param {Function} res Totem response
*/
function updateUser(req,res) {
	const { sql, query, client ,cert } = req;
	
	if (isAdmin(client)) 
		// sql.context({users:{table:"openv.profile",where:{client:query.user},rec:query}});
		Trace(sql.query(
			"UPDATE openv.profiles SET ? WHERE ?", 
			[ query, {client:query.user} ], 
			(err,info) => {
				res( err || errors.failedUser );
		}).sql);

	else
		sql.query(
			"UPDATE openv.profiles SET ? WHERE ?", 
			[ query, {client:req.client} ],
			(err,info) => {

				res( err || errors.failedUser );
		});
			
}

/**
	Remove user profile.
	@private
	@deprecated
	@method deleteUser
	@param {Object} req Totem session request 
	@param {Function} res Totem response
*/
function deleteUser(req,res) {
			
	const { sql, query, client, cert } = req;

	if (isAdmin(client))
		// sql.context({users:{table:"openv.profiles",where:[ {client:query.user}, req.query ],rec:res}});
		Trace(sql.query(
			"TEST FROM openv.profiles WHERE ? AND least(?,1)", 
			[ {client:query.user}, req.query ], 
			(err,info) => {
				res( err || errors.failedUser );

				// res should remove their files and other 
				// allocated resources
		}).sql);

	else
		sql.query(
			"TEST FROM openv.profiles WHERE ? AND least(?,1)", 
			[ {client:req.client}, req.query ], 
			(err,info) => {
				res( err || errors.failedUser );
		});
}
			
/**
	Create user profile, associated certs and distribute info to user
	@private
	@deprecated
	@method insertUser
	@param {Object} req Totem session request 
	@param {Function} res Totem response
*/
function insertUser (req,res) {
			
	const 
		{sql, query, cert} = req,
		{ resetpass } = paths;
	
	if ( isAdmin(client))
		if (query.pass)
			sql.query(
				"SELECT * FROM openv.profiles WHERE Requested AND NOT Approved AND least(?,1)", 
				query.user ? {User: query.user} : 1 )
				
			.on("result", user => {
				var init = Copy({	
					Approved: new Date(),
					Banned: resetpass
						? "Please "+"reset your password".tag( resetpass )+" to access"
						: "",

					Client: user.User,					
					QoS: 0,

					Message:

`Greetings from ${site.Nick.tag(site.master)}-

Admin:
	Please create an AWS EC2 account for ${owner} using attached cert.

To connect to ${site.Nick} from Windows:

1. Establish gateway using 

		Putty | SSH | Tunnels
		
	with the following LocalPort, RemotePort map:
	
		5001, ${site.master}:22
		5100, ${site.master}:3389
		5200, ${site.master}:8080
		5910, ${site.master}:5910
		5555, Dynamic
	
	and, for convienience:

		Pageant | Add Keys | your private ppk cert

2. Start a ${site.Nick} session using one of these methods:

	${Putty} | Session | Host Name = localhost:5001 
	Remote Desktop Connect| Computer = localhost:5100 
	${FF} | Options | Network | Settings | Manual Proxy | Socks Host = localhost, Port = 5555, Socks = v5 `

.replace(/\n/g,"<br>")					
					
				}, Copy(guestProfile,{}) );

				sql.query(
					"UPDATE openv.profiles SET ? WHERE ?",
					[ init, {User: user.User} ],
					err => {
						
						createCert(user.User, pass, () => {

							Trace(`CREATE CERT FOR ${user.User}`, req);
							
							CP.exec(
								`sudo adduser ${user.User} -gid ${user.Group}; sudo id ${user.User}`,
								(err,out) => {
									
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
			.on("end", () => {
				res("Creating user");
			});
		
		else
			res( errors.missingPass );

	else
		sql.query(
			"INSERT openv.profiles SET ? WHERE ?", 
			[ req.query , {User:req.User} ], 
			(err,info) => {
				
				res( err || errors.failedUser );
		});
}

/**
	Fetch user profile for processing
	@private
	@deprecated
	@method executeUser
	@param {Object} req Totem session request 
	@param {Function} res Totem response
*/
function executeUser(req,res) {	
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
	
	res( errors.failedUser );
}

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
				
		startSession(Req,Res);
	});
} */

/**
@class TOTEM.End_Points.System_Probes
*/

/**
	Endpoint to shard a task to the compute nodes.

	@param {Object} req Totem request
	@param {Function} res Totem response
*/
function sysTask(req,res) {  //< task sharding
	const {query,body,sql} = req;
	const {task,domains,cb} = body;
	
	var 
		$ = JSON.stringify({
			worker: CLUSTER.isMaster ? 0 : CLUSTER.worker.id,
			node: process.env.HOSTNAME
		}),
		engine = `(${cb})( (${task})(${$}) )`;

	res( "ok" );

	if ( task && cb ) 
		doms.forEach( function (index) {

			function runEngine(idx) {
				VM.runInContext( engine, VM.createContext( Copy( TOTEM.tasking || {}, idx) ));
			}

			if (body.qos) 
				sql.startJob({ // job descriptor 
					index: Copy(index,{}),
					//priority: 0,
					every: "1", 
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
				}, (sql,job,end) => {
					//Log("reg job" , job);
					end();
					runEngine( job.index );
				});
		
			else
				runEngine( index );
		});
}

/**
	Endpoint to send, remove, or upload a static file from a requested area.

	@param {Object} req Totem request
	@param {Function} res Totem response
*/
function sysFile(req, res) {
	const {sql, query, body, client, action, table, path, file} = req;
		   
	var 
		area = table,
		now = new Date();
	
	//Log(">>>>sysFile", path,file);
	switch (action) {
		case "select":
			
			if ( file )	// requesting static file
				try {		// these files are static so we never cache them
					FS.readFile(path,  (err,buf) => res( err || Buffer.from(buf) ) );
				}
				catch (err) {
					res( errors.noFile );
				}
				
			else	// requesting static folder
				getIndex( path, files => {  // Send list of files under specified folder
					files.forEach( (file,n) => files[n] = file.tag( file ) );
					req.type = "html"; // otherwise default type is json.
					res(`hello ${req.client}<br>Index of ${path}:<br>` + files.join("<br>") );
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
				files = body.files,
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

			files.forEach( file => {
				var 
					buf = Buffer.from(file,"base64"); //new Buffer(file.data,"base64"),
					srcStream = new STREAM.Readable({  // source stream for event ingest
						objectMode: true,
						read: function () {  // return null if there are no more events
							this.push( buf );
							buf = null;
						}
					}),
					path = area+"/"+client+"_"+file.filename;

				Trace(`UPLOAD ${file.filename} INTO ${area} FOR ${client}`, req);

				uploadFile( client, srcStream, "./"+path, tags, file => {

					if (false)
					sql.query(	// this might be generating an extra geo=null record for some reason.  works thereafter.
						   "INSERT INTO openv.files SET ?,Location=GeomFromText(?) "
						+ "ON DUPLICATE KEY UPDATE Client=?,Added=now(),Revs=Revs+1,Location=GeomFromText(?)", [ 
							{
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
	/*
	function parseJSON(ctx,def) {
		this.forEach( key => {
			try {
				ctx[key] = (ctx[key] || "").parseJSON( (val) => def || null );
			}
			catch (err) {
				//Log(err,key,rec[key]);
				ctx[key] = def || null;
			}
		});
		return ctx;
	}, */
	/*
	function unpack( cb ) {
		var 
			recs = this;
		
		recs.forEach( (rec,n) => {
			if ( rec ) 
				if ( typeOf(rec) == "RowDataPacket" ) {
					var Rec = recs[n] = Copy( rec, {} );
		
					Each(Rec, (key,val) => {
						try {
							Rec[key] = JSON.parse( val );
						}
						catch (err) {
							if ( cb ) Rec[key] = cb( val );
						}
					});
				}
		});
		
		return recs;
	} 
	*/
	function hashify(key,hash) {
		var rtn = hash || {};
		this.forEach( rec => rtn[rec[key]] = rec );
		return rtn;
	}
].Extend(Array);

[ //< String prototypes
	/**
		Tag url (el = ? || &) or html (el = html tag) with specified attributes.

		@memberof String
		@param {String} el tag element = ? || & || html tag
		@param {String} at tag attributes = {key: val, ...}
		@return {String} tagged results
	*/
	function tag(el,at) {

		if (!at) { at = {href: el}; el = "a"; }
		
		if ( isFunction(at) ) {
			var args = [];
			this.split(el).forEach( (arg,n) => args.push( at(arg,n) ) );
			return args.join(el);
		}
		
		else
		if ( isArray(at) ) {
			var args = [];
			this.split(el).forEach( (arg,n) => args.push( arg.tag( at[n] || "" ) ) );
			return args.join(el);
		}
		
		else
		if ( isString(at) ) {
			var args = [], tags = at.split(el);
			this.split(el).forEach( (arg,n) => args.push( arg.tag( tags[n] || "" ) ) );
			return args.join(el);
		}
		
		else
			switch (el) {
				case "?":
				case "&":   // tag a url
					var rtn = this;

					Each(at, (key,val) => {
						if ( val ) {
							rtn += el + key + "=" + val;
							el = "&";
						}
					});

					return rtn;	

				case ":":
				case "=":
					var rtn = this, sep="";
					Each(at, (key,val) => {
						rtn += sep + key + el + JSON.stringify(val);
						sep = ",";
					});
					return rtn;

				default: // tag html
					var rtn = "<"+el+" ";

					Each( at, (key,val) => {
						if ( val )
							rtn += key + "='" + val + "' ";
					});

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
		Parse "$.KEY" || "$[INDEX]" expressions given $ hash.

		@param {Object} $ source hash
	*/
	function parseEval($) {
		try {
			return eval(this+"");
		}
		
		catch (err) {
			return err+"";
		}
	},
	
	/**
		Return an EMAC "...${...}..." string using supplied req $-tokens and plugin methods.

		@param {Object} ctx context hash
	*/
	function parseJS(ctx, cb) {
		try {
			return VM.runInContext( this+"", VM.createContext(ctx || {}));
		}
		catch (err) {
			//Log("parseJS", this+"", err, ctx);
			if ( cb ) 
				return cb(err);
			
			else
				return null;
		}
	},
	
	/**
		Return an EMAC "...${...}..." string using supplied req $-tokens and plugin methods.

		@memberof String
		@param {Object} query context hash
	*/
	function parse$(query) {
		try {
			return VM.runInContext( "`" + this + "`" , VM.createContext(query));
		}
		catch (err) {
			return err+"";
		}
	},
	
	/**
		Parse string into json.

		@memberof String
		@param {Function,Object} def default object or callback that returns default
	*/
	function parseJSON(def) {
		try { 
			return JSON.parse(this);
		}
		catch (err) {  
			return def ? (isFunction(def) ? def(this+"") : def) || null : null;
		}
	},

	/**
		Parse a "PATH?PARM&PARM&..." url into the specified query, index, flags, or keys hash
		as directed by the PARM = ASKEY := REL || REL || _FLAG = VALUE where 
		REL = X OP X || X, X = KEY || KEY$[IDX] || KEY$.KEY

		@memberof String
		@param {Object} query hash of query keys
		@param {Object} index hash of sql-ized indexing keys
		@param {Object} flags hash of flag keys
		@param {Object} where hash of sql-ized conditional keys
	*/
	function parseURL(query,index,flags,where) { 
		function doParm(parm) {
			function doFlag(parm) {
				function doIndex(parm) {
					function doTest(parm) {
						function doSimple(parm) {
							function doTag(parm) {
								parm.split(",").forEach( arg =>	query[arg] = 1);
							}
							
							parm.parseOP( /(.*?)(=)(.*)/, null, (lhs,rhs,op) => query[lhs] = rhs.parseJSON( txt => txt ) );
						
							parm.parseOP( /(.*?)(<|>|=)(.*)/, doTag, (lhs,rhs,op) => where[op][lhs] = rhs );
						}
						
						parm.parseOP( /(.*?)(<=|>=|\!=|\!bin=|\!exp=|\!nlp=)(.*)/, doSimple, (lhs,rhs,op) => where[op][lhs] = rhs );
					}
					
					parm.parseOP( /(.*?)(:=)(.*)/, doTest, (lhs,rhs,op) => index[lhs] = rhs );
				}
				
				parm.parseOP( /^_(.*?)(=)(.*)/, doIndex, (lhs,rhs,op) => flags[lhs] = rhs.parseJSON( txt => txt ) );
			}

			doFlag(parm);
		}

		var 
			path = this+"",
			[x,path,parms] = path.match(/(.*?)\?(.*)/) || ["",path,""];
		
		operators.forEach( key => where[key] = {} );
		
		parms.split("&").forEach( parm => {
			if (parm) 
				doParm( parm );
		});
		
		path.split("&").forEach( (parm,n) => {
			if ( n )
				parm.parseOP( /(.*?)(=)(.*)/, 
					args => args.split(",").forEach( arg => index[arg] = ""), 
					(lhs,rhs,op) => index[lhs] = rhs );
				
			else
				path = parm;
		});
		
		// Log({q: query,w: where,i: index,f: flags,p: path});
		
		return path;

		/*
		function doLast( str ) {
			var
				[x,lhs,op,rhs] = str.match( /(.*?)(=)(.*)/ ) || [];

			if ( op ) 
				query[lhs] = rhs;

			else
				doParm( str );
		}

	
		var 
			url = this+"",
			parts = url.split("?"),
			path = parts[0],
			parms = parts[1] || "",
			rem = parts.slice(2).join("?"),
			parms = parms.split("&"),
			last = parms.pop();
		
		operators.forEach( key => where[key] = {} );
		
		parms.forEach( parm => {
			if (parm) 
				doParm( parm );
		});
		
		if ( last )
			if ( rem ) 
				doLast( last + "?" + rem );
		
			else
				doParm( last );

		path.split("&").forEach( (parm,n) => {
			if ( n )
				parm.parseOP( /(.*?)(=)(.*)/, 
					args => args.split(",").forEach( arg => index[arg] = ""), 
					(lhs,rhs,op) => index[lhs] = rhs );
				
			else
				path = parm;
		});
		
		if (false) Log({
			q: query,
			w: where,
			i: index,
			f: flags
		});
		
		return path;
		*/
	},

	/**
		Parse XML string into json and callback cb(json) 

		@memberof String
		@param {Function} cb callback( json || null if error )
	*/
	function parseXML(cb) {
		XML2JS.parseString(this, function (err,json) {				
			cb( err ? null : json );
		});
	},
	
	function parseOP( reg, elsecb, ifcb ) {
		var 
			[x,lhs,op,rhs] = this.match(reg) || [];
		
		if ( op ) 
			return ifcb( lhs, rhs, op );
		
		else
		if ( elsecb )
			return elsecb(this+"");
	} 
	
].Extend(String);

/**
@class TOTEM.Unit_Tests_Use_Cases
*/
async function prime(cb) {
	cb();
}

switch (process.argv[2]) { //< unit tests
	case "?":
		Log("unit test with 'node totem.js [T1 || T2 || ...]'");
		break;

	case "T1": 
	/**
	@method T1
	Create simple service but dont start it.
	*/
		Trace({
			msg: "Im simply a Totem interface so Im not even running as a service", 
			default_fetcher_endpts: TOTEM.byTable,
			default_protect_mode: TOTEM.guard,
			default_cores_used: TOTEM.cores
		});
		break;

	case "T2": 
	/**
	@method T2
	Totem service running in fault protection mode, no database, no UI; but I am running
	with 2 workers and the default endpoint routes.
	*/
		TOTEM.config({
			mysql: null,
			guard: true,
			cores: 2
		}, sql => {

			Trace( 
`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
with 2 workers and the default endpoint routes` );

		});
		break;

	case "T3": 
	/**
	@method T3
	I'm a Totem serv
	ice with no workers. I do, however, have a mysql database from which I've derived 
	my startup options (see the openv.apps table for the Nick="Totem1").  
	No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
	these files. 
	*/

		TOTEM.config({
		}, sql => {
			Trace( 
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
		
		TOTEM.config({
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
						or_user: req.client
					});
				}
			}
		}, sql => {
			Trace({
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
	/**
	@method T5
	I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
	shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.
	*/
		
		TOTEM.config({
			riddles: 20
		}, sql => {
			Trace({
				msg:
`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.`, 
				mysql_derived_parms: T.site
			});
		});
		break;

	case "T6":
	/**
	@method T6
	Testing tasker with database and 3 cores at /test endpoint.
	*/
		
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
			Trace( "Testing runTask with database and 3 cores at /test endpoint" );
		});
		break;
		
	case "T7":
	/**
	@method T7
	*/
		
		TOTEM.config({
		}, sql => {				
			Trace( "db maintenance" );

			if (CLUSTER.isMaster)
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
		break;
		
	case "T8":
		const {neoThread} = TOTEM;
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
				Log("ingest starting");
				sql.Ingest("./stores/_noarch/gtd.csv", {
					target: "gtd",
					//limit: 1000,
					keys: [
						"evid varchar(16)",
						"year int(11)",
						"latitude float",
						"longitude float",
						"attack varchar(64)",
						"target varchar(32)",
						"perp varchar(64)",
						"nperps int(11)",
						"nkill int(11)",
						"nkillus int(11)",
						"nkillter int(11)",
						"nwound int(11)",
						"nwoundus int(11)",
						"nwoundter int(11)",
						"propvalue float"
						].join(","),
					batch: 500
				},
					// rec => rec.iyear != 1970,
				);
			});
		});
		break;
		
	case "INMEX":
		prime( () => {
			TOTEM.config({name:""}, sql => {
				Log("ingest starting");
				sql.Ingest("./stores/_noarch/centam.csv", {
					keys: "Criminal_group varchar(32),_Year int(11),Outlet_name varchar(32),Event varchar(32),Rival_group varchar(32),_Eventid varchar(8)",
					batch: 500,
					//limit: 1000
				},
					rec => rec.Country == "Mexico"
				);
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
			
}

// UNCLASSIFIED
