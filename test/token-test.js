const Token = artifacts.require("Token");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('MovieCoin', (accounts) => {
    let token, balance;
    
    before(async function () {
        accounts = await web3.eth.getAccounts();
        token = await Token.new("MC","MC","4","6","100000",true,
        "50000",accounts[0],[accounts[1],accounts[2],accounts[3], accounts[4]], [20,30,10,40]);
    });

    it('has correct name', async () => {
        const name = await token.name();
        assert.equal(name, 'MC');
    })

    it('has correct symbol', async () => {
        const symbol = await token.symbol();
        assert.equal(symbol, 'MC');
    })

    it('has correct decimals', async () => {
        const decimals = await token.decimals();
        assert.equal(decimals.toNumber(), 4);
    })

    it('has correct owner', async () => {
        const owner = await token.owner();
        assert.equal(owner, accounts[0]);
    })
    
    it('has correct total supply', async () => {
        const supply = await token.totalSupply();
        assert.equal(supply, 1000000000);
    })

    it('changes tax percent', async()=>{
        //Changing tax percentage to 5
        await token.changeTaxFeePercent(5);

        const receipt = await token.changeTaxFeePercent(5,  { from: accounts[0] });
        const gasUsed = receipt.receipt.gasUsed;
        balance = await token.taxFee();
        assert.equal(balance, 5);

    })

    it('anti-Whale feature', async()=>{
        //disabling antiWhale feature
        await token.updateAntiWhale(false, {from: accounts[0]});
        await truffleAssert.reverts(token.updateWhaleAmount(60000*10000));

        //Enabling antiWhale feature
        await token.updateAntiWhale(true, {from: accounts[0]});
        await token.updateWhaleAmount(40000*10000);
        balance = await token.whaleAmount();
        assert.equal(balance.toNumber(), 40000*10000 );
    })

    it('changes owner', async()=>{
        balance = await token.balanceOf(accounts[0]);
        await token.transferOwnership(accounts[7], {from:accounts[0]});
        let owner = await token.owner();
        assert.equal(owner, accounts[7]);
        balance = await token.balanceOf(accounts[0]);
    })

    it('vesting correctly', async()=>{
        await token.changeTaxFeePercent(6, {from:accounts[7]});

        // balance = await token.allowance(accounts[0], token.address);
        // assert.equal(balance, 0);

        // await token.increaseAllowance(token.address, 10000*10000, {from:accounts[0]});
        // balance = await token.allowance(accounts[0], token.address);

        // assert.equal(balance, 10000*10000);

        const blockNumBefore = await web3.eth.getBlockNumber();
        const blockBefore = await web3.eth.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;

        await truffleAssert.reverts(token.createVesting(accounts[8], 10000*10000, timestampBefore-1));

        await truffleAssert.reverts(token.createVesting(accounts[8], 0*10000, timestampBefore+100000));

        await token.createVesting(accounts[8], 10000*10000, timestampBefore+100000, {from: accounts[0]});

        balance = await token.getReleaseTime(1);
        await truffleAssert.reverts( token.getReleaseTime(10));
        assert.equal(balance.toNumber(),timestampBefore+100000);

        

        //Reverts, time not reached
        await truffleAssert.reverts(
            token.claim(1, {from: accounts[8]}));
        //Invalid ID
        await truffleAssert.reverts(
            token.claim(2, {from: accounts[8]}));
        //Wrong msg.sender
        await truffleAssert.reverts(
            token.claim(1, {from: accounts[9]}));

        await ethers.provider.send('evm_increaseTime', [100000]);
        await ethers.provider.send('evm_mine');

        await truffleAssert.passes(await token.claim(1, {from: accounts[8]}));
        balance = await token.balanceOf(accounts[8]);
        assert.equal(balance.toNumber(), 10000 * 10000);

        //Already expired
        await truffleAssert.reverts(
            token.claim(1, {from: accounts[8]}));
        await truffleAssert.reverts(token.getReleaseTime(1));

        let arr = await token.getReceiverIDs(accounts[8]);
        assert.equal(arr[0].toNumber(),[1]);
        assert.equal(arr.length, 1);
    })

    it('exclude and include in tax fee', async()=>{

        await truffleAssert.reverts(token.includeInFee(accounts[2]));

        await token.includeInFee(accounts[2], {from: accounts[7]});
        check = await token.isExcludedFromFee(accounts[2],{from: accounts[7]});
        assert.equal(check, false);

        await token.excludeFromFee(accounts[2], {from: accounts[7]});
        check = await token.isExcludedFromFee(accounts[2],{from: accounts[7]});
        assert.equal(check, true);


    })

    it('changeTaxPercentages', async() => {
        await token.changeTaxPercentages([10,20,30,40], {from:accounts[7]});
        //checks in next function
    })

    it('transfers correct', async() =>{
        await token.transfer(accounts[4], 10000 *10000, {from: accounts[0]});

        balance = await token.balanceOf(accounts[1]);
        balance = await token.balanceOf(accounts[0]);
        assert.equal(balance, 80000 * 10000);
        balance = await token.balanceOf(accounts[4]);
        assert.equal(balance, 10000 * 10000);

        await token.transfer(accounts[5], 500 *10000, {from: accounts[4]});

        balance = await token.balanceOf(accounts[4]);
        assert.equal(balance.toNumber(), 9500 *10000);
        balance = await token.balanceOf(accounts[5]);
        assert.equal(balance.toNumber(), 500 * 10000);

        //taxable transaction
        await token.transfer(accounts[9], 53 *10000, {from: accounts[5]});

        balance = await token.balanceOf(accounts[5]);
        assert.equal(balance.toNumber(), 447 *10000);
        balance = await token.balanceOf(accounts[9]);
        assert.equal(balance.toNumber(), 498200);        

        balance = await token.balanceOf(accounts[1]);

        //tax percentage reduced from 20% to 10% in previous function
        assert.equal(balance.toNumber(), 3180);

    })

    it('tax enable/disable', async() => {
        //not the owner
        await truffleAssert.reverts(token.isTaxApplicable(false));
        token.isTaxApplicable(false, {from: accounts[7]});

    await truffleAssert.passes( token.isTaxApplicable(false, {from: accounts[7]}));
       
    })

    it('changes tax address', async() =>{

        // Change tax address => taxAddressNewMovies
        await token.changeTaxAddress(accounts[9], 0,  {from: accounts[7]});
        check = await token.isExcludedFromFee(accounts[9],{from: accounts[7]});
        assert.equal(check, true);

        let isWhitelisted;

        isWhitelisted = await token.isWhitelistedFromWhaleAmount(accounts[9]);
        assert.equal(isWhitelisted, true);

        await token.changeTaxAddress(accounts[1], 0,  {from: accounts[7]});
        
        isWhitelisted = await token.isWhitelistedFromWhaleAmount(accounts[1]);
        assert.equal(isWhitelisted, true);
        isWhitelisted = await token.isWhitelistedFromWhaleAmount(accounts[9]);
        assert.equal(isWhitelisted, false);

        check = await token.isExcludedFromFee(accounts[1],{from: accounts[7]});
        assert.equal(check, true);


        // Change tax address => taxAddressNewMovies and move funds to new address
        balance = (await token.balanceOf(accounts[1])).toNumber();
        balance += (await token.balanceOf(accounts[9])).toNumber();
    })

    it('multiSends works', async() => {
        await token.multiSend([accounts[5],accounts[6],accounts[7]], [500*10000,500*10000,1000*10000], 2000*10000, {from:accounts[0]});

        balance = await token.balanceOf(accounts[5]);
        assert.equal(balance.toNumber(), 9470000);
        balance = await token.balanceOf(accounts[6]);
        assert.equal(balance.toNumber(), 500 *10000);

        //Insufficient balance
        await truffleAssert.reverts(
            token.multiSend([accounts[5],accounts[6],accounts[7]], [49000*10000,49000*10000,1000*10000], 2000*10000, {from:accounts[0]})
        );
        //Non equal length of accounts and amounts
        await truffleAssert.reverts(
            token.multiSend([accounts[5],accounts[7]], [500*10000,500*10000,1000*10000], 2000*10000, {from:accounts[0]})
        );
    })

    it('multiVesting works', async() =>{
        
        // MULTIPLE VESTING
        const blockNumBefore = await web3.eth.getBlockNumber();
        const blockBefore = await web3.eth.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;

        await token.increaseAllowance(token.address, 4000*10000, {from:accounts[0]});
        balance = await token.allowance(accounts[0], token.address);

        assert.equal(balance, 4000*10000);

        await token.createMultipleVesting([accounts[8], accounts[3]], [2000*10000, 2000*10000], [timestampBefore+1000000, timestampBefore+10000000]);

        let time = await token.getReleaseTime(2);
        assert.equal(time.toNumber(),timestampBefore+1000000);

        time = await token.getReleaseTime(3);
        assert.equal(time.toNumber(),timestampBefore+10000000);

        await ethers.provider.send('evm_increaseTime', [10000000]);
        await ethers.provider.send('evm_mine');

        balance = await token.balanceOf(accounts[8]);
        await token.claim(2, {from: accounts[8]});
        let balance_r = await token.balanceOf(accounts[8]);
        assert.equal(balance_r.toNumber(), balance.toNumber()+2000*10000);

        await truffleAssert.passes(token.claim(3, {from: accounts[3]}));

    })

    it('approve works', async() =>{
        await token.approve(accounts[8], 30000*10000, {from: accounts[0]});

        await truffleAssert.passes(token.transferFrom(accounts[0], accounts[8], 20000*10000, {from : accounts[8]}));

        await token.decreaseAllowance(accounts[8], 10000*10000, {from: accounts[0]});

        await truffleAssert.reverts(token.transferFrom(accounts[0], accounts[8], 3032*10000, {from : accounts[8]}));

    })

    it('total supply equal to sum of all balances', async() =>{

        await token.transfer(accounts[6], 250 *10000, {from: accounts[5]});

        let totalSupply = await token.totalSupply();
        let temp;
        assert.equal(totalSupply.toNumber(), 1000000000);
        let sum = 0;
        for(let i =0; i< 10; i++)
        {
            temp = await token.balanceOf(accounts[i]);
            sum += temp.toNumber();
        }
        assert.equal(sum, 1000000000);

    })

    it('testing gas', async()=>{
        // const gasUsed = resp.receipt.gasUsed;
        //Transfer 20 times
        balance = await token.balanceOf(accounts[0]);
        let totalGas = 0;

        for(let i =0; i<20; i++){
        const resp = await token.transfer(accounts[4], 500 *10000, {from: accounts[0]});
        totalGas += resp.receipt.gasUsed;
        }

        balance = await token.balanceOf(accounts[0]);
        assert.equal(balance.toNumber(), 44000*10000);

        totalGas = 0;

        const array1 = [];
        const array2 = [];

        const n = 10;

        for(let i =0;i<n;i++){
            array1[i] = accounts[4];
            array2[i] = 1;
        }

        const resp = await token.multiSend(array1, array2, n, {from: accounts[0]});
        totalGas += resp.receipt.gasUsed;
    })

    it("Whitelists addresses", async() =>{
        balance = await token.balanceOf(accounts[0]);
        assert.equal(balance.toNumber(), 439999990);

        //removes accounts[0] from whitelist of whale amount check
        await token.updateWhitelistedAddressFromWhale(accounts[0], false, {from: accounts[7]});
        //fails because accounts[0] contains more than whale amount
        await truffleAssert.reverts( token.transfer(accounts[0], 100, {from: accounts[8]}));
    })

    it("Renounce ownership", async() =>{
        await token.renounceOwnership({from: accounts[7]});
        let owner = await token.owner();
        assert.equal(owner, 0);
    })
})