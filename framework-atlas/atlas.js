/* Framework Atlas: browser over Ecosystem Codex Volume VI data.
   Data lives in frameworks.json. No tier, role, or dependency is
   invented here; UNKNOWN means the codex page states nothing. */
(function () {
  var DATA = null;
  var byId = {};
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function tierBadge(t) { return '<span class="tier ' + esc(t) + '">' + esc(t) + "</span>"; }

  function dependedBy(fw) {
    var out = [];
    DATA.frameworks.forEach(function (o) {
      o.dependencies.forEach(function (d) {
        if (d.kind === "framework" && d.target === fw.id) out.push(o.name);
      });
    });
    return out;
  }

  function filtered() {
    var q = $("q").value.trim().toLowerCase();
    var tier = $("tier").value;
    var domain = $("domain").value;
    var list = DATA.frameworks.filter(function (fw) {
      if (tier && fw.tier !== tier) return false;
      if (domain && fw.domain !== domain) return false;
      if (q) {
        var hay = (fw.name + " " + fw.function + " " + fw.posture + " " + fw.domain).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      var c = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      return $("sort").value === "za" ? -c : c;
    });
    return list;
  }

  function render() {
    var list = filtered();
    var counts = { A: 0, B: 0, C: 0, UNKNOWN: 0 };
    DATA.frameworks.forEach(function (fw) { counts[fw.tier] = (counts[fw.tier] || 0) + 1; });
    $("counts").textContent = "Showing " + list.length + " of " + DATA.frameworks.length +
      " sourced frameworks. Tier mix of sourced set: A " + counts.A + ", B " + counts.B +
      ", C " + counts.C + ", UNKNOWN " + counts.UNKNOWN + ".";
    var html = "";
    list.forEach(function (fw) {
      html += '<tr class="row" data-id="' + esc(fw.id) + '"><td><b>' + esc(fw.name) + "</b></td><td>" +
        tierBadge(fw.tier) + "</td><td>" + esc(fw.domain) + "</td><td>" + esc(fw.function) +
        "</td><td>" + esc(fw.posture) + "</td></tr>";
    });
    if (!list.length) html = '<tr><td colspan="5">No frameworks match the current filters.</td></tr>';
    $("rows").innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll("tr.row"), function (tr) {
      tr.addEventListener("click", function () { showDetail(tr.getAttribute("data-id")); });
    });
  }

  function showDetail(id) {
    var fw = byId[id];
    if (!fw) return;
    Array.prototype.forEach.call(document.querySelectorAll("tr.row"), function (tr) {
      tr.classList.toggle("sel", tr.getAttribute("data-id") === id);
    });
    var deps = fw.dependencies.length
      ? fw.dependencies.map(function (d) {
          var label = esc(d.text);
          if (d.kind === "framework" && byId[d.target]) label += " (framework in this atlas)";
          else if (d.kind === "component") label += " (component, not a framework in this atlas)";
          else if (d.kind === "external") label += " (external item, not a framework)";
          return "<li>" + label + "</li>";
        }).join("")
      : "<li>None stated in the codex.</li>";
    var depBy = dependedBy(fw);
    var detail = $("detail");
    detail.style.display = "block";
    detail.innerHTML =
      "<h2>" + esc(fw.name) + " " + tierBadge(fw.tier) + "</h2>" +
      "<dl>" +
      "<dt>Function (codex)</dt><dd>" + esc(fw.function) + "</dd>" +
      "<dt>Posture (codex)</dt><dd>" + esc(fw.posture) + "</dd>" +
      "<dt>Tier</dt><dd>" + esc(fw.tier) + ". " + esc(DATA.tier_definitions[fw.tier] || "") + "</dd>" +
      "<dt>Tier source</dt><dd>" + esc(fw.tier_source) + "</dd>" +
      "<dt>Domain</dt><dd>" + esc(fw.domain) + " (atlas grouping from the Function text, not a codex field)</dd>" +
      "<dt>Register entry</dt><dd>" + (fw.register_id ? esc(fw.register_id) + ", " + esc(fw.register_name) : "No matching entry in the 28-entry master asset register.") + "</dd>" +
      "<dt>Depends on</dt><dd><ul>" + deps + "</ul><span class=\"note\">" + esc(fw.dependency_note) + "</span></dd>" +
      "<dt>Depended on by</dt><dd>" + (depBy.length ? esc(depBy.join(", ")) + " (stated in the register)" : "Nothing in the register lists this framework as a dependency.") + "</dd>" +
      "</dl>" +
      '<p class="src">Codex source: <a href="' + esc(DATA.source_url) + '">' + esc(DATA.source_name) + "</a>, Volume VI, accessed " + esc(DATA.source_accessed) + ".</p>";
    detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderDeps() {
    var html = "";
    var sorted = DATA.frameworks.slice().sort(function (a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    sorted.forEach(function (fw) {
      var depBy = dependedBy(fw);
      var deps = fw.dependencies.length
        ? fw.dependencies.map(function (d) {
            var kind = d.kind === "framework" ? "framework" : d.kind === "component" ? "component" : "external";
            return esc(d.text) + " [" + kind + "]";
          }).join("; ")
        : "None stated in the codex.";
      html += "<li><b>" + esc(fw.name) + "</b> depends on: " + deps +
        ". Depended on by: " + (depBy.length ? esc(depBy.join(", ")) : "none stated.") + "</li>";
    });
    $("deplist").innerHTML = html;
  }

  function init(data) {
    DATA = data;
    DATA.frameworks.forEach(function (fw) { byId[fw.id] = fw; });
    $("gapline").innerHTML = "<b>" + DATA.sourced_count + " of " + DATA.source_claim_total +
      " frameworks sourced from the codex page.</b> " + esc(DATA.gap_note);
    var domains = [];
    DATA.frameworks.forEach(function (fw) { if (domains.indexOf(fw.domain) === -1) domains.push(fw.domain); });
    domains.sort().forEach(function (d) {
      var o = document.createElement("option");
      o.value = d; o.textContent = d;
      $("domain").appendChild(o);
    });
    ["q", "tier", "domain", "sort"].forEach(function (id) {
      $(id).addEventListener("input", render);
      $(id).addEventListener("change", render);
    });
    $("clear").addEventListener("click", function () {
      $("q").value = ""; $("tier").value = ""; $("domain").value = ""; $("sort").value = "az";
      $("detail").style.display = "none";
      render();
    });
    $("tabTable").addEventListener("click", function () {
      $("tablePane").style.display = "block"; $("depPane").style.display = "none";
      $("tabTable").classList.add("on"); $("tabDeps").classList.remove("on");
    });
    $("tabDeps").addEventListener("click", function () {
      $("tablePane").style.display = "none"; $("depPane").style.display = "block";
      $("tabDeps").classList.add("on"); $("tabTable").classList.remove("on");
      renderDeps();
    });
    render();
  }

  fetch("frameworks.json").then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }).then(init).catch(function (e) {
    $("gapline").textContent = "Failed to load frameworks.json: " + e.message;
  });
})();
