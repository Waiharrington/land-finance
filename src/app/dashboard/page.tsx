'use client';

import React, { useState } from 'react';
import styles from './dashboard.module.css';
import Image from 'next/image';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { 
  LAND_TOKEN_ADDRESS, 
  LAND_TOKEN_ABI, 
  LAND_LENDING_ADDRESS, 
  LAND_LENDING_ABI 
} from '@/constants/contracts';

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  // Write contract hook for Lending (loans & repayments)
  const { writeContract: writeLending, data: lendingHash, isPending: isLendingPending } = useWriteContract();
  const { isLoading: isLendingWaiting } = useWaitForTransactionReceipt({ hash: lendingHash });

  // Write contract hook for LMT token transfers
  const { writeContract: writeToken, data: tokenHash, isPending: isTokenPending } = useWriteContract();
  const { isLoading: isTokenWaiting, isSuccess: isTokenSuccess } = useWaitForTransactionReceipt({ hash: tokenHash });

  // Transfer states
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');

  // Read Landing Balance
  const { data: balanceData } = useReadContract({
    address: LAND_TOKEN_ADDRESS,
    abi: LAND_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });

  // Read Loan Data
  const { data: loanData } = useReadContract({
    address: LAND_LENDING_ADDRESS,
    abi: LAND_LENDING_ABI,
    functionName: 'loans',
    args: [address!],
    query: { enabled: !!address },
  });

  // Read Debt
  const { data: debtData } = useReadContract({
    address: LAND_LENDING_ADDRESS,
    abi: LAND_LENDING_ABI,
    functionName: 'calculateDebt',
    args: [address!],
    query: { enabled: !!address },
  });

  const mockLands = [
    { id: 1, name: "Lote Utah-Emerald 01", area: "150 m²", value: "420000", image: "/land2.png" },
    { id: 2, name: "Lote Utah-Golden 04", area: "300 m²", value: "850000", image: "/land3.png" },
  ];

  const handleRequestLoan = (landId: number, valueInUsd: string) => {
    console.log("🛠️ Click en Solicitar Préstamo:", { landId, valueInUsd });
    
    try {
      const amountToBorrow = (parseFloat(valueInUsd) * 0.8).toString();
      console.log("💰 Cantidad calculada para el crédito:", amountToBorrow);

      writeLending({
        address: LAND_LENDING_ADDRESS,
        abi: LAND_LENDING_ABI,
        functionName: 'requestLoan',
        args: [BigInt(landId), parseEther(amountToBorrow)],
      }, {
        onSuccess: (hash) => console.log("✅ Transacción enviada con éxito! Hash:", hash),
        onError: (error) => console.error("❌ Error de contrato:", error),
      });

      console.log("⌛ Esperando a que abras tu wallet para firmar...");
    } catch (e) {
      console.error("❌ Error inesperado en el código:", e);
    }
  };

  const handleRepay = () => {
    writeLending({
      address: LAND_LENDING_ADDRESS,
      abi: LAND_LENDING_ABI,
      functionName: 'repayLoan',
    });
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (!transferRecipient) {
      setTransferError("La dirección de destino es obligatoria.");
      return;
    }

    // Validación básica de dirección Ethereum
    if (!/^0x[a-fA-F0-9]{40}$/.test(transferRecipient)) {
      setTransferError("Dirección de destino no válida.");
      return;
    }

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setTransferError("El monto a transferir debe ser mayor que cero.");
      return;
    }

    const balanceInEther = balanceData ? parseFloat(formatEther(balanceData as bigint)) : 0;
    if (parseFloat(transferAmount) > balanceInEther) {
      setTransferError("Balance de LMT insuficiente.");
      return;
    }

    try {
      writeToken({
        address: LAND_TOKEN_ADDRESS,
        abi: LAND_TOKEN_ABI,
        functionName: 'transfer',
        args: [transferRecipient as `0x${string}`, parseEther(transferAmount)],
      }, {
        onSuccess: (hash) => {
          console.log("✅ Transferencia enviada con éxito! Hash:", hash);
          setTransferRecipient('');
          setTransferAmount('');
        },
        onError: (err) => {
          console.error("❌ Error en transferencia:", err);
          setTransferError(err.message || "Error al firmar o enviar la transacción.");
        }
      });
    } catch (err: any) {
      console.error(err);
      setTransferError(err.message || "Ocurrió un error inesperado.");
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Acceso Restringido</h2>
          <p>Por favor, conecta tu wallet para gestionar tus activos en LAND Finance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Mi Portfolio de Tierra</h1>
          <p>Gestiona tus activos y préstamos en tiempo real.</p>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.label}>Balance LMT</span>
            <span className={styles.value}>
              {balanceData ? parseFloat(formatEther(balanceData as bigint)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Colateral Activo</span>
            <span className={styles.value}>
              {loanData && (loanData as any)[3] ? `$${parseFloat(formatEther((loanData as any)[0])).toLocaleString()}` : '$0.00'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Deuda con Intéres</span>
            <span className={styles.value}>
              {debtData ? `$${parseFloat(formatEther(debtData as bigint)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '$0.00'}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.assets}>
          <div className={styles.sectionHeader}>
            <h2>Tus Tierras en Utah</h2>
            <button className={styles.addBtn}>+ Añadir Colateral</button>
          </div>
          <div className={styles.landList}>
            {mockLands.map(land => (
              <div key={land.id} className={styles.landCard}>
                <div className={styles.landImage}>
                  <Image src={land.image} alt={land.name} width={400} height={200} className={styles.img} />
                </div>
                <div className={styles.landInfo}>
                  <h3>{land.name}</h3>
                  <div className={styles.landDetails}>
                    <span>Área: {land.area}</span>
                    <span>Valor: ${parseInt(land.value).toLocaleString()}</span>
                  </div>
                  <div className={styles.landActions}>
                    <button 
                      className={styles.loanBtn}
                      disabled={isLendingWaiting || isLendingPending || (loanData && (loanData as any)[3])}
                      onClick={() => handleRequestLoan(land.id, land.value)}
                    >
                      {isLendingWaiting || isLendingPending ? 'Procesando...' : 'Solicitar Préstamo'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidebar}>
          {/* Loan Status Card */}
          <div className={styles.card}>
            <h3>Estado del Préstamo</h3>
            <div className={styles.loanProgress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: (loanData && (loanData as any)[3]) ? '40%' : '0%' }}
                ></div>
              </div>
              <div className={styles.progressLabels}>
                <span>LTV: {(loanData && (loanData as any)[3]) ? '40%' : '0%'}</span>
                <span>Límite: 80%</span>
              </div>
            </div>
            <div className={styles.loanDetails}>
              <div className={styles.detailItem}>
                <span>Estado</span>
                <span className={(loanData && (loanData as any)[3]) ? styles.active : ''}>
                  {(loanData && (loanData as any)[3]) ? 'VIGENTE' : 'SIN DEUDA'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span>Tasa Fija</span>
                <span>5% APY</span>
              </div>
            </div>
            <button 
              className={styles.payBtn}
              onClick={handleRepay}
              disabled={isLendingWaiting || isLendingPending || !(loanData && (loanData as any)[3])}
            >
              {isLendingWaiting || isLendingPending ? 'Procesando...' : 'Pagar Deuda'}
            </button>
          </div>

          {/* LMT Transfer Card */}
          <div className={styles.transferCard}>
            <h3>💸 Enviar Tokens LMT</h3>
            
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Dirección de Destino</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="text" 
                    placeholder="0x..." 
                    className={styles.inputField}
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    disabled={isTokenWaiting || isTokenPending}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Cantidad (LMT)</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="0.00" 
                    className={styles.inputField}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    disabled={isTokenWaiting || isTokenPending}
                  />
                  <button 
                    type="button" 
                    className={styles.maxBtn}
                    onClick={() => {
                      if (balanceData) {
                        setTransferAmount(formatEther(balanceData as bigint));
                      }
                    }}
                    disabled={isTokenWaiting || isTokenPending || !balanceData}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {transferError && (
                <div className={`${styles.statusMsg} ${styles.error}`}>
                  <span className={styles.statusIcon}>⚠️</span>
                  <div className={styles.statusText}>{transferError}</div>
                </div>
              )}

              {isTokenPending && (
                <div className={`${styles.statusMsg} ${styles.info}`}>
                  <span className={styles.statusIcon}>⌛</span>
                  <div className={styles.statusText}>Firma la transacción en tu billetera...</div>
                </div>
              )}

              {isTokenWaiting && (
                <div className={`${styles.statusMsg} ${styles.info}`}>
                  <span className={styles.statusIcon}><div className={styles.loadingSpinner} /></span>
                  <div className={styles.statusText}>
                    Procesando transferencia en Sepolia...
                    {tokenHash && <span>Hash: {tokenHash.substring(0, 10)}...{tokenHash.substring(tokenHash.length - 8)}</span>}
                  </div>
                </div>
              )}

              {isTokenSuccess && !isTokenWaiting && !isTokenPending && (
                <div className={`${styles.statusMsg} ${styles.success}`}>
                  <span className={styles.statusIcon}>✅</span>
                  <div className={styles.statusText}>¡Tokens transferidos con éxito!</div>
                </div>
              )}

              <button 
                type="submit" 
                className={styles.transferBtn}
                disabled={isTokenWaiting || isTokenPending || !transferRecipient || !transferAmount || parseFloat(transferAmount) <= 0}
              >
                {isTokenWaiting || isTokenPending ? 'Transfiriendo...' : 'Confirmar Envío'}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
