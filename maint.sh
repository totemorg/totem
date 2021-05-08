#!/bin/bash
# UNCLASSIFIED

#
# Setup env
#

export HERE=`pwd`
export MODULES=(totem atomic geohack flex enums reader debe jsdb man randpr liegroup securelink socketio)
export MODULE=`basename $HERE`

case "$1." in

gnome.)
	gsettings set org.gnome.desktop.session idle-delay 0
	gsettings set org.gnome.desktop.lockdown disable-lock-screen 'true'
	;;
	
win.)
	net use T: \\localhost\c$\Users\X\Desktop\totem
	;;
	
pkg.)
	# one-time yum patch on the online centos
	# yum install yum-plugin-downloadonly yum-utils createrepo 

	## from the "online" centos that is building the s/a R rpm

	mkdir /var/tmp/$2
	mkdir /var/tmp/$2-installroot

	# Download the RPMs. This uses the installroot trick suggested here to force a full download of 
	# all dependencies since nothing is installed in that empty root. Yum will create some metadata in 
	# there, but we're going to throw it all away. Note that for CentOS7 releasever would be "7".

	yum install --downloadonly --installroot=/var/tmp/$2-installroot --releasever=7 --downloaddir=/var/tmp/$2 $2

	# Generate the metadata needed to turn our new pile of RPMs into a YUM repo and clean up the stuff 
	# we no longer need:

	createrepo --database /var/tmp/$2
	rm -rf /var/tmp/$2-installroot

	# Configure the download directory as a repo. Note that for CentOS7 the gpgkey would be 
	# named "7" instead of "6": 

	cp pkgrepo /etc/yum.repos.d/offline-$2.repo
	sed "s/PKG/$2/g" /etc/yum.repos.d/offline-$2.repo
	echo "revise /etc/yum.repos.d/offline-$2.repo"
	
	# check for missing dependencies:
	repoclosure --repoid=offline-$2

	# make the s/a repo
	zip -r $2.zip /var/tmp/$2/
	;;

resync.)

	for mod in "${MODULES[@]}"; do

		cd /local/service/$mod
			echo ">>>> $mod"
			git pull agent master
		cd ..

	done
	;;

all.)

	for mod in "${MODULES[@]}"; do

		cd /local/service/$mod
			if test -f maint.sh; then
				echo ">>>> $mod"
				. maint.sh "$2" "$3" "$4"
			fi
		cd ..

	done
	;;

_clearall.)   # reset env

	for mod in "${MODULES[@]}"; do
		let Totem_$mod=0
	done
	;;

#
# C bindings
# 

rebuild.)
	export IFS=$SRV/atomic/ifs
	cd $IFS/opencv; $REBUILD
	cd $IFS/python; $REBUILD
	cd $IFS/mac; $REBUILD
	#cd $SRV/jslab
	#npm install node-svd
	cd $SRV/glwip
	npm install lwip
	;;

config.)
	if test -f ./config.sh; then
		. config.sh
	fi
	;;
	
_configall.)

	for mod in "${MODULES[@]}"; do

		let x=Totem_$mod
		if [ $x != 1 ]; then
			if test -f ../$mod/config.sh; then
				echo "config $mod"
				cd ../$mod
					. config.sh
				cd ../totem
			fi

			let Totem_$mod=1
		fi

	done
	;;

#
# flatten/expand files for domain xfer
#

flatten.)
	echo "flattening $2/* -> $2.tar -> $2.hex -> F_$2_xx*"
	tar cvf $2.tar $2 --exclude=.git
	xxd -p $2.tar $2.hex
	split -b 10m $2.hex F_$2_$xx
	rm $2.tar
	rm $2.hex
	#mkdir patches/$2
	#mv $2_$xx* patches/$2
	;;

expand.)
	echo "expanding F_$2_$xx* -> $2.hex -> $2.tar -> $2/*"
	#cp patches/$2/* .
	cat F_$2* > $2.hex
	xxd -r -p $2.hex  $2.tar
	tar xvf $2.tar
	rm $2.tar
	rm $2.hex
	rm F_$2*
	;;

#
# DB maint
#

neo4j.)

	case "$2." in
	
	start.)
		cd /local/neo4j
		./bin/neo4j console &
		;;

	esac
	;;

jnb.)
	cd /anaconda/bin
	jupyter-notebook --ip 0.0.0.0 --port 8081
	;;

readme.)
	repo1="https:\/\/github.com\/totemstan\/"
	repo2="https:\/\/gitlab.west.nga.ic.gov\/acmesds\/"
	repo3="https:\/\/sc.appdev.proj.coe\/acmesds\/"
	site1="http:\/\/totem.hopto.org\/"
	site2="https:\/\/totem.nga.mil\/"
	site3="https:\/\/totem.west.ile.nga.ic.gov\/"
	
	pass1="s/REPO{\([^}]*\)}/("$repo1"\1) || [COE]("$repo3"\1) || [SBU]("$repo2"\1)/g"
	pass2="s/SITE{\([^}]*\)}/("$site1"\1) || [COE]("$site3"\1) || [SBU]("$site2"\1)/g"
	
	#echo $pass1
	#echo $pass2
	
	sed "$pass1" readme.md | sed "$pass2" > README.md
	;;
	
mysql.)

	case "$2." in
	
	config.)	# tune dbs
		echo -e "update dbs as needed"
		mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST
		;;

	snap.)		# snapshot all dbs
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST openv >admins/openv.sql
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -R app >admins/app.sql
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -ndtR app >admins/funcs.sql
		;;

	prime.)		# prime totem
		mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST openv <admins/openv.sql	
		mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST app <admins/app.sql	
		mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST app <admins/funcs.sql	
		;;
		
	start.)
		if P=$(pgrep mysqld); then
			echo -e "mysql service running: \n$P"
		else
			#rm /var/lib/mysql/mysql.sock      # in case its hanging around
			rm /tmp/mysql.sock.lock
			cd /local/mysql
			bin/mysqld_safe --defaults-file=my.cnf --sql-mode="" --max_allowed_packet=64000000 &
			cd /local/service
		fi
		;;

	esac
	;;

#
# Maintenance and startups
#

snapdb.)
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST openv >/mnt/archive/sqldbs/openv.sql
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -R app --ignore-table=app.gtd >/mnt/archive/sqldbs/app.sql
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -ndtR app >/mnt/archive/sqldbs/funcs.sql
	;;
	
snapsrv.)
	cd /local/service
	for mod in "${MODULES[@]}"; do
		echo "snapping $map"
		zip -ry /mnt/archive/snapshot.zip $mod -x $mod/node_modules/\* $mod/.git/\* $mod/_\* $mod/~\* $mod/math/\* $mod/mljs/\* $mod/prm/\*
	done
	#zip $MAP/archives/snap.zip */*.js */README* */*.sh debe/uis/* debe/admins/*/* debe/public/*/* totem/certs/* atomic/ifs/*.cpp atomic/ifs/*/*.cpp atomic/ifs/*/*.h
	;;

snapmap.) 
	cd /local
	zip /mnt/archive/local_map.zip include/* include/R/* lib64/* lib64/R/*
	;;
	
snap.)
	source maint.sh snapdb
	source maint.sh snapsrv
	source maint.sh snapmap
	;;
	
start_cesium.)
	if P=$(pgrep cesium); then
		echo -e "cesium service running: \n$P"
	else
		#node $BASE/cesium/geonode/geocesium --port 8083 --public &
		//node $BASE/cesium/server --port 8083 --public &
		node $BASE/cesium/server.cjs --port 8083 --public &
	fi
	;;

start_nodered.)
	if P=$(pgrep node-red); then
		echo -e "nodered service running: \n$P"
	else
		#node $BASE/nodered/node_modules/node-red/red &
		node $RED/red -s $RED/settings.js &
	fi
	;;

start_docker.)
	# docker
	# probe to expose /dev/nvidia device drivers to docker
	/base/nvidia/bin/x86_64/linux/release/deviceQuery

	sudo systemctl start docker.service

	echo "docked containers"
	docker ps -a
	;;

pubmake.)
	export BOOKS=(regress demo cints)
	for book in "${BOOKS[@]}"; do
		echo "publish $book"
		curl http://localhost:8080/$book.pub -o /dev/null
	done
	for book in "${BOOKS[@]}"; do
		echo "readme $book"
		curl http://localhost:8080/$book.tou -o .pubgit/$book/README.md
		cd ./pubgit/$book
		git push agent master
		cd ../..
	done
	;;

pubprime.)
	export BOOKS=(regress demo cints)
	for book in "${BOOKS[@]}"; do
		echo "prime $book"
		mkdir ./pubgit/$book
		cd ./pubgit/$book
		git init
		touch README.md
		git add README.md
		git remote add origin https://github.com/totemstan/book_$book
		cd ../..
	done
	;;
	
startup.)		# status and start dependent services
	source ./maint.sh all config	# setup external vars
	source ./maint.sh mysql start	# start mysql service
	source ./maint.sh neo4j start	# start neo4j service
    cd /local/service
	source ./maint.sh debug	# start totem service
	sudo systemctl stop firewalld	# if running in host os
	#notepadqq & # debe/debe.js totem/totem.js jsdb/jsdb.js flex/flex.js &
	#source ./maint.sh start_cesium
	#source ./maint.sh start_nodered
	#source ./maint.sh start_docker
	#acroread 										# starts adobe reader for indexing pdfs.  
	#openoffice4 									# starts openoffice server for indexing docs.  
	;;

restyle.)
	echo "to be developed"
	;;

_prmgen.)	# legacy 

	documentation build prm_*.js -f html -o prm -c /local/docconfig.json
	;;
	
_prmput.)	# legacy jsduck host
	
	cd /local/babel
	npm run $MODULE      # use babel to convert ES6 to ES5 saves to jsduck area
	cd /local/service/$MODULE
	#cp README.md $DUCK/readmes/$MODULE.md
	echo "uploaded $MODULE to jsduck host"
	;;

_prmget.)	# legacy jsduck host
	cd /local/service/$MODULE
	cp -r /mnt/installs/jsduck/output/$MODULE/* prm
	echo "downloaded jsduck output into $MODULE/prm"
	;;
		
_duckpush.)
	# doxygen config.oxy
	source maint.sh putduck totem
	;;

_duckpull.)
	cd /local/babel
	duckpull totem
	duckpull debe
	duckpull enum
	;;

_docall.)
	for mod in "${MODULES[@]}"; do

		echo ">>>> $mod"
		source maint.sh doc "$mod"1 "$mod"2

	done
	;;
	
proxy.)	# establish email proxy
	ssh jamesdb@54.86.26.118 -L 5200:172.31.76.130:8080 -i ~/.ssh/aws_rsa.pri	
	;;
		
_nada.)	# quite mode
	;;

notes.) 		# centos install notes

	vi $SRV/totem/install.notes
	;;
	
_bind.) 	# bind known genode c-modules

	cd $ENGINES/opencv
	node-gyp rebuild  $GYPOPTS
	
	cd $ENGINES/python
	node-gyp rebuild $GYPOPTS
	
	cd $ENGINES/mac
	node-gyp rebuild $GYPOPTS

	cd $ENGINES
	node-gyp rebuild $GYPOPTS

	;;

_archive.) 	# archive service to archive area

	echo "Archiving to $MAP/snapshots"
	
	#rm $MAP/snapshots/totem.zip
	#zip -ry $MAP/snapshots/totem.zip * -x */node_modules/\* */.git/\* _\* ~\*
	#zip -ry $MAP/snapshots/totem.zip atomic -x atomic/.git/\* atomic/node_modules/\*	
	;;

#
# Local and remote archives
#

git.)
	
	case "$2." in
	
	newkey.) 		# make pub-pri key for git auto-password agent 
		echo "store keys under .ssh/git_totemstan_rsa and upload git_totemstan_rsa.pub key to git account." 
		echo "git remote add agent git@github.com:totemstan/REPO"
		ssh-keygen -t rsa -b 4096 -C "brian.d.james@comcast.com"
		;;
		
	newagent.)		# start ssh agent
		eval $(ssh-agent -s)
		ssh-add ~/.ssh/git_totemstan_rsa
		;;
	
	config.)
		git config --global http.sslVerify false
		;;

	zip.)
		zip -ry ../transfer/$MODULE.zip * -x \*/node_modules/\* \*/_\* \*/debe/captcha\* \*/debe/clients\*
		;;

	clone.)	# clone a project
		echo "Cloning project $2"
		git clone $REPO/$2.git
		;;	

	baseline.)
		echo "Baseline project $2"
		cd $2
			git init
			git remote add origin $REPO/$2.git
			git pull origin master
		cd ..
		;;

	rebase.)
		zip -uP $ZIP_PASS $MODULE.zip $MODULE.js
		git -commit -am "rebase $2"
		git push origin master
		;;

	commit.)   # commit changes
		git commit -am "$2"
		;;

	push.)   # push code changes to git
		git push origin master
		;;

	pull.)	# pull code changes from git
		git pull origin master
		;;

	esac
	;;
	
_zipall.)

	rm ../transfer/totem-project.zip
	for mod in "${MODULES[@]}"; do
		zip -ry ../transfer/totem-project.zip ../$mod/* -x \*/node_modules/\* \*/_\* \*/debe/captcha\* \*/debe/clients\*
	done
	;;

sync.)   # special forced code syncs
	#rsync $CHIPS/forecasts/* $GPUHOST:$CHIPS/forecasts
	rsync $HOME/*.jpg $GPUHOST:$HOME

	# rsync -r $NODEPATH/swag $GPUHOST:$NODEPATH
	# rsync -r $NODEPATH/tauif $GPUHOST:$NODEPATH
	# rsync -r $HERE/start.sh $GPUHOST:/base/geonode
	# rsync -r $HERE/public/dets $GPUHOST:$PUBLIC
	# rsync -r $HERE/public/dbs $GPUHOST:$PUBLIC
	# rsync -r /base/sqldb/* $GPUHOST:/base/sqldb	
	# rsync -r $PUBLIC/python/exccaffe.py $GPUHOST:$PUBLIC/python
	# rsync -r $NODEPATH/caffe $GPUHOST:$NODEPATH
	# rsync $DNN/cuda/lib64/libcudnn.* $GPUHOST:/base/cuDNN/cuda/lib64   # make caffe creates the so.7 libs
	
	;;
		
_list.)	# list available geonode apps
	node client.js --help
	;;

#
# Start/stop TOTEM
#

halt.)	# stop and remove GPU-caffe docker instances
	docker stop `socker ps -qa`
	docker rm `docker ps -qa`
	;;

docker.) 

	let con=$2
	while [ $con -gt 0 ]; do
		echo "docking $1 in container $con"
		docker $RUND centos.nvidia sh -c "`pwd`/setup.sh $3 $4 $5 $6"
		let con-=1
	done
	;;

help.)	# some help

	echo "usage:"
	echo "	. maint.sh CMD OPTIONS"
	echo "	. maint.sh docker N FILE.js OPTIONS"
	echo "	. maint.sh CONFIG OPTIONS"
	echo "	. maint.sh FILE.js OPTIONS"
	echo ""
	echo "Repo CMDs:"
	echo "	clone PROJECT from repo"
	echo "	push current project with COMMENT VERSION"
	echo "	pull latest version into current project"
	echo "	baseline current project to the repo"
	echo "Enumerator CMDs"
	echo " 	apply CMD to all projects [${MODULES[@]}]"
	echo "Testing CMDs:"
	echo "	docker FILE.js in N docker containers with OPTIONS"
	echo "	CONFIG to run from test.js"
	echo "Maintenance CMDs:"
	echo "	startup dependent services (mysql, cesium, nodered, ...)"
	echo "	halt all allocated docker threads"
	echo "	config app parameters via mysql"
	echo "	help"
	echo " 	notes on installation"
	echo "	proxy email via ssh"
	echo "Data Syncing CMDs:"
	echo "	checkpoint the mysql database"
	echo "	archive project to hosting machine"
	echo "	sync code changes with other machines"
	echo "Special CMDs:"
	echo "	bind known c-modules to geonode"
	echo "	redoc autodocument using babel/jsduck/doxygen compilers"
	echo "	restyle css styles using css compass complier"
	;;

upnet.)
	sudo /etc/init.d/network restart
	;;

uptest.)
	sudo -E env "PATH=$PATH" env "LD_LIBRARY_PATH=$LD_LIBRARY_PATH" forever -o up.log start debe.js D1
	;;

up.) 		# bring up production service 

	export SERVICE_NAME=Totem1
	export SERVICE_MASTER_URL=http://localhost:80
	export SERVICE_WORKER_URL=https://localhost:443

	sudo -E env "PATH=$PATH" env "LD_LIBRARY_PATH=$LD_LIBRARY_PATH" forever -o up.log start debe.js D1
	;;

*)  	# start totem

	case "$(hostname)." in
	acmesds.)
		DOMAIN=totem.hopto.org
		;;
		
	wsn3303.)
		DOMAIN=totem.nga.mil
		;;

	awshigh.)
		DOMAIN=totem.west.ile.nga.ic.gov
		;;

	ilehigh.)
		DOMAIN=totem.west.ile.nga.ic.gov
		;;
	esac
	
	case "$1." in 
	prod.)	# multi core production
		PROTO=https
		PORT1=8080
		PORT2=443
		;;
	
	oper.|protected.|https.)	# single core
		PROTO=https
		PORT1=8443
		PORT2=8080
		;;
	
	
	.|debug.|http.)
		DOMAIN=localhost
		PROTO=http
		PORT1=8080
		PORT2=8081
	esac
	
	# define service url
	export SERVICE_MASTER_URL=$PROTO://$DOMAIN:$PORT1
	export SERVICE_WORKER_URL=$PROTO://$DOMAIN:$PORT2
	
	# define task sharding nodes
	export SHARD0=$PROTO://$DOMAIN/task
	export SHARD1=$PROTO://$DOMAIN/task
	export SHARD2=$PROTO://$DOMAIN/task
	export SHARD3=$PROTO://$DOMAIN/task

	cd /local/service/debe
	node debe.js D1 $2 $3 $4 $5 
	;;

esac

# UNCLASSIFIED
