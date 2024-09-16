import { Actor, ActorMethod, ActorSubclass, HttpAgent } from "@dfinity/agent";

import type { IDL } from '@dfinity/candid';

export const inspectData = async (canisterId: string, dfxNetwork: string) => {
    const agent = new HttpAgent({});
    const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
        return IDL.Service({ '__motoko_inspect_data': IDL.Func([], [IDL.Vec(IDL.Nat8)], []) });
    };
    if (dfxNetwork !== "ic") {
        agent.fetchRootKey().catch((err) => {
            console.warn(
                "Unable to fetch root key. Check to ensure that your local replica is running"
            );
            console.error(err);
        });
    }
    type DATA_INSPECTION = { '__motoko_inspect_data': ActorMethod<[], Uint8Array | number[]> };
    const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
    }) as ActorSubclass<DATA_INSPECTION>;
    return await actor.__motoko_inspect_data();
};
