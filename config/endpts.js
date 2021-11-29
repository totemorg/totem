/**
Provide TOTEM endpoints.  The preferred way to add functionality to TOTEM is to 
create [TOTEM Notebooks](http://totem.gopto.org/api.view).  However, this 
module can be used to provide additional TOTEM endpoints having unprotected 
access to the MySQL service.  Revise/rename/remove the examples herein as needed.

@module ENDPTS
@requires securelink
@requires enums
@requires cluster
*/

const
	{testClient} = require("securelink"),
	{Copy,Log,Fetch} = require("enums"),
	CLUSTER = require("cluster");

module.exports = {
	/**
	Endpoint to test connectivity.

	@param {Object} req Totem request
	@param {Function} res Totem response
	*/
	EX1: (req,res) => {
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
	EX2: (req,res) => {  //< task sharding
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
	EX3: (req,res) => {
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

};