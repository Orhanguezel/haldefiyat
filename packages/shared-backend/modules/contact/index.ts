// src/modules/contact/index.ts
// External module surface for contact. Keep explicit; no export *.

export { registerContacts } from './router';
export { registerContactsAdmin } from './admin.routes';

export { createContactPublic } from './controller';

export {
  buildContactInsert,
  buildContactListWhere,
  buildContactOrderExpr,
  buildContactPatch,
  resolveContactOrderBy,
  escapeContactHtml,
  getContactRequestLocale,
  getContactRequestMeta,
  logContactRequestError,
} from './helpers';

export {
  listContactsAdmin,
  getContactAdmin,
  updateContactAdmin,
  removeContactAdmin,
} from './admin.controller';

export {
  repoCreateContact,
  repoGetContactById,
  repoListContacts,
  repoUpdateContact,
  repoDeleteContact,
} from './repository';

export {
  ContactCreateSchema,
  ContactUpdateSchema,
  ContactListParamsSchema,
} from './validation';
export type {
  ContactCreateInput,
  ContactUpdateInput,
  ContactListParams,
} from './validation';

export {
  contact_messages,
} from './schema';
export type {
  ContactView,
  ContactInsert,
} from './schema';
