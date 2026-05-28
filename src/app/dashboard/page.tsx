'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import Image from 'next/image';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useSwitchChain
} from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { 
  LAND_TOKEN_ADDRESS, 
  LAND_TOKEN_ABI, 
  LAND_LENDING_ADDRESS, 
  LAND_LENDING_ABI 
} from '@/constants/contracts';
import { 
  Coins, 
  Lock, 
  ExternalLink, 
  CheckCircle, 
  ArrowRightLeft,
  Info
} from 'lucide-react';

interface MockLand {
  id: number;
  name: string;
  area: string;
  value: string;
  image: string;
}

export default function Dashboard() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  // Modales
  const [selectedLand, setSelectedLand] = useState<MockLand | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);

  // --- HOOKS DE CONTRATO (Lecturas) ---
  
  // 1. Balance de LMT
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: LAND_TOKEN_ADDRESS,
    abi: LAND_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 2. Préstamo Activo
  const { data: loanData, refetch: refetchLoan } = useReadContract({
    address: LAND_LENDING_ADDRESS,
    abi: LAND_LENDING_ABI,
    functionName: 'loans',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 3. Deuda acumulada
  const { data: debtData, refetch: refetchDebt } = useReadContract({
    address: LAND_LENDING_ADDRESS,
    abi: LAND_LENDING_ABI,
    functionName: 'calculateDebt',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // --- HOOKS DE ESCRITURA (Independientes por cada acción) ---

  // A. Transferencia de LMT
  const { writeContract: writeToken, data: tokenHash, isPending: isTokenPending } = useWriteContract();
  const { isLoading: isTokenWaiting, isSuccess: isTokenSuccess } = useWaitForTransactionReceipt({ hash: tokenHash });

  // B. Solicitar Préstamo (Request Loan)
  const { writeContract: writeRequestLoan, data: loanHash, isPending: isLoanPending } = useWriteContract();
  const { isLoading: isLoanWaiting, isSuccess: isLoanSuccess } = useWaitForTransactionReceipt({ hash: loanHash });

  // C. Pagar Préstamo (Repay Loan)
  const { writeContract: writeRepayLoan, data: repayHash, isPending: isRepayPending } = useWriteContract();
  const { isLoading: isRepayWaiting, isSuccess: isRepaySuccess } = useWaitForTransactionReceipt({ hash: repayHash });

  // --- LOGS DE DEPURACIÓN EN CONSOLA ---
  console.log("🛠️ [DASHBOARD DEBUG] userAddress:  ", address);
  console.log("🛠️ [DASHBOARD DEBUG] chainName:    ", chain?.name);
  console.log("🛠️ [DASHBOARD DEBUG] chainId:      ", chain?.id);
  console.log("🛠️ [DASHBOARD DEBUG] tokenAddress: ", LAND_TOKEN_ADDRESS);
  console.log("🛠️ [DASHBOARD DEBUG] balanceData:  ", balanceData ? balanceData.toString() : 'undefined');

  // Transfer states
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');

  // Refrescar balances cuando cambie el estado en la blockchain
  useEffect(() => {
    if (isTokenSuccess || isLoanSuccess || isRepaySuccess) {
      refetchBalance();
      refetchLoan();
      refetchDebt();
    }
  }, [isTokenSuccess, isLoanSuccess, isRepaySuccess]);

  const mockLands: MockLand[] = [
    { id: 1, name: "Lote Utah-Emerald 01", area: "150 m²", value: "420000", image: "/land2.png" },
    { id: 2, name: "Lote Utah-Golden 04", area: "300 m²", value: "850000", image: "/land3.png" },
  ];

  // Ejecutar solicitud de préstamo
  const handleRequestLoanConfirm = () => {
    if (!selectedLand) return;
    try {
      const amountToBorrow = (parseFloat(selectedLand.value) * 0.8).toString();
      writeRequestLoan({
        address: LAND_LENDING_ADDRESS,
        abi: LAND_LENDING_ABI,
        functionName: 'requestLoan',
        args: [BigInt(selectedLand.id), parseEther(amountToBorrow)],
      });
    } catch (e) {
      console.error("Error requesting loan:", e);
    }
  };

  // Ejecutar pago de préstamo
  const handleRepayConfirm = () => {
    try {
      writeRepayLoan({
        address: LAND_LENDING_ADDRESS,
        abi: LAND_LENDING_ABI,
        functionName: 'repayLoan',
      });
    } catch (e) {
      console.error("Error repaying loan:", e);
    }
  };

  // Ejecutar transferencia LMT
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (!transferRecipient) {
      setTransferError("La dirección de destino es obligatoria.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(transferRecipient)) {
      setTransferError("Dirección de destino no válida.");
      return;
    }

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setTransferError("El monto debe ser mayor que cero.");
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
        onSuccess: () => {
          setTransferRecipient('');
          setTransferAmount('');
        },
        onError: (err) => {
          setTransferError(err.message || "Error al firmar o enviar la transacción.");
        }
      });
    } catch (err: any) {
      setTransferError(err.message || "Ocurrió un error inesperado.");
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Acceso Restringido</h2>
          <p>Por favor, conecta tu Trust Wallet para gestionar tus activos en LAND Finance.</p>
        </div>
      </div>
    );
  }

  const userBalance = balanceData ? parseFloat(formatEther(balanceData as bigint)) : 0;
  const activeLoan = loanData ? (loanData as any)[3] : false;
  const activeCollateral = loanData && activeLoan ? parseFloat(formatEther((loanData as any)[0])) : 0;
  const currentDebt = debtData ? parseFloat(formatEther(debtData as bigint)) : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Mi Portfolio de Tierra</h1>
          <p style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Gestiona tus activos y préstamos en tiempo real.</span>
            {chain?.id === 8453 ? (
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '0.75rem', 
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                🟢 Red: {chain?.name} (ID: {chain?.id})
              </span>
            ) : (
              <button 
                onClick={() => switchChain && switchChain({ chainId: 8453 })}
                style={{ 
                  padding: '4px 10px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
                title="Haz clic para cambiar a Base automáticamente"
              >
                🔴 Red incorrecta: Cambiar a Base ↗
              </button>
            )}
          </p>
        </div>
        
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.label}>Balance LMT</span>
            <span className={styles.value}>
              {userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Colateral Activo</span>
            <span className={styles.value}>
              ${activeCollateral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Deuda con Interés</span>
            <span className={styles.value}>
              ${currentDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
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
                  <Image src={land.image} alt={land.name} fill sizes="(max-width: 768px) 100vw, 33vw" className={styles.img} />
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
                      disabled={activeLoan}
                      onClick={() => {
                        setSelectedLand(land);
                        setShowLoanModal(true);
                      }}
                    >
                      {activeLoan ? 'Préstamo Activo' : 'Solicitar Préstamo'}
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
                  style={{ width: activeLoan ? '40%' : '0%' }}
                ></div>
              </div>
              <div className={styles.progressLabels}>
                <span>LTV: {activeLoan ? '40%' : '0%'}</span>
                <span>Límite: 80%</span>
              </div>
            </div>
            <div className={styles.loanDetails}>
              <div className={styles.detailItem}>
                <span>Estado</span>
                <span className={activeLoan ? styles.active : ''}>
                  {activeLoan ? 'VIGENTE' : 'SIN DEUDA'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span>Tasa Fija</span>
                <span>5% APY</span>
              </div>
            </div>
            <button 
              className={styles.payBtn}
              onClick={() => setShowRepayModal(true)}
              disabled={!activeLoan}
              style={{
                background: activeLoan ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: activeLoan ? '#000' : 'var(--text-muted)',
                cursor: activeLoan ? 'pointer' : 'not-allowed'
              }}
            >
              Pagar Deuda
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
                    Procesando transferencia en Base...
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

      {/* --- MODAL PARA SOLICITAR PRÉSTAMO (Web3 interactivo) --- */}
      {showLoanModal && selectedLand && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button 
              className={styles.closeBtn}
              onClick={() => {
                setShowLoanModal(false);
                setSelectedLand(null);
              }}
              disabled={isLoanWaiting || isLoanPending}
            >
              ✕
            </button>

            {!isLoanPending && !isLoanWaiting && !isLoanSuccess ? (
              <>
                <h2>Hipotecar Terreno RWA</h2>
                <p className={styles.modalSub}>Estás a punto de depositar esta propiedad en el Smart Contract seguro para recibir liquidez en tokens LMT de forma inmediata.</p>
                
                <div className={styles.modalGrid}>
                  <div>
                    <span className={styles.modalLabel}>Propiedad Colateral</span>
                    <div className={styles.modalVal}>{selectedLand.name}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span className={styles.modalLabel}>Área</span>
                      <div className={styles.modalVal}>{selectedLand.area}</div>
                    </div>
                    <div>
                      <span className={styles.modalLabel}>Valor Tasado (USD)</span>
                      <div className={styles.modalVal}>${parseInt(selectedLand.value).toLocaleString()} USD</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span className={styles.modalLabel}>Límite LTV</span>
                      <div className={styles.modalVal}>80%</div>
                    </div>
                    <div>
                      <span className={styles.modalLabel}>Préstamo a Recibir</span>
                      <div className={styles.modalVal} style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>
                        {(parseFloat(selectedLand.value) * 0.8).toLocaleString()} LMT
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  className={styles.confirmBtn}
                  onClick={handleRequestLoanConfirm}
                >
                  Confirmar e Hipotecar Terreno
                </button>
              </>
            ) : (isLoanPending || isLoanWaiting) ? (
              <div className={styles.modalStatus}>
                <div className={styles.spinner} />
                <h2>Solicitando Préstamo</h2>
                <p className={styles.modalSub}>
                  {isLoanPending ? 'Firma la transacción de préstamo en tu Trust Wallet...' : 'Procesando contrato de hipoteca en Base Mainnet...'}
                </p>
                {loanHash && (
                  <a 
                    href={`https://basescan.org/tx/${loanHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.explorerLink}
                  >
                    Ver en Basescan <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : isLoanSuccess ? (
              <div className={styles.modalStatus}>
                <div className={styles.successIcon}>✓</div>
                <h2>¡Préstamo Concedido!</h2>
                <p className={styles.modalSub}>
                  Se han depositado tus tierras de forma exitosa en el Smart Contract. Has recibido **{(parseFloat(selectedLand.value) * 0.8).toLocaleString()} LMT** en tu billetera.
                </p>
                {loanHash && (
                  <a 
                    href={`https://basescan.org/tx/${loanHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.explorerLink}
                  >
                    Ver en Basescan <ExternalLink size={12} />
                  </a>
                )}
                <button 
                  className={styles.confirmBtn}
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    setShowLoanModal(false);
                    setSelectedLand(null);
                  }}
                >
                  Ir a Mi Portfolio
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- MODAL PARA PAGAR DEUDA (Web3 interactivo) --- */}
      {showRepayModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button 
              className={styles.closeBtn}
              onClick={() => setShowRepayModal(false)}
              disabled={isRepayWaiting || isRepayPending}
            >
              ✕
            </button>

            {!isRepayPending && !isRepayWaiting && !isRepaySuccess ? (
              <>
                <h2>Saldar Deuda RWA</h2>
                <p className={styles.modalSub}>Vas a quemar tus tokens LMT para pagar la deuda principal más el interés del 5% APY acumulado, y liberar tu terreno hipotecado.</p>
                
                <div className={styles.modalGrid}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span className={styles.modalLabel}>Deuda Total</span>
                      <div className={styles.modalVal} style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                        {currentDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} LMT
                      </div>
                    </div>
                    <div>
                      <span className={styles.modalLabel}>Tu Balance LMT</span>
                      <div className={styles.modalVal}>
                        {userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LMT
                      </div>
                    </div>
                  </div>
                </div>

                {userBalance < currentDebt && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.8rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Balance Insuficiente:</strong> Necesitas acumular más tokens LMT para poder saldar esta deuda.</span>
                  </div>
                )}

                <button 
                  className={styles.confirmBtn}
                  onClick={handleRepayConfirm}
                  disabled={userBalance < currentDebt}
                  style={{
                    background: userBalance >= currentDebt ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: userBalance >= currentDebt ? '#000' : 'var(--text-muted)',
                    cursor: userBalance >= currentDebt ? 'pointer' : 'not-allowed'
                  }}
                >
                  Confirmar y Liberar Terreno
                </button>
              </>
            ) : (isRepayPending || isRepayWaiting) ? (
              <div className={styles.modalStatus}>
                <div className={styles.spinner} />
                <h2>Saldando Deuda</h2>
                <p className={styles.modalSub}>
                  {isRepayPending ? 'Firma la transacción de pago en tu Trust Wallet...' : 'Procesando quema de tokens LMT en Base Mainnet...'}
                </p>
                {repayHash && (
                  <a 
                    href={`https://basescan.org/tx/${repayHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.explorerLink}
                  >
                    Ver en Basescan <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : isRepaySuccess ? (
              <div className={styles.modalStatus}>
                <div className={styles.successIcon}>✓</div>
                <h2>¡Deuda Saldada!</h2>
                <p className={styles.modalSub}>
                  Has saldado tu deuda de forma exitosa. Tus tokens LMT han sido quemados y tu terreno ha sido **liberado y devuelto** a tu propiedad en la Reserva.
                </p>
                {repayHash && (
                  <a 
                    href={`https://basescan.org/tx/${repayHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.explorerLink}
                  >
                    Ver en Basescan <ExternalLink size={12} />
                  </a>
                )}
                <button 
                  className={styles.confirmBtn}
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowRepayModal(false)}
                >
                  Entendido
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
