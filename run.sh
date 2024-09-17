#!/usr/bin/env bash

export DFX=~/Documents/GitHub/sdk/target/debug/dfx
$DFX start --clean --background
$DFX deploy
$DFX canister update-settings backend1 --add-controller 2vxsx-fae
$DFX canister update-settings backend2 --add-controller 2vxsx-fae
npm start
