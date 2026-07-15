/* ==========================================================================
   HackIndia 2026 — nav.js
   Mobile menu toggle and active link highlighting.
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".site-header .menu-toggle");
    const mainNav = document.querySelector(".site-header .main-nav");
    if (!mainNav) return;

    // Mobile menu toggle logic
    if (menuToggle) {
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
    }

    // Active link highlighting logic
    const currentPath = decodeURIComponent(window.location.pathname);
    const currentFile = currentPath.substring(currentPath.lastIndexOf("/") + 1).split(/[?#]/)[0];

    const navLinks = mainNav.querySelectorAll("a");
    let matched = false;

    navLinks.forEach((link) => {
      const linkHref = link.getAttribute("href");
      if (!linkHref) return;

      const cleanHref = linkHref.split(/[?#]/)[0];

      if (currentFile === cleanHref) {
        link.classList.add("active");
        matched = true;
      } else {
        link.classList.remove("active");
      }
    });

    // Default to Home if on root path or index.html and no other page matched
    if (!matched && (currentFile === "" || currentFile === "index.html")) {
      navLinks.forEach((link) => {
        const linkHref = link.getAttribute("href");
        if (linkHref && linkHref.split(/[?#]/)[0] === "home.html") {
          link.classList.add("active");
        }
      });
    }
  });
})();