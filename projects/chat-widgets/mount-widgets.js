export async function mountAllWidgets(widgets, logger) {
  await Promise.all(widgets.map(widget =>
    widget.mount().catch(error => {
      logger.error(`Failed to mount widget ${widget.id}`, { error: error.message });
    })
  ));
}
