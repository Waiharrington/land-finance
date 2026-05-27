import { parseAbi } from 'viem';

export const LAND_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_LAND_TOKEN_ADDRESS || "0x8dF87B6e4561D5d8d80830aFF9D95E5CA429ddFe") as `0x${string}`;
export const LAND_LENDING_ADDRESS = (process.env.NEXT_PUBLIC_LAND_LENDING_ADDRESS || "0x21cf14Bf940172a6740F550C9B22e2fa19b2EE3C") as `0x${string}`;

export const LAND_TOKEN_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external",
  "function transfer(address to, uint256 amount) returns (bool)"
]);

export const LAND_LENDING_ABI = parseAbi([
  "function requestLoan(uint256 landId, uint256 amountToBorrow) external",
  "function repayLoan() external",
  "function calculateDebt(address user) view returns (uint256)",
  "function loans(address user) view returns (uint256 collateralValue, uint256 amountBorrowed, uint256 startTime, bool active)",
  "function landValues(uint256 landId) view returns (uint256)"
]);
