#!/bin/bash
# UNCLASSIFIED

export BASE=/local
export HERE=`pwd`

# initialize dev/prod paths
export PATH=/local/bin:/usr/bin:/local/sbin:/usr/sbin
export GITUSER=totemstan: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
export REPO=https://$GITUSER@github.com/totemstan

# NodeJS  
export NODE=$BASE/nodejs
export PATH=$PATH:$NODE/bin
export NODELIB=$NODE/lib/node_modules
export node_path=./node_modules
export NPM_CONFIG_PREFIX=~/.npm-global

# MYSQL
export MYSQL=$BASE/mysql
export PATH=$MYSQL/bin:$PATH
export MYSQL_USER=root
export MYSQL_NAME=app
export MYSQL_HOST=localhost
export ODBC_NAME=totem-app
export ODBC_USER=ileuser

# POCs
#export ADMIN="admin_tbd@nga.mil"
#export OVERLORD="overlord_tbd@nga.mil"
#export SUPER="supervisor_tbd@nga.mil"
			
# NEO4J
export NEO4J="bolt://localhost" # "http://root:NGA@localhost:7474"
export NEO4J_USER="neo4j"

# doc and dev tools
export PATH=/opt/cmake:$PATH 			# latest cmake
#export PATH=$BASE/oxygen/bin:$PATH    	# doxygen code documenter if needed (jsduck used)
#export PATH=$PATH:/usr/local/share/gems/gems/jsduck-5.3.4/bin 	# for jsduck

# docker
export GPU="--device /dev/nvidia0:/dev/nvidia0 --device /dev/nvidiactl:/dev/nvidiactl --device /dev/nvidia-uvm:/dev/nvidia-uvm"
export VOL="--volume /local:/base --volume /home/jamesdb/installs:/installs --volume /usr/lib64:/usr/lib64"
export NET="--net host"
export RUN="run -it $GPU $VOL $NET"
export RUND="$RUN -d"

# gpu support
case "$(hostname)." in
awshigh.)  # AWS
	export USER=jamesdb
	export GPUHOST=$USER@swag-gpu-01
	export GUIHOST=$USER@swag-ws-02
	;;
	
ilehigh.) 	# ILE high
	export USER=jamesbd
	export GPUHOST=giatstlgui01.innovision.local
	export GUIHOST=giatstlgui01.innovision.local
	;;

wsn3303.)  # ILE low
	export USER=jamesbd
	export GPUHOST=wsn3303
	export GUIHOST=wsn3303
	;;

acmesds.)  # dev
	export USER=mystery
	export GPUHOST=
	export GUIHOST=

esac

# define server domains
#export SERVICE_NAME=Totem1
export SERVICE_MASTER_URL=http://localhost:8080
export SERVICE_WORKER_URL=https://localhost:8081

#export SERVICE_WORKER_URL=https://localhost:8443
#export SERVICE_WORKER_URL=http://localhost:8081  # in debug mode

# PRM doc interface
#export DUCK=/media/sf_vmshare/ducksrc

# define passwords
source _pass.sh

# UNCLASSIFIED
