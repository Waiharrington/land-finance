'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para acortar la dirección de la wallet
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.emerald}>LAND</span> Finance
        </Link>
        
        {/* Hamburger Menu Icon */}
        <button className={styles.hamburger} onClick={toggleMenu} aria-label="Menu">
          <div className={`${styles.line} ${isMenuOpen ? styles.lineOpen : ''}`}></div>
          <div className={`${styles.line} ${isMenuOpen ? styles.lineOpen : ''}`}></div>
          <div className={`${styles.line} ${isMenuOpen ? styles.lineOpen : ''}`}></div>
        </button>

        <div className={`${styles.links} ${isMenuOpen ? styles.linksOpen : ''}`}>
          <Link href="/dashboard" className={styles.link} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
          <Link href="/marketplace" className={styles.link} onClick={() => setIsMenuOpen(false)}>Mercado</Link>
          <Link href="/loans" className={styles.link} onClick={() => setIsMenuOpen(false)}>Préstamos</Link>
          <Link href="/reserve" className={styles.link} onClick={() => setIsMenuOpen(false)}>Reserva</Link>
          
          {/* Mobile Actions (inside menu) */}
          <div className={styles.mobileActions}>
            {!authenticated ? (
              <button className={styles.mobileLoginBtn} onClick={() => { login(); setIsMenuOpen(false); }}>
                Iniciar Sesión
              </button>
            ) : (
              <div className={styles.userSectionMobile}>
                <span className={styles.address}>
                  {user?.wallet?.address ? shortenAddress(user.wallet.address) : 'Conectado'}
                </span>
                <button className={styles.logoutBtn} onClick={() => { logout(); setIsMenuOpen(false); }}>
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {!authenticated ? (
            <button className={styles.button} onClick={login}>
              Iniciar Sesión
            </button>
          ) : (
            <div className={styles.userSection}>
              <span className={styles.address}>
                {user?.wallet?.address ? shortenAddress(user.wallet.address) : 'Conectado'}
              </span>
              <button className={styles.logoutBtn} onClick={logout}>
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
