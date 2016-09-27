#!/bin/bash
# UNCLASSIFIED when IP addresses and passwords are undefined

export node_path=./node_modules
export HERE=`pwd`

# initialize dev/prod paths
#export PATH=/local/bin:/usr/bin:/local/sbin:/usr/sbin	
#export LD_LIBRARY_PATH=
export REPO=git@git.geointapps.org:acmesds
export PROJECTS=(totem engine chipper debe app sql enum base graceful-lwip reader)
export SETUP=". setup.sh"

# NodeJS  
export NODE=$BASE/nodejs
export PATH=$PATH:$NODE/bin

# MYSQL
export MYSQL_PASS=root
export MYSQL_USER=root
export MYSQL_NAME=app1
export MYSQL_HOST=localhost

# service
export SERVICE_PASS=test

# tools
export PATH=/opt/cmake:$PATH 			# latest cmake
export PATH=$BASE/oxygen/bin:$PATH    	# doxygen code documenter

# docker
export GPU="--device /dev/nvidia0:/dev/nvidia0 --device /dev/nvidiactl:/dev/nvidiactl --device /dev/nvidia-uvm:/dev/nvidia-uvm"
export VOL="--volume /local:/base --volume /home/jamesdb/installs:/installs --volume /usr/lib64:/usr/lib64"
export NET="--net host"
export RUN="run -it $GPU $VOL $NET"
export RUND="$RUN -d"

# machines and geo shortcuts

#export GEO=". $BASH_SOURCE"
export GYPOPTS=--nodedir=$NODE/install	# use "node-gyp $GYPTOPS" to override distro ref to inet
export GEOBIND="node-gyp rebuild"
#export LINK=g++ 			# fixes node-gyp flock issue when source files on NFS system

# UNCLASSIFIED when IP addresses and passwords are undefined
