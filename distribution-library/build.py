#!/usr/bin/env python3
"""Build the Neuruh distribution library: 83 HTML renders + index + MASTER-LIST.

Reads manifest.json (source of truth, do not re-inventory) and the read-only
source files under ~/workspace/distribution/. Writes everything under
~/workspace/distribution-library/.

Rules enforced here:
- No em dash is added in any generated chrome text. Titles and previews taken
  from the manifest have any em dash normalised to " - " in chrome only.
- Source body text is reproduced intact via markdown conversion, including
  em dashes in the 20 source files flagged has_em_dash. Those pages carry a
  one-line note saying so.
- Word counts come from the manifest (wc -w, counted, never estimated).
- Drafts are never presented as published.
"""
import html
import json
import os
import re
import sys

import markdown

BASE = os.path.dirname(os.path.abspath(__file__))
SRC_ROOT = os.path.join(os.path.dirname(BASE), "distribution")
MANIFEST = os.path.join(BASE, "manifest.json")
AUDIT_DATE = "2026-11-16"
LIVE_BASE = "https://neuruhai.github.io/neuruh-demos/distribution-library/"
EM_DASH = "\u2014"


def clean(text):
    """Normalise em dashes out of generated chrome text. Source body text
    is NOT passed through this function."""
    return (text or "").replace(EM_DASH, " - ")


def esc(text):
    return html.escape(clean(text), quote=True)


def status_line(item):
    """Exact status rendering per spec."""
    status = item["status"]
    if status == "published":
        return "Published on Substack, %s. %s" % (
            item.get("date") or "",
            clean(item.get("note") or ""),
        )
    if status == "ready":
        return "Ready to publish, not published. %s" % clean(item.get("note") or "")
    if item.get("type") == "book":
        return "Book manuscript, draft only, unpublished, no ISBNs."
    return "Draft on disk, unpublished."


def status_label(item):
    if item["status"] == "published":
        return "Published"
    if item["status"] == "ready":
        return "Ready"
    if item.get("type") == "book":
        return "Book draft"
    return "Draft"


def render_path(source_file):
    assert source_file.endswith(".md")
    return source_file[:-3] + ".html"


def rel_prefix(path):
    depth = path.count("/")
    return "../" * depth


PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Neuruh Distribution Library</title>
<link rel="stylesheet" href="{prefix}style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
<header class="doc-control">
  <div class="doc-control-inner">
    <div class="doc-kicker">Neuruh Distribution Library | Document control</div>
    <h1>{title}</h1>
    <dl class="meta-grid">
      <div><dt>Series</dt><dd>{series_label}</dd></div>
      <div><dt>Source file</dt><dd><code>{source_file}</code></dd></div>
      <div><dt>Word count</dt><dd>{words} words (counted)</dd></div>
      <div><dt>Status</dt><dd>{status}</dd></div>
      <div><dt>Audit date</dt><dd>{audit}</dd></div>
      <div><dt>Index</dt><dd><a href="{prefix}index.html">Back to the library index</a></dd></div>
    </dl>
    <p class="status-note">{status_line}</p>
    {emdash_note}
  </div>
</header>
<main class="article-body">
{body}
</main>
<footer class="doc-footer">
  <p>Neuruh Distribution Library. Audit date {audit}. Word counts are wc -w counts from the manifest, not estimates.</p>
  <p><a href="{prefix}index.html">Back to the library index</a></p>
</footer>
</body>
</html>
"""

INDEX_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neuruh Distribution Library | Master Index</title>
<link rel="stylesheet" href="style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
<header class="doc-control">
  <div class="doc-control-inner">
    <div class="doc-kicker">Neuruh Distribution Library | Master index</div>
    <h1>The Distribution Library</h1>
    <p class="lede">Every Neuruh distribution piece on disk, rendered and counted. Audit date 2026-11-16. Word counts are wc -w counts from the manifest, not estimates.</p>
    <div class="totals-bar">
      <span><strong>83</strong> pieces</span>
      <span><strong>129,129</strong> words</span>
      <span><strong>6</strong> published</span>
      <span><strong>3</strong> ready</span>
      <span><strong>74</strong> draft</span>
    </div>
  </div>
</header>
<main class="index-body">
  <section class="start-here">
    <h2>Start here</h2>
    <p>The 6 Substack essays in the Super-Intelligence Discussion Series are the only published set. They ran Oct 1-6, 2026, one per day in order; essay 6 is paid; site-only, no newsletter blast.</p>
    <p>The 6 LinkedIn articles are the unpublished set most likely missed. They are drafts on disk, unpublished, and ready to be read as a set.</p>
  </section>
  <section class="filters">
    <h2>Filter</h2>
    <div class="filter-row" id="series-filters">
      <button class="filter-btn active" data-filter="all" data-kind="series">All series</button>
      {series_buttons}
    </div>
    <div class="filter-row" id="status-filters">
      <button class="filter-btn active" data-filter="all" data-kind="status">All statuses</button>
      <button class="filter-btn" data-filter="published" data-kind="status">Published (6)</button>
      <button class="filter-btn" data-filter="ready" data-kind="status">Ready (3)</button>
      <button class="filter-btn" data-filter="draft" data-kind="status">Draft (74)</button>
    </div>
  </section>
  {series_sections}
  <section class="overlap">
    <h2>Overlap: same idea, distinct drafts across series</h2>
    <p>Ten topic clusters appear as distinct drafts in more than one series. These are separate pieces on the same idea, not duplicates of one file.</p>
    {cluster_list}
  </section>
  <section class="plain-list">
    <h2>Plain-text master list</h2>
    <p><a href="MASTER-LIST.md">MASTER-LIST.md</a>: one line per piece, series | title | words | status | live URL.</p>
  </section>
</main>
<footer class="doc-footer">
  <p>Neuruh Distribution Library. Audit date 2026-11-16. Word counts are wc -w counts from the manifest, not estimates.</p>
</footer>
<script>
(function () {{
  var seriesFilter = "all";
  var statusFilter = "all";
  function apply() {{
    var cards = document.querySelectorAll(".piece");
    cards.forEach(function (card) {{
      var okSeries = seriesFilter === "all" || card.dataset.series === seriesFilter;
      var okStatus = statusFilter === "all" || card.dataset.status === statusFilter;
      card.style.display = (okSeries && okStatus) ? "" : "none";
    }});
    document.querySelectorAll(".series-section").forEach(function (sec) {{
      var visible = sec.querySelectorAll(".piece:not([style*='none'])").length;
      sec.style.display = visible ? "" : "none";
    }});
  }}
  document.querySelectorAll(".filter-btn").forEach(function (btn) {{
    btn.addEventListener("click", function () {{
      var kind = btn.dataset.kind;
      document.querySelectorAll(".filter-btn[data-kind='" + kind + "']").forEach(function (b) {{
        b.classList.remove("active");
      }});
      btn.classList.add("active");
      if (kind === "series") {{ seriesFilter = btn.dataset.filter; }}
      else {{ statusFilter = btn.dataset.filter; }}
      apply();
    }});
  }});
}})();
</script>
</body>
</html>
"""


def build():
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)
    items = manifest["items"]
    assert len(items) == 83, "manifest item count is %d, expected 83" % len(items)
    total_words = sum(i["words"] for i in items)
    assert total_words == 129129, "total words %d" % total_words

    md = markdown.Markdown(
        extensions=["tables", "fenced_code", "sane_lists"],
        output_format="html5",
    )

    # Series in first-appearance order.
    series_order = []
    series_labels = {}
    for it in items:
        if it["series"] not in series_labels:
            series_order.append(it["series"])
            series_labels[it["series"]] = it["series_label"]

    written = []
    for it in items:
        src = os.path.join(SRC_ROOT, it["file"])
        with open(src, encoding="utf-8") as f:
            source = f.read()
        md.reset()
        body = md.convert(source)
        rp = render_path(it["file"])
        prefix = rel_prefix(rp)
        em_note = ""
        if it.get("has_em_dash"):
            em_note = (
                '<p class="emdash-note">Note: the source text contains '
                "em dashes; reproduced as written.</p>"
            )
        page = PAGE_TEMPLATE.format(
            title=esc(it["title"]),
            prefix=prefix,
            series_label=esc(it["series_label"]),
            source_file=esc("distribution/" + it["file"]),
            words="{:,}".format(it["words"]),
            status=esc(status_label(it)),
            audit=AUDIT_DATE,
            status_line=esc(status_line(it)),
            emdash_note=em_note,
            body=body,
        )
        assert EM_DASH not in page.split('<main class="article-body">')[0], (
            "em dash leaked into chrome: " + it["file"]
        )
        out = os.path.join(BASE, rp)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write(page)
        written.append(rp)

    # Index.
    series_buttons = "\n      ".join(
        '<button class="filter-btn" data-filter="%s" data-kind="series">%s</button>'
        % (esc(s), esc(series_labels[s])) for s in series_order
    )
    sections = []
    for s in series_order:
        group = [i for i in items if i["series"] == s]
        words = sum(i["words"] for i in group)
        cards = []
        for it in group:
            rp = render_path(it["file"])
            cards.append(
                '<article class="piece" data-series="%s" data-status="%s">\n'
                '  <h3><a href="%s">%s</a></h3>\n'
                '  <p class="piece-meta">%s words | %s | %s</p>\n'
                '  <p class="piece-preview">%s</p>\n'
                "</article>"
                % (
                    esc(s),
                    esc(it["status"]),
                    esc(rp),
                    esc(it["title"]),
                    "{:,}".format(it["words"]),
                    esc(status_label(it)),
                    esc(it["type"]),
                    esc(it["first_para"]),
                )
            )
        sections.append(
            '<section class="series-section" data-series="%s">\n'
            "  <h2>%s</h2>\n"
            '  <p class="series-count">%d pieces, %s words</p>\n'
            "%s\n"
            "</section>"
            % (
                esc(s),
                esc(series_labels[s]),
                len(group),
                "{:,}".format(words),
                "\n".join(cards),
            )
        )

    # Overlap clusters: distinct cluster names with 2+ files.
    clusters = {}
    for it in items:
        if it.get("cluster") and it.get("cluster_files"):
            files = it["cluster_files"]
            if len(files) >= 2:
                clusters[it["cluster"]] = sorted(set(files))
    assert len(clusters) == 10, "clusters: %d" % len(clusters)
    cluster_items = []
    for name in sorted(clusters):
        files = clusters[name]
        links = ", ".join(
            '<a href="%s">%s</a>' % (esc(render_path(f)), esc(f)) for f in files
        )
        cluster_items.append(
            "<li><strong>%s</strong> (%d pieces): %s</li>"
            % (esc(name), len(files), links)
        )
    cluster_list = "<ul>\n" + "\n".join(cluster_items) + "\n</ul>"

    index_html = INDEX_TEMPLATE.format(
        series_buttons=series_buttons,
        series_sections="\n".join(sections),
        cluster_list=cluster_list,
    )
    assert EM_DASH not in index_html, "em dash leaked into index"
    with open(os.path.join(BASE, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_html)

    # MASTER-LIST.md
    lines = [
        "# Neuruh Distribution Library: Master List",
        "",
        "Audit date 2026-11-16. Word counts are wc -w counts from the manifest, not estimates. One line per piece: series | title | words | status | live URL.",
        "",
        "Total: 83 pieces, 129,129 words. Published 6 / ready 3 / draft 74.",
        "",
    ]
    for it in items:
        rp = render_path(it["file"])
        lines.append(
            "%s | %s | %d | %s | %s%s"
            % (
                clean(it["series_label"]),
                clean(it["title"]),
                it["words"],
                status_label(it),
                LIVE_BASE,
                rp,
            )
        )
    master = "\n".join(lines) + "\n"
    assert EM_DASH not in master, "em dash leaked into MASTER-LIST"
    with open(os.path.join(BASE, "MASTER-LIST.md"), "w", encoding="utf-8") as f:
        f.write(master)

    print("renders written: %d" % len(written))
    print("clusters: %d" % len(clusters))
    print("index + MASTER-LIST written")


if __name__ == "__main__":
    build()
