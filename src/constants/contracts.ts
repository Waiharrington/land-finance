export const LAND_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LAND_TOKEN_ADDRESS || "0x1ceC630e1873f61C766a1aA9dBfB8dB80eD2B5C9";
export const LAND_LENDING_ADDRESS = process.env.NEXT_PUBLIC_LAND_LENDING_ADDRESS || "0x11577Efd62Af27D27d706A5e70682344628d0D19";

export const LAND_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external"
] as const;

export const LAND_LENDING_ABI = [
  "function requestLoan(uint256 landId, uint256 amountToBorrow) external",
  "function repayLoan() external",
  "function calculateDebt(address user) view returns (uint256)",
  "function loans(address user) view returns (uint256 collateralValue, uint256 amountBorrowed, uint256 startTime, bool active)",
  "function landValues(uint256 landId) view returns (uint256)"
] as const;
