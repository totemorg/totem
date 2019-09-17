/**
@class END.End_Points.User_Managment
Legacy endpoints to manage users and their profiles.  Moved to FLEX.
 */
var
	VM = require("vm"); 					// virtual machines for tasking

const { Copy,Each,Log,isError,isArray,isString,isFunction,isEmpty } = require("enum");

var 
	END = module.exports = opts => Copy(opts || {},END, ".");
		
Copy({
	sysTask: sysTask,
	sysPing: sysPing,
	sysFile: sysFile,
	selectDS: selectDS,
	insertDS: insertDS,
	deleteDS: deleteDS,
	updateDS: updateDS,
	executeDS: executeDS
}, END);

/**
 * @class END.End_Points.CRUD_Interface
 * Create / insert / post, Read / select / get, Update / put, Delete methods.
 */

function selectDS(req, res) {
	/**
	@private
	@method selectDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		where = req.where,
		index = flags.index || req.index;
	
	sql.runQuery({
		trace: flags.trace,
		crud: req.action,
		from: req.table,
		db: req.group || "app",
		pivot: flags.pivot,
		browse: flags.browse,		
		where: where,
		index: index,
		having: {},
		client: req.client
	}, null, function (err,recs) {

		if ( isEmpty(index) )
			res( err || recs );
		
		else
		if (err) 
			res( err );

		else {
			recs.forEach( (rec) => {
				Each(index, (key) => {
					try {
						rec[key] = JSON.parse( rec[key] );
					}
					catch (err) {
					}
				});
			});
			res( recs );
		}
	});
}

function insertDS(req, res) {
	/**
	@private
	@method insertDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		body = req.body,
		escapeId = MYSQL.escapeId,
		escape = MYSQL.escape;

	for (var key in body) body[key] = `${escapeId(key)} = ${escape(body[key])}`;
	
	sql.runQuery({
		trace: flags.trace,
		crud: req.action,
		from: req.table,
		db: req.group || "app",
		set: body,
		client: req.client
	}, END.emitter, function (err,info) {

		//Log(info);
		res( err || info );

	});
	
}

function deleteDS(req, res) {
	/**
	@private
	@method deleteDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/		
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		where = req.where;

	if ( where.ID )
		sql.runQuery({
			trace: flags.trace,			
			crud: req.action,
			from: req.table,
			db: req.group || "app",
			where: where,
			client: req.client
		}, END.emitter, function (err,info) {

			//Log(info);
			res( err || info );

		});
	
	else
		res( END.errors.noID );
	
}

function updateDS(req, res) {
	/**
	@private
	@method updateDS
	@param {Object} req Totem's request
	@param {Function} res Totem's response callback
	*/	
	var 
		sql = req.sql,							// sql connection
		flags = req.flags,
		body = req.body,
		ds = req.table,
		where = req.where,
		escapeId = MYSQL.escapeId,
		escape = MYSQL.escape;

	Log(req.action, where, body);
	//for (var key in body) body[key] = `${escapeId(key)} = ${escape(body[key])}`;
	//Log(body);
	
	if ( isEmpty(body) )
		res( END.errors.noBody );
	
	else
	if ( where.ID )
		sql.runQuery({
			trace: flags.trace,
			crud: req.action,
			from: req.table,
			db: req.group || "app",
			where: where,
			set: body,
			client: req.client
		}, END.emitter, function (err,info) {

			//Log(info);
			res( err || info );

			if ( onUpdate = END.onUpdate ) 
				onUpdate(sql, ds, body);
			
		});
	
	else
		res( END.errors.noID );
	
}

function executeDS(req,res) {
/**
 @private
 @method executeDS
 @param {Object} req Totem's request
 @param {Function} res Totem's response callback
 */
	res( END.errors.notAllowed );
}

/**
 * @class END.End_Points.Users_Interface
 * Create user maint end points
 */

function selectUser(req,res) {
/**
@private
@deprecated
@method selectUser
Return user profile information
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
	
	var sql = req.sql, query = req.query || 1, isHawk = req.cert.isHawk;
			
	isHawk = 1;
	if (isHawk)
		Trace(sql.query(
			"SELECT * FROM openv.profiles WHERE least(?,1)", 
			[ query ], 
			function (err,users) {
				res( err || users );
		}).sql);

	else
		sql.query(
			"SELECT * FROM openv.profiles WHERE ? AND least(?,1)", 
			[ {client:req.client}, req.query ], 
			function (err,users) {
				res( err || users );
		});
}

function updateUser(req,res) {
/**
@private
@deprecated
@method updateUser
Update user profile information
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
			
	var sql = req.sql, query = req.query, isHawk = req.cert.isHawk; 
	
	if (sql.query)
		if (isHawk) 
			// sql.context({users:{table:"openv.profile",where:{client:query.user},rec:query}});
			Trace(sql.query(
				"UPDATE openv.profiles SET ? WHERE ?", 
				[ query, {client:query.user} ], 
				function (err,info) {
					res( err || END.errors.failedUser );
			}).sql);
		
		else
			sql.query(
				"UPDATE openv.profiles SET ? WHERE ?", 
				[ query, {client:req.client} ],
				function (err,info) {
					
					res( err || END.errors.failedUser );
			});
	else
		res( END.errors.failedUser );
			
}

function deleteUser(req,res) {
/**
@private
@deprecated
@method deleteUser
Remove user profile.
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
			
	var sql = req.sql, query = req.query, isHawk = req.cert.isHawk;  

	if (query)
		if (isHawk)
			// sql.context({users:{table:"openv.profiles",where:[ {client:query.user}, req.query ],rec:res}});
			Trace(sql.query(
				"TEST FROM openv.profiles WHERE ? AND least(?,1)", 
				[ {client:query.user}, req.query ], 
				function (err,info) {
					res( err || END.errors.failedUser );
					
					// res should remove their files and other 
					// allocated resources
			}).sql);

		else
			sql.query(
				"TEST FROM openv.profiles WHERE ? AND least(?,1)", 
				[ {client:req.client}, req.query ], 
				function (err,info) {
					res( err || END.errors.failedUser );
			});
	else
		res( END.errors.failedUser );
}
			
function insertUser (req,res) {
/**
@private
@deprecated
@method insertUser
Create user profile, associated certs and distribute info to user
@param {Object} req Totem session request 
@param {Function} res Totem response
 */
			
	var sql = req.sql, query = req.query || {}, isHawk = req.cert.isHawk, url = END.paths.url;
	
	if (req.cert.isHawk)
		if (query.pass)
			sql.query(
				"SELECT * FROM openv.profiles WHERE Requested AND NOT Approved AND least(?,1)", 
				query.user ? {User: query.user} : 1 )
				
			.on("result", function (user) {
				var init = Copy({	
					Approved: new Date(),
					Banned: url.resetpass
						? "Please "+"reset your password".tag( url.resetpass )+" to access"
						: "",

					Client: user.User,					
					QoS: 0,

					Message:

`Greetings from ${site.Nick.tag(site.urls.master)}-

Admin:
	Please create an AWS EC2 account for ${owner} using attached cert.

To connect to ${site.Nick} from Windows:

1. Establish gateway using 

		Putty | SSH | Tunnels
		
	with the following LocalPort, RemotePort map:
	
		5001, ${site.urls.master}:22
		5100, ${site.urls.master}:3389
		5200, ${site.urls.master}:8080
		5910, ${site.urls.master}:5910
		5555, Dynamic
	
	and, for convienience:

		Pageant | Add Keys | your private ppk cert

2. Start a ${site.Nick} session using one of these methods:

	${Putty} | Session | Host Name = localhost:5001 
	Remote Desktop Connect| Computer = localhost:5100 
	${FF} | Options | Network | Settings | Manual Proxy | Socks Host = localhost, Port = 5555, Socks = v5 `

.replace(/\n/g,"<br>")					
					
				}, Copy(END.guestProfile,{}) );

				sql.query(
					"UPDATE openv.profiles SET ? WHERE ?",
					[ init, {User: user.User} ],
					err => {
						
						createCert(user.User, pass, function () {

							Trace(`CREATE CERT FOR ${user.User}`, sql);
							
							CP.exec(
								`sudo adduser ${user.User} -gid ${user.Group}; sudo id ${user.User}`,
								function (err,out) {
									
									sql.query(
										"UPDATE openv.profiles SET ? WHERE ?",
										[ {uid: out}, {User:user.User} ]
									);

									Log( err 
										? `Account failed for ${user.User} - require "sudo adduser" to protect this service`
										: `Account created and group rights assigned to ${user.User}`
									);
							});
						});
				});
			})
			.on("end", function() {
				res("User creation working");
			});
		
		else
			res( END.errors.missingPass );

	else
		sql.query(
			"INSERT openv.profiles SET ? WHERE ?", 
			[ req.query , {User:req.User} ], 
			function (err,info) {
				
				res( err || END.errors.failedUser );
		});
}

function executeUser(req,res) {	
/**
@private
@deprecated
@method executeUser
Fetch user profile for processing
@param {Object} req Totem session request 
@param {Function} res Totem response
*/
	var 
		access = END.user,
		query = req.query;
		
	query.user = query.user || query.select || query.delete || query.update || query.insert;
	
	if (access) {
		for (var n in {select:1,delete:1,update:1,insert:1})			
			if (query[n]) {
				delete query[n];
				return access[n](req,res);
			}
		
		if (call = query.call) {
			delete query.call;
			return access[call](req,res);
		}
	}
	
	res( END.errors.failedUser );
}

/*
function simThread(sock) { 
	//Req.setSocketKeepAlive(true);
	Log({ip: sock.remoteAddress, port: sock.remotePort});
	sock.setEncoding("utf-8");
	sock.on("data", req => {
		Log("sock data>>>>",req);
		var 
			Req = Copy({
				socket: sock  // used if master makes handoff
			}, JSON.parse(req)),
			
			Res = {  // used if master does not makes handoff
				end: function (data) {
					sock.write(data);
				}
			};
				
		sesThread(Req,Res);
	});
} */

/**
@class END.End_Points.System
*/
function sysTask(req,res) {  //< task sharding
/**
@method sysTask
Totem (req,res)-endpoint to shard a task to totem compute nodes.
@param {Object} req Totem request
@param {Function} res Totem response
*/
	var 
		query = req.query,
		body = req.body,
		sql = req.sql,
		task = body.task,
		dom = body.domain,
		cb = body.cb,
		$ = JSON.stringify({
			worker: CLUSTER.isWorker ? CLUSTER.worker.id : 0,
			node: process.env.HOSTNAME
		}),
		engine = `(${cb})( (${task})(${$}) )`,
		plugins = END.plugins;

	res( "ok" );

	if ( task && cb ) 
		dom.forEach( function (index) {

			function runEngine(idx) {
				VM.runInContext( engine, VM.createContext( Copy(plugins, idx) ));
			}

			if (body.qos) 
				sql.insertJob({ // job descriptor 
					index: Copy(index,{}),
					priority: 0,
					qos: body.qos, 
					class: req.table,
					client: body.client,
					credit: body.credit,
					name: body.name,
					task: body.name,
					notes: [
							req.table.tag("?",req.query).tag( "/" + req.table + ".run" ), 
							((body.credit>0) ? "funded" : "unfunded").tag( req.url ),
							"RTP".tag( `/rtpsqd.view?task=${body.name}` ),
							"PMR brief".tag( `/briefs.view?options=${body.name}` )
					].join(" || ")
				}, function (sql,job) {
					//Log("reg job" , job);
					runEngine( job.index );
				});
		
			else
				runEngine( index );
		});
}

function sysPing(req,res) {
/**
@method sysPing
Totem (req,res)-endpoint to test client connection
@param {Object} req Totem request
@param {Function} res Totem response
*/
	res("hello " + req.client + " " + END.paths.home );
}

function sysFile(req, res) {
/**
@method sysFile
Totem (req,res)-endpoint to send uncached, static files from a requested area.
@param {Object} req Totem request
@param {Function} res Totem response
*/
	
	var 
		sql = req.sql, 
		query = req.query, 
		index = req.index,
		body = req.body,
		client = req.client,
		action = req.action,
		area = req.table,
		path = req.path,
		errors = END.errors,
		now = new Date();
	
	/*Log({
		p: path,
		q: query,
		b: body,
		a: area,
		c: client,
		n: req.file
	}); */
	
	switch (action) {
		case "select":
			
			if ( req.file )
				try {		// sysFile files are never static so we never cache them
					FS.readFile(path,  (err,buf) => res( err || new Buffer(buf) ) );
				}
				catch (err) {
					res( errors.noFile );
				}
				
			else
				getIndex( path, files => {  // Send list of files under specified folder

					files.forEach( (file,n) => {
						files[n] = file.tag( file );
					});

					res(`Index of ${path}:<br>` + files.join("<br>") );
				});
			
			break;
					
		case "delete":
			res( errors.noFile );
			break;
			
		case "update":
		case "insert":
			var
				canvas = body.canvas || {objects:[]},
				attach = [],
				image = body.image,
				files = image ? [{
					filename: client, //name, // + ( files.length ? "_"+files.length : ""), 
					size: image.length/8, 
					image: image
				}] : body.files || [],
				tags = Copy(query.tag || {}, {Location: query.location || "POINT(0 0)"});

			res( "uploading" );

			canvas.objects.forEach( obj => {	// upload provided canvas objects

				switch (obj.type) {
					case "image": // ignore blob
						break;

					case "rect":

						attach.push(obj);

						sql.query("REPLACE INTO proofs SET ?", {
							top: obj.top,
							left: obj.left,
							width: obj.width,
							height: obj.height,
							label: tag,
							made: now,
							name: area+"."+name
						});
						break;			
				}
			});

			files.forEach( function (file, n) {

				var 
					buf = new Buffer(file.data,"base64"),
					srcStream = new STREAM.Readable({  // source stream for event ingest
						objectMode: true,
						read: function () {  // return null if there are no more events
							this.push( buf );
							buf = null;
						}
					});

				Trace(`UPLOAD ${file.filename} INTO ${area} FOR ${client}`, sql);

				uploadFile( client, srcStream, "./"+area+"/"+file.filename, tags, file => {

					if (false)
					sql.query(	// this might be generating an extra geo=null record for some reason.  works thereafter.
						   "INSERT INTO ??.files SET ?,Location=GeomFromText(?) "
						+ "ON DUPLICATE KEY UPDATE Client=?,Added=now(),Revs=Revs+1,Location=GeomFromText(?)", [ 
							req.group, {
									Client: req.client,
									Name: file.filename,
									Area: area,
									Added: new Date(),
									Classif: query.classif || "",
									Revs: 1,
									Ingest_Size: file.size,
									Ingest_Tag: query.tag || ""
								}, geoloc, req.client, geoloc
							]);

					if (false)
					sql.query( // credit the client
						"UPDATE openv.profiles SET Credit=Credit+?,useDisk=useDisk+? WHERE ?", [ 
							1000, file.size, {Client: req.client} 
						]);

					if (false) //(file.image)
						switch (area) {
							case "proofs": 

								sql.query("REPLACE INTO proofs SET ?", {
									top: 0,
									left: 0,
									width: file.Width,
									height: file.Height,
									label: tag,
									made: now,
									name: area+"."+name
								});

								sql.query(
									"SELECT detectors.ID, count(ID) AS counts FROM app.detectors LEFT JOIN proofs ON proofs.label LIKE detectors.PosCases AND proofs.name=? HAVING counts",
									[area+"."+name]
								)
								.on("result", function (det) {
									sql.query("UPDATE detectors SET Dirty=Dirty+1");
								});

								break;

						}
				});
			});
			break;
			
	}
}
