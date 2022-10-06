# [TOTEM](https://github.com/totem-man/totem)

**TOTEM** provides a barebones web service with the following features:

+ endpoint routing
+ http/https service
+ denial-of-service protection
+ secure link providing encrypted inter-client communications with antibot guard
+ client profiles 
+ PKI encryption and authentication
+ fault protected run states
+ indexing, uploading, downloading and cacheing static files
+ crud interface
+ mysql- and neo4j-database agnosticator
+ task queuing and regulation
+ file polling and services
+ automattic server cert generation
+ task sharding
+ file stream and ingest
+ data fetching with various protocols
+ smartcard reader
  
**TOTEM** defines CRUD (POST, GET, PUT, DELETE) endpoints (aka *NODE*s) to access *DATASET*s, 
*FILE*s or *COMMAND*s:

	DATASET.TYPE ? QUERY
	AREA/PATH/FILE.TYPE ? QUERY
	COMMAND.TYPE ? QUERY

By default, **TOTEM** provides `db | xml | csv | json` *TYPE*s for converting *DATASET*s, 
`riddle | task | ping` *COMMAND*s for validating a session, sharding tasks,
and the `stores | shares` areas for sharing static *FILE*s.

## Manage

	npm install @totemstan/totem	# Install
	npm run start [ ? | $ | ...]	# Unit test
	npm run verminor				# Roll minor version
	npm run vermajor				# Roll major version
	npm run redoc					# Regen documentation

	npm run	startdbs				# Start required database servers
	npm run setprot					# Configure for protected mode
	npm run setdebug				# Configure for debugging mode
	npm run setoper					# Configure for operational mode
	npm run setprod					# Configure for production mode

## Usage

Acquire, otionally configure and start a **TOTEM** server:
	
	const TOTEM = require("@totemstan/totem").config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, sql => {
		console.log( sql ? "look mom - Im running!" : "something evil is lurking" );
	});

where configuration keys follow [ENUMS deep copy conventions](https://github.com/totem-man/enums).


## Program Reference
<details>
<summary>
<i>Open/Close</i>
</summary>
## Modules

<dl>
<dt><a href="#TOTEM.module_String">String</a></dt>
<dd></dd>
<dt><a href="#module_TOTEM">TOTEM</a></dt>
<dd><p>Provides a <a href="https://github.com/totemstan/totem">barebones web service</a>.  This module documented 
in accordance with <a href="https://jsdoc.app/">jsdoc</a>.</p>
<h3 id="env-dependencies">Env Dependencies</h3>
<pre><code>SERVICE_PASS = passphrase to server pki cert
URL_MASTER = URL to master totem service service
URL_WORKER = URL to worker totem service service
SHARD0 = PROTO://DOMAIN:PORT
SHARD1 = PROTO://DOMAIN:PORT
SHARD2 = PROTO://DOMAIN:PORT
SHARD3 = PROTO://DOMAIN:PORT
</code></pre>
</dd>
</dl>

<a name="TOTEM.module_String"></a>

## String
<a name="TOTEM.module_String..parseXML"></a>

### String~parseXML(cb) ⇐ <code>String</code>
Parse XML string into json and callback cb(json)

**Kind**: inner method of [<code>String</code>](#TOTEM.module_String)  
**Extends**: <code>String</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback( json || null if error ) |

<a name="module_TOTEM"></a>

## TOTEM
Provides a [barebones web service](https://github.com/totemstan/totem).  This module documented 
in accordance with [jsdoc](https://jsdoc.app/).

### Env Dependencies

	SERVICE_PASS = passphrase to server pki cert
	URL_MASTER = URL to master totem service service
	URL_WORKER = URL to worker totem service service
	SHARD0 = PROTO://DOMAIN:PORT
	SHARD1 = PROTO://DOMAIN:PORT
	SHARD2 = PROTO://DOMAIN:PORT
	SHARD3 = PROTO://DOMAIN:PORT

**Requires**: <code>module:[enums](https://github.com/totemstan/enums)</code>, <code>module:[jsdb](https://github.com/totemstan/jsdb)</code>, <code>module:[securelink](https://github.com/totemstan/securelink)</code>, <code>module:[socketio](https://github.com/totemstan/socketio)</code>, <code>module:[http](https://nodejs.org/docs/latest/api/)</code>, <code>module:[https](https://nodejs.org/docs/latest/api/)</code>, <code>module:[fs](https://nodejs.org/docs/latest/api/)</code>, <code>module:[constants](https://nodejs.org/docs/latest/api/)</code>, <code>module:[cluster](https://nodejs.org/docs/latest/api/)</code>, <code>module:[child\_process](https://nodejs.org/docs/latest/api/)</code>, <code>module:[os](https://nodejs.org/docs/latest/api/)</code>, <code>module:[stream](https://nodejs.org/docs/latest/api/)</code>, <code>module:[vm](https://nodejs.org/docs/latest/api/)</code>, <code>module:[crypto](https://nodejs.org/docs/latest/api/)</code>, <code>module:[mime](https://www.npmjs.com/package/mime)</code>, <code>module:[xml2js](https://www.npmjs.com/package/xml2js)</code>, <code>module:[toobusy-js](https://www.npmjs.com/package/toobusy-js)</code>, <code>module:[json2csv](https://www.npmjs.com/package/json2csv)</code>, <code>module:[js2xmlparser](https://www.npmjs.com/package/js2xmlparser)</code>, <code>module:[cheerio](https://www.npmjs.com/search?q&#x3D;cheerio)</code>  
**Author**: [ACMESDS](https://totemstan.github.io)  
**Example**  
```js
// npm test T1
// Create simple service but dont start it.
Log({
	msg: "Im simply a Totem interface so Im not even running as a service", 
	default_fetcher_endpts: TOTEM.byTable,
	default_protect_mode: TOTEM.guard,
	default_cores_used: TOTEM.cores
});
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```

* [TOTEM](#module_TOTEM)
    * _static_
        * [.CORS](#module_TOTEM.CORS)
        * [.defaultType](#module_TOTEM.defaultType)
        * [.secureIO](#module_TOTEM.secureIO)
            * [.sio](#module_TOTEM.secureIO.sio)
            * [.host](#module_TOTEM.secureIO.host)
            * [.challenge](#module_TOTEM.secureIO.challenge)
                * [.extend](#module_TOTEM.secureIO.challenge.extend)
            * [.inspect()](#module_TOTEM.secureIO.inspect)
        * [.tableRoutes](#module_TOTEM.tableRoutes)
        * [.errors](#module_TOTEM.errors)
        * [.tasking](#module_TOTEM.tasking)
        * [.dogs](#module_TOTEM.dogs)
        * [.stop](#module_TOTEM.stop)
        * [.sqlThread](#module_TOTEM.sqlThread)
        * [.neoThread](#module_TOTEM.neoThread)
        * [.crudIF](#module_TOTEM.crudIF)
        * [.cores](#module_TOTEM.cores)
        * [.onFile](#module_TOTEM.onFile)
        * [.modTimes](#module_TOTEM.modTimes)
        * [.behindProxy](#module_TOTEM.behindProxy)
        * [.name](#module_TOTEM.name)
        * [.certPass](#module_TOTEM.certPass)
        * [.site](#module_TOTEM.site)
        * [.filters](#module_TOTEM.filters)
        * [.byTable](#module_TOTEM.byTable)
            * [.agent()](#module_TOTEM.byTable.agent)
            * [.ping(req, res)](#module_TOTEM.byTable.ping)
            * [.task(req, res)](#module_TOTEM.byTable.task)
            * [.riddle(req, res)](#module_TOTEM.byTable.riddle)
        * [.byAction](#module_TOTEM.byAction)
            * [.select(req, res)](#module_TOTEM.byAction.select)
            * [.update(req, res)](#module_TOTEM.byAction.update)
            * [.delete(req, res)](#module_TOTEM.byAction.delete)
            * [.insert(req, res)](#module_TOTEM.byAction.insert)
            * [.execute(req, res)](#module_TOTEM.byAction.execute)
        * [.byType](#module_TOTEM.byType)
        * [.byArea](#module_TOTEM.byArea)
            * [.all(req, res)](#module_TOTEM.byArea.all)
        * [.trustStore](#module_TOTEM.trustStore)
        * [.server](#module_TOTEM.server)
        * [.guard](#module_TOTEM.guard)
        * [.guards](#module_TOTEM.guards)
        * [.admitRules](#module_TOTEM.admitRules)
        * [.proxies](#module_TOTEM.proxies)
        * [.paths](#module_TOTEM.paths)
        * [.sqls](#module_TOTEM.sqls)
        * [.uploadFile](#module_TOTEM.uploadFile)
        * [.busyTime](#module_TOTEM.busyTime)
        * [.cache](#module_TOTEM.cache)
        * [.attachAgent(server, port, agents, init)](#module_TOTEM.attachAgent)
        * [.loginClient(req, res)](#module_TOTEM.loginClient)
        * [.dsThread(req, cb)](#module_TOTEM.dsThread)
        * [.routeAgent(req, res)](#module_TOTEM.routeAgent)
        * [.startDogs()](#module_TOTEM.startDogs)
        * [.config(opts, cb)](#module_TOTEM.config)
            * [~configService(agent)](#module_TOTEM.config..configService)
                * [~createServer()](#module_TOTEM.config..configService..createServer)
        * [.initialize()](#module_TOTEM.initialize)
        * [.runTask(opts, task, cb)](#module_TOTEM.runTask)
        * [.watchFile(path, callback)](#module_TOTEM.watchFile)
        * [.createCert(owner, password, cb)](#module_TOTEM.createCert)
        * [.isEncrypted()](#module_TOTEM.isEncrypted)
        * [.getBrick(client, name, cb)](#module_TOTEM.getBrick)
        * [.setContext()](#module_TOTEM.setContext)
    * _inner_
        * [~stopService()](#module_TOTEM..stopService)
        * [~uploadFile(client, source, sinkPath, tags, cb)](#module_TOTEM..uploadFile)

<a name="module_TOTEM.CORS"></a>

### TOTEM.CORS
Enable to support cross-origin-scripting

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Boolean</code>  
<a name="module_TOTEM.defaultType"></a>

### TOTEM.defaultType
Default NODE type during a route

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>String</code>  
<a name="module_TOTEM.secureIO"></a>

### TOTEM.secureIO
SecureLink configuration settings.  Null to disable.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  

* [.secureIO](#module_TOTEM.secureIO)
    * [.sio](#module_TOTEM.secureIO.sio)
    * [.host](#module_TOTEM.secureIO.host)
    * [.challenge](#module_TOTEM.secureIO.challenge)
        * [.extend](#module_TOTEM.secureIO.challenge.extend)
    * [.inspect()](#module_TOTEM.secureIO.inspect)

<a name="module_TOTEM.secureIO.sio"></a>

#### secureIO.sio
Socketio i/f set on SECLINK config

**Kind**: static property of [<code>secureIO</code>](#module_TOTEM.secureIO)  
<a name="module_TOTEM.secureIO.host"></a>

#### secureIO.host
Name of SECLINK host for determining trusted clinets etc

**Kind**: static property of [<code>secureIO</code>](#module_TOTEM.secureIO)  
<a name="module_TOTEM.secureIO.challenge"></a>

#### secureIO.challenge
Specifiies client challenge options

**Kind**: static property of [<code>secureIO</code>](#module_TOTEM.secureIO)  
<a name="module_TOTEM.secureIO.challenge.extend"></a>

##### challenge.extend
Number of antibot riddles to extend

**Kind**: static property of [<code>challenge</code>](#module_TOTEM.secureIO.challenge)  
**Cfg**: <code>Number</code> [extend=0]  
<a name="module_TOTEM.secureIO.inspect"></a>

#### secureIO.inspect()
Used to inspect unencrypted messages

**Kind**: static method of [<code>secureIO</code>](#module_TOTEM.secureIO)  
<a name="module_TOTEM.tableRoutes"></a>

### TOTEM.tableRoutes
**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.errors"></a>

### TOTEM.errors
Error messages

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.tasking"></a>

### TOTEM.tasking
Methods available when Task Sharding

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.dogs"></a>

### TOTEM.dogs
Watchdogs {name: dog(sql, lims), ... } run at intervals dog.cycle seconds usings its
dog.trace, dog.parms, sql connector and threshold parameters.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.stop"></a>

### TOTEM.stop
Stop the server.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  
<a name="module_TOTEM.sqlThread"></a>

### TOTEM.sqlThread
Thread a new sql connection to a callback.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback(sql connector) |

<a name="module_TOTEM.neoThread"></a>

### TOTEM.neoThread
Thread a new neo4j connection to a callback.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback(sql connector) |

<a name="module_TOTEM.crudIF"></a>

### TOTEM.crudIF
REST-to-CRUD translations

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.cores"></a>

### TOTEM.cores
Number of worker cores (0 for master-only).  If cores>0, masterport should != workPort, master becomes HTTP server, and workers
become HTTP/HTTPS depending on encrypt option.  In the coreless configuration, master become HTTP/HTTPS depending on 
encrypt option, and there are no workers.  In this way, a client can access stateless workers on the workerport, and stateful 
workers via the masterport.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Number</code> [cores=0]  
<a name="module_TOTEM.onFile"></a>

### TOTEM.onFile
Folder watching callbacks cb(path)

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.modTimes"></a>

### TOTEM.modTimes
File mod-times tracked as OS will trigger multiple events when file changed

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.behindProxy"></a>

### TOTEM.behindProxy
Enable if https server being proxied

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Boolean</code> [behindProxy=false]  
<a name="module_TOTEM.name"></a>

### TOTEM.name
Service name used to
	1) derive site parms from mysql openv.apps by Nick=name
	2) set mysql name.table for guest clients,
	3) identify server cert name.pfx file.

If the Nick=name is not located in openv.apps, the supplied	config() options 
are not overridden.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.certPass"></a>

### TOTEM.certPass
Enabled when master/workers on encrypted service

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Boolean</code>  
<a name="module_TOTEM.site"></a>

### TOTEM.site
Site context extended by the mysql derived query when service starts

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.filters"></a>

### TOTEM.filters
Endpoint filters cb(data data as string || error)

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.byTable"></a>

### TOTEM.byTable
By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  

* [.byTable](#module_TOTEM.byTable)
    * [.agent()](#module_TOTEM.byTable.agent)
    * [.ping(req, res)](#module_TOTEM.byTable.ping)
    * [.task(req, res)](#module_TOTEM.byTable.task)
    * [.riddle(req, res)](#module_TOTEM.byTable.riddle)

<a name="module_TOTEM.byTable.agent"></a>

#### byTable.agent()
**Kind**: static method of [<code>byTable</code>](#module_TOTEM.byTable)  
<a name="module_TOTEM.byTable.ping"></a>

#### byTable.ping(req, res)
Endpoint to test connectivity.

**Kind**: static method of [<code>byTable</code>](#module_TOTEM.byTable)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_TOTEM.byTable.task"></a>

#### byTable.task(req, res)
Endpoint to shard a task to the compute nodes.

**Kind**: static method of [<code>byTable</code>](#module_TOTEM.byTable)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_TOTEM.byTable.riddle"></a>

#### byTable.riddle(req, res)
Endpoint to validate clients response to an antibot challenge.

**Kind**: static method of [<code>byTable</code>](#module_TOTEM.byTable)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem response callback |

<a name="module_TOTEM.byAction"></a>

### TOTEM.byAction
By-action endpoint routers for accessing engines

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  

* [.byAction](#module_TOTEM.byAction)
    * [.select(req, res)](#module_TOTEM.byAction.select)
    * [.update(req, res)](#module_TOTEM.byAction.update)
    * [.delete(req, res)](#module_TOTEM.byAction.delete)
    * [.insert(req, res)](#module_TOTEM.byAction.insert)
    * [.execute(req, res)](#module_TOTEM.byAction.execute)

<a name="module_TOTEM.byAction.select"></a>

#### byAction.select(req, res)
CRUD endpoint to respond to a select||GET request

**Kind**: static method of [<code>byAction</code>](#module_TOTEM.byAction)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byAction.update"></a>

#### byAction.update(req, res)
CRUD endpoint to respond to a update||POST request

**Kind**: static method of [<code>byAction</code>](#module_TOTEM.byAction)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byAction.delete"></a>

#### byAction.delete(req, res)
CRUD endpoint to respond to a delete||DELETE request

**Kind**: static method of [<code>byAction</code>](#module_TOTEM.byAction)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byAction.insert"></a>

#### byAction.insert(req, res)
CRUD endpoint to respond to a insert||PUT request

**Kind**: static method of [<code>byAction</code>](#module_TOTEM.byAction)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byAction.execute"></a>

#### byAction.execute(req, res)
CRUD endpoint to respond to a Totem request

**Kind**: static method of [<code>byAction</code>](#module_TOTEM.byAction)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byType"></a>

### TOTEM.byType
By-type endpoint routers  {type: method(req,res), ... } for accessing dataset readers

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.byArea"></a>

### TOTEM.byArea
By-area endpoint routers {area: method(req,res), ... } for sending/cacheing/navigating files

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.byArea.all"></a>

#### byArea.all(req, res)
Default area navigator used for all areas.

**Kind**: static method of [<code>byArea</code>](#module_TOTEM.byArea)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.trustStore"></a>

### TOTEM.trustStore
Trust store extened with certs in the certs.truststore folder when the service starts in encrypted mode

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.server"></a>

### TOTEM.server
CRUD endpoint to respond to Totem request

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.guard"></a>

### TOTEM.guard
Enable/disable service fault protection guards

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Boolean</code>  
<a name="module_TOTEM.guards"></a>

### TOTEM.guards
Service guard modes

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.admitRules"></a>

### TOTEM.admitRules
Client admission rules

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.proxies"></a>

### TOTEM.proxies
**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.paths"></a>

### TOTEM.paths
Default paths to service files

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.sqls"></a>

### TOTEM.sqls
**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.uploadFile"></a>

### TOTEM.uploadFile
File uploader

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  
<a name="module_TOTEM.busyTime"></a>

### TOTEM.busyTime
Server toobusy check period in seconds

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Number</code>  
<a name="module_TOTEM.cache"></a>

### TOTEM.cache
File cache

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.attachAgent"></a>

### TOTEM.attachAgent(server, port, agents, init)
Attach (req,res)-agent(s) to `service` listening on specified `port`.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| server | <code>Object</code> | Server being started |
| port | <code>Numeric</code> | Port number to listen for agent requests |
| agents | <code>function</code> \| <code>Object</code> | (req,res)-router or (req,res)-hash of agents |
| init | <code>function</code> | Optional callback after server started |

<a name="module_TOTEM.loginClient"></a>

### TOTEM.loginClient(req, res)
Validate a client's session by attaching a log, profile, group, client, 
cert and joined info to this request then callback(prof || null) with
recovered profile or null if the session could not be validated.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | totem session request |
| res | <code>function</code> | totem session responder |

**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
<a name="module_TOTEM.dsThread"></a>

### TOTEM.dsThread(req, cb)
Start a dataset thread.  

In phase 1/3 of the session setup, the following is added to this req:

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

In phase 2/3 of the session setup, the following is added to this req:

	log: {...}			// info to trap socket stats
	client: "..."		// name of client from cert or "guest"
	profile: {...},		// client profile after login
	host: "proto://domain:port"	// requested host 
	action: "select|update| ..."	// corresponding crude name
	encrypted: bool		// true if request on encrypted server
	site: {...}			// site info

In phase 3/3 of the the session setup

	{query,index,flags,where} and {sql,table,area,path,type} 

is appended to the request.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem endpoint request |
| cb | <code>function</code> | callback(competed req) |

<a name="module_TOTEM.routeAgent"></a>

### TOTEM.routeAgent(req, res)
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

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | session request |
| res | <code>Object</code> | session response |

<a name="module_TOTEM.startDogs"></a>

### TOTEM.startDogs()
Start watchdogs

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.config"></a>

### TOTEM.config(opts, cb)
Configure and start the service with options and optional callback when started.
Configure database, define site context, then protect, connect, start and initialize this server.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | configuration options following the Copy() conventions. |
| cb | <code>function</code> | callback(err) after service configured |


* [.config(opts, cb)](#module_TOTEM.config)
    * [~configService(agent)](#module_TOTEM.config..configService)
        * [~createServer()](#module_TOTEM.config..configService..createServer)

<a name="module_TOTEM.config..configService"></a>

#### config~configService(agent)
Configure (create, start then initialize) a service that will handle its request-response 
		sessions.

		The session request is constructed in 3 phases: reqThread, resThread, then dsThread.
		As these phases are performed, the request hash req is extended.

**Kind**: inner method of [<code>config</code>](#module_TOTEM.config)  

| Param | Type | Description |
| --- | --- | --- |
| agent | <code>function</code> | callback(req,res) to handle session request-response |

<a name="module_TOTEM.config..configService..createServer"></a>

##### configService~createServer()
Create and start the HTTP/HTTPS server.  If starting a HTTPS server, the truststore
			is scanned for PKI certs.

**Kind**: inner method of [<code>configService</code>](#module_TOTEM.config..configService)  
<a name="module_TOTEM.initialize"></a>

### TOTEM.initialize()
**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.runTask"></a>

### TOTEM.runTask(opts, task, cb)
Shard one or more tasks to workers residing in a compute node cloud.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | tasking options (see example) |
| task | <code>function</code> | runTask of the form ($) => {return msg} where $ contains process info |
| cb | <code>function</code> | callback of the form (msg) => {...} to process msg returned by task |

**Example**  
```js
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
```
<a name="module_TOTEM.watchFile"></a>

### TOTEM.watchFile(path, callback)
Establish smart file watcher when file at area/name has changed.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | to file being watched |
| callback | <code>function</code> | cb(sql, name, path) when file at path has changed |

<a name="module_TOTEM.createCert"></a>

### TOTEM.createCert(owner, password, cb)
Create a cert for the desired owner with the desired passphrase then 
callback cb() when complete.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| owner | <code>String</code> | userID to own this cert |
| password | <code>String</code> | for this cert |
| cb | <code>function</code> | callback when completed |

<a name="module_TOTEM.isEncrypted"></a>

### TOTEM.isEncrypted()
**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.getBrick"></a>

### TOTEM.getBrick(client, name, cb)
Get (or create if needed) a file with callback cb(fileID, sql) if no errors

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>String</code> | owner of file |
| name | <code>String</code> | of file to get/make |
| cb | <code>function</code> | callback(file, sql) if no errors |

<a name="module_TOTEM.setContext"></a>

### TOTEM.setContext()
Sets the site context parameters.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  
<a name="module_TOTEM..stopService"></a>

### TOTEM~stopService()
Stop the server.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM..uploadFile"></a>

### TOTEM~uploadFile(client, source, sinkPath, tags, cb)
Uploads a source stream `srcStream` to a target file `sinkPath` owned by the 
specified `client`; optional `tags` are tagged to the upload and the callback 
`cb` is made if the upload was successful.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>String</code> | file owner |
| source | <code>Stream</code> | stream |
| sinkPath | <code>String</code> | path to target file |
| tags | <code>Object</code> | hash of tags to add to file |
| cb | <code>function</code> | callback(file) if upload successful |

</details>

## Contacting, Contributing, Following

Feel free to 
* submit and status [TOTEM issues](http://totem.hopto.org/issues.view) 
* contribute to [TOTEM notebooks](http://totem.hopto.org/shares/notebooks/) 
* revise [TOTEM requirements](http://totem.hopto.org/reqts.view) 
* browse [TOTEM holdings](http://totem.hopto.org/) 
* or follow [TOTEM milestones](http://totem.hopto.org/milestones.view) 


## License

[MIT](LICENSE)

* * *

&copy; 2012 ACMESDS
