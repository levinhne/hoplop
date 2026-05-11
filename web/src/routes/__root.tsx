import {
  HeadContent,
  createRootRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Menu, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reunionAccessStorageKey } from "@/lib/pocketbase";

const defaultReunionAccessCode = "31/05";
const configuredReunionAccessCode =
  import.meta.env.VITE_REUNION_ACCESS_CODE?.trim() || defaultReunionAccessCode;
const reunionAccessOptions = ["12/05", "25/05", "31/05", "08/06"];

export const Route = createRootRoute({
  head: () => ({
    meta: seo(),
  }),
  component: RootComponent,
});

function RootComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isAccessAccepted, setIsAccessAccepted] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(reunionAccessStorageKey);
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isHomePage = pathname === "/";
  const headerProgress = isHomePage && !isMenuOpen ? scrollProgress : 1;
  const isHeaderTransparent =
    isHomePage && headerProgress < 0.55 && !isMenuOpen;
  const headerStyle = {
    "--nav-bg-opacity": 0.9 * headerProgress,
    "--nav-border-opacity": 0.1 * headerProgress,
    "--nav-shadow-opacity": 0.08 * headerProgress,
    "--nav-blur": `${14 * headerProgress}px`,
  } as CSSProperties;

  // Close menu on navigation
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const updateScrollState = () => {
      setScrollProgress(Math.min(window.scrollY / 140, 1));
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  return (
    <div className="flex flex-col min-h-screen">
      <DocumentHead />
      <header
        className={cn(
          "site-header fixed top-0 z-50 w-full border-b",
          isHomePage && "site-header-home"
        )}
        style={headerStyle}
      >
        <div className="section-container">
          <div
            className={cn(
              "flex items-center justify-between transition-[height] duration-300",
              isHeaderTransparent ? "h-24" : "h-20"
            )}
          >
            {/* Logo area */}
            <Link
              to="/"
              onClick={closeMenu}
              className="group flex items-center gap-3"
            >
              <div
                className={cn(
                  "flex flex-col border-l-[3px] py-0.5 pl-3 transition-all group-hover:scale-[1.02]",
                  isHeaderTransparent
                    ? "border-reunion-gold"
                    : "border-reunion-forest"
                )}
              >
                <span
                  className={cn(
                    "font-serif text-lg md:text-2xl font-bold leading-none tracking-tighter transition-colors",
                    isHeaderTransparent ? "text-white" : "text-reunion-ink"
                  )}
                >
                  GIAO LỘ{" "}
                  <span
                    className={
                      isHeaderTransparent
                        ? "text-reunion-gold"
                        : "text-reunion-forest"
                    }
                  >
                    KHỐI 9
                  </span>
                </span>
                <span
                  className={cn(
                    "font-hand text-sm md:text-lg leading-none mt-0.5 transition-colors",
                    isHeaderTransparent
                      ? "text-white/80"
                      : "text-reunion-gold opacity-80"
                  )}
                >
                  Nơi những con đường riêng gặp lại
                </span>
              </div>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              <NavLink to="/members" inverted={isHeaderTransparent}>
                Bạn bè
              </NavLink>
              <NavLink to="/teachers" inverted={isHeaderTransparent}>
                Thầy Cô
              </NavLink>
              <NavLink to="/gallery" inverted={isHeaderTransparent}>
                Kỷ niệm
              </NavLink>
              <NavLink to="/avatar" inverted={isHeaderTransparent}>
                Tạo avatar
              </NavLink>
              <NavLink to="/feelings" inverted={isHeaderTransparent}>
                Lưu bút
              </NavLink>
            </nav>

            {/* Action Area */}
            <div className="flex items-center gap-4 md:gap-6">
              <Link
                to="/rsvp"
                className={cn(
                  "hidden sm:inline-flex items-center justify-center border-2 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95",
                  isHeaderTransparent
                    ? "border-white/80 text-white hover:border-white hover:bg-white hover:text-reunion-forest"
                    : "border-reunion-forest text-reunion-forest hover:bg-reunion-forest hover:text-white"
                )}
              >
                Tham gia
              </Link>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "inline-flex rounded-md p-2 transition-colors lg:hidden",
                  isHeaderTransparent
                    ? "text-white hover:bg-white/10"
                    : "text-reunion-forest hover:bg-reunion-forest/5"
                )}
              >
                {isMenuOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay — outside <header> to avoid backdrop-filter stacking context */}
      <div
        className={cn(
          "fixed inset-0 top-20 z-40 bg-reunion-paper lg:hidden transition-all duration-300 ease-in-out",
          isMenuOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full pointer-events-none"
        )}
      >
        <nav className="flex flex-col p-8 gap-8">
          <MobileNavLink to="/members" onClick={closeMenu}>
            Bạn bè
          </MobileNavLink>
          <MobileNavLink to="/teachers" onClick={closeMenu}>
            Thầy Cô
          </MobileNavLink>
          <MobileNavLink to="/gallery" onClick={closeMenu}>
            Kỷ niệm
          </MobileNavLink>
          <MobileNavLink to="/avatar" onClick={closeMenu}>
            Tạo avatar
          </MobileNavLink>
          <MobileNavLink to="/feelings" onClick={closeMenu}>
            Lưu bút
          </MobileNavLink>
          <Link
            to="/rsvp"
            onClick={closeMenu}
            className="mt-4 flex h-14 items-center justify-center bg-reunion-forest text-white text-xs font-bold uppercase tracking-[0.2em]"
          >
            Tham gia ngay
          </Link>
        </nav>
      </div>

      <main
        className={cn("flex-1 overflow-hidden", isHomePage ? "pt-0" : "pt-20")}
      >
        <div key={pathname} className="page-transition">
          <Outlet />
        </div>
      </main>

      <footer className="bg-reunion-forest text-reunion-paper py-12 md:py-14 relative overflow-hidden">
        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-bold italic">
                Giao Lộ Khối 9 (2002-2006)
              </h3>
              <p className="font-serif text-reunion-paper/70 leading-relaxed italic text-sm md:text-base">
                "Nơi những con đường riêng của mỗi người gặp lại nhau."
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs text-reunion-gold">
                Liên kết
              </h4>
              <Link
                to="/members"
                className="text-reunion-paper/60 hover:text-reunion-paper transition-colors text-sm"
              >
                Danh sách thành viên
              </Link>
              <Link
                to="/teachers"
                className="text-reunion-paper/60 hover:text-reunion-paper transition-colors text-sm"
              >
                Tri ân Thầy Cô
              </Link>
              <Link
                to="/gallery"
                className="text-reunion-paper/60 hover:text-reunion-paper transition-colors text-sm"
              >
                Thư viện ảnh
              </Link>
              <Link
                to="/avatar"
                className="text-reunion-paper/60 hover:text-reunion-paper transition-colors text-sm"
              >
                Tạo avatar
              </Link>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold uppercase tracking-widest text-xs text-reunion-gold">
                Gặp lại nhau
              </h4>
              <p className="text-sm text-reunion-paper/60">
                Cùng nhau viết tiếp những chương mới của tình bạn.
              </p>
              <div className="font-hand text-2xl text-reunion-gold">
                Hẹn gặp bạn nhé!
              </div>
            </div>
          </div>
          <div className="mt-10 md:mt-12 pt-6 border-t border-reunion-paper/10 text-center text-[10px] md:text-xs tracking-widest text-reunion-paper/40 px-4">
            © 2026 GIAO LỘ KHỐI 9 (2002-2006). TẤT CẢ VÌ KỶ NIỆM.
          </div>
        </div>
      </footer>
      <Toaster />
      <ReunionAccessDialog
        open={isAccessDialogOpen}
        error={accessError}
        isAccepted={isAccessAccepted}
        selectedValue={accessCode}
        onSelect={(value) => {
          setAccessCode(value);
          setIsAccessAccepted(false);
          if (!isValidReunionAccessCode(value)) {
            setAccessError(
              "Ngày hội ngộ chưa đúng rồi. Hãy chọn lại một ngày khác nhé."
            );
            return;
          }

          setAccessError("");
          setIsAccessAccepted(true);
          window.localStorage.setItem(reunionAccessStorageKey, value);
          window.setTimeout(() => {
            setIsAccessDialogOpen(false);
          }, 3500);
        }}
      />
    </div>
  );
}

function DocumentHead() {
  if (typeof document === "undefined") return null;

  return createPortal(<HeadContent />, document.head);
}

function NavLink({
  to,
  inverted,
  children,
}: {
  to: string;
  inverted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative py-0.5 text-[11px] font-bold uppercase tracking-[0.25em] transition-colors",
        inverted
          ? "text-white/75 hover:text-white [&.active]:text-white"
          : "text-reunion-ink/60 hover:text-reunion-forest [&.active]:text-reunion-forest"
      )}
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-reunion-gold transition-all duration-300 group-hover:w-full group-[.active]:w-full" />
    </Link>
  );
}

function MobileNavLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="text-xl font-serif font-bold text-reunion-ink/80 hover:text-reunion-forest active:text-reunion-forest py-2 border-b border-reunion-gold/5"
    >
      {children}
    </Link>
  );
}

function ReunionAccessDialog({
  open,
  error,
  isAccepted,
  selectedValue,
  onSelect,
}: {
  open: boolean;
  error: string;
  isAccepted: boolean;
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        hideCloseButton
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="max-w-[calc(100vw-2rem)] rounded-lg border-reunion-gold/20 bg-reunion-paper p-5 sm:max-w-md sm:p-6"
      >
        <DialogHeader className="space-y-3 text-left">
          <span className="eyebrow mb-0">Giao Lộ Khối 9</span>
          <DialogTitle className="font-serif text-2xl font-bold leading-tight text-reunion-ink md:text-3xl">
            Kính chào Thầy Cô và các Bạn niên khóa 2002-2006
          </DialogTitle>
          <DialogDescription className="font-serif text-sm italic leading-relaxed text-reunion-sepia md:text-base">
            Đây là không gian kỷ niệm dành cho Thầy Cô và các Bạn Khối 9, Trường
            THCS Yên Đồng, niên khóa 2002-2006. Hãy chọn ngày hội ngộ để cùng
            trở lại những năm tháng thân thương.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-reunion-gold">
              Ngày hội ngộ
            </div>
            <div className="grid grid-cols-2 gap-3">
              {reunionAccessOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelect(option)}
                  disabled={isAccepted}
                  className={cn(
                    "h-12 rounded-md border bg-white text-base font-bold tracking-[0.14em] text-reunion-ink transition duration-300 active:scale-[0.98] disabled:pointer-events-none",
                    isAccepted && selectedValue === option
                      ? "scale-[1.03] border-reunion-forest bg-reunion-forest text-white shadow-lg shadow-reunion-forest/20 ring-4 ring-reunion-gold/20"
                      : selectedValue === option
                      ? "border-reunion-forest ring-2 ring-reunion-forest/15"
                      : "border-slate-200 hover:border-reunion-gold hover:text-reunion-forest"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            {isAccepted && (
              <p className="mt-3 rounded-md border border-reunion-gold/20 bg-white/70 px-4 py-3 text-sm font-medium leading-relaxed text-reunion-forest">
                Đúng ngày hẹn rồi. Mời Thầy Cô và các Bạn cùng bước vào không
                gian kỷ niệm.
              </p>
            )}
            {error && (
              <p className="mt-3 text-sm font-medium leading-relaxed text-reunion-sepia">
                {error}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isValidReunionAccessCode(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  if (configuredReunionAccessCode && value !== configuredReunionAccessCode)
    return false;

  const day = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) return false;

  const daysInMonth = new Date(2026, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}
