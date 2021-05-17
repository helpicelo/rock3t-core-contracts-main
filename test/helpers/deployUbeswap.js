const UbeswapFactory = artifacts.require('UniswapV2Factory');
const UbeswapRouter = artifacts.require('UniswapV2Router02');
const UbeswapCELO = artifacts.require('CeloToken');

const bn = (input) => web3.utils.toBN(input);


async function deployUniswap(accounts) {
  const baseUnit = bn('1000000000000000000');

  const feeSetter = accounts[0];
  const ubeswapFactory = await UbeswapFactory.new(feeSetter);
  const celo = await UbeswapCELO.deployed();
  const celoAmount = bn('10000').mul(baseUnit); // 1.000 tokens

  // celo.transfer(accounts[0], celoAmount);
  // console.log((await celo.balanceOf(ac).toString())
  accounts.forEach(async a => console.log((await celo.balanceOf(a)).toString()))
  // console.log(JSON.stringify(UbeswapRouter.new))
  // console.log("celo", celo.address)
  // console.log("fac.js", ubeswapFactory.address)
  const uniswapRouter = await UbeswapRouter.new(ubeswapFactory.address);

  return { uniswapFactory: ubeswapFactory, weth: celo, uniswapRouter };
}

module.exports = deployUniswap;
