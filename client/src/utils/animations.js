/**
 * SmartLedger AI — Native Lightweight Animation & Transition Utility
 * Zero external dependencies (pure JavaScript, CSS transitions, and Web Animations).
 */

// Helper to resolve elements from a selector or Node/NodeList
const resolveElements = (target) => {
  if (!target) return [];
  if (typeof target === 'string') {
    return Array.from(document.querySelectorAll(target));
  }
  if (target instanceof Element) {
    return [target];
  }
  if (target instanceof NodeList || Array.isArray(target)) {
    return Array.from(target);
  }
  if (target.current instanceof Element) {
    return [target.current];
  }
  return [];
};

// ── 1. Page & Section Entrances ──────────────────────────────────────────────

export const pageEnter = (selector, delay = 0) => {
  setTimeout(() => {
    const els = resolveElements(selector);
    els.forEach(el => {
      el.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }, delay);
};

export const staggerCards = (selector, delayBetween = 60) => {
  const els = resolveElements(selector);
  els.forEach((el, index) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }, index * delayBetween);
  });
};

export const staggerRows = (selector, delayBetween = 30) => {
  const els = resolveElements(selector);
  els.forEach((el, index) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }, index * delayBetween);
  });
};

export const rowStaggerElastic = (selector, delayBetween = 35) => {
  const els = resolveElements(selector);
  els.forEach((el, index) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }, index * delayBetween);
  });
};

export const statCardEnter = (selector) => {
  staggerCards(selector, 80);
};

export const bounceIn = (selector, delay = 0) => {
  setTimeout(() => {
    const els = resolveElements(selector);
    els.forEach(el => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    });
  }, delay);
};

// ── 2. Number Count-Up Animations (Native requestAnimationFrame) ─────────────

export const countUp = (setter, target, duration = 1000) => {
  const end = Number(target) || 0;
  if (end === 0) {
    setter(0);
    return;
  }
  const start = 0;
  const startTime = performance.now();
  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quad: progress * (2 - progress)
    const eased = progress * (2 - progress);
    const current = Math.round(start + (end - start) * eased);
    setter(current);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      setter(end);
    }
  };
  requestAnimationFrame(step);
};

export const countUpFloat = (setter, target, duration = 1000) => {
  const end = Number(target) || 0;
  if (end === 0) {
    setter(0);
    return;
  }
  const start = 0;
  const startTime = performance.now();
  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress * (2 - progress);
    const current = Number((start + (end - start) * eased).toFixed(2));
    setter(current);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      setter(end);
    }
  };
  requestAnimationFrame(step);
};

// ── 3. Ambient Continuous Transitions & Highlighting ─────────────────────────

export const floatLogo = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.transition = 'transform 2s ease-in-out';
  });
};

export const pulseGlow = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.boxShadow = '0 0 20px rgba(96,165,250,0.3)';
  });
};

export const pulseNeonBorder = (selector, color = 'rgba(52,211,153,0.5)') => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.borderColor = color;
    el.style.boxShadow = `0 0 16px ${color}`;
    el.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease';
  });
};

export const badgePulse = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.transition = 'transform 0.3s ease';
  });
};

// ── 4. Interactive Feedback & Click Effects ──────────────────────────────────

export const buttonPress = (el) => {
  const target = el?.currentTarget || el;
  if (!target || !target.style) return;
  target.style.transition = 'transform 0.12s ease';
  target.style.transform = 'scale(0.95)';
  setTimeout(() => {
    target.style.transform = 'none';
  }, 140);
};

export const shake = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.transition = 'transform 0.1s ease';
    el.style.transform = 'translateX(-6px)';
    setTimeout(() => { el.style.transform = 'translateX(6px)'; }, 80);
    setTimeout(() => { el.style.transform = 'translateX(-4px)'; }, 160);
    setTimeout(() => { el.style.transform = 'none'; }, 240);
  });
};

export const highlightRow = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.transition = 'background-color 0.3s ease';
    el.style.backgroundColor = 'rgba(52,211,153,0.25)';
    setTimeout(() => {
      el.style.backgroundColor = '';
    }, 900);
  });
};

export const profitPulse = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
    el.style.boxShadow = '0 0 25px rgba(52,211,153,0.45)';
    el.style.transform = 'scale(1.015)';
    setTimeout(() => {
      el.style.boxShadow = '';
      el.style.transform = 'none';
    }, 600);
  });
};

// ── 5. Interactive 3D Card Tilt on Hover (Pure DOM) ──────────────────────────

export const init3DCardHover = (selector) => {
  const cards = resolveElements(selector);
  cards.forEach(card => {
    if (card._hasHoverAttached) return;
    card._hasHoverAttached = true;
    card.style.transformStyle = 'preserve-3d';
    card.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / rect.height) * 8;
      const rotateY = (x / rect.width) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'none';
    });
  });
};

// ── 6. Modals & Sidebars ─────────────────────────────────────────────────────

export const modalIn = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'scale(0.92)';
    el.style.transition = 'opacity 0.25s ease-out, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    });
  });
};

export const modalOut = (selector, onComplete) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.transition = 'opacity 0.2s ease-in, transform 0.2s ease-in';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.92)';
  });
  if (onComplete) setTimeout(onComplete, 200);
};

export const sidebarEnter = (selector) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
};

export const animateBar = (selector, toPercent) => {
  const els = resolveElements(selector);
  els.forEach(el => {
    el.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    el.style.width = `${toPercent}%`;
  });
};

// Default safe anime fallback (no-op/safe executor so legacy calls never fail)
const anime = (config = {}) => {
  const targets = resolveElements(config.targets);
  targets.forEach(el => {
    if (config.opacity !== undefined) {
      el.style.opacity = Array.isArray(config.opacity) ? config.opacity[1] : config.opacity;
    }
    if (config.scale !== undefined) {
      const scaleVal = Array.isArray(config.scale) ? config.scale[1] : config.scale;
      el.style.transform = `scale(${scaleVal})`;
    }
    if (config.complete) {
      setTimeout(config.complete, config.duration || 100);
    }
  });
};
anime.stagger = () => () => 0;

export default anime;
