/* Hero auf "eine Bildschirmhoehe minus Guckloch".
 *
 * Ziel: Beim Aufrufen der Seite fuellt der Hero genau so viel, dass unten am
 * Bildschirmrand der dunkle Abschnitt anfaengt und dort seine Zeile
 * "WHAT IS INSIDE" noch zu lesen ist - die Ueberschrift darunter ist
 * abgeschnitten. Das ist der Neugier-Haken.
 *
 * Warum ueberhaupt JavaScript: wie weit die Zeile vom oberen Rand des dunklen
 * Abschnitts entfernt ist, haengt davon ab, wie hoch dessen Inhalt gerade ist -
 * die Buehne zentriert ihn senkrecht. Auf einem 4K-Schirm sind das ueber 600px,
 * auf einem Handy 20px. Reines CSS kann diesen Abstand nicht kennen. Ohne
 * JavaScript bleibt es bei der min-height aus landing.css.
 */
(function () {
   var hero = document.querySelector(".landing__hero");
   var header = document.querySelector(".landing__header");
   var stage = document.querySelector(".landing__showcase-stage");
   var eyebrow = document.querySelector(".landing__showcase-eyebrow");
   if (!hero || !header || !stage || !eyebrow) return;

   /* Luft unter der Zeile, damit sie nicht auf der Bildschirmkante klebt. */
   var BREATH = 10;

   function peekHeight() {
      /* Gemessen gegen die Buehne, nicht gegen den Abschnitt: die Buehne klebt
         beim Scrollen oben fest, ihr Innenleben verschiebt sich dabei nicht.
         So liefert die Messung denselben Wert, egal wo die Seite gerade steht. */
      var peek =
         eyebrow.getBoundingClientRect().bottom -
         stage.getBoundingClientRect().top +
         BREATH;
      /* Auf sehr flachen Fenstern ist der Inhalt der Buehne hoeher als die
         Buehne selbst, dann wird der Wert klein oder negativ. Beidseitig
         begrenzen, damit der Hero nie groesser als der Bildschirm wird. */
      var floor = eyebrow.getBoundingClientRect().height + BREATH;
      return Math.min(Math.max(peek, floor), window.innerHeight * 0.45);
   }

   function fit() {
      var cs = getComputedStyle(hero);
      var padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      var target =
         window.innerHeight -
         header.getBoundingClientRect().height -
         peekHeight() -
         padding;
      hero.style.minHeight = Math.max(0, Math.round(target)) + "px";
      hero.classList.add("landing__hero--fill");

      /* Der Hero ist jetzt anders hoch, also stimmen die vom Scroll-Motor
         gemerkten Positionen nicht mehr. */
      var sc = window.ScrollCraft;
      if (sc && sc.instances) {
         sc.instances.forEach(function (i) {
            if (i && i.layout) i.layout();
         });
      }
   }

   var lastWidth = window.innerWidth;
   var queued = false;
   function schedule() {
      /* Auf Handys aendert die ein- und ausfahrende Adressleiste nur die Hoehe.
         Darauf neu zu rechnen laesst die Seite unter dem Daumen springen -
         gleiche Regel wie im Scroll-Motor. */
      var touch = matchMedia("(hover: none)").matches;
      if (touch && window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
         queued = false;
         fit();
      });
   }

   fit();
   addEventListener("resize", schedule, { passive: true });
   /* Die Zeile wird mit der echten Schrift hoeher oder niedriger. */
   if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fit);
   }
})();
