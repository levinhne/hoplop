{
  description = "Hop lop landing page (React + TanStack + PocketBase) development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    flake-utils.lib.eachSystem systems (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            go
            nodejs_22
            pocketbase
            sqlite
          ];

          shellHook = ''
            echo "--------------------------------------------------------"
            echo "  Họp Lớp Landing Page Dev Environment Loaded!"
            echo "  Stack: React + TanStack + PocketBase (Go Custom App)"
            echo "--------------------------------------------------------"
            echo "  - Run Backend:  go run cmd/server/main.go serve"
            echo "  - Run Frontend: cd web && npm run dev"
            echo "  - Admin UI:     http://127.0.0.1:8090/_/"
            echo "--------------------------------------------------------"
          '';
        };
      });
}
