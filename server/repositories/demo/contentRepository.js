/** Content blocks — demo implementation (defaults only, no persistence). */
import { notAvailable } from "./notAvailable";

export async function listContentBlocks() {
  return [];
}

export async function getContentBlock() {
  return null;
}

export const setContentBlock = notAvailable;
export const deleteContentBlock = notAvailable;
