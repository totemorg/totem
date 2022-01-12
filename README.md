# TOTEM

**TOTEM** provides a barebones web service with the following customizable features:

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

## Local Installation

Clone **TOTEM** from one of its repos:

	git clone https://github.com/totemstan/totem
	git clone https://sc.appdev.proj.coe/acmesds/totem
	git clone https://gitlab.west.nga.ic.gov/acmesds/totem

then install its dependencies:

+ **ENUMS** [WWW](https://github.com/totemstan/enums)  [COE](https://sc.appdev.proj.coe/acmesds/enums)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/enums)  
+ **SECLINK** [WWW](https://github.com/totemstan/securelink)  [COE](https://sc.appdev.proj.coe/acmesds/securelink)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/securelink)  
+ **SOCKETIO** [WWW](https://github.com/totemstan/socketio)  [COE](https://sc.appdev.proj.coe/acmesds/socketio)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/socketio)  
+ **JSDB** [WWW](https://github.com/totemstan/jsdb)  [COE](https://sc.appdev.proj.coe/acmesds/jsdb)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/jsdb)  

## Federated Installation

Simply install and start its federated docker image (
[WWW](https://github.com/totemstan/dockify) 
[COE](https://sc.appdev.proj.coe/acmesds/dockify)
[SBU](https://gitlab.west.nga.ic.gov/acmesds/dockify)
).

## Setup

	npm run setprot						# Configure for protected mode
	npm run setdebug					# Configure for debugging mode
	npm run setoper						# Configure for operational mode
	npm run setprod						# Configure for production mode

## Start

	npm run	startdbs					# Start required database servers
	npm run	start						# Start totem

## Maintenance
	
	npm run redoc						# Update repo
	npm run verminor					# Roll version
	npm run vermajor					# Roll version
	rpm run	relink						# Relink dependent TOTEM modules

## Usage

Require, configure and start **TOTEM**:
	
	const TOTEM = require("totem");

	TOTEM.config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, err => {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where its configuration keys (
[WWW](http://totem.zapto.org/shares/prm/totem/index.html) 
[COE](https://totem.west.ile.nga.ic.gov/shares/prm/totem/index.html) 
[SBU](https://totem.nga.mil/shares/prm/totem/index.html)
)
follow the ENUM deep copy conventions (
[WWW](https://github.com/totemstan/enum) 
[COE](https://sc.appdev.proj.coe/acmesds/enum) 
[SBU](https://gitlab.west.nga.ic.gov/acmesds/enum)
).

## Env vars

	MYSQL_HOST = domain name
	MYSQL_USER = user name
	MYSQL_PASS = user password
	
	NEO4J_HOST = bolt://DOMAIN:PORT
	NEO4J_USER = user name
	NEO4J_PASS = user password

	SERVICE_PASS = passphrase to server pki cert
	
	SERVICE_WORKER_URL = PROTO://DOMAIN:PORT
	SERVICE_MASTER_URL = PROTO://DOMAIN:PORT
	
	SHARD0 = PROTO://DOMAIN:PORT
	SHARD1 = PROTO://DOMAIN:PORT
	SHARD2 = PROTO://DOMAIN:PORT
	SHARD3 = PROTO://DOMAIN:PORT

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

**Requires**: <code>module:http</code>, <code>module:https</code>, <code>module:fs</code>, <code>module:constants</code>, <code>module:cluster</code>, <code>module:child\_process</code>, <code>module:os</code>, <code>module:stream</code>, <code>module:vm</code>, <code>module:crypto</code>, <code>module:enums</code>, <code>module:jsdb</code>, <code>module:securelink</code>, <code>module:socketio</code>, <code>module:mime</code>, <code>module:mysql</code>, <code>module:xml2js</code>, <code>module:toobusy</code>, <code>module:json2csv</code>, <code>module:js2xmlparser</code>, <code>module:toobusy-js</code>, <code>module:cheerio</code>  
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

TOTEM.config({
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

TOTEM.config({
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```
**Example**  
```js
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
```

* [TOTEM](#module_TOTEM)
    * _static_
        * [.secureIO](#module_TOTEM.secureIO)
        * [.errors](#module_TOTEM.errors)
        * [.tasking](#module_TOTEM.tasking)
        * [.dogs](#module_TOTEM.dogs)
        * [.stop](#module_TOTEM.stop)
        * [.sqlThread](#module_TOTEM.sqlThread)
        * [.neoThread](#module_TOTEM.neoThread)
        * [.crudIF](#module_TOTEM.crudIF)
        * [.filterFlag](#module_TOTEM.filterFlag)
        * [.cores](#module_TOTEM.cores)
        * [.onFile](#module_TOTEM.onFile)
        * [.modTimes](#module_TOTEM.modTimes)
        * [.behindProxy](#module_TOTEM.behindProxy)
        * [.name](#module_TOTEM.name)
        * [.passEncrypted](#module_TOTEM.passEncrypted)
        * [.$master](#module_TOTEM.$master)
        * [.site](#module_TOTEM.site)
        * [.filterType](#module_TOTEM.filterType)
        * [.byTable](#module_TOTEM.byTable)
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
        * [.loginClient(req, res)](#module_TOTEM.loginClient)
        * [.routeRequest(req, res)](#module_TOTEM.routeRequest)
        * [.config(opts, cb)](#module_TOTEM.config)
            * [~configService(agent)](#module_TOTEM.config..configService)
                * [~createServer()](#module_TOTEM.config..configService..createServer)
                    * [~startServer(server, port, cb)](#module_TOTEM.config..configService..createServer..startServer)
        * [.initialize()](#module_TOTEM.initialize)
        * [.runTask(opts, task, cb)](#module_TOTEM.runTask)
        * [.watchFile(path, callback)](#module_TOTEM.watchFile)
        * [.createCert(owner, password, cb)](#module_TOTEM.createCert)
        * [.getBrick(client, name, cb)](#module_TOTEM.getBrick)
        * [.setContext()](#module_TOTEM.setContext)
    * _inner_
        * [~stopService()](#module_TOTEM..stopService)
        * [~uploadFile(client, source, sinkPath, tags, cb)](#module_TOTEM..uploadFile)

<a name="module_TOTEM.secureIO"></a>

### TOTEM.secureIO
SecureLink configuration settings.  Null to disable secure client links.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.errors"></a>

### TOTEM.errors
Error messages

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.tasking"></a>

### TOTEM.tasking
Common methods for task sharding

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
<a name="module_TOTEM.filterFlag"></a>

### TOTEM.filterFlag
Options to parse request flags

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
<a name="module_TOTEM.passEncrypted"></a>

### TOTEM.passEncrypted
Enabled when master/workers on encrypted service

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Boolean</code>  
<a name="module_TOTEM.$master"></a>

### TOTEM.$master
Host information: https encryption passphrase,
	domain name of workers, domain name of master.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>String</code> [name="Totem"]  
<a name="module_TOTEM.site"></a>

### TOTEM.site
Site context extended by the mysql derived query when service starts

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.filterType"></a>

### TOTEM.filterType
Endpoint filterType cb(data data as string || error)

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.byTable"></a>

### TOTEM.byTable
By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  

* [.byTable](#module_TOTEM.byTable)
    * [.ping(req, res)](#module_TOTEM.byTable.ping)
    * [.task(req, res)](#module_TOTEM.byTable.task)
    * [.riddle(req, res)](#module_TOTEM.byTable.riddle)

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
By-area endpoint routers {area: method(req,res), ... } for sending/cacheing files

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
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
<a name="module_TOTEM.loginClient"></a>

### TOTEM.loginClient(req, res)
Validate a client's session by attaching a log, profile, group, client, 
	cert and joined info to this `req` request then callback `res`(error) with 
	a null `error` if the session was sucessfully validated.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | totem session request |
| res | <code>function</code> | totem session responder |

<a name="module_TOTEM.routeRequest"></a>

### TOTEM.routeRequest(req, res)
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
            * [~startServer(server, port, cb)](#module_TOTEM.config..configService..createServer..startServer)

<a name="module_TOTEM.config..configService"></a>

#### config~configService(agent)
Configure (create, start then initialize) a service that will handle its request-response 
		sessions.

		The session request is constructed in 3 phases: startRequest, startResponse, then routeRequest.
		As these phases are performed, the request hash req is extended.

**Kind**: inner method of [<code>config</code>](#module_TOTEM.config)  

| Param | Type | Description |
| --- | --- | --- |
| agent | <code>function</code> | callback(req,res) to handle session request-response |


* [~configService(agent)](#module_TOTEM.config..configService)
    * [~createServer()](#module_TOTEM.config..configService..createServer)
        * [~startServer(server, port, cb)](#module_TOTEM.config..configService..createServer..startServer)

<a name="module_TOTEM.config..configService..createServer"></a>

##### configService~createServer()
Create and start the HTTP/HTTPS server.  If starting a HTTPS server, the truststore
			is scanned for PKI certs.

**Kind**: inner method of [<code>configService</code>](#module_TOTEM.config..configService)  
<a name="module_TOTEM.config..configService..createServer..startServer"></a>

###### createServer~startServer(server, port, cb)
Start service and attach listener.  Established the secureIO if configured.  Establishes
				server-busy tests to thwart deniel-of-service attackes and process guards to trap faults.  When
				starting the master process, other configurations are completed.  Watchdogs and proxies are
				also established.

**Kind**: inner method of [<code>createServer</code>](#module_TOTEM.config..configService..createServer)  

| Param | Type | Description |
| --- | --- | --- |
| server | <code>Object</code> | server being started |
| port | <code>Numeric</code> | port number to listen on |
| cb | <code>function</code> | callback listener cb(Req,Res) |

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
* submit and status **TOTEM** issues (
[WWW](http://totem.zapto.org/issues.view) 
[COE](https://totem.west.ile.nga.ic.gov/issues.view) 
[SBU](https://totem.nga.mil/issues.view)
)  
* contribute to **TOTEM** notebooks (
[WWW](http://totem.zapto.org/shares/notebooks/) 
[COE](https://totem.west.ile.nga.ic.gov/shares/notebooks/) 
[SBU](https://totem.nga.mil/shares/notebooks/)
)  
* revise **TOTEM** requirements (
[WWW](http://totem.zapto.org/reqts.view) 
[COE](https://totem.west.ile.nga.ic.gov/reqts.view) 
[SBU](https://totem.nga.mil/reqts.view), 
)  
* browse **TOTEM** holdings (
[WWW](http://totem.zapto.org/) 
[COE](https://totem.west.ile.nga.ic.gov/) 
[SBU](https://totem.nga.mil/)
)  
* or follow **TOTEM** milestones (
[WWW](http://totem.zapto.org/milestones.view) 
[COE](https://totem.west.ile.nga.ic.gov/milestones.view) 
[SBU](https://totem.nga.mil/milestones.view)
).

## License

[MIT](LICENSE)

* * *

&copy; 2012 ACMESDS
