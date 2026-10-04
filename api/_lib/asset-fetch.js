export function getServerAssetAuthHeaders() {
  const key =
    process.env.ASSET_SHARED_KEY ||
    process.env.VITE_ASSET_SHARED_KEY ||
    '';
  return key ? { 'X-Asset-Key': key } : {};
}
