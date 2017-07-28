/**
@class totem [![Forked from SourceForge](https://sourceforge.net)]
# TOTEM

TOTEM provides an HTTP service with the following optional features:
  
	+ routing methods for table, engine, and file objects
	+ Denial-of-Service protection
	+ web sockets for inter-client communications
	+ client profiles (e.g. banning, journalling, hawking, challenge tags and polling)
	+ account management by priviledged hawks and normal users
	+ hyper-threading in a master-worker or master-only relationship
	+ PKI channel encryption and authentication
	+ no-faulting (protected) run state
	+ transfer, indexing, saving and selective cacheing of static mime files
	+ per-client anti-bot challenges: profile challenges like (riddle), (card), (ids), (yesno), (rand)om, (bio)metric
	+ syncronized crude operations on mutiple endpoints
	+ database agnosticator (default MySQL-Cluster)
	+ poll files and services
  
TOTEM thus replaces a slew of god-awful NodeJS middleware (like Express).

TOTEM provides SUDI endpoints to synchronize dataset NODES:
  
	(select) GET 	 /NODE $$ NODE ...
	(update) PUT 	 /NODE $$ NODE ...
	(insert) POST 	 /NODE $$ NODE ...
	(delete) DELETE /NODE $$ NODE ...
  
where a NODE:

  	DATASET.TYPE?PARMS
	ENGINE.TYPE?PARMS
	AREA/PATH.TYPE?PARMS
	FILE.TYPE?PARMS

addresses a [FLEX dataset](https://github.com/acmesds/flex), a [compute ENGINE](https://github.com/acmesds/engine),
a static file, or a [READER file](https://github.com/acmesds/reader) to parse.  The dataset TYPE:

	db | xml | csv
	
qualifies how datasets are rendered.
 
TOTEM is configured and started like this:

	var TOTEM = require("../totem").config( {options...}, function (err) {
		// the callback when service has been started
	});
	
Its default service

	help, stop, alert, codes, ping, bit, config
	
data fetching and antibot protection

	wget, curl, http, riddle
	
endpoints can be overriden with the config() options:
  
	// SUDIE interface

	select: cb(req,res),
	update: cb(req,res),
	delete: cb(req,res),
	insert: cb(req,res),
	execute: cb(req,res),

	converters: {  // NODE.TYPE converters to callback cb(ack data as string || error)
		TYPE: function (ack,req,cb),
		...
	},
	
	watch: { // file watchers
		FOLDER: cb(file),
		...
	},
	
	// NODE endpoint routers

	reader: {		// endpoints to readers and engines
		TYPE: {			// index (scan, parse etc) files
			select: cb(req,res),	
		}, ...
		
		TYPE: {  		 // execute engine
			select: cb(req,res), 
			update: cb(req,res),
			delete: cb(req,res),
			update: cb(req,res)
		}, ...
	},

	emulator: {		// endpoints to virtual datasets
		select: {
			DATASET: cb(req,res),
			DATASET: cb(req,res),
			...		
		},
		...	
	},

	sender: {		// endpoints to send cached files
		AREA: cb(req,res),
		AREA: cb(req,res),
		...		
	},

	worker: {		// endpoints to workers and data fetcher
		wget: cb(req,res),	// data fetch service
		curl: cb(req,res),	// data fetch service
		http: cb(req,res), // data fetch service
		riddle: cb(req,res) // antibot protection interface
		...
	},
	
	// server specific
	
	port	: number of this http/https (0 disables listening),
	host	: "domain name" of http/https service,
	encrypt	: "passphrase" for a https server ("" for http),
	cores	: number of cores in master-worker relationship (0 for master only),

	paths	: {  // paths to various things
		... },

	site	: {  // vars and methods assessible to jade skins
		... },

	stop() 		: stop the service,
	thread(cb) 	: provide sql connection to cb(sql) with agnosticator extensions,

	// antibot protection

	nofaults: switch to enable/disabled server fault protection,
	busy	: number of millisecs to check busyness (0 disables),

	riddles	: number of riddles to create for anti-bot protection (0 disables)

	map		: {	 // map riddle DIGIT to JPEG files
		DIGIT:["JPEG1","JPEG2", ...],
		DIGIT:["JPEG1","JPEG2", ...],
		...	},

	// User administration 

	guest	: {	 // default guest profile 
		... },

	create(owner,pass,cb) 	: makes a cert with callback cb,
	validator(req,res) 		: validate cert during each request,
	emitter(socket) 		: communicate with users over web sockets,

	// Data fetching services

	retries	: count for failed fetches (0 no retries)
	notify	: switch to trace every fetch

	// MySQL db service

	mysql	: {host,user,pass,...} db connection parameters (null for no db),

	// Derived parameters

	name	: "service name"
		// derives site parms from mysql openv.apps by Nick=name
		// sets mysql name.table for guest clients,
		// identifies server cert name.pfx file

	started: // start time
	site: {db parameters} // loaded for specified opts.name,
	url : {master,worker} // urls for specified opts.cores,

TOTEM options use the [ENUM copy()](https://github.com/acmesds/enum) conventions:

	options =  {
		key: value, 						// set 
		"key.key": value, 					// index and set
		"key.key.": value,					// index and append
		OBJECT: [ function (){}, ... ], 	// add prototypes
		Function: function () {} 			// add callback
		:
		:
	}

## Installation

Download the latest version with

	git clone https://github.com/acmesds/totem

## Examples

Below sample are from the totem/test.js unit tester.  See Totem's [DEBE](https://github.com/acmesds/debe) 
for a far more complex use-case.  You may  also find Totem's [DSVAR](https://github.com/acmesds/dsvar) 
useful, if you wish to learn more about its database agnosticator.

### N1 - Just an interface

	var TOTEM = require("../totem");
	
	Trace(
		"Im simply a Totem interface so Im not running any service", {
		default_fetcher_endpts: TOTEM.reader,
		default_protect_mode: TOTEM.nofaults,
		default_cores_used: TOTEM.cores
	});
	
### N2 - 2 cores in fault protection mode

	Trace(
	`I **will become** a Totem client running in fault protection mode, no database yet, but I am running
	with 2 cores and the default endpoint routes` );

	var TOTEM = require("../totem").config({
		nofaults: true,
		cores: 2
	}, function (err) {
		Trace(err || "Ok - Im started and ready to rock!");
	});
	
### N3 - No cores but a database

	var TOTEM = require("../totem").config({
		name: "Totem",

		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		}
	},  function (err) {				
		Trace( err ||
			`I **have become** a Totem client, with no cores, but 
			I do have mysql database from which I've derived my start() 
			options from openv.apps.nick = TOTEM.name = "Totem"`, {

			mysql_derived_site_parms: TOTEM.site
		});
	});

### N4 - Encrypted with some endpoints

	var TOTEM = require("../totem").config({
			encrypt: ENV.SERVICE_PASS,
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			reader: {
				dothis: function dothis(req,res) {  //< named handlers are shown in trace in console
					res( "123" );

					Trace({
						do_query: req.query
					});
				},

				orthis: function orthis(req,res) {

					if (req.query.x)
						res( [{x:req.query.x+1,y:req.query.x+2}] );
					else
						res( new Error("We have a problem huston") );

					Trace( `Like dothis, but needs an ?x=value query`, {
						or_query: req.query,
						or_user: [req.client,req.group]
					});
				}
			}
		}, function (err) {
			Trace( err || 
				`Now stronger and **encrypted** -- try my https /dothis and /orthis endpoints.
				Ive only requested 1 core, and Im unprotected, with a mysql database.  
				If my client.pfx does not already exists, Totem will create the client.pfx 
				and associated pems (public client.crt and private client.key).` , {
					my_endpoints: TOTEM.reader
			});
		});
		
### N5 - Unencrypted but has an anti-bot shield

	var TOTEM = require("../totem").config({
		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		},

		riddles: 10
	}, function (err) {
		Trace( err ||
			`I am Totem client, with no cores but I do have mysql database and
			I have an anti-bot shield!!`, {
				mysql_derived_parms: TOTEM.site
		});
	});

## License

[MIT](LICENSE)
*/
