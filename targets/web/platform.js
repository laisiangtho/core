/**
 * Web platform services. Capabilities absent here (e.g. saveFile) make any
 * feature that requires them unavailable to this target; boot() enforces it.
 */
import { createInstallOffer, createUpdates } from './register-sw.js';

export function createPlatform() {
  // Both are created at composition time so nothing that arrives early — an
  // install offer, a worker already waiting — is missed while the app boots.
  const updates = import.meta.env.PROD ? createUpdates() : null;
  const install = createInstallOffer();

  return Object.freeze({
    id: 'web',
    capabilities: Object.freeze({
      openExternal(url) {
        const u = new URL(url);
        if (u.protocol !== 'https:') throw new Error(`openExternal: refusing non-https URL ${url}`);
        window.open(u.href, '_blank', 'noopener,noreferrer');
      },
      ...(updates ? { updates } : {}),
      install,
    }),
  });
}
