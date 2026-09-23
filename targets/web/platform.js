/**
 * Web platform services. Capabilities absent here (e.g. saveFile) make any
 * feature that requires them unavailable to this target; boot() enforces it.
 */
export function createPlatform() {
  return Object.freeze({
    id: 'web',
    capabilities: Object.freeze({
      openExternal(url) {
        const u = new URL(url);
        if (u.protocol !== 'https:') throw new Error(`openExternal: refusing non-https URL ${url}`);
        window.open(u.href, '_blank', 'noopener,noreferrer');
      },
    }),
  });
}
