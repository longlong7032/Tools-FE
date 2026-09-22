// Helper DOM dùng chung toàn app.
export const $ = (id) => document.getElementById(id);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
