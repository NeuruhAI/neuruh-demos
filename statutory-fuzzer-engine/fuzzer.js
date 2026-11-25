/* Statutory Adversarial Fuzzer & OpaqueAxiom Linter, v1.0.
   Pure logic module. No DOM, no network, no side effects.
   Encodes 2025 and 2026 verified federal tax discontinuity models,
   Spec-vs-UI differential checks, and OpaqueAxiom statutory linting. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.StatutoryFuzzer = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TAX_YEARS = {
    2025: {
      eitcInvLimit: 11950,
      eitcMax3: 8046,
      saltCapMfj: 40000,
      saltCapMfs: 20000,
      saltFloorMfj: 10000,
      saltFloorMfs: 5000,
      saltPhaseMfj: 500000,
      saltPhaseMfs: 250000,
      saltRate: 0.30
    },
    2026: {
      eitcInvLimit: 12200,
      eitcMax3: 8231,
      saltCapMfj: 40400,
      saltCapMfs: 20200,
      saltFloorMfj: 10000,
      saltFloorMfs: 5000,
      saltPhaseMfj: 505000,
      saltPhaseMfs: 252500,
      saltRate: 0.30
    }
  };

  var OPAQUE_PATTERNS = [
    "ordinary and necessary",
    "reasonable cause",
    "substantial authority",
    "facts and circumstances",
    "good faith",
    "materially",
    "promptly",
    "primarily",
    "substantially all",
    "undue hardship"
  ];

  function getYearCfg(year) {
    return TAX_YEARS[year] || TAX_YEARS[2025];
  }

  function eitcBenefit3Children(invIncome, year) {
    var cfg = getYearCfg(year);
    return Number(invIncome) <= cfg.eitcInvLimit ? cfg.eitcMax3 : 0;
  }

  function huntEitcCliff(year) {
    var cfg = getYearCfg(year);
    var before = cfg.eitcInvLimit;
    var after = before + 1;
    var loss = eitcBenefit3Children(before, year) - eitcBenefit3Children(after, year);
    return {
      year: Number(year),
      rule: "IRC_32_EITC_INVESTMENT_CLIFF",
      incomeBefore: before,
      incomeAfter: after,
      deltaIncome: 1,
      deltaTax: loss,
      marginalRatePct: loss * 100
    };
  }

  function saltDeductionCap(magi, status, year, mfsBugMode) {
    var cfg = getYearCfg(year);
    if (status === "MFJ") {
      var excessMfj = Math.max(0, magi - cfg.saltPhaseMfj);
      return Math.max(cfg.saltFloorMfj, cfg.saltCapMfj - cfg.saltRate * excessMfj);
    }
    var excessMfs = Math.max(0, magi - cfg.saltPhaseMfs);
    if (mfsBugMode) {
      var reduced = Math.max(cfg.saltFloorMfj, cfg.saltCapMfj - cfg.saltRate * excessMfs);
      return reduced / 2;
    }
    return Math.max(cfg.saltFloorMfs, cfg.saltCapMfs - cfg.saltRate * excessMfs);
  }

  function solveSaltArbitrage(incomeA, incomeB, year, mfsBugMode) {
    var jointMagi = Number(incomeA) + Number(incomeB);
    var mfjCap = saltDeductionCap(jointMagi, "MFJ", year, false);
    var mfsCapA = saltDeductionCap(Number(incomeA), "MFS", year, mfsBugMode);
    var mfsCapB = saltDeductionCap(Number(incomeB), "MFS", year, mfsBugMode);
    var mfsTotal = mfsCapA + mfsCapB;
    var spread = Math.round((mfsTotal - mfjCap) * 100) / 100;
    return {
      year: Number(year),
      jointMagi: jointMagi,
      mfjCap: Math.round(mfjCap * 100) / 100,
      mfsTotalCap: Math.round(mfsTotal * 100) / 100,
      deductionArbitrage: spread,
      winner: spread > 0 ? "MFS_ARBITRAGE" : "MFJ_OR_NEUTRAL"
    };
  }

  function statutoryTaxFormulaSingle(taxableIncome) {
    var x = Math.max(0, Number(taxableIncome) || 0);
    var brackets = [
      [11925, 0.10],
      [48475, 0.12],
      [103350, 0.22]
    ];
    var tax = 0;
    var prev = 0;
    for (var i = 0; i < brackets.length; i++) {
      var cap = brackets[i][0];
      var rate = brackets[i][1];
      if (x > prev) {
        tax += (Math.min(x, cap) - prev) * rate;
        prev = cap;
      }
    }
    if (x > prev) {
      tax += (x - prev) * 0.24;
    }
    return Math.round(tax * 100) / 100;
  }

  function irsTaxTableUiSingle(taxableIncome) {
    var x = Math.max(0, Number(taxableIncome) || 0);
    if (x >= 100000) {
      return Math.round(statutoryTaxFormulaSingle(x));
    }
    var bucketStart = Math.floor(x / 50) * 50;
    var midpoint = bucketStart + 25;
    return Math.round(statutoryTaxFormulaSingle(midpoint));
  }

  function runDifferentialFuzz(startIncome, endIncome, step) {
    var s = Math.max(1, Number(step) || 7);
    var maxPosDrift = 0;
    var maxNegDrift = 0;
    var worstPos = null;
    var worstNeg = null;
    var tested = 0;
    var drifted = 0;

    for (var inc = Number(startIncome); inc <= Number(endIncome); inc += s) {
      tested += 1;
      var spec = statutoryTaxFormulaSingle(inc);
      var ui = irsTaxTableUiSingle(inc);
      var diff = Math.round((ui - spec) * 100) / 100;
      if (Math.abs(diff) >= 0.01) {
        drifted += 1;
      }
      if (diff > maxPosDrift) {
        maxPosDrift = diff;
        worstPos = { income: inc, spec: spec, ui: ui, drift: diff };
      }
      if (diff < maxNegDrift) {
        maxNegDrift = diff;
        worstNeg = { income: inc, spec: spec, ui: ui, drift: diff };
      }
    }

    return {
      tested: tested,
      drifted: drifted,
      maxPosDrift: maxPosDrift,
      maxNegDrift: maxNegDrift,
      worstPos: worstPos,
      worstNeg: worstNeg
    };
  }

  function lintOpaqueAxioms(text) {
    var src = String(text || "");
    var sentences = src.split(/(?<=[.!?])\s+/).filter(function (s) { return s.trim().length > 0; });
    var hits = [];
    var opaqueSentenceCount = 0;

    sentences.forEach(function (sent, idx) {
      var lower = sent.toLowerCase();
      var matched = [];
      OPAQUE_PATTERNS.forEach(function (pat) {
        if (lower.indexOf(pat) !== -1) {
          matched.push(pat);
        }
      });
      if (matched.length > 0) {
        opaqueSentenceCount += 1;
        hits.push({
          sentenceIndex: idx + 1,
          axioms: matched,
          excerpt: sent.trim().slice(0, 140)
        });
      }
    });

    var total = sentences.length || 1;
    var discretionPct = Math.round((opaqueSentenceCount / total) * 1000) / 10;
    var deterministicPct = Math.round((100 - discretionPct) * 10) / 10;

    return {
      totalSentences: sentences.length,
      opaqueSentences: opaqueSentenceCount,
      deterministicPct: deterministicPct,
      discretionPct: discretionPct,
      hits: hits
    };
  }

  return {
    TAX_YEARS: TAX_YEARS,
    OPAQUE_PATTERNS: OPAQUE_PATTERNS,
    eitcBenefit3Children: eitcBenefit3Children,
    huntEitcCliff: huntEitcCliff,
    saltDeductionCap: saltDeductionCap,
    solveSaltArbitrage: solveSaltArbitrage,
    statutoryTaxFormulaSingle: statutoryTaxFormulaSingle,
    irsTaxTableUiSingle: irsTaxTableUiSingle,
    runDifferentialFuzz: runDifferentialFuzz,
    lintOpaqueAxioms: lintOpaqueAxioms
  };
});
