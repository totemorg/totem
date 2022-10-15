// UNCLASSIFIED 

/**
@module UIBASE

Provides common utility methods used by next-level clients.
*/

const {
	Copy, Each, Log, 
	Ajax, Send, Pretty,
	isString, isArray, isFunction, isDate, isNumber, isError, typeOf
	} = BASE = {

	Ajax: function Ajax(ctx,method,url,cb) {	//< send context hash using method to url with callback cb if async
		const
			req = new XMLHttpRequest(),
			get = method.toUpperCase() == "GET";

		req.open( method, get ? url.tag("?",ctx) : url, cb?true:false );

		if ( get ) 
			req.send();

		else 
			req.send(JSON.stringify(ctx));

		if ( cb ) 
			req.onreadystatechange = () => {
				//console.log(  req.readyState, req.responseText );
				if ( req.readyState == 4 ) cb( req.responseText );
			}; 

		else 
			return req.responseText;
	},

	Send: function Send(form,data,cb) {		//< submit form inputs that are marked for submit to the form's action url 
		for( var els = form.elements, n=0, N=els.length; n<N; n++ ) {
			var el = els[n];
			if (el.getAttribute("submit")) data[el.id] = el.value;
		}
		//Log( data ); 

		return Ajax( data, form.method, form.action, cb );
	},
		
	Pretty: x => {
		
		if ( x == 0 ) 
			return 0+"";
		
		else
		if (x)
			if ( x.forEach ) {
				var res = "[ ";
				x.forEach( val => res += Pretty(val) + ", " );
				return res+" ]";
			}

			else
			if ( typeof x == "string" ) 
				return x;

			else
			if ( x.toFixed ) 
				return parseFloat(x.toFixed(2));

			else {
				var res = "{ ";
				Each( x, (key,val) => 
					 res += key + ": "+ Pretty(val) + ", " );

				return res+" }";
			}
		
		else
			return "null";
	},
		
	//============ general purpose data testing and output
	Log: (...args) => console.log(">>>base",args),
	
	typeOf: obj => obj.constructor.name,
	isString: obj => obj.constructor.name == "String",
	isNumber: obj => obj.constructor.name == "Number",
	isArray: obj => obj.constructor.name == "Array",
	isObject: obj => obj.constructor.name == "Object",
	isDate: obj => obj.constructor.name == "Date",
	isFunction: obj => obj.constructor.name == "Function",
	isError: obj => obj.constructor.name == "Error",	
	isEmpty: opts => {
		for ( var key in opts ) return false;
		return true;
	},
	
	/**
	Copy source hash to target hash; thus Copy({...}, {}) is equivalent to new Object({...}).
	If a deep deliminator (e.g. ".") is provided, src  keys are treated as keys into the target thusly:

		{	
			A: value,			// sets target[A] = value

			"A.B.C": value, 	// sets target[A][B][C] = value

			"A.B.C.": {			// appends X,Y to target[A][B][C]
				X:value, Y:value, ...
			},	

			OBJECT: [ 			// prototype OBJECT (Array,String,Date,Object) = method X,Y, ...
				function X() {}, 
				function Y() {}, 
			... ]

		} 

	 @memberof SECLINK
	 @param {Object} src source hash
	 @param {Object} tar target hash
	 @param {String} deep copy key 
	 @return {Object} target hash
	 */
	Copy: function Copy (src,tar,deep) {
		for (var key in src) {
			var val = src[key];

			if (deep) 
				switch (key) {
					case Array: 
						val.extend(Array);
						break;

					case "String": 
						val.extend(String);
						break;

					case "Date": 
						val.extend(Date);
						break;

					case "Object": 	
						val.extend(Object);
						break;

					/*case "Function": 
						this.callStack.push( val ); 
						break; */

					default:

						var 
							keys = key.split(deep), 
							Tar = tar,
							idx = keys[0];
						
						for (  // index to the element to set/append
								var n=0,N=keys.length-1 ; 
								n < N ; 
								idx = keys[++n]	) 	
								
							if ( idx in Tar ) 
								Tar = Tar[idx];
							else
								Tar = Tar[idx] = new Array();

						if (idx)  // set target
							Tar[idx] = val;

						else  // append to target
						if (val.constructor == Object) 
							for (var n in val) 
								Tar[n] = val[n];

						else
							Tar.push( val );
				}
			
			else
				tar[key] = val;
		}

		return tar;
	},

	/**
	Enumerates src with optional callback cb(idx,val,isLast) and returns isEmpty.
	@memberof SECLINK
	@param {Object} src source hash
	@param {Function} cb callback (idx,val, isLast) returns true or false to terminate
	*/
	Each: function Each ( A, cb ) {
		Object.keys(A).forEach( key => cb( key, A[key] ) );
	},
}

/**
Extend the opts prototype with specified methods, or, if no methods are provided, 
extend this ENUM with the given opts.  Array, String, Date, and Object keys are 
interpretted to extend their respective prototypes.  
@memberof Array
*/
Array.prototype.Extend = function (con) {
	this.forEach( function (proto) {
		//Log("ext", proto.name, con);
		con.prototype[proto.name] = proto;
	});
};

[ // extend Array
	/**
	*/
	function $( cb ) {
		const args = this;
		args.forEach( (arg,i) => cb( i, args )  );
		return args;
	}
	
	/*
	function select(keys) {
		const rtn = [];
		this.forEach( rec => {
			for ( var key in keys ) 
				if ( rec[key] == keys[key] ) 
					rtn.push(rec);
		});
		//Log("select=", rtn, keys);
		return rtn;
	}*/
	
].Extend(Array);

[
	function replaceKeys(keys) {
		var rtn = this;
		for (var key in keys) rtn = rtn.replace(key,keys[key]);
		return rtn;
	},
	
	/**
	*/
	function parseJSON (def) {
		try {
			return JSON.parse(this);
		}
		catch (err) {
			return def ? isFunction(def) ? def(this) : def : null;
		}
	},

	/**
	Tag url (el = ? || &) or html (el = html tag) with specified attributes.

	@memberof String
	@param {String} el tag element = ? || & || html tag
	@param {String} at tag attributes = {key: val, ...}
	@return {String} tagged results
	*/
	function tag(el,at) {
		switch (el) {
			case "/":
			case "?":
			case "&":   // tag a url
				const
					[path,search] = this.split("?"),
					parms = search ? search.split("&") : [],
					keys = {};
				
				var rtn = path;

				parms.forEach( parm => {
					const
						[lhs,rhs] = parm.split("=");
					keys[lhs] = rhs;
				});
				
				if (at)
					Each(Copy(at,keys), (key,val) => {
						rtn += el + key + "=" + val;
						el = "&";
					});
				
				/*var rtn = this;

				if (rtn.indexOf("?") >= 0) el = "&";
				
				Each(at, (key,val) => {
					if ( val ) {
						rtn += el + key + "=" + val;
						el = "&";
					}
				});*/

				return rtn;	

			case "[]":
			case "()":
				var rtn = this+el.substr(0,1), sep="";
				
				if (at)
					Each(at, (key,val) => {
						rtn += sep + key + ":" + JSON.stringify(val);
						sep = ",";
					});
				return rtn+el.substr(-1);

			case ":":
			case "=":
				var rtn = this, sep="";
				Each(at, (key,val) => {
					rtn += sep + key + el + JSON.stringify(val);
					sep = ",";
				});
				return rtn;

			case "":
				return `<a href="${el}">${this}</a>`;

			default: // tag html

				var rtn = "<"+el+" ";

				if ( at )
					Each( at, (key,val) => {
						if ( val )
							rtn += key + "='" + val + "' ";
					});

				switch (el) {
					case "embed":
					case "img":
					case "link":
					case "input":
						return rtn+">" + this;
					default:
						return rtn+">" + this + "</"+el+">";
				}
		}
	},
	/*
	function tag (el,at) {

		//if (!at) { at = {href: el}; el = "a"; }

		if ( el == "?" || el == "&" ) {  // tag a url
			var rtn = this;

			if (at)
				Each(at, (key,val) => {
					if ( val ) {
						rtn += el + key + "=" + val;
						el = "&";
					}
				});

			return rtn;	
		}

		else {  // tag html
			var rtn = "<"+el+" ";
			//Log("tag", el, at);
			
			if (at)
				Each( at, (key,val) => {
					if ( val )
						rtn += key + "='" + val + "' ";
				});

			switch (el) {
				case "embed":
				case "img":
				case "link":
				case "input":
					return rtn+">" + this;
				default:
					//Log("tag out", rtn+">" + this + "</"+el+">" );
					return rtn+">" + this + "</"+el+">";
			}
		}
	},  */

	/**
	Parse "$.KEY" || "$[INDEX]" expressions given $ hash.

	@memberof String
	@param {Object} $ source hash
	*/
	function parseEval ($) {
		try {
			return eval(this+"");
		}
		
		catch (err) {
			return err+"";
		}
	},
	
	/**
	*/
	function eval (def, stash) {
		//Log(">>>eval", def );
		const args = ((this+"")||def||"").split(",").$( (i,args) => args[i] = args[i].parseJSON( arg => {
			if (stash) {
				for (var key="",n=0,N=arg.length,char=arg.charAt(n); n<N; n++,char=arg.charAt(n) )
					if ( "-_.".indexOf(char) < 0 )
						if ( char == char.toUpperCase() ) key += char;
				
				return stash[key] = arg.toLowerCase();
			}
				
			else
				return arg;
		}) );
		
		return (args.length>1) ? args : args[0]; 
	},
	
	/**
	*/
	function pick (stash) {
		const 
			str = this+":",
			opts = [];
		
		// CI4:SB10:baseline(+) 0.95
		for (var size="", key="", arg="", n=0, N=str.length; n<N; n++, arg += char)
			switch (char = str.charAt(n) ) {
				//case " ": break;
					
				case "0":
				case "1":
				case "2":
				case "3":
				case "4":
				case "5":
				case "6":
				case "7":
				case "8":
				case "9":
				case ".":
					size += char; break;
					break;
					
				case ":":
					opts.push( [stash[key] || key, parseFloat(size||"2")] );
					size = "";
					key = "";
					arg = "";
					break;
					
				default:
					key += char; break;
			}
		
		opts.push([key, parseFloat(size||"2")] );
		return opts;
	},
	
	/**
	*/
	function list (cb) {
		const args = [];
		
		this.split(",").forEach ( arg => args.push( cb(arg) ) );
		return args;
	}	
	
].Extend(String);

// UNCLASSIFIED
