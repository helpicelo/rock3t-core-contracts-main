const UbeswapFactory = artifacts.require('UniswapV2Factory');
const UbeswapRouter = artifacts.require('UniswapV2Router02');
const UbeswapCELO = artifacts.require('CeloToken');

const bn = (input) => web3.utils.toBN(input);


async function deployUniswap(accounts) {
  const baseUnit = bn('1000000000000000000');

  const feeSetter = accounts[0];
  const ubeswapFactory = await UbeswapFactory.new(feeSetter);
  const celo = await UbeswapCELO.new();

  // recharge accounts[0] with celos
  await celo.mint(accounts[0], web3.utils.toWei('10000000000'))

  // console.log("celo minted", (await celo.balanceOf(accounts[0])).toString())

  const uniswapRouter = await UbeswapRouter.new(ubeswapFactory.address);

  // approve celo implicit
  await celo.approve(uniswapRouter.address, web3.utils.toWei("1000000000000000000"));
  await celo.approve(ubeswapFactory.address, web3.utils.toWei("1000000000000000000"));

  return { uniswapFactory: ubeswapFactory, weth: celo, uniswapRouter };
}

module.exports = deployUniswap;
