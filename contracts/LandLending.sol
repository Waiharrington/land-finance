// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LandToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LandLending
 * @dev Gestiona el colateral de tierras y la emisión de préstamos en tokens LAND.
 */
contract LandLending is Ownable, ReentrancyGuard {
    LandToken public landToken;
    
    // Tasa fija de interés: 5% anual (en base 10000, 500 = 5%)
    uint256 public constant INTEREST_RATE = 500;
    uint256 public constant LTV_LIMIT = 8000; // 80% LTV
    
    struct Loan {
        uint256 collateralValue; // Valor de la tierra en USD (simulado)
        uint256 amountBorrowed;  // Cantidad de LAND prestado
        uint256 startTime;       // Momento del préstamo
        bool active;
    }
    
    mapping(address => Loan) public loans;
    mapping(uint256 => uint256) public landValues; // LandID -> Value in USD

    event LoanRequested(address indexed user, uint256 amount, uint256 landId);
    event LoanRepaid(address indexed user, uint256 amountPaid);

    constructor(address _landToken) Ownable(msg.sender) {
        landToken = LandToken(_landToken);
    }

    /**
     * @dev Configura el valor de una tierra (Simula el Oráculo).
     */
    function setLandValue(uint256 landId, uint256 value) external onlyOwner {
        landValues[landId] = value;
    }

    /**
     * @dev Solicita un préstamo usando una tierra como garantía.
     * @param landId El ID de la tierra en el catálogo.
     * @param amountToBorrow Cantidad de tokens LAND deseados.
     */
    function requestLoan(uint256 landId, uint256 amountToBorrow) external nonReentrant {
        require(!loans[msg.sender].active, "Ya tienes un prestamo activo");
        uint256 value = landValues[landId];
        require(value > 0, "Tierra no valorizada");
        
        // Verificar LTV (Préstamo no puede superar el 80% del valor)
        uint256 maxLoan = (value * LTV_LIMIT) / 10000;
        require(amountToBorrow <= maxLoan, "Excede el limite LTV (80%)");
        
        // Registrar préstamo
        loans[msg.sender] = Loan({
            collateralValue: value,
            amountBorrowed: amountToBorrow,
            startTime: block.timestamp,
            active: true
        });
        
        // Emitir tokens LAND (Minter Role obligatorio)
        landToken.mint(msg.sender, amountToBorrow);
        
        emit LoanRequested(msg.sender, amountToBorrow, landId);
    }

    /**
     * @dev Paga la deuda e intereses para liberar el colateral.
     */
    function repayLoan() external nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No hay prestamo activo");
        
        uint256 debt = calculateDebt(msg.sender);
        
        // El usuario debe tener suficientes tokens para pagar
        require(landToken.balanceOf(msg.sender) >= debt, "Balance insuficiente para pagar deuda");
        
        // Quemar los tokens (Burner Role obligatorio)
        landToken.burn(msg.sender, debt);
        
        loan.active = false;
        emit LoanRepaid(msg.sender, debt);
    }

    /**
     * @dev Calcula la deuda actual incluyendo el 5% de interés simple.
     */
    function calculateDebt(address user) public view returns (uint256) {
        Loan memory loan = loans[user];
        if (!loan.active) return 0;
        
        uint256 timeElapsed = block.timestamp - loan.startTime;
        // Interés = Deuda * (5% * tiempo / 1 año)
        uint256 interest = (loan.amountBorrowed * INTEREST_RATE * timeElapsed) / (10000 * 365 days);
        
        return loan.amountBorrowed + interest;
    }
}
