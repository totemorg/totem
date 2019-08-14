#!/bin/bash
# UNCLASSIFIED

#
# Setup env
#

export HERE=`pwd`
export MODULES=(totem atomic geohack flex enum reader debe jsdb man)
export MODULE=`basename $HERE`

case "$1." in

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
	tar cvf $2.tar $2
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
# other
#

certs.) 	# decompose a base.p12 pki cert into ca, public and private pem certs
	openssl pkcs12 -in $2.p12 -out ca.pem -cacerts -nokeys
	openssl pkcs12 -in $2.p12 -out public.pem -clcerts -nokeys
	openssl pkcs12 -in $2.p12 -out private.pem -nocerts
	;;
	
edit.) 		# startup edits
	notepadqq debe/debe.js totem/totem.js jsdb/jsdb.js flex/flex.js &
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

mysql.)

	case "$2." in
	
	config.)	# configure apps
		echo -e "update openv.apps as needed"
		mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST
		;;

	snapf.)   # snapshot functions only
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST ndtR app >admins/db/funcs.sql
		;;

	archive.)  # snapshot and archive db

		echo "Exporting sqldb to admins/db"

		cd $ADMIN/db
			mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST openv >openv.sql
			mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -R app >app.sql
			mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST ndtR app >funcs.sql
			#mysqldump -u$MYSQL_USER -p$MYSQL_PASS --events mysql >admins/db/mysql.sql
			#mysqldump -u$MYSQL_USER -p$MYSQL_PASS jou >admins/db/jou.sql

			#sudo zip -ry /media/sf_archives/sqldb.zip $ADMINS/db
			#git commit -am $2
			#git push origin master
		cd $HERE
		;;

	save.)		# snapshot all dbs
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST openv >admins/db/openv.sql
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -R app >admins/db/app.sql
		;;

	load.)
		mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST openv <admins/db/openv.sql	
		mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST app <admins/db/app.sql	
		;;
		
	start.)
		if P=$(pgrep mysqld); then
			echo -e "mysql service running: \n$P"
		else
			#rm /var/lib/mysql/mysql.sock      # in case its hanging around
			cd /local/mysql
			bin/mysqld_safe --defaults-file=my.cnf --sql-mode="" --max_allowed_packet=64M &
			cd /local/service
		fi
		;;

	esac
	;;

#
# Maintenance and startups
#

snap.)
	zip $MAP/archives/snap.zip */*.js */README* */*.sh debe/uis/* debe/admins/*/* debe/public/*/* totem/certs/* atomic/ifs/*.cpp atomic/ifs/*/*.cpp atomic/ifs/*/*.h
	;;

start_cesium.)
	if P=$(pgrep cesium); then
		echo -e "cesium service running: \n$P"
	else
		#node $BASE/cesium/geonode/geocesium --port 8083 --public &
		node $BASE/cesium/server --port 8083 --public &
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

startup.)		# status and start dependent services
	source ./maint.sh mysql start
	source ./maint.sh start_cesium
	source ./maint.sh start_nodered
	source ./maint.sh start_docker
	source ./maint.sh neo4j start
	# office products
	#acroread 										# starts adobe reader for indexing pdfs.  
	#openoffice4 									# starts openoffice server for indexing docs.  

	;;

restyle.)
	echo "to be developed"
	;;

prmput.)
	
	cd /local/babel
	npm run $MODULE      # use babel to convert ES6 to ES5 saves to ducksrc area
	cp ../service/$MODULE/README.md $DUCK/readmes/$MODULE.md
	echo "uploaded $MODULE to jsduck host.  use 'maint prmget' to download jsduck output."
	;;

prmget.)
	cp -r $DUCK/output/$MODULE/* prm
	echo "downloaded jsduck output into prm/$MODULE"
	;;
		
_duskpush.)
	# doxygen config.oxy
	. maint.sh putduck totem
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

	echo "Archiving to $MAP/archives"
	zip -ry $MAP/archives/totem-N.zip * -x \*.zip \*/dbs/\* \*/clients/\*  \*/captcha/\* \*.git/\*  \*/_\*  _\*
	;;

#
# Local and remote archives
#

git.)
	
	case "$2." in
	
	nopass.)
		cd ~/home
		ssh-agent  # allow service to push git chnges w/o password prompts
		ssh-add ~/.ssh/id_rsa 
		;;

	config.)
		git config –global http.sslVerify false
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
	
up.) 		# bring up production service 

	export SERVICE_NAME=Totem1
	export SERVICE_MASTER_URL=http://localhost:80
	export SERVICE_WORKER_URL=https://localhost:443

	sudo -E env "PATH=$PATH" env "LD_LIBRARY_PATH=$LD_LIBRARY_PATH" forever -o up.log start debe.js D1
	;;

*)  	# start specified totem config

	node debe.js $1 $2 $3 $4 $5 
	;;

esac

# UNCLASSIFIED
