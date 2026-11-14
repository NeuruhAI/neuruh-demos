/* Estimator Cost Lab (SIMULATION)
   Reads seed.json, parsed mechanically from 002_taxonomy_and_seed.sql.
   No price is invented here. All values come from the seed file.
   Store multiplier applies to MATERIAL cost only; labor is store-independent.
   Formula: line_total = qty * (material_unit_cost * store_multiplier + labor_unit_cost)
*/
(function () {
  var SCHEMA = [
    [1, "est_component_taxonomy", "Code backbone: code PK, label, asset_class_scope, cost_model_class (COMPONENT / ASSEMBLY / ALLOWANCE), default_unit (SF, LF, EA, SQ, SF_GLA), default_trade, sort"],
    [2, "est_price_book", "Tier baselines (BUILDER / STANDARD / PREMIUM), region_code, store (BASE canonical), material + labor unit cost, book_version, source, as_of, active, tenant_id (NULL = global)"],
    [3, "est_store_multipliers", "HD / Lowes / Menards regional deltas; unique (store, region, category)"],
    [4, "est_labor_rates", "Hourly, per trade, per region; feeds hourly misc lines only"],
    [5, "est_unit_cost_models", "Triage $/SF bands + assembly fallbacks, all classes; unique (asset_class, system_code, region, book_version)"],
    [6, "est_assets", "The property: tenant_id, parcel_ref, address, region, asset_class (8 classes + land), gla_sf, lot_sf, year_built, beds, baths, stories, footprint_sf, attrs JSONB"],
    [7, "est_estimates", "Header: mode (TRIAGE / WALKTHROUGH), cost_model_class, status (DRAFT / ANALYZED / COMPILED / REVIEWED / ARCHIVED), precision_class (mandatory), scope_probs, totals, variance_pct, recommended tier/store, ARV, comp_ceiling_tier, price_book_version, model_versions, signal_payload"],
    [8, "est_photo_assets", "Storage path, sha256, zone, EXIF JSONB (bucket: est-photos, private)"],
    [9, "est_condition_findings", "Vision / aerial / records output: source (VISION / AERIAL / RECORDS / MANUAL), zone, component_code, condition_grade 1-5, action_rec (KEEP / CLEAN / REPAIR / REFINISH / REPLACE), defect_tags, confidence, raw"],
    [10, "est_line_items", "The punch list: component, zone, action, qty, unit, tier, store, material + labor cost, line_total, priority_class (P1-P4), qty_source (HEURISTIC / RECORDS / VISION / AERIAL / MANUAL), confidence, notes"],
    [11, "est_comp_ceilings", "$/SF percentile to finish-tier ceiling per submarket (psf_p25 / p50 / p75, comp_set_hash, method PSF_PERCENTILE_V1)"],
    [12, "est_provenance_receipts", "SHA-256 over canonical estimate inputs + outputs"],
    [13, "est_audit_log", "SOC2 audit: table, record, action, actor, diff JSONB"]
  ];

  function money(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function el(id) { return document.getElementById(id); }

  fetch("seed.json").then(function (r) { return r.json(); }).then(function (data) {
    var counts = data.counts;
    el("counts").innerHTML =
      '<div class="stat"><div class="n">' + counts.taxonomy + '</div><div class="l">taxonomy codes (80 expected, file-verified)</div></div>' +
      '<div class="stat"><div class="n">' + counts.price_book + '</div><div class="l">price book rows: 26 components x 3 tiers</div></div>' +
      '<div class="stat"><div class="n">' + counts.store_multipliers + '</div><div class="l">store multipliers (HD 1.0000, Lowes 1.0100, Menards 0.9500)</div></div>' +
      '<div class="stat"><div class="n">' + counts.labor_rates + '</div><div class="l">labor rates, $/hr, 16 trades</div></div>' +
      '<div class="stat"><div class="n">' + counts.unit_cost_models + '</div><div class="l">unit cost models: 8 asset classes x 3 scope bands</div></div>' +
      '<div class="stat"><div class="n">' + counts.total_value_rows + '</div><div class="l">total seed value rows (201 expected, file-verified)</div></div>';

    var taxByCode = {};
    data.taxonomy.forEach(function (t) { taxByCode[t.code] = t; });

    var pricedCodes = [];
    var seen = {};
    data.price_book.forEach(function (r) {
      if (!seen[r.component_code]) { seen[r.component_code] = true; pricedCodes.push(r.component_code); }
    });
    pricedCodes.sort(function (a, b) { return taxByCode[a].sort - taxByCode[b].sort; });

    // Calculator selects
    var compSel = el("comp");
    pricedCodes.forEach(function (code) {
      var t = taxByCode[code];
      var opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code + " - " + t.label + " (" + t.default_unit + ")";
      compSel.appendChild(opt);
    });
    compSel.value = "EXT.ROOF.SHINGLE";

    var storeSel = el("store");
    data.store_multipliers.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = String(m.multiplier);
      opt.textContent = m.store.replace(/_/g, " ") + " x " + m.multiplier.toFixed(4);
      storeSel.appendChild(opt);
    });
    storeSel.value = "1";

    function updateUnitNote() {
      var t = taxByCode[compSel.value];
      el("unitNote").textContent = "Default unit for " + t.code + ": " + t.default_unit +
        " (" + (t.default_unit === "SQ" ? "roofing square = 100 SF" : t.default_unit === "SF_GLA" ? "per SF of gross living area" : t.default_unit) +
        "). Trade: " + t.default_trade + ". Cost model class: " + t.cost_model_class + ".";
    }
    compSel.addEventListener("change", updateUnitNote);
    updateUnitNote();

    function calculate() {
      var code = compSel.value;
      var tier = el("tier").value;
      var qty = parseFloat(el("qty").value);
      if (isNaN(qty) || qty < 0) { qty = 0; }
      var mult = parseFloat(storeSel.value);
      var storeName = storeSel.options[storeSel.selectedIndex].textContent.split(" x ")[0];
      var row = null;
      data.price_book.forEach(function (r) {
        if (r.component_code === code && r.tier === tier) { row = r; }
      });
      if (!row) {
        el("result").style.display = "block";
        el("totalOut").textContent = "No seed price row";
        el("breakdown").textContent = code + " at tier " + tier + " has no price book row in the seed file. 54 of 80 taxonomy codes are unpriced; nothing is estimated for them.";
        el("formulaOut").textContent = "No row, no math. Unpriced codes stay unpriced.";
        return;
      }
      var matAdj = row.material_unit_cost * mult;
      var unitCost = matAdj + row.labor_unit_cost;
      var total = qty * unitCost;
      var baseTotal = qty * (row.material_unit_cost + row.labor_unit_cost);
      el("result").style.display = "block";
      el("totalOut").textContent = "Modeled line cost: " + money(total);
      el("breakdown").textContent = taxByCode[code].label + " (" + code + "), tier " + tier + ", " +
        qty + " " + row.unit + " at " + storeName + ". Material " + money(row.material_unit_cost) +
        " x " + mult.toFixed(4) + " = " + money(matAdj) + " per unit; labor " + money(row.labor_unit_cost) +
        " per unit (store-independent); combined " + money(unitCost) + " per unit. BASE store total for comparison: " + money(baseTotal) + ".";
      el("formulaOut").textContent =
        "line_total = qty x (material_unit_cost x store_multiplier + labor_unit_cost)\n" +
        "line_total = " + qty + " x (" + money(row.material_unit_cost) + " x " + mult.toFixed(4) + " + " + money(row.labor_unit_cost) + ")\n" +
        "line_total = " + qty + " x (" + money(matAdj) + " + " + money(row.labor_unit_cost) + ")\n" +
        "line_total = " + qty + " x " + money(unitCost) + " = " + money(total) + "\n" +
        "Source: 002_taxonomy_and_seed.sql, book_version seed_v1, source seed_v1_calibrate, region US-MIDWEST-BASE.";
    }
    el("calcBtn").addEventListener("click", calculate);

    // Price book table
    var pbBody = document.querySelector("#pbTable tbody");
    function renderPriceBook() {
      var q = el("pbSearch").value.trim().toUpperCase();
      var tf = el("pbTier").value;
      var shown = 0;
      var html = "";
      data.price_book.forEach(function (r) {
        var label = taxByCode[r.component_code] ? taxByCode[r.component_code].label : "";
        if (tf && r.tier !== tf) { return; }
        if (q && r.component_code.indexOf(q) === -1 && label.toUpperCase().indexOf(q) === -1) { return; }
        shown++;
        html += "<tr><td><code>" + r.component_code + "</code></td><td>" + label + "</td><td>" + r.tier +
          "</td><td>" + r.unit + "</td><td class=\"num\">" + money(r.material_unit_cost) +
          "</td><td class=\"num\">" + money(r.labor_unit_cost) +
          "</td><td class=\"num\">" + money(r.material_unit_cost + r.labor_unit_cost) + "</td></tr>";
      });
      pbBody.innerHTML = html;
      el("pbCount").textContent = "Showing " + shown + " of 78 seed price book rows. Store BASE, book version seed_v1.";
    }
    el("pbSearch").addEventListener("input", renderPriceBook);
    el("pbTier").addEventListener("change", renderPriceBook);
    renderPriceBook();

    // Labor table
    var laborBody = document.querySelector("#laborTable tbody");
    var lhtml = "";
    data.labor_rates.forEach(function (r) {
      lhtml += "<tr><td>" + r.trade + "</td><td>" + r.region_code + "</td><td>" + r.unit +
        "</td><td class=\"num\">" + money(r.rate) + "</td></tr>";
    });
    laborBody.innerHTML = lhtml;

    // Triage bands table
    var bandBody = document.querySelector("#bandTable tbody");
    var bhtml = "";
    data.unit_cost_models.forEach(function (r) {
      var mid = (r.cost_low + r.cost_high) / 2;
      bhtml += "<tr><td>" + r.asset_class + "</td><td>" + r.system_code + "</td><td>" + r.unit +
        "</td><td class=\"num\">" + money(r.cost_low) + "</td><td class=\"num\">" + money(r.cost_high) +
        "</td><td class=\"num\">" + money(mid) + "</td></tr>";
    });
    bandBody.innerHTML = bhtml;

    // Schema table
    var schemaBody = document.querySelector("#schemaTable tbody");
    var shtml = "";
    SCHEMA.forEach(function (row) {
      shtml += "<tr><td>" + row[0] + "</td><td><code>" + row[1] + "</code></td><td>" + row[2] + "</td></tr>";
    });
    schemaBody.innerHTML = shtml;
  }).catch(function (err) {
    document.getElementById("counts").innerHTML =
      "<p>Seed data failed to load: " + err.message + ". The tables on this page need seed.json in the same directory.</p>";
  });
})();
