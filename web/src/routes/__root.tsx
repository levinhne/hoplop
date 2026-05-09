import { HeadContent, createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from '@/components/ui/toaster'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X as CloseIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { seo } from '@/lib/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: seo(),
  }),
  component: RootComponent,
})

function RootComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  // Close menu on navigation
  const closeMenu = () => setIsMenuOpen(false)

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <div className="flex flex-col min-h-screen">
      <DocumentHead />
      <header className="fixed top-0 z-50 w-full bg-reunion-paper/90 backdrop-blur-md border-b border-reunion-gold/10">
        <div className="section-container">
          <div className="flex h-20 items-center justify-between">
            {/* Logo area */}
            <Link to="/" onClick={closeMenu} className="group flex items-center gap-3">
              <div className="flex flex-col border-l-[3px] border-reunion-forest py-0.5 pl-3 transition-transform group-hover:scale-[1.02]">
                <span className="font-serif text-lg md:text-2xl font-bold leading-none text-reunion-ink tracking-tighter">
                  GIAO LỘ <span className="text-reunion-forest">KHỐI 9</span>
                </span>
                <span className="font-hand text-reunion-gold text-sm md:text-lg leading-none mt-0.5 opacity-80">
                  Nơi những con đường riêng gặp lại
                </span>
              </div>
            </Link>
            
            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              <NavLink to="/members">Bạn bè</NavLink>
              <NavLink to="/teachers">Thầy cô</NavLink>
              <NavLink to="/gallery">Kỷ niệm</NavLink>
              <NavLink to="/feelings">Lưu bút</NavLink>
            </nav>

            {/* Action Area */}
            <div className="flex items-center gap-4 md:gap-6">
              <Link to="/rsvp" className="hidden sm:inline-flex items-center justify-center border-2 border-reunion-forest px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-reunion-forest transition-all hover:bg-reunion-forest hover:text-white active:scale-95">
                Tham gia
              </Link>
              
              {/* Mobile menu trigger */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex rounded-md p-2 text-reunion-forest transition-colors hover:bg-reunion-forest/5 lg:hidden"
              >
                {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Menu Overlay — outside <header> to avoid backdrop-filter stacking context */}
      <div className={cn(
        "fixed inset-0 top-20 z-40 bg-reunion-paper lg:hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
      )}>
        <nav className="flex flex-col p-8 gap-8">
          <MobileNavLink to="/members" onClick={closeMenu}>Bạn bè</MobileNavLink>
          <MobileNavLink to="/teachers" onClick={closeMenu}>Thầy cô</MobileNavLink>
          <MobileNavLink to="/gallery" onClick={closeMenu}>Kỷ niệm</MobileNavLink>
          <MobileNavLink to="/feelings" onClick={closeMenu}>Lưu bút</MobileNavLink>
          <Link
            to="/rsvp"
            onClick={closeMenu}
            className="mt-4 flex h-14 items-center justify-center bg-reunion-forest text-white text-xs font-bold uppercase tracking-[0.2em]"
          >
            Tham gia ngay
          </Link>
        </nav>
      </div>

      <main className="flex-1 overflow-hidden pt-20">
        <div key={pathname} className="page-transition">
          <Outlet />
        </div>
      </main>

      <footer className="bg-reunion-forest text-reunion-paper py-12 md:py-14 relative overflow-hidden">
        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-bold italic">Giao Lộ Khối 9 (2002-2006)</h3>
              <p className="font-serif text-reunion-paper/70 leading-relaxed italic text-sm md:text-base">
                "Nơi những con đường riêng của mỗi người gặp lại nhau."
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs text-reunion-gold">Liên kết</h4>
              <Link to="/members" className="text-reunion-paper/60 hover:text-reunion-paper transition-colors text-sm">Danh sách thành viên</Link>
              <Link to="/teachers" className="text-reunion-paper/60 hover:text-reunion-paper transition-colors text-sm">Tri ân thầy cô</Link>
              <Link to="/gallery" className="text-reunion-paper/60 hover:text-reunion-paper transition-colors text-sm">Thư viện ảnh</Link>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold uppercase tracking-widest text-xs text-reunion-gold">Gặp lại nhau</h4>
              <p className="text-sm text-reunion-paper/60">Cùng nhau viết tiếp những chương mới của tình bạn.</p>
              <div className="font-hand text-2xl text-reunion-gold">Hẹn gặp bạn nhé!</div>
            </div>
          </div>
          <div className="mt-10 md:mt-12 pt-6 border-t border-reunion-paper/10 text-center text-[10px] md:text-xs tracking-widest text-reunion-paper/40 px-4">
            © 2026 GIAO LỘ KHỐI 9 (2002-2006). TẤT CẢ VÌ KỶ NIỆM.
          </div>
        </div>
      </footer>
      <Toaster />
      <TanStackRouterDevtools />
    </div>
  )
}

function DocumentHead() {
  if (typeof document === 'undefined') return null

  return createPortal(<HeadContent />, document.head)
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link 
      to={to} 
      className="group relative py-0.5 text-[11px] font-bold uppercase tracking-[0.25em] text-reunion-ink/60 transition-colors hover:text-reunion-forest [&.active]:text-reunion-forest"
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-reunion-gold transition-all duration-300 group-hover:w-full group-[.active]:w-full" />
    </Link>
  )
}

function MobileNavLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="text-xl font-serif font-bold text-reunion-ink/80 hover:text-reunion-forest active:text-reunion-forest py-2 border-b border-reunion-gold/5"
    >
      {children}
    </Link>
  )
}
