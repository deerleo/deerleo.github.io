// The ride, in order. The waterway loops: after the last realm the boat comes back to the first.
// `veil` is the colour of the mist or darkness a realm is entered through (the passage before it takes this colour).
// Test realms (lab, lifetest, modeltest, watertest ...) are not listed: open them with ?realm=<file name>.
export const REALMS = [
  { id: 'landing', name: "The landing", load: () => import('./landing.js') },
  { id: 'reach', name: "The dyers' reach", veil: '#f3ddb0', load: () => import('./reach.js') },
  { id: 'orchard', name: "The orchard in flood", veil: '#0b0d1e', load: () => import('./orchard.js') },
  { id: 'town', name: "The town below", veil: '#8e8aa8', load: () => import('./town.js') },
  { id: 'theatre', name: "The theatre of leaves", veil: '#140f18', load: () => import('./theatre.js') },
  { id: 'sea', name: "The answering sea", veil: '#05070f', load: () => import('./sea.js') },
  { id: 'snow', name: "The orchard in snow", veil: '#11111a', load: () => import('./snow.js') },
  { id: 'sky', name: "The standing sky", veil: '#aab4d6', load: () => import('./sky.js') },
];
