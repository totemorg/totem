// UNCLASSIFIED
/**
To add your compute agents to TOTEM's compute cloud, simply register your agents
using the following `nodejs` code pattern below

which listens for `add`, `cat`, `/me.js`, `dft`, `python`, `R` and `opencv` agent requests 
on port 3333.  Here

+ the last 5 agents require you pass a "$" process flag
to make the [nodejs fs](https://nodejs.org/api/fs.html) 
and [totem man](/github.com/totemstan/man) modules available.   
+ the last 3 agents demonstrate R-opencv-python support (assummed installed 
on your host).
*/

// revise as needed
const 
	need$ = process.argv[2] ? true : false,
	$ = need$ ? require("./man") : null, // "/mnt/repo/man",
	$fs = need$ ? require("fs") : null,
	totems = {
		RLE: "https://RLENET.126:8443",
		WWW: "http://totem.hopto.org",
		SBU: "https://totem.nga.mil:8443",
		COE: "https://totem.coe.nga.mil",
		LOCAL: "http://localhost:8080"
	},
	totem = totems.LOCAL,
	port = 3333,
	agents = {	// define your agents here
		add: (req,res) => {	// an agent to add x and y
			const 
				{x,y} = req.query,
				calc = (x,y) => x+y;

			res( calc(x,y) );
		},
		cat: (req,res) => {	// an agent to concatenate x with y
			const 
				{x,y} = req.query,
				calc = (x,y) => [x,y];

			res( calc(x,y) );
		},
		wakeup: (req,res) => {	// check my task queue
			Fetch( `${totem}/agent?tasks=all`, msg => {
				const tasks = JSON.parse(msg);
				
				res( `I've got ${tasks.length} to work on` );
				tasks.forEach( task => {
					console.log("working", task);
				});
			});
		},
		
		// these tasks require $ and $fs
		
		"/me.js": (req,res) => {	// send a file
			res( req => {
				try {
					$fs.readFile( "./testagent.js", "utf-8", (err,txt) => res(txt) );
				}
				catch (err) {
					res("Error: file not found");
				}
			});
		},
		dft: (req,res) => {	// fft of the x-post array + the a-query offset 
			const
				{ y } = ctx = $("y=dft(x+a)", {		// context for $
					x: req.body.x || [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
					a: req.query.a
				});

			res( y.get("re&im") );
		},
		python: (req,res) => {	// test python engine
			const
				{ a } = $.py(`
import numpy as np;

print 'console log: an array if i need it', np.array([1,2,3]);

def f(x,y):
	return x+y;

a=f(x,y)
`, {
					x: req.query.x,
					y: req.query.y
				});
			
			res( a );
		},
		R: (req,res) => {	// test R engine
			const
				{ a } = ctx = $.R(`
print('you da man');
print('R input ctx=');str(CTX);
CTX$d = 'this is a test';
CTX$e = list(x=1,y=2,z=3);
CTX$a = CTX$x + CTX$y;
CTX$g = list(4,5,6);
CTX$h = TRUE;
`, {
					x: req.query.x,
					y: req.query.y
				});
			
			//console.log(ctx);
			res( ctx );
		},
		opencv: (req,res) => {	// test opencv/caffe engine
			const 
				ctx = $.cv("dummy code", {
					output: {	// classifier output port parms
						scale: 0,
						dim: 100,
						delta: 1,
						hits: 10,
						cascade: ["path1", "path2"]
					},
					input: {// image input port parms
					}
				});
	
			res( ctx );
		}
	};

// do not alter
function Fetch( url, cb ) {
	require("http").get(url, res => {
		var txt = "";
		res.on("data", data => txt += data.toString());
		res.on("end", () => cb(txt) );
	}).end();
}

Fetch(`${totem}/agent?port=${port}&keys=${Object.keys(agents)}`, agent => eval(agent));

// UNCLASSIFIED