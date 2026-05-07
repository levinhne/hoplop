package web

import "embed"

// DistDir embeds the static files from the React build.
//
//go:embed all:dist
var DistDir embed.FS
