'use client';

import React, { useState, useEffect } from 'react';
import styles from './marketplace.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { 
  LAND_TOKEN_ADDRESS, 
  LAND_TOKEN_ABI 
} from '@/constants/contracts';
import { 
  Search, 
  MapPin, 
  TrendingUp, 
  Coins, 
  Lock, 
  ExternalLink, 
  Sparkles 
} from 'lucide-react';

interface RwaAsset {
  id: number;
  name: string;
  location: string;
  state: 'Arizona' | 'Utah' | 'Nevada' | 'Nuevo México';
  area: string;
  priceLmt: number;
  priceUsd: number;
  totalFractions: number;
  soldFractions: number;
  apy: number;
  image: string;
}

export default function Marketplace() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isTxWaiting, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Arizona' | 'Utah' | 'Nevada'>('Todos');
  const [selectedAsset, setSelectedAsset] = useState<RwaAsset | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [ownedAssets, setOwnedAssets] = useState<{ [key: number]: number }>({});
  const [yieldAccrued, setYieldAccrued] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Read LMT balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: LAND_TOKEN_ADDRESS,
    abi: LAND_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Catálogo de Activos (Demo de alta fidelidad)
  const initialAssets: RwaAsset[] = [
    {
      id: 1,
      name: "Arizona Interstate Logistic Hub",
      location: "Eloy, Arizona (I-10 & SR-87)",
      state: "Arizona",
      area: "42 Acres",
      priceLmt: 150,
      priceUsd: 15,
      totalFractions: 5000,
      soldFractions: 4124,
      apy: 6.2,
      image: "/land1.png"
    },
    {
      id: 2,
      name: "Utah Sky Peak autonomous Hub",
      location: "Monticello, Utah (Hwy 191)",
      state: "Utah",
      area: "15 Acres",
      priceLmt: 300,
      priceUsd: 30,
      totalFractions: 3000,
      soldFractions: 2840,
      apy: 5.5,
      image: "/land2.png"
    },
    {
      id: 3,
      name: "Nevada Solar Horizon Hub",
      location: "Boulder City, Nevada (Hwy 95)",
      state: "Nevada",
      area: "85 Acres",
      priceLmt: 500,
      priceUsd: 50,
      totalFractions: 8000,
      soldFractions: 6950,
      apy: 7.8,
      image: "/land3.png"
    }
  ];

  const [assets, setAssets] = useState<RwaAsset[]>(initialAssets);

  // Cargar inversiones desde localStorage
  useEffect(() => {
    const loadedOwned: { [key: number]: number } = {};
    initialAssets.forEach(asset => {
      const saved = localStorage.getItem(`owned_fractions_${asset.id}`);
      if (saved) {
        loadedOwned[asset.id] = parseInt(saved, 10);
      }
    });
    setOwnedAssets(loadedOwned);
  }, []);

  // Hook para calcular rendimientos segundo a segundo (APY)
  useEffect(() => {
    const hasInvestments = Object.values(ownedAssets).some(val => val > 0);
    if (!hasInvestments) return;

    const interval = setInterval(() => {
      let accruedThisSecond = 0;
      initialAssets.forEach(asset => {
        const owned = ownedAssets[asset.id] || 0;
        if (owned > 0) {
          // Rendimiento por segundo = (LMT invertidos * APY%) / (Segundos en un año)
          const investedLmt = owned * asset.priceLmt;
          const yieldPerYear = investedLmt * (asset.apy / 100);
          const yieldPerSecond = yieldPerYear / (365 * 24 * 3600);
          
          accruedThisSecond += yieldPerSecond * 0.1; // Multiplicado por el tick (100ms)
        }
      });
      setYieldAccrued(prev => prev + accruedThisSecond);
    }, 100);

    return () => clearInterval(interval);
  }, [ownedAssets]);

  // Si la transacción finaliza con éxito, actualizamos el estado
  useEffect(() => {
    if (isTxSuccess && selectedAsset) {
      const assetId = selectedAsset.id;
      const currentOwned = ownedAssets[assetId] || 0;
      const newOwned = currentOwned + 1;

      // Actualizar localStorage
      localStorage.setItem(`owned_fractions_${assetId}`, newOwned.toString());
      setOwnedAssets(prev => ({ ...prev, [assetId]: newOwned }));

      // Incrementar soldFractions localmente
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, soldFractions: a.soldFractions + 1 } : a));

      // Refrescar balance
      refetchBalance();
    }
  }, [isTxSuccess]);

  // Manejar compra de fracción (Transferencia real on-chain)
  const handleBuyConfirm = () => {
    if (!selectedAsset || !address) return;

    const amountInWei = parseEther(selectedAsset.priceLmt.toString());
    const treasuryAddress = "0x4AA21B0C3107c6c23B850fB288AE929414C2AE28"; // Tu billetera receptora

    try {
      writeContract({
        address: LAND_TOKEN_ADDRESS,
        abi: LAND_TOKEN_ABI,
        functionName: 'transfer',
        args: [treasuryAddress, amountInWei],
      });
    } catch (e) {
      console.error("Error signing transaction:", e);
    }
  };

  // Simular reclamo de rendimientos
  const handleClaimYield = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setYieldAccrued(0);
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 3000);
    }, 1500);
  };

  // Filtrado y Búsqueda
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'Todos' || asset.state === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getFractionsLeft = (asset: RwaAsset) => asset.totalFractions - asset.soldFractions;

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Acceso Restringido</h2>
          <p>Por favor, conecta tu Trust Wallet para explorar e invertir en la Reserva de Tierras RWA.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.glow} />

      <header className={styles.header}>
        <h1>Mercado de Tierras RWA</h1>
        <p>Adquiere fracciones de tierras premium reales, genera rendimientos garantizados y diversifica tu capital on-chain.</p>
      </header>

      {/* Mis Inversiones / Rendimientos Ticking */}
      {Object.values(ownedAssets).some(val => val > 0) && (
        <section className={styles.portfolioSection}>
          <div className={styles.portfolioHeader}>
            <h2>💼 Mi Portafolio de Inversión</h2>
            <div className={styles.claimCard}>
              <div className={styles.claimInfo}>
                <span className={styles.claimLabel}>Rendimiento Acumulado</span>
                <span className={styles.claimValue}>{yieldAccrued.toFixed(6)} LMT</span>
              </div>
              <button 
                className={styles.claimBtn}
                onClick={handleClaimYield}
                disabled={yieldAccrued <= 0.0001 || isClaiming}
              >
                {isClaiming ? 'Reclamando...' : 'Reclamar Rendimientos'}
              </button>
            </div>
          </div>

          {claimSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.8rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              🎉 ¡Rendimientos cosechados con éxito! Los tokens LMT se han añadido a tu cuenta.
            </div>
          )}

          <div className={styles.portfolioGrid}>
            {assets.map(asset => {
              const owned = ownedAssets[asset.id] || 0;
              if (owned === 0) return null;
              return (
                <div key={asset.id} className={styles.ownedCard}>
                  <h3>{asset.name}</h3>
                  <div className={styles.ownedMeta}>
                    <label>Fracciones</label>
                    <span>{owned} u.</span>
                  </div>
                  <div className={styles.ownedMeta}>
                    <label>Total Invertido</label>
                    <span>{owned * asset.priceLmt} LMT</span>
                  </div>
                  <div className={styles.ownedYield}>
                    <span className={styles.yieldLabel}>APY</span>
                    <span className={styles.yieldVal}>{asset.apy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Control Bar (Buscador y Filtros) */}
      <div className={styles.controlBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}><Search size={18} /></span>
          <input 
            type="text" 
            placeholder="Buscar parcela por nombre o ubicación..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterTabs}>
          {(['Todos', 'Arizona', 'Utah', 'Nevada'] as const).map(filter => (
            <button 
              key={filter} 
              className={`${styles.filterBtn} ${activeFilter === filter ? styles.activeFilter : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Catálogo de Propiedades */}
      <div className={styles.grid}>
        {filteredAssets.map(asset => {
          const left = getFractionsLeft(asset);
          const percentSold = (asset.soldFractions / asset.totalFractions) * 100;
          const userBalance = balanceData ? parseFloat(formatEther(balanceData as bigint)) : 0;
          const userHasFunds = userBalance >= asset.priceLmt;

          return (
            <div key={asset.id} className={styles.card}>
              <div className={styles.cardImage}>
                <Image 
                  src={asset.image} 
                  alt={asset.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.img}
                />
                <span className={styles.apyTag}>{asset.apy}% APY</span>
                <span className={styles.regionTag}>{asset.state}</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.titleArea}>
                  <h3>{asset.name}</h3>
                  <div className={styles.location}>
                    <MapPin size={14} />
                    <span>{asset.location}</span>
                  </div>
                </div>

                <div className={styles.statsRow}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Área Total</span>
                    <span className={styles.statValue}>{asset.area}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Val. Fracción</span>
                    <span className={styles.statValue}>${asset.priceUsd} <span className={styles.statLabel}>USD</span></span>
                  </div>
                </div>

                {/* Barra de progreso de suministro */}
                <div className={styles.progressSection}>
                  <div className={styles.progressLabel}>
                    <span>Progreso de Financiación</span>
                    <span>{percentSold.toFixed(0)}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${percentSold}%` }} />
                  </div>
                  <div className={styles.progressLabel} style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                    <span>{asset.soldFractions.toLocaleString()} vendidas</span>
                    <span>{left.toLocaleString()} restantes</span>
                  </div>
                </div>

                {/* Fila de Acción */}
                <div className={styles.actionRow}>
                  <div className={styles.priceWrapper}>
                    <span className={styles.statLabel}>Precio</span>
                    <span className={styles.priceLmt}>{asset.priceLmt} LMT</span>
                  </div>
                  <button 
                    className={`${styles.buyBtn} ${left === 0 ? styles.noFractions : ''}`}
                    disabled={left === 0 || !userHasFunds}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowBuyModal(true);
                    }}
                  >
                    {left === 0 ? 'Agotado' : !userHasFunds ? 'Saldo Insuficiente' : 'Invertir Ahora'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Compra e Integración Web3 */}
      {showBuyModal && selectedAsset && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button 
              className={styles.closeBtn}
              onClick={() => {
                setShowBuyModal(false);
                setSelectedAsset(null);
              }}
              disabled={isTxWaiting || isTxPending}
            >
              ✕
            </button>

            {!isTxPending && !isTxWaiting && !isTxSuccess ? (
              <>
                <h2>Confirmar Inversión RWA</h2>
                <p className={styles.modalSub}>Estás a punto de transferir LMT on-chain para adquirir 1 fracción legal de esta parcela.</p>
                
                <div className={styles.modalGrid}>
                  <div>
                    <span className={styles.modalLabel}>Propiedad</span>
                    <div className={styles.modalVal}>{selectedAsset.name}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span className={styles.modalLabel}>Ubicación</span>
                      <div className={styles.modalVal}>{selectedAsset.location}</div>
                    </div>
                    <div>
                      <span className={styles.modalLabel}>Rendimiento APY</span>
                      <div className={styles.modalVal} style={{ color: 'var(--primary)' }}>{selectedAsset.apy}%</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span className={styles.modalLabel}>Precio de Fracción</span>
                      <div className={styles.modalVal} style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{selectedAsset.priceLmt} LMT</div>
                    </div>
                    <div>
                      <span className={styles.modalLabel}>Equivalencia</span>
                      <div className={styles.modalVal}>${selectedAsset.priceUsd} USD</div>
                    </div>
                  </div>
                </div>

                <button 
                  className={styles.confirmBtn}
                  onClick={handleBuyConfirm}
                >
                  Confirmar y Firmar en Wallet
                </button>
              </>
            ) : (isTxPending || isTxWaiting) ? (
              <div className={styles.modalStatus}>
                <div className={styles.spinner} />
                <h2>Procesando Transacción</h2>
                <p className={styles.modalSub}>
                  {isTxPending ? 'Firma la transacción de transferencia en tu Trust Wallet...' : 'Confirmando transacción en la blockchain de Base...'}
                </p>
                {txHash && (
                  <a 
                    href={`https://basescan.org/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.explorerLink}
                  >
                    Ver en Basescan <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : isTxSuccess ? (
              <div className={styles.modalStatus}>
                <div className={styles.successIcon}>✓</div>
                <h2>¡Fracción Adquirida con Éxito!</h2>
                <p className={styles.modalSub}>
                  Has invertido {selectedAsset.priceLmt} LMT de forma exitosa. Tu fracción de **{selectedAsset.name}** ya está respaldada y acumulando rendimientos del **{selectedAsset.apy}% APY** en tiempo real.
                </p>
                {txHash && (
                  <a 
                    href={`https://basescan.org/tx/${txHash}`} 
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
                    setShowBuyModal(false);
                    setSelectedAsset(null);
                  }}
                >
                  Cerrar e Ir a Mi Portafolio
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
