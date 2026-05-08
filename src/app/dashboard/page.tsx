'use client';

import React from 'react';
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
  const { writeContract, data: hash } = useWriteContract();
  
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash });

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

      writeContract({
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
    writeContract({
      address: LAND_LENDING_ADDRESS,
      abi: LAND_LENDING_ABI,
      functionName: 'repayLoan',
    });
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
              {balanceData ? formatEther(balanceData as bigint) : '0.00'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Colateral Activo</span>
            <span className={styles.value}>
              {loanData && (loanData as any)[3] ? `$${formatEther((loanData as any)[0])}` : '$0.00'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Deuda con Intéres</span>
            <span className={styles.value}>
              {debtData ? `$${formatEther(debtData as bigint)}` : '$0.00'}
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
                    <span>Valor: ${land.value}</span>
                  </div>
                  <div className={styles.landActions}>
                    <button 
                      className={styles.loanBtn}
                      disabled={isWaiting || (loanData && (loanData as any)[3])}
                      onClick={() => handleRequestLoan(land.id, land.value)}
                    >
                      {isWaiting ? 'Procesando...' : 'Solicitar Préstamo'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidebar}>
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
              disabled={isWaiting || !(loanData && (loanData as any)[3])}
            >
              {isWaiting ? 'Procesando...' : 'Pagar Deuda'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
