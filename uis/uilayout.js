// UNCLASSIFIED 

/**
@module UILAYOUT 

Provide a jquery client interface per Totem's [api](/api.view) and 
its [skinning guide](/skinguide.view).  The base.jade framework loads 
all dependent (jquery, ui, layout, etc) frameworks.  Provides dom rendering

	Render, Uncomment, Active

To uncomment the dom, then render it, then activate it.
*/

[ // extend Date
	/**
	Return MySQL compliant date string.
	@memberof Date
	@return {String} MySQL compliant version of this date
	*/
	function toJSON () {
		return this.toISOString().split(".")[0];
	}
].Extend(Date);

[  // extend String
	/**
		Spanner
		Parses a "group(key,key, ... ,group[key,key, ...]), ..." string into a set of keys, spans, and 
		html-suitable headers where ()-groups prefix their keys by group_keys and []-groups do not prefix
		their keys.
		
		Example:
		
		"a,b(x,y(u,v,w),z(ah(alpha,beta[gamma,delta]),bh)),c".Spanner() )
		 
		 keys: [
			{ name: 'a' },
			{ name: 'b_x' },
			{ name: 'b_y_u' },
			{ name: 'b_y_v' },
			{ name: 'b_y_w' },
			{ name: 'b_z_ah_alpha' },
			{ name: 'gamma' },
			{ name: 'delta' },
			{ name: 'b_z_bh' },
			{ name: 'c' }

		spans: '{"cols":10,"rows":4,"keys":{"a":null,"b":{"keys":{"b_x":null,"y":{"keys":{"b_y_u":null,"b_y_v":null,"b_y_w":null},"cols":3,"rows":2},"z":{"keys":{"ah":{"keys":{"b_z_ah_alpha":null,"beta":{"keys":{"gamma":null,"delta":null},"cols":2,"rows":4}},"cols":3,"rows":4},"b_z_bh":null},"cols":4,"rows":4}},"cols":8,"rows":4},"c":null}}'

		heads: {
		  '0': [
			{ key: 'a', colspan: 1, rowspan: 5 },
			{ key: 'c', colspan: 1, rowspan: 5 },
			{ key: 'b', colspan: 8, rowspan: 1 }
		  ],
		  '1': [
			{ key: 'b_x', colspan: 1, rowspan: 4 },
			{ key: 'y', colspan: 3, rowspan: 1 },
			{ key: 'z', colspan: 4, rowspan: 1 }
		  ],
		  '2': [
			{ key: 'b_z_bh', colspan: 1, rowspan: 3 },
			{ key: 'b_y_u', colspan: 1, rowspan: 1 },
			{ key: 'b_y_v', colspan: 1, rowspan: 1 },
			{ key: 'b_y_w', colspan: 1, rowspan: 1 },
			{ key: 'ah', colspan: 3, rowspan: 1 }
		  ],
		  '3': [
			{ key: 'b_z_ah_alpha', colspan: 1, rowspan: 2 },
			{ key: 'beta', colspan: 2, rowspan: 1 }
		  ],
		  '4': [
			{ key: 'gamma', colspan: 1, rowspan: 1 },
			{ key: 'delta', colspan: 1, rowspan: 1 }
		  ]
		}
	*/
	function Spanner(cb) {
		const
			{keys,spans,heads} = ctx = {
				keys: [],
				spans: {},
				heads: {}
			};
		
		this.Spans("",0,0,keys,spans,heads,cb || (key => new Object({name:key})) );
		return ctx;
	},
	
	/**
	*/
	function Spans(prefix,pos,depth,keys,spans,heads,cb) {
		
		function stackSpans() {
			var
				header = heads[depth] || (heads[depth] = []),
				maxRows = depth;
			
			for (var key in spans.keys ) 
				if ( span = spans.keys[key] ) 
					maxRows = max( maxRows, span.rows );
			
			for (var key in spans.keys ) {
				var span = spans.keys[key];
				if ( span ) 
					header.push({ 
						key: key,
						colspan: span.cols,
						rowspan: 1
					});
				
				else
					header.push({ 
						key: key,
						colspan: 1,
						rowspan: maxRows - depth + 1
					});
			}
			
			//Log(depth, header); 
			return header.sort( (a,b) => b.rowspan-a.rowspan );
		}

		function stackKey() {
			if (key) {
				keys.push( cb ? new Object(cb(prefix+key)) : prefix+key );
				spans.keys[prefix+key] = null;
				key = "";
				spans.cols++;
			}
		}
				
		const
			{max} = Math;
		
		var
			key = "";
		
		//Log(prefix);
		spans.cols = 0;
		spans.rows = depth;
		spans.keys = {};
		
		for ( const N = this.length; pos<N; pos++) 
			switch ( char = this.charAt(pos)) {
				case "[":
				case "(":
					var span = spans.keys[key] = {keys: {} };
					pos = this.Spans( (char=="(") ? prefix+key+"_" : prefix, pos+1, depth+1, keys, span, heads, cb);
					spans.cols += span.cols;
					spans.rows = max(spans.rows,span.rows);
					//Log(key,"next", pos, this.charAt(pos+1));
					key = "";
					break;
				
				case ",":
					stackKey();
					break;
				
				case "]":
				case ")":
					stackKey();
					stackSpans();		
					return pos;
					
				default:
					key += char;
			}

		stackKey();
		stackSpans();
		
		return pos;
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
				var rtn = this;
				
				if (rtn.indexOf("?") >= 0) el = "&";
				
				Each(at, (key,val) => {
					if ( val ) {
						rtn += el + key + "=" + val;
						el = "&";
					}
				});

				return rtn;	

			case "[]":
			case "()":
				var rtn = this+el.substr(0,1), sep="";
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
	function tag(el,at) {

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
	}, */

	/**
	Parse "$.KEY" || "$[INDEX]" expressions given $ hash.

	@memberof String
	@param {Object} $ source hash
	*/
	function parseEval($) {
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
				case " ": break;
					
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
					
				case ":":
					opts.push( [stash[key] || arg, parseFloat(size||"2")] );
					size = "";
					key = "";
					arg = "";
					break;
					
				default:
					key += char; break;
			}
		
		return opts;
	},
	
	/**
	*/
	function sub(hash) {
		var res = this;
		Each(hash, (key,val) => res = res.replace(key,val) );
		return res;
	}
	
].Extend(String);

/**
Employs the base.js Activate, Uncomment, and Render methods to provide a jquery 
client interface when the dom becomes ready.  
@event onready
*/
$().ready( () => {
	
	/*
	$("div#elFinder").each( el => {
		//alert("elf");
		//alert("elf="+$(el).elfinder);

		//elFinder(el,{
		$(el).elfinder({
			lang: 'en', 
			//debug: ["error", "warning"],
			url :  "php/news.json",
				// path,
				// "http://localhost:8080/cmd=open&parent=/", 
			//rememberLastDir: false,
			//requestType: "get",
			//defaultView: "list",  // list||icons
			//resizable: true,
			handlers: {

				//select: ev => alert("select"),
				//open: ev => alert("open"),
				//back: ev => alert("back"),

			}
		}); //.elfinder("instance");  
		//alert("done");
		//console.log(x);
	});

	return;  */
	const {
		Render, Uncomment, Activate, errors} = {

		errors: {
			nobackend: "Server problem.",
			noframework: "No client framework."
		},
		  
		//=========== dom parsing

		/**
		Remove comments from the dom.
		*/
		Uncomment: $el => {
			$el.contents().filter( (n,el) => {
				//Log(n,el.nodeName, el.nodeType, el.nodeValue);
				return el.nodeType==8;
			}).each( (i,com) => {
				//Log("remove", i, com.nodeValue);
				$(com).remove();
			});
			return $el;
		},

		/**
		Render widgets in the dom per the [totem skinguide](/skinguide.view) starting from the $at element.  
		Callbacks are made to the appropriate widget redendering agent cbs = {
			:
			:
			post: ($els,tabs) => {...},
			image: ($els,tabs) => {...},
			folder: ($els,tabs) => {...},
			accordion: ($els,tabs) => {...},
			grid: ($els,tabs) => {...},
			border: ($els,tabs) => {...},		// border must be last entry
		}.  
		
		After the dom in renderer, use Activate to configure these widgets.
		*/
		Render: ( $at, cbs) => {
			const
				Tab = "tab";		//< keyword used by Render

			const
				border = cbs.border,
				widgets = [];

			//Log("render", $at[0], Object.keys(cbs));
			
			Object.keys(cbs).forEach( widget => {	// scan thru all provided widget types
				//Log("render wid", widget);
				const
					cb = cbs[widget];

				$at.children( widget ).each( (j,el) => {	// process widgets of this type
					//Log("child", el);

					const	// get widget options
						$el = $(el),
						id = el.id,
						panes = {
							north: $el.attr("north"),
							south: $el.attr("south"),
							east: $el.attr("east"),
							west: $el.attr("west")
						},
						posting = panes.north || panes.south || panes.east || panes.west,
						tabs = [];

					var
						inset = "";

					$el.children().not(Tab).each( (i,tag) => {	// get posting html for north pane
						inset += tag.outerHTML;
						$(tag).remove();
					});

					$el.children(Tab).each( (i,tab) => {	// get tabs for this widget
						const $tab = $(tab);
						tabs.push( $tab );
						widgets.push( Render( $tab, cbs ) || null );
					});

					if ( posting || inset ) // requesting a post
						if ( cb != cbs.border ) // cant post to a border
							if ( border ) {	// must have a border agent (in last! item of cbs)
								var update = "";

								for( var pane in panes ) {
									var 
										post = panes[pane],
										html = (pane == "north") ? inset : "";

									$el.attr(pane,"");  // clear posting to prevent infinite recursion

									//Log(">>>post", pane, post);
									
									if (post)
										post.split(",").forEach( url => {
											if (url)
												html += "no iframes".tag("iframe", {src:url, scrolling:"auto", width:"100%", height:"600"});
										});

									/*
									Log(">>>posting", pane, $el[0], el.outerHTML, "===>", 
										( html.tag(Tab,{ id:pane } ) + el.outerHTML.tag(Tab,{id:"center"})
										).tag("border",{id:id+".help"})  ); 
									*/

									if (html) update += html.tag(Tab,{ id:pane } );
								}

								//Log(">>>posting", update);
								$el.replaceWith( // replace widget with border-ed version
									( update + el.outerHTML.tag(Tab,{id:"center"}) ).tag("border",{id:id+".help"})
								);	
								//Log(">>>", $at.html() );
							}

					// generate the widget
					//Log("render gen", $el);
					$el.html( cb( $el, tabs ) );  
				});
			});

			return widgets;
		},

		/**
		Configure and activate widgets starting at $el that were previously Rendered.  Callbacks are made
		to the appropriate widget activation agents cbs = {
			:
			:
			post: $els => {...},
			image: $els => {...},
			folder: $els => {...},
			accordion: $els => {...},
			grid: $els => {...},
			border: $els => {...}
		}.
		*/
		Activate: ( $el, cbs) => {
			//Log("activate", $el[0] );

			Object.keys(cbs).forEach( widget => {
				const
					cb = cbs[widget];

				$el.find(widget).each( (i,el) => {
					const
						$el = $(el);

					//Log("activate", i, $el[0] );

					cb( $el );
				});
			});

		},
	};
	
	const 
		$start = $("#content"), 
		widgets = Render( Uncomment($start), {
			post: ($el,tabs) => {
				const
					path = $el.attr("path") || "",
					width = $el.attr("width") || "100%",
					height = $el.attr("height") || "500px";

				//console.log( ">>>post", "".tag("iframe",{src:path,width:width,height:height}) );
				return "".tag("iframe",{src:path,width:width,height:height});
			},

			image: ($el,tabs) => {
				const
					path = $el.attr("path"),
					{Caman, Darkroom, fabric} = $.fn;

				if (Caman) 
					return "".tag("div",{class: "Caman"});

				else
				if (Darkroom) 
					return (
						"".tag("input", {
							id: "ImageText",
							type: "text",
							size: 20
						}) +

						"".tag("input", {
							id: "ImageName",
							type: "text",
							size: 20,
							value: path.substr(1)
						}) +

						"".tag("input", {
							id: "ImageParm",
							type: "range",
							min: "0",
							max: "100",
							step: "1",
							value: "0"
						}) +

						"".tag("br") +
						"".tag("br") +

						"".tag("img", {
							id: "ImageArea",
							src: path
							//width: 500,
							//height: 500
						}));

				else
				if (fabric) 
					return "".tag("div",{class: "Fabric"});

				else
					return "";

			},

			/* pivot: ($el,tabs) => {
				function isobuttons(group,list) {
					var x = ""; 
					var at = {class: "button"};

					for (var n in list) {
						at["data-"+group] = list[n];
						x += n.tag("button",at);
					}

					return x.tag("div",{id:group,class:"button-group"});
				}

				const
					path = $el.attr("path"),
					cols = $el.attr("cols"),
					{ isotope, elfinder, apy } = $.fn;

				//console.log(">>>>pivot",path,cols,elfinder);

				if (isotope) 
					return (
						isobuttons('filters', { 		// embed filter buttons
							"show all": "*",
							"filter1": ".metal",
							"filter2": ".transition",
							"filter3": ".alkali, .alkaline-earth",
							"filter4": ":not(.transition)",
							"filter5": ".metal:not(.transition)",
							"number > 50": "numberGreaterThan50",
							"group-stan": "stan"
						}) +
						isobuttons('sorts', { 			// embed sort buttons
							"original order": "original-order",
							"name": "name",
							"symbol": "symbol",
							"number": "number",
							"weight": "weight",
							"age": "age",
							"group": "group"
						}) +
						"".tag("div",{id: 'data'})
					).tag("div",{class: "isotope", path:path, cols:cols, debug:false});

				else
				if (elfinder) 
					return "".tag("div",{id: "elFinder", path:path, cols:cols, debug:false});

				else
				if (apy)
					return "".tag("div",{class: "apy", path:path, cols:cols, debug:false});

				else
					return "";

			}, */

			folder: ($el,tabs) => {
				var
					id = $el.attr("id"),
					header = "";
				
				//Log("folder", id,header);
				tabs.forEach( ($tab,i) => {	// append div after tab
					header += $tab.attr("class").tag("a", { href:"#"+id+i}).tag("li",{} );
					$tab.replaceWith( $tab.html().tag("div",{ id:id+i }) );
				});

				//console.log( header.tag("ul",{}) + $el.html() );
				return header.tag("ul",{ }).tag("div",{id:"tabs"}) + $el.html(); 
			},

			accordion: ($el,tabs) => {
				const tab="h3";
				tabs.forEach( ($tab,i) => {		// append div after tab
					//console.log("acc", i, $tab.attr("class").tag(tab, {}) + $tab.html().tag("div",{}) );
					$tab.replaceWith( $tab.attr("class").tag(tab, {}) + $tab.html().tag("div",{}) );
				});
				return $el.html();
			},

			grid: ($el,tabs) => {
				function parseSpec(spec,types) {
					const
						[fKey,fType,fTip,fQual] = spec.split("."),
						grouper = "_";

					//console.log(spec,fKey,fType,types[fType]);
					return {
						key: fKey,
						label: fKey ? fKey.split(grouper).pop() : "ro",
						qualify: fQual || null,
						tip: fTip || fKey, 
						type: types[fType] || null,
						json: fType == "json"
					};
				}

				const 
					name = $el.attr("id"),
					cols = $el.attr("cols"),
					_cols = $el.attr("_cols"),
					path = $el.attr("path"),
					status = $el.attr("status") || "ready",
					fields = [],
					notice = {
						button: "ui-button-" + status,
						header: "ui-header-" + status,
						tipper: "tooltip"
					},
					types = {	// datatable *editor* fieldtypes
						int: "text",
						bigint: "text",
						autonum: "text",
						number: "text",
						float: "text",
						double: "text",
						n: "text",
						i: "text",
						f: "text",

						checkbox: "checkbox",	// radio, checkbox, boolean
						boolean: "checkbox",
						tinyint: "checkbox",
						b: "checkbox",
						c: "checkbox",

						varchar: "text",
						text: "text",
						t: "text",

						html: "html",
						h: "html",

						select: "select",
						s: "select",

						textarea: "textarea",
						longtext: "textarea",
						mediumtext: "textarea",
						json: "textarea",
						x: "textarea",

						date: "date",
						d: "date",
						datetime: "date",
						timestamp: "date"
					},
					{dataTable,easyui,w2grid,jqGrid} = $.fn;

				if ( w2grid ) {
					parseColumns(cols, fields, {
						name: "field",
						label: "caption",
						size: "50px",
						//render: "text",
						sortable: true,
						resizable: true,
						hidable: true,
						editable: {type: "text"}
					});

					return "".tag("table", {
						name: $el.attr("id"),
						//style: "width:1000px;height:500px;",
						style: "width:80%;height:80%",
						class: "w2grid",
					});
				}

				else
				if ( jqGrid ) {
					parseColumns(cols, fields, {
						name: "index",
						label: "name",
						width: 55
					});

					return "".tag("table", {
						class: "jqGrid",
					});
				}

				else
				if ( dataTable ) {
					// make the table header
					var
						thead = "",
						tr = "";

					if ( _cols ) {	// no column grouping
						_cols.split(",").forEach( col => {
							const 
								{key,type,tip,qualify,label,json} = parseSpec(col,types);

							tr += label.tag("th", {
								"data-toggle": notice.tipper, 
								class: notice.header, 
								// title: tip || " ", 
								xkey: key,
								xqualify: qualify,
								xlabel: label,
								xtype: type,
								xtip: tip,
								xcheck: json ? "json" : ""
							});
						});

						//Log("============no group tr", tr);
						thead += tr.tag("tr", {} );
					}

					else 
					if ( cols ) {	// column grouping
						const
							{heads,keys,spans} = cols.Spanner();

						//Log("===grp", cols,{h:heads,k:keys,s:spans});
						Object.keys(heads).forEach( idx => {
							tr = "";							
							heads[idx].forEach( spec => {
								const 
									col = spec.key,
									{key,type,tip,qualify,label,json} = parseSpec(col,types);

								//Log("header",key,type,qual,tip);
								tr += label.tag("th", {
									"data-toggle": notice.tipper, 
									class: notice.header, 
									// title: tip || " ", 
									xkey: key,
									xqualify: qualify,
									xlabel: label,
									xtype: type,
									xtip: tip,
									xcheck: json ? "json" : "",
									rowspan: spec.rowspan, 
									colspan: spec.colspan
								});
							});
							//Log("============grp tr", tr);
							thead += tr.tag("tr",{});
						});
					}

					if ( 0 ) {	// filter columns: add a text input to each footer cell
						$( `#${id} thead tr`, $el ).clone(true).appendTo( `#${id} thead` );
						$( `#${id} thead tr:eq(1) th` , $el ).each( i => {
							var title = $(this).text();	// fails
							console.log(i,title);

							$(this).html( '<input type="text" placeholder="Search '+title+'" />' );

							$( 'input', this ).on( 'keyup change', () => {
								if ( table.column(i).search() !== this.value ) {
									table
										.column(i)
										.search( this.value )
										.draw();
								}
							} );
						});
					}

					//console.log(">>thead", thead);

					return thead		// create table for grid
						.tag("thead", {} )
						.tag("table", {
							id: "dataTable-"+name,
							class: "display",
							style: "width:80%;"
						} );
				}

				else
				if ( easyui ) {
					return "";
				}

				else
					return "";
			},

			border: ($el,tabs) => {	// must be last cb entry
				const
					{ layout } = $.fn;

				if ( layout ) {
					var header = "";
					tabs.forEach( ($tab,i) => {
						const
							id = $tab.attr("id") || "missing pane id",
							Class = $tab.attr("class") || "";

						$tab.replaceWith( (Class + $tab.html()).tag("div", {class:"pane ui-layout-"+id }) );
					});

					return $el.html().tag("div", {id:"container"});
				}

				else
					return "";
			}
		});
	
	/*	
	$("body").dialog({
		autoOpen: false,
		buttons: [{
			text: "ok",
			click: () => alert("ok")
		}]
	});

	$("body").dialog("open");
	*/

	Activate( $start, {
		post: $el => {
		},

		image: $el => {
			const
				{Caman,Darkroom,fabric} = $.fn;

			if (Caman) {
				const
					Canvas = "#ImageCanvas";

				$("input#crop").click(function () {
					alert("crop "+parm.val());
					this.crop(hlen.val(),vlen.val(),hpos.val(),vpos.val());
				});

				$("input#brightness").click(function () {
					var val = (parm.val()-0.5)*200;

					Caman(Canvas, function () {
						alert("brightness "+val);
						this.brightness( val ).render();
					});
				});

				$("input#noise").click(function () {
					var val = (parm.val()-0.5)*200;

					Caman(Canvas, function () {
						alert("noise "+val);
						this.noise( val ).render();
					});
				});

				$("input#invert").click(function () {
					var val = (parm.val()-0.5)*200;

					Caman(Canvas, function () {
						this.invert().render();
					});
				});

				$("input#resize").click(function () {
					var val = (parm.val()-0.5)*200;

					Caman(Canvas, function () {
						this.resize({width:100,height:100}).render();
					});
				});

				$("input#contrast").click(function () {
					var val = (parm.val()-0.5)*200;

					Caman(Canvas, function () {
						this.contrast( val ).render();
					});
				});

				$("input#saturation").click(function () {
					var val = (parm.val()-0.5)*200;

					Caman(Canvas, function () {
						this.saturation( val ).render();
					});
				});

				$("input#save").click(function () {
					alert("save");
				});

				$("input#tag").click(function () {
					alert("tag");
				});

				$("input#open").click(function () {
					alert("open");
				});			
			}

			else
			if (Darkroom) {
			}

			else
			if (fabric) {
				const
					Canvas = "ImageCanvas",
					Fabric = new fabric.Canvas(Canvas);

			}
			
			else
				alert( errors.noframework+" image");
		},

		pivot: $el => {		// legacy - needs to be moved to .jades
			const
				path = $el.attr("path"),
				cols = $el.attr("cols"),
				debug = $el.attr("debug"),
				{ isotope, elfinder, apy } = $.fn;

			if ( apy )
				$("div.apy", $el).each( div => { 			// apy pivots
					$.ajax({
						type: "GET",
						url: path+"?_tree="+cols,
						failure: function () {
							alert( errors.nobackend );
						},
						success: function (tree) {
							apy.html("".pivot(tree.children,0));
						}
					});	
				});

			/*
			if ( elfinder )
				$("div#elFinder", $el).each( el => {
					Log("elf start",path);
					//alert("elf="+$(el).elfinder);
					
					$(el).elfinder({
						lang: 'en', 
						url :  path,
							// "http://localhost:8080/cmd=open&parent=/", 
						
						rememberLastDir: true,
						//requestType: "get",
						defaultView: "list",  // list||icons
						resizable: true,
						handlers: {
							
							select: ev => alert("select"),
							//open: ev => alert("open"),
							//back: ev => alert("back"),
							
						}
					}).elfinder('instance');
					//alert("elf started");
				});
			*/
			
			if ( isotope )
				$("div.isotope", $el).each( div => { 		// isotope pivots
			//alert("iso path="+path+" pivs="+cols);

					$('#data', div).each( data => {
						var $data = $(data);

						if (path)
							$.ajax({
								type: "GET",
								url: path,
								failure: function () {
									alert( errors.nobackend );
								},
								success: function (rtn,status) {
									var Data = rtn.parse({}).data;

									if (Data)
										for (var n=0,N=Data.length; n<N; n++) {
											var data = Data[n];

											Data[n] = {
												group: 	data[pivots[0]] || pivots[0] || "", 
												image:	data[pivots[1]] || pivots[1] || "",
												name: 	data[pivots[2]] || pivots[2] || "",
												symbol: data[pivots[3]] || pivots[3] || "",
												number: parseFloat(data[pivots[4]] || pivots[4] || "0"),
												weight:	parseFloat(data[pivots[5]] || pivots[5] || "0"),
												age:	parseFloat(data[pivots[6]] || pivots[6] || "0"),
												w:		parseInt(data[pivots[7]] || pivots[7] || "1"),
												h:		parseInt(data[pivots[8]] || pivots[8] || "1")
												//links:	data[pivots[8]] || pivots[8] || ""
											};

										}

			//alert(JSON.stringify(Data[0]));

									isostart($data,debug,Data);
								}
							});

						else 
							isostart($data, debug, [
								{group: "transition", image: "Mercury", name: "Mercury", symbol: "Hg", number: 80, weight: 200.59, w:1, h:1},
								{group: "metalloid",  image: "Tellurium", name: "Tellurium", symbol: "Te", number: 52, weight: 127.6, w:1},
								{group: "post-transition", image: "Bismuth", name: "Bismuth", symbol: "Bi", number: 83, weight: 208.980, w:1, h:1},
								{group: "transition", image: "Cadmium", name: "Cadmium", symbol: "Cd", number: 48, weight: 112.411, h:3},
								{group: "alkaline-earth", image: "Calcium", name: "Calcium", symbol: "Ca", number: 20, weight: 40.078, h:4},
								{group: "transition", image: "Rhenium", name: "Rhenium", symbol: "Re", number: 75, weight: 186.207, w:2, h:1},
								{group: "post-transition", image: "Thallium", name: "Thallium", symbol: "Tl", number: 81, weight: 204.383, w:2, h:1},
								{group: "metalloid", image: "Antimony", name: "Antimony", symbol: "Sb", number: 51, weight: 121.76, w:2, h:1}
							]);
					});
				});	
		},

		border: $el => {

			//Log("border", $el[0]);
			const
				{ layout } = $.fn;

			if ( layout ) {
				const
					splash = $el.attr("splash"),
					config = { 
						applyDemoStyles: true,

						defaults: {
							size:					"auto"
						,	minSize:				50
						,	paneClass:				"pane" 		// default = 'ui-layout-pane'
						,	resizerClass:			"resizer"	// default = 'ui-layout-resizer'
						,	togglerClass:			"toggler"	// default = 'ui-layout-toggler'
						,	buttonClass:			"button"	// default = 'ui-layout-button'
						,	contentSelector:		".content"	// inner div to auto-size so only it scrolls, not the entire pane!
						,	contentIgnoreSelector:	"span"		// 'paneSelector' for content to 'ignore' when measuring room for content
						,	togglerLength_open:		35			// WIDTH of toggler on north/south edges - HEIGHT on east/west edges
						,	togglerLength_closed:	35			// "100%" OR -1 = full height
						,	hideTogglerOnSlide:		true		// hide the toggler when pane is 'slid open'
						,	togglerTip_open:		"Close"
						,	togglerTip_closed:		"Open"
						,	resizerTip:				"Resize"
						//	effect defaults - overridden on some panes
						,	fxName:					"slide"		// none, slide, drop, scale
						,	fxSpeed_open:			750
						,	fxSpeed_close:			1500
						,	fxSettings_open:		{ easing: "easeInQuint" }
						,	fxSettings_close:		{ easing: "easeOutQuint" }
						},
						//width: "100%",
						south: {
							maxSize:				200
						, 	spacing_open:			10			// cosmetic spacing
						,	spacing_closed:			5			// 0 to HIDE resizer & toggler when 'closed'
						,	resizable: 				true
						,	slidable:				false		// REFERENCE - cannot slide if spacing_closed = 0
						,	initClosed:				true

						/*	
						//	CALLBACK TESTING...
						,	onhide_start:			function () { return confirm("START South pane hide \n\n onhide_start callback \n\n Allow pane to hide?"); }
						,	onhide_end:				function () { alert("END South pane hide \n\n onhide_end callback"); }
						,	onshow_start:			function () { return confirm("START South pane show \n\n onshow_start callback \n\n Allow pane to show?"); }
						,	onshow_end:				function () { alert("END South pane show \n\n onshow_end callback"); }
						,	onopen_start:			function () { return confirm("START South pane open \n\n onopen_start callback \n\n Allow pane to open?"); }
						,	onopen_end:				function () { alert("END South pane open \n\n onopen_end callback"); }
						,	onclose_start:			function () { return confirm("START South pane close \n\n onclose_start callback \n\n Allow pane to close?"); }
						,	onclose_end:			function () { alert("END South pane close \n\n onclose_end callback"); }
						//,	onresize_start:			function () { return confirm("START South pane resize \n\n onresize_start callback \n\n Allow pane to be resized?)"); }
						,	onresize_end:			function () { alert("END South pane resize \n\n onresize_end callback \n\n NOTE: onresize_start event was skipped."); }
						*/
						},
						north: {
							spacing_open:			10			// cosmetic spacing
						,	spacing_closed:			5			// 0 to HIDE resizer & toggler when 'closed'
						//,	togglerLength_open:		0			// HIDE the toggler button
						//,	togglerLength_closed:	-1			// "100%" OR -1 = full width of pane
						,	resizable: 				true
						,	slidable:				false
						,	initClosed:				splash?false:true
						//	override default effect
						,	fxName:					"none"
						},
						west: {
							size:					250
						,	spacing_open:			20			// cosmetic spacing
						,	spacing_closed:			10			// wider space when closed
						,	togglerLength_closed:	10			// make toggler 'square' - 21x21
						,	togglerAlign_closed:	"top"		// align to top of resizer
						,	togglerLength_open:		0			// NONE - using custom togglers INSIDE west-pane
						,	togglerTip_open:		"Close West Pane"
						,	togglerTip_closed:		"Open West Pane"
						,	resizerTip_open:		"Resize West Pane"
						,	slideTrigger_open:		"click" 	// default
						,	initClosed:				true
						//	add 'bounce' option to default 'slide' effect
						,	fxSettings_open:		{ easing: "easeOutBounce" }
						},
						east: {
							size:					250
						,	spacing_open:			20			// cosmetic spacing
						,	spacing_closed:			10			// wider space when closed
						,	togglerLength_closed:	21			// make toggler 'square' - 21x21
						,	togglerAlign_closed:	"top"		// align to top of resizer
						,	togglerLength_open:		0 			// NONE - using custom togglers INSIDE east-pane
						//,	togglerTip_open:		"Close East Pane"
						//,	togglerTip_closed:		"Open East Pane"
						//,	resizerTip_open:		"Resize East Pane"
						,	slideTrigger_open:		"mouseover"
						,	initClosed:				true
						//	override default effect, speed, and settings
						,	fxName:					"drop"
						,	fxSpeed:				"normal"
						,	fxSettings:				{ easing: "" } // nullify default easing
						},
						center: {
							//paneSelector:			"#mainContent" 			// sample: use an ID to select pane instead of a class
							minWidth:				200
						,	minHeight:				50
						}
					};
					/*{
					$el: bord,
					name: bord.id,			
					tab: "tab"

					// These settings are set in 'sub-key format' - ALL data must be in a nested data-structures
					// All default settings (applied to all panes) go inside the defaults:{} key
					// Pane-specific settings go inside their keys: north:{}, south:{}, center:{}, etc
					// options.defaults apply to ALL PANES - but overridden by pane-specific settings
				,	defaults: {
						size:					"auto"
					,	minSize:				50
					,	paneClass:				"pane" 		// default = 'ui-layout-pane'
					,	resizerClass:			"resizer"	// default = 'ui-layout-resizer'
					,	togglerClass:			"toggler"	// default = 'ui-layout-toggler'
					,	buttonClass:			"button"	// default = 'ui-layout-button'
					,	contentSelector:		".content"	// inner div to auto-size so only it scrolls, not the entire pane!
					,	contentIgnoreSelector:	"span"		// 'paneSelector' for content to 'ignore' when measuring room for content
					,	togglerLength_open:		35			// WIDTH of toggler on north/south edges - HEIGHT on east/west edges
					,	togglerLength_closed:	35			// "100%" OR -1 = full height
					,	hideTogglerOnSlide:		true		// hide the toggler when pane is 'slid open'
					,	togglerTip_open:		"Close This Pane"
					,	togglerTip_closed:		"Open This Pane"
					,	resizerTip:				"Resize This Pane"
					//	effect defaults - overridden on some panes
					,	fxName:					"slide"		// none, slide, drop, scale
					,	fxSpeed_open:			750
					,	fxSpeed_close:			1500
					,	fxSettings_open:		{ easing: "easeInQuint" }
					,	fxSettings_close:		{ easing: "easeOutQuint" }
				}
				,	north: {
						spacing_open:			1			// cosmetic spacing
					,	togglerLength_open:		0			// HIDE the toggler button
					,	togglerLength_closed:	-1			// "100%" OR -1 = full width of pane
					,	resizable: 				false
					,	slidable:				false
					//	override default effect
					,	fxName:					"none"
					}
				,	south: {
						maxSize:				200
					,	spacing_closed:			0			// HIDE resizer & toggler when 'closed'
					,	slidable:				false		// REFERENCE - cannot slide if spacing_closed = 0
					,	initClosed:				true
					//	CALLBACK TESTING...
					,	onhide_start:			function () { return confirm("START South pane hide \n\n onhide_start callback \n\n Allow pane to hide?"); }
					,	onhide_end:				function () { alert("END South pane hide \n\n onhide_end callback"); }
					,	onshow_start:			function () { return confirm("START South pane show \n\n onshow_start callback \n\n Allow pane to show?"); }
					,	onshow_end:				function () { alert("END South pane show \n\n onshow_end callback"); }
					,	onopen_start:			function () { return confirm("START South pane open \n\n onopen_start callback \n\n Allow pane to open?"); }
					,	onopen_end:				function () { alert("END South pane open \n\n onopen_end callback"); }
					,	onclose_start:			function () { return confirm("START South pane close \n\n onclose_start callback \n\n Allow pane to close?"); }
					,	onclose_end:			function () { alert("END South pane close \n\n onclose_end callback"); }
					//,	onresize_start:			function () { return confirm("START South pane resize \n\n onresize_start callback \n\n Allow pane to be resized?)"); }
					,	onresize_end:			function () { alert("END South pane resize \n\n onresize_end callback \n\n NOTE: onresize_start event was skipped."); }
					}
				,	west: {
						size:					250
					,	spacing_closed:			21			// wider space when closed
					,	togglerLength_closed:	21			// make toggler 'square' - 21x21
					,	togglerAlign_closed:	"top"		// align to top of resizer
					,	togglerLength_open:		0			// NONE - using custom togglers INSIDE west-pane
					,	togglerTip_open:		"Close West Pane"
					,	togglerTip_closed:		"Open West Pane"
					,	resizerTip_open:		"Resize West Pane"
					,	slideTrigger_open:		"click" 	// default
					,	initClosed:				true
					//	add 'bounce' option to default 'slide' effect
					,	fxSettings_open:		{ easing: "easeOutBounce" }
					}
				,	east: {
						size:					250
					,	spacing_closed:			21			// wider space when closed
					,	togglerLength_closed:	21			// make toggler 'square' - 21x21
					,	togglerAlign_closed:	"top"		// align to top of resizer
					,	togglerLength_open:		0 			// NONE - using custom togglers INSIDE east-pane
					,	togglerTip_open:		"Close East Pane"
					,	togglerTip_closed:		"Open East Pane"
					,	resizerTip_open:		"Resize East Pane"
					,	slideTrigger_open:		"mouseover"
					,	initClosed:				true
					//	override default effect, speed, and settings
					,	fxName:					"drop"
					,	fxSpeed:				"normal"
					,	fxSettings:				{ easing: "" } // nullify default easing
					}
				,	center: {
						paneSelector:			"#mainContent" 			// sample: use an ID to select pane instead of a class
					,	minWidth:				200
					,	minHeight:				200
					}
				} */


				//$el.children("div").each( i => console.log(">>>brd",i, config) );
				$el.children("div").layout(config);

				if ( 0 ) {
					/*******************************
					 ***  CUSTOM LAYOUT BUTTONS  ***
					 *******************************
					 *
					 * Add SPANs to the east/west panes for customer "close" and "pin" buttons
					 *
					 * COULD have hard-coded span, div, button, image, or any element to use as a 'button'...
					 * ... but instead am adding SPANs via script - THEN attaching the layout-events to them
					 *
					 * CSS will size and position the spans, as well as set the background-images
					 */
					console.log("olay", outerLayout);

					// BIND events to hard-coded buttons in the NORTH toolbar
					outerLayout.addToggleBtn( "#tbarToggleNorth", "north" );
					outerLayout.addOpenBtn( "#tbarOpenSouth", "south" );
					outerLayout.addCloseBtn( "#tbarCloseSouth", "south" );
					outerLayout.addPinBtn( "#tbarPinWest", "west" );
					outerLayout.addPinBtn( "#tbarPinEast", "east" );

					// save selector strings to vars so we don't have to repeat it
					// must prefix paneClass with "body > " to target ONLY the outerLayout panes
					var westSelector = "body > .ui-layout-west"; // outer-west pane
					var eastSelector = "body > .ui-layout-east"; // outer-east pane

					console.log("sel", westSelector, eastSelector );
					 // CREATE SPANs for pin-buttons - using a generic class as identifiers
					$("<span></span>").addClass("pin-button").prependTo( westSelector );
					$("<span></span>").addClass("pin-button").prependTo( eastSelector );
					// BIND events to pin-buttons to make them functional
					outerLayout.addPinBtn( westSelector +" .pin-button", "west");
					outerLayout.addPinBtn( eastSelector +" .pin-button", "east" );

					 // CREATE SPANs for close-buttons - using unique IDs as identifiers
					$("<span></span>").attr("id", "west-closer" ).prependTo( westSelector );
					$("<span></span>").attr("id", "east-closer").prependTo( eastSelector );
					// BIND layout events to close-buttons to make them functional
					outerLayout.addCloseBtn("#west-closer", "west");
					outerLayout.addCloseBtn("#east-closer", "east");

					console.log("pins added");
					/* Create the INNER LAYOUT - nested inside the 'center pane' of the outer layout
					 * Inner Layout is create by createInnerLayout() function - on demand
					 *
						innerLayout = $("div.pane-center").layout( layoutSettings_Inner );
					 *
					 */

					// DEMO HELPER: prevent hyperlinks from reloading page when a 'base.href' is set
					if (0)
					$("a").each(function () {
						var path = document.location.href;
						if (path.substr(path.length-1)=="#") path = path.substr(0,path.length-1);
						if (this.href.substr(this.href.length-1) == "#") this.href = path +"#";
					});
				}

				//$el.layout(config);
			}

			else
				alert( errors.noframework+" border" );
		},

		folder: $el => {
			const
				dock = $el.attr("dock") || "top";

			$el.tabs({
				active: 0,
				collapsible: true
			});

			if ( dock ) {
				$el.children("#tabs")
				.addClass(`ui-tabs-${dock} ui-helper-clearfix`);

				//$el.children("#tabs").children("ul").children("li").each( (i,x) => console.log(i, dock, $(x).text() ));
				$el.children("#tabs").children("ul").children("li").removeClass( "ui-corner-top" ).addClass( "ui-corner-left" ); 
			}
		},

		accordion: $el => $el.accordion({
			event: "click",
			active: false, 
			collapsible: true,
			disable: false,
			heightStyle: "content"
		}),

		grid: $el => {
			function ajaxString(editor,rowdata) {
				var
					invalid = [],
					table = editor.s.dt,
					cols = table.init().columns,
					rec = {};

				cols.forEach( col => {	// copy over only valid keys
					//console.log(">ajax", col.data);
					if ( key = col.data ) 
						if ( check = col.check )
							if ( val = check( rowdata[key] ) )
								rec[ key ] = val;
							else
								invalid.push(key);
						else
							rec[ key ] = rowdata[ key ];
				});

				return invalid.length ? invalid : JSON.stringify(rec);
			}

			const 
				gridID = $el.attr("id"),
				cols = $el.attr("cols"),
				_cols = $el.attr("_cols"),
				path = $el.attr("path"),
				blogger = $el.attr("blog") || "Description",
				menu = $el.attr("menu") || "",
				head = $el.attr("head") || "",
				status = $el.attr("status") || "ready",
				notice = {
					button: "ui-button-" + status,
					header: "ui-header-" + status
				},
				fields = [],
				checks = {
					json: txt => {
						if ( txt )
							try {
								JSON.parse(txt);
								return txt;
							}
							catch (err) {
								return null;
							}

						else
							return "null";
					}
				},
				renders = {
					boolean: (data, orthType, row) => 
						data
						? '<input type="checkbox" class="editor-active" onclick="return false;" checked>'
						: '<input type="checkbox" onclick="return false;" class="editor-active">'
				},
				tags = {},
				toggle = {
					blog: false,
					responsive: false,
					select: false
				},
				selRec = {Name:"undefined"},
				icon = i => "".tag("img",{src:`/icons/actions/${i}.png`,width:15,height:15}),
				{dataTable,easyui,w2grid,jqGrid} = $.fn;

			if ( w2grid ) {
			}

			else
			if ( jqGrid ) {
				const
					config = {
						loadtext: "Loading data ...",
						recordtext: "View {0} - {1} of {2}",
						emptyrecords: "No records to view",
						pgtext : "Page {0} of {1}",
						jsonReader: {
							root:"data",
							page: null,
							total: null,
							records: "count",
							repeatitems: false,
							id: "ID"
						},
						prmNames: {
							page: "_page", 			// requested page (default = page)
							rows: "_limit", 		// number of rows requested (default = rows)
							sort: "_sort", 			// sorting column (default = sidx)
							order: "_order", 		// sort order (default = sord)
							search: "_search", 		// search indicator (default = _search)
							nd: "_time", 			// time passed to the request (for IE browsers not to cache the request) (default = nd)
							id: "ID",				// name of the id when posting data in edit modules (default = id)
							oper: "_oper", 			// operation parameter (default = oper)
							editoper: "update", 	// name of operation when the data is posted in edit mode (default = edit)
							addoper: "insert", 		// name of operation when the data is posted in add mode (default = add)
							deloper: "delete", 		// name of operation when the data is posted in delete mode (default = del)
							totalrows: null, 		// number of the total rows to be obtained from server - see rowTotal (default = totalrows)
							subgridid: null 		// name passed when we click to load data in the subgrid (default = id) 			
						}
					};

				$el.children("div").jqGrid( config );
			}

			else		
			if ( dataTable ) {
				const
					$table = $el.children("table");

				//console.log(">>connfig", $el[0]);

				$( "th", $table ).each( (i,col) => {  // define table config fields
					const
						$col = $(col), 
						key = $col.attr("xkey"),
						type = $col.attr("xtype") || "",
						qual = $col.attr("xqualify") || "",
						label = $col.attr("xlabel") || "",
						check = $col.attr("xcheck") || "",
						dci = parseInt( $col.attr("data-column-index") ) || 0,
						hide = qual == "hide",
						lock = qual == "lock",
						opts = (type == "select") ? qual.split("|") : null;

					//console.log( i, dci, $col.text(), [key,type,qual,label] );

					if ( type )	// have a db key here
						fields.push({
							data: key,
							name: key,
							title: label,
							type: hide ? "hidden" : type,
							readonly: lock,
							visible: !hide,
							//defaultContent: "null",
							options: opts || null,
							check: checks[check] || null,
							render: renders[type] || null 
						});
				});

				$table.DataTable({		// define grid
					ajax: {
						url: path
						//dataSrc: "data",
						/*data: d => {
							console.log("ajax data", d);
						}*/
					},

					/*
					R Reorder
					B Buttons
					Z i forgot
					C Column visibility menu
					S Scroller
					P Search panes
					Q Search builder
					l length changing
					f fitering
					i showing info
					t the table
					p pagnation controls
					r processing display
					<"div"> use div to position
					*/

					rowId: "ID", 

					dom: //bootstrap3
"<'row'<'col-sm-6'RCZB><'col-sm-6'f>>" +
"<'row'<'col-sm-12'tr>>" +
"<'row'<'col-sm-5'l><'col-sm-7'p>>",
						// '<"top"RCZBf<"clear">>rt<"bottom"ipl<"clear">>',
						// 'RBlfrtip', //'RCZBlfrtip',
						// '<"top"RCZBf<"clear">>rt<"bottom"ilp<"clear">>', //'Bfrtip',	//Zlfrtip

					colReorder: {
					},

					colResize: {
						tableWidthFixed: false
					},

					columnDefs: [ {	// default field options
						//maxWidth: "30em",
						//width: "30em",
						orderable: false,
						className: 'select-checkbox',
						targets:   1, // should revise to index of field labeled "Name"
						checkboxes: {
						   selectRow: true
						}
					} ],
					select: {
						style:    'os',
						selector: 'td:first-child'
					},
					order: [[ 0, 'asc' ]],

					//select: true,
					responsive: false,
					altEditor: true,
					//orderCellsTop: true,
					//fixedHeader: true,

					onAddRow: (editor, rowdata, success, error) => {
						//table.row.add();
						const str = ajaxString(editor,rowdata);

						if ( str.forEach )
							alert( "invalid fields: "+str.join(","));

						else
							$.ajax({
								url: path,
								type: 'POST',
								data: str,
								success: success,
								error: error
							});
					},

					onDeleteRow: (editor, rowdata, success, error) => {
						$.ajax({
							url: `${path}&ID=${rowdata.ID}`,
							type: 'DELETE',
							data: "",
							success: success,
							error: error
						});
					},

					onEditRow: (editor, rowdata, success, error) => {
						const str = ajaxString(editor,rowdata);

						if ( str.forEach )
							alert( "invalid fields: "+str.join(","));

						else
							$.ajax({
								url: `${path}&ID=${rowdata.ID}`,
								url: `${path}&ID=${rowdata.ID}`,
								type: 'PUT',
								data: str,
								success: success,
								error: error
							});
					},

					/*rowReorder: {
						dataSrc: 'ID',
						//editor:  editor
					},*/

					/*
					rowGroup: { 
						dataSrc: "Name" 
					}, */

					buttons: [
						{
							className: notice.button,
							text: icon("fit"),
							titleAttr: "Fit",
							action: ( e, dt, node, config ) => {
								var 
									dtinit = dt.init();

								//console.log(dt, dtinit, toggle);
								dtinit.responsive = toggle.responsive = !toggle.responsive;

								dt.destroy();
								//$("#test1 tbody").empty();
								//$("#test1 thead").empty();

								$(`#${gridID} table`).DataTable(dtinit);
								//alert("regen");
							}
						},	
						{
							extend: "print",
							className: notice.button,
							text: icon("print"),
							titleAttr: "Print",
							//name: "print"
						},
						{
							className: notice.button,
							text: icon("blog"),
							titleAttr: "Blog",
							action: ( e, dt, node, config ) => {
								//alert( JSON.stringify(selRec) );
								const
									data = dt.rows( { selected: true } ).data() || [],
									sel = data[0];

								if ( sel ) {
									toggle.blog = !toggle.blog;

									// cant get DT.ajax.url() and .reload() to work so ...
									$.ajax({
										url: toggle.blog
											? path.replace(".db",".blog").tag("?", {name:sel.Name})
											: path.tag("?", {name:sel.Name}),
										type: 'GET',
										data: "",
										success: res => {
											// sometimes response is json parsed - wtf
											const rec = res.length ? JSON.parse(res) : res;
											dt.clear().rows.add( rec.data ).draw();
										},
										error: () => {
											alert(errors.nobackend);
										}
									});
								}
								
								else
									alert("select a usecase");
							}
						},
						{
							className: notice.button,
							text: icon("run"),
							titleAttr: "Run",
							action: ( e, dt, node, config ) => {
								$.ajax({
									url: path.replace(".db",".exe").tag("?",{name:selRec.Name}),
									type: 'GET',
									data: "",
									success: res => {
										//console.log("res",res);
										alert("submitted");
									},
									error: () => {
										alert(errors.nobackend);
									}
								});
							}
						},
						{ 
							className: notice.button,
							extend: "colvis",
							text: icon("display"),
							titleAttr: "Display"
						},
						{
							className: notice.button,
							extend: 'selected', // Bind to Selected row
							text: icon("select"),
							titleAttr: 'Select',
							action: ( e, dt, node, config ) => {
								const
									data = dt.rows( { selected: true } ).data() || [];

								if ( data[0] ) Copy( data[0], selRec ); else selRec.Name = "undefined";

								//alert( JSON.stringify(selRec) );

								$.ajax({
									url: (toggle.select = !toggle.select) ? path.tag("?",{name:selRec.Name}) : path,
									type: 'GET',
									data: "",
									success: res => {
										dt.clear().rows.add( res.data ).draw();
									},
									error: () => {
										alert(errors.nobackend);
									}
								});
							}
						},
						{
							className: notice.button,
							extend: 'selected', // Bind to Selected row
							text: icon("insert"),
							titleAttr: 'Add',
							name: 'add',        // do not change name
						},
						{
							className: notice.button,
							extend: 'selected', // Bind to Selected row
							text: icon("update"),
							titleAttr: 'Update',
							name: 'edit'        // do not change name
						},
						{
							className: notice.button,
							extend: 'selected', // Bind to Selected row
							text: icon("delete"),
							titleAttr: 'Delete',
							name: 'delete'      // do not change name
						},
						{
							className: notice.button,
							text: icon("clone"),
							titleAttr: "Clone",
							action: ( e, dt, node, config ) => {
								const 
									data = dt.rows({selected:true}).data(),
									sel = data[0] || {Name:""};

								sel.Name = "clone"+sel.Name;

								//console.log( "sel", sel );
								$.ajax({
									url: path,
									type: 'POST',
									data: JSON.stringify(sel),
									success: res => {
										//console.log("res",res);
										alert("cloned");
									},
									error: () => {
										alert(errors.nobackend);
									}
								});

							}
						},		
						{
							className: notice.button,
							text: icon("refresh"),
							titleAttr: "Refresh",
							name: 'refresh'      // do not change name
						},
						{
							className: notice.button,
							text: icon("down"),
							titleAttr: "Import",
							action: ( e, dt, node, config ) => {
								$.ajax({
									url: path.replace(".db",".import"),
									type: 'GET',
									data: "",
									success: res => {
										alert("imported");
									},
									error: () => {
										alert(errors.nobackend);
									}
								});
							}
						},		
						{
							className: notice.button,
							text: icon("up"),
							titleAttr: "Export",
							action: ( e, dt, node, config ) => {
								$.ajax({
									url: path.replace(".db",".export"),
									type: 'GET',
									data: "",
									success: res => {
										alert("exported");
									},
									error: () => {
										alert(errors.nobackend);
									}
								});
							}
						},		
						/*
						{
							text: "New",
							action: ( e, dt, node, config ) => {
								alert( 'New' );
								console.log(e,dt,node,config);
							}
						},
						{
							text: "Save",
							action: ( e, dt, node, config ) => {
								alert( 'Save' );
								console.log(e,dt,node,config);
							}
						},
						{
							text: "Delete",
							action: ( e, dt, node, config ) => {
								alert( 'Delete' );
								console.log(e,dt,node,config);
							}
						}, */
					],

					autoWidth: false,
					info: true,
					lengthChange: true,
					paging: true,
					scrollY: 300,
					scrollX: 600,
					pageLength: 20,
					columns: fields
				});
			}

			else
			if ( easyui ) {
			}

			else
				alert( errors.noframework+" grid" );
		}
	});

	// console.log("widgets", widgets);
	//$('[data-toggle="tooltip"]').each( (i,tip) => console.log("tip", i, $(tip).attr("title") ) );
	
	$('[data-toggle="tooltip"]').each( (i,tt) => {
		const
			$tt = $(tt),
			tip = $tt.attr("xtip");

		//Log(i,tip);
		$tt.tooltip({ // only safe way to add html to tooltip
			delay: 0,
			track: true,
			fade: 250,
			container: "body",
			//width: "100em",
			title: unescape(tip),
			placement: "top",
			trigger: "hover",
			html: true,
			//container: "body",
			offset: 100
		});
		// $tt.on('hide.bs.tooltip', function () {  return !hover;	});
	});

	//$("body").tooltip({ selector: '[data-toggle=tooltip]' });

	if (0) {
		$('body').on('mouseenter', '.tooltip,a[rel=tooltip]', function () {
			hover = true;
		});

		$('th').on('mouseenter', function() {
			hover=false;
			//$('.tooltip').hide();
		});
	}

	if (0)
	$("#folder").each( (i,f) => {
		$(f).tabs({active:1});
		$("folder",f).tabs({active:true});
	});
	
	const
		notice = document.getElementById("notice");
	
	//alert("notice="+notice);
	//alert("socks="+Sockets);
	
	if (notice)
		Sockets({	// establish socket.io i/f
			select: req => {
				// console.log(">>>>>>>>>>>select", req);
				// notice.innerHTML = req.message.tag("p",{});
			},
			update: req => {

				//console.log(">>>>>>>>>>>update", req, ioClient);

				if ( req.by != ioClient ) {
					if (notice) notice.value = `Update ${req.ds}:${req.recID} by ${req.by}`; 
					$(`table#dataTable-nets`).each ( (i,dtEl) => {
						const
							dt = $(dtEl).DataTable();

						dt.row( `#${req.recID}` ).data( req.change );

						/*var
							recs = dt.rows().data();

						recs.each( (i,rec) => console.log( i, recs[i] ) );

						var
							rec10 = dt.row("#10").data();

						console.log("rec10=", rec10); */
					});
				}

			},
			insert: req => {
				//console.log(">>>>>>>>>>>insert", req);

				if ( req.by != ioClient ) {
					if (notice) notice.value = `Insert ${req.ds}:${req.recID} by ${req.by}`; 
					$(`table#dataTable-nets`).each ( (i,dtEl) => {
						const
							dt = $(dtEl).DataTable();

						dt.row().add( req.change );
					});				
				}
			},
			delete: req => {
				//console.log(">>>>>>>>>>>delete", req);

				if ( req.by != ioClient ) {
					if (notice) notice.value = `Delete ${req.ds}:${req.recID} by ${req.by}`; 
					$(`table#dataTable-nets`).each ( (i,dtEl) => {
						const
							dt = $(dtEl).DataTable();

						dt.row( `#${req.recID}` ).remove();
					});
				}
			},

			relay: req => {
				const
					{ passphrase, secureLink } = SECLINK,
					notice = document.getElementById("notice");

				//console.log(">>>>>>>>>>>relay", req, passphrase);

				if ( req.to == ioClient )
					Decrypt( passphrase, req.message, secureLink.pubKeys[ioClient], secureLink.priKey, msg => {
						//alert(msg);
						notice.value = msg + "<=" + req.from;
					});
			}
		});
	
	else
		Log("secureLink disabled");
});

// UNCLASSIFIED
