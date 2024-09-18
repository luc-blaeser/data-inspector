#!/usr/bin/env bash

dfx start --clean --background
dfx deploy
dfx canister update-settings backend1 --add-controller 2vxsx-fae
dfx canister update-settings backend2 --add-controller 2vxsx-fae
dfx canister update-settings backend3 --add-controller 2vxsx-fae
dfx canister call backend3 demoData "(10, 2)"
npm start
