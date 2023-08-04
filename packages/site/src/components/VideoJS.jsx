import React, { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import { process_env } from '../utils/process_env'

/**
 * A React component that wraps the Video.js player.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.options - The options object for the Video.js player.
 * @param {Function} props.onReady - The callback function to be called when the player is ready.
 * @param {Boolean} props.isAudio - A flag indicating whether the player is an audio player.
 * @returns {JSX.Element} - The VideoJS component.
 */
export const VideoJS = ({ options, onReady, isAudio }) => {
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  const initializePlayer = () => {
    console.log('VideoJS: initializePlayer called')

    const videoElement = videoRef.current
    console.log('VideoJS: videoElement', videoElement)

    if (!videoElement) return

    if (options?.portalType === 'Skynet') {
      videojs.Hls.xhr.beforeRequest = function (options) {
        options.headers = options.headers || {}
        options.headers['skynet-api-key'] = process_env.SKYNET_API_KEY
        console.log('VideoJS: VideoJS: options = ', options)
        return options
      }
    } else videojs.Hls.xhr.beforeRequest = ''

    if (!playerRef.current) {
      console.log('VideoJS: Initializing new player')
      window.videojs = videojs
      const videojsResolutionSwitcher = require('videojs-resolution-switcher')

      const player = (playerRef.current = videojs(
        videoElement,
        {
          ...options,
          // Initializing the plugin when creating a new player
          plugins: {
            videoJsResolutionSwitcher: {
              default: 'high', // Default resolution [{Number}, 'low', 'high'],
              dynamicLabel: true, // Display dynamic labels or gear symbol
            },
          },
        },
        () => {
          videojs.log('player is ready')
          onReady && onReady(player)
          if (player.videoJsResolutionSwitcher) {
            // Activating the plugin when the player is ready
            player.videoJsResolutionSwitcher({
              default: 'high', // Default resolution [{Number}, 'low', 'high'],
              dynamicLabel: true, // Display dynamic labels or gear symbol
            })
          } else {
            console.error(
              'VideoJS: Plugin has not been registered to the player'
            )
          }
        }
      ))

      console.log('VideoJS: player', player)
      console.log('VideoJS: options', options)

      player.addClass('vjs-matrix')

      player.bigPlayButton.hide()
      if (isAudio) player.audioOnlyMode(isAudio)

      console.log('VideoJS: videojs = ', videojs)
      console.log(
        'VideoJS: window.videojs.getComponent = ',
        window.videojs.getComponent
      )

      console.log('VideoJS: videojs.getPlugins(): ', videojs.getPlugins()) // This will log all registered plugins
    } else {
      console.log('VideoJS: Updating existing player')
      const player = playerRef.current

      player.autoplay(options.autoplay)
      player.src(options.sources)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializePlayer()
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        poster={options?.poster}
        crossOrigin="anonymous"
      ></video>
    </div>
  )
}

export default VideoJS
