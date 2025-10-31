export function scrollToBottom(el: HTMLElement) {
  // scroll after paint to avoid jank
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight;
  });
}