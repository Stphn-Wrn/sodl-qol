export function t(key, data) {
  if (data) {
    return game.i18n.format(key, data);
  }
  return game.i18n.localize(key);
}

export function renderTemplate(path, data) {
  return foundry.applications.handlebars.renderTemplate(path, data);
}
