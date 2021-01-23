// UNCLASSIFIED   

/**
	@module totem
	Basic web service.  See https://github.com/totemstan/totem.git.

	@requires http
	@requires https
	@requires fs
	@requires constants
	@requires cluster
	@requires child_process
	@requires os
	@requires stream
	@requires vm
	@reqquire url

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
	@requires cheerio
	@requires neo4j-driver	
*/

function Trace(msg,args,req) {	// execution tracing
	"totem".trace(msg, req, msg => console.log(msg,args) );
}
	
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
	//URL = require("url"),						// url parsing
	//NET = require("net"), 						// network interface
	VM = require("vm"), 						// virtual machines for tasking
	OS = require('os'),							// OS utilitites

	// 3rd party modules
	  
	//AGENT = require("http-proxy-agent"),		// agent to access proxies
	SCRAPE = require("cheerio"), 				// scraper to load proxies
	MIME = require("mime"), 					// file mime types
	SIO = require('socket.io'), 				// Socket.io client mesh
	SIOHUB = require('socket.io-clusterhub'),	// Socket.io client mesh for multicore app
	{ escape, escapeId } = SQLDB = require("mysql"),	//< mysql conector
	XML2JS = require("xml2js"),					// xml to json parser (*)
	BUSY = require('toobusy-js'),  				// denial-of-service protector (cant install on NodeJS 5.x+)
	JS2XML = require('js2xmlparser'), 			// JSON to XML parser
	JS2CSV = require('json2csv'),				// JSON to CSV parser	
	NEO4J = require("neo4j-driver"),			// light-weight graph database	
	NEODRIVER = NEO4J.driver( ENV.NEO4J, NEO4J.auth.basic(ENV.NEO4J_USER, ENV.NEO4J_PASS), { disableLosslessIntegers: true } ),

	// Totem modules
	{ sqlThread } = JSDB = require("jsdb"),						// database agnosticator
	{ Copy,Each,Log,Stream,Clock,isError,isArray,isString,isFunction,isEmpty,typeOf,isObject } = ENUM = require("enum");
	  
// neo4j i/f

function NEOCONNECTOR(trace) {
	this.trace = trace || false;
}
	
[
	function cypher(query,params,cb) {// submit cypher query to neo4j

		var 
			neo = this,
			ses = NEODRIVER.session();	// no pooled connectors so must create and close them

		if ( params )
			Each( params, (key,val) => {	// fix stupid $tokens in neo4j driver
				if (val) {
					if ( isObject(val) ) {
						query = query.replace(new RegExp("\\$"+key,"g"), arg => "{".tag(":",val)+"}" );
						delete params[key];
					}
				}
				
				else
					Log("???????????????????? neo", key,val, params);
			});

		// if ( neo.trace) Log(query);

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
			if ( neo.trace) Log(err);
			//if (cb) cb( err, null );
		})
		.then( () => {
			ses.close();
		})
	},

	function clearNet( net ) {
		Log( "clear net", net);	
		
		this.cypher( `MATCH (n:${net}) DETACH DELETE n` );
	},
	
	function saveNodes(net, nodes, res ) {		// add typed-nodes to neo4j
		var 
			neo = this,
			trace = neo.trace;

		Stream( nodes, {}, (node, name, cb) => {
			if (cb) { // add node
				neo.cypher(
					`MERGE (n:${net}:${node.type} {name:$name}) ON CREATE SET n += $props`, {
						name: name,
						props: node
				}, err => {
					// if ( trace ) Log(">>>neo save node", err || "ok");
					cb();
				});
			}
					 
			else	// all nodes processed so move forward
				res( null );
		});
		
	},

	/*
	function makeEdge( net, edge ) { // link existing typed-nodes by topic
		var 
			[src,tar,props] = edge,
			neo = this;
		
		//Log("edge", src.name, tar.name, props);
		neo.cypher(
			`MATCH (a:${net} {name:$srcName}), (b:${net} {name:$tarName}) `
			+ "MERGE "
			+ `(a)-[r:${props.name}]-(b) `
			+ "ON CREATE SET r = $props ", {
					srcName: src.name,
					tarName: tar.name,
					props: props || {}
		}, err => {
			if (err) Log(">>>create edge failed", [src.name, tar.name] );
		});
	},*/
	
	function findAssoc( query, cb ) {
		const 
			neo = this,
			[src,tar,rel] = query,
			Rel = rel.replace( / /g, "");
		
		neoThread( neo => {
			neo.cypher( 
				`MATCH ( a {name:$src} ) -[r:${Rel}]-> ( b {name:$tar} ) RETURN r,a,b`, 
				{
					src: src,
					tar: tar
				}, 
				(err,recs) => {
				
				if (err) Log(err);
				cb( recs, query );
			});
		});		
	},
	
	function saveNet( net, nodes, edges ) {
		const 
			neo = this;
		
		//neo.cypher( `CREATE CONSTRAINT ON (n:${net}) ASSERT n.name IS UNIQUE` );

		Log(">>>neo save net", net);
		
		neo.saveNodes( net, nodes, () => {
			//Log(">> edges", edges, "db=", db);
			//Each( edges, (name,pairs) => neo.saveEdges( net, pairs ) );
			neo.saveEdges( net, edges ) ;
		});	
	},
	
	function saveEdges( net, edges ) {
		const 
			neo = this,
			trace = neo.trace;
		
		//Log("save pairs topic", name);
		Each( edges, (name,edge) => {
			//neo.makeEdge( net, edge );
			var Type = edge.type.replace(/ /g, "");
			
			neo.cypher(
				`MATCH (a:${net} {name:$src}), (b:${net} {name:$tar}) MERGE (a)-[r:${Type}]-(b) ON CREATE SET r = $props`, {
				src: edge.src,
				tar: edge.tar,
				props: edge || {}
			}, err => {
				//if ( trace ) 
				//Log(">>>neo save edge", err || "ok" );
			});
			
		});
	}

].Extend(NEOCONNECTOR);

[ //< String prototypes
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
	
	/**
		Fetches data from a 
		
			path = PROTOCOL://HOST/FILE ? batch=N & limit=N & rekey=from:to,... & comma=X & newline=X 
			
		using the PUT || POST || DELETE || GET method given a data = Array || Object || null || Function spec where:
		
			PROTOCOL = http || https, curl || curls, wget || wgets, mask || masks, lexis || etc, file, book
	
		and where 
		
			curls/wgets presents the certs/fetch.pfx certificate to the endpoint, 
			mask/masks routes the fetch through rotated proxies, 
			lexis/etc uses the oauth authorization-authentication protocol, 
			file fetches from the file system,
			book selects a notebook record. 
			
		If FILE is terminated by a "/", then a file index is returned.  Optional batch,limit,... query parameters
		regulate the file stream.
		
		@cfg {Function} 
		@param {String} path protocol prefixed by http: || https: || curl: || curls: || wget: || wgets: || mask: || masks: || /path 
		@param {Object, Array, Function, null} data type induces method = get || post || put || delete
		@param {Function} cb callback when data provided
	*/
	function fetchFile(data, cb) {	//< data fetching
	
		function sha256(s) { // reserved for other functionality
			return CRYPTO.createHash('sha256').update(s).digest('base64');
		}

		function request(proto, opts, data, cb) {
			//Log(">>>req opts", opts);
			
			const Req = proto.request(opts, Res => { // get reponse body text
				var body = "";
				Res.on("data", chunk => body += chunk.toString() );

				Res.on("end", () => {
					//Log('fetch statusCode:', Res.statusCode);
					//Log('fetch headers:', Res.headers['public-key-pins']);	// Print the HPKP values

					if ( cb ) 
						cb( body );
					
					else
						data( body );
				});
			});

			Req.on('error', err => {
				Log(">>>fetch req", err);
				(cb||data)("");
			});

			switch (opts.method) {
				case "DELETE":
				case "GET": 
					break;

				case "POST":
				case "PUT":
					//Log(">>>post", data);
					Req.write( data ); //JSON.stringify(data) );  // post parms
					break;
			}					

			Req.end();
		}
		
		function agentRequest(proto, opts, sql, id, cb) {
			var 
				body = "",
				req = proto.get( opts, res => {
					var sink = new STREAM.Writable({
						objectMode: true,
						write: (buf,en,sinkcb) => {
							body += buf;
							sinkcb(null);  // signal no errors
						}
					});

					sink
					.on("finish", () => {
						var stat = "s"+Math.trunc(res.statusCode/100)+"xx";
						Log(">>>>fetch body", body.length, ">>stat",res.statusCode,">>>",stat);

						sql.query("UPDATE openv.proxies SET hits=hits+1, ?? = ?? + 1 WHERE ?", [stat,stat,id] );

						cb( (stat = "s2xx") ? body : "" );
					})
					.on("error", err => {
						Log(">>>fetch get", err);
						cb("");
					});

					res.pipe(sink);
				});
			
			req.on("socket", sock => {
				sock.setTimeout(2e3, () => {
					req.abort();
					Log(">>>fetch timeout");
					sql.query("UPDATE openv.proxies SET hits=hits+1, sTimeout = sTimeout+1 WHERE ?", id);
				});
				
				sock.on("error", err => {
					req.abort();
					Log(">>>fetch refused");
					sql.query("UPDATE openv.proxies SET hits=hits+1, sRefused = sRefused+1 WHERE ?", id);
				});
			});
			
			req.on("error", err => {
				Log(">>>fetch abort",err);
				sql.query("UPDATE openv.proxies SET hits=hits+1, sAbort = sAbort+1 WHERE ?", id);
			});
		}
		
		function getFile(path, cb) {
			const
				src = "."+path;
			
			if ( path.endsWith("/") )  // index requested folder
				try {
					const 
						{maxFiles} = fetchOptions,
						files = [];

					//Log(">>index", src;
					FS.readdirSync( src).forEach( file => {
						var
							ignore = file.startsWith(".") || file.startsWith("~") || file.startsWith("_") || file.startsWith(".");

						if ( !ignore && files.length < maxFiles ) 
							files.push( (file.indexOf(".")>=0) ? file : file+"/" );
					});
					
					cb( files );
				}

				catch (err) {
					//Log(">>>fetch index error", err);
					cb( [] );
				}

			else 	// requesting static file
				try {		// these files are static so we never cache them
					FS.readFile(src, (err,buf) => res( err ? "" : Buffer.from(buf) ) );
				}

				catch (err) {
					Log(err);
					cb( null );
				};
		}	
		
		const
			url = this+"",
			{defHost,certs,maxRetry,oauthHosts} = fetchOptions,
			opts = url.parseURL({}, defHost), 
			crud = {
				"Function": "GET",
				"Array": "PUT",
				"Object": "POST",
				"Null": "DELETE"
			},

			// for wget-curl
			cert = certs.fetch,
			wget = url.split("////"),
			wurl = wget[0],
			wout = wget[1] || "./temps/wget.jpg",
			
			// OAuth 2.0 host
			oauth = oauthHosts[opts.protocol],
			  
			// response callback
			res = cb || data || (res => {}),
			method = crud[ data ? typeOf(data) : "Null" ] ;
		
		// opts.cipher = " ... "
		// opts.headers = { ... }
		// opts.Cookie = ["x=y", ...]
		// opts.port = opts.port ||  (protocol.endsWith("s:") ? 443 : 80);
		/*
		if (opts.soap) {
			opts.headers = {
				"Content-Type": "application/soap+xml; charset=utf-8",
				"Content-Length": opts.soap.length
			};
			opts.method = "POST";
		}*/

		//Trace("FETCH",path);
		
		opts.method = method;
		
		switch ( opts.protocol ) {
			case "curl:": 
				CP.exec( `curl --retry ${maxRetry} ` + path.replace(opts.protocol, "http:"), (err,out) => {
					res( err ? "" : out );
				});
				break;

			case "curls:":
				CP.exec( `curl --retry ${maxRetry} -gk --cert ${cert._crt}:${cert._pass} --key ${cert._key} --cacert ${cert._ca}` + url.replace(protocol, "https:"), (err,out) => {
					res( err ? "" : out );
				});	
				break;

			case "wget:":
				CP.exec( `wget --tries=${maxRetry} -O ${wout} ` + path.replace(opts.protocol, "http:"), err => {
					res( err ? "" : "ok" );
				});
				break;

			case "wgets:":
				CP.exec( `wget --tries=${maxRetry} -O ${wout} --no-check-certificate --certificate ${cert._crt} --private-key ${cert._key} ` + wurl.replace(protocol, "https:"), err => {
					res( err ? "" : "ok" );
				});
				break;

			case "https:":
				/*
				// experiment pinning tests
				opts.checkServerIdentity = function(host, cert) {
					// Make sure the certificate is issued to the host we are connected to
					const err = TLS.checkServerIdentity(host, cert);
					if (err) {
						Log("tls error", err);
						return err;
					}

					// Pin the public key, similar to HPKP pin-sha25 pinning
					const pubkey256 = 'pL1+qb9HTMRZJmuC/bB/ZI9d302BYrrqiVuRyW+DGrU=';
					if (sha256(cert.pubkey) !== pubkey256) {
						const msg = 'Certificate verification error: ' + `The public key of '${cert.subject.CN}' ` + 'does not match our pinned fingerprint';
						return new Error(msg);
					}

					// Pin the exact certificate, rather then the pub key
					const cert256 = '25:FE:39:32:D9:63:8C:8A:FC:A1:9A:29:87:' + 'D8:3E:4C:1D:98:JSDB:71:E4:1A:48:03:98:EA:22:6A:BD:8B:93:16';
					if (cert.fingerprint256 !== cert256) {
						const msg = 'Certificate verification error: ' +
						`The certificate of '${cert.subject.CN}' ` +
						'does not match our pinned fingerprint';
						return new Error(msg);
					}

					// This loop is informational only.
					// Print the certificate and public key fingerprints of all certs in the
					// chain. Its common to pin the public key of the issuer on the public
					// internet, while pinning the public key of the service in sensitive
					// environments.
					do {
						console.log('Subject Common Name:', cert.subject.CN);
						console.log('  Certificate SHA256 fingerprint:', cert.fingerprint256);

						hash = crypto.createHash('sha256');
						console.log('  Public key ping-sha256:', sha256(cert.pubkey));

						lastprint256 = cert.fingerprint256;
						cert = cert.issuerCertificate;
					} while (cert.fingerprint256 !== lastprint256);

					};
				*/
				/*
				opts.agent = new HTTPS.Agent( false 
					? {
							//pfx: cert.pfx,	// pfx or use cert-and-key
							cert: cert.crt,
							key: cert.key,
							passphrase: cert._pass
						} 
					: {
						} );
					*/
				opts.rejectUnauthorized = false;
				request(HTTPS, opts, data, cb);
				break;
				
			case "http:":
				//Log(opts);

				request(HTTP, opts, data, cb);
				break;
				
			case "mask:":
			case "mttp:":	// request via rotating proxies
				opts.protocol = "http:";
				sqlThread( sql => {
					sql.query(
						"SELECT ID,ip,port FROM openv.proxies WHERE ? ORDER BY rand() LIMIT 1",
						[{proto: "no"}], (err,recs) => {

						if ( rec = recs[0] ) {
							opts.agent = new AGENT( `http://${rec.ip}:${rec.port}` );
							Log(">>>agent",rec);
							agentRequest(HTTP, opts, sql, {ID:rec.ID}, res );
						}
					});
				});
				break;
				
			case "nb:":
			case "book:":
				const
					book = opts.host,
					name = opts.path.substr(1);
				
				sqlThread( sql => {
					sql.query( name
						? "SELECT * FROM app.? WHERE Name=?"
						: "SELECT * FROM app.?", 
							  
						[ book, name ], 
							  
						(err,recs) => cb( err ? "" : JSON.stringify(recs) ) );
				});
				break;
				
			case "file:":	// requesting file or folder index
				//Log("index file", [path], opts);
				getFile( opts.path.substr(1) ? opts.path : "/home/" , res );  
				break;
				
			default:	// check if using a secure protocol
				if ( oauth ) 	// using oauth 
					request(HTTPS, oauth.token, oauth.grant, token => {		// request access token
						//Log("token", token);
						try {
							const 
								Token = JSON.parse(token);
							
							opts.protocol = "https:";
							opts.headers = {
								Authorization: Token.token_type + " " + Token.access_token,
								Accept: "application/json;odata.metadata=minimal",
								Host: "services-api.lexisnexis.com",
								Connection: "Keep-Alive",
								"Content-Type": "application/json"
							};
							delete opts.auth;
							
							Log("token request", opts );
							request(HTTPS, opts, search => {	// request a document search
								if ( docopts = oauth.doc ) 	// get associated document
									try {	
										const
											Search = JSON.parse(search),
											rec = Search.value[0] || {},
											doclink = rec['DocumentContent@odata.mediaReadLink'];

										//Log( Object.keys(Search) );
										if ( doclink ) {
											if (1)
												Log("get doc", {
													doclink: doclink , 
													href: oauth.doc.href, 
													reckeys: Object.keys(rec), 
													ov: rec.Overview, 
													d: rec.Date
												});

											if ( docopts.length ) // string so do fetch
												Fetch( docopts + doclink, doc => {
													res(doc);
												});
											
											else {
												docopts.path += doclink;
												docopts.headers = opts.headers;
												docopts.method = "GET";
												Log("doc request", docopts);
												request( HTTPS, docopts, doc => {
													res(doc);
												});
											}
										}
									}
								
									catch (err) {
										Log(">>>fetch lexis bad search",err);
									}
								
								else
									res( search );
							});
						}
						
						catch (err) {
							Log(">>>fetch lexis bad token", token);
							res(null);
						}
					});
				
				else
					res( "" );
		}
	}	
	
].Extend(String);


// totem i/f

const 
	{ 
		byArea, byType, byAction, byTable, CORS,
		neoThread, defaultType,
		$master, $worker, Fetch, fetchOptions,
		reqFlags, paths, sqls, errors, site, maxFiles, isEncrypted, behindProxy, admitClient,
		filterRecords,guestProfile,routeDS, startDogs, cache } = TOTEM = module.exports = {
	
	inspector: null,
			
	CORS: false,
			
	fetchOptions: {	// Fetch parms
		defHost: ENV.SERVICE_MASTER_URL,
		maxFiles: 1000,						//< max files to index
		maxRetry: 5,		// fetch wget/curl maxRetry	
		certs: { 		// data fetching certs
			pfx: FS.readFileSync(`./certs/fetch.pfx`),
			key: FS.readFileSync(`./certs/fetch.key`),
			crt: FS.readFileSync(`./certs/fetch.crt`),
			ca: "", //FS.readFileSync(`./certs/fetch.ca`),			
			_pfx: `./certs/fetch.pfx`,
			_crt: `./certs/fetch.crt`,
			_key: `./certs/fetch.key`,
			_ca: `./certs/fetch.ca`,
			_pass: ENV.FETCH_PASS
		},
		oauthHosts: {	// auth 2.0 hosts
			"lex:": {		// lexis-nexis search
				grant: "grant_type=client_credentials",  // &scope=http://auth.lexisnexis.com/all
				token: "https://auth-api.lexisnexis.com/oauth/v2/token".parseURL({
					//rejectUnauthorized: false,
					method: "POST",
					auth: ENV.LEXISNEXIS,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					}
				})
			},
			"lexis:": {		// lexis-nexis search and get doc
				grant: "grant_type=client_credentials",  // &scope=http://auth.lexisnexis.com/all
				token: "https://auth-api.lexisnexis.com/oauth/v2/token".parseURL({
					//rejectUnauthorized: false,
					method: "POST",
					auth: ENV.LEXISNEXIS,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					}
				}),
				doc: "https://services-api.lexisnexis.com/v1/".parseURL()
				/*, {
					//rejectUnauthorized: false,
					method: "GET",
					auth: ENV.LEXISNEXIS,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					}
				}) */
					// "lex://services-api.lexisnexis.com/v1/"
			}
		}
	},

	defaultType: "run",

	/**
		Fetches data from a 
		
			path = PROTOCOL://HOST/FILE ? batch=N & limit=N & rekey=from:to,... & comma=X & newline=X 
			
		using the PUT || POST || DELETE || GET method given a data = Array || Object || null || Function spec where:
		
			PROTOCOL = http || https, curl || curls, wget || wgets, mask || masks, lexis || etc, file, book
	
		and where 
		
			curls/wgets presents the certs/fetch.pfx certificate to the endpoint, 
			mask/masks routes the fetch through rotated proxies, 
			lexis/etc uses the oauth authorization-authentication protocol, 
			file fetches from the file system,
			book selects a notebook record. 
			
		If FILE is terminated by a "/", then a file index is returned.  Optional batch,limit,... query parameters
		regulate the file stream.
		
		@cfg {Function} 
		@param {String} path protocol prefixed by http: || https: || curl: || curls: || wget: || wgets: || mask: || masks: || /path 
		@param {Object, Array, Function, null} method induces probe method
	*/
	Fetch: (path, data, cb) => path.fetchFile(data,cb),
	
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
					
	/**
		Route NODE = /DATASET.TYPE requests using the configured byArea, byType, byTable, 
		byActionTable then byAction routers.	

		The provided response method accepts a string, an objects, an array, an error, or 
		a file-cache function and terminates the session's sql connection.  The client is 
		validated and their session logged.

		@param {Object} req session request
		@param {Object} res session response
	*/
	routeRequest: (req,res) => {
		function routeNode(node, req, cb) {	//< Parse and route the NODE = /DATASET.TYPE request
			/*
				Log session metrics, trace the current route, then callback route on the supplied 
				request-response thread.
			*/
			function followRoute(route) {	//< route the request

				function logSession( log, sock) { //< log session metrics 
					
					const { logMetrics } = sqls;

					if ( !logMetrics ) return;
					
					sock._started = new Date();

					/*
					If maxlisteners is not set to infinity=0, the connection becomes sensitive to a sql 
					connector t/o and there will be random memory leak warnings.
					*/

					sock.setMaxListeners(0);
					
					sock.on('close', () => { 		// cb when connection closed
						var 
							secs = sock._started ? ((new Date()).getTime() - sock._started.getTime()) / 1000 : 0,
							bytes = sock.bytesWritten;

						sqlThread( sql => {
							sql.query(logMetrics, [ Copy(log, {
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

				const
					{ area, table, path } = req;
				
				Trace( route.name.toUpperCase(), path );

				if ( area ) 
					if ( area == "socket.io" )	// ignore socket keep-alives
						Trace("HUSH SOCKET.IO");

					else	// send file
						route( req, txt => res(txt) );
				
				else {
					//Log("log check", req.area, req.reqSocket?true:false, req.log );
					if ( sock = req.reqSocket )  	// log if http has a request socket
						if ( log = req.log )  		// log if session log-able
							logSession( log, sock );  

					route(req, recs => {	// route request and capture records
						var call = null;
						if ( recs ) {
							for ( var key in flags ) if ( !call ) {	// perform single data conversion
								if ( key.startsWith("$") ) key = "$";
								if ( call = reqFlags[key] ) {
									call( recs, req, recs => cb(req, recs) );
									break;
								}
							}

							if ( !call ) cb(req, recs);
						}

						else
							cb(req, null);
					});
				}
			}

			//Log(">>>node", node);
			const 
				{ strips, prefix, traps, id } = reqFlags,
				{ action, body } = req,

				query = req.query = {},
				index = req.index = {},	
				where = req.where = {},
				flags = req.flags = {},
				[path,table,type,area] = node.parsePath(query, index, flags, where);
				
			req.path = path;
			req.area = area;
			req.table = table;
			req.type = type || defaultType;

			const
				ds = req.ds = (routeDS[table] || routeDS.default)(req);
			
			//Log([ds,action,path,area,table,type]);

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

			if ( area ) 	// send file
				followRoute( function send(req,res) {	// provide a route to send a file
					const
						{area,table,type,path} = req,
						get = "file:" + path;
					
					if ( get.endsWith("/") )		// requesting folder
						Fetch( get, files => {
							req.type = "html"; // otherwise default type is json.
							//res( files );
							files.forEach( (file,n) => files[n] = file.link( file ) );
							res(`hello ${req.client}<br>Index of ${path}:<br>` + files.join("<br>") );
						});

					else {	// requesting file						
						const
							file = table+"."+type,
							{ never } = cache,
							neverCache = never[file] || never[area];
							  
						//Log("cache", file, "never=", neverCache, "cached=", path in cache);
						
						if ( path in cache )
							res( cache[path] );
						
						else
							Fetch( get, txt => {
								if ( !neverCache ) cache[path] = txt; 
								res(txt);
							});
					}
				});

			else
			if ( route = byType[req.type] ) // route by type
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
					cb( req, errors.noRoute );
			}

			else
			if ( table )
				if ( route = TOTEM[action] )	// route to database
					followRoute( route );

				else 
					cb( req, errors.noRoute );
			
			else
				cb( req, errors.noRoute );
		}
					
		const 
			{ post, url } = req,
			node = url;
			//nodes = nodeDivider ? url.split(nodeDivider) : [url];

		//Log(">>>>>>>>>>>post", post);
		
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
							//Trace("LOAD", line);

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
					Trace("POST FAILED", post);
				}

			//Log("body files=", files.length);
			return parms;
		});		// get body parameters/files

		routeNode( node, req, (req,recs) => {
			//Log("exit route node", typeOf(recs), typeOf(recs[0]) );
			res(recs);
		});
		
		/*
		if ( !nodes.length )
			res( null );

		else
		if (nodes.length == 1) 	// route just this node
			routeNode( nodes[0], req, (req,recs) => {
				//Log("exit route node", typeOf(recs), typeOf(recs[0]) );
				res(recs);
			});

		else {	// serialize nodes
			//Log(">>>>multi nodes", nodes);
			var
				routed = 0;
			const 
				routes = nodes.length,
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
		*/
	},

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
		Configure database, define site context, then protect, connect, start and initialize this server.
		@cfg {Function}
		@param {Object} opts configuration options following the Copy() conventions.
		@param {Function} cb callback(err) after service configured
	*/
	config: (opts,cb) => {
		/**
			Setup (connect, start then initialize) a service that will handle its request-response sessions
			with the provided agent(req,res).

			The session request is constructed in the following phases:

				// phase1 connectSession
				host: "proto://domain:port"	// requested host 
				agent: "..."		// client browser info
				referer: "proto://domain:port/query"	//  url during a cross-site request
				method: "GET|PUT|..." 			// http request method
				action: "select|update| ..."	// corresponding crude name
				started: date		// date stamp when requested started
				encrypted: bool		// true if request on encrypted server
				// socketio: "path"  	// filepath to client's socketio.js
				post: "..."			// raw body text
				url	: "/query"		// requested url path
				reqSocket: socket	// socket to retrieve client cert 
				resSocket: socket	// socket to accept response
				sql: connector 		// sql database connector 

				// phase2 validateClient
				joined: date		// time admitted
				client: "..."		// name of client from cert or "guest"
				cert: {...} 		// fill client cert

				// phase3 routeRequest 
				files: [...]		// list of files being uploaded
				canvas: {...}		// canvas being uploaded
				query: {...} 		// raw keys from url
				where: {...} 		// sql-ized query keys from url
				body: {...}			// body keys from request 
				flags: {...} 		// flag keys from url
				index: {...}		// sql-ized index keys from url
				files: [...] 		// files uploaded
				path: "/[area/...]name.type"			// requested resource
				area: "name"		// file area being requested
				table: "name"		// name of sql table being requested
				ds:	"db.name"		// fully qualified sql table
				body: {...}			// json parsed post
				type: "type" 		// type part 

			@param {Function} agent callback(req,res) to handle session request-response 
		*/
		function initChallenger () {		//< Create antibot challenges.
			const 
				{ riddle, riddles, riddleMap } = TOTEM,
				{ captcha } = paths,
				{ floor, random } = Math;

			Trace( `INIT CHALLENGER imageset=${captcha} riddles=${riddles}` );

			if ( captcha )
				for (var n=0; n<riddles; n++) {
					var 
						Q = {
							x: floor(random()*10),
							y: floor(random()*10),
							z: floor(random()*10),
							n: floor(random()*riddleMap["0"].length)
						},

						A = {
							x: "".tag("img", {src: `${captcha}/${Q.x}/${riddleMap[Q.x][Q.n]}.jpg`}),
							y: "".tag("img", {src: `${captcha}/${Q.y}/${riddleMap[Q.y][Q.n]}.jpg`}),
							z: "".tag("img", {src: `${captcha}/${Q.z}/${riddleMap[Q.z][Q.n]}.jpg`})
						};

					riddle.push( {
						Q: `${A.x} * ${A.y} + ${A.z}`,
						A: Q.x * Q.y + Q.z
					} );
				}

			//Log(riddle);
		}

		/**
		Establish socket.io sockets for the SecureIntercom link (at store,restore,login,relay,status,
		sync,join,exit,content) and the dbSync link (at select,update,insert,delete).
		*/
		function configSockets (server) {
			const 
				{ riddle, inspector } = TOTEM,
				{ getProfile } = sqls,
				IO = TOTEM.IO = new SIO(server, { // use defaults but can override ...
					//serveClient: true, // default true to prevent server from intercepting path
					//path: "/socket.io" // default get-url that the client-side connect issues on calling io()
				}),
				HUBIO = TOTEM.HUBIO = new (SIOHUB); 		//< Hub fixes socket.io+cluster bug	

			if (IO) { 							// Using socketio so setup client web-socket support
				Trace("SOCKETS AT", IO.path() );

				IO.on("connect", socket => {  
					//Log("connect socket.io");

					socket.on("join", req => {	// Traps client connect when they call io()
						const
							{client,message,track} = req;

						console.log(req);
						
						sqlThread( sql => {
							
							if ( track )	// log sessions if client permits tracking
								sql.query("INSERT INTO openv.sessions SET ?", {
									Opened: new Date(),
									Client: client,
									Location: req.location,
									IP: req.ip,
									Agent: req.agent,
									Platform: req.platform
								});
							
							sql.query(getProfile, [client], (err,profs) => { 

								/**
									Create an antibot challenge and relay to client with specified profile parameters

									@param {String} client being challenged
									@param {Object} profile with a .Message riddle mask and a .IDs = {key:value, ...}
								*/
								function getChallenge (profile, cb) { 
									/**
										Check clients response req.query to a antibot challenge.

										@param {String} msg riddle mask contianing (riddle), (yesno), (ids), (rand), (card), (bio) keys
										@param {Array} rid List of riddles returned
										@param {Object} ids Hash of {id: value, ...} replaced by (ids) key
									*/
									function makeRiddles (msg,riddles,prof) { 
										const
											{ floor, random } = Math,
											rand = N => floor( random() * N ),
											{ riddle } = TOTEM,
											N = riddle.length,
											randRiddle = (x) => riddle[rand(N)];

										return msg
												.parse$(prof)
												.replace(/\#riddle/g, pat => {
													var QA = randRiddle();
													riddles.push( QA.A );
													return QA.Q;
												})
												.replace(/\#yesno/g, pat => {
													var QA = randRiddle();
													riddles.push( QA.A );
													return QA.Q;
												})
												.replace(/\#rand/g, pat => {
													riddles.push( rand(10) );
													return "random integer between 0 and 9";		
												})
												.replace(/\#card/g, pat => {
													return "cac card challenge TBD";
												})
												.replace(/\#bio/g, pat => {
													return "bio challenge TBD";
												});
									}

									const
										{ riddler } = paths,
										{ Message, IDs, Retries, Timeout } = profile,
										riddles = [],
										probe = makeRiddles( Message, riddles, profile );

									Log(client, probe, riddles);

									sql.query("REPLACE INTO openv.riddles SET ?", {		// track riddle
										Riddle: riddles.join(",").replace(/ /g,""),
										Client: client,
										Made: new Date(),
										Attempts: 0,
										maxAttempts: Retries
									}, (err,info) => cb({		// send challenge to client
										message: probe,
										retries: Retries,
										timeout: Timeout,
										callback: riddler,
										passphrase: prof.SecureCom || ""
									}) );
								}

								//Log(err,profs);

								if ( prof = profs[0] ) {
									if ( prof.Banned ) 
										socket.emit("exit", {
											message: `${client} banned: ${prof.Banned}`
										});

									else
									if ( prof.Challenge && riddle.length )	// must solve challenge to enter
										getChallenge(prof, challenge => {
											Log(challenge);
											socket.emit("challenge", challenge);
										});

									else
									if ( prof.SecureCom )	// allowed to use secure link
										socket.emit("secure", {
											message: `Welcome ${client}`,
											passphrase: prof.SecureCom
										});

									else		// not allowed to use secure ink
										socket.emit("status", {
											message: `Welcome ${client}`
										});
								}

								else
									socket.emit("exit", {
										message: `Cant find ${client}`
									});

							});
						});
					});

					socket.on("store", req => {
						const
							{client,ip,location,message} = req;

						Log(">>>store", req);

						sqlThread( sql => {
							sql.query(
								"INSERT INTO openv.saves SET ? ON DUPLICATE KEY UPDATE Content=?", 
								[{Client: client,Content:message}, message],
								err => {

									socket.emit("status", {
										message: err ? "store failed" : "store completed"
									});
							});
						});
					});

					socket.on("restore", req => {
						const
							{client,ip,location,message} = req;

						Log(">>>restore", req);
						sqlThread( sql => {
							sql.query("SELECT Content FROM openv.saves WHERE Client=? LIMIT 1", 
							[client],
							(err,recs) => {

								Log("restore",err,recs);

								if ( rec = recs[0] )
									socket.emit("content", {
										message: rec.Content
									});

								else
									socket.emit("status", {
										message: "cant restore content"
									});
							});
						});
					});

					socket.on("relay", req => {
						const
							{ from,message,to,track,route } = req;

						Log("RELAY", req);
						
						if ( message.indexOf("PGP PGP MESSAGE")>=0 ) // just relay encrypted messages
							IO.emit("relay", {	// broadcast message to everyone
								message: message,
								from: from,
								to: to
							});
						
						else
						if ( inspector ) 	// relay scored messages that are unencrypted
							inspector( message, to, score => {
								sqlThread( sql => {
									sql.query(
										"SELECT "
											+ "max(timestampdiff(minute,Opened,now())) AS T, "
											+ "count(ID) AS N FROM openv.sessions WHERE Client=?", 
										[from], 
										(err,recs) => {

										const 
											{N,T} = err ? {N:0,T:1} : recs[0],
											lambda = N/T;

										//Log("inspection", score, lambda, hops);

										if ( track ) // if tracking permitted by client then ...
											sql.query(
												"INSERT INTO openv.relays SET ?", {
													Message: message,
													Rx: new Date(),
													From: from,
													To: to,
													New: 1,
													Score: JSON.stringify(score)
												} );

										IO.emit("relay", {	// broadcast message to everyone
											message: message,
											score: Copy(score, {
												Activity:lambda, 
												Hopping:0
											}),
											from: from,
											to: to
										});
									});
								});
							});
								
						else 		// relay message as-is				   
							IO.emit("relay", {	// broadcast message to everyone
								message: message,
								from: from,
								to: to
							});	
							
					});
					
					socket.on("login", req => {
						const
							{ client,pubKey } = req;

						Log("LOGIN", req);

						sqlThread( sql => {
							sql.query(
								"UPDATE openv.profiles SET pubKey=? WHERE Client=?",
								[pubKey,client] );

							sql.query( "SELECT Client,pubKey FROM openv.profiles WHERE Client!=? AND length(pubKey)", [client] )
							.on("result", rec => {
								socket.emit("sync", {	// broadcast other pubKeys to this client
									message: rec.pubKey,
									from: rec.Client,
									to: client
								});
							});
						});							
						
						IO.emit("sync", {	// broadcast client's pubKey to everyone
							message: pubKey,
							from: client,
							to: "all"
						});
					});
					
				});	

				// for debugging
				IO.on("connect_error", err => {
					Log(err);
				});

				IO.on("disconnection", socket => {
					Log(">>DISCONNECT CLIENT");
				});	
			}

			else 
				throw errors.noSockets;
		}
		
		function setupService(agent) {  

			/*
				If the service is already connected, inherit the server; otherwise define a suitable 
				http/https interface, then start and initialize the service.
			*/
			function connectService() {
				
				/*
					Attach a port listener to service then start it.
					@param {Number} port port to listen on
					@param {Function} cb callback(Req,Res) to handle session request
				*/
				function startSession(port, cb) {
					const 
						{ routeRequest, sockets, name, server, dogs, guard, guards, proxy, proxies, riddle, cores } = TOTEM;
					
					Trace(`STARTING ${name}`);

					if ( sockets ) configSockets(server);

					// The BUSY interface provides a means to limit client connections that would lock the 
					// service (down deep in the tcp/icmp layer).  Busy thus helps to thwart denial of 
					// service attacks.  (Alas latest versions do not compile in latest NodeJS.)

					if (BUSY && TOTEM.busyTime) 
						BUSY.maxLag(TOTEM.busyTime);

					if (guard)  { // catch core faults
						process.on("uncaughtException", err => Trace( "FAULTED" , err) );

						process.on("exit", code => Trace( "HALTED", code ) );

						for (var signal in guards)
							process.on(signal, () => Trace( "SIGNALED", signal) );
					}

					initChallenger();

					TOTEM.initialize(null);	
					
					server.on("request", cb);

					server.listen( port, () => {  	// listen on specified port
						Trace("LISTENING ON", port);
					});

					if (CLUSTER.isMaster)	{ // setup listener on master port
						CLUSTER.on('exit', (worker, code, signal) =>  Trace("WORKER TERMINATED", code || "ok"));

						CLUSTER.on('online', worker => Trace("WORKER CONNECTED"));

						for (var core = 0; core < TOTEM.cores; core++) // create workers
							worker = CLUSTER.fork();
						
						sqlThread( sql => {	// get a sql connection
							Trace( [ // splash
								"HOSTING " + site.nick,
								"AT "+`(${site.master}, ${site.worker})`,
								"DATABASE " + site.db ,
								"FROM " + process.cwd(),
								"WITH " + (sockets?"":"NO")+" SOCKETS",
								"WITH " + (guard?"GUARDED":"UNGUARDED")+" THREADS",
								"WITH "+ (riddle.length?"":"NO") + " ANTIBOT PROTECTION",
								"WITH " + (site.sessions||"UNLIMITED") + " CONNECTIONS",
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
						});
					}
				}

				const 
					{ crudIF,sockets,name,cache,trustStore,certs } = TOTEM,
					port = parseInt( CLUSTER.isMaster ? $master.port : $worker.port );

				//Log( ">>start", isEncrypted(), $master, $worker );

				certs.totem = {  // totem service certs
					pfx: FS.readFileSync(`${paths.certs}${name}.pfx`),
					//key: FS.readFileSync(`${paths.certs}${name}.key`),
					//crt: FS.readFileSync(`${paths.certs}${name}.crt`)
				};

				//Log("enc>>>", isEncrypted(), paths.certs+"truststore" );
				
				if ( isEncrypted() ) {  // have encrypted services so start https service
					Each( FS.readdirSync(paths.certs+"truststore"), (n,file) => {
						if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
							Trace("TRUSTING", file);
							trustStore.push( FS.readFileSync( `${paths.certs}truststore/${file}`, "utf-8") );
						}
					});

					TOTEM.server = HTTPS.createServer({
						passphrase: TOTEM.passEncrypted,		// passphrase for pfx
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
				
				startSession( port, (Req,Res) => {		// start session
					/**
						Provide a request to the supplied session, or terminate the session if the service
						is too busy.

						@param {Function} ses callback(req) session accepting the provided request
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
										//Log(">>>>post", post);
										sqlThread( sql => {
											//Log(Req.headers, Req.url);
											ses({			// prime session request
												host: $master.protocol+"//"+Req.headers.host,	// domain being requested
												referer: Req.headers.referer, 	// proto://domain used
												agent: Req.headers["user-agent"],	// requester info
												sql: sql,	// sql connector
												post: post, // raw post body
												method: Req.method,		// get,put, etc
												started: Req.headers.Date,  // time client started request
												action: crudIF[Req.method],	// crud action being requested
												reqSocket: Req.socket,   // use supplied request socket 
												resSocket: getSocket,		// use this method to return a response socket
												encrypted: isEncrypted(),	// on encrypted worker
												// socketio: sockets ? paths.socketio : "",		// path to socket.io
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
									Res.end( errors.pretty(errors.badMethod) );
							}
						}
						
						if ( BUSY ? BUSY() : false )	// trap DNS attacks
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
										sendError( errors.noData );
								}
								
								catch (err) {
									Trace("TRAP SOCKET.IO BUG - use /socket/socket.io.js");
								}
								
							}

							if (sock = req.reqSocket )	// have a valid request socket so ....
								validateClient(req, err => {	// admit good client
									//Log("prof>>>", req.profile);
									
									if (err)
										res(err);

									else  {
										ses(res);
										const {sql,client} = req;
										sql.query(sqls.newSession, {
											Client: client,
											Message: "joined", //JSON.stringify(cert),
											Joined: new Date()
										});
									}
									/*
									if ( getSession = sqls.getSession )
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
				{ name, cores } = TOTEM,
				pfx = `${paths.certs}${name}.pfx` ;

			Trace( `PROTECTING ${name} USING ${pfx}` );

			Copy( new URL(site.master), $master);
			Copy( new URL(site.worker), $worker);
			
			site.domain = $master.hostname;
			site.host = $master.protocol+"//"+$master.host;
			//Log(">>domain",site.master, $master, site.worker, $worker, site.domain, site.host);
			
			if ( isEncrypted() )   // get a pfx cert if protecting an encrypted service
				FS.access( pfx, FS.F_OK, err => {
					if (err) // create self-signed cert then connect
						createCert(name, TOTEM.passEncrypted, () => {
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
			track: dbTrack
			//fetch: fetch			
		}, err => {  // derive server vars and site context vars
			if (err)
				Trace(err);

			else
				sqlThread( sql => {
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
		
		Trace("WATCHING", path);
		
		modTimes[path] = 0; 

		try {
			FS.watch(path, function (ev, file) {  
				var 
					isSwap = file.startsWith(".");

				if (file && !isSwap)
					switch (ev) {
						case "change":
							sqlThread( sql => {
								Trace(ev.toUpperCase(), file);

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
	sqlThread: sqlThread,
		
	neoThread: cb => {
		cb( new NEOCONNECTOR( false ) );
	},
		
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
	sockets: true, 	//< enabled to support web sockets
		
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
		riddle: sysCheck,
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
		//stores: getFile,
		//shares: getFile,
		//public: getFile,
		//"": getFile,
		//uploads: getFile,
		//stash: getFile
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
		Message: "Welcome ${Client} - what is #riddle?"		// challenge message with riddles, ids, etc
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
		riddler: "/riddle.html",

		certs: "./certs/", 
		//sockets: ".", // path to socket.io
		socketio: "/socket.io/socket.io.js",

		nodes: {  // available nodes for task sharding
			0: ENV.SHARD0 || "http://localhost:8080/task",
			1: ENV.SHARD1 || "http://localhost:8080/task",
			2: ENV.SHARD2 || "http://localhost:8080/task",
			3: ENV.SHARD3 || "http://localhost:8080/task"
		},

		captcha: "/captcha",  // path to antibot captchas
			
		mimes: {  // Extend and remove mime types as needed
		}
	},

	lookups: {},
	Lookups: {},
		
	sqls: {	// sql queries
		//logThreads: "show session status like 'Thread%'",
		users: "SELECT 'users' AS Role, group_concat( DISTINCT lower(dataset) SEPARATOR ';' ) AS Clients FROM openv.dblogs WHERE instr(dataset,'@')",
		derive: "SELECT * FROM openv.apps WHERE ? LIMIT 1",
		// logMetrics: "INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1, Transfer=Transfer+?, Delay=Delay+?, Event=?",
		search: "SELECT * FROM openv.files HAVING Score > 0.1",
		//credit: "SELECT * FROM openv.files LEFT JOIN openv.profiles ON openv.profiles.Client = files.Client WHERE least(?) LIMIT 1",
		getProfile: "SELECT * FROM openv.profiles WHERE Client=? LIMIT 1",
		newProfile: "INSERT INTO openv.profiles SET ?",
		getSession: "SELECT * FROM openv.sessions WHERE ? LIMIT 1",
		newSession: "INSERT INTO openv.sessions SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1",
		//challenge: "SELECT *,concat(client,password) AS Passphrase FROM openv.profiles WHERE Client=? LIMIT 1",
		guest: "SELECT * FROM openv.profiles WHERE Client='guest@guest.org' LIMIT 1",
		pocs: "SELECT lower(Hawk) AS Role, group_concat( DISTINCT lower(Client) SEPARATOR ';' ) AS Clients FROM openv.roles GROUP BY hawk"
	},

	/**
		Get a file and make it if it does not exist
		@method 
		@cfg {Function}
	*/
	getBrick: getBrick,

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
			{pocs,users,guest,derive} = sqls;

		site.warning = "";

		const 
			{lookups,Lookups} = TOTEM;

		site.lookups = lookups,
		site.Lookups = Lookups;
		
		sql.query("SELECT Ref AS `Key`,group_concat(DISTINCT Path SEPARATOR '|') AS `Select` FROM openv.lookups GROUP BY Ref", [], (err,recs) => {
			recs.forEach( rec => {
				lookups[rec.Key] = rec.Select;
			});
			//Log(">>>lookups", lookups);
		});
		
		sql.query("SELECT Ref,Path,Name FROM openv.lookups", [], (err,recs) => {
			recs.forEach( rec => {
				const 
					{Ref,Path,Name} = rec,
					Lookup = Lookups[Ref] || (Lookups[Ref] = {});

				Lookup[Name] = Path;
			});
			//Log(">>>Lookups", Lookups);
		});
		
		if (users) 
			sql.query(users)
			.on("result", user => site.pocs["user"] = (user.Clients || "").toLowerCase() );
			//.on("end", () => Log("user pocs", site.pocs) );

		if (guest && guestProfile)
			sql.query(guest, [], (err,profs) => {
				if ( prof = profs[0] ) 
					Copy( prof, guestProfile );
			});

		sql.query(derive, {Nick:TOTEM.name})
		.on("result", opts => {
			Each(opts, (key,val) => {
				key = key.toLowerCase();
				site[key] = val;

				try {
					site[key] = JSON.parse( val );
				}
				catch (err) {
				}

				//Log(">>>site",key,val);
				if (key in TOTEM) 
					TOTEM[key] = site[key];
			});
		})
		.on("end", () => {
			sql.query(pocs)
			.on("result", poc => site.pocs[poc.Role] = (poc.Clients || "").toLowerCase() )
			.on("end", () => {
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
		
	Trace( "CREATE SELF-SIGNED SERVER CERT", owner );			
	
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
			const
				{ newProfile } = sqls,
				guest = Copy(guestProfile, {
					Client: client,
					//User: client.replace(/(.*)\@(.*)/g,(x,L,R) => L ).replace(/\./g,"").substr(0,12),
					//Login: "",
					Requested: new Date()
				});
			
			delete guest.ID;

			sql.query( newProfile, guest );
			return guest;
		}

		else	// blocking guests
			return null;
	}
	
	const 
		{ sql,encrypted,reqSocket } = req,
		{ getProfile } = sqls,
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
	
	sql.query( getProfile, [client], (err,profs) => {

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
	Get (or create if needed) a file with callback cb(fileID, sql) if no errors

	@memberof File_Utilities
	@param {String} client owner of file
	@param {String} name of file to get/make
	@param {Function} cb callback(file, sql) if no errors
*/
function getBrick(client, name, cb) {  

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
	
	getBrick(client, name, file => {
		var 
			sinkStream = FS.createWriteStream( sinkPath, "utf-8")
				.on("finish", function() {  // establish sink stream for export pipe

					//Trace("UPLOADED FILE");
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

/**
	@class TOTEM.Utilities.Antibot_Protection
	Data theft protection
*/

/**
	Validate clients response to an antibot challenge.

	@param {Object} req Totem session request
	@param {Function} res Totem response callback
*/
function sysCheck (req,res) {
	const 
		{ query, sql, type, body, action } = req,
		{ client , guess } = (action=="select") ? query : body;
	
	Log(client,guess);
	
	if ( type == "help" ) res(`
Validate session id=client guess=value.
`);
	
	else
	if (client && guess)
		sql.query("SELECT * FROM openv.riddles WHERE ? LIMIT 1", {Client:client}, (err,rids) => {

			if ( rid = rids[0] ) {
				var 
					ID = {Client:rid.ID},
					Guess = (guess+"").replace(/ /g,"");

				Log([rid,query]);

				if (rid.Riddle == Guess) {
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
				res( "fail" );

		});

	else
		res( "fail" );
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

	//Log(ds,body);
	sql.Query(
		"INSERT INTO ?? ${set}", [ds,body], {
			trace: trace,
			set: body,
			client: client,
			sio: TOTEM.IO
		}, (err,info) => {

			res( err || {ID: info.insertId} );

		});
}

/**
	CRUD delete endpoint.
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
*/	
function deleteDS(req, res) {
	const 
		{ sql, flags, where, query, body, client, action, ds } = req,
		{ trace } = flags;

	if ( isEmpty(where) )
		res( errors.noID );
		
	else
		sql.Query(
			"DELETE FROM ?? ${where}", [ds], {
				trace: trace,			
				where: where,
				client: client,
				sio: TOTEM.IO
			}, (err,info) => {

				body.ID = query.ID;
				res( err || body );

			});
}

/**
	CRUD update endpoint.
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
*/	
function updateDS(req, res) {
	const 
		{ sql, flags, body, where, query, client, action, ds,table } = req,
		{ trace } = flags;
	
	//Log({w:where, q:query, b:body});
	
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
				sio: TOTEM.IO
			}, (err,info) => {

				//res( err || info );
				body.ID = query.ID;
				//Log(">>>>rtn", query, body);
				res( err || body );

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
	const {query,body,sql,type,table,url} = req;
	const {task,domains,cb,client,credit,name,qos} = body;
	
	if ( type == "help" ) res(`
Shard specified task to the compute nodes given task post parameters.
`);
	
	else {
		var 
			$ = JSON.stringify({
				worker: CLUSTER.isMaster ? 0 : CLUSTER.worker.id,
				node: process.env.HOSTNAME
			}),
			engine = `(${cb})( (${task})(${$}) )`;

		res( "ok" );

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
	function hashify(key,hash) {
		var rtn = hash || {};
		this.forEach( rec => rtn[rec[key]] = rec );
		return rtn;
	}
	*/
].Extend(Array);

/**
@class TOTEM.Unit_Tests_Use_Cases
*/

//Log(">>>>fetch oauth", Config.oauthHosts);

async function prime(cb) {
	cb();
}

async function LexisNexisTest(N,endpt,R,cb) {
	const start = new Date(), {random,trunc} = Math;
	var done = 0;
	Log(start);
	for ( var n=0; n<N; n++) 
		Fetch(endpt + (R?trunc(random()*R):""), res => {
			//Log(n,done,N);
			if ( ++done == N ) {
				var 
					stop = new Date(),
					mins = (stop-start)/1e3/60,
					rate = N/mins;
				
				Log(stop, mins, "mins", rate, "searches/min");
				
				if (cb) cb(res);
			}
		});
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
		Trace("", {
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

					Trace("", {
						do_query: req.query
					});
				},

				dothat: function dothat(req,res) {

					if (req.query.x)
						res( [{x:req.query.x+1,y:req.query.x+2}] );
					else
						res( new Error("We have a problem huston") );

					Trace("", {
						msg: `Like dothis, but needs an ?x=value query`, 
						or_query: req.query,
						or_user: req.client
					});
				}
			}
		}, sql => {
			Trace("", {
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
			Trace("", {
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
				sql.ingestFile("./stores/_noarch/gtd.csv", {
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
				sql.ingestFile("./stores/_noarch/gtdscite.csv", {
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
				sql.ingestFile("./stores/_noarch/centam.csv", {
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
			
	
	case "LN1":
		LexisNexisTest(1e3, 'lex://services-api.lexisnexis.com/v1/News?$search=rudolph');
		break;
		
	case "LN2":
		LexisNexisTest(1e3, 'lex://services-api.lexisnexis.com/v1/News?$search=rudolph&$expand=Document');
		break;

	case "LN3":
		LexisNexisTest(1e3, 'lex://services-api.lexisnexis.com/v1/News?$search=rudolph');
		break;
			
	case "LN4":
		LexisNexisTest(1, 'lex://services-api.lexisnexis.com/v1/News?$search=rudolph', 0, res => {
			//Log("res=>", res);
			var r = JSON.parse(res);
			//Log( Object.keys(r) );
			if ( rec = r.value[0] ) 
				Log( "fetch docendpt >>>>", rec['DocumentContent@odata.mediaReadLink'] , Object.keys(rec), rec.Overview, rec.Date );
			
			Fetch( 'lex://services-api.lexisnexis.com/v1/' + rec['DocumentContent@odata.mediaReadLink'] , doc => {
				//    'lexis://services-api.lexisnexis.com/v1/MEDIALINK
				Log( "doc=>", doc );
			});
			
		});
		break;

	case "LN5":
		Fetch( 'lexis://services-api.lexisnexis.com/v1/News?$search=rudolph', doc => {
			Log( "doc=>", doc );
		});
		break;
}

// UNCLASSIFIED
