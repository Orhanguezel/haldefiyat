// src/modules/contact/helpers/index.ts
// Local helper barrel for contact module. Keep explicit; no export *.

export {
  buildContactInsert,
  buildContactListWhere,
  buildContactOrderExpr,
  buildContactPatch,
  resolveContactOrderBy,
} from "./repository";

export {
  escapeContactHtml,
  getContactRequestLocale,
  getContactRequestMeta,
  logContactRequestError,
} from "./controller";
