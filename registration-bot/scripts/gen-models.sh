#!/bin/bash

npx sequelize-auto -o "./src/models" -d postgres -h localhost -u postgres -p 5432 -x mysecretpassword -e postgres