const Token = artifacts.require("MyToken");
require('dotenv').config({path: '../.env'});
const chai = require("./chaisetup");
const expect = chai.expect;
const BN = web3.utils.BN;
contract("Token Test", async accounts => {
    const [ deployerAccount, recipient, anotherAccount ] = accounts;

    beforeEach(async () => {
      this.myToken = await Token.new(process.env.INITIAL_TOKENS, { from: deployerAccount });
    });
    
    
    it("All tokens should be in my account", async () => {
    let instance = await this.myToken;
    let totalSupply = await instance.totalSupply();
    await expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(totalSupply);
    });

    
    it("is possible to send tokens between accounts", async () => {
        const sendTokens = 1;
        let instance = await this.myToken;
        let totalSupply = await instance.totalSupply();
        await expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(totalSupply);
        await expect(instance.transfer(recipient, sendTokens)).to.eventually.be.fulfilled;      
        await expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));
        await expect(instance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(sendTokens));
      });
  
  
      it("It's not possible to send more tokens than available in total", async () => {
        let instance = await this.myToken;
        let balanceOfAccount = await instance.balanceOf(deployerAccount);
        await expect(instance.transfer(recipient, new BN(balanceOfAccount+1))).to.eventually.be.rejected;
  
        //check if the balance is still the same
        await expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(balanceOfAccount);
  
      });
});