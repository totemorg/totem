/**
	@module UIDRAW

	Extends the base.js module with a d3 Fetch method to fetch data from the backend service.
*/
	
/**
	@method Fetch
	
	Callback cb(recs, svg) with a d3 svg dom target, and the records recs = [rec, ...] 
	fetched from the source path(s):

		opts.ds = "PATH" || ["PATH", ...]
		
	where a PATH can data-indexing KEYs like:
	
		PATH = "/src ? Name=^KEY & x:=STORE$.x[^KEY] & y:=STORE$.y[^KEY] ..." 
		
	that are tied to user widgets:

		opts.widgets.KEY = [ ARG, ... ] || { RTN: SELECT, ... } || { min: VAL, max: VAL, step: VAL} || callback

	For example
		
		opts = {
			ds: [
				"/regress?name=test4D4M-*
					&x:=Save_qda$.cls[0].colRate
					&y:=Save_qda$.cls[0].hitRate
					&sort:=Save_qda$.cls[0].nsigma",
					
				"/beta.exe?alpha=^a&beta=^b&N=20"
			],
			
			widgets: {
				a: ("#{query.a}" || "0.5").option(),
				b: ("#{query.b}" || "0.5").option(),
			}
		}
		
	will fetch data from the /regress and /beta endpoints using the current values from
	the (a,b) widgets to set the source path. 

	@param {Object} opts source loading options {ds: "/path", ... }
	@param {Function} cb callback(recs)
*/

function Fetch(opts, cb) {

	function fetchData( path, opts, cb ) {
		/* 
		There are problems with d3.json: 
			(1) d3 became version dependent as  v4+ uses (sometime flakey) promise structure
			(2) d3.json() fails when loading on a https thread
		Thus we use ajax instead.
		*/

		console.log(">>>fetch", path);
		if (false) 	{ // use d3 to fetch
			if ( d3.version.startsWith("3.") )	// older v3
				d3.json( path, (err, recs) => {
					if (err) 
						alert( err+"" );

					else {					
						if (opts.debug>1) alert("data>>> "+JSON.stringify(recs));

						if ( recs ) cb( isArray(recs) ? recs : [recs] , svg );
					}
				});

			else // newer v4+
				d3.json( path ).then( recs => {
					if (opts.debug>1) alert("data>>> "+JSON.stringify(recs));

					if ( recs ) cb( isArray(recs) ? recs : [recs] , svg );
				});
		}

		else 
			//Ajax("GET", true, path, data => {
			//console.log("##########d3 fetch", path);
			Ajax( {}, "GET", path, data => {
				if ( opts.debug>1 ) alert("data>>> "+data);
				try {
					cb( JSON.parse(data) );
				}
				catch (err) {
					if ( opts.debug>3 ) alert(err+">>> "+data);
				} 
				//cb( isArray(recs) ? recs : [recs] );
			});
	}

	if ( isString(opts) ) 
		fetchData( opts, {}, res => cb(res,null) );

	else {
		if (opts.debug) alert( "fetch>>> "+JSON.stringify(opts) ); 
		//if (opts.debug) console.log(opts);

		d3.select("svg").remove();

		const
			body = d3.select("body"),
			/*dims = opts.dims || { margin: null },
			margin = dims.margin || {top: 20, right: 90, bottom: 30, left: 90}, */
			{ dims } = opts,
			{ width,height,margin } = dims,
			{ left,right,top,bottom } = margin,
			svg = body.append("svg") 
				.attr('width', width - left - right )
				.attr('height', height - top - bottom )
				//.attr('width', (dims.width || 1200) - margin.left - margin.right )
				//.attr('height', (dims.height || 500) - margin.top - margin.bottom ),
				//.append("g")
				//	.attr("transform", dims.transform ? dims.transform.parseEMAC(dims) : ""),

				//.append("g")
				.attr("transform", `translate(${left},${top})` ),

			widgets = opts.widgets || {},
			inputs = {};

		var 
			//body = d3.select("body"),
			url = opts.url || "",
			families = {
				"cluster": "xfan,xmap,xpack,xforce,xburst,xdendro,xtree,xctree,xbundle,xcforce",
				"plot": "xplot,xbar",
				"clock": "xchords"
			},
			family = ( families[opts.family] || opts.family || "").split(",");

		url.replace( /(.*)\/(.*).view\?(.*)/, (str,d,v,q) => {
			family.forEach( (f,n) => family[n] = f.tag( `${d}/${f}.view?${q}` ) );
		});

		"p".d3add(body,	{ html: family.join(" || ")	} );

		opts.controls = {
			"+": () => { alert("+"+svg.attr("width")); },
			"-": () => { alert("-"); }
		};

		const 
			{controls} = opts,
			paths = opts.ds.forEach ? opts.ds : [opts.ds];

		for ( var key in controls ) 
			"input".d3add(body, {type: "button", value: key, id: "_"+key} ).on("click", controls[key] );

		paths.forEach( path => {
			if ( path ) {
				path = path.replace(/\^(\w+)/g, (str,key) => {

					function onChange() {
						paths.forEach( path => {
							var revised = false;

							Each(widgets, (key,widget) => {	// scan thru all defined widgets
								if ( input = inputs[key] ) {	// process only used widgets
									var 
										el = input._groups[0][0], //  d3v3 uses input[0][0] because dom is a major kludge!
										value = el.value,
										id = el.id,
										key = id.substr(1),
										reg = new RegExp( `\\^${key}` , "g" );

									path = path.replace( reg, isFunction(widget) ? widget("update", value) : (str,key) => {
										revised = true;
										return value;
									});
								}
							});

							if (revised) 
								fetchData( path, opts, res => cb(res, svg) );
						});
					}

					var 
						id = "_"+key,
						widget = widgets[key],
						input = inputs[key];

					if ( widget ) 
						if ( !input ) {
							switch ( typeOf(widget) ) {
								case "Function":
									input = "input".d3add(body, {type: "button", value: "key", id:id} ).on("click", widget);
									break;

								case "Array":
									input = "input".d3add(body, {type: "text", value: widget[0], min:widget[0], max:widget[1], step:widget[2]||1, id:id} ).on("change", onChange);
									break;

								case "Object":
									if ( "min" in widget)
										input = "input".d3add(body, {type: "number", min: widget.min, max: widget.max, step: widget.step, value: widget.min, id:id} ).on("change", onChange);

									else {
										input = "select".d3add(body, { value: "", id:id} ).on("change", onChange);

										for ( var key in widget ) 
											input.insert("option").attr( "value", key ).text( widget[key] );
									}
									break;

								case "Number":
									input = "input".d3add(body, {type: "number", value: widget, id:id} ).on("change", onChange);
									break;

								case "String":
									input = "input".d3add(body, {type: "text", value: widget, id:id} ).on("change", onChange);
									break;

							}

							inputs[key] = input;
							//Log( `make widget ${key} id = ${id}` );
						}

					return input._groups[0][0].value;
				});

				if ( save = widgets.save )
				"input".d3add(body, {type: "button", value: "save", id: "_save"} ).on("click", save);

				fetchData( path, opts, res => cb(res, svg) );
			}
		});
	}
	
	if (1)
	Sockets({	// establish socket.io i/f
		select: req => {},
		update: req => {},
		insert: req => {},
		delete: req => {}
	});		
}


[
	function d3add (d3el, attrs ) {
		var el = d3el.append(this);

		for (key in attrs) {
			//alert("tag "+key+" " + attrs[key]);
			switch (key) {
				case "text":
				case "html":
					el[key]( attrs[key] ); 
					break;
				case "xstyle":  // seems to crash so x-ed out
					el.style( attrs[key]); 
					break;
				default:
					el.attr(key, attrs[key]);
			}
		}

		return el;
	}
].Extend(String);

