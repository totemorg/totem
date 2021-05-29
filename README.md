# TOTEM

**TOTEM** provides a basic web service with the following customizable features:

	+ endpoint routing
	+ http/https service
	+ denial-of-service protection
	+ secure link providing encrypted inter-client communications with antibot guard
	+ client profiles 
	+ PKI encryption and authentication
	+ fault protected run states
	+ indexing, uploading, downloading and cacheing static files
	+ crud interface
	+ mysql/neo4j database agnosticator
	+ task queuing and regulation
	+ file polling and services
	+ automattic server cert generation
	+ task sharding
	+ file stream and ingest
	+ data fetching, rotating proxies, oauth access
	+ smartcard reader
  
**TOTEM** defines a CRUD (HTTP POST, GET, PUT, DELETE) to endpoint NODES for accessing datasets, files or services:

	DATASET.TYPE ? QUERY
	AREA/PATH/FILE.TYPE ? QUERY
	COMMAND.TYPE ? QUERY

By default, **TOTEM** provides `db | xml | csv | json` TYPEs for converting DATASETs, 
`riddle | task | ping` COMMANDs for validating a session, sharding tasks,
and the `stores | shares` file AREAs for sharing static files.

**TOTEM** also provides a method to fetch data from a service or filesystem:

	Fetch( path, text => {			// get-select request made
	})
	
	Fetch( path, [ ... ], stat => { 	// post-insert request made
	})
	
	Fetch( path, { ... }, stat => { 	// put-update request made
	})
	
	Fetch( path, null, stat => {		// delete request made
	})
	
where the path = "PROTOCOL://HOST/FILE" and where the PROTOCOL can be

	http/https fetches data from the HOST
	curls/wgets presents the certs/fetch.pfx certificate to the HOST, 
	mask/masks routes the HOST fetch through rotated proxies, 
	lexis/etc uses the oauth authorization-authentication protocol to read the HOST, 
	file fetches data from the file system, 
	book selects a notebook record. 
			
If the path is terminated by a "/", then a file index is returned; if terminated by "?batch=N&limit=N&rekey=from:to,...&comma=X&newline=X, 
specified options are used to ingest the requested FILE stream.

## Installation

Clone [**TOTEM** base web service](https://github.com/totemstan/totem) || [COE](https://sc.appdev.proj.coe/acmesds/totem) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/totem) into your PROJECT/totem folder.
Also requires
[ENUMS](https://github.com/totemstan/enum) || [COE](https://sc.appdev.proj.coe/acmesds/enum) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/enum), [JSDB database agnosticator](https://github.com/totemstan/jsdb) || [COE](https://sc.appdev.proj.coe/acmesds/jsdb) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/jsdb).

## Manage 

	npm test [ ? || T1 || T2 || ...]	# Start or unit test
	npm run redoc						# Update and distribute documentation
	npm run config						# Configure environment
	maint dbrecover						# Recover/reset the databases
	maint dbstart						# Start the database servers
	maint startup						# Start all required services then start debe

## Usage

Require, configure and start **TOTEM**:
	
	var TOTEM = require("totem")({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, err => {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where [its configuration keys](http://totem.hopto.org/shares/prm/totem/index.html) || [COE](https://totem.west.ile.nga.ic.gov/shares/prm/totem/index.html) || [SBU](https://totem.nga.mil/shares/prm/totem/index.html)
follow the [ENUM deep copy conventions](https://github.com/totemstan/enum) || [COE](https://sc.appdev.proj.coe/acmesds/enum) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/enum).

### T1 - A do-nothing service
		
	var TOTEM = require("totem");

	Trace({
		msg: "Im simply a Totem interface so Im not even running as a service", 
		default_fetcher_endpts: TOTEM.byTable,
		default_protect_mode: TOTEM.faultless,
		default_cores_used: TOTEM.cores
	});
	
### T2 - A do-little service

	TOTEM.config({
		name: "iamwhoiam",
		faultless: true,
		cores: 2
	}, err => {

		Trace( err || 
			`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
			with 2 cores and the default endpoint routes` );

	});

### T3 - Add a database

	TOTEM.config({
		name: "Totem",

		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		}
	},  err => {				
		Trace( err ||
			`I'm a Totem service with no cores. I do, however, now have a mysql database from which I've derived 
			my startup options (see the openv.apps table for the Nick="Totem").  
			No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
			these files. `
		);
	});
		
### T4 - Add custom endpoints
	
	TOTEM.config({
		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		},
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
					or_user: [req.client,req.group]
				});
			}
		}
	}, err => {
		Trace( err || {
			msg:
				`As always, if the openv.apps Encrypt is set for the Nick="Totem" app, this service is now **encrypted** [*]
				and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
				aka core), Im running unprotected, and have a mysql database.  
				[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
				associated public NICK.crt and private NICK.key certs it creates.`,
			my_endpoints: TOTEM.byTable
		});
	});
		
### T5 - Add antibot protection
	
	TOTEM.config({
		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		},

		name: "allmine",

		riddles: 20
	}, err => {
		Trace( err || {
			msg:
				`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield.  
				Anti-bot shields require an Encrypted service, and a user interface (eg DEBE) to be of use.`, 
			mysql_derived_parms: TOTEM.site
		});
	});
### T6 - Add tasking endpoints

	TOTEM.config({  // configure the service for tasking
		name: "Totem1",  // default parms from openv.apps nick=Totem1
		faultless: false,	// ex override default 
		cores: 3,		// ex override default
		mysql: { 		// provide a database
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		},
		"byTable.": {  // define endpoints
			test: function (req,res) {
				res(" here we go");  // endpoint must always repond to its client 
				if (CLUSTER.isMaster)  // setup tasking examples on on master
					switch (req.query.opt || 1) {  // test example tasker
						case 1: 
							TOTEM.tasker({  // setup tasking for loops over these keys
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
							TOTEM.tasker({
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

	}, err => {
		Trace( err || "Testing tasker with database and 3 cores at /test endpoint" );
	});

## Contacting, Contributing, Following

Feel free to [submit and status **TOTEM** issues](http://totem.hopto.org/issues.view) || [COE](https://totem.west.ile.nga.ic.gov/issues.view) || [SBU](https://totem.nga.mil/issues.view), [contribute **TOTEM** notebooks](http://totem.hopto.org/shares/notebooks/) || [COE](https://totem.west.ile.nga.ic.gov/shares/notebooks/) || [SBU](https://totem.nga.mil/shares/notebooks/),
[inspect **TOTEM** requirements](http://totem.hopto.org/reqts.view) || [COE](https://totem.west.ile.nga.ic.gov/reqts.view) || [SBU](https://totem.nga.mil/reqts.view), [browse **TOTEM** holdings](http://totem.hopto.org/) || [COE](https://totem.west.ile.nga.ic.gov/) || [SBU](https://totem.nga.mil/), 
or [follow **TOTEM** milestones](http://totem.hopto.org/milestones.view) || [COE](https://totem.west.ile.nga.ic.gov/milestones.view) || [SBU](https://totem.nga.mil/milestones.view).

## License

[MIT](LICENSE)

<a name="module_TOTEM"></a>

## TOTEM
**Requires**: <code>module:http</code>, <code>module:https</code>, <code>module:fs</code>, <code>module:constants</code>, <code>module:cluster</code>, <code>module:child\_process</code>, <code>module:os</code>, <code>module:stream</code>, <code>module:vm</code>, <code>module:crypto</code>, <code>module:enums</code>, <code>module:jsdb</code>, <code>module:securelink</code>, <code>module:socketio</code>, <code>module:mime</code>, <code>module:mysql</code>, <code>module:xml2js</code>, <code>module:toobusy</code>, <code>module:json2csv</code>, <code>module:js2xmlparser</code>, <code>module:toobusy-js</code>, <code>module:cheerio</code>  

* [TOTEM](#module_TOTEM)
    * _static_
        * [.errors](#module_TOTEM.errors)
        * [.tasking](#module_TOTEM.tasking)
        * [.dogs](#module_TOTEM.dogs)
        * [.createCert](#module_TOTEM.createCert)
        * [.stop](#module_TOTEM.stop)
        * [.sqlThread](#module_TOTEM.sqlThread)
        * [.neoThread](#module_TOTEM.neoThread)
        * [.crudIF](#module_TOTEM.crudIF)
        * [.reqFlags](#module_TOTEM.reqFlags)
        * [.secureLink](#module_TOTEM.secureLink)
        * [.cores](#module_TOTEM.cores)
        * [.onFile](#module_TOTEM.onFile)
        * [.modTimes](#module_TOTEM.modTimes)
        * [.behindProxy](#module_TOTEM.behindProxy)
        * [.name](#module_TOTEM.name)
        * [.passEncrypted](#module_TOTEM.passEncrypted)
        * [.$master](#module_TOTEM.$master)
        * [.site](#module_TOTEM.site)
        * [.filterRecords](#module_TOTEM.filterRecords)
        * [.byTable](#module_TOTEM.byTable)
        * [.byAction](#module_TOTEM.byAction)
        * [.byType](#module_TOTEM.byType)
        * [.byArea](#module_TOTEM.byArea)
        * [.trustStore](#module_TOTEM.trustStore)
        * [.server](#module_TOTEM.server)
        * [.select](#module_TOTEM.select)
        * [.update](#module_TOTEM.update)
        * [.delete](#module_TOTEM.delete)
        * [.insert](#module_TOTEM.insert)
        * [.execute](#module_TOTEM.execute)
        * [.guard](#module_TOTEM.guard)
        * [.guards](#module_TOTEM.guards)
        * [.admitRules](#module_TOTEM.admitRules)
        * [.riddles](#module_TOTEM.riddles)
        * [.paths](#module_TOTEM.paths)
        * [.getBrick](#module_TOTEM.getBrick)
        * [.uploadFile](#module_TOTEM.uploadFile)
        * [.busyTime](#module_TOTEM.busyTime)
        * [.cache](#module_TOTEM.cache)
        * [.Fetch(path, method)](#module_TOTEM.Fetch)
        * [.routeRequest(req, res)](#module_TOTEM.routeRequest)
        * [.config(opts, cb)](#module_TOTEM.config)
            * [~configService(agent)](#module_TOTEM.config..configService)
                * [~createServer()](#module_TOTEM.config..configService..createServer)
                    * [~startServer(server, port, cb)](#module_TOTEM.config..configService..createServer..startServer)
        * [.runTask(opts, task, cb)](#module_TOTEM.runTask)
        * [.watchFile(path, callback)](#module_TOTEM.watchFile)
        * [.setContext()](#module_TOTEM.setContext)
    * _inner_
        * [~stopService()](#module_TOTEM..stopService)
        * [~createCert(owner, password, cb)](#module_TOTEM..createCert)
        * [~resolveClient(req, res)](#module_TOTEM..resolveClient)
        * [~getBrick(client, name, cb)](#module_TOTEM..getBrick)
        * [~uploadFile(client, source, sinkPath, tags, cb)](#module_TOTEM..uploadFile)
        * [~selectDS(req, res)](#module_TOTEM..selectDS)
        * [~insertDS(req, res)](#module_TOTEM..insertDS)
        * [~deleteDS(req, res)](#module_TOTEM..deleteDS)
        * [~updateDS(req, res)](#module_TOTEM..updateDS)
        * [~executeDS(req, res)](#module_TOTEM..executeDS)
        * [~sysPing(req, res)](#module_TOTEM..sysPing)
        * [~sysTask(req, res)](#module_TOTEM..sysTask)
        * [~sysChallenge(req, res)](#module_TOTEM..sysChallenge)

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
<a name="module_TOTEM.createCert"></a>

### TOTEM.createCert
Create a PKI cert given user name and password.

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | to file being watched |
| callback | <code>function</code> | cb(sql, name, path) when file at path has changed |

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
<a name="module_TOTEM.reqFlags"></a>

### TOTEM.reqFlags
Options to parse request flags

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.secureLink"></a>

### TOTEM.secureLink
Enabled to support web sockets

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Boolean</code> [sockets=false]  
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
<a name="module_TOTEM.filterRecords"></a>

### TOTEM.filterRecords
Endpoint filterRecords cb(data data as string || error)

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.byTable"></a>

### TOTEM.byTable
By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.byAction"></a>

### TOTEM.byAction
By-action endpoint routers for accessing engines

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
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
CRUDE (req,res) method to respond to Totem request

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.select"></a>

### TOTEM.select
CRUDE (req,res) method to respond to a select||GET request

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="module_TOTEM.update"></a>

### TOTEM.update
CRUDE (req,res) method to respond to a update||POST request

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="module_TOTEM.delete"></a>

### TOTEM.delete
CRUDE (req,res) method to respond to a delete||DELETE request

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="module_TOTEM.insert"></a>

### TOTEM.insert
CRUDE (req,res) method to respond to a insert||PUT request

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="module_TOTEM.execute"></a>

### TOTEM.execute
CRUDE (req,res) method to respond to a Totem request

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

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
<a name="module_TOTEM.riddles"></a>

### TOTEM.riddles
Number of antibot riddles to extend

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Number</code> [riddles=0]  
<a name="module_TOTEM.paths"></a>

### TOTEM.paths
Default paths to service files

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Object</code>  
<a name="module_TOTEM.getBrick"></a>

### TOTEM.getBrick
Get a file and make it if it does not exist

**Kind**: static property of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  
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
<a name="module_TOTEM.Fetch"></a>

### TOTEM.Fetch(path, method)
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

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | protocol prefixed by http: || https: || curl: || curls: || wget: || wgets: || mask: || masks: || /path |
| method | <code>Object</code> | induces probe method |

<a name="module_TOTEM.routeRequest"></a>

### TOTEM.routeRequest(req, res)
Route NODE = /DATASET.TYPE requests using the configured byArea, byType, byTable, 
byActionTable then byAction routers.	

The provided response method accepts a string, an objects, an array, an error, or 
a file-cache function and terminates the session's sql connection.  The client is 
validated and their session logged.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  

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
Setup (connect, start then initialize) a service that will handle its request-response sessions
		with the provided agent(req,res).

		The session request is constructed in the following phases:

			// phase1 startRequest
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
			sql: connector 		// sql database connector 

			// phase2 startResponse
			log: {...}			// info to trap socket stats
			client: "..."		// name of client from cert or "guest"
			cert: {...} 		// full client cert

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
Start service and attach listener.  Established the secureLink if configured.  Establishes
				server-busy tests to thwart deniel-of-service attackes and process guards to trap faults.  When
				starting the master process, other configurations are completed.  Watchdogs and proxies are
				also established.

**Kind**: inner method of [<code>createServer</code>](#module_TOTEM.config..configService..createServer)  

| Param | Type | Description |
| --- | --- | --- |
| server | <code>Object</code> | server being started |
| port | <code>Numeric</code> | port number to listen on |
| cb | <code>function</code> | callback listener cb(Req,Res) |

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

<a name="module_TOTEM.setContext"></a>

### TOTEM.setContext()
Sets the site context parameters.

**Kind**: static method of [<code>TOTEM</code>](#module_TOTEM)  
**Cfg**: <code>Function</code>  
<a name="module_TOTEM..stopService"></a>

### TOTEM~stopService()
Stop the server.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  
<a name="module_TOTEM..createCert"></a>

### TOTEM~createCert(owner, password, cb)
Create a cert for the desired owner with the desired passphrase then 
callback cb() when complete.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| owner | <code>String</code> | userID to own this cert |
| password | <code>String</code> | for this cert |
| cb | <code>function</code> | callback when completed |

<a name="module_TOTEM..resolveClient"></a>

### TOTEM~resolveClient(req, res)
Validate a client's session by attaching a log, profile, group, client, 
cert and joined info to this req request then callback res(error) with 
null error if session was validated.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | totem request |
| res | <code>function</code> | totem response |

<a name="module_TOTEM..getBrick"></a>

### TOTEM~getBrick(client, name, cb)
Get (or create if needed) a file with callback cb(fileID, sql) if no errors

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>String</code> | owner of file |
| name | <code>String</code> | of file to get/make |
| cb | <code>function</code> | callback(file, sql) if no errors |

<a name="module_TOTEM..uploadFile"></a>

### TOTEM~uploadFile(client, source, sinkPath, tags, cb)
Uploads a source stream srcStream to a target file sinkPath owned by a 
specified client.  Optional tags are logged with the upload.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>String</code> | file owner |
| source | <code>Stream</code> | stream |
| sinkPath | <code>String</code> | path to target file |
| tags | <code>Object</code> | hach of tags to add to file |
| cb | <code>function</code> | callback(file) if upload sucessful |

<a name="module_TOTEM..selectDS"></a>

### TOTEM~selectDS(req, res)
CRUD select endpoint.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="module_TOTEM..insertDS"></a>

### TOTEM~insertDS(req, res)
CRUD insert endpoint.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="module_TOTEM..deleteDS"></a>

### TOTEM~deleteDS(req, res)
CRUD delete endpoint.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="module_TOTEM..updateDS"></a>

### TOTEM~updateDS(req, res)
CRUD update endpoint.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="module_TOTEM..executeDS"></a>

### TOTEM~executeDS(req, res)
CRUD execute endpoint.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="module_TOTEM..sysPing"></a>

### TOTEM~sysPing(req, res)
Endpoint to test connectivity.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_TOTEM..sysTask"></a>

### TOTEM~sysTask(req, res)
Endpoint to shard a task to the compute nodes.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_TOTEM..sysChallenge"></a>

### TOTEM~sysChallenge(req, res)
Endpoint to validate clients response to an antibot challenge.

**Kind**: inner method of [<code>TOTEM</code>](#module_TOTEM)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem response callback |


* * *

&copy; 2012 ACMESDS
