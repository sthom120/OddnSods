const getFirstGrapheme = (value) => {
  const text = String(value || "").trim();

  if (!text) return "L";

  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });

    const first = segmenter.segment(text)[Symbol.iterator]().next().value;
    return first?.segment || Array.from(text)[0] || "L";
  }

  return Array.from(text)[0] || "L";
};

const syncListHeaderIcon = () => {
  const page = document.querySelector(".notebook-list-page");
  if (!page) return;

  const icon = page.querySelector(".notebook-list-icon");
  const title = page.querySelector(".notebook-title-copy h1");
  if (!icon || !title) return;

  const nextIcon = getFirstGrapheme(title.textContent);

  if (icon.textContent !== nextIcon) {
    icon.textContent = nextIcon;
  }
};

const syncListCardIcons = () => {
  const cards = document.querySelectorAll(".polished-list-card");

  cards.forEach((card) => {
    const icon = card.querySelector(".list-card-icon");
    const title = card.querySelector(".list-card-copy h2");

    if (!icon || !title) return;

    const nextIcon = getFirstGrapheme(title.textContent);

    if (icon.textContent !== nextIcon) {
      icon.textContent = nextIcon;
    }
  });
};

export const initialiseListPagePolish = () => {
  const root = document.getElementById("root");
  if (!root || typeof MutationObserver === "undefined") return;

  let frameId = null;

  const scheduleSync = () => {
    if (frameId !== null) return;

    frameId = window.requestAnimationFrame(() => {
      frameId = null;
      syncListHeaderIcon();
      syncListCardIcons();
    });
  };

  const observer = new MutationObserver(scheduleSync);

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  scheduleSync();
};
