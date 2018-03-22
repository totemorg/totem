#!/bin/bash
# UNCLASSIFIED when IP addresses and passwords are undefined

export HERE=`pwd`

#export node_path=./node_modules

# initialize dev/prod paths
export BASE=/local
export MAP=/media/sf_vmshare
export SRV=$BASE/service
export PATH=/local/bin:/usr/bin:/local/sbin:/usr/sbin
export LD_LIBRARY_PATH=
export REPO=git@git.geointapps.org:acmesds

# JSDUCK
export PATH=$PATH:/usr/local/share/gems/gems/jsduck-5.3.4/bin

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

# service
export SERVICE_NAME=Totem1

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
export REBUILD="node-gyp rebuild --nodedir=$NODE"	# use "node-gyp $GYPTOPS" to override distro ref to inet
#export ENGINES=$SRV/engine/ifs
#export GEOBIND="node-gyp rebuild"
#export LINK=g++ 			# fixes node-gyp flock issue when source files on NFS system

# Devs
export INCLUDE=$BASE/include
export LIB=$BASE/lib64

# machines and geo shortcuts
# AWS
#export USER=jamesdb
#export GPUHOST=$USER@swag-gpu-01
#export GUIHOST=$USER@swag-ws-02

# ILE
#export USER=jamesbd
#export GPUHOST=giatstlgui01.innovision.local
#export GUIHOST=giatstlgui01.innovision.local

# SBU
export USER=jamesbd
export GPUHOST=wsn3303
export GUIHOST=wsn3303

# define passwords
source pass.sh

# define server domains
export TOTEM_MASTER=http://localhost:8080
export TOTEM_WORKER=https://localhost:8081

# define tasking node urls
export NODE0=http://localhost:8080/task
export NODE1=http://192.1.1.2:8443/task
export NODE2=http://192.1.1.3:8443/task
export NODE3=http://192.1.1.4:8443/task

# UNCLASSIFIED when IP addresses and passwords are undefined
