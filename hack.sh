#!/bin/bash
# UNCLASSIFIED when IP addresses and passwords are undefined

case "$1." in

flatten.)
	rm _hash
	rm _make.sh
	mkdir flat
	source hack.sh $2
	sed -E "s/([^ ]*) \|\| ([^ ]*)/cp \2 flat\/\1/" _hash >_flatten.sh
	sed -E "s/([^ ]*) \|\| ([^ ]*)/cp -n flat\/\1* \2/" _hash >_expand.sh
	echo "run _flatten, then _make, then _expand"
	;;

*)
	echo "hacking $1"
	echo "mkdir $1" >> _make.sh
	for file in $1/*; do
		if [ -d "$file" ]; then
			source hack.sh $file
		else
			echo "$(echo "$file" | md5sum | cut -d' ' -f1) || $file" >> _hash
		fi
	done
	;;

esac

# UNCLASSIFIED