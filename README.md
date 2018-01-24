/**
@class TOTEM
	[SourceForge](https://sourceforge.net) 
	[github](https://github.com/acmesds/totem.git) 
	[geointapps](https://git.geointapps.org/acmesds/totem)
	[gitlab](https://gitlab.weat.nga.ic.gov/acmesds/totem.git)
	
# TOTEM

TOTEM replaces a slew of god-awful NodeJS middleware (like Express) by providing the 
following selectable features:
  
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
  
As documented in its api, TOTEM provides ENDPOINTs:

	(select) GET 	 /NODE $$ NODE ...
	(update) PUT 	 /NODE $$ NODE ...
	(insert) POST 	 /NODE $$ NODE ...
	(delete) DELETE /NODE $$ NODE ...

 to access a NODE:

	DATASET.TYPE ? QUERY ? QUERY ...
	ENGINE.TYPE ? QUERY ? QUERY ...
	FILEPATH.TYPE ? QUERY ? QUERY ...
	COMMAND.TYPE ? QUERY ? QUERY ...

using an optional QUERY:

	KEY=VALUE & EXPRESSION ...

where the TYPE will format data:

	KEY=VALUE & EXPRESSION ...

TOTEM provides default TYPEs to format data:

	db | xml | csv | json
	
If TOTEM was configured for antibot support, TOTEM will provide a *riddle* endpoint for clients to validate themselves.

## Installation

Clone from one of the repos. 

## Databases

* openv.profiles Reads and populates when clients arrive  
* openv.sessions Reads and populates when client sessions are established  
* openv.riddles Builds on config() and reads when clients arrive  
* openv.apps Reads on config() to override TOTEM options and define site context parameters

## Use

TOTEM is configured and started like this:

	var TOTEM = require("../totem").config({
			key: value, 						// set key
			"key.key": value, 					// indexed set
			"key.key.": value,					// indexed append
			OBJECT: [ function (){}, ... ], 	// add OBJECT prototypes 
			Function: function () {} 			// add chained initializer callback
			:
			:
		}, function (err) {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where its configuration keys follow the [ENUM copy()](https://github.com/acmesds/enum) conventions and
are described in its [PRM](/shares/prm/totem/index.html).
  
The examples below are from TOTEM's test.js unit tester.  See [DEBE](https://github.com/acmesds/debe) 
for a far more complex use-case.  You may  also find Totem's [DSVAR](https://github.com/acmesds/dsvar) 
useful, if you wish to learn more about its database agnosticator.

### N1 - Just an interface

	var TOTEM = require("../totem");

	Trace(
		"Im simply a Totem interface so Im not running any service", {
		default_fetcher_endpts: TOTEM.byType,
		default_protect_mode: TOTEM.nofaults,
		default_cores_used: TOTEM.cores
	});
	
### N2 - 2 cores in fault protection mode

	Trace(
`I **will become** a Totem client running in fault protection mode, no database yet, but I am running
with 2 cores and the default endpoint routes` );

	var TOTEM = require("../totem").config({
		name: "iamwhoiam",
		nofaults: true,
		cores: 2
	}, function (err) {
		Trace(err || "Ok - Im started with my own config parms and am ready to rock - but no DB!");
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
`I used the default openv.apps config options for the Nick="Totem" app, and **have become** a Totem client 
with no cores, but I do have mysql database from which I've derived my start() 
options from openv.apps.nick = TOTEM.name = "Totem"`, {

				mysql_derived_site_parms: TOTEM.site
			});
		});

### N4 - Encrypted with some endpoints

	var TOTEM = require("../totem").config({
			mysql: {
				host: ENV.MYSQL_HOST,
				user: ENV.MYSQL_USER,
				pass: ENV.MYSQL_PASS
			},
			byType: {
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

					Trace(
	`Like dothis, but needs an ?x=value query`, {
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
				my_endpoints: TOTEM.byType
			});
		});
		
### N5 - Unencrypted but has an anti-bot shield

	var TOTEM = require("../totem").config({
		mysql: {
			host: ENV.MYSQL_HOST,
			user: ENV.MYSQL_USER,
			pass: ENV.MYSQL_PASS
		},

		name: "allmine",

		riddles: 20
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
