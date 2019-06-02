#!/bin/bash
# UNCLASSIFIED when IP addresses and passwords are undefined

export BASE=/local
export HERE=`pwd`

# initialize dev/prod paths
export MAP=/media/sf_vmshare
export PATH=/local/bin:/usr/bin:/local/sbin:/usr/sbin
export REPO=git@git.geointapps.org:acmesds

# NodeJS  
export NODE=$BASE/nodejs
export PATH=$PATH:$NODE/bin
export NODELIB=$NODE/lib/node_modules
export RED=$NODELIB/node-red

# MYSQL
export MYSQL=$BASE/mysql
export PATH=$MYSQL/bin:$PATH
export MYSQL_USER=root
export MYSQL_NAME=app
export MYSQL_HOST=localhost
export ODBC_NAME=totem-app
export ODBC_USER=ileuser

# doc and dev tools
export PATH=/opt/cmake:$PATH 			# latest cmake
#export PATH=$BASE/oxygen/bin:$PATH    	# doxygen code documenter if needed (jsduck used)
export PATH=$PATH:/usr/local/share/gems/gems/jsduck-5.3.4/bin 	# for jsduck

# docker
export GPU="--device /dev/nvidia0:/dev/nvidia0 --device /dev/nvidiactl:/dev/nvidiactl --device /dev/nvidia-uvm:/dev/nvidia-uvm"
export VOL="--volume /local:/base --volume /home/jamesdb/installs:/installs --volume /usr/lib64:/usr/lib64"
export NET="--net host"
export RUN="run -it $GPU $VOL $NET"
export RUND="$RUN -d"

case "sbudev." in
awsdev.)  # AWS
	export USER=jamesdb
	export GPUHOST=$USER@swag-gpu-01
	export GUIHOST=$USER@swag-ws-02
	;;
	
iledec.) 	# ILE
	export USER=jamesbd
	export GPUHOST=giatstlgui01.innovision.local
	export GUIHOST=giatstlgui01.innovision.local
	;;
	
sbudev.)  # SBU
	export USER=jamesbd
	export GPUHOST=wsn3303
	export GUIHOST=wsn3303

esac

# define server domains
export SERVICE_NAME=Totem1
export SERVICE_MASTER_URL=http://localhost:8080
export SERVICE_WORKER_URL=https://localhost:8443
#export SERVICE_WORKER_URL=https://localhost:8443
#export SERVICE_WORKER_URL=http://localhost:8081  # in debug mode

# PRM doc interface
export DUCK=/media/sf_vmshare/ducksrc

# define task sharding nodes
export SHARD0=http://localhost:8080/task
export SHARD1=http://localhost:8080/task
export SHARD2=http://localhost:8080/task
export SHARD3=http://localhost:8080/task

# define passwords
source pass.sh

# UNCLASSIFIED when IP addresses and passwords are undefined
