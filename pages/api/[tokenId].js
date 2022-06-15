export default function handler(req, res) {
	// get the tokenId from the query parameters
	const tokenId = req.query.tokenId;
	// as these images are uploaded on github, we can pull from there directly. Use pinata for a real project
	const image_url =
		'aw.githubusercontent.com/petertardif/sampleNFT/main/public/nftneighbors/';

	res.status(200).json({
		name: 'NFT Neighbor #' + tokenId,
		description:
			'NFT Neighbors is a DAO focused on bringing bluechip projects to the people.',
		image: image_url + tokenId + '.png',
	});
}
