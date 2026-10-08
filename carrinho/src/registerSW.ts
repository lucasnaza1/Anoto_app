import { registerSW } from "virtual:pwa-register";

// Atualização automática: quando um novo service worker estiver pronto,
// ele assume e o app passa a ser servido da versão nova no próximo load.
registerSW({ immediate: false });
