export const idlFactory = ({ IDL }) => {
  return IDL.Service({ 'demoData' : IDL.Func([IDL.Nat, IDL.Nat], [], []) });
};
export const init = ({ IDL }) => { return []; };
