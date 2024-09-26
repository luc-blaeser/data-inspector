#!/usr/bin/env bash

dfx start --clean --background
dfx deploy
dfx canister update-settings example1 --add-controller 2vxsx-fae
dfx canister update-settings example2 --add-controller 2vxsx-fae
dfx canister update-settings example3 --add-controller 2vxsx-fae
dfx canister update-settings example4 --add-controller 2vxsx-fae
dfx canister call example3 demoData "(10, 2)"
npm start
