import styles from './page.module.css';
import Image from 'next/image';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Background decoration */}
      <div className={styles.glow} />
      
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            La Nueva Era de <br />
            <span className={styles.accent}>Inversión Inmobiliaria</span>
          </h1>
          <p className={styles.description}>
            Accede a préstamos con garantía hipotecaria sobre tierras reales en Utah. 
            Seguro, transparente y respaldado por activos reales en la blockchain.
          </p>
          <div className={styles.cta}>
            <button className={styles.primaryBtn}>Empezar Ahora</button>
            <button className={styles.secondaryBtn}>Ver Catálogo</button>
          </div>
          
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Bloqueado</span>
              <span className={styles.statValue}>$1.2M+</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Tierra en Garantía</span>
              <span className={styles.statValue}>450 m²</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Tasa Fija</span>
              <span className={styles.statValue}>5% APY</span>
            </div>
          </div>
        </div>
        
        <div className={styles.heroImage}>
          <div className={styles.imageWrapper}>
            <Image 
              src="/land1.png" 
              alt="Tierras en Utah" 
              width={600} 
              height={400} 
              className={styles.img}
              priority
            />
            <div className={styles.imageOverlay} />
          </div>
        </div>
      </section>
      
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>¿Cómo funciona LAND Finance?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h3>1. Elige tu Parcela</h3>
            <p>Selecciona entre terrenos premium en Utah, verificados y con títulos de propiedad legales.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>2. Depósito y Garantía</h3>
            <p>Tus activos reales respaldan tu token LAND en la red Base Sepolia.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>3. Préstamo al 5%</h3>
            <p>Obtén liquidez inmediata con una de las tasas más competitivas del mercado.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
