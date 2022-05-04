#!/bin/bash

IMAGE=openapi-generator-cli:5.4.0
USER=$(id -u):$(id -g)
ROOTDIR=$(git rev-parse --show-toplevel)/packages/unchained-client
GENDIR=$(pwd)/generator

while getopts ':e:h' flag; do
    case "${flag}" in
        e) env=${OPTARG};;
		h) echo -e "Usage: $(basename $0) -e (local|dev|public)" && exit 1;;
		:) echo -e "Option requires an argument.\nUsage: $(basename $0) -e (local|dev|public)" && exit 1;;
    	?) echo -e "Invalid command option.\nUsage: $(basename $0) -e (local|dev|public)" && exit 1;;
    esac
done

if [[ $env == "" ]]; then
	echo -e "Usage: $(basename $0) -e (local|dev|public)" && exit 1
fi

if [[ "$(docker images -q openapi-generator-cli:5.4.0 2> /dev/null)" == "" ]]; then
	docker build $GENDIR -t openapi-generator-cli:5.4.0
fi

docker run --platform=linux/amd64 --rm --user $USER -e JAVA_OPTS='-Dlog.level=error' -v "$ROOTDIR:$ROOTDIR" -w $GENDIR/$env $IMAGE generate

exit 0
