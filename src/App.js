import { useState } from "react";
import "./App.css";
import { encodeFunctionData } from 'viem';
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { GelatoRelay, ERC2771Type } from '@gelatonetwork/relay-sdk';
import { ethers } from 'ethers'


function App() {
	const { ready, authenticated, user, login, logout } = usePrivy();
	const { wallets } = useWallets()
	const [signer, setSigner] = useState(null);
	const [provider, setProvider] = useState(null);
	const [permitResponse, setPermitResponse] = useState(null);

	const connect = async () => {
		if (window.ethereum) {
			try {
				await window.ethereum.request({ method: 'eth_requestAccounts' });

				const ethersProvider = new ethers.BrowserProvider(window.ethereum);
				setProvider(ethersProvider);

				const ethersSigner = ethersProvider.getSigner();
				setSigner(ethersSigner);
			} catch (error) {
				console.error("Erreur de connexion à Ethereum: ", error);
			}
		} else {
			console.error("Ethereum non détecté. Installez MetaMask.");
		}
	}

	// Wait until the Privy client is ready before taking any actions
	if (!ready) {
		return null;
	}

	const setNewNumber = async () => {
		if (signer) {
			const amount = ethers.parseEther("1");
			const oracleAddress = "0x0Ec3BBFef88cF760849C54477c40c3Fd00fA86a0";
			const abi = ["function updatePrice(uint256 _price)"];
			const oracleContract = new ethers.Contract(oracleAddress, abi, await signer)
			// const deadline = Math.floor(Date.now() / 1000) + 3600;

			// const domain = {
			// 	name: 'CoingeckoOracle',
			// 	version: '1',
			// 	chainId: (await provider.getNetwork()).chainId,
			// 	verifyingContract: await oracleAddress
			// };


			// const types = {
			// 	UpdatePrice: [
			// 		{ name: 'price', type: 'uint256' },
			// 		{ name: 'timestamp', type: 'uint256' },
			// 	],
			// };
			// const dataTmp = {
			// 	price: '1001',
			// 	timestamp: deadline
			// };

			// var sig = await (await (await wallets[0].getEthersProvider()).getSigner())._signTypedData(domain, types, dataTmp);
			// console.log("sig v1", sig);

			const { data } = await oracleContract.updatePrice.populateTransaction('1001')

			console.log(await user.wallet.address);

			const request = {
				chainId: (await provider.getNetwork()).chainId,
				target: oracleAddress,
				data: data,
				user: await user.wallet.address
			};

			const relay = new GelatoRelay();

			console.log(await signer, await provider, request);

			const { struct, signature } = await relay.getSignatureDataERC2771(request, await provider, ERC2771Type.SponsoredCall)

			console.log("sig v2", signature);

			const pResponse = await relay.sponsoredCallERC2771WithSignature(struct, signature, proccess.env.REACT_APP_RELAY_API_KEY);
			setPermitResponse(pResponse)
			console.log('Relay response:', pResponse);
		} else {
			console.error('Signer or number not found');
		}
	};

	return (
		<div className="App">
			<header className="App-header">
				{/* If the user is not authenticated, show a login button */}
				{/* If the user is authenticated, show the user object and a logout button */}
				{ready && authenticated ? (
					<div>
						<textarea
							readOnly
							value={JSON.stringify(user, null, 2)}
							style={{ width: "600px", height: "250px", borderRadius: "6px" }}
						/>
						<br />
						<button onClick={logout} style={{ marginTop: "20px", padding: "12px", backgroundColor: "#069478", color: "#FFF", border: "none", borderRadius: "6px" }}>
							Log Out
						</button>
						{
							!signer ? (
								<button onClick={connect} style={{ marginTop: "20px", marginLeft: '20px', padding: "12px", backgroundColor: "#069478", color: "#FFF", border: "none", borderRadius: "6px" }}>
									Init your wallet
								</button>

							) : (
								<button onClick={setNewNumber} style={{ marginTop: "20px", marginLeft: '20px', padding: "12px", backgroundColor: "#069478", color: "#FFF", border: "none", borderRadius: "6px" }}>
									Transfer 1 token to 0x00..00dead
								</button>
							)
						}
						{
							permitResponse && (
								<div style={{ fontSize: '12px', marginTop: '12px' }}>
									Checkout the log here: <a target="_blank" href={`https://api.gelato.digital/tasks/status/${permitResponse.taskId}`} rel="noreferrer">https://api.gelato.digital/tasks/status/{permitResponse.taskId}</a>
								</div>
							)
						}
					</div>
				) : (
					<button onClick={login} style={{ padding: "12px", backgroundColor: "#069478", color: "#FFF", border: "none", borderRadius: "6px" }}>Log In</button>
				)}
			</header>
		</div>
	);
}

export default App;
