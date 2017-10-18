#!/bin/bash

set -e

parser="./node_modules/melody-parser"
traverse="./node_modules/melody-traverse"
types="./node_modules/melody-types"

if [ -L $parser ]; then
  unlink ./node_modules/melody-parser
  echo "melody-parser unlinked from top level node_modules"
fi

if [ -L $types ]; then
  unlink ./node_modules/melody-types
  echo "melody-types unlinked from top level node_modules"
fi


if [ -L $traverse ]; then
  unlink ./node_modules/melody-traverse
  echo "melody-traverse unlinked from top level node_modules"
fi

