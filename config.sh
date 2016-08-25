#!/bin/bash
# UNCLASSIFIED when IP addresses and passwords are undefined

export node_path=./node_modules
export HERE=`pwd`

# initialize dev/prod paths
export BASE=/usr/local
export PATH=/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin	
export LD_LIBRARY_PATH=
export REPO=git@git.geointapps.org:acmesds
export PROJECTS=(totem engine chipper debe app sql enum base graceful-lwip reader)
export SETUP=". setup.sh"

# NodeJS  
export NODE=$BASE/nodejs
export PATH=$PATH:$NODE/bin

# MYSQL
export MYSQL=$BASE/mysql
export PATH=$PATH:$MYSQL/bin
export MYSQL_PASS=NGA
export MYSQL_USER=root
export MYSQL_NAME=app1
export MYSQL_HOST=localhost

# tools
export PATH=/opt/cmake:$PATH 			# latest cmake
export PATH=$BASE/oxygen/bin:$PATH    	# doxygen code documenter

# docker
export GPU="--device /dev/nvidia0:/dev/nvidia0 --device /dev/nvidiactl:/dev/nvidiactl --device /dev/nvidia-uvm:/dev/nvidia-uvm"
export VOL="--volume /usr/local:/base --volume /home/jamesdb/installs:/installs --volume /usr/lib64:/usr/lib64"
export NET="--net host"
export RUN="run -it $GPU $VOL $NET"
export RUND="$RUN -d"

# machines and geo shortcuts
# AWS
export USER=jamesdb
export GPU_HOST=$USER@swag-gpu-01
export CPU_HOST=$USER@swag-ws-02

# ILE
export USER=jamesbd
export GPU_HOST=$USER@giatstlgpu01
export CPU_HOST=$USER@giatstltbd

#export GEO=". $BASH_SOURCE"
export GYPOPTS=--nodedir=$NODE/install	# use "node-gyp $GYPTOPS" to override distro ref to inet
export GEOBIND="node-gyp rebuild"
#export LINK=g++ 			# fixes node-gyp flock issue when source files on NFS system

# UNCLASSIFIED when IP addresses and passwords are undefined
