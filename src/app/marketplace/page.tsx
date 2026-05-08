import React from 'react';
import Link from 'next/link';
import styles from './marketplace.module.css';

export default function Marketplace() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Mercado de Tierras RWA</h1>
        <p>Explora el catálogo de tierras tokenizadas disponibles para inversión.</p>
      </header>

      <div className={styles.emptyState}>
        <div className={styles.icon}>🛒</div>
        <h2>Catálogo de Venta Abierta Próximamente</h2>
        <p>
          Las primeras parcelas premium en Utah han sido asignadas a inversores pioneros. 
          En la próxima fase, abriremos el mercado secundario para comprar y vender LAND de forma libre.
        </p>
        <Link href="/dashboard" className={styles.btn}>
          Ir a Mi Dashboard
        </Link>
      </div>
    </div>
  );
}
