import { Contract, providers, utils } from 'ethers';
import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import Web3Modal from 'web3modal';
import Image from 'next/image';
import { abi, NFT_CONTRACT_ADDRESS } from '../constants/allowlist';
import styles from '../styles/Home.module.css';

export default function Home() {
	const [walletConnected, setWalletConnected] = useState(false);
	const [presaleStarted, setPresaleStarted] = useState(false);
	const [presaleEnded, setPresaleEnded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isOwner, setIsOwner] = useState(false); // checks if the currently connected MetaMask wallet is the owner of the contract
	const [tokenIdsMinted, setTokenIdsMinted] = useState('0'); // tokenIdsMinted keeps track of the number of tokenIds that have been minted
	const web3ModalRef = useRef(); // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open

	// presaleMint - mint an NFT during presale
	const presaleMint = async () => {
		try {
			// instantiate signer as this is a "write" transaction
			const signer = await getProviderOrSigner(true);
			// create a new instance of the Contract with a signer which allows update methods
			const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

			// call the presaleMint function from the contract, only whitelisted addresses will be able to mint
			const tx = await whitelistContract.presaleMint({
				// value signifies the cost of one NFT Neighbor NFT which is '0.1' eth.
				// We are parsing `0.1` string to ether using the utils library from ethers.js
				value: utils.parseEther('0.1'),
			});
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			window.alert(
				'You successfully minted your NFT Neighbor Token during presale mint!'
			);
		} catch (err) {
			console.error(err);
		}
	};

	const publicMint = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
			const tx = await whitelistContract.presaleMint({
				value: utils.parseEther('0.1'),
			});
			setLoading(true);
			await tx.wait();
			setLoading(false);
			window.alert(
				'You successfully minted your NFT Neighbor Token during public mint!'
			);
		} catch (err) {
			console.error(err);
		}
	};

	const connectWallet = async () => {
		// get the provider from web3Modal (aka MetaMask)
		try {
			await getProviderOrSigner();
			setWalletConnected(true);
		} catch (err) {
			console.error(err);
		}
	};

	const startPresale = async () => {
		try {
			const signer = await getProviderOrSigner(); // need a signer for write transaction
			// create a new instance of the Contract to allow for update methods
			const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
			// call the startPresale() from the Contract
			const tx = await whitelistContract.startPresale();
			setLoading(true);

			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);

			// set the presale started to true
			await checkIfPresaleStarted();
		} catch (err) {
			console.err(err);
		}
	};

	// checkIfPresaleStarted: queries the `presaleStarted` variable in the contract
	const checkIfPresaleStarted = async () => {
		try {
			// read only so only need a provider
			const provider = await getProviderOrSigner();
			// new instance of contract with read only access
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
			const _presaleStarted = await nftContract.presaleStarted(); // call if presale started from the Contract
			if (!_presaleStarted) {
				await getOwner();
			}
			return _presaleStarted;
		} catch (err) {
			console.error(err);
			return false;
		}
	};

	const checkIfPresaleEnded = async () => {
		try {
			const provider = await getProviderOrSigner();
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
			const _presaleEnded = await nftContract.presaleEnded();
			// _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
			// Date.now()/1000 returns the current time in seconds
			// We compare if the _presaleEnded timestamp is less than the current time which means presale has ended
			const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
			if (hasEnded) {
				setPresaleEnded(true);
			} else {
				setPresaleEnded(false);
			}
			return hasEnded;
		} catch (err) {
			console.error(err);
			return false;
		}
	};

	const getOwner = async () => {
		try {
			const provider = await getProviderOrSigner();
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
			const _owner = await nftContract.owner(); // call the owner function from the contract
			const signer = await getProviderOrSigner(true); // get the signer to extract the address of the currently connect metamask account
			const address = await signer.getAddress();
			if (address.toLowerCase() === _owner.toLowerCase()) {
				setIsOwner(true);
			}
		} catch (err) {
			console.error(err.message);
		}
	};

	const getTokenIdsMinted = async () => {
		try {
			const provider = await getProviderOrSigner();
			const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
			const _tokenIds = await nftContract.tokenIds();
			setTokenIdsMinted(_tokenIds.toString()); // since _tokenIds is a big number, we set it to a string
		} catch (err) {
			console.error(err);
		}
	};

	const getProviderOrSigner = async (needSigner = false) => {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);

		const { chainId } = await web3Provider.getNetwork();
		if (chainId !== 4) {
			window.alert(
				'Change your network in your Metamask Wallet to the Rinkeby Network.'
			);
			throw new error(
				'Change your network in your Metamask Wallet to the Rinkeby Network.'
			);
		}

		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}
		return web3Provider;
	};

	useEffect(() => {
		if (!walletConnected) {
			// assign the web3Modal clas to the reference object by setting its 'current' value
			web3ModalRef.current = new Web3Modal({
				network: 'rinkeby',
				providerOptions: {},
				disableInjectedProvider: false,
			});
			connectWallet();

			// check if presale has started and ended
			const _presaleStarted = checkIfPresaleStarted();
			if (_presaleStarted) {
				checkIfPresaleEnded();
			}

			getTokenIdsMinted();

			// set an interval every 5 seconds to see if presale has ended
			const presaleEndedInterval = setInterval(async function () {
				const _presaleStarted = await checkIfPresaleStarted();
				if (_presaleStarted) {
					const _presaleEnded = await checkIfPresaleEnded();
					if (_presaleEnded) {
						clearInterval(presaleEndedInterval);
					}
				}
			}, 5 * 1000);
		}
	}, [walletConnected]);

	const renderButton = () => {
		if (!walletConnected) {
			return (
				<button onClick={connectWallet} className={styles.button}>
					Connect your Wallet
				</button>
			);
		}

		if (loading) {
			return <button className={styles.button}>Loading...</button>;
		}

		if (isOwner && !presaleStarted) {
			return (
				<button className={styles.button} onClick={startPresale}>
					Start Presale!
				</button>
			);
		}

		if (!presaleStarted) {
			return (
				<div>
					<div className={styles.description}>Presale hasn't started yet.</div>
				</div>
			);
		}

		if (presaleStarted && !presaleEnded) {
			return (
				<div>
					<div className={styles.description}>
						Presale has begun. If you are on the allowlist, its time to mint an
						NFT Neighbor
					</div>
					<button className={styles.button} onClick={presaleMint}>
						Mint your NFT (Presale)
					</button>
				</div>
			);
		}

		if (presaleStarted && presaleEnded) {
			return (
				<button className={styles.button} onClick={publicMint}>
					Mint your NFT (Public)
				</button>
			);
		}
	};

	return (
		<div>
			<Head>
				<title>NFT Neighbors</title>
				<meta name='description' content='Whitelist-Dapp' />
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<div className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to NFT Neighbors!</h1>
					<div className={styles.description}>
						A DAO focused on bringing bluechip projects to the people.
					</div>
					<div className={styles.description}>
						{tokenIdsMinted}/100 have been minted
					</div>
					{renderButton()}
				</div>
				<div>
					<Image
						className={styles.image}
						src='/nftneighbors_slantleft.svg'
						alt='NFT Neighbor Logo'
						width={500}
						height={500}
					/>
				</div>
			</div>

			<footer className={styles.footer}>Made with &#10084; by Tardif</footer>
		</div>
	);
}
