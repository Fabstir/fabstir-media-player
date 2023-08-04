import usePortal from './usePortal'
import { combineKeytoEncryptedCid } from '../utils/s5EncryptCIDHelper'
import useS5net from './useS5'

/**
 * A custom React hook that returns the video link for a given video cid to S5.
 *
 * @param {String} videoId - The ID of the video.
 * @returns {String} - The video link.
 */
export default function useVideoLinkS5() {
  const portNumber = parseInt(window.location.port, 10)

  const {
    getMetadata,
    getTranscodedMetadata,
    putMetadata,
    deleteTranscodePending,
  } = useS5net()

  const getPlayerSources = (metadata) => {
    const sources = []
    metadata.forEach((videoFormat) => {
      const source = {
        src: `${process.env.S5_PORTAL_STREAMING_URL}:${portNumber}/s5/blob/${videoFormat.cid}?mediaType=video%2Fmp4`,
        type: videoFormat.type,
        label: videoFormat.label,
      }
      sources.push(source)
    })

    return sources
  }

  // For unencrypted video, encKey is blank
  return async ({ encKey, cidWithoutKey }) => {
    const cid = encKey
      ? combineKeytoEncryptedCid(encKey, cidWithoutKey)
      : cidWithoutKey

    console.log('useVideoLinkS5: encKey = ', encKey)
    console.log('useVideoLinkS5: cidWithoutKey = ', cidWithoutKey)
    console.log('useVideoLinkS5: cid = ', cid)

    let metadata = await getMetadata(cidWithoutKey)
    console.log('useVideoLinkS5: metadata =', metadata)

    let videoUrl

    if (!metadata) {
      console.log(
        'useVideoLinkS5: const transcodedMetadata = await getTranscodedMetadata(cid)'
      )
      const transcodedMetadata = await getTranscodedMetadata(cid)
      console.log('useVideoLinkS5: transcodedMetadata =', transcodedMetadata)
      if (transcodedMetadata) {
        metadata = transcodedMetadata

        putMetadata(cidWithoutKey, metadata)
        deleteTranscodePending(cidWithoutKey)
      }
    }

    if (metadata) {
      videoUrl = getPlayerSources(metadata)
    }

    let videoCID

    console.log('useVideoLinkS5: videoUrl = ', videoUrl)

    return videoUrl
  }
}
