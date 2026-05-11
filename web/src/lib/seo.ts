const SITE_NAME = "Giao Lộ Khối 9";
const DEFAULT_DESCRIPTION =
  "Không gian họp lớp để kết nối bạn bè, tri ân Thầy Cô, xem lại kỷ niệm và gửi những dòng lưu bút.";

type SeoOptions = {
  title?: string;
  description?: string;
};

export function seo({
  title,
  description = DEFAULT_DESCRIPTION,
}: SeoOptions = {}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Nơi những con đường riêng gặp lại`;

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
  ];
}
