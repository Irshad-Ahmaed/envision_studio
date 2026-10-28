"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, Menu, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 760px)");
    const sync = () => {
      setIsMobile(breakpoint.matches);
      if (!breakpoint.matches) setMobileOpen(false);
    };
    sync();
    breakpoint.addEventListener("change", sync);
    return () => breakpoint.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);
  const links = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }, { href: "/projects", label: "Projects", icon: FolderKanban }];
  const navigationHidden = isMobile && !mobileOpen;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Workspace" aria-hidden={navigationHidden} inert={navigationHidden}>
      <Link className="brand" href="/" onClick={() => { setMobileOpen(false); if (isMobile) menuButton.current?.focus(); }}><span className="brand-mark">e</span><span>envision<span className="brand-light">studio</span></span></Link>
      <div className="workspace-label">WORKSPACE</div>
      <nav id="main-navigation" className="side-nav" aria-label="Main navigation">{links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "nav-link-active" : ""}`} onClick={() => { setMobileOpen(false); if (isMobile) menuButton.current?.focus(); }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>;
      })}</nav>
      <div className="sidebar-bottom"><div className="sidebar-divider"/><div className="workspace-card"><span className="workspace-avatar">E</span><span><strong>Envision Studio</strong><small>Agency workspace</small></span><span className="workspace-dot"/></div><span className="sidebar-version">PROJECT WORKSPACE <span>v1.0</span></span></div>
    </aside>
    {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => { setMobileOpen(false); menuButton.current?.focus(); }} />}
    <main className="main-shell"><header className="mobile-header"><button ref={menuButton} className="icon-button" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="main-navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button><Link className="brand" href="/"><span className="brand-mark">e</span><span>envision<span className="brand-light">studio</span></span></Link>{pathname === "/" && <button className="mobile-add" aria-label="Create a project" onClick={() => window.dispatchEvent(new Event("open-new-project"))}><Plus size={18}/></button>}</header><div aria-hidden={isMobile && mobileOpen} inert={isMobile && mobileOpen}>{children}</div></main>
  </div>;
}
