#!/usr/bin/env bash
filename="../.env"
echo "Input file to read? [default=$filename]"
read filename
filename="${filename:-../.env}"

echo "Enter password:"
read password

openssl enc -aes-256-cbc -salt -e -in $filename -out $filename.enc -k $password
