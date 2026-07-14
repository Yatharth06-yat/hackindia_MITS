/* ==========================================================================
   HackIndia 2026 — nav.js
   Mobile menu toggle for the standalone header partial.
   ========================================================================== */
   (function () {
    "use strict";
  
    document.addEventListener("DOMContentLoaded", () => {
      const menuToggle = document.querySelector(".site-header .menu-toggle");
      const mainNav = document.querySelector(".site-header .main-nav");
      if (!menuToggle || !mainNav) return;
  
      menuToggle.addEventListener("click", () => {
        const open = menuToggle.classList.toggle("open");
        mainNav.classList.toggle("open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
      });
  
      mainNav.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          menuToggle.classList.remove("open");
          mainNav.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
        })
      );
    });
  })();