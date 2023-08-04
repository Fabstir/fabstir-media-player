import React, { useEffect, useState } from 'react'
import usePortal from '../hooks/usePortal'
import ThumbnailArt from './ThumbnailArt'
import ThumbnailFilm from './ThumbnailFilm'
import ThumbnailMusic from './ThumbnailMusic'

const tabs = [
  { name: 'Recently Added', href: '#', current: true },
  { name: 'Most Popular', href: '#', current: false },
  { name: 'Favourited', href: '#', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function UserNFTView({
  nft,
  twTitleStyle,
  twTextStyle,
  handleSubmit_AddEntityToList,
  handleSubmit_RemoveEntityFromList,
  disableNavigation,
}) {
  console.log('UserNFTView: inside')
  const [nftImage, setNFTImage] = useState()
  const [nftBackDropImage, setNFTBackDropImage] = useState()
  const [nftPosterImage, setNFTPosterImage] = useState()
  const { getBlobUrl } = usePortal()

  useEffect(() => {
    ;(async () => {
      console.log('test: UserNFTView useEffect')

      if (nft?.image) {
        console.log('UserNFTView: nft.image = ', nft.image)
        const linkUrl = await getBlobUrl(nft.image)
        console.log('UserNFTView: linkUrl = ', linkUrl)
        setNFTImage(linkUrl)
      }
      if (nft.type === 'video' && nft?.posterImage) {
        const linkUrl = await getBlobUrl(nft.posterImage)
        setNFTPosterImage(linkUrl)
      }
      if (nft.type === 'audio' && nft?.backDropImage) {
        const linkUrl = await getBlobUrl(nft.backDropImage)
        setNFTBackDropImage(linkUrl)
      }
    })()
  }, [nft])

  return (
    <div className="transform transition duration-100 ease-in hover:scale-115">
      {nft.type === 'video' && nftPosterImage ? (
        <ThumbnailFilm
          nft={nft}
          posterImage={nftPosterImage}
          twTitleStyle={twTitleStyle}
          twTextStyle={twTextStyle}
          handleSubmit_AddEntityToList={handleSubmit_AddEntityToList}
          handleSubmit_RemoveEntityFromList={handleSubmit_RemoveEntityFromList}
          disableNavigation={disableNavigation}
        />
      ) : nft.type === 'audio' && nftBackDropImage ? (
        <ThumbnailMusic
          nft={nft}
          nftImage={nftBackDropImage}
          twTitleStyle={twTitleStyle}
          twTextStyle={twTextStyle}
          handleSubmit_AddEntityToList={handleSubmit_AddEntityToList}
          handleSubmit_RemoveEntityFromList={handleSubmit_RemoveEntityFromList}
          disableNavigation={disableNavigation}
        />
      ) : nft.type !== 'video' && nft.type !== 'audio' && nftImage ? (
        <ThumbnailArt
          nft={nft}
          nftImage={nftImage}
          twTitleStyle={twTitleStyle}
          twTextStyle={twTextStyle}
          handleSubmit_AddEntityToList={handleSubmit_AddEntityToList}
          handleSubmit_RemoveEntityFromList={handleSubmit_RemoveEntityFromList}
          disableNavigation={disableNavigation}
        />
      ) : (
        <></>
      )}
    </div>
  )
}
