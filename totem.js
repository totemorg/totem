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
	XML2JS = require("xml2js"),					// xml to json parser (*)
	BUSY = require('toobusy-js'),  				// denial-of-service protector
	JS2XML = require('js2xmlparser'), 			// JSON to XML parser
	JS2CSV = require('json2csv'),				// JSON to CSV parser	
	  
	// totem modules
	SECLINK = require("./securelink"),			// secure com and login
	JSDB = require("./jsdb"),					// database agnosticator
	ENUMS = require("./enums"),					// data enumerators
	SKIN = require("./skin"),					// site skinning
	  
	{ renderSkin, renderJade } = SKIN,	
	{ readFile } = FS,
	{ Copy,Each,Start,Clock,Log,
	 sqlThread,neoThread,
	 isError,isArray,isString,isFunction,isEmpty,typeOf,isObject,Fetch 
	} = ENUMS,  
	{ testClient } = SECLINK,
	{ isMaster } = CLUSTER;

/**
@module TOTEM.String
*/
Copy({ //< String prototypes
/**
Returns a ref-joined list of links
@extends String
@param {String} ref
*/
	linkify: function (ref) {
		return ref 
			? this.link( ref ) 
			: this.replace( /\[([^\[\]]*)\]\(([^\)]*)\)/g, (str,lab,url) => lab.link(url) );
	},
	
/**
Returns a link suitable to ref host email system
@extends String
@param {String} ref
*/
	mailify: function ( label, tags ) {
		return this ? label.link( "mailto:"+this.tag("?", tags || {}) ) : "missing email list";
	},

/**
Parse XML string into json and callback cb(json) 

@extends String
@param {Function} cb callback( json || null if error )
*/
	parseXML: function (cb) {
		XML2JS.parseString(this, function (err,json) {				
			cb( err ? null : json );
		});
	}

}, String.prototype);

/**
@module DEBE.Array
*/
Copy({  // array prototypes
/**
Creates an html table from an array.
@param {Boolean} noheader switch to enable header processing
*/
	gridify: function (rehead,style) {	//< dump dataset as html table
		function join(recs,sep) { 
			switch (recs.constructor) {
				case Array: 
					return this.join(sep);

				case Object:
					var rtn = [];
					for (var n in this) rtn.push(this[n]);
					return rtn.join(sep);

				default:
					return this;
			}
		}

		function table(recs) {  // generate an html table from given data or object
			switch (recs.constructor) {
				case Array:  // [ {head1:val}, head2:val}, ...]  create table from headers and values

					var rtn = "";
					const heads = {}, rec0 = recs[0];

					if (rehead && rec0) {
						if ( rec0.forEach )
							rec0.forEach( (val,key) => heads[key] = rehead[key] || key );

						else																		
							Each(rec0, (key,val) => heads[key] = rehead[key] || key );

						var row = "";
						Each(heads, (key,val) => row += val.tag("th", {}) );

						rtn += row.tag("tr", {});
					}

					recs.forEach( (rec,idx) => {
						var row = "", intro = true;
						Each(heads, (key,val) => {
							if (val = rec[key])
								row += val.forEach
									? table(val)
									: (val+"").linkify().tag("td", intro ? {class:"intro"} : {});
							else
								row += ((val==0) ? "0" : "").tag("td", {});

							intro = false;
						});
						rtn += row.tag("tr", {});
					});

					return rtn.tag("table",style || {border:0,width:"100%"}); //.tag("div",{style:"overflow-x:auto"});

				case Object: // { key:val, ... } create table dump of object hash

					var rtn = "";
					Each(recs, (key,val) => {
						if (val)
							rtn += isArray(val)
								? table(val)
								: (key.tag("td", {}) + JSON.stringify(val).tag("td", {})).tag("tr", {});
					});

					return rtn.tag("table",{});

				default:
					return recs+"";
			}
		}

		function dump(x) {
			rtn = "";
			for (var n in x)  {
				switch ( x[n].constructor ) {
					case Object:
						rtn += dump( x[n] ); break;
					case Array:
						rtn += n+"[]"; break;
					case Function:
						rtn += n+"()"; break;
					default:
						rtn += n;
				}
				rtn += "; ";
			}
			return rtn;
		}

		return  table( this );
	},
	
/**
Groups each "x.y.z. ...." spec in the list.

@param {string} dot item seperator
*/
	groupify: function (dot) {
		var src = {};
		this.forEach( key => src[key] = key.split(dot).pop() ); 

		return [].joinify( Copy(src, {} ,dot) );
	},

/**
Blogs each string in the list.

@see totem:blogify
@param {List} keys list of keys to blog
@param {String} ds Name of dataset being blogged
@param {Function} cb callback(recs) blogified version of records
*/
	blog: function ( req, key, cb ) {
		const 
			{ sql, flags, client, profile, table, type, host } = req,
			ds = "/"+table,
			book = ds,
			product = table+".html",
			recs = this,
			ctx = {
				host: host,
				table: table,
				client: client,
				type: type
			},
			fetchBlog = ( rec, cb ) => {
				const 
					isEnum = (rec.Pipe||"").startsWith("{"),	// is client doing an enumerated pipe ?
					src = (ds+".json").tag("?", { 		// define default src key
						name: isEnum
							? rec.Name + "-*"	// request all children cases
							: rec.Name			// request only this case
					});

				//Trace(">>>>>>>>>>blog", src, ds, key, rec[key]);

				if ( md = rec[key] ) // have valid markdown
					md.blogify(src, ctx, rec, html => {	// blog it
						cb( flags.kiss
								? html 	// keep it simple
								: [	// add options
									site.nick.link( "/" ),
									"schema".link( `xfan.view?src=${ds}.schema?name=${rec.Name}&w=4000&h=600` ),
									//"run".link( `${book}.exe?Name=${rec.Name}` ),
									"run".link( `${book}.exe`.tag("?", {name: rec.Name}) ),
									"goto".link( `${book}.view` ),
									"publish".link( `${book}.pub` ),
									"tou".link( `${book}.tou` ),
									"data".link( `${book}.data`.tag("?", {name:rec.Name}) ),
									//"open".link( `${book}.blog?key=${key}&name=${rec.Name}&subs=${isEnum}` ),
									"open".link( `${book}.open`.tag("?", {name:rec.Name}) ),
									(new Date().toDateString()) + "",
									( client.match( /(.*)\@(.*)/ ) || ["",client] )[1].link( "email:" + client )
								].join(" || ") + "<br>" + html
						);

						/*
						if ( profile.Track ) 	// client is being tracked
							if ( licenseCode ) { // code licensor installed
								licenseCode( sql, html, {  // register this html with this client
									_Partner: client,
									_EndService: "",  // leave empty so lincersor wont validate by connecting to service
									_Published: new Date(),
									_Product: product,
									Path: "/tag/"+product
								}, pub => {
									if (pub) {
										//cb( `${rec.topic}=>${req.client}`.link( "/tags.view" ) );
										sql.query("INSERT INTO openv.tags SET ? ON DUPLICATE KEY UPDATE Views=Views+1", {
											Viewed: pub._Published,
											Target: pub._Partner,
											Topic: table,
											License: pub._License,
											Message: "viewed".link( "/decode.html".tag("?", {
												Target:pub._Partner,
												License:pub._License,
												Topic:table
											}))
										});
									}
								});		
								Trace(`TRACKING ${client}`);
							}
						*/
					}); 

				else
					cb( "" );
			};

		recs.serial( fetchBlog, (rec, blog) => {
			if (rec) 
				rec[key] = blog;

			else 
				cb( recs );
		});
	},

/**
Joins a list with an optional callback cb(head,list) to join the current list 
with the current head.

@param {Function} cb
@example
	[	a: null,
		g1: [ b: null, c: null, g2: [ x: null ] ],
		g3: [ y: null ] ].joinify()

returning a string
	"a,g1(b,c,g2(x)),g3(y)"
*/
	joinify: function (src) {
		var 
			rtn = [];

		//Trace(">keys=", Object.keys(src));

		Object.keys(src).forEach( key => {
			var list = src[key];

			if ( isString(list) )
				rtn.push( list );

			else
				rtn.push( key + "(" + [].joinify(list) + ")" );
		});

		//Trace(">>rtn", rtn);
		return rtn.join(",");
	}	

}, Array.prototype);

/**
Provides a [barebones web service]{@link https://github.com/totemorg/totem}.  This module documented 
in accordance with [jsdoc]{@link https://jsdoc.app/}.

### Env Dependencies

	SERVICE_PASS = passphrase to server pki cert
	URL_MASTER = URL to master totem service service
	URL_WORKER = URL to worker totem service service
	SHARD0 = PROTO://DOMAIN:PORT
	SHARD1 = PROTO://DOMAIN:PORT
	SHARD2 = PROTO://DOMAIN:PORT
	SHARD3 = PROTO://DOMAIN:PORT

@module TOTEM
@author [ACMESDS](https://totemorg.github.io)

@requires [enums](https://github.com/totemorg/enums)
@requires [jsdb](https://github.com/totemorg/jsdb)
@requires [securelink](https://github.com/totemorg/securelink)
@requires [socketio](https://github.com/totemorg/socketio)

@requires [http](https://nodejs.org/docs/latest/api/)
@requires [https](https://nodejs.org/docs/latest/api/)
@requires [fs](https://nodejs.org/docs/latest/api/)
@requires [constants](https://nodejs.org/docs/latest/api/)
@requires [cluster](https://nodejs.org/docs/latest/api/)
@requires [child_process](https://nodejs.org/docs/latest/api/)
@requires [os](https://nodejs.org/docs/latest/api/)
@requires [stream](https://nodejs.org/docs/latest/api/)
@requires [vm](https://nodejs.org/docs/latest/api/)
@requires [crypto](https://nodejs.org/docs/latest/api/)

@requires [mime](https://www.npmjs.com/package/mime)
@requires [xml2js](https://www.npmjs.com/package/xml2js)
@requires [toobusy-js](https://www.npmjs.com/package/toobusy-js)
@requires [json2csv](https://www.npmjs.com/package/json2csv)
@requires [js2xmlparser](https://www.npmjs.com/package/js2xmlparser)
@requires [cheerio](https://www.npmjs.com/search?q=cheerio)

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

config({
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

config({
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

config({
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

config({
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

config({
	guard: false,	// ex override default 
	cores: 3,		// ex override default

	"byTable.": {  // define endpoints
		test: function (req,res) {
			res(" here we go");  // endpoint must always repond to its client 
			if (isMaster)  // setup tasking examples on on master
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

config({
}, sql => {				
	Log( "db maintenance" );

	if (isMaster)
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
config();
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
	worker = ENV.URL_WORKER || "http://localhost:8081", 
	master = ENV.URL_MASTER || "http://localhost:8080",
	$worker = new URL(worker),
	$master = new URL(master),
	  
	{ 	Trace,
		byArea, byType, byAction, byTable, CORS,
		defaultType, attachAgent, config,
	 	createCert, loginClient, crudIF, busy,
		getBrick, routeAgent, setContext, readPost,
		filterFlag, paths, sqls, errors, site, isEncrypted, behindProxy, admitRules,
		filters,tableRoutes, dsThread, startDogs, cache } = TOTEM = module.exports = {
	
	Trace: (msg, ...args) => `totem>>>${msg}`.trace( args ),	

/**
Service too-busy options
@cfg {Object} 
*/
			
	busy: {
		maxlag: 800,		// ms
		interval: 500		// ms
	},

/**
Attach (req,res)-agent(s) to `service` listening on specified `port`.  

@param {Object} server Server being started
@param {Numeric} port Port number to listen for agent requests
@param {Function|Object} agents (req,res)-router or (req,res)-hash of agents
@param {Function} init Optional callback after server started
*/
	attachAgent: (server,port,agents,init) => {

		Log("listening on", port);

		server
		.listen( port, () => {  	// listen on specified port
			console.log( `Listening on port ${port}` );
			if ( init ) init();
		})
		.on("request", (Req,Res) => {
			function reqThread( ses ) { 		// start request and callback session cb
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

				function parsePost( post, content ) {
					const
						[type,attr] = (content||"").split("; "),
						body = attr ? {formType: type} : {};

//Log("parsepost", this, this.constructor, [type, attr]);

					if ( post )
						try {
							body.name = "post";
							body.post = JSON.parse(post);
						}

						catch (err) {						
							switch (type) {
								case "multipart/form-data":
									const
										conDisp = "Content-Disposition:",
										conType = "Content-Type:",
										conBdry = body.formBoundary = attr.split("=").pop().replace(/-/g,"");

									var
										key = "";

									try {
										post.split("\r\n").forEach( (line,idx) => {
											if ( line.startsWith("--") && line.replace(/-/g,"") == conBdry) {	// "-----------------------------"
												//console.log("**bdry>");
											}

											else
											if ( line.startsWith(conDisp) ) {
												//console.log("**disp>", line);
												line.split("; ").forEach( (arg,idx) => {
													if (idx) {
														const
															[pre,key,val] = arg.match( /(.*)=\"(.*)\"/ ) || ["",""];

														body[key] = val;
													}
												});
											}

											else
											if ( line.startsWith(conType) ) {
												//console.log("**type>", line);
												body.mimeType = line.split(" ").pop()
											}

											else
											if (line) {
					Log("**data>>>>>", body.name, line.length, "str=", line.substr(0,8), "hex=", Buffer.from(line.substr(0,8)).toString("hex"));
												body[ body.name ] = line;	
											}
										});
									}

									catch (err) {
										body.error = "invalid multipart post";
									}

									break;

								case "application/x-www-form-urlencoded":
									body.name = "url";
									body.url = unescape(this).replace(/\+/g," ");
									//Log("app======>", body);
									break;

								case "text/plain":
									var
										[key,text] = this.match(/(.*)=(.*)/) || [];

									if (key) {
										body.name = key;
										body[key] = text;
									}

									//Log("txt======>", body);
									break;

								default:
									body.name = "post";
									body.post = post;
							}
						}

					return body;
				}
				
				function getCert(sock, headers) {  //< Return cert presented on this socket (w or w/o proxy).
					const 
						cert = sock.getPeerCertificate();

					// Log("getcert>>>>>>>>", cert, cert.subjectaltname);
					if (headers) {  // behind proxy so update cert with originating cert info that was placed in header
						const 					
							NA = headers.ssl_client_notafter,
							NB = headers.sll_client_notbefore,
							DN = headers.ssl_client_s_dn;

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
				
				function getSocket( cb ) {
					if ( BUSY() )	{					// check is under DoS attack
						Trace("Busy!");
						Res.end( "Error: server busy" );		// end the session
					}
					
					else
					if ( reqSocket = Req.socket )
						cb({								// start the session
							cert: reqSocket.getPeerCertificate ? getCert(reqSocket) : null,
							headers: Req.headers,
							host: Req.headers["host"],
							cookie: Req.headers["cookie"] || "",
							ipAddress: Req.socket.remoteAddress,
							referer: new URL(Req.headers["referer"] || "http://noreferer"), 	// proto://domain used
							agent: Req.headers["user-agent"] || "",					// requester info
							method: Req.method,					// get,put, etc
							now: new Date(),  					// time client started request
							reqSocket: reqSocket,   			// use supplied request socket 
							resSocket: getSocket,				// attach method to return a response socket
							/*
							There exists an edge case wherein an html tag within json content, e.g a <img src="/ABC">
							embeded in a json string, is reflected back the server as a /%5c%22ABC%5c%22, which 
							unescapes to /\\"ABC\\".  This is ok but can be confusing.
							*/
							url: unescape( Req.url || "/" )		// unescaped url
						});
					
					else
						Res.end( "Error: lost socket" );
				}
				
				getSocket( req => {
					getPost( post => {							// prime session request
//Log("getpost", post); 
						switch ( req.method ) {	// get post parms depending on request type being made
							// CRUD interface
							case "PUT":
							case "GET":
							case "POST":
							case "DELETE":
//Log("dopost", Req.url, Req.method, Req.headers["content-type"]);
								req.body = parsePost(post, Req.headers["content-type"] );
								ses(req);
								break;

							// client making cross-domain CORs request, so respond with valid methods - dont start a session
							case "OPTIONS":  
								//Req.method = Req.headers["access-control-request-method"];
								//Trace(">>>>>>opts req", Req.headers);
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

							default:		// signal session problem
								Res.end( "Error: bad method" );
						}
					});
				});
			}

			reqThread( req => { 	// start request thread
				function resThread( ses ) {  	// start response using this session callback								
					ses( data => {  // Provide session response callback
						try {  // set headers, handle CORs, then send data
							if ( false ) {	// support CORS
								Res.setHeader("Access-Control-Allow-Origin", "*");
								Res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
								Res.setHeader("Access-Control-Allow-Headers", '*');
								Res.setHeader("Status", "200 OK");
								Res.setHeader("Vary", "Accept");
							}

							Res.setHeader("Content-Type", req.mime || "text/plain");
							Res.statusCode = 200;
// Log(">>>>>>>>>send", data.constructor.name, req.mime);

							if (data != null)
								switch ( data.constructor.name ) {  // send based on its type
									case "Error": 			// send error message
										Res.end( data+"" );
										break;

									case "Buffer":
										Res.end( data );
										break;
										
									case "Number":
									case "Date":
									case "Object":
									case "Array": 			// send data records 
										try {
											Res.end( JSON.stringify(data) );
										}
										catch (err) {  // infinite cycle
											Res.end( "Error: cyclic data" );
										}		
										break;

									case "String":  			// send message
										Res.end( data );
										break;
									
									case "Function":
										data(req, txt => Res.end(txt) );
										break;
										
									default: 					// send data record
//Log(">>>>>>>>bad data", data.constructor.name);
										Res.end("Error: bad data");
										break;
								}

							else
								Res.end( "null" );
						}

						catch (err) {
							Res.end( "Error: bad data" );
						}	
					});	
				}

				resThread( res => {	// route the request on the provided response callback
					const
						{ url } = req,
						query = req.query = {},
						index = req.index = {},
						flags = req.flags = {},
						where = req.where = {},
						[path,table,type,area] = url.parsePath(query, index, flags, where);

					//console.log("parsepath", [path,table,type,area]);

					req.path = path;
					req.area = area;
					req.table = table || "ping";
					req.type = type || "";
					
					if ( agents.constructor == Function ) 
						agents( req, res );
					
					else 
					if ( agent = agents[path] || agents[table] || agents[type] || agents[area] )
						agent(req,res); 
					
					else
						res( "Error: no agent" );
				});
			});
		})
		.on("error", err => console.log("server failed", err) );
	},

/**
Enable to support cross-origin-scripting
@cfg {Boolean} 
*/
			
	CORS: false,	//< enable to support cross-origin-scripting
		
/**
Default NODE type during a route
@cfg {String}
*/
	defaultType: "run",

/**
SecureLink configuration settings.  Null to disable.
@cfg {Object}
*/
	secureIO: {
/**
Socketio i/f set on SECLINK config
*/
		sio: null,		//< set on configuration
			
/**
Name of SECLINK host for determining trusted clients etc
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
Callback the session cb with the client profile as derived from the request cert (if it exists) or the request cookie 
(if it exists).  The returned profile is null if the cert/cookie could not be validated.

@param {Object} req totem session request
@param {Function} cb callback(profile || null) 

@example 
Old certs

cert {
  subject: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI', 'OSD' ],
    CN: 'JAMES.BRIAN.D.1411932300'
  },
  issuer: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI' ],
    CN: 'DOD EMAIL CA-59'
  },
  subjectaltname: 'email:BRIAN.D.JAMES@NGA.MIL, othername:<unsupported>',
  infoAccess: [Object: null prototype] {
    'CA Issuers - URI': [ 'http://crl.disa.mil/sign/DODEMAILCA_59.cer' ],
    'OCSP - URI': [ 'http://ocsp.disa.mil' ]
  },
  modulus: 'C409110403DFA25C9856BF76C4B3C83005CEE6CEE6A121F077295727AA69513770D8CEC707623D3FC83C39C7A9C976EBD1DD8BAA851249ACE8E423B1EEE73AD7EAD88B256B757B696BE60566A1110512E58562C27CE7E917652A3212F49FFE497A2EA294C2D3A10B07ADB337E29800D54B022E736CD651EE50177455546A7A15D326BFDB04107485F6F66ED0B27F4F2F7FC21EA212C1B6D62E0E283510D8B447CA7395D94076A0E961E03773A41DAEDD6D2492AA9276097587ABCDE4CC2A6E991137A70B558EBDFB3C96CDE1E38FEFCCB32A39B75BBF349045DDBA18400A2CA74FA538F7B7997FCB6825C3CD3FF7BAFF2902F8D9BA99D50325D6741B763B7669',
  bits: 2048,
  exponent: '0x10001',
  pubkey: <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01 05 00 03 82 01 0f 00 30 82 01 0a 02 82 01 01 00 c4 09 11 04 03 df a2 5c 98 56 bf 76 c4 b3 c8 30 05 ... 244 more bytes>,
  valid_from: 'Jun  8 00:00:00 2020 GMT',
  valid_to: 'Jun  7 23:59:59 2023 GMT',
  fingerprint: '4C:4E:16:C4:4B:5A:B6:11:D0:95:48:99:1A:D9:9D:F5:7A:D8:96:03',
  fingerprint256: '3C:1C:67:DA:E3:7B:E8:03:1F:F8:83:4D:DF:70:B4:D9:23:9E:54:41:B2:88:3C:A1:62:D8:49:49:8C:60:8E:AC',
  ext_key_usage: [
    '1.3.6.1.4.1.311.20.2.2',
    '1.3.6.1.5.5.7.3.2',
    '1.3.6.1.5.5.7.3.4'
  ],
  serialNumber: '03D389',
  raw: <Buffer 30 82 04 f1 30 82 03 d9 a0 03 02 01 02 02 03 03 d3 89 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 5d 31 0b 30 09 06 03 55 04 06 13 02 55 53 31 18 ... 1219 more bytes>
}
client brian.d.james@nga.mil

@example
old certs
cert {
  subject: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI', 'OSD' ],
    CN: 'JAMES.BRIAN.D.1411932300'
  },
  issuer: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI' ],
    CN: 'DOD EMAIL CA-59'
  },
  subjectaltname: 'email:BRIAN.D.JAMES@NGA.MIL, othername:<unsupported>',
  infoAccess: [Object: null prototype] {
    'CA Issuers - URI': [ 'http://crl.disa.mil/sign/DODEMAILCA_59.cer' ],
    'OCSP - URI': [ 'http://ocsp.disa.mil' ]
  },
  modulus: 'C409110403DFA25C9856BF76C4B3C83005CEE6CEE6A121F077295727AA69513770D8CEC707623D3FC83C39C7A9C976EBD1DD8BAA851249ACE8E423B1EEE73AD7EAD88B256B757B696BE60566A1110512E58562C27CE7E917652A3212F49FFE497A2EA294C2D3A10B07ADB337E29800D54B022E736CD651EE50177455546A7A15D326BFDB04107485F6F66ED0B27F4F2F7FC21EA212C1B6D62E0E283510D8B447CA7395D94076A0E961E03773A41DAEDD6D2492AA9276097587ABCDE4CC2A6E991137A70B558EBDFB3C96CDE1E38FEFCCB32A39B75BBF349045DDBA18400A2CA74FA538F7B7997FCB6825C3CD3FF7BAFF2902F8D9BA99D50325D6741B763B7669',
  bits: 2048,
  exponent: '0x10001',
  pubkey: <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01 05 00 03 82 01 0f 00 30 82 01 0a 02 82 01 01 00 c4 09 11 04 03 df a2 5c 98 56 bf 76 c4 b3 c8 30 05 ... 244 more bytes>,
  valid_from: 'Jun  8 00:00:00 2020 GMT',
  valid_to: 'Jun  7 23:59:59 2023 GMT',
  fingerprint: '4C:4E:16:C4:4B:5A:B6:11:D0:95:48:99:1A:D9:9D:F5:7A:D8:96:03',
  fingerprint256: '3C:1C:67:DA:E3:7B:E8:03:1F:F8:83:4D:DF:70:B4:D9:23:9E:54:41:B2:88:3C:A1:62:D8:49:49:8C:60:8E:AC',
  ext_key_usage: [
    '1.3.6.1.4.1.311.20.2.2',
    '1.3.6.1.5.5.7.3.2',
    '1.3.6.1.5.5.7.3.4'
  ],
  serialNumber: '03D389',
  raw: <Buffer 30 82 04 f1 30 82 03 d9 a0 03 02 01 02 02 03 03 d3 89 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 5d 31 0b 30 09 06 03 55 04 06 13 02 55 53 31 18 ... 1219 more bytes>
}

@example
CA chain
0>>>TOTEM>>>CA CHAIN [ 'ca_Certificate_Chain.crt' ]
certs Research*2020 {
  totem: {
    pfx: <Buffer 30 82 0a d1 02 01 03 30 82 0a 97 06 09 2a 86 48 86 f7 0d 01 07 01 a0 82 0a 88 04 82 0a 84 30 82 0a 80 30 82 05 37 06 09 2a 86 48 86 f7 0d 01 07 06 a0 ... 2723 more bytes>
  }
} [
  'subject=C = US, O = U.S. Government, OU = DoD, OU = PKI, OU = NGA, CN = totem.nga.mil\n' +
    '\n' +
    'issuer=C = US, O = U.S. Government, OU = DoD, OU = PKI, CN = DOD SW CA-60\n' +
    '\n' +
    '-----BEGIN CERTIFICATE-----\n' +
    'MIIEijCCA3KgAwIBAgIEAwAa1zANBgkqhkiG9w0BAQsFADBaMQswCQYDVQQGEwJV\n' +
    'UzEYMBYGA1UEChMPVS5TLiBHb3Zlcm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNV\n' +
    'BAsTA1BLSTEVMBMGA1UEAxMMRE9EIFNXIENBLTYwMB4XDTIwMDcwMjE4MzcxM1oX\n' +
    'DTIzMDcwMjE4MzcxM1owaTELMAkGA1UEBhMCVVMxGDAWBgNVBAoMD1UuUy4gR292\n' +
    'ZXJubWVudDEMMAoGA1UECwwDRG9EMQwwCgYDVQQLDANQS0kxDDAKBgNVBAsMA05H\n' +
    'QTEWMBQGA1UEAwwNdG90ZW0ubmdhLm1pbDCCASIwDQYJKoZIhvcNAQEBBQADggEP\n' +
    'ADCCAQoCggEBAMwtPgp7qqRG+jKHdIHBAoWSEGO5TqGF/SHgPJMdwAAMh//5wwWA\n' +
    '3NZ+tm4yWT7QWCrnELwIq+0RfdaNGUxi/SIKv8/d8z+is/7bv9aTYFqDIP3NrGL7\n' +
    '6RyOPNoJBCXafJx4vSXnlKMTH8uI8DLKG5umQZzgaZewIowzKd3dF8+/vwQd0HyS\n' +
    'DIAi4CFvGGWtJqQHvnOVcptcM3sqZCanJIpuAhF5ywBMMHfzxQNI1SZs5GrUA4i9\n' +
    'yghYuop3oknDozjNIOI33E3spvWesNv6M8t5RFlu9a++Iltoz6fBnom6LwceH20u\n' +
    'Dxa72sdDc+vDHsVzcWMw8U3N1ot4Q7yNdecCAwEAAaOCAUcwggFDMB8GA1UdIwQY\n' +
    'MBaAFH3+8BAXOb/TcoT9rSlw+OI9mfMYMGUGCCsGAQUFBwEBBFkwVzAzBggrBgEF\n' +
    'BQcwAoYnaHR0cDovL2NybC5kaXNhLm1pbC9zaWduL0RPRFNXQ0FfNjAuY2VyMCAG\n' +
    'CCsGAQUFBzABhhRodHRwOi8vb2NzcC5kaXNhLm1pbDAOBgNVHQ8BAf8EBAMCBaAw\n' +
    'FgYDVR0lAQH/BAwwCgYIKwYBBQUHAwQwGAYDVR0RBBEwD4YNdG90ZW0ubmdhLm1p\n' +
    'bDAdBgNVHQ4EFgQUbArdvuuW48ajejBJysUUkD8gpGswQAYDVR0fBDkwNzA1oDOg\n' +
    'MYYvaHR0cDovL2NybC5kaXNhLm1pbC9jcmwvRE9EU1dDQV82MF9OUEVFTUFJTC5j\n' +
    'cmwwFgYDVR0gBA8wDTALBglghkgBZQIBCyQwDQYJKoZIhvcNAQELBQADggEBADJX\n' +
    'EWQGtP1ujiUrwDps/eMqXikLjdqbFX0jYtbAa2cfl9PzVtsAiBeOGKhp5B8KRGG/\n' +
    'XgPDH3DdT6CJsBezqKzXFVAmmql7Zw+XaUqSGgn73On+Bzq2NFATWk64NHUjuaF+\n' +
    'nH2r31OpqZDnTMm9ZPfiQ9F/AzPBw4I6OxA2eEdmwo3Ek906AXeijaLmneXPkC7r\n' +
    '2T2Bpt1l9wBnxyRnbNB8/N5jtt5GEH6ADbfNOMnc4gEYTXUFKJBip3HaKjtYUS5h\n' +
    '/YjwxVTgv5jwwBx6NwkA2Lhe5KKEMnePfMos7njSGVtLaR/jXVuvFgOWBe2ROFt6\n' +
    'H3c0ER47IHRMJg5i9Wc=\n' +
    '-----END CERTIFICATE-----\n' +
    '\n' +
    'subject=C = US, O = U.S. Government, OU = DoD, OU = PKI, CN = DoD Root CA 3\n' +
    '\n' +
    'issuer=C = US, O = U.S. Government, OU = DoD, OU = PKI, CN = DoD Root CA 3\n' +
    '\n' +
    '-----BEGIN CERTIFICATE-----\n' +
    'MIIDczCCAlugAwIBAgIBATANBgkqhkiG9w0BAQsFADBbMQswCQYDVQQGEwJVUzEY\n' +
    'MBYGA1UEChMPVS5TLiBHb3Zlcm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNVBAsT\n' +
    'A1BLSTEWMBQGA1UEAxMNRG9EIFJvb3QgQ0EgMzAeFw0xMjAzMjAxODQ2NDFaFw0y\n' +
    'OTEyMzAxODQ2NDFaMFsxCzAJBgNVBAYTAlVTMRgwFgYDVQQKEw9VLlMuIEdvdmVy\n' +
    'bm1lbnQxDDAKBgNVBAsTA0RvRDEMMAoGA1UECxMDUEtJMRYwFAYDVQQDEw1Eb0Qg\n' +
    'Um9vdCBDQSAzMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqewUcoro\n' +
    'S3Cj2hADhKb7pzYNKjpSFr8wFVKGBUcgz6qmzXXEZG7v8WAjywpmQK60yGgqAFFo\n' +
    'STfpWTJNlbxDJ+lAjToQzhS8Qxih+d7M54V2c14YGiNbvT8f8u2NGcwD0UCkj6cg\n' +
    'AkwnWnk29qM3IY4AWgYWytNVlm8xKbtyDsviSFHy1DekNdZv7hezsQarCxmG6CNt\n' +
    'MRsoeGXF3mJSvMF96+6gXVQE+7LLK7IjVJGCTPC/unRAOwwERYBnXMXrolfDGn8K\n' +
    'Lb1/udzBmbDIB+QMhjaUOiUv8n3mlzwblLSXWQbJOuQL2erp/DtzNG/955jk86HC\n' +
    'kF8c9T8u1xnTfwIDAQABo0IwQDAdBgNVHQ4EFgQUbIqUonexgHIdgXoWqvLczmbu\n' +
    'RcAwDgYDVR0PAQH/BAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL\n' +
    'BQADggEBAJ9xpMC2ltKAQ6BI6R92BPnFPK1mGFhjm8O26GiKhVpCZhK00uaLiH+H\n' +
    '9Jj1qMYJyR/wLB/sgrj0pUc4wTMr30x+mr4LC7HLD3xQKBDPio2i6bqshtfUsZNf\n' +
    'Io+WBbRODHWRfdPy55TClBR2T48MqxCHWDKFB3WGEgte6lO0CshMhJIf6+hBhjy6\n' +
    '9E5BStFsWEdBw4Za8u7p8pgnguouNtb4Bl6C8aBSk0QJutKpGVpYo6hdIG1PZPgw\n' +
    'hxuQE0iBzcqQxw3B1Jg/jvIOV2gzEo6ZCbHw5PYQ9DbySb3qozjIVkEjg5rfoRs1\n' +
    'fOs/QbP1b0s6Xq5vk3aY0vGZnUXEjnI=\n' +
    '-----END CERTIFICATE-----\n' +
    '\n' +
    'subject=C = US, O = U.S. Government, OU = DoD, OU = PKI, CN = DOD SW CA-60\n' +
    '\n' +
    'issuer=C = US, O = U.S. Government, OU = DoD, OU = PKI, CN = DoD Root CA 3\n' +
    '\n' +
    '-----BEGIN CERTIFICATE-----\n' +
    'MIIEjzCCA3egAwIBAgICAwMwDQYJKoZIhvcNAQELBQAwWzELMAkGA1UEBhMCVVMx\n' +
    'GDAWBgNVBAoTD1UuUy4gR292ZXJubWVudDEMMAoGA1UECxMDRG9EMQwwCgYDVQQL\n' +
    'EwNQS0kxFjAUBgNVBAMTDURvRCBSb290IENBIDMwHhcNMTkwNDAyMTMzNDQ5WhcN\n' +
    'MjUwNDAyMTMzNDQ5WjBaMQswCQYDVQQGEwJVUzEYMBYGA1UEChMPVS5TLiBHb3Zl\n' +
    'cm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNVBAsTA1BLSTEVMBMGA1UEAxMMRE9E\n' +
    'IFNXIENBLTYwMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA/MzAiiVC\n' +
    'G61CNrHuJ+6kXRAlG9ppLKXje1S3mw0LXOynYAyX7OIyFXkeNj54DV/4HTvK4eHd\n' +
    'G8XTfiUr8cqWki2nHPJivaZOKu/jObshywNZ3UAKmtz8bPDO+wJ8QrAxKaQYH4CM\n' +
    'mHlEjetmM7CMRznfMDqjwB9us5Y1FwKPlh+2Y6rdDfU1xR/dGD2iQk4laduxCCr4\n' +
    'ULI7eFFToxnr5rUt95FBi5DlIPs3XETIywIWJ7Z59m0JBrReqKnFZr1NR06DGCOO\n' +
    'YULORCXiZFJlbRMjwvd3BPu+auP39/qq6aKLmTy0iTPflGum94W4bkvupB3r6Vkb\n' +
    'ptNsZrFq0IYZkQIDAQABo4IBXDCCAVgwHwYDVR0jBBgwFoAUbIqUonexgHIdgXoW\n' +
    'qvLczmbuRcAwHQYDVR0OBBYEFH3+8BAXOb/TcoT9rSlw+OI9mfMYMA4GA1UdDwEB\n' +
    '/wQEAwIBhjA9BgNVHSAENjA0MAsGCWCGSAFlAgELJDALBglghkgBZQIBCycwCwYJ\n' +
    'YIZIAWUCAQsqMAsGCWCGSAFlAgELOzASBgNVHRMBAf8ECDAGAQH/AgEAMAwGA1Ud\n' +
    'JAQFMAOAAQAwNwYDVR0fBDAwLjAsoCqgKIYmaHR0cDovL2NybC5kaXNhLm1pbC9j\n' +
    'cmwvRE9EUk9PVENBMy5jcmwwbAYIKwYBBQUHAQEEYDBeMDoGCCsGAQUFBzAChi5o\n' +
    'dHRwOi8vY3JsLmRpc2EubWlsL2lzc3VlZHRvL0RPRFJPT1RDQTNfSVQucDdjMCAG\n' +
    'CCsGAQUFBzABhhRodHRwOi8vb2NzcC5kaXNhLm1pbDANBgkqhkiG9w0BAQsFAAOC\n' +
    'AQEAn4OSx5FWM4e2vd2Igv63CCpfvrQqv5bjuoyQhoIJbEpjx6xtof1SNSwtPDjD\n' +
    'tSawzhabKYTgSajw28zIyJ4TpFUiABOSNkA4aYWvtjjHPKPrIjVTck0DArWH2Lr9\n' +
    'x0dvpCIInDyfIib9dcE0cdGVlEpeAEMQFjpUbmCNpTlKUtSroY8CfZCOmi+Rp/fT\n' +
    '0N9PoO/Izxl1UvHb9xxfu4vasVjt3L/Fu8PIw8GJ70u/Ws+mg3ga8uDOluYn+VDq\n' +
    'O1Le2QJvSK0J9dS21rwV6SCtf+en2Razi0/S44tzOFa4fRdJLHTYPutu69p6+YMh\n' +
    'Sul++7G14BLwhmWa2iRcjw+AlQ==\n' +
    '-----END CERTIFICATE-----\n' +
    '\n'
]

@example
Old email Cert
cert {
  subject: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI', 'OSD' ],
    CN: 'JAMES.BRIAN.D.1411932300'
  },
  issuer: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI' ],
    CN: 'DOD EMAIL CA-59'
  },
  subjectaltname: 'email:BRIAN.D.JAMES@NGA.MIL, othername:<unsupported>',
  infoAccess: [Object: null prototype] {
    'CA Issuers - URI': [ 'http://crl.disa.mil/sign/DODEMAILCA_59.cer' ],
    'OCSP - URI': [ 'http://ocsp.disa.mil' ]
  },
  modulus: 'C409110403DFA25C9856BF76C4B3C83005CEE6CEE6A121F077295727AA69513770D8CEC707623D3FC83C39C7A9C976EBD1DD8BAA851249ACE8E423B1EEE73AD7EAD88B256B757B696BE60566A1110512E58562C27CE7E917652A3212F49FFE497A2EA294C2D3A10B07ADB337E29800D54B022E736CD651EE50177455546A7A15D326BFDB04107485F6F66ED0B27F4F2F7FC21EA212C1B6D62E0E283510D8B447CA7395D94076A0E961E03773A41DAEDD6D2492AA9276097587ABCDE4CC2A6E991137A70B558EBDFB3C96CDE1E38FEFCCB32A39B75BBF349045DDBA18400A2CA74FA538F7B7997FCB6825C3CD3FF7BAFF2902F8D9BA99D50325D6741B763B7669',
  bits: 2048,
  exponent: '0x10001',
  pubkey: <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01 05 00 03 82 01 0f 00 30 82 01 0a 02 82 01 01 00 c4 09 11 04 03 df a2 5c 98 56 bf 76 c4 b3 c8 30 05 ... 244 more bytes>,
  valid_from: 'Jun  8 00:00:00 2020 GMT',
  valid_to: 'Jun  7 23:59:59 2023 GMT',
  fingerprint: '4C:4E:16:C4:4B:5A:B6:11:D0:95:48:99:1A:D9:9D:F5:7A:D8:96:03',
  fingerprint256: '3C:1C:67:DA:E3:7B:E8:03:1F:F8:83:4D:DF:70:B4:D9:23:9E:54:41:B2:88:3C:A1:62:D8:49:49:8C:60:8E:AC',
  ext_key_usage: [
    '1.3.6.1.4.1.311.20.2.2',
    '1.3.6.1.5.5.7.3.2',
    '1.3.6.1.5.5.7.3.4'
  ],
  serialNumber: '03D389',
  raw: <Buffer 30 82 04 f1 30 82 03 d9 a0 03 02 01 02 02 03 03 d3 89 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 5d 31 0b 30 09 06 03 55 04 06 13 02 55 53 31 18 ... 1219 more bytes>
}

@example
Old ID Cert
cert {
  subject: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI', 'OSD' ],
    CN: 'JAMES.BRIAN.D.1411932300'
  },
  issuer: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI' ],
    CN: 'DOD ID CA-59'
  },
  subjectaltname: 'othername:<unsupported>, othername:<unsupported>, URI:urn:uuid:31F35A98-F93C-4941-B41F-F05C3E843401',
  infoAccess: [Object: null prototype] {
    'CA Issuers - URI': [ 'http://crl.disa.mil/sign/DODIDCA_59.cer' ],
    'OCSP - URI': [ 'http://ocsp.disa.mil' ]
  },
  modulus: 'C433E67C902C14EBD7A3CFF2DB307908057AA905156DCC39583FCC486445B33109F66DD947B2B6C4DF8046E86BF8F21582ACC2AD964F83F8ED187B8A0194CD0A1063F2F4D325C1668BC4A85B3F0FD19D6106EF217AEC91F7847B1BA46CE28448C2B0E7D9843F74FA26937EEBA47F2E733179EA10EBC44FAF55A34ADAAECDECA39374705912A73C74D4D80B4238D217885DD4AAB252A5B349961DA8E55CFE3E29D88A4838ECFEAEC50EF07E25E8E2FE75906BB4882187C42A3D2F4C74AFC7A55A009651F262AD44491485C8E034462196C566B8EBC16B197625EBEA3F839745A96BBD5C6EA8C3546B9C1752093CB4EE46D586FBB3C15F0E392FA52AE6A66709B1',
  bits: 2048,
  exponent: '0x10001',
  pubkey: <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01 05 00 03 82 01 0f 00 30 82 01 0a 02 82 01 01 00 c4 33 e6 7c 90 2c 14 eb d7 a3 cf f2 db 30 79 08 05 ... 244 more bytes>,
  valid_from: 'Jun  8 00:00:00 2020 GMT',
  valid_to: 'Jun  7 23:59:59 2023 GMT',
  fingerprint: '3F:E7:1B:1C:70:16:9A:EC:E3:C6:25:C5:A6:83:6A:3D:D9:A4:50:E4',
  fingerprint256: '23:F5:DA:7C:EC:A1:33:94:16:BA:63:7F:3A:DC:21:68:D9:72:C3:E1:16:EC:D0:AF:2B:53:67:AB:5A:7E:FD:1B',
  ext_key_usage: [ '1.3.6.1.4.1.311.20.2.2', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '03000D8D',
  raw: <Buffer 30 82 05 35 30 82 04 1d a0 03 02 01 02 02 04 03 00 0d 8d 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 5a 31 0b 30 09 06 03 55 04 06 13 02 55 53 31 ... 1287 more bytes>
}
cert {
  subject: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI', 'OSD' ],
    CN: 'JAMES.BRIAN.D.1411932300'
  },
  issuer: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI' ],
    CN: 'DOD ID CA-59'
  },
  subjectaltname: 'othername:<unsupported>, othername:<unsupported>, URI:urn:uuid:31F35A98-F93C-4941-B41F-F05C3E843401',
  infoAccess: [Object: null prototype] {
    'CA Issuers - URI': [ 'http://crl.disa.mil/sign/DODIDCA_59.cer' ],
    'OCSP - URI': [ 'http://ocsp.disa.mil' ]
  },
  modulus: 'C433E67C902C14EBD7A3CFF2DB307908057AA905156DCC39583FCC486445B33109F66DD947B2B6C4DF8046E86BF8F21582ACC2AD964F83F8ED187B8A0194CD0A1063F2F4D325C1668BC4A85B3F0FD19D6106EF217AEC91F7847B1BA46CE28448C2B0E7D9843F74FA26937EEBA47F2E733179EA10EBC44FAF55A34ADAAECDECA39374705912A73C74D4D80B4238D217885DD4AAB252A5B349961DA8E55CFE3E29D88A4838ECFEAEC50EF07E25E8E2FE75906BB4882187C42A3D2F4C74AFC7A55A009651F262AD44491485C8E034462196C566B8EBC16B197625EBEA3F839745A96BBD5C6EA8C3546B9C1752093CB4EE46D586FBB3C15F0E392FA52AE6A66709B1',
  bits: 2048,
  exponent: '0x10001',
  pubkey: <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01 05 00 03 82 01 0f 00 30 82 01 0a 02 82 01 01 00 c4 33 e6 7c 90 2c 14 eb d7 a3 cf f2 db 30 79 08 05 ... 244 more bytes>,
  valid_from: 'Jun  8 00:00:00 2020 GMT',
  valid_to: 'Jun  7 23:59:59 2023 GMT',
  fingerprint: '3F:E7:1B:1C:70:16:9A:EC:E3:C6:25:C5:A6:83:6A:3D:D9:A4:50:E4',
  fingerprint256: '23:F5:DA:7C:EC:A1:33:94:16:BA:63:7F:3A:DC:21:68:D9:72:C3:E1:16:EC:D0:AF:2B:53:67:AB:5A:7E:FD:1B',
  ext_key_usage: [ '1.3.6.1.4.1.311.20.2.2', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '03000D8D',
  raw: <Buffer 30 82 05 35 30 82 04 1d a0 03 02 01 02 02 04 03 00 0d 8d 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 5a 31 0b 30 09 06 03 55 04 06 13 02 55 53 31 ... 1287 more bytes>
}

@example 
New ID Cert

cert {
  subject: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI', 'CONTRACTOR' ],
    CN: 'SCHERER.DALE.JOSEPH.1273353794'
  },
  issuer: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI' ],
    CN: 'DOD ID CA-59'
  },
  subjectaltname: 'othername:<unsupported>, othername:<unsupported>, URI:urn:uuid:7F87A37D-88D5-44DC-8E63-B60A2B5E10DE',
  infoAccess: [Object: null prototype] {
    'CA Issuers - URI': [ 'http://crl.disa.mil/sign/DODIDCA_59.cer' ],
    'OCSP - URI': [ 'http://ocsp.disa.mil' ]
  },
  modulus: 'A368B7FCC19FC346616F315718378A894BD96DC6036C6111033F868B4CBB21B6558E6F3B9999F548F4F82EB2BC3935E98F295C70504F23C97D849B9078ED7F2C2315BA4D8E69F7FF740FF5A28BD9A697D709904C35B0DE7DDBC90B658FAF337D79D78874E887B5D86C96CF2E47D75B1F466191CCC73A85E19ADF3C0FF1F63707054819BEC2C616F2A114E9E8AFB7823A463B637F010B5E044DDF87439BB3D04FAEF69E1C60512A8D3B3E82604B8A6968B8848BFA9766140A729D7E02EC7148873E31DA7B215C8E37CF3C045434D1C9115BA69C9EA6370614F20EF3D7A408692EACAF86ED82825C10126083A20242B78BBD8E1A798B84016D59E2BF525C973EF3',
  bits: 2048,
  exponent: '0x10001',
  pubkey: <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01 05 00 03 82 01 0f 00 30 82 01 0a 02 82 01 01 00 a3 68 b7 fc c1 9f c3 46 61 6f 31 57 18 37 8a 89 4b ... 244 more bytes>,
  valid_from: 'Nov 24 00:00:00 2021 GMT',
  valid_to: 'Aug 31 23:59:59 2023 GMT',
  fingerprint: '27:AF:BC:AA:14:48:03:E2:56:38:04:33:05:CB:72:57:C6:87:9F:C7',
  fingerprint256: '80:E1:CE:64:49:33:24:AA:17:8B:AC:FD:53:52:31:64:64:D6:B4:6C:F7:69:62:4C:A8:03:10:74:68:84:A4:24',
  ext_key_usage: [ '1.3.6.1.4.1.311.20.2.2', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '011CFEF4',
  raw: <Buffer 30 82 05 43 30 82 04 2b a0 03 02 01 02 02 04 01 1c fe f4 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 5a 31 0b 30 09 06 03 55 04 06 13 02 55 53 31 ... 1301 more bytes>
}
cert {
  subject: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI', 'CONTRACTOR' ],
    CN: 'SCHERER.DALE.JOSEPH.1273353794'
  },
  issuer: [Object: null prototype] {
    C: 'US',
    O: 'U.S. Government',
    OU: [ 'DoD', 'PKI' ],
    CN: 'DOD ID CA-59'
  },
  subjectaltname: 'othername:<unsupported>, othername:<unsupported>, URI:urn:uuid:7F87A37D-88D5-44DC-8E63-B60A2B5E10DE',
  infoAccess: [Object: null prototype] {
    'CA Issuers - URI': [ 'http://crl.disa.mil/sign/DODIDCA_59.cer' ],
    'OCSP - URI': [ 'http://ocsp.disa.mil' ]
  },
  modulus: 'A368B7FCC19FC346616F315718378A894BD96DC6036C6111033F868B4CBB21B6558E6F3B9999F548F4F82EB2BC3935E98F295C70504F23C97D849B9078ED7F2C2315BA4D8E69F7FF740FF5A28BD9A697D709904C35B0DE7DDBC90B658FAF337D79D78874E887B5D86C96CF2E47D75B1F466191CCC73A85E19ADF3C0FF1F63707054819BEC2C616F2A114E9E8AFB7823A463B637F010B5E044DDF87439BB3D04FAEF69E1C60512A8D3B3E82604B8A6968B8848BFA9766140A729D7E02EC7148873E31DA7B215C8E37CF3C045434D1C9115BA69C9EA6370614F20EF3D7A408692EACAF86ED82825C10126083A20242B78BBD8E1A798B84016D59E2BF525C973EF3',
  bits: 2048,
  exponent: '0x10001',
  pubkey: <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01 05 00 03 82 01 0f 00 30 82 01 0a 02 82 01 01 00 a3 68 b7 fc c1 9f c3 46 61 6f 31 57 18 37 8a 89 4b ... 244 more bytes>,
  valid_from: 'Nov 24 00:00:00 2021 GMT',
  valid_to: 'Aug 31 23:59:59 2023 GMT',
  fingerprint: '27:AF:BC:AA:14:48:03:E2:56:38:04:33:05:CB:72:57:C6:87:9F:C7',
  fingerprint256: '80:E1:CE:64:49:33:24:AA:17:8B:AC:FD:53:52:31:64:64:D6:B4:6C:F7:69:62:4C:A8:03:10:74:68:84:A4:24',
  ext_key_usage: [ '1.3.6.1.4.1.311.20.2.2', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '011CFEF4',
  raw: <Buffer 30 82 05 43 30 82 04 2b a0 03 02 01 02 02 04 01 1c fe f4 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 5a 31 0b 30 09 06 03 55 04 06 13 02 55 53 31 ... 1301 more bytes>
}

*/
	loginClient: (req,cb) => {  
		
		const 
			{ cookie, encrypted, reqSocket, ipAddress, now, headers, cert} = req,
			cookies = req.cookies = {},
			{ Login, host } = SECLINK,
			guest = `guest${ipAddress}@${host}`;

		Trace("login", cert || cookie);
		
		if ( cert ) {		// client on encrypted socket so has a pki cert
			const
				[x,client] = (cert.subjectaltname||"").toLowerCase().split(",")[0].match(/email:(.*)/) || [];

			//Log("client", client);
			if ( client ) {		// found a client
				// Log("CHECKCERT", account, cookie, cookies);

				// Log("cert>>>", cert, admitRules);

				if ( now < new Date(cert.valid_from) || now > new Date(cert.valid_to) )
					cb( null );

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

				Login( client, function guestSession(err,prof) { // no-authentication guest session
					//Log("login", err, prof);
					cb( err ? null : prof );
				});
			}

			else
				cb( null );
		}
		
		else {
			if ( cookie ) 						//  providing cookie to define client profile
				cookie.split("; ").forEach( cook => {
					const [key,val] = cook.split("=");
					if ( val != "undefined" ) cookies[key] = val;
				});

			//Log(">>>>>>>>>>>>>>>>>>cookies", cookie, cookies);
		
			Login( cookies.session || guest, function guestSession(err,prof) { // no-authentication session
				cb( err ? null : prof );
			});
		}
	},
		
/**
Start a dataset thread.  

In phase 1/3 of the session setup, the following is added to this request:

	cookie: "...."		// client cookie string
	agent: "..."		// client browser info
	ipAddress: "..."	// client ip address
	referer: "proto://domain:port/query"	//  url during a cross-site request
	method: "GET|PUT|..." 			// http request method
	now: date			// date stamp when requested started
	post: "..."			// raw body text
	url	: "/query"		// requested url path
	reqSocket: socket	// socket to retrieve client cert 
	resSocket: socket	// socket to accept response
	cert: {...} 		// full client cert

In phase 2/3 of the session setup, the following is added:

	log: {...}			// info to trap socket stats
	client: "..."		// name of client from cert or "guest"
	profile: {...},		// client profile after login
	host: "proto://domain:port"	// requested host 
	action: "select|update| ..."	// corresponding crude name
	encrypted: bool		// true if request on encrypted server
	site: {...}			// site info

In phase 3/3 of the the session setup, the following is added:

	{query,index,flags,where} and {sql,table,area,path,type} 

@param {Object} req Totem endpoint request
@param {Function} cb callback(revised req)
*/
	dsThread: (req,cb) => {
		sqlThread( sql => {	// start a sql thread for this dataset
			const
				{ logSession } = sqls,
				{ ipAddress, method, client, table } = req;
			
			//Log(ipAddress,method,client,table);
			
			if ( logSession )	// optional logging of connections
				sql.query(logSession, [{
					IPsession: ipAddress
				}, {
					Client: client
				}] );

			req.ds = ( tableRoutes[table] || (req => `app.${table}`) ) (req);
			req.sql = sql;
			req.action = crudIF[method];			// crud action being requested
			
			cb(req);
		});
	},

/**
*/
	tableRoutes: {	// setup default DataSet routes
	},
	
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
	routeAgent: (req,res) => {
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
				{ area, table, path, flags, type } = req;

			Trace( route.name.toUpperCase(), path );

			if ( area || !table ) // routing a file or no endpoint 
				/* trap for legacy socket.io 
				if ( area == "socket.io" && !table)	// ignore keep-alives from legacy socket.io 
					Trace("HUSH SOCKET.IO");

				else	// send file
				*/
				route( req, txt => res(txt) );

			else {
				//Trace("log check", req.area, req.reqSocket?true:false, req.log );
				if ( logMetrics )
					logSession( req.reqSocket );  

				route(req, recs => {	// route request and capture records
					if ( recs ) 
						if ( filter = filters[type] )  // process record conversions
							if ( recs.forEach )
								filter(recs, req, res);
					
							else
								res(recs);
						
						else
							res(recs);

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

				Trace( "check "+type, Access, power[Access], minPower );
				cb( power[Access] >= minPower );
			});
			}
		}
		*/

		function cleanParms() {	// cleanup the query and body parms
			const
				{ query, where, body, index, flags, client } = req,				  
				queryStrip = {	 			//< Flags to queryStrip from request
					"":1, 
					"_":1, 
					leaf:1, 
					_dc:1
				}, 		
				idKey = "ID", 					//< db record id
				flagPrefix = "_";			//< Prefix that indicates a field is a flag
				  
				//{ queryStrip, flagPrefix, flagTrap, idKey } = filterFlag;

			for (var key in query) 		// strip or remap bogus keys
				if ( key in queryStrip )
					delete query[key];

			/*
			for (var key in flags) 	// trap special flags
				if ( trap = flagTrap[key] )
					trap(req);
			*/

			if (flagPrefix)
				for (var key in body) 		// remap body flags
					if ( key.startsWith(flagPrefix) ) {  
						flags[key.substr(1)] = body[key]+"";
						delete body[key];
					}

			if (idKey in body) {  			// remap body record id
				where["="][id] = query[id] = body[id]+""; 
				delete body[id];
			}

			for (var key in query) 		// strip or remap bogus keys
				if ( key in queryStrip )
					delete query[key];

			/*
			for (var key in flags) 	// trap special flags
				if ( trap = flagTrap[key] )
					trap(req);
			*/
			
			/*
			for (var key in body) 		// remap body flags
				if ( key.startsWith(flagPrefix) ) {  
					flags[key.substr(1)] = body[key]+"";
					delete body[key];
				}*/

			/*if (id in body) {  			// remap body record id
				where["="][id] = query[id] = body[id]+""; 
				delete body[id];
			}*/

			//Log({f: flags, q:query, b:body, i:index, w:where});
		}
		
		dsThread( req, req => {	// start a dataset thread
			const 
				mimes = MIME.types,
				{area,table,action,path,type,ds} = req;

			//req.host: $master.protocol+"//"+Req.headers["host"];		// domain being requested
			req.encrypted = isEncrypted();			// on encrypted worker
			req.site = site;							// site info
			req.mime = mimes[ type ] || mimes.html;
			
			cleanParms();
			
			//Log({a:area, t:table, p: path, ds: ds, act: action});

			if ( area || !table ) 	// send file
				followRoute( function send(req,res) {	// provide a route to send a file
					const
						{area,table,type,path} = req;

					if ( path.endsWith("/") ) 		// requesting folder
						if ( route = byArea[area] || byArea.default )
							route(req,res);

						else
							res( errors.noRoute );

					else {	// requesting file						
						const
							file = table+"."+type,
							{ never } = cache,
							neverCache = never[file] || never[area];

						//Trace("cache", file, "never=", neverCache, "cached=", path in cache);

						if ( path in cache )
							res( cache[path] );

						else
							readFile( "."+path, (err,txt) => {
								if ( !neverCache ) cache[path] = txt; 
								res( err ? "Error: no file" : txt);
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
	},

/**
Start watchdogs
*/
	startDogs: (sql,dogs) => {
		sql.query(
			"SELECT * FROM openv.dogs WHERE Enabled AND Every")
		
		.on("result", task => {
			//Trace(">>>>dog", task, dogs[task.Name], every", task.Every);
			if ( dog = dogs[task.Name.toLowerCase()] )
				sql.queueTask( new Clock("totem",task.Every), {
					Client: "totem",
					Name: task.Name,
					Class: "totem",
					Task: "watchdog",
					Notes: task.Description
				}, (recs,job,res) => {
					Trace(">>>dog", job);
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
		pretty: err => {
			return "".tag("img",{src:"/icons/errors/reject.jpg",width:40,height:60})
				+ (err+"").replace(/\n/g,"<br>").replace(process.cwd(),"").replace("Error:","")
				+ ". " + [
					"Issues".link( "/issues" ),
					"Browse".link( "/home/" ),
					"Site".link( "/site" ),
					"API".link( "/api" )
				].join(" || ");
		},
		noPost: new Error("missing post keys"),
		badMethod: new Error("unsupported request method"),
		noRoute: new Error("no route found"),
		noDB: new Error("database unavailable"),
		badReturn: new Error("no data returned"),
		noEndpoint: new Error("endpoint disabled"),
		noID: new Error("missing record id"),
		badCert: new Error("invalid PKI credentials"),
		badLogin: new Error("login failed"),
		//isBusy: "Too busy",
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
				host = ENV.URL_MASTER,
				docEditpoints = false,
				docNotebooks = false;
			
			if ( docEditpoints ) // document endpoints			
				//Stream(byTable, {}, (val,skey,cb) => {	// system endpoints
				Object.keys(byTable).stream( (vkey,skey,cb) => {
					const val = byTable[vkey];
					
					//Log("docendpt", vkey, val);
					
					//Trace("build doc", host, cb?"stream":"end", skey);
					
					if ( cb ) // streaming ... scan endpoint
						if ( val.name == "sysNav" ) 
							cb( "Navigator".replace(/\n/mg,"<br>") );

						else
							Fetch( `${host}/${skey}.help`, doc => {
								//Trace(">>>>doc",skey,"=>",doc);
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

		The session request is constructed in 3 phases: reqThread, resThread, then dsThread.
		As these phases are performed, the request hash req is extended.

		@param {Function} agent callback(req,res) to handle session request-response 
		*/
		function configService(init) {  	//< configure, create, then start the server

			/**
			Create and start the HTTP/HTTPS server.  If starting a HTTPS server, the truststore
			is scanned for PKI certs.
			*/
			function createServer() {		//< create and start the server
				
				const 
					{ crudIF,name,cache,trustStore,certs } = TOTEM,
					{ secureIO, dogs, guard, guards, proxy, proxies, cores, sendMail } = TOTEM,
					port = (isMaster ? $master.port : $worker.port) || 443;

				//Trace( "create server on", isMaster, port, $master, $worker );

				certs.totem = {  // totem service certs
					pfx: FS.readFileSync(`${paths.certs}${name}.pfx`),
					//key: FS.readFileSync(`${paths.certs}${name}.key`),
					//crt: FS.readFileSync(`${paths.certs}${name}.crt`)
				};

				//Trace("enc>>>", isEncrypted(), paths.certs+"truststore" );
				
				// Setup master only
				
				if (isMaster) {
					CLUSTER.on('exit', (worker, code, signal) =>  Trace("WORKER TERMINATED", code || errors.ok));

					CLUSTER.on('online', worker => Trace("WORKER CONNECTED"));

					// create workers
					for (var core = 0; core < cores; core++) CLUSTER.fork();

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
						"AT MASTER " + site.master,
						"AT WORKER " + site.worker,
						"FROM " + process.cwd(),
						"WITH " + (guard?"GUARDED":"UNGUARDED") + " THREADS",
						"WITH "+ (secureIO ? "SECURE" : "INSECURE") + " LINKS",
						"WITH " + (site.sessions||"UNLIMITED") + " CONNECTIONS",
						"WITH " + (cores ? cores + " WORKERS" : "NO WORKERS"),
						"WITH " + JSON.stringify(site.pocs) + " POCS"
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
									//Trace(">>>proxy", proxy, html.length);
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
												//Trace("table",idx); 
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
											Trace("ignoring proxy", proxy);
									}

									Trace("SET PROXIES", recs);
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
				
				// Setup master and workers
	
				/*
				Establishes a secureIO if enabled and process guards to 
				trap master/worker process faults.  
				*/
				
				Each( FS.readdirSync(paths.certs+"truststore"), (n,file) => {
					if (file.indexOf(".crt") >= 0 || file.indexOf(".cer") >= 0) {
						Trace( "TRUST", file);
						trustStore.push( FS.readFileSync( `${paths.certs}truststore/${file}`, "utf-8") );
					}
				});

				if ( secureIO )		// setup secure link sessions with a guest profile
					sqlThread( sql => {
						sql.query( "SELECT * FROM openv.profiles WHERE Client='Guest' LIMIT 1", [], (err,recs) => {
							Trace( recs[0] 
								? "Guest logins enabled"
								: "Guest logins disabled" );

							SECLINK.config( Copy(secureIO, {
								server: server,
								sqlThread: sqlThread,
								notify: sendMail,
								guest: recs[0]
							}) );

							secureIO.sio = SECLINK.sio;
							Trace("SecureLink "+(secureIO.sio ? "started" : "failed"));
						});
					});
				
				else
					Trace("SecureLink disabled");

				if (guard)  { // catch core faults
					process.on("uncaughtException", err => Trace( "FAULTED" , err) );

					process.on("exit", code => Trace( "HALTED", code ) );

					for (var signal in guards)
						process.on(signal, () => Trace( "SIGNALED", signal) );
				}
				
				if ( isEncrypted() )
				Log( "SERVER CERTS", certs, "SERVER PORT", port);

				const
					{ initialize } = TOTEM,
					server = TOTEM.server = isEncrypted() 
						? HTTPS.createServer({
							passphrase: TOTEM.certPass,		// passphrase for pfx
							pfx: certs.totem.pfx,			// pfx/p12 encoded crt and key 
							ca: trustStore,					// list of pki authorities (trusted serrver.trust)
							crl: [],						// pki revocation list
							requestCert: true,
							rejectUnauthorized: true,
							secureProtocol: 'TLSv1_2_method',
							//secureOptions: CONS.SSL_OP_NO_TLSv1_0
						})	// using encrypted services so use https 			
						: HTTP.createServer();		  // using unencrpted services so use http 

				attachAgent( server, port, (req,res) => {	// attach this (req,res)-router
					
					loginClient(req, prof => {	// get client profile
						if (prof) {			// client accepted so start session
							req.client = prof.Client;
							req.profile = prof;
							
							routeAgent(req,res);
						}

						else
							res( errors.badLogin );
					});
							
				}, () => initialize(init) );
			}

			const
				{name} = TOTEM,
				pfx = `${paths.certs}${name}.pfx` ;

			Trace( isEncrypted() ? `STARTING ${name} USING CERT ${pfx}` : `STARTING ${name}` );

			if ( busy.maxlag ) {
				BUSY.maxLag(busy.maxlag);
				BUSY.interval(busy.interval);
			}
			
			else
				BUSY = () => false;
			
			if ( isEncrypted() )   // get a pfx cert if protecting an encrypted service
				FS.access( pfx, FS.F_OK, err => {
					if (err) // create self-signed cert then connect
						createCert(	`${paths.certs}${name}`, TOTEM.certPass, () => {
							createServer();
						});	

					else // got the pfx so connect
						createServer();
				});

			else 
				createServer();
		}

		const
			{name} = TOTEM;
		
		Trace(`CONFIGURING ${name} WITH ENDPOINTS`, paths.userEndpts); 

		if (opts) Copy(opts, TOTEM, ".");

		try {
			addEndpoints( require(paths.userEndpts) );
		}
		
		catch (err) {
			Trace("ENDPOINTS DEFAULTED");
		}
		
		Each( paths.mimes, (key,val) => {	// extend or remove mime types
			if ( val ) 
				MIME.types[key] = val;
			else
				delete MIME.types[key];
		});

		sqlThread( sql => {
			setContext(sql, () => configService(cb));
		});	
		
		return TOTEM;
	},

/**
*/
	initialize: init => {
		if ( init ) sqlThread( sql => init(sql) );
	},
	
	queues: JSDB.queues, 	// pass along
		
/**
Methods available when Task Sharding 
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

			//Trace(depth,key, index, N, lastIndex);
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

									//Trace(path, err, stats);
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
			Trace("watch file", err);
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

		const 
			truststore = `${paths.certs}truststore`,
			pfx = path + ".pfx",
			key = path + ".key",
			crt = path + ".crt",
			ppk = path + ".ppk";

		Trace( "CREATE SELF-SIGNED CERT", path );	

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
	certPass: ENV.SERVICE_PASS || "",
		
/**
*/
	isEncrypted: () => ( isMaster ? $master.protocol : $worker.protocol ) == "https:",

/**
Host information: https encryption passphrase,
domain name of workers, domain name of master.
@cfg {String} [name="Totem"]
*/	

/**
Site context extended by the mysql derived query when service starts
@cfg {Object} 
*/
	site: {  	//< reserved for derived context vars
		nick: "totem",
		socketio: 
			"/socketio/socketio-client.js",		// good socketio
			//  "/socket.io/socket.io-client.js",	// buggy socket.io

		started: new Date(),
		
		$master: $master,
		$worker: $worker,
			
		worker:  worker, 
		master:  master,
		domain: $master.hostname,
		host: 	$master.host,
		
		pocs: {
			admin: "admin@tbd.org",
			overlord: "overlord@tbd.org",
			super: "super@tbd.org",
			user: "user@tbd.org"
		},
			
		by: "ACMESDS".link( ENV.BY || "http://BY.undefined" ),
		
		//tag: (src,el,tags) => src.tag(el,tags),

		explorer: {
			Root: "/root/", 
			Earth: "http://${domain}:8083/Apps/totem_index.html", 
			Graph: "http://${domain}:7474/neo4j", 
			Streets: "http://${domain}:3000/", 
			Process: "http://${domain}:1880/", 
			Totem: "/brief.view?_project=totem",  
			Notebooks: "/notebooks.html", 
			API: "/api.view", 
			SkinGuide: "/skinguide.view", 
			JIRA: ENV.JIRA || "JIRA.undefined", 
			RAS: ENV.RAS || "RAS.undefined",
			Repo: ENV.REPO || "REPO.undefined",
			Survey: "/survey.view",
			Calendar: "/test.view"
		},
		
		sitemap: [
			{a: "[Terms](xxx:/terms.view)" ,	
			 b: "[Issues](xxx:/issues.view)", 
			 c: "[Employee Portal](xxx:/portal.view)",
			 d: "[Facebook](https://facebook.com/?goto=totem)",
			 e: "[Leaders](xxx:/sponsors?level=leader)",
			 f: "[Federated Repo](http://github.com/totemstan/dockify)"
			},
			{a: "[Privacy](xxx:/privacy.new)",	
			 b: "[API](xxx:/api.view)",
			 c: "[Contact Us](xxx:/contact.view)",
			 d: "[Twitter](https://twitter.com/?goto=totem)",
			 e: "[Corporate](xxx:/sponsors?level=corporate)",
			 f: "[DEBE Repo](https://github.com/totemstan/debe)"
			},
			{a: "[News](xxx:/news.view)",
			 b: "[Skinning](xxx:/skinguide.view)",
			 c: "[Career Opportunities](xxx:/contact.view)",
			 d: "[Instagram](http://instagram.com?goto=totem)",
			 e: "[Platinum](http://xxx:/sponsors?level=platinum)",
			 f: "[TOTEM Repo](https://github.com/totemstan/totem)"
			},
			{a: "[Community](http://totemstan.github.io)",
			 b: "[Status](xxx:/status.view)",
			 c: "[History](http://intellipedia/swag)",
			 d: "[Telegram](https://telegram.com?goto=totem)",
			 e: "[Honorable](xxx:/sponsors?level=member)"
			},
			{b: "[Briefing](xxx:/brief.view?name=totem)",
			 d: "[SubStack](http://substack.com?goto=totem)"
			},
			{b: "[Restart](xxx:/restart) ", 
			 d: "[WeChat](http://wechat.com?goto=totem)"
			},
			{b: "[Notices](xxx:/email.view)",
			 d: "[Parler](http://Parler.com?goto=totem)"
			}
		].gridify({
			a:"Site",
			b:"Usage",
			c:"Corporate",
			d:"Follow Us",
			e:"[Sponsorships](xxx:/likeus)".linkify(),
			f:"Fork" }).replace(/xxx:/g, ""),
		
/**
Title ti to fileName fn
@method hover
@memberof Skinning
*/
		hover: (ti,fn) => {
			if ( ! fn.startsWith("/") ) fn = "/config/shares/hover/"+fn;
			return ti.tag("p",{class:"sm"}) 
				+ (
						 "".tag("img",{src:fn+".jpg"})
					+ "".tag("iframe",{src:fn+".html"}).tag("div",{class:"ctr"}).tag("div",{class:"mid"})
				).tag("div",{class:"container"});
		},
		tag: (arg,el,at) => arg.tag(el,at),
		link: (arg,to) => arg.tag("a",{href:to}),
		get: (recs,idx,ctx) => recs.get(idx,ctx),
		gridify: (recs,rehead,style) => recs.gridify(rehead,style),
		invite: d => "Invite".tag("button",{id:"_invite",onclick:"alert(123)"}) + d.users + " AS " + d.roles,
		embed: (url,w,h) => {
			const
				keys = {},
				[urlPath] = url.parsePath(keys,{},{},{}),
				urlName = urlPath,
				W = w||keys.w||400,
				H = h||keys.h||400,
				urlType = "",
				x = urlPath.replace(/(.*)\.(.*)/, (str,L,R) => {
					urlName = L;
					urlType = R;
					return "#";
				});

			Trace("link", url, urlPath, keys);
			switch (urlType) { 
				case "jpg":  
				case "png":
					return "".tag("img", { src:`${url}?killcache=${new Date()}`, width:W, height:H });
					break;

				case "view": 
				default:
					return "".tag("iframe", { src: url, width:W, height:H });
			}
		},
		
		banner: "",	// disabled
		
		info: {
		},
		
		mods: ["totem","enums","jsdb","socketio","securelink"],
		
		reqts: {   // defaults
			js:  ["nodejs-12.14.0", "machine learning library-1.0".tag( "https://sc.appdev.proj.coe.ic.gov://acmesds/man" )].join(", "),
			py: "anconda2-2019.7 (iPython 5.1.0 debugger), numpy 1.11.3, scipy 0.18.1, utm 0.4.2, Python 2.7.13",
			m: "matlab R18, odbc, simulink, stateflow",
			R: "R-3.6.0, MariaDB, MySQL-connector"
		},
		
		/*
		match: function (recs,where,get) {
			return recs.match(where,get);
		},
		
		replace: function (recs,subs) {
			return recs.replace(subs);
		}, */
		
/**
Jsonize records.
@memberof Skinning
@param {Array} recs Record source
*/
		json: recs => JSON.stringify(recs)			
	},

/**
Endpoint filters cb(data data as string || error)
@cfg {Object} 
*/
	filters: {  //< record data convertors
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		txt: (recs,req,res) => { //< dataset.txt convert to text
			var head = recs[0], cols = [], cr = String.fromCharCode(13), txt="", list = ",";

			if (head) {
				for (var n in head) cols.push(n);
				txt += cols.join(list) + cr;

				recs.forEach( (rec) => {
					var cols = [];
					for (var key in rec) cols.push(rec[key]);
					txt += cols.join(list) + cr;
				});
			}

			res( txt );
		},

/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		db: (recs, req, res) => {	
			res({ 
				success: true,
				msg: errors.ok,
				count: recs.found || recs.length,
				data: recs
			});
		},
			
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		html: (recs,req,res) => { //< dataset.html converts to html
			res( recs.gridify ? recs.gridify({},{border: "1"}) : recs );
		},
			
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		blog: (recs,req,res) => {  //< renders dataset records
			recs.blog( req, "Description", recs => {
				res({ 
					success: true,
					msg: errors.ok,
					count: recs.found || recs.length,
					data: recs
				});
			});
		},
			
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		csv: (recs, req, res) => {
			JS2CSV({ 
				recs: recs, 
				fields: Object.keys( recs[0]||{} )
			} , function (err,csv) {
					res( err || csv );
			});
		},
		
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		"": (recs,req,res) => res( recs ),
			
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		json: (recs,req,res) => res( recs ),
		
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
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
		*/
		agent: (req,res) => {
			const
				{ query, ipAddress, sql } = req,
				{ port, keys, tasks } = query,
				parsePath = "".parsePath+"";
			
			if (port) {
				Trace("register agent", `${ipAddress}:${port}` , keys );
			
				res(`
String.prototype.parsePath = ${parsePath};

var 
	_attach = ${attachAgent}, 
	_server = require("http").createServer(),
	_port = ${port};

_attach(_server,_port,agents);	
`);
				keys.split(",").forEach( key => {
					sql.query(
						"INSERT INTO openv.agents SET ? ON DUPLICATE KEY UPDATE Connects=Connects+1", [{
							Host: ipAddress,
							Name: key,
							Port: port,
							Connects: 0,
							Uses: 0,
							Util: 0
						}]);
				});
			}

			else
			if (tasks) 
				if (tasks == "all")
					sql.query(
						"SELECT Task,Funded,Classif,Priority,Age FROM openv.queues", [], 
						(err,recs) => res( err ? [] : recs) 
					);

				else
					sql.query(
						"SELECT Task,Funded,Classif,Priority,Age FROM openv.queues WHERE least(?,1) LIMIT ?", [{
							Finished: 0,
							Client: ipAddress,
							Class: 'system'
						}, tasks], (err,recs) => res( err ? [] : recs) 
					);
					
			else
				res( "Error: missing port/jobs key" );
		},
		
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

			res( `Welcome ${client} to ` + nick.link("/site.view") + " on " + "root".link("/root/") );
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
					worker: isMaster ? 0 : CLUSTER.worker.id,
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
							//Trace("reg job" , job);
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

			Trace(">>>Validate", client,guess);

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
				{ sql, flags, client, where, index, table, ds, now } = req;

			//Trace("selDS", ds, index);
			sql.query(	// update db logs if it exits
				"INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1,?", [{
					Op: "select",
					Event: now,
					Dataset: table,
					Client: client
				}, {
					Event: now
				}]);

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
				{ sql, flags, body, where, query, client, ds, table, now } = req,
				post = body[body.name] || {},
				{ sio } = SECLINK;

//Log("update", {w:where, q:query, p:post, t:table, ds: ds});

			if ( isEmpty(post) )
				res( errors.noPost );

			else
			if ( isEmpty(query) )
				res( errors.noID );

			else {
				sql.query(	// update db logs if it exits
					"INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1,?", [{
						Op: "update",
						Event: now,
						Dataset: table+":"+(query.Name||query.name||query.ID),
						Client: client
					}, {
						Event: now
					}]);

				sql.Update(ds, where, post, (err,info) => {

//Log("updated", err, info);
					
					//body.ID = query.ID;
					res( err || post );

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
				{ sql, flags, where, query, body, client, ds, table, now } = req,
				post = body[body.name] || {},
				{ sio } = SECLINK;

			if ( isEmpty(query) )
				res( errors.noID );

			else {
				sql.query(	// update db logs if it exits
					"INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1,?", [{
						Op: "delete",
						Event: now,
						Dataset: table+":"+(query.Name||query.name||query.ID),
						Client: client
					}, {
						Event: now
					}]);

				sql.Delete(ds, where, (err,info) => {
					//body.ID = query.ID;
					res( err || post );

					if ( sio && !err ) // Notify other clients of change
						sio.emit( "delete", {
							ds: table, 
							change: {}, 
							recID: query.ID || -1, 
							by: client
						});	

				});
			}
		},

/**
CRUD endpoint to respond to a insert||PUT request
@cfg {Function}
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		insert: (req, res) => {
			const 
				{ sql, flags, body, client, ds, table, now } = req,
				post = body[body.name] || {},				  
				{ sio } = SECLINK;

Log("insert", post);
			/*Log("insert", {
				type: body.formType,
				startFrag: Buffer.from(body[ body.name ].substr(0,8)).toString("hex"),
				endFrag: Buffer.from(body[ body.name ].substr(-8)).toString("hex")
			});*/
			
			sql.query(	// update db logs if it exits
				"INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1,?", [{
					Op: "insert",
					Event: now,
					Dataset: table+":"+(body.Name||body.name),
					Client: client
				}, {
					Event: now
				}]);
			
			sql.Insert(ds,post,(err,info) => {
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
		view: renderSkin,
		help: renderSkin
	},

/**
By-area endpoint routers {area: method(req,res), ... } for sending/cacheing/navigating files
@cfg {Object} 
*/		
	byArea: {
		icons: 		(req,res) => res( "closed" ),
		uis: 		(req,res) => res( "closed" ),
		clients: 	(req,res) => res( "closed" ),
		captcha: 	(req,res) => res( "closed" ),
			
/**
Default area navigator.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		default: (req,res) => {
			const
				{client,path} = req;

			Fetch( "file:" + path, files => {
				req.type = "html"; // otherwise default type is json.
				if ( files )
					res(
						`${client} ${path}<br>` +
						files.map( file => file.link( file ) ).join("<br>")
					);
						
				else
					res( "nothing here" );	
			});
		},
			
/**
Navigator for root area.
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		root: (req,res) => {
			function sendFolder(res,recs) {
				//console.log(">>>>>>>>>>>>>>>>sending",cmd, recs);
				const
					cwd = {
						mime:"directory",
						ts:now,
						read:1,
						write:1,
						size:0,
						hash: btoa(parent), 
						volumeid:"totem",
						name: parent, 
						locked:0,
						dirs:1,
						isowner: true
					};

				switch (0) {
					case 1: // debug
						res({  
						cwd: { 
							"mime":"directory",
							"ts":1334071677,
							"read":1,
							"write":0,
							"size":0,
							"hash": "/root/",
							"volumeid":"l1_",
							"name":"Demo",
							"locked":1,
							"dirs":1},

						/*"options":{
							"path":"", //"Demo",
							"url":"", //"http:\/\/elfinder.org\/files\/demo\/",
							"tmbUrl":"", //"http:\/\/elfinder.org\/files\/demo\/.tmb\/",
							"disabled":["extract"],
							"separator":"\/",
							"copyOverwrite":1,
							"archivers": {
								"create":["application\/x-tar", "application\/x-gzip"],
								"extract":[] }
						},*/

						files: [{ 
							"mime":"directory",
							"ts":1334071677,
							"read":1,
							"write":0,
							"size":0,
							"hash": "/root/",
							"volumeid":"l1_",
							"name":"Demo",
							"locked":1,
							"dirs":1}].concat([
							/*{  // cwd again
								"mime":"directory",
								"ts":1334071677,
								"read":1,
								"write":0,
								"size":0,
								"hash":"root",
								"volumeid":"l1_",
								"name":"Demo",
								"locked":1,
								"dirs":1},*/

							/*{
							"mime":"directory",
							"ts":1334071677,
							"read":1,
							"write":0,
							"size":0,
							"hash":"root",
							"volumeid":"l1_",
							"name":"Demo",
							"locked":1,
							"dirs":1},*/

							{
								"mime":"directory",
								"ts":1340114567,
								"read":0,
								"write":0,
								"size":0,
								"hash":"l1_QmFja3Vw",
								"name":"Backup",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1310252178,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_SW1hZ2Vz",
								"name":"Images",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1310250758,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_TUlNRS10eXBlcw",
								"name":"MIME-types",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1268269762,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_V2VsY29tZQ",
								"name":"Welcome",
								"phash":"/root/",
								"locked":1,
								"dirs":1},

							{
								"mime":"directory",
								"ts":1390785037,
								"read":1,
								"write":1,
								"size":0,
								"hash":"l2_Lwxxyyzz",
								"volumeid":"l2_",
								"name":"Test here",
								"locked":1},

							{
								"mime":"application\/x-genesis-rom",
								"ts":1310347586,"read":1,
								"write":0,
								"size":3683,
								"hash":"l1_UkVBRE1FLm1k",
								"name":"README.md",
								"phash":"/root/",
								"locked":1}
						]),

						api: "2.0","uplMaxSize":"16M","netDrivers":[],

						debug: {
							"connector":"php",
							"phpver":"5.3.26-1~dotdeb.0",
							"time":0.016080856323242,
							"memory":"1307Kb \/ 1173Kb \/ 128M",
							"upload":"",
							"volumes":[
								{	"id":"l1_",
									"name":"localfilesystem",
									"mimeDetect":"internal",
									"imgLib":"imagick"},

								{	"id":"l2_",
									"name":"localfilesystem",
									"mimeDetect":"internal",
									"imgLib":"gd"}],

							"mountErrors":[]}
					});
						break;

					case 2: // debug
						res({  
							cwd: cwd,

							/*"options":{
								"path":"", //"Demo",
								"url":"", //"http:\/\/elfinder.org\/files\/demo\/",
								"tmbUrl":"", //"http:\/\/elfinder.org\/files\/demo\/.tmb\/",
								"disabled":["extract"],
								"separator":"\/",
								"copyOverwrite":1,
								"archivers": {
									"create":["application\/x-tar", "application\/x-gzip"],
									"extract":[] }
							},*/

							files: [cwd].concat([
								/*{  // cwd again
									"mime":"directory",
									"ts":1334071677,
									"read":1,
									"write":0,
									"size":0,
									"hash":"root",
									"volumeid":"l1_",
									"name":"Demo",
									"locked":1,
									"dirs":1},*/

								/*{
								"mime":"directory",
								"ts":1334071677,
								"read":1,
								"write":0,
								"size":0,
								"hash":"root",
								"volumeid":"l1_",
								"name":"Demo",
								"locked":1,
								"dirs":1},*/

								{
									"mime":"directory",
									"ts":1340114567,
									"read":0,
									"write":0,
									"size":0,
									"hash":"l1_QmFja3Vw",
									"name":"Backup",
									"phash":"/root/",
									"locked":1},

								{
									"mime":"directory",
									"ts":1310252178,
									"read":1,
									"write":0,
									"size":0,
									"hash":"l1_SW1hZ2Vz",
									"name":"Images",
									"phash":"/root/",
									"locked":1},

								{
									"mime":"directory",
									"ts":1310250758,
									"read":1,
									"write":0,
									"size":0,
									"hash":"l1_TUlNRS10eXBlcw",
									"name":"MIME-types",
									"phash":"/root/",
									"locked":1},

								{
									"mime":"directory",
									"ts":1268269762,
									"read":1,
									"write":0,
									"size":0,
									"hash":"l1_V2VsY29tZQ",
									"name":"Welcome",
									"phash":"/root/",
									"locked":1,
									"dirs":1},

								{
									"mime":"directory",
									"ts":1390785037,
									"read":1,
									"write":1,
									"size":0,
									"hash":"l2_Lwxxyyzz",
									"volumeid":"l2_",
									"name":"Test here",
									"locked":1},

								{
									"mime":"application\/x-genesis-rom",
									"ts":1310347586,"read":1,
									"write":0,
									"size":3683,
									"hash":"l1_UkVBRE1FLm1k",
									"name":"README.md",
									"phash":"/root/",
									"locked":1}
							]),

							api: "2.0","uplMaxSize":"16M","netDrivers":[],

							debug: {
								"connector":"php",
								"phpver":"5.3.26-1~dotdeb.0",
								"time":0.016080856323242,
								"memory":"1307Kb \/ 1173Kb \/ 128M",
								"upload":"",
								"volumes":[
									{	"id":"l1_",
										"name":"localfilesystem",
										"mimeDetect":"internal",
										"imgLib":"imagick"},

									{	"id":"l2_",
										"name":"localfilesystem",
										"mimeDetect":"internal",
										"imgLib":"gd"}],

								"mountErrors":[]}
						});
						break;
						
					default:
						res( ( cmd == "tree" )
							? {tree:recs}
							: {
								cwd: cwd, 

								options: {
								   "separator"       : "/",                                     // (String) Path separator for the current volume
								   "disabled"        : [],                                      // (Array)  List of commands not allowed (disabled) on this volume
								   "copyOverwrite"   : 1,                                       // (Number) Whether or not to overwrite files with the same name on the current volume when copy
								   "uploadOverwrite" : 1,                                       // (Number) Whether or not to overwrite files with the same name on the current volume when upload
								   "uploadMaxSize"   : 1073741824,                              // (Number) Upload max file size per file
								   "uploadMaxConn"   : 3,                                       // (Number) Maximum number of chunked upload connection. `-1` to disable chunked upload
								   "uploadMime": {                                              // (Object) MIME type checker for upload
									   "allow": [ "all" ], //[ "image", "text/plain" ],                      // (Array) Allowed MIME type
									   "deny": [], //[ "all" ],                                       // (Array) Denied MIME type
									   "firstOrder": "allow", //"deny"                                     // (String) First order to check ("deny" or "allow")
								   },
							
								  "archivers"       : {                                        // (Object) Archive settings
									 "create"  : [
									   "application/zip",
									 ],                                                   // (Array)  List of the mime type of archives which can be created
									 "extract" : [
									   "application/zip",
									 ],                                                   // (Array)  List of the mime types that can be extracted / unpacked
									 "createext": {
									   "application/zip": "zip",
									 }                                                    // (Object)  Map list of { MimeType: FileExtention }
								  }
								},
								/*
								options: {
									path:"/", //cwdPath,
									url:"/", //"/root/",
									tmbUrl:"/root/.tmb/",
									disabled:["extract"],
									separator: "/",
									copyOverwrite:1,
									archivers: {
										create:["application/x-tar", "application/x-gzip"],
										extract:[] }
								}, */

								files: [cwd].concat(recs),

								api: 2.1057,

								uplMaxFile: 20,
								uplMaxSize:"16M",
								netDrivers:[]

								/*
								debug: true,   //enable client debugger in about info
								debug: {
									connector:"php",
									phpver:"5.3.26-1~dotdeb.0",
									time:0.016080856323242,
									memory:"1307Kb \/ 1173Kb \/ 128M",
									upload:"",
									volumes:[
											{	id:"v1",
												name:"localfilesystem",
												mimeDetect:"internal",
												imgLib:"imagick"},
											{	id:"v2",
												name:"localfilesystem",
												mimeDetect:"internal",
												imgLib:"gd"}],
									mountErrors:[]
								} */
						} );
				}
			}

			function logCommand(cmd, info) {
				if (isString(cmd)) {
					Trace( "file logger", cmd );
					const [op,ds] = cmd.split(" ");
					sql.query("INSERT INTO openv.dblogs SET ? ON DUPLICATE KEY UPDATE Actions=Actions+1,?", [{
						Op: op,
						Dataset: ds,
						Client: client,
						Event: now
					}, {
						Event: now
					}]);
					CP.exec( cmd );
				}
				
				else {
					Trace( "file logger", cmd.name);
					cmd(info);
				}

				return info;
			}
			
			const 
				{sql,query,path,client,body,action,host,area,profile,referer} = req;

			if ( req.type == "help" )
			return res("Navigate folder target=NAME/NAME/... per command cmd=open|tree|file|size|...|null" );

			if ( query.target == "null") delete query.target;
			
			const
				oldSchool = false,
				btoa = b => Buffer.from(b,"utf-8").toString("base64"),
				atob = a => Buffer.from(a,"base64").toString("utf-8"),
				trace = true,
				{cmd,init,tree,src} = body.cmd ? body : query,
				targets = [query["targets[]"] || query.target || btoa(path)].map( tar => atob(tar) ),
				[target] = targets,
				  // parent = target.split("/").slice(0,-1).join("/")+"/",
				  // target || atob(btoa(path||"/root/")), 
				[x,pre,node] = target.match( /(.*)\/(.*)/ ) || ["",parent,""],
				parent = pre + "/",
				parentHash = btoa(parent),
				json = parent.substr(1).replace(/\/\[/g,"[").replace(/\//g,"."),
				now = new Date().getTime();
			
			// https://github.com/Studio-42/elFinder/wiki/Client-Server-API-2.1
			sql.query("SELECT Client,Name FROM openv.engines WHERE ? LIMIT 1", {Name:node}, (err,engs) => {
				const
					eng = engs[0] || {
					  Client: "totem",
					  Name: node
					},
					isOwner = (eng.Client == client) || profile.Overlord || profile.Creator,
					isRead = true,
					isWrite = isOwner,
					isLocked = false;
					  
				if ( trace )
					Trace("nav", {
						cmd: cmd,
						query: query,
						//body: body,
						uphexsnip: Buffer.from( (body["upload[]"]||"").substr(0,8)).toString("hex"),
						upesc: escape( (body["upload[]"]||"" ).substr(0,8)),
						uplen: (body["upload[]"]||"").length,
						path: path,
						tar: target,
						tars: targets,
						src: src,
						act: action,
						json: json,
						parent: parent,
						node: node,
						//prof: profile,
						owner: isOwner
					});

				switch (cmd) {		// look for elFinder commands
					case "tree":	// expanding folder in left paine
					case "open":	// expanding folder 

						if ( src )	// nav json
							/*
							if ( src.endsWith("?") )	// nav folders
								if ( parent.endsWith("=/") ) {	// this is still experimental
									const
										name = parent.split("/").pop(),
										get = "http:"+src.tag("&",{name: name.substr(0,name.length-1), "json:":path.substr(1,path.length-2)});

									Trace("fetch", get );
									Fetch( get, txt => {

										if ( files = JSON.parse(txt)[0].json ) {
											if ( files.forEach ) 
												sendFolder(res, files.map( (file,idx) => {
													const 
														name = "["+idx+"]/",
														nameHash = btoa(parent+name),
														type = !(isArray(file) || isObject(file)),
														info = {
															ts: now,
															size: file.length,
															hash: nameHash, 				// hash name
															name: name, 					// keys name
															phash: parentHash, 				// parent hash name

															read: 1,						// read state
															write: 1,						// write state
															locked: 0,						// lock state
															//tmb: "",						// thumbnail for images
															//alias: "",					// sumbolic link pack
															//dim: "",						// image dims
															isowner: true,				//	had ownership
															//volumeid: "l1_", 				// rec.group,										
														};

													/ *{
														mime: type,	// mime type
														ts:1310252178,		// time stamp format?
														read: 1,				// read state
														write: 0,			// write state
														size: 666,			// size
														hash: nameHash, // parent+name, 
														name: name, // keys name
														phash: parentHash,	// parent
														locked: 0,		// lock state
														//volumeid: type ? "v2_" : "v1_", // rec.group,
														dirs: 1, 			// place inside tree too
													}* /
													return Copy(info, type
														? {
															mime: "application/txt",	// mime type
															dirs: 0, 			// place inside tree too
														}
														: {
															mime: "directory",	// mime type
															dirs: 1, 			// place inside tree too
														} );	
												}));

											else
											if ( isObject(files) ) {
												/ *{
													mime: type,	// mime type
													ts:1310252178,		// time stamp format?
													read: 1,				// read state
													write: 0,			// write state
													size: 666,			// size
													hash: nameHash, //parent+name,
													name: name, // keys name
													phash: parentHash, //parent,
													locked: 0,		// lock state
													//volumeid: type ? "v2_" : "v1_", // rec.group,
													dirs: 1, 			// place inside tree too
												} * /
												Each(files, (idx,file) => {
													const 
														name = `"${idx}"/`,
														nameHash = btoa(parent+name),
														type = !(isArray(file) || isObject(file)),
														info = {
															ts: now,
															size: Object.keys(file).length,
															hash: nameHash, 				// hash name
															name: name, 					// keys name
															phash: parentHash, 				// parent hash name

															read: 1,						// read state
															write: 1,						// write state
															locked: 0,						// lock state
															//tmb: "",						// thumbnail for images
															//alias: "",					// sumbolic link pack
															//dim: "",						// image dims
															//isowner: true,				//	had ownership
															//volumeid: "l1_", 				// rec.group,										
														};

													recs.push( Copy(info, type 
														? {
															mime: "application/txt",	// mime type
															dirs: 0, 			// place inside tree too
														}
														: {
															mime: "directory",	// mime type
															dirs: 1, 			// place inside tree too
														} ));
												});
												sendFolder(res,recs);
											}

											else 
												res(files);
										}

										else
											res("bad src provided");

									});	
								}

								else
									Fetch( "http:"+src+"&name", txt => {
										sendFolder(res, JSON.parse(txt).map( file => {
											const
												name = `${file.name}=/`,
												nameHash = btoa(parent+name);

											return {
												mime: "directory",	// mime type
												dirs: 1, 					// place inside tree too
												ts: now,
												size: Object.keys(file).length,
												hash: nameHash, 				// hash name
												name: name, 					// keys name
												phash: parentHash, 				// parent hash name

												read: 1,						// read state
												write: 1,						// write state
												locked: 0,						// lock state
												//tmb: "",						// thumbnail for images
												//alias: "",					// sumbolic link pack
												//dim: "",						// image dims
												//isowner: true,				//	had ownership
												//volumeid: "l1_", 				// rec.group,										
											};
										}) );
									});

							else	// nav json
							*/
							Fetch( "http:"+src.tag("&",{"json:":json}), txt => {

								if ( files = JSON.parse(txt)[0].json ) {
									if ( files.forEach ) 
										sendFolder(res, files.map( (file,idx) => {
											const 
												name = "["+idx+"]/",
												type = !(isArray(file) || isObject(file));

											return {
												ts: now,
												mime: type ? `application/txt` : "directory",	// mime type
												dirs: type ? 0 : 1, 			// place inside tree too												
												size: file.length,
												hash: btoa(parent+name), 				// hash name
												name: name, 					// keys name
												phash: parentHash, 				// parent hash name
												read: isRead,						// read state
												write: isWrite,					// write state
												locked: isLocked,						// lock state
												isowner: isOwner				// has ownership
												//tmb: "",						// thumbnail for images
												//alias: "",					// sumbolic link pack
												//dim: "",						// image dims
												//volumeid: "l1_", 				// rec.group,										
											};
										}));

									else
									if ( isObject(files) ) {
										const recs = [];
										Each(files, (idx,file) => recs.push( [idx,file] ) );
										sendFolder(res,recs.map( ([idx,file]) => {
											const 
												name = `"${idx}"/`,
												type = !(isArray(file) || isObject(file));

											return {
												ts: now,
												mime: type ? `application/txt` : "directory",	// mime type
												dirs: type ? 0 : 1, 			// place inside tree too												
												size: Object.keys(file).length,
												hash: btoa(parent+name), 				// hash name
												name: name, 					// keys name
												phash: parentHash, 				// parent hash name
												read: isRead,						// read state
												write: isWrite,						// write state
												locked: isLocked,						// lock state
												isowner: isOwner,					// has ownership
												//tmb: "",						// thumbnail for images
												//alias: "",					// sumbolic link pack
												//dim: "",						// image dims
												//volumeid: "l1_", 				// rec.group,										
											};
										}));
									} 

									else 
										res(files);
								}

								else
									res("bad src provided");

							});

						else 		// nav folder
							Fetch( "file:"+target , files => {
								//console.log(">>>>>>>>>>>>>>>>files", files);
								if (files)
									sendFolder(res, files.map( file => {
										const 
											[x,name,type] = file.match(/(.*)\.(.*)/) || ["",file,""];

										switch (type) {
											case "url":
											case "lnk":
												return null;

											default:
												try {
													const 
														stat = FS.statSync( "."+parent+file );

													return {
														ts: now,
														mime: type ? `application/${type}` : "directory",	// mime type
														dirs: type ? 0 : 1, 			// place inside tree too
														size: stat.size,
														hash: btoa(parent+file), //parent+file,	// hash name
														name: file, 					// keys name
														phash: parentHash, 				// parent hash name
														read: isRead,						// read state
														write: isWrite,						// write state
														locked: isLocked,						// lock state
														isowner: isOwner,					// has ownership
														//tmb: "",						// thumbnail for images
														//alias: "",					// sumbolic link pack
														//dim: "",						// image dims
														//volumeid: "l1_", 				// rec.group,										
													};
												}
												
												catch (err) {
													return null;
												}
										}
									}));
								
								else
									sendFolder(res, []);
							});

						break;

					case "file":	// requesting a single file

						if ( src ) 
							res( parent );

						else
							Fetch( "file:"+target, txt => res( txt ) );

						break;

					case "size":
						res({
							size: 222
						});
						break;

					case "abort":
						break;

					case "zipdl":
						res({
							file: "5abf02cc77050",       // key of temporary archive file 
							name: "files.zip", // download file name
							mime: "application/zip"      // MIME type
						});
						break;

					case "rename":
						var 
							{name} = query,
							type = name.split(".").pop();

						res({
							added: targets.map( tar => logCommand( `mv -n .${parent}{${node},${name}}`, {
								ts: now,
								mime: `application/${type}`,	// mime type
								dirs: 0, 						// place inside tree too												
								size: 666,
								hash: btoa(parent+name), 				// hash name
								name: name, 					// keys name
								phash: parentHash, 				// parent hash name
								read: isRead,						// read state
								write: isWrite,						// write state
								locked: isLocked,						// lock state
								isowner: isOwner						// has ownership
							})),
							removed: [btoa(`${parent}{${node}`)]
						});
						break;

					case "resize":
						var 
							name = node,
							type = name.split(".").pop();

						res({
							changed: targets.map( tar => logCommand( `resize .${tar}`, {
								ts: now,
								mime: `application/${type}`,	// mime type
								dirs: 0, 						// place inside tree too												
								size: 666,
								hash: btoa(parent+node), 		// hash name
								name: name, 					// keys name
								phash: parentHash, 				// parent hash name
								read: isRead,						// read state
								write: isWrite,						// write state
								locked: isLocked,						// lock state
								isowner: isOwner						// has ownership
							}))
						});
						break;

					case "rm":
						res({
							removed: targets.map( tar => logCommand( `rm .${tar}`, btoa(tar) ))
						});
						break;

					case "url":
						res({
							url: target
						});
						break;

					case "search":
						res({
							files: []
						});
						break;

					case "ping":
						res("");
						break;

					case "ls":
						res({
							list: []
						});
						break;

					case "upload":
						var
							name = body.filename,
							type = name.split(".").pop(),
							data = body["upload[]"],
							tarFile = "."+atob(body["upload_path[]"])+name;

						Trace("upload", {
							tar: atob(body.target),
							fnname: body.filename,
							path: atob(body["upload_path[]"]),
							tarFile: tarFile,
							type: body.mimeType
						});
						res({
							added: [tarFile].map( tar => logCommand( function uploadFile(info) {
								FS.writeFile( tarFile, data, "utf-8", err => Trace("upload", err||"ok") );
							}, {
								ts: now,
								mime: `application/"${type}`,	// mime type
								dirs: 0, 						// place inside tree too												
								size: data.length,
								hash: btoa(parent+name), 		// hash name
								name: name, 					// file name
								phash: parentHash, 				// parent hash name
								read: isRead,					// read state
								write: isWrite,					// write state
								locked: isLocked,				// lock state
								isowner: isOwner				// has ownership
							}))
						});
						break;

					case "paste":
					case "duplicate":
						var
							name = `copy_${node}`,
							type = name.split(".").pop();

						res({
							added: targets.map( tar => logCommand( `cp -n .${tar} .${parent}${name}`, {
								ts: now,
								mime: `application/${type}`,	// mime type
								dirs: 0, 						// place inside tree too												
								size: body["upload[]"].length,
								hash: btoa(parent+name), 		// hash name
								name: name, 					// keys name
								phash: parentHash, 				// parent hash name
								read: isRead,						// read state
								write: isWrite,						// write state
								locked: isLocked,						// lock state
								isowner: isOwner						// has ownership
							}))
						});
						break;

					case "archive":
						var 
							{name} = query,
							type = name.split(".").pop();

						res({
							added: targets.map( tar => logCommand( `zip -r .${parent}${name} .${tar}`, {
								ts: now,
								mime: `application/${type}`,	// mime type
								dirs: 0, 						// place inside tree too												
								size: 666,
								hash: btoa(parent+name), 		// hash name
								name: name, 					// keys name
								phash: parentHash, 				// parent hash name
								read: isRead,						// read state
								write: isWrite,						// write state
								locked: isLocked,						// lock state
								isowner: isOwner						// has ownership
							}))
						});
						break;

					case "mkdir":
						break;

					case "mkfile":
						var 
							{name} = query,
							type = name.split(".").pop();

						res({
							added: targets.map( tar => logCommand( `touch .${tar}${name}`, {
								ts: now,
								mime: `application/${type}`,	// mime type
								dirs: 0, 						// place inside tree too												
								size: 0,
								hash: btoa(parent+name), 		// hash name
								name: name, 					// keys name
								phash: parentHash, 				// parent hash name
								read: isRead,						// read state
								write: isWrite,						// write state
								locked: isLocked,						// lock state
								isowner: isOwner						// has ownership
							}))
						});
						break;

					case "parents": // requesting all parents
					case "tmb":
					case "put":
					case "get":
					case "netmount":
					case "info":
					case "editor":
					case "chmod":
					case "callback":
					case "extract":
					case "abort":
						res({
							error: "unsupported command"
						});
						break;

					default:	// request made w/o elFinder
						if ( path.endsWith("/") )	// requesting folder
							if (oldSchool)
								Fetch( "file:"+path , files => {	
									if ( files ) {
										req.type = "html"; // override default json type
										res([[ 
											site.nick.link( "/brief.view?notebook=totem" ),
											client.link( "/login.html" ),
											"API".link( "/api.view" ),
											"Explore".link( "/expore.view" ),
											"Info".link( "/xfan.view?w=1000&h=600&src=/info" ),
											path
										].join(" || ") , files.map( file => {
											if ( file.endsWith(".url") ) {	// resolve windows link
												const
													src = "."+path+file;

												if ( html = cache[src] ) 
													return html;

												else 
													try {
														const
															[x, url] = FS.readFileSync( src, "utf-8").match( /URL=(.*)/ ) || ["",""],
															{href} = URL(url,referer);

														return cache[src] = url ? file.substr(0,file.indexOf(".url")).tag( href ) : "?"+file;
													}

													catch (err) {
														return "?"+file
													}
											}

											else
												return file.link( file );
										}).join("<br>")].join("<br>") );
									}

									else
										res( "folder not found" );
								});
						
							else
								renderJade(`
extends base
append base_parms
	- tech = "elFinder"
	- url = ""
	- query ={}
	- flags = {nomenu:1,edit:0}
	- elFinder_path = "${path}"
`, {}, res );

						else { // requesting file
							Fetch( "file:"+path, res );

							if ( area == "refs" && profile.Track ) {		// track client's download
								//Trace(">>>>>track download", profile );
								sql.query(
									"INSERT INTO openv.bricks SET ? ON DUPLICATE KEY UPDATE Samples=Samples+1",
									{
										Name: path,
										Area: area,
										Client: client
									});
							}
						}
				}
			});

			/*
			areas.forEach( (area,i) => 
				areas[i] = area
					? area.tag( "/"+area+"/" )
					: site.nick.tag( "/xfan.view?src=/info&w=1000&h=600" )
							+ " protecting the warfighter from bad data"
			);

			req.type = "html";
			res( areas.join("<br>") );
			*/
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
		logSession: "UPDATE openv.sessions SET ? WHERE ?",
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
		Trace(`CONTEXTING ${TOTEM.name}`);
	
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
			//Trace(">>>lookups", lookups);
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
			//Trace(">>>Lookups", Lookups);
		});
		*/
		
		/*
		if (users) 
			sql.query(users)
			.on("result", user => site.pocs["user"] = (user.Clients || "").toLowerCase() );
			//.on("end", () => Trace("user pocs", site.pocs) );
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

				//Trace(">>>site",key,val);
				if (key in TOTEM) 
					TOTEM[key] = site[key];
			});
		})
		.on("end", () => {
		
			sql.query(pocs, [], (err,recs) => {
				Log("getpocs", err,recs);
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
	
	Trace("uploading to", sinkPath);

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
					Trace("totem upload error", err);
					sqlThread( sql => {
						sql.query("UPDATE openv.files SET ? WHERE ?", [ {
							_State_Notes: "Upload failed: " + err 
						}, {ID: file.ID} ] );
					});
				});

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
	
	Trace(proxy, pathto);
	
	/ *
	var sock = NET.connect( proxy.port );
	sock.setEncoding("utf-8");
	sock.write("here is some data for u");
	sock.on("data", function (d) {
		Trace("sock rx", d);
		res(d);
	}); * /
	
	var Req = HTTP.request( pathto, function(Res) {
		Trace("==========SETUP", Res.statusCode, Res.headers);
		
		var body = "";

		Res.setEncoding("utf-8");
		Res.on('data', function (chunk) {  // will not trigger unless worker fails to end socket
			body += chunk;
		});

		Res.on("end", function () {
			Trace("=========rx "+body);
			res(body);
		});
		
		Res.on("error", err => {
			Trace("what??? "+err);
		}); 
		
	}); 

	Req.on('error', err => {
		Trace("=========tx "+err);
		res("oh well");
	});
	
	//Trace( "RELAY TX "+JSON.stringify( req.body) );

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
			Trace('  ** START **');
			Trace('<< From client to proxy ', msg.toString());
			var serviceSocket = new net.Socket();
			serviceSocket.connect(parseInt(REMOTE_PORT), REMOTE_ADDR, function () {
				Trace('>> From proxy to remote', msg.toString());
				serviceSocket.write(msg);
			});
			serviceSocket.on("data", function (data) {
				Trace('<< From remote to proxy', data.toString());
				socket.write(data);
				Trace('>> From proxy to client', data.toString());
			});
		});
	});

	server.listen(LOCAL_PORT);
	Trace("TCP server accepting connection on port: " + LOCAL_PORT);
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
				
		attachAgent(Req,Res);
	});
} */

//Log(">>>>fetch oauth", Config.oauthHosts);

async function prime(cb) {
	cb();
}

Start("totem", {
	"??": () =>
		Trace("$", site),
	
	T1: () => 
		Trace("Im simply a Totem interface so Im not even running as a service", {
			default_fetcher_endpts: TOTEM.byTable,
			default_protect_mode: TOTEM.guard,
			default_cores_used: TOTEM.cores
		}),
	
	T2: () =>
		config({
			mysql: null,
			guard: true,
			cores: 2
		}, sql => {

			Trace( 
`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
with 2 workers and the default endpoint routes` );

		}),
		
	T3: () =>
		config(null, sql => {
			Trace( 
`I'm a Totem service with no workers. I do, however, have a mysql database from which I've derived 
my startup options (see the openv.apps table for the Nick="Totem1").  
No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
these files. `
			);
		}),
	
	T4: () =>
		config({
			byTable: {
				dothis: function dothis(req,res) {  //< named handlers are shown in trace in console
					res( "123" );

					Trace("dothis", {
						do_query: req.query
					});
				},

				dothat: function dothat(req,res) {

					if (req.query.x)
						res( [{x:req.query.x+1,y:req.query.x+2}] );
					else
						res( new Error("We have a problem huston") );

					Trace("dothat", {
						msg: `Like dothis, but needs an ?x=value query`, 
						or_query: req.query,
						or_user: req.client
					});
				}
			}
		}, sql => {
			Trace(
`As always, if the openv.apps Encrypt is set for the Nick="Totem" app, this service is now **encrypted** [*]
and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
aka core), Im running unprotected, and have a mysql database.  
[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
associated public NICK.crt and private NICK.key certs it creates.`, {
				my_endpoints: T.byTable
			});
		}),
		
	T5: () =>
		config({
			"secureIO.challenge.extend": 20
		}, sql => {
			Trace(
`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.`, {
				mysql_derived_parms: T.site
			});
		}),
		
	T6: () =>
		config({
			guard: false,	// ex override default 
			cores: 3,		// ex override default

			"byTable.": {  // define endpoints
				test: function (req,res) {
					res(" here we go");  // endpoint must always repond to its client 
					if (isMaster)  // setup tasking examples on on master
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
		}),
		
	T7: () =>
		config({
		}, sql => {				
			Trace( "db maintenance" );

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
		}),
	
	T8: () => 
		config({}, sql => {
			neoThread( neo => {
				const $ = require("./man/man.js");
				neo.cypher( "MATCH (n:gtd) RETURN n", {}, (err,nodes) => {
					Trace("nodes",err,nodes.length,nodes[0]);
					var map = {};
					nodes.forEach( (node,idx) => map[node.n.name] = idx );
					//Log(">map",map);

					neo.cypher( "MATCH (a:gtd)-[r]->(b:gtd) RETURN r", {}, (err,edges) => {
						Trace("edges",err,edges.length,edges[0]);
						var 
							N = nodes.length,	
							cap = $([N,N], (u,v,C) => C[u][v] = 0 ),
							lambda = $([N,N], (u,v,L) => L[u][v] = 0),
							lamlist = $(N, (n,L) => L[n] = [] );

						edges.forEach( edge => cap[map[edge.r.srcId]][map[edge.r.tarId]] = 1 );

						//Trace(">cap",cap);

						for (var s=0; s<N; s++)
							for (var t=s+1; t<N; t++) {
								var 
									{cutset} = $.MaxFlowMinCut(cap,s,t),
									cut = lambda[s][t] = lambda[t][s] = cutset.length;

								lamlist[cut].push([s,t]);
							}

						lamlist.forEach( (list,r) => {
							if ( r && list.length ) Trace(r,list);
						});

					});
				});
			});
		}),
			
	INGTD: () =>
		prime( () => {
			config({name:""}, sql => {
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
		}),
		
	INGTDSCITE: () =>
		prime( () => {
			config({name:""}, sql => {
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
		}),
		
	INMEX: () =>
		prime( () => {
			config({name:""}, sql => {
				sql.ingestFile("./config/stores/_noarch/centam.csv", {
					keys: "Criminal_group varchar(32),_Year int(11),Outlet_name varchar(32),Event varchar(32),Rival_group varchar(32),_Eventid varchar(8)",
					batch: 500,
					//limit: 1000
				}, 'Country == "Mexico"' );
			});
		}),
		
	T11: () =>
		config({name:""}, sql => {
			sql.batch( "gtd", {batch:100}, recs => {
				Trace("streamed", recs.length);
			});
		}),
		
	T12: () =>
		prime( () => {
			config({name:""}, sql => {
				var q = sql.query("SELECT * FROM gtd where(?) LIMIT 1",{"a<":1}, err => Log(err));
				Log(q.sql);
			});
		}),
		
	G1: () =>
		prime( () => {
			var 
				apiKey = "AIzaSyBp56CJJA0FE5enebW5_4mTssTGaYzGqz8", // "nowhere stan" / nowhere1234 / mepila7915@lege4h.com
				searchEngine = "017944666033550212559:c1vclesecjc", // full web engine
				query = "walmart",
				url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngine}&gl=us&q=${query}`;

			config({name:""}, sql => {
				Fetch( url , txt => {
					Log(txt);
				});
			});
		}),
		
	G2: () =>
		config({name:""}, sql => {
			for (var n=0,N=2000; n<N; n++)
				Fetch("mask://www.drudgereport.com", txt => Log(txt.length));
		}),
		
	SC: () => {
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
	}
});

// UNCLASSIFIED
