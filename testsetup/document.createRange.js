if (!document.createRange) {
  document.createRange = function() {
    return {
      selectNode(node) {
        // noop
      },

      createContextualFragment(html) {
        const el = document.createElement('div');
        el.innerHTML = html.trim();
        return { childNodes: el.childNodes };
      }
    };
  };
}
