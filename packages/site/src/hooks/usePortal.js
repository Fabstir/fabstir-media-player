import useS5net from './useS5';

const SIA_CID_PREFIX = 'sia:';

export default function usePortal() {
  const s5 = useS5net();

  // portalType is a hack for when a cid is transformed to an actual portal url
  // hence unable to distinguish
  async function downloadFile(uri, customOptions) {
    if (!uri) return;
    return await s5.downloadFile(uri, customOptions);
  }

  async function getPortalLinkUrl(uri, customOptions) {
    if (!uri) return;
    return await s5.getPortalLinkUrl(uri, customOptions);
  }

  async function getBlobUrl(uri) {
    if (!uri) return;
    return await s5.getBlobUrl(uri);
  }

  function getPortalType(uri) {
    return null;
  }

  // default
  return {
    uploadFile: s5.uploadFile,
    downloadFile,
    uploadDirectory: s5.uploadDirectory,
    getPortalLinkUrl,
    getPortalType,
    getBlobUrl,
  };
}
