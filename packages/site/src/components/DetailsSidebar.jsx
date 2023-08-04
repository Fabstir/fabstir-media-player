import { PlusSmIcon as PlusSmIconOutline } from 'heroiconsv1/outline';
import { ChevronDoubleDownIcon } from 'heroiconsv1/solid';
import { TvIcon } from 'heroiconsv2/24/solid';
import React, { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { process_env } from '../utils/process_env';
import usePortal from '../hooks/usePortal';
import useUserProfile from '../hooks/useUserProfile';
import NFTAudioJS from './NFTAudioJS';
import NFTVideoJS from './NFTVideoJS';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const userViewStyle = 'relative mx-auto grid gap-x-4 gap-y-8 grid-cols-6';

const appendNFTField = (old, field, value) => ({ ...old, [field]: value });

const nftInformationDecorator = (information, userAuthPub) => {
  if (!information) return null;

  let output = {};
  Object.keys(information)
    .filter(
      (key) =>
        !(key === 'creator' && information.creator === userAuthPub) &&
        key !== 'name' &&
        key !== 'summary' &&
        key !== 'attributes' &&
        key !== 'image' &&
        key !== 'multiToken' &&
        key !== 'tokenise' &&
        key !== 'image' &&
        key !== 'subscriptionPlan' &&
        key !== 'holders' &&
        key !== 'enc_key' &&
        key !== 'teams' &&
        key !== 'isPreview',
    )
    .forEach((key) => {
      let val;
      if (key === 'created')
        val = new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'full',
          timeStyle: 'long',
        }).format(information[key]);
      else val = information[key];
      output = appendNFTField(output, key, val);
    });

  console.log('output = ', output);
  return JSON.parse(JSON.stringify(output).trim());
};

const twStyle = 'ml-8 grid gap-y-6 grid-cols-6 gap-x-5';
const twTitleStyle = 'text-xs';
const twTextStyle = 'invisible';

export default function DetailsSidebar({
  currentNFT,
  setCurrentNFT,
  width1,
  rerenderDetailsSidebar,
}) {
  console.log('UserNFTView: inside DetailsSidebar');
  console.log('DetailsSidebar: nft = ', nft);

  const [nft, setNFT] = useState();

  const [nftBalance, setNFTBalance] = useState();
  const { getNFTBalance } = useMintNFT();
  const { balanceOf } = useMintBadge();

  const [openNFTMetaData, setOpenNFTMetaData] = useRecoilState(
    nftmetadataexpandstate,
  );

  const [openNFTAttributes, setOpenNFTAttributes] = useRecoilState(
    nftattributesexpandstate,
  );

  const nftInfoDecorated = nftInformationDecorator(
    nft ? nft : null,
    userAuthPub,
  );

  const [userProfile, setUserProfile] = useState();
  const [getUserProfile, , , , getMarketAddress, setMarketAddress] =
    useUserProfile();

  const navigate = useNavigate();

  const [rerenderDetailsSidebarState, setRerenderDetailsSidebarState] =
    useState(0);

  useEffect(() => {
    setRerenderDetailsSidebarState((prev) => prev + 1);
  }, [rerenderDetailsSidebar]);

  const [nftImage, setNFTImage] = useState();
  const { getPortalLinkUrl, getBlobUrl } = usePortal();
  const videoJsOptions = useRef();

  const [isPlay, setIsPlay] = useState(false);

  useEffect(() => {
    console.log('DetailsSidebar: currentNFT = ', currentNFT);
    setNFT(currentNFT);
    (async () => {
      const theBalance = await getNFTBalance(userPub, currentNFT);
      setNFTBalance(theBalance);
    })();
  }, [currentNFT, userPub, currentNFT?.image, rerenderDetailsSidebarState]);

  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [nftToPlay, setNFTToPlay] = useState();

  useEffect(() => {
    if (
      nft &&
      subscriptionPlans.isSuccess &&
      subscriptionPlans.data.length > 0
    ) {
      (async () => {
        // get NFT subscription details
        const theNFTSubscriptionPlans = await getNFTSubscriptionPlans(
          userPub,
          nft,
        );
        setNFTSubscriptionPlans(theNFTSubscriptionPlans);

        const theSelectedSubscriptionPlans = [];

        subscriptionPlans.data.forEach((subscriptionPlan) => {
          console.log('gggg: 1 = ', subscriptionPlan.planId);
        });
        theNFTSubscriptionPlans.forEach((theSubscriptionPlan) => {
          console.log('gggg: 2 = ', theSubscriptionPlan.planId);
        });
      })();
    }
  }, [nft, userPub]);

  useEffect(() => {
    (async () => {
      console.log('userSubscriptions before');
      const userSubscriptions = await getUserSubscriptions(userAuthPub);
      console.log('userSubscriptions after');
      const nftSubscriptionPlans = await getNFTSubscriptionPlans(userPub, nft);

      setIsUserSubscribed(true);
      setNFTToPlay(nft);
    })();
  }, [nft, getUserProfile, userAuthPub, userProfile, userPub]);

  const [isPublic, setIsPublic] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const userPubRequest = useRecoilValue(userpubbadgerequeststate);

  useEffect(() => {
    (async () => {
      if (nft) {
        setIsPublic(await isChatRoomPublic(userPub, nft?.address));
        setIsMember(await isChatRoomMember(userPub, nft?.address, userAuthPub));
        setBadgesGated(await getBadgesGating(userPub, nft));
      } else {
        setIsPublic(false);
        setIsMember(false);
        setBadgesGated([]);
      }
    })();
  }, [nft, userAuthPub, userPub]);

  useEffect(() => {
    console.log(
      'DetailsSidebar: rerenderDetailsSidebarState = ',
      rerenderDetailsSidebarState,
    );

    console.log(
      'DetailsSidebar: rerenderDetailsSidebarState nft.image = ',
      nft?.image,
    );
    (async () => {
      if (nft?.image) {
        const linkUrl = await getBlobUrl(nft.image);
        setNFTImage(linkUrl);
      }
    })();
  }, [nft, userPub, rerenderDetailsSidebarState]);

  async function handle_DownloadFile(key, uri) {
    let fileName;
    if (key === 'uri') fileName = `${nft.symbol}_metadata.json`;
    else {
      const init = uri.indexOf('<<');
      const fin = uri.indexOf('>>');
      fileName = uri.substr(init + 2, fin - init - 2);
      uri = uri.substring(0, uri.lastIndexOf('<<'));
    }

    let linkUrl = await getPortalLinkUrl(uri);
    saveAs(linkUrl, fileName);

    console.log('DetailSidebar: handle_DownloadFile: linkUrl = ', linkUrl);
  }

  return (
    <aside
      className={classNames(
        'mx-auto flex-1 rounded-sm border-l border-fabstir-dark-gray bg-fabstir-black px-8 pb-8 pt-2 shadow-lg lg:block',
        width1,
        isChatRoomOnly ? 'mx-auto max-w-5xl' : '',
      )}
    >
      {setIsScreenViewClosed && (
        <div className="mt-6 flex justify-between">
          <h3 className="font-medium text-fabstir-light-gray">NFT</h3>
          <ChevronDoubleDownIcon
            className={
              'flex h-6 w-6 transform justify-end text-fabstir-light-gray transition duration-200 ease-in ' +
              (isScreenViewClosed ? 'rotate-180' : 'rotate-0')
            }
            aria-hidden="true"
            onClick={() => setIsScreenViewClosed((prev) => !prev)}
          />
        </div>
      )}

      {!isScreenViewClosed && (
        <div
          className={classNames('mx-auto', isTheatreMode ? '' : 'max-w-5xl')}
        >
          <div className="mb-2">
            <NFTContextMenu nft={nft} onDelete={onDelete} />
          </div>

          {nft && nftImage && !nft.video && !nft.audio && (
            <div>
              <div className="aspect-h-7 aspect-w-10 block w-full rounded-lg shadow-2xl shadow-fabstir-black/50">
                <img
                  src={nftImage}
                  alt=""
                  className="mx-auto object-cover"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <div className="flex justify-between">
                    <h2 className="text-lg font-medium text-fabstir-white">
                      <span className="sr-only">Details for </span>
                      {nft?.name}
                    </h2>
                    <p className="text-sm font-medium text-fabstir-light-gray">
                      {nft?.price}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-fabstir-light-gray/80">
                    {nft?.summary}
                  </p>
                </div>
                <div className="flex items-baseline">
                  {/* <ArrowCircleUpIcon className="h-6 w-6" aria-hidden="true" /> */}

                  <div onClick={() => setIsTheatreMode((prev) => !prev)}>
                    <TvIcon
                      className={classNames(
                        'ml-2 w-5 hover:scale-125 hover:text-fabstir-white md:w-6 xl:w-7',
                      )}
                    />
                  </div>
                </div>
                {/* <ArrowCircleUpIcon className="h-6 w-6" aria-hidden="true" /> */}
                <span className="sr-only">Favorite</span>
              </div>
            </div>
          )}

          {nft?.video && videoJsOptions && (
            <div>
              <div className="w-full overflow-hidden rounded-lg shadow-2xl shadow-fabstir-black/50">
                {nftToPlay ? (
                  <NFTVideoJS
                    nft={nft}
                    className="min-w-[256px] rounded-2xl bg-fabstir-dark-gray shadow-lg shadow-fabstir-black md:shadow-lg lg:shadow-xl xl:shadow-xl 2xl:shadow-xl 3xl:shadow-2xl"
                  />
                ) : (
                  <img
                    src={nftImage}
                    alt=""
                    className="mx-auto object-cover"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <div className="flex justify-between">
                    <h2 className="text-lg font-medium text-fabstir-white">
                      <span className="sr-only">Details for </span>
                      {nft?.name}
                    </h2>
                    <p className="text-sm font-medium text-fabstir-light-gray">
                      {nft?.price}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-fabstir-light-gray/80">
                    {nft?.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {nft?.audio && videoJsOptions && (
            <div>
              <div className="w-full overflow-hidden rounded-lg shadow-2xl shadow-fabstir-black/50">
                {nftToPlay ? (
                  <NFTAudioJS
                    nft={nft}
                    playerCurrentTime={playerCurrentTime}
                    className="min-w-[256px] rounded-2xl bg-fabstir-dark-gray shadow-lg shadow-fabstir-black md:shadow-lg lg:shadow-xl xl:shadow-xl 2xl:shadow-xl 3xl:shadow-2xl"
                  />
                ) : (
                  <img
                    src={nftImage}
                    alt=""
                    className="mx-auto object-cover"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <div className="flex justify-between">
                    <h2 className="text-lg font-medium text-fabstir-white">
                      <span className="sr-only">Details for </span>
                      {nft?.name}
                    </h2>
                    <p className="text-sm font-medium text-fabstir-light-gray">
                      {nft?.price}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-fabstir-light-gray/80">
                    {nft?.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {nft && (
            <div className="my-4">
              <UserBadgesNFTView
                badges={badges.data}
                twStyle="grid gap-y-3 grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 auto-rows-3 gap-x-3 overflow-auto"
                twTitleStyle="text-xs"
                twTextStyle="invisible"
                setOpenBadgeDetails={setOpenBadgeDetails}
              />
            </div>
          )}
        </div>
      )}

      <div className="">
        <div className="">
          <h3 className="font-medium text-fabstir-light-gray">Information</h3>
          <ChevronDoubleDownIcon
            className={
              'h-6 w-6 transform text-fabstir-light-gray transition duration-200 ease-in ' +
              (openNFTMetaData ? 'rotate-180' : 'rotate-0')
            }
            aria-hidden="true"
            onClick={() =>
              setOpenNFTMetaData((openNFTMetaData) => !openNFTMetaData)
            }
          />
        </div>

        {/* {openNFTMetaData && ( */}
        <div
          className={`"flex space-y-2" h-auto w-full flex-col justify-between sm:flex-row ${
            openNFTMetaData === false && 'hidden'
          }`}
        >
          <div className="mt-2">
            <dl className="mt-2 divide-y divide-fabstir-divide-color1 border-b border-t border-fabstir-medium-light-gray">
              {nftInfoDecorated &&
                Object.keys(nftInfoDecorated).map((key) => (
                  <div
                    key={key}
                    className="flex justify-between py-3 text-sm font-medium"
                  >
                    <dt className="text-gray-500">
                      {key}
                      {'\u00A0'}
                    </dt>
                    <dd className="truncate text-fabstir-light-gray">
                      {key.toLowerCase().endsWith('urls') ||
                      key.toLowerCase().endsWith('uri') ? (
                        <NFTFileUrls
                          field={key}
                          fileUrls={nftInfoDecorated[key]}
                          handle_DownloadFile={handle_DownloadFile}
                        />
                      ) : Array.isArray(nftInfoDecorated[key]) ? (
                        <div>{nftInfoDecorated[key].join(',')}</div>
                      ) : (
                        <div>{nftInfoDecorated[key]}</div>
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="group my-4">
            <div className="mt-4 flex justify-between">
              <h3 className="font-medium text-fabstir-light-gray">
                Attributes
              </h3>
              <div className="flex flex-1 justify-end">
                <ChevronDoubleDownIcon
                  className={
                    'h-6 w-6 transform text-fabstir-light-gray transition duration-200 ease-in ' +
                    (openNFTAttributes ? 'rotate-180' : 'rotate-0')
                  }
                  aria-hidden="true"
                  onClick={() =>
                    setOpenNFTAttributes(
                      (openNFTAttributes) => !openNFTAttributes,
                    )
                  }
                />
                <ChevronDoubleDownIcon
                  className={
                    'h-6 w-6 transform text-fabstir-light-gray transition duration-200 ease-in ' +
                    (openNFTAttributes ? 'rotate-180' : 'rotate-0')
                  }
                  aria-hidden="true"
                  onClick={() =>
                    setOpenNFTAttributes(
                      (openNFTAttributes) => !openNFTAttributes,
                    )
                  }
                />
              </div>
            </div>

            {/* {openNFTAttributes && ( */}
            <div
              className={`"flex space-y-2" h-auto w-full flex-col justify-between sm:flex-row ${
                openNFTAttributes === false && 'hidden sm:flex'
              }`}
            >
              {nft?.attributes &&
                Object.entries(nft?.attributes).map(([key, value]) => {
                  return (
                    <div
                      key={key}
                      className="flex justify-between py-3 text-sm font-medium"
                    >
                      <dt className="text-fabstir-light-gray">
                        {key}
                        {'\u00A0'}
                      </dt>
                      <dd
                        className={
                          'text-fabstir-light-gray ' +
                          (openNFTAttributes ? '' : 'line-clamp-1')
                        }
                      >
                        {value}
                      </dd>
                    </div>
                  );
                })}
            </div>
            {/* )} */}
            {/* <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500 italic">
              Add a description to this NFT.
            </p>
            <button
              type="button"
              className="rounded-full h-8 w-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Add description</span>
            </button>
          </div> */}
          </div>
        </div>
      </div>
    </aside>
  );
}
