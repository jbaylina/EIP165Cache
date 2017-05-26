var EIP165Cache = artifacts.require("./EIP165Cache.sol");
var EIP165Implementer = artifacts.require("./EIP165Implementer.sol");
var MultisigMock = artifacts.require("./MultisigMock.sol");
var RegularContract = artifacts.require("./RegularContract.sol");

contract('EIP165Cache', function(accounts) {
  let eip165Cache;
  it("Normal account should not implement EIP165", async () => {

    eip165Cache = EIP165Cache.at(EIP165Cache.address);

    const implements165 = await eip165Cache.eip165Supported(accounts[0]);

    assert.equal(false, implements165);
  });
  it("Normal implementer should support 165 and implement different interfaces", async () => {
    const c = await EIP165Implementer.new();

//// Direct implements
    const ii1 = await c.supportsInterface('0x11111111');
    assert.equal(true, ii1);

    const implements165 = await eip165Cache.eip165Supported(c.address);
    assert.equal(true, implements165);

    const implements1111 = await eip165Cache.interfaceSupported(c.address, "0x11111111");
    assert.equal(true, implements1111);

    const implements2222 = await eip165Cache.interfaceSupported(c.address, "0x22222222");
    assert.equal(true, implements2222);

    const implements3333 = await eip165Cache.interfaceSupported(c.address, "0x33333333");
    assert.equal(false, implements3333);

    const implementsMulti = await eip165Cache.interfacesSupported(c.address, [
        "0x11111111",
        "0x22222222",
        "0x33333333",
        "0x01ffc9a7",
        "0xffffffff"
      ])

    assert.equal("0x000000000000000000000000000000000000000000000000000000000000000b",implementsMulti);

//    const t = await eip165Cache.test();
//    console.log("Test: ", t.toNumber());

  });
  it("Multisig shuld not implement EIP 165", async () => {
    const c = await MultisigMock.new();

    const implements165 = await eip165Cache.eip165Supported(c.address);

    assert.equal(false, implements165);
  });
  it("Regular contract shuld not implement EIP 165", async () => {
    const c = await RegularContract.new();

    const implements165 = await eip165Cache.eip165Supported(c.address);

    assert.equal(false, implements165);
  });
  it("Should save in the cache and still work", async () => {
    const c = await EIP165Implementer.new();

    const gasBefore = await eip165Cache.interfacesSupported.estimateGas(c.address, [
        "0x11111111",
        "0x22222222",
        "0x33333333",
        "0x01ffc9a7",
        "0xffffffff"
      ]);

    await eip165Cache.interfacesSupported.sendTransaction(c.address, [
        "0x11111111",
        "0x22222222",
        "0x33333333",
        "0x01ffc9a7",
        "0xffffffff"
      ]);

    const ii1 = await c.supportsInterface('0x11111111');

    const gasAfter = await eip165Cache.interfacesSupported.estimateGas(c.address, [
        "0x11111111",
        "0x22222222",
        "0x33333333",
        "0x01ffc9a7",
        "0xffffffff"
      ]);

    assert.isAbove(gasBefore, gasAfter);

    const implementsMulti = await eip165Cache.interfacesSupported(c.address, [
        "0x11111111",
        "0x22222222",
        "0x33333333",
        "0x01ffc9a7",
        "0xffffffff"
      ]);

    assert.equal("0x000000000000000000000000000000000000000000000000000000000000000b",implementsMulti);
  });

  it("Should be usable in old version of contracts", async () => {
    const abi = [{"inputs":[],"type":"constructor","payable":true},{"type":"fallback","payable":true}];
    const code = "0x60606040525b5b60338060126000396000f360606040523615600d57600d565b601d5b600060019050601a565b90565b6040518082815260200191505060405180910390f3";

    const contract = web3.eth.contract(abi);
    const tx = await contract.new({data: code, from: accounts[0], gas: 1000000});

    const r = await web3.eth.getTransactionReceipt(tx.transactionHash);

    const c = web3.eth.contract(abi).at(r.contractAddress);

    const implements165 = await eip165Cache.eip165Supported(c.address);

    assert.equal(false, implements165);
  });

  it("Should be usable in return false version of contracts", async () => {
    const abi = [{"inputs":[],"type":"constructor","payable":true},{"type":"fallback","payable":true}];
    const code = "0x60606040525b5b60338060126000396000f360606040523615600d57600d565b601d5b600060009050601a565b90565b6040518082815260200191505060405180910390f3";

    const contract = web3.eth.contract(abi);
    const tx = await contract.new({data: code, from: accounts[0], gas: 1000000});

    const r = await web3.eth.getTransactionReceipt(tx.transactionHash);

    const c = web3.eth.contract(abi).at(r.contractAddress);

    const implements165 = await eip165Cache.eip165Supported(c.address);

    assert.equal(false, implements165);
  });
});
