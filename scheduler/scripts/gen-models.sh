#!/bin/bash

mkdir -p models
rm -Rf models/*.xo.go
xo pgsql://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable -o models