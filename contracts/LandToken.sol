// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title LandMasterToken
 * @dev El token LMT es un utility token con un suministro máximo de 829,000,000.
 * Utiliza AccessControl para permitir que múltiples contratos (como Lending) emitan tokens.
 */
contract LandToken is ERC20Capped, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Límite de 829 Millones de tokens
    uint256 public constant MAX_SUPPLY = 829000000 * 10**18;

    constructor(address admin) 
        ERC20("Land Master Token", "LMT") 
        ERC20Capped(MAX_SUPPLY) 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @dev Acuña tokens LMT. Solo direcciones con MINTER_ROLE pueden hacerlo.
     * El límite MAX_SUPPLY es verificado automáticamente por ERC20Capped.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Quema tokens LMT. Solo direcciones con BURNER_ROLE pueden hacerlo.
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    // Eliminamos el override manual de _update ya que ERC20Capped lo maneja correctamente
    // y no hay conflictos con AccessControl.
}
