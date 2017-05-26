var EIP165Cache = artifacts.require("./EIP165Cache.sol");

module.exports = function(deployer) {
  deployer.deploy(EIP165Cache);
};
