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
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COMMENT='TOTEM reads on startup to override default site context keys';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apps`
--

LOCK TABLES `apps` WRITE;
/*!40000 ALTER TABLE `apps` DISABLE KEYS */;
INSERT INTO `apps` VALUES (1,'Totem1','Totem','acmesds');
/*!40000 ALTER TABLE `apps` ENABLE KEYS */;
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
  `Actions` int(11) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM updates as tables are revised';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dblogs`
--

LOCK TABLES `dblogs` WRITE;
/*!40000 ALTER TABLE `dblogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `dblogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `files` (
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
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
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
  `IDs` json DEFAULT NULL,
  `Repoll` tinyint(1) DEFAULT NULL,
  `Retries` int(11) DEFAULT NULL,
  `Timeout` float DEFAULT NULL,
  `Message` mediumtext,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM Updates when a client arrives';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
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
  `Title` varchar(255) DEFAULT NULL,
  `Lead` varchar(64) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
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
  `Riddle` mediumtext,
  `Client` varchar(64) DEFAULT NULL,
  `Made` datetime DEFAULT NULL,
  `Attempts` int(11) DEFAULT NULL,
  `maxAttemtps` int(11) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM antibot protection accessed when a client connect';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `riddles`
--

LOCK TABLES `riddles` WRITE;
/*!40000 ALTER TABLE `riddles` DISABLE KEYS */;
/*!40000 ALTER TABLE `riddles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `ID` float NOT NULL AUTO_INCREMENT,
  `Hawk` varchar(8) DEFAULT NULL,
  `Client` varchar(64) DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
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
  `Message` mediumtext,
  `Joined` datetime DEFAULT NULL,
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TOTEM updates when a client session is established';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-09-30 11:38:23
