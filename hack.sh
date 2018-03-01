#!/bin/bash
# UNCLASSIFIED when IP addresses and passwords are undefined

case "$1." in

flatten.)
	rm _hash
	rm _links
	rm _flatten.sh
	rm _expand.sh
	rm _make.sh
	let block=0
	let maxfiles=450
	let files=0
	mkdir flat$block
	source hack.sh $2
	sed -E "s/([^ ]*) \|\| ([^ ]*)/cp \2 \1/" _hash >_flatten.sh
	sed -E "s/([^ ]*) \|\| ([^ ]*)/cp -n \1* \2/" _hash >_expand.sh
	echo "run _flatten, then _make, then _expand"
	;;

*)
	echo "scan $1 block=$block files=$files max=$maxfiles"
	echo "mkdir $1" >> _make.sh
	for file in $1/*; do
		if [ -L "$file" ]; then   # ignore symbolic links
			echo "ignoring $file" >> _links			
		elif [ -d "$file" ]; then  # recurse directories
			. hack.sh $file
		else   # add file to copy list
			echo "flat$block/$(echo "$file" | md5sum | cut -d' ' -f1) || $file" >> _hash
			let files=files+1
			if [ $files -gt $maxfiles ]; then
				let block=block+1
				let files=0
				mkdir flat$block
				echo "mkdir flat$block" >> _make.sh
			fi
		fi
	done
	;;

esac

# UNCLASSIFIED