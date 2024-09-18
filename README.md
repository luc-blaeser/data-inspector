# Motoko Data Inspection

Demonstrator for generic Motoko data inspection (aka data visualizer):
* Allows to connect to any Motoko canister supporting data inspection.
* The user must be a controller of the inspected canister.
* The live data reachable from the main actor can be displayed.
* Supports two types of visualizations:
  - Detailed: Represent every heap object as a node.
  - Compact: Collapse `mutbox` and boxed numbers, skip object hash blobs.

## Setup

1. Use latest beta `dfx` version `0.24.0-beta.0` or higher:

  ```
  DFX_VERSION=0.24.0-beta.0 sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)
  ```

2. Use and build Motoko branch `luc/data-inspection`

  ```
  git checkout luc/data-inspection
  make -C rts
  make -C src
  ```

3. Start the demo:

  ```
  ./run.sh
  ```

4. Use the frontend canister in browser:

  ```
  http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943
  ```

## TODOs

- Design a DBMS-like frontend.
- Show field names.
- Large heap support (chunked downloads, incremental updates).
