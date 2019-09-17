/**
@class ABOT.Utilities.Antibot_Protection
Data theft protection
 */

const { Copy,Each,Log,isError,isArray,isString,isFunction,isEmpty } = require("enum");

var 
	ABOT = module.exports = opts => Copy(opts || {},ABOT, ".");

Copy({
	checkClient: function (req,res) {	//< endpoint to check clients response to a riddle
	/**
	@private
	@method checkClient
	Endpoint to check clients response req.query to a riddle created by challengeClient.
	@param {Object} req Totem session request
	@param {Function} res Totem response callback
	*/
		var 
			query = req.query,
			sql = req.sql,
			id = query.ID || query.id;

		if (id)
			sql.query("SELECT * FROM openv.riddles WHERE ? LIMIT 1", {Client:id}, function (err,rids) {

				if ( rid = rids[0] ) {
					var 
						ID = {Client:rid.ID},
						guess = (query.guess+"").replace(/ /g,"");

					Log([rid,query]);

					if (rid.Riddle == guess) {
						res( "pass" );
						sql.query("DELETE FROM openv.riddles WHERE ?",ID);
					}
					else
					if (rid.Attempts > rid.maxAttempts) {
						res( "fail" );
						sql.query("DELETE FROM openv.riddles WHERE ?",ID);
					}
					else {
						res( "retry" );
						sql.query("UPDATE openv.riddles SET Attempts=Attempts+1 WHERE ?",ID);
					}

				}

				else
					res( ABOT.errors.noSession  );

			});

		else
			res( ABOT.errors.noID );
	},

	initChallenger: function () {
	/**
	@private
	@method initChallenger
	Create a set of ABOT.riddles challenges.
	*/
		function Riddle(map, ref) {
			var 
				Q = {
					x: Math.floor(Math.random()*10),
					y: Math.floor(Math.random()*10),
					z: Math.floor(Math.random()*10),
					n: Math.floor(Math.random()*map["0"].length)
				},

				A = {
					x: "".tag("img", {src: `${ref}/${Q.x}/${map[Q.x][Q.n]}.jpg`}),
					y: "".tag("img", {src: `${ref}/${Q.y}/${map[Q.y][Q.n]}.jpg`}),
					z: "".tag("img", {src: `${ref}/${Q.z}/${map[Q.z][Q.n]}.jpg`})
				};

			return {
				Q: `${A.x} * ${A.y} + ${A.z}`,
				A: Q.x * Q.y + Q.z
			};
		}

		var 
			riddle = ABOT.riddle,
			N = ABOT.riddles,
			map = ABOT.riddleMap,
			ref = "/captcha";

		for (var n=0; n<N; n++) 
			riddle.push( Riddle(map,ref) );
	},

	makeRiddles: function (msg,rid,ids) { //< turn msg with riddle markdown into a riddle
	/**
	@private
	@method makeRiddles
	Endpoint to check clients response req.query to a riddle created by challengeClient.
	@param {String} msg riddle mask contianing (riddle), (yesno), (ids), (rand), (card), (bio) keys
	@param {Array} rid List of riddles returned
	@param {Object} ids Hash of {id: value, ...} replaced by (ids) key
	*/
		var 
			riddles = ABOT.riddle,
			N = riddles.length;

		if (N)
			return msg
				.replace(/\(riddle\)/g, (pat) => {
					var QA = riddles[Math.floor( Math.random() * N )];
					rid.push( QA.A );
					return QA.Q;
				})
				.replace(/\(yesno\)/g, (pat) => {
					var QA = riddles[Math.floor( Math.random() * N )];
					rid.push( QA.A );
					return QA.Q;
				})
				.replace(/\(ids\)/g, (pat) => {
					var rtn = [];
					Each(ids, function (key, val) {
						rtn.push( key );
						rid.push( val );
					});
					return rtn.join(", ");
				})
				.replace(/\(rand\)/g, (pat) => {
					rid.push( Math.floor(Math.random()*10) );
					return "random integer between 0 and 9";		
				})
				.replace(/\(card\)/g, (pat) => {
					return "cac card challenge TBD";
				})
				.replace(/\(bio\)/g, (pat) => {
				return "bio challenge TBD";
			});

		else
			return msg;
	},

	challengeClient: function (sql, client, profile) { //< create a challenge and rely it to the client
	/**
	@private
	@method challengeClient
	Challenge a client with specified profile parameters
	@param {String} client being challenged
	@param {Object} profile with a .Message riddle mask and a .IDs = {key:value, ...}
	*/
		var 
			rid = [],
			reply = (ABOT.riddleMap && ABOT.riddles)
					? makeRiddles( profile.Message, rid, (profile.IDs||"").parseJSON( {} ) )
					: profile.Message;

		if (reply && ABOT.IO) 
			DB.thread( sql => {
				sql.query("REPLACE INTO openv.riddles SET ?", {
					Riddle: rid.join(",").replace(/ /g,""),
					Client: client,
					Made: new Date(),
					Attempts: 0,
					maxAttempts: profile.Retries
				}, function (err,info) {

					ABOT.IO.emit("select", {
						message: reply,
						riddles: rid.length,
						rejected: false,
						retries: profile.Retries,
						timeout: profile.Timeout,
						ID: client, //info.insertId,
						callback: ABOT.paths.url.riddler
					});

					sql.release();
				});
			});
	}
}, ABOT);

