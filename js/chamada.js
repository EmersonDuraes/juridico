/* ============================================================
   Atendimento por vídeo — chamada, chat e gravação local
   Usa PeerJS (WebRTC ponto a ponto). A gravação (vídeo + áudio) e o
   registro do chat são salvos no próprio dispositivo de quem usa a página.
   ============================================================ */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hms(s) { return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60); }
  function clock(d) { d = d || new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }
  function stamp() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "_" + pad(d.getHours()) + pad(d.getMinutes()); }
  function initials(n) { var p = (n || "?").trim().split(/\s+/); return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); }
  var COLORS = ["#b8903f", "#4f72ad", "#7f5fa6", "#3f8c7a", "#b45a4e", "#5a6f8f"];
  function colorFor(s) { var h = 0; s = s || ""; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return COLORS[h % COLORS.length]; }
  var CH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function rnd(n) { var s = ""; for (var i = 0; i < n; i++) s += CH[Math.floor(Math.random() * CH.length)]; return s; }

  var SVG_MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/></svg>';

  /* ---------------- estado ---------------- */
  var st = {
    name: "", role: "Cliente", room: "", host: false, hostId: "", myId: "",
    peer: null, local: null, camTrack: null, screenTrack: null, sharing: false,
    parts: {}, conns: {}, calls: {}, pinned: null, entered: false, ended: false,
    log: [], msgCount: 0, unread: 0, typingTimers: {}, lastTyping: 0,
    mic: true, cam: true, volume: 1,
    rec: null, chunks: [], recStart: 0, recTimer: null, drawTimer: null, actx: null, adest: null, srcNodes: {}, canvas: null, ctx: null,
    files: {}, dummy: null
  };

  var lobby = $("#lobby"), app = $("#app"), endedBox = $("#ended");

  function toast(t) { var e = $("#toast"); e.textContent = t; e.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove("show"); }, 3200); }
  function ticker(t) { var e = $("#ticker"); if (e) e.textContent = t; }
  function sys(text) {
    var box = $("#msgs"), d = el("div", "sys", "[" + clock() + "] " + text); box.appendChild(d); box.scrollTop = box.scrollHeight;
    st.log.push("[" + clock() + "] * " + text); ticker(text);
  }

  /* ---------------- mídia local ---------------- */
  function getMedia() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve(null);
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
    }).catch(function () {
      return navigator.mediaDevices.getUserMedia({ audio: true }).catch(function () { return null; });
    });
  }
  function dummyStream() {            // usado quando não há câmera/microfone
    if (st.dummy) return st.dummy;
    var c = document.createElement("canvas"); c.width = 320; c.height = 240;
    var g = c.getContext("2d");
    function paint() { g.fillStyle = "#0c1630"; g.fillRect(0, 0, 320, 240); g.fillStyle = "#e8d29c"; g.font = "48px serif"; g.textAlign = "center"; g.fillText(initials(st.name), 160, 135); }
    paint(); setInterval(paint, 1000);
    st.dummy = c.captureStream(2); return st.dummy;
  }
  function outStream() { return st.local || dummyStream(); }
  function track(kind) { return st.local && st.local[kind === "audio" ? "getAudioTracks" : "getVideoTracks"]()[0]; }

  /* ---------------- sala de espera ---------------- */
  var params = new URLSearchParams(location.search);
  var preMic = true, preCam = true;

  function setPreview() {
    var pv = $("#preview"), box = pv.parentNode;
    pv.srcObject = st.local || null;
    var hasV = !!track("video");
    box.classList.toggle("off", !hasV || !preCam);
    $("#pvMic").classList.toggle("off", !preMic || !track("audio"));
    $("#pvCam").classList.toggle("off", !preCam || !hasV);
  }
  function initLobby() {
    var saved = ""; try { saved = localStorage.getItem("ed_call_name") || ""; } catch (e) {}
    $("#fName").value = saved;
    var room = (params.get("sala") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (room) { $("#fRoom").value = room; }
    if (!navigator.mediaDevices) { $("#lobbyErr").textContent = "Este navegador/endereço não permite câmera. Abra o site em https://."; }
    getMedia().then(function (s) { st.local = s; setPreview(); if (!s) $("#lobbyErr").textContent = "Não foi possível acessar câmera/microfone. Você poderá participar pelo chat."; });

    $$(".seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".seg button").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
        st.role = b.getAttribute("data-role");
        var esc = st.role === "Escritório";
        $("#btnCreate").hidden = !esc;
        $("#consentTxt").innerHTML = esc ? "Estou ciente de que devo <b>informar o cliente</b> sempre que iniciar a gravação. A gravação e o chat serão salvos neste dispositivo e protegidos por sigilo profissional." : "Estou ciente de que o escritório poderá gravar esta chamada e de que <b>não é permitido ao cliente gravar, fotografar ou divulgar</b> o atendimento. As informações são protegidas por sigilo profissional.";
        $("#lobbyHint").textContent = esc ? "Crie uma sala e envie o link ao cliente, ou entre numa sala existente com o código." : "Use o link ou o código que o escritório enviou.";
      });
    });
    $("#pvMic").addEventListener("click", function () { preMic = !preMic; setPreview(); });
    $("#pvCam").addEventListener("click", function () { preCam = !preCam; setPreview(); });
    $("#lobbyForm").addEventListener("submit", function (e) { e.preventDefault(); start(false); });
    $("#btnCreate").addEventListener("click", function () { start(true); });
  }
  function lobbyErr(t) { $("#lobbyErr").textContent = t || ""; }

  /* ---------------- iniciar / entrar ---------------- */
  function iceServers() {
    var c = (S.chamada && S.chamada.ice) || null;
    return (c && c.length) ? c : [{ urls: "stun:stun.l.google.com:19302" }];
  }
  function start(host) {
    var name = $("#fName").value.trim();
    if (!name) { lobbyErr("Informe seu nome."); return; }
    if (!$("#fConsent").checked) { lobbyErr("Marque a autorização de gravação para entrar."); return; }
    var room = host ? rnd(6) : $("#fRoom").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (room.length < 4) { lobbyErr("Informe o código da sala."); return; }
    if (typeof Peer === "undefined") { lobbyErr("Não foi possível carregar o serviço de chamadas. Verifique a internet."); return; }
    lobbyErr("");
    try { localStorage.setItem("ed_call_name", name); } catch (e) {}

    st.name = name; st.host = host; st.room = room;
    st.mic = preMic && !!track("audio"); st.cam = preCam && !!track("video");
    if (track("audio")) track("audio").enabled = st.mic;
    if (track("video")) track("video").enabled = st.cam;
    st.hostId = "edurp-" + room;
    st.myId = host ? st.hostId : st.hostId + "-" + rnd(4);
    $("#btnJoin").disabled = true; $("#btnCreate").disabled = true;

    var p = st.peer = new Peer(st.myId, { config: { iceServers: iceServers() }, debug: 1 });
    p.on("open", function () {
      if (host) enterApp();
      else link(st.hostId);
    });
    p.on("connection", function (c) { setupConn(c, false); });
    p.on("call", function (call) { call.answer(outStream()); setupCall(call); });
    p.on("error", function (e) {
      var t = e && e.type;
      if (t === "unavailable-id" && host) { try { p.destroy(); } catch (x) {} start(true); return; }
      if (t === "peer-unavailable" && !st.entered) {
        lobbyErr("Sala não encontrada. Confira o código ou aguarde o escritório iniciar a sala.");
        try { p.destroy(); } catch (x) {} resetLobbyButtons(); return;
      }
      if (!st.entered) { lobbyErr("Falha ao conectar (" + (t || "erro") + "). Tente novamente."); resetLobbyButtons(); }
      else if (t !== "peer-unavailable") { toast("Conexão instável: " + (t || "erro")); }
    });
    p.on("disconnected", function () { if (st.entered && !st.ended) { toast("Reconectando…"); try { p.reconnect(); } catch (e) {} } });
  }
  function resetLobbyButtons() { $("#btnJoin").disabled = false; $("#btnCreate").disabled = false; }

  /* ---------------- entrar na interface da chamada ---------------- */
  function inviteLink() { return location.href.split("?")[0].split("#")[0] + "?sala=" + st.room; }
  function enterApp() {
    if (st.entered) return; st.entered = true;
    lobby.hidden = true; app.hidden = false; document.body.classList.add("in-call");
    $("#roomTag").textContent = "SALA " + st.room;
    $("#waitCode").textContent = st.room;
    $("#btnWa").href = "https://wa.me/?text=" + encodeURIComponent("Atendimento por vídeo — Martins & Pamplona Advocacia. Entre na sala pelo link: " + inviteLink() + " (código " + st.room + ")");
    var me = ensurePart("me"); me.name = st.name + " (você)"; me.role = st.role; me.cam = st.cam; me.mic = st.mic;
    me.stream = st.local; me.tile.video.srcObject = st.local; me.tile.video.muted = true; updateTile(me);
    syncControls(); layout(); renderPeople();
    sys("Você entrou na sala " + st.room + ".");
    if (!st.host) sys("Conectando aos participantes…");
    $("#btnRec").hidden = !st.host && st.role !== "Escritório";
    $("#recLbl").textContent = st.role === "Escritório" ? "Gravação parada" : "Sem gravação";
    try { history.replaceState(null, "", "?sala=" + st.room); } catch (e) {}
  }

  /* ---------------- participantes e blocos de vídeo ---------------- */
  function buildTile(id) {
    var t = el("div", "tile" + (id === "me" ? " me" : "")); t.setAttribute("data-id", id);
    var v = document.createElement("video"); v.autoplay = true; v.playsInline = true; v.setAttribute("playsinline", ""); if (id === "me") v.muted = true;
    var off = el("div", "tile__off"), av = el("div", "tile__av"); off.appendChild(av);
    var nm = el("div", "tile__name"), mic = el("div", "tile__mic"); mic.innerHTML = SVG_MIC;
    t.appendChild(v); t.appendChild(off); t.appendChild(nm); t.appendChild(mic);
    t.addEventListener("click", function () { if (t.parentNode && t.parentNode.id === "thumbs") { st.pinned = id; layout(); } });
    return { el: t, video: v, av: av, nm: nm };
  }
  function ensurePart(id) {
    if (st.parts[id]) return st.parts[id];
    var p = st.parts[id] = { id: id, name: "Participante", role: "", stream: null, cam: true, mic: true, tile: buildTile(id) };
    p.tile.video.volume = st.volume;
    return p;
  }
  function updateTile(p) {
    var t = p.tile;
    t.nm.textContent = p.name + (p.role && p.id !== "me" ? " · " + p.role : "");
    t.av.textContent = initials(p.name.replace(" (você)", "")); t.av.style.background = colorFor(p.name);
    var noVideo = !p.stream || !p.stream.getVideoTracks().length;
    t.el.classList.toggle("camoff", p.cam === false || noVideo);
    t.el.classList.toggle("micoff", p.mic === false);
  }
  function layout() {
    var ids = Object.keys(st.parts), remote = ids.filter(function (i) { return i !== "me"; });
    var mainId = (st.pinned && st.parts[st.pinned]) ? st.pinned : (remote[0] || "me");
    var slot = $("#mainSlot"), th = $("#thumbs");
    var mp = st.parts[mainId];
    if (mp && mp.tile.el.parentNode !== slot) slot.insertBefore(mp.tile.el, slot.firstChild);
    ids.forEach(function (i) {
      if (i === mainId) return;
      var t = st.parts[i].tile.el;
      if (t.parentNode !== th) th.appendChild(t);
    });
    $$("video", app).forEach(function (v) { if (v.paused && v.srcObject) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } });
    $("#waiting").hidden = remote.length > 0;
    $("#count").textContent = ids.length;
    th.style.display = ids.length > 1 ? "" : "none";
  }
  function renderPeople() {
    var ul = $("#people"); ul.innerHTML = "";
    Object.keys(st.parts).forEach(function (id) {
      var p = st.parts[id], li = el("li"), av = el("div", "msg__av", initials(p.name.replace(" (você)", "")));
      av.style.background = colorFor(p.name);
      var b = el("div"); b.appendChild(el("strong", null, p.name)); b.appendChild(el("small", null, p.role || "Participante"));
      var s = el("span", "st", (p.mic === false ? "mudo" : "") + (p.cam === false ? (p.mic === false ? " · " : "") + "sem câmera" : ""));
      li.appendChild(av); li.appendChild(b); li.appendChild(s); ul.appendChild(li);
    });
  }
  function dropPeer(id) {
    var p = st.parts[id]; if (!p) return;
    if (!st.ended) sys(p.name + " saiu da chamada.");
    if (p.tile.el.parentNode) p.tile.el.parentNode.removeChild(p.tile.el);
    try { if (st.calls[id]) st.calls[id].close(); } catch (e) {}
    delete st.parts[id]; delete st.conns[id]; delete st.calls[id];
    if (st.pinned === id) st.pinned = null;
    layout(); renderPeople();
  }

  /* ---------------- conexões de dados e chamadas ---------------- */
  function link(id) {
    if (id === st.myId || st.conns[id]) return;
    var c = st.peer.connect(id, { reliable: true }); setupConn(c, true);
  }
  function helloMsg() { return { t: "hello", name: st.name, role: st.role, mic: st.mic, cam: st.cam }; }
  function setupConn(c, outgoing) {
    var id = c.peer; if (st.conns[id] && st.conns[id] !== c) { try { c.close(); } catch (e) {} return; }
    st.conns[id] = c;
    function opened() {
      c.send(helloMsg());
      if (outgoing) {
        if (!st.entered) enterApp();
        callPeer(id);
      }
    }
    if (c.open) opened(); else c.on("open", opened);
    c.on("data", function (d) { onData(c, d); });
    c.on("close", function () { dropPeer(id); });
    c.on("error", function () {});
  }
  function callPeer(id) { if (st.calls[id]) return; setupCall(st.peer.call(id, outStream())); }
  function setupCall(call) {
    var id = call.peer; st.calls[id] = call;
    call.on("stream", function (s) {
      var p = ensurePart(id);
      if (p.stream && p.stream.id === s.id) return;
      p.stream = s; p.tile.video.srcObject = s; p.tile.video.volume = st.volume;
      var pr = p.tile.video.play(); if (pr && pr.catch) pr.catch(function () {});
      updateTile(p); layout();
      if (st.rec) connectAudio(id, s);
    });
    call.on("close", function () { delete st.calls[id]; });
    call.on("error", function () {});
  }
  function broadcast(obj) { Object.keys(st.conns).forEach(function (id) { var c = st.conns[id]; if (c && c.open) { try { c.send(obj); } catch (e) {} } }); }

  function onData(c, m) {
    if (!m || !m.t) return;
    var id = c.peer, p;
    if (m.t === "hello") {
      p = ensurePart(id); var first = !p.helloed; p.helloed = true;
      p.name = m.name || "Participante"; p.role = m.role || ""; p.mic = m.mic !== false; p.cam = m.cam !== false;
      updateTile(p); renderPeople(); layout();
      if (first) {
        sys(p.name + " entrou na chamada.");
        if (st.rec && st.rec.state === "recording") c.send({ t: "rec", on: true });
        if (st.host && id !== st.hostId) {         // o anfitrião informa quem já está na sala
          var others = Object.keys(st.conns).filter(function (x) { return x !== id; });
          c.send({ t: "peers", list: others });
        }
      }
    } else if (m.t === "peers") {
      (m.list || []).forEach(function (x) { link(x); });
    } else if (m.t === "state") {
      p = ensurePart(id); p.mic = m.mic !== false; p.cam = m.cam !== false; updateTile(p); renderPeople();
    } else if (m.t === "chat") {
      addMsg({ name: m.name, text: m.text, ts: m.ts, self: false });
    } else if (m.t === "file") {
      receiveFile(m);
    } else if (m.t === "rec") {
      if (st.role !== "Escritório") { recUi(!!m.on, true); sys(m.on ? "O escritório iniciou a gravação da chamada." : "A gravação foi pausada."); }
    } else if (m.t === "typing") {
      showTyping(id, (st.parts[id] || {}).name);
    }
  }

  /* ---------------- controles ---------------- */
  function syncControls() {
    $("#btnMic").classList.toggle("off", !st.mic);
    $("#btnCam").classList.toggle("off", !st.cam);
    $("#btnShare").classList.toggle("on-share", st.sharing);
    var me = st.parts.me; if (me) { me.mic = st.mic; me.cam = st.cam; updateTile(me); }
    renderPeople();
  }
  function pushState() { broadcast({ t: "state", mic: st.mic, cam: st.cam }); }
  $("#btnMic").addEventListener("click", function () {
    if (!track("audio")) { toast("Microfone indisponível."); return; }
    st.mic = !st.mic; track("audio").enabled = st.mic; syncControls(); pushState();
  });
  $("#btnCam").addEventListener("click", function () {
    if (!track("video")) { toast("Câmera indisponível."); return; }
    st.cam = !st.cam; track("video").enabled = st.cam; syncControls(); pushState();
  });
  $("#vol").addEventListener("input", function (e) {
    st.volume = parseFloat(e.target.value);
    Object.keys(st.parts).forEach(function (id) { if (id !== "me") st.parts[id].tile.video.volume = st.volume; });
  });
  function replaceVideo(tr) {
    Object.keys(st.calls).forEach(function (id) {
      var pc = st.calls[id].peerConnection; if (!pc) return;
      pc.getSenders().forEach(function (s) { if (s.track && s.track.kind === "video") s.replaceTrack(tr); });
    });
  }
  $("#btnShare").addEventListener("click", function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { toast("Seu navegador não permite compartilhar tela."); return; }
    var me = st.parts.me;
    if (st.sharing) { stopShare(); return; }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(function (ds) {
      st.screenTrack = ds.getVideoTracks()[0]; st.sharing = true;
      replaceVideo(st.screenTrack);
      me.tile.video.srcObject = ds; me.tile.el.classList.add("screen"); me.tile.el.classList.remove("camoff");
      st.screenTrack.onended = stopShare; syncControls(); sys("Você está compartilhando a tela.");
    }).catch(function () {});
  });
  function stopShare() {
    if (!st.sharing) return; st.sharing = false;
    try { st.screenTrack.stop(); } catch (e) {}
    var cam = track("video"); if (cam) replaceVideo(cam);
    var me = st.parts.me; me.tile.video.srcObject = st.local; me.tile.el.classList.remove("screen"); updateTile(me);
    syncControls(); sys("Compartilhamento de tela encerrado.");
  }
  $("#btnInvite").addEventListener("click", copyInvite);
  $("#btnCopy").addEventListener("click", copyInvite);
  function copyInvite() {
    var l = inviteLink();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(l).then(function () { toast("Link copiado: " + l); }, function () { window.prompt("Copie o link:", l); });
    else window.prompt("Copie o link:", l);
  }
  $("#btnChat").addEventListener("click", function () { $("#side").classList.add("open"); st.unread = 0; $("#chatDot").classList.remove("show"); });
  $("#sideClose").addEventListener("click", function () { $("#side").classList.remove("open"); });
  $$(".side__tabs button[data-tab]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".side__tabs button[data-tab]").forEach(function (x) { x.classList.toggle("on", x === b); });
      $("#paneMsgs").classList.toggle("on", b.getAttribute("data-tab") === "msgs");
      $("#panePeople").classList.toggle("on", b.getAttribute("data-tab") === "people");
    });
  });
  $("#btnEnd").addEventListener("click", function () { if (window.confirm("Encerrar a chamada?")) finish(); });
  $("#btnBack").addEventListener("click", function (e) { if (st.entered && !st.ended && !window.confirm("A chamada está em andamento. Deseja sair? Gravação não salva será perdida.")) e.preventDefault(); });
  window.addEventListener("beforeunload", function (e) { if (st.entered && !st.ended) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------------- chat ---------------- */
  function addMsg(m) {
    var box = $("#msgs"), wrap = el("div", "msg" + (m.self ? " self" : ""));
    var av = el("div", "msg__av", initials(m.name)); av.style.background = colorFor(m.name);
    var body = el("div", "msg__body"); body.appendChild(el("div", "msg__who", m.self ? "Você" : m.name));
    var b = el("div", "msg__bubble");
    if (m.file) { var a = el("a", null, "📎 " + m.file.name + " (" + Math.round(m.file.size / 1024) + " KB)"); a.href = m.file.url; a.download = m.file.name; b.appendChild(a); }
    else b.textContent = m.text;
    body.appendChild(b); body.appendChild(el("span", "msg__time", clock(new Date(m.ts))));
    if (!m.self) wrap.appendChild(av);
    wrap.appendChild(body); box.appendChild(wrap); box.scrollTop = box.scrollHeight;
    st.msgCount++; $("#msgCount").textContent = st.msgCount;
    st.log.push("[" + clock(new Date(m.ts)) + "] " + m.name + ": " + (m.file ? "[arquivo] " + m.file.name : m.text));
    if (!m.self) { ticker(m.name + ": " + (m.file ? "enviou um arquivo" : m.text)); if (!$("#side").classList.contains("open")) { st.unread++; $("#chatDot").classList.add("show"); } }
  }
  $("#composer").addEventListener("submit", function (e) {
    e.preventDefault();
    var inp = $("#msgIn"), text = inp.value.trim(); if (!text) return;
    var m = { t: "chat", name: st.name, text: text, ts: Date.now() };
    broadcast(m); addMsg({ name: st.name, text: text, ts: m.ts, self: true }); inp.value = "";
  });
  $("#msgIn").addEventListener("input", function () {
    var now = Date.now(); if (now - st.lastTyping > 1800) { st.lastTyping = now; broadcast({ t: "typing" }); }
  });
  function showTyping(id, name) {
    var e = $("#typing"); e.textContent = (name || "Alguém") + " está digitando…";
    clearTimeout(st.typingTimers[id]); st.typingTimers[id] = setTimeout(function () { e.textContent = ""; }, 2600);
  }
  $("#fileIn").addEventListener("change", function (e) {
    var f = e.target.files[0]; e.target.value = ""; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast("O arquivo deve ter até 5 MB."); return; }
    var r = new FileReader();
    r.onload = function () {
      var ts = Date.now();
      broadcast({ t: "file", name: f.name, type: f.type, size: f.size, data: r.result, ts: ts, from: st.name });
      var url = URL.createObjectURL(new Blob([r.result], { type: f.type }));
      addMsg({ name: st.name, ts: ts, self: true, file: { name: f.name, size: f.size, url: url } });
    };
    r.readAsArrayBuffer(f);
  });
  function receiveFile(m) {
    var url = URL.createObjectURL(new Blob([m.data], { type: m.type || "application/octet-stream" }));
    addMsg({ name: m.from || "Participante", ts: m.ts || Date.now(), self: false, file: { name: m.name, size: m.size, url: url } });
  }

  /* ---------------- gravação local (vídeo + áudio + chat) ---------------- */
  function pickMime() {
    var list = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
    for (var i = 0; i < list.length; i++) { if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(list[i])) return list[i]; }
    return "";
  }
  function connectAudio(id, stream) {
    if (!st.actx || st.srcNodes[id] || !stream.getAudioTracks().length) return;
    try { var n = st.actx.createMediaStreamSource(new MediaStream([stream.getAudioTracks()[0]])); n.connect(st.adest); st.srcNodes[id] = n; } catch (e) {}
  }
  function startRecording() {
    if (!window.MediaRecorder) { toast("Seu navegador não suporta gravação."); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      st.actx = new AC(); st.adest = st.actx.createMediaStreamDestination();
      if (st.local) connectAudio("me", st.local);
      Object.keys(st.parts).forEach(function (id) { if (id !== "me" && st.parts[id].stream) connectAudio(id, st.parts[id].stream); });
      st.canvas = document.createElement("canvas"); st.canvas.width = 1280; st.canvas.height = 720; st.ctx = st.canvas.getContext("2d");
      var vs = st.canvas.captureStream(24);
      var mixed = new MediaStream(vs.getVideoTracks().concat(st.adest.stream.getAudioTracks()));
      var mime = pickMime();
      st.rec = new MediaRecorder(mixed, mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : { videoBitsPerSecond: 2500000 });
      st.chunks = [];
      st.rec.ondataavailable = function (e) { if (e.data && e.data.size) st.chunks.push(e.data); };
      st.rec.start(4000);
      st.recStart = Date.now();
      st.drawTimer = setInterval(drawFrame, 1000 / 24);
      st.recTimer = setInterval(function () { if (st.rec && st.rec.state === "paused") return; $("#recTime").textContent = hms(Math.floor((Date.now() - st.recStart) / 1000)); }, 500);
      $("#rec").classList.add("on");
      st.recTimer2 = 1;
    } catch (e) { st.rec = null; toast("Não foi possível iniciar a gravação neste navegador."); }
  }
  function drawFrame() {
    var c = st.ctx, W = 1280, H = 720; c.fillStyle = "#050a19"; c.fillRect(0, 0, W, H);
    var ids = Object.keys(st.parts), n = ids.length; if (!n) return;
    var cols = n <= 1 ? 1 : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), cw = W / cols, ch = H / rows;
    ids.forEach(function (id, i) {
      var p = st.parts[id], x = (i % cols) * cw, y = Math.floor(i / cols) * ch, v = p.tile.video;
      c.save(); c.beginPath(); c.rect(x + 3, y + 3, cw - 6, ch - 6); c.clip();
      var showVideo = v.readyState >= 2 && v.videoWidth && p.cam !== false;
      if (showVideo) {
        var scale = Math.max((cw - 6) / v.videoWidth, (ch - 6) / v.videoHeight), dw = v.videoWidth * scale, dh = v.videoHeight * scale;
        var sharing = p.tile.el.classList.contains("screen");
        if (sharing) { scale = Math.min((cw - 6) / v.videoWidth, (ch - 6) / v.videoHeight); dw = v.videoWidth * scale; dh = v.videoHeight * scale; }
        c.drawImage(v, x + (cw - dw) / 2, y + (ch - dh) / 2, dw, dh);
      } else {
        c.fillStyle = "#0c1630"; c.fillRect(x, y, cw, ch);
        c.fillStyle = colorFor(p.name); c.beginPath(); c.arc(x + cw / 2, y + ch / 2, Math.min(cw, ch) * 0.16, 0, 6.283); c.fill();
        c.fillStyle = "#fff"; c.font = Math.round(Math.min(cw, ch) * 0.14) + "px serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(initials(p.name.replace(" (você)", "")), x + cw / 2, y + ch / 2);
      }
      c.fillStyle = "rgba(5,10,25,.65)"; c.fillRect(x + 14, y + ch - 44, Math.min(cw - 28, 360), 30);
      c.fillStyle = "#fff"; c.font = "16px sans-serif"; c.textAlign = "left"; c.textBaseline = "middle";
      c.fillText(p.name + (p.mic === false ? "  (mudo)" : ""), x + 24, y + ch - 29);
      c.restore();
    });
    c.fillStyle = "rgba(5,10,25,.7)"; c.fillRect(W - 250, 14, 236, 30); c.fillStyle = "#e0243a"; c.beginPath(); c.arc(W - 232, 29, 6, 0, 6.283); c.fill();
    c.fillStyle = "#fff"; c.font = "15px sans-serif"; c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText("REC  " + hms(Math.floor((Date.now() - st.recStart) / 1000)) + "  Sala " + st.room, W - 218, 29);
  }
  function recUi(on, remote) {
    $("#rec").classList.toggle("on", on);
    $("#recLbl").textContent = on ? (remote ? "Gravação em andamento pelo escritório" : "REC") : (remote ? "Sem gravação" : "Gravação parada");
    $("#recTime").style.display = remote ? "none" : "";
  }
  $("#btnRec").addEventListener("click", function () {
    if (st.role !== "Escritório") return;
    if (!st.rec) { startRecording(); if (!st.rec) return; broadcast({ t: "rec", on: true }); recUi(true); $("#btnRec").classList.add("off"); sys("Gravação iniciada por " + st.name + "."); toast("Gravação iniciada. O cliente foi avisado."); return; }
    if (st.rec.state === "recording") { st.rec.pause(); st.paused = Date.now(); broadcast({ t: "rec", on: false }); recUi(false); $("#btnRec").classList.remove("off"); sys("Gravação pausada."); }
    else if (st.rec.state === "paused") { st.rec.resume(); st.recStart += Date.now() - st.paused; broadcast({ t: "rec", on: true }); recUi(true); $("#btnRec").classList.add("off"); sys("Gravação retomada."); }
  });
  function stopRecording(cb) {
    clearInterval(st.drawTimer); clearInterval(st.recTimer); $("#rec").classList.remove("on");
    if (!st.rec || st.rec.state === "inactive") { cb(null, ""); return; }
    st.rec.onstop = function () {
      var type = st.rec.mimeType || "video/webm";
      var blob = new Blob(st.chunks, { type: type });
      cb(blob, type.indexOf("mp4") >= 0 ? "mp4" : "webm");
    };
    try { st.rec.requestData(); } catch (e) {}
    st.rec.stop();
  }
  function saveBlob(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 1500);
  }
  function chatBlob() {
    var names = Object.keys(st.parts).map(function (i) { return st.parts[i].name + (st.parts[i].role && i !== "me" ? " (" + st.parts[i].role + ")" : ""); });
    var head = "MARTINS & PAMPLONA ADVOCACIA & ASSESSORIA\nRegistro da chamada por vídeo\nSala: " + st.room + "\nData: " + new Date().toLocaleString("pt-BR") +
      "\nParticipantes ao final: " + names.join("; ") + "\nGravação e chat salvos localmente por " + st.name + ".\n\n------------------------------\n";
    return new Blob(["﻿" + head + st.log.join("\n") + "\n"], { type: "text/plain;charset=utf-8" });
  }

  /* ---------------- encerrar ---------------- */
  function finish() {
    if (st.ended) return; st.ended = true;
    if (st.sharing) { try { st.screenTrack.stop(); } catch (e) {} }
    sys("Chamada encerrada por " + st.name + ".");
    broadcast({ t: "bye" });
    var base = "sala-" + st.room + "_" + stamp();
    if (st.role !== "Escritório") { st.rec = null; }
    stopRecording(function (blob, ext) {
      var txt = chatBlob(), btns = $("#endedBtns"); btns.innerHTML = "";
      function addBtn(label, b, name) {
        var a = el("a", "btn btn--gold", label); a.href = URL.createObjectURL(b); a.download = name; btns.appendChild(a);
      }
      if (st.role !== "Escritório") { $("#endedBtns").innerHTML = ""; }
      else if (blob && blob.size) { addBtn("Baixar gravação (" + ext.toUpperCase() + ")", blob, "chamada-" + base + "." + ext); saveBlob(blob, "chamada-" + base + "." + ext); }
      else $("#endedMsg").textContent = "A gravação não foi iniciada, então não há vídeo para salvar. O registro do chat foi salvo.";
      if (st.role === "Escritório") {
        $("#endedMsg").textContent = (blob && blob.size ? "A gravação e o registro do chat foram salvos" : $("#endedMsg").textContent) + (blob && blob.size ? " na pasta de downloads deste dispositivo." : "");
        addBtn("Baixar registro do chat (TXT)", txt, "chat-" + base + ".txt");
        setTimeout(function () { saveBlob(txt, "chat-" + base + ".txt"); }, 900);
      }
      Object.keys(st.conns).forEach(function (id) { try { st.conns[id].close(); } catch (e) {} });
      Object.keys(st.calls).forEach(function (id) { try { st.calls[id].close(); } catch (e) {} });
      try { st.peer.destroy(); } catch (e) {}
      if (st.local) st.local.getTracks().forEach(function (t) { t.stop(); });
      try { st.actx.close(); } catch (e) {}
      app.hidden = true; endedBox.hidden = false; document.body.classList.remove("in-call");
    });
  }

  /* para testes automatizados */
  window.__call = st;
  initLobby();
})();
