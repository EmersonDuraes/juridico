/* ============================================================
   Enviar documentos — fotos -> PDF único -> e-mail do escritório
   Tudo é processado no aparelho do cliente (sem bibliotecas externas).
   Configuração em js/config.js (window.SITE.scanner).
   ============================================================ */
(function () {
  "use strict";
  var S = window.SITE || {};
  var CFG = S.scanner || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  function el(t, cls, txt) { var e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function digits(s) { return (s || "").replace(/\D/g, ""); }
  function mb(n) { return (n / 1048576).toFixed(1).replace(".", ",") + " MB"; }

  var TIPOS = ["Documento", "RG", "CPF", "CNH", "Comprovante de residência", "Certidão", "Procuração", "Contrato", "Documento do processo", "Comprovante / recibo", "Outros"];
  var MODES = [["orig", "Original"], ["real", "Realçado"], ["bw", "P&B"]];
  var MAX_PAGES = 30, WORK_SIDE = 2000, LIMIT_BYTES = 9.2 * 1024 * 1024;

  var st = { pages: [], data: null, pdf: null, sent: false, busy: false, seq: 0, protocolo: "" };

  /* ---------- etapas ---------- */
  function go(n) {
    $$(".step").forEach(function (s) { s.classList.toggle("on", +s.getAttribute("data-s") === n); });
    $$("#steps li").forEach(function (li) {
      var k = +li.getAttribute("data-s"); li.classList.toggle("on", k === n); li.classList.toggle("ok", k < n);
    });
    $("#steps").style.display = n > 3 ? "none" : "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- máscaras e validações ---------- */
  function maskCpf(v) { v = digits(v).slice(0, 11); return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }
  function maskTel(v) { v = digits(v).slice(0, 11); if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3"); if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3"); if (v.length > 2) return v.replace(/(\d{2})(\d+)/, "($1) $2"); return v; }
  function maskProc(v) { v = digits(v).slice(0, 20); var m = v.match(/^(\d{0,7})(\d{0,2})(\d{0,4})(\d{0,1})(\d{0,2})(\d{0,4})$/); if (!m) return v; var o = m[1]; if (m[2]) o += "-" + m[2]; if (m[3]) o += "." + m[3]; if (m[4]) o += "." + m[4]; if (m[5]) o += "." + m[5]; if (m[6]) o += "." + m[6]; return o; }
  function cpfOk(c) {
    c = digits(c); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (var t = 9; t < 11; t++) { var s = 0; for (var i = 0; i < t; i++) s += +c[i] * (t + 1 - i); var d = (s * 10) % 11 % 10; if (d !== +c[t]) return false; }
    return true;
  }
  $("#fCpf").addEventListener("input", function (e) { e.target.value = maskCpf(e.target.value); });
  $("#fTel").addEventListener("input", function (e) { e.target.value = maskTel(e.target.value); });
  $("#fProc").addEventListener("input", function (e) { e.target.value = maskProc(e.target.value); });
  $$(".f input,.f select").forEach(function (i) { i.addEventListener("input", function () { i.parentNode.classList.remove("bad"); }); });

  $("#step1").addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = [], nome = $("#fNome").value.trim().replace(/\s+/g, " "), mail = $("#fMail").value.trim();
    if (nome.split(" ").length < 2) bad.push(["#fNome", "Informe o nome completo."]);
    if (!cpfOk($("#fCpf").value)) bad.push(["#fCpf", "CPF inválido. Confira os números."]);
    if (digits($("#fTel").value).length < 10) bad.push(["#fTel", "Informe um telefone com DDD."]);
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) bad.push(["#fMail", "E-mail inválido."]);
    var proc = digits($("#fProc").value); if (proc && proc.length !== 20) bad.push(["#fProc", "O número do processo tem 20 dígitos (ou deixe em branco)."]);
    $$(".f").forEach(function (f) { f.classList.remove("bad"); });
    if (bad.length) { bad.forEach(function (b) { $(b[0]).parentNode.classList.add("bad"); }); $("#err1").textContent = bad[0][1]; $(bad[0][0]).focus(); return; }
    if (!$("#fLgpd").checked) { $("#err1").textContent = "Marque a autorização para continuar."; return; }
    $("#err1").textContent = "";
    st.data = { nome: nome, cpf: maskCpf($("#fCpf").value), tel: $("#fTel").value, mail: mail, proc: $("#fProc").value, assunto: $("#fAssunto").value, obs: $("#fObs").value.trim() };
    go(2);
  });

  /* ---------- imagens ---------- */
  function decode(blobOrFile) {
    if (window.createImageBitmap) {
      return createImageBitmap(blobOrFile, { imageOrientation: "from-image" }).catch(function () { return createImageBitmap(blobOrFile); }).catch(function () { return viaImg(blobOrFile); });
    }
    return viaImg(blobOrFile);
  }
  function viaImg(b) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(b), im = new Image();
      im.onload = function () { res(im); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); };
      im.onerror = function () { rej(new Error("img")); }; im.src = u;
    });
  }
  function dims(im) { return { w: im.width || im.naturalWidth, h: im.height || im.naturalHeight }; }
  function toCanvas(im, maxSide) {
    var d = dims(im), k = Math.min(1, maxSide / Math.max(d.w, d.h)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(d.w * k)); c.height = Math.max(1, Math.round(d.h * k));
    var g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); return c;
  }
  function blobOf(c, q) { return new Promise(function (res) { c.toBlob(function (b) { res(b); }, "image/jpeg", q); }); }

  function applyMode(c, mode) {
    if (mode === "orig") return c;
    var g = c.getContext("2d"), W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), p = im.data, n = W * H, i;
    if (mode === "real") {
      var hist = new Uint32Array(256), cnt = 0;
      for (i = 0; i < n; i += 5) { hist[(p[i * 4] * 77 + p[i * 4 + 1] * 150 + p[i * 4 + 2] * 29) >> 8]++; cnt++; }
      var acc = 0, lo = 0, hi = 255, a1 = cnt * 0.01, a2 = cnt * 0.88, gotLo = false;
      for (i = 0; i < 256; i++) { acc += hist[i]; if (!gotLo && acc >= a1) { lo = i; gotLo = true; } if (acc >= a2) { hi = i; break; } }
      if (hi - lo < 50) return c;
      var k = 255 / (hi - lo), lut = new Uint8ClampedArray(256);
      for (i = 0; i < 256; i++) lut[i] = Math.max(0, Math.min(255, (i - lo) * k));
      for (i = 0; i < n * 4; i += 4) { p[i] = lut[p[i]]; p[i + 1] = lut[p[i + 1]]; p[i + 2] = lut[p[i + 2]]; }
      g.putImageData(im, 0, 0); return c;
    }
    // P&B: limiarização adaptativa (imagem integral)
    var gray = new Uint8Array(n), integ = new Float64Array((W + 1) * (H + 1)), x, y;
    for (i = 0; i < n; i++) gray[i] = (p[i * 4] * 77 + p[i * 4 + 1] * 150 + p[i * 4 + 2] * 29) >> 8;
    for (y = 1; y <= H; y++) { var row = 0; for (x = 1; x <= W; x++) { row += gray[(y - 1) * W + x - 1]; integ[y * (W + 1) + x] = integ[(y - 1) * (W + 1) + x] + row; } }
    var r = Math.max(8, Math.round(Math.max(W, H) / 40));
    for (y = 0; y < H; y++) {
      var y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
      for (x = 0; x < W; x++) {
        var x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1), area = (x1 - x0) * (y1 - y0);
        var sum = integ[y1 * (W + 1) + x1] - integ[y0 * (W + 1) + x1] - integ[y1 * (W + 1) + x0] + integ[y0 * (W + 1) + x0];
        var v = gray[y * W + x] * area < sum * 0.9 ? 0 : 255, j = (y * W + x) * 4; p[j] = p[j + 1] = p[j + 2] = v;
      }
    }
    g.putImageData(im, 0, 0); return c;
  }
  function render(page, maxSide) {
    return decode(page.blob).then(function (im) { return applyMode(toCanvas(im, maxSide), page.mode); });
  }
  function refreshThumb(page) {
    return render(page, 420).then(function (c) { page.thumb = c.toDataURL("image/jpeg", 0.8); });
  }

  /* ---------- adicionar fotos ---------- */
  function addFiles(files) {
    var list = [].slice.call(files || []).filter(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name); });
    if (!list.length) { $("#err2").textContent = "Selecione imagens (fotos) dos documentos."; return; }
    $("#err2").textContent = "";
    var chain = Promise.resolve();
    list.forEach(function (f) {
      chain = chain.then(function () {
        if (st.pages.length >= MAX_PAGES) { $("#err2").textContent = "Limite de " + MAX_PAGES + " páginas por envio."; return; }
        return decode(f).then(function (im) { return blobOf(toCanvas(im, WORK_SIDE), 0.9); }).then(function (b) {
          var pg = { id: ++st.seq, blob: b, orig: b, mode: "real", tipo: TIPOS[0], thumb: "" };
          st.pages.push(pg); return refreshThumb(pg).then(drawPages);
        }).catch(function () { $("#err2").textContent = "Não foi possível abrir “" + f.name + "”. Se for formato HEIC, tire a foto em JPG ou use “Tirar foto”."; });
      });
    });
    return chain;
  }
  $("#inCam").addEventListener("change", function (e) { addFiles(e.target.files); e.target.value = ""; });
  $("#inGal").addEventListener("change", function (e) { addFiles(e.target.files); e.target.value = ""; });

  var ICON = {
    up: '<path d="m6 14 6-6 6 6"/>', down: '<path d="m6 10 6 6 6-6"/>',
    rl: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/>', rr: '<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/>',
    crop: '<path d="M7 3v14h14M3 7h14v14"/>', del: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'
  };
  function ib(name, label, fn, dis, cls) {
    var b = el("button"); b.type = "button"; b.disabled = !!dis; if (cls) b.className = cls;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + "</svg>" + label; b.addEventListener("click", fn); return b;
  }
  function drawPages() {
    var ul = $("#pages"); ul.innerHTML = "";
    st.pages.forEach(function (pg, i) {
      var li = el("li", "pg"), imgw = el("div", "pg__img"), im = el("img"); im.src = pg.thumb; im.alt = "Página " + (i + 1);
      imgw.appendChild(im); imgw.appendChild(el("span", "pg__n", "Pág. " + (i + 1))); imgw.title = "Toque para recortar"; imgw.addEventListener("click", function () { openCrop(pg); });
      var body = el("div", "pg__body"), sel = el("select"); sel.setAttribute("aria-label", "Tipo do documento");
      TIPOS.forEach(function (t) { var o = el("option", null, t); if (t === pg.tipo) o.selected = true; sel.appendChild(o); });
      sel.addEventListener("change", function () { pg.tipo = sel.value; });
      var modes = el("div", "modes"); MODES.forEach(function (m) {
        var b = el("button", pg.mode === m[0] ? "on" : "", m[1]); b.type = "button";
        b.addEventListener("click", function () { if (pg.mode === m[0]) return; pg.mode = m[0]; refreshThumb(pg).then(drawPages); }); modes.appendChild(b);
      });
      var tools = el("div", "tools");
      tools.appendChild(ib("rl", "", function () { rotate(pg, -90); })); tools.lastChild.setAttribute("aria-label", "Girar à esquerda");
      tools.appendChild(ib("rr", "", function () { rotate(pg, 90); })); tools.lastChild.setAttribute("aria-label", "Girar à direita");
      tools.appendChild(ib("crop", "Recortar", function () { openCrop(pg); }));
      tools.appendChild(ib("up", "", function () { move(i, -1); }, i === 0)); tools.lastChild.setAttribute("aria-label", "Subir");
      tools.appendChild(ib("down", "", function () { move(i, 1); }, i === st.pages.length - 1)); tools.lastChild.setAttribute("aria-label", "Descer");
      tools.appendChild(ib("del", "Excluir", function () { st.pages.splice(i, 1); drawPages(); }, false, "del"));
      body.appendChild(sel); body.appendChild(modes); body.appendChild(tools);
      li.appendChild(imgw); li.appendChild(body); ul.appendChild(li);
    });
    $("#empty").hidden = st.pages.length > 0;
    var s = $("#sum2"); s.hidden = !st.pages.length; s.textContent = st.pages.length + (st.pages.length === 1 ? " página pronta" : " páginas prontas") + " para envio.";
  }
  function move(i, d) { var j = i + d; if (j < 0 || j >= st.pages.length) return; var t = st.pages[i]; st.pages[i] = st.pages[j]; st.pages[j] = t; drawPages(); }
  function rotate(pg, deg) {
    decode(pg.blob).then(function (im) {
      var d = dims(im), c = document.createElement("canvas"); c.width = d.h; c.height = d.w; var g = c.getContext("2d");
      g.translate(c.width / 2, c.height / 2); g.rotate(deg * Math.PI / 180); g.drawImage(im, -d.w / 2, -d.h / 2); return blobOf(c, 0.9);
    }).then(function (b) { pg.blob = b; return refreshThumb(pg); }).then(drawPages);
  }

  /* ---------- recorte ---------- */
  var cr = { pg: null, cv: $("#cropCv"), rect: $("#cropRect"), stage: $("#cropStage"), r: null, im: null, drag: null };
  function openCrop(pg) {
    decode(pg.blob).then(function (im) {
      cr.pg = pg; cr.im = im; var d = dims(im), maxW = Math.min(560, window.innerWidth - 28), maxH = window.innerHeight * 0.66, k = Math.min(maxW / d.w, maxH / d.h);
      cr.cv.width = Math.round(d.w * k); cr.cv.height = Math.round(d.h * k); cr.cv.getContext("2d").drawImage(im, 0, 0, cr.cv.width, cr.cv.height);
      cr.k = k; cr.r = { x: cr.cv.width * 0.04, y: cr.cv.height * 0.04, w: cr.cv.width * 0.92, h: cr.cv.height * 0.92 }; drawRect(); $("#crop").hidden = false;
    });
  }
  function drawRect() { var r = cr.r, s = cr.rect.style; s.left = r.x + "px"; s.top = r.y + "px"; s.width = r.w + "px"; s.height = r.h + "px"; }
  cr.stage.addEventListener("pointerdown", function (e) {
    var h = e.target.getAttribute && e.target.getAttribute("data-h"); if (!h && e.target !== cr.rect) return;
    cr.drag = { h: h || "move", x: e.clientX, y: e.clientY, r: { x: cr.r.x, y: cr.r.y, w: cr.r.w, h: cr.r.h } }; cr.stage.setPointerCapture(e.pointerId); e.preventDefault();
  });
  cr.stage.addEventListener("pointermove", function (e) {
    if (!cr.drag) return; var d = cr.drag, dx = e.clientX - d.x, dy = e.clientY - d.y, W = cr.cv.width, H = cr.cv.height, min = 40, r0 = d.r, x0 = r0.x, y0 = r0.y, x1 = r0.x + r0.w, y1 = r0.y + r0.h;
    if (d.h === "move") { var nx = Math.max(0, Math.min(W - r0.w, r0.x + dx)), ny = Math.max(0, Math.min(H - r0.h, r0.y + dy)); cr.r = { x: nx, y: ny, w: r0.w, h: r0.h }; drawRect(); return; }
    if (d.h.indexOf("w") >= 0) x0 = Math.max(0, Math.min(x1 - min, x0 + dx)); if (d.h.indexOf("e") >= 0) x1 = Math.min(W, Math.max(x0 + min, x1 + dx));
    if (d.h.indexOf("n") >= 0) y0 = Math.max(0, Math.min(y1 - min, y0 + dy)); if (d.h.indexOf("s") >= 0) y1 = Math.min(H, Math.max(y0 + min, y1 + dy));
    cr.r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; drawRect();
  });
  function endDrag() { cr.drag = null; }
  cr.stage.addEventListener("pointerup", endDrag); cr.stage.addEventListener("pointercancel", endDrag);
  $("#cropCancel").addEventListener("click", function () { $("#crop").hidden = true; });
  $("#cropReset").addEventListener("click", function () { cr.r = { x: 0, y: 0, w: cr.cv.width, h: cr.cv.height }; drawRect(); });
  $("#cropOk").addEventListener("click", function () {
    var r = cr.r, k = cr.k, c = document.createElement("canvas"); c.width = Math.round(r.w / k); c.height = Math.round(r.h / k);
    c.getContext("2d").drawImage(cr.im, r.x / k, r.y / k, r.w / k, r.h / k, 0, 0, c.width, c.height);
    blobOf(c, 0.92).then(function (b) { cr.pg.blob = b; return refreshThumb(cr.pg); }).then(function () { $("#crop").hidden = true; drawPages(); });
  });

  /* ---------- navegação 2 -> 3 ---------- */
  $("#back2").addEventListener("click", function () { go(1); });
  $("#back3").addEventListener("click", function () { go(2); });
  $("#go3").addEventListener("click", function () {
    if (!st.pages.length) { $("#err2").textContent = "Adicione ao menos uma foto de documento."; return; }
    $("#err2").textContent = ""; fillReview(); go(3);
  });
  function dl(dt, dd) { var a = el("dt", null, dt), b = el("dd", null, dd); return [a, b]; }
  function fillReview() {
    var d = st.data, r = $("#review"); r.innerHTML = "";
    [["Nome", d.nome], ["CPF", d.cpf], ["Telefone", d.tel], ["E-mail", d.mail || "—"], ["Processo", d.proc || "—"], ["Assunto", d.assunto], ["Observações", d.obs || "—"],
     ["Páginas", st.pages.length + " — " + st.pages.map(function (p) { return p.tipo; }).join(", ")]].forEach(function (x) { dl(x[0], x[1]).forEach(function (n) { r.appendChild(n); }); });
    $("#err3").textContent = ""; $("#progress").hidden = true;
  }

  /* ---------- gerador de PDF ---------- */
  var W1252 = { 8211: 150, 8212: 151, 8216: 145, 8217: 146, 8220: 147, 8221: 148, 8226: 149, 8230: 133, 8364: 128 };
  function latin(s) { var o = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); o[i] = c < 256 ? c : (W1252[c] || 63); } return o; }
  function esc(s) { return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[\r\n]+/g, " "); }
  function wrap(text, size, maxW) {
    var words = String(text).split(/\s+/), lines = [], cur = ""; var cw = size * 0.52;
    words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (t.length * cw > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines.length ? lines : [""];
  }
  function PdfWriter() {
    this.parts = []; this.len = 0; this.offs = []; this.n = 0;
    this.raw(latin("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  }
  PdfWriter.prototype.raw = function (u8) { this.parts.push(u8); this.len += u8.length; };
  PdfWriter.prototype.alloc = function () { return ++this.n; };
  PdfWriter.prototype.obj = function (id, head, stream) {
    this.offs[id] = this.len;
    if (stream) { this.raw(latin(id + " 0 obj\n<<" + head + " /Length " + stream.length + ">>\nstream\n")); this.raw(stream); this.raw(latin("\nendstream\nendobj\n")); }
    else this.raw(latin(id + " 0 obj\n" + head + "\nendobj\n"));
  };
  PdfWriter.prototype.finish = function (root, info) {
    var x = this.len, s = "xref\n0 " + (this.n + 1) + "\n0000000000 65535 f \n";
    for (var i = 1; i <= this.n; i++) s += ("0000000000" + this.offs[i]).slice(-10) + " 00000 n \n";
    s += "trailer\n<</Size " + (this.n + 1) + " /Root " + root + " 0 R /Info " + info + " 0 R>>\nstartxref\n" + x + "\n%%EOF";
    this.raw(latin(s)); return new Blob(this.parts, { type: "application/pdf" });
  };
  function fmtDate(d) { return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function fmtTime(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }

  function buildPdf(imgs, meta) {
    var W = 595.28, H = 841.89, w = new PdfWriter(), cat = w.alloc(), pagesId = w.alloc(), f1 = w.alloc(), f2 = w.alloc(), info = w.alloc(), kids = [];
    w.obj(f1, "<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>");
    w.obj(f2, "<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>");
    function addPage(content, xobjs) {
      var cId = w.alloc(), pId = w.alloc(); w.obj(cId, "", latin(content));
      var xo = xobjs ? "/XObject<<" + xobjs + ">>" : "";
      w.obj(pId, "<</Type/Page/Parent " + pagesId + " 0 R/MediaBox[0 0 " + W + " " + H + "]/Resources<</Font<</F1 " + f1 + " 0 R/F2 " + f2 + " 0 R>>" + xo + ">>/Contents " + cId + " 0 R>>");
      kids.push(pId); return pId;
    }
    function T(x, y, size, txt, bold, col) { return "BT " + (col || "0.1 0.1 0.12") + " rg /" + (bold ? "F2" : "F1") + " " + size + " Tf " + x.toFixed(2) + " " + y.toFixed(2) + " Td (" + esc(txt) + ") Tj ET\n"; }

    // capa / ficha (cabeçalho sem faixa de cor, para economizar tinta)
    var c = "", lx = 48, tx = 48, ly = H - 92, logoId = 0;
    if (meta.logo) {
      logoId = w.alloc(); w.obj(logoId, "/Type/XObject/Subtype/Image/Width " + meta.logo.w + "/Height " + meta.logo.h + "/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode", meta.logo.bytes);
      var lh = 52, lw = lh * meta.logo.w / meta.logo.h; c += "q " + lw.toFixed(2) + " 0 0 " + lh + " " + lx + " " + (ly - 8) + " cm /Lg Do Q\n"; tx = lx + lw + 14;
    }
    c += T(tx, ly + 22, 19, "MARTINS & PAMPLONA", true, "0.04 0.09 0.2") + T(tx, ly + 6, 9, "ADVOCACIA & ASSESSORIA", false, "0.55 0.42 0.15");
    if (meta.endereco) c += T(tx, ly - 8, 9, meta.endereco, false, "0.3 0.3 0.35");
    c += "0.71 0.56 0.25 RG 0.8 w 48 " + (ly - 22) + " m " + (W - 48) + " " + (ly - 22) + " l S\n";
    c += T(48, ly - 48, 13, "Ficha de envio de documentos", true, "0.1 0.1 0.12");
    var y = H - 190;
    function row(k, v) {
      var ls = wrap(v || "-", 10.5, W - 96 - 150); c += T(48, y, 8.5, k.toUpperCase(), true, "0.55 0.42 0.15");
      ls.forEach(function (l, i) { c += T(198, y - i * 14, 10.5, l, false); }); y -= Math.max(1, ls.length) * 14 + 9;
      c += "0.88 0.86 0.82 RG 0.5 w 48 " + (y + 8).toFixed(1) + " m " + (W - 48) + " " + (y + 8).toFixed(1) + " l S\n";
    }
    row("Protocolo", meta.protocolo); row("Data de envio", meta.data); row("Horário de envio", meta.hora + " (horário do aparelho do cliente)");
    row("Nome", meta.nome); row("CPF", meta.cpf); row("Telefone / WhatsApp", meta.tel); row("E-mail", meta.mail || "-");
    row("Nº do processo", meta.proc || "-"); row("Assunto", meta.assunto); row("Observações", meta.obs || "-"); row("Total de páginas", String(imgs.length));
    c += T(48, y - 6, 8.5, "DOCUMENTOS ANEXADOS", true, "0.55 0.42 0.15"); y -= 24;
    imgs.forEach(function (im, i) { if (y > 90) { c += T(48, y, 10, "Página " + (i + 2) + " — " + im.tipo, false); y -= 15; } else if (y > 70 && !imgs.__more) { c += T(48, y, 10, "...", false); imgs.__more = 1; } });
    c += T(48, 42, 7.5, "Documento gerado automaticamente pelo site do escritório. Conteúdo sigiloso e destinado exclusivamente ao escritório.", false, "0.45 0.45 0.5");
    addPage(c, logoId ? "/Lg " + logoId + " 0 R" : "");

    // páginas com imagens
    imgs.forEach(function (im, i) {
      var id = w.alloc(); w.obj(id, "/Type/XObject/Subtype/Image/Width " + im.w + "/Height " + im.h + "/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode", im.bytes);
      var m = 26, fh = 30, aw = W - 2 * m, ah = H - 2 * m - fh, k = Math.min(aw / im.w, ah / im.h), dw = im.w * k, dh = im.h * k, x = (W - dw) / 2, yy = m + fh + (ah - dh) / 2;
      var cc = "q " + dw.toFixed(2) + " 0 0 " + dh.toFixed(2) + " " + x.toFixed(2) + " " + yy.toFixed(2) + " cm /Im0 Do Q\n";
      cc += "0.8 0.8 0.8 RG 0.4 w " + x.toFixed(2) + " " + yy.toFixed(2) + " " + dw.toFixed(2) + " " + dh.toFixed(2) + " re S\n";
      cc += T(m, 22, 7.5, "Protocolo " + meta.protocolo + "  |  " + meta.nome + "  |  " + im.tipo + "  |  Página " + (i + 2) + " de " + (imgs.length + 1), false, "0.45 0.45 0.5");
      addPage(cc, "/Im0 " + id + " 0 R");
    });
    w.obj(pagesId, "<</Type/Pages/Kids[" + kids.map(function (k) { return k + " 0 R"; }).join(" ") + "]/Count " + kids.length + ">>");
    w.obj(cat, "<</Type/Catalog/Pages " + pagesId + " 0 R>>");
    var cd = meta.dateObj, pdate = "D:" + cd.getFullYear() + pad(cd.getMonth() + 1) + pad(cd.getDate()) + pad(cd.getHours()) + pad(cd.getMinutes()) + pad(cd.getSeconds());
    w.obj(info, "<</Title(" + esc("Documentos - " + meta.nome + " - " + meta.protocolo) + ")/Author(" + esc(meta.nome) + ")/Creator(Martins & Pamplona - envio de documentos)/CreationDate(" + pdate + ")>>");
    return w.finish(cat, info);
  }

  function progress(p, t) { var b = $("#progress"); b.hidden = false; b.firstElementChild.style.setProperty("--p", Math.round(p * 100) + "%"); $("#progressTxt").textContent = t; }

  var LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAEsARcDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiqGtamNJsWm27nJ2qp6E1nUnGnFzlsiopydkX6K4Q+LNRLZ81APTYMV1Gg6v/a9oXZQsqHa4HT61wYfMKOJnyQvfzNp0J01zM06KKK9M5wooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArG8V2Mt9peIVLvG4faOpGCDj862abIcRsR1ANY1qarU5U5bMuEnGSkjyokhsEEHpgiu48HWE1pYySTKUMrAqrDBwB1rgGlLMWJJYnJJ65r1bT3MlhbMxLM0Skk9zgV8pk9OM60pv7O3zPSxcmoJdyxRRRX2J5QUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUyX/AFT/AO6afTJv9U/+6aT2Gjx0txXrel/8gy0/64p/6CK8eL8V7DpX/ILs/wDrin/oIr5LI/jn6I9TG7RLVFFFfXHlBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAEFxfW1oQJ7iKEnoJHC5/Oq8usWDROBfW2SD/AMtV/wAa8q8RTTS65fG4JMglYYbsAeB9MYrO3CvkqudzjOUVDReZ6scEmk2yUkjNetaZq9jHptoj3turLEgIMq5BwPevIN9G4V42Cx0sG5OMb3OutRVZJNntsGoWt0xWG5imYc4jcMf0qxXiWnTSxahbtbkicSLs29Sc9K9tr7DL8c8bGTcbNHk16PsWrO9wooor1jlCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAztQ8P6dqkokurSOWQDG8jB/MVV/wCEM0X/AKB8f/fTf41sSzRwIXkdY0HVnOBTLe8t7sEwTxzAdTG4bH5VzSoUJS96KbfkrminNLRuxlf8IZov/QPj/wC+m/xo/wCEM0X/AKB8f/fTf41t0UvquH/59r7kP2tT+Z/eZlj4b0zTZhNbWccco6PySPpmtOiit4QhTVoKy8iHJy1bCiiirJCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqC9vItPtJbmdwkMSlmY+lT15b8TPFP2y6/sq3f8AcQnMxH8T+n4fz+lcGNxUcHRdR79PU3o0nWnyo57xD4jufEN880zERA/u4c/Ki9vx96pWWoT6dcpPbStDMhyGU/z9RVPcKFy7BVBZicADqTX5tKrUnP2jfvdz6RQio8qWh714d1Ya5o1re4CtIvzKOzA4P6itKsfwlpT6L4ftLWX/AFqqWcejE5I/DOK2K/UaDm6UHU+Kyv6ny87Kb5dgooorcgKKKKACiiigAooooAKKKKACiiigAoorh/iJ45l8PGOxsSBeSLvaQjPlr2wPU1zYjEQwtN1amyNKdOVWSjE7iivn1fF+spP5w1S635zzISPy6V6j4D8dr4kiNrdlY9RjGeOBKvqPf1FeZhM3o4qp7Ozi+l+p1VcJOlHm3R2NFFFe4cIUUUUAFFFFABRRRQAUUUUAFFFFABRRUN5eQ6faS3M7iOGJS7sewFJtJXY0r6IwPHXigeG9JPlsPts+UhHp6t+H88V4k0hdizNuYnJJ6k1f8TeIpfEmrzXkmVQ/LFGf4EHQf1NZW+vzbMca8ZWuvhW3+fzPpMNQ9jCz3e5Lu967/wCF/hf7bc/2tcpmCE4gUj7z92/D+f0rj/DeiTeJNXhsocgN80j/ANxB1P8AnvXvtjZQ6dZw2tugjhiUKqjsK78mwXt6nt5r3Y7eb/4BhjK/JH2cd2T0UUV92eCFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFeGfFF/8AitLwE9Ejx/3wK9zrwj4ptjxtej/Yj/8AQBXzmff7qv8AEvyZ6WA/iv0/yOY3e9S2t5LZXMdxBI0U0bBkdeoNVd9G+vgU2ndH0Fkz33wR4yh8V2HzFY7+EATRDv8A7Q9j+ldNXzPpOsXOiahDeWkhjmjOR6EdwfUGvfvCnii28V6Wt1Adkq/LNCTzG3p9PQ1+gZVmSxUfZVH76/H/AIPc+exeG9k+aPw/kbVFFFfQnnBRRRQAUUUUAFFFFABRRRQAV5N8VvF32q4/sa1f91Ec3DD+J+y/h39/pXZ+PfFa+FtFZ0IN7PlIF9+7fQf4V4G8zSOzuxZ2OWY8kn1r5PO8dyR+rU3q9/Tt8/y9T1sDQ5n7WXyJN3vSgliAMkngAd6h316D8KPCf9p3v9rXSZtbdsQqw4eT1+g/n9K+Tw1CeKqqlDr+HmevVqRpQc2dz8P/AAoPDWkBplH264AeU91HZfw/nXU013WNGZmCqoyWJwAK8z8X/FtYGe00TbI44a7YZUf7g7/U8fWv0adXD5ZQUZOyWy6s+bjCpiptrc7/AFfXbDQoPNvrqO3XsGPzN9B1NcFq/wAZokLJplkZPSW4O0f98jn9RXlt3fz6hcNPczSTzN1eRsk1Fvr5PE55XqO1Fcq+9nr0sDTjrPVnW33xM1+9Jxei3U/wwIF/Xk/rWTN4m1ac5k1O7Y+8zf41kb6N9eJPFV6jvObfzZ3RpU47RRppr+pRnK6jdg+07f41o2fj/X7Igpqc0gHabEg/Wub30m+pjiK0HeM2vmxunCW6R6ZpPxluIyq6jZJMveS3O1vyPB/Su/0HxdpXiNf9DulMuMmF/lkH4H+lfOu+nRzvDIskbsjqcqynBB9jXs4bOsTRdqnvLz3+/wDzOKpgac/h0Z9Q0V5N4N+LMkLR2etsZIjwt5j5l/3x3HvXq0UqTxrJG6vGwyrKcgj1Br7TCYyljIc1J+q6o8SrRnRdpD6KKK7jAKKKKACvBPis2PHF7/uRf+gCve6+f/i02PHV9/uRf+gCvms//wB1j/iX5M9PL/4r9P8AI5bfRvqDfW14X8NT+Kpr23tWAuYbczxoejkMBtz2618HThKrJQgrtnvyaguaWxmb61fDPia68L6ol5bHI+7JET8si9wf8e1YsqvBK8cimORCVZGGCCOoNN30oTlSkpwdmhuKkrPY+oNC1y18RaZFfWb74nHIPVD3U+4rQr5y8EeNZ/CGpiQZlspSBPAO4/vD3FfQun6hb6pZQ3drKs1vKu5HXuK/SstzCOOp66TW6/VHzOJw7oS02ZYooor2DiCiiigAooooAKhu7uKxtZbidxHDEpd3boAOtTV5D8YfGfnTf2FaSfIhDXTKerdQn4dT+HpXDjcXHB0XVlv082dFCi601FHHeLvE8vinWpbx8rCPkhjJ+4g6fieprE31DvoDZOByT2FfllSpKrNzm7tn1cYKCUVsja8N6HceJdYgsIMgucu/ZEHVj/n0r6Js7W00DSo4I9tvaW0eMscAAdST+tc18M/B/wDwjOjCa4TGoXQDS56ovZP8ff6VxXxY8dnULp9FsZf9EhbFw6n/AFjj+H6D+f0r7PCxhlGEeIqr35dPyX6s8Sq3jK3s4fCv6/4Yp+P/AIjTeI5XsrJmh0xTgkcNN7n29B+dcRvqHfRvr5CviKmJqOpUd2z2KdONKPLFE++pLWCa9nWG3iknmbokalmP4Cur8EfDS88UbLu6LWemnkPj55f90env/OvZ9D8Oad4dthDYWqQDHzPjLt9W6mvXwOUVsUlOfux/F+iOOvjIUXyrVnj+k/CTXtQVXnWKwQ8/vny3/fIz+tdFb/BCML+/1dy3pHCAP1Jr1GivqaeS4OmtYuXq/wDKx5UsbWls7HmcnwQtCp2arcK3q0akf0rE1P4M6taqzWdzBegdEOY2P58frXs9FVPJsFNWULejYo42tHrc+YdT0y90a48i+tpbWXsJBjP0PQ/hVTfX09qek2es2jW17bpcwt1VxnHuPQ+4rxXx98NJ/DIe+sS1zpmfmB5eH6+o9/zr5fHZPUwqdSm+aP4o9XD4yFV8stGcXvrufhz8Qn8P3CWF9IW0yQ4Vic+QT3H+z6j8a8/30b68bD4iphqiqU3qjtqUo1YuMj6vVg6hlIZSMgjoaWvMvg94xN/bNot1JungXdbsx5aPuv4fy+lem1+o4XEwxdFVYdfwZ8rWpOjNwYUUUV1mIV89/F1sePL7/ci/9AFfQlfO/wAX2x4+v/8Aci/9AFfM8Qf7pH/EvyZ6mXfxn6f5HI7/AHr0X4GtnxVd/wDXm3/oaV5tur0b4FtnxZd/9ebf+hpXyOWf75S9T2cUv3EvQ6r4p/Dz+1on1jTY/wDTUGZ4VH+uUdx/tD9a8T3V9bV458Wfh19nMuuaXF+6J3XUCD7p/wCegHp6j8fWvos5yy98VQXqv1/z+88zBYralUfp/keWb/eu1+HHxBfwpei1umL6VO3zjr5Tf3x7eorht9G6vkaFephqiq03Zo9mpTjUi4y2PreGZLiJJYnWSNwGV1OQQehFPrw74V/Ef+xpo9I1KX/QJGxDMx/1LHsf9k/pXuAORX6hgcbTxtL2kN+q7M+Vr0JUJ8rFooor0DmCiiorq5israW4ncRQxKXd2PCgck0m0tWBz3j/AMXJ4Q0J5lIN7NmO3Q92/vfQdfy9a+cpbh55XlkcvI7FmZuSSepNbPjfxbL4v12W7OVtk/d28Z/hT1+p6n/61c/ur8yzTHPG1vd+GO3+fzPqsJh/Yw13e5Jv969F+EPg3+2dR/ta7TNlaN+6VhxJJ/gvX64rifDehXHibWbfT7YfPK3zPjhFHVj9K+koYtP8HeHgoIt7CyiyWPXA6n3JP5k11ZNglXqPEVfgj+f/AANzHG1/Zx9nD4mYPxO8ZDwtohigfGo3YKRY6oP4n/Dt7mvn0vk5JyfU1peKvE0/irW7jUJ/lDnbFGT/AKtB0H+PuTWRurhzLGvG13JfCtF/n8zowuHVCnZ7vck3+9eh/C/4e/8ACQyjU9RQ/wBmxtiOM/8ALdh/7KP1/OuU8GeGZvF2vQWMeVh+/PIP4Ix1/E9B9a+mLOzh0+1htreMRQRKERF6ACvRybLliZe3qr3Vt5v/ACRy43EeyXs4bskRFjUKoCqBgADAAp1FFfoJ86FFFFABRRRQAU2SNZY2R1DowIZWGQR6GnUUAfPfxM8Gf8Ilqwlt1P8AZt0S0X/TNu6f4e30rjd/vX0v458PL4m8M3lntBmC+ZCfSReR+fT8a+ZN2OCMHuDX5pm+DWEr3h8MtV+qPqMFW9tT97dGjo2sTaHqtrfwHEkEgcD1HcfiMivqGwvYtSsre6gbdDPGsiH2IyK+Td1e+/BjVzqPg9bdjl7OVov+An5h/Mj8K7+H8Q41ZUHs1deq/wCB+Rz5jSvBVF0O9ooor7w+fCvnP4xNj4gX/wDuRf8AosV9GV83/GVsfELUP9yL/wBFivmOIf8AdI/4l+TPVy3+M/T/ACOP3+9ekfAc58W3n/Xm3/oaV5jvr0v4Btnxdef9eTf+hpXyGV/77S9T2sX/AAJeh73SModSrAMpGCD0NLRX6sfIHgfxU+HTeGrhtT0+MnS5W+dFH+oY9v8AdPb06eled7/evru6tYb22lt541lhlUo6OMhgeoNfOPxJ8AzeCtS8yENLpU7HyZTyUP8Acb39D3H41+f5xln1dvEUV7r3Xb/gfkfR4LF+0Xs57/mcluzXsXwj+JXm+VoWqS/OPltLhz970jJ9fQ/h6V4vvpRIVIIJBHII7V4eDxlTBVVVh813R6FejGvDlkfYtFea/Cf4lDxHbrpWpSAapEv7uRv+XhR/7MO/r19a9Kr9Sw2Jp4qkqtN6P8PI+Rq0pUZuEgrxz41+N9zf8I9ZycDD3bKfxVP6n8Peu9+IPjGLwZ4fkushruX93bRn+J/X6Dqf/r18xz3Ul1PJNM7STSMXd25LE8kmvnM9x/sofVqb1e/ku3z/AC9T1Mvw/PL2stlt6jt/vRvqHfXo3wc8EnxBq39qXcedPsmBUMOJZeoH0HU/hXxeGoTxVWNGG7/q57lWpGjBzl0PRfhP4K/4RjRftd1HjUrwBnBHMadVT+p9/pXGfGnxuL68/sG0kzBbsGuWU8NJ2X6Dv7/SvQfiV40Twb4feSNgdQuMx2yH17t9B/PFfNEk7Suzuxd2JZmbkknqTX1WbYiGDoRwFDtr/Xd7v/gnkYOnKvUeIqfL+vIk3+9Ku52VVBZmOAoGST6VBvr1L4J+Cv7Tvjrt3Hm1tm226sPvyd2+i/z+lfL4TDzxdaNGHX8F3PWrVY0YOcj0b4a+DR4R0FRMo/tC5xJcN6Hsn0H88111FFfrNGjChTjSgtEfHTm6knOW7CiiitiAooooAKKKKACiiigAr5b8cWI0rxfq9so2otwzKPQN8w/nX1JXzT8W2A+IOq7fWP8APy1r5TiKK+rwl1T/AEf+R6+WP95JeRyu/wB69a+AF6ftesWueGSOUD6Eg/zFeP769Q+ADE+JdS9Psn/s618vlMmsdT9f0Z62NV6Ej3aiiiv1M+SCvmr40Nj4iah/1zh/9FivpWvmb41tj4jaj/1zh/8ARa18vxD/ALpH/EvyZ62W/wAZ+n6o4zfXpv7P7Z8X3v8A15N/6GleWb69P/Z7bPjC9/68W/8AQ0r4/K/99pep7WL/AIE/Q+g6KKK/WD48Kpaxo9pr2mz2N7EJraZdrKe3oR6EetXaKmUVJOMldMabTuj5W8deDLvwRrDWs2ZLWTLW9xjiRff0YdxXN76+tfFfhay8X6PLp96vytzHKB80T9mH+ea+W/FHhu98I6xNp18mJE5SQD5ZF7Mvt/KvzTNstlgp89P4H+Hl/kfU4PFKvHll8SKdteS2dxHPBI0M0bB0kQ4KkdCK+jfhz8TbXxXo8n26SO21Gzj33AJwrIOsg9vX0/KvmjfSrM0edrFcgqdpxkHqK48BmFTATco6p7o2xGGjiI2e/c6v4heNJPGniGW6BK2UWY7aM9k9T7nr+Q7VzO+od9Jvrgq1Z1pupN3bOiEFCKjHZGz4c0O58T61babaDMszYLdkXux9gK+pdM0+w8H+H47eMrBZWcRLSN6AZZj7nk1x/wAG/An/AAjOi/2heR7dTvlDEMOYo+oX6nqfwHauY+O3jzLDw3ZScDD3jKfxWP8Aqfwr7bBU45Rg3i6y9+Wy/Jfq/wDgHhV5PGVlRh8K/q5wHjvxhL4y8QzXrZW3X93bxE/cjHT8T1P1rnd9Q76XdmvialWdabqTd2z3YwUIqMdkbvhPw7ceLddttNtsgyHMknaNB95j/nrivqrStMt9F063sbSMR28CBEUeg/r3rjPhD4G/4RPQRdXUe3U70B5cjmNP4U/qfc+1d9X6Pk2A+qUfaTXvy/BdF/n/AMA+Zx2I9tPljsgoorE8W+MNO8GaZ9s1CQgMdscSDLyN6KP69q96c40ouc3ZI8+MXN8sVdm3RXiw/aOX7VzoZ+zZ6i5+fH024r1Dwr4s07xhpa32nSl0zteNhh429GFcOHzDDYuThRnd/Nfmb1MNVormnGyNmiiivROYKKKKACiiigAr5O8b6oureL9YulOUe5cKc9VB2j9BX0V8R/E6eE/CV7d7gtw6+TbjuZGGB+XJ/CvlTf75r4fiPEJuFBer/Jfqe9llN+9UfoTb69g/Z3tC91rV3j5VSOIH3JYn+QrxnfX0f8DdGOmeB47h1xJfStP/AMB+6v6DP415WR0nUxsZfypv9P1OzHz5aDXc9Dooor9NPlQr5h+NzY+JGo/9c4f/AEWtfT1fLvxybHxK1H/rnD/6LWvl+Iv90j/iX5M9bLP4z9P1RxG+vUv2d2z4yvv+vFv/AEYleT7q9U/ZzbPjO+/68G/9GJXxuVf77S9T28X/AAJ+h9F0UUV+tHxwUUUUAFcv8QPAtr460ZreTEN5Flra5xyjeh9VPcV1FMmmjt4XllcRxRqWZ2OAoHJJrKrShWg6dRXT3LhKUJKUdz411fS7vQtSnsL6FoLqFtrof5j1B7Gqe+ul+Jvjb/hN/FE13GAtnCPJthjBKA/ePuTz7cVym6vxyuqcKso0neKejPtqblKCc1Zk2+vSPgt4E/4SjWv7Su492mWLA4YcSy9Qv0HU/gO9cF4d0O68T6za6ZZLunuH2g9lHdj7Ac19ceH9EsvB3h+CxtyIrW1jJeR+Mnqzsffk172S4D61V9tUXuR/F/1qzz8diPZQ5I/EzO+IfjOHwR4cmvTta7f93bRH+OQ/0HU/SvlK6vJb25luJ5Glnlcu7t1Zickmuj+J3jp/HHiSSdGI063zFaof7ueWI9W6/TA7VyO6ufN8f9dr2g/cjovPu/66GmCw3sKd5fE9ybfXpvwR8C/8JFrJ1e8jzp9i4KBhxLL1A+i9T+FefeG9CuvFGt2umWa7p53xu7Ivdj7Ac19d+HdBtfDGi2umWa7YLdNoJ6se7H3Jya6ckwH1qr7aa92P4v8ArUyx+I9lDkju/wAjSooor9JPlwr5x+P+oyz+N47VmPk21qmxewLEkn+X5V9HV8yfHtsfEWf/AK9ov5GvmuIG1g9O6/U9XLVev8jgd9epfs9ajLF4vu7RWPkz2jOy9tysuD/48fzryfdXpf7PjZ8fv/15S/8AoSV8TlcmsbSt3PdxaToT9D6Uooor9bPjQooooAKjnnjtYJJppFiijUs7ucBQOpJqhr/iTTfDFi13qd3HawjpvPzMfRR1J+lfOvxL+L1141ZrGyD2Wjg/6snDzehfHb/Z/OvJx+ZUcDD3neXRf1sjsw+FniHpou5D8VPiAfG+uAW5YaXaZS3U8bz3c/Xt7VxO+od1Jvr8tr154ipKrUd2z62nTjTioR2Rs+G9Fn8S67ZaZbg+ZcyBCf7q9Wb8Bk19gWNlFp1lBaQLshgjWNF9FAwK8s+BHgJtG05tevotl5eJtt0Ycxxdc/VuPwA9a9ar9DyLBPDUPazXvT/Lp/mfNZhXVWpyR2X5hRRRX0p5YV8sfHVsfEzUv+ucP/ota+p6+VPjw2PidqX/AFzh/wDRa18txH/ukf8AEvyZ6+Wfxn6fqjhN9er/ALODZ8a33/Xg3/oxK8i3V6z+zY2fG1//ANeDf+jEr43Kv99pep7eM/gT9D6Tooor9bPjQooooAK8U/aA+IX2WAeGbGX99KA946n7qdo/x6n2x616N8QfGlv4F8NXGoy4ec/u7eEn/WSHoPoOp9hXyBqGo3GqX095dStNczuZJJG6sxPNfJZ9mHsaf1am/elv5L/g/kezl+G9pL2stlt6jd9G+od1ek/BL4fnxhr/ANuvI92k2DBnDDiWTqqfTufwHevhMPQniasaNPdn0FWpGlBzlsj1L4G/D/8A4RvRf7XvYtupX6AqrDmKLqB7E9T+A7VkftAfEH7Dajw1YyYnnUPeMp+7H2T6t1Pt9a9H8d+MLbwP4budTnwzqNkEOf8AWSH7q/1PsDXx7qeqXOsahcX13IZrm4cySOe5NfZ5pXhl2FjgaG7Wvp1+b/I8PCU5Yqq8RU2X9fgM30b8VDur0f4KeAD4x8Q/bLuMtpVgweTcOJZOqp9O59vrXxmHoTxNWNGnuz3KlSNKDnLZHqvwM8AHw3on9rXse3Ur9QVVhzFF1A+p6n8PSvUKTpS1+vYbDwwtGNGGy/q58XVqyrTc5dQooorqMgr5g+P7Y+I0/wD17RfyNfT9fLf7QTY+JE//AF6w/wAjXzHEP+5r/Ev1PWy3+O/Q89316d+zw2fiA/8A15S/+hJXle6vUP2dWz8Qn/68Zf8A0JK+Jyz/AH2l6o93FfwJ+h9OVxvjr4p6N4CKw3bSXV867ltLcAsB6sTwo/ziuyr4o8Varcaz4l1S8uWYzy3Lk57YYgD8AAPwr73OMwngKUfZL3pfhY+dwWGjiJvm2R7LP+03HtPkeH33djJdDH6LXM61+0L4k1JGSzS10xDxuiTe/wCbcfpXle6jdXw9TN8dVVnUfysvyPoI4KhF3Uf1NDUtYvdZumub+7mvLhuskzlj+vSqu+od1TWdtcahcx21rDJcXEhwkUSlmY+wFeS25u71bOyyig316x8HfhPJ4juIda1eEppMZ3QwuMG5Yd8f3B+v0ra+G/wBMbxaj4oUEjDR6apyP+2hHX/dH4+le5IixIqIoRFGFVRgAegr7LKskk5KvilZdI/5/wCX3nh4vHpJ06L+f+QoAUAAYA4AFLRRX3h88FFFFABXyf8AHxsfFDUx/wBM4f8A0WtfWFfJfx/bHxS1Mf8ATKD/ANFrXyvEf+5x/wAS/Jnr5X/Hfp+qOB3V65+zQ2fHF/8A9g9v/RiV47u969e/ZkbPjm//AOwe3/oyOvjMp/36l6nu4z/d5+h9NUUUV+unxYUjMEUsxAUDJJ7UtUNetZb7Q9RtoDiaa2kjQ+jFSB+pqZNpNoaV3Y+VPi38QX8d+JneFyNLtCYrVM8MM8v9Wx+QFcPuqORHt5GikUpJGSrKwwVI4INN3+9fitetPEVJVam7Pu6cI04qEdka3h/RLvxNrNpplinmXNy4RfRR3Y+wGSfpX2T4T8NWfgzw9a6Za4EMCZeQ8F26s5+przv4AfDo+HdG/t2/i26lfoPKVxzDCeR9C3U+2Peuv+LV1cWfw38QS2pKzC2IyvUKSAx/75Jr77KMH9Rw0sXUXvNX9Fvb5nzuNr/WKqoxel7fM+efjJ8Qz448StHbSZ0myJjtwDw5/ik/HHHsB61wO6od3vRv96+Cr154mrKrUerPoqdONKChHZGnomk3XiHVrXTbKPzbq5cRov8AMn2A5P0r7K8G+FbXwZ4dtNKtRlYlzJJjBkc/eY/U/pivNf2evh3/AGPpZ8R38WL29TFsrDmOH+99W/lj1r2Wv0HIsv8Aq9L6xUXvS28l/wAE+bzHE+1n7OOy/MKKKK+qPHCiiigAr5X/AGhWx8Sp/wDr1h/ka+qK+U/2iWx8TLj/AK9Yf5Gvl+Iv9zX+Jfkz1ss/j/I853V6l+zi2fiG/wD14y/+hJXk+73r1T9m5s/EV/8Arxl/9CSviMs/32l6o9/F/wACfofUlfPHxb+Cep/21c6xoFsb61unMstrHjzInP3io/iBPPHIzX0PRX6fjcDSx9P2dX5Nbo+ToYieHlzQPi6P4feKJW2r4e1Mn3tXH8xWzpvwU8Z6mwxo7Wqn+O6lVAPwzn9K+uKK8CHDWHT96bf3L9D0XmlV7RR4J4d/ZlcssmuasoXqYLFeT7b2/wAK9e8MeB9E8HQeXpVhHbsRhpj80j/Vjya3aK93DZdhcJrShr33Z59XFVa2k5aBRRRXpHKFFFFABRRRQAV8j/tAtj4qap/1yg/9FLX1xXyF+0I2Pitqo/6ZQf8Aopa+U4k/3OP+Jfkz2Mr/AI79P1R5/u+lewfswnPjvUP+wc3/AKMjrxnfXsX7LrZ8eah/2Dn/APRkdfF5T/v1L1Pdxv8Au8/Q+oaKKK/Xz4oKKKKAPMPiB8BtI8aahJqNvcPpOoSnMrxoHjlPqV459wazfCP7NukaHfx3mqXsmsvEwZIDGI4sjpuGSW+mcV7DRXlyyvByq+2dNc39dNvwOtYuuociloIAAAAMAVFeWkOoWk1rcRiWCZDHJG3RlIwR+VTUV6bSaszkPmHxj+znr2mahK+gqmqaexzGjSKk0Y/uncQDj1B/CrvgD9nTVLjUobvxMsdnYxMGNmkgeSbHYkcKvrzmvpGivnVkGCVX2tn6X0/z/E9R5jXcOS/z6jURY0VEUKqjAUDAA9KdRRX0Z5YUUUUAFFFFABXyf+0W2Pidcf8AXrD/ACNfWFfJf7R7Y+KFx/16Q/yNfLcR/wC5L/EvyZ6+V/x/kebbvpXqv7NbZ+I7/wDXhL/6EleSb69X/ZnbPxIf/rwl/wDQkr4fK/8AfaXqj6DF/wACfofVlFFFfsJ8QFFFFABRRRQAUUUUAFFFFABRRRQAV8fftDnHxY1X/rlB/wCilr7Br45/aKbHxa1b/rlB/wCilr5TiT/c4/4l+TPYyr+O/T9Ued7q9l/ZZOfHuo/9g5//AEZHXiu+vZv2VTnx/qP/AGDX/wDRkdfFZS/9upep72N/3efofVNFFFfsB8SFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABXyP+0kcfFK4/wCvSH+Rr64r5D/aVbHxUuf+vSD+Rr5biP8A3Jf4l+TPXyv+O/T/ACPMd1etfsxnPxKf/rwl/wDQkryDfXrf7MDZ+Jj/APYPm/8AQkr4bK3/ALbS9UfQYv8A3efofWlFFFfsR8QFFFFABRRRQAUUUUAFFFFABRRRQAV8a/tHNj4uat/1yt//AEUtfZVfNH7UHw4vm1ZPFdjA9zaPCsV4IxkxMvCuR/dIwM9se9fM8Q0p1cFeCvytN+mq/U9bLJxhX957qx4Bvr2n9lFs/EDUv+wa/wD6NjrxASA9DmvqP9mD4c32gWt74i1OB7WW+jENrDKMP5WdxcjtkgY9hnvXxOSUp1cdTcVotX5HvY+cYYeSb3PeaKKK/XD4sKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvj79plsfFW5/69IP5GvsGvmL9qvwVeRa1aeJ4ImlsZYVtrh1GfKdSdpPoCDjPqPcV8zxDTlPAtxV7NN+mp6uWSUcRr1R4Nvr179lxs/E2T/sHzf8AoSV43vr6I/ZS8FXi3994ouImiszCbW1LDHmksC7D2G0DPqT6V8Lk8JVMdS5Vs7/JH0WOko4edz6Uooor9gPiAooooAKKKKACiiigAooooAKKKKACkIDAgjIPUGlooAx4vBugQXv2yLRNOju8589bWMPn1zjNbFFFRGEYfCrDbb3YUUUVYgooooAKKKKACiiigAooooAKKKKACiiigAooooAKjuLeK7geGeNJoXBV45FDKw9CD1qSijcDiF+CfgVb77WPDNl527djadmf9zO39K7SGGO3iSKJFiiQBVRBgKB0AHan0VjTo0qN/ZxSv2SRpKpOfxNsKKKK2MwooooAKKKKACiiigAooooAKKKKAP/Z";
  function loadLogo() {
    return new Promise(function (res) {
      var im = new Image(); im.onload = function () {
        try {
          var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
          var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0);
          c.toBlob(function (b) { if (!b) return res(null); b.arrayBuffer().then(function (ab) { res({ bytes: new Uint8Array(ab), w: c.width, h: c.height }); }); }, "image/jpeg", 0.92);
        } catch (e) { res(null); }
      }; im.onerror = function () { res(null); }; im.src = LOGO;
    });
  }
  function makeAll(meta) {
    return loadLogo().then(function (lg) { meta.logo = lg; return makeAll2(meta); });
  }
  function makeAll2(meta) {
    var attempts = [[2000, 0.82], [1700, 0.72], [1400, 0.62], [1100, 0.55]], idx = 0;
    function once() {
      var side = attempts[idx][0], q = attempts[idx][1], out = [], chain = Promise.resolve();
      st.pages.forEach(function (pg, i) {
        chain = chain.then(function () {
          progress(0.05 + 0.6 * (i / st.pages.length), "Processando página " + (i + 1) + " de " + st.pages.length + "…");
          return render(pg, side).then(function (c) { return blobOf(c, q).then(function (b) { return b.arrayBuffer().then(function (ab) { out.push({ bytes: new Uint8Array(ab), w: c.width, h: c.height, tipo: pg.tipo }); }); }); });
        });
      });
      return chain.then(function () { progress(0.7, "Montando o PDF…"); var pdf = buildPdf(out, meta); if (pdf.size > LIMIT_BYTES && idx < attempts.length - 1) { idx++; return once(); } return pdf; });
    }
    return once();
  }

  function protocol(d) { var al = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = ""; for (var i = 0; i < 4; i++) r += al[Math.floor(Math.random() * al.length)]; return "MP-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + "-" + r; }
  function safeName(s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40); }

  /* ---------- envio ---------- */
  function destEmail() { return (CFG.email || S.email || "").trim(); }
  function sendMail(file, meta) {
    var to = destEmail();
    if (!to || /seudominio|example\./i.test(to)) return Promise.resolve("noconfig");
    if (!navigator.onLine) return Promise.resolve("offline");
    function fd() {
      var f = new FormData();
      f.append("_subject", "Novos documentos - " + meta.nome + " - " + meta.protocolo);
      f.append("_template", "table"); f.append("_captcha", "false"); f.append("_honey", "");
      f.append("Protocolo", meta.protocolo); f.append("Data de envio", meta.data); f.append("Horário de envio", meta.hora);
      f.append("Nome", meta.nome); f.append("CPF", meta.cpf); f.append("Telefone", meta.tel); f.append("E-mail do cliente", meta.mail || "-");
      f.append("Processo", meta.proc || "-"); f.append("Assunto", meta.assunto); f.append("Observações", meta.obs || "-");
      f.append("Páginas (com ficha)", String(st.pages.length + 1)); f.append("Tamanho do PDF", mb(file.size));
      f.append("Aparelho", (navigator.userAgent || "").slice(0, 160));
      if (meta.mail) f.append("email", meta.mail);
      f.append("attachment", file, file.name); return f;
    }
    var ajax = CFG.endpoint || ("https://formsubmit.co/ajax/" + encodeURIComponent(to));
    return fetch(ajax, { method: "POST", body: fd(), headers: { Accept: "application/json" } }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (r.ok && (j.success === true || j.success === "true")) return "ok"; throw new Error("rej"); });
    }).catch(function () {
      if (CFG.endpoint) return "fail";
      // segunda via: envio de formulário comum (resposta opaca, sem confirmação)
      return fetch("https://formsubmit.co/" + encodeURIComponent(to), { method: "POST", body: fd(), mode: "no-cors" }).then(function () { return "uncertain"; }).catch(function () { return "fail"; });
    });
  }

  $("#btnSend").addEventListener("click", function () {
    if (st.busy) return; st.busy = true; $("#btnSend").disabled = true; $("#back3").disabled = true; $("#err3").textContent = "";
    var now = new Date(), d = st.data;
    var meta = { endereco: S.endereco || "", dateObj: now, protocolo: protocol(now), data: fmtDate(now), hora: fmtTime(now), nome: d.nome, cpf: d.cpf, tel: d.tel, mail: d.mail, proc: d.proc, assunto: d.assunto, obs: d.obs };
    progress(0.03, "Preparando…");
    makeAll(meta).then(function (pdf) {
      var name = "Documentos_" + safeName(d.nome) + "_" + meta.protocolo + ".pdf", file = new File([pdf], name, { type: "application/pdf" });
      st.pdf = file; st.protocolo = meta.protocolo; progress(0.8, "Enviando ao escritório (" + mb(file.size) + ")…");
      return sendMail(file, meta).then(function (res) { progress(1, "Concluído"); finish(res, meta, file); });
    }).catch(function (e) {
      $("#err3").textContent = "Não foi possível preparar o PDF neste aparelho. Tente com menos páginas ou fotos menores."; if (window.console) console.error(e);
    }).then(function () { st.busy = false; $("#btnSend").disabled = false; $("#back3").disabled = false; });
  });

  function finish(res, meta, file) {
    var okish = res === "ok" || res === "uncertain";
    st.sent = okish;
    var icon = $("#doneIcon"); icon.classList.toggle("warn", !okish);
    icon.innerHTML = okish ? '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17v.01"/></svg>';
    $("#doneTitle").textContent = res === "ok" ? "Documentos enviados" : res === "uncertain" ? "Envio realizado" : "Envio não concluído";
    $("#doneMsg").textContent = res === "ok" ? "O escritório recebeu os seus documentos por e-mail. Guarde o número do protocolo."
      : res === "uncertain" ? "Seu envio foi entregue ao serviço de e-mail, mas não houve confirmação de recebimento. Para garantir, avise o escritório pelo WhatsApp informando o protocolo."
      : res === "offline" ? "Você está sem internet. Seu PDF foi gerado: baixe a cópia e envie pelo WhatsApp, ou tente novamente quando estiver conectado."
      : res === "noconfig" ? "O envio automático por e-mail ainda não foi configurado neste site. Seu PDF foi gerado: baixe a cópia e envie pelo WhatsApp do escritório."
      : "Não foi possível enviar automaticamente. Seu PDF foi gerado: baixe a cópia e envie pelo WhatsApp do escritório.";
    var r = $("#doneInfo"); r.innerHTML = "";
    [["Protocolo", meta.protocolo], ["Data", meta.data], ["Horário", meta.hora], ["Cliente", meta.nome], ["Páginas", String(st.pages.length + 1) + " (com ficha)"], ["Tamanho", mb(file.size)]].forEach(function (x) { dl(x[0], x[1]).forEach(function (n) { r.appendChild(n); }); });
    var wa = digits(CFG.whatsapp || S.whatsapp || "");
    $("#btnWa").href = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Olá! Sou " + meta.nome + ". " + (okish ? "Enviei meus documentos pelo site." : "Não consegui enviar pelo site, vou mandar o PDF por aqui.") + " Protocolo: " + meta.protocolo);
    try { var can = navigator.canShare && navigator.canShare({ files: [file] }); $("#btnShare").hidden = !can; } catch (e) { $("#btnShare").hidden = true; }
    go(4);
  }
  $("#btnDownload").addEventListener("click", function () {
    if (!st.pdf) return; var a = document.createElement("a"); a.href = URL.createObjectURL(st.pdf); a.download = st.pdf.name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 1500);
  });
  $("#btnShare").addEventListener("click", function () { if (st.pdf && navigator.share) navigator.share({ files: [st.pdf], title: "Documentos " + st.protocolo }).catch(function () {}); });
  $("#btnNew").addEventListener("click", function () { st.pages = []; st.pdf = null; st.sent = false; drawPages(); $("#progress").hidden = true; go(2); });

  window.addEventListener("beforeunload", function (e) { if (st.pages.length && !st.sent) { e.preventDefault(); e.returnValue = ""; } });
  drawPages();
  window.__scan = st;
})();
