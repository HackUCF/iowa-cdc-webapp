#!/usr/bin/env bash
infile="../.env.enc"
echo "Input file to read? [default=$infile]"
read infile
infile="${infile:-../.env.enc}"

echo "Enter password:"
read password

source <(openssl enc -aes-256-cbc -salt -d -in $infile -k $password)
cd ..
npm install --production
pm2 reload ecosystem.json --env production --update-env
