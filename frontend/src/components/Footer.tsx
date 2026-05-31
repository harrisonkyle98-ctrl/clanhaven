export default function Footer() {
  return (
    <footer className="ch-footer">
      <div className="ch-footer-accent" />
      <div className="ch-footer-inner">
        <p className="ch-footer-copyright">&copy; {new Date().getFullYear()} Clan Haven</p>
      </div>
    </footer>
  )
}
