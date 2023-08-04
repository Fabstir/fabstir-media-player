import React, { useState } from 'react';
import 'video.js/dist/video-js.css';
import useEncKey from '../hooks/useEncKey';
import usePortal from '../hooks/usePortal';
import useVideoLinkS5 from '../hooks/useVideoLinkS5';
import VideoJS from './VideoJS';
import videojs from 'video.js';

/**
 * A React component that renders a Video.js player for an NFT video.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.nft - The NFT object containing video information.
 * @param {Function} props.onReady - The callback function to be called when the video is ready to play.
 * @param {Function} props.setIsPlay - The state setter function for the video play state.
 * @returns {JSX.Element} - The NFTVideoJS component.
 */
export const NFTVideoJS = ({ nft, onReady, setIsPlay }) => {
  console.log('NFTVideoJS: nft.name useEffect');
  console.log('test: NFTVideoJS');

  window.videojs = videojs;

  const getEncKey = useEncKey();
  const getVideoLinkS5 = useVideoLinkS5();

  const { getBlobUrl, getPortalType } = usePortal();
  const [options, setOptions] = useState();
  const [videoUrl, setVideoUrl] = useState();

  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);

  const handlePlayerReady = (player) => {
    console.log('test: ScreenView handlePlayerReady');

    // you can handle player events here
    player.on('waiting', () => {
      console.log('player is waiting');
    });

    if (setIsPlay) {
      player.on('play', () => {
        setIsPlay(true);
      });

      player.on('pause', () => {
        setIsPlay(false);
      });

      player.on('ended', () => {
        setIsPlay(false);
      });
    }

    player.on('mouseover', () => {
      player.controlBar.show();
      player.bigPlayButton.show();
    });

    player.on('mouseout', () => {
      player.controlBar.hide();
      player.bigPlayButton.hide();
    });

    player.on('timeupdate', () => {
      setPlayerCurrentTime(player.currentTime());
    });

    player.on('dispose', () => {
      console.log('player will dispose');
    });

    player.on('resolutionchange', function () {
      console.info('Source changed to %s', player.src());
    });
  };

  React.useEffect(() => {
    if (!nft) return;
    (async () => {
      const encKey = await getEncKey(nft.address);
      console.log('NFTVideoJS: nft.name useEffect getEncKey');

      console.log('NFTVideoJS: encKey = ', encKey);
      console.log('NFTVideoJS: nft.video = ', nft.video);

      let videoUrl;
      videoUrl = await getVideoLinkS5({
        encKey,
        cidWithoutKey: nft.video,
      });

      console.log('NFTVideoJS: nft.name useEffect getVideoLink');
      console.log('NFTVideoJS: videoUrl = ', videoUrl);

      let nftImage;
      if (nft && nft.backDropImage)
        nftImage = await getBlobUrl(nft.backDropImage);
      else if (nft && nft.image) nftImage = await getBlobUrl(nft.image);
      else nftImage = null;

      console.log('NFTVideoJS: nft.name useEffect getBlobUrl');

      setVideoUrl(videoUrl);
      console.log('NFTVideoJS: prog_index_m3u8_url= ', videoUrl);

      const theOptions = {
        // lookup the options in the docs for more options
        autoplay: false,
        controls: true,
        bigPlayButton: true,
        responsive: true,
        fluid: true,
        height: 1080,
        width: 1920,
        playbackRates: [0.5, 1, 1.5, 2],
        poster: nftImage,
        posterImage: false,
        userActions: { hotkeys: true },
        html5: {
          vhs: {
            withCredentials: true,
          },
        },
        sources: videoUrl,
        portalType: getPortalType(nft.video),
      };

      function ResolutionSelectorButton(props) {
        const { resolutions, resolution, handleResolutionChange } = props;
        return (
          <div className="vjs-resolution-selector">
            <select value={resolution} onChange={handleResolutionChange}>
              {resolutions.map((res) => (
                <option key={res} value={res}>
                  {res.split('=')[1]}
                </option>
              ))}
            </select>
          </div>
        );
      }

      console.log('NFTVideoJS: nft = ', nft);
      console.log('NFTVideoJS: nft.name = ', nft.name);
      console.log('NFTVideoJS: theOptions = ', theOptions);
      setOptions(theOptions);
    })();
  }, [nft]);

  return (
    <>{options && <VideoJS options={options} onReady={handlePlayerReady} />}</>
  );
};

export default NFTVideoJS;
