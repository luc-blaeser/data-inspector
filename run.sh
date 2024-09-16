#!/usr/bin/env bash

export DFX=~/Documents/GitHub/sdk/target/debug/dfx
$DFX start --clean --background
$DFX deploy
$DFX canister update-settings data-inspection-backend --add-controller 2vxsx-fae
npm start
