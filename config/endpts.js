/**
Provide TOTEM endpoints.

@module ENDPTS
@requires securelink
@requires enums
@requires cluster
*/

const
	{testClient} = require("../../securelink"),
	{Copy,Log,Fetch} = require("../../enums"),
	CLUSTER = require("cluster");

module.exports = {
	/*
	byAction: {
		select: { ... },
		create: { ... },
		delete: { ... },
		update: { ... },
		execute: { ... }
	},
	*/
	
	/*
	byType: {
		csv: { ... },
		...
	},
	*/
	
	/**
	Endpoint to test connectivity.

	@param {Object} req Totem request
	@param {Function} res Totem response
	*/
	U1: (req,res) => {
		const 
			{ client, site, type } = req,
			{ nick } = site;

		if (type == "help")
		return res("Send connection status");
				
		res( `Welcome ${client} to ${nick}` );
	},

	/**
	Endpoint to shard a task to the compute nodes.

	@param {Object} req Totem request
	@param {Function} res Totem response
	*/
	U2: (req,res) => {  //< task sharding
		const {query,body,sql,type,table,url} = req;
		const {task,domains,cb,client,credit,name,qos} = body;

		if ( type == "help" ) 
		return res("Shard specified task to the compute nodes given task post parameters");

		var 
			$ = JSON.stringify({
				worker: CLUSTER.isMaster ? 0 : CLUSTER.worker.id,
				node: process.env.HOSTNAME
			}),
			engine = `(${cb})( (${task})(${$}) )`;

		res( "ok" );

		if ( task && cb ) 
			doms.forEach( index => {

				function runTask(idx) {
					VM.runInContext( engine, VM.createContext( Copy( TOTEM.tasking || {}, idx) ));
				}

				if (qos) 
					sql.queueTask( new Clock("totem", "second"), { // job descriptor 
						index: Copy(index,{}),
						//priority: 0,
						Class: table,
						Client: client,
						Name: name,
						Task: name,
						Notes: [
								table.tag("?",query).link( "/" + table + ".run" ), 
								((credit>0) ? "funded" : "unfunded").link( url ),
								"RTP".link( `/rtpsqd.view?task=${name}` ),
								"PMR brief".link( `/briefs.view?options=${name}` )
						].join(" || ")
					}, (recs,job,res) => {
						//Log("reg job" , job);
						runTask( job.index );
						res();
					});

				else
					runTask( index );
			});
	},

	/**
	Endpoint to validate clients response to an antibot challenge.

	@param {Object} req Totem session request
	@param {Function} res Totem response callback
	*/
	U3: (req,res) => {
		const 
			{ query, sql, type, body, action } = req,
			{ client , guess } = (action=="select") ? query : body;

		if ( type == "help" ) 
		return res("Validate session id=client guess=value.");

		Log(client,guess);

		if (client && guess)
			testClient( client, guess, pass => res(pass) );

		else
			res( "no admission credentials provided" );
	}

/*
function sysLogin(req,res) {
	const 
		{ sql, query, type, profile, body, action, client } = req,
		{ account, password, option } = (action == "select") ? query : body;
	
	if ( type == "help" )
		return res( `
Login, request password reset, make temp account, return online users, mane an account using option = 
login||reset||temp||make with the specified account=NAME and password=TEXT.
` );

	Log(account,password,option);

	switch ( option ) {
		case "keys":
			const 
				keys = {};
			
			sql.query("SELECT Client,pubKey FROM openv.profiles WHERE Online")
			.on("result", rec => keys[rec.Client] = rec.pubKey )
			.on("end", () => res( keys ) );
		
			break;
			
		default:
			res({
				message: "bad account/password",
			});
	}

}
*/
};