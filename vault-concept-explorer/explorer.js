/* Vault Concept Explorer logic. UMD: the same file runs in the browser demo
   and under Node for the headless tests (test.js). Pure functions first,
   DOM wiring second. No data is invented here; all rows come from
   concepts.json, which is generated from Master-Data-List.json. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.VaultExplorer = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Runtime bucket rule, stated on the page: REPO EXISTS anywhere in the
     census runtime string means repo evidenced; exact NO REPO means none;
     exact UNKNOWN means unknown; anything else is a described runtime. */
  function runtimeBucket(c) {
    var r = (c.runtime || "").toUpperCase();
    if (r.indexOf("REPO EXISTS") !== -1) return "repo";
    if (r === "NO REPO") return "norepo";
    if (r === "UNKNOWN") return "unknown";
    return "other";
  }

  function haystack(c) {
    return [
      c.id, c.name, (c.aliases || []).join(" "), c.section,
      c.classification, c.runtime, c.owner, c.vault_path,
    ].join(" ").toLowerCase();
  }

  /* filters: { q, section, classification, runtime, collisionOnly } */
  function filterConcepts(concepts, filters) {
    var f = filters || {};
    var q = (f.q || "").trim().toLowerCase();
    var cls = (f.classification || "").trim().toLowerCase();
    return concepts.filter(function (c) {
      if (q && haystack(c).indexOf(q) === -1) return false;
      if (f.section && f.section !== "all" && c.section !== f.section) return false;
      if (cls && c.classification.toLowerCase().indexOf(cls) === -1) return false;
      if (f.runtime && f.runtime !== "all" && runtimeBucket(c) !== f.runtime) return false;
      if (f.collisionOnly && !c.collision) return false;
      return true;
    });
  }

  /* sort: "name-asc" | "name-desc" | "id-asc" | "id-desc" */
  function sortConcepts(concepts, sort) {
    var list = concepts.slice();
    var byName = function (a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    };
    var byId = function (a, b) {
      return a.id.localeCompare(b.id);
    };
    if (sort === "name-desc") list.sort(function (a, b) { return byName(b, a); });
    else if (sort === "id-asc") list.sort(byId);
    else if (sort === "id-desc") list.sort(function (a, b) { return byId(b, a); });
    else list.sort(byName);
    return list;
  }

  function countBySection(concepts) {
    var out = {};
    concepts.forEach(function (c) {
      out[c.section] = (out[c.section] || 0) + 1;
    });
    return out;
  }

  function countBySource(concepts) {
    var out = {};
    concepts.forEach(function (c) {
      var s = c.source || "UNKNOWN";
      out[s] = (out[s] || 0) + 1;
    });
    return out;
  }

  /* Browser wiring. Expects the element ids used in index.html. */
  function init(concepts) {
    var $ = function (id) { return document.getElementById(id); };
    var els = {
      q: $("q"), section: $("section"), classification: $("classification"),
      runtime: $("runtime"), collision: $("collision"), sort: $("sort"),
      count: $("count"), results: $("results"), detail: $("detail"),
      clear: $("clear"),
    };

    function currentFilters() {
      return {
        q: els.q.value,
        section: els.section.value,
        classification: els.classification.value,
        runtime: els.runtime.value,
        collisionOnly: els.collision.checked,
      };
    }

    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function rowHtml(c) {
      return '<tr data-id="' + esc(c.id) + '" tabindex="0">' +
        '<td class="mono">' + esc(c.id) + '</td>' +
        '<td><strong>' + esc(c.name) + '</strong>' +
        (c.collision ? ' <span class="tag tag-collision">COLLISION</span>' : "") +
        (c.aliases.length ? '<br><span class="alias">aka ' + esc(c.aliases.join("; ")) + '</span>' : "") +
        '</td>' +
        '<td>' + esc(c.section) + '</td>' +
        '<td>' + esc(c.classification) + '</td>' +
        '<td>' + esc(c.runtime) + '</td>' +
        '<td><span class="tag tag-census">' + esc(c.source) + '</span></td>' +
        '</tr>';
    }

    function render() {
      var filtered = sortConcepts(filterConcepts(concepts, currentFilters()), els.sort.value);
      els.count.textContent = filtered.length + " of " + concepts.length + " concepts shown";
      if (!filtered.length) {
        els.results.innerHTML = '<p class="empty">No concepts match. Clear the search or loosen a filter.</p>';
        return;
      }
      var html = '<table><thead><tr><th>ID</th><th>Name</th><th>Section</th>' +
        '<th>Classification</th><th>Runtime</th><th>Source</th></tr></thead><tbody>';
      filtered.forEach(function (c) { html += rowHtml(c); });
      html += '</tbody></table>';
      els.results.innerHTML = html;
    }

    function showDetail(c) {
      var d = els.detail;
      d.innerHTML =
        '<h2>' + esc(c.name) + ' <span class="mono muted">' + esc(c.id) + '</span></h2>' +
        '<dl>' +
        '<dt>Section</dt><dd>' + esc(c.section) + '</dd>' +
        '<dt>Classification (final, Chapter 36 / census)</dt><dd>' + esc(c.classification) + '</dd>' +
        '<dt>Runtime (census)</dt><dd>' + esc(c.runtime) + '</dd>' +
        '<dt>Current owner (census)</dt><dd>' + esc(c.owner) + '</dd>' +
        '<dt>Aliases</dt><dd>' + (c.aliases.length ? esc(c.aliases.join("; ")) : "none recorded") + '</dd>' +
        '<dt>Vault source file</dt><dd class="mono">' + esc(c.vault_path) + '</dd>' +
        '<dt>Evidence standard / source type</dt><dd>' + esc(c.source_type) + '</dd>' +
        '<dt>Source references</dt><dd>' + (c.source_refs ? esc(c.source_refs) : "none recorded") + '</dd>' +
        '<dt>Recorded conflicts</dt><dd>' + (c.conflicts ? esc(c.conflicts) : "none recorded") + '</dd>' +
        '<dt>Collision note</dt><dd>' + (c.collision ? "Yes. A court-verdict collision note exists for this name (00-Collisions/, verdict recorded 2026-11-09)." : "No collision note.") + '</dd>' +
        '<dt>Row sourcing</dt><dd><span class="tag tag-census">' + esc(c.source) + '</span> Master-Data-List.json, census row ' + esc(c.id) + '</dd>' +
        '</dl>';
      d.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    els.results.addEventListener("click", function (ev) {
      var tr = ev.target.closest("tr[data-id]");
      if (!tr) return;
      var found = null;
      concepts.forEach(function (c) { if (c.id === tr.getAttribute("data-id")) found = c; });
      if (found) showDetail(found);
    });
    els.results.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      var tr = ev.target.closest("tr[data-id]");
      if (!tr) return;
      var found = null;
      concepts.forEach(function (c) { if (c.id === tr.getAttribute("data-id")) found = c; });
      if (found) showDetail(found);
    });

    ["q", "classification"].forEach(function (id) {
      els[id].addEventListener("input", render);
    });
    ["section", "runtime", "sort"].forEach(function (id) {
      els[id].addEventListener("change", render);
    });
    els.collision.addEventListener("change", render);
    els.clear.addEventListener("click", function () {
      els.q.value = "";
      els.section.value = "all";
      els.classification.value = "";
      els.runtime.value = "all";
      els.collision.checked = false;
      els.sort.value = "name-asc";
      render();
    });

    render();
    return { render: render, showDetail: showDetail };
  }

  return {
    filterConcepts: filterConcepts,
    sortConcepts: sortConcepts,
    runtimeBucket: runtimeBucket,
    countBySection: countBySection,
    countBySource: countBySource,
    init: init,
  };
});
