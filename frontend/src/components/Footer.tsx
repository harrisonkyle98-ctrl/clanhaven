import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="ch-footer">
      <div className="ch-footer-accent" />
      <div className="ch-footer-inner">
        <div className="ch-footer-brand">
          <span className="ch-footer-logo">Clan Haven</span>
          <span className="ch-footer-tagline">A home for RuneScape clans.</span>
        </div>
        <nav className="ch-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/clans">Clans</Link>
          <Link to="/rankings">Rankings</Link>
          <Link to="/competitions">Competitions</Link>
          <Link to="/players">Players</Link>
        </nav>
        <p className="ch-footer-disclaimer">
          Clan Haven is a fan-made community platform and is not affiliated with Jagex.
        </p>
      </div>
    </footer>
  )
}
