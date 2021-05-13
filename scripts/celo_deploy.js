// // celo_deploy.js

// const Web3 = require('web3')
// const ContractKit = require('@celo/contractkit')


// require('dotenv').config();

// const web3 = new Web3(process.env.DATAHUB_CELO_TESTNET)
// const kit = ContractKit.newKitFromWeb3(web3)

// let contract = kit.web3.eth.contract(UniswapRouter.abi, process.env.UBESWAP_ROUTER);

// // const getAccount = require('./getAccount').getAccount

// async function awaitWrapper(){
    
//     kit.connection.addAccount(process.env.DEV_ACCOUNT_PKEY)
    

//     console.log(kit)
//     // let tx = await kit.connection.sendTransaction({
//     //     from: process.env.DEV_ACCOUNT,
//     //     data: FeeDistributor.bytecode
//     // })

//     // const receipt = await tx.waitReceipt()
//     // console.log(receipt)
// }

// awaitWrapper()
require('dotenv').config();

// const UniswapRouter = require('../build/contracts/UniswapRouter02.json')
const PriceOracle = require('../build/contracts/PriceOracle.json')
const Web3 =  require('web3');
const ContractKit =  require('@celo/contractkit');
const web3 = new Web3(process.env.DATAHUB_CELO_TESTNET)
const kit = ContractKit.newKitFromWeb3(web3)

var contract_address = process.env.UBESWAP_ROUTER

const main =  async  ()  =>  {

    let instance = new web3.eth.Contract(
        PriceOracle.abi,
        contract_address
    )

    const txo = await instance.methods.consult()

    let name = await instance.methods.blockTimestampLast().call() 

    console.log(name)
    
    // let contract = new web3.eth.contract(UniswapRouter.abi).at(contract_address);

	// client.addAccount(process.env.DEV_ACCOUNT_PKEY)
};

main().catch((err)  =>  {
	console.error(err);
});