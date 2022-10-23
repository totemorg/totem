# [TOTEM](https://www.npmjs.com/package/@totemorg/totem)

**TOTEM** provides a web service with the following basic features:

+ endpoint routing
+ http/https service
+ denial-of-service protection
+ secure link for encrypted inter-client communications and antibot protection
+ client profiles 
+ PKI encryption and authentication
+ fault protected run states
+ indexing, uploading, downloading and cacheing static files
+ crud interface to notebooks, mysql and neo4j databases
+ task queuing and regulation
+ watchdog periodic file polling and services
+ cert generation
+ task sharding
+ file stream and ingest
+ data fetching using various protocols
+ smartcard reader
+ site skinning 

**TOTEM** defines POST-GET-PUT-DELETE endpoint *NODE*s:

	DATASET.TYPE ? QUERY
	NOTEBOOK.TYPE ? QUERY
	AREA/PATH/FILE.TYPE ? QUERY
	HOOK.TYPE ? QUERY

to access *DATASET*s, *NOTEBOOK*s, *FILE*s and *HOOK*s as described in **TOTEM**'s
[API](http://totem.hopto.org/api.view) and [skinning guide](https://totem.hopto.org/skinguide.view).

A *TYPE* can filter *DATASET*s:

	db | xml | csv | txt | html | json | blog

or render *NOTEBOOK*s:

	view

The following *HOOK*s:

	riddle | task | ping | login | agent

validate sessions, shard tasks, test connections, establish secure link with clients,
and interface with in-network task agents.

## Manage

	npm install @totemorg/totem		# install base service
	npm install @totemorg/dbs		# install database schema
	
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

Acquire, optionally configure and start a **TOTEM** server:
	
	const TOTEM = require("@totemorg/totem").config({
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
<dt><a href="#DEBE.module_Array">Array</a></dt>
<dd></dd>
<dt><a href="#module_TOTEM">TOTEM</a></dt>
<dd><p>Provides a <a href="https://github.com/totemorg/totem">barebones web service</a>.  This module documented 
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

* [String](#TOTEM.module_String)
    * [~linkify(ref)](#TOTEM.module_String..linkify) ⇐ <code>String</code>
    * [~mailify(ref)](#TOTEM.module_String..mailify) ⇐ <code>String</code>
    * [~parseXML(cb)](#TOTEM.module_String..parseXML) ⇐ <code>String</code>

<a name="TOTEM.module_String..linkify"></a>

### String~linkify(ref) ⇐ <code>String</code>
Returns a ref-joined list of links

**Kind**: inner method of [<code>String</code>](#TOTEM.module_String)  
**Extends**: <code>String</code>  

| Param | Type |
| --- | --- |
| ref | <code>String</code> | 

<a name="TOTEM.module_String..mailify"></a>

### String~mailify(ref) ⇐ <code>String</code>
Returns a link suitable to ref host email system

**Kind**: inner method of [<code>String</code>](#TOTEM.module_String)  
**Extends**: <code>String</code>  

| Param | Type |
| --- | --- |
| ref | <code>String</code> | 

<a name="TOTEM.module_String..parseXML"></a>

### String~parseXML(cb) ⇐ <code>String</code>
Parse XML string into json and callback cb(json)

**Kind**: inner method of [<code>String</code>](#TOTEM.module_String)  
**Extends**: <code>String</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback( json || null if error ) |

<a name="DEBE.module_Array"></a>

## Array

* [Array](#DEBE.module_Array)
    * [~gridify(noheader)](#DEBE.module_Array..gridify)
    * [~groupify(dot)](#DEBE.module_Array..groupify)
    * [~blog(keys, ds, cb)](#DEBE.module_Array..blog)
    * [~joinify(cb)](#DEBE.module_Array..joinify)

<a name="DEBE.module_Array..gridify"></a>

### Array~gridify(noheader)
Creates an html table from an array.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type | Description |
| --- | --- | --- |
| noheader | <code>Boolean</code> | switch to enable header processing |

<a name="DEBE.module_Array..groupify"></a>

### Array~groupify(dot)
Groups each "x.y.z. ...." spec in the list.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type | Description |
| --- | --- | --- |
| dot | <code>string</code> | item seperator |

<a name="DEBE.module_Array..blog"></a>

### Array~blog(keys, ds, cb)
Blogs each string in the list.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  
**See**: totem:blogify  

| Param | Type | Description |
| --- | --- | --- |
| keys | <code>List</code> | list of keys to blog |
| ds | <code>String</code> | Name of dataset being blogged |
| cb | <code>function</code> | callback(recs) blogified version of records |

<a name="DEBE.module_Array..joinify"></a>

### Array~joinify(cb)
Joins a list with an optional callback cb(head,list) to join the current list 
with the current head.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type |
| --- | --- |
| cb | <code>function</code> | 

**Example**  
```js
[	a: null,
		g1: [ b: null, c: null, g2: [ x: null ] ],
		g3: [ y: null ] ].joinify()

returning a string
	"a,g1(b,c,g2(x)),g3(y)"
```
<a name="module_TOTEM"></a>

## TOTEM
Provides a [barebones web service](https://github.com/totemorg/totem).  This module documented 
in accordance with [jsdoc](https://jsdoc.app/).

### Env Dependencies

	SERVICE_PASS = passphrase to server pki cert
	URL_MASTER = URL to master totem service service
	URL_WORKER = URL to worker totem service service
	SHARD0 = PROTO://DOMAIN:PORT
	SHARD1 = PROTO://DOMAIN:PORT
	SHARD2 = PROTO://DOMAIN:PORT
	SHARD3 = PROTO://DOMAIN:PORT

**Requires**: <code>module:[enums](https://github.com/totemorg/enums)</code>, <code>module:[jsdb](https://github.com/totemorg/jsdb)</code>, <code>module:[securelink](https://github.com/totemorg/securelink)</code>, <code>module:[http](https://nodejs.org/docs/latest/api/)</code>, <code>module:[https](https://nodejs.org/docs/latest/api/)</code>, <code>module:[fs](https://nodejs.org/docs/latest/api/)</code>, <code>module:[constants](https://nodejs.org/docs/latest/api/)</code>, <code>module:[cluster](https://nodejs.org/docs/latest/api/)</code>, <code>module:[child\_process](https://nodejs.org/docs/latest/api/)</code>, <code>module:[os](https://nodejs.org/docs/latest/api/)</code>, <code>module:[stream](https://nodejs.org/docs/latest/api/)</code>, <code>module:[vm](https://nodejs.org/docs/latest/api/)</code>, <code>module:[crypto](https://nodejs.org/docs/latest/api/)</code>, <code>module:[mime](https://www.npmjs.com/package/mime)</code>, <code>module:[xml2js](https://www.npmjs.com/package/xml2js)</code>, <code>module:[toobusy-js](https://www.npmjs.com/package/toobusy-js)</code>, <code>module:[json2csv](https://www.npmjs.com/package/json2csv)</code>, <code>module:[js2xmlparser](https://www.npmjs.com/package/js2xmlparser)</code>, <code>module:[cheerio](https://www.npmjs.com/search?q&#x3D;cheerio)</code>  
**Author**: [ACMESDS](https://totemorg.github.io)  
**Example**  
```js
// npm test T1
// Create simple service but dont start it.
Log({
	msg: "Im simply a Totem interface so Im not even running as a service", 
	default_fetcher_endpts: TOTEM.byNode,
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
	byNode: {
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
		my_endpoints: T.byNode
	});
});
```
**Example**  
```js
// npm test T5
// no cores but a mysql database and an anti-bot shield

config({
	"login.challenge.extend": 20
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

	"byNode.": {  // define endpoints
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
        * [.busy](#module_TOTEM.busy)
        * [.CORS](#module_TOTEM.CORS)
        * [.defaultType](#module_TOTEM.defaultType)
        * [.login](#module_TOTEM.login)
            * [.sio](#module_TOTEM.login.sio)
            * [.host](#module_TOTEM.login.host)
            * [.challenge](#module_TOTEM.login.challenge)
                * [.extend](#module_TOTEM.login.challenge.extend)
            * [.inspect()](#module_TOTEM.login.inspect)
        * [.nodeRouter](#module_TOTEM.nodeRouter)
        * [.errors](#module_TOTEM.errors)
        * [.queues](#module_TOTEM.queues)
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
            * [.txt(recs, req, res)](#module_TOTEM.filters.txt)
            * [.db(recs, req, res)](#module_TOTEM.filters.db)
            * [.html(recs, req, res)](#module_TOTEM.filters.html)
            * [.blog(recs, req, res)](#module_TOTEM.filters.blog)
            * [.csv(recs, req, res)](#module_TOTEM.filters.csv)
            * [.json(recs, req, res)](#module_TOTEM.filters.json)
            * [.xml(recs, req, res)](#module_TOTEM.filters.xml)
        * [.byNode](#module_TOTEM.byNode)
            * [.agent(req, res)](#module_TOTEM.byNode.agent)
            * [.ping(req, res)](#module_TOTEM.byNode.ping)
            * [.task(req, res)](#module_TOTEM.byNode.task)
            * [.riddle(req, res)](#module_TOTEM.byNode.riddle)
            * [.login(req, res)](#module_TOTEM.byNode.login)
        * [.byAction](#module_TOTEM.byAction)
            * [.select(req, res)](#module_TOTEM.byAction.select)
            * [.update(req, res)](#module_TOTEM.byAction.update)
            * [.delete(req, res)](#module_TOTEM.byAction.delete)
            * [.insert(req, res)](#module_TOTEM.byAction.insert)
            * [.execute(req, res)](#module_TOTEM.byAction.execute)
        * [.byType](#module_TOTEM.byType)
        * [.byArea](#module_TOTEM.byArea)
            * [.default(req, res)](#module_TOTEM.byArea.default)
            * [.root(req, res)](#module_TOTEM.byArea.root)
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
        * [.certs](#module_TOTEM.certs)
        * [.cache](#module_TOTEM.cache)
        * [.attachAgent(server, port, agents, init)](#module_TOTEM.attachAgent)
        * [.dsThread(req, cb)](#module_TOTEM.dsThread)
        * [.nodeThread(req, res)](#module_TOTEM.nodeThread)
        * [.startDogs()](#module_TOTEM.startDogs)
        * [.config(opts, cb)](#module_TOTEM.config)
            * [~configService(agent)](#module_TOTEM.config..configService)
                * [~createService()](#module_TOTEM.config..configService..createService)
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

<a name="module_TOTEM.busy"></a>

### TOTEM.busy
Service too-busy options to deny DoS attacks.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
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
<a name="module_TOTEM.login"></a>

### TOTEM.login
Login configuration settings for secureLink.  Null to disable the secureLink.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  

* [.login](#module_TOTEM.login)
    * [.sio](#module_TOTEM.login.sio)
    * [.host](#module_TOTEM.login.host)
    * [.challenge](#module_TOTEM.login.challenge)
        * [.extend](#module_TOTEM.login.challenge.extend)
    * [.inspect()](#module_TOTEM.login.inspect)

<a name="module_TOTEM.login.sio"></a>

#### login.sio
Socketio i/f set on SECLINK config

**Kind**: static property of [<code>login</code>](#module_TOTEM.login)  
<a name="module_TOTEM.login.host"></a>

#### login.host
Name of SECLINK host for determining trusted clients etc

**Kind**: static property of [<code>login</code>](#module_TOTEM.login)  
<a name="module_TOTEM.login.challenge"></a>

#### login.challenge
Specifiies client challenge options for the anti-bot security

**Kind**: static property of [<code>login</code>](#module_TOTEM.login)  
<a name="module_TOTEM.login.challenge.extend"></a>

##### challenge.extend
Number of antibot riddles to extend

**Kind**: static property of [<code>challenge</code>](#module_TOTEM.login.challenge)  
**Cfg**: <code>Number</code> [extend=0]  
<a name="module_TOTEM.login.inspect"></a>

#### login.inspect()
Used to inspect unencrypted messages

**Kind**: static method of [<code>login</code>](#module_TOTEM.login)  
<a name="module_TOTEM.nodeRouter"></a>

### TOTEM.nodeRouter
Hash of node routers to provide access-control on nodes.  The router accepts a `req` request and
return a fulling qualified mysql path "db.name" if the access is granted; or returned a "black.name"
if access is denied.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.errors"></a>

### TOTEM.errors
Error messages

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.queues"></a>

### TOTEM.queues
Job queues provided by JSDB.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
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

* [.filters](#module_TOTEM.filters)
    * [.txt(recs, req, res)](#module_TOTEM.filters.txt)
    * [.db(recs, req, res)](#module_TOTEM.filters.db)
    * [.html(recs, req, res)](#module_TOTEM.filters.html)
    * [.blog(recs, req, res)](#module_TOTEM.filters.blog)
    * [.csv(recs, req, res)](#module_TOTEM.filters.csv)
    * [.json(recs, req, res)](#module_TOTEM.filters.json)
    * [.xml(recs, req, res)](#module_TOTEM.filters.xml)

<a name="module_TOTEM.filters.txt"></a>

#### filters.txt(recs, req, res)
**Kind**: static method of [<code>filters</code>](#module_TOTEM.filters)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.filters.db"></a>

#### filters.db(recs, req, res)
**Kind**: static method of [<code>filters</code>](#module_TOTEM.filters)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.filters.html"></a>

#### filters.html(recs, req, res)
**Kind**: static method of [<code>filters</code>](#module_TOTEM.filters)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.filters.blog"></a>

#### filters.blog(recs, req, res)
**Kind**: static method of [<code>filters</code>](#module_TOTEM.filters)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.filters.csv"></a>

#### filters.csv(recs, req, res)
**Kind**: static method of [<code>filters</code>](#module_TOTEM.filters)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.filters.json"></a>

#### filters.json(recs, req, res)
**Kind**: static method of [<code>filters</code>](#module_TOTEM.filters)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.filters.xml"></a>

#### filters.xml(recs, req, res)
**Kind**: static method of [<code>filters</code>](#module_TOTEM.filters)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byNode"></a>

### TOTEM.byNode
By-node endpoint routers {node: method(req,res), ... } for data fetchers, system and user management

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  

* [.byNode](#module_TOTEM.byNode)
    * [.agent(req, res)](#module_TOTEM.byNode.agent)
    * [.ping(req, res)](#module_TOTEM.byNode.ping)
    * [.task(req, res)](#module_TOTEM.byNode.task)
    * [.riddle(req, res)](#module_TOTEM.byNode.riddle)
    * [.login(req, res)](#module_TOTEM.byNode.login)

<a name="module_TOTEM.byNode.agent"></a>

#### byNode.agent(req, res)
Endpoint to interface with in-network agents given request query

	port		Port number to register an agent
	keys		Query keys to register an agent
	tasks		List of tasks to be run

**Kind**: static method of [<code>byNode</code>](#module_TOTEM.byNode)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byNode.ping"></a>

#### byNode.ping(req, res)
Endpoint to test connectivity.

**Kind**: static method of [<code>byNode</code>](#module_TOTEM.byNode)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_TOTEM.byNode.task"></a>

#### byNode.task(req, res)
Endpoint to shard a task to the compute nodes.

**Kind**: static method of [<code>byNode</code>](#module_TOTEM.byNode)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_TOTEM.byNode.riddle"></a>

#### byNode.riddle(req, res)
Endpoint to validate clients response to an antibot challenge.

**Kind**: static method of [<code>byNode</code>](#module_TOTEM.byNode)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem response callback |

<a name="module_TOTEM.byNode.login"></a>

#### byNode.login(req, res)
Endpoint to validate clients response to an antibot challenge.

**Kind**: static method of [<code>byNode</code>](#module_TOTEM.byNode)  

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

* [.byArea](#module_TOTEM.byArea)
    * [.default(req, res)](#module_TOTEM.byArea.default)
    * [.root(req, res)](#module_TOTEM.byArea.root)

<a name="module_TOTEM.byArea.default"></a>

#### byArea.default(req, res)
Default area navigator.

**Kind**: static method of [<code>byArea</code>](#module_TOTEM.byArea)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_TOTEM.byArea.root"></a>

#### byArea.root(req, res)
Navigator for root area.

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
List of rotating proxies when doing masked Fetches.

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
<a name="module_TOTEM.certs"></a>

### TOTEM.certs
**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM.cache"></a>

### TOTEM.cache
File cache

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.attachAgent"></a>

### TOTEM.attachAgent(server, port, agents, init)
Attach a (req,res)-`agent` to thea `server` listening on the given `port`.  Callsback the supplied `agent` (when
using a node-independent agent) or a `agent` from the supplied `agents` hash (assigned by the url-derived 
`path`, `table`, `type`, `area`).  The `req` request is built during nested threads.

The outer-most socThread adds socket data to the `req` request:

	cookie: "...."		// client cookie string
	agent: "..."		// client browser info
	ipAddress: "..."	// client ip address
	referer: "http://site"		// url during a cross-site request
	method: "GET|PUT|..." 		// http request method
	now: date			// date stamp when requested started
	post: "..."			// raw body text
	url	: "/query"		// requested url path
	reqSocket: socket	// socket to retrieve client cert, post etc
	resSocket: socket	// method to create socket to accept response
	cert: {...} 		// full client cert

The dsThread adds dataset information:

	sql: {...}			// sql connector
	ds:	"db.name"		// fully qualified sql table
	action: "select|update| ..."	// corresponding crude name

The nodeThread adds client data:

	encrypted: bool		// true if request on encrypted server
	site: {...}			// site info
	mimi: "type"		// mime type of response
	
The resThread adds node information and url parameters:

	path: "/[area/...]name.type"	// full node path
	area: "name"		// file area being requested
	table: "name"		// name of dataset/table being requested
	type: "type" 		// type descriptor 

	query: {...} 		// raw keys from url
	where: {...} 		// sql-ized query keys from url
	body: {...}			// body keys from request 
	flags: {...} 		// flag keys from url
	index: {...}		// sql-ized index keys from url

And the inner-most agentThread adds client information:

	client: "..."		// name of client from cert or "guest"
	profile: {...},		// client profile after login

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| server | <code>Object</code> | Server being started |
| port | <code>Numeric</code> | Port number to listen for agent requests |
| agents | <code>function</code> \| <code>Object</code> | the (req,res)-agent or a hash of (req,res)-agents |
| init | <code>function</code> | Optional callback after server started |

<a name="module_TOTEM.dsThread"></a>

### TOTEM.dsThread(req, cb)
Start a dataset `ds` sql thread and append a `sql` connector and `action` to the `req` request
with callback cb(req).

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem endpoint request |
| cb | <code>function</code> | callback(revised req) |

<a name="module_TOTEM.nodeThread"></a>

### TOTEM.nodeThread(req, res)
Route NODE = /DATASET.TYPE requests using the configured byArea, byType, byNode, 
byActionTable then byAction routers.	

The provided response method accepts a string, an objects, an array, an error, or 
a file-cache function and terminates the session's sql connection.  The client is 
validated and their session logged.

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
        * [~createService()](#module_TOTEM.config..configService..createService)

<a name="module_TOTEM.config..configService"></a>

#### config~configService(agent)
Configure (create, start then initialize) a service that will handle its request-response 
sessions.

**Kind**: inner method of [<code>config</code>](#module_TOTEM.config)  

| Param | Type | Description |
| --- | --- | --- |
| agent | <code>function</code> | callback(req,res) to handle session request-response |

<a name="module_TOTEM.config..configService..createService"></a>

##### configService~createService()
Create and start the HTTP/HTTPS server.  If starting a HTTPS server, the truststore
			is scanned for PKI certs.

**Kind**: inner method of [<code>configService</code>](#module_TOTEM.config..configService)  
<a name="module_TOTEM.initialize"></a>

### TOTEM.initialize()
Initialize the dervice.

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
