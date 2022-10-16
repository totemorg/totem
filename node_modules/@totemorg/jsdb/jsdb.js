// UNCLASSIFIED

const	
	// nodejs modules
	ENV = process.env,
	CLUSTER = require("cluster"),
	OS = require("os"),	
	FS = require("fs"), 				//< filesystem and uploads

	// totem
	{ mysqlCon,
		Copy,Each,Start,Log,
	 isFunction,isString,isArray,isEmpty,isObject,
	 streamFile,
	 sqlThread, neoThread, neo4jCon
	} = ENUMS = require("./enums");

Copy({
/**
*/
	parseWild: function () { return this.replace(/\*/g, "%"); }
	
	/*
	parseKEY: function ( escape ) {
		const 
			[x,lhs,op,rhs] = this.match( /(.*?)(\$)(.*)/ ) || [];
		
		//Log(this,x,[lhs,op,rhs]);
		
		if ( x ) 
			if (lhs) {
				var idx = rhs.split(",");
				idx.forEach( (key,n) => idx[n] = escape( n ? key : op+key) );
				return `json_extract(${escapeId(lhs)}, ${idx.join(",")} )`;
			}

			else
				return escapeId(rhs);
		
		else
			return escape(this+"");
		/ *
		return this.parseOP( /(.*?)(\$)(.*)/, key => escape(key) , (lhs,op,rhs) => {
			
			if (lhs) {
				var idx = rhs.split(",");
				idx.forEach( (key,n) => idx[n] = escape( n ? key : op+key) );
				return `json_extract(${escapeId(lhs)}, ${idx.join(",")} )`;
			}

			else
				return escapeId(rhs);
		}); * /
		
	}  */
}, String.prototype);

/**
Provides mysql and neo4j agnosticators.
This module documented in accordance with [jsdoc]{@link https://jsdoc.app/}.

@module JSDB
@author [ACMESDS](https://totemstan.github.io)

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

@requires [enums](https://github.com/totemstan/enums)
@requires [cluster](https://nodejs.org/docs/latest/api/)
@requires [os](https://nodejs.org/docs/latest/api/)
@requires [fs](https://nodejs.org/docs/latest/api/)

@example
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

@example
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

@example
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

@example
### Access the neo4j database
	neoThread( neo => {	
		neo.cypher( "...", [ ... ], (err,recs) => {
		});
	});

@example
### Create dataset on a new sql thread
	sqlThread( sql => {
	
		var ds = new JSDB.DS(sql,{
			table:"test.x", 
			rec: (recs) => console.log(recs) 
		});
		
	});
	
@example
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
	
@example
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
	
@example
### Select ds record(s) matched by ds.where
	ds.where = {ID: "ID=1"};
	ds.rec = (rec) => console.log(rec);
	
@example
### Delete ds record(s) matched by ds.where
	ds.where = {ID:"ID=2"}
	ds.rec = null
	
@example
### Update ds record(s) matched by ds.where
	ds.where = null
	ds.rec = [{a:1,b:2,ds:"hello"},{a:10,b:20,x:"there"}]
	ds.where = {ID: "ID=3"}
	ds.rec = {a:100} 

*/

const { Trace, dropCard } = JSDB = module.exports = {
	Trace: (msg, ...args) => `jsdb>>>${msg}`.trace( args ),

/**
Reserved for dataset attributes
@cfg {Object}
*/
	dsAttrs: {
	},
		
/**
Configure JSDB with provided options with optional callback
@param {Object} opts Options
*/		

	config: (opts,cb) => {  
		if (opts) Copy(opts,JSDB,".");
		if (cb) sqlThread( sql => cb(sql) );
		return JSDB;
	},
	
/**
@cfg {Object} 
*/		

	savers: {
		_net: (path,nets) => {
			//Trace(">>>save nets", paths);

			neoThread( neo => {
				nets.forEach( net => {
					const 
						{name, nodes, edges} = net;

					//neo.clearNet(netName);
					neo.saveNet( path+"_"+name, nodes, edges );
				});
			});
		},

		_jpg: (path,jpgs) => {
			jpgs.forEach( jpg => {
				const
					{ input, values, index } = jpg,
					img = input,
					cols = values.length,
					rows = index.length,
					isEmpty = values[0] ? false : true,
					toColor = JIMP.rgbaToInt;

				Trace("save jpg", {
					dims: [img.bitmap.height, img.bitmap.width], 
					save: path,
					gen: [rows, cols],
					empty: isEmpty
				});

				if ( !isEmpty )
					for ( var col=0, vals=values[0]; col<cols; col++, vals=values[col] ) {
						//Trace("vals", vals);
						for ( var row=0; row<rows; row++ ) {
							var L = max(0,min(255,floor(vals[row][0])));
							//Trace(L, col, row, "->", index[row]);
							img.setPixelColor( toColor(L,L,L,255), col, index[row] );
						}
					}

				img.write( path, err => Trace("save jpg", err) );

				delete jpg.input;

				/*
				if (keep) {
					jpg.values = stat.values.shuffle(keep); // Array.from(values.slice(0,keep)).$( (n,v) => v[n] = v[n].slice(0,keep) );
					jpg.index = index.shuffle(keep); // index.slice(0,keep);
				}
				else {
					delete jpg.values;
					delete jpg.index;
				}*/
			});
		},

		_txt: (path,txts) => {
			FS.writeFileSync( "./stores/"+path+".txt", txt.join("\n"), "utf8");
		},

		_json: (path,files) => { 
			Each(files, (key,data) => {
				//Trace(">>>save file", key);
				FS.writeFileSync( "./stores/"+path+"_"+key+".json", JSON.stringify(data), "utf8");			
			});
		}
	},
		
/**
@cfg {Object} 
*/		
	dropCard: "$drop",
	
/**
@cfg {Object} 
*/		
	queues: { 	//< reserve for job queues
	},

/**
@cfg {Object} 
*/		
	errors: {		//< errors messages
		noConnect: new Error("sql pool exhausted or undefined"),
		nillUpdate: new Error("nill update query"),
		unsafeQuery: new Error("unsafe queries not allowed"),
		unsupportedQuery: new Error("query not supported"),
		invalidQuery: new Error("query invalid"),
		noTable: new Error("dataset definition missing table name"),
		noDB: new Error("no database connected"),
		noLock: new Error("record lock ID missing"),
		isUnlocked: new Error("record never locked"),
		failLock: new Error("record locking failed"),
		isLocked: new Error("record already locked"),
		noExe: new Error("record execute undefined"),
		noRecord: new Error("no record found")
	},

	//probeSite: (url,opt) => { throw new Error("data probeSite not configured"); }, //< data probeSite

/**
@cfg {Object} 
*/		
	attrs: {		//< reserved for dataset attributes derived during config
		default:	{ 					// default dataset attributes
			sql: null, // sql connector
			query: "",  // sql query
			opts: null,	// ?-options to sql query
			unsafeok: true,  // allow/disallow unsafe queries
			trace: false,   // trace ?-compressed sql queries
			journal: true,	// attempt journally of updates to jou.table database
			ag: "", 		// default aggregator "" implies "least(?,1)"
			index: {select:"*"}, 	// data search and index
			client: "guest", 		// default client 
			//track: false, 		// change journal tracking
			search: ""  // key,key, .... fulltext keys to search
		}		
	},
		
/**
*/
	sqlEach: (trace, query, args, cb) => sqlThread( sql => sql.forEach( trace, query, args, rec => cb(rec, sql) ) ),

/**
*/
	sqlAll: (trace, query, args, cb) => sqlThread( sql => sql.forAll( trace, query, args, recs => cb(recs, sql) ) ),

/**
*/
	sqlFirst: (trace, query, args, cb) => sqlThread( sql => sql.forFirst(trace, query, args, rec => cb(rec, sql) ) ),
	
/**
*/
	sqlContext: (ctx, cb) => sqlThread( sql => sql.context( ctx, dsctx => cb(dsctx, sql) ) )

	/*	
	thread: sqlThread,
	forEach: sqlEach,
	forAll: sqlAll,
	forFirst: sqlFirst,
	context: sqlContext 
	*/
};

//============ mysql key access

/**
*/
function getContext(ds, query, cb) {
	const 
		sql = this,
		name = query.name || query.Name,
		[db,host] = ds.split(".");
	
	sql.getKeys(ds, "Field NOT LIKE 'Save%'", ({Field,Type}) => {
		sql.query(
			`SELECT ${Field.join(',')} FROM ?? WHERE ? LIMIT 1`,
			[ ds, {Name:name} ], 
			(err,recs) => {
			
			if ( err )
				cb( null );
				
			else
			if ( ctx = recs[0] ) {
				Field.forEach( (field,i) => {
					if ( Type[i] == "json" )
						ctx[ field ] = JSON.parse( ctx[ field ] );
				});

				ctx.Host = host;
				cb( Copy(query, ctx) );
			}
			
			else
				cb( null );
		});
	});
}

/**
*/
function getKeys(ds, query, cb) {	// callback cb(fields,keys)
	this.query( 
		isString(query)
		? query
				? `SHOW COLUMNS FROM ?? WHERE ${query}`
				: "SHOW COLUMNS FROM ??"
		: query.Index_type 
			? `SHOW KEYS FROM ?? WHERE least(?,1)`
			: `SHOW COLUMNS FROM ?? WHERE least(?,1)`, 
		[ds, query], (err,recs) => {

			//Log("getkeys", err,recs, ds, query);
			cb( err ? null : recs.get("Field&Type") );
	});	
}

/**
*/
function getKeysFull(ds, query, cb) {	// callback cb(fields,keys)
	this.query( 
		isString(query)
		? query
				? `SHOW FULL COLUMNS FROM ?? WHERE ${query}`
				: "SHOW FULL COLUMNS FROM ??"
		: query.Index_type 
			? `SHOW KEYS FROM ?? WHERE least(?,1)`
			: `SHOW COLUMNS FROM ?? WHERE least(?,1)`, 
		[ds, query], (err,recs) => {

		cb( err ? null : recs.get("Field&Type&Comment") );
	});	
}

/**
*/
function getJsons(ds, cb) {
	this.getKeys(ds, {Type:"json"}, ({Field}) => cb(Field) );
}

/**
*/
function getTexts(ds, cb) {
	this.getKeys(ds, {Type:"mediumtext"}, ({Field}) => cb(Field) );
}

/**
*/
function getSearchables(ds, cb) {
	//this.getKeys(ds, {Index_type:"fulltext"}, cb);
	//Log("get srch", ds);
	this.getKeys(ds, {Index_type:"fulltext"}, ({Field}) => cb(Field) );
}

/**
*/
function getGeometries(ds, cb) {
	this.getKeys(ds, {Type:"geometry"}, ({Field}) => cb(Field) );
}

/**
*/
function getTables(db, cb) {	
	var 
		key = `Tables_in_${db}`,
		tables = [];
				  
	this.query( `SHOW TABLES FROM ?? WHERE ${key} NOT LIKE "\\_%"`, [db], (err,recs) => {
		if ( !err ) {
			recs.forEach( rec => tables.push( rec[key] ) );
			cb( tables );
		}
	});
}

/**
*/
function context(ctx,cb) {  // callback cb(dsctx) with a JSDB context
	var 
		sql = this,
		dsctx = {};
	
	Each(ctx, function (dskey, dsats) {
		dsctx[dskey] = new DATASET( sql, dsats );
	});
	cb(dsctx);
}

//============== Record cacheing and bulk record inserts
 
/**
Implements generic cache.  Looks for cache given opts.key and, if found, returns cached results on cb(results);
otherwse, if not found, returns results via opts.make(probeSite, opts.parms, cb).  If cacheing fails, then opts.default 
is returned.  The returned results will always contain a results.ID for its cached ID.  If a opts.default is not provided,
then the cb callback in not made.
*/
function cache( opts, cb ) {	// quasi legacy - geohack may use
	var 
		sql = this,
		//probeSite = JSDB.probeSite,
		defRec = {ID:0};
	
	if ( opts.key )
		sql.forFirst( 
			"", 
			"SELECT ID,Results FROM openv.cache WHERE least(?,1) LIMIT 1", 
			[ opts.key ], rec => {

			if (rec) 
				try {
					cb( Copy( JSON.parse(rec.Results), {ID:rec.ID}) );
				}
				catch (err) {
					if ( opts.default )
						cb( Copy(opts.default, defRec ) );
				}

			else
			if ( opts.make ) 
				if (probeSite)
					opts.make( probeSite.tag("?",opts.parms || {}), ctx => {

					if (ctx) 
						sql.query( 
							"INSERT INTO openv.cache SET Added=now(), Results=?, ?", 
							[ JSON.stringify(ctx || opts.default), opts.key ], 
							function (err, info) {
								cb( Copy(ctx, {ID: err ? 0 : info.insertId}) );
						});

					else 
					if ( opts.default )
						cb( Copy(opts.default, {ID: 0}) );
				});
				
				else
					cb( defRec );

			else
			if ( opts.default )
				cb( Copy(opts.default, defRec) );
		});
	
	else
	if ( opts.default )
		cb( Copy(opts.default, defRec) );
	
}

/**
*/
function beginBulk() {
	this.query("SET GLOBAL sync_binlog=0");
	this.query("SET GLOBAL innodb-flush-log-at-trx-commit=0");
	this.query("START TRANSACTION");
}

/**
*/
function endBulk() {
	this.query("COMMIT");
	this.query("SET GLOBAL sync_binlog=1");
	this.query("SET GLOBAL innodb-flush-log-at-trx-commit=1");
}

//================= catalog interface

/**
Flatten entire database for searching the catalog.  Need to rework using serial
*/
function flattenCatalog(flags, catalog, limits, cb) {	// legacy but could be useful with rework
	
	function flatten( sql, rtns, depth, order, catalog, limits, cb) {
		var table = order[depth];
		
		if (table) {
			var match = catalog[table];
			var filter = cb.filter(match);
			
			var quality = " using "+ (filter ? filter : "open")  + " search limit " + limits.records;
			
			Trace("CATALOG "+table+quality+" RECS "+rtns.length, sql);
		
			var query = filter 
					? "SELECT SQL_CALC_FOUND_ROWS " + match + ",ID, " + filter + " FROM ?? HAVING Score>? LIMIT 0,?"
					: "SELECT SQL_CALC_FOUND_ROWS " + match + ",ID FROM ?? LIMIT 0,?";
					
			var args = filter
					? [table, limits.score, limits.records]
					: [table, limits.records];

			sql.query( query, args,  (err,recs) => {
				if (err) {
					rtns.push( {
						ID: rtns.length,
						Ref: table,
						Name: "error",
						Dated: limits.stamp,
						Searched: 0,
						Link: (table + ".db").link("/" + table + ".db"),
						Content: err+""
					} );

					flatten( sql, rtns, depth+1, order, catalog, limits, cb );
				}
				else 
					sql.query("select found_rows()")
					.on('result', function (stat) {
						recs.forEach( rec => {						
							rtns.push( {
								ID: rtns.length,
								Ref: table,
								Name: `${table}.${rec.ID}`,
								Dated: limits.stamp,
								Quality: recs.length + " of " + stat["found_rows()"] + quality,
								Link: table.link( "/" + table + ".db?ID=" + rec.ID),
								Content: JSON.stringify( rec )
							} );
						});

						flatten( sql, rtns, depth+1, order, catalog, limits, cb );
					});
			});	
		}
		else
			cb.res(rtns);
	}

	var 
		sql = this,
		rtns = [];
		/*limits = {
			records: 100,
			stamp: new Date()
			//pivots: flags._pivot || ""
		};*/
	
	// need to revise this to use serial logic
	flatten( sql, rtns, 0, FLEX.listify(catalog), catalog, limits, {
		res: cb, 

		filter: function (search) {
			return ""; //Builds( "", search, flags);  //reserved for nlp, etc filters
	} });
}

//================= record enumerators

/**
*/
function forFirst(msg, query, args, cb) {  // callback cb(rec) or cb(null) on error
	var q = this.query( query || "#ignore", args, (err,recs) => {  
		if ( err ) 
			cb( null );
		
		else
			cb( recs[0] || null );
	});
	if (msg) Trace( `for ${msg} ${q.sql}`);	
	return q;
}

/**
*/
function forEach(msg, query, args, cb) { // callback cb(rec) with each rec - no cb if errror
	q = this.query( query || "#ignore", args).on("result", rec => cb(rec) );
	if (msg) Trace( `for ${msg} ${q.sql}`);	
	return q;
}

/**
*/
function forAll(msg, query, args, cb) { // callback cb(recs) of cb(null) on error
	var q = this.query( query || "#ignore", args, (err,recs) => {
		if ( err ) 
			cb( null );
		
		else
			cb( recs );
	});
	if (msg) Trace( `for ${msg} ${q.sql}`);	
	return q;
}

/**
Index records.

@param {String} ds name of dataset table
@param {Object} query hash of search options {"=": {....}, ">": {....}, ....}
@param {Function} cb callback(keys,jsons)
*/
function Index(ds, query, cb) {	
	const 
		sql = this,
		{ escape, escapeId } = ENUMS,
		keys = [],
		wilds = [],
		jsons = [];
	
	Each(query, (tar,src) => {
		
		var
			get = src,
			put = escapeId(tar);
		
		const
			stores = get.split("$");

		//console.log(lhs,op,rhs,stores);

		if ( stores.length > 1 ) 
			stores.forEach( (store,n) => {
				if (n) {
					const keys = store ? store.split(",").join("','$") : "";

					get = `json_extract( ${get}, '$${keys}' )`;
				}

				else
					get = escapeId(store);
			});
		
		/*
		if ( tar.indexOf("*") >= 0 ) {
			if ( tar.startsWith("!") )
				wilds.push( `Field NOT LIKE ${escape(tar.substr(1).parseWild())}` ); 
				
			else
				wilds.push( `Field LIKE ${escape(tar.parseWild())}` ); 
		}*/
		
		switch (tar) {
			case "!is":
				wilds.push( `Field LIKE ${escape(src.parseWild())}` ); 
				break;
				
			case "!not":
				wilds.push( `Field NOT LIKE ${escape(src.parseWild())}` ); 
				break;
				
			default:
				if ( get.startsWith("json_extract") ) {
					keys.push( `${get} AS ${put}` );
					jsons.push( tar );
				}

				else
				if (get) 
					keys.push( escapeId(get) + " AS " + put);

				else
					keys.push( put );
		}
	});
	
	if ( wilds.length )
		sql.query("SHOW COLUMNS FROM ?? WHERE "+wilds.join(" AND "), [ds], (err,recs) => {
			if ( err )
				Trace("jsdb what?", err, ds, wilds);

			cb( keys.concat( recs.get("Field").Field ).join(",") || "*", jsons ); 
		});
	
	else 
		cb( keys.join(",") || "*", jsons );	
}

/**
Delete records.

@param {String} ds name of dataset table
@param {Object} where hash of search options {"=": {....}, ">": {....}, ....}
@param {Function} cb callback(err,info)
*/
function Delete(ds,where,cb) {
	const
		sql = this;
	
	sql.query(
		query = "DELETE FROM ?? " + sql.Where(where),
		
		[ds], cb );
	
	Log(query);
}

/**
Update records.

@param {String} ds name of dataset table
@param {Object} where hash of search options {"=": {....}, ">": {....}, ....}
@param {Object} body data for update
@param {Function} cb callback(err,info)
*/
function Update(ds,where,body,cb) {
	const
		sql = this;
	
// Log("update", ds, body);
	
	sql.query(
		query = "UPDATE ?? SET ? " + sql.Where(where),
		
		[ds,body], cb );
	
	Log(query);
}
	
/**
Insert records.

@param {String} ds name of dataset table
@param {Object} body data for insert
@param {Function} cb callback(err,info)

*/
function Insert(ds,body,cb) {
	const
		sql = this;
	
	sql.query(
		query = isEmpty(body)
			? "INSERT INTO ?? () values ()"
			: "INSERT INTO ?? SET ?",
		
		[ds,body], cb );
	
	Log(query);
}

/**
Select records.

@param {String} ds name of dataset table
@param {Object} index hash of { "TO":"FROM", "TO":"STORE$KEY", ....} keys to select
@param {Object} where hash of search options {"=": {....}, ">": {....}, ....}
@param {Object} opts limit,offset,client,pivot,browse,sort options
@param {Function} cb callback(err,recs)
*/
function Select(ds, index, where, opts, cb) {
	const
		sql = this,
		{ escape, escapeId } = ENUMS,		  
		slash = "_",
		nodeID = where.NodeID || "root",
		{limit,offset,client,pivot,browse} = opts;
	
	var
		{sort,group} = opts;
	
	if ( pivot ) {
		Copy( (nodeID == "root") 
			? {
				Node: pivot,
				ID: `group_concat(DISTINCT ID SEPARATOR '${slash}')`,
				Count: "count(ID)",
				leaf: "false",
				expandable: "true",
				expanded: "false"
			}
			: {
				Node: pivot,
				ID: nodeID,
				Count: "1",
				leaf: "true",
				expandable: "true",
				expanded: "false"
			}, index);	
			 
		if (nodeID == "root") 
			delete where.NodeID;
	}

	else
	if ( browse ) {
		const	
			nodes = nodeID ? nodeID.split(slash) : [],
			pivots = browse.split(","),
			group = (nodes.length >= pivots.length)
				? pivots.concat(["ID"])
				: pivots.slice(0,nodes.length+1),
			name = pivots[nodes.length] || "concat('ID',ID)",
			path = group.join(",'"+slash+"',");
		
		Copy({
			Node: browse,
			ID: `group_concat(DISTINCT ${path}) AS ID`,
			Count: "count(ID)",
			path: '"/tbd"',
			read: "1",
			write: "1",
			group: "'v1'",
			locked: "1"
		}, index);

		index[name+":"] = `cast(${name} AS char)`;

		delete where.NodeID;
		nodes.forEach( (node,n) => where[ pivots[n] || "ID" ] = node);
	}
	
	if ( sort )
		try {
			if ( sort.forEach ) 
				sort = sort.map( x => escapeId(x.property || x) + " " + (x.direction||"") );

			else 
				sort = sort.split(",").map( x => escapeId(x) ).join(",");
		}
		
		catch (err) {
			sort = "";
		}
	
	if ( group )
		try {
			if ( group.forEach ) 
				group = group.map( x => escapeId(x.property || x) + " " + (x.direction||"") );

			else 
				group = group.split(",").map( x => escapeId(x) ).join(",");
		}
		
		catch (err) {
			group = "";
		}
	
	sql.Index( ds, index, (selects,jsons) => { 	
		sql.getConnection( (err, con) => {	// found_rows needs to be on same connection
			
			if ( err ) 
				cb(err);
			
			else {
				con.query( 
					query = 
					  `SELECT SQL_CALC_FOUND_ROWS ${selects} FROM ?? ` 
					+ sql.Where(where) 
					+ ( pivot  ? `GROUP BY ${pivot}` : "" )
					+ ( browse ? `GROUP BY ${browse}` : "" )
					+ ( group  ? `GROUP BY ${group}` : "" )
					+ ( sort   ? `ORDER BY ${sort}` : "" )
					+ ( limit  ? ` LIMIT ${limit} OFFSET ${offset||0}` : ""), 
					
					[ds], (err,recs) => {

						if ( err ) {
							cb(err);
							con.release();
						}

						else 
							con.query("SELECT found_rows() AS Found", [], (err,info) => {
								if ( err ) {
									cb( err );
									con.release();
								}
								
								else {
									jsons.forEach( key => {
										recs.forEach( rec => {
											try {
												rec[key] = JSON.parse(rec[key]);
											}

											catch (err) {
												Log(key,err);
											}
										});
									});

									recs.found = info[0].Found || recs.length;

									cb( null, recs );
								}
							});

				});
				Trace(query);		
			}
			
		});	
	});
}

/**
function Hawk(log) {  // journal changes 
	var sql = this;
	
	sql.query("SELECT * FROM openv.hawks WHERE least(?,Power)", log)
	.on("result", function (hawk) {
		sql.query(
			"INSERT INTO openv.journal SET ? ON DUPLICATE KEY UPDATE Updates=Updates+1",
			Copy({
				Hawk: hawk.Hawk,  	// moderator
				Power: hawk.Power, 	// moderator's level
				Updates: 1 			// init number of updates made
			}, log), err => {
				Trace("journal", err);
		});
	});
}
*/

/**
Ingest a comma-delimited, column-headered stream at path using the supplied
streaming options.  Records are inserted into the sql target table defined 
by the path = /.../target.type.  The keys="recKey:asKey sqlType,..." defines
how record values are stored.

@param {String} path source file
@param {Object} opts {keys,comma,newline,limit,as,batch} streaming options
@param {Function} cb Callback([record,...])
*/
function ingestFile(path, opts, filter) {

	const 
	 	sql = this,
		[ target ] = path.split("/").pop().split("."),
		{ batch,comma,newline,limit } = opts,
		makes = [],
		{ rekey,keys } = streamOpts = {
			batch: batch, 
			comma: comma || ",",
			newline: newline,
			rekey: filter ? [ `(${filter})=>!test` ] : [],
			limit: limit,
			keys: [] // csv file with unkown header
		};

	Trace( `INGESTING ${path} => ${target}` );
	opts.keys.forEach( (key,i) => {
		var 
			[ id,type ] = key.split(" ");

		rekey.push( id );
		makes.push( id + " " + type );
	});

	Trace("INGEST", path, "=>", target);

	sql.query( `CREATE TABLE IF NOT EXISTS app.?? (ID float unique auto_increment,${makes.join(", ")})`, 
		[target], err => {
		
		Trace( "INGESTING", target, err || "ok" );

		streamOpts.rekey = streamOpts.rekey.join(",");
		path.streamFile(streamOpts, recs => {
			if ( recs )
				recs.forEach( (rec,idx) => {
					sql.query("INSERT INTO app.?? SET ?", [target,rec] );
				});

			else 
				Trace( "INGESTED", path );
		});
	});
}

/*
function Batch(table, {batch, limit, filter}, cb) {

	var sql = this;
	
	if ( batch ) 
		sql.query( "SELECT count(id) AS recs FROM app.??", table, (err,info) => {
			var recs = recs = limit || info[0].recs;
			//Trace("=============== batching", recs );
			if ( recs ) 
				for (	var offset=0,reads=0; offset<recs; offset+=batch ) {
					//Trace("=====================", offset,recs);
					sql.query( filter
						? "SELECT * FROM app.?? WHERE least(?,1) LIMIT ? OFFSET ?"
						: "SELECT * FROM app.?? LIMIT ? OFFSET ?", 

						filter
						? [table,filter,batch,offset]
						: [table,batch,offset], (err,data) => {

							cb(data, reads += batch);

							if ( reads >= recs ) {  // signal end
								//Trace("================= ending", reads,recs);
								cb(null);
							}
						});
				}

			else	// signal end
				cb(null);
		});

	else
		sql.query( filter
			? "SELECT * FROM app.?? WHERE least(?,1)"
			: "SELECT * FROM app.??", [table,filter], (err,recs) => {

			cb( recs );
			cb( null ); // signal end
		});			
}
*/

//================ form entry 

/*
function relock(unlockcb, lockcb) {  //< lock-unlock record during form entry
	var 
		sql = this,
		ctx = this.ctx,
		ID = ctx.query.ID,
		lockID = {Lock:`${ctx.from}.${ID}`, Client:ctx.client};

	if (ID)
		sql.query(  // attempt to unlock a locked record
			"DELETE FROM openv.locks WHERE least(?)", 
			lockID, (err,info) => {

			if (err)
				ctx.err = JSDB.errors.failLock;

			else
			if (info.affectedRows) {  // unlocked so commit queued queries
				unlockcb();
				sql.query("COMMIT");  
			}

			else 
			if (lockcb)  // attempt to lock this record
				sql.query(
					"INSERT INTO openv.locks SET ?",
					lockID, (err,info) => {

					if (err)
						ctx.err = JSDB.errors.isLocked;

					else
						sql.query( "START TRANSACTION", err => {  // queue this transaction
							lockcb();
						});
				});	

			else  // record was never locked
				ctx.err = JSDB.errors.isUnlocked;

		});

	else
		ctx.err = JSDB.errors.noLock;
}
*/

//================ url query expressions 

function Where(query) {
	const 
		sql = this,
		{ escape, escapeId } = ENUMS,
		ex = [],
		wilds = [];

	Each( query, (op,parms) => {
		Each(parms, (lhs,rhs) => {
			
			const
				LHS = escapeId(lhs),
				RHS = escape(rhs);

			//Trace(op, [lhs,rhs], [LHS,RHS]);
			
			switch (op) {
				case "_bin=":
					ex.push( `MATCH(${LHS}) AGAINST( ${RHS} IN BOOLEAN MODE)` );
					break;

				case "_exp=":
					ex.push( `MATCH(${LHS}) AGAINST( ${RHS} IN QUERY EXPANSION)` );
					break;

				case "_nlp=":
					ex.push( `MATCH(${LHS}) AGAINST( ${RHS} IN NATURAL LANGUAGE MODE)` );
					break;

				case "_out=":
					var [min,max] = rhs.split(",");
					ex.push( `${LHS} NOT BETWEEN '${min}' AND '${max}'` );
					break;
					
				case "_in=":
					var [min,max] = rhs.split(",");
					ex.push( `${LHS} BETWEEN '${min}' AND '${max}'` );
					break;
					
				case "!=":
					ex.push( 
						( RHS.indexOf("*") >= 0 ) 
							? `${LHS} NOT LIKE ${RHS.parseWild()}`
							: `${LHS} ${op}) ${RHS}` );

					break;

				case "=":
					ex.push( 
						( RHS.indexOf("*") >= 0 ) 
							? `${LHS} LIKE ${RHS.parseWild()}`
							: `${LHS} ${op} ${RHS}` );
					break;

				default:
					ex.push( `${LHS} ${op} ${RHS}` );
			}

		});
	});
			
	return ex.length ? `WHERE least(${ex},1)` : "";
} 
//=============== query/fetch serialization

/**
Serialize a select query.

@example
	sql.serial({
		ds1: "SELECT ... ",
		ds2: "SELECT ... ", ...
		ds3: "/dataset?...", 
		ds4: "/dataset?...", ...
	}, ctx, ctx => {
		// ctx[ ds1 || ds2 || ... ] records
	});
*/
function serial( qs, opts, ctx, cb ) {	// legacy
	var 
		sql = this,
		qlist = [],
		fetchRecs = function (rec, cb) {
			var
				ds = rec.ds,
				query = rec.query;
			
			sql.query( 
				query, 
				ds.concat( rec.options || [] ), 
				(err, recs) => cb( err ? null : recs ) );
		};
	
	Each( qs, (ds,q)  => {
		qlist.push({
			query: q,
			ds: ds,
			options: opts
		});
	});
	
	qlist.serial( fetchRecs, (q, recs) => {
		
		if (q) // have recs
			if (recs) 	// query ok
				if ( recs.forEach ) {  // clone returned records 
					var save = ctx[q.ds] = [];
					recs.forEach( rec => save.push( new Object(rec) ) );
				} 
		
				else  // clone returned info
					ctx[q.ds] = [ new Object(recs) ];
	
			else	// query error
				ctx[q.ds] = null;
	
		else  // at end
			cb( ctx );
	});
}


/**
Aggregate and save events evs = [ev, ...] || { } under direction of the 
supplied context ctx = { Save: { ... }, Ingest: true||false, Export: true||false,
... }.  Stashify is used to 
aggreagate data using [ev, ...].stashify( "at", "Save_", ctx ) where events ev = 
{ at: KEY, A: a1, B: b1, ... } || { x: x1, y: y1 } are saved in Save_KEY = 
{A: [a1, a2,  ...], B: [b1, b2, ...], ...} iff Save_KEY is in the supplied ctx.  
*/
function saveContext(ctx) {	// save event context to plugin usecase

/**
Stash aggregated events evs = { at: "AT", ... } into context Save_AT keys then callback cb
with remaining events.

@param {object} sql sql connection
@param {object} evs events to be saved
@param {object} ctx notebook context
@param {function} cb callback(ev,stat) 
*/
	function saveEvents( sql, evs, ctx, cb ) {

/**
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

@param {object} evs events to be saved
@param {String} watchKey  this = [ { watchKey:"KEY", x:X, y: Y, ...}, ... }
@param {String} targetPrefix  stash = { (targetPrefix + watchKey): { x: [X,...], y: [Y,...], ... }, ... } 
@param {Object} ctx plugin context keys
@param {Object} stash refactored output suitable for a Save_KEY
@param {Function} cb callback(ev,stat) returns refactored result to put into stash
*/
		function stashify(evs, watchKey, targetPrefix, ctx, stash, cb) {
			var rem = stash.remainder;

			evs.forEach( (stat,n) => {  // split-save all stashable keys
				var 
					key = targetPrefix + (stat[watchKey] || "rem"),  // target ctx key 
					ev = ( key in stash )
						? stash[key]  // stash was already primed
						: (key in ctx)  // see if its in the ctx
								? stash[key] = cb(null,stat, ctx[key]) // prime stash
								: null;  // not in ctx so stash in remainder

				if ( ev )  { // found a ctx target key to save results
					delete stat[watchKey];
					cb(ev, stat);
				}

				else  
				if (rem)  // stash remainder 
					rem.push( stat );
			});
		}

		function saveStash( sql, stash, ID, host ) {
			function saveKey( sql, key, save ) {
				try {
					sql.query(
						`UPDATE app.?? SET ${key}=? WHERE ID=?`, 
						[host, JSON.stringify(save) || "null", ID], 
						err => // will fail if key does not exist or mysql server buffer too small (see my.cnf)
							Trace(err ? `DROP ${host}.${key}` : `SAVE ${host}.${key}` )
					);
				}

				catch (err) {
					Trace( `DROP ${host}.${key}` )
					Log(err,save);
				}
			}

			for (var key in stash) 
				saveKey( sql, key, stash[key] );
		}

		function updateFile( sql, file, stats ) {
			stats.forEach( function (stat) {
				var save = {}, set=false;
				Each( stat, function (idx, val) {
					if ( idx in file) {
						save[ set = idx] = (typeof val == "object") 
							? JSON.stringify( val )
							: val;
					}
				});

				if (set)
					sql.query(
						"UPDATE openv.files SET ? WHERE ?",
						  [save, {ID: file.ID}],
						(err) => Trace( err || "UPDATE "+file.Name)
					);
			});
		}

		function updateStats( sql, fileID, voxelID, stats ) {  // save relevant stats 
			var saveKeys = $.saveKeys;

			stats.forEach( function (stat) {
				var save = {}, set=false;
				Each( stat, function (key, val) {
					if ( key in saveKeys) 
						save[ set = key] = (typeof val == "object") 
							? JSON.stringify( val )
							: val;
				});

				if (set) 
					if (true) {
						save.fileID = fileID;
						save.voxelID = voxelID;					
						sql.query(
							"INSERT INTO openv._stats SET ? ON DUPLICATE KEY UPDATE ?",
							  [save, save] 
							// , err => Trace( "STATS " + (err ? "FAILED" : "UPDATED") )
						);
					}

					else
						sql.query( "UPDATE openv.files SET ? WHERE ?", [save, {ID: fileID}] );

			});
		}

		//Trace("save host", ctx.Host, ctx);

		//var evs = this;

		var 
			stash = { remainder: [] },  // stash for aggregated keys 
			rem = stash.remainder;

		stashify(evs, "at", "Save_", ctx, stash, (ev, stat) => {  // add {at:"KEY",...} evs to the Save_KEY stash

			if (ev)
				try {
					for (var key in stat) ev[key].push( stat[key] );
				}
				catch (err) {
					ev[key] = [ stat[key] ];
				}

			else {
				var ev = new Object();
				for (var key in stat) ev[key] = [ ];
				return ev;
			}

		});

		if (rem.length) {  // there is a remainder to save
			if (cb) cb(rem);

			saveStash(sql, {Save: rem}, ctx.ID, ctx.Host);	
		}

		delete stash.remainder;	

		if ( stash.Save_end ) 
			if ( stats = stash.Save_end.stats ) {   // there are stats that may need to be updated
				var
					file = ctx.File || {ID: 0},
					voxel = ctx.Voxel || {ID: 0};

				updateStats(sql, file.ID, voxel.ID, stats);
			}

			/*
			if ( File = ctx.File )
				updateFile( sql, File, stats);

			else
				sql.forFirst( "", "SELECT * FROM openv.files WHERE ? LIMIT 1", {Name: ctx.Host+"."+ctx.Name}, function (File) {
					if (File) 
						updateFile(sql, File, stats);
				});
			*/

		saveStash(sql, stash, ctx.ID, ctx.Host);

		return ctx.Share ? evs : "updated".link("/files.view");
	}

	const 
		sql = this,
		{ Host,Name,Export,Ingest } = ctx,
		{ savers } = JSDB,
		now = new Date(),
		client = "guest",
		ds = "app."+Host,
		savepath = `${Host}_${Name}`;

	sqlThread( sql => {
		Each(ctx, (key,store) => {
			//Trace("save", key, "dump?", savers[key], Host, Name, savepath);
			
			if ( dump = savers[key] ) {
				Trace("dumping", key);
				dump( savepath, store );
			}

			/*
			else
			if ( key == "Save" ) 
				saveEvents( sql, store, ctx, evs => {  // save events and callback with remaining unsaved evs

					if ( Export ) {   // export remaining events to filename
						var
							evidx = 0,
							srcStream = new STREAM.Readable({    // establish source stream for export pipe
								objectMode: false,
								read: function () {  // read event source
									if ( ev = evs[evidx++] )  // still have an event
										this.push( JSON.stringify(ev)+"\n" );
									else 		// signal events exhausted
										this.push( null );
								}
							});

						Trace("EXPORT "+savename);
						uploadFile( "", srcStream, savepath+".stream" );
					}

					if ( Ingest )  // ingest remaining events
						getBrick( client, savename+".stream", file => {
							sql.query("DELETE FROM openv.events WHERE ?", {fileID: file.ID});

							ingestList( sql, evs, file.ID, file.Class, aoi => {
								Trace("INGESTED",aoi);

								if ( false )
									sqlThread( sql => {	// run plugins that were linked to this ingest
										exeAutorun(sql,"", `.${ctx.Host}.${ctx.Name}` );
									});
							});
						});

					sql.query(
						"UPDATE app.?? SET Save=? WHERE Name=?",
						[Host, JSON.stringify(evs), Name] );
				}); 
			*/
			
			else {
				Trace("store", store);
				if ( key.startsWith("Save") ) 
					sql.query(
						`UPDATE ?? SET ${key}=? WHERE Name=?`,
						[ds, JSON.stringify( store ), Name], err => Log(err||`saved ${key}`) );
			}
		});
	});

	/*if ( !isEmpty(ctx) )
		sql.query( 
			"UPDATE app.?? SET ? WHERE Name=?", 
			[Host, ctx, Name], 
			err => Trace(">>>save", err?err:"ok", ctx) ); */

	return "Saved";
}
	
sqlThread( sql => {

	//console.log(">>>>>>>>>>>>>prime jsdb", sql.constructor);
	
	[	// extend the sql connector			
		// key getters

		getKeys,
		getKeysFull,
		getTables,
		getJsons,
		getSearchables,
		getGeometries,
		getTexts,

		// query processing

		//Format,
		//Query,
		Index,
		//Batch,
		//Hawk,
		Where,

		// record enumerators

		//relock,
		forFirst,
		forEach,
		forAll,

		// misc

		serial,
		context,
		cache,
		ingestFile,
		//flattenCatalog,

		// bulk insert records

		beginBulk,
		endBulk,

		// contexting

		getContext,
		saveContext,

		// crud

		Select,
		Delete,
		Update,
		Insert
	].Extend(sql.constructor);
	
	//mysqlCon.constructor.prototype.getTables = getTables;
	//mysqlCon.constructor.prototype.getSearchables = getSearchables;
	//mysqlCon.constructor.prototype.getKeys = getKeys;
	
	//console.log(">>>>>>>>>>>>>>>jsdb cons", mysqlCon.prototype);
	
	sql.query("select 0", (err,recs) => {	// test connection and load ds attrs
		if ( err ) 
			Trace("mysql service not running or login credentials invalid",err);

		else {	// get attributes for jsdb datasets
			sql.query("DELETE FROM openv.locks");	// remove all record locks

			sql.query(`SHOW TABLES FROM app`, (err,recs) => {

				function setAttribute(ds) {
					const
						{ attrs } = JSDB;
			
					sql.getSearchables( "app." + ds, keys => {
						var attr = attrs[ds] = {};
						for (var key in attrs.default) attr[key] = attrs.default[key];
						attr.search = keys.join(",");
					});
				}
				
				recs.forEach( rec => {
					setAttribute(rec.Tables_in_app);
				});
			});
		}
	});	
});

//============ neo4j functions

/**
*/
function cypher(query,params,cb) {// submit cypher query to neo4j

	var 
		neo = this,
		ses = neo4jCon.session();	// no pooled connectors so must create and close them

	if ( params )
		Each( params, (key,val) => {	// fix stupid $tokens in neo4j driver
			if (val) {
				if ( isObject(val) ) {
					query = query.replace(new RegExp("\\$"+key,"g"), arg => "{".tag(":",val)+"}" );
					delete params[key];
				}
			}

			else
				Trace("neo problem", key,val, params);
		});

	// if ( neo.trace) Log(query);

	ses
	.run( query, params )
	.then( res => {

		var 
			recs = res.records,
			Recs = [];

		if (recs)
			recs.forEach( (rec,n) => {
				var Rec = {};
				rec.keys.forEach( key => Rec[key] = rec.get(key) );
				Recs.push( Rec );
			});

		if (cb) cb(null, Recs);
	})
	.catch( err => {
		if ( neo.trace) Log(err);
		//if (cb) cb( err, null );
	})
	.then( () => {
		ses.close();
	})
}

/**
*/
function clearNet( net ) {
	Trace( "clear net", net);	

	this.cypher( `MATCH (n:${net}) DETACH DELETE n` );
}

/**
*/
function saveNodes(net, nodes, res ) {		// add typed-nodes to neo4j
	var 
		neo = this,
		trace = neo.trace;

	nodes.stream( (node, name, cb) => {
		if (cb) { // add node
			neo.cypher(
				`MERGE (n:${net}:${node.type} {name:$name}) ON CREATE SET n += $props`, {
					name: name,
					props: node
			}, err => {
				// if ( trace ) Trace(">>>neo save node", err || "ok");
				cb();
			});
		}

		else	// all nodes processed so move forward
			res( null );
	});

}

/*
function makeEdge( net, edge ) { // link existing typed-nodes by topic
	var 
		[src,tar,props] = edge,
		neo = this;

	//Trace("edge", src.name, tar.name, props);
	neo.cypher(
		`MATCH (a:${net} {name:$srcName}), (b:${net} {name:$tarName}) `
		+ "MERGE "
		+ `(a)-[r:${props.name}]-(b) `
		+ "ON CREATE SET r = $props ", {
				srcName: src.name,
				tarName: tar.name,
				props: props || {}
	}, err => {
		if (err) Trace(">>>create edge failed", [src.name, tar.name] );
	});
},*/

/**
*/
function findAssoc( query, cb ) {
	const 
		neo = this,
		[src,tar,rel] = query,
		Rel = rel.replace( / /g, "");

	neoThread( neo => {
		neo.cypher( 
			`MATCH ( a {name:$src} ) -[r:${Rel}]-> ( b {name:$tar} ) RETURN r,a,b`, 
			{
				src: src,
				tar: tar
			}, 
			(err,recs) => {

			if (err) Log(err);
			cb( recs, query );
		});
	});		
}

/**
*/
function saveNet( net, nodes, edges ) {
	const 
		neo = this;

	//neo.cypher( `CREATE CONSTRAINT ON (n:${net}) ASSERT n.name IS UNIQUE` );

	Trace("neo save net", net);

	neo.saveNodes( net, nodes, () => {
		//Trace(">> edges", edges, "db=", db);
		//Each( edges, (name,pairs) => neo.saveEdges( net, pairs ) );
		neo.saveEdges( net, edges ) ;
	});	
}

/**
*/
function saveEdges( net, edges ) {
	const 
		neo = this,
		trace = neo.trace;

	//Trace("save pairs topic", name);
	Each( edges, (name,edge) => {
		//neo.makeEdge( net, edge );
		var Type = edge.type.replace(/ /g, "");

		neo.cypher(
			`MATCH (a:${net} {name:$src}), (b:${net} {name:$tar}) MERGE (a)-[r:${Type}]-(b) ON CREATE SET r = $props`, {
			src: edge.src,
			tar: edge.tar,
			props: edge || {}
		}, err => {
			//if ( trace ) 
			//Trace(">>>neo save edge", err || "ok" );
		});

	});
}

if (1)
neoThread( neo => {
	//Log("neo con=", neo.constructor);
	[
		cypher,
		clearNet,
		saveNodes,
		findAssoc,
		saveNet,
		saveEdges
		].Extend( neo.constructor );
});

/**
@class JSDB.Unit_Tests_Use_Cases
*/

Start( "jsdb", {
	B1: () =>
		JSDB.config( null, sql => {
			neoThread( neo => {	// add prototypes and test neo4j connection
				if (false) // test connection
					neo.cypher(
						// 'MATCH (u:User {email: {email}}) RETURN u',
						'MERGE (alice:Person {name : $nameParam}) RETURN alice.name AS name', {
							// email: 'alice@example.com',
							nameParam: 'Alice'
					}, (err, recs) => {
						if (err) 
							Log( err );

						else 
							if ( rec = recs[0] ) 
								Trace("neodb test alice user", rec );
										// JSON.stringify(rec['u'], null, 4));

							else
								Trace('neodb test - alice has no records.');
					});

				if (false) // clear db on startup
					neo.cypher(
						"MATCH (n) DETACH DELETE n", {}, err => {
						Log( err || "CLEAR GRAPH DB" );
					});  
			});
		}),
	
	B2: () =>
		/*
		opts = {
			// login credentials
			host: "mysqlhost",
			user: "root",
			password: "root",
			port: 3306,

			// connection options
			connectionLimit: 50,	// max number to create "at once" - whatever that means
			acquireTimeout: 600e3,	// ms timeout during connection acquisition - whatever that means
			connectTimeout: 600e3,	// ms timeout during initial connect to mysql server
			queueLimit: 0,  						// max concections to queue (0=unlimited)
			waitForConnections: true,		// queue when no connections are available and limit reached


			// reserved for ...
			threads: 0, 	// connection threads
			pool: null		// connector
		};

		pool=MYSQL.createPool(opts);

		pool.query("SELECT 123", (err,recs) => console.log(recs) );
		pool.query("SELECT * from openv.apps", (err,recs) => console.log(recs) );
		*/
		JSDB.config( null, sql => {
			Trace("SQLDB "+(sql?"connected":"disconnected"));
		})
});

