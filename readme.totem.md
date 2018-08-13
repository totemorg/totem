/**
@class TOTEM
	[SourceForge](https://sourceforge.net) 
	[github](https://github.com/acmesds/totem.git) 
	[geointapps](https://git.geointapps.org/acmesds/totem)
	[gitlab](https://gitlab.weat.nga.ic.gov/acmesds/totem.git)

# TOTEM

TOTEM  provides a service with the following selectable features:

	+ routing methods for table, engine, and file objects
	+ denial-of-service protection
	+ web sockets for inter-client communications
	+ client profiles (e.g. banning, journalling, hawking, challenging and polling)
	+ account management by priviledged hawks and normal users
	+ hyper-threading in a master-worker or master-only relationship
	+ PKI channel encryption and authentication
	+ no-faulting (protected) run state
	+ transfer, indexing, saving and selective cacheing of static mime files
	+ per-client antibot challenges: profile challenges like (riddle), (card), (ids), (yesno), (rand)om, (bio)metric
	+ syncronized crude operations on mutiple endpoints
	+ database agnosticator (default MySQL-Cluster)
	+ poll files and services
	+ automattic server cert generation
	+ parallel tasking
  
 thus replacing a slew of god-awful middleware (like Express).  As documented in its api, 
 TOTEM provides a CRUD-compliant interface to a NODE at the endpoints:

	POST		/NODE ?? NODE ...
	GET			/NODE ?? NODE ...
	PUT			/NODE ?? NODE ...
	DELETE	/NODE ?? NODE ...

 to access its datasets, engines, files and commands at a NODE:

	DATASET.TYPE ? QUERY ? QUERY ...
	ENGINE.TYPE ? QUERY ? QUERY ...
	FILEPATH.TYPE ? QUERY ? QUERY ...
	COMMAND.TYPE ? QUERY ? QUERY ...

The default TOTEM configure provides TYPE formatters:

	db | xml | csv | json

and COMMAND endpoints:

	riddle | task
	
## Installing

Clone from one of the repos into your PROJECT/totem.  

Dependencies:

* [ENUM basic enumerators](https://github.com/acmesds/enum)
* [JSDB database agnosticaor](https://github.com/acmesds/jsdb)
* openv.profiles Updates when a client arrives  
* openv.sessions Updates when a client session is established  
* openv.riddles Builds on config() and updates when a client arrives  
* openv.apps Read on config() to override TOTEM options and define site context parameters

## Using

To start TOTEM, simply run the desired test.js configuration:
	
	. maint.sh [N1 | N2 | ...]
	
Each configuration follow the 
[ENUM deep copy() conventions](https://github.com/acmesds/enum):

	var TOTEM = require("totem").config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, function (err) {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where its [key:value options](/shares/prm/totem/index.html) override the defaults
primed from [nick:"NAME"](/apps.view).

### N1 - Just an interface
		
	var TOTEM = require("../totem");

	Trace({
		msg: "Im simply a Totem interface so Im not even running as a service", 
		default_fetcher_endpts: TOTEM.byTable,
		default_protect_mode: TOTEM.faultless,
		default_cores_used: TOTEM.cores
	});
	
### N2 - A do-little service

	var TOTEM = require("../totem").config({
		name: "iamwhoiam",
		faultless: true,
		cores: 2
	}, function (err) {

		Trace( err || 
			`I'm a Totem service running in fault protection mode, no database, no UI; but I am running
			with 2 cores and the default endpoint routes` );

	});

### N3 - A service with a database

	var TOTEM = require("../totem").config({
		name: "Totem",

		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		}
	},  function (err) {				
		Trace( err ||
			`I'm a Totem service with no cores. I do, however, now have a mysql database from which I've derived 
			my startup options (see the openv.apps table for the Nick="Totem").  
			No endpoints to speak off (execept for the standard wget, riddle, etc) but you can hit "/files/" to index 
			these files. `
		);
	});
		
### N4 - A service with custom endpoints
	
	var TOTEM = require("../totem").config({
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
	}, function (err) {
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
		
### N5 - A service with antibot protection
	
	var TOTEM = require("../totem").config({
		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		},

		name: "allmine",

		riddles: 20
	}, function (err) {
		Trace( err || {
			msg:
				`I am Totem client, with no cores but I do have mysql database and I have an anti-bot shield!!  Anti-bot
				shields require a Encrypted service, and a UI (like that provided by DEBE) to be of any use.`, 
			mysql_derived_parms: TOTEM.site
		});
	});

### N6 - A service with tasking endpoints

	var TOTEM = require("../totem").config({  // configure the service for tasking
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

	}, function (err) {
		Trace( err || "Testing tasker with database and 3 cores at /test endpoint" );
	});

## Contributing

See our [issues](/issues.view), [milestones](/milestones.view), [s/w requirements](/swreqts.view),
and [h/w requirements](/hwreqts.view).

## License

[MIT](LICENSE)
*/
