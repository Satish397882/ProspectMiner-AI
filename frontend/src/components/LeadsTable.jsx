import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SCORE_CONFIG = {
  hot: {
    label: "🔥 Hot",
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  warm: {
    label: "🌤 Warm",
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  cold: {
    label: "❄️ Cold",
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
};

const SOCIAL_ICONS = {
  facebook: { icon: "📘", label: "Facebook" },
  instagram: { icon: "📷", label: "Instagram" },
  linkedin: { icon: "💼", label: "LinkedIn" },
  twitter: { icon: "🐦", label: "Twitter/X" },
  youtube: { icon: "▶️", label: "YouTube" },
};

// ── Score Badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const cfg = SCORE_CONFIG[score] || SCORE_CONFIG.warm;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Rating Stars ──────────────────────────────────────────────────────────────
function RatingStars({ rating }) {
  if (!rating) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-yellow-400 text-xs">★</span>
      <span className="text-gray-300 text-xs font-medium">{rating}</span>
    </span>
  );
}

// ── Social Badges ─────────────────────────────────────────────────────────────
function SocialBadges({ social }) {
  if (!social || !social.platforms?.length)
    return <span className="text-gray-600 text-xs">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {social.platforms.map((p) => (
        <span
          key={p}
          title={SOCIAL_ICONS[p]?.label || p}
          className="text-sm cursor-default"
        >
          {SOCIAL_ICONS[p]?.icon || "🔗"}
        </span>
      ))}
    </div>
  );
}

// ── Enrichment Status ─────────────────────────────────────────────────────────
function EnrichBadge({ enriched, animating }) {
  if (animating) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-purple-400 animate-pulse">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping inline-block" />
        Enriching…
      </span>
    );
  }
  if (enriched) return <span className="text-xs text-green-400">✅ Done</span>;
  return <span className="text-xs text-gray-600">Pending</span>;
}

// ── Main LeadsTable ───────────────────────────────────────────────────────────
export default function LeadsTable({
  leads = [],
  loading = false,
  enrichingLeadIds = new Set(),
  onSort,
  sortBy,
  sortOrder,
}) {
  const navigate = useNavigate();
  const [expandedRow, setExpandedRow] = useState(null);

  const SortHeader = ({ field, children }) => {
    const active = sortBy === field;
    return (
      <th
        onClick={() => onSort?.(field)}
        className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
      >
        <span className="flex items-center gap-1">
          {children}
          {active ? (
            <span className="text-blue-400">
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          ) : (
            <span className="text-gray-700">↕</span>
          )}
        </span>
      </th>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-[#1a1f3a]/50 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-lg">No leads found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead className="bg-[#0f1221]/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">
              #
            </th>
            <SortHeader field="businessName">Business</SortHeader>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            <SortHeader field="category">Category</SortHeader>
            <SortHeader field="rating">Rating</SortHeader>
            <SortHeader field="leadScore">Score</SortHeader>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Social
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Enriched
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.map((lead, idx) => {
            const isExpanded = expandedRow === lead._id;
            const isEnriching = enrichingLeadIds.has(lead._id);

            return (
              <>
                <tr
                  key={lead._id}
                  className={`hover:bg-white/3 transition-colors ${isExpanded ? "bg-white/5" : ""}`}
                >
                  <td className="px-4 py-3 text-gray-600 text-xs">{idx + 1}</td>

                  {/* Business Name */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white text-sm leading-tight">
                      {lead.businessName}
                    </div>
                    {lead.address && (
                      <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[180px]">
                        {lead.address}
                      </div>
                    )}
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="block text-blue-400 hover:text-blue-300 text-xs transition-colors"
                        >
                          📞 {lead.phone}
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">No phone</span>
                      )}
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="block text-blue-400 hover:text-blue-300 text-xs transition-colors truncate max-w-[160px]"
                        >
                          ✉️ {lead.email}
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">No email</span>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-purple-400 hover:text-purple-300 text-xs transition-colors"
                        >
                          🌐 Website →
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    {lead.category ? (
                      <span className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-1 rounded-lg">
                        {lead.category}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <RatingStars rating={lead.rating} />
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3">
                    <ScoreBadge score={lead.leadScore} />
                  </td>

                  {/* Social */}
                  <td className="px-4 py-3">
                    <SocialBadges social={lead.enrichmentData?.social} />
                  </td>

                  {/* Enriched */}
                  <td className="px-4 py-3">
                    <EnrichBadge
                      enriched={lead.enriched}
                      animating={isEnriching}
                    />
                  </td>

                  {/* Expand */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : lead._id)
                      }
                      className="text-gray-600 hover:text-gray-300 transition-colors text-xs"
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </td>
                </tr>

                {/* Expanded Detail Row */}
                {isExpanded && (
                  <tr key={`${lead._id}-detail`} className="bg-[#0f1221]/80">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Crawl Info */}
                        {lead.enrichmentData?.crawl && (
                          <div className="space-y-1">
                            <p className="text-gray-400 font-semibold mb-2">
                              🌐 Website Data
                            </p>
                            {lead.enrichmentData.crawl.title && (
                              <p className="text-gray-300">
                                <span className="text-gray-500">Title:</span>{" "}
                                {lead.enrichmentData.crawl.title}
                              </p>
                            )}
                            {lead.enrichmentData.crawl.description && (
                              <p className="text-gray-400 line-clamp-2">
                                {lead.enrichmentData.crawl.description}
                              </p>
                            )}
                            {lead.enrichmentData.crawl.signals?.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {lead.enrichmentData.crawl.signals.map((s) => (
                                  <span
                                    key={s}
                                    className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-xs"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Score Reason */}
                        {lead.enrichmentData?.score && (
                          <div className="space-y-1">
                            <p className="text-gray-400 font-semibold mb-2">
                              🤖 AI Score
                            </p>
                            <ScoreBadge
                              score={lead.enrichmentData.score.score}
                            />
                            <p className="text-gray-400 mt-1">
                              {lead.enrichmentData.score.reason}
                            </p>
                            <p className="text-gray-600">
                              Confidence: {lead.enrichmentData.score.confidence}
                              %
                            </p>
                            <p className="text-gray-600">
                              Method: {lead.enrichmentData.score.method}
                            </p>
                          </div>
                        )}

                        {/* Social Full List */}
                        {lead.enrichmentData?.social?.platforms?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-gray-400 font-semibold mb-2">
                              📱 Social Media
                            </p>
                            {lead.enrichmentData.social.platforms.map((p) => (
                              <p key={p} className="text-gray-300">
                                {SOCIAL_ICONS[p]?.icon}{" "}
                                {SOCIAL_ICONS[p]?.label || p}
                              </p>
                            ))}
                            <p className="text-gray-600">
                              Social score:{" "}
                              {lead.enrichmentData.social.socialScore}/10
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
