/** Open the global "Log a Dog" upload modal. */
export function openLogModal() {
  const dialog = document.getElementById(
    "create_attestation_modal",
  ) as HTMLDialogElement | null;
  // Use show() instead of showModal() so the dialog stays in normal stacking
  // context (z-index 999). showModal() promotes the dialog to the browser top
  // layer, which renders above thirdweb's Connect modal (z-index 10000).
  dialog?.show();
}

/** Close the global "Log a Dog" upload modal. */
export function closeLogModal() {
  const dialog = document.getElementById(
    "create_attestation_modal",
  ) as HTMLDialogElement | null;
  dialog?.close();
}
