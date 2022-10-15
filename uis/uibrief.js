
//console.log("reveal init",Reveal.initialize, hljs, Reveal.getQueryHash().theme);

if (0)
Reveal.initialize({
	controls: true,
	progress: true,
	history: true,
	center: true,

	theme: Reveal.getQueryHash().theme, // available themes are in /css/theme
	transition: Reveal.getQueryHash().transition || 'default', // default/cube/page/concave/zoom/linear/fade/none

	// Parallax scrolling
	// parallaxBackgroundImage: 'https://s3.amazonaws.com/hakim-static/reveal-js/reveal-parallax-1.jpg',
	// parallaxBackgroundSize: '2100px 900px',

	// Optional libraries used to extend on reveal.js
	dependencies: [
		{ src: 'lib/js/classList.js', condition: function() { return !document.body.classList; } },
		{ src: 'plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
		{ src: 'plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
		{ src: 'plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
		{ src: 'plugin/zoom-js/zoom.js', async: true, condition: function() { return !!document.body.classList; } },
		{ src: 'plugin/notes/notes.js', async: true, condition: function() { return !!document.body.classList; } }
	]
});

if (1)
Reveal.initialize({
	keyboard: {
		112: function () {  // F1 for quiz see jades/exquiz.jade for usage
			alert("quiz time!");
			takequiz({ take:  true, slide: 0, doc: document, rev: Reveal, test: "#{name}.1.1" });
		}
	},

	// Display controls in the bottom right corner
	controls: true,

	// default slide delay
	autoSlide:10000, 	// milisecs

	// Display a presentation progress bar
	progress: true,

	// If true; each slide will be pushed to the browser history
	history: true,

	// Loops the presentation, defaults to false
	loop: false,

	// Slide numbers
	slideNumber: "c/t",

	// Flags if mouse wheel navigation should be enabled
	mouseWheel: true,

	// Apply a 3D roll to links on hover
	rollingLinks: true,

	// UI style
	theme:  Reveal.getQueryHash().theme, //'default', // available themes are in /css/theme

	// Transition style
	transition:  Reveal.getQueryHash().transition || 'default', //'default', // default/cube/page/concave/zoom/linear/none

	// For MathJax suuport

	math: {
		mathjax: '/clients/mathjax/MathJax.js',
		config: 'TeX-AMS_HTML-full'  // See http://docs.mathjax.org/en/latest/config-files.html
	},

	//	Optional libraries used to extend on reveal.js

	dependencies: [
		{ src: '/clients/reveal/lib/js/classList.js', condition: function() { return !document.body.classList; } },
		{ src: '/clients/reveal/plugin/math/math.js', async: true },
		{ src: '/clients/reveal/plugin/markdown/showdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
		{ src: '/clients/reveal/plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
		
		//{ src: '/clients/reveal/plugin/highlight/highlight.js', async: false, callback: function() { hljs.initHighlightingOnLoad(); } },
		
		{ src: '/clients/reveal/plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
		{ src: '/clients/reveal/plugin/zoom-js/zoom.js', async: true, condition: function() { return true; } },
		{ src: '/clients/reveal/plugin/notes/notes.js', async: true, condition: function() { return true; } }
	]
});

console.log("init done");
if (0 ) {
// Fires when a slide with data-state=customevent is activated
Reveal.addEventListener( 'customevent', function() {
	alert( '"custom event" has fired' );
} );

// Fires each time a new slide is activated
Reveal.addEventListener( 'slidechanged', function( event ) {
	// event.indexh & event.indexv
} );

// Fires when frame is shown or hidden						
Reveal.addEventListener( 'fragmentshown', function( event ) {
	// event.fragment = the fragment DOM element
} );

Reveal.addEventListener( 'fragmenthidden', function( event ) {
	// event.fragment = the fragment DOM element
} );
}