import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Web3Modal from 'web3modal';
import { providers, Contract } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { WHITELIST_CONTRACT_ADDRESS, abi } from '../constants';
import Image from 'next/image';

export default function Home() {
	const [walletConnected, setWalletConnected] = useState(false);
	const [joinedWhitelist, setJoinedWhitelist] = useState(false);
	const [loading, setLoading] = useState(false);
	const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
	const web3ModalRef = useRef();

	const getProviderOrSigner = async (needSigner = false) => {
		// Connect to metamask and since w store `web3Modal` as a reference, we need to access the `current` value to get acess to the underlying object
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);

		// if user not connected to correct network (Rinkeby) then alert and throw error
		const { chainId } = await web3Provider.getNetwork();
		if (chainId != 4) {
			window.alert('Change the network to Rinkeby');
			throw new Error('In your wallet, change the network to Rinkeby.');
		}

		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}

		return web3Provider;
	};

	// addAddressToWhitelist: adds the current connected address to the whitelist
	const addAddressToWhitelist = async () => {
		try {
			// we need a siogner here since it is a 'write' transaction.
			const signer = await getProviderOrSigner(true);
			// create a new instance of the Contract with a Signer
			// update methods
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				abi,
				signer
			);
			// call the addAddressToWhitelist from the contract
			const tx = await whitelistContract.addAddressToWhitelist();
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			// get the updated number of addresses in the whitelist
			await getNumberOfWhitelisted();
			setJoinedWhitelist(true);
		} catch (err) {
			console.error(err);
		}
	};

	const getNumberOfWhitelisted = async () => {
		try {
			// get provide from web3Modal
			const provider = await getProviderOrSigner();
			// connect to the contract using provider
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				abi,
				provider
			);
			// call the numWhitelistedAddresses from the contract
			const _numberOfWhitelisted =
				await whitelistContract.numAddressesWhitelisted();
			setNumberOfWhitelisted(_numberOfWhitelisted);
		} catch (err) {
			console.error(err);
		}
	};

	const checkIfAddressInWhitelist = async () => {
		try {
			// use signer as its needed later to get address
			const signer = await getProviderOrSigner(true);
			const whitelistContract = new Contract(
				WHITELIST_CONTRACT_ADDRESS,
				abi,
				signer
			);
			// get associated address of signer which is connected to Metamask
			const address = await signer.getAddress();
			// call the whitelistedAddresses from the contract
			const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
				address
			);
		} catch (err) {
			console.error(err);
		}
	};

	// connect wallet
	const connectWallet = async () => {
		try {
			// get provider from web3Modal (metamask), first visit prompts user to connect their wallet
			await getProviderOrSigner();
			setWalletConnected(true);

			checkIfAddressInWhitelist();
			getNumberOfWhitelisted();
		} catch (err) {
			console.error(err);
		}
	};

	// renderButton: returns a button based on teh state of the dapp
	const renderButton = () => {
		if (walletConnected) {
			if (joinedWhitelist) {
				return (
					<div className={styles.description}>
						Thanks for joining the Whitelist!
					</div>
				);
			} else if (loading) {
				return <button className={styles.button}>Loading...</button>;
			} else {
				return (
					<button onClick={addAddressToWhitelist} className={styles.button}>
						Join the Whitelist
					</button>
				);
			}
		} else {
			return (
				<button onClick={connectWallet} className={styles.button}>
					Connect your wallet
				</button>
			);
		}
	};

	useEffect(() => {
		// if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
		if (!walletConnected) {
			// Assign the Web3Modal class to the reference object by setting it's `current` value
			// The `current` value is persisted throughout as long as this page is open
			web3ModalRef.current = new Web3Modal({
				network: 'rinkeby',
				providerOptions: {},
				disableInjectedProvider: false,
			});
			connectWallet();
		}
	}, [walletConnected]);

	return (
		<div>
			<Head>
				<title>NFT Neighbors Whitelist</title>
				<meta name='description' content='NFT Neighbors Whitelist Dapp' />
				<link rel='icon' href='/favicon.ico' />
			</Head>

			<main className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to NFT Neighbors!</h1>
					<div className={styles.description}>
						A DAO focused on bringing bluechip projects to the people.
					</div>
					<div className={styles.description}>
						{/* {numberOfWhitelisted} have already joined the Whitelist */}
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
			</main>

			<footer className={styles.footer}>Made with &#10084; by Tardif</footer>
		</div>
	);
}
