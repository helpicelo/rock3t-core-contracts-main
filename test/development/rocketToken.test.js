const deployUbeswap = require('../helpers/deployUbeswap.js');
const { expectEvent, expectRevert, constants } = require("@openzeppelin/test-helpers");

const RocketToken = artifacts.require('RocketToken');
const FeeApprover = artifacts.require('FeeApprover');

contract('rocket token', accounts => {
  const [ owner, feeDestination, notOwner, liquidVault, uniswapPair] = accounts;
  const { ZERO_ADDRESS } = constants;

  const assertBNequal = (bnOne, bnTwo) => assert.equal(bnOne.toString(), bnTwo.toString());

  let uniswapFactory = "0x62d5b84bE28a183aBB507E125B384122D2C25fAE";
  let uniswapRouter = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121";

  let rocketToken;
  let feeApprover;

  beforeEach('setup others', async function() {
    const contracts = await deployUbeswap(accounts);
    uniswapFactory = contracts.uniswapFactory;
    uniswapRouter = contracts.uniswapRouter;
    weth = contracts.weth;

    feeApprover = await FeeApprover.new();
    rocketToken = await RocketToken.new(feeDestination, feeApprover.address, uniswapRouter.address, uniswapFactory.address);

    await feeApprover.initialize(uniswapPair, liquidVault);
    await feeApprover.unPause();
  });

  it('should create a uniswap pair', async () => {
      const pairAddressBefore = await rocketToken.tokenUniswapPair.call();
      assert.equal(pairAddressBefore, ZERO_ADDRESS);

      const createPair = await rocketToken.createUniswapPair(weth.address);
      expectEvent.inTransaction(createPair.tx, uniswapFactory, 'PairCreated');
      
  });
  
  it('should create a uniswap pair only once', async () => {
      await rocketToken.createUniswapPair(weth.address);

      await expectRevert(
          rocketToken.createUniswapPair(weth.address),
          'Token: pool already created'
      );
  });

  it('should revert if pair creator is not an owner', async () => {
      await expectRevert(
          rocketToken.createUniswapPair(weth.address,{ from: notOwner }),
          'Ownable: caller is not the owner'
      );
  });

  it('should not configure the fee distributor for non-owner', async () => {
      await expectRevert(
          rocketToken.setFeeDistributor(feeDestination, { from: notOwner }),
          'Ownable: caller is not the owner'
      );
  });

  it('should set the fee to 5 pecentage by an owner', async () => {
      const expectedFee = 50; //50%
      await feeApprover.setFeeMultiplier(expectedFee);
      assertBNequal(await feeApprover.feePercentX100.call(), expectedFee);
  });

  it('should check totalSupply to be equal 11 000 000', async () => {
      const totalSupply = await rocketToken.totalSupply.call();
      const expectedSupply = web3.utils.toWei('11000000');
      
      assertBNequal(totalSupply, expectedSupply);
  });

  it('should collect fee while transfer and send it to the destination address', async () => {
      const feeDestinationBefore = await rocketToken.balanceOf(feeDestination);
      const amountToSend = 10000;
      const fee = await feeApprover.feePercentX100.call();

      await rocketToken.transfer(notOwner, amountToSend);
      
      const feeDestinationAfter = await rocketToken.balanceOf(feeDestination);
      const expectdFeeAmount = (fee * amountToSend) / 100;
      const recepientBalance = await rocketToken.balanceOf(notOwner);
      const expectedBalance = amountToSend - expectdFeeAmount;
      
      assertBNequal(feeDestinationBefore, 0);
      assertBNequal(feeDestinationAfter, expectdFeeAmount);
      assertBNequal(recepientBalance, expectedBalance);
  });
  
});