-- MySQL dump 10.13  Distrib 5.7.28-ndb-7.6.12, for linux-glibc2.12 (x86_64)
--
-- Host: localhost    Database: openv
-- ------------------------------------------------------
-- Server version	5.7.28-ndb-7.6.12-cluster-gpl

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_roles`
--

DROP TABLE IF EXISTS `_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_roles` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Hawk` varchar(8) DEFAULT NULL,
  `Client` varchar(64) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1 COMMENT='TOTEM roles and pocs';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_roles`
--

LOCK TABLES `_roles` WRITE;
/*!40000 ALTER TABLE `_roles` DISABLE KEYS */;
INSERT INTO `_roles` VALUES (1,'overlord','brian.d.james@comcast.net'),(2,'super','brian.d.james@comcast.net'),(3,'chief','brian.d.james@comcast.net'),(4,'master','brian.d.james@comcast.net'),(5,'overlord','brian.d.james@comcast.net'),(6,'admin','brian.d.james@comcast.net');
/*!40000 ALTER TABLE `_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `acl`
--

DROP TABLE IF EXISTS `acl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `acl` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Client` varchar(64) DEFAULT NULL,
  `Resource` varchar(32) DEFAULT NULL,
  `Access` varchar(16) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`Client`,`Resource`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acl`
--

LOCK TABLES `acl` WRITE;
/*!40000 ALTER TABLE `acl` DISABLE KEYS */;
INSERT INTO `acl` VALUES (1,'brian.d.james@comcast.net',NULL,'overlord'),(2,'brian.d.james@nga.mil',NULL,'overlord'),(3,'guest@totem.org',NULL,'guest'),(4,'guest@totem.org','nets','owner');
/*!40000 ALTER TABLE `acl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `actuals`
--

DROP TABLE IF EXISTS `actuals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `actuals` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Name` varchar(64) DEFAULT NULL,
  `Spent` float DEFAULT NULL,
  `Week` int(11) DEFAULT NULL,
  `Year` int(11) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`Name`,`Year`,`Week`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actuals`
--

LOCK TABLES `actuals` WRITE;
/*!40000 ALTER TABLE `actuals` DISABLE KEYS */;
/*!40000 ALTER TABLE `actuals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `agents` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `queue` varchar(64) DEFAULT NULL,
  `script` mediumtext,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agents`
--

LOCK TABLES `agents` WRITE;
/*!40000 ALTER TABLE `agents` DISABLE KEYS */;
/*!40000 ALTER TABLE `agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `apps`
--

DROP TABLE IF EXISTS `apps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `apps` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Nick` varchar(16) DEFAULT NULL,
  `Title` varchar(64) DEFAULT NULL,
  `byline` varchar(16) DEFAULT NULL,
  `Doc` mediumtext,
  `Banner` varchar(256) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COMMENT='TOTEM reads on startup to override default site context keys';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apps`
--

LOCK TABLES `apps` WRITE;
/*!40000 ALTER TABLE `apps` DISABLE KEYS */;
INSERT INTO `apps` VALUES (1,'Totem','Totem:protecting the warfighter from bad data','acmesds','Navigator<br>search: Execute open-source search for a document find = NAME against search engines.<br>searches: Execute open-source searches for document find = NAME against search engine and save results to specified file = NAME.<br>words: <br>Using the Porter-Lancaster stemmer, respond with a count of matched and unmatched words by comparing N <br>randomlly selected documents from stores/SOURCE*.txt with its associated src = SOURCE database documents <br>at the specified keys = KEY,... <br><br>wfs: <br>Respond with ess-compatible image catalog for service src = dglobe | omar | ess and desired ring = [ [lat,lon], ....]<br><br>blogPlugin: Blog notebook<br>usersPlugin: Return list of notebook users<br>exportPlugin: Export notebook<br>importPlugin: Import notebook<br>publishPlugin: Publish notebook<br>storesPlugin: Return notebook stores<br>statusPlugin: Status notebook<br>matchPlugin: Match notebook<br>docPlugin: Return notebook api help<br>trackPlugin: Find notebook licencing info<br>getPlugin: Return notebook code to authorized user<br>simPlugin: Place notebook in simulation thread<br>exePlugin: Execute notebook<br>getDoc: Stage a document<br>ingest: Run the src = NAME ingestor against the specified fileID = BRICK.<br>decode: Return release information about the license = ID.<br>restart: Restart system after a delay = SECONDS and notify all clients with the specifed msg = MESSAGE.<br>agent: <br>Append a job or claim a job to/from an agent job queue where:<br>push = NAME of job to append to agent queue<br>pull = NAME of job to claim from agent queue<br>flush = NAME of matlab thread to flush<br>load = CLIENT.HOST.CASE to load<br>save = CLIENT.HOST.CASE to save<br><br>alert: Send an alert msg = MESSAGE to all clients.<br>stop: Stop the service<br>tips: Provide image tips found by detectors<br>wms: Provided image catalog service for src = dglobe | omar | ess.<br>follow: Track client\'s link selections.<br>HYDRA: <br>This is a legacy/reserved endpoint to run specified Hydra detection algorithms.  Parameters include<br>size, pixels, scale, step, range, detects, infile, outfile, channel.  This endpoint has been retired.<br><br>NCL: tbd<br>ESS: tbd<br>matlab: Flush matlab queue<br>remedy: Add client to class-action remedy ticket<br>ping: Send connection status<br>proctor: Grade a clients lesson = PART.PART... in module = ID.<br>uploads: Upload file to requested area.<br>stores: Upload file to requested area.<br>likeus: Credit client\'s profile with a like<br>users: returns list of users<br>graph: Return graph name = NAME:NAME: ... & idmode = name||hat<br>favicon: No icons here<br>getCert: Generate and return a pki cert<br>notebooks: Return list of notebooks and their methods.<br>runPlugin: Run notebook<br>modifyPlugin: Modify notebook keys<br>retractPlugin: Remove notebook keys<br>task: Shard specified task to the compute nodes given task post parameters<br>riddle: Validate session id=client guess=value.<br>helpPlugin: Return notebook links<br>issues: Provide issues being worked via repo<br>info: Respond with system information.<br>config: <br>Respond with system configuration information on requested module mod = NAME or all modules if unspecified.<br><br>milestones: Provide milestone status information<br>DG: tbd<br>Navigator<br>search: Execute open-source search for a document find = NAME against search engines.<br>searches: Execute open-source searches for document find = NAME against search engine and save results to specified file = NAME.<br>words: <br>Using the Porter-Lancaster stemmer, respond with a count of matched and unmatched words by comparing N <br>randomlly selected documents from stores/SOURCE*.txt with its associated src = SOURCE database documents <br>at the specified keys = KEY,... <br><br>wfs: <br>Respond with ess-compatible image catalog for service src = dglobe | omar | ess and desired ring = [ [lat,lon], ....]<br><br>blogPlugin: Blog notebook<br>usersPlugin: Return list of notebook users<br>exportPlugin: Export notebook<br>importPlugin: Import notebook<br>publishPlugin: Publish notebook<br>storesPlugin: Return notebook stores<br>statusPlugin: Status notebook<br>matchPlugin: Match notebook<br>docPlugin: Return notebook api help<br>trackPlugin: Find notebook licencing info<br>getPlugin: Return notebook code to authorized user<br>simPlugin: Place notebook in simulation thread<br>exePlugin: Execute notebook<br>getDoc: Stage a document<br>ingest: Run the src = NAME ingestor against the specified fileID = BRICK.<br>decode: Return release information about the license = ID.<br>restart: Restart system after a delay = SECONDS and notify all clients with the specifed msg = MESSAGE.<br>agent: <br>Append a job or claim a job to/from an agent job queue where:<br>push = NAME of job to append to agent queue<br>pull = NAME of job to claim from agent queue<br>flush = NAME of matlab thread to flush<br>load = CLIENT.HOST.CASE to load<br>save = CLIENT.HOST.CASE to save<br><br>alert: Send an alert msg = MESSAGE to all clients.<br>stop: Stop the service<br>tips: Provide image tips found by detectors<br>wms: Provided image catalog service for src = dglobe | omar | ess.<br>follow: Track client\'s link selections.<br>HYDRA: <br>This is a legacy/reserved endpoint to run specified Hydra detection algorithms.  Parameters include<br>size, pixels, scale, step, range, detects, infile, outfile, channel.  This endpoint has been retired.<br><br>NCL: tbd<br>ESS: tbd<br>matlab: Flush matlab queue<br>remedy: Add client to class-action remedy ticket<br>ping: Send connection status<br>proctor: Grade a clients lesson = PART.PART... in module = ID.<br>uploads: Upload file to requested area.<br>stores: Upload file to requested area.<br>likeus: Credit client\'s profile with a like<br>users: returns list of users<br>graph: Return graph name = NAME:NAME: ... & idmode = name||hat<br>favicon: No icons here<br>getCert: Generate and return a pki cert<br>notebooks: Return list of notebooks and their methods.<br>runPlugin: Run notebook<br>modifyPlugin: Modify notebook keys<br>retractPlugin: Remove notebook keys<br>task: Shard specified task to the compute nodes given task post parameters<br>riddle: Validate session id=client guess=value.<br>helpPlugin: Return notebook links<br>issues: Provide issues being worked via repo<br>info: Respond with system information.<br>config: <br>Respond with system configuration information on requested module mod = NAME or all modules if unspecified.<br><br>milestones: Provide milestone status information<br>DG: tbd','Unclassified');
/*!40000 ALTER TABLE `apps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bricks`
--

DROP TABLE IF EXISTS `bricks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bricks` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Client` varchar(64) DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Area` varchar(32) DEFAULT NULL,
  `Classif` varchar(128) DEFAULT NULL,
  `Revs` int(11) DEFAULT NULL,
  `Ingest_Size` float DEFAULT NULL,
  `Ingest_Tag` mediumtext,
  `Added` datetime DEFAULT NULL,
  `Location` geometry DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM revises for uploaded files';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bricks`
--

LOCK TABLES `bricks` WRITE;
/*!40000 ALTER TABLE `bricks` DISABLE KEYS */;
/*!40000 ALTER TABLE `bricks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dblogs`
--

DROP TABLE IF EXISTS `dblogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dblogs` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Delay` float DEFAULT NULL,
  `Transfer` float DEFAULT NULL,
  `Event` datetime DEFAULT NULL,
  `Dataset` varchar(32) DEFAULT NULL,
  `Client` varchar(64) DEFAULT NULL,
  `Actions` int(11) DEFAULT '1',
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`Dataset`,`Client`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=latin1 COMMENT='TOTEM updates as tables are revised';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dblogs`
--

LOCK TABLES `dblogs` WRITE;
/*!40000 ALTER TABLE `dblogs` DISABLE KEYS */;
INSERT INTO `dblogs` VALUES (1,NULL,NULL,NULL,'nets','guest@totem.org',11),(4,NULL,NULL,NULL,'nets','joe',1),(12,NULL,NULL,NULL,'nets','brian.d.james@nga.mil',1),(13,NULL,NULL,NULL,'nets','brian.d.james@comcast.net',67),(14,NULL,NULL,NULL,'nets','guest::1@totem.org',23),(26,NULL,NULL,NULL,'nets','guest::ffff:127.0.0.1@totem.org',22),(27,NULL,NULL,NULL,'regress','guest::1@totem',3),(30,NULL,NULL,NULL,'scripts','guest::1@totem',10),(37,NULL,NULL,NULL,'survey','guest::1@totem',3),(40,NULL,NULL,NULL,'regress','guest::ffff:127.0.0.1@totem',1),(42,NULL,NULL,NULL,'scripts','guest::ffff:127.0.0.1@totem',4);
/*!40000 ALTER TABLE `dblogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dogs`
--

DROP TABLE IF EXISTS `dogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dogs` (
  `ID` float NOT NULL DEFAULT '0',
  `Name` varchar(32) DEFAULT NULL,
  `Every` varchar(64) DEFAULT NULL,
  `Description` mediumtext,
  `Enabled` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dogs`
--

LOCK TABLES `dogs` WRITE;
/*!40000 ALTER TABLE `dogs` DISABLE KEYS */;
INSERT INTO `dogs` VALUES (1,'daily','day',NULL,1),(2,'weekly','monday',NULL,1),(3,'system',NULL,NULL,0),(4,'stats',NULL,NULL,0),(5,'bricks',NULL,NULL,0),(6,'catalog',NULL,NULL,0),(7,'detectors',NULL,NULL,0),(8,'licenses',NULL,NULL,0),(9,'voxels',NULL,NULL,0),(10,'jobs',NULL,NULL,0),(11,'email',NULL,NULL,0),(12,'clients',NULL,NULL,0),(13,'news',NULL,NULL,0),(14,'notebooks',NULL,NULL,0),(15,'users',NULL,NULL,0),(17,'repos','30',NULL,0);
/*!40000 ALTER TABLE `dogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `engines`
--

DROP TABLE IF EXISTS `engines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `engines` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Name` varchar(32) DEFAULT NULL,
  `Enabled` tinyint(1) DEFAULT '1',
  `Type` varchar(4) DEFAULT NULL,
  `Code` mediumtext,
  `Minified` mediumtext,
  `State` json DEFAULT NULL,
  `Wrap` mediumtext,
  `ToU` mediumtext,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`Name`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `engines`
--

LOCK TABLES `engines` WRITE;
/*!40000 ALTER TABLE `engines` DISABLE KEYS */;
INSERT INTO `engines` VALUES (1,'regress',1,'js','function regress(ctx,res,{$log,$trace,$pipe,$sql}) {  // define notebook engine\n		\n		// extact context keys and setup regressors and optional boosting \n		const {Method,Host,Name,Hyper,Cycle,_Boost} = ctx;\n\n		//$log(Method,Host,Name);\n\n		var\n			save = ctx.Save = [],\n			use = Method.toLowerCase(),\n			hyper = Hyper || {},\n			solve = hyper[use] || {};\n		\n		$pipe( batch => {\n			if ( batch ) {\n				const \n					{multi,x,y,x0,y0} = batch.forEach ? batch.get(\"x&y\") : batch,\n					sum = {\n						boosting: Cycle ? _Boost : false,\n						solve: solve,\n						trainSet: x ? x.length : \"none\",\n						labelSet: y ? y.length : \"none\",\n						using: use,\n						predictSet: x0 ? x0.length : \"none\",\n						mode: ( x && y ) ? \"semi-supervised learning\" : x ? \"unsupervised learning\" : chans ? \"multichan learning\" : x0 ? \"predicting\" : \"unknown\"\n						//loader: loader ? true : false,\n						//model: model ? true : false\n					};\n\n				$log(sum);\n\n				if ( multi ) {	// multichannel learning mode			\n					const {x,y,x0,y0} = multi;\n					var \n						jpgSave = [],\n						chans = x.length,\n						done = 0;\n\n					//$log(\"channels\", chans, y.length, x0.length);\n					if (chans)\n						for ( var chan = 0; chan<chans; chan++ ) \n							$.train( use, x[chan], y[chan], x0[chan], y0 ? y0[chan] : null, info => {\n								$log(\"multi mcat\", done, chans);\n								save.push({ at: \"train\", chan: chan, x: info.x0, y: info.y0 });\n								save.push({ at: use, chan: chan, cls: info.cls.export ? info.cls.export() : info.cls });\n								jpgSave.push( info.y0 );\n\n								if ( ++done == chans ) {\n									/*save.push({ \n										at: \"jpg\", \n										input: multi.input, \n										save: jpgPath,\n										//index: n0,\n										index: multi.n0,\n										values: jpgSave\n									}); */\n									ctx.Save_jpg = { \n										input: multi.input, \n										//save: jpgPath,\n										//index: n0,\n										index: multi.n0,\n										values: jpgSave\n									};\n									res(ctx);\n								}							\n							});\n\n					else\n						res(ctx);\n				}\n\n				else	\n				if ( Cycle ) { // in hypo boosting mode\n					res(\"boosting\");\n\n					$sql( sql => {	// get a sql thread\n						function booster( sql, boost ) {	// boost the hypo\n							const \n								{ alpha, h, xroc, weis } = boost,\n								{ mixes, nsigma, samples } = solve,\n								{ sign } = Math;\n\n							if (mixes)\n								$.boost( Cycle, sql, boost, $trace, (x,keys) => {  // boost with provided hypo manager\n									/*\n										return tested hypo if keys specified\n										return learned hypo keys if x specified\n										save hypo keys to boost stash if neither specified\n									*/\n\n									function hypo(x,keys) {	\n										// return hypo[k] = +/-1 if x inside/outside nsigma sphere with keys[k]\n\n										return $( keys.length, (k, H) => {		// enumerate thru all keys\n											H[ k ] = 0;		// default if invalid key\n											if ( key = keys[k] ) {  // key valid so ...\n												const { r } = $( \"y = B*x + b; r = sqrt( y\' * y ); \", {B: key.B, b: key.b, x: x} );		// bring sample into decision sphere\n												H[ k ] = ( r < nsigma ) ? +1 : -1;		// test positive/negative hypo \n											}\n										});\n									}\n\n									if ( keys )\n										$trace( JSON.stringify({\n											mode: \"test\", t: Cycle, keys: keys.length, nsigma:nsigma\n										}));\n\n									else\n									if ( x )\n										$trace( JSON.stringify({\n											mode: \"learn\", t: Cycle, points: x.length\n										}));\n\n									else\n										$trace( JSON.stringify({\n											mode: \"save\", t: Cycle, alpha: boost.alpha\n										}));\n\n									if ( keys ) 	// test hypo using keys\n										return hypo(x,keys);\n\n									else\n									if ( x ) { 	// learn hypo keys\n										var keys = h[Cycle] = [];	// reserve key stash\n\n										$.train( use, x, null, solve, info => {\n											const {em} = info.cls;\n\n											em.forEach( mix => {\n												//$log(\"mix\", mix.key);\n\n												if ( key = mix.key )	// valid key provided\n													keys.push({ \n														B: $.clone(key.B), \n														b: $.clone(key.b)\n													});\n\n												else	// invalid key\n													keys.push( null );\n											});\n\n											if ( weis && y ) { // stash weishart matrix for this boost\n												var \n													Y = y._data || y,\n													ctx = weis[Cycle] = {\n														w: $( [mixes,mixes], (i,j,w) => w[i][j] = 0 ),\n														n: 0\n													};\n\n												Y.forEach( (y,n) => {\n													if ( mix = em[ y ] ) {	// have labelled x so update weishart\n														ctx.x = x[n];\n														ctx.mu = mix.mu;\n														$( \"w = w + (x-mu)*(x-mu)\'; n=n+1; \", ctx );\n													}\n												});\n\n												/*\n												at some cylce, instead of running $.traun, regress the w[i] \n												against the n[i], i=1:cycle to get an improved sigma covar.  \n												Use this improved sigma in the pca to get new keys and \n												store in current cycle slot\n												*/\n\n											}\n										});\n\n										return keys;\n									}\n\n									else { // save boosted roc\n										if ( xroc ) { // generate effective roc\n											var \n												F = $( mixes, (k,F) => F[k] = 0 ),		// reserve for boosted hypo\n												t = Cycle,\n												hits = 0,\n												cols = 0,\n												N = xroc.length,\n												maxHits = N,\n												maxCols = N * mixes;\n\n											xroc.forEach( (x,m) => {		// enumerate x samples to build roc\n												for ( var n=1; n<=t; n++ ) {\n													if ( h_n = h[n] ) // valid keys provided\n														var ctx = $( \"F = F + alpha * H\", { \n															F: F,\n															alpha: alpha[n],\n															H: hypo( x, h_n )\n														});\n\n													else\n														var ctx = null;\n												}\n\n												//$log(\"F=\", ctx.F);\n												if ( ctx )\n													F.$( k => F[k] = sign( ctx.F[k] ) );\n\n												var I = 0;	// indicator = #agreements\n												F.$( k => I += (F[k] > 0) ? 1 : 0 );\n\n												//$log(m, F, I);\n												if ( I == 1 )\n													hits++;\n\n												else\n												if ( I > 1 )\n													cols += I - 1;\n											});\n\n											boost.hitRate = hits / maxHits;\n											boost.colRate = cols / maxCols;\n											$log(\">>>>>rates\", boost.hitRate, boost.colRate, [hits, cols], [maxHits, maxCols] );\n										}\n\n										sql.query(\n											\"UPDATE app.regress SET ? WHERE ?\", \n											[{\n												_Boost: JSON.stringify(boost), \n												Cycle: Cycle+1\n												//Pipe: JSON.stringify( ( Cycle == 1 ) ? \"#\" + ctx.Pipe : ctx.Pipe )\n											}, {Name: ctx.Name} ] , err => $log(err) );\n\n										return null;								\n									}\n								});\n						}\n\n						if ( x && y ) {	// prime the boost dataset then boost at Cycle=1\n							var \n								N = x.length, \n								D = 1/N, \n								added = 0;\n							// \"/genpr_test4D4M.export?[x,y]=$.get([\'x\',\'n\'])\"\n							// \"/genpr_test4D4M.export?[x,y]=$.get([\'x\',\'n\'])&x0=$.draw(Channels).get(\'x\')\"\n\n							sql.query( \"DELETE FROM app.points\" );\n							sql.beginBulk();\n							x.forEach( (x,n) => {  // prime points dataset with samples and labels\n								sql.query( \"INSERT INTO app.points SET ?\", {	// prime with this sample point\n									x: JSON.stringify( x ),\n									y: y[n],\n									D: D,\n									idx: n+1,\n									docID: \"doc\"+n,\n									srcID: 0\n								}, err => {		// check if primed\n\n									if ( ++added == N ) 	// dataset primed so good to boost\n										booster( sql, {	// provide initial boost state (index 0 unused)\n											xroc: x0,	// points to gen roc\n											// points: N,	// number of x0 points\n											samples: samples,	// number of samples in points db\n											mixes: solve.mixes || 0,	// numer of mixes to boost\n											//labels: labels,\n											thresh: D * 0.9,	// boosting threshold\n											weis: [null],	// weishart stash for covar boost\n											eps: [null],	// boost stash for errors\n											alpha: [null], 	// boost stash for confidense levels\n											h: [null]	// boost stash for hypo keys\n										});\n\n								});\n							});\n							sql.endBulk();\n						}\n\n						else\n						if ( _Boost )	// boost this Cycle\n							booster( sql, _Boost );\n\n						else\n							$trace(\"boost halted - no x,y data provided to prime\");\n					});\n				}\n\n				else	\n				if ( x ) 	//  in sup/unsup learning mode\n					$.train( use, x, y, solve, info => {\n						if ( info ) {\n							info.cls.sum = sum;\n							save.push({ at: use, cls: info.cls.export ? info.cls.export() : info.cls });\n							res(ctx);\n						}\n\n						else\n							res(null);\n					});\n\n				else\n				if ( x0 ) 	// in predicting mode\n					$sql( sql => {\n						sql.query(\n							`SELECT Save_${use} as Model FROM app.regress WHERE ?`, \n							{Name: Name}, (err,recs) => {	// get cls model save during previous training\n\n							if ( rec = recs[0] ) {\n								solve.model = rec.Model;\n								$.predict( use, x0, y0, solve, ctx => {\n									ctx.Save = [{at:\"predict\", y: y0 }];\n									res(ctx);\n								});\n							}\n						});\n					});\n\n				else {	// in adhoc supervised learning mode\n					$trace(\"invalid pipe parameters\");\n					res(null);\n				}\n			}\n			\n			else { //done\n			}\n		});\n			\n	}','\"use strict\";function regress(v,m,n){var E=n.$log,S=n.$trace,e=n.$pipe,g=n.$sql,t=v.Method,x=(v.Host,v.Name),n=v.Hyper,b=v.Cycle,k=v._Boost,N=v.Save=[],B=t.toLowerCase(),R=(n||{})[B]||{};e(function(c){var p,f,h,y;c&&function(){var n=c.forEach?c.get(\"x&y\"):c,e=n.multi,l=n.x,d=n.y,s=n.x0,t=n.y0,r={boosting:!!b&&k,solve:R,trainSet:l?l.length:\"none\",labelSet:d?d.length:\"none\",using:B,predictSet:s?s.length:\"none\",mode:l&&d?\"semi-supervised learning\":l?\"unsupervised learning\":f?\"multichan learning\":s?\"predicting\":\"unknown\"};if(E(r),e){var i=e.x,a=e.y,o=e.x0,u=e.y0;if(p=[],f=i.length,h=0,f)for(y=0;y<f;y++)$.train(B,i[y],a[y],o[y],u?u[y]:null,function(n){E(\"multi mcat\",h,f),N.push({at:\"train\",chan:y,x:n.x0,y:n.y0}),N.push({at:B,chan:y,cls:n.cls.export?n.cls.export():n.cls}),p.push(n.y0),++h==f&&(v.Save_jpg={input:e.input,index:e.n0,values:p},m(v))});else m(v)}else b?(m(\"boosting\"),g(function(t){function r(r,c){var p=c.alpha,f=c.h,h=c.xroc,y=c.weis,m=R.mixes,g=R.nsigma,x=(R.samples,Math.sign);m&&$.boost(b,r,c,S,function(i,e){function a(r,i){return $(i.length,function(n,e){var t;e[n]=0,(key=i[n])&&(t=$(\"y = B*x + b; r = sqrt( y\' * y ); \",{B:key.B,b:key.b,x:r}).r,e[n]=t<g?1:-1)})}if(S(e?JSON.stringify({mode:\"test\",t:b,keys:e.length,nsigma:g}):i?JSON.stringify({mode:\"learn\",t:b,points:i.length}):JSON.stringify({mode:\"save\",t:b,alpha:c.alpha})),e)return a(i,e);if(i){e=f[b]=[];return $.train(B,i,null,R,function(n){var t,r=n.cls.em;r.forEach(function(n){(key=n.key)?e.push({B:$.clone(key.B),b:$.clone(key.b)}):e.push(null)}),y&&d&&(n=d._data||d,t=y[b]={w:$([m,m],function(n,e,t){return t[n][e]=0}),n:0},n.forEach(function(n,e){(mix=r[n])&&(t.x=i[e],t.mu=mix.mu,$(\"w = w + (x-mu)*(x-mu)\'; n=n+1; \",t))}))}),e}var o,l,s,u,n,t;return h&&(o=$(m,function(n,e){return e[n]=0}),l=b,u=s=0,t=(n=h.length)*m,h.forEach(function(n,e){for(var t,r=1;r<=l;r++)t=(h_n=f[r])?$(\"F = F + alpha * H\",{F:o,alpha:p[r],H:a(n,h_n)}):null;t&&o.$(function(n){return o[n]=x(t.F[n])});var i=0;o.$(function(n){return i+=0<o[n]?1:0}),1==i?s++:1<i&&(u+=i-1)}),c.hitRate=s/n,c.colRate=u/t,E(\">>>>>rates\",c.hitRate,c.colRate,[s,u],[n,t])),r.query(\"UPDATE app.regress SET ? WHERE ?\",[{_Boost:JSON.stringify(c),Cycle:b+1},{Name:v.Name}],function(n){return E(n)}),null})}var i,a,o;l&&d?(i=l.length,a=1/i,o=0,t.query(\"DELETE FROM app.points\"),t.beginBulk(),l.forEach(function(n,e){t.query(\"INSERT INTO app.points SET ?\",{x:JSON.stringify(n),y:d[e],D:a,idx:e+1,docID:\"doc\"+e,srcID:0},function(n){++o==i&&r(t,{xroc:s,samples:samples,mixes:R.mixes||0,thresh:.9*a,weis:[null],eps:[null],alpha:[null],h:[null]})})}),t.endBulk()):k?r(t,k):S(\"boost halted - no x,y data provided to prime\")})):l?$.train(B,l,d,R,function(n){n?(n.cls.sum=r,N.push({at:B,cls:n.cls.export?n.cls.export():n.cls}),m(v)):m(null)}):s?g(function(n){n.query(\"SELECT Save_\".concat(B,\" as Model FROM app.regress WHERE ?\"),{Name:x},function(n,e){(rec=e[0])&&(R.model=rec.Model,$.predict(B,s,t,R,function(n){n.Save=[{at:\"predict\",y:t}],m(n)}))})}):(S(\"invalid pipe parameters\"),m(null))}()})}','{}','','- pocs = \"brian.d.james@nga.mil;john.b.gree@nga.mil;tara.a.smith@nga.mil\"\n- download = \"download\".link(`${host}/${name}.${engine}?endservice=ENDSERVICE`)\n\n:markdown\n	# Terms of Use\n	[You](/ping) become a `#{Name}` transition partner when [you](/ping) !{download} #{Name}:\n	simply replace `ENDSERVICE` in the !{download}-link with the //DOMAIN/ENDPOINT.exe of your \n	service returning [you](/ping) in its list of `#{Name}` users.\n	\n	By !{download}ing #{Name}</a>, [you](/ping) agree to:\n	+ not distribute `#{Name}` outside your service\n	without the \n	<a \n		href=\"mailto:#{pocs}&subject=Please allow us to redistribute #{Name}\">\n		expressed permission of NGA/R\n	</a>.\n	Please note that `#{Name}` contains antitamper watermarks to detect plagiraization per NGA/OGC\n	guidance.\n	+ enable your `ENDSERVICE` endpoint to accept the `#{Name}` interface parameters below.  When no parameters\n	are supplied, your `ENDSERVICE` will return a [json list](http://en.wikipedia.org/wiki/JSON) of `#{Name}` users\n	that must include !{you}.\n	+ [accredit](http://inteldocs/ngaRaccreditations) your `ENDSERVICE` by recovering\n	<a href=\"#{host}/#{name}.run\">#{Name} baseline</a> results. \n	+ credit NGA/R in your `ENDSERVICE` for `#{Name}`. \n	+ supply all `#{Name}` dependencies -- !{reqts[engine]} -- into your `ENDSERVICE`.\n	\n	NGA/R reserves the right to terminate this agreement at any time.\n\n	# Interface\n	!{interface()}\n\n	# Transitions as of #{now}\n	!{data.status}\n\n	# Baseline results\n	See [/#{name}.run](${host}/#{name}.run) for further baselines.\n'),(3,'demo',1,'js','function template(ctx, res) {   // Example notebook engine\n		\n		res( new Error(\"nothing here yet\") );	\n	\n	}\ntemplate($ctx,$res)',NULL,'{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(4,'costs',1,'js','function costs(ctx, res) {  \n\n		const { years, lag, vms, ups, gamma, tLead } = ctx;\n		const { floor,min } = Math;\n		\n		var \n			docRate = 140e3/30 + 110*4,	// docs/yr \n			$vm = 5e3, 		// $/yr vm cost\n			nre$ = 2*(2*100e3+4*$vm), 		// nre costs assuming 2 yrs dev by 2 in-sourced FTEs (x3 if outsourced) + 4 VMs at 100%\n			doc$ = 100e3*(10/2e3), // $/doc assuming 10 hrs/doc reporters time (conservative - could include mission costs)\n			minYr = 60*24*365, // mins/yr\n			cycleT = 5, // mins\n			boostT = 1,  // mins per boost cycle\n			batch = 5e3, 	// docs/cycle \n			queue = floor(docRate * lag), 	// doc backlog at t=0\n			Rcycles = queue / batch,	// cycles/yr in R state\n			Ocycles = docRate / batch,	// cycles/yr in Oper state\n			vm$ = n => $vm * vms * (cycleT + boostT*n) / minYr,		// $/cycle assuming dockerized vms\n			labU = 0.1,		// % docs labelled\n			$nre = nre$ / years, 	//	$/yr simple amort\n			$lab = docRate * labU * 100e3 * (0.25/2e3),	// $/yr assuming analyst spends 1/4 hr to label\n			$acq = doc$*docRate, 	// $/yr doc acquistion\n			samples = ups * years,\n			dt = 1/ups,\n			cycles = 0,\n			t = 0,\n			t0 = 0,\n			docs = 0,\n			cost = 0,\n			acq$ = 0,\n			lab$ = 0,\n			proc$ = 0;\n\n		var\n			factor = (1 + gamma) / gamma,\n			tCatch = tLead * factor;\n		\n		// http://localhost:8080/plot.view?debug=0&w=500&h=500&line=red,blue,green,black,orange,yellow&min=-2,-0.1&max=22,1.1&ds=/costs?lag=30&vms=10&years=20&ups=24&_calc={BKLOG:[yr,queue/150e3],PROC:[yr,proc/100e3],LAB:[yr,lab/150e3],ACQ:[yr,acq/50e6],CY:[yr,cycles/50],NRE:[yr-2,nre/450e3]}\n		$log({\n			backlog: queue,\n			docRate: docRate, \n			lagTime: lag, \n			queueDepth: queue, \n			leadTime: tLead, \n			catchTime: tCatch, \n			catchupFactor: factor,\n			samples: samples\n		});\n\n		try {\n			ctx.Save = $(samples, (k,rtn) => {\n				//$log(k);\n				\n				var rec = rtn[ k ] = {\n					ID:k, t: t, lambda: docRate, cycles: cycles, \n					queue: queue, proc: proc$, lab: lab$, nre: nre$, \n					relgap: 0, gamma: gamma,\n					acq: acq$, tCatch: tCatch, tLead: tLead, x: t0 ? (t-t0)/tCatch : 0\n				};\n				\n				rec.relgap = rec.x ? gamma - (1+gamma)/rec.x : 0;	// (dF-dS) / dS\n				rec.deficit = rec.relgap * docs / batch;	// # cycles behind \n				t += dt;\n				//$log(t,t0,queue,rec.x,rec.relgap);\n				\n				queue += floor(docRate * dt);\n				acq$ += $acq * dt;\n				lab$ += $lab * dt;\n				nre$ -= (nre$>0) ? $nre * dt : 0;\n\n				if ( queue >= batch ) {\n					cycles++;\n					docs += batch;\n					queue -= min(queue,batch);\n					proc$ += (t<2) ? 4 * $vm * dt : vm$(cycles);	// assuming 4 vms at 100% util during research phase\n				}\n				\n				if ( !t0 ) if ( queue < batch ) t0 = t;\n				\n				//$log(k,floor(t), cycles,queue);\n			});\n		\n			//$log(ctx.Save);\n			res(ctx);\n		}\n		\n		catch (err) {\n			res( null );\n		}\n	}\ncosts($ctx,$res)',NULL,'{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(5,'cints',1,'js','function cints(ctx,res) {  \n		var\n			flow = ctx.Flow;\n		\n		$log(\"cints flow\", flow);\n		\n		ctx.Save = $.coherenceIntervals({  // define solver parms\n			H: flow.F,		// count frequencies\n			T: flow.T,  		// observation time\n			N: flow.N,		// ensemble size\n			use: ctx.Use || \"lma\",  // solution to retain\n			lfa: ctx.lfa || [50],  // initial guess at coherence intervals\n			bfs: ctx.bfs || [1,200,5],  // range and step to search cohernece intervals\n			lma: ctx.lma || [50]	// initial guess at coherence intervals\n		});\n\n		$log(\"cints stats for voxel \"+ctx.Voxel.ID, ctx.Save);\n		res(ctx);\n	}\ncints($ctx,$res)',NULL,'{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(6,'beta',1,'js','function beta(ctx, res) {  // Return cummulative beta at N points given alpha,beta ctx parameters.\n\n		const {alpha, beta, N } = ctx;\n		\n		$( \"x = toList(1/N:1/N:1-1/N); y = cumbeta(x,a,b);\", {\n			a: alpha || 1,\n			b: beta || 1,\n			N: N || 10\n		}, vmctx => {\n			if ( vmctx ) {\n				ctx.Save = { x: vmctx.x, y: vmctx.y };\n				res(ctx);\n			}\n			\n			else\n				res( null );\n		});	\n	}\nbeta($ctx,$res)',NULL,'{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(7,'conf',1,'js','function template(ctx, res) {   // Example notebook engine\n		\n		// extact context keys and setup regressors and optional boosting \n		\n		const \n			{ N,x0,e } = ctx;\n				\n		ctx.Save = {\n			logSamples: $.log10(N),\n			logConfidence: $.log10( $.conf(N,e,x0) )\n		};\n		\n		//$log(ctx);\n		res(ctx);\n	}\ntemplate($ctx,$res)',NULL,'{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(13,'jsdemo1',1,'js','function jsdemo1(ctx, res) {\n		$log(\"jsdemo1 ctx\", ctx);\n		var debug = false;\n		\n		if (debug) {\n			$log(\"A=\"+ctx.A.length+\" by \"+ctx.A[0].length);\n			$log(\"B=\"+ctx.B.length+\" by \"+ctx.B[0].length);\n		}\n\n		ctx.Save = [ {u: ctx.M}, {u:ctx.M+1}, {u:ctx.M+2} ];\n		$log(\"jsdemo1 save\", ctx.Save);\n		res(ctx);\n\n		if (debug)\n			ME.exec(ctx, \"D=A*A\'; E=D+D*3; disp(entry); \", (vmctx) => {\n				$log( \"D=\", vmctx.D, \"E=\", vmctx.E);\n			});\n	}\njsdemo1($ctx,$res)',NULL,'{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(14,'pydemo1',1,'py','\nprint \"welcome to python you lazy bird\"\nprint \"sql\", _SQL0\n\n_SQL0.execute(\"SELECT * from app.Htest\", () )\nfor (rec) in _SQL0:\n	print rec\n\nSave = [ a, b, a+b, test ]\n','Error: Command failed: pyminifier -O ./temps/py/pydemo1.py\n/bin/sh: pyminifier: command not found\n','{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(15,'Rdemo1',1,'R','\nprint(\'you da man\');\nprint(\'ctx=\');str(CTX);\nprint(\'tau=\');str(TAU);\nCTX$d = \'this is a test\';\nCTX$e = list(x=1,y=2,z=3);\nCTX$f = 123.456;\nCTX$g = list(4,5,6);\nCTX$h = TRUE;','\nprint(\'you da man\');\nprint(\'ctx=\');str(CTX);\nprint(\'tau=\');str(TAU);\nCTX$d = \'this is a test\';\nCTX$e = list(x=1,y=2,z=3);\nCTX$f = 123.456;\nCTX$g = list(4,5,6);\nCTX$h = TRUE;','{}','','- soft = link({_edit_me:\"file:///totem\", _login:\"/login.html\", _run_me:run, _publish: pub})\n:markdown\n	!{soft} are some soft links but !{_edit_me} not yet ready.  \nblog.\n	Document your notebook\'s ${_edit_me} usecase using [markdown](/api.view):\n		$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }\n		\\${ JS }\n		[ LINK ] ( URL )\n		$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$\n		TeX := TeX || #VAR || VAR#KEY#KEY...\n		# SECTION\n		ESCAPE || $with || $for || $if:\n			BLOCK\n\n	hmmm ... need new line again?\n	# links\n	Hello ${client}.  My name is ${name}. Click [hard link](/junk.txt) for junk info or\n	[run the barplot](/xbar.view).  \n	my suitors via ${suitors} are $embed{${suitors}}.\n\n	# attach a plot \n	mybar  \n\n	# embed default plot\n	$plot{?w=600&h=400}\n\n	# fetch test\n	As of ${now} $$ \\\\alpha = \\\\sum_k^N A_k $$\n	and dont forget $$ a = \\\\frac {\\\\sigma } { \\\\sqrt {2 \\\\theta} } $$ as well.\n\n	$with x=interface():\n		# my interface\n		${x}\n\n	that\'s all folks\n'),(17,'scripts',1,'js','function template(ctx, res) {   \n		\n		res(\"nothing to run\");\n		\n	}\ntemplate($ctx,$res)',NULL,'{}','','Here you go.   Code for ${name} below.\n'),(18,'survey',1,'js','function template(ctx, res) {   // Example notebook engine		\n		res( \"Thanks!\" );\n	}\ntemplate($ctx,$res)',NULL,'{}','','Here you go.   Code for ${name} below.\n'),(22,'nets',1,'js','function nets(ctx,res,{$log,$trace,$pipe}) {	// define notebook engine\n\n		const \n			Snap = {\n				aNet: {\n					nodes: {},\n					edges: {}\n				}, \n				cNet: {\n					nodes: {},\n					edges: {}					\n				},\n				actors: 0,\n				bhats: 0,\n				whats: 0\n			},\n			[ black, white ] = [\"black\", \"white\"],\n			now = new Date(),\n			{ aNet, cNet } = Snap,\n			{ nodes,edges } = aNet;\n\n		var\n			{ actors,bhats,whats } = Snap;\n\n		$log(\">>>nets actors\", actors);\n\n		$pipe( recs => {\n			if ( recs ) {	// have a batch so extend assoc net\n				$log(\">>>nets records\", recs.length, actors );\n\n				recs.forEach( rec => {	// make black-white hat assoc net\n					const \n						{bhat,what,topic,cap} = rec;\n\n					if (bhat && what && topic ) {\n						const\n							src = nodes[bhat] || ( nodes[bhat] = {\n								type: black,\n								index: actors++,\n								hat: black+(bhats++),\n								created: now,\n								size: 0\n							}),\n							tar = nodes[what] || ( nodes[what] = {\n								type: white,\n								index: actors++,\n								hat: white+(whats++),\n								created: now,\n								size: 0\n							}),\n							link = bhat + \":\" + what,\n							edge = edges[link] || ( edges[link] = {\n								src: bhat,\n								tar: what,\n								capacity: 1,\n								type: topic,\n								created: now\n							});\n\n						//$log(edge);\n					}\n\n				});\n\n				Snap.actors = actors;\n				Snap.bhats = bhats;\n				Snap.whats = whats;\n			}\n\n			else {	// no more batches so make connection net\n				$log(\">>>nets capacity matrix NxN\", [actors,actors]);\n\n				if ( actors<=400 ) {\n					const \n						N = actors,	\n						map = $(N),\n						cap = $([N,N], (u,v,C) => C[u][v] = 0 ),\n						lambda = $([N,N], (u,v,L) => L[u][v] = 0 ),\n						cuts = {};\n\n					$each( nodes, (name,node) => map[node.index] = name );\n\n					$each( edges, (link,edge) => {\n						//$log(link,edge,N);\n						const {src,tar,capacity} = edge;\n						cap[ nodes[src].index ][ nodes[tar].index ] = capacity;\n					});\n\n					for (var s=0; s<N; s++) // if ( nodes[map[s]].type == black ) \n						for (var t=s+1; t<N; t++) // if( nodes[map[t]].type == black ) \n						{	// get maxflows-mincuts between source(s)-sink(t) nodes\n\n							const \n								{maxflow,cutset,mincut} = $.MaxFlowMinCut(cap,s,t),\n								cutsize = lambda[s][t] = lambda[t][s] = cutset.length,\n								cut = cuts[cutsize] || (cuts[cutsize] = []);\n\n							if ( cutsize )\n								cut.push({\n									s: s,\n									t: t,\n									maxflow: maxflow,\n									mincut: mincut,\n									cutset: cutset\n								});\n						}\n\n					const\n						cNodes = cNet.nodes = {},\n						cEdges = cNet.edges = {},\n						src = cNodes[\"ref\"] = {\n							type: \"connection\",\n							index: 0,\n							name: \"ref\",\n							created: now\n						};\n\n					$each(cuts, (cutsize,cut) => {	// create connection net\n						if ( cutsize != \"0\" ) {\n							$log(\">>>nets cut\", cutsize );\n\n							cut.forEach( (lam,idx) => {\n								const \n									{s,t,maxflow} = lam,\n									snode = nodes[map[s]],\n									tnode = nodes[map[t]],\n									node = snode.index + \":\" + tnode.index,\n									tar = cNodes[node] = {\n										type: \"connection\",\n										index: idx,\n										created: now\n									},\n									edge = cEdges[node] || ( cEdges[node] = {\n										src: \"ref\",\n										tar: node,\n										type: \"lambda\"+cutsize,\n										name: map[s] + \":\" + map[t],\n										maxflow: maxflow,\n										cutsize: cutsize\n									});\n\n								$log(\">>>nets\", cutsize, s,t);\n							});\n						}\n					});\n\n					$log(\">>>nets save NxE\", [Object.keys(nodes).length,Object.keys(edges).length]);\n\n					ctx._net = [{\n						name: \"anet\",\n						nodes: nodes,\n						edges: edges\n					}, {\n						name: \"cnet\",\n						nodes: cNodes,\n						edges: cEdges\n					}] ;\n				}\n\n				else\n					$log(\">>>nets TOO BIG to make connections !\");\n				\n				res(ctx);		\n			}\n			\n		});\n	}','\"use strict\";function nets(p,m,e){var g=e.$log,t=(e.$trace,e.$pipe),w={aNet:{nodes:{},edges:{}},cNet:{nodes:{},edges:{}},actors:0,bhats:0,whats:0},y=\"black\",v=\"white\",b=new Date,e=w.aNet,N=w.cNet,k=e.nodes,O=e.edges,z=w.actors,E=w.bhats,j=w.whats;g(\">>>nets actors\",z),t(function(e){if(e)g(\">>>nets records\",e.length,z),e.forEach(function(e){var t=e.bhat,n=e.what,a=e.topic;e.cap;t&&n&&a&&(k[t]||(k[t]={type:y,index:z++,hat:y+E++,created:b,size:0}),k[n]||(k[n]={type:v,index:z++,hat:v+j++,created:b,size:0}),O[e=t+\":\"+n]||(O[e]={src:t,tar:n,capacity:1,type:a,created:b}))}),w.actors=z,w.bhats=E,w.whats=j;else{if(g(\">>>nets capacity matrix NxN\",[z,z]),z<=400){var t=z,o=$(t),c=$([t,t],function(e,t,n){return n[e][t]=0}),n=$([t,t],function(e,t,n){return n[e][t]=0}),a={};$each(k,function(e,t){return o[t.index]=e}),$each(O,function(e,t){var n=t.src,a=t.tar,t=t.capacity;c[k[n].index][k[a].index]=t});for(var s=0;s<t;s++)for(var r=s+1;r<t;r++){var i=$.MaxFlowMinCut(c,s,r),d=i.maxflow,f=i.cutset,h=i.mincut,u=n[s][r]=n[r][s]=f.length,i=a[u]||(a[u]=[]);u&&i.push({s:s,t:r,maxflow:d,mincut:h,cutset:f})}var x=N.nodes={},l=N.edges={};x.ref={type:\"connection\",index:0,name:\"ref\",created:b};$each(a,function(r,e){\"0\"!=r&&(g(\">>>nets cut\",r),e.forEach(function(e,t){var n=e.s,a=e.t,c=e.maxflow,s=k[o[n]],e=k[o[a]],e=s.index+\":\"+e.index;x[e]={type:\"connection\",index:t,created:b},l[e]||(l[e]={src:\"ref\",tar:e,type:\"lambda\"+r,name:o[n]+\":\"+o[a],maxflow:c,cutsize:r});g(\">>>nets\",r,n,a)}))}),g(\">>>nets save NxE\",[Object.keys(k).length,Object.keys(O).length]),p._net=[{name:\"anet\",nodes:k,edges:O},{name:\"cnet\",nodes:x,edges:l}]}else g(\">>>nets TOO BIG to make connections !\");m(p)}})}','{}','','- pocs = \"brian.d.james@nga.mil;john.b.gree@nga.mil;tara.a.smith@nga.mil\"\n- download = \"download\".link(`${host}/${name}.${engine}?endservice=ENDSERVICE`)\n\n:markdown\n	# Terms of Use\n	[You](/ping) become a `#{Name}` transition partner when [you](/ping) !{download} #{Name}:\n	simply replace `ENDSERVICE` in the !{download}-link with the //DOMAIN/ENDPOINT.exe of your \n	service returning [you](/ping) in its list of `#{Name}` users.\n	\n	By !{download}ing #{Name}</a>, [you](/ping) agree to:\n	+ not distribute `#{Name}` outside your service\n	without the \n	<a \n		href=\"mailto:#{pocs}&subject=Please allow us to redistribute #{Name}\">\n		expressed permission of NGA/R\n	</a>.\n	Please note that `#{Name}` contains antitamper watermarks to detect plagiraization per NGA/OGC\n	guidance.\n	+ enable your `ENDSERVICE` endpoint to accept the `#{Name}` interface parameters below.  When no parameters\n	are supplied, your `ENDSERVICE` will return a [json list](http://en.wikipedia.org/wiki/JSON) of `#{Name}` users\n	that must include !{you}.\n	+ [accredit](http://inteldocs/ngaRaccreditations) your `ENDSERVICE` by recovering\n	<a href=\"#{host}/#{name}.run\">#{Name} baseline</a> results. \n	+ credit NGA/R in your `ENDSERVICE` for `#{Name}`. \n	+ supply all `#{Name}` dependencies -- !{reqts[engine]} -- into your `ENDSERVICE`.\n	\n	NGA/R reserves the right to terminate this agreement at any time.\n\n	# Interface\n	!{interface()}\n\n	# Transitions as of #{now}\n	!{data.status}\n\n	# Baseline results\n	See [/#{name}.run](${host}/#{name}.run) for further baselines.\n'),(28,'trigs',1,'js','function trigs(ctx, res) {  \n		// const { sqrt, floor, random, cos, sin, abs, PI, log, exp} = Math;\n		\n		var\n			stats = ctx.Stats,\n			file = ctx.File,\n			flow = ctx.Flow;\n		\n		Log(\"trigs ctx evs\", ctx.Events);\n		\n		if (stats.coherence_time)\n			ctx.Events.$( \"t\", evs => {  // fetch all events\n				if (evs)\n					$.triggerProfile({  // define solver parms\n						evs: evs,		// events\n						refLambda: stats.mean_intensity, // ref mean arrival rate (for debugging)\n						alpha: file.Stats_Gain, // assumed detector gain\n						N: ctx.Dim, 		// samples in profile = max coherence intervals\n						model: ctx.Model,  	// name correlation model\n						Tc: stats.coherence_time,  // coherence time of arrival process\n						T: flow.T  		// observation time\n					}, stats => {\n						ctx.Save = stats;\n						res(ctx);\n					});\n			});\n		\n		else\n			res(null);\n	}','\"use strict\";function trigs(t,i){var n=t.Stats,s=t.File,a=t.Flow;Log(\"trigs ctx evs\",t.Events),n.coherence_time?t.Events.$(\"t\",function(e){e&&$.triggerProfile({evs:e,refLambda:n.mean_intensity,alpha:s.Stats_Gain,N:t.Dim,model:t.Model,Tc:n.coherence_time,T:a.T},function(e){t.Save=e,i(t)})}):i(null)}','{}','','- pocs = \"brian.d.james@nga.mil;john.b.gree@nga.mil;tara.a.smith@nga.mil\"\n- download = \"download\".link(`${host}/${name}.${engine}?endservice=ENDSERVICE`)\n\n:markdown\n	# Terms of Use\n	[You](/ping) become a `#{Name}` transition partner when [you](/ping) !{download} #{Name}:\n	simply replace `ENDSERVICE` in the !{download}-link with the //DOMAIN/ENDPOINT.exe of your \n	service returning [you](/ping) in its list of `#{Name}` users.\n	\n	By !{download}ing #{Name}</a>, [you](/ping) agree to:\n	+ not distribute `#{Name}` outside your service\n	without the \n	<a \n		href=\"mailto:#{pocs}&subject=Please allow us to redistribute #{Name}\">\n		expressed permission of NGA/R\n	</a>.\n	Please note that `#{Name}` contains antitamper watermarks to detect plagiraization per NGA/OGC\n	guidance.\n	+ enable your `ENDSERVICE` endpoint to accept the `#{Name}` interface parameters below.  When no parameters\n	are supplied, your `ENDSERVICE` will return a [json list](http://en.wikipedia.org/wiki/JSON) of `#{Name}` users\n	that must include !{you}.\n	+ [accredit](http://inteldocs/ngaRaccreditations) your `ENDSERVICE` by recovering\n	<a href=\"#{host}/#{name}.run\">#{Name} baseline</a> results. \n	+ credit NGA/R in your `ENDSERVICE` for `#{Name}`. \n	+ supply all `#{Name}` dependencies -- !{reqts[engine]} -- into your `ENDSERVICE`.\n	\n	NGA/R reserves the right to terminate this agreement at any time.\n\n	# Interface\n	!{interface()}\n\n	# Transitions as of #{now}\n	!{data.status}\n\n	# Baseline results\n	See [/#{name}.run](${host}/#{name}.run) for further baselines.\n');
/*!40000 ALTER TABLE `engines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `fileID` int(11) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faqs` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Seq` varchar(64) DEFAULT NULL,
  `Q` mediumtext,
  `A` mediumtext,
  `Name` varchar(32) DEFAULT NULL,
  `_By` varchar(64) DEFAULT NULL,
  `_Dirty` tinyint(1) DEFAULT '0',
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `follows` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Count` int(11) DEFAULT NULL,
  `Event` datetime DEFAULT NULL,
  `Goto` varchar(32) DEFAULT NULL,
  `Client` varchar(64) DEFAULT NULL,
  `View` varchar(32) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hawks`
--

DROP TABLE IF EXISTS `hawks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hawks` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Hawk` varchar(64) DEFAULT NULL,
  `Power` int(11) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM db hawks';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hawks`
--

LOCK TABLES `hawks` WRITE;
/*!40000 ALTER TABLE `hawks` DISABLE KEYS */;
/*!40000 ALTER TABLE `hawks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal`
--

DROP TABLE IF EXISTS `journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `journal` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Hawk` varchar(64) DEFAULT NULL,
  `Power` int(11) DEFAULT NULL,
  `Updates` int(11) DEFAULT '0',
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM db journalling log';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal`
--

LOCK TABLES `journal` WRITE;
/*!40000 ALTER TABLE `journal` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lookups`
--

DROP TABLE IF EXISTS `lookups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lookups` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Name` varchar(64) DEFAULT NULL,
  `Path` mediumtext,
  `Ref` varchar(32) DEFAULT NULL,
  `Description` mediumtext,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lookups`
--

LOCK TABLES `lookups` WRITE;
/*!40000 ALTER TABLE `lookups` DISABLE KEYS */;
INSERT INTO `lookups` VALUES (1,'news1','/news.db','News',NULL),(2,'news2','/altnews.db','News',NULL),(3,'english','ext-locale-en.js','locales',NULL),(4,'french','ext-locale-fr.js','locales',NULL),(5,'german','ext-locale-de.js','locales',NULL),(6,'crisp','crisp','themes',NULL),(7,'crisp-touch','crisp-touch','themes',NULL),(8,'neptune','neptune','themes',NULL),(9,'neptune-touch','neptune-touch','themes',NULL),(10,'arial','arial','themes',NULL),(11,'post1','shares/','testpost',NULL),(12,'post2','shares/m1.jpg','testpost',NULL),(13,'newsread','/news.db?_blog=Message','News',NULL),(14,'BAA','?agent=baa.nga/new.baa&poll=10','agents',NULL),(15,'kagel','?agent=wwwgokagelcom/newapp&poll=20','agents',NULL),(16,'topcoat','?agent=wwtopcoat','agents',NULL),(17,'nvidea','?agent=wwwnvideacom&poll=30','agents',NULL),(18,'me',NULL,'agents',NULL),(19,'Ordinary Least Squares','ols','Method',NULL),(20,'Logistic Regression','lrm','Method',NULL),(21,'Self Organizing Map','som','Method',NULL),(22,'Support Vector Machine','svm','Method',NULL),(23,'Nearest Neighbor','knn','Method',NULL),(25,'Random Forest','raf','Method',NULL),(27,'Decision Tree','dtr','Method',NULL),(28,'Partial Least Squares','pls','Method',NULL),(31,'Elastic Net','eln','Method',NULL),(32,'Least Angle Regression','lars','Method',NULL),(33,'Orthogonal Matching Pursuit','omp','Method',NULL),(35,'Linear Discriminant Analysis','lda','Method',NULL),(36,'Quadratic Discriminant Analysis','qda','Method',NULL),(37,'Niave Bayes','nab','Method',NULL),(38,'Deep Neural Networks','dnn','Method',NULL),(40,'Deep Haar Scattering','dhs','Method',NULL),(41,'Differential Invariance','dif','Method',NULL),(42,'Attractor Neural Network','ann','Method',NULL),(43,'blitz','//blitz.ilabs.ic.gov','suitor',NULL),(44,'thresher','//thresher.ilabs.ic.gov','suitor',NULL),(45,'Stanford lang parser','snlp','method',NULL),(46,'A lang parser','anlp','method',NULL),(47,'Latent Dirichlet Allocation','ldanlp','method',NULL),(48,'Beta Regression','beta','Method',NULL),(49,'loopback','//localhost:8080','suitor',NULL);
/*!40000 ALTER TABLE `lookups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `masters`
--

DROP TABLE IF EXISTS `masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `masters` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Master` longtext,
  `EndServiceID` varchar(255) DEFAULT NULL,
  `License` varchar(255) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`License`,`EndServiceID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `masters`
--

LOCK TABLES `masters` WRITE;
/*!40000 ALTER TABLE `masters` DISABLE KEYS */;
INSERT INTO `masters` VALUES (1,'\"use strict\";function nets(e,t){var n=e.Reset,a=e.Batch,s=n?e.Save_snap={aNet:{nodes:{},edges:{}},cNet:{nodes:{},edges:{}},actors:0,bhats:0,whats:0}:e.Save_snap;$log(\">>>nets reset\",n),$log(\">>>nets batch\",a?a.length:null);var c=\"black\",o=\"white\",d=new Date,r=s.aNet,i=s.cNet,l=r.nodes,h=r.edges,f=s.actors,u=s.bhats,g=s.whats;if($log(\">>>nets actors\",f),a)$log(\">>>nets records\",a.length,f),a.forEach(function(e){var t=e.bhat,n=e.what,a=e.topic;e.cap;if(t&&n&&a){l[t]||(l[t]={type:c,index:f++,hat:c+u++,created:d,size:0}),l[n]||(l[n]={type:o,index:f++,hat:o+g++,created:d,size:0});var s=t+\":\"+n;h[s]||(h[s]={src:t,tar:n,capacity:1,type:a,created:d})}}),s.actors=f,s.bhats=u,s.whats=g;else if($log(\">>>nets capacity matrix NxN\",[f,f]),f<=400){var x=f,p=$(x),v=$([x,x],function(e,t,n){return n[e][t]=0}),m=$([x,x],function(e,t,n){return n[e][t]=0}),w={};$each(l,function(e,t){return p[t.index]=e}),$each(h,function(e,t){var n=t.src,a=t.tar,s=t.capacity;v[l[n].index][l[a].index]=s});for(var y=0;y<x;y++)for(var b=y+1;b<x;b++){var N=$.MaxFlowMinCut(v,y,b),k=N.maxflow,O=N.cutset,z=N.mincut,E=m[y][b]=m[b][y]=O.length,_=w[E]||(w[E]=[]);E&&_.push({s:y,t:b,maxflow:k,mincut:z,cutset:O})}var j=i.nodes={},B=i.edges={};j.ref={type:\"connection\",index:0,name:\"ref\",created:d};$each(w,function(i,e){\"0\"!=i&&($log(\">>>nets cut\",i),e.forEach(function(e,t){var n=e.s,a=e.t,s=e.maxflow,c=l[p[n]],o=l[p[a]],r=c.index+\":\"+o.index;j[r]={type:\"connection\",index:t,created:d},B[r]||(B[r]={src:\"ref\",tar:r,type:\"lambda\"+i,name:p[n]+\":\"+p[a],maxflow:s,cutsize:i});$log(\">>>nets\",i,n,a)}))}),$log(\">>>nets save NxE\",[Object.keys(l).length,Object.keys(h).length]),e._net=[{name:\"anet\",nodes:l,edges:h},{name:\"cnet\",nodes:j,edges:B}]}else $log(\">>>nets TOO BIG to make connections !\");t(e)}nets($ctx,$res);','3f95016c7fd12997fe589b92d8c8560f70d5c1ad05e0a52b1a7cd3b87ec98c23','b261b9c278a424401616759da417a9895fa6eaef7d037ff3f605700eac4f1e2f');
/*!40000 ALTER TABLE `masters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `milestones`
--

DROP TABLE IF EXISTS `milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `milestones` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Project` varchar(32) DEFAULT NULL,
  `RAS` varchar(16) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `milestones`
--

LOCK TABLES `milestones` WRITE;
/*!40000 ALTER TABLE `milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `milestones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nlprules`
--

DROP TABLE IF EXISTS `nlprules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nlprules` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `UseCase` varchar(255) DEFAULT NULL,
  `Index` varchar(16) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nlprules`
--

LOCK TABLES `nlprules` WRITE;
/*!40000 ALTER TABLE `nlprules` DISABLE KEYS */;
INSERT INTO `nlprules` VALUES (1,'windows is a horrible operating system','os'),(2,'the best operating system is unix','os'),(3,'fast os incude linux and sometimes windows','os'),(4,'optics is a complex subject area involving the theory of coherence','photons'),(5,'some fringes can shift due to cross spectral purity issues','photons'),(6,'photon counting is a doubly stochastic process','photons'),(7,'polarizarion is a fundemental optical property','photons'),(8,'the degree of polarization is a measure of coherence in optical beams','photons'),(9,'sometimes cartels kill their own','terror'),(10,'helpless peasants were threatened by FARC','terror'),(11,'the ','terror');
/*!40000 ALTER TABLE `nlprules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `profiles` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Banned` mediumtext,
  `QoS` int(11) DEFAULT NULL,
  `Credit` float DEFAULT NULL,
  `Charge` float DEFAULT NULL,
  `Challenge` tinyint(1) DEFAULT NULL,
  `Client` varchar(64) DEFAULT NULL,
  `User` varchar(16) DEFAULT NULL,
  `Login` varchar(16) DEFAULT NULL,
  `Group` varchar(16) DEFAULT NULL,
  `Repoll` tinyint(1) DEFAULT NULL,
  `Retries` int(11) DEFAULT NULL,
  `Timeout` float DEFAULT NULL,
  `Message` mediumtext,
  `LikeUs` int(11) DEFAULT '0',
  `Password` varchar(64) DEFAULT NULL,
  `Requested` datetime DEFAULT NULL,
  `Used` datetime DEFAULT NULL,
  `SecureCom` varchar(128) DEFAULT NULL,
  `pubKey` mediumtext,
  `Expires` datetime DEFAULT NULL,
  `SessionID` varchar(32) DEFAULT NULL,
  `validEmail` tinyint(1) DEFAULT '1',
  `Trusted` tinyint(1) DEFAULT '0',
  `Online` tinyint(1) DEFAULT '0',
  `hasAdmin` tinyint(1) DEFAULT '0',
  `TokenID` varchar(32) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `Client` (`Client`),
  UNIQUE KEY `SessionID` (`SessionID`),
  UNIQUE KEY `TokenKey` (`TokenID`)
) ENGINE=InnoDB AUTO_INCREMENT=3625 DEFAULT CHARSET=latin1 COMMENT='TOTEM Updates when a client arrives';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
INSERT INTO `profiles` VALUES (53,'',10,100000,NULL,0,'scottj338@comcast.net',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'04EC6CF26536A01E01389797E7BD8737',NULL,NULL,'scottj338@comcast.net04EC6CF26536A01E01389797E7BD8737','-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nxjMEYBgq9BYJKwYBBAHaRw8BAQdAs6Px0eOgt4GyulMitliLpnacT/eBLhAF\r\nJVJK4z+xVKDNAMKPBBAWCgAgBQJgGCr0BgsJBwgDAgQVCAoCBBYCAQACGQEC\r\nGwMCHgEAIQkQ1LaKf554TSsWIQSYzmTQ5bUcPmSJfKjUtop/nnhNK0pcAQD0\r\n4Oldpql20VSFG2Be4Vq16VHzihyLzljCHY83YyPuiwEAk4mSltSdOPGVKxK1\r\nGmZ7lq8asoH80jI31nuQXgj8XgLOOARgGCr0EgorBgEEAZdVAQUBAQdAwSKZ\r\nPjxqrgVDXJhL/4rNCd6zExobbLg80KvQ1FTYSigDAQgHwngEGBYIAAkFAmAY\r\nKvQCGwwAIQkQ1LaKf554TSsWIQSYzmTQ5bUcPmSJfKjUtop/nnhNKz5IAP9l\r\nRIeFv+D/ElBev0J29Q4iLyLsZavDc8WZDQJe7vJCFgD+NZF8pnqTmGsW2nUt\r\nIpEVkn062hUltZ5hV0qsZjh8hAE=\r\n=KKq3\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n','2022-01-31 17:22:31',NULL,1,0,1,0,NULL),(3462,'',10,100,0,0,'brian.d.james@nga.mil','','','app',1,5,30,'What is #riddle?',0,'BAE97A4258E51ACA4726059D4159AA01',NULL,NULL,'brian.d.james@nga.mil7A6F3BA7EB750FA904DC5D6BE5402E0D','-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nxjMEYBsD3hYJKwYBBAHaRw8BAQdAeHKFQUA+I4g467ksxOqs1LhV49+Ky9Jt\r\nZvTCrrlqmaTNAMKPBBAWCgAgBQJgGwPeBgsJBwgDAgQVCAoCBBYCAQACGQEC\r\nGwMCHgEAIQkQ0LrQ01UZoqAWIQRRFPVYL2HPAwyLNejQutDTVRmioAwfAP0Q\r\nuLBVtShaDXYun/ipnHUpNfUVRhl4pxK1m4/fhjQwggEA+fr4GfooCSH+kO4Y\r\nxZLs/V5rSNvXU5B4SdmlZrDRSAjOOARgGwPeEgorBgEEAZdVAQUBAQdAgzop\r\nj1CfFbD2X8AU+N+ZaStelVQ/DCV3ltxQnnq6rE4DAQgHwngEGBYIAAkFAmAb\r\nA94CGwwAIQkQ0LrQ01UZoqAWIQRRFPVYL2HPAwyLNejQutDTVRmioIYKAQC3\r\nry+J41hYRtqvSXiU2pte7pRZTTmiv4GxHyKKLFO1zwEAjo/i3OcvMfMrX42j\r\nhhYTR5vK7DtorMEU3dfpnCCLiwo=\r\n=gUG2\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n','2021-02-17 20:26:54','a1885ae40210df63a48c91733181d397',1,1,1,0,NULL),(3469,'',10,100,0,0,'brian.d.james@comcast.net','','','app',1,5,30,'What is #riddle?',0,'BAE97A4258E51ACA4726059D4159AA01',NULL,NULL,'brian.d.james@comcast.netA3928835BCDEEE960A3875AE86DDF724','-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nxjMEYBv6SRYJKwYBBAHaRw8BAQdAkP03gOkqzkoeV6vvDWExFTEGTvzYSzGq\r\niUWpgN70hWXNAMKPBBAWCgAgBQJgG/pJBgsJBwgDAgQVCAoCBBYCAQACGQEC\r\nGwMCHgEAIQkQqV91K6es8RUWIQTK5yntMoSNY1yXrXSpX3Urp6zxFX0gAQCf\r\nh2S1IPs48xVnB5ndr8hqoqVm55sAWhRf3aTLRiMpZQEAyazytqjmNtM9dJjc\r\nTIDYiKFnFc6lKpUaaJ/la02DRQjOOARgG/pJEgorBgEEAZdVAQUBAQdAxeP/\r\ngWBb8ySpQU6F4rVSyC4Zb1UxWn0HkEMK0T0V5G0DAQgHwngEGBYIAAkFAmAb\r\n+kkCGwwAIQkQqV91K6es8RUWIQTK5yntMoSNY1yXrXSpX3Urp6zxFbZzAPsH\r\nx8fTqe2oy0i3vKZBSX0mhQ/m1IHeyjUT2x6jt0VBGgD8CWvtQa9UFbooeWSO\r\nXZSNnmstOvN0sCpX7x9H3s8QtA4=\r\n=FVh+\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n','2021-02-12 22:55:18','e7e216808167f738a63d143b53c84af4',1,1,1,0,NULL),(3476,'',10,100,0,0,'brian.d.james@nga.,mil','','','app',1,5,30,'What is #riddle?',0,'83BB972B6685627E151FD644AA292C8B',NULL,NULL,'brian.d.james@nga.,mil83BB972B6685627E151FD644AA292C8B',NULL,'2021-02-09 12:22:02',NULL,1,1,1,0,NULL),(3477,'',10,100,0,0,'brian.d.james@comast.net','','','app',1,5,30,'What is #riddle?',0,'A83F521BDCE665ED9DB73E29F609CA61',NULL,NULL,'brian.d.james@comast.netA83F521BDCE665ED9DB73E29F609CA61',NULL,'2021-02-11 14:48:30',NULL,1,1,1,0,NULL),(3608,'',10,100,0,0,'guest::ffff:172.18.0.1@totem.nga.mil','','','app',1,5,30,'What is #riddle?',0,NULL,NULL,NULL,NULL,NULL,'2021-11-29 23:06:51',NULL,1,1,0,0,NULL),(3609,'',10,100,0,0,'guest::ffff:172.20.0.1@totem.nga.mil','','','app',1,5,30,'What is #riddle?',0,NULL,NULL,NULL,NULL,NULL,'2021-11-30 17:00:57',NULL,1,1,0,0,NULL),(3610,'',10,100,0,0,'guest::ffff:127.0.0.1@totem.nga.mil','','','app',1,5,30,'What is #riddle?',0,'7A6F3BA7EB750FA904DC5D6BE5402E0D',NULL,NULL,'guest::ffff:127.0.0.1@totem.nga.mil7A6F3BA7EB750FA904DC5D6BE5402E0D',NULL,'2021-12-03 09:02:50',NULL,1,1,0,0,NULL),(3620,'',10,100,0,0,'guest::1@totem.nga.mil','','','app',1,5,30,'What is #riddle?',0,'7A6F3BA7EB750FA904DC5D6BE5402E0D',NULL,NULL,'guest::1@totem.nga.mil7A6F3BA7EB750FA904DC5D6BE5402E0D','-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nxjMEYaBHjRYJKwYBBAHaRw8BAQdAbEvUodRfdWzCJUup3jw/iMUrT8e78wPL\r\nrO7D82+5LIzNAMKPBBAWCgAgBQJhoEeNBgsJBwgDAgQVCAoCBBYCAQACGQEC\r\nGwMCHgEAIQkQPyI1moAT4t4WIQQwlsKiqEf5lcJ+VGc/IjWagBPi3jXFAP0Z\r\nUPu/YhZWEMmDAmSAa3HLuzXW5tfIGrmtsHEHL98EzwEAvuE4P0lX8NFxT8W8\r\ngfsw7T7kc579dEEWKKDZw1Ew3ALOOARhoEeNEgorBgEEAZdVAQUBAQdA7Iz8\r\nK5Jjd0iK1HTqFATMZZMAKTXmsD2hCt345ODSNXQDAQgHwngEGBYIAAkFAmGg\r\nR40CGwwAIQkQPyI1moAT4t4WIQQwlsKiqEf5lcJ+VGc/IjWagBPi3j70AQD4\r\nib0XPjOZw4kRgEgM0SamBq23YweklCe0uBym0O/NhgEAj0jh2Hf/ki9DAACj\r\nMPIMPibuReM88H5MSZ9vxnc98QQ=\r\n=+1GA\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n','2021-12-08 09:02:56',NULL,1,1,1,0,NULL),(3621,'',10,100,0,0,'guest::1@totem','','','app',1,5,30,'What is #riddle?',0,'7A6F3BA7EB750FA904DC5D6BE5402E0D',NULL,NULL,'guest::1@totem7A6F3BA7EB750FA904DC5D6BE5402E0D','-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nxjMEYbS1tBYJKwYBBAHaRw8BAQdAmzwtkHlr6ezhubDY4xcTmW3dyMybKyQ2\r\ne177TlVWF6PNAMKPBBAWCgAgBQJhtLW0BgsJBwgDAgQVCAoCBBYCAQACGQEC\r\nGwMCHgEAIQkQzSHMNGLwCzQWIQTvJMTuGtr5x25tSjvNIcw0YvALNGkIAQCj\r\n2hA8rytyuxpaoD5cc+zfifZEqsymZTQGsWfsMx2sbAD/XWJaT+LbW+LF9VMU\r\njM0BbXRLEOU0z2Jgy8c7RWDlvwXOOARhtLW0EgorBgEEAZdVAQUBAQdA9EgD\r\njAcMtLTwYXhrKLq0CufSWJwvoMQfqQnfLoGLdF0DAQgHwngEGBYIAAkFAmG0\r\ntbQCGwwAIQkQzSHMNGLwCzQWIQTvJMTuGtr5x25tSjvNIcw0YvALNDOgAQCk\r\nUaqZ2XVokbz9InUebIhGjIFH8AvYRRbBNDmPbAge8QEAzWXmjlRD8piHaWfO\r\n/3JX/XnmBmE0fjZndVDmsl9OiwY=\r\n=W9hF\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n','2021-12-06 10:26:21',NULL,1,1,1,0,NULL),(3622,'',10,100,0,0,'guest::ffff:127.0.0.1@totem','','','app',1,5,30,'What is #riddle?',0,'7A6F3BA7EB750FA904DC5D6BE5402E0D',NULL,NULL,'guest::ffff:127.0.0.1@totem7A6F3BA7EB750FA904DC5D6BE5402E0D','-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nxjMEYbTR6RYJKwYBBAHaRw8BAQdA8lmxnEB5y3nWbNagP2nNmd/Iaxos4UAa\r\n/4dF3td0HyfNAMKPBBAWCgAgBQJhtNHpBgsJBwgDAgQVCAoCBBYCAQACGQEC\r\nGwMCHgEAIQkQ3yEMdpVV4HQWIQTPfLY3eI1Krx63ZWTfIQx2lVXgdJ+AAQCb\r\nc3sDgHLJegljAlcBPaGMydnwvw4GCf6jeTZSVp1mFwD7BVCFWDrmkEMPs1Ij\r\nt3gCNd0Abour9r+o/7ZrmGPmhA/OOARhtNHpEgorBgEEAZdVAQUBAQdAk5z9\r\nWsKChfZfKUdBxDGaBUZFelzfdrRns8um3W9SW18DAQgHwngEGBYIAAkFAmG0\r\n0ekCGwwAIQkQ3yEMdpVV4HQWIQTPfLY3eI1Krx63ZWTfIQx2lVXgdJw3AP9m\r\n257h2OVIBuLn5dQTmT3Oljc7gFm74Df/TWbwBubrqAD+PfhXOd6ICwrDjKcm\r\nblzNPTsKGlNNTZ5pax0L6Vf7fgs=\r\n=CHA6\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n','2021-12-06 16:31:52',NULL,1,1,1,0,NULL),(3623,'',10,100,0,0,'guest::1@nodomain','','','app',1,5,30,'What is #riddle?',0,'DB1A67EDA028840C4EA3157BBC64960C',NULL,NULL,'guest::1@nodomainDB1A67EDA028840C4EA3157BBC64960C',NULL,'2021-12-12 10:34:18',NULL,1,1,0,0,NULL),(3624,'',10,100,0,0,'guest::ffff:172.19.0.1@nodomain','','','app',1,5,30,'What is #riddle?',0,'DB1A67EDA028840C4EA3157BBC64960C',NULL,NULL,'guest::ffff:172.19.0.1@nodomainDB1A67EDA028840C4EA3157BBC64960C','-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nxjMEYalfjRYJKwYBBAHaRw8BAQdAicUP61UxQPoiRDgl50EhHs1U4MZhMnyg\r\nSzaYenKiV+XNAMKPBBAWCgAgBQJhqV+NBgsJBwgDAgQVCAoCBBYCAQACGQEC\r\nGwMCHgEAIQkQvWmW36aCSmgWIQQ/NmyLZDAA7T7WHNq9aZbfpoJKaMr0AP96\r\nPpBc13u2NcsuK//TK5Hs5I0xTl6C4lTWeN6m/UIvhwD+O7VEdMDk1quB+3B6\r\nHAwSxWXuwK3qSMZIV+l5eg93gADOOARhqV+NEgorBgEEAZdVAQUBAQdA4E6X\r\nKbF2gddz4mK8QwRcplWarpWMX9zhSLXmhrK/Sn0DAQgHwngEGBYIAAkFAmGp\r\nX40CGwwAIQkQvWmW36aCSmgWIQQ/NmyLZDAA7T7WHNq9aZbfpoJKaA/hAQCw\r\n00djRdZqglbn83JoxfCGZ2hLGeXGL0hluud4Zxv2WgEAhvaQzzkV8xM3SYE6\r\nkh0OeuDkF+XE7fbfbqukkHGvTAk=\r\n=weGf\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n','2021-12-06 23:44:59',NULL,1,1,1,0,NULL);
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Name` varchar(32) DEFAULT NULL,
  `JIRA` varchar(16) DEFAULT NULL,
  `Status` varchar(16) DEFAULT NULL,
  `Title` mediumtext,
  `Lead` varchar(64) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyId` (`Name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (2,'demo','tbd','started','Totem notebook','tbd'),(3,'cluster','tbd','started','Totem notebook','tbd'),(4,'costs','tbd','started','Totem notebook','tbd'),(5,'cints','tbd','started','Totem notebook','tbd'),(6,'genpr','tbd','started','Totem notebook','tbd'),(7,'nets','tbd','started','Totem notebook','tbd'),(8,'trigs','tbd','started','Totem notebook','tbd'),(9,'rats','tbd','started','Totem notebook','tbd'),(10,'regress','tbd','started','Totem notebook','tbd');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proxies`
--

DROP TABLE IF EXISTS `proxies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `proxies` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `ip` varchar(16) DEFAULT NULL,
  `port` int(11) DEFAULT NULL,
  `org` varchar(16) DEFAULT NULL,
  `type` varchar(16) DEFAULT NULL,
  `proto` varchar(8) DEFAULT NULL,
  `source` varchar(8) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `s1xx` int(11) DEFAULT '0',
  `s2xx` int(11) DEFAULT '0',
  `s3xx` int(11) DEFAULT '0',
  `s4xx` int(11) DEFAULT '0',
  `s5xx` int(11) DEFAULT '0',
  `sRefused` int(11) DEFAULT '0',
  `sAbort` int(11) DEFAULT '0',
  `sTimeout` int(11) DEFAULT '0',
  `hits` int(11) DEFAULT '0',
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=latin1 COMMENT='TOTEM reads and updates to maintain rotating proxies for url fetches';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proxies`
--

LOCK TABLES `proxies` WRITE;
/*!40000 ALTER TABLE `proxies` DISABLE KEYS */;
INSERT INTO `proxies` VALUES (1,'161.202.226.194',80,'JP','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,23,0,0,2,0,25),(2,'88.99.10.249',1080,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,15,0,0,5,4,24),(3,'189.170.70.89',8080,'MX','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,26,5,31),(4,'109.87.46.125',58048,'UA','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,20,1,21),(5,'188.165.141.114',3129,'FR','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,2,0,0,13,2,17),(6,'46.218.155.194',3128,'FR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,2,0,0,16,6,24),(7,'13.251.27.133',3128,'SG','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,12,0,12),(8,'200.52.77.36',80,'MX','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,8,0,0,27,10,45),(9,'89.223.80.30',8080,'RU','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,14,1,15),(10,'145.239.121.218',3129,'FR','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,3,0,0,10,1,15),(11,'128.199.214.87',3128,'SG','anonymous','no','0','2020-09-02 13:48:13',0,0,0,7,0,0,20,13,40),(12,'157.230.103.91',38609,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,27,21,48),(13,'172.104.63.134',3128,'SG','elite proxy','no','0','2020-09-02 13:48:13',0,7,0,0,0,0,18,3,28),(14,'85.10.219.98',1080,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,2,0,0,20,17,39),(15,'51.255.103.170',3129,'FR','elite proxy','no','0','2020-09-02 13:48:13',0,3,0,0,0,0,17,2,22),(16,'157.230.103.189',34067,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,14,0,14),(17,'175.139.179.65',42580,'MY','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,18,5,24),(18,'184.105.186.218',3838,'US','elite proxy','no','0','2020-09-02 13:48:13',0,6,0,0,0,0,19,2,27),(19,'125.27.251.206',50817,'TH','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,2,0,0,25,3,30),(20,'51.75.147.44',3128,'FR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,6,1,0,10,1,18),(21,'118.175.207.129',48139,'TH','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,2,20),(22,'216.125.236.84',80,'US','elite proxy','no','0','2020-09-02 13:48:13',0,16,0,0,0,0,5,0,21),(23,'134.35.12.41',8080,'YE','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,16,11,28),(24,'200.255.122.170',8080,'BR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,8,0,0,10,9,27),(25,'181.4.32.144',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,22,0,22),(26,'182.72.150.242',8080,'IN','anonymous','no','0','2020-09-02 13:48:13',0,7,0,0,0,6,18,4,35),(27,'165.22.64.68',36918,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,22,0,22),(28,'181.101.53.213',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,28,0,28),(29,'103.206.254.170',65103,'ID','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,16,3,19),(30,'13.59.75.183',3838,'US','elite proxy','no','0','2020-09-02 13:48:13',0,11,0,0,0,0,15,1,27),(31,'109.74.37.141',8080,'YE','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,1,20,13,35),(32,'181.101.16.53',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,21,3,24),(33,'144.76.214.156',1080,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,4,0,0,16,13,33),(34,'43.245.202.15',57396,'KH','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,18,1,20),(35,'46.219.80.142',57401,'UA','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,2,20),(36,'103.250.68.213',60735,'BD','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,19,0,19),(37,'189.194.48.26',8080,'MX','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,17,0,17),(38,'181.6.40.9',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,30,4,34),(39,'103.87.170.64',54422,'IN','elite proxy','no','0','2020-09-02 13:48:13',0,3,0,0,0,1,17,10,31),(40,'184.105.186.215',3838,'US','elite proxy','no','0','2020-09-02 13:48:13',0,2,0,0,0,0,19,2,23),(41,'13.59.1.215',3838,'US','elite proxy','no','0','2020-09-02 13:48:13',0,5,0,0,0,0,7,0,12),(42,'83.97.23.90',18080,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,14,0,0,0,0,5,1,20),(43,'188.165.16.230',3129,'FR','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,6,0,0,15,1,23),(44,'45.70.107.94',55443,'BR','elite proxy','no','0','2020-09-02 13:48:13',0,6,0,0,0,0,23,22,51),(45,'103.133.114.113',8080,'ID','anonymous','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,23,2,26),(46,'70.35.213.229',36127,'CA','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,3,0,0,18,0,21),(47,'103.146.177.39',80,'IN','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,1,0,0,20,2,23),(48,'45.7.230.109',8080,'CL','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,29,20,49),(49,'95.174.67.50',18080,'NL','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,15,0,0,1,0,16),(50,'1.20.98.40',48871,'TH','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,17,2,19),(51,'211.105.32.123',8080,'KR','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,26,5,31),(52,'184.105.186.238',3838,'US','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,18,2,21),(53,'191.232.170.36',80,'BR','anonymous','no','0','2020-09-02 13:48:13',0,8,0,0,0,0,15,2,25),(54,'103.233.158.34',8888,'ID','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,10,2,13),(55,'182.160.124.26',8081,'BD','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,16,0,16),(56,'176.56.107.167',41053,'ES','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,11,0,11),(57,'188.240.99.25',9090,'YE','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,14,11,26),(58,'85.10.219.101',1080,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,2,0,0,27,17,46),(59,'178.215.76.193',53281,'RU','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,24,5,29),(60,'181.101.109.150',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,0,18),(61,'184.105.186.227',3838,'US','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,27,5,33),(62,'181.101.113.73',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,25,9,34),(63,'181.101.11.108',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,1,19),(64,'193.25.120.80',8080,'RU','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,22,4,26),(65,'181.101.54.28',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,19,0,19),(66,'113.11.136.28',53996,'ID','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,1,0,1,24,2,28),(67,'181.101.46.17',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,0,18),(68,'181.101.85.216',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,0,18),(69,'13.229.55.68',8888,'SG','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,14,0,14),(70,'149.129.188.86',8890,'SG','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,17,0,17),(71,'111.92.164.249',47612,'ID','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,15,1,16),(72,'181.3.70.92',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,5,23),(73,'200.80.22.40',34403,'AR','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,12,0,12),(74,'88.99.149.188',31288,'DE','anonymous','no','0','2020-09-02 13:48:13',0,4,0,0,0,0,16,4,24),(75,'80.23.125.226',3128,'IT','anonymous','no','0','2020-09-02 13:48:13',0,3,0,0,0,0,16,8,27),(76,'144.76.214.157',1080,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,10,0,0,13,11,34),(77,'181.6.249.48',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,26,0,26),(78,'181.3.109.92',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,3,0,0,0,0,20,22,45),(79,'181.3.176.8',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,18,0,18),(80,'200.54.42.3',8080,'CL','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,11,4,15),(81,'181.6.82.185',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,2,0,0,0,0,14,12,28),(82,'125.27.251.24',36048,'TH','anonymous','no','0','2020-09-02 13:48:13',0,0,0,2,0,0,11,1,14),(83,'96.9.73.80',56891,'KH','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,15,1,17),(84,'181.102.166.78',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,14,0,14),(85,'181.101.11.58',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,22,0,22),(86,'36.37.113.4',36485,'ID','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,22,2,25),(87,'181.106.206.104',9999,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,19,0,19),(88,'79.137.44.85',3129,'ES','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,1,0,0,11,1,13),(89,'182.160.117.130',53281,'BD','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,1,0,0,19,1,21),(90,'180.183.28.232',3128,'TH','elite proxy','no','0','2020-09-02 13:48:13',0,2,0,0,0,0,11,1,14),(91,'95.143.8.182',57169,'RU','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,20,3,23),(92,'87.107.201.187',8080,'IR','elite proxy','no','0','2020-09-02 13:48:13',0,6,0,0,0,0,26,24,56),(93,'41.217.219.53',31398,'MW','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,12,0,12),(94,'167.71.207.161',8080,'SG','elite proxy','no','0','2020-09-02 13:48:13',0,1,0,0,0,0,14,13,28),(95,'195.225.142.205',30681,'RO','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,22,1,23),(96,'85.10.219.99',1080,'DE','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,3,0,0,13,7,23),(97,'45.70.107.169',55443,'BR','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,24,0,24),(98,'13.75.77.214',44355,'HK','elite proxy','no','0','2020-09-02 13:48:13',0,9,0,0,0,0,4,0,13),(99,'181.102.69.134',7071,'AR','anonymous','no','0','2020-09-02 13:48:13',0,0,0,0,0,0,24,2,26),(100,'81.201.60.130',80,'CZ','elite proxy','no','0','2020-09-02 13:48:13',0,0,0,16,0,0,7,0,23);
/*!40000 ALTER TABLE `proxies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queues`
--

DROP TABLE IF EXISTS `queues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `queues` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Age` float DEFAULT NULL,
  `cpuUtil` float DEFAULT NULL,
  `State` float DEFAULT NULL,
  `ECD` datetime DEFAULT NULL,
  `Client` varchar(64) DEFAULT NULL,
  `Class` varchar(32) DEFAULT NULL,
  `Task` varchar(32) DEFAULT NULL,
  `QoS` int(11) DEFAULT NULL,
  `Priority` int(11) DEFAULT NULL,
  `Arrived` datetime DEFAULT NULL,
  `Departed` datetime DEFAULT NULL,
  `Name` varchar(32) DEFAULT NULL,
  `Classif` varchar(32) DEFAULT NULL,
  `Notes` mediumtext,
  `Billed` tinyint(1) DEFAULT NULL,
  `Flagged` tinyint(1) DEFAULT NULL,
  `Funded` tinyint(1) DEFAULT NULL,
  `Work` int(11) DEFAULT NULL,
  `Done` int(11) DEFAULT NULL,
  `Finished` tinyint(1) DEFAULT '0',
  `Run` int(11) DEFAULT '1',
  `Events` int(11) DEFAULT '0',
  `Batches` int(11) DEFAULT '0',
  `Snaps` int(11) DEFAULT '0',
  `Kill` tinyint(1) DEFAULT '0',
  `Sign0` tinyint(1) DEFAULT '1',
  `Sign1` tinyint(1) DEFAULT '1',
  `Sign2` tinyint(1) DEFAULT '1',
  `Sign3` tinyint(1) DEFAULT '1',
  `memUtil` float DEFAULT NULL,
  `Starts` datetime DEFAULT NULL,
  `Ends` datetime DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyId` (`Class`,`Task`,`Name`)
) ENGINE=InnoDB AUTO_INCREMENT=322 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queues`
--

LOCK TABLES `queues` WRITE;
/*!40000 ALTER TABLE `queues` DISABLE KEYS */;
INSERT INTO `queues` VALUES (120,0,0.0450107,0,NULL,'system','system','watchdog',0,0,'2021-01-05 12:23:01',NULL,'weekly','(U)',NULL,0,0,1,0,33,0,258,0,0,32,0,0,0,0,0,0.0428134,NULL,NULL),(139,0,0.0498646,0,'2021-01-06 20:02:54','guest@guest.org','validation','nets',60000,0,'2021-01-06 20:02:54',NULL,'gtdcsv','(U)','<a href=\'/nets.run?Name=gtdcsv\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdcsv\' >Metrics</a>',0,0,1,2,1,0,116,0,0,0,0,0,0,0,0,0.0357483,NULL,NULL),(179,0,0.0535305,0,'2021-01-03 14:26:36','guest@guest.org','training','nets',60000,0,'2021-01-03 14:26:34','2021-01-03 14:26:36','gtdcsv','(U)','<a href=\'/nets.run?Name=gtdcsv\' >run</a> || <a href=\'/nets.exe?&$drop:=Save*&Name=gtdcsv\' >funded</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdcsv\' >Metrics</a>',0,0,1,3,3,1,2,198,2,2,0,0,0,0,0,0.0383669,NULL,NULL),(189,0,0.0429531,0,'2021-01-06 13:42:05','guest@guest.org','testing','nets',60000,0,'2021-01-06 13:41:50','2021-01-06 13:42:04','gtdcsv','(U)','<a href=\'/nets.run?Name=gtdcsv\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdcsv\' >Metrics</a>',0,0,1,10,10,1,12,900,9,9,0,0,0,0,0,0.0403563,NULL,NULL),(261,0,0.0560489,0,'2021-01-07 00:10:55','guest@guest.org','validate','nets',60000,0,'2021-01-07 00:10:55',NULL,'gtdcsv','(U)','<a href=\'/nets.run?Name=gtdcsv\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdcsv\' >Metrics</a>',0,0,1,3,1,0,44,0,0,0,0,0,0,0,0,0.0367579,NULL,NULL),(299,0,0.0545692,0,'2021-01-06 23:17:50','guest@guest.org','test','nets',60000,0,'2021-01-06 23:17:50',NULL,'gtdcsv','(U)','<a href=\'/nets.run?Name=gtdcsv\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdcsv\' >Metrics</a>',0,0,1,12,1,0,9,0,0,0,0,0,0,0,0,0.0387665,NULL,NULL),(308,0,0.0540989,0,'2021-01-07 19:55:27','guest@guest.org','train','nets',60000,0,'2021-01-07 19:55:27',NULL,'gtdcsv','(U)','<a href=\'/nets.run?Name=gtdcsv\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdcsv\' >Metrics</a>',0,0,1,100,1,0,56,0,0,0,0,0,0,0,0,0.0436125,NULL,NULL),(309,0,0.0911824,0,'2021-01-12 09:16:55','guest@guest.org','train','nets',60000,0,'2021-01-12 09:16:55','2021-01-12 09:17:00','gtdregion','(U)','<a href=\'/nets.run?Name=gtdregion\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdregion\' >Metrics</a>',0,0,1,100,100,1,17,9800,99,99,0,0,0,0,0,0.0358886,'2021-01-12 09:16:55',NULL),(316,0,0.107694,0,NULL,'guest@guest.org','train','nets',60000,0,'2021-01-11 19:07:55','2021-01-11 19:08:00','gtdstate','(U)','<a href=\'/nets.run?Name=gtdstate\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/stores/_noarch/gtd.csv\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdstate\' >Metrics</a>',0,0,1,100,100,1,1,9800,99,99,0,0,0,0,0,0.0348981,'2021-01-11 19:07:55',NULL),(317,0,0.0785664,0,'2021-01-18 21:42:24','guest@guest.org','train','nets',60,0,'2021-01-18 21:42:24',NULL,'gtdpub','(U)','<a href=\"/nets.run?Name=gtdpub\">Inspect</a> || <a href=\"/rtpsqd.view?task=nets\">RTP</a> || <a href=\"/briefs.view?options=nets\">PMR</a> || <a href=\"/gtd.db\">Source</a> || <a href=\"/plot.view?w=800&h=600&x=Save_baseline$t&y=Save_baseline$y&src=/nets?name=gtdpub\">Metrics</a>',0,0,1,6,1,0,66,0,0,0,0,0,0,0,0,0.0453788,'2021-01-18 21:42:24',NULL),(320,0,0.0885617,0,NULL,'guest@guest.org','validate','nets',60,0,'2021-01-15 23:32:10',NULL,'gtdpub','(U)','<a href=\'/nets.run?Name=gtdpub\' >Inspect</a> || <a href=\'/rtpsqd.view?task=nets\' >RTP</a> || <a href=\'/briefs.view?options=nets\' >PMR</a> || <a href=\'/gtd.db\' >Source</a> || <a href=\'/plot.view?w=800&h=600&x=Save_base$t&y=Save_base$y&src=/nets?name=gtdpub\' >Metrics</a>',0,0,1,0,1,0,21,0,0,0,0,0,0,0,0,0.0328683,'2021-01-15 23:32:10',NULL),(321,0,0.0305242,0,'2021-02-06 08:25:06','guest::1@totem.org','baseline','nets',60,0,'2021-02-06 08:23:25',NULL,'gtdcsv','(U)','</nets.run?Name=gtdcsv >Inspect<//nets.run?Name=gtdcsv> || </rtpsqd.view?task=nets >RTP<//rtpsqd.view?task=nets> || </briefs.view?options=nets >PMR<//briefs.view?options=nets> || </stores/_noarch/gtd.csv >Source<//stores/_noarch/gtd.csv> || </plot.view?w=800&h=600&x=Save_baseline$t&y=Save_baseline$y&src=/nets?name=gtdcsv >Metrics<//plot.view?w=800&h=600&x=Save_baseline$t&y=Save_baseline$y&src=/nets?name=gtdcsv>',0,0,1,112,18,0,40,1600,16,17,0,0,0,0,0,0.0369917,'2021-02-06 08:23:25',NULL);
/*!40000 ALTER TABLE `queues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizes`
--

DROP TABLE IF EXISTS `quizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quizes` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Client` varchar(64) DEFAULT NULL,
  `Topic` varchar(64) DEFAULT NULL,
  `Score` float DEFAULT NULL,
  `Pass` float DEFAULT NULL,
  `Certifies` datetime DEFAULT NULL,
  `Taken` datetime DEFAULT NULL,
  `Tries` int(11) DEFAULT '0',
  `Module` varchar(64) DEFAULT NULL,
  `Set` varchar(8) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizes`
--

LOCK TABLES `quizes` WRITE;
/*!40000 ALTER TABLE `quizes` DISABLE KEYS */;
/*!40000 ALTER TABLE `quizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `relays`
--

DROP TABLE IF EXISTS `relays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `relays` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `To` varchar(128) DEFAULT NULL,
  `From` varchar(128) DEFAULT NULL,
  `Rx` datetime DEFAULT NULL,
  `Message` mediumtext,
  `New` tinyint(1) DEFAULT '0',
  `Score` json DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `relays`
--

LOCK TABLES `relays` WRITE;
/*!40000 ALTER TABLE `relays` DISABLE KEYS */;
INSERT INTO `relays` VALUES (1,'tbd','guest@guest.org','2021-01-19 20:59:21','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4DfVkreLVngtMSAQdAs7EC/C1ZhUa0X4xAeKmTcxfJ9mhkaaIxoKjbzA3u\r\ndW0wzUNB0JVU+jBcexqq4dW1VTJjNcKJV2U+bYBlvbZ829miOmvRRgHrZ69j\r\nB8TQhqIp0kcBCOjcUKiYaNf96sl2UARqX82ZImnPUp89zGozYWmU9Q/JEEhW\r\nx4puacje1Gv9di1ZBL4lCJ8F/3Qjgam5r9JXvj/o66jadw==\r\n=GVJH\r\n-----END PGP MESSAGE-----\r\n',1,NULL),(2,'brian.d.james@comcast.com','guest@guest.org','2021-01-22 09:42:02','launch the death ray now',1,'{\"os\": 0.8636363636363636, \"terror\": 0.7727272727272727, \"Hopping\": 0, \"photons\": 1.0454545454545454, \"Activity\": 0.03922789539227895, \"Sentiment\": 0, \"Readability\": -10}'),(3,'brian.d.james@comcast.net','guest@guest.org','2021-01-22 09:43:20','this is a test',1,'{\"os\": 0.8636363636363636, \"terror\": 0.7727272727272727, \"Hopping\": 0, \"photons\": 1.0454545454545454, \"Activity\": 0.03920348475420037, \"Sentiment\": 0, \"Readability\": -8}'),(4,'guest@guest.org','guest@guest.org','2021-01-22 09:44:38','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4D12KgOYTWLTkSAQdANDfRGCzkEkBD7yfcEfz0C8qlNvOU1qnQgd6KaakQ\r\npi8wVUfEV8s4vF+WvdnRwnnFOfl9jaXM6o1XlkDuwjIjLYD3FjI4yyKdJ5Qk\r\n6Izwbl2a0lIBuFLog2lERCMjg9g4yTGXMhz6Rnb/1GKe+4X8NogxbSTeeWYj\r\nXplIL/7p1JF/9yVLXaXMP8P+sKZzWEMfc13ZEXBWA+bI93qvZ7bxF/Pa1El0\r\n=KpXK\r\n-----END PGP MESSAGE-----\r\n',1,NULL),(5,'guest@guest.org','guest@guest.org','2021-01-22 09:45:09','I love puppies and kitties',1,'{\"os\": 0.8636363636363636, \"terror\": 0.7727272727272727, \"Hopping\": 0, \"photons\": 1.0454545454545454, \"Activity\": 0.03915475450590429, \"Sentiment\": 0.12, \"Readability\": -10}'),(6,'guest@guest.org','guest@guest.org','2021-01-22 09:45:56','Die you fool',1,'{\"os\": 0.8636363636363636, \"terror\": 0.7727272727272727, \"Hopping\": 0, \"photons\": 1.0454545454545454, \"Activity\": 0.0391304347826087, \"Sentiment\": 0, \"Readability\": -6}'),(7,'guest@guest.org','guest@guest.org','2021-01-22 11:55:18','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4DpgfD+KKWNqoSAQdAjCc5Vos1qLYOmDJyaqxmEmPDjASg+r+hOjYDhsoR\r\nHDUwp1dnhrjMZkTxO7CO/Z3fcIv0rc4c0fVutI7GB0jrY3ZTFb7uyZnmVnu5\r\nsobXhjEm0kYBYX4jfdxwcWhQZscup2vY7GDc2R3E60U0MHaXwT56v4tS0D0w\r\ncC6Vp/wwFMDJPt9rWvBXMTFSjrnfI5zZywBu26ZcVvVq\r\n=fNmP\r\n-----END PGP MESSAGE-----\r\n',1,'{\"os\": 4.318181818181818, \"terror\": 3.8636363636363633, \"Hopping\": 0, \"photons\": 5.227272727272727, \"Activity\": 0.044853364002300174, \"Sentiment\": 0, \"Readability\": -52}'),(8,'guest@guest.org','guest@guest.org','2021-01-22 11:55:36','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4DK/zDIbLQmOQSAQdAdrtRSYLPMCsA893agBtoi80o5EbLXxiBbPt/kiCp\r\nvwAwCkEYbkqJzSGTR2tuIJH4wkae54iNR3LlK++hoE/8kpiX/8n+Ob8wGObw\r\n3krwnfao0kYBofKSRsMHH5/H9HVceRD3m1JXtF1OemDhOFEYDec/+z3tzsqg\r\nGLrppNlmzCnUGJp1l8JKEm9l6PWVDX9Ph2Qr+TXN0vst\r\n=0BZs\r\n-----END PGP MESSAGE-----\r\n',1,'{\"os\": 4.318181818181818, \"terror\": 3.8636363636363633, \"Hopping\": 0, \"photons\": 5.227272727272727, \"Activity\": 0.04542840713053479, \"Sentiment\": 0, \"Readability\": -60}'),(9,'guest@guest.org','guest@guest.org','2021-01-22 11:56:00','this is a test',1,'{\"os\": 0.8636363636363636, \"terror\": 0.7727272727272727, \"Hopping\": 0, \"photons\": 1.0454545454545454, \"Activity\": 0.04540229885057471, \"Sentiment\": 0, \"Readability\": -8}'),(10,'guest@guest.org','guest@guest.org','2021-01-22 13:10:10','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4DS3rVP5N3IVQSAQdAeCa0UAvlarFG/H9Bb3CjinVmVWJ6ZeZsHdVGWVpS\r\n7AMwlj4Yl1fFz1crC7szLzR8+lt1GxkVTk1gY/eHey7JlttcZkGA6xOAJ6aC\r\nThPinlwI0j0Bq24ZQrL9VkspzuKzVjDr6CTMlXEw+5XLeoAVx6VyRXi5Ifsq\r\nOX7RjyerHezbIHzzP0AOBQ+0FeyXyrI9\r\n=dO5f\r\n-----END PGP MESSAGE-----\r\n',1,'{\"os\": 3.4545454545454546, \"LDA\": {\"scores\": [[], [], [], [], []], \"topics\": [\"default\", \"cartel\", \"terror\", \"photons\", \"os\"]}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.044652701212789414, \"Sentiment\": 0, \"Readability\": -52}'),(11,'guest@guest.org','guest@guest.org','2021-01-22 13:14:36','this is a test and only a test',1,'{\"os\": 0.8636363636363636, \"LDA\": {\"scores\": [[], [], [], [], []], \"topics\": [\"default\", \"cartel\", \"terror\", \"photons\", \"os\"]}, \"terror\": 0.7727272727272727, \"Hopping\": 0, \"photons\": 1.0454545454545454, \"Activity\": 0.045104510451045104, \"Sentiment\": 0, \"Readability\": -16}'),(12,'guest@guest.org','guest@guest.org','2021-01-22 13:21:57','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": {\"scores\": [[], [], [], [], []], \"topics\": [\"default\", \"cartel\", \"terror\", \"photons\", \"os\"]}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.045454545454545456, \"Sentiment\": 0, \"Readability\": -32}'),(13,'guest@guest.org','guest@guest.org','2021-01-22 13:45:34','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": {\"scores\": [[], [], [], [], []], \"topics\": [\"default\", \"cartel\", \"terror\", \"photons\", \"os\"]}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.04542996214169821, \"Sentiment\": 0, \"Readability\": -32}'),(14,'guest@guest.org','guest@guest.org','2021-01-22 13:49:59','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"cats\", \"probability\": 0.18}, {\"term\": \"dogs\", \"probability\": 0.15}, {\"term\": \"small\", \"probability\": 0.13}, {\"term\": \"chase\", \"probability\": 0.12}], [{\"term\": \"dogs\", \"probability\": 0.15}, {\"term\": \"cats\", \"probability\": 0.15}, {\"term\": \"small\", \"probability\": 0.13}, {\"term\": \"mice\", \"probability\": 0.13}], [{\"term\": \"cats\", \"probability\": 0.16}, {\"term\": \"dogs\", \"probability\": 0.14}, {\"term\": \"small\", \"probability\": 0.13}, {\"term\": \"eat\", \"probability\": 0.12}], [{\"term\": \"dogs\", \"probability\": 0.16}, {\"term\": \"cats\", \"probability\": 0.14}, {\"term\": \"eat\", \"probability\": 0.13}, {\"term\": \"big\", \"probability\": 0.13}], [{\"term\": \"dogs\", \"probability\": 0.17}, {\"term\": \"cats\", \"probability\": 0.15}, {\"term\": \"big\", \"probability\": 0.14}, {\"term\": \"bones\", \"probability\": 0.12}]], \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.04584681769147789, \"Sentiment\": 0, \"Readability\": -32}'),(15,'guest@guest.org','guest@guest.org','2021-01-22 14:13:20','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.2}, {\"term\": \"cats\", \"probability\": 0.2}, {\"term\": \"eat\", \"probability\": 0.1}, {\"term\": \"bones\", \"probability\": 0.1}, {\"term\": \"big\", \"probability\": 0.1}], [{\"term\": \"dogs\", \"probability\": 0.2}, {\"term\": \"cats\", \"probability\": 0.2}, {\"term\": \"small\", \"probability\": 0.1}, {\"term\": \"mice\", \"probability\": 0.1}, {\"term\": \"chase\", \"probability\": 0.1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.046883324453915826, \"Sentiment\": 0, \"Readability\": -32}'),(16,'guest@guest.org','guest@guest.org','2021-01-22 14:15:01','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"cats\", \"probability\": 0.26}, {\"term\": \"dogs\", \"probability\": 0.15}, {\"term\": \"small\", \"probability\": 0.12}, {\"term\": \"mice\", \"probability\": 0.12}, {\"term\": \"chase\", \"probability\": 0.12}], [{\"term\": \"dogs\", \"probability\": 0.25}, {\"term\": \"cats\", \"probability\": 0.14}, {\"term\": \"eat\", \"probability\": 0.13}, {\"term\": \"bones\", \"probability\": 0.12}, {\"term\": \"big\", \"probability\": 0.12}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"dog\": 0, \"bomb\": 0, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.04736562001064396, \"Sentiment\": 0, \"Readability\": -32}'),(17,'guest@guest.org','guest@guest.org','2021-01-22 14:22:22','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"cats\", \"probability\": 0.24}, {\"term\": \"dogs\", \"probability\": 0.16}, {\"term\": \"small\", \"probability\": 0.12}, {\"term\": \"mice\", \"probability\": 0.12}, {\"term\": \"chase\", \"probability\": 0.12}], [{\"term\": \"dogs\", \"probability\": 0.24}, {\"term\": \"cats\", \"probability\": 0.16}, {\"term\": \"eat\", \"probability\": 0.12}, {\"term\": \"bones\", \"probability\": 0.12}, {\"term\": \"big\", \"probability\": 0.12}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.04878048780487805, \"Sentiment\": 0, \"Readability\": -32}'),(18,'guest@guest.org','guest@guest.org','2021-01-22 14:29:05','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.24}, {\"term\": \"cats\", \"probability\": 0.16}, {\"term\": \"eat\", \"probability\": 0.12}, {\"term\": \"bones\", \"probability\": 0.12}, {\"term\": \"big\", \"probability\": 0.12}], [{\"term\": \"cats\", \"probability\": 0.24}, {\"term\": \"dogs\", \"probability\": 0.16}, {\"term\": \"small\", \"probability\": 0.12}, {\"term\": \"mice\", \"probability\": 0.12}, {\"term\": \"chase\", \"probability\": 0.12}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.05018489170628632, \"Sentiment\": 0, \"Readability\": -32}'),(19,'guest@guest.org','guest@guest.org','2021-01-22 14:31:57','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.23}, {\"term\": \"cats\", \"probability\": 0.18}, {\"term\": \"eat\", \"probability\": 0.11}, {\"term\": \"bones\", \"probability\": 0.11}, {\"term\": \"big\", \"probability\": 0.11}], [{\"term\": \"cats\", \"probability\": 0.22}, {\"term\": \"dogs\", \"probability\": 0.17}, {\"term\": \"small\", \"probability\": 0.11}, {\"term\": \"mice\", \"probability\": 0.11}, {\"term\": \"chase\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.05063291139240506, \"Sentiment\": 0, \"Readability\": -32}'),(20,'guest@guest.org','guest@guest.org','2021-01-22 14:35:51','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.22}, {\"term\": \"cats\", \"probability\": 0.17}, {\"term\": \"bones\", \"probability\": 0.12}, {\"term\": \"eat\", \"probability\": 0.11}, {\"term\": \"big\", \"probability\": 0.11}], [{\"term\": \"cats\", \"probability\": 0.23}, {\"term\": \"dogs\", \"probability\": 0.17}, {\"term\": \"mice\", \"probability\": 0.12}, {\"term\": \"small\", \"probability\": 0.11}, {\"term\": \"chase\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.05105263157894737, \"Sentiment\": 0, \"Readability\": -32}'),(21,'guest@guest.org','guest@guest.org','2021-01-22 14:38:46','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.22}, {\"term\": \"cats\", \"probability\": 0.17}, {\"term\": \"eat\", \"probability\": 0.11}, {\"term\": \"bones\", \"probability\": 0.11}, {\"term\": \"big\", \"probability\": 0.11}], [{\"term\": \"cats\", \"probability\": 0.22}, {\"term\": \"dogs\", \"probability\": 0.18}, {\"term\": \"small\", \"probability\": 0.11}, {\"term\": \"mice\", \"probability\": 0.11}, {\"term\": \"chase\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.05152471083070452, \"Sentiment\": 0, \"Readability\": -32}'),(22,'guest@guest.org','guest@guest.org','2021-01-22 14:41:32','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.2}, {\"term\": \"cats\", \"probability\": 0.2}, {\"term\": \"small\", \"probability\": 0.1}, {\"term\": \"eat\", \"probability\": 0.1}, {\"term\": \"bones\", \"probability\": 0.1}], [{\"term\": \"dogs\", \"probability\": 0.2}, {\"term\": \"cats\", \"probability\": 0.2}, {\"term\": \"mice\", \"probability\": 0.1}, {\"term\": \"chase\", \"probability\": 0.1}, {\"term\": \"big\", \"probability\": 0.1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.05249343832020997, \"Sentiment\": 0, \"Readability\": -32}'),(23,'guest@guest.org','guest@guest.org','2021-01-22 14:42:51','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"cats\", \"probability\": 0.26}, {\"term\": \"dogs\", \"probability\": 0.14}, {\"term\": \"small\", \"probability\": 0.13}, {\"term\": \"mice\", \"probability\": 0.13}, {\"term\": \"chase\", \"probability\": 0.13}], [{\"term\": \"dogs\", \"probability\": 0.26}, {\"term\": \"cats\", \"probability\": 0.14}, {\"term\": \"eat\", \"probability\": 0.13}, {\"term\": \"bones\", \"probability\": 0.13}, {\"term\": \"big\", \"probability\": 0.13}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.05243838489774515, \"Sentiment\": 0, \"Readability\": -32}'),(24,'guest@guest.org','guest@guest.org','2021-01-22 14:50:55','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"cats\", \"probability\": 0.23}, {\"term\": \"dogs\", \"probability\": 0.17}, {\"term\": \"small\", \"probability\": 0.11}, {\"term\": \"mice\", \"probability\": 0.11}, {\"term\": \"chase\", \"probability\": 0.11}], [{\"term\": \"dogs\", \"probability\": 0.22}, {\"term\": \"cats\", \"probability\": 0.17}, {\"term\": \"bones\", \"probability\": 0.12}, {\"term\": \"eat\", \"probability\": 0.11}, {\"term\": \"big\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"Hopping\": 0, \"photons\": 4.181818181818182, \"Activity\": 0.05274151436031332, \"Sentiment\": 0, \"Readability\": -32}'),(25,'guest@guest.org','guest@guest.org','2021-01-22 14:58:29','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.21}, {\"term\": \"cats\", \"probability\": 0.19}, {\"term\": \"small\", \"probability\": 0.1}, {\"term\": \"eat\", \"probability\": 0.1}, {\"term\": \"bones\", \"probability\": 0.1}], [{\"term\": \"cats\", \"probability\": 0.21}, {\"term\": \"dogs\", \"probability\": 0.19}, {\"term\": \"mice\", \"probability\": 0.11}, {\"term\": \"small\", \"probability\": 0.1}, {\"term\": \"chase\", \"probability\": 0.1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"photons\": 4.181818181818182, \"Sentiment\": 0, \"Readability\": -32}'),(26,'guest@guest.org','guest@guest.org','2021-01-22 15:15:48','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"cats\", \"probability\": 0.22}, {\"term\": \"dogs\", \"probability\": 0.18}, {\"term\": \"small\", \"probability\": 0.11}, {\"term\": \"mice\", \"probability\": 0.11}, {\"term\": \"chase\", \"probability\": 0.11}], [{\"term\": \"dogs\", \"probability\": 0.22}, {\"term\": \"cats\", \"probability\": 0.18}, {\"term\": \"eat\", \"probability\": 0.11}, {\"term\": \"bones\", \"probability\": 0.11}, {\"term\": \"big\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"photons\": 4.181818181818182, \"Sentiment\": 0, \"Readability\": -32}'),(27,'guest@guest.org','guest@guest.org','2021-01-22 15:18:02','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"os\": 3.4545454545454546, \"LDA\": [[{\"term\": \"dogs\", \"probability\": 0.26}, {\"term\": \"cats\", \"probability\": 0.14}, {\"term\": \"eat\", \"probability\": 0.13}, {\"term\": \"bones\", \"probability\": 0.13}, {\"term\": \"big\", \"probability\": 0.13}], [{\"term\": \"cats\", \"probability\": 0.26}, {\"term\": \"dogs\", \"probability\": 0.14}, {\"term\": \"small\", \"probability\": 0.13}, {\"term\": \"mice\", \"probability\": 0.13}, {\"term\": \"chase\", \"probability\": 0.13}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"terror\": 3.090909090909091, \"photons\": 4.181818181818182, \"Sentiment\": 0, \"Readability\": -32}'),(28,'guest@guest.org','guest@guest.org','2021-01-22 16:00:42','Cats are small. Dogs are big. Cats like to chase mice. Dogs like to eat bones.',1,'{\"LDA\": [[{\"term\": \"cats\", \"probability\": 0.23}, {\"term\": \"dogs\", \"probability\": 0.17}, {\"term\": \"small\", \"probability\": 0.11}, {\"term\": \"mice\", \"probability\": 0.11}, {\"term\": \"chase\", \"probability\": 0.11}], [{\"term\": \"dogs\", \"probability\": 0.23}, {\"term\": \"cats\", \"probability\": 0.17}, {\"term\": \"eat\", \"probability\": 0.11}, {\"term\": \"bones\", \"probability\": 0.11}, {\"term\": \"big\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 2.5753641449035616, \"dogs\": 2.5753641449035616, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -32}'),(29,'guest@guest.org','guest@guest.org','2021-01-22 16:02:16','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4DM+o8udfibe4SAQdAJeaOF9ow1ZZNVKOHKNkTCbbL8uekVKT7+5SuM2+t\r\n9Bcw/W+vglPXVmfBRuuSP8dw3WkEXmWwydtOAkrBiu+JwnpYZps6GAdweBhD\r\nn3B/MY1A0jwBHrqFZgs/YVz+wQpx6GCS8knAQoEO0OtRebCkBBMZGR3SD6OG\r\n4l0HnZhg/bUgHXhYgcco8o+J09eTHWg=\r\n=bjT4\r\n-----END PGP MESSAGE-----\r\n',1,'{\"LDA\": [[{\"term\": \"v4\", \"probability\": 0.14}, {\"term\": \"js\", \"probability\": 0.14}, {\"term\": \"comment\", \"probability\": 0.13}, {\"term\": \"10\", \"probability\": 0.13}, {\"term\": \"message\", \"probability\": 0.12}], [{\"term\": \"v4\", \"probability\": 0.15}, {\"term\": \"js\", \"probability\": 0.15}, {\"term\": \"comment\", \"probability\": 0.14}, {\"term\": \"10\", \"probability\": 0.14}, {\"term\": \"version\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -64}'),(30,'guest@guest.org','guest@guest.org','2021-01-22 16:06:08','The Sinola killed everyone in the town.#terror',1,'{\"LDA\": [[{\"term\": \"killed\", \"probability\": 0.35}, {\"term\": \"town\", \"probability\": 0.33}, {\"term\": \"sinola\", \"probability\": 0.32}], [{\"term\": \"sinola\", \"probability\": 0.35}, {\"term\": \"town\", \"probability\": 0.34}, {\"term\": \"killed\", \"probability\": 0.32}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 2, \"Sentiment\": -0.028571428571428577, \"Readability\": -11}'),(31,'guest@guest.org','guest@guest.org','2021-01-25 13:04:50','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4DnonG1sUXC1ESAQdAvZmaweBGzwlQNj4JlpzoPa30D62FdkkDGAb0sHmy\r\nvzAwmsAHEHm86vj4AMvC4It/slvk32WMaY7BDxakyjFYE0VIFbh+UwhrEe2t\r\nOm3l/pnk0jsBUkkWj+gwww/k0wsNslJwhHM0tKjamqPhj7AFVyBBKK+iuJcZ\r\nmpYsnf6P222Fk/EvF8GUSl0R4NZveQ==\r\n=/i2S\r\n-----END PGP MESSAGE-----\r\n',1,'{\"LDA\": [[{\"term\": \"v4\", \"probability\": 0.14}, {\"term\": \"js\", \"probability\": 0.14}, {\"term\": \"comment\", \"probability\": 0.13}, {\"term\": \"10\", \"probability\": 0.13}, {\"term\": \"version\", \"probability\": 0.11}], [{\"term\": \"comment\", \"probability\": 0.15}, {\"term\": \"10\", \"probability\": 0.15}, {\"term\": \"v4\", \"probability\": 0.14}, {\"term\": \"js\", \"probability\": 0.14}, {\"term\": \"pgp\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -56}'),(32,'brian.d.james@comcast.net','guest@guest.org','2021-01-25 17:34:43','hello there',1,'{\"LDA\": [[], []], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -4}'),(33,'guest@totem.org','guest@totem.org','2021-01-27 07:40:43','abc',1,'{\"LDA\": [[{\"term\": \"abc\", \"probability\": 1}], [{\"term\": \"abc\", \"probability\": 1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -2}'),(34,'guest@totem.org','guest@totem.org','2021-01-27 07:50:32','abc',1,'{\"LDA\": [[{\"term\": \"abc\", \"probability\": 1}], [{\"term\": \"abc\", \"probability\": 1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -2}'),(35,'guest@totem.org','guest@totem.org','2021-01-27 08:21:41','abc',1,'{\"LDA\": [[{\"term\": \"abc\", \"probability\": 1}], [{\"term\": \"abc\", \"probability\": 1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -2}'),(36,'guest@totem.org','guest@totem.org','2021-01-27 10:46:18','hello there',1,'{\"LDA\": [[], []], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -4}'),(37,'guest@totem.org','guest@totem.org','2021-01-27 15:14:02','this test',1,'{\"LDA\": [[{\"term\": \"test\", \"probability\": 1}], [{\"term\": \"test\", \"probability\": 1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -4}'),(38,'brian.d.james@comcast.net','guest@totem.org','2021-01-27 22:54:30','hello',1,'{\"LDA\": [[], []], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -2}'),(39,'brian.d.james@comcast.net','brian.d.james@comcast.net','2021-01-29 16:23:19','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4DqirTaC8L6iMSAQdAb0BlqzcfejY8G/Ojh/elLqbpiy2jwEYBhnm/4k4b\r\nxQIwSD3O/fMvUe3FHq4imvyS8AMOuwIKU3CG9xNzeXhUU+xK4HPKkUEYNr6l\r\n0VdpRGbb0jwBBexuISp5J1QiuPX2QhAJXglk/0U4K3kyb5xJ1M89eErv1LHZ\r\nJp/tkTegs9/LFLn+zOhozKkKxD4jWho=\r\n=sOKF\r\n-----END PGP MESSAGE-----\r\n',1,'{\"LDA\": [[{\"term\": \"v4\", \"probability\": 0.15}, {\"term\": \"js\", \"probability\": 0.15}, {\"term\": \"comment\", \"probability\": 0.14}, {\"term\": \"10\", \"probability\": 0.13}, {\"term\": \"message\", \"probability\": 0.11}], [{\"term\": \"10\", \"probability\": 0.14}, {\"term\": \"v4\", \"probability\": 0.13}, {\"term\": \"js\", \"probability\": 0.13}, {\"term\": \"comment\", \"probability\": 0.13}, {\"term\": \"pgp\", \"probability\": 0.12}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -60}'),(40,'brian.d.james@comcast.net','brian.d.james@comcast.net','2021-01-29 16:41:37','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwV4Dhev02QJx/swSAQdAqwGsADJCZvY670XKsns54mh9vEV8rNirkvcoq1Ad\r\nFl8wNg+dB/YRSsi5jXzd3g8rag5tg7Q+YHQUX7UafnuT1T0uKolOr7H9jdwh\r\nrtjeWRY/0jwBBA1njGuw9fb/oC2J0EXeETvBjRA7pEu70j1OQmLGhssR01Nk\r\nomVlKWtOVA4nhIJdiY4kGhd/QOFMyE0=\r\n=eeXN\r\n-----END PGP MESSAGE-----\r\n',1,'{\"LDA\": [[{\"term\": \"comment\", \"probability\": 0.15}, {\"term\": \"v4\", \"probability\": 0.14}, {\"term\": \"js\", \"probability\": 0.14}, {\"term\": \"10\", \"probability\": 0.14}, {\"term\": \"pgp\", \"probability\": 0.11}], [{\"term\": \"v4\", \"probability\": 0.14}, {\"term\": \"js\", \"probability\": 0.14}, {\"term\": \"10\", \"probability\": 0.14}, {\"term\": \"comment\", \"probability\": 0.13}, {\"term\": \"version\", \"probability\": 0.11}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -56}'),(41,'brian.d.james@nga.mil','scottj338@comcast.net','2021-01-31 19:53:18','In The Clear?',1,'{\"LDA\": [[{\"term\": \"clear\", \"probability\": 1}], [{\"term\": \"clear\", \"probability\": 1}]], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0.1, \"Readability\": -6}'),(42,'guest::ffff:10.0.0.2@totem.org','guest::1@totem.org','2021-02-03 14:00:56','hello',1,'{\"LDA\": [[], []], \"Freqs\": {\"CTO\": 0, \"DTO\": 0, \"bomb\": 0, \"cats\": 0, \"dogs\": 0, \"cartel\": 0, \"system\": 0, \"weapon\": 0}, \"Topic\": 0, \"Sentiment\": 0, \"Readability\": -2}');
/*!40000 ALTER TABLE `relays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `releases`
--

DROP TABLE IF EXISTS `releases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `releases` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `_Fails` int(11) DEFAULT NULL,
  `_Partner` varchar(255) DEFAULT NULL,
  `_EndService` varchar(255) DEFAULT NULL,
  `_Published` datetime DEFAULT NULL,
  `Product` varchar(64) DEFAULT NULL,
  `_Product` varchar(64) DEFAULT NULL,
  `Path` varchar(64) DEFAULT NULL,
  `_License` varchar(255) DEFAULT NULL,
  `_Copies` int(11) DEFAULT NULL,
  `_EndServiceID` varchar(255) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`_License`,`_EndServiceID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `releases`
--

LOCK TABLES `releases` WRITE;
/*!40000 ALTER TABLE `releases` DISABLE KEYS */;
INSERT INTO `releases` VALUES (1,NULL,'guest::1@totem.org','//localhost:8080/nets.exe','2021-02-21 17:46:58','nets.js','nets.js','/nets.js','b261b9c278a424401616759da417a9895fa6eaef7d037ff3f605700eac4f1e2f',2,'3f95016c7fd12997fe589b92d8c8560f70d5c1ad05e0a52b1a7cd3b87ec98c23');
/*!40000 ALTER TABLE `releases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reqts`
--

DROP TABLE IF EXISTS `reqts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reqts` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Type` varchar(8) DEFAULT NULL,
  `Status` varchar(8) DEFAULT NULL,
  `Reqt` mediumtext,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM reads to status totem requirements';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reqts`
--

LOCK TABLES `reqts` WRITE;
/*!40000 ALTER TABLE `reqts` DISABLE KEYS */;
/*!40000 ALTER TABLE `reqts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `riddles`
--

DROP TABLE IF EXISTS `riddles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `riddles` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Client` varchar(64) DEFAULT NULL,
  `Made` datetime DEFAULT NULL,
  `Attempts` int(11) DEFAULT NULL,
  `maxAttempts` int(11) DEFAULT NULL,
  `Riddle` mediumtext,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`Client`)
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=latin1 COMMENT='TOTEM antibot protection accessed when a client connect';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `riddles`
--

LOCK TABLES `riddles` WRITE;
/*!40000 ALTER TABLE `riddles` DISABLE KEYS */;
INSERT INTO `riddles` VALUES (128,'guest@guest.org','2021-01-26 12:52:04',0,5,NULL),(237,'guest@totem.org','2021-01-31 17:12:49',0,5,'11'),(250,'guest::1@totem.org','2021-02-02 23:35:58',0,5,'33');
/*!40000 ALTER TABLE `riddles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saves`
--

DROP TABLE IF EXISTS `saves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `saves` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Client` varchar(64) DEFAULT NULL,
  `Content` mediumtext,
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `KeyID` (`Client`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saves`
--

LOCK TABLES `saves` WRITE;
/*!40000 ALTER TABLE `saves` DISABLE KEYS */;
INSERT INTO `saves` VALUES (1,'guest@guest.org','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwy4ECQMIviFNPaoQaVfgVxGDgLqUWCZkgrBloZfWwsIUHcxv2D+8nPCQpCGr\r\nC7R+0osB0U4Eztu3jhelSFr+T2+9c1S1HdmdKlo4HDF0acwCGwxK8BLAFZVS\r\nR2jQ7RlwgqMrjG9ZvbUqgb1Cy2qLcf8m532Nm0lSLF5BuW85vpyhnkDsn0fN\r\nPATb4nUlPXMSx4aOL9UrE/HkqHsuwQR7qiBTvhCLgKE03ck7Z3h8zzJky62o\r\nQNuvIchamot3\r\n=tT7q\r\n-----END PGP MESSAGE-----\r\n'),(2,'guest@totem.org','-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.10.9\r\nComment: https://openpgpjs.org\r\n\r\nwy4ECQMIskRNnWcKWWLgscoy8NGADZ7sAmoV2RksYyuFvljzAXi/OGjZhWtz\r\nBXly0joBURSDDp75T/3WXt1X6zmum5MXb4ns6/D7grTa0iJSewSg+CK8diSB\r\nSv9LcUIOuFv1J5wY5mhaekhn\r\n=7cum\r\n-----END PGP MESSAGE-----\r\n');
/*!40000 ALTER TABLE `saves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Client` varchar(64) DEFAULT NULL,
  `Opened` datetime DEFAULT NULL,
  `Closed` datetime DEFAULT NULL,
  `Location` varchar(64) DEFAULT NULL,
  `IP` varchar(16) DEFAULT NULL,
  `Agent` varchar(128) DEFAULT NULL,
  `Platform` varchar(64) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=latin1 COMMENT='TOTEM updates when a client session is established';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (1,'guest@guest.org','2021-01-21 06:55:47',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(2,'guest@guest.org','2021-01-21 06:56:20',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(3,'guest@guest.org','2021-01-21 07:12:44',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(4,'guest@guest.org','2021-01-21 07:15:38',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(5,'guest@guest.org','2021-01-21 07:17:47',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(6,'guest@guest.org','2021-01-21 07:19:07',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(7,'guest@guest.org','2021-01-21 07:26:16',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(8,'guest@guest.org','2021-01-21 07:27:17',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(9,'guest@guest.org','2021-01-21 07:28:50',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(10,'guest@guest.org','2021-01-21 07:30:52',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(11,'guest@guest.org','2021-01-21 07:33:06',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(12,'guest@guest.org','2021-01-21 07:34:25',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(13,'guest@guest.org','2021-01-21 07:39:24',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(14,'guest@guest.org','2021-01-21 07:39:47',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(15,'guest@guest.org','2021-01-21 08:12:27',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(16,'guest@guest.org','2021-01-21 08:22:34',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(17,'guest@guest.org','2021-01-21 08:24:13',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(18,'guest@guest.org','2021-01-21 08:24:44',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(19,'guest@guest.org','2021-01-21 08:48:10',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(20,'guest@guest.org','2021-01-21 09:02:05',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(21,'guest@guest.org','2021-01-21 11:25:57',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(22,'guest@guest.org','2021-01-21 11:36:20',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(23,'guest@guest.org','2021-01-21 11:39:55',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(24,'guest@guest.org','2021-01-21 11:42:35',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(25,'guest@guest.org','2021-01-21 12:02:52',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(26,'guest@guest.org','2021-01-21 12:12:37',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(27,'guest@guest.org','2021-01-21 12:37:52',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(28,'guest@guest.org','2021-01-21 13:18:02',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(29,'guest@guest.org','2021-01-21 13:24:28',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(30,'guest@guest.org','2021-01-21 13:25:00',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(31,'guest@guest.org','2021-01-21 13:36:24',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(32,'guest@guest.org','2021-01-21 13:37:52',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(33,'guest@guest.org','2021-01-21 13:38:15',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(34,'guest@guest.org','2021-01-21 13:51:10',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(35,'guest@guest.org','2021-01-21 14:05:22',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(36,'guest@guest.org','2021-01-21 14:08:37',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(37,'guest@guest.org','2021-01-21 14:11:55',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(38,'guest@guest.org','2021-01-21 14:12:47',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(39,'guest@guest.org','2021-01-21 14:13:26',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(40,'guest@guest.org','2021-01-21 14:14:58',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(41,'guest@guest.org','2021-01-21 14:15:14',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(42,'guest@guest.org','2021-01-21 14:16:19',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(43,'guest@guest.org','2021-01-21 14:17:08',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(44,'guest@guest.org','2021-01-21 14:19:32',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(45,'guest@guest.org','2021-01-21 14:20:15',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(46,'guest@guest.org','2021-01-21 14:35:15',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(47,'guest@guest.org','2021-01-21 14:35:25',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(48,'guest@guest.org','2021-01-21 14:41:27',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(49,'guest@guest.org','2021-01-21 14:42:39',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(50,'guest@guest.org','2021-01-21 15:00:41',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(51,'guest@guest.org','2021-01-21 15:04:50',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(52,'guest@guest.org','2021-01-21 15:11:43',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(53,'guest@guest.org','2021-01-21 15:15:11',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(54,'guest@guest.org','2021-01-21 15:17:47',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(55,'guest@guest.org','2021-01-21 15:23:12',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(56,'guest@guest.org','2021-01-21 22:12:03',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(57,'guest@guest.org','2021-01-21 22:32:23',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(58,'guest@guest.org','2021-01-21 22:40:59',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(59,'guest@guest.org','2021-01-21 22:47:52',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(60,'guest@guest.org','2021-01-21 22:49:11',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(61,'guest@guest.org','2021-01-21 22:52:13',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(62,'guest@guest.org','2021-01-21 22:58:53',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(63,'guest@guest.org','2021-01-22 09:41:55',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(64,'guest@guest.org','2021-01-22 10:29:13',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(65,'guest@guest.org','2021-01-22 10:29:25',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(66,'guest@guest.org','2021-01-22 10:31:55',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(67,'guest@guest.org','2021-01-22 10:39:05',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(68,'guest@guest.org','2021-01-22 10:39:30',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(69,'guest@guest.org','2021-01-22 10:42:19',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(70,'guest@guest.org','2021-01-22 10:43:13',NULL,NULL,NULL,'Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(71,'guest@guest.org','2021-01-22 10:44:32',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(72,'guest@guest.org','2021-01-22 10:47:31',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(73,'guest@guest.org','2021-01-22 11:05:24',NULL,'nowherestan','0.0.0.0','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(74,'guest@guest.org','2021-01-22 11:05:37',NULL,'nowherestan','0.0.0.0','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(75,'guest@guest.org','2021-01-22 11:06:54',NULL,'nowherestan','0.0.0.0','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(76,'guest@guest.org','2021-01-22 11:09:26',NULL,'?','0','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(77,'guest@guest.org','2021-01-22 11:09:46',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(78,'guest@guest.org','2021-01-22 11:54:40',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(79,'guest@guest.org','2021-01-22 11:55:29',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(80,'guest@guest.org','2021-01-22 13:05:06',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(81,'guest@guest.org','2021-01-22 13:07:13',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(82,'guest@guest.org','2021-01-22 13:14:30',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(83,'guest@guest.org','2021-01-22 13:21:50',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(84,'guest@guest.org','2021-01-22 13:45:21',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(85,'guest@guest.org','2021-01-22 13:49:54',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(86,'guest@guest.org','2021-01-22 14:08:20',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(87,'guest@guest.org','2021-01-22 14:10:11',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(88,'guest@guest.org','2021-01-22 14:13:01',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(89,'guest@guest.org','2021-01-22 14:14:50',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(90,'guest@guest.org','2021-01-22 14:19:13',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(91,'guest@guest.org','2021-01-22 14:19:17',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(92,'guest@guest.org','2021-01-22 14:22:16',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(93,'guest@guest.org','2021-01-22 14:27:07',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(94,'guest@guest.org','2021-01-22 14:27:55',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(95,'guest@guest.org','2021-01-22 14:28:55',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(96,'guest@guest.org','2021-01-22 14:31:50',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(97,'guest@guest.org','2021-01-22 14:35:43',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(98,'guest@guest.org','2021-01-22 14:38:41',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(99,'guest@guest.org','2021-01-22 14:40:25',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(100,'guest@guest.org','2021-01-22 14:41:28',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(101,'guest@guest.org','2021-01-22 14:50:43',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(102,'guest@guest.org','2021-01-22 14:57:19',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(103,'guest@guest.org','2021-01-22 14:58:25',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(104,'guest@guest.org','2021-01-22 15:15:40',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(105,'guest@guest.org','2021-01-22 15:17:58',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(106,'guest@guest.org','2021-01-22 16:00:36',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(107,'guest@guest.org','2021-01-22 16:06:01',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(108,'guest@guest.org','2021-01-24 21:39:29',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(109,'guest@guest.org','2021-01-24 21:41:34',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(110,'guest@guest.org','2021-01-24 21:43:42',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(111,'guest@guest.org','2021-01-24 21:44:11',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(112,'guest@guest.org','2021-01-24 21:52:42',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(113,'guest@guest.org','2021-01-24 22:17:35',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(114,'guest@guest.org','2021-01-24 22:28:05',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(115,'guest@guest.org','2021-01-24 22:50:03',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(116,'guest@guest.org','2021-01-24 22:50:43',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(117,'guest@guest.org','2021-01-24 23:01:09',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(118,'guest@guest.org','2021-01-24 23:09:55',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(119,'guest@guest.org','2021-01-24 23:29:55',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(120,'guest@guest.org','2021-01-24 23:42:02',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(121,'guest@guest.org','2021-01-24 23:47:17',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64'),(122,'guest@guest.org','2021-01-25 09:46:48',NULL,'POINT(0 0)','10.0.2.15','Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Firefox/68.0','Linux x86_64');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `syslogs`
--

DROP TABLE IF EXISTS `syslogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `syslogs` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Node` varchar(32) DEFAULT NULL,
  `Client` varchar(64) DEFAULT NULL,
  `Table` varchar(16) DEFAULT NULL,
  `At` datetime DEFAULT NULL,
  `Case` varchar(32) DEFAULT NULL,
  `Action` varchar(8) DEFAULT NULL,
  `Module` varchar(8) DEFAULT NULL,
  `cpuUtil` float DEFAULT NULL,
  `memUtil` float DEFAULT NULL,
  `Message` mediumtext,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2043 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `syslogs`
--

LOCK TABLES `syslogs` WRITE;
/*!40000 ALTER TABLE `syslogs` DISABLE KEYS */;
INSERT INTO `syslogs` VALUES (1923,'acmesds.0','guest@guest.org','nets','2021-01-18 21:39:00','gtdpub','select','pipe',0,0,'options'),(1924,'acmesds.0','guest@guest.org','nets','2021-01-18 21:39:00','gtdpub','select','pipe',0,0,'train'),(1925,'acmesds.0','guest@guest.org','nets','2021-01-18 21:42:24','gtdpub','select','pipe',0,0,'options'),(1926,'acmesds.0','guest@guest.org','nets','2021-01-18 21:42:24','gtdpub','select','pipe',0,0,'train'),(1927,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:15:26','gtdcsv','select','pipe',0,0,'baseline'),(1928,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:15:26','gtdcsv','select','pipe',0,0,'options'),(1929,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:24:04','gtdcsv','select','pipe',0,0,'options'),(1930,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:24:04','gtdcsv','select','pipe',0,0,'baseline'),(1931,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:25:48','gtdcsv','select','pipe',0,0,'options'),(1932,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:25:48','gtdcsv','select','pipe',0,0,'baseline'),(1933,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:32:10','gtdcsv','select','pipe',0,0,'options'),(1934,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:32:10','gtdcsv','select','pipe',0,0,'baseline'),(1935,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:35:04','gtdcsv','select','pipe',0,0,'options'),(1936,'acmesds.0','guest::1@totem.org','nets','2021-02-05 14:35:04','gtdcsv','select','pipe',0,0,'baseline'),(1937,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:30:54','gtdcsv','select','pipe',0,0,'baseline'),(1938,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:30:54','gtdcsv','select','pipe',0,0,'options'),(1939,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:32:00','gtdcsv','select','pipe',0,0,'options'),(1940,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:32:00','gtdcsv','select','pipe',0,0,'baseline'),(1941,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:33:30','gtdcsv','select','pipe',0,0,'baseline'),(1942,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:33:30','gtdcsv','select','pipe',0,0,'options'),(1943,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:36:11','gtdcsv','select','pipe',0,0,'baseline'),(1944,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:36:11','gtdcsv','select','pipe',0,0,'options'),(1945,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:37:10','gtdcsv','select','pipe',0,0,'baseline'),(1946,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:37:10','gtdcsv','select','pipe',0,0,'options'),(1947,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:40:34','gtdcsv','select','pipe',0,0,'options'),(1948,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:40:34','gtdcsv','select','pipe',0,0,'baseline'),(1949,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:42:00','gtdcsv','select','pipe',0,0,'options'),(1950,'acmesds.0','guest::1@totem.org','nets','2021-02-05 16:42:00','gtdcsv','select','pipe',0,0,'baseline'),(1951,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:06:54','gtdcsv','select','pipe',0,0,'options'),(1952,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:06:54','gtdcsv','select','pipe',0,0,'baseline'),(1953,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:07:47','gtdcsv','select','pipe',0,0,'options'),(1954,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:07:47','gtdcsv','select','pipe',0,0,'baseline'),(1955,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:46:22','gtdcsv','select','pipe',0,0,'options'),(1956,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:46:22','gtdcsv','select','pipe',0,0,'baseline'),(1957,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:50:05','gtdcsv','select','pipe',0,0,'baseline'),(1958,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:50:05','gtdcsv','select','pipe',0,0,'options'),(1959,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:51:54','gtdcsv','select','pipe',0,0,'options'),(1960,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:51:54','gtdcsv','select','pipe',0,0,'baseline'),(1961,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:54:10','gtdcsv','select','pipe',0,0,'options'),(1962,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:54:10','gtdcsv','select','pipe',0,0,'baseline'),(1963,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:58:25','gtdcsv','select','pipe',0,0,'baseline'),(1964,'acmesds.0','guest::1@totem.org','nets','2021-02-05 17:58:25','gtdcsv','select','pipe',0,0,'options'),(1965,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:00:28','gtdcsv','select','pipe',0,0,'baseline'),(1966,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:00:28','gtdcsv','select','pipe',0,0,'options'),(1967,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:05:05','gtdcsv','select','pipe',0,0,'options'),(1968,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:05:05','gtdcsv','select','pipe',0,0,'baseline'),(1969,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:07:03','gtdcsv','select','pipe',0,0,'options'),(1970,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:07:03','gtdcsv','select','pipe',0,0,'baseline'),(1971,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:08:29','gtdcsv','select','pipe',0,0,'options'),(1972,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:08:29','gtdcsv','select','pipe',0,0,'baseline'),(1973,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:13:35','gtdcsv','select','pipe',0,0,'options'),(1974,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:13:35','gtdcsv','select','pipe',0,0,'baseline'),(1975,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:18:09','gtdcsv','select','pipe',0,0,'options'),(1976,'acmesds.0','guest::1@totem.org','nets','2021-02-05 18:18:09','gtdcsv','select','pipe',0,0,'baseline'),(1977,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:10:21','gtdcsv','select','pipe',0,0,'baseline'),(1978,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:10:21','gtdcsv','select','pipe',0,0,'options'),(1979,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:11:22','gtdcsv','select','pipe',0,0,'baseline'),(1980,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:11:22','gtdcsv','select','pipe',0,0,'options'),(1981,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:14:50','gtdcsv','select','pipe',0,0,'options'),(1982,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:14:50','gtdcsv','select','pipe',0,0,'baseline'),(1983,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:36:53','gtdcsv','select','pipe',0,0,'options'),(1984,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:36:53','gtdcsv','select','pipe',0,0,'baseline'),(1985,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:39:41','gtdcsv','select','pipe',0,0,'baseline'),(1986,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:39:41','gtdcsv','select','pipe',0,0,'options'),(1987,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:41:09','gtdcsv','select','pipe',0,0,'baseline'),(1988,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:41:09','gtdcsv','select','pipe',0,0,'options'),(1989,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:42:54','gtdcsv','select','pipe',0,0,'options'),(1990,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:42:54','gtdcsv','select','pipe',0,0,'baseline'),(1991,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:57:20','gtdcsv','select','pipe',0,0,'options'),(1992,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:57:20','gtdcsv','select','pipe',0,0,'baseline'),(1993,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:59:11','gtdcsv','select','pipe',0,0,'options'),(1994,'acmesds.0','guest::1@totem.org','nets','2021-02-06 07:59:11','gtdcsv','select','pipe',0,0,'baseline'),(1995,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:08:22','gtdcsv','select','pipe',0,0,'options'),(1996,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:08:22','gtdcsv','select','pipe',0,0,'baseline'),(1997,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:14:50','gtdcsv','select','pipe',0,0,'baseline'),(1998,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:14:50','gtdcsv','select','pipe',0,0,'options'),(1999,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:16:14','gtdcsv','select','pipe',0,0,'options'),(2000,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:16:14','gtdcsv','select','pipe',0,0,'baseline'),(2001,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:18:21','gtdcsv','select','pipe',0,0,'options'),(2002,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:18:21','gtdcsv','select','pipe',0,0,'baseline'),(2003,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:22:55','gtdcsv','select','pipe',0,0,'baseline'),(2004,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:22:55','gtdcsv','select','pipe',0,0,'options'),(2005,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:23:25','gtdcsv','select','pipe',0,0,'options'),(2006,'acmesds.0','guest::1@totem.org','nets','2021-02-06 08:23:25','gtdcsv','select','pipe',0,0,'baseline'),(2007,'acmesds.0','guest::1@totem.org','nets','2021-02-06 13:14:18','gtdcsv','select','pipe',0,0,'options'),(2008,'acmesds.0','guest::1@totem.org','nets','2021-02-06 13:16:03','gtdcsv','select','pipe',0,0,'options'),(2009,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:02:55','gtdcsv','select','pipe',0,0,'options'),(2010,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:04:22','gtdcsv','select','pipe',0,0,'options'),(2011,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:05:34','gtdcsv','select','pipe',0,0,'options'),(2012,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:12:21','gtdcsv','select','pipe',0,0,'options'),(2013,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:17:08','gtdcsv','select','pipe',0,0,'options'),(2014,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:28:01','gtdcsv','select','pipe',0,0,'options'),(2015,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:33:52','gtdcsv','select','pipe',0,0,'options'),(2016,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:36:55','gtdcsv','select','pipe',0,0,'options'),(2017,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:56:26','gtdcsv','select','pipe',0,0,'options'),(2018,'acmesds.0','guest::1@totem.org','nets','2021-02-06 14:58:56','gtdcsv','select','pipe',0,0,'options'),(2019,'acmesds.0','guest::1@totem.org','nets','2021-02-06 15:34:02','gtdcsv','select','pipe',0,0,'options'),(2020,'acmesds.0','guest::1@totem.org','nets','2021-02-06 15:39:20','gtdcsv','select','pipe',0,0,'options'),(2021,'acmesds.0','guest::1@totem.org','nets','2021-02-06 15:50:15','gtdcsv','select','pipe',0,0,'options'),(2022,'acmesds.0','guest::1@totem.org','nets','2021-02-06 18:52:04','gtdcsv','select','pipe',0,0,'options'),(2023,'acmesds.0','guest::1@totem.org','nets','2021-02-06 18:53:37','gtdcsv','select','pipe',0,0,'options'),(2024,'acmesds.0','guest::1@totem.org','nets','2021-02-06 18:54:38','gtdcsv','select','pipe',0,0,'options'),(2025,'acmesds.0','guest::1@totem.org','nets','2021-02-06 20:49:19','gtdcsv','select','pipe',0,0,'options'),(2026,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-07 12:45:24','gtdcsv','select','pipe',0,0,'options'),(2027,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 17:53:31','gtdcsv','select','pipe',0,0,'options'),(2028,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:05:06','gtdcsv','select','pipe',0,0,'options'),(2029,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:07:55','gtdcsv','select','pipe',0,0,'options'),(2030,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:12:32','gtdcsv','select','pipe',0,0,'options'),(2031,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:14:45','gtdcsv','select','pipe',0,0,'options'),(2032,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:15:59','gtdcsv','select','pipe',0,0,'options'),(2033,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:26:30','gtdcsv','select','pipe',0,0,'options'),(2034,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:32:36','gtdcsv','select','pipe',0,0,'options'),(2035,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:45:23','gtdcsv','select','pipe',0,0,'options'),(2036,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:46:28','gtdcsv','select','pipe',0,0,'options'),(2037,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:52:06','gtdcsv','select','pipe',0,0,'options'),(2038,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:56:13','gtdcsv','select','pipe',0,0,'options'),(2039,'acmesds.0','guest::ffff:127.0.0.1@totem.org','nets','2021-02-09 18:57:47','gtdcsv','select','pipe',0,0,'options'),(2040,'acmesds.0','guest::1@totem.org','nets','2021-02-09 19:48:47','gtdcsv','select','pipe',0,0,'options'),(2041,'acmesds.0','guest::1@totem.org','nets','2021-02-09 19:49:14','gtdcsv','select','pipe',0,0,'options'),(2042,'acmesds.0','guest::1@totem.org','nets','2021-02-09 19:50:31','gtdcsv','select','pipe',0,0,'options');
/*!40000 ALTER TABLE `syslogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `watches`
--

DROP TABLE IF EXISTS `watches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `watches` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `File` varchar(255) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `watches`
--

LOCK TABLES `watches` WRITE;
/*!40000 ALTER TABLE `watches` DISABLE KEYS */;
/*!40000 ALTER TABLE `watches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workers`
--

DROP TABLE IF EXISTS `workers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `workers` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `worker` int(11) DEFAULT NULL,
  `node` varchar(64) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  `thread` varchar(128) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workers`
--

LOCK TABLES `workers` WRITE;
/*!40000 ALTER TABLE `workers` DISABLE KEYS */;
/*!40000 ALTER TABLE `workers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-12-11 14:47:09
