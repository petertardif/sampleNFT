export const WHITELIST_CONTRACT_ADDRESS =
	'0x23F0Be0A6C4116110Ca5DA97755418e5adBC7eb8';

export const abi = [
	{
		inputs: [
			{
				internalType: 'uint8',
				name: '_maxWhitelistedAddresses',
				type: 'uint8',
			},
		],
		stateMutability: 'nonpayable',
		type: 'constructor',
	},
	{
		inputs: [],
		name: 'addAddressToWhitelist',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [],
		name: 'maxWhitelistedAddresses',
		outputs: [
			{
				internalType: 'uint8',
				name: '',
				type: 'uint8',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'numAddressesWhitelisted',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		name: 'whitelistedAddresses',
		outputs: [
			{
				internalType: 'bool',
				name: '',
				type: 'bool',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
];
