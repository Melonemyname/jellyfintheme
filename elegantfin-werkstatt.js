/*
 * ElegantFin-Werkstatt (Skripte für JavaScript Injector), Stand 25.10.2026
 * Aufsatz auf ElegantFin für Jellyfin 10.11, https://github.com/Melonemyname/jellyfintheme
 * Einbinden siehe README.md. Diese Datei ist gebaut, nicht von Hand ändern.
 */
// ElegantFin-Werkstatt: Skripte zum Theme (Plugin JavaScript Injector)

// buchstaben-waagerecht: Buchstaben-Springer als Reihe über dem Raster
(function () {
    try {
// Wischen über die Buchstabenreihe darf nicht den Reiter wechseln. Jellyfin wechselt am Handy
// bei waagerechtem Wischen den Reiter (components/maintabsmanager.js, allowSwipe), außer über
// Elementen mit der Klasse scrollX oder animatedScrollX. animatedScrollX hat nirgends eine Optik,
// sie dient nur als dieses Merkmal; die Buchstabenreihe bekommt sie, sobald sie erscheint.
(function () {
    var W = window.__werkstatt = window.__werkstatt || {};
    if (W.buchstabenWischen) return;
    W.buchstabenWischen = true;
    var markieren = function () {
        try {
            document.querySelectorAll('.alphaPicker.alphaPicker-vertical:not(.alphaPicker-tv):not(.animatedScrollX)').forEach(function (el) {
                el.classList.add('animatedScrollX');
            });
        } catch (e) { /* nichts */ }
    };
    var geplant = 0;
    new MutationObserver(function () {
        if (geplant) return;
        geplant = requestAnimationFrame(function () { geplant = 0; markieren(); });
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    markieren();
})();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript buchstaben-waagerecht:", e);
    }
})();

// titelnummer-wird-play: Albumseite: Titelnummer wird beim Überfahren zum Abspielknopf
(function () {
    try {
/* Albumseite: Ein Klick auf die Titelnummer (beim Überfahren ein Abspielknopf) spielt den Titel.
   Die Nummer (.listItem-indexnumberleft) ist kein .itemAction, Jellyfins Klickbehandlung
   (emby-itemscontainer → shortcuts.onClick) übergeht sie. Das Skript reicht den Klick an
   .listItemBody derselben Zeile weiter, dort führt Jellyfin die Aktion der Zeile aus (auf der
   Albumseite "playallfromhere": das Album ab diesem Titel). Ein Listener am document, er läuft nach
   Jellyfins eigenem; hat der den Klick schon behandelt (defaultPrevented), bleibt es dabei. Der
   weitergereichte Klick trifft .listItemBody, nicht die Nummer, kommt also nicht ein zweites Mal
   hierher. Nur am Rechner mit Maus, wie das CSS. Läuft einmal. */
(function () {
    'use strict';
    try {
        var W = window.__werkstatt = window.__werkstatt || {};
        if (W.titelnummerPlay) return;
        var maus = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
        var beiKlick = function (e) {
            try {
                if (!e || e.defaultPrevented || e.button) return;
                var wurzel = document.documentElement;
                if (!wurzel || !wurzel.classList.contains('layout-desktop')) return;
                if (!maus || !maus.matches) return;
                var t = e.target;
                var nummer = t && t.closest ? t.closest('.listItem-indexnumberleft') : null;
                if (!nummer) return;
                var zeile = nummer.parentElement;
                if (!zeile || !zeile.classList.contains('listItem')) return;
                var aktion = zeile.getAttribute('data-action');
                if (!aktion || aktion === 'none') return;
                var koerper = null;
                for (var c = zeile.firstElementChild; c; c = c.nextElementSibling) {
                    if (c.classList.contains('listItemBody') && c.classList.contains('itemAction')) { koerper = c; break; }
                }
                if (!koerper) return;
                e.preventDefault();
                koerper.click();
            } catch (err) { /* Jellyfin nicht stören */ }
        };
        document.addEventListener('click', beiKlick);
        W.titelnummerPlay = { klick: beiKlick };
    } catch (e) {
        if (window.console) console.warn('Werkstatt: Titelnummer als Abspielknopf', e);
    }
})();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript titelnummer-wird-play:", e);
    }
})();

// kopfzeile-beim-scrollen: Kopfzeile wird beim Scrollen deckend und läuft weich aus
(function () {
    try {
/* Kopfzeile: Klasse werkstatt-scrolled setzen, sobald das Dokument gescrollt ist.
   Jellyfin hängt headroom.js nur im Handy-Layout an die Kopfzeile, am Rechner gibt es sonst keinen
   Hinweis auf den Scrollstand. Läuft einmal; ein MutationObserver erfasst eine neu erzeugte
   Kopfzeile, Scroll-Ereignisse und Beobachter werden pro Bild gebündelt. */
(function () {
    'use strict';
    try {
        var W = window.__werkstatt = window.__werkstatt || {};
        if (W.kopfzeileScroll) return;
        var raf = 0;
        var update = function () {
            raf = 0;
            try {
                var y = window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || 0;
                var on = y > 0;
                var list = document.querySelectorAll('.skinHeader');
                for (var i = 0; i < list.length; i++) {
                    if (list[i].classList.contains('werkstatt-scrolled') !== on) list[i].classList.toggle('werkstatt-scrolled', on);
                }
            } catch (e) { /* nichts tun */ }
        };
        var schedule = function () {
            if (raf) return;
            raf = window.requestAnimationFrame ? window.requestAnimationFrame(update) : window.setTimeout(update, 16);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        var mo = new MutationObserver(schedule);
        mo.observe(document.documentElement, { childList: true, subtree: true });
        W.kopfzeileScroll = { update: update, observer: mo };
        update();
    } catch (e) {
        if (window.console) console.warn('Werkstatt: Kopfzeile beim Scrollen', e);
    }
})();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript kopfzeile-beim-scrollen:", e);
    }
})();

// serien-staffelzahl: Serien: Staffelzahl im Zähler
(function () {
    try {
// Serienbibliothek, Reiter „Serien“: Staffelzahl statt ungesehener Folgen im Zähler.
// Jellyfin schreibt dort UserData.UnplayedItemCount hinein (indicators.js, ab 100 „99+“), schreibt
// die Zahl bei jeder Änderung der Benutzerdaten neu (cardBuilder.js, updateUserData) und baut die
// Karten bei jedem Blättern, Sortieren, Filtern und Buchstaben neu. Darum beobachtet das Skript die
// Seite und trägt die Staffelzahl jedes Mal wieder ein. Die Zahl liefert Jellyfin als ChildCount einer
// Serie (Anzahl der Staffeln): eine Abfrage für alle neu sichtbaren Serien (je bis zu 50 Ids),
// danach 10 Minuten aus dem Speicher. Schlägt die Abfrage fehl, bleibt Jellyfins Zahl stehen.
// In der Werkstatt gibt es kein ApiClient, dort kommen die Staffeln aus den Demodaten.
(function () {
    var W = window.__werkstatt = window.__werkstatt || {};
    if (W.staffelzahl) return;
    W.staffelzahl = true;

    var SEL = '#tvRecommendedPage #seriesTab [data-type="Series"][data-id] .countIndicator';
    var HALTBAR = 10 * 60 * 1000;
    var speicher = {};   // Serien-Id: { n: Staffelzahl (0 = unbekannt), t: Zeitpunkt }
    var offen = {};      // Serien-Id: true, solange die Abfrage läuft

    function api() {
        var a = window.ApiClient;
        return a && typeof a.getItems === 'function' && typeof a.getCurrentUserId === 'function' ? a : null;
    }

    // Werkstatt: Demodaten liegen im Fenster der Werkstatt (Rahmen gleicher Herkunft)
    function demoStaffeln(id) {
        var quellen = [];
        try { if (window.DEMO_DATA) quellen.push(window.DEMO_DATA); } catch (e) { /* nichts */ }
        try { if (window.parent && window.parent !== window && window.parent.DEMO_DATA) quellen.push(window.parent.DEMO_DATA); } catch (e) { /* fremde Herkunft */ }
        for (var q = 0; q < quellen.length; q++) {
            for (var i = 0; i < quellen[q].length; i++) {
                var r = quellen[q][i];
                if (r && r.k === 'series' && r.Id === id && r.ChildCount != null) return r.ChildCount;
            }
        }
        return null;
    }

    function holen(a, ids) {
        ids.forEach(function (id) { offen[id] = true; });
        for (var i = 0; i < ids.length; i += 50) {
            (function (teil) {
                var erledigt = false;
                var fertig = function (items) {
                    var jetzt = Date.now();
                    if (items) {
                        erledigt = true;
                        items.forEach(function (it) {
                            if (it && it.Id) speicher[it.Id] = { n: it.ChildCount > 0 ? it.ChildCount : 0, t: jetzt };
                        });
                    } else if (erledigt) {
                        return;
                    }
                    teil.forEach(function (id) {
                        delete offen[id];
                        // Ohne Antwort nur kurz merken (nach einer Minute neu fragen), ohne Treffer 10 Minuten
                        if (!speicher[id]) speicher[id] = { n: 0, t: items ? jetzt : jetzt - HALTBAR + 60000 };
                    });
                    planen();
                };
                setTimeout(function () { fertig(null); }, 8000);
                try {
                    Promise.resolve(a.getItems(a.getCurrentUserId(), {
                        Ids: teil.join(','),
                        Fields: 'ChildCount',
                        EnableImages: false,
                        EnableUserData: false,
                        EnableTotalRecordCount: false
                    })).then(function (res) {
                        fertig((res && res.Items) || []);
                    }, function () {
                        fertig(null);
                    });
                } catch (e) {
                    fertig(null);
                }
            })(ids.slice(i, i + 50));
        }
    }

    function eintragen(ind, n) {
        if (n > 0) {
            var text = String(n);
            var titel = n === 1 ? '1 Staffel' : n + ' Staffeln';
            if (ind.textContent !== text) ind.textContent = text;
            if (ind.getAttribute('title') !== titel) ind.setAttribute('title', titel);
        }
        var wert = n > 0 ? String(n) : '';
        if (ind.getAttribute('data-werkstatt-staffeln') !== wert) ind.setAttribute('data-werkstatt-staffeln', wert);
    }

    function anzeigen() {
        try {
            var root = document.documentElement;
            if (!root.classList.contains('werkstattStaffelzahl')) root.classList.add('werkstattStaffelzahl');
            var a = api();
            var jetzt = Date.now();
            var fehlend = [];
            document.querySelectorAll(SEL).forEach(function (ind) {
                var karte = ind.closest('[data-id]');
                var id = karte && karte.getAttribute('data-id');
                if (!id) return;
                var e = speicher[id];
                if (!e && !a) {
                    var d = demoStaffeln(id);
                    if (d != null) e = speicher[id] = { n: d, t: Infinity };
                }
                if (a && (!e || jetzt - e.t > HALTBAR) && !offen[id] && fehlend.indexOf(id) < 0) fehlend.push(id);
                if (e) eintragen(ind, e.n);
                else if (!a) eintragen(ind, 0);   // nichts zu fragen: Jellyfins Zahl zeigen
            });
            if (a && fehlend.length) holen(a, fehlend);
        } catch (e) { /* nichts */ }
    }

    var geplant = 0;
    function planen() {
        if (geplant) return;
        geplant = requestAnimationFrame(function () { geplant = 0; anzeigen(); });
    }

    try {
        new MutationObserver(planen).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) { /* nichts */ }
    planen();
})();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript serien-staffelzahl:", e);
    }
})();

// player-kapitelmarken-beim-ziehen: Kapitelmarken beim Überfahren und Ziehen
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilZiehen() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.ziehen) return;
            W.ziehen = true;
            var kern = W.kern;
            var KLASSE = 'werkstatt-ziehen';
            var gezogen = null;

            var loslassen = function () {
                if (gezogen) gezogen.classList.remove(KLASSE);
                gezogen = null;
            };

            window.addEventListener('pointerdown', function (e) {
                try {
                    if (!kern.an('kapitelmarken')) return;
                    var t = e.target;
                    var box = t && t.closest ? t.closest('.videoOsdBottom .sliderContainer') : null;
                    if (!box || !box.querySelector('.osdPositionSlider')) return;
                    if (box.classList.contains(KLASSE)) return; // steht schon da, gehört nicht dem Skript
                    loslassen();
                    box.classList.add(KLASSE);
                    gezogen = box;
                } catch (err) { /* nichts */ }
            }, true);
            window.addEventListener('pointerup', loslassen, true);
            window.addEventListener('pointercancel', loslassen, true);
            window.addEventListener('blur', loslassen);
            document.addEventListener('mouseleave', loslassen);

            kern.teile.ziehen = function () {
                if (!kern.an('kapitelmarken')) loslassen();
            };
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript player-kapitelmarken-beim-ziehen:", e);
    }
})();

// regler-fuellung-folgt: Zeitleisten: Füllung folgt beim Ziehen
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilFuellung() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.fuellung) return;
            W.fuellung = true;
            var kern = W.kern;

            var setzen = function (s) {
                var box = s.parentNode;
                var unten = box && box.querySelector('.mdl-slider-background-lower');
                if (!unten) return;
                var min = parseFloat(s.min) || 0;
                var max = isNaN(parseFloat(s.max)) ? 100 : parseFloat(s.max);
                var f = max > min ? (parseFloat(s.value) - min) / (max - min) : 0;
                var breite = (Math.min(1, Math.max(0, f)) * 100) + '%';
                if (unten.style.width !== breite) unten.style.width = breite;
            };

            window.addEventListener('input', function (e) {
                try {
                    if (!kern.an('fuellung')) return;
                    var s = e.target;
                    if (!s || !s.classList || !s.classList.contains('mdl-slider')) return;
                    if (s.getAttribute('data-slider-keep-progress') !== 'true') return;
                    setzen(s);
                    // emby-slider rechnet seine Balken im nächsten Frame; danach noch einmal, falls etwas dazwischenkam
                    requestAnimationFrame(function () { if (s.dragging !== false) setzen(s); });
                } catch (err) { /* nichts */ }
            }, true);

            // Gezogen ohne input-Ereignis: steht .werkstatt-ziehen schon da (Werkstatt-Ansicht „Zeitleiste beim
            // Ziehen“, oder das Skript teilZiehen hat sie beim Drücken gesetzt), Füllung gleich an den Kreis holen.
            var gezogene = function () {
                try {
                    if (!kern.an('fuellung')) return;
                    document.querySelectorAll('.sliderContainer.werkstatt-ziehen > input.mdl-slider[data-slider-keep-progress="true"]').forEach(setzen);
                } catch (err) { /* nichts */ }
            };
            gezogene();
            window.addEventListener('load', gezogene);
            setTimeout(gezogene, 300);
            window.addEventListener('pointerdown', function () { requestAnimationFrame(gezogene); }, true);
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript regler-fuellung-folgt:", e);
    }
})();

// zeitleiste-gleitet: Zeitleisten gleiten statt zu springen
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilGleiten() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.gleiten) return;
            W.gleiten = true;
            var kern = W.kern;
            var REGLER = '.osdPositionSlider, .nowPlayingBarPositionSlider, .nowPlayingPositionSlider';
            var eigen = false;      // das Skript schreibt gerade selbst
            var laufend = [];       // Regler, die gerade gleiten
            var bild = 0;

            var zahl = function (v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; };
            var zustand = function (s) { return s.__werkstattGleiten || (s.__werkstattGleiten = { rate: 0 }); };
            // Wird die Leiste gerade bedient? (Flags von emby-slider, dazu ein gedrückter Zeiger)
            var bedient = function (s) { return !!(s.dragging || s.touched || s.keyboardDragging || s.__werkstattGedrueckt); };
            var schreiben = function (s, z, v) {
                eigen = true;
                try { s.value = String(v); } finally { eigen = false; }
                z.wert = v;
            };
            var anhalten = function (z) { z.gleitet = false; };
            var KORREKTUR = 800;    // ms, in denen ein Unterschied zur echten Stelle aufgeholt wird

            var schritt = function () {
                bild = 0;
                var jetzt = performance.now();
                laufend = laufend.filter(function (s) {
                    try {
                        var z = s.__werkstattGleiten;
                        if (!z || !z.gleitet || !s.isConnected) return false;
                        if (bedient(s)) { anhalten(z); return false; }
                        var dt = Math.min(100, jetzt - z.t);
                        z.t = jetzt;
                        if (jetzt > z.halt) { anhalten(z); return false; }
                        var tempo = z.rate + (jetzt < z.korrBis ? z.korr : 0);
                        if (tempo < 0) tempo = 0;
                        z.ziel = Math.min(z.max, z.ziel + tempo * dt);
                        // in jedem Bild schreiben, sobald sich etwas sichtbar tut (Retina zeichnet halbe Pixel,
                        // die Füllung sogar feiner); bei großen Schritten würde es wieder ruckeln
                        if (Math.abs(z.ziel - z.wert) * z.px >= 0.05) schreiben(s, z, z.ziel);
                        return true;
                    } catch (e) { return false; }
                });
                if (laufend.length) bild = requestAnimationFrame(schritt);
            };

            window.addEventListener('valueset', function (e) {
                try {
                    if (eigen) return;
                    var s = e.target;
                    if (!s || !s.matches || !s.matches(REGLER)) return;
                    var z = zustand(s);
                    var jetzt = performance.now();
                    var v = zahl(s.value, 0);
                    var vorher = z.anker, vorherZeit = z.zeit;
                    // Was gerade zu sehen ist: die eigene Anzeige, sonst Jellyfins letzter Wert
                    var gezeigt = z.gleitet ? z.ziel : (z.wert != null ? z.wert : vorher);
                    z.anker = v;
                    z.zeit = jetzt;
                    var springen = function () { anhalten(z); z.wert = v; z.ziel = v; };

                    var min = zahl(s.min, 0), max = zahl(s.max, 100);
                    var breite = s.offsetWidth;
                    if (!kern.an('gleiten') || bedient(s) || z.sprung || vorher == null || gezeigt == null ||
                        document.hidden || !breite || max <= min) {
                        z.sprung = false;
                        springen();
                        return;
                    }

                    var dv = v - vorher, dt = jetzt - vorherZeit;
                    var r = dt > 0 ? dv / dt : 0;
                    var plausibel = dv > 0 && dt > 150 && dt < 4000;
                    var passt = plausibel && (z.rate > 0
                        ? r <= z.rate * 1.8 && r >= z.rate * 0.4
                        : dv <= (max - min) * 0.015); // noch keine Geschwindigkeit: nur kleine Schritte
                    if (dv < 0) z.rate = 0;
                    if (!passt) {
                        // Ein Sprung nach vorn verändert die Geschwindigkeit nicht; sonst gilt die neue
                        if (plausibel && !(z.rate > 0 && r > z.rate * 1.8)) z.rate = r;
                        springen();
                        return;
                    }
                    z.rate = z.rate > 0 ? z.rate * 0.8 + r * 0.2 : r;
                    z.abstand = z.abstand ? z.abstand * 0.7 + dt * 0.3 : dt;
                    z.px = breite / (max - min);
                    z.max = max;

                    // Abstand der Anzeige zur echten Stelle: klein → Tempo anpassen, groß → springen
                    var fehler = v - gezeigt;
                    if (fehler > z.rate * 2500 || fehler < -z.rate * 1500) { springen(); return; }
                    z.korr = fehler / KORREKTUR;
                    z.korrBis = jetzt + KORREKTUR;
                    z.halt = jetzt + Math.max(900, z.abstand * 1.3);
                    if (!z.gleitet) {
                        z.ziel = gezeigt;
                        z.t = jetzt;
                        z.gleitet = true;
                    }
                    schreiben(s, z, z.ziel); // Jellyfin hat schon den neuen Wert gesetzt: zurück auf die gezeigte Stelle
                    if (laufend.indexOf(s) < 0) laufend.push(s);
                    if (!bild) bild = requestAnimationFrame(schritt);
                } catch (err) { /* Jellyfins Wert bleibt stehen */ }
            }, true);

            // Pause, Puffern, Spulen, Ende: sofort stehen bleiben (Medienereignisse steigen nicht auf,
            // kommen aber in der Capture-Phase am document an)
            ['pause', 'waiting', 'seeking', 'ended', 'emptied'].forEach(function (typ) {
                document.addEventListener(typ, function (e) {
                    try {
                        var t = e.target;
                        if (!t || (t.tagName !== 'AUDIO' && t.tagName !== 'VIDEO')) return;
                        laufend.forEach(function (s) { if (s.__werkstattGleiten) anhalten(s.__werkstattGleiten); });
                        laufend = [];
                    } catch (err) { /* nichts */ }
                }, true);
            });

            // Bedienen: sofort aufhören, und der nächste Wert von Jellyfin springt (neue Stelle nach dem Klick)
            var bedienen = function (s) {
                var z = zustand(s);
                anhalten(z);
                z.sprung = true;
            };
            window.addEventListener('pointerdown', function (e) {
                try {
                    var s = e.target && e.target.closest ? e.target.closest(REGLER) : null;
                    if (!s) return;
                    s.__werkstattGedrueckt = true;
                    bedienen(s);
                } catch (err) { /* nichts */ }
            }, true);
            var loslassen = function () {
                try {
                    document.querySelectorAll(REGLER).forEach(function (s) {
                        if (s.__werkstattGedrueckt) { s.__werkstattGedrueckt = false; bedienen(s); }
                    });
                } catch (err) { /* nichts */ }
            };
            window.addEventListener('pointerup', loslassen, true);
            window.addEventListener('pointercancel', loslassen, true);
            ['input', 'change', 'keydown'].forEach(function (typ) {
                window.addEventListener(typ, function (e) {
                    try {
                        var s = e.target;
                        if (s && s.matches && s.matches(REGLER)) bedienen(s);
                    } catch (err) { /* nichts */ }
                }, true);
            });

            // Wiedergabeseite: feinere Schritte, solange der Schalter an ist
            kern.teile.gleiten = function () {
                var an = kern.an('gleiten');
                document.querySelectorAll('.nowPlayingPositionSlider').forEach(function (s) {
                    var alt = s.getAttribute('data-werkstatt-schritt');
                    if (an && alt == null) {
                        s.setAttribute('data-werkstatt-schritt', s.getAttribute('step') || '');
                        s.setAttribute('step', '0.01');
                    } else if (!an && alt != null) {
                        if (alt) s.setAttribute('step', alt);
                        else s.removeAttribute('step');
                        s.removeAttribute('data-werkstatt-schritt');
                    }
                });
                if (!an) {
                    laufend.forEach(function (s) { if (s.__werkstattGleiten) anhalten(s.__werkstattGleiten); });
                    laufend = [];
                }
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript zeitleiste-gleitet:", e);
    }
})();

// player-kapitelabschnitt-gross: Kapitelabschnitt unter dem Zeiger dicker
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilAbschnitt() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.abschnitt) return;
            W.abschnitt = true;
            var kern = W.kern;
            var AKTIV = 'werkstattAbschnittAktiv';
            var ueber = null; // Behälter unter dem Zeiger
            var zeigerX = null;

            var behaelter = function (el) {
                var box = el && el.closest ? el.closest('.videoOsdBottom .sliderContainer') : null;
                return box && box.querySelector(':scope > .osdPositionSlider') ? box : null;
            };
            var gezogen = function (box) {
                try { return box.classList.contains('werkstatt-ziehen') || box.matches(':active'); } catch (e) { return false; }
            };
            var aus = function (box) {
                if (box.classList.contains(AKTIV)) box.classList.remove(AKTIV);
            };
            var zeichnen = function (box, x) {
                var leiste = box.querySelector('.mdl-slider-background-flex');
                var regler = box.querySelector(':scope > .osdPositionSlider');
                if (!leiste || !regler) return;
                var lr = leiste.getBoundingClientRect();
                if (!lr.width) return;
                if (x == null) {
                    var min = parseFloat(regler.min) || 0;
                    var max = isNaN(parseFloat(regler.max)) ? 100 : parseFloat(regler.max);
                    var f = max > min ? (parseFloat(regler.value) - min) / (max - min) : 0;
                    x = lr.left + Math.min(1, Math.max(0, f)) * lr.width;
                }
                var L = lr.left, R = lr.right;
                box.querySelectorAll('.sliderMarker').forEach(function (m) {
                    var r = m.getBoundingClientRect();
                    if (!r.width && !r.height) return;
                    var c = r.left + r.width / 2;
                    if (c <= x && c > L) L = c;
                    if (c > x && c < R) R = c;
                });
                var teil = box.querySelector(':scope > .werkstattAbschnitt');
                if (!teil) {
                    teil = document.createElement('div');
                    teil.className = 'werkstattAbschnitt';
                    teil.setAttribute('aria-hidden', 'true');
                    // vor die Marken, damit sie (gleiche Ebene) darüber liegen
                    box.insertBefore(teil, box.querySelector(':scope > .sliderMarkerContainer') || box.firstChild);
                }
                var br = box.getBoundingClientRect();
                var bis = function (el) {
                    var r = el ? el.getBoundingClientRect() : null;
                    var e = r && r.width ? r.right : lr.left;
                    return Math.min(R - L, Math.max(0, e - L)) + 'px';
                };
                teil.style.left = (L - br.left) + 'px';
                teil.style.width = (R - L) + 'px';
                teil.style.top = (lr.top + lr.height / 2 - br.top) + 'px';
                teil.style.setProperty('--werkstatt-gespielt', bis(box.querySelector('.mdl-slider-background-lower')));
                teil.style.setProperty('--werkstatt-gepuffert', bis(box.querySelector('.mdl-slider-background-upper')));
                leiste.style.setProperty('--werkstatt-luecke-l', (L - lr.left) + 'px');
                leiste.style.setProperty('--werkstatt-luecke-r', (R - lr.left) + 'px');
                if (!box.classList.contains(AKTIV)) box.classList.add(AKTIV);
            };
            var aktualisieren = function (box) {
                if (!kern.an('abschnitt')) return;
                if (gezogen(box)) zeichnen(box, null);
                else if (box === ueber) zeichnen(box, zeigerX);
                else aus(box);
            };
            var bald = function (box) {
                requestAnimationFrame(function () { try { aktualisieren(box); } catch (e) { /* nichts */ } });
            };

            window.addEventListener('pointermove', function (e) {
                try {
                    if (!kern.an('abschnitt')) return;
                    var box = behaelter(e.target);
                    if (ueber && ueber !== box) { var alt = ueber; ueber = null; bald(alt); }
                    if (!box) return;
                    ueber = box;
                    zeigerX = e.clientX;
                    bald(box);
                } catch (err) { /* nichts */ }
            }, { capture: true, passive: true });

            document.addEventListener('mouseleave', function () {
                if (ueber) { var alt = ueber; ueber = null; bald(alt); }
            });

            ['input', 'change', 'pointerup', 'pointercancel'].forEach(function (typ) {
                window.addEventListener(typ, function (e) {
                    try {
                        if (!kern.an('abschnitt')) return;
                        var box = behaelter(e.target) || ueber;
                        document.querySelectorAll('.' + AKTIV).forEach(bald);
                        if (box) bald(box);
                    } catch (err) { /* nichts */ }
                }, true);
            });

            // Nach Laden der Schrift oder Größenänderung stimmen die Maße nicht mehr
            var alle = function () { document.querySelectorAll('.videoOsdBottom .sliderContainer').forEach(bald); };
            window.addEventListener('resize', alle);
            window.addEventListener('load', alle);
            try { if (document.fonts) document.fonts.ready.then(alle); } catch (e) { /* nichts */ }

            kern.teile.abschnitt = function () {
                var an = kern.an('abschnitt');
                document.querySelectorAll('.videoOsdBottom .sliderContainer').forEach(function (box) {
                    if (!box.querySelector(':scope > .osdPositionSlider')) return;
                    if (!an) {
                        aus(box);
                        var t = box.querySelector(':scope > .werkstattAbschnitt');
                        if (t) t.parentNode.removeChild(t);
                        return;
                    }
                    aktualisieren(box);
                });
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript player-kapitelabschnitt-gross:", e);
    }
})();

// player-lautstaerke-aufklappen: Lautstärke als aufklappender, senkrechter Regler
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilLautstaerke() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.lautstaerke) return;
            W.lautstaerke = true;
            var kern = W.kern;
            var OFFEN = 'werkstattVolumeOpen';

            var offene = function () {
                return Array.prototype.slice.call(document.querySelectorAll('.volumeButtons.' + OFFEN));
            };
            var anzeigen = function (vb) {
                var s = vb.querySelector('.osdVolumeSlider');
                var l = vb.querySelector('.werkstattVolumeValue');
                if (!s || !l) return;
                var wert = parseFloat(s.value) || 0;
                var min = parseFloat(s.min) || 0;
                var max = isNaN(parseFloat(s.max)) ? 100 : parseFloat(s.max);
                var anteil = max > min ? Math.min(1, Math.max(0, (wert - min) / (max - min))) : 0;
                var t = Math.round(wert) + ' %';
                if (l.textContent !== t) l.textContent = t;
                // Für die Höhe der Zahl neben dem Kreis (inline, löst keinen Observer-Durchlauf aus)
                vb.style.setProperty('--werkstatt-anteil', String(anteil));
            };
            var schliessen = function (vb) {
                vb.classList.remove(OFFEN);
                var b = vb.querySelector('.buttonMute');
                if (b) b.setAttribute('aria-expanded', 'false');
            };
            var oeffnen = function (vb) {
                if (!vb.querySelector('.werkstattVolumeValue')) {
                    vb.insertAdjacentHTML('beforeend', '<div class="werkstattVolumeValue" aria-hidden="true"></div>');
                }
                vb.classList.add(OFFEN);
                var b = vb.querySelector('.buttonMute');
                if (b) b.setAttribute('aria-expanded', 'true');
                anzeigen(vb);
            };

            // Erster Klick öffnet. Fängt den Klick ab, bevor er Jellyfins Stummschalter erreicht.
            window.addEventListener('click', function (e) {
                try {
                    if (!kern.an('lautstaerke')) return;
                    var t = e.target;
                    var btn = t && t.closest ? t.closest('.videoOsdBottom .buttonMute') : null;
                    if (!btn) return;
                    var vb = btn.closest('.volumeButtons');
                    var box = vb && vb.querySelector('.osdVolumeSliderContainer');
                    // Ohne Regler (Gerät regelt die Lautstärke selbst) bleibt der Knopf ein Stummschalter
                    if (!box || box.classList.contains('hide')) return;
                    if (vb.classList.contains(OFFEN)) return;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    oeffnen(vb);
                } catch (err) { /* Klick normal weiterlaufen lassen */ }
            }, true);

            // Klick daneben schließt. Auf dem Bild selbst wird der Druck verschluckt, damit er nicht pausiert.
            window.addEventListener('pointerdown', function (e) {
                try {
                    var offen = offene();
                    if (!offen.length) return;
                    var t = e.target;
                    var drin = false;
                    offen.forEach(function (vb) {
                        if (vb.contains(t)) drin = true;
                        else schliessen(vb);
                    });
                    if (drin || !t || !t.closest) return;
                    if (!t.closest('.videoOsdBottom, .osdHeader, .dialogContainer, .upNextContainer, .skip-button-container')) {
                        e.stopImmediatePropagation();
                    }
                } catch (err) { /* nichts */ }
            }, true);

            // Escape schließt nur den Regler. Ohne Abfangen würde Jellyfin die Bedienleiste ausblenden.
            window.addEventListener('keydown', function (e) {
                try {
                    if (e.key !== 'Escape' && e.key !== 'Back') return;
                    var offen = offene();
                    if (!offen.length) return;
                    offen.forEach(schliessen);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                } catch (err) { /* nichts */ }
            }, true);

            // Prozentanzeige beim Ziehen (.werkstattVolumeDrag zeigt sie auch, wenn der Zeiger den Regler verlässt)
            ['input', 'change', 'valueset'].forEach(function (typ) {
                window.addEventListener(typ, function (e) {
                    try {
                        var t = e.target;
                        if (!t || !t.classList || !t.classList.contains('osdVolumeSlider')) return;
                        var vb = t.closest('.volumeButtons');
                        if (!vb || !vb.classList.contains(OFFEN)) return;
                        anzeigen(vb);
                        if (typ === 'input') vb.classList.add('werkstattVolumeDrag');
                        if (typ === 'change') vb.classList.remove('werkstattVolumeDrag');
                    } catch (err) { /* nichts */ }
                }, true);
            });
            window.addEventListener('pointerup', function () {
                document.querySelectorAll('.werkstattVolumeDrag').forEach(function (vb) { vb.classList.remove('werkstattVolumeDrag'); });
            }, true);

            kern.teile.lautstaerke = function () {
                var an = kern.an('lautstaerke');
                // Ohne CSS wirkt die Klasse nicht; sie bleibt stehen, damit eine fest geöffnete Ansicht
                // (Werkstatt „Lautstärke aufgeklappt“) beim Wiedereinschalten wieder offen ist.
                if (!an) return;
                document.querySelectorAll('.videoOsdBottom .volumeButtons').forEach(function (vb) {
                    if (!vb.classList.contains(OFFEN)) return;
                    var osd = vb.closest('.videoOsdBottom');
                    if (osd && (osd.classList.contains('videoOsdBottom-hidden') || osd.classList.contains('hide'))) {
                        schliessen(vb);
                        return;
                    }
                    // Offen, aber nicht vom Skript geöffnet (steht so im Markup): wie nach einem Klick vervollständigen
                    if (!vb.querySelector('.werkstattVolumeValue')) oeffnen(vb);
                    else anzeigen(vb); // Lautstärke kann sich auch per Tastatur ändern
                });
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript player-lautstaerke-aufklappen:", e);
    }
})();

// player-spuren-im-menue: Untertitel und Tonspur im Einstellungsmenü
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilSpuren() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.spuren) return;
            W.spuren = true;
            var kern = W.kern;
            var EINTRAEGE = [
                { knopf: 'btnSubtitles', id: 'werkstatt-untertitel', text: 'Untertitel' },
                { knopf: 'btnAudio', id: 'werkstatt-tonspur', text: 'Tonspur' }
            ];
            var MENUE = '[data-id="aspectratio"], [data-id="playbackrate"], [data-id="quality"], [data-id="repeatmode"], [data-id="suboffset"], [data-id="stats"]';

            // Die gerade sichtbare Player-Seite (Jellyfin behält ältere Seiten versteckt im DOM)
            var playerSeite = function () {
                var seiten = document.querySelectorAll('#videoOsdPage');
                for (var i = 0; i < seiten.length; i++) {
                    if (!seiten[i].classList.contains('hide')) return seiten[i];
                }
                return null;
            };

            // Unsichtbare Knöpfe genau über das Zahnrad legen (egal, welcher Vorfahr sie positioniert)
            var ankern = function (seite) {
                var zahnrad = seite.querySelector('.videoOsdBottom .btnVideoOsdSettings');
                if (!zahnrad) return false;
                var r = zahnrad.getBoundingClientRect();
                if (!r.width) return false;
                var soll = [r.left, r.top, r.width, r.height].map(Math.round).join(',');
                var geaendert = false;
                EINTRAEGE.forEach(function (x) {
                    var b = seite.querySelector('.videoOsdBottom .' + x.knopf);
                    if (!b || b.classList.contains('hide') || b.getAttribute('data-werkstatt-anker') === soll) return;
                    b.style.left = '0px';
                    b.style.top = '0px';
                    b.style.width = r.width + 'px';
                    b.style.height = r.height + 'px';
                    var n = b.getBoundingClientRect();
                    b.style.left = (r.left - n.left) + 'px';
                    b.style.top = (r.top - n.top) + 'px';
                    b.setAttribute('data-werkstatt-anker', soll);
                    geaendert = true;
                });
                return geaendert;
            };

            var loesen = function () {
                document.querySelectorAll('[data-werkstatt-anker]').forEach(function (b) {
                    b.removeAttribute('data-werkstatt-anker');
                    b.style.left = b.style.top = b.style.width = b.style.height = '';
                });
            };

            // Jellyfin hat das Menü schon platziert, bevor die neuen Einträge da waren: unten nicht überstehen lassen
            var einpassen = function (dlg) {
                // Im Handy-Layout liegt das Menü als Sheet unten (CSS), dort nichts verschieben
                if (document.documentElement.classList.contains('layout-mobile')) return;
                if (dlg.style.position !== 'fixed') return;
                var r = dlg.getBoundingClientRect();
                var h = window.innerHeight;
                if (r.bottom > h - 10) dlg.style.top = Math.max(10, h - r.height - 20) + 'px';
            };

            var ausloesen = function (knopf, dlg) {
                var seite = playerSeite();
                if (seite) ankern(seite);
                if (!kern.jellyfin()) {
                    // Werkstatt: kein Jellyfin, das die Auswahl öffnen könnte
                    knopf.click();
                    return;
                }
                // Erst klicken, wenn Jellyfin das Menü samt Verlaufseintrag geschlossen hat
                var start = Date.now();
                (function warten() {
                    if (dlg.isConnected && Date.now() - start < 1500) setTimeout(warten, 40);
                    else setTimeout(function () { try { knopf.click(); } catch (e) { /* nichts */ } }, 60);
                })();
            };

            var ergaenzen = function (dlg, seite) {
                var scroller = dlg.querySelector('.actionSheetScroller');
                var vorlage = dlg.querySelector('.actionSheetMenuItem');
                if (!scroller || !vorlage) return false;
                var vor = scroller.firstChild;
                var neu = false;
                EINTRAEGE.forEach(function (x) {
                    var knopf = seite.querySelector('.videoOsdBottom .' + x.knopf);
                    if (!knopf || knopf.classList.contains('hide')) return;
                    var b = document.createElement('button');
                    b.type = 'button';
                    b.setAttribute('is', 'emby-button');
                    b.className = vorlage.className + ' werkstattTrackItem';
                    b.setAttribute('data-id', x.id);
                    b.innerHTML = '<div class="listItemBody actionsheetListItemBody"><div class="listItemBodyText actionSheetItemText"></div></div>';
                    b.querySelector('.actionSheetItemText').textContent = x.text;
                    // Kein stopPropagation: Jellyfins actionSheet soll den Klick sehen und sich schließen
                    b.addEventListener('click', function () { ausloesen(knopf, dlg); });
                    scroller.insertBefore(b, vor);
                    neu = true;
                });
                return neu;
            };

            kern.teile.spuren = function () {
                var an = kern.an('spuren');
                if (!an) {
                    document.querySelectorAll('.werkstattTrackItem').forEach(function (b) { b.parentNode.removeChild(b); });
                    loesen();
                    return;
                }
                var seite = playerSeite();
                if (!seite) return;
                if (ankern(seite) && !kern.jellyfin() && !W.spurenPlatziert) {
                    // Werkstatt: das Platzierungsskript der Demo richtet offene Menüs bei resize neu aus
                    W.spurenPlatziert = true;
                    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* nichts */ }
                }
                document.querySelectorAll('.actionSheet').forEach(function (dlg) {
                    if (dlg.querySelector('.werkstattTrackItem') || !dlg.querySelector(MENUE)) return;
                    if (ergaenzen(dlg, seite)) {
                        einpassen(dlg);
                        setTimeout(function () { einpassen(dlg); }, 200);
                    }
                });
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript player-spuren-im-menue:", e);
    }
})();

// player-restzeit-umschalten: Zeit rechts: Klick wechselt Restzeit und Länge
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilRestzeit() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.restzeit) return;
            W.restzeit = true;
            var kern = W.kern;
            var SCHLUESSEL = 'werkstatt-restzeit';
            var HINWEIS = 'Klicken: Restzeit oder Gesamtlänge';

            var sekunden = function (text) {
                var t = String(text || '').replace(/[^\d:]/g, '');
                if (!t) return null;
                return t.split(':').reduce(function (s, v) { return s * 60 + (parseInt(v, 10) || 0); }, 0);
            };
            var zwei = function (n) { return (n < 10 ? '0' : '') + n; };
            // wie datetime.getDisplayRunningTime(): 1:08:24 bzw. 5:21
            var zeit = function (s) {
                s = Math.max(0, Math.round(s));
                var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
                return (h ? h + ':' + zwei(m) : String(m)) + ':' + zwei(x);
            };
            var restzeitGewaehlt = function () {
                try { return localStorage.getItem(SCHLUESSEL) !== '0'; } catch (e) { return true; }
            };

            // Werkstatt: Werte einmal aus den Texten lesen, danach nur noch anzeigen
            var zeigen = function (el) {
                var pos = el.parentNode && el.parentNode.querySelector('.osdPositionText');
                if (!pos) return;
                if (!el.hasAttribute('data-werkstatt-gesamt')) {
                    var p = sekunden(pos.textContent) || 0;
                    var d = sekunden(el.textContent);
                    if (d == null) return;
                    var gesamt = el.textContent.trim().charAt(0) === '-' ? p + d : d;
                    el.setAttribute('data-werkstatt-gesamt', gesamt);
                    el.setAttribute('data-werkstatt-position', p);
                }
                var g = +el.getAttribute('data-werkstatt-gesamt');
                var q = +el.getAttribute('data-werkstatt-position');
                var text = restzeitGewaehlt() ? '-' + zeit(g - q) : zeit(g);
                if (el.textContent !== text) el.textContent = text;
            };

            window.addEventListener('click', function (e) {
                try {
                    if (!kern.an('restzeit') || kern.jellyfin()) return;
                    var el = e.target && e.target.closest ? e.target.closest('.videoOsdBottom .osdDurationText') : null;
                    if (!el) return;
                    try { localStorage.setItem(SCHLUESSEL, restzeitGewaehlt() ? '0' : '1'); } catch (err) { /* ohne Speicher nur für diesmal */ }
                    zeigen(el);
                } catch (err) { /* nichts */ }
            }, true);

            kern.teile.restzeit = function () {
                var an = kern.an('restzeit');
                document.querySelectorAll('.videoOsdBottom .osdDurationText').forEach(function (el) {
                    if (!an) {
                        if (el.getAttribute('title') === HINWEIS) el.removeAttribute('title');
                        return;
                    }
                    if (!el.getAttribute('title')) el.setAttribute('title', HINWEIS);
                    if (!kern.jellyfin()) zeigen(el);
                });
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript player-restzeit-umschalten:", e);
    }
})();

// musikleiste-knoepfe: Musikleiste: Wiederholen, Zurück, Pause, Weiter, Zufall
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilMusikleiste() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.musikleiste) return;
            W.musikleiste = true;
            var kern = W.kern;

            // Knopf „Wiedergabeliste“ am Desktop: öffnet die Seite „Aktuelle Wiedergabe“ mit der Warteschlange,
            // so wie Jellyfin beim Tippen auf die Leiste (nowPlayingBar.js: appRouter.showNowPlaying()).
            // Der Klick geht nicht weiter an die Leiste, sonst öffnete Jellyfin die Seite ein zweites Mal.
            var KNOPF = 'werkstattBtnWarteschlange';
            var knopfWeg = function () {
                document.querySelectorAll('.' + KNOPF).forEach(function (b) { b.parentNode.removeChild(b); });
            };
            window.addEventListener('click', function (e) {
                try {
                    var b = e.target && e.target.closest && e.target.closest('.' + KNOPF);
                    if (!b) return;
                    e.preventDefault();
                    e.stopPropagation();
                    var r = (window.Emby && window.Emby.Page) || window.appRouter;
                    if (r && typeof r.showNowPlaying === 'function') r.showNowPlaying();
                    else if (r && typeof r.show === 'function') r.show('queue');
                } catch (err) { /* nichts */ }
            }, true);

            kern.teile.musikleiste = function () {
                var an = kern.an('musikleiste');
                if (!an) {
                    ['leiste-weiter', 'leiste-wiederholen', 'leiste-zufall', 'leiste-zeit'].forEach(kern.zurueck);
                    knopfWeg();
                    return;
                }
                var leiste = document.querySelector('.nowPlayingBar');
                if (!leiste) return;
                var mitte = leiste.querySelector('.nowPlayingBarCenter');
                var rechts = leiste.querySelector('.nowPlayingBarRight');
                if (!mitte || !rechts) return;
                // Handy: Jellyfin legt „Nächstes Lied“ dort rechts statt in die Mitte. Mit dem Handy-Schalter
                // kommt es in die Mitte hinter Play/Pause, damit die Reihe wie am Desktop aussieht.
                var mobil = document.documentElement.classList.contains('layout-mobile') && kern.an('musikleiste-mobil');
                if (!mobil) {
                    kern.zurueck('leiste-weiter');
                } else if (!mitte.querySelector('.nextTrackButton')) {
                    var weiterRechts = rechts.querySelector('.nextTrackButton');
                    var spielen = mitte.querySelector('.playPauseButton');
                    if (weiterRechts && spielen) kern.verschieben('leiste-weiter', weiterRechts, mitte, spielen.nextSibling);
                }
                var zurueck = mitte.querySelector('.previousTrackButton');
                var weiter = mitte.querySelector('.nextTrackButton') || mitte.querySelector('.playPauseButton');
                var wiederholen = rechts.querySelector('.toggleRepeatButton');
                var zufall = rechts.querySelector('.btnShuffleQueue');
                var zeit = mitte.querySelector('.nowPlayingBarCurrentTime');
                if (wiederholen && zurueck) kern.verschieben('leiste-wiederholen', wiederholen, mitte, zurueck);
                if (zufall && weiter) kern.verschieben('leiste-zufall', zufall, mitte, weiter.nextSibling);
                if (zeit) kern.verschieben('leiste-zeit', zeit, rechts, null);

                if (mobil || document.documentElement.classList.contains('layout-mobile')) {
                    knopfWeg();
                } else if (!rechts.querySelector('.' + KNOPF)) {
                    var vor = rechts.querySelector('.openLyricsButton') || rechts.querySelector('.nowPlayingBarUserDataButtons');
                    var b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'paper-icon-button-light mediaButton ' + KNOPF;
                    b.title = 'Wiedergabeliste';
                    b.setAttribute('aria-label', 'Wiedergabeliste');
                    b.innerHTML = '<span class="material-icons queue_music" aria-hidden="true"></span>';
                    rechts.insertBefore(b, vor || null);
                }
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript musikleiste-knoepfe:", e);
    }
})();

// warteschlange-ohne-animation: Warteschlange: Cover bleibt, Titel in Akzentfarbe statt Equalizer
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilCover() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.cover) return;
            W.cover = true;
            var kern = W.kern;

            kern.teile.cover = function () {
                var an = kern.an('warteschlange');
                if (!an) {
                    document.querySelectorAll('[data-werkstatt-cover]').forEach(function (el) {
                        el.style.removeProperty('background-image');
                        var alt = el.getAttribute('data-werkstatt-cover-alt');
                        if (alt) el.style.backgroundImage = alt;
                        el.removeAttribute('data-werkstatt-cover');
                        el.removeAttribute('data-werkstatt-cover-alt');
                    });
                    return;
                }
                // Cover an Bildern zurücknehmen, die nicht mehr der laufende Titel sind
                document.querySelectorAll('[data-werkstatt-cover]:not(.playlistIndexIndicatorImage)').forEach(function (el) {
                    el.style.removeProperty('background-image');
                    var alt = el.getAttribute('data-werkstatt-cover-alt');
                    if (alt) el.style.backgroundImage = alt;
                    el.removeAttribute('data-werkstatt-cover');
                    el.removeAttribute('data-werkstatt-cover-alt');
                });
                document.querySelectorAll('.playlistIndexIndicatorImage').forEach(function (el) {
                    if (el.hasAttribute('data-werkstatt-cover')) return;
                    var inline = el.style.backgroundImage;
                    var quelle = el.getAttribute('data-src');
                    var bild = inline && inline !== 'none' ? inline : (quelle ? 'url("' + quelle.replace(/["\\\\]/g, '') + '")' : '');
                    if (!bild) return;
                    if (inline && inline !== 'none') el.setAttribute('data-werkstatt-cover-alt', inline);
                    el.style.setProperty('background-image', bild, 'important');
                    el.setAttribute('data-werkstatt-cover', '');
                });
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript warteschlange-ohne-animation:", e);
    }
})();

// wiedergabeseite-schliessen: Desktop: Knopf zum Schließen der Wiedergabeseite
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilSchliessen() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.schliessen) return;
            W.schliessen = true;
            var kern = W.kern;
            var KLASSE = 'werkstattSchliessen';

            var zurueck = function () {
                try {
                    var router = window.appRouter || (window.Emby && window.Emby.Page);
                    if (router && typeof router.back === 'function') router.back();
                    else history.back();
                } catch (e) { try { history.back(); } catch (e2) { /* nichts */ } }
            };

            window.addEventListener('click', function (e) {
                try {
                    var knopf = e.target && e.target.closest ? e.target.closest('.' + KLASSE) : null;
                    if (!knopf) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (kern.jellyfin()) zurueck();
                } catch (err) { /* nichts */ }
            }, true);

            kern.teile.schliessen = function () {
                var an = kern.an('schliessen') && document.documentElement.classList.contains('layout-desktop');
                if (!an) {
                    document.querySelectorAll('.' + KLASSE).forEach(function (b) { b.parentNode.removeChild(b); });
                    return;
                }
                document.querySelectorAll('#nowPlayingPage .nowPlayingInfoContainer').forEach(function (box) {
                    if (box.querySelector(':scope > .' + KLASSE)) return;
                    box.insertAdjacentHTML('afterbegin',
                        '<button type="button" class="' + KLASSE + ' paper-icon-button-light" title="Schließen" aria-label="Schließen">' +
                        '<span class="material-icons expand_more" aria-hidden="true"></span></button>');
                });
            };
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript wiedergabeseite-schliessen:", e);
    }
})();

// player-fest: Wiedergabeseite: Player bleibt beim Scrollen stehen
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilPlayerFest() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.playerFest) return;
            W.playerFest = true;
            var kern = W.kern;
            kern.teile.playerFest = function () {
                var seiten = document.querySelectorAll('#nowPlayingPage');
                for (var i = 0; i < seiten.length; i++) {
                    var p = seiten[i];
                    var aus = !kern.an('player-fest') || !document.documentElement.classList.contains('layout-desktop') || p.classList.contains('hide');
                    if (aus) continue;
                    var inhalt = p.querySelector('.remoteControlContent');
                    var player = inhalt && inhalt.querySelector(':scope > .nowPlayingInfoContainer');
                    if (!player) continue;
                    var oben = inhalt.offsetTop + (parseFloat(getComputedStyle(inhalt).paddingTop) || 0);
                    var wert = Math.round(oben) + 'px';
                    if (oben > 0 && p.style.getPropertyValue('--werkstatt-player-oben') !== wert) p.style.setProperty('--werkstatt-player-oben', wert);
                }
            };
            window.addEventListener('resize', kern.planen);
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript player-fest:", e);
    }
})();

// mini-fortschritt: Handy: Fortschritt im Miniplayer
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilMiniFortschritt() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.miniFortschritt) return;
            W.miniFortschritt = true;
            var kern = W.kern;
            var TAKT = 250;
            var zuletzt = -1;

            var aktiv = function () {
                return document.documentElement.classList.contains('layout-mobile') && kern.an('mini-fortschritt');
            };

            var zeichnen = function () {
                try {
                    var leiste = document.querySelector('.appfooter .nowPlayingBar');
                    var balken = leiste && leiste.querySelector(':scope > .werkstattMiniFortschritt');
                    if (!aktiv()) {
                        if (balken) balken.parentNode.removeChild(balken);
                        zuletzt = -1;
                        return;
                    }
                    if (!leiste || leiste.classList.contains('hide') || leiste.classList.contains('nowPlayingBar-hidden')) return;
                    var regler = leiste.querySelector('.nowPlayingBarPositionSlider');
                    if (!regler) return;
                    if (!balken) {
                        leiste.insertAdjacentHTML('beforeend', '<div class="werkstattMiniFortschritt" aria-hidden="true"><div></div></div>');
                        balken = leiste.querySelector(':scope > .werkstattMiniFortschritt');
                        zuletzt = -1;
                    }
                    var wert = parseFloat(regler.value);
                    if (!isFinite(wert)) wert = 0;
                    wert = Math.max(0, Math.min(100, wert));
                    if (wert === zuletzt) return;
                    var fuellung = balken.firstElementChild;
                    var sprung = zuletzt < 0 || wert < zuletzt || wert - zuletzt > 5;
                    fuellung.style.transition = sprung ? 'none' : 'transform ' + TAKT + 'ms linear';
                    fuellung.style.transform = 'scaleX(' + (wert / 100) + ')';
                    zuletzt = wert;
                } catch (e) { /* nichts */ }
            };
            setInterval(zeichnen, TAKT);
            kern.teile.miniFortschritt = zeichnen;
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript mini-fortschritt:", e);
    }
})();

// wiedergabeseite-mobil-liste: Handy: Player, Wiedergabeliste und Songtexte als Karten, die hochfahren
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilWiedergabeseite() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.wiedergabeseite) return;
            W.wiedergabeseite = true;
            var kern = W.kern;
            var RUHIG = 'data-werkstatt-ruhig';
            var zug = null;          // laufendes Ziehen
            var verkleinert = null;  // Werkstatt: weggeschobene Karte und die der Leiste genommenen Klassen
            var listeVorher = null;  // Zustand der Liste vor Jellyfins Klick auf „Wiedergabeliste“

            var mobil = function () { return document.documentElement.classList.contains('layout-mobile'); };
            var aktiv = function () { return kern.an('wiedergabeseite') && mobil(); };
            var sichtbar = function (id) {
                var alle = document.querySelectorAll('#' + id);
                for (var i = 0; i < alle.length; i++) {
                    if (!alle[i].classList.contains('hide')) return alle[i];
                }
                return null;
            };
            var seite = function () { return sichtbar('nowPlayingPage'); };
            var textSeite = function () { return sichtbar('lyricPage'); };
            var istKarte = function (x) { return !!x && (x.id === 'nowPlayingPage' || x.id === 'lyricPage'); };
            var listeOffen = function (p) {
                var l = p && p.querySelector('#playlist');
                return !!l && !l.classList.contains('hide');
            };
            var musikleiste = function () { return document.querySelector('.appfooter .nowPlayingBar'); };

            // Einmal von unten hochfahren (für Elemente, die schon sichtbar sind)
            var hochfahren = function (el) {
                if (!el) return;
                el.classList.remove('werkstattHoch');
                void el.offsetWidth;
                el.classList.add('werkstattHoch');
                var fertig = function () {
                    el.classList.remove('werkstattHoch');
                    el.removeEventListener('animationend', fertig);
                };
                el.addEventListener('animationend', fertig);
                setTimeout(fertig, 700);
            };
            // Seite zeigen, ohne dass sie hochfährt
            var ruhigZeigen = function (x) {
                if (istKarte(x)) x.setAttribute(RUHIG, '');
                x.classList.remove('hide');
            };
            var leisteZeigen = function (leiste) {
                var genommen = [];
                if (leiste) {
                    ['hide', 'nowPlayingBar-hidden'].forEach(function (k) {
                        if (leiste.classList.contains(k)) { leiste.classList.remove(k); genommen.push(k); }
                    });
                }
                return genommen;
            };

            // Werkstatt: dasselbe wie remotecontrol.js beim Klick auf „Wiedergabeliste“
            var nachbilden = function (p, oeffnen) {
                var liste = p.querySelector('#playlist');
                var leiste = p.querySelector('.playlistSectionButton');
                var speichern = p.querySelector('.btnSavePlaylist');
                var laut = p.querySelector('.playlistSectionButton .volumecontrol');
                if (liste) liste.classList.toggle('hide', !oeffnen);
                if (speichern) speichern.classList.toggle('hide', !oeffnen);
                if (laut) laut.classList.toggle('hide', oeffnen);
                if (leiste) leiste.classList.toggle('playlistSectionButtonTransparent', !oeffnen);
                if (oeffnen) hochfahren(liste);
            };
            var listeSchliessen = function (p) {
                if (kern.jellyfin()) {
                    var knopf = p.querySelector('.btnTogglePlaylist');
                    if (knopf) knopf.click();
                } else {
                    nachbilden(p, false);
                }
            };

            // Jellyfin 10.11 legt den Router als window.Emby.Page an (appRouter.js), nicht als window.appRouter
            var zurueck = function () {
                try {
                    var r = (window.Emby && window.Emby.Page) || window.appRouter;
                    if (r && typeof r.back === 'function') r.back();
                    else history.back();
                } catch (e) { history.back(); }
            };
            // Werkstatt: Karte bleibt unten, beim Player erscheint die Musikleiste
            var werkstattWeg = function (p) {
                var leiste = p.id === 'nowPlayingPage' ? musikleiste() : null;
                verkleinert = { seite: p, leiste: leiste, genommen: leisteZeigen(leiste) };
            };
            var seiteZurueckholen = function () {
                var v = verkleinert;
                verkleinert = null;
                if (!v) return;
                if (v.leiste) v.genommen.forEach(function (k) { v.leiste.classList.add(k); });
                lage(v.seite, null, 0);
                hochfahren(v.seite);
            };

            var lage = function (el, dy, dauer, art) {
                el.style.transition = dauer ? 'transform ' + dauer + 's ' + art : 'none';
                el.style.transform = dy == null ? '' : 'translateY(' + dy + ')';
            };

            /*
             * Echtes Jellyfin: Hinter der weggezogenen Karte soll die Seite stehen, zu der es zurückgeht,
             * nicht der leere Hintergrund. viewContainer.js hält bis zu drei Seiten in .mainAnimatedPages
             * und versteckt die nicht aktiven per .hide. Welche darunter gehört, merkt sich viewbeforeshow
             * an der Karte (__werkstattDarunter); sonst gilt die zuletzt sichtbare andere Seite (vorherige).
             * Beim Ziehen wird sie sichtbar gemacht, beim Player auch die Musikleiste; bei Abbruch wieder
             * versteckt. Nach back() regelt Jellyfin beides selbst.
             */
            var vorherige = null;
            var dahinterZeigen = function (z) {
                z.vorher = null;
                z.leisteGenommen = [];
                if (!kern.jellyfin()) return;
                var v = z.seite.__werkstattDarunter;
                if (!v || !v.isConnected) v = vorherige;
                if (v && v.isConnected && v !== z.seite && v.classList.contains('hide')) {
                    ruhigZeigen(v);
                    z.vorher = v;
                }
                if (z.seite.id === 'nowPlayingPage') {
                    z.leiste = musikleiste();
                    z.leisteGenommen = leisteZeigen(z.leiste);
                }
            };
            var dahinterAufraeumen = function (z, abgebrochen) {
                if (!abgebrochen) return;
                if (z.vorher) z.vorher.classList.add('hide');
                if (z.leiste) z.leisteGenommen.forEach(function (k) { z.leiste.classList.add(k); });
            };

            window.addEventListener('pointerdown', function (e) {
                try {
                    if (!aktiv() || e.button > 0) return;
                    var t = e.target;
                    if (!t || !t.closest) return;
                    var ziel = null, art = null, p = null;
                    var tp = textSeite();
                    if (tp && t.closest('#lyricPage .werkstattTextGriff')) {
                        p = tp; ziel = tp; art = 'seite';
                    } else {
                        p = seite();
                        if (!p) return;
                        if (listeOffen(p) && t.closest('.werkstattListeGriff')) {
                            ziel = p.querySelector('#playlist'); art = 'liste';
                        } else if (!listeOffen(p) && t.closest('.werkstattSeitenGriff')) {
                            ziel = p; art = 'seite';
                        }
                    }
                    if (!ziel) return;
                    zug = { el: ziel, art: art, seite: p, y0: e.clientY, dy: 0, id: e.pointerId };
                    lage(ziel, '0px', 0);
                    ziel.classList.add('werkstattBewegt');
                    if (art === 'seite') dahinterZeigen(zug);
                    try { t.setPointerCapture(e.pointerId); } catch (err) { /* nichts */ }
                    e.preventDefault();
                } catch (err) { /* nichts */ }
            }, true);

            window.addEventListener('pointermove', function (e) {
                try {
                    if (!zug || e.pointerId !== zug.id) return;
                    zug.dy = Math.max(0, e.clientY - zug.y0);
                    zug.el.style.transform = 'translateY(' + zug.dy + 'px)';
                } catch (err) { /* nichts */ }
            }, true);

            var loslassen = function (e) {
                try {
                    if (!zug || (e && e.pointerId !== zug.id)) return;
                    var z = zug;
                    zug = null;
                    var hoehe = z.el.getBoundingClientRect().height || window.innerHeight;
                    var schwelle = Math.min(z.art === 'liste' ? 140 : 160, hoehe * 0.25);
                    var tippen = z.dy < 6 && e && e.type === 'pointerup';
                    if (z.dy < schwelle && !tippen) {
                        lage(z.el, '0px', 0.2, 'ease-out');
                        setTimeout(function () {
                            lage(z.el, null, 0);
                            z.el.classList.remove('werkstattBewegt');
                            if (z.art === 'seite') dahinterAufraeumen(z, true);
                        }, 220);
                        return;
                    }
                    // Ganz hinausgleiten, erst dann schließen
                    lage(z.el, '100%', 0.22, 'ease-in');
                    setTimeout(function () {
                        try {
                            if (z.art === 'liste') {
                                listeSchliessen(z.seite);
                                lage(z.el, null, 0);
                                z.el.classList.remove('werkstattBewegt');
                            } else if (kern.jellyfin()) {
                                zurueck();
                                // Jellyfin versteckt die Karte jetzt; danach die Lage zurücksetzen
                                setTimeout(function () {
                                    lage(z.el, null, 0);
                                    z.el.classList.remove('werkstattBewegt');
                                    dahinterAufraeumen(z, false);
                                }, 400);
                            } else {
                                z.el.classList.remove('werkstattBewegt');
                                werkstattWeg(z.seite);
                            }
                        } catch (err) { lage(z.el, null, 0); z.el.classList.remove('werkstattBewegt'); }
                    }, 230);
                } catch (err) { /* nichts */ }
            };
            window.addEventListener('pointerup', loslassen, true);
            window.addEventListener('pointercancel', loslassen, true);

            window.addEventListener('click', function (e) {
                try {
                    if (!aktiv()) return;
                    var t = e.target;
                    if (!t || !t.closest) return;
                    var knopf = t.closest('#nowPlayingPage .btnTogglePlaylist');
                    if (kern.jellyfin()) {
                        // Zustand vor Jellyfins Klick merken; danach (Klick unten am window) hochfahren
                        listeVorher = knopf ? listeOffen(knopf.closest('#nowPlayingPage')) : null;
                        return;
                    }
                    // Werkstatt: Tippen auf die Musikleiste bzw. den Songtext-Knopf holt die weggezogene Karte zurück
                    if (verkleinert && !t.closest('input') &&
                        ((verkleinert.seite.id === 'nowPlayingPage' && t.closest('.nowPlayingBar') && !t.closest('button')) ||
                         (verkleinert.seite.id === 'lyricPage' && t.closest('.btnLyrics')))) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        seiteZurueckholen();
                        return;
                    }
                    // Werkstatt: „Wiedergabeliste“ öffnet und schließt wie bei Jellyfin
                    if (!knopf) return;
                    var p = knopf.closest('#nowPlayingPage');
                    nachbilden(p, !listeOffen(p));
                } catch (err) { /* nichts */ }
            }, true);

            window.addEventListener('click', function (e) {
                try {
                    if (listeVorher === null) return;
                    var vorher = listeVorher;
                    listeVorher = null;
                    var knopf = e.target && e.target.closest && e.target.closest('#nowPlayingPage .btnTogglePlaylist');
                    var p = knopf && knopf.closest('#nowPlayingPage');
                    if (p && !vorher && listeOffen(p)) hochfahren(p.querySelector('#playlist'));
                } catch (err) { /* nichts */ }
            });

            // Seitenwechsel in Jellyfin: alte Seite unter die hochfahrende Karte legen
            var zuletzt = null;
            document.addEventListener('viewbeforehide', function (e) { zuletzt = e.target; }, true);
            document.addEventListener('viewbeforeshow', function (e) {
                try {
                    var neu = e.target, alt = zuletzt;
                    zuletzt = null;
                    if (!aktiv() || !istKarte(neu) || !alt || alt === neu || !alt.classList) return;
                    // Zurück von den Songtexten zum Player: der liegt schon da
                    if (neu.id === 'nowPlayingPage' && alt.id === 'lyricPage') {
                        neu.setAttribute(RUHIG, '');
                        return;
                    }
                    neu.__werkstattDarunter = alt;
                    var bleibt = neu.id === 'lyricPage' && alt.id === 'nowPlayingPage';
                    Promise.resolve().then(function () {
                        if (!alt.isConnected || neu.classList.contains('hide')) return;
                        ruhigZeigen(alt);
                        if (!bleibt) {
                            setTimeout(function () {
                                if (alt.isConnected && !neu.classList.contains('hide') && !(zug && zug.seite === neu)) alt.classList.add('hide');
                            }, 400);
                        }
                    });
                } catch (err) { /* nichts */ }
            }, true);

            kern.teile.wiedergabeseite = function () {
                if (!aktiv()) {
                    kern.zurueck('seite-songtext');
                    document.querySelectorAll('.werkstattListeGriff, .werkstattSeitenGriff, .werkstattTextGriff').forEach(function (g) { g.parentNode.removeChild(g); });
                    if (verkleinert) seiteZurueckholen();
                    return;
                }
                // Versteckte Karten dürfen beim nächsten Zeigen wieder hochfahren
                document.querySelectorAll('#nowPlayingPage.hide[' + RUHIG + '], #lyricPage.hide[' + RUHIG + ']').forEach(function (x) { x.removeAttribute(RUHIG); });
                // Zuletzt sichtbare andere Seite merken (Ziel von back()), nicht während des Ziehens
                if (!zug) {
                    document.querySelectorAll('.mainAnimatedPages > .mainAnimatedPage').forEach(function (x) {
                        if (!istKarte(x) && !x.classList.contains('hide')) vorherige = x;
                    });
                }

                // Unterkante der Kopfzeile, am Wurzelelement für alle Karten (nicht während einer Bewegung)
                var kopf = document.querySelector('.skinHeader');
                if (kopf && !zug && !verkleinert) {
                    var wert = Math.max(0, Math.round(kopf.getBoundingClientRect().bottom)) + 'px';
                    var root = document.documentElement;
                    if (root.style.getPropertyValue('--werkstatt-kopf') !== wert) root.style.setProperty('--werkstatt-kopf', wert);
                }

                var tp = textSeite();
                if (tp && !tp.querySelector(':scope > .werkstattTextGriff')) {
                    tp.insertAdjacentHTML('afterbegin', '<div class="werkstattTextGriff" role="button" aria-label="Songtexte schließen" title="Zum Schließen nach unten ziehen"></div>');
                }

                var p = seite();
                if (!p) return;
                if (p.style.getPropertyValue('--werkstatt-kopf')) p.style.removeProperty('--werkstatt-kopf');

                var leiste = p.querySelector('.playlistSectionButton');
                var songtext = p.querySelector('.nowPlayingSecondaryButtons .btnLyrics');
                var liste = leiste && leiste.querySelector('.btnTogglePlaylist');
                if (songtext && liste) kern.verschieben('seite-songtext', songtext, leiste, liste.nextSibling);

                // Griffe: im Sheet als erstes Kind der Liste (Jellyfin schreibt die Liste neu, dann wieder einfügen)
                var pl = p.querySelector('#playlist');
                if (pl && pl.firstElementChild && !pl.firstElementChild.classList.contains('werkstattListeGriff')) {
                    var alt = pl.querySelector('.werkstattListeGriff');
                    if (alt) alt.parentNode.removeChild(alt);
                    pl.insertAdjacentHTML('afterbegin', '<div class="werkstattListeGriff" role="button" aria-label="Wiedergabeliste schließen" title="Zum Schließen nach unten ziehen"></div>');
                }
                if (!p.querySelector(':scope > .werkstattSeitenGriff')) {
                    p.insertAdjacentHTML('afterbegin', '<div class="werkstattSeitenGriff" role="button" aria-label="Wiedergabe verkleinern" title="Zum Verkleinern nach unten ziehen"></div>');
                }
            };
            window.addEventListener('resize', kern.planen);
            kern.planen();
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript wiedergabeseite-mobil-liste:", e);
    }
})();

// warteschlange-wischen-mobil: Handy: Titel aus der Wiedergabeliste wischen
(function () {
    try {
(function werkstattKern() {
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.kern) return;
            var kern = W.kern = { teile: {}, wartet: 0, verschoben: {} };

            // Ist das CSS eines Schalters aktiv? Es setzt dafür :root { --werkstatt-NAME: 1; }
            kern.an = function (name) {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-' + name).trim() === '1';
                } catch (e) {
                    return false;
                }
            };

            // Echtes Jellyfin oder Werkstatt? Jellyfin legt window.ApiClient an, sobald ein Server verbunden ist.
            kern.jellyfin = function () {
                return !!window.ApiClient;
            };

            kern.ausfuehren = function () {
                kern.wartet = 0;
                Object.keys(kern.teile).forEach(function (k) {
                    try { kern.teile[k](); } catch (e) { /* ein Fehler in einem Teil hält die anderen nicht auf */ }
                });
            };

            kern.planen = function () {
                if (!kern.wartet) kern.wartet = setTimeout(kern.ausfuehren, 60);
            };

            // Element umhängen und an der alten Stelle einen Kommentar als Merker lassen
            kern.verschieben = function (k, el, ziel, vor) {
                if (!el || !ziel) return;
                var alt = kern.verschoben[k];
                if (!alt || alt.el !== el || !alt.anker.isConnected) {
                    var anker = document.createComment('werkstatt: ' + k);
                    el.parentNode.insertBefore(anker, el);
                    kern.verschoben[k] = { el: el, anker: anker };
                }
                if (el.parentNode === ziel && (vor ? el.nextSibling === vor : !el.nextSibling)) return;
                ziel.insertBefore(el, vor || null);
            };

            // Element an die gemerkte Stelle zurücksetzen
            kern.zurueck = function (k) {
                var v = kern.verschoben[k];
                if (!v) return;
                delete kern.verschoben[k];
                if (v.anker.isConnected) {
                    v.anker.parentNode.insertBefore(v.el, v.anker);
                    v.anker.parentNode.removeChild(v.anker);
                }
            };

            var starten = function () {
                try {
                    new MutationObserver(kern.planen).observe(document.documentElement, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                    });
                } catch (e) { /* ohne Observer bleibt es bei den Durchläufen nach Klicks */ }
                kern.planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) { /* nichts tun ist besser als Jellyfin zu stören */ }
    })();
(function teilWischen() {
        try {
            var W = window.__werkstatt;
            if (!W || !W.kern || W.wischen) return;
            W.wischen = true;
            var kern = W.kern;
            var SCHWELLE = 0.38;
            var g = null;        // laufende Geste
            var zuletzt = 0;     // Zeitpunkt des letzten Wischens

            var aktiv = function () {
                return kern.an('wischen') && document.documentElement.classList.contains('layout-mobile');
            };

            var rotAnlegen = function (zeile) {
                var liste = zeile.parentNode;
                var rot = document.createElement('div');
                rot.className = 'werkstattWischRot';
                rot.setAttribute('aria-hidden', 'true');
                rot.style.top = zeile.offsetTop + 'px';
                rot.style.height = zeile.offsetHeight + 'px';
                rot.style.right = Math.max(0, liste.clientWidth - zeile.offsetLeft - zeile.offsetWidth) + 'px';
                rot.style.width = '0px';
                liste.appendChild(rot);
                return rot;
            };

            var aufraeumen = function (z) {
                if (z.rot && z.rot.parentNode) z.rot.parentNode.removeChild(z.rot);
                z.zeile.classList.remove('werkstattWischt');
                z.zeile.style.transition = '';
                z.zeile.style.transform = '';
            };

            var entfernen = function (z) {
                var knopf = z.zeile.querySelector('[data-action="custom"][data-customaction="remove"]');
                var h = z.zeile.offsetHeight;
                // zusammenfallen lassen
                z.zeile.style.overflow = 'hidden';
                z.zeile.style.height = h + 'px';
                if (z.rot) { z.rot.style.transition = 'height 0.2s ease-in, opacity 0.2s'; }
                requestAnimationFrame(function () {
                    z.zeile.style.transition = 'transform 0.18s ease-in, height 0.2s ease-in 0.12s, margin 0.2s ease-in 0.12s, padding 0.2s ease-in 0.12s, opacity 0.2s 0.12s';
                    z.zeile.style.transform = 'translateX(-100%)';
                    z.zeile.style.height = '0px';
                    z.zeile.style.marginTop = z.zeile.style.marginBottom = '0px';
                    z.zeile.style.paddingTop = z.zeile.style.paddingBottom = '0px';
                    z.zeile.style.opacity = '0';
                    if (z.rot) { z.rot.style.height = '0px'; z.rot.style.opacity = '0'; }
                });
                setTimeout(function () {
                    try {
                        if (z.rot && z.rot.parentNode) z.rot.parentNode.removeChild(z.rot);
                        if (kern.jellyfin() && knopf) {
                            knopf.click();
                            // Falls Jellyfin die Liste nicht neu schreibt, die Zeile nicht verschwunden lassen
                            setTimeout(function () {
                                if (z.zeile.isConnected) {
                                    ['overflow', 'height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'opacity'].forEach(function (k) { z.zeile.style[k] = ''; });
                                    aufraeumen(z);
                                }
                            }, 1500);
                        } else if (z.zeile.parentNode) {
                            z.zeile.parentNode.removeChild(z.zeile);
                        }
                    } catch (e) { /* nichts */ }
                }, 340);
            };

            window.addEventListener('pointerdown', function (e) {
                try {
                    if (!aktiv() || e.button > 0) return;
                    var t = e.target;
                    if (!t || !t.closest) return;
                    var zeile = t.closest('#nowPlayingPage #playlist .listItem');
                    if (!zeile || t.closest('.listViewDragHandle, button, input')) return;
                    g = { zeile: zeile, x0: e.clientX, y0: e.clientY, dx: 0, id: e.pointerId, modus: 'offen', rot: null };
                } catch (err) { /* nichts */ }
            }, true);

            window.addEventListener('pointermove', function (e) {
                try {
                    if (!g || e.pointerId !== g.id) return;
                    var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
                    if (g.modus === 'offen') {
                        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
                        if (dx < 0 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                            g.modus = 'wischen';
                            g.x0 = e.clientX; // ab hier messen, damit die Zeile nicht springt
                            dx = 0;
                            g.zeile.classList.add('werkstattWischt');
                            g.zeile.style.transition = 'none';
                            g.rot = rotAnlegen(g.zeile);
                            try { g.zeile.setPointerCapture(e.pointerId); } catch (err) { /* nichts */ }
                        } else {
                            g = null; // gehört dem Scrollen
                            return;
                        }
                    }
                    var weg = Math.min(0, dx);
                    g.dx = weg;
                    g.zeile.style.transform = 'translateX(' + weg + 'px)';
                    g.rot.style.width = (-weg) + 'px';
                    g.rot.classList.toggle('werkstattWischGenug', -weg >= g.zeile.offsetWidth * SCHWELLE);
                    e.preventDefault();
                } catch (err) { /* nichts */ }
            }, { capture: true, passive: false });

            var loslassen = function (e) {
                try {
                    if (!g || (e && e.pointerId !== g.id)) return;
                    var z = g;
                    g = null;
                    if (z.modus !== 'wischen') return;
                    zuletzt = Date.now();
                    if (-z.dx >= z.zeile.offsetWidth * SCHWELLE && e && e.type === 'pointerup') {
                        entfernen(z);
                        return;
                    }
                    z.zeile.style.transition = 'transform 0.2s ease-out';
                    z.zeile.style.transform = 'translateX(0)';
                    if (z.rot) { z.rot.style.transition = 'width 0.2s ease-out'; z.rot.style.width = '0px'; }
                    setTimeout(function () { aufraeumen(z); }, 220);
                } catch (err) { /* nichts */ }
            };
            window.addEventListener('pointerup', loslassen, true);
            window.addEventListener('pointercancel', loslassen, true);

            // Nach einem Wischen keinen Klick durchlassen (Jellyfin würde den Titel abspielen)
            window.addEventListener('click', function (e) {
                if (Date.now() - zuletzt < 450 && e.target && e.target.closest && e.target.closest('#playlist')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }, true);
        } catch (e) { /* nichts */ }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript warteschlange-wischen-mobil:", e);
    }
})();

// farbwaehler: Theme-Farbe und Grundfarbe pro Benutzer wählen
(function () {
    try {
/* Farbwähler für Akzent- und Grundfarbe pro Benutzer (ElegantFin-Werkstatt, Schalter „farbwaehler“).
   Speichert in den Anzeige-Einstellungen des Benutzers (CustomPrefs.werkstattAkzent, CustomPrefs.werkstattGrundton). */
(function werkstattFarbwaehler(accentCss, grundtonCss, TOENE, STANDARD_TON) {
        'use strict';
        try {
            var W = window.__werkstatt = window.__werkstatt || {};
            if (W.farbwaehler) return;

            var STANDARD = '#f97316';
            var SCHLUESSEL = 'werkstattAkzent';
            var STYLE_ID = 'werkstatt-akzent';

            var TON_SCHLUESSEL = 'werkstattGrundton';
            var TON_STYLE_ID = 'werkstatt-grundton';
            TOENE = TOENE || [];

            var zustand = { user: null, hex: '', ton: '', wahl: 0 };
            var speicherKette = Promise.resolve();
            var tonTimer = 0;
            var speicherTimer = 0;
            var raf = 0;

            // ---------- Hilfen

            // Nimmt #rrggbb, #rgb, rgb(r, g, b) und r, g, b an und liefert #rrggbb oder ''
            function farbe(eingabe) {
                var s = String(eingabe == null ? '' : eingabe).trim().toLowerCase();
                var m = s.match(/^#?([0-9a-f]{6})$/);
                if (m) return '#' + m[1];
                m = s.match(/^#([0-9a-f]{3})$/);
                if (m) return '#' + m[1].split('').map(function (c) { return c + c; }).join('');
                m = s.match(/^rgba?\s*\((.*)\)$/);
                if (m) s = m[1].trim();
                m = s.match(/^(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*[,/]\s*[\d.]+%?)?$/);
                if (!m) return '';
                var n = m.slice(1, 4).map(Number);
                if (n.some(function (v) { return v > 255; })) return '';
                return '#' + n.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
            }

            function api() {
                var a = window.ApiClient;
                return a && typeof a.getCurrentUserId === 'function' ? a : null;
            }

            // 'demo' in der Werkstatt, sonst die Benutzer-ID oder '' (nicht angemeldet)
            function aktuellerBenutzer() {
                var a = api();
                if (!a) return 'demo';
                try { return a.getCurrentUserId() || ''; } catch (e) { return ''; }
            }

            // Zwischenspeicher: '#rrggbb', 'standard' oder null (unbekannt).
            // In der Werkstatt ('demo') gibt es keinen: Alle Rahmen teilen sich dort den localStorage, eine
            // Wahl soll aber nur im bedienten Rahmen gelten und nicht die Akzentfarbe der Seitenleiste
            // überstimmen. Die Wahl lebt dort also nur im Speicher des Rahmens.
            function merkerLesen(u) {
                if (u === 'demo') return null;
                try {
                    var v = window.localStorage.getItem(SCHLUESSEL + ':' + u);
                    if (v === 'standard') return 'standard';
                    return farbe(v) || null;
                } catch (e) { return null; }
            }

            function merkerSchreiben(u, hex) {
                if (u === 'demo') return;
                try { window.localStorage.setItem(SCHLUESSEL + ':' + u, hex || 'standard'); } catch (e) { /* privat oder voll */ }
            }

            function tonGueltig(id) {
                for (var i = 0; i < TOENE.length; i++) if (TOENE[i].id === id) return TOENE[i];
                return null;
            }

            // Zwischenspeicher der Grundfarbe: Vorlagen-ID, 'standard' oder null (unbekannt)
            function tonMerkerLesen(u) {
                if (u === 'demo') return null;
                try {
                    var v = window.localStorage.getItem(TON_SCHLUESSEL + ':' + u);
                    if (v === 'standard') return 'standard';
                    return tonGueltig(v) ? v : null;
                } catch (e) { return null; }
            }

            function tonMerkerSchreiben(u, id) {
                if (u === 'demo') return;
                try { window.localStorage.setItem(TON_SCHLUESSEL + ':' + u, id || 'standard'); } catch (e) { /* privat oder voll */ }
            }

            // ---------- Anwenden

            // Hält die style-Elemente hinter jedem anderen Stylesheet im body (Grundfarbe vor Akzentfarbe)
            function halten() {
                if (!document.body) return;
                [TON_STYLE_ID, STYLE_ID].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (!el) return;
                    var spaeter = document.querySelector('#' + id + ' ~ style:not(#' + TON_STYLE_ID + '):not(#' + STYLE_ID + '), #' + id + ' ~ link[rel~="stylesheet"], #' +
                        id + ' ~ * style, #' + id + ' ~ * link[rel~="stylesheet"]');
                    if (el.parentNode !== document.body || spaeter) document.body.appendChild(el);
                });
                var ton = document.getElementById(TON_STYLE_ID), akz = document.getElementById(STYLE_ID);
                if (ton && akz && (ton.compareDocumentPosition(akz) & 2)) document.body.appendChild(akz);
            }

            function tonAnwenden(id) {
                var p = tonGueltig(id);
                zustand.ton = p ? p.id : '';
                var el = document.getElementById(TON_STYLE_ID);
                if (!p) {
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                } else {
                    if (!el) {
                        el = document.createElement('style');
                        el.id = TON_STYLE_ID;
                    }
                    var css = grundtonCss(p);
                    if (el.textContent !== css) el.textContent = css;
                    if (document.body) {
                        if (!el.parentNode) document.body.appendChild(el);
                        halten();
                    }
                }
                tonOberflaecheAuffrischen();
            }

            function anwenden(hex) {
                zustand.hex = hex || '';
                var el = document.getElementById(STYLE_ID);
                if (!zustand.hex) {
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                } else {
                    if (!el) {
                        el = document.createElement('style');
                        el.id = STYLE_ID;
                    }
                    var css = accentCss(zustand.hex);
                    if (el.textContent !== css) el.textContent = css;
                    if (document.body) {
                        if (!el.parentNode) document.body.appendChild(el);
                        halten();
                    }
                }
                oberflaecheAuffrischen();
            }

            // ---------- Laden und Speichern

            // Setzt einen Schlüssel in CustomPrefs. Nacheinander, damit zwei schnelle Wahlen
            // (Akzent und Grundfarbe) sich nicht gegenseitig mit einer älteren Kopie überschreiben.
            function speichern(u, wert, schluessel) {
                var a = api();
                if (!a || !u || u === 'demo') return;
                var k = schluessel || SCHLUESSEL;
                speicherKette = speicherKette.then(function () {
                    return a.getDisplayPreferences('usersettings', u, 'emby').then(function (prefs) {
                        prefs = prefs || {};
                        prefs.CustomPrefs = prefs.CustomPrefs || {};
                        if (prefs.CustomPrefs[k] === wert) return null;
                        prefs.CustomPrefs[k] = wert;
                        return a.updateDisplayPreferences('usersettings', prefs, u, 'emby');
                    });
                }).catch(function (e) {
                    if (window.console) console.warn('Werkstatt: Theme-Farbe nicht gespeichert', e);
                });
            }

            function laden(u) {
                zustand.user = u;
                if (!u) { anwenden(''); tonAnwenden(''); return; }
                var merker = merkerLesen(u);
                anwenden(merker && merker !== 'standard' ? merker : '');
                var tonMerker = tonMerkerLesen(u);
                tonAnwenden(tonMerker && tonMerker !== 'standard' ? tonMerker : '');

                var a = api();
                if (!a || u === 'demo') return;
                var wahl = zustand.wahl;
                a.getDisplayPreferences('usersettings', u, 'emby').then(function (prefs) {
                    // Benutzer gewechselt oder inzwischen selbst gewählt: die ältere Antwort nicht anwenden
                    if (zustand.user !== u || zustand.wahl !== wahl) return;
                    var tonWert = prefs && prefs.CustomPrefs ? prefs.CustomPrefs[TON_SCHLUESSEL] : undefined;
                    if (tonWert === undefined || tonWert === null) {
                        if (tonMerker) speichern(u, tonMerker === 'standard' ? '' : tonMerker, TON_SCHLUESSEL);
                    } else {
                        var tonId = tonGueltig(tonWert) ? tonWert : '';
                        tonMerkerSchreiben(u, tonId);
                        if (tonId !== zustand.ton) tonAnwenden(tonId);
                    }
                    var wert = prefs && prefs.CustomPrefs ? prefs.CustomPrefs[SCHLUESSEL] : undefined;
                    if (wert === undefined || wert === null) {
                        // Am Server fehlt der Schlüssel: noch nie gespeichert, oder Jellyfin hat ihn mit
                        // einer älteren Kopie der Einstellungen überschrieben. Die Wahl dieses Geräts nachtragen.
                        if (merker) speichern(u, merker === 'standard' ? '' : merker);
                        return;
                    }
                    var hex = farbe(wert);
                    merkerSchreiben(u, hex);
                    if (hex !== zustand.hex) anwenden(hex);
                }).catch(function () { /* offline: Zwischenspeicher gilt */ });
            }

            // Wahl aus der Oberfläche: wirkt sofort, gespeichert wird gedrosselt
            function waehlen(eingabe) {
                var hex = farbe(eingabe);
                if (hex === STANDARD) hex = '';
                var u = zustand.user;
                if (!u) return;
                zustand.wahl++;
                merkerSchreiben(u, hex);
                anwenden(hex);
                clearTimeout(speicherTimer);
                speicherTimer = setTimeout(function () { speichern(u, hex); }, 800);
            }

            function tonWaehlen(id) {
                var p = tonGueltig(id);
                var wert = p && p.id !== STANDARD_TON ? p.id : '';
                var u = zustand.user;
                if (!u) return;
                zustand.wahl++;
                tonMerkerSchreiben(u, wert);
                tonAnwenden(wert);
                clearTimeout(tonTimer);
                tonTimer = setTimeout(function () { speichern(u, wert, TON_SCHLUESSEL); }, 400);
            }

            // ---------- Abschnitt „Theme-Farbe“ auf der Seite Einstellungen → Anzeige
            // Klassischer Farbwähler: Feld für Sättigung (waagerecht) und Helligkeit (senkrecht), darunter
            // ein Farbton-Regler, dann Vorschau, Hex-Feld und „Standard“. Gerechnet wird in HSV.

            var HINWEIS = 'Gilt nur für dich, auf allen Geräten mit Weboberfläche, und wirkt sofort. ' +
                'Im Feld auch rgb(r, g, b) oder r, g, b. „Standard“ nimmt wieder die Farbe des Servers (Orange).';

            function hsvZuHex(h, s, v) {
                var f = function (n) {
                    var k = (n + h / 60) % 6;
                    var x = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
                    var w = Math.round(x * 255);
                    return (w < 16 ? '0' : '') + w.toString(16);
                };
                return '#' + f(5) + f(3) + f(1);
            }

            function hexZuHsv(hex) {
                var n = parseInt(hex.slice(1), 16);
                var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
                var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
                var h = 0;
                if (d) {
                    if (max === r) h = 60 * (((g - b) / d) % 6);
                    else if (max === g) h = 60 * ((b - r) / d + 2);
                    else h = 60 * ((r - g) / d + 4);
                }
                return { h: (h + 360) % 360, s: max ? d / max : 0, v: max };
            }

            var begrenzen = function (x, lo, hi) { return Math.min(hi, Math.max(lo, x)); };

            var TON_HINWEIS = 'Gilt für die dunklen Designs, auch nur für dich. Die helle Fassung stellst du unten bei „Design“ ein.';

            function rgbText(c) { return 'rgb(' + c.join(', ') + ')'; }

            function tonHtml() {
                if (!TOENE.length) return '';
                return '<div class="werkstattAkzent-unter">Grundfarbe</div>' +
                    '<div class="werkstattTon-liste" role="radiogroup" aria-label="Grundfarbe">' +
                    TOENE.map(function (p) {
                        return '<button type="button" class="werkstattTon-wahl" role="radio" aria-checked="false" data-ton="' + p.id + '" title="' + p.info + '">' +
                            '<span class="werkstattTon-muster" aria-hidden="true" style="--wkTonDunkel: ' + rgbText(p.dunkel) +
                            '; --wkTonHell: ' + rgbText(p.hell) + '; --wkTonKopf: ' + rgbText(p.kopf) + '; --wkTonText: ' + p.text + '; --wkTonRand: ' + p.rand + '"></span>' +
                            '<span class="werkstattTon-name">' + p.name + (p.id === STANDARD_TON ? ' <small>Standard</small>' : '') + '</span>' +
                            '</button>';
                    }).join('') +
                    '</div>' +
                    '<div class="fieldDescription werkstattTon-hinweis">' + TON_HINWEIS + '</div>';
            }

            function tonVerdrahten(sec) {
                var liste = sec.querySelector('.werkstattTon-liste');
                if (!liste) return;
                liste.addEventListener('click', function (e) {
                    var b = e.target.closest ? e.target.closest('.werkstattTon-wahl') : null;
                    if (b) tonWaehlen(b.getAttribute('data-ton'));
                });
                // Pfeiltasten wandern durch die Vorlagen wie in einer Radiogruppe
                liste.addEventListener('keydown', function (e) {
                    var knoepfe = Array.prototype.slice.call(liste.querySelectorAll('.werkstattTon-wahl'));
                    var i = knoepfe.indexOf(document.activeElement);
                    if (i < 0) return;
                    var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
                    if (n === null) return;
                    n = (n + knoepfe.length) % knoepfe.length;
                    knoepfe[n].focus();
                    tonWaehlen(knoepfe[n].getAttribute('data-ton'));
                    e.preventDefault();
                });
            }

            function tonOberflaecheAuffrischen() {
                var aktiv = zustand.ton || STANDARD_TON;
                var knoepfe = document.querySelectorAll('.werkstattTon-wahl');
                for (var i = 0; i < knoepfe.length; i++) {
                    var an = knoepfe[i].getAttribute('data-ton') === aktiv;
                    knoepfe[i].setAttribute('aria-checked', an ? 'true' : 'false');
                    knoepfe[i].tabIndex = an ? 0 : -1;
                }
            }

            function abschnittHtml() {
                return '<h2 class="sectionTitle">Theme-Farbe</h2>' +
                    (TOENE.length ? '<div class="werkstattAkzent-unter">Akzentfarbe</div>' : '') +
                    '<div class="werkstattAkzent-box">' +
                    '<div class="werkstattAkzent-flaeche" tabindex="0" role="slider" aria-label="Sättigung und Helligkeit" aria-valuemin="0" aria-valuemax="100">' +
                    '<div class="werkstattAkzent-flaechenzeiger"></div></div>' +
                    '<div class="werkstattAkzent-ton" tabindex="0" role="slider" aria-label="Farbton" aria-valuemin="0" aria-valuemax="360">' +
                    '<div class="werkstattAkzent-tonzeiger"></div></div>' +
                    '<div class="werkstattAkzent-zeile">' +
                    '<div class="werkstattAkzent-vorschau" aria-hidden="true"></div>' +
                    '<input type="text" class="emby-input werkstattAkzent-code" aria-label="Farbcode" placeholder="#f97316" spellcheck="false" autocomplete="off" maxlength="24">' +
                    '<button type="button" class="raised button-alt emby-button werkstattAkzent-standard">Standard</button>' +
                    '</div></div>' +
                    '<div class="fieldDescription werkstattAkzent-hinweis">' + HINWEIS + '</div>' +
                    tonHtml();
            }

            // Zeichnet einen Abschnitt nach seinem eigenen HSV-Stand
            function zeichnen(sec) {
                var p = sec.__werkstattHsv;
                var hex = hsvZuHex(p.h, p.s, p.v);
                var flaeche = sec.querySelector('.werkstattAkzent-flaeche');
                var ton = sec.querySelector('.werkstattAkzent-ton');
                flaeche.style.setProperty('--wkTon', 'hsl(' + Math.round(p.h) + ', 100%, 50%)');
                flaeche.style.setProperty('--wkX', (p.s * 100) + '%');
                flaeche.style.setProperty('--wkY', ((1 - p.v) * 100) + '%');
                flaeche.style.setProperty('--wkFarbe', hex);
                flaeche.setAttribute('aria-valuenow', String(Math.round(p.s * 100)));
                flaeche.setAttribute('aria-valuetext', 'Sättigung ' + Math.round(p.s * 100) + ' %, Helligkeit ' + Math.round(p.v * 100) + ' %');
                ton.style.setProperty('--wkX', (p.h / 360 * 100) + '%');
                ton.style.setProperty('--wkTon', 'hsl(' + Math.round(p.h) + ', 100%, 50%)');
                ton.setAttribute('aria-valuenow', String(Math.round(p.h)));
                sec.querySelector('.werkstattAkzent-vorschau').style.backgroundColor = hex;
                return hex;
            }

            function abschnittVerdrahten(sec) {
                var code = sec.querySelector('.werkstattAkzent-code');
                var hinweis = sec.querySelector('.werkstattAkzent-hinweis');
                var flaeche = sec.querySelector('.werkstattAkzent-flaeche');
                var ton = sec.querySelector('.werkstattAkzent-ton');
                sec.__werkstattHsv = hexZuHsv(zustand.hex || STANDARD);

                var markieren = function (falsch) {
                    code.classList.toggle('werkstattAkzent-ungueltig', !!falsch);
                    hinweis.textContent = falsch ? 'Keine gültige Farbe. Erlaubt sind #rrggbb, #rgb, rgb(r, g, b) und r, g, b.' : HINWEIS;
                };

                // Neuer HSV-Stand aus Feld oder Regler: zeichnen und live übernehmen
                var setzen = function (teil) {
                    var p = sec.__werkstattHsv;
                    if (teil.h != null) p.h = begrenzen(teil.h, 0, 359.999);
                    if (teil.s != null) p.s = begrenzen(teil.s, 0, 1);
                    if (teil.v != null) p.v = begrenzen(teil.v, 0, 1);
                    markieren(false);
                    var hex = zeichnen(sec);
                    if (document.activeElement !== code) code.value = hex;
                    waehlen(hex);
                };

                // Ziehen und Tippen mit Maus, Finger und Stift
                var ziehen = function (el, aus) {
                    var an = false;
                    var nehmen = function (e) {
                        var r = el.getBoundingClientRect();
                        aus((e.clientX - r.left) / (r.width || 1), (e.clientY - r.top) / (r.height || 1));
                    };
                    el.addEventListener('pointerdown', function (e) {
                        if (e.button != null && e.button !== 0) return;
                        an = true;
                        try { el.setPointerCapture(e.pointerId); } catch (err) { /* älterer Browser */ }
                        el.classList.add('werkstattAkzent-zieht');
                        el.focus({ preventScroll: true });
                        nehmen(e);
                        e.preventDefault();
                    });
                    el.addEventListener('pointermove', function (e) { if (an) nehmen(e); });
                    var ende = function () { an = false; el.classList.remove('werkstattAkzent-zieht'); };
                    el.addEventListener('pointerup', ende);
                    el.addEventListener('pointercancel', ende);
                    el.addEventListener('lostpointercapture', ende);
                };
                ziehen(flaeche, function (x, y) { setzen({ s: x, v: 1 - y }); });
                ziehen(ton, function (x) { setzen({ h: x * 360 }); });

                // Pfeiltasten: Feld links/rechts Sättigung, hoch/runter Helligkeit; Regler Farbton
                flaeche.addEventListener('keydown', function (e) {
                    var p = sec.__werkstattHsv, d = e.shiftKey ? 0.1 : 0.01;
                    if (e.key === 'ArrowLeft') setzen({ s: p.s - d });
                    else if (e.key === 'ArrowRight') setzen({ s: p.s + d });
                    else if (e.key === 'ArrowUp') setzen({ v: p.v + d });
                    else if (e.key === 'ArrowDown') setzen({ v: p.v - d });
                    else return;
                    e.preventDefault();
                });
                ton.addEventListener('keydown', function (e) {
                    var p = sec.__werkstattHsv, d = e.shiftKey ? 10 : 1;
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setzen({ h: p.h - d });
                    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setzen({ h: p.h + d });
                    else if (e.key === 'Home') setzen({ h: 0 });
                    else if (e.key === 'End') setzen({ h: 359.999 });
                    else return;
                    e.preventDefault();
                });

                // Hex-Feld: gültige Eingabe wirkt sofort, ungültige wird beim Verlassen markiert
                var ausCode = function () {
                    var hex = farbe(code.value);
                    if (!hex) return false;
                    markieren(false);
                    sec.__werkstattHsv = hexZuHsv(hex);
                    zeichnen(sec);
                    waehlen(hex);
                    return true;
                };
                code.addEventListener('input', ausCode);
                code.addEventListener('change', function () {
                    if (!code.value.trim()) { markieren(false); oberflaecheAuffrischen(); return; }
                    markieren(!farbe(code.value));
                });
                // Enter im Feld soll nicht das Formular der Seite absenden
                code.addEventListener('keydown', function (e) {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    markieren(!ausCode() && !!code.value.trim());
                });

                sec.querySelector('.werkstattAkzent-standard').addEventListener('click', function () {
                    markieren(false);
                    waehlen('');
                });
            }

            // Stand von außen (Laden, Standard, anderer Rahmen): Abschnitte nachziehen, ohne beim Ziehen zu springen
            function oberflaecheAuffrischen() {
                var hex = zustand.hex || STANDARD;
                var secs = document.querySelectorAll('.werkstattAkzentSection');
                for (var i = 0; i < secs.length; i++) {
                    var sec = secs[i];
                    if (!sec.__werkstattHsv) continue;
                    var p = sec.__werkstattHsv;
                    if (hsvZuHex(p.h, p.s, p.v) !== hex) {
                        var neu = hexZuHsv(hex);
                        // Grau hat keinen Farbton: den bisherigen behalten
                        if (!neu.s || !neu.v) neu.h = p.h;
                        sec.__werkstattHsv = neu;
                    }
                    zeichnen(sec);
                    var code = sec.querySelector('.werkstattAkzent-code');
                    if (code && document.activeElement !== code && !code.classList.contains('werkstattAkzent-ungueltig')) code.value = hex;
                    var std = sec.querySelector('.werkstattAkzent-standard');
                    if (std) std.disabled = !zustand.hex;
                }
            }

            function abschnitteEinsetzen() {
                var formulare = document.querySelectorAll('#displayPreferencesPage form');
                for (var i = 0; i < formulare.length; i++) {
                    var form = formulare[i];
                    if (!form.querySelector('#selectTheme') || form.querySelector('.werkstattAkzentSection')) continue;
                    var sec = document.createElement('div');
                    sec.className = 'verticalSection werkstattAkzentSection';
                    sec.innerHTML = abschnittHtml();
                    form.insertBefore(sec, form.firstChild);
                    abschnittVerdrahten(sec);
                    tonVerdrahten(sec);
                }
                oberflaecheAuffrischen();
                tonOberflaecheAuffrischen();
            }

            // ---------- Beobachten: Benutzerwechsel, neue Seite, fremde Stylesheets hinter unserem

            function pruefen() {
                raf = 0;
                try {
                    var u = aktuellerBenutzer();
                    if (u !== zustand.user) laden(u);
                    halten();
                    abschnitteEinsetzen();
                } catch (e) {
                    if (window.console) console.warn('Werkstatt: Farbwähler', e);
                }
            }

            function bald() {
                if (raf) return;
                raf = window.requestAnimationFrame ? window.requestAnimationFrame(pruefen) : window.setTimeout(pruefen, 16);
            }

            function starten() {
                var mo = new MutationObserver(bald);
                mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
                // An- und Abmelden ändert nicht immer das DOM sofort
                var takt = window.setInterval(bald, 3000);
                // Andere Tabs bzw. Rahmen derselben Herkunft: gleiche Wahl sofort übernehmen
                window.addEventListener('storage', function (e) {
                    if (!zustand.user || zustand.user === 'demo') return;
                    if (e.key === SCHLUESSEL + ':' + zustand.user) {
                        var v = e.newValue === 'standard' ? '' : farbe(e.newValue);
                        if (v !== zustand.hex) anwenden(v);
                    } else if (e.key === TON_SCHLUESSEL + ':' + zustand.user) {
                        var t = tonGueltig(e.newValue) ? e.newValue : '';
                        if (t !== zustand.ton) tonAnwenden(t);
                    }
                });
                W.farbwaehler.observer = mo;
                W.farbwaehler.takt = takt;
                // Lief laden() vor dem body, steht das style-Element noch nirgends: jetzt einhängen
                if (zustand.ton) tonAnwenden(zustand.ton);
                if (zustand.hex) anwenden(zustand.hex);
                pruefen();
            }

            W.farbwaehler = { waehlen: waehlen, tonWaehlen: tonWaehlen, laden: laden, farbe: farbe };

            // Farbe so früh wie möglich, damit nichts flackert; die Oberfläche erst mit dem body
            laden(aktuellerBenutzer());
            if (document.body) starten();
            else document.addEventListener('DOMContentLoaded', starten);
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Farbwähler', e);
        }
    })(function accentCss(hex) {
        // Alles, was die Farbrechnung braucht, steckt in der Funktion selbst: tweaks-farbe.js baut sie
        // per Function.prototype.toString in sein eigenständiges Skript ein (läuft in Jellyfin ohne diese Datei).
        const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
        const round1 = v => Math.round(v * 10) / 10;

        function hexToRgb(h) {
            const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim());
            const n = parseInt(m ? m[1] : '5d55e7', 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }

        function rgbToHsl(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const l = (max + min) / 2;
            let h = 0, s = 0;
            if (max !== min) {
                const d = max - min;
                s = d / (1 - Math.abs(2 * l - 1));
                if (max === r) h = 60 * (((g - b) / d) % 6);
                else if (max === g) h = 60 * ((b - r) / d + 2);
                else h = 60 * ((r - g) / d + 4);
            }
            return [(h + 360) % 360, s * 100, l * 100];
        }

        // Ton aus der Akzentfarbe ableiten: Sättigung als Faktor (Grau bleibt Grau),
        // Helligkeit als Verschiebung in Prozentpunkten
        const tone = (hsl, sFactor, lShift) =>
            `hsl(${round1(hsl[0])}, ${round1(clamp(hsl[1] * sFactor, 0, 100))}%, ${round1(clamp(hsl[2] + lShift, 6, 94))}%)`;

        // Relative Leuchtdichte nach WCAG, um die Schriftfarbe auf der Akzentfläche zu wählen
        function luminance(rgb) {
            const c = rgb.map(v => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        }

        hex = String(hex || '').toLowerCase();
        if (!/^#[0-9a-f]{6}$/.test(hex)) hex = '#5d55e7';
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        const text = luminance(rgb) > 0.42 ? 'hsl(0, 0%, 10%)' : '#fff';

        // helle Fassung von ElegantFin (:root[data-theme="light"]) liegt etwas dunkler
        const light = [hsl[0], clamp(hsl[1] * 1.03, 0, 100), clamp(hsl[2] - 5, 6, 94)];

        return `/* Akzentfarbe ${hex}: setzt alle ElegantFin-Variablen, die von der Akzentfarbe abhängen.
   Die abgeleiteten Töne (heller fürs Überfahren, dunkler für Bestätigen-Knöpfe) sind aus ${hex} errechnet. */
:root {
    --accentColor: ${hex};
    --accentHoverColor: ${tone(hsl, 0.89, 4)};
    --btnSubmitColor: ${tone(hsl, 0.71, -17)};
    --btnSubmitBorderColor: ${tone(hsl, 0.89, 4)};
    --checkboxCheckedBgColor: ${tone(hsl, 1, -3)};
    --highlightOutlineColor: ${tone(hsl, 1.1, -9)};
    --accentTextColor: ${text};
}

/* Die helle Variante von ElegantFin setzt dieselben Variablen mit höherer Spezifität neu */
:root[data-theme="light"] {
    --accentColor: ${tone(light, 1, 0)};
    --accentHoverColor: ${tone(light, 1.2, 7)};
    --btnSubmitColor: ${tone(light, 0.74, -3)};
    --btnSubmitBorderColor: ${tone(light, 0.86, 9)};
    --checkboxCheckedBgColor: ${tone(light, 1.17, 8)};
    --highlightOutlineColor: ${tone(light, 1.3, 3)};
    --accentTextColor: ${text};
}

/* Fest verdrahtet in ElegantFin: Zähler (ungesehene Folgen), Sync- und Versionsanzeige in Blau */
.countIndicator,
.fullSyncIndicator,
.mediaSourceIndicator {
    background: ${tone(hsl, 0.96, -19)};
}
`;
    }, function grundtonCss(p) {
        var rgb = function (c, a) { return a == null ? 'rgb(' + c.join(', ') + ')' : 'rgba(' + c.join(', ') + ', ' + a + ')'; };
        var hex = function (c) { return '#' + c.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join(''); };
        var a = p.auswahl;
        return '/* Grundfarbe „' + p.name + '“. ElegantFin leitet Karten-Platzhalter, Hintergrundverlauf, Tabellenzeilen,\n' +
            '   Eingabefelder, Dialoge und Kontextmenüs aus diesen Variablen ab, sie ziehen also mit. */\n' +
            ':root:not([data-theme="light"]) {\n' +
            '    --darkerGradientPoint: ' + hex(p.dunkel) + ';\n' +
            '    --darkerGradientPointAlpha: ' + rgb(p.dunkel, 0.85) + ';\n' +
            '    --lighterGradientPoint: ' + hex(p.hell) + ';\n' +
            '    --lighterGradientPointAlpha: ' + rgb(p.hell, 0.85) + ';\n' +
            '    --gradientPointAlpha: ' + rgb(p.hell, 0.3) + ';\n' +
            '    --headerColor: ' + rgb(p.kopf, 0.8) + ';\n' +
            '    --drawerColor: ' + rgb(p.kopf, 0.9) + ';\n\n' +
            '    --borderColor: ' + p.rand + ';\n' +
            '    --darkerBorderColor: ' + p.randDunkel + ';\n\n' +
            '    --selectorBackgroundColor: hsl(' + a[0] + ', ' + a[1] + '%, ' + a[2] + '%);\n' +
            '    --selectorBackgroundColorAlpha: hsla(' + a[0] + ', ' + a[1] + '%, ' + a[2] + '%, 0.5);\n\n' +
            '    --textColor: ' + p.text + ';\n' +
            '    --dimTextColor: ' + p.textGedimmt + ';\n\n' +
            '    --tableBodyColor: ' + p.tabelle + ';\n\n' +
            '    --headerColorGradient: linear-gradient(180deg, ' + rgb(p.kopf, 0.95) + ' 30%, 55%, transparent 90%);\n' +
            '    --headerColorGradientAlt: linear-gradient(180deg, ' + rgb(p.kopf, 1) + ', 70%, transparent);\n' +
            '}\n\n' +
            '/* ElegantFin nimmt am Handy die kompaktere Kopfzeile (:root.layout-mobile). Die Zeile oben hätte\n' +
            '   das bei gleicher Spezifität überschrieben, deshalb hier noch einmal. */\n' +
            ':root.layout-mobile:not([data-theme="light"]) {\n' +
            '    --headerColorGradient: var(--headerColorGradientAlt);\n' +
            '}\n\n' +
            '/* Fest verdrahtet in ElegantFin: Hintergrund hinter Detailseiten und Bibliotheken mit Filmbild.\n' +
            '   Gleiche Ausnahmen wie im Original (Handy und Seiten mit Reitern haben eine eigene, volle Fläche). */\n' +
            ':root:not(.layout-mobile):not(.layout-tv):not([data-theme="light"]) body:not(.withSectionTabs) .backgroundContainer.withBackdrop {\n' +
            '    background: linear-gradient(0deg, var(--darkerGradientPoint), 45%, ' + rgb(p.dunkel, 0.25) + ');\n' +
            '}\n\n' +
            ':root.layout-tv:not([data-theme="light"]) body:not(.withSectionTabs) .backgroundContainer.withBackdrop {\n' +
            '    background: linear-gradient(0deg, var(--darkerGradientPoint), 45%, ' + rgb(p.dunkel, 0.95) + ');\n' +
            '}\n\n' +
            '/* Fest verdrahtet: halbdurchsichtiger Kasten der Anmeldeseite */\n' +
            ':root:not([data-theme="light"]) #loginPage .padded-left.padded-right.padded-bottom-page {\n' +
            '    background: ' + rgb(p.kopf, 0.7) + ';\n' +
            '}\n\n' +
            '/* Fest verdrahtet: Symbole in der Seitenleiste des Metadaten-Editors */\n' +
            ':root:not([data-theme="light"]) .metadataSidebarIcon {\n' +
            '    color: ' + p.symbol + ';\n' +
            '}\n';
    }, [{"id":"grau","name":"Grau","info":"klassischer Darkmode, wie Jellyfin selbst","dunkel":[15,15,15],"hell":[30,30,30],"kopf":[30,30,30],"rand":"hsl(0, 0%, 25%)","randDunkel":"hsl(0, 0%, 17%)","auswahl":[0,0,20],"text":"rgb(214, 214, 214)","textGedimmt":"rgb(163, 163, 163)","tabelle":"rgb(36, 36, 36)","symbol":"hsl(0, 0%, 58%)"},{"id":"oled","name":"OLED-Schwarz","info":"reines Schwarz, spart Strom auf OLED-Bildschirmen","dunkel":[0,0,0],"hell":[0,0,0],"kopf":[10,10,10],"rand":"hsl(0, 0%, 18%)","randDunkel":"hsl(0, 0%, 11%)","auswahl":[0,0,14],"text":"rgb(214, 214, 214)","textGedimmt":"rgb(160, 160, 160)","tabelle":"rgb(14, 14, 14)","symbol":"hsl(0, 0%, 55%)"},{"id":"anthrazit","name":"Anthrazit","info":"helleres, leicht kühles Grau","dunkel":[24,24,27],"hell":[40,40,44],"kopf":[40,40,44],"rand":"hsl(240, 4%, 33%)","randDunkel":"hsl(240, 4%, 24%)","auswahl":[240,4,28],"text":"rgb(220, 220, 224)","textGedimmt":"rgb(168, 168, 174)","tabelle":"rgb(46, 46, 50)","symbol":"hsl(240, 4%, 60%)"},{"id":"elegantfin","name":"ElegantFin","info":"das bläuliche Grau des Original-Themes","dunkel":[17,24,39],"hell":[29,38,53],"kopf":[30,40,54],"rand":"hsl(214, 13%, 32%)","randDunkel":"hsl(214, 13%, 22%)","auswahl":[217,19,27],"text":"rgb(209, 213, 219)","textGedimmt":"rgb(156, 163, 175)","tabelle":"rgb(31, 41, 55)","symbol":"#6c7bab"},{"id":"mitternacht","name":"Mitternachtsblau","info":"tiefes Dunkelblau","dunkel":[8,12,28],"hell":[18,26,52],"kopf":[20,29,56],"rand":"hsl(226, 30%, 29%)","randDunkel":"hsl(226, 30%, 20%)","auswahl":[226,35,24],"text":"rgb(210, 216, 232)","textGedimmt":"rgb(150, 160, 190)","tabelle":"rgb(22, 31, 60)","symbol":"hsl(226, 25%, 62%)"},{"id":"tanne","name":"Tannengrün","info":"dunkles, gedecktes Grün","dunkel":[8,20,15],"hell":[18,38,30],"kopf":[20,41,32],"rand":"hsl(155, 22%, 27%)","randDunkel":"hsl(155, 22%, 18%)","auswahl":[155,25,21],"text":"rgb(208, 224, 216)","textGedimmt":"rgb(150, 175, 163)","tabelle":"rgb(22, 44, 35)","symbol":"hsl(155, 15%, 58%)"},{"id":"aubergine","name":"Aubergine","info":"dunkles Violett","dunkel":[20,10,26],"hell":[38,22,48],"kopf":[41,24,52],"rand":"hsl(278, 22%, 31%)","randDunkel":"hsl(278, 22%, 21%)","auswahl":[278,25,25],"text":"rgb(224, 212, 230)","textGedimmt":"rgb(176, 160, 186)","tabelle":"rgb(44, 26, 54)","symbol":"hsl(278, 15%, 62%)"},{"id":"mokka","name":"Mokka","info":"warmes Dunkelbraun","dunkel":[22,17,14],"hell":[41,33,28],"kopf":[44,35,30],"rand":"hsl(25, 15%, 31%)","randDunkel":"hsl(25, 15%, 21%)","auswahl":[25,17,24],"text":"rgb(228, 220, 212)","textGedimmt":"rgb(180, 168, 156)","tabelle":"rgb(48, 39, 33)","symbol":"hsl(25, 12%, 60%)"}], "grau");
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript farbwaehler:", e);
    }
})();

// wiedergabe-fortsetzen: Musik nach einem Neustart weiterhören
(function () {
    try {
/* Musik nach einem Neustart weiterhören (ElegantFin-Werkstatt, Schalter „wiedergabe-fortsetzen“).
   Merkt sich die Musik-Wiedergabe pro Benutzer im localStorage (werkstattFortsetzen:<Benutzer-ID>). */
(function werkstattFortsetzen() {
        'use strict';
        try {
            var G = window.__werkstatt = window.__werkstatt || {};
            if (G.fortsetzen) return;

            var SCHLUESSEL = 'werkstattFortsetzen:';
            var VERSION = 1;
            var MAX_ALTER = 14 * 24 * 3600 * 1000; // 14 Tage
            var MAX_TITEL = 300;                    // so viele IDs holt playbackManager.play höchstens
            var VORLAUF = 50;                       // davon vor dem aktuellen Lied (für „Zurück“)
            var TAKT = 5000;                        // Speichern beim Spielen alle 5 Sekunden
            var RUECKSPRUNG = 2 * 1000 * 10000;     // 2 Sekunden früher einsetzen (Ticks)
            var ID_MUSTER = /^[0-9a-f-]{8,64}$/i;

            var z = {
                mgr: null,          // playbackManager, sobald gefunden
                haken: null,        // { E, orig, huelle } solange Events.trigger umhüllt ist
                player: null,       // Player, an dem unsere Ereignisse hängen
                liste: [],          // Item-IDs der Warteschlange in Spielreihenfolge
                sortiert: null,     // letzte ungemischte Reihenfolge
                letztes: 0,         // Zeitpunkt des letzten Speicherns
                loeschTimer: 0,
                ausstehend: null,   // { zeit, repeat, shuffle } nach einem Tippen auf Weiterhören
                ausstehendTimer: 0,
                verlassen: false,   // Seite wird gerade geschlossen oder neu geladen
                erlaubt: true,      // Jellyfin zeigt auf dieser Seite Wiedergabe-Steuerung
                user: null,
                gespielt: {},       // Benutzer-ID: true, sobald in dieser Sitzung etwas lief (dann kein Angebot mehr)
                leiste: null,       // unser Element
                angebot: null       // gezeigter Merker
            };

            // ---------- Hilfen

            function api() {
                var a = window.ApiClient;
                return a && typeof a.getCurrentUserId === 'function' ? a : null;
            }

            function ev() {
                var E = window.Events;
                return E && typeof E.trigger === 'function' && typeof E.on === 'function' && typeof E.off === 'function' ? E : null;
            }

            function benutzer() {
                var a = api();
                if (!a) return '';
                try { return a.getCurrentUserId() || ''; } catch (e) { return ''; }
            }

            function serverId() {
                var a = api();
                if (!a) return '';
                try {
                    if (typeof a.serverId === 'function') return a.serverId() || '';
                    if (typeof a.serverInfo === 'function') return (a.serverInfo() || {}).Id || '';
                } catch (e) { /* ohne Server-ID */ }
                return '';
            }

            function warn(was, e) {
                if (window.console) console.warn('Werkstatt: Fortsetzen, ' + was, e);
            }

            // Ticks (1/10 000 ms) als 1:23 bzw. 1:02:03
            function zeit(ticks) {
                var s = Math.max(0, Math.floor((ticks || 0) / 10000000));
                var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
                return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (r < 10 ? '0' : '') + r;
            }

            function gleicheMenge(a, b) {
                if (!a || !b || a.length !== b.length) return false;
                var x = a.slice().sort(), y = b.slice().sort();
                for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
                return true;
            }

            function kuenstler(item) {
                var n = [];
                if (Array.isArray(item.ArtistItems)) item.ArtistItems.forEach(function (x) { if (x && x.Name) n.push(x.Name); });
                if (!n.length && Array.isArray(item.Artists)) n = item.Artists.filter(function (x) { return typeof x === 'string'; });
                if (!n.length && item.AlbumArtist) n = [item.AlbumArtist];
                return n.join(', ');
            }

            // Cover: eigenes Bild des Lieds, sonst das des Albums
            function bild(item) {
                if (item.ImageTags && item.ImageTags.Primary) return { id: item.Id, tag: item.ImageTags.Primary };
                if (item.AlbumId && item.AlbumPrimaryImageTag) return { id: item.AlbumId, tag: item.AlbumPrimaryImageTag };
                return null;
            }

            function bildUrl(b) {
                var a = api();
                if (!a || !b || !ID_MUSTER.test(String(b.id))) return '';
                var opt = { type: 'Primary', maxHeight: 160, tag: String(b.tag || '') };
                try {
                    if (typeof a.getScaledImageUrl === 'function') return a.getScaledImageUrl(b.id, opt);
                    if (typeof a.getUrl === 'function') return a.getUrl('Items/' + b.id + '/Images/Primary', { maxHeight: 160, tag: opt.tag });
                } catch (e) { /* ohne Bild */ }
                return '';
            }

            // ---------- Merker im localStorage

            function lesen(u) {
                if (!u) return null;
                var r;
                try { r = JSON.parse(window.localStorage.getItem(SCHLUESSEL + u) || 'null'); } catch (e) { return null; }
                if (!r || r.v !== VERSION || !Array.isArray(r.ids) || !r.ids.length) return null;
                if (!r.ids.every(function (id) { return typeof id === 'string' && ID_MUSTER.test(id); })) return null;
                if (!(r.index >= 0 && r.index < r.ids.length) || Math.floor(r.index) !== r.index) return null;
                if (typeof r.zeit !== 'number' || Date.now() - r.zeit > MAX_ALTER) return null;
                var s = serverId();
                if (r.server && s && r.server !== s) return null;
                if (!(r.pos >= 0)) r.pos = 0;
                return r;
            }

            function schreiben(u, r) {
                try { window.localStorage.setItem(SCHLUESSEL + u, JSON.stringify(r)); } catch (e) { /* privat oder voll */ }
            }

            function loeschen(u) {
                if (!u) return;
                try { window.localStorage.removeItem(SCHLUESSEL + u); } catch (e) { /* privat */ }
            }

            // ---------- Zustand vom playbackManager

            function aktuellerPlayer() {
                try { return z.mgr ? z.mgr.getCurrentPlayer() : null; } catch (e) { return null; }
            }

            function spieltEtwas() {
                var p = aktuellerPlayer();
                if (!p) return false;
                try { return !!z.mgr.isPlaying(p); } catch (e) { return false; }
            }

            // Jellyfins Musikleiste sichtbar? Versteckt trägt sie „hide“, beim Wegschieben zuerst
            // „nowPlayingBar-hidden“ (nowPlayingBar.js, slideDown). Gesucht wie dort per Klassenname.
            function jellyfinLeisteSichtbar() {
                try {
                    if (typeof document.getElementsByClassName !== 'function') return false;
                    var el = document.getElementsByClassName('nowPlayingBar')[0];
                    return !!el && !el.classList.contains('hide') && !el.classList.contains('nowPlayingBar-hidden');
                } catch (e) {
                    return false;
                }
            }

            // In dieser Sitzung lief etwas: ab jetzt kein Angebot mehr für diesen Benutzer
            function gespieltMerken() {
                var u = benutzer();
                if (u) z.gespielt[u] = true;
            }

            // Momentaufnahme, nur für Musik auf diesem Gerät; sonst null
            function aufnahme() {
                var m = z.mgr, p = aktuellerPlayer();
                if (!m || !p || !p.isLocalPlayer) return null;
                var item = m.currentItem(p);
                if (!item || item.MediaType !== 'Audio' || !item.Id) return null;

                var ids = z.liste;
                var idx = m.getCurrentPlaylistIndex(p);
                if (!(idx >= 0 && ids[idx] === item.Id)) {
                    // Liste veraltet: neu holen, bis dahin so gut es geht. Höchstens alle zwei Sekunden:
                    // Beim Springen zum nächsten Lied zählt Jellyfin den Index schon weiter, während
                    // currentItem noch das alte Lied ist. Dann passt auch die frisch geholte Liste nicht,
                    // und Holen → Speichern → Holen lief ohne Pause im Kreis (Seite eingefroren, 23.10.2026).
                    if (!z.holt && Date.now() - (z.geholt || 0) > 2000) listeHolen();
                    idx = ids.indexOf(item.Id);
                    if (idx < 0) { ids = [item.Id]; idx = 0; }
                }

                var repeat = m.getRepeatMode(p) || 'RepeatNone';
                var shuffle = m.getQueueShuffleMode(p) || 'Sorted';
                if (shuffle === 'Shuffle') {
                    if (z.sortiert && gleicheMenge(z.sortiert, ids)) {
                        ids = z.sortiert;
                        idx = ids.indexOf(item.Id);
                    } else {
                        shuffle = 'Sorted'; // ungemischte Reihenfolge unbekannt: gemischte als normale Liste
                    }
                }

                // Doppelte entfernen (Jellyfin holt jede ID nur einmal, sonst verrutscht der Index)
                var eindeutig = [], gesehen = {};
                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];
                    if (!id || gesehen[id]) continue;
                    gesehen[id] = true;
                    eindeutig.push(id);
                }
                idx = eindeutig.indexOf(item.Id);
                if (idx < 0) return null;
                var start = Math.max(0, Math.min(idx - VORLAUF, eindeutig.length - MAX_TITEL));
                var fenster = eindeutig.slice(start, start + MAX_TITEL);

                var ms = 0;
                try { ms = m.currentTime(p) || 0; } catch (e) { ms = 0; }

                return {
                    v: VERSION,
                    zeit: Date.now(),
                    server: item.ServerId || serverId(),
                    ids: fenster,
                    index: idx - start,
                    pos: Math.max(0, Math.round(ms * 10000)),
                    dauer: item.RunTimeTicks || 0,
                    repeat: repeat,
                    shuffle: shuffle,
                    titel: String(item.Name || ''),
                    kuenstler: kuenstler(item),
                    album: String(item.Album || ''),
                    bild: bild(item)
                };
            }

            function speichern() {
                try {
                    var u = benutzer();
                    if (!u) return;
                    var r = aufnahme();
                    if (!r) return;
                    schreiben(u, r);
                    z.letztes = Date.now();
                } catch (e) {
                    warn('Speichern', e);
                }
            }

            function takt() {
                if (Date.now() - z.letztes >= TAKT) speichern();
            }

            // Immer nur eine Abfrage zugleich; kommt währenddessen ein Anlass dazu, wird danach einmal
            // nachgeholt, und zwar erst im nächsten Durchlauf der Ereignisschleife (setTimeout), damit der
            // Browser zwischendurch zeichnen und Eingaben annehmen kann.
            function listeHolen() {
                var m = z.mgr, p = aktuellerPlayer();
                if (!m || !p) return;
                if (z.holt) { z.nochmal = true; return; }
                z.holt = true;
                z.geholt = Date.now();
                var fertig = function () {
                    z.holt = false;
                    if (z.nochmal) {
                        z.nochmal = false;
                        window.setTimeout(listeHolen, 250);
                    }
                };
                try {
                    Promise.resolve(m.getPlaylist(p)).then(function (items) {
                        z.liste = (items || []).map(function (i) { return i && i.Id ? String(i.Id) : ''; });
                        try {
                            if (m.getQueueShuffleMode(p) !== 'Shuffle') z.sortiert = z.liste.slice();
                        } catch (e) { /* ohne Zufall */ }
                        fertig();
                        speichern();
                    }, fertig);
                } catch (e) {
                    fertig();
                    warn('Warteschlange', e);
                }
            }

            // ---------- Ereignisse von Manager und Player

            var playerEreignisse = {
                timeupdate: takt,
                pause: speichern,
                unpause: speichern,
                repeatmodechange: speichern,
                shufflequeuemodechange: listeHolen,
                playlistitemadd: listeHolen,
                playlistitemremove: listeHolen,
                playlistitemmove: listeHolen
            };

            function anPlayerBinden() {
                var E = ev(), p = aktuellerPlayer();
                if (!E || p === z.player) return;
                var k;
                if (z.player) for (k in playerEreignisse) E.off(z.player, k, playerEreignisse[k]);
                z.player = p;
                if (p) for (k in playerEreignisse) E.on(p, k, playerEreignisse[k]);
            }

            function beiStart() {
                try {
                    window.clearTimeout(z.loeschTimer);
                    gespieltMerken();
                    angebotEntfernen();
                    anPlayerBinden();
                    var r = z.ausstehend;
                    z.ausstehend = null;
                    window.clearTimeout(z.ausstehendTimer);
                    if (r && Date.now() - r.zeit < 60000) {
                        var m = z.mgr, p = aktuellerPlayer();
                        if (r.repeat && r.repeat !== 'RepeatNone' && m.getRepeatMode(p) !== r.repeat) m.setRepeatMode(r.repeat, p);
                        if (r.shuffle === 'Shuffle' && m.getQueueShuffleMode(p) !== 'Shuffle') m.setQueueShuffleMode('Shuffle', p);
                    }
                    listeHolen();
                } catch (e) {
                    warn('Start', e);
                }
            }

            // Stopp oder Ende der Warteschlange: Merker weg. Schließen der Seite: Merker bleibt.
            function beiStopp(e, info) {
                try {
                    if (z.verlassen) return;
                    if (info && info.nextMediaType === 'Audio') return; // nächstes Lied kommt gleich
                    var u = benutzer();
                    window.clearTimeout(z.loeschTimer);
                    // Etwas warten: ein Wechsel zu einer anderen Wiedergabe meldet erst Stopp, dann Start
                    z.loeschTimer = window.setTimeout(function () {
                        if (!z.verlassen && !spieltEtwas()) loeschen(u);
                    }, 1500);
                } catch (err) {
                    warn('Stopp', err);
                }
            }

            function istManager(o) {
                return !!o && typeof o === 'object' &&
                    typeof o.getCurrentPlayer === 'function' && typeof o.currentItem === 'function' &&
                    typeof o.getPlaylist === 'function' && typeof o.getCurrentPlaylistIndex === 'function' &&
                    typeof o.currentTime === 'function' && typeof o.play === 'function' &&
                    typeof o.getRepeatMode === 'function' && typeof o.getQueueShuffleMode === 'function';
            }

            function gefunden(m) {
                var E = ev();
                z.mgr = m;
                // Für andere Werkstatt-Skripte (Große Ansicht) veröffentlichen, damit sie nicht selbst suchen müssen
                if (!G.playbackManager) G.playbackManager = m;
                hakenLoesen();
                if (!E) return;
                E.on(m, 'playbackstart', beiStart);
                E.on(m, 'playbackstop', beiStopp);
                E.on(m, 'playerchange', anPlayerBinden);
                anPlayerBinden();
                if (spieltEtwas()) {
                    gespieltMerken();
                    angebotEntfernen();
                    listeHolen();
                }
            }

            // Events.trigger umhüllen, bis der playbackManager einmal vorbeikommt
            function haken() {
                var E = ev();
                if (!E || z.haken || z.mgr) return;
                var orig = E.trigger;
                var huelle = function (obj) {
                    if (!z.mgr) {
                        try { if (istManager(obj)) gefunden(obj); } catch (e) { warn('Suche', e); }
                    }
                    return orig.apply(this, arguments);
                };
                E.trigger = huelle;
                z.haken = { E: E, orig: orig, huelle: huelle };
            }

            // Hat inzwischen jemand anders Events.trigger umhüllt, bleibt unsere Hülle als bloßer Durchgang
            function hakenLoesen() {
                var h = z.haken;
                if (h && h.E.trigger === h.huelle) h.E.trigger = h.orig;
                z.haken = null;
            }

            // ---------- Leiste „Weiterhören“

            function angebotEntfernen() {
                var el = z.leiste;
                z.leiste = null;
                z.angebot = null;
                if (el && el.parentNode) el.parentNode.removeChild(el);
            }

            function knopf(klasse, titel, icon) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'paper-icon-button-light ' + klasse;
                b.title = titel;
                b.setAttribute('aria-label', titel);
                var s = document.createElement('span');
                s.className = 'material-icons ' + icon;
                s.setAttribute('aria-hidden', 'true');
                b.appendChild(s);
                return b;
            }

            function leisteBauen(r) {
                var el = document.createElement('div');
                el.className = 'werkstattFortsetzen';
                el.setAttribute('role', 'region');
                el.setAttribute('aria-label', 'Wiedergabe fortsetzen');

                var fort = document.createElement('div');
                fort.className = 'werkstattFortsetzen-fortschritt';
                var balken = document.createElement('span');
                var pct = r.dauer > 0 ? Math.max(0, Math.min(100, r.pos / r.dauer * 100)) : 0;
                balken.style.width = pct.toFixed(2) + '%';
                fort.appendChild(balken);
                el.appendChild(fort);

                var haupt = document.createElement('button');
                haupt.type = 'button';
                haupt.className = 'werkstattFortsetzen-haupt';
                haupt.title = 'An der gemerkten Stelle weiterhören';

                var b = document.createElement('span');
                b.className = 'werkstattFortsetzen-bild';
                var url = bildUrl(r.bild);
                if (url) {
                    b.style.backgroundImage = 'url("' + String(url).replace(/["\\\n\r]/g, encodeURIComponent) + '")';
                } else {
                    var ic = document.createElement('span');
                    ic.className = 'material-icons audiotrack';
                    ic.setAttribute('aria-hidden', 'true');
                    b.appendChild(ic);
                }
                haupt.appendChild(b);

                var text = document.createElement('span');
                text.className = 'werkstattFortsetzen-text';
                var t1 = document.createElement('span');
                t1.className = 'werkstattFortsetzen-titel';
                t1.textContent = r.titel || 'Zuletzt gehört';
                var t2 = document.createElement('span');
                t2.className = 'werkstattFortsetzen-unter';
                var stelle = 'weiter bei ' + zeit(r.pos) + (r.dauer > 0 ? ' von ' + zeit(r.dauer) : '');
                t2.textContent = (r.kuenstler ? r.kuenstler + ' · ' : '') + stelle;
                text.appendChild(t1);
                text.appendChild(t2);
                haupt.appendChild(text);
                el.appendChild(haupt);

                var weiter = knopf('werkstattFortsetzen-weiter', 'Weiterhören', 'play_arrow');
                var weg = knopf('werkstattFortsetzen-weg', 'Nicht fortsetzen', 'close');
                el.appendChild(weiter);
                el.appendChild(weg);

                haupt.addEventListener('click', fortsetzen);
                weiter.addEventListener('click', fortsetzen);
                weg.addEventListener('click', verwerfen);
                return el;
            }

            function angebotPruefen() {
                try {
                    var u = benutzer();
                    if (u !== z.user) {
                        z.user = u;
                        angebotEntfernen();
                    }
                    // Nur nach einem Neustart: Lief in dieser Sitzung schon etwas (auch jetzt gerade, oder
                    // Jellyfins Leiste ist zu sehen), nie wieder anbieten, auch nicht in der Lücke beim
                    // Wechsel zu einem anderen Lied
                    if (u && (spieltEtwas() || jellyfinLeisteSichtbar())) z.gespielt[u] = true;
                    if (!u || z.gespielt[u] || z.ausstehend) { angebotEntfernen(); return; }
                    var r = lesen(u);
                    if (!r) { angebotEntfernen(); return; }
                    if (!z.leiste || !z.angebot || z.angebot.zeit !== r.zeit) {
                        angebotEntfernen();
                        z.leiste = leisteBauen(r);
                        z.angebot = r;
                    }
                    // Wie die Musikleiste in .appfooter; gibt es den Fuß (noch) nicht, frei unten am Rand
                    var fuss = document.querySelector('.appfooter');
                    var ziel = fuss || document.body;
                    if (!ziel) return;
                    z.leiste.classList.toggle('werkstattFortsetzen-frei', !fuss);
                    if (z.leiste.parentNode !== ziel) ziel.appendChild(z.leiste);
                    z.leiste.hidden = !z.erlaubt;
                } catch (e) {
                    warn('Anzeige', e);
                }
            }

            function fortsetzen(e) {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                var r = z.angebot;
                var a = api(), E = ev();
                if (!r || !a || !E) return;
                angebotEntfernen();
                try {
                    // In den ersten vier Sekunden von vorn, sonst zwei Sekunden vor der gemerkten Stelle
                    var pos = r.pos > 2 * RUECKSPRUNG ? r.pos - RUECKSPRUNG : 0;
                    z.ausstehend = { zeit: Date.now(), repeat: r.repeat, shuffle: r.shuffle };
                    if (r.shuffle === 'Shuffle') z.sortiert = r.ids.slice();
                    // Kommt kein Start (Netz, Fehler), die Leiste wieder anbieten
                    window.clearTimeout(z.ausstehendTimer);
                    z.ausstehendTimer = window.setTimeout(function () {
                        if (!z.ausstehend) return;
                        z.ausstehend = null;
                        angebotPruefen();
                    }, 20000);

                    if (z.mgr) {
                        var sid = serverId() || r.server;
                        Promise.resolve(z.mgr.play({ ids: r.ids.slice(), startIndex: r.index, startPositionTicks: pos, serverId: sid }))
                            .catch(function (err) { warn('Weiterspielen', err); });
                    } else {
                        // Wie ein „Play“ vom Server (Fernsteuerung): serverNotifications.js ruft playbackManager.play
                        E.trigger(a, 'message', [{
                            MessageType: 'Play',
                            Data: { PlayCommand: 'PlayNow', ItemIds: r.ids.slice(), StartIndex: r.index, StartPositionTicks: pos }
                        }]);
                    }
                } catch (err) {
                    warn('Weiterspielen', err);
                    z.ausstehend = null;
                    angebotPruefen();
                }
            }

            function verwerfen(e) {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                loeschen(benutzer());
                angebotEntfernen();
            }

            // ---------- Start

            function starten() {
                haken();

                // Vor Jellyfins beforeunload (das meldet Stopp): Capture-Phase am window läuft zuerst
                var verlassen = function () {
                    z.verlassen = true;
                    speichern();
                };
                window.addEventListener('beforeunload', verlassen, true);
                window.addEventListener('pagehide', verlassen, true);
                window.addEventListener('pageshow', function (e) {
                    if (e && e.persisted) z.verlassen = false;
                });
                // Am Handy wird eine App im Hintergrund oft ohne beforeunload beendet
                document.addEventListener('visibilitychange', function () {
                    if (document.visibilityState === 'hidden') speichern();
                });
                // Seiten ohne Wiedergabe-Steuerung (Video-Player u. a.): Leiste verstecken wie Jellyfin seine
                document.addEventListener('viewbeforeshow', function (e) {
                    var d = e && e.detail;
                    if (!d || !d.options) return;
                    z.erlaubt = !!d.options.enableMediaControl;
                    angebotPruefen();
                });
                // Benutzerwechsel und später angelegter Fuß
                G.fortsetzen.takt = window.setInterval(angebotPruefen, 3000);
                angebotPruefen();
            }

            G.fortsetzen = { zustand: z, speichern: speichern, pruefen: angebotPruefen };

            // Nur im echten Jellyfin: auf ApiClient und Events warten, in der Werkstatt nach 30 s aufgeben
            var versuche = 0;
            var warten = function () {
                try {
                    if (api() && ev()) { starten(); return; }
                    if (++versuche <= 30) window.setTimeout(warten, 1000);
                } catch (e) {
                    warn('Start', e);
                }
            };
            warten();
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Fortsetzen', e);
        }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript wiedergabe-fortsetzen:", e);
    }
})();

// jede-runde-neu-mischen: Zufall mit „Alle wiederholen“: jede Runde neu mischen
(function () {
    try {
/* Jede Runde neu mischen (ElegantFin-Werkstatt, Schalter „jede-runde-neu-mischen“). */
(function werkstattNeuMischen() {
        'use strict';
        try {
            var G = window.__werkstatt = window.__werkstatt || {};
            if (G.neuMischen) return;

            var z = {
                mgr: null,
                haken: null,
                index: -1,      // Index des zuletzt gestarteten Lieds
                kennung: '',    // sortierte PlaylistItemIds der Warteschlange dazu
                laenge: 0
            };

            function ev() {
                var E = window.Events;
                return E && typeof E.trigger === 'function' && typeof E.on === 'function' && typeof E.off === 'function' ? E : null;
            }

            function warn(was, e) {
                if (window.console) console.warn('Werkstatt: Neu mischen, ' + was, e);
            }

            function istManager(o) {
                return !!o && typeof o === 'object' &&
                    typeof o.getCurrentPlayer === 'function' && typeof o.getPlaylist === 'function' &&
                    typeof o.getCurrentPlaylistIndex === 'function' && typeof o.getRepeatMode === 'function' &&
                    typeof o.getQueueShuffleMode === 'function' && typeof o.setQueueShuffleMode === 'function';
            }

            function beiStart() {
                var m = z.mgr, p;
                try { p = m.getCurrentPlayer(); } catch (e) { p = null; }
                if (!p || !p.isLocalPlayer) { z.index = -1; return; }
                var idx;
                try { idx = m.getCurrentPlaylistIndex(p); } catch (e) { return; }
                Promise.resolve(m.getPlaylist(p)).then(function (liste) {
                    liste = liste || [];
                    var kennung = liste.map(function (i) { return i && i.PlaylistItemId ? String(i.PlaylistItemId) : ''; }).sort().join(',');
                    var gleich = kennung === z.kennung, n = liste.length;
                    z.index = idx;
                    z.kennung = kennung;
                    z.laenge = n;
                    if (n < 3 || idx !== n - 1 || !gleich) return;
                    if (m.getRepeatMode(p) !== 'RepeatAll' || m.getQueueShuffleMode(p) !== 'Shuffle') return;
                    m.setQueueShuffleMode('Sorted', p);
                    m.setQueueShuffleMode('Shuffle', p);
                    z.index = 0;
                }).catch(function (e) { warn('Warteschlange', e); });
            }

            function gefunden(m) {
                if (z.mgr || !istManager(m)) return;
                z.mgr = m;
                if (!G.playbackManager) G.playbackManager = m;
                hakenLoesen();
                var E = ev();
                if (E) E.on(m, 'playbackstart', function () {
                    try { beiStart(); } catch (e) { warn('Start', e); }
                });
            }

            function haken() {
                var E = ev();
                if (!E || z.haken || z.mgr) return;
                var orig = E.trigger;
                var huelle = function (obj) {
                    if (!z.mgr) {
                        try {
                            if (G.playbackManager) gefunden(G.playbackManager);
                            else if (istManager(obj)) gefunden(obj);
                        } catch (e) { warn('Suche', e); }
                    }
                    return orig.apply(this, arguments);
                };
                E.trigger = huelle;
                z.haken = { E: E, orig: orig, huelle: huelle };
            }

            function hakenLoesen() {
                var h = z.haken;
                if (h && h.E.trigger === h.huelle) h.E.trigger = h.orig;
                z.haken = null;
            }

            G.neuMischen = { zustand: z };

            // Nur im echten Jellyfin: auf Events warten, in der Werkstatt nach 30 s aufgeben
            var versuche = 0;
            var warten = function () {
                try {
                    if (ev()) {
                        if (G.playbackManager) gefunden(G.playbackManager);
                        else haken();
                        return;
                    }
                    if (++versuche <= 30) window.setTimeout(warten, 1000);
                } catch (e) {
                    warn('Start', e);
                }
            };
            warten();
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Neu mischen', e);
        }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript jede-runde-neu-mischen:", e);
    }
})();

// grosse-ansicht: Desktop: Vollbild für Musik (große Ansicht)
(function () {
    try {
/* Große Ansicht für Musik am Desktop, „Vollbild“ (ElegantFin-Werkstatt, Schalter „grosse-ansicht“).
   Knopf „Vollbild“ in der Musikleiste und auf der Wiedergabeseite; Songtext über Audio/{id}/Lyrics. */
(function werkstattGrosseAnsicht() {
        'use strict';
        try {
            var G = window.__werkstatt = window.__werkstatt || {};
            if (G.grosseAnsicht) return;

            var KNOPF = 'werkstattBtnGrosseAnsicht';
            var PUNKTE_AB = 3 * 10000000;       // drei Punkte, wenn der Gesang später als nach 3 s einsetzt (Ticks)
            var VORLAUF_MS = 150;               // Zeile etwas früher hell (die Zeit kommt nur alle 250 ms)
            var HAND_MS = 5000;                 // so lange ruht das Mitscrollen nach Mausrad oder Wischen
            var ID_MUSTER = /^[0-9a-f-]{8,64}$/i;
            var SPEICHER_TEXT = 'werkstattGrosseAnsicht:songtext'; // '0' = Songtext ausgeblendet
            var UEBERGANG_MS = 480;             // so lange wandert das Cover (CSS: 0.45s)

            var z = {
                mgr: null,          // playbackManager (nur echtes Jellyfin)
                haken: null,        // { E, orig, huelle } solange Events.trigger umhüllt ist
                player: null,       // Player, an dem unsere Ereignisse hängen
                demo: null,         // Demo-Quelle (Werkstatt)
                el: null, q: {},    // Ansicht und ihre Teile
                offen: false,
                schliessTimer: 0, stoppTimer: 0,
                itemId: null, item: null, fav: false,
                lyr: undefined,     // undefined = lädt, null = keiner, sonst { synchron, zeilen }
                lyrIndex: -2,
                handBis: 0,
                ziehen: false,
                hatText: false,     // das Lied hat (vermutlich) einen Songtext
                textAn: true,       // Songtext-Spalte eingeblendet (Knopf „Songtext“, gemerkt)
                textTimer: 0,
                opener: null,
                cache: {}
            };

            // ---------- Hilfen

            function api() {
                var a = window.ApiClient;
                return a && typeof a.getCurrentUserId === 'function' ? a : null;
            }

            function ev() {
                var E = window.Events;
                return E && typeof E.trigger === 'function' && typeof E.on === 'function' && typeof E.off === 'function' ? E : null;
            }

            function warn(was, e) {
                if (window.console) console.warn('Werkstatt: Große Ansicht, ' + was, e);
            }

            // Ist das CSS des Schalters aktiv? (:root { --werkstatt-grosse-ansicht: 1; })
            function an() {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-grosse-ansicht').trim() === '1';
                } catch (e) {
                    return false;
                }
            }

            function desktop() {
                return document.documentElement.classList.contains('layout-desktop');
            }

            // Millisekunden als 1:23 bzw. 1:02:03
            function zeit(ms) {
                var s = Math.max(0, Math.floor((ms || 0) / 1000));
                var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
                return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (r < 10 ? '0' : '') + r;
            }

            // Text setzen, ohne den Text-Knoten auszutauschen (kein childList für fremde Observer)
            function text(el, s) {
                if (!el) return;
                s = String(s == null ? '' : s);
                var t = el.firstChild;
                if (t && t.nodeType === 3 && el.childNodes.length === 1) {
                    if (t.nodeValue !== s) t.nodeValue = s;
                } else if (el.textContent !== s) {
                    el.textContent = s;
                }
            }

            function klasse(el, k, ja) {
                if (el && el.classList.contains(k) !== !!ja) el.classList.toggle(k, !!ja);
            }

            function icon(el, name) {
                var s = el && el.querySelector('.material-icons');
                if (!s || s.classList.contains(name)) return;
                var weg = [];
                s.classList.forEach(function (c) { if (c !== 'material-icons' && c !== 'ratingbutton-icon-withrating') weg.push(c); });
                weg.forEach(function (c) { s.classList.remove(c); });
                s.classList.add(name);
            }

            function titelSetzen(el, t) {
                if (el && el.title !== t) {
                    el.title = t;
                    el.setAttribute('aria-label', t);
                }
            }

            function neu(tag, cls, inhalt) {
                var el = document.createElement(tag);
                if (cls) el.className = cls;
                if (inhalt != null) el.textContent = inhalt;
                return el;
            }

            function knopf(cls, name, titel, befehlName) {
                var b = neu('button', 'paper-icon-button-light werkstattGross-knopf ' + (cls || ''));
                b.type = 'button';
                if (befehlName) b.setAttribute('data-befehl', befehlName);
                titelSetzen(b, titel);
                var s = neu('span', 'material-icons ' + name);
                s.setAttribute('aria-hidden', 'true');
                b.appendChild(s);
                return b;
            }

            function kuenstler(it) {
                var n = [];
                if (!it) return '';
                if (Array.isArray(it.ArtistItems)) it.ArtistItems.forEach(function (x) { if (x && x.Name) n.push(x.Name); });
                if (!n.length && Array.isArray(it.Artists)) n = it.Artists.filter(function (x) { return typeof x === 'string' && x; });
                if (!n.length && typeof it.Artists === 'string' && it.Artists) n = [it.Artists];
                if (!n.length && it.AlbumArtist) n = [it.AlbumArtist];
                return n.join(', ');
            }

            // Cover: eigenes Bild des Lieds, sonst das des Albums. Demo: fertige Adresse in item.bild
            function bildUrl(it, hoehe) {
                if (!it) return '';
                if (z.demo) return it.bild ? String(it.bild) : '';
                var a = api();
                if (!a) return '';
                var id = '', tag = '';
                if (it.ImageTags && it.ImageTags.Primary) { id = it.Id; tag = it.ImageTags.Primary; }
                else if (it.AlbumId && it.AlbumPrimaryImageTag) { id = it.AlbumId; tag = it.AlbumPrimaryImageTag; }
                if (!id || !ID_MUSTER.test(String(id))) return '';
                try {
                    if (typeof a.getScaledImageUrl === 'function') return a.getScaledImageUrl(id, { type: 'Primary', maxHeight: hoehe, tag: String(tag) });
                    return a.getUrl('Items/' + id + '/Images/Primary', { maxHeight: hoehe, tag: String(tag) });
                } catch (e) {
                    return '';
                }
            }

            function cssUrl(u) {
                return u ? 'url("' + String(u).replace(/["\\\n\r]/g, encodeURIComponent) + '")' : '';
            }

            function bildSetzen(el, u) {
                var v = cssUrl(u);
                if (el.style.backgroundImage !== v) el.style.backgroundImage = v;
            }

            // ---------- Quelle: playbackManager oder Demo

            function spieler() {
                try { return z.mgr ? z.mgr.getCurrentPlayer() : null; } catch (e) { return null; }
            }

            function aktuellesItem() {
                if (z.demo) return z.demo.item();
                var m = z.mgr, p = spieler();
                if (!m || !p) return null;
                var it = null;
                try { it = m.currentItem(p); } catch (e) { it = null; }
                if (!it) {
                    try { it = (m.getPlayerState(p) || {}).NowPlayingItem || null; } catch (e) { it = null; }
                }
                return it;
            }

            function istMusik(it) {
                return !!it && it.MediaType === 'Audio';
            }

            function zustand() {
                if (z.demo) return z.demo.zustand();
                var m = z.mgr, p = spieler(), it = aktuellesItem();
                var r = { ms: 0, dauer: (it && it.RunTimeTicks) || 0, pausiert: true, wiederholen: 'RepeatNone', zufall: false, lautstaerke: 100, stumm: false };
                if (!m || !p) return r;
                try { r.ms = m.currentTime(p) || 0; } catch (e) { /* bleibt 0 */ }
                try { r.dauer = m.duration(p) || r.dauer; } catch (e) { /* aus dem Lied */ }
                try { r.pausiert = !!m.paused(p); } catch (e) { /* pausiert */ }
                try { r.wiederholen = m.getRepeatMode(p) || 'RepeatNone'; } catch (e) { /* aus */ }
                try { r.zufall = m.getQueueShuffleMode(p) === 'Shuffle'; } catch (e) { /* aus */ }
                try { r.lautstaerke = m.getVolume(p); r.stumm = !!m.isMuted(p); } catch (e) { /* voll */ }
                return r;
            }

            function befehl(name, wert) {
                if (z.demo) {
                    z.demo.befehl(name, wert);
                    return;
                }
                var m = z.mgr, p = spieler();
                if (!m || !p) return;
                try {
                    switch (name) {
                        case 'playpause': m.playPause(p); break;
                        case 'weiter': m.nextTrack(p); break;
                        case 'zurueck':
                            // wie die Musikleiste: nach 5 Sekunden oder beim ersten Titel an den Anfang, sonst zurück
                            if ((m.currentTime(p) || 0) >= 5000 || m.getCurrentPlaylistIndex(p) <= 0) m.seekPercent(0, p);
                            else m.previousTrack(p);
                            break;
                        case 'springen': m.seek(Math.max(0, Math.round(wert)), p); break;
                        case 'zeile':
                            m.seek(Math.max(0, Math.round(wert)), p);
                            if (m.paused(p)) m.unpause(p);
                            break;
                        case 'wiederholen': {
                            var r = m.getRepeatMode(p);
                            m.setRepeatMode(r === 'RepeatAll' ? 'RepeatOne' : r === 'RepeatOne' ? 'RepeatNone' : 'RepeatAll', p);
                            break;
                        }
                        case 'zufall': m.toggleQueueShuffleMode(p); break;
                        case 'lautstaerke':
                            m.setVolume(wert, p);
                            if (wert > 0 && m.isMuted(p)) m.setMute(false, p);
                            break;
                        case 'stumm': m.toggleMute(p); break;
                    }
                } catch (e) {
                    warn('Befehl ' + name, e);
                }
            }

            function aufbereiten(lyrics) {
                if (!Array.isArray(lyrics) || !lyrics.length || !lyrics[0]) return null;
                // wie Jellyfin: mitlaufend, wenn die erste Zeile eine Startzeit hat
                var synchron = Object.prototype.hasOwnProperty.call(lyrics[0], 'Start') && typeof lyrics[0].Start === 'number';
                var vorige = 0;
                var zeilen = lyrics.map(function (l) {
                    var s = null;
                    if (synchron) {
                        s = l && typeof l.Start === 'number' ? l.Start : vorige;
                        vorige = s;
                    }
                    return { text: String((l && l.Text) || '').trim(), start: s };
                });
                if (!zeilen.some(function (x) { return x.text; })) return null;
                return { synchron: synchron, zeilen: zeilen };
            }

            // Hat das Lied (wahrscheinlich) einen Songtext? Für den Aufbau, bevor er geladen ist
            function hatSongtext(it) {
                if (!it) return false;
                if (z.demo) return !!z.demo.songtext(it.Id);
                var id = String(it.Id || '');
                if (Object.prototype.hasOwnProperty.call(z.cache, id)) return !!z.cache[id];
                return it.HasLyrics !== false;
            }

            function songtextLaden(it) {
                var id = it && it.Id;
                if (z.demo) return Promise.resolve(z.demo.songtext(id));
                if (!id || !ID_MUSTER.test(String(id)) || it.HasLyrics === false) return Promise.resolve(null);
                if (Object.prototype.hasOwnProperty.call(z.cache, id)) return Promise.resolve(z.cache[id]);
                var a = api();
                if (!a) return Promise.resolve(null);
                var merken = function (r) {
                    var k = Object.keys(z.cache);
                    if (k.length > 30) delete z.cache[k[0]];
                    z.cache[id] = r;
                    return r;
                };
                return Promise.resolve(a.getJSON(a.getUrl('Audio/' + id + '/Lyrics'))).then(function (d) {
                    return merken(aufbereiten(d && d.Lyrics));
                }, function () {
                    return merken(null);
                });
            }

            function favoritSetzen(it, ja) {
                if (z.demo) return Promise.resolve(z.demo.favorit(it && it.Id, ja));
                var a = api();
                if (!a || !it || !ID_MUSTER.test(String(it.Id)) || typeof a.updateFavoriteStatus !== 'function') return Promise.reject(new Error('kein Favorit'));
                return Promise.resolve(a.updateFavoriteStatus(a.getCurrentUserId(), it.Id, ja)).then(function (ud) {
                    return !!(ud && ud.IsFavorite);
                });
            }

            // ---------- playbackManager finden (wie tweaks-fortsetzen.js) und Ereignisse

            function istManager(o) {
                return !!o && typeof o === 'object' &&
                    typeof o.getCurrentPlayer === 'function' && typeof o.currentItem === 'function' &&
                    typeof o.getPlaylist === 'function' && typeof o.getCurrentPlaylistIndex === 'function' &&
                    typeof o.currentTime === 'function' && typeof o.play === 'function' &&
                    typeof o.getRepeatMode === 'function' && typeof o.getQueueShuffleMode === 'function' &&
                    typeof o.playPause === 'function' && typeof o.seek === 'function';
            }

            var playerEreignisse = {
                timeupdate: beiZeit,
                pause: beiZustand,
                unpause: beiZustand,
                volumechange: beiZustand,
                repeatmodechange: beiZustand,
                shufflequeuemodechange: beiZustand,
                playbackstart: beiStart,
                playbackstop: beiStopp
            };

            function anPlayerBinden() {
                try {
                    var E = ev(), p = spieler();
                    if (!E || p === z.player) return;
                    var k;
                    if (z.player) for (k in playerEreignisse) E.off(z.player, k, playerEreignisse[k]);
                    z.player = p;
                    if (p) for (k in playerEreignisse) E.on(p, k, playerEreignisse[k]);
                    if (z.offen) beiStart();
                } catch (e) {
                    warn('Player', e);
                }
            }

            function gefunden(m) {
                if (z.mgr || !istManager(m)) return;
                z.mgr = m;
                if (!G.playbackManager) G.playbackManager = m;
                hakenLoesen();
                var E = ev();
                if (E) E.on(m, 'playerchange', anPlayerBinden);
                anPlayerBinden();
                planen();
            }

            function haken() {
                var E = ev();
                if (!E || z.haken || z.mgr) return;
                var orig = E.trigger;
                var huelle = function (obj) {
                    if (!z.mgr) {
                        try {
                            if (G.playbackManager) gefunden(G.playbackManager);
                            else if (istManager(obj)) gefunden(obj);
                        } catch (e) { warn('Suche', e); }
                    }
                    return orig.apply(this, arguments);
                };
                E.trigger = huelle;
                z.haken = { E: E, orig: orig, huelle: huelle };
            }

            // Hat inzwischen jemand anders Events.trigger umhüllt, bleibt unsere Hülle als bloßer Durchgang
            function hakenLoesen() {
                var h = z.haken;
                if (h && h.E.trigger === h.huelle) h.E.trigger = h.orig;
                z.haken = null;
            }

            function beiZeit() {
                if (!z.offen) return;
                try {
                    zeitZeichnen(zustand());
                    songtextZeile(false);
                } catch (e) { warn('Zeit', e); }
            }

            function beiZustand() {
                if (!z.offen) return;
                try { zustandZeichnen(); } catch (e) { warn('Zustand', e); }
            }

            function beiStart() {
                if (!z.offen) return;
                window.clearTimeout(z.stoppTimer);
                try {
                    if (!istMusik(aktuellesItem())) {
                        // ein Video übernimmt: die Ansicht ist nur für Musik
                        z.stoppTimer = window.setTimeout(function () {
                            if (z.offen && !istMusik(aktuellesItem())) schliessen();
                        }, 800);
                        return;
                    }
                    titelPruefen();
                    zustandZeichnen();
                } catch (e) { warn('Start', e); }
            }

            // Ende der Wiedergabe: kurz warten, ein Wechsel meldet erst Stopp, dann Start
            function beiStopp(e, state) {
                if (!z.offen) return;
                if (state && state.NextMediaType === 'Audio') return;
                window.clearTimeout(z.stoppTimer);
                z.stoppTimer = window.setTimeout(function () {
                    try {
                        var m = z.mgr, p = spieler(), laeuft = false;
                        try { laeuft = !!(m && p && m.isPlaying(p)); } catch (err) { laeuft = false; }
                        if (z.offen && (!laeuft || !istMusik(aktuellesItem()))) schliessen();
                    } catch (err) { /* nichts */ }
                }, 1500);
            }

            // ---------- Demo für die Werkstatt

            function demoDaten() {
                var el = document.getElementById('werkstattGrossDemo');
                if (el) {
                    try {
                        var d = JSON.parse(el.textContent || '{}');
                        if (d && Array.isArray(d.titel) && d.titel.length) return d;
                    } catch (e) { /* weiter mit der Seite */ }
                }
                // Sonst Titel und Cover aus Wiedergabeseite oder Musikleiste
                var name = '', wer = '', bild = '';
                var seite = document.querySelector('#nowPlayingPage');
                var leiste = document.querySelector('.nowPlayingBar');
                if (seite) {
                    var t = seite.querySelector('.nowPlayingSongName');
                    var a = seite.querySelector('.nowPlayingArtist');
                    var im = seite.querySelector('.nowPlayingPageImage');
                    name = t ? t.textContent.trim() : '';
                    wer = a ? a.textContent.trim() : '';
                    bild = im ? im.getAttribute('src') || '' : '';
                }
                if (!name && leiste) {
                    var tx = leiste.querySelectorAll('.nowPlayingBarText a');
                    name = tx[0] ? tx[0].textContent.trim() : '';
                    wer = tx[1] ? tx[1].textContent.trim() : '';
                    var bi = leiste.querySelector('.nowPlayingImage');
                    var m = bi && /url\(["']?([^"')]+)["']?\)/.exec(bi.style.backgroundImage || '');
                    bild = m ? m[1] : '';
                }
                return { titel: [{ Id: 'demo', Name: name || 'Lied', Artists: wer ? [wer] : [], RunTimeTicks: 2400000000, bild: bild }], index: 0, ms: 30000 };
            }

            function demoBauen(d) {
                var s = {
                    liste: d.titel.map(function (t) {
                        var x = {};
                        for (var k in t) x[k] = t[k];
                        x.MediaType = 'Audio';
                        return x;
                    }),
                    index: Math.max(0, Math.min(d.titel.length - 1, d.index || 0)),
                    ms: d.ms || 0,
                    pausiert: false,
                    wiederholen: 'RepeatNone',
                    zufall: false,
                    lautstaerke: 80,
                    stumm: false,
                    fav: {},
                    uhr: 0,
                    zuletzt: 0
                };
                var songtexte = d.songtext || {};

                function dauer() {
                    var it = s.liste[s.index];
                    return (it && it.RunTimeTicks) || 2400000000;
                }

                function wechsel(i) {
                    s.index = i;
                    s.ms = 0;
                    beiStart();
                }

                function tick() {
                    var jetzt = Date.now();
                    var dt = s.zuletzt ? jetzt - s.zuletzt : 0;
                    s.zuletzt = jetzt;
                    if (s.pausiert) return;
                    s.ms += dt;
                    if (s.ms * 10000 >= dauer()) {
                        if (s.wiederholen === 'RepeatOne') s.ms = 0;
                        else if (s.index < s.liste.length - 1) { wechsel(s.index + 1); return; }
                        else if (s.wiederholen === 'RepeatAll') { wechsel(0); return; }
                        else { s.ms = dauer() / 10000; s.pausiert = true; beiZustand(); }
                    }
                    beiZeit();
                }

                return {
                    starten: function () {
                        window.clearInterval(s.uhr);
                        s.zuletzt = Date.now();
                        s.uhr = window.setInterval(tick, 250);
                    },
                    anhalten: function () {
                        window.clearInterval(s.uhr);
                        s.uhr = 0;
                    },
                    item: function () { return s.liste[s.index] || null; },
                    zustand: function () {
                        return { ms: s.ms, dauer: dauer(), pausiert: s.pausiert, wiederholen: s.wiederholen, zufall: s.zufall, lautstaerke: s.lautstaerke, stumm: s.stumm };
                    },
                    songtext: function (id) { return aufbereiten(songtexte[id]); },
                    favorit: function (id, ja) { s.fav[id] = !!ja; return !!ja; },
                    istFavorit: function (id) { return !!s.fav[id]; },
                    befehl: function (name, wert) {
                        switch (name) {
                            case 'playpause': s.pausiert = !s.pausiert; s.zuletzt = Date.now(); break;
                            case 'weiter': if (s.index < s.liste.length - 1) wechsel(s.index + 1); else if (s.wiederholen === 'RepeatAll') wechsel(0); break;
                            case 'zurueck': if (s.ms >= 5000 || s.index === 0) s.ms = 0; else wechsel(s.index - 1); break;
                            case 'springen': s.ms = Math.max(0, wert / 10000); break;
                            case 'zeile': s.ms = Math.max(0, wert / 10000); s.pausiert = false; s.zuletzt = Date.now(); break;
                            case 'wiederholen': s.wiederholen = s.wiederholen === 'RepeatAll' ? 'RepeatOne' : s.wiederholen === 'RepeatOne' ? 'RepeatNone' : 'RepeatAll'; break;
                            case 'zufall': s.zufall = !s.zufall; break;
                            case 'lautstaerke': s.lautstaerke = wert; if (wert > 0) s.stumm = false; break;
                            case 'stumm': s.stumm = !s.stumm; break;
                        }
                        beiZustand();
                        beiZeit();
                    }
                };
            }

            // ---------- Ansicht bauen (einmal, beim ersten Öffnen)

            // Regler im Markup von Jellyfins emby-slider, damit die einheitlichen Regler (--ws…) greifen
            function regler(cls, schritt, griffBeimUeberfahren) {
                var box = neu('div', 'sliderContainer mdl-slider-container ' + cls);
                var r = neu('input', 'mdl-slider mdl-js-slider' + (griffBeimUeberfahren ? ' mdl-slider-hoverthumb' : ''));
                r.type = 'range';
                r.min = '0';
                r.max = '100';
                r.step = schritt;
                r.value = '0';
                var f = neu('div', 'mdl-slider-background-flex-container');
                var g = neu('div', 'mdl-slider-background-flex');
                var inner = neu('div', 'mdl-slider-background-flex-inner');
                var oben = neu('div', 'mdl-slider-background-upper');
                var unten = neu('div', 'mdl-slider-background-lower');
                unten.style.width = '0%';
                inner.appendChild(oben);
                inner.appendChild(unten);
                g.appendChild(inner);
                f.appendChild(g);
                box.appendChild(r);
                box.appendChild(f);
                return { box: box, input: r, fuellung: unten };
            }

            function fuellen(rg, prozent) {
                var w = Math.max(0, Math.min(100, prozent || 0)).toFixed(2) + '%';
                if (rg.fuellung.style.width !== w) rg.fuellung.style.width = w;
            }

            function bauen() {
                var el = neu('div', 'werkstattGross werkstattGross-ohneText');
                el.hidden = true;
                el.setAttribute('role', 'dialog');
                el.setAttribute('aria-modal', 'true');
                el.setAttribute('aria-label', 'Vollbild');
                el.tabIndex = -1;

                var hg = neu('div', 'werkstattGross-hintergrund');
                hg.setAttribute('aria-hidden', 'true');
                var hgBild = neu('div', 'werkstattGross-hintergrundBild');
                hg.appendChild(hgBild);
                el.appendChild(hg);

                // Kopf: nur der Pfeil zum Schließen
                var kopf = neu('div', 'werkstattGross-kopf');
                kopf.appendChild(knopf('werkstattGross-zu', 'expand_more', 'Schließen', 'schliessen'));
                el.appendChild(kopf);

                // Mitte: Cover und Songtext (ohne Songtext nur das Cover, mittig)
                var mitte = neu('div', 'werkstattGross-mitte');
                var platz = neu('div', 'werkstattGross-coverplatz');
                var cover = neu('div', 'werkstattGross-cover');
                cover.setAttribute('role', 'img');
                platz.appendChild(cover);
                mitte.appendChild(platz);
                var textplatz = neu('div', 'werkstattGross-textplatz');
                var scroll = neu('div', 'werkstattGross-scroll');
                var songtext = neu('div', 'werkstattGross-songtext');
                songtext.setAttribute('aria-live', 'off');
                scroll.appendChild(songtext);
                textplatz.appendChild(scroll);
                mitte.appendChild(textplatz);
                el.appendChild(mitte);

                // Fuß wie unsere Musikleiste: Zeitleiste oben, links Cover und Titel, Mitte Steuerung, rechts der Rest
                var fuss = neu('div', 'werkstattGross-fuss');
                var leisteZeit = regler('werkstattGross-zeitleiste', '0.01', true);
                leisteZeit.input.setAttribute('aria-label', 'Stelle im Lied');
                fuss.appendChild(leisteZeit.box);

                var info = neu('div', 'werkstattGross-info');
                var mini = neu('div', 'werkstattGross-miniCover');
                mini.setAttribute('aria-hidden', 'true');
                var texte = neu('div', 'werkstattGross-texte');
                var titel = neu('div', 'werkstattGross-titel');
                var wer = neu('div', 'werkstattGross-kuenstler');
                texte.appendChild(titel);
                texte.appendChild(wer);
                info.appendChild(mini);
                info.appendChild(texte);
                fuss.appendChild(info);

                var mitteFuss = neu('div', 'werkstattGross-steuerung');
                var wiederholen = knopf('werkstattGross-wiederholen', 'repeat', 'Wiederholen', 'wiederholen');
                var zurueck = knopf('werkstattGross-zurueck', 'skip_previous', 'Vorheriges Lied', 'zurueck');
                var play = knopf('werkstattGross-play', 'pause', 'Pause', 'playpause');
                var weiter = knopf('werkstattGross-weiter', 'skip_next', 'Nächstes Lied', 'weiter');
                var zufall = knopf('werkstattGross-zufall', 'shuffle', 'Zufällig', 'zufall');
                [wiederholen, zurueck, play, weiter, zufall].forEach(function (b) { mitteFuss.appendChild(b); });
                fuss.appendChild(mitteFuss);

                var rechts = neu('div', 'werkstattGross-rechts');
                var stumm = knopf('werkstattGross-stumm', 'volume_up', 'Stumm', 'stumm');
                var laut = regler('werkstattGross-lautstaerke', '1', false);
                laut.input.setAttribute('aria-label', 'Lautstärke');
                var liste = knopf('werkstattGross-liste', 'queue_music', 'Wiedergabeliste', 'wiedergabeliste');
                var textKnopf = knopf('werkstattGross-textKnopf', 'lyrics', 'Songtext ausblenden', 'songtext');
                var fav = knopf('werkstattGross-favorit', 'favorite', 'Zu Favoriten hinzufügen', 'favorit');
                var mehr = knopf('werkstattGross-mehr', 'more_vert', 'Mehr', 'menue');
                var zeitText = neu('div', 'werkstattGross-zeit', '0:00 / 0:00');
                [stumm, laut.box, liste, textKnopf, fav, mehr, zeitText].forEach(function (b) { rechts.appendChild(b); });
                fuss.appendChild(rechts);
                el.appendChild(fuss);

                z.q = {
                    hgBild: hgBild, cover: cover, scroll: scroll, songtext: songtext,
                    mini: mini, titel: titel, wer: wer, fav: fav, mehr: mehr, textKnopf: textKnopf,
                    zufall: zufall, play: play, wiederholen: wiederholen,
                    zeit: leisteZeit, zeitText: zeitText, stumm: stumm, laut: laut
                };

                el.addEventListener('click', klick);

                // Zeitleiste: beim Ziehen nur die Zeit zeigen, beim Loslassen springen (wie Jellyfin)
                leisteZeit.input.addEventListener('input', function () {
                    z.ziehen = true;
                    var st = zustand(), p = parseFloat(leisteZeit.input.value) || 0;
                    fuellen(leisteZeit, p);
                    text(zeitText, zeit(st.dauer / 10000 * p / 100) + ' / ' + zeit(st.dauer / 10000));
                });
                leisteZeit.input.addEventListener('change', function () {
                    var st = zustand(), p = parseFloat(leisteZeit.input.value) || 0;
                    z.ziehen = false;
                    if (st.dauer > 0) befehl('springen', st.dauer * p / 100);
                    z.handBis = 0;
                });
                laut.input.addEventListener('input', function () {
                    var v = parseFloat(laut.input.value) || 0;
                    fuellen(laut, v);
                    befehl('lautstaerke', v);
                });

                // Von Hand im Songtext gescrollt: Mitscrollen ruht kurz
                var hand = function () { z.handBis = Date.now() + HAND_MS; };
                scroll.addEventListener('wheel', hand, { passive: true });
                scroll.addEventListener('touchmove', hand, { passive: true });

                // Mausrad außerhalb des Songtexts scrollt nicht die Seite darunter
                el.addEventListener('wheel', function (e) {
                    var t = e.target;
                    if (!(t && t.closest && t.closest('.werkstattGross-scroll'))) e.preventDefault();
                }, { passive: false });

                document.body.appendChild(el);
                z.el = el;
                return el;
            }

            // ---------- Klicks in der Ansicht

            function klick(e) {
                try {
                    var t = e.target;
                    if (!t || !t.closest) return;
                    var b = t.closest('[data-befehl]');
                    if (b && z.el.contains(b)) {
                        var n = b.getAttribute('data-befehl');
                        if (n === 'schliessen') schliessen();
                        else if (n === 'favorit') favoritWechseln();
                        else if (n === 'menue') menue(b);
                        else if (n === 'songtext') textUmschalten();
                        else if (n === 'wiedergabeliste') zurWiedergabeseite();
                        else befehl(n);
                        return;
                    }
                    var zl = t.closest('.werkstattGross-zeile[data-start]');
                    if (zl && z.lyr && z.lyr.synchron) {
                        z.handBis = 0;
                        befehl('zeile', parseFloat(zl.getAttribute('data-start')) || 0);
                    }
                } catch (err) {
                    warn('Klick', err);
                }
            }

            // ---------- Lied, Cover, Titel

            // Songtext-Spalte nur, wenn das Lied einen hat und sie nicht ausgeblendet ist; sonst steht das Cover mittig
            function aufbau() {
                var zeigen = z.hatText && z.textAn;
                klasse(z.el, 'werkstattGross-ohneText', !zeigen);
                var b = z.q.textKnopf;
                if (b.disabled === z.hatText) b.disabled = !z.hatText;
                klasse(b, 'buttonActive', zeigen);
                b.setAttribute('aria-pressed', String(zeigen));
                titelSetzen(b, !z.hatText ? 'Kein Songtext' : zeigen ? 'Songtext ausblenden' : 'Songtext einblenden');
            }

            function textHaben(ja) {
                z.hatText = !!ja;
                aufbau();
            }

            function textUmschalten() {
                if (!z.hatText) return;
                z.textAn = !z.textAn;
                try { window.localStorage.setItem(SPEICHER_TEXT, z.textAn ? '1' : '0'); } catch (e) { /* privat */ }
                aufbau();
                // Nach dem Einblenden stehen die Zeilen erst nach dem Übergang an ihrem Platz: dann neu ausrichten
                window.clearTimeout(z.textTimer);
                if (z.textAn) {
                    z.textTimer = window.setTimeout(function () {
                        z.lyrIndex = -2;
                        z.handBis = 0;
                        songtextZeile(true);
                    }, UEBERGANG_MS);
                }
            }

            // Knopf „Wiedergabeliste“: wie in der Musikleiste zur Seite „Aktuelle Wiedergabe“ (dort die Warteschlange)
            function zurWiedergabeseite() {
                schliessen();
                try {
                    var r = (window.Emby && window.Emby.Page) || window.appRouter;
                    if (r && typeof r.showNowPlaying === 'function') r.showNowPlaying();
                    else if (r && typeof r.show === 'function') r.show('queue');
                } catch (e) {
                    warn('Wiedergabeseite', e);
                }
            }

            function titelPruefen() {
                var it = aktuellesItem();
                var id = it ? String(it.Id || it.Name || '') : '';
                if (id === z.itemId) return;
                z.itemId = id;
                z.item = it;
                z.lyr = undefined;
                z.lyrIndex = -2;

                text(z.q.titel, it ? it.Name || '' : '');
                text(z.q.wer, kuenstler(it));
                var gross = bildUrl(it, 1000), klein = bildUrl(it, 160);
                bildSetzen(z.q.cover, gross);
                klasse(z.q.cover, 'werkstattGross-cover-leer', !gross);
                z.q.cover.setAttribute('aria-label', it && it.Album ? 'Cover von ' + it.Album : 'Cover');
                bildSetzen(z.q.hgBild, klein);
                bildSetzen(z.q.mini, klein);

                z.fav = z.demo ? z.demo.istFavorit(id) : !!(it && it.UserData && it.UserData.IsFavorite);
                favZeichnen();

                // Aufbau gleich passend wählen, damit nichts springt, wenn der Songtext ankommt
                textHaben(hatSongtext(it));
                songtextZeichnen();
                var fuer = id;
                songtextLaden(it).then(function (r) {
                    if (z.itemId !== fuer) return;
                    z.lyr = r;
                    textHaben(!!r);
                    songtextZeichnen();
                }, function () {
                    if (z.itemId !== fuer) return;
                    z.lyr = null;
                    textHaben(false);
                    songtextZeichnen();
                });
            }

            function favZeichnen() {
                var b = z.q.fav;
                klasse(b.querySelector('.material-icons'), 'ratingbutton-icon-withrating', z.fav);
                b.setAttribute('aria-pressed', String(!!z.fav));
                titelSetzen(b, z.fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen');
            }

            function favoritWechseln() {
                var it = z.item, ja = !z.fav, fuer = z.itemId;
                if (!it) return;
                z.fav = ja;
                favZeichnen();
                favoritSetzen(it, ja).then(function (wert) {
                    if (z.itemId !== fuer) return;
                    z.fav = !!wert;
                    if (it.UserData) it.UserData.IsFavorite = !!wert;
                    favZeichnen();
                }, function (e) {
                    if (z.itemId !== fuer) return;
                    z.fav = !ja;
                    favZeichnen();
                    warn('Favorit', e);
                });
            }

            // ---------- Zeit und Zustand (nur lesen, nichts auslösen)

            function zeitZeichnen(st) {
                if (z.ziehen) return;
                var dauerMs = st.dauer / 10000;
                var p = dauerMs > 0 ? st.ms / dauerMs * 100 : 0;
                var v = String(Math.round(p * 100) / 100);
                if (z.q.zeit.input.value !== v) z.q.zeit.input.value = v;
                fuellen(z.q.zeit, p);
                text(z.q.zeitText, zeit(st.ms) + ' / ' + zeit(dauerMs));
            }

            function zustandZeichnen() {
                var st = zustand();
                icon(z.q.play, st.pausiert ? 'play_arrow' : 'pause');
                titelSetzen(z.q.play, st.pausiert ? 'Abspielen' : 'Pause');
                klasse(z.q.zufall, 'buttonActive', st.zufall);
                z.q.zufall.setAttribute('aria-pressed', String(!!st.zufall));
                klasse(z.q.wiederholen, 'buttonActive', st.wiederholen !== 'RepeatNone');
                icon(z.q.wiederholen, st.wiederholen === 'RepeatOne' ? 'repeat_one' : 'repeat');
                titelSetzen(z.q.wiederholen, st.wiederholen === 'RepeatOne' ? 'Wiederholen: dieses Lied' : st.wiederholen === 'RepeatAll' ? 'Wiederholen: alle' : 'Wiederholen: aus');
                var laut = st.stumm ? 0 : Math.max(0, Math.min(100, st.lautstaerke || 0));
                icon(z.q.stumm, st.stumm || laut === 0 ? 'volume_off' : laut < 50 ? 'volume_down' : 'volume_up');
                titelSetzen(z.q.stumm, st.stumm ? 'Ton an' : 'Stumm');
                if (document.activeElement !== z.q.laut.input) {
                    var v = String(Math.round(laut));
                    if (z.q.laut.input.value !== v) z.q.laut.input.value = v;
                    fuellen(z.q.laut, laut);
                }
                var hatMenue = !z.demo && !!document.querySelector('.nowPlayingBar .btnToggleContextMenu');
                if (z.q.mehr.hidden === hatMenue) z.q.mehr.hidden = !hatMenue;
                zeitZeichnen(st);
            }

            // ---------- Songtext

            function punkteZeile(i, start) {
                var d = neu('div', 'werkstattGross-zeile werkstattGross-punkte');
                d.setAttribute('data-index', String(i));
                if (start != null) d.setAttribute('data-start', String(start));
                d.setAttribute('aria-label', 'Instrumental');
                for (var k = 0; k < 3; k++) d.appendChild(neu('span'));
                return d;
            }

            function songtextZeichnen() {
                var box = z.q.songtext;
                box.textContent = '';
                klasse(box, 'werkstattGross-songtext-frei', false);
                z.lyrIndex = -2;
                var L = z.lyr;
                if (!L) return; // lädt noch oder keiner: dann steht das Cover allein
                var frag = document.createDocumentFragment();
                if (L.synchron && L.zeilen[0].start > PUNKTE_AB) frag.appendChild(punkteZeile(-1, 0));
                L.zeilen.forEach(function (x, i) {
                    var d;
                    if (!x.text) {
                        d = punkteZeile(i, L.synchron ? x.start : null);
                    } else {
                        d = neu('div', 'werkstattGross-zeile', x.text);
                        d.setAttribute('data-index', String(i));
                        if (L.synchron) d.setAttribute('data-start', String(x.start));
                    }
                    frag.appendChild(d);
                });
                box.appendChild(frag);
                if (!L.synchron) {
                    klasse(box, 'werkstattGross-songtext-frei', true);
                    z.q.scroll.scrollTop = 0;
                    return;
                }
                songtextZeile(true);
            }

            function songtextZeile(sofort) {
                if (!z.offen || !z.lyr || !z.lyr.synchron) return;
                var t = (zustand().ms + VORLAUF_MS) * 10000;
                var zeilen = z.lyr.zeilen, idx = -1;
                for (var i = 0; i < zeilen.length; i++) {
                    if (zeilen[i].start <= t) idx = i;
                    else break;
                }
                if (idx === z.lyrIndex) return;
                z.lyrIndex = idx;
                var aktuell = null;
                var els = z.q.songtext.children;
                for (var k = 0; k < els.length; k++) {
                    var n = +els[k].getAttribute('data-index');
                    klasse(els[k], 'werkstattGross-jetzt', n === idx);
                    klasse(els[k], 'werkstattGross-vorbei', n < idx);
                    if (n === idx) aktuell = els[k];
                }
                if (!aktuell && idx === -1) aktuell = els[0] || null;
                if (aktuell && Date.now() >= z.handBis) {
                    var sc = z.q.scroll;
                    var ziel = Math.max(0, aktuell.offsetTop - sc.clientHeight * 0.3);
                    try {
                        sc.scrollTo({ top: ziel, behavior: sofort ? 'auto' : 'smooth' });
                    } catch (e) {
                        sc.scrollTop = ziel;
                    }
                }
            }

            // ---------- Menü „Mehr“: Jellyfins Kontextmenü der Musikleiste, an unseren Knopf gelegt

            function menue(b) {
                var orig = document.querySelector('.nowPlayingBar .btnToggleContextMenu');
                if (!orig) return;
                var vorher = Array.prototype.slice.call(document.querySelectorAll('.dialogContainer .actionSheet'));
                orig.click();
                var start = Date.now();
                var anlegen = function (sheet) {
                    try {
                        var r = b.getBoundingClientRect();
                        var h = sheet.offsetHeight, w = sheet.offsetWidth;
                        sheet.style.left = Math.round(Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8)) + 'px';
                        sheet.style.top = Math.round(Math.max(8, r.top - h - 8)) + 'px';
                        sheet.style.right = 'auto';
                        sheet.style.bottom = 'auto';
                    } catch (e) { /* bleibt, wo Jellyfin es hinlegt */ }
                };
                var warte = function () {
                    var neuEl = Array.prototype.filter.call(document.querySelectorAll('.dialogContainer .actionSheet'), function (d) { return vorher.indexOf(d) < 0; })[0];
                    if (neuEl) {
                        // Jellyfin setzt die Lage beim Öffnen; danach (und nach dem Einblenden) noch einmal unsere
                        window.requestAnimationFrame(function () { anlegen(neuEl); });
                        window.setTimeout(function () { anlegen(neuEl); }, 180);
                        return;
                    }
                    if (Date.now() - start < 2000) window.requestAnimationFrame(warte);
                };
                window.requestAnimationFrame(warte);
            }

            // ---------- Öffnen und Schließen

            function oeffnen() {
                try {
                    if (z.offen) return;
                    if (!desktop() || !an()) return;
                    if (!api()) {
                        // Werkstatt: Demodaten
                        if (!z.demo) z.demo = demoBauen(demoDaten());
                    } else if (!z.mgr || !istMusik(aktuellesItem())) {
                        return;
                    }
                    var el = z.el || bauen();
                    window.clearTimeout(z.schliessTimer);
                    z.opener = document.activeElement;
                    z.offen = true;
                    z.itemId = null;
                    z.handBis = 0;
                    try { z.textAn = window.localStorage.getItem(SPEICHER_TEXT) !== '0'; } catch (e) { z.textAn = true; }
                    el.hidden = false;
                    document.documentElement.classList.add('werkstattGrossOffen');
                    if (z.demo) z.demo.starten();
                    anPlayerBinden();
                    titelPruefen();
                    zustandZeichnen();
                    // Einblenden nach dem ersten Bild, sonst greift der Übergang nicht
                    window.requestAnimationFrame(function () {
                        window.requestAnimationFrame(function () {
                            if (!z.offen) return;
                            klasse(el, 'werkstattGross-sichtbar', true);
                            z.lyrIndex = -2;
                            songtextZeile(true);
                        });
                    });
                    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
                } catch (e) {
                    warn('Öffnen', e);
                }
            }

            function schliessen() {
                try {
                    if (!z.offen) return;
                    z.offen = false;
                    window.clearTimeout(z.stoppTimer);
                    if (z.demo) z.demo.anhalten();
                    var el = z.el;
                    klasse(el, 'werkstattGross-sichtbar', false);
                    document.documentElement.classList.remove('werkstattGrossOffen');
                    z.schliessTimer = window.setTimeout(function () {
                        if (!z.offen && el) el.hidden = true;
                    }, 320);
                    var o = z.opener;
                    z.opener = null;
                    if (o && o.isConnected && typeof o.focus === 'function') {
                        try { o.focus({ preventScroll: true }); } catch (e) { /* egal */ }
                    }
                } catch (e) {
                    warn('Schließen', e);
                }
            }

            // ---------- Knöpfe zum Öffnen (Musikleiste, Wiedergabeseite)

            function oeffnerBauen(extra) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'paper-icon-button-light ' + (extra ? extra + ' ' : '') + KNOPF;
                b.title = 'Vollbild';
                b.setAttribute('aria-label', 'Vollbild');
                b.innerHTML = '<span class="material-icons fullscreen" aria-hidden="true"></span>';
                return b;
            }

            function knoepfeWeg() {
                document.querySelectorAll('.' + KNOPF).forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); });
            }

            // Musikleiste: ganz rechts außen, direkt hinter .nowPlayingBarRight (nur einsetzen oder umstellen, wenn nötig)
            function inLeiste(leiste, zeigen) {
                var top = leiste.querySelector(':scope > .nowPlayingBarTop');
                var rechts = top && top.querySelector(':scope > .nowPlayingBarRight');
                if (!rechts) return;
                var b = top.querySelector(':scope > .' + KNOPF);
                if (!b) {
                    // aus einer früheren Fassung noch in .nowPlayingBarRight? Dann umziehen statt doppelt
                    b = rechts.querySelector(':scope > .' + KNOPF) || oeffnerBauen('mediaButton');
                }
                if (b.parentNode !== top || b.previousElementSibling !== rechts) top.insertBefore(b, rechts.nextSibling);
                if (b.hidden !== !zeigen) b.hidden = !zeigen;
            }

            // Wiedergabeseite: oben rechts im Player-Kasten, links neben dem Schließen-Pfeil
            function aufSeite(box, zeigen) {
                var b = box.querySelector(':scope > .' + KNOPF);
                if (!b) {
                    b = oeffnerBauen('');
                    box.insertBefore(b, box.firstChild);
                }
                if (b.hidden !== !zeigen) b.hidden = !zeigen;
            }

            function pruefen() {
                try {
                    var aktiv = an() && desktop();
                    if (!aktiv) {
                        if (document.querySelector('.' + KNOPF)) knoepfeWeg();
                        if (z.offen) schliessen();
                        return;
                    }
                    if (!z.mgr && G.playbackManager) gefunden(G.playbackManager);
                    var zeigen = api() ? (!!z.mgr && istMusik(aktuellesItem())) : true;
                    var leisten = document.querySelectorAll('.nowPlayingBar');
                    for (var i = 0; i < leisten.length; i++) inLeiste(leisten[i], zeigen);
                    var boxen = document.querySelectorAll('#nowPlayingPage .nowPlayingInfoContainer');
                    for (var k = 0; k < boxen.length; k++) aufSeite(boxen[k], zeigen);
                } catch (e) {
                    warn('Prüfen', e);
                }
            }

            var wartet = 0;
            function planen() {
                if (G.kern && G.kern.teile && G.kern.teile.grosseAnsicht === pruefen) {
                    G.kern.planen();
                    return;
                }
                if (!wartet) wartet = window.setTimeout(function () { wartet = 0; pruefen(); }, 80);
            }

            // ---------- Start

            function starten() {
                // Klicks auf die Öffner: vor Jellyfin abfangen (sonst öffnete die Leiste auch die Wiedergabeseite)
                window.addEventListener('click', function (e) {
                    try {
                        var b = e.target && e.target.closest ? e.target.closest('.' + KNOPF) : null;
                        if (!b) return;
                        e.preventDefault();
                        e.stopPropagation();
                        oeffnen();
                    } catch (err) { /* nichts */ }
                }, true);

                window.addEventListener('keydown', function (e) {
                    if (!z.offen || e.defaultPrevented) return;
                    if (e.ctrlKey || e.altKey || e.metaKey) return;
                    // Offene Jellyfin-Dialoge (Menü „Mehr“) schließen sich selbst
                    if (document.querySelector('.dialogContainer .dialog.opened')) return;
                    var t = e.target;
                    if (e.key === 'Escape' || e.key === 'Esc') {
                        e.preventDefault();
                        schliessen();
                    } else if ((e.key === ' ' || e.key === 'Spacebar') && !(t && t.closest && t.closest('button, input, textarea, select, a, [contenteditable]'))) {
                        e.preventDefault();
                        befehl('playpause');
                    }
                });

                // Fokus bleibt in der Ansicht (außer in Jellyfins Dialogen darüber)
                document.addEventListener('focusin', function (e) {
                    if (!z.offen || !z.el) return;
                    var t = e.target;
                    if (z.el.contains(t) || (t && t.closest && t.closest('.dialogContainer'))) return;
                    try { z.el.focus({ preventScroll: true }); } catch (err) { /* egal */ }
                });

                // Seitenwechsel (Link im Menü, Zurück im Browser): Ansicht zu
                document.addEventListener('viewbeforeshow', function () {
                    if (z.offen) schliessen();
                    planen();
                });

                if (G.kern && G.kern.teile) {
                    G.kern.teile.grosseAnsicht = pruefen;
                } else {
                    try {
                        new MutationObserver(planen).observe(document.documentElement, {
                            childList: true, subtree: true, attributes: true, attributeFilter: ['class']
                        });
                    } catch (e) { /* ohne Observer bleibt der Takt unten */ }
                }
                // Selten nachsehen, falls ein Observer etwas verpasst (Layoutwechsel, Manager gefunden)
                window.setInterval(planen, 4000);
                planen();

                // Werkstatt: Bestandteil E9 öffnet die Ansicht gleich
                var demo = document.getElementById('werkstattGrossDemo');
                if (demo && !api() && demo.hasAttribute('data-oeffnen')) {
                    window.setTimeout(function () { oeffnen(); }, 120);
                }
            }

            G.grosseAnsicht = { zustand: z, oeffnen: oeffnen, schliessen: schliessen, pruefen: pruefen };

            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();

            // Echtes Jellyfin: sobald ApiClient und Events da sind, den Manager suchen (Hülle um Events.trigger).
            // In der Werkstatt gibt es beides nicht, dort gibt das Warten nach einer Minute still auf.
            var versuche = 0;
            var warten = function () {
                try {
                    if (z.mgr) return;
                    if (G.playbackManager) { gefunden(G.playbackManager); return; }
                    if (api() && ev()) { haken(); return; }
                    if (++versuche <= 60) window.setTimeout(warten, 1000);
                } catch (e) {
                    warn('Start', e);
                }
            };
            warten();
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Große Ansicht', e);
        }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript grosse-ansicht:", e);
    }
})();

// bibliothek-reiter: Bibliotheken: weniger Reiter, eigene Reihenfolge
(function () {
    try {
/* Reiter der Bibliotheken Musik, Filme und Serien ausblenden und umsortieren (ElegantFin-Werkstatt,
   Schalter „bibliothek-reiter“). Erkennt die Seiten an #musicRecommendedPage, #moviesPage, #tvRecommendedPage. */
(function werkstattReiter() {
        'use strict';
        try {
            var G = window.__werkstatt = window.__werkstatt || {};
            if (G.reiter) return;
            G.reiter = true;

            // Je Seite: Zahl der Reiter bei Jellyfin und gewünschte Reihenfolge (data-index); was fehlt, wird ausgeblendet
            var ARTEN = {
                // Album-Interpreten, Interpreten, Alben, Lieder, Wiedergabelisten, Genres (weg: Vorschläge).
                // Nachträge vom 23.10.2026: „mach mal bitte Wiedergabelisten wieder rein“ und Album-Interpreten
                // wieder da, vorn (seit die Gäste eigene Interpreten sind, listet „Interpreten“ jeden Gast)
                musicRecommendedPage: { anzahl: 7, folge: [2, 3, 0, 5, 4, 6] },
                // Filme, Sammlungen, Genres, Favoriten (weg: Vorschläge)
                moviesPage: { anzahl: 5, folge: [0, 3, 4, 2] },
                // Serien, Folgen, Genres (weg: Vorschläge, Demnächst, Fernsehsender)
                tvRecommendedPage: { anzahl: 6, folge: [0, 5, 3] }
            };
            var SEITEN = '#musicRecommendedPage, #moviesPage, #tvRecommendedPage';
            var WEG = 'data-werkstatt-reiter-weg';
            var AKTIV = 'emby-tab-button-active';

            var ansicht = null;     // letzte Seite aus viewshow: { el, params }
            var vorhanden = null;   // Reiterleiste, die beim Start schon dastand (Skript kam spät)
            var wartet = 0;

            function warn(was, e) {
                if (window.console) console.warn('Werkstatt: Reiter, ' + was, e);
            }

            function an() {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-reiter').trim() === '1';
                } catch (e) {
                    return false;
                }
            }

            function jellyfin() {
                return !!window.ApiClient;
            }

            function istLeiste(el) {
                return !!(el && el.nodeType === 1 && el.classList.contains('tabs-viewmenubar') &&
                    el.parentNode && el.parentNode.classList && el.parentNode.classList.contains('headerTabs'));
            }

            // Die Knöpfe in ihrer jetzigen Reihenfolge im DOM
            function knoepfe(tabs) {
                var slider = tabs.querySelector('.emby-tabs-slider') || tabs;
                var liste = [];
                for (var k = slider.firstElementChild; k; k = k.nextElementSibling) {
                    if (k.classList.contains('emby-tab-button') && k.hasAttribute('data-index')) liste.push(k);
                }
                return { slider: slider, liste: liste };
            }

            function nummer(b) {
                return parseInt(b.getAttribute('data-index'), 10);
            }

            // Die Bibliotheksseite, zu der die Reiter gehören (oder null, wenn es keine der drei ist)
            function seite() {
                if (ansicht && ansicht.el && ansicht.el.isConnected) return ARTEN[ansicht.el.id] ? ansicht.el : null;
                var s = document.querySelectorAll(SEITEN);
                for (var i = 0; i < s.length; i++) if (!s[i].classList.contains('hide')) return s[i];
                return null;
            }

            function sichtbar(art, i) {
                return art.folge.indexOf(i) >= 0;
            }

            // Ausblenden und umstellen; false, wenn die Leiste nicht zu der erwarteten Liste passt
            function ordnen(tabs, art) {
                var k = knoepfe(tabs), liste = k.liste;
                if (liste.length !== art.anzahl) return false;
                var nach = {};
                liste.forEach(function (b) { nach[nummer(b)] = b; });
                var soll = [];
                art.folge.forEach(function (i) { if (nach[i]) soll.push(nach[i]); });
                if (soll.length !== art.folge.length) return false;
                for (var i = 0; i < art.anzahl; i++) {
                    if (!nach[i]) return false;
                    if (!sichtbar(art, i)) soll.push(nach[i]);
                }
                var geaendert = false;
                soll.forEach(function (b) {
                    if (sichtbar(art, nummer(b)) || b.hasAttribute(WEG)) return;
                    // Hatte Jellyfin den Knopf schon ausgeblendet, bleibt er das auch beim Zurücknehmen
                    b.setAttribute(WEG, b.classList.contains('hide') ? 'jellyfin' : '');
                    b.classList.add('hide');
                    geaendert = true;
                });
                if (soll.some(function (b, j) { return liste[j] !== b; })) {
                    soll.forEach(function (b) { k.slider.appendChild(b); });
                    geaendert = true;
                }
                tabs.__werkstattReiter = art;
                if (geaendert && typeof tabs.refresh === 'function') {
                    try { tabs.refresh(); } catch (e) { /* Scroller misst beim nächsten Mal */ }
                }
                return true;
            }

            function zurueck(tabs) {
                if (!tabs.__werkstattReiter) return;
                tabs.__werkstattReiter = null;
                tabs.__werkstattUmleitung = null;
                var k = knoepfe(tabs);
                k.liste.forEach(function (b) {
                    if (!b.hasAttribute(WEG)) return;
                    if (b.getAttribute(WEG) !== 'jellyfin') b.classList.remove('hide');
                    b.removeAttribute(WEG);
                });
                var sortiert = k.liste.slice().sort(function (a, b) { return nummer(a) - nummer(b); });
                if (sortiert.some(function (b, j) { return k.liste[j] !== b; })) {
                    sortiert.forEach(function (b) { k.slider.appendChild(b); });
                }
                if (typeof tabs.refresh === 'function') {
                    try { tabs.refresh(); } catch (e) { /* egal */ }
                }
            }

            // Markierung und Merker von emby-tabs auf den Knopf mit dieser Nummer setzen
            function aktivSetzen(tabs, idx) {
                var ziel = null, geaendert = false;
                knoepfe(tabs).liste.forEach(function (b) {
                    var soll = nummer(b) === idx;
                    if (soll) ziel = b;
                    if (b.classList.contains(AKTIV) !== soll) { b.classList.toggle(AKTIV, soll); geaendert = true; }
                });
                if (!ziel) return;
                tabs.selectedTabIndex = idx;
                // Nur wenn die Markierung falsch stand; nach einem Klick rollt emby-tabs selbst (mit Animation)
                if (geaendert && tabs.scroller && typeof tabs.scroller.toCenter === 'function') {
                    try { tabs.scroller.toCenter(ziel, true); } catch (e) { /* egal */ }
                }
            }

            function adressParameter() {
                var p = {};
                var h = String(window.location.hash || ''), q = h.indexOf('?');
                if (q < 0) return p;
                h.slice(q + 1).split('&').forEach(function (t) {
                    var j = t.indexOf('=');
                    if (j <= 0) return;
                    try { p[decodeURIComponent(t.slice(0, j))] = decodeURIComponent(t.slice(j + 1)); } catch (e) { /* kaputter Teil */ }
                });
                return p;
            }

            // Welcher Reiter soll statt Jellyfins Nummer idx gelten?
            function ziel(page, art, idx) {
                var z = sichtbar(art, idx) ? idx : art.folge[0];
                if (!page.__werkstattReiterStart) {
                    // Erste Wahl auf dieser Seite: ohne tab in der Adresse und ohne eigene Standardansicht
                    // (Jellyfin liefert dann 0) gilt der erste Reiter der neuen Reihenfolge
                    page.__werkstattReiterStart = true;
                    var p = (ansicht && ansicht.el === page && ansicht.params) || adressParameter();
                    var eigene = p && p.tab != null && String(p.tab) !== '';
                    if (!eigene && idx === 0) z = art.folge[0];
                }
                return z;
            }

            // Klick auf einen Knopf: emby-tabs nimmt die Nummer aus data-index, nicht aus der Stellung
            function waehlen(tabs, idx) {
                var b = knoepfe(tabs).liste.filter(function (x) { return nummer(x) === idx; })[0];
                if (!b || tabs.__werkstattGewaehlt === idx) return;
                tabs.__werkstattGewaehlt = idx;
                try { b.click(); } catch (e) { warn('Klick', e); }
                // Werkstatt: kein emby-tabs, das die Markierung umsetzt
                if (!jellyfin()) aktivSetzen(tabs, idx);
            }

            // ---------- Ereignisse (Capture am document: vor Jellyfins Zuhörern am Reiter-Element)

            document.addEventListener('viewshow', function (e) {
                try {
                    var el = e.target;
                    if (el && el.nodeType === 1 && el.classList.contains('page')) {
                        ansicht = { el: el, params: (e.detail && e.detail.params) || null };
                    }
                } catch (x) { /* nichts */ }
            }, true);

            document.addEventListener('beforetabchange', function (e) {
                try {
                    var tabs = e.target;
                    if (!istLeiste(tabs) || !e.detail) return;
                    if (!an()) { zurueck(tabs); return; }
                    var page = seite(), art = page && ARTEN[page.id];
                    if (!art || !ordnen(tabs, art)) { zurueck(tabs); return; }
                    var idx = parseInt(e.detail.selectedTabIndex, 10);
                    if (isNaN(idx)) return;
                    var z = ziel(page, art, idx);
                    if (z !== idx) {
                        tabs.__werkstattUmleitung = { von: idx, nach: z };
                        e.detail.selectedTabIndex = z;
                    }
                } catch (x) {
                    warn('beforetabchange', x);
                }
            }, true);

            document.addEventListener('tabchange', function (e) {
                try {
                    var tabs = e.target;
                    if (!istLeiste(tabs) || !e.detail || !tabs.__werkstattReiter) return;
                    var idx = parseInt(e.detail.selectedTabIndex, 10);
                    if (isNaN(idx)) return;
                    var u = tabs.__werkstattUmleitung;
                    if (u && u.von === idx) {
                        tabs.__werkstattUmleitung = null;
                        idx = u.nach;
                        e.detail.selectedTabIndex = idx;
                    } else if (!sichtbar(tabs.__werkstattReiter, idx)) {
                        idx = tabs.__werkstattReiter.folge[0];
                        e.detail.selectedTabIndex = idx;
                    }
                    // Jellyfin markiert danach noch nach Stellung im DOM; im nächsten Mikrotask richtigstellen
                    Promise.resolve().then(function () {
                        try { if (tabs.__werkstattReiter) aktivSetzen(tabs, idx); } catch (x) { /* nichts */ }
                    });
                } catch (x) {
                    warn('tabchange', x);
                }
            }, true);

            // ---------- Rückfall und Abschalten: neue Leisten und geänderte Stile

            function pruefen() {
                wartet = 0;
                try {
                    var ein = an();
                    document.querySelectorAll('.headerTabs > .tabs-viewmenubar').forEach(function (tabs) {
                        if (!ein) { zurueck(tabs); return; }
                        var page = seite(), art = page && ARTEN[page.id];
                        if (!art || !ordnen(tabs, art)) { zurueck(tabs); return; }
                        var aktiv = tabs.querySelector('.emby-tab-button.' + AKTIV);
                        var idx = aktiv ? nummer(aktiv) : (parseInt(tabs.getAttribute('data-index'), 10) || 0);
                        // Die erste Wahl hat das Skript nicht mitbekommen: in der Werkstatt (keine Ereignisse)
                        // oder weil es erst nach dem Aufbau der Leiste geladen wurde
                        if (!page.__werkstattReiterStart && (!jellyfin() || tabs === vorhanden)) {
                            var z = ziel(page, art, idx);
                            if (z !== idx) waehlen(tabs, z);
                        } else if (!sichtbar(art, idx)) {
                            waehlen(tabs, art.folge[0]);
                        }
                    });
                } catch (e) {
                    warn('Prüfen', e);
                }
            }

            function planen() {
                if (!wartet) wartet = setTimeout(pruefen, 60);
            }

            function istStil(n) {
                return n && (n.nodeName === 'STYLE' || n.nodeName === 'LINK');
            }

            function wichtig(r) {
                var t = r.target;
                if (istStil(t) || t === document.head) return true;
                if (t.classList && (t.classList.contains('headerTabs') || t.classList.contains('emby-tabs-slider'))) return true;
                var i;
                for (i = 0; i < r.addedNodes.length; i++) if (istStil(r.addedNodes[i])) return true;
                for (i = 0; i < r.removedNodes.length; i++) if (istStil(r.removedNodes[i])) return true;
                return false;
            }

            var starten = function () {
                try {
                    vorhanden = document.querySelector('.headerTabs > .tabs-viewmenubar');
                    new MutationObserver(function (records) {
                        try {
                            for (var i = 0; i < records.length; i++) {
                                if (wichtig(records[i])) { planen(); return; }
                            }
                        } catch (e) { /* nichts */ }
                    }).observe(document.documentElement, { childList: true, subtree: true });
                } catch (e) { /* ohne Observer bleiben die Ereignisse */ }
                planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Reiter', e);
        }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript bibliothek-reiter:", e);
    }
})();

// folgen-ueberschriften: Serien, Reiter „Folgen“: Überschriften je Serie und Staffel
(function () {
    try {
/* Überschriften „Serie“ und „Staffel N“ im Reiter „Folgen“ (ElegantFin-Werkstatt, Schalter
   „folgen-ueberschriften“). Nur bei Sortierung nach Name (Serie, Staffel, Folge). */
(function werkstattFolgenKoepfe() {
        'use strict';
        try {
            var G = window.__werkstatt = window.__werkstatt || {};
            if (G.folgenKoepfe) return;
            G.folgenKoepfe = true;

            var SEL = '#tvRecommendedPage #episodesTab .itemsContainer';
            var KOPF = 'werkstattFolgenKopf';
            var PAKET = 100;            // Ids je Abfrage
            var NOCHMAL = 60 * 1000;    // fehlgeschlagene Abfrage frühestens nach einer Minute wiederholen

            var speicher = {};  // Folgen-Id: { serie, staffel, name } oder { fehlt: Zeitpunkt }
            var offen = {};     // Folgen-Id: true, solange die Abfrage läuft
            var demo = null;
            var wartet = 0;
            var mo = null;

            function an() {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-folgen-ueberschriften').trim() === '1';
                } catch (e) {
                    return false;
                }
            }

            function api() {
                var a = window.ApiClient;
                return a && typeof a.getItems === 'function' && typeof a.getCurrentUserId === 'function' ? a : null;
            }

            // Werkstatt: die Daten der Demo-Folgen stehen als JSON im Rahmen (kein ApiClient)
            function demoDaten() {
                if (demo) return demo;
                var el = document.getElementById('werkstattFolgenDemo');
                if (!el) return {};
                try { demo = JSON.parse(el.textContent || '{}') || {}; } catch (e) { demo = {}; }
                return demo;
            }

            function adressParameter() {
                var p = {};
                var h = String(window.location.hash || ''), q = h.indexOf('?');
                if (q < 0) return p;
                h.slice(q + 1).split('&').forEach(function (t) {
                    var j = t.indexOf('=');
                    if (j <= 0) return;
                    try { p[decodeURIComponent(t.slice(0, j))] = decodeURIComponent(t.slice(j + 1)); } catch (e) { /* kaputter Teil */ }
                });
                return p;
            }

            // Nach Serie sortiert? episodes.js speichert die Sortierung nach jedem Laden (userSettings.saveQuerySettings,
            // localStorage „<Benutzer>-<Bibliothek>-episodes“). Ohne Angabe gilt Jellyfins Standard „SeriesSortName,SortName“.
            function nachSerie() {
                var a = api();
                if (!a) return true;
                var id = adressParameter().topParentId, u = '';
                try { u = a.getCurrentUserId() || ''; } catch (e) { u = ''; }
                if (!id || !u) return true;
                var s = null;
                try { s = JSON.parse(window.localStorage.getItem(u + '-' + id + '-episodes') || 'null'); } catch (e) { s = null; }
                if (!s || !s.SortBy) return true;
                return String(s.SortBy).indexOf('SeriesSortName') === 0;
            }

            // Aus dem Markup: erste Zeile Serienname, zweite „S1:E5 - Titel“ (Karten wie Listenzeilen)
            function ausMarkup(el) {
                var z = el.querySelectorAll('.cardFooter .cardText');
                if (z.length < 2) z = el.querySelectorAll('.listItemBody .listItemBodyText');
                if (z.length < 2) return null;
                var serie = (z[0].textContent || '').trim();
                if (!serie) return null;
                var m = /^S(\d+):E\d/.exec((z[1].textContent || '').trim());
                return { serie: serie, staffel: m ? parseInt(m[1], 10) : null, name: '' };
            }

            function daten(el) {
                var id = el.getAttribute('data-id');
                var e = id && speicher[id];
                if (e && e.serie) return e;
                if (id && !api()) {
                    var d = demoDaten()[id];
                    if (d && d.serie) return { serie: String(d.serie), staffel: d.staffel == null ? null : +d.staffel, name: String(d.name || '') };
                }
                return ausMarkup(el);
            }

            function staffelText(d) {
                if (d.staffel == null || isNaN(d.staffel)) return '';
                return d.staffel === 0 ? 'Extras' : 'Staffel ' + d.staffel;
            }

            // Eigener Staffelname (etwa „Die Reiter von Berk“), nicht wenn er nur „Staffel 4“ wiederholt
            function staffelZusatz(d) {
                var n = String(d.name || '').trim();
                if (!n || d.staffel == null) return '';
                if (/^(staffel|season|saison|stagione|temporada)\s*\d+$/i.test(n)) return '';
                if (d.staffel === 0 && /^(specials?|extras?|besonderheiten)$/i.test(n)) return '';
                return n;
            }

            function holen(a, ids) {
                ids.forEach(function (id) { offen[id] = true; });
                for (var i = 0; i < ids.length; i += PAKET) {
                    (function (teil) {
                        var erledigt = false;
                        var fertig = function (items) {
                            if (erledigt) return;
                            erledigt = true;
                            (items || []).forEach(function (it) {
                                if (!it || !it.Id || !it.SeriesName) return;
                                speicher[it.Id] = {
                                    serie: String(it.SeriesName),
                                    staffel: it.ParentIndexNumber == null ? null : it.ParentIndexNumber,
                                    name: String(it.SeasonName || '')
                                };
                            });
                            var jetzt = Date.now();
                            teil.forEach(function (id) {
                                delete offen[id];
                                if (!speicher[id]) speicher[id] = { fehlt: jetzt };
                            });
                            planen();
                        };
                        setTimeout(function () { fertig(null); }, 8000);
                        try {
                            Promise.resolve(a.getItems(a.getCurrentUserId(), {
                                Ids: teil.join(','),
                                EnableImages: false,
                                EnableUserData: false,
                                EnableTotalRecordCount: false
                            })).then(function (res) {
                                fertig((res && res.Items) || []);
                            }, function () {
                                fertig(null);
                            });
                        } catch (e) {
                            fertig(null);
                        }
                    })(ids.slice(i, i + PAKET));
                }
            }

            function kopfBauen(s) {
                var d = document.createElement('div');
                d.className = KOPF + (s.serie ? ' ' + KOPF + '-mitSerie' : '');
                d.setAttribute('data-werkstatt-kopf', s.schluessel);
                if (s.serie) {
                    var h2 = document.createElement('h2');
                    h2.className = 'sectionTitle ' + KOPF + '-serie';
                    h2.textContent = s.serie;
                    d.appendChild(h2);
                }
                if (s.staffel) {
                    var h3 = document.createElement('h3');
                    h3.className = KOPF + '-staffel';
                    h3.textContent = s.staffel;
                    if (s.zusatz) {
                        var z = document.createElement('span');
                        z.className = KOPF + '-zusatz';
                        z.textContent = s.zusatz;
                        h3.appendChild(z);
                    }
                    d.appendChild(h3);
                }
                return d;
            }

            // Überschriften eines Behälters herstellen; ändert nur etwas, wenn es nicht schon stimmt
            function ordnen(c, ein) {
                var alt = [], items = [];
                for (var k = c.firstElementChild; k; k = k.nextElementSibling) {
                    if (k.classList.contains(KOPF)) alt.push(k);
                    else if (k.hasAttribute('data-id')) items.push(k);
                }
                var soll = [];
                if (ein) {
                    var vorher = null;
                    items.forEach(function (it) {
                        var d = daten(it);
                        if (!d) return;
                        var st = staffelText(d);
                        var neueSerie = !vorher || vorher.serie !== d.serie;
                        if (neueSerie || (st && vorher.staffel !== st)) {
                            var zusatz = st ? staffelZusatz(d) : '';
                            var serie = neueSerie ? d.serie : '';
                            soll.push({ vor: it, serie: serie, staffel: st, zusatz: zusatz, schluessel: serie + '\n' + st + '\n' + zusatz });
                        }
                        vorher = { serie: d.serie, staffel: st };
                    });
                }
                var passt = alt.length === soll.length && soll.every(function (s) {
                    var v = s.vor.previousElementSibling;
                    return v && v.classList.contains(KOPF) && v.getAttribute('data-werkstatt-kopf') === s.schluessel;
                });
                if (passt) return;
                alt.forEach(function (x) { c.removeChild(x); });
                soll.forEach(function (s) { c.insertBefore(kopfBauen(s), s.vor); });
            }

            function pruefen() {
                wartet = 0;
                try {
                    var behaelter = document.querySelectorAll(SEL);
                    if (!behaelter.length && !document.querySelector('.' + KOPF)) return;
                    var ein = an() && nachSerie();
                    var a = ein ? api() : null;
                    var fehlend = [];
                    var jetzt = Date.now();
                    behaelter.forEach(function (c) {
                        if (a) {
                            for (var k = c.firstElementChild; k; k = k.nextElementSibling) {
                                var id = k.getAttribute('data-id');
                                if (!id || offen[id] || fehlend.indexOf(id) >= 0) continue;
                                var e = speicher[id];
                                if (!e || (e.fehlt && jetzt - e.fehlt > NOCHMAL)) fehlend.push(id);
                            }
                        }
                        ordnen(c, ein);
                    });
                    // Reste außerhalb der Behälter (Seite umgebaut) wegräumen
                    if (!ein) {
                        document.querySelectorAll('.' + KOPF).forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
                    }
                    if (a && fehlend.length) holen(a, fehlend);
                } catch (e) {
                    if (window.console) console.warn('Werkstatt: Folgen-Überschriften', e);
                }
                // Die eigenen Änderungen nicht noch einmal melden lassen (sonst liefe der Observer im Kreis)
                if (mo) mo.takeRecords();
            }

            function planen() {
                if (!wartet) wartet = setTimeout(pruefen, 0);
            }

            function istStil(n) {
                return n && (n.nodeName === 'STYLE' || n.nodeName === 'LINK');
            }

            // Betrifft eine Änderung die Folgen (Behälter selbst, darin oder darüber) oder einen Stil?
            function wichtig(r, behaelter) {
                var t = r.target, i;
                if (istStil(t) || t === document.head) return true;
                for (i = 0; i < r.addedNodes.length; i++) if (istStil(r.addedNodes[i])) return true;
                for (i = 0; i < r.removedNodes.length; i++) if (istStil(r.removedNodes[i])) return true;
                for (i = 0; i < behaelter.length; i++) {
                    if (behaelter[i] === t || behaelter[i].contains(t) || t.contains(behaelter[i])) return true;
                }
                return false;
            }

            var starten = function () {
                try {
                    mo = new MutationObserver(function (records) {
                        try {
                            var behaelter = document.querySelectorAll(SEL);
                            for (var i = 0; i < records.length; i++) {
                                // Gleich hier (vor dem Zeichnen), damit die Karten nicht erst ohne Überschriften stehen
                                if (wichtig(records[i], behaelter)) { pruefen(); return; }
                            }
                        } catch (e) { /* nichts */ }
                    });
                    mo.observe(document.documentElement, { childList: true, subtree: true });
                } catch (e) { /* ohne Observer nur der erste Durchlauf */ }
                planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Folgen-Überschriften', e);
        }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript folgen-ueberschriften:", e);
    }
})();

// musik-reiter-ansicht: Musik, Reiter „Lieder“ und „Genres“: Ansicht wählbar, saubere Genre-Bilder
(function () {
    try {
/* Musikbibliothek, Reiter „Lieder“ und „Genres“: Ansicht wählbar (Liste, Poster, …), eigene Genre-Bilder
   (ElegantFin-Werkstatt, Schalter „musik-reiter-ansicht“). Merkt die Wahl je Bibliothek wie Jellyfin (userSettings). */
(function werkstattAnsicht() {
        'use strict';
        try {
            var G = window.__werkstatt = window.__werkstatt || {};
            if (G.ansicht) return;
            G.ansicht = { an: true };

            var SEITE = '#musicRecommendedPage';
            var MEIN = 'data-werkstatt-ansicht';        // eigene Elemente (Knopf, Leiste, Karten, Zeilen, Menü)
            var ART_ATTR = 'data-werkstatt-ansichtsart'; // am Behälter: welche eigene Ansicht gerade steht
            var BILD = 'data-werkstatt-bild';            // Bild, das erst beim Näherkommen geladen wird
            var NAMEN = { List: 'Liste', Poster: 'Poster', PosterCard: 'Posterkarte', Thumb: 'Miniaturansicht', ThumbCard: 'Miniaturansichtkarte' };
            var PARALLEL = 6;               // gleichzeitige Abfragen der Genre-Cover
            var NOCHMAL = 60 * 1000;        // fehlgeschlagene Abfrage frühestens nach einer Minute wiederholen

            // nativ: die Ansicht, die Jellyfin selbst zeichnet (dann bleiben seine Einträge stehen)
            var ARTEN = [
                { name: 'lieder', index: '5', endung: '-songs-_view', ansichten: ['List', 'Poster', 'PosterCard'], start: 'List', nativ: 'List' },
                { name: 'genres', index: '6', endung: '-genres-werkstatt-_view', ansichten: ['List', 'Poster', 'PosterCard', 'Thumb', 'ThumbCard'], start: 'Poster', nativ: null }
            ];

            var live = null;        // Jellyfins Anzeige-Einstellungen im Speicher (userSettings.displayPrefs)
            var kandidat = null;    // zuletzt gesendete Kopie; kommt sie ein zweites Mal, ist sie „live“
            var serverKopie = null; // CustomPrefs vom Server, einmal geholt (bis „live“ bekannt ist)
            var serverHolt = false;
            var geschrieben = {};   // in dieser Sitzung gewählte Ansichten: Schlüssel -> Wert
            var genreDaten = {};    // Genre-Id -> { cover: [{ id, tag }], alben } | { laedt } | { fehlt: Zeit }
            var zaehler = {};       // Genre-Id -> { alben, lieder }
            var zaehlerGeholt = {}; // Bibliothek -> true
            var schlange = [], laufend = 0;
            var io = null, mo = null, wartet = 0;

            function warn(was, e) {
                if (window.console) console.warn('Werkstatt: Ansicht, ' + was, e);
            }

            function an() {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-ansicht').trim() === '1';
                } catch (e) {
                    return false;
                }
            }

            function api() {
                var a = window.ApiClient;
                return a && typeof a.getCurrentUserId === 'function' ? a : null;
            }

            function benutzer() {
                var a = api();
                if (!a) return '';
                try { return a.getCurrentUserId() || ''; } catch (e) { return ''; }
            }

            function esc(s) {
                return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            }

            function layout() {
                var h = document.documentElement.classList;
                if (h.contains('layout-mobile')) return 'mobile';
                if (h.contains('layout-tv')) return 'tv';
                return 'desktop';
            }

            function adressParameter() {
                var p = {};
                var h = String(window.location.hash || ''), q = h.indexOf('?');
                if (q < 0) return p;
                h.slice(q + 1).split('&').forEach(function (t) {
                    var j = t.indexOf('=');
                    if (j <= 0) return;
                    try { p[decodeURIComponent(t.slice(0, j))] = decodeURIComponent(t.slice(j + 1)); } catch (e) { /* kaputter Teil */ }
                });
                return p;
            }

            // cardBuilderUtils.getDefaultColorIndex: Farbe der Ersatzfläche nach dem Namen (1 bis 5)
            function farbIndex(str) {
                if (!str) return 1;
                var c = String(str.slice(Math.floor(str.length / 2), Math.floor(str.length / 2) + 1).charCodeAt(0));
                var sum = 0;
                for (var i = 0; i < c.length; i++) sum += parseInt(c.charAt(i), 10);
                return (parseInt(String(sum).slice(-1), 10) % 5) + 1;
            }

            function ersatzKlasse(name) {
                return 'defaultCardBackground defaultCardBackground' + farbIndex(name);
            }

            // ---------- Merken wie userSettings: localStorage und DisplayPreferences „usersettings“

            function lokal(k) {
                var u = benutzer();
                return u ? u + '-' + k : k;
            }

            function nachtragen(prefs) {
                Object.keys(geschrieben).forEach(function (k) { prefs.CustomPrefs[k] = geschrieben[k]; });
            }

            // Jede gesendete Kopie bekommt die gewählten Ansichten dazu, bevor sie zum Server geht
            function fangen() {
                var a = window.ApiClient;
                if (!a || typeof a.updateDisplayPreferences !== 'function' || a.updateDisplayPreferences.__werkstattAnsicht) return;
                var orig = a.updateDisplayPreferences;
                var huelle = function (name, prefs) {
                    try {
                        if (name === 'usersettings' && prefs && typeof prefs === 'object' && prefs.CustomPrefs && typeof prefs.CustomPrefs === 'object') {
                            if (prefs !== live) {
                                if (prefs === kandidat) live = prefs;
                                else kandidat = prefs;
                            }
                            nachtragen(prefs);
                        }
                    } catch (e) { /* senden geht trotzdem */ }
                    return orig.apply(this, arguments);
                };
                huelle.__werkstattAnsicht = true;
                a.updateDisplayPreferences = huelle;
            }

            function serverKopieHolen() {
                var a = api(), u = benutzer();
                if (serverHolt || live || !a || !u || typeof a.getDisplayPreferences !== 'function') return;
                serverHolt = true;
                try {
                    Promise.resolve(a.getDisplayPreferences('usersettings', u, 'emby')).then(function (p) {
                        serverKopie = (p && p.CustomPrefs) || {};
                        planen();
                    }, function () {
                        serverKopie = {};
                    });
                } catch (e) {
                    serverKopie = {};
                }
            }

            function lesen(k) {
                if (geschrieben[k] != null) return geschrieben[k];
                if (live && live.CustomPrefs && live.CustomPrefs[k] != null) return String(live.CustomPrefs[k]);
                var v = null;
                try { v = window.localStorage.getItem(lokal(k)); } catch (e) { v = null; }
                if (v) return v;
                if (serverKopie && serverKopie[k] != null) return String(serverKopie[k]);
                return null;
            }

            function schreiben(k, v) {
                geschrieben[k] = v;
                try { window.localStorage.setItem(lokal(k), v); } catch (e) { /* privates Fenster */ }
                var a = api(), u = benutzer();
                if (!a || !u || typeof a.updateDisplayPreferences !== 'function') return;
                fangen();
                try {
                    if (live) {
                        live.CustomPrefs[k] = v;
                        a.updateDisplayPreferences('usersettings', live, u, 'emby');
                        return;
                    }
                    // Jellyfins Kopie noch nicht gesehen: holen, ergänzen, zurückschreiben (wie tweaks-farbe.js)
                    if (typeof a.getDisplayPreferences !== 'function') return;
                    Promise.resolve(a.getDisplayPreferences('usersettings', u, 'emby')).then(function (p) {
                        if (!p) return null;
                        p.CustomPrefs = p.CustomPrefs || {};
                        return a.updateDisplayPreferences('usersettings', p, u, 'emby');
                    }).then(null, function (e) { warn('Speichern', e); });
                } catch (e) {
                    warn('Speichern', e);
                }
            }

            // ---------- Seite, Reiter, Schlüssel

            function bibliothek(seite) {
                if (seite.__werkstattTopParentId) return seite.__werkstattTopParentId;
                if (!seite.classList.contains('hide')) {
                    var p = adressParameter().topParentId;
                    if (p) return String(p);
                }
                return '';
            }

            function schluessel(seite, art) {
                return (bibliothek(seite) || 'werkstatt') + art.endung;
            }

            function ansicht(seite, art) {
                var w = lesen(schluessel(seite, art));
                return art.ansichten.indexOf(w) >= 0 ? w : art.start;
            }

            function behaelter(tab) {
                for (var k = tab.firstElementChild; k; k = k.nextElementSibling) {
                    if (k.classList.contains('itemsContainer')) return k;
                }
                return null;
            }

            // Werkzeugleiste vor dem Behälter (Jellyfins Klassen: flex … focuscontainer-x)
            function leisteFinden(tab) {
                for (var k = tab.firstElementChild; k; k = k.nextElementSibling) {
                    if (k.classList.contains('itemsContainer')) return null;
                    if (k.classList.contains('focuscontainer-x') && k.classList.contains('flex')) return k;
                }
                return null;
            }

            // ---------- Knopf und Menü

            function knopfHerstellen(seite, tab, art) {
                var knopf = tab.querySelector('.btnSelectView');
                if (knopf && !knopf.hasAttribute(MEIN)) {
                    // Im echten Jellyfin hat keiner der beiden Reiter einen; bringt eine spätere Fassung ihn mit,
                    // bedient Jellyfin ihn selbst und das Skript hält sich aus diesem Reiter heraus
                    if (api()) return null;
                    // Werkstatt: die Nachbildung zeigt schon einen Knopf ohne Funktion, den übernehmen
                    knopf.setAttribute(MEIN, 'uebernommen');
                }
                if (!knopf) {
                    var leiste = leisteFinden(tab);
                    if (!leiste) {
                        leiste = document.createElement('div');
                        leiste.className = 'flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x';
                        leiste.setAttribute(MEIN, 'leiste');
                        tab.insertBefore(leiste, tab.firstChild);
                    }
                    knopf = document.createElement('button');
                    knopf.type = 'button';
                    knopf.setAttribute('is', 'paper-icon-button-light');
                    knopf.className = 'btnSelectView autoSize paper-icon-button-light';
                    knopf.title = 'Ansicht wählen';
                    knopf.setAttribute(MEIN, 'knopf');
                    knopf.innerHTML = '<span class="material-icons view_comfy" aria-hidden="true"></span>';
                    // Stelle wie in music.html bei „Alben“: vor Sortieren, sonst vor Filter, sonst ans Ende
                    var vor = null;
                    for (var k = leiste.firstElementChild; k; k = k.nextElementSibling) {
                        if (k.classList.contains('btnSort')) { vor = k; break; }
                        if (!vor && (k.classList.contains('btnFilter-wrapper') || k.classList.contains('btnFilter'))) vor = k;
                    }
                    leiste.insertBefore(knopf, vor);
                }
                if (!knopf.__werkstattAnsicht) {
                    knopf.__werkstattAnsicht = { seite: seite, tab: tab, art: art };
                    knopf.addEventListener('click', klick);
                    knopf.addEventListener('layoutchange', gewechselt);
                }
                return knopf;
            }

            function klick(e) {
                var k = e.currentTarget, info = k && k.__werkstattAnsicht;
                if (!info || !an()) return;
                e.preventDefault();
                var jetzt = ansicht(info.seite, info.art);
                var LB = window.LibraryBrowser;
                try {
                    if (LB && typeof LB.showLayoutMenu === 'function') LB.showLayoutMenu(k, jetzt, info.art.ansichten.slice());
                    else menue(k, jetzt, info.art.ansichten);
                } catch (x) {
                    warn('Menü', x);
                }
            }

            function gewechselt(e) {
                var k = e.currentTarget, info = k && k.__werkstattAnsicht;
                var v = e.detail && e.detail.viewStyle;
                if (!info || !an() || info.art.ansichten.indexOf(v) < 0) return;
                schreiben(schluessel(info.seite, info.art), v);
                pruefen();
            }

            function menueZu() {
                document.querySelectorAll('[' + MEIN + '="menue"]').forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
                document.removeEventListener('keydown', menueTaste, true);
            }

            function menueTaste(e) {
                if (e.key === 'Escape') menueZu();
            }

            // Werkstatt: kleines Menü mit den Klassen von components/actionSheet (gleiches Ereignis wie Jellyfins Menü)
            function menue(knopf, jetzt, ansichten) {
                menueZu();
                var r = knopf.getBoundingClientRect();
                var grund = document.createElement('div');
                grund.className = 'dialogBackdrop dialogBackdropOpened';
                grund.setAttribute(MEIN, 'menue');
                var huelle = document.createElement('div');
                huelle.className = 'dialogContainer';
                huelle.setAttribute(MEIN, 'menue');
                var html = '<div class="focuscontainer dialog actionsheet-not-fullscreen actionSheet centeredDialog opened" style="position:fixed;margin:0;' +
                    'left:' + Math.max(8, Math.round(r.left)) + 'px;top:' + Math.round(r.bottom + 4) + 'px;">' +
                    '<div class="actionSheetContent"><div class="actionSheetScroller scrollY">';
                ansichten.forEach(function (v) {
                    html += '<button is="emby-button" type="button" class="listItem listItem-button actionSheetMenuItem emby-button" data-id="' + esc(v) + '">' +
                        '<span class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons check" aria-hidden="true"' +
                        (v === jetzt ? '' : ' style="visibility:hidden;"') + '></span>' +
                        '<div class="listItemBody actionsheetListItemBody"><div class="listItemBodyText actionSheetItemText">' + esc(NAMEN[v] || v) + '</div></div></button>';
                });
                html += '</div></div></div>';
                huelle.innerHTML = html;
                huelle.addEventListener('click', function (e) {
                    var b = e.target.closest && e.target.closest('.actionSheetMenuItem');
                    menueZu();
                    if (!b) return;
                    knopf.dispatchEvent(new CustomEvent('layoutchange', { detail: { viewStyle: b.getAttribute('data-id') }, bubbles: true, cancelable: false }));
                });
                grund.addEventListener('click', menueZu);
                document.body.appendChild(grund);
                document.body.appendChild(huelle);
                document.addEventListener('keydown', menueTaste, true);
            }

            // ---------- Daten aus Jellyfins Markup

            function datenAttribute(el) {
                var s = '';
                for (var i = 0; i < el.attributes.length; i++) {
                    var a = el.attributes[i];
                    if (a.name.indexOf('data-') !== 0) continue;
                    if (a.name === 'data-index' || a.name === 'data-action' || a.name === 'data-prefix' || a.name === MEIN) continue;
                    s += ' ' + a.name + '="' + esc(a.value) + '"';
                }
                return s;
            }

            function stilBild(el) {
                var m = /url\(\s*(['"]?)(.*?)\1\s*\)/.exec((el && el.style && el.style.backgroundImage) || '');
                return m ? m[2] : '';
            }

            // Bildadresse der Liste (fillWidth/fillHeight 80) auf Kartengröße bringen (Seitenverhältnis bleibt 1:1)
            function groesser(url, px) {
                if (!url) return '';
                return url.replace(/([?&])(fillWidth|fillHeight|maxWidth|maxHeight|width|height)=\d+/gi, function (m, vor, name) {
                    return vor + name + '=' + px;
                });
            }

            // Eine Zeile aus songs.js (listView): Titel, Interpreten, Bild, Favorit
            function liedAusZeile(el) {
                if (!el.classList.contains('listItem')) return null;
                var texte = el.querySelectorAll('.listItemBody .listItemBodyText');
                var bild = el.querySelector('.listItemImage');
                var fav = el.querySelector('[data-isfavorite]');
                var dpr = Math.min(window.devicePixelRatio || 1, 3);
                return {
                    attr: datenAttribute(el),
                    id: el.getAttribute('data-id') || '',
                    serverId: el.getAttribute('data-serverid') || '',
                    titel: texte[0] ? texte[0].textContent.trim() : '',
                    kuenstler: texte[1] ? texte[1].textContent.trim() : '',
                    bild: groesser(bild ? (bild.getAttribute('data-src') || stilBild(bild)) : '', Math.round(320 * dpr)),
                    favorit: fav ? fav.getAttribute('data-isfavorite') : null,
                    likes: fav ? (fav.getAttribute('data-likes') || '') : ''
                };
            }

            // Eine Karte aus musicgenres.js (cardBuilder): Id, Name, Link, Titelzeile und Hover-Knöpfe übernehmen
            function genreAusKarte(el) {
                if (!el.classList.contains('card')) return null;
                var bild = el.querySelector('.cardImageContainer');
                var titel = null;
                el.querySelectorAll('.cardText').forEach(function (t) {
                    if (!titel && !t.classList.contains('cardDefaultText')) titel = t;
                });
                var name = (bild && bild.getAttribute('aria-label')) || (titel ? titel.textContent.trim() : '');
                var overlay = '', mobil = '';
                var sc = el.querySelector('.cardScalable');
                if (sc) {
                    for (var k = sc.firstElementChild; k; k = k.nextElementSibling) {
                        if (k.classList.contains('cardOverlayContainer')) overlay += k.outerHTML;
                        else if (k.classList.contains('cardOverlayButton')) mobil += k.outerHTML;
                    }
                }
                return {
                    attr: datenAttribute(el),
                    id: el.getAttribute('data-id') || '',
                    serverId: el.getAttribute('data-serverid') || '',
                    typ: el.getAttribute('data-type') || 'MusicGenre',
                    name: name,
                    href: (bild && bild.getAttribute('href')) || '#',
                    titelHtml: titel ? titel.innerHTML : '<bdi>' + esc(name) + '</bdi>',
                    overlay: overlay,
                    mobil: mobil
                };
            }

            // ---------- Genre-Cover und Zähler (window.ApiClient)

            function abfrage() {
                while (laufend < PARALLEL && schlange.length) {
                    laufend++;
                    (schlange.shift())(function () {
                        laufend--;
                        abfrage();
                    });
                }
            }

            function coverHolen(a, u, pid, g) {
                genreDaten[g.id] = { laedt: true };
                schlange.push(function (fertig) {
                    var erledigt = false;
                    var ende = function (res) {
                        if (erledigt) return;
                        erledigt = true;
                        if (res) {
                            var gesehen = {}, cover = [];
                            (res.Items || []).forEach(function (it) {
                                var tag = it && it.ImageTags && it.ImageTags.Primary;
                                if (!tag || gesehen[tag] || cover.length >= 4) return;
                                gesehen[tag] = true;
                                cover.push({ id: it.Id, tag: tag });
                            });
                            genreDaten[g.id] = { cover: cover, alben: res.TotalRecordCount };
                        } else {
                            genreDaten[g.id] = { fehlt: Date.now() };
                        }
                        veraltet();
                        fertig();
                    };
                    setTimeout(function () { ende(null); }, 10000);
                    try {
                        var q = {
                            IncludeItemTypes: 'MusicAlbum',
                            Recursive: true,
                            GenreIds: g.id,
                            SortBy: 'ProductionYear,PremiereDate,SortName',
                            SortOrder: 'Descending',
                            Limit: 12,
                            ImageTypeLimit: 1,
                            EnableImageTypes: 'Primary',
                            EnableUserData: false,
                            EnableTotalRecordCount: true
                        };
                        if (pid) q.ParentId = pid;
                        Promise.resolve(a.getItems(u, q)).then(function (res) { ende(res || { Items: [] }); }, function () { ende(null); });
                    } catch (e) {
                        ende(null);
                    }
                });
            }

            function zaehlerHolen(a, u, pid) {
                if (zaehlerGeholt[pid] || typeof a.getGenres !== 'function') return;
                zaehlerGeholt[pid] = true;
                try {
                    var q = { Recursive: true, Fields: 'ItemCounts', SortBy: 'SortName', SortOrder: 'Ascending', EnableImages: false, EnableTotalRecordCount: false };
                    if (pid) q.ParentId = pid;
                    Promise.resolve(a.getGenres(u, q)).then(function (res) {
                        ((res && res.Items) || []).forEach(function (it) {
                            if (it && it.Id) zaehler[it.Id] = { alben: it.AlbumCount, lieder: it.SongCount };
                        });
                        veraltet();
                    }, function () { zaehlerGeholt[pid] = false; });
                } catch (e) {
                    zaehlerGeholt[pid] = false;
                }
            }

            function genresHolen(seite, daten) {
                var a = api(), u = benutzer();
                if (!a || !u || typeof a.getItems !== 'function') return;
                var pid = bibliothek(seite);
                zaehlerHolen(a, u, pid);
                var jetzt = Date.now();
                daten.forEach(function (g) {
                    if (!g.id) return;
                    var e = genreDaten[g.id];
                    if (!e || (e.fehlt && jetzt - e.fehlt > NOCHMAL)) coverHolen(a, u, pid, g);
                });
                abfrage();
            }

            // Neue Daten: Genre-Behälter neu zeichnen lassen
            function veraltet() {
                document.querySelectorAll(SEITE + ' .pageTabContent[data-index="6"] > .itemsContainer').forEach(function (c) {
                    c.__werkstattVeraltet = true;
                });
                planen();
            }

            function bildUrl(c, px) {
                var a = api();
                if (!a || typeof a.getScaledImageUrl !== 'function') return '';
                try {
                    return a.getScaledImageUrl(c.id, { type: 'Primary', tag: c.tag, fillWidth: px, fillHeight: px, quality: 90 }) || '';
                } catch (e) {
                    return '';
                }
            }

            function zahlenText(g) {
                var z = zaehler[g.id] || {}, d = genreDaten[g.id] || {};
                var alben = z.alben != null ? z.alben : d.alben;
                var teile = [];
                if (alben) teile.push(alben + (alben === 1 ? ' Album' : ' Alben'));
                if (z.lieder) teile.push(z.lieder + (z.lieder === 1 ? ' Lied' : ' Lieder'));
                return teile.join(' · ');
            }

            // ---------- Bausteine wie cardBuilder.buildCard und listView.getListViewHtml

            function bildAttr(url) {
                return url ? ' ' + BILD + '="' + esc(url) + '"' : '';
            }

            function knopfHtml(klasse, aktion, icon, titel, iconKlasse) {
                return '<button is="paper-icon-button-light" class="' + klasse + ' paper-icon-button-light" data-action="' + aktion + '"' +
                    (titel ? ' title="' + esc(titel) + '"' : '') + '><span class="material-icons ' + (iconKlasse ? iconKlasse + ' ' : '') + icon + '" aria-hidden="true"></span></button>';
            }

            function favoritHtml(d, klasse, iconKlasse, typ) {
                if (d.favorit == null) return '';
                return '<button is="emby-ratingbutton" type="button" data-action="none" class="' + klasse + ' paper-icon-button-light" data-id="' + esc(d.id) +
                    '" data-serverid="' + esc(d.serverId) + '" data-itemtype="' + typ + '" data-likes="' + esc(d.likes) + '" data-isfavorite="' + esc(d.favorit) + '">' +
                    '<span class="material-icons ' + (iconKlasse ? iconKlasse + ' ' : '') + 'favorite" aria-hidden="true"></span></button>';
            }

            // Textzeilen unter dem Bild (getCardFooterText): ohne Kartenform direkt in cardBox, mit Kartenform in .cardFooter
            function fusszeilen(zeilen, o) {
                var html = '', kl = o.zentriert ? 'cardText cardTextCentered' : 'cardText';
                zeilen.forEach(function (z, i) {
                    html += "<div class='" + kl + (i ? ' cardText-secondary' : ' cardText-first') + "'>" + (z || '&nbsp;') + '</div>';
                });
                if (!o.karte) return html;
                var mehr = o.mobil ? '<button is="paper-icon-button-light" class="itemAction btnCardOptions cardText-secondary paper-icon-button-light" data-action="menu" title="Mehr"><span class="material-icons more_vert" aria-hidden="true"></span></button>' : '';
                return '<div class="cardFooter">' + mehr + html + '</div>';
            }

            // o: form, karte, zentriert, attr, index, art, href, aktion, label, bildKlasse, bildInhalt, bildUrl, padder, overlay, zeilen, musik
            function karteHtml(o) {
                var l = layout();
                var klasse = 'card ' + o.form + 'Card' + (l === 'desktop' ? ' card-hoverable' : '') + (o.musik ? '' : ' card-withuserdata');
                var box = o.karte ? 'cardBox visualCardBox' : 'cardBox cardBox-bottompadded';
                return '<div data-index="' + o.index + '"' + o.attr + ' class="' + klasse + '" ' + MEIN + '="' + o.art + '"><div class="' + box + '">' +
                    '<div class="cardScalable"><div class="cardPadder cardPadder-' + o.form + '">' + (o.padder || '') + '</div>' +
                    '<a href="' + esc(o.href) + '" data-action="' + o.aktion + '" class="' + o.bildKlasse + ' cardContent itemAction"' + bildAttr(o.bildUrl) +
                    ' aria-label="' + esc(o.label) + '" role="img">' + (o.bildInhalt || '') + '</a>' + (o.overlay || '') + '</div>' +
                    fusszeilen(o.zeilen, { zentriert: o.zentriert, karte: o.karte, mobil: l === 'mobile' }) + '</div></div>';
            }

            function liedHtml(d, i, v) {
                var l = layout(), karte = v === 'PosterCard';
                var icon = '<span class="cardImageIcon material-icons audiotrack" aria-hidden="true"></span>';
                var overlay = '';
                if (l === 'desktop') {
                    var b = 'cardOverlayButton cardOverlayButton-hover itemAction';
                    overlay = '<div class="cardOverlayContainer itemAction" data-action="playallfromhere">' +
                        knopfHtml(b + ' cardOverlayFab-primary', 'playallfromhere', 'play_arrow', 'Abspielen', 'cardOverlayButtonIcon cardOverlayButtonIcon-hover') +
                        '<div class="cardOverlayButton-br flex">' + favoritHtml(d, b, 'cardOverlayButtonIcon cardOverlayButtonIcon-hover', 'Audio') +
                        knopfHtml(b, 'menu', 'more_vert', 'Mehr', 'cardOverlayButtonIcon cardOverlayButtonIcon-hover') + '</div></div>';
                } else if (l === 'mobile' && !karte) {
                    overlay = knopfHtml('cardOverlayButton cardOverlayButton-br itemAction', 'menu', 'more_vert', 'Mehr', 'cardOverlayButtonIcon');
                }
                return karteHtml({
                    form: 'square', karte: karte, zentriert: !karte, musik: true, attr: d.attr, index: i, art: 'lied',
                    href: d.id ? '#/details?id=' + d.id + (d.serverId ? '&serverId=' + d.serverId : '') : '#',
                    aktion: 'playallfromhere', label: d.titel,
                    bildKlasse: d.bild ? 'cardImageContainer coveredImage' : 'cardImageContainer ' + ersatzKlasse(d.titel),
                    bildUrl: d.bild, bildInhalt: d.bild ? '' : icon, padder: d.bild ? icon : '',
                    overlay: overlay,
                    zeilen: ['<bdi>' + esc(d.titel) + '</bdi>', d.kuenstler ? '<bdi>' + esc(d.kuenstler) + '</bdi>' : '']
                });
            }

            // Fläche einer Genre-Karte: Raster, einzelnes Cover, Band (Miniaturansicht) oder Ersatz mit Namen
            function genreBild(g, form) {
                var e = genreDaten[g.id];
                var cover = (e && e.cover) || [];
                var urls = function (n, px) { return cover.slice(0, n).map(function (c) { return bildUrl(c, px); }).filter(Boolean); };
                if (form === 'backdrop') {
                    var reihe = urls(3, 280);
                    if (reihe.length) {
                        return {
                            klasse: 'cardImageContainer werkstattGenreBild werkstattGenreBild-band',
                            inhalt: '<div class="werkstattGenreBild-grund"' + bildAttr(reihe[0]) + '></div><div class="werkstattGenreBild-reihe">' +
                                reihe.map(function (u) { return '<div class="werkstattGenreBild-teil"' + bildAttr(u) + '></div>'; }).join('') + '</div>'
                        };
                    }
                } else if (cover.length >= 4) {
                    var vier = urls(4, 200);
                    if (vier.length === 4) {
                        return {
                            klasse: 'cardImageContainer werkstattGenreBild werkstattGenreBild-raster',
                            inhalt: vier.map(function (u) { return '<div class="werkstattGenreBild-teil"' + bildAttr(u) + '></div>'; }).join('')
                        };
                    }
                } else if (cover.length) {
                    var eins = urls(1, 400);
                    if (eins.length) return { klasse: 'cardImageContainer coveredImage', url: eins[0], inhalt: '' };
                }
                // Lädt noch: leere Fläche (sonst stünde kurz der Name da); sonst wie Jellyfin ohne Bild der Name
                var laedt = !!(api() && g.id && (!e || e.laedt));
                return {
                    klasse: 'cardImageContainer ' + ersatzKlasse(g.name) + (laedt ? ' werkstattGenreBild-laedt' : ''),
                    inhalt: laedt ? '' : '<div class="cardText cardDefaultText">' + esc(g.name) + '</div>'
                };
            }

            function genreKarteHtml(g, i, v) {
                var l = layout(), form = v.indexOf('Thumb') === 0 ? 'backdrop' : 'square', karte = /Card$/.test(v);
                var b = genreBild(g, form);
                var overlay = l === 'desktop' ? g.overlay : (l === 'mobile' && !karte ? g.mobil : '');
                var zeilen = [g.titelHtml];
                if (karte) {
                    var z = zahlenText(g);
                    zeilen.push(z ? '<bdi>' + esc(z) + '</bdi>' : '');
                }
                return karteHtml({
                    form: form, karte: karte, zentriert: !karte, musik: false, attr: g.attr, index: i, art: 'genre',
                    href: g.href, aktion: 'link', label: g.name,
                    bildKlasse: b.klasse, bildUrl: b.url || '', bildInhalt: b.inhalt, padder: '',
                    overlay: overlay, zeilen: zeilen
                });
            }

            function genreZeileHtml(g, i) {
                var e = genreDaten[g.id], c = e && e.cover && e.cover[0];
                var url = c ? bildUrl(c, 80) : '';
                var bild = url ?
                    '<div data-action="link" class="listItemImage itemAction"' + bildAttr(url) + ' item-icon></div>' :
                    '<div class="listItemImage cardImageContainer ' + ersatzKlasse(g.name) + '"><span class="cardImageIcon material-icons queue_music" aria-hidden="true"></span></div>';
                var z = zahlenText(g);
                return '<div class="listItem listItem-border" data-action="link"' + g.attr + ' ' + MEIN + '="genre">' + bild +
                    '<div class="listItemBody itemAction"><div class="listItemBodyText"><bdi>' + esc(g.name) + '</bdi></div>' +
                    (z ? '<div class="secondary listItemBodyText"><bdi>' + esc(z) + '</bdi></div>' : '') + '</div>' +
                    '<div class="listViewUserDataButtons">' + knopfHtml('listItemButton itemAction', 'menu', 'more_vert', 'Mehr') + '</div></div>';
            }

            // ---------- Bilder erst beim Näherkommen laden (wie components/lazyLoader)

            function bildSetzen(el) {
                var u = el.getAttribute(BILD);
                el.removeAttribute(BILD);
                if (!u) return;
                el.style.backgroundImage = "url('" + u.replace(/'/g, '%27') + "')";
                el.classList.add('lazy-image-fadein-fast');
            }

            function bilderLaden(c) {
                var els = [];
                c.querySelectorAll('[' + BILD + ']').forEach(function (el) { els.push(el); });
                if (!els.length) return;
                if (typeof window.IntersectionObserver !== 'function') { els.forEach(bildSetzen); return; }
                if (!io) {
                    io = new window.IntersectionObserver(function (eintraege) {
                        eintraege.forEach(function (e) {
                            if (!e.isIntersecting) return;
                            io.unobserve(e.target);
                            bildSetzen(e.target);
                        });
                    }, { rootMargin: '50%', threshold: 0 });
                }
                els.forEach(function (el) { io.observe(el); });
            }

            // ---------- Behälter umstellen

            function entfernen(knoten) {
                knoten.forEach(function (n) {
                    if (io) {
                        if (n.hasAttribute(BILD)) io.unobserve(n);
                        n.querySelectorAll('[' + BILD + ']').forEach(function (x) { io.unobserve(x); });
                    }
                    if (n.parentNode) n.parentNode.removeChild(n);
                });
            }

            // Jellyfins Einträge (Zeilen, Karten) und eigene; anderes (fremde Überschriften o. ä.) bleibt stehen
            function teile(c) {
                var fremd = [], mein = [];
                for (var k = c.firstElementChild; k; k = k.nextElementSibling) {
                    if (k.hasAttribute(MEIN)) mein.push(k);
                    else if (k.hasAttribute('data-id') || k.classList.contains('card') || k.classList.contains('listItem')) fremd.push(k);
                }
                return { fremd: fremd, mein: mein };
            }

            function klassen(c, v, nativ) {
                if (!c.__werkstattKlassen) {
                    c.__werkstattKlassen = { list: c.classList.contains('vertical-list'), wrap: c.classList.contains('vertical-wrap') };
                }
                var k = c.__werkstattKlassen;
                if (nativ) {
                    c.classList.toggle('vertical-list', k.list);
                    c.classList.toggle('vertical-wrap', k.wrap);
                    c.removeAttribute(ART_ATTR);
                    return;
                }
                // wie musicalbums.js onViewStyleChange: Liste untereinander, sonst Raster
                c.classList.toggle('vertical-list', v === 'List');
                c.classList.toggle('vertical-wrap', v !== 'List');
                c.setAttribute(ART_ATTR, v);
            }

            function zeichnen(seite, art, c, v) {
                var daten = c.__werkstattVorrat.daten;
                var html = daten.map(function (d, i) {
                    if (art.name === 'lieder') return liedHtml(d, i, v);
                    return v === 'List' ? genreZeileHtml(d, i) : genreKarteHtml(d, i, v);
                }).join('');
                klassen(c, v, false);
                c.insertAdjacentHTML('beforeend', html);
                c.__werkstattGezeigt = v;
                c.__werkstattVeraltet = false;
                bilderLaden(c);
                if (art.name === 'genres') genresHolen(seite, daten);
            }

            function zurueckZuJellyfin(c, v) {
                var vorrat = c.__werkstattVorrat;
                c.__werkstattVorrat = null;
                if (vorrat) vorrat.knoten.forEach(function (n) { c.appendChild(n); });
                klassen(c, v, true);
                c.__werkstattGezeigt = v;
            }

            function ordnen(seite, tab, art, c) {
                var v = ansicht(seite, art);
                var t = teile(c);
                if (t.fremd.length) {
                    // Jellyfin hat (neu) gezeichnet
                    entfernen(t.mein);
                    if (art.nativ && v === art.nativ) {
                        c.__werkstattVorrat = null;
                        if (c.__werkstattKlassen) klassen(c, v, true);
                        c.__werkstattGezeigt = v;
                        return;
                    }
                    var daten = t.fremd.map(art.name === 'lieder' ? liedAusZeile : genreAusKarte).filter(Boolean);
                    t.fremd.forEach(function (n) { c.removeChild(n); });
                    c.__werkstattVorrat = { knoten: t.fremd, daten: daten };
                    zeichnen(seite, art, c, v);
                    return;
                }
                if (!t.mein.length || !c.__werkstattVorrat) {
                    // Leer gezeichnet (etwa ein Filter ohne Treffer) oder nichts von uns
                    entfernen(t.mein);
                    c.__werkstattVorrat = null;
                    c.__werkstattGezeigt = null;
                    return;
                }
                if (c.__werkstattGezeigt === v && !c.__werkstattVeraltet) return;
                entfernen(t.mein);
                if (art.nativ && v === art.nativ) zurueckZuJellyfin(c, v);
                else zeichnen(seite, art, c, v);
            }

            // Alles zurücknehmen (CSS fehlt, Schalter aus)
            function zurueck() {
                menueZu();
                document.querySelectorAll('[' + ART_ATTR + '], .itemsContainer').forEach(function (c) {
                    if (!c.__werkstattKlassen && !c.__werkstattVorrat) return;
                    entfernen(teile(c).mein);
                    if (c.__werkstattVorrat) c.__werkstattVorrat.knoten.forEach(function (n) { c.appendChild(n); });
                    c.__werkstattVorrat = null;
                    if (c.__werkstattKlassen) klassen(c, null, true);
                    c.__werkstattKlassen = null;
                    c.__werkstattGezeigt = null;
                });
                document.querySelectorAll('[' + MEIN + '="knopf"]').forEach(function (k) {
                    var leiste = k.parentNode;
                    leiste.removeChild(k);
                    if (leiste.getAttribute(MEIN) === 'leiste' && !leiste.firstElementChild && leiste.parentNode) leiste.parentNode.removeChild(leiste);
                });
                document.querySelectorAll('[' + MEIN + '="leiste"]').forEach(function (l) {
                    if (!l.firstElementChild && l.parentNode) l.parentNode.removeChild(l);
                });
            }

            function pruefen() {
                wartet = 0;
                try {
                    fangen();
                    if (!an()) {
                        zurueck();
                    } else {
                        serverKopieHolen();
                        document.querySelectorAll(SEITE).forEach(function (seite) {
                            ARTEN.forEach(function (art) {
                                var tab = seite.querySelector('.pageTabContent[data-index="' + art.index + '"]');
                                if (!tab) return;
                                if (!knopfHerstellen(seite, tab, art)) return;
                                var c = behaelter(tab);
                                if (c) ordnen(seite, tab, art, c);
                            });
                        });
                    }
                } catch (e) {
                    warn('Prüfen', e);
                }
                // Die eigenen Änderungen nicht noch einmal melden lassen (sonst liefe der Observer im Kreis)
                if (mo) mo.takeRecords();
            }

            function planen() {
                if (!wartet) wartet = setTimeout(pruefen, 0);
            }

            // ---------- Ereignisse und Observer

            // Bibliothek der Seite merken (viewshow trägt params.topParentId; Capture läuft vor Jellyfins Zuhörern)
            document.addEventListener('viewshow', function (e) {
                try {
                    var el = e.target;
                    if (el && el.nodeType === 1 && el.id === 'musicRecommendedPage') {
                        var p = e.detail && e.detail.params;
                        if (p && p.topParentId) el.__werkstattTopParentId = String(p.topParentId);
                        planen();
                    }
                } catch (x) { /* nichts */ }
            }, true);

            function istStil(n) {
                return n && (n.nodeName === 'STYLE' || n.nodeName === 'LINK');
            }

            var REITER_SEL = SEITE + ' .pageTabContent[data-index="5"], ' + SEITE + ' .pageTabContent[data-index="6"]';

            function wichtig(r) {
                var t = r.target, i, n;
                if (istStil(t) || t === document.head) return true;
                for (i = 0; i < r.addedNodes.length; i++) {
                    n = r.addedNodes[i];
                    if (istStil(n)) return true;
                    if (n.nodeType === 1 && (n.id === 'musicRecommendedPage' || (n.querySelector && n.querySelector(SEITE)))) return true;
                }
                for (i = 0; i < r.removedNodes.length; i++) if (istStil(r.removedNodes[i])) return true;
                return !!(t.nodeType === 1 && t.closest && t.closest(REITER_SEL));
            }

            G.ansicht = { an: true, pruefen: pruefen, lesen: lesen, ansicht: ansicht };

            var starten = function () {
                try {
                    mo = new MutationObserver(function (records) {
                        try {
                            for (var i = 0; i < records.length; i++) {
                                // Gleich hier (vor dem Zeichnen), damit Jellyfins Liste nicht erst aufblitzt
                                if (wichtig(records[i])) { pruefen(); return; }
                            }
                        } catch (e) { /* nichts */ }
                    });
                    mo.observe(document.documentElement, { childList: true, subtree: true });
                } catch (e) { /* ohne Observer nur der erste Durchlauf */ }
                planen();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten);
            else starten();
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Ansicht', e);
        }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript musik-reiter-ansicht:", e);
    }
})();

// musik-abspielen-zufall: Musik: Abspielen und Zufall auf allen Reitern und Unterseiten
(function () {
    try {
/* Musik: „Abspielen“ und „Zufall“ auf allen Reitern und alle Lieder gemischt auf den Unterseiten
   (ElegantFin-Werkstatt, Schalter „musik-abspielen-zufall“). */
(function werkstattAbspielen() {
        'use strict';
        try {
            var G = window.__werkstatt = window.__werkstatt || {};
            if (G.abspielen) return;

            var MAX_LIEDER = 5000;      // je Klick höchstens so viele Lieder
            var ERSTER_TEIL = 300;      // so viele nimmt playbackManager.play({ ids }) mit (getItemsForPlayback)
            var FERN_MAX = 300;         // an ein ferngesteuertes Gerät (Ids stehen dort in der Adresse)
            var WARTEN_MAX = 60000;     // so lange wartet ein Start über die Nachricht auf den Manager
            var SEITE = 'musicRecommendedPage';
            var KNOPF = 'werkstattAbspielen';
            var LEISTE = 'werkstattAbspielenLeiste';
            var ERSETZT = 'data-werkstatt-abspielen-ersetzt';
            var MUSIK = 'data-werkstatt-musik';
            var LEISTEN_KLASSEN = 'flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x';
            var TITEL = 'Album,ParentIndexNumber,IndexNumber,SortName';   // Jellyfins Reihenfolge innerhalb der Bibliothek

            // Reiter von music.html; vorn: Sortierfelder vor Album/CD/Titel (null: Jellyfins Reihenfolge)
            var REITER = {
                albumsTab: { art: 'alben' },
                albumArtistsTab: { vorn: 'AlbumArtist' },
                artistsTab: { vorn: 'Artist' },
                playlistsTab: { vorn: null },
                songsTab: { art: 'lieder' },
                genresTab: { vorn: null }
            };

            var z = {
                mgr: null,
                haken: null,
                ausstehend: null,   // Start über die Nachricht: { erste, anzahl, rest, zufall, zeit }
                typen: {},          // Detailseite: Id: { Type, MediaType } oder { laeuft: true }
                wartet: 0,
                mo: null
            };
            G.abspielen = { zustand: z };

            function warn(was, e) {
                if (window.console) console.warn('Werkstatt: Abspielen, ' + was, e);
            }

            function an() {
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue('--werkstatt-abspielen').trim() === '1';
                } catch (e) {
                    return false;
                }
            }

            function api() {
                var a = window.ApiClient;
                return a && typeof a.getItems === 'function' && typeof a.getCurrentUserId === 'function' ? a : null;
            }

            function ev() {
                var E = window.Events;
                return E && typeof E.trigger === 'function' && typeof E.on === 'function' && typeof E.off === 'function' ? E : null;
            }

            function adressParameter() {
                var p = {};
                var h = String(window.location.hash || ''), q = h.indexOf('?');
                if (q < 0) return p;
                h.slice(q + 1).split('&').forEach(function (t) {
                    var j = t.indexOf('=');
                    if (j <= 0) return;
                    try { p[decodeURIComponent(t.slice(0, j))] = decodeURIComponent(t.slice(j + 1)); } catch (e) { /* kaputter Teil */ }
                });
                return p;
            }

            // ---------- playbackManager finden (wie tweaks-fortsetzen.js)

            function istManager(o) {
                return !!o && typeof o === 'object' &&
                    typeof o.getCurrentPlayer === 'function' && typeof o.play === 'function' &&
                    typeof o.queue === 'function' && typeof o.getPlaylist === 'function' &&
                    typeof o.setQueueShuffleMode === 'function' && typeof o.shuffle === 'function';
            }

            function manager() {
                if (!z.mgr && G.playbackManager && istManager(G.playbackManager)) gefunden(G.playbackManager);
                return z.mgr;
            }

            function gefunden(m) {
                if (z.mgr || !istManager(m)) return;
                z.mgr = m;
                if (!G.playbackManager) G.playbackManager = m;
                hakenLoesen();
                var E = ev();
                if (E) E.on(m, 'playbackstart', function () {
                    try { nachholen(0); } catch (e) { warn('Start', e); }
                });
                if (z.ausstehend) nachholen(0);
            }

            function haken() {
                var E = ev();
                if (!E || z.haken || z.mgr) return;
                var orig = E.trigger;
                var huelle = function (obj) {
                    if (!z.mgr) {
                        try {
                            if (G.playbackManager) gefunden(G.playbackManager);
                            else if (istManager(obj)) gefunden(obj);
                        } catch (e) { warn('Suche', e); }
                    }
                    return orig.apply(this, arguments);
                };
                E.trigger = huelle;
                z.haken = { E: E, orig: orig, huelle: huelle };
            }

            // Hat inzwischen jemand anders Events.trigger umhüllt, bleibt unsere Hülle als bloßer Durchgang
            function hakenLoesen() {
                var h = z.haken;
                if (h && h.E.trigger === h.huelle) h.E.trigger = h.orig;
                z.haken = null;
            }

            // ---------- Abspielen

            function spieler(m) {
                try { return m.getCurrentPlayer(); } catch (e) { return null; }
            }

            function zufallEin(m, p) {
                try {
                    if (p && p.isLocalPlayer) m.setQueueShuffleMode('Shuffle', p);
                } catch (e) { warn('Zufall einschalten', e); }
            }

            // Fertige Einträge an Jellyfin geben; zufall: danach den Zufall der Warteschlange einschalten
            function starten(items, zufall) {
                if (!items.length) return;
                var m = manager();
                if (m) {
                    var p = spieler(m);
                    var fern = !!(p && !p.isLocalPlayer);
                    Promise.resolve(m.play({ items: fern ? items.slice(0, FERN_MAX) : items, startIndex: 0 })).then(function () {
                        if (zufall && !fern && items.length > 1) zufallEin(m, spieler(m));
                    }).catch(function (e) { warn('Abspielen', e); });
                    return;
                }
                // Manager noch unbekannt: wie ein „Play“ vom Server; den Rest hängt nachholen() an
                var a = api(), E = ev();
                if (!a || !E) return;
                var erste = items.slice(0, ERSTER_TEIL);
                z.ausstehend = {
                    erste: erste[0].Id,
                    anzahl: erste.length,
                    rest: items.slice(ERSTER_TEIL),
                    zufall: zufall,
                    zeit: Date.now()
                };
                haken();
                E.trigger(a, 'message', [{
                    MessageType: 'Play',
                    Data: { PlayCommand: 'PlayNow', ItemIds: erste.map(function (i) { return i.Id; }), StartIndex: 0 }
                }]);
            }

            // Nach einem Start über die Nachricht: Rest anhängen, Zufall einschalten (bis die Warteschlange da ist)
            function nachholen(versuch) {
                var w = z.ausstehend, m = z.mgr;
                if (!w || !m) return;
                if (Date.now() - w.zeit > WARTEN_MAX) { z.ausstehend = null; return; }
                var p = spieler(m);
                Promise.resolve(p ? m.getPlaylist(p) : null).then(function (liste) {
                    if (z.ausstehend !== w) return;
                    liste = liste || [];
                    if (!liste.length || !liste[0] || liste[0].Id !== w.erste) {
                        // Noch die alte Warteschlange (oder eine fremde): später noch einmal
                        if (versuch < 40) window.setTimeout(function () { nachholen(versuch + 1); }, 500);
                        return;
                    }
                    z.ausstehend = null;
                    var fern = !!(p && !p.isLocalPlayer);
                    var rest = fern ? [] : w.rest;
                    return Promise.resolve(rest.length ? m.queue({ items: rest }, p) : null).then(function () {
                        if (w.zufall && !fern && liste.length + rest.length > 1) zufallEin(m, p);
                    });
                }).catch(function (e) { warn('Rest anhängen', e); });
            }

            function abfragen(q, zufall) {
                var a = api();
                if (!a) return;
                var u;
                try { u = a.getCurrentUserId(); } catch (e) { u = null; }
                if (!u) return;
                q.Recursive = true;
                q.Limit = MAX_LIEDER;
                q.ImageTypeLimit = 1;
                q.ExcludeLocationTypes = 'Virtual';
                q.EnableTotalRecordCount = false;
                if (zufall) { q.SortBy = 'Random'; delete q.SortOrder; }
                // Schon jetzt suchen: Läuft gleich etwas über die Nachricht an, ist die Hülle bereit
                if (!manager()) haken();
                Promise.resolve(a.getItems(u, q)).then(function (res) {
                    starten((res && res.Items) || [], zufall);
                }).catch(function (e) { warn('Lieder holen', e); });
            }

            function gespeichert(schluessel) {
                var a = api(), u = '';
                try { u = a ? a.getCurrentUserId() || '' : ''; } catch (e) { u = ''; }
                if (!u) return null;
                try { return JSON.parse(window.localStorage.getItem(u + '-' + schluessel) || 'null'); } catch (e) { return null; }
            }

            function richtung(s) {
                return String(s || '').split(',')[0] === 'Descending' ? 'Descending' : 'Ascending';
            }

            // Sortierfelder vor Album/CD/Titel mit der Richtung des Reiters, die Titel eines Albums immer aufsteigend
            function sortierung(vorn, ordnung) {
                var felder = vorn ? vorn.split(',') : [];
                var alle = felder.concat(TITEL.split(','));
                var r = alle.map(function (f, i) { return i < Math.max(felder.length, 1) ? ordnung : 'Ascending'; });
                return { SortBy: alle.join(','), SortOrder: r.join(',') };
            }

            function reiterAbfrage(tab, bib) {
                var cfg = REITER[tab.id] || {};
                var q = { ParentId: bib, IncludeItemTypes: 'Audio', MediaTypes: 'Audio' };
                var s;
                if (cfg.art === 'lieder') {
                    // songs.js: Standard „Album,SortName“ aufsteigend, dazu die gespeicherten Filter
                    s = gespeichert(bib + '-songs') || {};
                    q.SortBy = s.SortBy || 'Album,SortName';
                    q.SortOrder = s.SortOrder || 'Ascending';
                    var f = gespeichert(bib + '-songs-filter') || {};
                    Object.keys(f).forEach(function (k) {
                        if (f[k] != null && f[k] !== '' && !(k in q)) q[k] = f[k];
                    });
                    return q;
                }
                if (cfg.art === 'alben') {
                    // musicalbums.js: Sortieren nach Name (Standard), Album-Interpret, Jahr oder Zufall übertragen
                    s = gespeichert(bib + '-musicalbums') || {};
                    var by = String(s.SortBy || 'SortName'), ord = richtung(s.SortOrder);
                    var vorn = null;
                    if (by.indexOf('Random') === 0) vorn = 'Random';
                    else if (by.indexOf('AlbumArtist') === 0) vorn = 'AlbumArtist';
                    else if (by.indexOf('ProductionYear') === 0) vorn = 'ProductionYear,PremiereDate';
                    var r = sortierung(vorn, ord);
                    q.SortBy = r.SortBy;
                    q.SortOrder = r.SortOrder;
                    return q;
                }
                var t = sortierung(cfg.vorn, 'Ascending');
                q.SortBy = t.SortBy;
                q.SortOrder = t.SortOrder;
                return q;
            }

            function reiterKlick(knopf, zufall) {
                if (!an()) return;
                if (!api()) {
                    if (window.console) console.info('Werkstatt: Abspielen, kein ApiClient (Werkstatt), es wird nichts gespielt');
                    return;
                }
                var tab = knopf.closest('.pageTabContent');
                var bib = adressParameter().topParentId;
                if (!tab || !bib) { warn('keine Bibliothek in der Adresse', window.location.hash); return; }
                abfragen(reiterAbfrage(tab, bib), zufall);
            }

            // ---------- Knöpfe und Leisten auf den Reitern

            function knopfBauen(zufall) {
                var b = document.createElement('button');
                b.type = 'button';
                if (zufall) {
                    // Wie Jellyfins Zufallsknopf in music.html: nur das Symbol
                    b.setAttribute('is', 'paper-icon-button-light');
                    b.className = 'paper-icon-button-light btnShuffle autoSize ' + KNOPF + ' ' + KNOPF + '-zufall';
                    b.title = 'Zufallswiedergabe';
                    b.setAttribute('aria-label', 'Zufallswiedergabe');
                    var s = document.createElement('span');
                    s.className = 'material-icons shuffle';
                    s.setAttribute('aria-hidden', 'true');
                    b.appendChild(s);
                } else {
                    // Wie der Abspielknopf der Detailseite (itemDetails/index.html), die Schrift als eigenes Element
                    b.setAttribute('is', 'emby-button');
                    b.className = 'button-flat btnPlay detailButton emby-button ' + KNOPF + ' ' + KNOPF + '-alle';
                    b.title = 'Abspielen';
                    var c = document.createElement('div');
                    c.className = 'detailButton-content';
                    var i = document.createElement('span');
                    i.className = 'material-icons detailButton-icon play_arrow';
                    i.setAttribute('aria-hidden', 'true');
                    c.appendChild(i);
                    b.appendChild(c);
                    var t = document.createElement('span');
                    t.className = KNOPF + '-text';
                    t.textContent = 'Abspielen';
                    b.appendChild(t);
                }
                b.addEventListener('click', function (e) {
                    e.preventDefault();
                    try { reiterKlick(b, zufall); } catch (x) { warn('Klick', x); }
                });
                return b;
            }

            // Leiste wie in music.html (div.flex…focuscontainer-x) oder wie auf Ordnerseiten (.itemsViewSettingsContainer)
            function istLeiste(el) {
                if (!el || el.nodeType !== 1 || el.tagName !== 'DIV' || el.querySelector('.itemsContainer')) return false;
                return el.classList.contains('itemsViewSettingsContainer') ||
                    (el.classList.contains('flex') && el.classList.contains('focuscontainer-x'));
            }

            // Obere Leiste des Reiters: eine fremde vor der eigenen; nur vor dem ersten Inhalt (unten steht noch eine)
            function leisten(tab) {
                var fremd = null, eigen = null;
                for (var k = tab.firstElementChild; k; k = k.nextElementSibling) {
                    if (k.classList.contains('itemsContainer') || k.classList.contains('verticalSection')) break;
                    if (!istLeiste(k)) continue;
                    if (k.classList.contains(LEISTE)) { if (!eigen) eigen = k; } else if (!fremd) fremd = k;
                }
                return { fremd: fremd, eigen: eigen };
            }

            function nurEigenes(leiste) {
                for (var k = leiste.firstElementChild; k; k = k.nextElementSibling) {
                    if (!k.classList.contains(KNOPF)) return false;
                }
                return true;
            }

            // Vor den übrigen Knöpfen: vor Jellyfins eigenen (Alben, Lieder), sonst gleich hinter .paging
            function einsetzen(leiste, alle, zufall) {
                var ref = leiste.querySelector(':scope > [' + ERSETZT + ']');
                if (!ref) {
                    for (ref = leiste.firstElementChild; ref; ref = ref.nextElementSibling) {
                        if (!ref.classList.contains('paging') && !ref.classList.contains(KNOPF)) break;
                    }
                }
                leiste.insertBefore(alle, ref);
                leiste.insertBefore(zufall, ref);
            }

            function reiterHerstellen(tab) {
                var l = leisten(tab);
                var leiste = l.fremd || l.eigen;
                if (!leiste) {
                    leiste = document.createElement('div');
                    leiste.className = LEISTEN_KLASSEN + ' ' + LEISTE;
                    tab.insertBefore(leiste, tab.firstChild);
                }
                // Jellyfins eigene Knöpfe dieses Reiters ersetzen (bleiben im DOM, das CSS blendet sie aus)
                Array.prototype.forEach.call(leiste.querySelectorAll(':scope > .btnPlayAll, :scope > .btnShuffle'), function (b) {
                    if (!b.classList.contains(KNOPF) && !b.hasAttribute(ERSETZT)) b.setAttribute(ERSETZT, '');
                });
                var alle = tab.querySelector('.' + KNOPF + '-alle'), zufall = tab.querySelector('.' + KNOPF + '-zufall');
                if (alle && zufall && alle.parentNode === leiste && zufall.parentNode === leiste) {
                    // Schon da; nur eine überflüssig gewordene eigene Leiste wegräumen
                    if (l.fremd && l.eigen && l.eigen !== leiste && nurEigenes(l.eigen)) l.eigen.parentNode.removeChild(l.eigen);
                    return;
                }
                if (alle && alle.parentNode) alle.parentNode.removeChild(alle);
                if (zufall && zufall.parentNode) zufall.parentNode.removeChild(zufall);
                einsetzen(leiste, alle || knopfBauen(false), zufall || knopfBauen(true));
                if (l.fremd && l.eigen && l.eigen !== leiste && nurEigenes(l.eigen)) l.eigen.parentNode.removeChild(l.eigen);
            }

            function reiterZuruecknehmen(tab) {
                Array.prototype.forEach.call(tab.querySelectorAll('.' + KNOPF), function (b) {
                    if (b.parentNode) b.parentNode.removeChild(b);
                });
                Array.prototype.forEach.call(tab.querySelectorAll('[' + ERSETZT + ']'), function (b) {
                    b.removeAttribute(ERSETZT);
                });
                Array.prototype.forEach.call(tab.querySelectorAll('.' + LEISTE), function (x) {
                    if (nurEigenes(x)) { if (x.parentNode) x.parentNode.removeChild(x); } else x.classList.remove(LEISTE);
                });
            }

            // ---------- Detailseite

            function detailId() {
                var h = String(window.location.hash || '');
                if (h.indexOf('details') < 0) return '';
                return adressParameter().id || '';
            }

            function musikTyp(t) {
                return t && (t.Type === 'MusicArtist' || t.Type === 'MusicAlbum' || t.Type === 'MusicGenre' ||
                    (t.Type === 'Playlist' && t.MediaType !== 'Video'));
            }

            // Wiedergabelisten mit Ton markieren (Interpret, Album, Genre erkennt das CSS am Sofortmix-Knopf)
            function detailMarkieren(ein) {
                var id = ein ? detailId() : '';
                Array.prototype.forEach.call(document.querySelectorAll('.itemDetailPage .mainDetailButtons'), function (k) {
                    // Steht eine ältere Detailseite noch versteckt im DOM, stimmt dort die Id nicht; beim Klick zählt die Id
                    var t = id ? z.typen[id] : null;
                    var soll = t && t.Type === 'Playlist' && musikTyp(t) ? id : '';
                    if (soll) { if (k.getAttribute(MUSIK) !== soll) k.setAttribute(MUSIK, soll); } else if (k.hasAttribute(MUSIK)) k.removeAttribute(MUSIK);
                });
                var a = api();
                if (!id || !a || z.typen[id] || !document.querySelector('.itemDetailPage .mainDetailButtons')) return;
                z.typen[id] = { laeuft: true };
                var u;
                try { u = a.getCurrentUserId(); } catch (e) { u = null; }
                Promise.resolve(u && typeof a.getItem === 'function' ? a.getItem(u, id) : null).then(function (it) {
                    z.typen[id] = it ? { Type: it.Type, MediaType: it.MediaType } : { fehlt: true };
                    planen();
                }, function () {
                    z.typen[id] = { fehlt: true };
                });
            }

            function detailAbfrage(t, id) {
                var q = { MediaTypes: 'Audio' };
                if (t.Type === 'MusicArtist') { q.ArtistIds = id; q.IncludeItemTypes = 'Audio'; }
                else if (t.Type === 'MusicGenre') { q.GenreIds = id; q.IncludeItemTypes = 'Audio'; }
                else if (t.Type === 'MusicAlbum') { q.ParentId = id; q.IncludeItemTypes = 'Audio'; }
                else q.ParentId = id;   // Wiedergabeliste: ihre Einträge
                return q;
            }

            function detailZufall(id) {
                var a = api();
                var t = z.typen[id];
                var weiter = function (typ) {
                    if (musikTyp(typ)) { abfragen(detailAbfrage(typ, id), true); return; }
                    // Doch keine Musik: was Jellyfin selbst getan hätte (itemDetails, onShuffleClick)
                    var m = manager();
                    if (m && typ && typ.item) m.shuffle(typ.item);
                };
                if (t && t.Type && !t.item && musikTyp(t)) { weiter(t); return; }
                var u;
                try { u = a.getCurrentUserId(); } catch (e) { u = null; }
                Promise.resolve(a.getItem(u, id)).then(function (it) {
                    if (!it) return;
                    z.typen[id] = { Type: it.Type, MediaType: it.MediaType };
                    weiter({ Type: it.Type, MediaType: it.MediaType, item: it });
                }).catch(function (e) { warn('Element holen', e); });
            }

            // Capture am document: läuft vor Jellyfins Zuhörer am Knopf (bindAll in itemDetails/index.js)
            document.addEventListener('click', function (e) {
                try {
                    var b = e.target && e.target.closest ? e.target.closest('.itemDetailPage .mainDetailButtons > .btnShuffle') : null;
                    if (!b || !an() || !api() || typeof api().getItem !== 'function') return;
                    var k = b.parentNode, id = detailId();
                    if (!id) return;
                    var musik = !!k.querySelector(':scope > .btnInstantMix:not(.hide)') || k.getAttribute(MUSIK) === id;
                    if (!musik) return;
                    // Ohne Manager geht es nur über die Nachricht; die braucht Events
                    if (!manager() && !ev()) return;
                    e.preventDefault();
                    e.stopPropagation();
                    detailZufall(id);
                } catch (x) {
                    warn('Zufall auf der Detailseite', x);
                }
            }, true);

            // ---------- Beobachten

            function pruefen() {
                z.wartet = 0;
                try {
                    var ein = an();
                    var page = document.getElementById(SEITE);
                    if (page) {
                        Object.keys(REITER).forEach(function (id) {
                            var tab = page.querySelector('#' + id);
                            if (!tab || !tab.classList.contains('pageTabContent')) return;
                            if (ein) reiterHerstellen(tab); else reiterZuruecknehmen(tab);
                        });
                    }
                    detailMarkieren(ein);
                } catch (e) {
                    warn('Prüfen', e);
                }
                // Die eigenen Änderungen nicht noch einmal melden lassen (sonst liefe der Observer im Kreis)
                if (z.mo) z.mo.takeRecords();
            }

            function planen() {
                if (!z.wartet) z.wartet = window.setTimeout(pruefen, 30);
            }

            function istStil(n) {
                return n && (n.nodeName === 'STYLE' || n.nodeName === 'LINK');
            }

            // Betrifft eine Änderung die Musikseite, eine Detailseite oder einen Stil?
            function wichtig(r) {
                var t = r.target, i;
                if (istStil(t) || t === document.head) return true;
                for (i = 0; i < r.addedNodes.length; i++) if (istStil(r.addedNodes[i])) return true;
                for (i = 0; i < r.removedNodes.length; i++) if (istStil(r.removedNodes[i])) return true;
                if (!t || t.nodeType !== 1) return false;
                if (t.closest && t.closest('#' + SEITE + ', .itemDetailPage')) return true;
                for (i = 0; i < r.addedNodes.length; i++) {
                    var n = r.addedNodes[i];
                    if (n.nodeType === 1 && (n.id === SEITE || n.classList.contains('itemDetailPage') ||
                        (n.querySelector && n.querySelector('#' + SEITE + ', .itemDetailPage')))) return true;
                }
                return false;
            }

            var starten0 = function () {
                try {
                    z.mo = new MutationObserver(function (records) {
                        try {
                            for (var i = 0; i < records.length; i++) {
                                if (wichtig(records[i])) { planen(); return; }
                            }
                        } catch (e) { /* nichts */ }
                    });
                    z.mo.observe(document.documentElement, { childList: true, subtree: true });
                    // Seitenwechsel: Jellyfin blendet Seiten aus dem Speicher nur per Klasse ein (keine Kinder ändern
                    // sich), meldet aber viewshow; die Adresse ändert sich per pushState (kein hashchange)
                    document.addEventListener('viewshow', planen, true);
                    window.addEventListener('hashchange', planen);
                } catch (e) { /* ohne Observer nur der erste Durchlauf */ }
                planen();
                // Manager suchen, sobald Events da ist (in der Werkstatt nach 30 s aufgeben)
                var versuche = 0;
                var warten = function () {
                    try {
                        if (manager()) return;
                        if (ev()) { haken(); return; }
                        if (++versuche <= 30) window.setTimeout(warten, 1000);
                    } catch (e) { warn('Start', e); }
                };
                warten();
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten0);
            else starten0();
        } catch (e) {
            if (window.console) console.warn('Werkstatt: Abspielen', e);
        }
    })();
    } catch (e) {
        console.warn("ElegantFin-Werkstatt, Skript musik-abspielen-zufall:", e);
    }
})();
