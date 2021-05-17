pragma solidity = 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@ubeswap/core/contracts/uniswapv2/UniswapV2Factory.sol";
import "@ubeswap/core/contracts/uniswapv2/UniswapV2Router02.sol";
// import "@celo/contracts/common/GoldToken.sol";

contract CeloToken is ERC20 {
    constructor() ERC20("Celo", "CELO") public {
        _mint(msg.sender, 10000000 * 10 ** decimals());
    }
}