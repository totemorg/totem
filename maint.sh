#!/bin/bash
# UNCLASSIFIED when IP addresses and passwords are undefined

#
# Setup env
#

export HERE=`pwd`
export MODULES=(totem engine chipper flex enum lwim mime reader debe dsvar)

case "$1." in

all.)

	for mod in "${MODULES[@]}"; do

		cd ../$mod
			echo ">>>> $mod"
			if test -f maint.sh; then
				source maint.sh "$2" "$3" "$4"
			fi
		cd ../totem

	done
	;;

zipall.)

	rm ../transfer/totem-project.zip
	for mod in "${MODULES[@]}"; do
		zip -r ../transfer/totem-project.zip ../$mod/* -x \*/node_modules/\* \*/_\* \*/debe/captcha\* \*/debe/clients\*
	done
	;;

clearall.)   # reset env

	for mod in "${MODULES[@]}"; do
		let Totem_$mod=0
	done
	;;

configall.)

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
# repo cases
#		

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

commit.)   # commit changes
	git commit -am "$2"
	;;

push.)   # push code changes to git
	git push origin master
	;;
	
pull.)	# pull code changes from git
	git pull origin master
	;;
	
#
# Special cases
#

edit.)
	geany debe/debe.js totem/totem.js sql/sql.js &
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
	
#
# Maintenance cases
#

mysql.)
	cd /local/mysql
	bin/mysqld_safe --defaults-file=my.cnf --sql-mode="" &
	cd /local/service/debe
	;;
	
startup.)		# status and start dependent services
	if P=$(pgrep mysqld); then
		echo -e "mysql service running: \n$P"
	else
		#rm /var/lib/mysql/mysql.sock      # in case its hanging around
		cd /local/mysql
		bin/mysqld_safe --defaults-file=my.cnf --sql-mode="" &
	fi

	if P=$(pgrep cesium); then
		echo -e "cesium service running: \n$P"
	else
		#node $BASE/cesium/geonode/geocesium --port 8083 --public &
		node $BASE/cesium/server --port 8083 --public &
	fi

	if P=$(pgrep node-red); then
		echo -e "nodered service running: \n$P"
	else
		#node $BASE/nodered/node_modules/node-red/red &
		node $RED/red -s $RED/settings.js &
	fi

	# docker
	# probe to expose /dev/nvidia device drivers to docker
	/base/nvidia/bin/x86_64/linux/release/deviceQuery

	sudo systemctl start docker.service

	echo "docked containers"
	docker ps -a

	# office products
	#acroread 										# starts adobe reader for indexing pdfs.  
	#openoffice4 									# starts openoffice server for indexing docs.  

	;;

config.)	# configure apps
	echo -e "use the OpEnv db to config the operating env for all apps\nuse the appN db to config the appN service"
	mysql -u$MYSQL_USER -p$MYSQL_PASS
	;;

restyle.)
	echo "to be developed"
	;;

duckpush.)
	# doxygen config.oxy
	cd /local/babel
	duckpush totem 
	duckpush debe
	duckpush enum
	;;

duckpull.)
	cd /local/babel
	duckpull totem
	duckpull debe
	duckpull enum
	;;

docall.)
	for mod in "${MODULES[@]}"; do

		echo ">>>> $mod"
		source maint.sh doc "$mod"1 "$mod"2

	done
	;;

proxy.)	# establish email proxy
	ssh jamesdb@54.86.26.118 -L 5200:172.31.76.130:8080 -i ~/.ssh/aws_rsa.pri	
	;;
		
nada.)	# quite mode
	;;

notes.)

	vi admins/notes*.txt
	;;
	
bind.) 	# bind known genode c-modules

	cd $ENGINES/opencv
	node-gyp rebuild  $GYPOPTS
	
	cd $ENGINES/python
	node-gyp rebuild $GYPOPTS
	
	cd $ENGINES/mac
	node-gyp rebuild $GYPOPTS

	cd $ENGINES
	node-gyp rebuild $GYPOPTS

	;;

#
# Syncing data cases
#

checkpoint.)  # export db to admins

	echo "Exporting sqldb to admins/db"

	cd $ADMIN/db
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS openv >admins/db/openv.sql
		mysqldump -u$MYSQL_USER -p$MYSQL_PASS app >admins/db/app.sql
		#mysqldump -u$MYSQL_USER -p$MYSQL_PASS --events mysql >admins/db/mysql.sql
		#mysqldump -u$MYSQL_USER -p$MYSQL_PASS jou >admins/db/jou.sql

		#sudo zip -r /media/sf_archives/sqldb.zip $ADMINS/db
		git commit -am $2
		git push origin master
	cd $HERE
	
	;;

archive.) 	# archive service to archive area


	echo "Archiving to $MAP/archives"
	zip -r $MAP/archives/totem-N.zip * -x \*.zip \*/dbs/\* \*/clients/\*  \*/captcha/\* \*.git/\*  \*/_\*  _\*
	;;

snap.)
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS openv >debe/admins/db/openv.sql
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS app >debe/admins/db/app.sql
	zip $MAP/archives/snap.zip */*.js */README* */*.sh debe/uis/* debe/admins/*/* debe/public/*/* totem/certs/* engine/ifs/*.cpp engine/ifs/*/*.cpp engine/ifs/*/*.h
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
		
#
# Run geoclient
#

halt.)	# stop and remove GPU-caffe docker instances
	docker stop `socker ps -qa`
	docker rm `docker ps -qa`
	;;

list.)	# list available geonode apps
	node client.js --help
	;;

docker.) 

	let con=$2
	while [ $con -gt 0 ]; do
		echo "docking $1 in container $con"
		docker $RUND centos.nvidia sh -c "`pwd`/setup.sh $3 $4 $5 $6"
		let con-=1
	done
	;;

.)
	echo "See 'setup help' for command options"
	. maint.sh configall
	;;

*)  	# start specified totem config

	node test.js $1 $2 $3 $4 $5 
	;;

keepup)

	forever start test.js $2 $3 $4 $5
	;;

esac

# UNCLASSIFIED when IP addresses and passwords are undefined
