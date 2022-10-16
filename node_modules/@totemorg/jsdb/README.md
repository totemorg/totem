# [JSDB](https://www.npmjs.com/package/@totemorg/jsdb)

Provides mysql and neo4j agnosticators, data stashing and ingesting methods.

## Usage

Acquire and optionally configure **JSDB** as follows:

	const JSDB = require("jsdb").config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, sql => {
		Log( sql ? "sql connected" : "sql connection failed" );
	});
	
where configuration keys follow [ENUMS deep copy conventions](https://www.npmjs.com/package/@totemorg/enums).
	
## Manage

	npm install @totemstan/jsdb		# Install
	npm run start [ ? | $ | ...]	# Unit test
	npm run verminor				# Roll minor version
	npm run vermajor				# Roll major version
	npm run redoc					# Regen documentation

## Program Reference
<details>
<summary>
<i>Open/Close</i>
</summary>
## Modules

<dl>
<dt><a href="#module_JSDB">JSDB</a></dt>
<dd><p>Provides mysql and neo4j agnosticators.
This module documented in accordance with <a href="https://jsdoc.app/">jsdoc</a>.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#parseWild">parseWild()</a></dt>
<dd></dd>
</dl>

<a name="module_JSDB"></a>

## JSDB
Provides mysql and neo4j agnosticators.
This module documented in accordance with [jsdoc](https://jsdoc.app/).

**Requires**: <code>module:[enums](https://github.com/totemstan/enums)</code>, <code>module:[cluster](https://nodejs.org/docs/latest/api/)</code>, <code>module:[os](https://nodejs.org/docs/latest/api/)</code>, <code>module:[fs](https://nodejs.org/docs/latest/api/)</code>  
**Author**: [ACMESDS](https://totemstan.github.io)

### Dataset Dependencies

	openv.hawks Queried for moderaters when journalling a dataset.
	openv.journal	Updated with changes when journalling enabled.
	openv.locks Updated when record locks used (e.g. using forms).
	openv.files Databrick files when saving stashes
	openv._stats Databrick stats when saving stashes
	openv.events For storing event data during saving stashes
	openv.profile Client information to manage task queues
	openv.queues Task queues managed by regulator
	openv.cache Place to cache data

### Env Dependencies

	URL_MYSQL=http://$KEY_MYSQL@localhost:3306
	URL_NEO4J=http://$KEY_NEO4J@localhost:7474
	URL_TXMAIL=http://$KEY_TXMAIL@smtp.comcast.net:587
	URL_RXMAIL=
	URL_LEXNEX=https:$KEY_LEXNEX//services-api.lexisnexis.com/v1/  
**Example**  
```js
### Acquire JSDB and optionally configures its emitters and database
	const {neoThread, cyper, config} = JSDB = require("jsdb").config({ 
	
		emit:  (crude,parms) => {  // method to broadcast changes to other socket.io clients
		}, 
		
		mysql : {	// 	database connection parms
			host: ...
			user: ...
			pass: ...
		}

	});
```
**Example**  
```js
### Classic mysql access
	sqlThread( sql => {
	
		// classic query

		sql.query( "...", [ ... ], (err,info) => {
		});
		
		// crud helpers:

		sql.Index(ds, query, (keys,jsons) => { ... })
		sql.Delete(ds,where, (err,info) => { ... })
		sql.Update(ds,where,body,(err,info) => { ... })
		sql.Insert (ds,body,(err,info) => { ... } )
		sql.Select(ds, index, where, opts, (err,recs) => { ... })

		// there are also various enumerators and other utility functions.

	});
```
**Example**  
```js
### Somewhat experimental method to access mysql datasets by context
	sqlThread( sql => {
	
		sql.context( {ds1:ATTRIBUTES, ds2:ATTRIBUTES, ... }, ctx => {

			const {ds1,ds2, ... } = ctx;

		});
		
	});

where dsN are datasets having context ATTRIBUTES = {key:value, ... } described below. 

Using dataset contexts, JSDB permits queries of the form:

	ds.rec = { FIELD:VALUE, ... }			// update matched record(s) 
	ds.rec = [ {...}, {...}, ... ]			// insert record(s)
	ds.rec = null 							// delete matched record(s)
	ds.rec = function CB(recs,me) {...}		// select matched record(s)

or like this:

	ds.res = callback() { ... }
	ds.data = [ ... ]
	ds.rec = CRUDE

or in record-locked mode using:

	ds.rec = "lock.select"
	ds.rec = "lock.delete"
	ds.rec = "lock.update"
	ds.rec = "lock.insert"

Dataset ATTRIBUTES = { key: value, ... } provide SQL agnostication:

	table: 	DB.TABLE || TABLE
	where: 	[ FIELD, FIELD, ... ] | { CLAUSE:null, nlp:PATTERN, bin:PATTERN, qex:PATTERN, has:PATTERN, like:PATTERN, FIELD:VALUE, FIELD:[MIN,MAX], ...} | CLAUSE
	res: 	function CB(ds) {...}
	having: [ FIELD, VALUE ] | [ FIELD, MIN, MAX ] | {FIELD:VALUE, CLAUSE:null, FIELD:[MIN,MAX], ...} | CLAUSE
	order: 	[ {FIELD:ORDER, ...}, {property:FIELD, direction:ORDER}, FIELD, ...] | "FIELD, ..."
	group: 	[ FIELD, ...] | "FIELD, ..."
	limit: 	[ START, COUNT ] | {start:START, count:COUNT} | "START,COUNT"
	index:	[ FIELD, ... ] | "FIELD, ... " | { has:PATTERN, nlp:PATTERN, bin:PATTERN, qex:PATTERN, browse:"FIELD,...", pivot: "FIELD,..." }

In addition, update journalling, search tracking, query broadcasting, and auto field conversion is 
supported using these ATTRIBUTES:

	unsafeok: 	[true] | false 		// allow potentially unsafe queries
	trace: [true] | false			// trace queries
	journal: true | [false] 		// enable table journalling
	search: "field,field,..." 		// define fulltext search fields
	track: true | [false] 		// enable search tracking
	ag: "..." 		// aggregate where/having with least(?,1), greatest(?,0), sum(?), ...

The select query will callback the CB = [each || all || clone || trace] handler with each/all record(s) matched 
by .where, indexed by  .index, ordered by .order ordering, grouped by .group, filtered by .having 
and limited by .limit ATTRIBUTES.  Select will search for PATTERN 
using its index.nlp (natural language parse), index.bin (binary mode), index.qex (query expansion), 
or group recording according to its index.browse (file navigation) or index.pivot (joint statistics).

Non-select queries will broadcast a change to all clients if a where.ID is presented (and an emiitter
was configured), and will journal the change when jounalling is enabled.
```
**Example**  
```js
### Access the neo4j database
	neoThread( neo => {	
		neo.cypher( "...", [ ... ], (err,recs) => {
		});
	});
```
**Example**  
```js
### Create dataset on a new sql thread
	sqlThread( sql => {
	
		var ds = new JSDB.DS(sql,{
			table:"test.x", 
			rec: (recs) => console.log(recs) 
		});
		
	});
	
```
**Example**  
```js
### Create dataset and access each record
	var ds = new JSDB.DS(sql,{
		table:"test.x",
		limit:[0,1],
		rec: function each(rec) {console.log(rec)}
	});
		
	var ds = new JSDB.DS(sql,{
		table:"test.x",
		trace:1,
		where:{ x: "x=12" },
		rec: function each(rec) {console.log(rec)}});
		
	var ds = new JSDB.DS(sql,{
		table:"test.x",
		trace:1,
		where:{ a: "a = 0.5"},
		rec: function each(rec) {console.log(rec)}
	});
	
	var ds = new JSDB.DS(sql,{
		table:"test.x",
		trace:1,
		where:{ a: "a<30"},
		rec: function each(rec) {console.log(rec)}
	});
	
```
**Example**  
```js
### Create dataset and access all records
	var ds = new JSDB.DS(sql,{
		table:"test.x",
		trace:1,
		where:{
			a: "a<30", 
			b: "b!=0",
			x: "x like '%find%'",
			ID: "ID=5"},
		rec: (recs) => console.log(recs)
	});
	
	var ds = new JSDB.DS(sql,{
		table:"test.x",
		trace:1,
		order:[{property:"a",direction:"asc"}],
		rec: (recs) => console.log(recs)
	});
	
	var ds = new JSDB.DS(sql,{
		table:"test.x",
		trace:1,
		index:{pivot:"root"},
		group:"a,b",
		rec: (recs) => console.log(recs)
	});
	
```
**Example**  
```js
### Select ds record(s) matched by ds.where
	ds.where = {ID: "ID=1"};
	ds.rec = (rec) => console.log(rec);
	
```
**Example**  
```js
### Delete ds record(s) matched by ds.where
	ds.where = {ID:"ID=2"}
	ds.rec = null
	
```
**Example**  
```js
### Update ds record(s) matched by ds.where
	ds.where = null
	ds.rec = [{a:1,b:2,ds:"hello"},{a:10,b:20,x:"there"}]
	ds.where = {ID: "ID=3"}
	ds.rec = {a:100} 
```

* [JSDB](#module_JSDB)
    * _static_
        * [.dsAttrs](#module_JSDB.dsAttrs)
        * [.savers](#module_JSDB.savers)
        * [.dropCard](#module_JSDB.dropCard)
        * [.queues](#module_JSDB.queues)
        * [.errors](#module_JSDB.errors)
        * [.attrs](#module_JSDB.attrs)
        * [.config(opts)](#module_JSDB.config)
        * [.sqlEach()](#module_JSDB.sqlEach)
        * [.sqlAll()](#module_JSDB.sqlAll)
        * [.sqlFirst()](#module_JSDB.sqlFirst)
        * [.sqlContext()](#module_JSDB.sqlContext)
    * _inner_
        * [~getContext()](#module_JSDB..getContext)
        * [~getKeys()](#module_JSDB..getKeys)
        * [~getKeysFull()](#module_JSDB..getKeysFull)
        * [~getJsons()](#module_JSDB..getJsons)
        * [~getTexts()](#module_JSDB..getTexts)
        * [~getSearchables()](#module_JSDB..getSearchables)
        * [~getGeometries()](#module_JSDB..getGeometries)
        * [~getTables()](#module_JSDB..getTables)
        * [~context()](#module_JSDB..context)
        * [~cache()](#module_JSDB..cache)
        * [~beginBulk()](#module_JSDB..beginBulk)
        * [~endBulk()](#module_JSDB..endBulk)
        * [~flattenCatalog()](#module_JSDB..flattenCatalog)
        * [~forFirst()](#module_JSDB..forFirst)
        * [~forEach()](#module_JSDB..forEach)
        * [~forAll()](#module_JSDB..forAll)
        * [~Index(ds, query, cb)](#module_JSDB..Index)
        * [~Delete(ds, where, cb)](#module_JSDB..Delete)
        * [~Update(ds, where, body, cb)](#module_JSDB..Update)
        * [~Insert(ds, body, cb)](#module_JSDB..Insert)
        * [~Select(ds, index, where, opts, cb)](#module_JSDB..Select)
        * [~ingestFile(path, opts, cb)](#module_JSDB..ingestFile)
        * [~serial()](#module_JSDB..serial)
        * [~saveContext()](#module_JSDB..saveContext)
            * [~saveEvents(sql, evs, ctx, cb)](#module_JSDB..saveContext..saveEvents)
                * [~stashify(evs, watchKey, targetPrefix, ctx, stash, cb)](#module_JSDB..saveContext..saveEvents..stashify)
        * [~cypher()](#module_JSDB..cypher)
        * [~clearNet()](#module_JSDB..clearNet)
        * [~saveNodes()](#module_JSDB..saveNodes)
        * [~findAssoc()](#module_JSDB..findAssoc)
        * [~saveNet()](#module_JSDB..saveNet)
        * [~saveEdges()](#module_JSDB..saveEdges)

<a name="module_JSDB.dsAttrs"></a>

### JSDB.dsAttrs
Reserved for dataset attributes

**Kind**: static property of [<code>JSDB</code>](#module_JSDB)  
**Cfg**: <code>Object</code>  
<a name="module_JSDB.savers"></a>

### JSDB.savers
**Kind**: static property of [<code>JSDB</code>](#module_JSDB)  
**Cfg**: <code>Object</code>  
<a name="module_JSDB.dropCard"></a>

### JSDB.dropCard
**Kind**: static property of [<code>JSDB</code>](#module_JSDB)  
**Cfg**: <code>Object</code>  
<a name="module_JSDB.queues"></a>

### JSDB.queues
**Kind**: static property of [<code>JSDB</code>](#module_JSDB)  
**Cfg**: <code>Object</code>  
<a name="module_JSDB.errors"></a>

### JSDB.errors
**Kind**: static property of [<code>JSDB</code>](#module_JSDB)  
**Cfg**: <code>Object</code>  
<a name="module_JSDB.attrs"></a>

### JSDB.attrs
**Kind**: static property of [<code>JSDB</code>](#module_JSDB)  
**Cfg**: <code>Object</code>  
<a name="module_JSDB.config"></a>

### JSDB.config(opts)
Configure JSDB with provided options with optional callback

**Kind**: static method of [<code>JSDB</code>](#module_JSDB)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | Options |

<a name="module_JSDB.sqlEach"></a>

### JSDB.sqlEach()
**Kind**: static method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB.sqlAll"></a>

### JSDB.sqlAll()
**Kind**: static method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB.sqlFirst"></a>

### JSDB.sqlFirst()
**Kind**: static method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB.sqlContext"></a>

### JSDB.sqlContext()
**Kind**: static method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getContext"></a>

### JSDB~getContext()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getKeys"></a>

### JSDB~getKeys()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getKeysFull"></a>

### JSDB~getKeysFull()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getJsons"></a>

### JSDB~getJsons()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getTexts"></a>

### JSDB~getTexts()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getSearchables"></a>

### JSDB~getSearchables()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getGeometries"></a>

### JSDB~getGeometries()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..getTables"></a>

### JSDB~getTables()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..context"></a>

### JSDB~context()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..cache"></a>

### JSDB~cache()
Implements generic cache.  Looks for cache given opts.key and, if found, returns cached results on cb(results);
otherwse, if not found, returns results via opts.make(probeSite, opts.parms, cb).  If cacheing fails, then opts.default 
is returned.  The returned results will always contain a results.ID for its cached ID.  If a opts.default is not provided,
then the cb callback in not made.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..beginBulk"></a>

### JSDB~beginBulk()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..endBulk"></a>

### JSDB~endBulk()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..flattenCatalog"></a>

### JSDB~flattenCatalog()
Flatten entire database for searching the catalog.  Need to rework using serial

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..forFirst"></a>

### JSDB~forFirst()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..forEach"></a>

### JSDB~forEach()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..forAll"></a>

### JSDB~forAll()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..Index"></a>

### JSDB~Index(ds, query, cb)
Index records.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  

| Param | Type | Description |
| --- | --- | --- |
| ds | <code>String</code> | name of dataset table |
| query | <code>Object</code> | hash of search options {"=": {....}, ">": {....}, ....} |
| cb | <code>function</code> | callback(keys,jsons) |

<a name="module_JSDB..Delete"></a>

### JSDB~Delete(ds, where, cb)
Delete records.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  

| Param | Type | Description |
| --- | --- | --- |
| ds | <code>String</code> | name of dataset table |
| where | <code>Object</code> | hash of search options {"=": {....}, ">": {....}, ....} |
| cb | <code>function</code> | callback(err,info) |

<a name="module_JSDB..Update"></a>

### JSDB~Update(ds, where, body, cb)
Update records.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  

| Param | Type | Description |
| --- | --- | --- |
| ds | <code>String</code> | name of dataset table |
| where | <code>Object</code> | hash of search options {"=": {....}, ">": {....}, ....} |
| body | <code>Object</code> | data for update |
| cb | <code>function</code> | callback(err,info) |

<a name="module_JSDB..Insert"></a>

### JSDB~Insert(ds, body, cb)
Insert records.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  

| Param | Type | Description |
| --- | --- | --- |
| ds | <code>String</code> | name of dataset table |
| body | <code>Object</code> | data for insert |
| cb | <code>function</code> | callback(err,info) |

<a name="module_JSDB..Select"></a>

### JSDB~Select(ds, index, where, opts, cb)
Select records.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  

| Param | Type | Description |
| --- | --- | --- |
| ds | <code>String</code> | name of dataset table |
| index | <code>Object</code> | hash of { "TO":"FROM", "TO":"STORE$KEY", ....} keys to select |
| where | <code>Object</code> | hash of search options {"=": {....}, ">": {....}, ....} |
| opts | <code>Object</code> | limit,offset,client,pivot,browse,sort options |
| cb | <code>function</code> | callback(err,recs) |

<a name="module_JSDB..ingestFile"></a>

### JSDB~ingestFile(path, opts, cb)
Ingest a comma-delimited, column-headered stream at path using the supplied
streaming options.  Records are inserted into the sql target table defined 
by the path = /.../target.type.  The keys="recKey:asKey sqlType,..." defines
how record values are stored.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | source file |
| opts | <code>Object</code> | {keys,comma,newline,limit,as,batch} streaming options |
| cb | <code>function</code> | Callback([record,...]) |

<a name="module_JSDB..serial"></a>

### JSDB~serial()
Serialize a select query.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
**Example**  
```js
sql.serial({
		ds1: "SELECT ... ",
		ds2: "SELECT ... ", ...
		ds3: "/dataset?...", 
		ds4: "/dataset?...", ...
	}, ctx, ctx => {
		// ctx[ ds1 || ds2 || ... ] records
	});
```
<a name="module_JSDB..saveContext"></a>

### JSDB~saveContext()
Aggregate and save events evs = [ev, ...] || { } under direction of the 
supplied context ctx = { Save: { ... }, Ingest: true||false, Export: true||false,
... }.  Stashify is used to 
aggreagate data using [ev, ...].stashify( "at", "Save_", ctx ) where events ev = 
{ at: KEY, A: a1, B: b1, ... } || { x: x1, y: y1 } are saved in Save_KEY = 
{A: [a1, a2,  ...], B: [b1, b2, ...], ...} iff Save_KEY is in the supplied ctx.

**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  

* [~saveContext()](#module_JSDB..saveContext)
    * [~saveEvents(sql, evs, ctx, cb)](#module_JSDB..saveContext..saveEvents)
        * [~stashify(evs, watchKey, targetPrefix, ctx, stash, cb)](#module_JSDB..saveContext..saveEvents..stashify)

<a name="module_JSDB..saveContext..saveEvents"></a>

#### saveContext~saveEvents(sql, evs, ctx, cb)
Stash aggregated events evs = { at: "AT", ... } into context Save_AT keys then callback cb
with remaining events.

**Kind**: inner method of [<code>saveContext</code>](#module_JSDB..saveContext)  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>object</code> | sql connection |
| evs | <code>object</code> | events to be saved |
| ctx | <code>object</code> | notebook context |
| cb | <code>function</code> | callback(ev,stat) |

<a name="module_JSDB..saveContext..saveEvents..stashify"></a>

##### saveEvents~stashify(evs, watchKey, targetPrefix, ctx, stash, cb)
Aggregate ctx keys into optional Save_KEY stashes such that:

	[	
		{ at: "KEY", A: a1, B: b1, ... }, 
		{ at: "KEY", A: a2, B: b2, ... }, ... 
		{ x: x1, y: y1 },
		{ x: x2, y: y2 },	...
	].stashify( "at", "Save_", {Save_KEY: {}, ...} , stash, cb )

creates stash.Save_KEY = {A: [a1, a2,  ...], B: [b1, b2, ...], ...} iff Save_KEY is in the
supplied context ctx.   If no stash.rem is provided by the ctx, the {x, y, ...} are 
appended (w/o aggregation) to stash.remainder. Conversely, if ctx contains a stash.rem, 
the {x, y, ...} are aggregated to stash.rem.

**Kind**: inner method of [<code>saveEvents</code>](#module_JSDB..saveContext..saveEvents)  

| Param | Type | Description |
| --- | --- | --- |
| evs | <code>object</code> | events to be saved |
| watchKey | <code>String</code> | this = [ { watchKey:"KEY", x:X, y: Y, ...}, ... } |
| targetPrefix | <code>String</code> | stash = { (targetPrefix + watchKey): { x: [X,...], y: [Y,...], ... }, ... } |
| ctx | <code>Object</code> | plugin context keys |
| stash | <code>Object</code> | refactored output suitable for a Save_KEY |
| cb | <code>function</code> | callback(ev,stat) returns refactored result to put into stash |

<a name="module_JSDB..cypher"></a>

### JSDB~cypher()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..clearNet"></a>

### JSDB~clearNet()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..saveNodes"></a>

### JSDB~saveNodes()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..findAssoc"></a>

### JSDB~findAssoc()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..saveNet"></a>

### JSDB~saveNet()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="module_JSDB..saveEdges"></a>

### JSDB~saveEdges()
**Kind**: inner method of [<code>JSDB</code>](#module_JSDB)  
<a name="parseWild"></a>

## parseWild()
**Kind**: global function  
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
