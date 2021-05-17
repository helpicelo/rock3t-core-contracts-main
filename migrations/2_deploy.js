require('dotenv').config();

const FeeApprover = artifacts.require('FeeApprover');
const FeeDistributor = artifacts.require('FeeDistributor');
const RocketToken = artifacts.require('RocketToken');
// const UniswapV2Router = artifacts.require('UniswapV2Router02')
const LiquidVault = artifacts.require('LiquidVault');
const PriceOracle = artifacts.require('PriceOracle');

const IUniswapV2Pair = artifacts.require('IUniswapV2Pair');
// const UniswapFactory = artifacts.require('UniswapFactory');
// const UniswapWETH = artifacts.require('UniswapWETH');
const UniswapRouter = artifacts.require('UniswapV2Router02');

const { 
    UBESWAP_FACTORY, 
    UBESWAP_ROUTER,
    CELO_ADDRESS,
    DEV_TREASURY,
    DEV_ACCOUNT,
    DEV_SECOND,
    SECONDARY_ADDRESS_SHARE
    // WETH_KOVAN
} = process.env;



module.exports = async function (deployer, network, accounts) {

    if (network === 'development') {
        return;
    }

    const UniswapRouterInstance = await UniswapRouter.at("0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121");
    await pausePromise('Ubeswap Router at:', UniswapRouterInstance.address);

    await deployer.deploy(FeeApprover);
    const feeApproverInstance = await FeeApprover.deployed();
    await pausePromise('Fee Approver deployed at:', feeApproverInstance.address);

    await deployer.deploy(FeeDistributor);
    const feeDistributorInstance = await FeeDistributor.deployed();
    await pausePromise('Fee Distributor');

    await deployer.deploy(RocketToken, feeDistributorInstance.address, feeApproverInstance.address, UBESWAP_ROUTER, UBESWAP_FACTORY);
    const rocketTokenInstance = await RocketToken.deployed();
    await pausePromise('RocketToken');

    await deployer.deploy(LiquidVault);
    const liquidVaultInstance = await LiquidVault.deployed();
    await pausePromise('Liquidity Vault');

    let uniswapPair;
    let uniswapOracle;

    await pausePromise('seed fee approver');
    // create uniswap pair manually on production and initialize/unpause fee approver
    if (network !== 'mainnet') {
        await rocketTokenInstance.createUniswapPair(CELO_ADDRESS);
        uniswapPair = await rocketTokenInstance.tokenUniswapPair();

        uniswapOracle = await deployer.deploy(PriceOracle, uniswapPair, rocketTokenInstance.address, CELO_ADDRESS);

        await feeApproverInstance.initialize(uniswapPair, liquidVaultInstance.address);
        await feeApproverInstance.unPause();
        await feeApproverInstance.setFeeMultiplier(10);
    }

    await pausePromise('seed fee distributor');
    await feeDistributorInstance.seed(
        rocketTokenInstance.address,
        liquidVaultInstance.address,
        DEV_SECOND,
        SECONDARY_ADDRESS_SHARE
    );
    await pausePromise('seed liquidity vault');
    await liquidVaultInstance.seed(
      CELO_ADDRESS,
      rocketTokenInstance.address,
      feeDistributorInstance.address,
      UBESWAP_ROUTER,
      uniswapPair,
      DEV_TREASURY,
      uniswapOracle.address
    );

    const amount = "100000";
    await pausePromise('deposit in the vault');
    await rocketTokenInstance.transfer(liquidVaultInstance.address, web3.utils.toWei(amount))

    
    const liquidityTokensAmount = web3.utils.toWei('10000')// bn('10000').mul(baseUnit); // 10.000 tokens
    const liquidityEtherAmount = web3.utils.toWei('5') //bn('5').mul(baseUnit); // 5 ETH
    await pausePromise('should be possible to add liquidity on pair');
    const pair = await IUniswapV2Pair.at(uniswapPair);
    const reservesBefore = await pair.getReserves();

    await rocketTokenInstance.approve(UBESWAP_ROUTER, web3.utils.toWei("11000000"));
    // await  

    await UniswapRouterInstance.addLiquidity(
        CELO_ADDRESS,
        rocketTokenInstance.address,
        liquidityEtherAmount,
        liquidityTokensAmount,
        0,
        0,
        DEV_ACCOUNT,
        new Date().getTime() + 3000,
    );
  
    // const reservesAfter = await pair.getReserves();
  
    // if (await pair.token0() == rocketToken.address) {
    //     assertBNequal(reservesAfter[0], liquidityTokensAmount);
    //     assertBNequal(reservesAfter[1], liquidityEtherAmount);
    // } else {
    //     assertBNequal(reservesAfter[0], liquidityEtherAmount);
    //     assertBNequal(reservesAfter[1], liquidityTokensAmount);
    // }

}

function pausePromise(message, durationInSeconds = 2) {
	return new Promise(function (resolve, error) {
		setTimeout(() => {
			console.log(message);
			return resolve();
		}, durationInSeconds * 1000);
	});
}

// require('dotenv').config();

// const FeeApprover = artifacts.require('FeeApprover');
// const FeeDistributor = artifacts.require('FeeDistributor');
// const RocketToken = artifacts.require('RocketToken');
// const LiquidVault = artifacts.require('LiquidVault');
// const PriceOracle = artifacts.require('PriceOracle');

// const { 
//     UNISWAP_FACTORY, 
//     UNISWAP_ROUTER,
//     TREASURY,
//     FEE_RECEIVER,
//     SECONDARY_ADDRESS_SHARE,
//     WETH_KOVAN
// } = process.env;

// module.exports = async function (deployer, network, accounts) {

//     if (network === 'development') {
//         return;
//     }

//     await deployer.deploy(FeeApprover);
//     const feeApproverInstance = await FeeApprover.deployed();
//     await pausePromise('Fee Approver');

//     await deployer.deploy(FeeDistributor);
//     const feeDistributorInstance = await FeeDistributor.deployed();
//     await pausePromise('Fee Distributor');

//     await deployer.deploy(RocketToken, feeDistributorInstance.address, feeApproverInstance.address, UNISWAP_ROUTER, UNISWAP_FACTORY);
//     const rocketTokenInstance = await RocketToken.deployed();
//     await pausePromise('RocketToken');

//     await deployer.deploy(LiquidVault);
//     const liquidVaultInstance = await LiquidVault.deployed();
//     await pausePromise('Liquidity Vault');

//     let uniswapPair;
//     let uniswapOracle;

//     await pausePromise('seed fee approver');
//     // create uniswap pair manually on production and initialize/unpause fee approver
//     if (network !== 'mainnet') {
//         await rocketTokenInstance.createUniswapPair();
//         uniswapPair = await rocketTokenInstance.tokenUniswapPair();

//         uniswapOracle = await deployer.deploy(PriceOracle, uniswapPair, rocketTokenInstance.address, WETH_KOVAN);

//         await feeApproverInstance.initialize(uniswapPair, liquidVaultInstance.address);
//         await feeApproverInstance.unPause();
//     }

//     await pausePromise('seed fee distributor');
//     await feeDistributorInstance.seed(
//         rocketTokenInstance.address,
//         liquidVaultInstance.address,
//         FEE_RECEIVER,
//         SECONDARY_ADDRESS_SHARE
//     );
//     await pausePromise('seed liquidity vault');
//     await liquidVaultInstance.seed(
//       rocketTokenInstance.address,
//       feeDistributorInstance.address,
//       UNISWAP_ROUTER,
//       uniswapPair,
//       TREASURY,
//       uniswapOracle.address
//     );

// }

// function pausePromise(message, durationInSeconds = 2) {
// 	return new Promise(function (resolve, error) {
// 		setTimeout(() => {
// 			console.log(message);
// 			return resolve();
// 		}, durationInSeconds * 1000);
// 	});
// }