import type { SeasonScene } from '../application/buildSeasonsGuide';
import SeasonScrollGuide from './SeasonScrollGuide';
import styles from './SeasonsLanding.module.css';

export default function SeasonsLanding({ scenes }: { scenes: SeasonScene[] }) {
  return (
    <main className={styles.page}>
      <SeasonScrollGuide scenes={scenes} />
    </main>
  );
}
