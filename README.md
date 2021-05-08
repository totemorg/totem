[![view on npm](http://img.shields.io/npm/v/example.svg)](https://www.npmjs.org/package/example)

# TOTEM

**TOTEM** provides a basic http/https web service with the following customizable features:

	+ endpoint routing
	+ denial-of-service protection
	+ secure link providing encrypted inter-client communications with antibot guard
	+ client profiles 
	+ PKI encryption and authentication
	+ fault protected run states
	+ indexing, uploading, downloading and cacheing static files
	+ crud interface
	+ mysql/neo4j database agnosticator
	+ task queuing and regulation
	+ poll files and services
	+ automattic server cert generation
	+ task sharding
	+ file stream and ingest
	+ data fetching, rotating proxies, oauth access
	+ smartcard reader
  
**TOTEM** defines endpoints:

	POST / NODE 
	GET / NODE 
	PUT / NODE 
	DELETE / NODE 

to access dataset, file or command NODEs:

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

**TOTEM** passwords to sql databases etc are held in _pass.sh; revise as needed.
**TOTEM** sql tables can be primed/reset using `maint mysql prime`.

## Requires

[ENUM standard enumerators](https://github.com/totemstan/enum) || [COE](https://sc.appdev.proj.coe/acmesds/enum) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/enum), [JSDB database agnosticator](https://github.com/totemstan/jsdb) || [COE](https://sc.appdev.proj.coe/acmesds/jsdb) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/jsdb).

## Manage 

	npm test [ ? || T1 || T2 || ...]	# Start or unit test
	npm run [ prmprep || prmload ]		# Update Program Ref Manual
	npm run [ edit || start ]			# Configure environment

## Usage

Require, configure and start **TOTEM**:
	
	var **TOTEM** = require("totem")({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, err => {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where [its configuration keys](http://totem.hopto.org/shares/prm/totem/index.html) || [COE](https://totem.west.ile.nga.ic.gov/shares/prm/totem/index.html) || [SBU](https://totem.nga.mil/shares/prm/totem/index.html)
follow the [ENUM deep copy conventions](https://github.com/totemstan/enum) || [COE](https://sc.appdev.proj.coe/acmesds/enum) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/enum).

### T1 - A do-nothing service
		
	var **TOTEM** = require("totem");

	Trace({
		msg: "Im simply a Totem interface so Im not even running as a service", 
		default_fetcher_endpts: **TOTEM**.byTable,
		default_protect_mode: **TOTEM**.faultless,
		default_cores_used: **TOTEM**.cores
	});
	
### T2 - A do-little service

	**TOTEM**.config({
		name: "iamwhoiam",
		faultless: true,
		cores: 2
	}, err => {

		Trace( err || 
			`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
			with 2 cores and the default endpoint routes` );

	});

### T3 - Add a database

	**TOTEM**.config({
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
	
	**TOTEM**.config({
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
			my_endpoints: **TOTEM**.byTable
		});
	});
		
### T5 - Add antibot protection
	
	**TOTEM**.config({
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
			mysql_derived_parms: **TOTEM**.site
		});
	});
### T6 - Add tasking endpoints

	**TOTEM**.config({  // configure the service for tasking
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
							**TOTEM**.tasker({  // setup tasking for loops over these keys
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
							**TOTEM**.tasker({
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

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_"></a>

## TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.
**Requires**: <code>module:http</code>, <code>module:https</code>, <code>module:fs</code>, <code>module:constants</code>, <code>module:cluster</code>, <code>module:child\_process</code>, <code>module:os</code>, <code>module:stream</code>, <code>module:vm</code>, <code>module:crypto</code>, <code>module:enums</code>, <code>module:jsdb</code>, <code>module:securelink</code>, <code>module:socketio</code>, <code>module:mime</code>, <code>module:mysql</code>, <code>module:xml2js</code>, <code>module:toobusy</code>, <code>module:json2csv</code>, <code>module:js2xmlparser</code>, <code>module:toobusy-js</code>, <code>module:cheerio</code>  

* [TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)
    * _static_
        * [.errors](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.errors)
        * [.tasking](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.tasking)
        * [.dogs](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.dogs)
        * [.sqlThread](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.sqlThread)
        * [.neoThread](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.neoThread)
        * [.crudIF](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.crudIF)
        * [.reqFlags](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.reqFlags)
        * [.secureLink](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.secureLink)
        * [.cores](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.cores)
        * [.onFile](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.onFile)
        * [.modTimes](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.modTimes)
        * [.behindProxy](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.behindProxy)
        * [.name](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.name)
        * [.passEncrypted](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.passEncrypted)
        * [.$master](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.$master)
        * [.site](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.site)
        * [.filterRecords](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.filterRecords)
        * [.byTable](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byTable)
        * [.byAction](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byAction)
        * [.byType](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byType)
        * [.byArea](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byArea)
        * [.trustStore](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.trustStore)
        * [.server](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.server)
        * [.select](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.select)
        * [.update](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.update)
        * [.delete](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.delete)
        * [.insert](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.insert)
        * [.execute](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.execute)
        * [.guard](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.guard)
        * [.guards](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.guards)
        * [.admitRules](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.admitRules)
        * [.riddles](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.riddles)
        * [.paths](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.paths)
        * [.busyTime](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.busyTime)
        * [.cache](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.cache)
        * [.Fetch(path, method)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.Fetch)
        * [.routeRequest(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.routeRequest)
        * [.config(opts, cb)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.config)
        * [.runTask(opts, task, cb)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.runTask)
        * [.watchFile(path, callback)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.watchFile)
        * [.getBrick()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.getBrick)
        * [.setContext()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.setContext)
    * _inner_
        * [~isAdmin](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..isAdmin)
        * [~stop()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..stop)
        * [~uploadFile()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..uploadFile)
        * [~selectDS(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..selectDS)
        * [~insertDS(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..insertDS)
        * [~deleteDS(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..deleteDS)
        * [~updateDS(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..updateDS)
        * [~executeDS(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..executeDS)
        * [~sysTask(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..sysTask)
        * [~sysChallenge(req, res)](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..sysChallenge)
        * [~T1
	Create simple service but dont start it.()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T1
	Create simple service but dont start it.)
        * [~T2
	Totem service running in fault protection mode, no database, no UI; but I am running
	with 2 workers and the default endpoint routes.()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T2
	Totem service running in fault protection mode, no database, no UI; but I am running
	with 2 workers and the default endpoint routes.)
        * [~T3
	Im a Totem serv
	ice with no workers. I do, however, have a mysql database from which Ive derived 
	my startup options (see the openv.apps table for the Nick=Totem1).  
	No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit /files/ to index 
	these files.()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T3
	Im a Totem serv
	ice with no workers. I do, however, have a mysql database from which Ive derived 
	my startup options (see the openv.apps table for the Nick=Totem1).  
	No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit /files/ to index 
	these files.)
        * [~T4
	As always, if the openv.apps Encrypt is set for the Nick=Totem app, this service is now **encrypted** [*]
	and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
	aka core), Im running unprotected, and have a mysql database.  
	[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
	associated public NICK.crt and private NICK.key certs it creates.()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T4
	As always, if the openv.apps Encrypt is set for the Nick=Totem app, this service is now **encrypted** [*]
	and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
	aka core), Im running unprotected, and have a mysql database.  
	[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
	associated public NICK.crt and private NICK.key certs it creates.)
        * [~T5
	I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
	shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T5
	I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
	shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.)
        * [~T6
	Testing tasker with database and 3 cores at /test endpoint.()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T6
	Testing tasker with database and 3 cores at /test endpoint.)
        * [~T7()](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T7)

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.errors"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..errors
Error messages

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.tasking"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..tasking
Common methods for task sharding

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.dogs"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..dogs
Watchdogs {name: dog(sql, lims), ... } run at intervals dog.cycle seconds usings its
		dog.trace, dog.parms, sql connector and threshold parameters.

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.sqlThread"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..sqlThread
Thread a new sql connection to a callback.

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback(sql connector) |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.neoThread"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..neoThread
Thread a new neo4j connection to a callback.

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback(sql connector) |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.crudIF"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..crudIF
REST-to-CRUD translations

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.reqFlags"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..reqFlags
Options to parse request flags

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.secureLink"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..secureLink
Enabled to support web sockets

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Boolean</code> [sockets=false]  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.cores"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..cores
Number of worker cores (0 for master-only).  If cores>0, masterport should != workPort, master becomes HTTP server, and workers
		become HTTP/HTTPS depending on encrypt option.  In the coreless configuration, master become HTTP/HTTPS depending on 
		encrypt option, and there are no workers.  In this way, a client can access stateless workers on the workerport, and stateful 
		workers via the masterport.

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Number</code> [cores=0]  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.onFile"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..onFile
Folder watching callbacks cb(path)

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.modTimes"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..modTimes
File mod-times tracked as OS will trigger multiple events when file changed

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.behindProxy"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..behindProxy
Enable if https server being proxied

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Boolean</code> [behindProxy=false]  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.name"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..name
Service name used to
			1) derive site parms from mysql openv.apps by Nick=name
			2) set mysql name.table for guest clients,
			3) identify server cert name.pfx file.
			
		If the Nick=name is not located in openv.apps, the supplied	config() options 
		are not overridden.

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.passEncrypted"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..passEncrypted
Enabled when master/workers on encrypted service

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Boolean</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.$master"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..$master
Host information: https encryption passphrase,
		domain name of workers, domain name of master.

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>String</code> [name="Totem"]  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.site"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..site
Site context extended by the mysql derived query when service starts

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.filterRecords"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..filterRecords
Endpoint filterRecords cb(data data as string || error)

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byTable"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..byTable
By-table endpoint routers {table: method(req,res), ... } for data fetchers, system and user management

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byAction"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..byAction
By-action endpoint routers for accessing engines

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byType"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..byType
By-type endpoint routers  {type: method(req,res), ... } for accessing dataset readers

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.byArea"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..byArea
By-area endpoint routers {area: method(req,res), ... } for sending/cacheing files

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.trustStore"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..trustStore
Trust store extened with certs in the certs.truststore folder when the service starts in encrypted mode

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.server"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..server
CRUDE (req,res) method to respond to Totem request

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.select"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..select
CRUDE (req,res) method to respond to a select||GET request

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.update"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..update
CRUDE (req,res) method to respond to a update||POST request

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.delete"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..delete
CRUDE (req,res) method to respond to a delete||DELETE request

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.insert"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..insert
CRUDE (req,res) method to respond to a insert||PUT request

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.execute"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..execute
CRUDE (req,res) method to respond to a Totem request

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem responder |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.guard"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..guard
Enable/disable service fault protection guards

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Boolean</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.guards"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..guards
Service guard modes

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.admitRules"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..admitRules
Client admission rules

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.riddles"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..riddles
Number of antibot riddles to extend

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Number</code> [riddles=0]  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.paths"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..paths
Default paths to service files

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.busyTime"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..busyTime
Server toobusy check period in seconds

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Number</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.cache"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..cache
File cache

**Kind**: static property of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Object</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.Fetch"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..Fetch(path, method)
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

**Kind**: static method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | protocol prefixed by http: || https: || curl: || curls: || wget: || wgets: || mask: || masks: || /path |
| method | <code>Object</code> | induces probe method |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.routeRequest"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..routeRequest(req, res)
Route NODE = /DATASET.TYPE requests using the configured byArea, byType, byTable, 
		byActionTable then byAction routers.	

		The provided response method accepts a string, an objects, an array, an error, or 
		a file-cache function and terminates the session's sql connection.  The client is 
		validated and their session logged.

**Kind**: static method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | session request |
| res | <code>Object</code> | session response |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.config"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..config(opts, cb)
Configure and start the service with options and optional callback when started.
		Configure database, define site context, then protect, connect, start and initialize this server.

**Kind**: static method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | configuration options following the Copy() conventions. |
| cb | <code>function</code> | callback(err) after service configured |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.runTask"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..runTask(opts, task, cb)
Shard one or more tasks to workers residing in a compute node cloud.

**Kind**: static method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
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
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.watchFile"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..watchFile(path, callback)
Establish smart file watcher when file at area/name has changed.

**Kind**: static method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | to file being watched |
| callback | <code>function</code> | cb(sql, name, path) when file at path has changed |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.getBrick"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..getBrick()
Get a file and make it if it does not exist

**Kind**: static method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_.setContext"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service..setContext()
Sets the site context parameters.

**Kind**: static method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..isAdmin"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~isAdmin
TOTEM.End_Points.Users_Interface
 Create user maint end points

**Kind**: inner class of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..stop"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~stop()
Stop the server.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..uploadFile"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~uploadFile()
File uploader

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
**Cfg**: <code>Function</code>  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..selectDS"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~selectDS(req, res)
CRUD select endpoint.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..insertDS"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~insertDS(req, res)
CRUD insert endpoint.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..deleteDS"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~deleteDS(req, res)
CRUD delete endpoint.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..updateDS"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~updateDS(req, res)
CRUD update endpoint.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..executeDS"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~executeDS(req, res)
CRUD execute endpoint.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem's request |
| res | <code>function</code> | Totem's response callback |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..sysTask"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~sysTask(req, res)
Endpoint to shard a task to the compute nodes.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..sysChallenge"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~sysChallenge(req, res)
Validate clients response to an antibot challenge.

**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem response callback |

<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T1
	Create simple service but dont start it."></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~T1
	Create simple service but dont start it.()
**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T2
	Totem service running in fault protection mode, no database, no UI; but I am running
	with 2 workers and the default endpoint routes."></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~T2
	Totem service running in fault protection mode, no database, no UI; but I am running
	with 2 workers and the default endpoint routes.()
**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T3
	Im a Totem serv
	ice with no workers. I do, however, have a mysql database from which Ive derived 
	my startup options (see the openv.apps table for the Nick=Totem1).  
	No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit /files/ to index 
	these files."></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~T3
	Im a Totem serv
	ice with no workers. I do, however, have a mysql database from which Ive derived 
	my startup options (see the openv.apps table for the Nick=Totem1).  
	No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit /files/ to index 
	these files.()
**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T4
	As always, if the openv.apps Encrypt is set for the Nick=Totem app, this service is now **encrypted** [*]
	and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
	aka core), Im running unprotected, and have a mysql database.  
	[*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
	associated public NICK.crt and private NICK.key certs it creates."></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~T4
	As always, if the openv.apps Encrypt is set for the Nick=Totem app, this service is now \*\*encrypted\*\* [\*]
	and has https (vs http) endpoints, here /dothis and /dothat endpoints.  Ive only requested only 1 worker (
	aka core), Im running unprotected, and have a mysql database.  
	[\*] If my NICK.pfx does not already exists, Totem will create its password protected NICK.pfx cert from the
	associated public NICK.crt and private NICK.key certs it creates.()
**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T5
	I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
	shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use."></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~T5
	I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
	shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.()
**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T6
	Testing tasker with database and 3 cores at /test endpoint."></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~T6
	Testing tasker with database and 3 cores at /test endpoint.()
**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  
<a name="TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_..T7"></a>

### TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.~T7()
**Kind**: inner method of [<code>TOTEM
	
	[TOTEM](https://github.com/totemstan/totem.git) provides a barebones web service.</code>](#TOTEM
	
	[TOTEM](https_//github.com/totemstan/totem.git) provides a barebones web service.module_)  

* * *

&copy; 2012 ACMESDS
