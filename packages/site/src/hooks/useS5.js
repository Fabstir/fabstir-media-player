import { S5Client } from 's5client';
import { process_env } from '../utils/process_env';
import { user } from '../components/user';
import {
  getKeyFromEncryptedCid,
  combineKeytoEncryptedCid,
  removeKeyFromEncryptedCid,
} from '../utils/s5EncryptCIDHelper';

require('gun/lib/load.js');

const fileExtensionsToContentTypes = {
  aac: 'audio/aac',
  aiff: 'audio/x-aiff',
  amr: 'audio/amr',
  avi: 'video/x-msvideo',
  bmp: 'image/bmp',
  css: 'text/css',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gif: 'image/gif',
  html: 'text/html',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript',
  json: 'application/json',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  ogg: 'audio/ogg',
  pdf: 'application/pdf',
  png: 'image/png',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rar: 'application/x-rar-compressed',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  wav: 'audio/wav',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};

/**
 * A custom React hook that returns the S5 network object.
 *
 * @returns {Object} - The S5 network object.
 */
export default function useS5net() {
  const headers = {};
  const customClientOptions = {
    authToken: process_env.PORTAL_AUTH_TOKEN,
    headers,
    withCredentials: false,
  };

  console.log(`useS5net: before new S5Client`);
  const client = new S5Client(process_env.PORTAL_URL, customClientOptions);
  console.log(`useS5net: after client = `, client);

  async function uploadFile(acceptedFile, customOptions = {}) {
    console.log(`useS5net: uploadFile await client.uploadFile`);
    try {
      const { cid, key, cidWithoutKey } = await client.uploadFile(
        acceptedFile,
        customOptions,
      );
      console.log(`useS5net: uploadFile customOptions  = `, customOptions);
      console.log(`useS5net: uploadFile cid  = `, cid);

      if (customOptions.encrypt) {
        console.log(`useS5net: uploadFile key  = `, key);
        console.log(`useS5net: uploadFile cidWithoutKey  = `, cidWithoutKey);

        if (key !== getKeyFromEncryptedCid(cid)) {
          // Throw an error or handle it somehow
          throw new Error(
            `useS5net: key ${key} !== getKeyFromEncryptedCid(cid) ${getKeyFromEncryptedCid(
              cid,
            )}`,
          );
        }

        if (cidWithoutKey !== removeKeyFromEncryptedCid(cid)) {
          // Throw an error or handle it somehow
          throw new Error(
            `useS5net: key ${cidWithoutKey} !== removeKeyFromEncryptedCid(cid) ${removeKeyFromEncryptedCid(
              cid,
            )}`,
          );
        }

        if (cid !== combineKeytoEncryptedCid(key, cidWithoutKey)) {
          // Throw an error or handle it somehow
          throw new Error(
            `useS5net: key ${cid} !== combineKeytoEncryptedCid(key, cidWithoutKey) ${combineKeytoEncryptedCid(
              key,
              cidWithoutKey,
            )}`,
          );
        }
      }

      const fileExtension = acceptedFile.name?.split('.').pop(); // get file extension
      const cidWithExtension = cid + (fileExtension ? `.${fileExtension}` : '');

      return cidWithExtension;
    } catch (error) {
      console.error('useS5net: Failed to upload the file:', error);
    }
  }

  /**
   * Uploads a large file to the S5 network.
   *
   * @param {Object} file - The file object to be uploaded.
   * @param {Object} options - The options object for the upload.
   * @param {Function} onProgress - The callback function to be called on upload progress.
   * @returns {Promise} - A promise that resolves with the uploaded file's metadata.
   */
  async function uploadLargeFile(acceptedFile, customOptions = {}) {
    console.log(`useS5net: uploadLargeFile await client.uploadFile2`);
    const { cid, key, cidWithoutKey } = await client.uploadLargeFile(
      acceptedFile,
      customOptions,
    );

    assert(key === getKeyFromEncryptedCid(cid));
    assert(cidWithoutKey === removeKeyFromEncryptedCid(cid));

    const fileExtension = acceptedFile.name?.split('.').pop(); // get file extension
    const cidWithExtension = cid + (fileExtension ? `.${fileExtension}` : '');

    return cidWithExtension;
  }

  async function uploadDirectory(fileObjects, folderName, customOptions) {
    const { cid } = await client.uploadDirectory(
      fileObjects,
      folderName,
      customOptions,
    );
    return cid;
  }

  /**
   * Downloads a file from the S5 network.
   *
   * @param {String} cid - The CID of the file to be downloaded.
   * @param {Object} customOptions - The custom options object for the download.
   * @param {String} customOptions.path - The path of the file to be downloaded.
   * @returns {Promise} - A promise that resolves with the downloaded file's content.
   */
  async function downloadFile(cid, customOptions) {
    try {
      let cidReq;
      console.log('downloadFile: inside');

      if (customOptions.path) {
        console.log('downloadFile: before await client.getMetadata(cid)');
        const metadata = await client.getMetadata(cid);
        console.log('downloadFile: metadata = ', metadata);

        cidReq = metadata?.paths[customOptions.path]?.cid;
      } else cidReq = cid;

      console.log('downloadFile: metadata = ', cidReq);
      const url = await client.getCidUrl(cidReq);
      console.log('downloadFile: url = ', url);

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error fetching the file: ${response.statusText}`);
      }

      const textContent = await response.text();
      return textContent;
    } catch (error) {
      console.error('Failed to download the file:', error);
    }
  }

  async function downloadFileAsArrayBuffer(cid) {
    try {
      console.log('downloadFileAsArrayBuffer:', cid);
      const url = await client.getCidUrl(cid);
      console.log('downloadFileAsArrayBuffer:', url);

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error fetching the file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return arrayBuffer;
    } catch (error) {
      console.error('Failed to download the file:', error);
    }
  }

  async function downloadFileWithFields(cid) {
    try {
      const fileExtension = cid?.split('.').pop(); // get file extension

      console.log('downloadFileWithFields: before cid = ', cid);
      const data = await downloadFileAsArrayBuffer(cid);
      const contentType = fileExtensionsToContentTypes[fileExtension];

      console.log('downloadFileWithFields: data = ', data);
      // const { metadata } = await client.getMetadata(cid)
      // console.log('downloadFileWithFields: = ', JSON.stringify(metadata))

      const result = { data, contentType, metadata: '', cid };

      return result;
    } catch (error) {
      console.log(error);
    }

    return {
      data: undefined,
      contentType: undefined,
      metadata: undefined,
      cid: undefined,
    };
  }

  /**
   * Downloads a file from the S5 network as an array buffer, and returns a blob URL for the file.
   *
   * @param {String} uri - The CID of the file to be downloaded.
   * @returns {String} - The blob URL for the downloaded file.
   */
  async function getBlobUrl(uri) {
    const { data, contentType } = await downloadFileWithFields(uri);
    console.log('getBlobUrl: contentType = ', contentType);

    if (!data) return;

    const objectUrl = URL.createObjectURL(
      new Blob([data], { type: contentType }),
    );

    return objectUrl;
  }

  /**
   * Downloads a large file from the S5 network.
   *
   * @param {String} cid - The CID of the file to be downloaded.
   * @param {Object} options - The options object for the download.
   * @param {Function} onProgress - The callback function to be called on download progress.
   * @returns {Promise} - A promise that resolves with the downloaded file's content.
   */
  async function downloadLargeFile(cid, byteRange = null) {
    try {
      const url = await client.getCidUrl(cid);
      const headers = {};

      if (byteRange) {
        headers['Range'] = `bytes=${byteRange}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error fetching the image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return arrayBuffer;
    } catch (error) {
      console.error('Failed to download the image:', error);
    }
  }

  /**
   * Returns the URL for the S5 portal link with the given parameters.
   *
   * @param {String} cid - The CID of the file.
   * @param {String} filename - The name of the file.
   * @param {String} mimeType - The MIME type of the file.
   * @param {String} size - The size of the file.
   * @returns {String} - The URL for the S5 portal link.
   */
  async function getPortalLinkUrl(cid, customOptions) {
    if (!cid) return cid;

    let url;
    if (customOptions?.path) {
      const metadata = await client.getMetadata(cid);
      console.log('getPortalLinkUrl: metadata = ', metadata);

      const cid2 = metadata?.paths[customOptions.path]?.cid;
      url = await client.getCidUrl(cid2);
    } else url = await client.getCidUrl(cid);

    return url;
  }

  /**
   * Gets the metadata for a file or directory in the S5 network.
   *
   * @param {String} cid - The CID of the file or directory.
   * @returns {Promise} - A promise that resolves with the metadata object.
   */
  async function getMetadata(cidWithoutKey) {
    if (!cidWithoutKey) return cidWithoutKey;

    const metaDataScrambled = await new Promise((res) =>
      user
        .get('media')
        .get(cidWithoutKey)
        .once((final_value) => res(final_value)),
    );

    if (!metaDataScrambled) return metaDataScrambled;

    console.log(
      'useS5net: getMetadata: metaDataScrambled = ',
      metaDataScrambled,
    );

    const metaData = await SEA.decrypt(metaDataScrambled, user._.sea);
    console.log('useS5net: getMetadata: metaData = ', metaData);

    return metaData;
  }

  /**
   * Updates the metadata for a file or directory in the S5 network.
   *
   * @param {String} cid - The CID of the file or directory.
   * @param {Object} metadata - The new metadata object.
   * @returns {Promise} - A promise that resolves when the metadata has been updated.
   */
  async function putMetadata(cidWithoutKey, metaData) {
    if (!cidWithoutKey) return cidWithoutKey;

    const metaDataScrambled = await SEA.encrypt(
      JSON.stringify(metaData),
      user._.sea,
    );

    console.log('useS5net: putMetadata: cidWithoutKey = ', cidWithoutKey);

    console.log(
      'useS5net: putMetadata: metaDataScrambled = ',
      metaDataScrambled,
    );

    user.get('media').get(cidWithoutKey).put(metaDataScrambled);
  }

  /**
   * A boolean flag indicating whether a transcode is pending (being transcoded)
   */
  async function isTranscodePending(cid) {
    if (!cid) return '';
    const cidScrambled = await SEA.encrypt(cid, user._.sea);

    const result = await new Promise((res) =>
      user
        .get('transcodes_pending')
        .get(cidScrambled)
        .once((final_value) => res(final_value)),
    );

    return result ? result.exists : false;
  }

  /**
   * Set the `isTranscodePending` to true when a transcode is pending (being transcoded)
   * or false otherwise
   *
   * @param {Boolean} value - The new value for the `isTranscodePending` flag.
   */
  async function setTranscodePending(cid) {
    if (!cid) return;

    const cidScrambled = await SEA.encrypt(cid, user._.sea);
    console.log('useS5net: setTranscodePending: cidScrambled = ', cidScrambled);

    user.get('transcodes_pending').get(cidScrambled).put({ exists: true });
  }

  async function deleteTranscodePending(cid) {
    if (!cid) return;

    const cidScrambled = await SEA.encrypt(cid, user._.sea);
    user.get('transcodes_pending').get(cidScrambled).put(null);
  }

  async function getTranscodedMetadata(cid) {
    if (!cid) return cid;

    const extensionIndex = cid.lastIndexOf('.');
    const cidWithoutExtension =
      extensionIndex === -1 ? cid : cid.slice(0, extensionIndex);

    const transcodeUrl = `${process_env.TRANSCODER_CLIENT_URL}/get_transcoded/${cidWithoutExtension}`;
    console.log('getTranscodedMetadata: transcoded url = ', transcodeUrl);

    try {
      const response = await fetch(transcodeUrl, { method: 'POST' });
      console.log('getTranscodedMetadata: response = ', response);

      if (!response.ok) {
        console.log(
          'getTranscodedMetadata: response.status = ',
          response.status,
        );
        if (response.status === 404) {
          // The job might not be completed yet.
          return;
        } else {
          // There's an issue with the request itself, so throw an error to propagate the error to the caller.
          console.error(
            `getTranscodedMetadata: HTTP error: ${response.status}`,
          );
          throw new Error(
            `getTranscodedMetadata: HTTP error: ${response.status}`,
          );
        }
      } else {
        const data = await response.json();
        console.log('getTranscodedMetadata: data =', data);

        console.log(
          'getTranscodedMetadata: typeof data.metadata =',
          typeof data.metadata,
        );

        const metadata = data.metadata ? JSON.parse(data.metadata) : null;
        console.log('getTranscodedMetadata: metadata =', metadata);
        return metadata;
      }
    } catch (error) {
      // Network errors or other unexpected issues. Propagate the error to the caller.
      console.error('getTranscodedMetadata: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Updates the `transcodesCompleted` state with the given value.
   *
   * @param {Array} value - The new value for the `transcodesCompleted` state.
   */
  async function updateTranscodesCompleted() {
    // go through all pending, any that return a result then update 'media' node and remove from pending
    console.log('TranscodesCompleted: start');

    try {
      const results = await new Promise((res) =>
        user
          .get('transcodes_pending')
          .load((final_value) => res(final_value), { wait: 90 }),
      );
      console.log('TranscodesCompleted checked');
      console.log('TranscodesCompleted: results = ', results);

      if (results)
        for (var cidScrambled in results) {
          try {
            const cid = await SEA.decrypt(cidScrambled, user._.sea);
            const data = results[cidScrambled];

            console.log('TranscodesCompleted: data = ', data);
            console.log('TranscodesCompleted: cidScrambled = ', cidScrambled);

            console.log('TranscodesCompleted: cid = ', cid);

            if (data && data.exists) {
              console.log('TranscodesCompleted: inside data && data.exists');
              const metadata = await getTranscodedMetadata(cid);
              if (metadata) {
                console.log('TranscodesCompleted: metadata = ', metadata);
                const cidWithoutKey = removeKeyFromEncryptedCid(cid);
                console.log(
                  'TranscodesCompleted: cidWithoutKey = ',
                  cidWithoutKey,
                );

                putMetadata(cidWithoutKey, metadata);
                deleteTranscodePending(cid);
              }
            }
          } catch (error) {
            // Network errors or other unexpected issues. Stop retrying and propagate the error to the caller.
            console.error('TranscodesCompleted: Unexpected error:', error);
          }
        }
    } catch (e) {
      console.error('TranscodesCompleted: e: ', e);
    }
  }

  return {
    uploadFile,
    downloadFile,
    uploadLargeFile,
    downloadLargeFile,
    uploadDirectory,
    getPortalLinkUrl,
    getBlobUrl,
    getMetadata,
    putMetadata,
    isTranscodePending,
    setTranscodePending,
    getTranscodedMetadata,
    deleteTranscodePending,
    updateTranscodesCompleted,
  };
}
