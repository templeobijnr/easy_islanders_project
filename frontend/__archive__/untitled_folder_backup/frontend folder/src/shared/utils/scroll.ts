export function scrollToBottom(el: HTMLElement) {
  try {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  } catch {
    el.scrollTop = el.scrollHeight;
  }
}