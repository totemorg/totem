# TOTEM

TOTEM provides a basic http/https web service with the following customizable features:

	+ endpoint routing
	+ denial-of-service protection
	+ web sockets for inter-client communications
	+ client profiles 
	+ account management for priviledged hawks and normal users
	+ PKI encryption and authentication
	+ fault protected run states
	+ indexing, uploading, downloading and cacheing static files
	+ antibot protection
	+ crud interface
	+ mysql database agnosticator 
	+ neo4j graph database 
	+ poll files and services
	+ automattic server cert generation
	+ task sharding
	+ job queues
	+ file stream and ingest
	+ data fetch w and w/o rotating proxies
  
TOTEM defines endpoints:

	POST / NODE ?? NODE ...
	GET / NODE ?? NODE ...
	PUT / NODE ?? NODE ...
	DELETE / NODE ?? NODE ...

to access dataset, file or command NODEs:

	DATASET.TYPE ? QUERY
	AREA/PATH/FILE.TYPE ? QUERY
	COMMAND.TYPE ? QUERY

By default, TOTEM provides `db | xml | csv | json` TYPEs for converting DATASETs, 
`riddle | task | ping` COMMANDs for validating a session, sharding tasks,
and the `stores | shares` file AREAs for sharing static files.

## Installation

Clone [TOTEM base web service](https://github.com/totemstan/totem) || [COE](https://sc.appdev.proj.coe/acmesds/totem) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/totem) into your PROJECT/totem folder.   

TOTEM passwords to sql databases etc are held in _pass.sh; revise as needed.
TOTEM sql tables can be primed/reset using `maint mysql prime`.

## Requires

[ENUM standard enumerators](https://github.com/totemstan/enum) || [COE](https://sc.appdev.proj.coe/acmesds/enum) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/enum), [JSDB database agnosticator](https://github.com/totemstan/jsdb) || [COE](https://sc.appdev.proj.coe/acmesds/jsdb) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/jsdb).

## Manage 

	npm test [ ? || T1 || T2 || ...]	# Start or unit test
	npm run [ prmprep || prmload ]		# Update Program Ref Manual
	npm run [ edit || start ]			# Configure environment

## Usage

Require, configure and start TOTEM:
	
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

Feel free to [submit and status TOTEM issues](http://totem.hopto.org/issues.view) || [COE](https://totem.west.ile.nga.ic.gov/issues.view) || [SBU](https://totem.nga.mil/issues.view), [contribute TOTEM notebooks](http://totem.hopto.org/shares/notebooks/) || [COE](https://totem.west.ile.nga.ic.gov/shares/notebooks/) || [SBU](https://totem.nga.mil/shares/notebooks/),
[inspect TOTEM requirements](http://totem.hopto.org/reqts.view) || [COE](https://totem.west.ile.nga.ic.gov/reqts.view) || [SBU](https://totem.nga.mil/reqts.view), [browse TOTEM holdings](http://totem.hopto.org/) || [COE](https://totem.west.ile.nga.ic.gov/) || [SBU](https://totem.nga.mil/), 
or [follow TOTEM milestones](http://totem.hopto.org/milestones.view) || [COE](https://totem.west.ile.nga.ic.gov/milestones.view) || [SBU](https://totem.nga.mil/milestones.view).

## License

[MIT](LICENSE)
