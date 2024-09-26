export const idlFactory = ({ IDL }) => {
  return IDL.Service({ 'change' : IDL.Func([], [], []) });
};
export const init = ({ IDL }) => { return []; };
