// Security cutover: the former plaintext cloud-sync implementation is intentionally disabled.
// All account, collaboration, migration, and cloud persistence now flow through the
// client-side encrypted vault implementation.
import './secure-cloud-sync.js';
