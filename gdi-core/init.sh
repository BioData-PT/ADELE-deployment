#!/bin/bash
set -e
echo About to launch a GDI node
for e in */init.sh 
  do
    echo Running "${e}"...
    bash "${e}"
  done


