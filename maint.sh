#!/bin/bash
# UNCLASSIFIED

#
# Setup env
#

export HERE=`pwd`

case "$1." in

debe_config.)
	# specific geonode client
	export PUBLIC=./public					# public path
	export ADMIN=$HERE/admins 				# admin stuff, checkpoints
	export TEMP=$HERE/tmp/					# temp files
	export DB=$PUBLIC/dbs/					# training images
	export DETS=$PUBLIC/dets/ 				# trained detectors
	export PROOFS=$PUBLIC/cars/ver0/ 			# unmodulated/unrotated images for testing
	#export SCRIPTS=$HERE/clients/extjs/packages/ext-locale/build/ext-locale-
	export THEMES=$HERE/clients/themes
	
	export TXMAIL_HOST=smtp.comcast.net:587
	export TXMAIL_USER=brian.d.james:COMCASTsnivel1
	export RXMAIL_HOST=
	export RXMAIL_USER=

	export INDEX= #data/nlp.json  			# reader nlp indexing save path
	export SCAN=$HERE/node_modules/reader/jquery-1.7.1.min.js 	# web site scanners

	export XLATE=$HERE/node_modules/i18n-abide/examples/express3/i18n	# I18N translation folder
	export PATH=$PATH:$NODE/bin

	export REPO=http://github.com:stansds
	export JIRA=http://jira.tbd
	export RAS=http://ras.tbd
	export BY=https://research.nga.ic.gov

	;;
	
geohack_config.)
	# IDOP conversion utilities
	export IVA=$BASE/iva
	export GDAL=$BASE/gdal
	#export IVA=/rroc/data/giat/iva			# IDOP conversion utilities
	;;
	
system_config.)
	export BASE=/local
	export MODULES=(totem atomic certs geohack enums reader debe pipe jsdb man randpr liegroup securelink socketio)
	export MODULE=`basename $HERE`
	
	# initialize dev/prod paths
	export PATH=/local/bin:/usr/bin:/local/sbin:/usr/sbin:/local/cmake/bin
	export GITUSER=totemstan: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
	export REPO=https://$GITUSER@github.com/totemstan

	# doc and dev tools
	#export PATH=/opt/cmake:$PATH 			# latest cmake
	#export PATH=$BASE/oxygen/bin:$PATH    	# doxygen code documenter if needed (jsduck used)
	#export PATH=$PATH:/usr/local/share/gems/gems/jsduck-5.3.4/bin 	# for jsduck

	# DBs
	export MYSQL=/local/mysql
	export NEO4J=/local/neo4j
	
	# R
	export R_libs=/usr/lib64/R/library/

	# NodeJS  
	export PATH=$PATH:$NODE/bin
	export NODE=$BASE/nodejs
	export NODELIB=$NODE/lib/node_modules
	export node_path=./node_modules

	# Python
	export CONDA=$BASE/atomconda
	export PYTHONHOME=$CONDA
	export PYTHONPATH=$BASE/caffe/python:$PYTHON/:$PYTHON/site-packages:$BASE/service/atomic
	
	;;
	
jsdb_config.)
	# MYSQL
	export PATH=$MYSQL/bin:$PATH
	export MYSQL_USER=root
	export MYSQL_NAME=app
	export MYSQL_HOST=localhost
	export ODBC_NAME=totem-app
	export ODBC_USER=ileuser

	# NEO4J
	export NEO4J_HOST="bolt://localhost" # "http://root:NGA@localhost:7474"
	export NEO4J_USER="neo4j"
	
	;;

seclink_config.)
	export LINK_HOST=totem
	;;
	
totem_config.)
	# POCs
	#export ADMIN="admin_tbd@nga.mil"
	#export OVERLORD="overlord_tbd@nga.mil"
	#export SUPER="supervisor_tbd@nga.mil"

	# docker
	#export GPU="--device /dev/nvidia0:/dev/nvidia0 --device /dev/nvidiactl:/dev/nvidiactl --device /dev/nvidia-uvm:/dev/nvidia-uvm"
	#export VOL="--volume /local:/base --volume /home/jamesdb/installs:/installs --volume /usr/lib64:/usr/lib64"
	#export NET="--net host"
	#export RUN="run -it $GPU $VOL $NET"
	#export RUND="$RUN -d"

	# define service url
	export SERVICE_MASTER_URL=http://localhost:8080
	export SERVICE_WORKER_URL=https://localhost:8081

	#export SERVICE_WORKER_URL=https://localhost:8443
	#export SERVICE_WORKER_URL=http://localhost:8081  # in debug mode

	# define passwords
	source ./config/_pass.sh

	# define service urls
	
	case "$(hostname)." in
		wsn3303.)
			DOMAIN=totem.nga.mil
			;;

		awshigh.)
			DOMAIN=totem.west.ile.nga.ic.gov
			;;

		ilehigh.)
			DOMAIN=totem.west.ile.nga.ic.gov
			;;

		acmesds.)
			DOMAIN=totem.hopto.org
			;;
		
		dockerhost.)
			DOMAIN=totem.hopto.org
			;;

		*)
			DOMAIN=unknown
	esac
	
	case "$2." in 
		prod.)	# multi core production
			PROTO=https
			PORT1=8080
			PORT2=443
			;;

		prot.)	# single core
			PROTO=https
			PORT1=8443
			PORT2=8080
			;;

		oper.)
			export SERVICE_OPER=yes
			DOMAIN=localhost
			PROTO=https
			PORT1=80
			PORT2=443
			;;
		
		*)
			DOMAIN=localhost
			PROTO=http
			PORT1=8080
			PORT2=8081
			;;
	esac
	
	# define service url
	export SERVICE_MASTER_URL=$PROTO://$DOMAIN:$PORT1
	export SERVICE_WORKER_URL=$PROTO://$DOMAIN:$PORT2
	
	echo "$LINK_HOST at $SERVICE_MASTER_URL and $SERVICE_WORKER_URL"
	
	# define task sharding urls
	export SHARD0=$PROTO://$DOMAIN/task
	export SHARD1=$PROTO://$DOMAIN/task
	export SHARD2=$PROTO://$DOMAIN/task
	export SHARD3=$PROTO://$DOMAIN/task

	;;
	
atomic_config.)
	# To link atomic with caffe, anaconda python, and opencv

	export CONDA=$BASE/atomconda
	export LIB=$BASE/lib64
	export NODE=$BASE/nodejs
	
	export PYLINK=$CONDA
	export PYTHON=$CONDA/bin/python2.7
	export PYTHONINC=$CONDA/include/python2.7
	export PYTHONLIB=$LIB/python/libpython2.7.so
	
	#export PYTHON=$CONDA/bin/python3.8
	#export PYTHONINC=$CONDA/include/python3.8
	#export PYTHONLIB=$LIB/python/libpython3.8.so
	
	# engine GPU compile switches
	case "$(hostname)." in
		awshigh.)  # AWS
			export GPUHOST=jamesdb@swag-gpu-01
			export GUIHOST=jamesdb@swag-ws-02
			export HASGPU=1
			export HASCAFFE=1
			;;

		ilehigh.) 	# ILE high
			export GPUHOST=giatstlgui01.innovision.local
			export GUIHOST=giatstlgui01.innovision.local
			export HASGPU=1
			export HASCAFFE=1
			;;

		wsn3303.)  # ILE low
			export GPUHOST=wsn3303
			export GUIHOST=wsn3303
			export HASGPU=1
			export HASCAFFE=1
			;;

		acmesds.)  # dev machine
			export GPUHOST=
			export GUIHOST=
			export HASGPU=0
			export HASCAFFE=0
			;;
			
		docker.)	# dockerized container
			export GPUHOST=
			export GUIHOST=
			export HASGPU=0
			export HASCAFFE=0
			;;
			
		*)
			export GPUHOST=
			export GUIHOST=
			export HASGPU=0
			export HASCAFFE=0
			;;
		
	esac
	
	# Dev paths
	export INC=$BASE/include
	export INCLUDE=$INC
	export PATH=$PATH:$INC/opencv:$BASE/opencv/bin
	export CUDA=$BASE/cuda
	export CAFFE=$BASE/caffe
	export PATH=$CONDA/bin:$INC/python:$PATH
	export REBUILD="node-gyp rebuild --nodedir=$NODE"	# use "node-gyp $GYPTOPS" to override distro ref to inet

	# more dev paths
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/opencv
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/python
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/jpeg
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/R/R
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/conda
	
	# caffe dev paths
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/boost
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/gflags
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/glog
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/lmdb
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/leveldb
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/hdf5
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/cuda
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/cuDNN
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/caffe
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$LIB/protobuf
	;;

config.)
	source ./maint.sh system_config
	source ./maint.sh seclink_config
	source ./maint.sh jsdb_config
	source ./maint.sh totem_config $2
	
	source ./maint.sh atomic_config
	source ./maint.sh geohack_config
	source ./maint.sh debe_config
	;;
	
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

	for mod in ./*/; do
		echo "syncing $mod"
		cd $mod
		git pull $2 master
		cd ..
	done
	;;
	
_resync.)
	for mod in "${MODULES[@]}"; do

		cd /local/service/$mod
			echo ">>>> $mod"
			git pull agent master
		cd ..

	done
	;;

_all.)

	for mod in "${MODULES[@]}"; do

		cd /local/service/$mod
			if test -f maint.sh; then
				echo ">>>> $mod"
				source ./maint.sh "$2" "$3" "$4"
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

_config.)
	if test -f ./config.sh; then
		source ./config.sh
	fi
	;;
	
_configall.)

	for mod in "${MODULES[@]}"; do

		let x=Totem_$mod
		if [ $x != 1 ]; then
			if test -f ../$mod/config.sh; then
				echo "config $mod"
				cd ../$mod
					source ./config.sh
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

_dbrecover.)
	source ./maint.sh mysql prime
	;;

startdbs.)
	source ./maint.sh mysql start
	source ./maint.sh neo4j start
	;;
	
neo4j.)

	case "$2." in
	
	start.)
		$NEO4J/bin/neo4j console &
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
			$MYSQL/bin/mysqld_safe --defaults-file=$MYSQL/my.cnf --sql-mode="" --max_allowed_packet=64000000 &
		fi
		;;

	esac
	;;

#
# Maintenance and startups
#

snapdb.)
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST openv >/mnt/snapshots/sqldbs/openv.sql
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -R app --ignore-table=app.gtd >/mnt/snapshots/sqldbs/app.sql
	mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST -ndtR app >/mnt/snapshots/sqldbs/funcs.sql
	;;
	
snapsrv.)
	cd /local/service
	for mod in "${MODULES[@]}"; do
		echo "snapping $map"
		zip -ry /mnt/snapshots/totem.zip $mod -x $mod/node_modules/\* $mod/.git/\* $mod/\*/.git/\* $mod/_\* $mod/~\* $mod/math/\* $mod/mljs/\* $mod/prm/\*
	done
	#zip $MAP/archives/snap.zip */*.js */README* */*.sh debe/uis/* debe/admins/*/* debe/public/*/* totem/certs/* atomic/ifs/*.cpp atomic/ifs/*/*.cpp atomic/ifs/*/*.h
	;;

snapmap.) 
	cd /local
	zip /mnt/snapshots/local_map.zip include/* include/R/* lib64/* lib64/R/*
	;;
	
snap.)
	source ./maint.sh snapdb
	source ./maint.sh snapsrv
	source ./maint.sh snapmap
	;;
	
start_cesium.)
	if P=$(pgrep cesium); then
		echo -e "cesium service running: \n$P"
	else
		#node $BASE/cesium/geonode/geocesium --port 8083 --public &
		#node $BASE/cesium/server --port 8083 --public &
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
	source ./maint.sh config debug	# setup external vars
	source ./maint.sh mysql start	# start mysql service
	source ./maint.sh neo4j start	# start neo4j service
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

_prmgen.)	# legacy codedoc gen

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
	source ./maint.sh putduck totem
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
		source ./maint.sh doc "$mod"1 "$mod"2

	done
	;;
	
proxy.)	# establish email proxy
	ssh jamesdb@54.86.26.118 -L 5200:172.31.76.130:8080 -i ~/.ssh/aws_rsa.pri	
	;;
		
_nada.)	# quite mode
	;;

_notes.) 		# centos install notes

	vi notes.txt
	;;
	
_bind.) 	# rebind atomic engines

	cd $ENGINES/opencv
	node-gyp rebuild $GYPOPTS
	
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

gitgenkey.) 		# make pub-pri key for git auto-password agent 
	echo "store keys under .ssh/git_totemstan_rsa and upload git_totemstan_rsa.pub key to git account." 
	echo "git remote add agent git@github.com:totemstan/REPO"
	ssh-keygen -t rsa -b 4096 -C "brian.d.james@comcast.com"
	;;

gitagent.)		# start ssh agent
	eval $(ssh-agent -s)
	ssh-add ~/.ssh/git_totemstan_rsa
	;;

gitconfig.)
	git config --global http.sslVerify false
	;;

_gitzip.)
	zip -ry ../transfer/$MODULE.zip * -x \*/node_modules/\* \*/_\* \*/debe/captcha\* \*/debe/clients\*
	;;

zipmin.)

	for mod in "${MODULES[@]}"; do
		zip -ry /local/archive/totem/$mod.zip ./$mod/* -x \*/_\* /debe/captcha\* /debe/clients\* /debe/config/stores\* \*/.git* \*/node_modules/\*
	done
	;;

zipnogit.)

	for mod in "${MODULES[@]}"; do
		echo "ziping $mod"
		zip -ry /local/archive/snapshot/$mod ./$mod/* -x \*/_\* /debe/captcha\* /debe/clients\* /debe/config/stores\* \*/.git* 
	done
	;;
	
help.)	# some help

	echo "Usage:"
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

net_restart.)
	sudo /etc/init.d/network restart
	;;

admin.|lab.)  	# start totem

	case "$SERVICE_OPER." in 
		yes.)
			sudo -E env "PATH=$PATH" env "LD_LIBRARY_PATH=$LD_LIBRARY_PATH" forever -o debe.log start debe.js $1 $2 $3 $4 $5
			;;
		
		*)
			node debe.js $1 $2 $3 $4 $5 
			;;
	esac

esac

# UNCLASSIFIED
