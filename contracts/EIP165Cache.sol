pragma solidity ^0.4.10;

contract GenericInterface {
    bytes32 constant public GenericInterfaceId = 0xf1753550;

    mapping (bytes32 => bool) public supportsInterface;

    function GenericInterface() {
        supportsInterface[GenericInterfaceId] = true;
    }
}

contract EIP165CacheInterface is GenericInterface {
    bytes32 constant public EIP165CacheInterfaceId =
        0x691df1e5 ^
        0x4c25a53a ^
        0xaca16d16;

    function doesSupportInterface(address _contract, bytes32 _interfaceId) constant returns (bool);
    function doesSupportEIP165(address _contract) constant returns (bool);
    function doesSupportInterfaces(address _contract, bytes32[] _interfaceIDs) constant returns (bytes32);

    function EIP165CacheInterface() {
        supportsInterface[EIP165CacheInterfaceId] = true;
    }
}

contract EIP165Cache is EIP165CacheInterface {

    enum ImplStatus { Unknown, NoEIP156, No, Yes }
    struct ContractCache {
        mapping (bytes32 => ImplStatus) interfaces;
    }
    mapping (address => ContractCache) cache;

    function doesSupportInterface(address _contract, bytes32 _interfaceId) constant returns (bool) {
        ImplStatus status = getInterfaceImplementationStatus(_contract, _interfaceId);
        return status == ImplStatus.Yes;
    }

    function doesSupportEIP165(address _contract) constant returns (bool) {
        ImplStatus status = getInterfaceImplementationStatus(_contract, GenericInterfaceId);
        return status == ImplStatus.Yes;
    }

    function doesSupportInterfaces(address _contract, bytes32[] _interfaceIDs) constant returns (bytes32 r) {
        ImplStatus status;
        if (_interfaceIDs.length > 256) throw;
        for (uint i = 0; i < _interfaceIDs.length; i++) {
            status = getInterfaceImplementationStatus(_contract, _interfaceIDs[i]);
            if (status == ImplStatus.Yes) {
              r |= bytes32(2**i);
            }
        }

        return r;
    }

    function getInterfaceImplementationStatus(address _contract, bytes32 _interfaceId) returns (ImplStatus) {
        if (!isContract(_contract)) return ImplStatus.NoEIP156;
        ImplStatus status = cache[_contract].interfaces[_interfaceId];
        if (status == ImplStatus.Unknown) {
            status = determineInterfaceImplementationStatus(_contract, _interfaceId);
            cache[_contract].interfaces[_interfaceId] = status;
        }
        return status;
    }

    function determineInterfaceImplementationStatus(address _contract, bytes32 _interfaceId) constant returns (ImplStatus) {
        bool success;
        bool result;

        (success, result) = noThrowCall(_contract, GenericInterfaceId);
        if ((!success)||(!result)) {
            return ImplStatus.NoEIP156;
        }

        (success, result) = noThrowCall(_contract, 0xFFFFFFFF);
        if ((!success)||(result)) {
            return ImplStatus.NoEIP156;
        }

        (success, result) = noThrowCall(_contract, _interfaceId);
        if (!success) {
            return ImplStatus.NoEIP156;
        } else if (result) {
            return ImplStatus.Yes;
        } else {
            return ImplStatus.No;
        }
    }

    function noThrowCall(address _contract, bytes32 _interfaceId) constant internal returns (bool success, bool result) {
        bytes4 sig = bytes4(sha3("supportsInterface(bytes32)")); //Function signature

        assembly {
                let x := mload(0x40)   //Find empty storage location using "free memory pointer"
                mstore(x,sig) //Place signature at begining of empty storage
                mstore(add(x,0x04),_interfaceId) //Place first argument directly next to signature

                success := call(      //This is the critical change (Pop the top stack value)
                                    20000, //5k gas
                                    _contract, //To addr
                                    0,    //No value
                                    x,    //Inputs are stored at location x
                                    0x24, //Inputs are 36 byes long
                                    x,    //Store output over input (saves space)
                                    0x20) //Outputs are 32 bytes long

                result := mload(add(x, 0x20))   // Load the length of the sring
        }
    }

    function isContract(address _addr) constant internal returns(bool) {
        uint size;
        assembly {
            size := extcodesize(_addr)
        }
        return size>0;
    }
}
