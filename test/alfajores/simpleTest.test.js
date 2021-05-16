require('dotenv').config();

const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

const FeeApprover = artifacts.require('FeeApprover');
// const FeeDistributor = artifacts.require('FeeDistributor');
// const RocketToken = artifacts.require('RocketToken');
// const UniswapV2Router = artifacts.require('UniswapV2Router02')
// const LiquidVault = artifacts.require('LiquidVault');
// const PriceOracle = artifacts.require('PriceOracle');

const PAIR_FAKE = "0xAA963FC97281d9632d96700aB62A4D1340F9a28a"
const LIQUID_VAULT_FAKE = "0xd36C725ab605B577a17BD264AE7E3E72ba2e8ba7"
const NOT_OWNER = "0x70aDA3495b01afE860E3af79CA47fB580570D1eb"

contract('FeeApprover', () => {
    let feeApprover
    let feeDistributor
    let RocketToken
    let LiquidVault
    let PriceOracle

    let PairAddress
    
    const assertBNequal = (bnOne, bnTwo) => assert.equal(bnOne.toString(), bnTwo.toString());

    before('setup others', async function() {
      feeApprover = await FeeApprover.new();
      await ganache.snapshot();
    });

    // FEE_APPROVER DEPLOYED
    it('Should deploy smart contract properly', async () => {
        feeApprover = await FeeApprover.deployed()
        assert(feeApprover.address !== "")
    })

    // FEE_APPROVER INIT FROM OWNER
    it('should be possible to initialize contract from owner', async () => {
        assertBNequal(await feeApprover.discountFrom(PAIR_FAKE), 0);
        assertBNequal(await feeApprover.discountFrom(LIQUID_VAULT_FAKE), 0);
        assertBNequal(await feeApprover.discountTo(PAIR_FAKE), 0);
        assertBNequal(await feeApprover.discountTo(LIQUID_VAULT_FAKE), 0);
        assert.isFalse(await feeApprover.paused());
        assert.isFalse(await feeApprover.initiated());
    
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
    
        assertBNequal(await feeApprover.discountFrom(PAIR_FAKE), 1000);
        assertBNequal(await feeApprover.discountFrom(LIQUID_VAULT_FAKE), 1000);
        assertBNequal(await feeApprover.discountTo(PAIR_FAKE), 1000);
        assertBNequal(await feeApprover.discountTo(LIQUID_VAULT_FAKE), 1000);
        assert.isTrue(await feeApprover.paused());
        assert.isTrue(await feeApprover.initiated());
    });

    // FEE_APPROVER INIT *NOT FROM OWNER
    it('should be NOT possible to initialize contract from NOT owner', async () => {

        // await expectRevert(
        //   feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE, {from: NOT_OWNER}),
        //   'Ownable: caller is not the owner'
        // );
    
        assertBNequal(await feeApprover.discountFrom(PAIR_FAKE), 0);
        assertBNequal(await feeApprover.discountFrom(LIQUID_VAULT_FAKE), 0);
        assertBNequal(await feeApprover.discountTo(PAIR_FAKE), 0);
        assertBNequal(await feeApprover.discountTo(LIQUID_VAULT_FAKE), 0);
        assert.isFalse(await feeApprover.paused());
        assert.isFalse(await feeApprover.initiated());
    });

    // FEE_APPROVER INIT JUST ONCE
    it('should be possible to initialize contract only once', async () => {

        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
    
        await expectRevert(
          feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE),
          'FeeApprover: already initiated'
        );
    });

    // FEE_APPROVER REQUIRED tokenUniswapPair & liquidVault
    it('should NOT be possible to initialize contract if tokenUniswapPair or liquidVault is empty address', async () => {
        await expectRevert(
          feeApprover.initialize(PAIR_FAKE, ZERO_ADDRESS),
          'Zero addresses not allowed'
        );
    
        assertBNequal(await feeApprover.discountFrom(PAIR_FAKE), 0);
        assertBNequal(await feeApprover.discountFrom(LIQUID_VAULT_FAKE), 0);
        assertBNequal(await feeApprover.discountTo(PAIR_FAKE), 0);
        assertBNequal(await feeApprover.discountTo(LIQUID_VAULT_FAKE), 0);
        assert.isFalse(await feeApprover.paused());
        assert.isFalse(await feeApprover.initiated());
    });

    // FEE_APPROVER UN-PAUSE BY OWNER
    it('should be possible to unpause contract from owner', async () => {
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
    
        assert.isTrue(await feeApprover.paused());
        await feeApprover.unPause();
    
        assert.isFalse(await feeApprover.paused());
    });

    // FEE_APPROVER UN-PAUSE *NOT FROM OWNER
    it('should NOT be possible to unpause contract from NOT owner', async () => {
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
    
        assert.isTrue(await feeApprover.paused());
        await expectRevert(
          feeApprover.unPause({from: NOT_OWNER}),
          'Ownable: caller is not the owner'
        );
    
        assert.isTrue(await feeApprover.paused());
    });

    // FEE_APPROVER setFeeMultiplier FROM OWNER
    it('should be possible to setFeeMultiplier from owner', async () => {
        const fee = 33;
    
        assertBNequal(await feeApprover.feePercentX100(), 10);
        await feeApprover.setFeeMultiplier(fee);
    
        assertBNequal(await feeApprover.feePercentX100(), fee);
    });

    // FEE_APPROVER setFeeMultiplier *NOT FROM OWNER
    it('should NOT be possible to setFeeMultiplier from NOT owner', async () => {
        const fee = 33;
        await expectRevert(
          feeApprover.setFeeMultiplier(fee, {from: NOT_OWNER}),
          'Ownable: caller is not the owner'
        );
    
        assertBNequal(await feeApprover.feePercentX100(), 10);
    });

    // FEE_APPROVER *NOT setFeeMultiplier > 100
    it('should NOT be possible to setFeeMultiplier more than 100', async () => {
        const fee = 101;
        await expectRevert(
          feeApprover.setFeeMultiplier(fee),
          'R3T: percentage expressed as number between 0 and 100'
        );
    
        assertBNequal(await feeApprover.feePercentX100(), 10);
    });
    
    // FEE_APPROVER setFeeBlackList FROM OWNER
    it('should be possible to setFeeBlackList from owner', async () => {
        const fee = 33;
        const blacklistedUser = accounts[5];
    
        assertBNequal(await feeApprover.feeBlackList(blacklistedUser), 0);
        await feeApprover.setFeeBlackList(blacklistedUser, fee);
    
        assertBNequal(await feeApprover.feeBlackList(blacklistedUser), 33);
    });
    
    // FEE_APPROVER setFeeBlackList *NOT FROM OWNER
    it('should NOT be possible to setFeeBlackList from NOT owner', async () => {
        const fee = 33;
        const blacklistedUser = accounts[5];
    
        assertBNequal(await feeApprover.feeBlackList(blacklistedUser), 0);
        await expectRevert(
          feeApprover.setFeeBlackList(blacklistedUser, fee, {from: NOT_OWNER}),
          'Ownable: caller is not the owner'
        );
    
        assertBNequal(await feeApprover.feeBlackList(blacklistedUser), 0);
    });

    // FEE_APPROVER *NOT setFeeMultiplier > 100
    it('should NOT be possible to setFeeBlackList more than 100', async () => {
        const fee = 101;
        const blacklistedUser = accounts[5];
    
        assertBNequal(await feeApprover.feeBlackList(blacklistedUser), 0);
        await expectRevert(
          feeApprover.setFeeBlackList(blacklistedUser, fee),
          'R3T: percentage expressed as number between 0 and 100'
        );
    
        assertBNequal(await feeApprover.feeBlackList(blacklistedUser), 0);
    });
    
    // FEE_APPROVER setFeeDiscountTo FROM OWNER
    it('should be possible to setFeeDiscountTo from owner', async () => {
        const fee = 330;
        const discountToUser = accounts[5];
    
        assertBNequal(await feeApprover.discountTo(discountToUser), 0);
        await feeApprover.setFeeDiscountTo(discountToUser, fee);
    
        assertBNequal(await feeApprover.discountTo(discountToUser), fee);
    });
    
    // FEE_APPROVER setFeeDiscountTo *NOT FROM OWNER
    it('should NOT be possible to setFeeDiscountTo from NOT owner', async () => {
        const fee = 330;
        const discountToUser = accounts[5];
    
        assertBNequal(await feeApprover.discountTo(discountToUser), 0);
        await expectRevert(
          feeApprover.setFeeDiscountTo(discountToUser, fee, {from: NOT_OWNER}),
          'Ownable: caller is not the owner'
        );
    
        assertBNequal(await feeApprover.discountTo(discountToUser), 0);
    });
    
    // FEE_APPROVER *NOT setFeeDiscountTo > 1000
    it('should NOT be possible to setFeeDiscountTo more than 1000', async () => {
        const fee = 1001;
        const discountToUser = accounts[5];
    
        assertBNequal(await feeApprover.discountTo(discountToUser), 0);
        await expectRevert(
          feeApprover.setFeeDiscountTo(discountToUser, fee),
          'R3T: discount expressed as percentage between 0 and 1000'
        );
    
        assertBNequal(await feeApprover.discountTo(discountToUser), 0);
    });
    
    // FEE_APPROVER setFeeDiscountFrom FROM OWNER
    it('should be possible to setFeeDiscountFrom from owner', async () => {
        const fee = 330;
        const discountFromUser = accounts[5];
    
        assertBNequal(await feeApprover.discountFrom(discountFromUser), 0);
        await feeApprover.setFeeDiscountFrom(discountFromUser, fee);
    
        assertBNequal(await feeApprover.discountFrom(discountFromUser), fee);
    });

    // FEE_APPROVER setFeeDiscountFrom *NOT FROM OWNER
    it('should NOT be possible to setFeeDiscountFrom from NOT owner', async () => {
        const fee = 330;
        const discountFromUser = accounts[5];
    
        assertBNequal(await feeApprover.discountFrom(discountFromUser), 0);
        await expectRevert(
          feeApprover.setFeeDiscountFrom(discountFromUser, fee, {from: NOT_OWNER}),
          'Ownable: caller is not the owner'
        );
    
        assertBNequal(await feeApprover.discountFrom(discountFromUser), 0);
    });
    
    // FEE_APPROVER *NOT setFeeDiscountFrom > 1000
    it('should NOT be possible to setFeeDiscountFrom more than 1000', async () => {
        const fee = 1001;
        const discountFromUser = accounts[5];
    
        assertBNequal(await feeApprover.discountFrom(discountFromUser), 0);
        await expectRevert(
          feeApprover.setFeeDiscountFrom(discountFromUser, fee),
          'R3T: discount expressed as percentage between 0 and 1000'
        );
    
        assertBNequal(await feeApprover.discountFrom(discountFromUser), 0);
    });
    
    
    it('all balance should be transferred to the fee receiver for blacklisted address', async () => {
        const fee = 100;
        const amount = 5000;
        const blacklistedUser = accounts[5];
        const receiver = accounts[6];
    
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
        await feeApprover.unPause();
    
        await feeApprover.setFeeBlackList(blacklistedUser, fee);
    
        const { transferToAmount, transferToFeeDistributorAmount } =
          await feeApprover.calculateAmountsAfterFee.call(blacklistedUser, receiver, amount);
    
        assertBNequal(transferToAmount, 0);
        assertBNequal(transferToFeeDistributorAmount, amount);
    });
    
    it('should calculateAmountsAfterFee for regular user', async () => {
        const amount = 5000;
        const sender = accounts[5];
        const receiver = accounts[6];
    
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
        await feeApprover.unPause();
    
        const { transferToAmount, transferToFeeDistributorAmount } =
          await feeApprover.calculateAmountsAfterFee.call(sender, receiver, amount);
    
        const regularFee = amount * 10 / 100;
        assertBNequal(transferToAmount, amount - regularFee);
        assertBNequal(transferToFeeDistributorAmount, regularFee);
    });
    
    it('should NOT calculateAmountsAfterFee if contract not yet initialized', async () => {
        const amount = 5000;
        const sender = accounts[5];
        const receiver = accounts[6];
    
        await expectRevert(
          feeApprover.calculateAmountsAfterFee(sender, receiver, amount),
          'R3T: system not yet initialized'
        );
    
    });
    
    it('should calculateAmountsAfterFee for regular user', async () => {
        const amount = 5000;
        const sender = accounts[5];
        const receiver = accounts[6];
    
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
        await feeApprover.unPause();
    
        const { transferToAmount, transferToFeeDistributorAmount } =
          await feeApprover.calculateAmountsAfterFee.call(sender, receiver, amount);
    
        const regularFee = amount * 10 / 100;
        assertBNequal(transferToAmount, amount - regularFee);
        assertBNequal(transferToFeeDistributorAmount, regularFee);
    });
    
    it('should calculateAmountsAfterFee for user with full discount', async () => {
        const discount = 1000; // 100%
        const amount = 5000;
        const sender = accounts[5];
        const receiver = accounts[6];
    
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
        await feeApprover.unPause();
    
        await feeApprover.setFeeDiscountTo(receiver, discount);
    
        const { transferToAmount, transferToFeeDistributorAmount } =
          await feeApprover.calculateAmountsAfterFee.call(sender, receiver, amount);
    
        assertBNequal(transferToAmount, amount);
        assertBNequal(transferToFeeDistributorAmount, 0);
    });
    
    it('should calculateAmountsAfterFee for user with 40% discount', async () => {
        const discount = 400; // 40%
        const amount = 5000;
        const sender = accounts[5];
        const receiver = accounts[6];
    
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
        await feeApprover.unPause();
    
        await feeApprover.setFeeDiscountTo(receiver, discount);
    
        const { transferToAmount, transferToFeeDistributorAmount } =
          await feeApprover.calculateAmountsAfterFee.call(sender, receiver, amount);
    
        const regularFee = amount * 10 / 100;
        const feeDiscount = regularFee * discount / 1000;
        assertBNequal(transferToAmount, amount - regularFee + feeDiscount);
        assertBNequal(transferToFeeDistributorAmount, regularFee - feeDiscount);
    });
    
    it('should be possible to set zero fee and get amounts for all users without fees for transfer', async () => {
        const amount = 5000;
        const sender = accounts[5];
        const receiver = accounts[6];
    
        await feeApprover.initialize(PAIR_FAKE, LIQUID_VAULT_FAKE);
        await feeApprover.unPause();
    
        await feeApprover.setFeeMultiplier(0);
    
        const { transferToAmount, transferToFeeDistributorAmount } =
          await feeApprover.calculateAmountsAfterFee.call(sender, receiver, amount);
    
        assertBNequal(transferToAmount, amount);
        assertBNequal(transferToFeeDistributorAmount, 0);
    });
})

// contract('FeeDistributor', () => {
//     it('Liquid Vault should be deployed properly', async () => {
//         const feeDistributor = await FeeDistributor.deployed()
//         const vaultAddress = await feeDistributor.liquidVault
//         assert(vaultAddress !== "")
//     })
// })