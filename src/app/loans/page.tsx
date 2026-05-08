import React from 'react';
import Link from 'next/link';
import styles from './loans.module.css';

export default function Loans() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Sistema de Préstamos RWA</h1>
        <p>Liquidez inmediata respaldada por tus activos de tierra.</p>
      </header>

      <div className={styles.bridgeCard}>
        <div className={styles.infoSection}>
          <div className={styles.statBox}>
            <span className={styles.label}>Tasa de Interés</span>
            <span className={styles.value}>5% APY</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.label}>Límite de Préstamo (LTV)</span>
            <span className={styles.value}>80%</span>
          </div>
        </div>

        <div className={styles.descSection}>
          <h2>¿Cómo funciona?</h2>
          <ul>
            <li>1. Tokenizas tu tierra física en nuestro sistema.</li>
            <li>2. Usas tus tierras como colateral en un Smart Contract seguro.</li>
            <li>3. Recibes hasta el 80% del valor tasado de forma instantánea.</li>
            <li>4. Pagas cuando quieras. Sin plazos fijos, sin revisión crediticia.</li>
          </ul>
          
          <Link href="/dashboard" className={styles.primaryBtn}>
            Gestionar mis Préstamos
          </Link>
        </div>
      </div>
    </div>
  );
}
