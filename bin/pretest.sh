#!/bin/bash

set -e

parser="./node_modules/melody-parser"
traverse="./node_modules/melody-traverse"
types="./node_modules/melody-types"
if [ ! -L $parser ]; then
  ln -s ../packages/melody-parser ./node_modules/melody-parser
  echo "melody-parser linked to the top level node_modules"
fi

if [ ! -L $types ]; then
  ln -s ../packages/melody-types ./node_modules/melody-types
  echo "melody-types linked to the top level node_modules"
fi


if [ ! -L $traverse ]; then
  ln -s ../packages/melody-traverse ./node_modules/melody-traverse
  echo "melody-traverse linked to the top level node_modules"
fi
