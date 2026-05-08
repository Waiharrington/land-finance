'use client';

import React from 'react';
import styles from './reserve.module.css';
import Image from 'next/image';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { 
  LAND_TOKEN_ADDRESS, 
  LAND_TOKEN_ABI 
} from '@/constants/contracts';

export default function ReserveDashboard() {
  // En una app real, leeríamos el total supply del contrato LMT
  const { data: totalSupply } = useReadContract({
    address: LAND_TOKEN_ADDRESS,
    abi: LAND_TOKEN_ABI,
    functionName: 'totalSupply',
  });

  const reserveAssets = [
    {
      id: 1,
      name: "Arizona Interstate Hub",
      location: "Intersección I-10 & SR-87, Eloy, AZ",
      area: "42 Acres",
      valuation: "2,450,000",
      useCase: "Logística & Vending",
      status: "Adquirido",
      image: "/land1.png",
      coordinates: "32.7906° N, 111.5714° W"
    },
    {
      id: 2,
      name: "Utah Sky Peak Corner",
      location: "Hwy 191, Monticello, UT",
      area: "15 Acres",
      valuation: "1,120,000",
      useCase: "Turismo & Retail Autónomo",
      status: "Adquirido",
      image: "/land2.png",
      coordinates: "37.8714° N, 109.3421° W"
    },
    {
      id: 3,
      name: "New Mexico Gateway",
      location: "Ruta 66, Gallup, NM",
      area: "85 Acres",
      valuation: "4,800,000",
      useCase: "Hub de Energía & Descanso",
      status: "Bajo Auditoría",
      image: "/land3.png",
      coordinates: "35.5281° N, 108.7426° W"
    }
  ];

  const totalReserveValue = 8370000; // Valor total en USD
  const backingRatio = totalSupply ? (totalReserveValue / parseFloat(formatEther(totalSupply as bigint))) : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Reserva de Activos Reales</h1>
        <p>Transparencia total: Cada token LMT está respaldado por tierras estratégicas en EE. UU.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Valor Total Reserva</span>
          <span className={styles.statValue}>${totalReserveValue.toLocaleString()}</span>
          <span className={styles.backingStatus}>Verificado por Auditoría</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Suministro LMT</span>
          <span className={styles.statValue}>
            {totalSupply ? parseFloat(formatEther(totalSupply as bigint)).toLocaleString() : '829,000,000'}
          </span>
          <span className={styles.backingStatus}>Contrato Verificado</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Respaldo por Token</span>
          <span className={styles.statValue}>
            {backingRatio > 0 ? `$${backingRatio.toFixed(4)}` : '$0.0101'}
          </span>
          <span className={styles.backingStatus}>Asset-Backed Ratio</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Superficie Total</span>
          <span className={styles.statValue}>142 Acres</span>
          <span className={styles.backingStatus}>Zona de Alta Plusvalía</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.content}>
          <div className={styles.sectionTitle}>
             📦 Portafolio de Propiedades
          </div>
          <div className={styles.landGrid}>
            {reserveAssets.map(asset => (
              <div key={asset.id} className={styles.landCard}>
                <div className={styles.landImage}>
                  <Image 
                    src={asset.image} 
                    alt={asset.name} 
                    fill
                    className={styles.img} 
                  />
                  <span className={styles.statusTag}>{asset.status}</span>
                </div>
                <div className={styles.landContent}>
                  <h3>{asset.name}</h3>
                  <span className={styles.location}>{asset.location}</span>
                  <div className={styles.landMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Área</span>
                      <span className={styles.metaValue}>{asset.area}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Valoración</span>
                      <span className={styles.metaValue}>${asset.valuation}</span>
                    </div>
                  </div>
                  <div className={styles.landMeta} style={{ border: 'none', marginTop: '10px' }}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Coordenadas</span>
                      <span className={styles.metaValue} style={{ fontSize: '0.7rem' }}>{asset.coordinates}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Uso Principal</span>
                      <span className={styles.metaValue}>{asset.useCase}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <div className={styles.transparencyCard}>
            <h3>Historial de Transparencia</h3>
            <div className={styles.logList}>
              <div className={styles.logItem}>
                <div className={styles.logIcon}>✅</div>
                <div className={styles.logText}>
                  <p>Nueva valoración: Arizona Interstate Hub</p>
                  <span>Hace 2 días • Auditoría Externa</span>
                </div>
              </div>
              <div className={styles.logItem}>
                <div className={styles.logIcon}>🏦</div>
                <div className={styles.logText}>
                  <p>LMT Mantenimiento de Reserva</p>
                  <span>Hace 1 semana • On-chain proof</span>
                </div>
              </div>
              <div className={styles.logItem}>
                <div className={styles.logIcon}>📍</div>
                <div className={styles.logText}>
                  <p>Adquisición: Utah Sky Peak Corner</p>
                  <span>Hace 1 mes • Registro Público</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.transparencyCard} style={{ background: 'rgba(52, 211, 153, 0.05)' }}>
            <h3>Próximos Pasos</h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
              Estamos evaluando terrenos en Texas para expandir la red de "Vending Automated Hubs". La meta es llegar a $50M en activos para finales de Q4.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
